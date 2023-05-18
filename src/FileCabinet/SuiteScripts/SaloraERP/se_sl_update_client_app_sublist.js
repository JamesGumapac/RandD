/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/file', 'N/record', 'N/ui/serverWidget', 'N/search', 'N/url', 'N/format'],
	/**
	 * @param{file} file
	 * @param{record} record
	 * @param{N/ui/serverWidget} UI
	 */
	(file, record, UI, search, url, format) => {
		/**
		 * Defines the Suitelet script trigger point.
		 * @param {Object} scriptContext
		 * @param {ServerRequest} scriptContext.request - Incoming request
		 * @param {ServerResponse} scriptContext.response - Suitelet response
		 * @since 2015.2
		 */
		let processedCASO = []
		let processedCASOwithError = []
		const onRequest = (context) => {
			let errorMessage

			const functionName = "onRequest"
			// try {
			if (context.request.method === "GET") {

				const form = UI.createForm({
					title: "Update Client App Sublist Fields"
				})
				form.addField({
					id: "custpage_file",
					label: "CSV File",
					type: UI.FieldType.FILE
				})
				form.addSubmitButton({
					label: "Update Client App Sublist Fields"
				})
				context.response.writePage(form)

			} else {

				const csvFile = context.request.files.custpage_file
				const woOrderToProcess = getWoToProcess(csvFile)
				woOrderToProcess.forEach((woOrderToProcess) => {
					log.debug('woOrderToProcess', woOrderToProcess);
					const internaldId = getInternalId(woOrderToProcess.workOrder)
					//const sequenceNumber = woOrderToProcess.sequence
					const panelLot = woOrderToProcess.panelLot;
					//let CASOList = getClientAppOperationIds(internaldId, sequenceNumber)
					let CASOList = getClientAppOperationIds(internaldId, panelLot)
					CASOList.forEach((CASOInternalId) => {
						log.debug("CASOInternalId", CASOInternalId)
						log.debug("woOrderToProcess", woOrderToProcess)
						updateClientSublistOperation(CASOInternalId, woOrderToProcess)


					})
				})
				let allProcessedCASO = processedCASO.concat(processedCASOwithError)
				log.debug("processedCASO", processedCASO)
				log.debug("processedCASOwithError", processedCASOwithError)
				context.response.writePage(createResultPage(allProcessedCASO))
			}
			// } catch (e) {
			// 	log.error(functionName, errorMessage ? errorMessage : e.message)
			// }
		}

		function getClientScript() {
			const clientScriptFileId = search
				.create({
					type: "file",
					filters: [["name", "is", "se_cs_update_client_app.js"]],
				})
				.run()
				.getRange({start: 0, end: 1});
			return clientScriptFileId[0].id
		}

		/**
		 *
		 * @param obj
		 * @returns {Form}
		 */
		function createResultPage(obj) {
			try {

				let resultForm = UI.createForm({
					title: 'Item Creation Status'
				})

				resultForm.clientScriptFileId = getClientScript()
				resultForm.addButton({
					id: 'custpage_createanotheritem',
					label: 'Upload Another CSV File',
					functionName: 'goBack()'
				});

				const sublist = resultForm.addSublist({
					id: 'custpage_item_sublist',
					type: UI.SublistType.STATICLIST,
					label: 'Status'
				});
				sublist.addField({
					id: "custcol_caso_id",
					type: UI.FieldType.INLINEHTML,
					label: 'Client App Sublist Operation ID'
				})

				sublist.addField({
					id: "custcol_status",
					type: UI.FieldType.TEXT,
					label: 'Status'
				})
				j = 0;
				obj.forEach(function (result) {

					let casoLink = url.resolveRecord({
						recordType: "customrecord_cntm_clientappsublist",
						recordId: result.id,
						isEditMode: false
					});
					let urlLink = `<a href=${casoLink} ><h3>${result.id}</h3></a>`
					sublist.setSublistValue({
						id: 'custcol_caso_id',
						line: j,
						value: urlLink || " "
					})
					sublist.setSublistValue({
						id: 'custcol_status',
						line: j,
						value: result.message
					});

					j++

				});

				return resultForm
			} catch (e) {
				log.error("createSublist", e.message)
			}
		}

		/**
		 * This function update the Client Sublist Operation
		 * @param clientSublistId
		 * @param woOrderToProcessObj
		 * @returns {number|*}
		 */
		let casoId

		function updateClientSublistOperation(clientSublistId, woOrderToProcessObj) {

			try {

				const CASORec = record.load({
					type: "customrecord_cntm_clientappsublist",
					id: clientSublistId,
					isDynamic: true
				})
				woOrderToProcessObj.woPriority &&
				CASORec.setValue({
					fieldId: "custrecord_cntm_priority1",
					value: woOrderToProcessObj.woPriority
				})
				woOrderToProcessObj.woPriority2 &&
				CASORec.setValue({
					fieldId: "custrecord_cntm_priority2",
					value: woOrderToProcessObj.woPriority2
				})
				woOrderToProcessObj.qFactor &&
				CASORec.setValue({
					fieldId: "custrecord_cntm_qfactor",
					value: woOrderToProcessObj.qFactor
				})
				woOrderToProcessObj.qFactor &&
				CASORec.setValue({
					fieldId: "custrecord_cntm_qfactor",
					value: woOrderToProcessObj.qFactor
				})
				if (woOrderToProcessObj.woScheduleDueDate) {
					let newDate = woOrderToProcessObj.woScheduleDueDate.toString();

					const parsedDateStringAsRawDateObject = format.parse({
						value: newDate,
						type: format.Type.DATE
					});
					log.debug("woScheduleDueDate", parsedDateStringAsRawDateObject)
					CASORec.setValue({
						fieldId: "custrecord_cntm_wo_sched_due_date",
						value: parsedDateStringAsRawDateObject
					})
				}
				woOrderToProcessObj.commentsForProd &&
				CASORec.setValue({
					fieldId: "custrecord_cntm_comments_for_prod",
					value: woOrderToProcessObj.commentsForProd
				})
				woOrderToProcessObj.commentsForDash &&
				CASORec.setValue({
					fieldId: "custrecord_cntm_comments_for_dash",
					value: woOrderToProcessObj.commentsForDash
				})
				woOrderToProcessObj.commentsForPlanning &&
				CASORec.setValue({
					fieldId: "custrecord_cntm_comments_for_planning",
					value: woOrderToProcessObj.commentsForPlanning
				})
				woOrderToProcessObj.weekEndHours &&
				CASORec.setValue({
					fieldId: "custrecord_cntm_weekend_hours",
					value: woOrderToProcessObj.weekEndHours
				})
				woOrderToProcessObj.percentComplete &&
				CASORec.setValue({
					fieldId: "custrecord_cntm_percent_complete",
					value: woOrderToProcessObj.percentComplete
				})
				casoId = CASORec.save({ignoreMandatoryFields: true})
				if (casoId) {
					processedCASO.push({
						id: casoId,
						message: "Successfully Updated"
					})
				}
				return casoId

			} catch (e) {
				processedCASOwithError.push({
					id: clientSublistId,
					message: "Successfully update with Error: " + e.message
				})
				log.error("updateClientSublistOperation", e.message)
			}
		}

		function getWoToProcess(fileObj) {
			try {
				const woOrderToProcess = [];
				const iterator = fileObj.lines.iterator();
				iterator.each(function (line) {
					const initialLineValue = splitQuotes(line.value);
					const lineValues = initialLineValue;
					//const initialLineValue = line.value.replace(/"/g, "");
					//const lineValues = initialLineValue.split(",");
					const workOrder = lineValues[0];
					//const sequence = lineValues[1];
					const panelLot = lineValues[1];
					const woPriority = lineValues[2];
					const woPriority2 = lineValues[3];
					const qFactor = lineValues[4];
					const woScheduleDueDate = lineValues[5];
					const commentsForProd = lineValues[6];
					const commentsForDash = lineValues[7];
					const commentsForPlanning = lineValues[8];
					const weekEndHours = lineValues[9];
					const percentComplete = lineValues[10];
					woOrderToProcess.push({
						workOrder: workOrder,
						//sequence: sequence,
						panelLot: panelLot,
						woPriority: woPriority,
						woPriority2: woPriority2,
						qFactor: qFactor,
						woScheduleDueDate: woScheduleDueDate,
						commentsForProd: commentsForProd,
						commentsForDash: commentsForDash,
						commentsForPlanning: commentsForPlanning,
						weekEndHours: weekEndHours,
						percentComplete: percentComplete
					});
					return true;
				});

				woOrderToProcess.shift();
				log.debug("woOrderToPRocess", woOrderToProcess)
				//return object and remove the first element of the array
				return woOrderToProcess;
			} catch (e) {
				log.error("getEssendantItemPricingObj", e.message);
			}
		}

		function createResponseForm(errorMessage) {
			try {

				const responseForm = UI.createForm({
					title: "Results",
				})
				if (errorMessage) {
					responseForm.addField({
						id: "custpage_error_field",
						type: UI.FieldType.TEXT,
						label: "ERROR MESSAGE"
					}).updateDisplayType({
						displayType: UI.FieldDisplayType.INLINE
					}).defaultValue = `<html><h3><p  style="color:red;">${errorMessage}</p></h3> </html>`
				}

				return responseForm
			} catch (e) {
				log.error("createResponseForm", e.message)
			}
		}

		function getInternalId(woDocumentNumber) {
			let internalId
			const workorderSearchObj = search.create({
				type: "workorder",
				filters:
					[
						["type", "anyof", "WorkOrd"],
						"AND",
						["numbertext", "is", woDocumentNumber],
						"AND",
						["mainline", "is", "T"]
					],

			});
			if (searchResultCount = workorderSearchObj.runPaged().count < 0) return

			workorderSearchObj.run().each(function (result) {
				internalId = result.id
				return true;
			});
			log.debug("internalId", internalId);
			return internalId
		}

		function getClientAppOperationIds(workOrderId, panelLot) {
			let clientAppOperationIds = [];
			let arrPanelLot = [];
			if (panelLot != null && panelLot != '') {
				var filters = [
					["custrecord_cntm_work_order", "anyof", workOrderId],
					"AND",
					["custrecord_cntm_cso_status", "is", "1"],
					"AND",
				];

				arrPanelLot = panelLot.split(",");
				log.debug('arrPanelLot', arrPanelLot);

				if (arrPanelLot.length == 1) {
					filters.push(["custrecord_cntm_cso_pannellot", "is", arrPanelLot]);
				}
				else {
					let sub_filters = [];
					for (let i=0; i<arrPanelLot.length; i++) {
						sub_filters.push(["custrecord_cntm_cso_pannellot", "is", arrPanelLot[i].trim()]);
						if (i + 1 < arrPanelLot.length) {
							sub_filters.push("OR");
						}
					}
					filters.push(sub_filters);
				}

				var customrecord_cntm_clientappsublistSearchObj = search.create({
					type: "customrecord_cntm_clientappsublist",
					filters: filters
				});
				if (customrecord_cntm_clientappsublistSearchObj.runPaged().count < 0) return
				customrecord_cntm_clientappsublistSearchObj.run().each(function (result) {
					clientAppOperationIds.push(result.id)
					return true;
				});
				log.debug("getClientAppOperationIds", clientAppOperationIds)
			}
			return clientAppOperationIds
		}

		function splitQuotes(line) {
	        if (line.indexOf('"') < 0)
	            return line.split(',')

	        var result = [], cell = '', quote = false;
	        for (var i = 0; i < line.length; i++) {
	            char = line[i]
	            if (char == '"' && line[i + 1] == '"') {
	                cell += char
	                i++
	            } else if (char == '"') {
	                quote = !quote;
	            } else if (!quote && char == ',') {
	                result.push(cell)
	                cell = ''
	            } else {
	                cell += char
	            }
	            if (i == line.length - 1 && cell) {
	                result.push(cell)
	            }
	        }
	        return result;
	    }

		return {

			onRequest
		}

	});
