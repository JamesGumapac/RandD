/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @NAuthor Jerome Morden
 */
define(['N/file', 'N/search', 'N/record', 'N/redirect', 'N/runtime', 'N/ui/serverWidget', 'N/url', '../lib/moment.min'],

	(file, search, record, redirect, runtime, ui, url, moment) => {

		/**
		 * Definition of the Suitelet script trigger point.
		 *
		 * @param {Object} context
		 * @param {ServerRequest} context.request - Encapsulation of the incoming request
		 * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
		 * @Since 2015.2
		 */
		const onRequest = context => {
			var { request } = context;
			var params = request.parameters;

			if (!params.custpage_page || params.custpage_page == 1 || params.custpage_page == 'csv') {
				firstPage(context);
			} else {
				secondPage(context);
			}
		}

		const firstPage = context => {
			log.debug('1st page')
			var script = runtime.getCurrentScript();
			var searchId = script.getParameter('custscript_gwos_asm_savedsearch_v2');
			var woSearchId = script.getParameter('custscript_gwos_asm_woid_savedsearch_v2');
			var editedFields = script.getParameter('custscript_gwos_asm_editedfields_v2');
			log.debug('editedFields', editedFields);

			var { request } = context;
			var params = request.parameters;
			log.debug('params', params)

			var form = ui.createForm({
				title: 'General WO Schedule - ASM V2'
			});

			var filterGroup = form.addFieldGroup({
				id: 'custpage_filtergroup',
				label: 'FILTERS'
			});
			var fields = {};
			var fieldsToCreate = [
				//['fieldId', 'label', 'fieldType', 'source', 'container']
				['name', 'Company Name', ui.FieldType.SELECT, null, 'custpage_filtergroup'],
				//             ['internalid', 'Work Order', ui.FieldType.SELECT, 'workorder', 'custpage_filtergroup'],
				['workorder', 'Work Order', ui.FieldType.TEXT, null, 'custpage_filtergroup'],
				['salesorder', 'Sales Order', ui.FieldType.TEXT, null, 'custpage_filtergroup'],
				['datefrom', 'WO Scheduled Due Date', ui.FieldType.DATE, null, 'custpage_filtergroup'],
				['dateto', ' ', ui.FieldType.DATE, null, 'custpage_filtergroup'],
				['department', 'Division', ui.FieldType.SELECT, 'department', 'custpage_filtergroup'],
				//             ['manufacturingworkcenter', 'Manufacturing Work Center', ui.FieldType.SELECT, null, 'custpage_filtergroup'],
				['toolnumber', 'Tool Number', ui.FieldType.LONGTEXT, null, 'custpage_filtergroup'],
				['operation', 'Operation', ui.FieldType.SELECT, null, 'custpage_filtergroup'],
				['page', 'Page', ui.FieldType.TEXT, null],
				['updated', 'Updated', ui.FieldType.LONGTEXT, null],
				['duplicated', 'Duplicated', ui.FieldType.LONGTEXT, null],
				['autosort', 'Auto Sort', ui.FieldType.CHECKBOX, null, 'custpage_filtergroup']
			];
			fieldsToCreate.forEach((fld) => {
				fields[fld[0]] = form.addField({
					id: `custpage_${fld[0]}`,
					label: fld[1],
					type: fld[2],
					source: fld[3],
					container: fld[4]
				});
			});

			(['updated', 'page', 'duplicated', 'autosort', 'department']).forEach((key) => {
				fields[key].updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN
				});
			});

			fields.datefrom.updateLayoutType({
				layoutType: ui.FieldLayoutType.STARTROW
			});
			fields.dateto.updateLayoutType({
				layoutType: ui.FieldLayoutType.ENDROW
			});

			// Add Company Name options
			fields['name'].addSelectOption({ value: '', text: '' });
			getAllSSResult(search.create({
				type: 'customer',
				filters: [['stage', 'anyof', 'CUSTOMER'], 'AND',
				['isinactive', 'is', 'F']],
				columns: [{ name: 'entityid' }]
			}).run()).forEach(res => {
				fields['name'].addSelectOption({
					value: res.id,
					text: res.getValue(res.columns[0])
				});
			});

			for (var x in fields) {
				fields[x].defaultValue = params[`custpage_${x}`]
			}

			// Add Operation Options
			fields['operation'].addSelectOption({ text: '', value: '' });
			getAllSSResult(search.create({
				type: 'manufacturingoperationtask',
				columns: [{ name: 'name', summary: search.Summary.GROUP }]
			}).run()).forEach(res => {
				var value = res.getValue(res.columns[0]);
				if (value == '- None -') { return }
				/* fix for operation text in filter start */
				var valueText = value;
				valueText = valueText.substr(value.indexOf("-") + 1);
				//  valueText = valueText.split("-").pop();
				/* fix for operation text in filter end */

				fields['operation'].addSelectOption({ text: valueText, value });
			});
			fields['operation'].defaultValue = params.custpage_operation;

			// Sticky department
			var userId = runtime.getCurrentUser().id;
			var date = new Date();
			var case1 = new Date();
			var case2 = new Date();
			var case3 = new Date();
			case1.setHours(14);
			case2.setHours(23);
			case3.setHours(6);
			case1.setMinutes(59);
			case2.setMinutes(59);
			case3.setMinutes(59);
			if (date >= case1 && date < case2) { } else if (date >= case3 && date < case1) { } else if (date >= case2 || date < case3) { }


			//			if(params.custpage_page || request.method == 'POST'){
			var woIds = [];
			var duplicateIds = [];
			var csvText = '';
			var toolNumbers = '';
			var woPriority1_2FormulaLabel = "WOPrio1 + WOPrio2"
			var searchResults = ((ssId, par) => {
				var ss = search.load({
					id: ssId
				});
				([
					'custrecordcntm_client_asm_wo_ref.name', /*'workorder.internalid', */  /* 'custrecordcntm_client_asm_wo_ref.department' */ //, 'manufacturingworkcenter'
				]).forEach((name) => {
					var key = name.split(/\./gi);
					var join = key.length > 1 ? key[0] : null;
					name = key[key.length - 1];
					key = 'custpage_' + key[key.length - 1];

					//  log.debug('par_key', key);

					if (par[key]) {
						log.debug('par[key]', par[key]);
						ss.filters.push(search.createFilter({
							name,
							join,
							operator: search.Operator.ANYOF,
							values: par[key]
						}));
					}
				});

				// added by jeromemorden | 01/20/22
				if (par.custpage_operation) {
					ss.filters.push(search.createFilter({
						name: 'custrecord_cntm_client_asm_nextop',
						operator: search.Operator.IS,
						values: par.custpage_operation
					}));
				}
				if (par.custpage_workorder) {
					var woTranId = par.custpage_workorder;
					if (!woTranId.match(/wo/gi))
						woTranId = `WO${woTranId}`;

					ss.filters.push(search.createFilter({
						name: 'tranid',
						join: 'custrecordcntm_client_asm_wo_ref',
						operator: search.Operator.IS,
						values: woTranId
					}));
				}
				if (par.custpage_salesorder) {
					var soTranId = par.custpage_salesorder;
					if (!soTranId.match(/so/gi))
						soTranId = `SO${soTranId}`;

					var soIds = [];
					search.create({
						type: 'salesorder',
						filters: [['tranid', 'is', soTranId]],
						columns: [{ 'name': 'internalid' }]
					}).run().getRange(0, 1000).forEach(res => {
						soIds.push(res.getValue(res.columns[0]));
					});
					if (soIds.length)
						ss.filters.push(search.createFilter({
							name: 'custbody_cnt_created_fm_so',
							join: 'custrecordcntm_client_asm_wo_ref',
							operator: search.Operator.ANYOF,
							values: soIds
						}));
					else
						ss.filters.push(search.createFilter({
							name: 'custbody_cnt_created_fm_so',
							join: 'custrecordcntm_client_asm_wo_ref',
							operator: search.Operator.ANYOF,
							values: ['1']
						}));
				}
				//-->

				if (par.custpage_datefrom && par.custpage_dateto) {
					ss.filters.push(search.createFilter({
						name: 'custbody_rda_wo_sched_due_date',
						join: 'custrecordcntm_client_asm_wo_ref',
						operator: search.Operator.WITHIN,
						values: [par.custpage_datefrom, par.custpage_dateto]
					}));
				} else if (par.custpage_datefrom) {
					ss.filters.push(search.createFilter({
						name: 'custbody_rda_wo_sched_due_date',
						join: 'custrecordcntm_client_asm_wo_ref',
						operator: search.Operator.ONORAFTER,
						values: par.custpage_datefrom
					}));
				} else if (par.custpage_dateto) {
					ss.filters.push(search.createFilter({
						name: 'custbody_rda_wo_sched_due_date',
						join: 'custrecordcntm_client_asm_wo_ref',
						operator: search.Operator.ONORBEFORE,
						values: par.custpage_dateto
					}));
				}

				if (par.custpage_toolnumber) {
					log.debug('in IF par.custpage_toolnumber', par.custpage_toolnumber)

					toolNumbers = par.custpage_toolnumber.split(/[^0-9a-zA-Z_\-]/gm).filter(a => a);

					var formula = '';
					toolNumbers.forEach(name => {
						formula += `WHEN '${name}' THEN 1 `;
					});
					if (formula) {
						var toolNumberIds = getAllSSResult(search.create({
							type: 'customrecord_cntm_job_id',
							filters: [[`formulanumeric: CASE {name} ${formula}ELSE 0 END`, `equalto`, `1`]],
						}).run()).map(res => {
							return res.id;
						});
						log.debug('toolNumberIds', toolNumberIds)

						if (toolNumberIds.length) {
							ss.filters.push(search.createFilter({
								name: 'custbody_cntm_tool_number',
								join: 'custrecordcntm_client_asm_wo_ref',
								operator: search.Operator.ANYOF,
								values: toolNumberIds
							}));
						}
					}

					// Added by lcc 10/04/2022
					for (col of ss.columns)
						if (col.label == woPriority1_2FormulaLabel)
							col.sort = "NONE"

				}


				log.debug('ss.filters', ss.filters);
				log.debug('ss.filterExpression', ss.filterExpression);

				// Get result limit
				var script = runtime.getCurrentScript();
				var limit = par.custpage_page == 'csv' ? '' : parseFloat(script.getParameter('custscript_gwos_asm_linelimi_v2'));
				log.debug('ss runPaged count:', ss.runPaged().count)
				return getAllSSResult(ss.run(), limit);
			})(searchId, params);


			//Work Order Ids without v2 records

			// Gather all Work Order Ids
			var workOrderIds = [];
			var workderIdsV1 = [];
			searchResults.forEach(res => {
				var workOrderId = res.getValue({ name: 'internalid', join: 'CUSTRECORDCNTM_CLIENT_ASM_WO_REF' });
				if (workOrderIds.indexOf(workOrderId) < 0)
					workOrderIds.push(workOrderId);
			});

			log.debug('workOrderIds with V2', JSON.stringify(workOrderIds))

			//Gather all Work Order Ids with associated V1 records
			var customrecord_cntm_client_app_asm_operSearchObj = search.create({
				type: "customrecord_cntm_client_app_asm_oper",
				filters:
					[
						["isinactive", "is", "F"],
						"AND",
						["custrecord_cntm_asm_wo_ref", "noneof", "@NONE@"]
					],
				columns:
					[
						search.createColumn({
							name: "internalid",
							join: "CUSTRECORD_CNTM_ASM_WO_REF",
							summary: "GROUP",
							sort: search.Sort.ASC
						})
					]
			});
			customrecord_cntm_client_app_asm_operSearchObj.run().each(function (res) {
				var workOrderId = res.getValue({ name: 'internalid', join: 'CUSTRECORD_CNTM_ASM_WO_REF', summary: "GROUP" });
				//if (workOrderIds.indexOf(workOrderId) < 0)
					workderIdsV1.push(workOrderId);
				return true;
			});

			log.debug('workOrderIds with V1 & V2', JSON.stringify(workOrderIds))

			var searchResultsWOId = ((ssId, par) => {
				// var ss = search.load({
				// 	id: ssId
				// });
				var ss = search.create({
					type: "manufacturingoperationtask",
					filters:
					[
					   ["workorder.status","anyof","WorkOrd:B"], 
					   "AND", 
					   ["sequence","equalto","10"], 
					   "AND", 
					   ["workorder.custbody_cntm_custom_rec_ref_hide","is","T"],
						"AND",
						["workorder","noneof", workderIdsV1]
					],
					columns:
					[
						search.createColumn({
							name: "custbody_rda_wo_priorty",
							join: "workOrder",
							label: "WO Priorty"
						}),
						search.createColumn({name: "workorder", label: "WO #"}),
						search.createColumn({
							name: "custbody_cnt_created_fm_so",
							join: "workOrder",
							label: "SO #"
						}),
						search.createColumn({
							name: "mainname",
							join: "workOrder",
							label: "Customer"
						}),
						search.createColumn({
							name: "custbody_cntm_tool_number",
							join: "workOrder",
							label: "Tool Number"
						}),
						search.createColumn({
							name: "formulanumeric",
							formula: "1",
							label: "QTY/OP"
						}),
						search.createColumn({
							name: "custbody_wo_ship_date",
							join: "workOrder",
							label: "Ship Date"
						}),
						search.createColumn({name: "name", label: "Operation"}),
						search.createColumn({
							name: "formulatext",
							formula: "' '",
							label: "Serial ID"
						}),
						search.createColumn({
							name: "internalid",
							join: "workOrder",
							label: "WO Internal ID"
						})
					]
				 });

				([
					'workorder.name', /*'workorder.internalid', */  /* 'custrecordcntm_client_asm_wo_ref.department' */ //, 'manufacturingworkcenter'
				]).forEach((name) => {
					var key = name.split(/\./gi);
					var join = key.length > 1 ? key[0] : null;
					name = key[key.length - 1];
					key = 'custpage_' + key[key.length - 1];

					//  log.debug('par_key', key);

					if (par[key]) {
						log.debug('par[key]', par[key]);
						ss.filters.push(search.createFilter({
							name,
							join,
							operator: search.Operator.ANYOF,
							values: par[key]
						}));
					}
				});

				if (par.custpage_operation) {
					var opSeqNum = par.custpage_operation.split(' ')[0];
					var opname = par.custpage_operation.replace(opSeqNum + ' ', '');
					opname = opname.substr(opname.indexOf("-") + 1);
					ss.filters.push(search.createFilter({
						name: 'name',
						operator: search.Operator.IS,
						values: opname
					}));
				}
				if (par.custpage_workorder) {
					var woTranId = par.custpage_workorder;
					if (!woTranId.match(/wo/gi))
						woTranId = `WO${woTranId}`;

					ss.filters.push(search.createFilter({
						name: 'tranid',
						join: 'workorder',
						operator: search.Operator.IS,
						values: woTranId
					}));
				}

				if (par.custpage_datefrom && par.custpage_dateto) {
					ss.filters.push(search.createFilter({
						name: 'custbody_rda_wo_sched_due_date',
						join: 'workorder',
						operator: search.Operator.WITHIN,
						values: [par.custpage_datefrom, par.custpage_dateto]
					}));
				} else if (par.custpage_datefrom) {
					ss.filters.push(search.createFilter({
						name: 'custbody_rda_wo_sched_due_date',
						join: 'workorder',
						operator: search.Operator.ONORAFTER,
						values: par.custpage_datefrom
					}));
				} else if (par.custpage_dateto) {
					ss.filters.push(search.createFilter({
						name: 'custbody_rda_wo_sched_due_date',
						join: 'workorder',
						operator: search.Operator.ONORBEFORE,
						values: par.custpage_dateto
					}));
				}

				if (par.custpage_toolnumber) {
					log.debug('in IF par.custpage_toolnumber', par.custpage_toolnumber)

					toolNumbers = par.custpage_toolnumber.split(/[^0-9a-zA-Z_\-]/gm).filter(a => a);

					var formula = '';
					toolNumbers.forEach(name => {
						formula += `WHEN '${name}' THEN 1 `;
					});
					if (formula) {
						var toolNumberIds = getAllSSResult(search.create({
							type: 'customrecord_cntm_job_id',
							filters: [[`formulanumeric: CASE {name} ${formula}ELSE 0 END`, `equalto`, `1`]],
						}).run()).map(res => {
							return res.id;
						});
						log.debug('toolNumberIds', toolNumberIds)

						if (toolNumberIds.length) {
							ss.filters.push(search.createFilter({
								name: 'custbody_cntm_tool_number',
								join: 'workorder',
								operator: search.Operator.ANYOF,
								values: toolNumberIds
							}));
						}
					}
				}


				if (!!workOrderIds && workOrderIds.length) {
					ss.filters.push(search.createFilter({
						name: 'internalid',
						join: 'workorder',
						operator: search.Operator.NONEOF,
						values: workOrderIds
					}));
				}

				log.emergency('ss.filters', ss.filters);
				log.emergency('ss.filterExpression', ss.filterExpression);

				// Get result limit
				var script = runtime.getCurrentScript();
				var limit = par.custpage_page == 'csv' ? '' : parseFloat(script.getParameter('custscript_gwos_asm_linelimi_v2'));
				log.debug('ss runPaged count:', ss.runPaged().count)
				return getAllSSResult(ss.run(), limit);
			})(woSearchId, params);

			var sublistFields = {};

			var sublist = form.addSublist({
				id: 'custpage_sublist',
				label: `Results`,
				type: ui.SublistType.LIST
			});

			var mtoIdMap = {
				workorder: "custrecordcntm_client_asm_wo_ref",
				name: "custrecord_cntm_client_asm_nextop",
				formulatext: "custrecord_cntm_client_asm_serial_no"
			}

			if (searchResults.length || searchResultsWOId.length) {
				log.debug("searchResults.length", searchResults.length);
				log.debug("searchResultsWOId.length", searchResultsWOId.length);
				var firstRowData = [];
				var isWorkOrderData = false;

				if (searchResults.length) {
					firstRowData = searchResults[0].columns;
				}
				else if (searchResultsWOId.length) {
					firstRowData = searchResultsWOId[0].columns;
					isWorkOrderData = true;
				}

				firstRowData.forEach((col, i) => {
					var label = col.label;
					if (label != woPriority1_2FormulaLabel) { // Dont add the WOPrio1 + WOPrio2 to the UI cols
						var id = label.match(/id\[/gi) ? label.match(/id\[.*?\]/gi)[0].replace(/id\[|\]/gi, '') :
							col.name.replace(/custbody/gi, 'cb').replace(/custcol/gi, 'cc');
						label = label.match(/id\[|\]/gi) ? label.replace(/id\[.*?\]/gi, '').trim() : label;
						var type = ui.FieldType.TEXT;
						if (id.match(/wo_priorty|weekendhrs|cnt_board_thickness|cntm_boardpitch/gi))
							type = ui.FieldType.FLOAT;
						else if (id.match(/sched_due_date/gi))
							type = ui.FieldType.DATE;
						else if (id.match(/rda_qfactor/gi))
							type = ui.FieldType.PERCENT;
						else if (id.match(/comment/gi))
							type = ui.FieldType.TEXTAREA;

						// To prevent adding hidden columns
						if (id == 'hiddenfield')
							return;

						if (!!mtoIdMap[id] && isWorkOrderData) id = mtoIdMap[id];

						// ADD SUBLIST FIELDS
						sublistFields[id] = sublist.addField({
							id: `custcol_${id}`,
							label,
							type
						});
						// Added by jeromemorden | 01/20/22
						if (id.match(/wo_priorty|weekendhrs/gi))
							sublistFields[id].updateDisplaySize({
								height: 60,
								width: 4
							});
						if (id.match(/wo_sched_due_date/gi))
							sublistFields[id].updateDisplaySize({
								height: 60,
								width: 8
							});
						// end
						// Added by lcc 1/8/2022
						if (id.match(/quantity|rda_qfactor|qtyoperation|no_of_panel|total_num_cores|boards_per_panel|qty_due/gi)) {
							sublistFields[id].updateDisplaySize({
								height: 60,
								width: 6
							});
							// sublistFields[id].maxLength = 15
							//log.debug('Width reduced', { id, label })
						}
						if (id.match(/comments/gi)) {
							sublistFields[id].updateDisplaySize({
								height: 2,
								width: 20
							});
							// log.debug('Height reduced', { id, label })
						}
						// end
						if (!id.match(/cb_outsourced|cb_rda_sales_order_type|cc_rda_fab_outsource_house/gi))
							csvText += `"${label}",`;
					}
				});
				log.debug('sublistFields', sublistFields)

				file.create({
					name: 'sublistFields.txt',
					fileType: file.Type.PLAINTEXT,
					contents: JSON.stringify(sublistFields),
					folder: -15
				}).save()

				if (!sublistFields['internalid'])
					sublistFields['internalid'] = sublist.addField({
						id: 'custcol_internalid',
						label: 'Internal ID',
						type: ui.FieldType.TEXT
					});


				([
					'cb_outsourced', 'cb_rda_sales_order_type', 'cc_rda_fab_outsource_house',
					//'cb_wo_outsideservice', 'cb_wo_finishtype', 'cb_cntm_tool_number'
				]).forEach(id => {
					if (sublistFields[id])
						sublistFields[id].updateDisplayType({
							displayType: ui.FieldDisplayType.HIDDEN
						});
				});

				// Input fields
				var allowEditing = search.lookupFields({
					type: 'employee',
					id: userId,
					columns: ['custentity_allow_editing_wo_sched']
				}).custentity_allow_editing_wo_sched;

				if (allowEditing)
					editedFields.split(',').forEach((fieldId) => {
						fieldId = fieldId.replace(/custbody/gi, 'cb');
						if (sublistFields[fieldId])
							sublistFields[fieldId].updateDisplayType({
								displayType: ui.FieldDisplayType.ENTRY
							});
					});


				// This block of code will sort the results based on the entered tool numbers filter - added by: jeromemorden | 03/25/2022
				log.debug('toolNumbers', toolNumbers)
				if (toolNumbers && toolNumbers.length) {
					var results = {};
					var toolNumber = [];
					toolNumbers.forEach(num => {
						if (!results[num]) {
							results[num] = [];
							toolNumber.push(num);
						}
					});
					log.debug('results', results)
					searchResults.forEach(res => {
						var toolNum = ''//res.getText( res.columns[41] );
						for (col of res.columns)
							if (col.name.match(/custbody_cntm_tool_number/g)) {
								toolNum = res.getText(col)
								break
							}
						if (results[toolNum])
							results[toolNum].push(res);
					});
					searchResults = [];
					toolNumber.forEach(x => {
						searchResults = searchResults.concat(results[x]);
					});
				}

				// Gather item ids
				//   				var itemIds = [];
			}

			var soUrl = url.resolveRecord({
				recordType: 'salesorder'
			}) + '&id=';

			var woUrl = url.resolveRecord({
				recordType: 'workorder'
			}) + '&id=';

			var arrSLLines = [];
			if (!!searchResults.length) {
				var line = 0;
				searchResults.forEach(res => {
					var objLine = {};
					var { columns } = res;
					//  if (line == 0) log.debug('COLUMNZ', columns)
					var woId = res.getValue(columns[9]);

					if (woIds.indexOf(woId) < 0)
						woIds.push(woId);
					else if (duplicateIds.indexOf(woId) < 0)
						duplicateIds.push(woId);

					csvText += '\n';

					columns.forEach((col, i) => {
						var label = col.label;
						var id = 'custcol_' + (label.match(/id\[/gi) ? label.match(/id\[.*?\]/gi)[0].replace(/id\[|\]/gi, '') :
							col.name.replace(/custbody/gi, 'cb').replace(/custcol/gi, 'cc'));
						let value = res.getText(col) || res.getValue(col) || null;

						if (typeof value == 'string')
							value = value.replace(/sales order #|work order #/gi, '');

						if (id.match(/cnt_created_fm_so/gi))
							value = `<a href="${soUrl}${res.getValue(col)}" target="_blank">${value}</a>`;

						if (id.match(/cntm_client_asm_wo_ref/gi) && params.custpage_page != 'csv') {
							value = `<a href="${woUrl}${res.getValue(col)}" target="_blank">${value}</a>`;
						}

						if (id.match(/custrecord_cntm_client_asm_nextop/gi)) {
							log.debug('Attempting to set OPERATION field');
							value = value ? value.substr(value.indexOf("-") + 1) : null;
						}

						if (i == 15)
							value = qtyOperation || '';
						// sublist.setSublistValue({id, line, value});
						objLine[id] = value;

						if (!id.match(/internalid|cb_outsourced|cb_rda_sales_order_type|cc_rda_fab_outsource_house/gi) &&
							!label.match(/woprio1|woprio2/gi))
							if (id.match(/fill_run_hrs|pth_run_hrs/gi)) {
								value = value ? Math.round(parseFloat(value) * 100) / 100 : value;
							}
						if (id.match(/cnt_created_fm_so|cntm_asm_wo_ref/gi)) {
							value = res.getText(col) || res.getValue(col) || null
						}
						if (typeof value == 'string') {
							value = value.replace(/sales order #|work order #/gi, '');
						}
						// if(i > 0){
						csvText += `"${value || ''}",`;
						// }
					});
					arrSLLines.push(objLine);
					line++;
				});
			}

			mtoIdMap = {
				custcol_workorder: "custcol_custrecordcntm_client_asm_wo_ref",
				custcol_name: "custcol_custrecord_cntm_client_asm_nextop",
				custcol_formulatext: "custcol_custrecord_cntm_client_asm_serial_no"
			}

			if (!!searchResultsWOId.length) {
				//add SO filtering here since SO tranid is 3rd level join
				var soTranId = null;
				if (params.custpage_salesorder) {
					soTranId = params.custpage_salesorder;
					if (!soTranId.match(/so/gi))
						soTranId = `SO${soTranId}`;
				}
				searchResultsWOId.forEach(res => {
					var objLine = {};
					var { columns } = res;
					var skip = false;
					csvText += '\n';
					columns.forEach((col, i) => {
						var label = col.label;
						var id = 'custcol_' + (label.match(/id\[/gi) ? label.match(/id\[.*?\]/gi)[0].replace(/id\[|\]/gi, '') :
							col.name.replace(/custbody/gi, 'cb').replace(/custcol/gi, 'cc'));
						let value = res.getText(col) || res.getValue(col) || null;
						if (id.match(/cnt_created_fm_so/gi) && !!soTranId) {
							skip = true;
							var re = new RegExp(soTranId + "$", "gi");
							if (res.getText(col).match(re)) {
								skip = false;
							}
						}

						if (typeof value == 'string')
							value = value.replace(/sales order #|work order #/gi, '');

						if (id.match(/cnt_created_fm_so/gi) && params.custpage_page != 'csv')
							value = `<a href="${soUrl}${res.getValue(col)}" target="_blank">${value}</a>`;

						if (id.match(/custcol_workorder/gi) && params.custpage_page != 'csv') {
							value = `<a href="${woUrl}${res.getValue(col)}" target="_blank">${value}</a>`;
						}

						if (id.match(/custcol_name/gi)) {
							log.debug('Attempting to set OPERATION field');
							value = value ? value.substr(value.indexOf("-") + 1) : null;
						}

						csvText += `"${value || ''}",`;

						if (!!mtoIdMap[id]) id = mtoIdMap[id];
						objLine[id] = value;
					});
					if (!skip) {
						arrSLLines.push(objLine);
					}
				});
			}

			for (var line = 0; line < arrSLLines.length; line++) {
				for (var id in arrSLLines[line]) {
					var value = arrSLLines[line][id];
					sublist.setSublistValue({ id, line, value });
				}
			}

			fields.duplicated.defaultValue = duplicateIds.join(',');
			fields.updated.defaultValue = '';
			//			}

			form.addSubmitButton();
			form.addButton({
				id: 'custpage_btnrefresh',
				label: 'Refresh List',
				functionName: 'refreshList()'
			});
			let as = form.addButton({
				id: 'custpage_btnautosort',
				label: 'Auto Sort',
				functionName: 'autoSort()'
			});

			if (params.custpage_toolnumber)
				as.isDisabled = true

			var csvUrl = url.resolveScript({
				scriptId: script.id,
				deploymentId: script.deploymentId
			});
			for (var x in params) {
				if (!x.match(/custpage_/gi) || !params[x] || x.match(/sublist|display|duplicated|updated|_page/gi))
					continue;

				var paramsVal = params[x];
				if (x.match(/toolnumber/g))
					paramsVal = paramsVal.replace(/[^0-9a-zA-Z_\-]/gm, ',');

				csvUrl += `&${x}=${paramsVal}`;
			}
			csvUrl += `&custpage_page=csv`;

			form.addButton({
				id: 'custpage_btnexportcsv',
				label: 'CSV',
				functionName: `exportToCSV("${csvUrl}")`
			});

			form.clientScriptModulePath = './se_cs_generalWOschedule_v4.0.js';

			if (params.custpage_page != 'csv')
				context.response.writePage(form);
			else {
				context.response.writeFile(file.create({
					name: 'GeneralWOSchedule.CSV',
					fileType: file.Type.CSV,
					contents: csvText
				}));
			}
		}

		const secondPage = context => {
			log.debug('2nd page')
			var { request } = context;
			var params = request.parameters;
			var toUpdate = params.custpage_updated.split(',');

			var script = runtime.getCurrentScript();
			var editedFields = script.getParameter('custscript_gwos_asm_editedfields');

			var dataToUpdate = {};
			var group = 'custpage_sublist';
			var lineCount = request.getLineCount({
				group
			});
			var sublistdata = params.custpage_sublistdata.split('\u0002')

			for (var line = 0; line < lineCount; line++) {
				var woId = request.getSublistValue({
					group,
					name: 'custcol_internalid',
					line
				});

				var woIdIndex = toUpdate.indexOf(woId);
				if (woIdIndex >= 0) {
					toUpdate.splice(woIdIndex, 1);

					dataToUpdate[woId] = {};
					editedFields.split(',').forEach((id) => {
						var name = 'custcol_' + id.replace(/custbody/gi, 'cb');
						var value = request.getSublistValue({ group, name, line });
						if (id.match(/comments/g)) { // Concatenate comment fields for multiple line items WO

							if (value) {
								if (!dataToUpdate[woId][id]) dataToUpdate[woId][id] = ''

								dataToUpdate[woId][id] += value + '\n'
							}
						} else {
							dataToUpdate[woId][id] = value;
						}
					});
					// Added by lcc 12/8/2021
					let weekendHrs = parseFloat(sublistdata[line].split('\u0001')[1]) || 0
					if (line == 0) {
						log.debug('weekendHrs', sublistdata[line].split('\u0001'))
					}
					if (weekendHrs) {
						let latest_prjenddate = sublistdata[line].split('\u0001')[8]
						if (latest_prjenddate) { // Deduct the weekendhrs to latestprojectedenddate
							//dataToUpdate[woId].custbody_latest_proj_end_date = moment(latest_prjenddate).add('hours', -weekendHrs).format('MM/DD/YYYY hh:mm a')
						}
					}
				}

			}

			log.debug('dataToUpdate', dataToUpdate);

			for (var id in dataToUpdate)
				record.submitFields({
					type: 'workorder',
					id,
					values: dataToUpdate[id]
				});

			for (var x in params)
				if (!x.match(/custpage_/gi) || !params[x] || x.match(/sublist|display|duplicated|updated/gi))
					delete params[x];
			delete params.custpage_sublist;
			params.custpage_page = 1;

			redirect.toSuitelet({
				scriptId: script.id,
				deploymentId: script.deploymentId,
				parameters: params
			});
		}

		const getAllSSResult = (searchResultSet, limit) => {
			log.debug('limit', limit);
			if (!limit)
				limit = 100000000;

			var inc = 0;
			log.debug("Limit parameter", limit);
			var result = [];
			for (var x = 0; x <= result.length && x < limit; x += 1000) {
				(inc + 1000) > limit ? inc = limit : inc += 1000;
				log.debug('range', x + ' - ' + inc);
				result = result.concat(searchResultSet.getRange(x, inc) || []);
			}
			log.debug('Line 785 result.length:', result.length)
			return result;
		};

		const parseFloatOrZero = n => { return parseFloat(n) || 0 }

		return {
			onRequest
		};

	}
);
