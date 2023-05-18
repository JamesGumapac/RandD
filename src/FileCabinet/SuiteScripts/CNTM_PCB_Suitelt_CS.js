/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(
		[ 'N/currentRecord', 'N/url', 'N/search', 'N/runtime', 'N/record',
				'N/https', 'N/ui/message', 'N/ui/dialog' ],

		function(currentRecord, url, search, runtime, record, https, message,
				dialog) {

			/**
			 * Function to be executed after page is initialized.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.mode - The mode in which the record is
			 *            being accessed (create, copy, or edit)
			 * 
			 * @since 2015.2
			 */
			function pageInit(scriptContext) {

				// jQuery('head').append('<script id="cntm_lib_loader"
				// src="https://cdn.jsdelivr.net/npm/gasparesganga-jquery-loading-overlay@2.1.5/dist/loadingoverlay.min.js""><script>');
				try {

					setParamersCheck("&msgShow=", "msgShow")
					function setParamersCheck(param, mainparam) {
						mainUrl = window.location.href;
						var obj = new URL(mainUrl);
						if (mainUrl.includes(param)) {
							var value = obj.searchParams.get(mainparam);
							// debugger;
							value = value.trim();
							value = value.replace(/\s+/g, " ");
							if (value == "true") {
								var myMsg = message.create({
									title : 'PCB',
									message : 'Record Saved Successfully',
									type : message.Type.CONFIRMATION
								});

								// will disappear after 5s
								myMsg.show({
									duration : 5000
								});
								mainUrl = mainUrl.replace('&msgShow=true', '');
								setTimeout(function() {
									window.location.assign(mainUrl);
								}, 2500);
							}

						}

					}
					var soNo = scriptContext.currentRecord
							.getValue("custpage_sales_order");
					var output = url.resolveScript({
						scriptId : 'customscript_cntm_pcb_backend_su',
						deploymentId : 'customdeploy_cntm_pcb_backen',
						returnExternalUrl : false
					});
					if (soNo) {
						var response = https.get({
							url : output + "&soNo=" + soNo
						});

						var finalData = JSON.parse(response.body);
						// function getStatus(wo)
						// { try{
						// var woRecord= record.load({
						// type: "workorder",
						// id: wo
						// });
						//
						// var statusWO = woRecord.getValue({
						// fieldId: 'status'
						// });
						// //var statusWO = statusWO.status[0].value;
						// }
						// catch(e)
						// {
						// statusWO="";
						// }
						//
						// return statusWO;
						// }
						if (finalData.length > 0) {

							// scriptContext.currentRecord.setText({fieldId:"custpage_upload_files",text:finalData[0].routeFile,ignoreFieldChange:true})
							for (var index = 0; index < finalData.length; index++) {
								// var
								// itemNo=result.getValue(search.createColumn({name:
								// "item", label: "Item"}));
								// var woNumber=result.getValue(
								// search.createColumn({name: "internalid",
								// label: "Internal ID"}));
								scriptContext.currentRecord.selectLine({
									sublistId : 'custpage_item_sublist',
									line : index
								});
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_item_sub',
											line : index,
											value : finalData[index].itemDetails
										});
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_workorder',
											line : index,
											value : finalData[index].workOrder
										});
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_workorder_cf',
											line : index,
											value : finalData[index].createdfrom
										});
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_quantity',
											line : index,
											value : finalData[index].woQty
										});
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_wo_status',
											line : index,
											value : finalData[index].woStatus
										});
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_new_rout',
											line : index,
											value : false,
											ignoreFieldChange : true
										});
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_lot_rec',
											line : index,
											value : false,
											ignoreFieldChange : true
										});
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_cr_status',
											line : index,
											value : finalData[index].crStatus,
											ignoreFieldChange : true
										});
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_sublistinternalid',
											line : index,
											value : finalData[index].internalId
										});
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_error_details',
											line : index,
											value : finalData[index].errorDetials
										});
								if (finalData[index].errorFile)
									scriptContext.currentRecord
											.setCurrentSublistValue({
												sublistId : 'custpage_item_sublist',
												fieldId : 'custpage_error_details_file',
												line : index,
												value : finalData[index].errorFile
											});
								console.log(finalData[index].errorFile);
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_routing_status',
											line : index,
											value : finalData[index].routeStatus
										});
								scriptContext.currentRecord.commitLine({
									sublistId : 'custpage_item_sublist'
								});

							}
							jQuery.LoadingOverlay("hide");
						}
					} else {
						jQuery.LoadingOverlay("hide");
					}
				} catch (e) {
					jQuery.LoadingOverlay("hide");
					// alert(e.message);
				}

				// var customrecord_cntm_pcb_wo_suitelet_dataSearchObj =
				// search.create({
				// type: "customrecord_cntm_pcb_wo_suitelet_data",
				// filters:
				// [
				// ["custrecord_cntm_crtd_frm_so","anyof",soNo]

				// ],
				// columns:
				// [
				// search.createColumn({name: "internalid", label: "Internal
				// ID"}),
				// search.createColumn({name: "custrecord_cntm_crtd_frm_so",
				// label: "Created From SO"}),
				// search.createColumn({name: "custrecord_cntm_crtd_frm", label:
				// "Creted From"}),
				// search.createColumn({name: "custrecord_cntm_wo", label:
				// "WO"}),
				// search.createColumn({name: "custrecord_cntm_wo_status",
				// label: "Status"}),
				// search.createColumn({name: "custrecord_cntm_rout_file",
				// label: "Routing File"}),
				// search.createColumn({name: "custrecord_cntm_item", label:
				// "Item"}),
				// search.createColumn({name: "custrecord_cntm_wo_qty", label:
				// "WO qty"}),
				// search.createColumn({name:
				// "custrecord_cntm_create_new_routing", label: "Create New
				// Routing"}),
				// search.createColumn({name: "custrecord_cntm_create_lot_rec",
				// label: "Create Lot Record"})
				// ]
				// });

				// var searchResultCount =
				// customrecord_cntm_pcb_wo_suitelet_dataSearchObj.runPaged().count;
				// log.debug("customrecord_cntm_pcb_wo_suitelet_dataSearchObj
				// result count",searchResultCount);
				// var index=0;
				// customrecord_cntm_pcb_wo_suitelet_dataSearchObj.run().each(function(result){
				// // .run().each has a limit of 4,000 results
				// var createdfromSO=result.getValue(search.createColumn({name:
				// "custrecord_cntm_crtd_frm_so", label: "Created From SO"}));
				// var internalId=result.getValue(search.createColumn({name:
				// "internalid", label: "Internal ID"}));
				// var woQty=result.getValue(search.createColumn({name:
				// "custrecord_cntm_wo_qty", label: "WO qty"}));
				// var createdfrom=result.getValue(search.createColumn({name:
				// "custrecord_cntm_crtd_frm", label: "Creted From"}));
				// var workOrder=result.getValue(search.createColumn({name:
				// "custrecord_cntm_wo", label: "WO"}));
				// var woStatus=result.getText(search.createColumn({name:
				// "custrecord_cntm_wo_status", label: "Status"}));
				// // var routeFile=result.getValue(search.createColumn({name:
				// "custrecord_cntm_rout_file", label: "Routing File"}));
				// var itemDetails=result.getValue(search.createColumn({name:
				// "custrecord_cntm_item", label: "Item"}));
				// var newRoute=result.getValue(search.createColumn({name:
				// "custrecord_cntm_create_new_routing", label: "Create New
				// Routing"}));
				// var lotRec=result.getValue(search.createColumn({name:
				// "custrecord_cntm_create_lot_rec", label: "Create Lot
				// Record"}));
				// scriptContext.currentRecord.selectLine({
				// sublistId: 'custpage_item_sublist',
				// line: index
				// });
				// scriptContext.currentRecord.setCurrentSublistValue({
				// sublistId : 'custpage_item_sublist',
				// fieldId : 'custpage_item_sub',
				// line : index,
				// value: itemDetails
				// });
				// scriptContext.currentRecord.setCurrentSublistValue({
				// sublistId : 'custpage_item_sublist',
				// fieldId : 'custpage_workorder',
				// line : index,
				// value: workOrder
				// });
				// scriptContext.currentRecord.setCurrentSublistValue({
				// sublistId : 'custpage_item_sublist',
				// fieldId : 'custpage_workorder_cf',
				// line : index,
				// value: createdfrom
				// });
				// scriptContext.currentRecord.setCurrentSublistValue({
				// sublistId : 'custpage_item_sublist',
				// fieldId : 'custpage_quantity',
				// line : index,
				// value: woQty
				// });
				// scriptContext.currentRecord.setCurrentSublistValue({
				// sublistId : 'custpage_item_sublist',
				// fieldId : 'custpage_wo_status',
				// line : index,
				// value: woStatus
				// });
				// scriptContext.currentRecord.setCurrentSublistValue({
				// sublistId : 'custpage_item_sublist',
				// fieldId : 'custpage_new_rout',
				// line : index,
				// value: newRoute
				// });
				// scriptContext.currentRecord.setCurrentSublistValue({
				// sublistId : 'custpage_item_sublist',
				// fieldId : 'custpage_lot_rec',
				// line : index,
				// value: lotRec
				// });
				// scriptContext.currentRecord.setCurrentSublistValue({
				// sublistId : 'custpage_item_sublist',
				// fieldId : 'custpage_sublistinternalid',
				// line : index,
				// value: internalId
				// });
				// scriptContext.currentRecord.commitLine({
				// sublistId: 'custpage_item_sublist'
				// });
				// index++;
				// return true;
				// });
				// },100);
				// jQuery.LoadingOverlay("hide");
			}

			/**
			 * Function to be executed when field is changed.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * @param {string}
			 *            scriptContext.fieldId - Field name
			 * @param {number}
			 *            scriptContext.lineNum - Line number. Will be undefined
			 *            if not a sublist or matrix field
			 * @param {number}
			 *            scriptContext.columnNum - Line number. Will be
			 *            undefined if not a matrix field
			 * 
			 * @since 2015.2
			 */
			function fieldChanged(scriptContext) {

				if (scriptContext.fieldId == 'custpage_item_details') {
					jQuery.LoadingOverlay("show");
					// debugger;
					var itemNo = scriptContext.currentRecord
							.getValue("custpage_item_details");
					var soNo = scriptContext.currentRecord
							.getValue("custpage_sales_order");
					if (itemNo && soNo) {
						var numLines = scriptContext.currentRecord
								.getLineCount({
									sublistId : 'custpage_item_sublist'
								});
						for (var ii = numLines - 1; ii >= 0; ii--) {
							scriptContext.currentRecord.removeLine({
								sublistId : 'custpage_item_sublist',
								line : ii,
								ignoreRecalc : true
							});
						}

						var output = url.resolveScript({
							scriptId : 'customscript_cntm_pcb_backend_su',
							deploymentId : 'customdeploy_cntm_pcb_backen',
							returnExternalUrl : false
						});
						function getStatus(wo) {
							// var statusWO = search.lookupFields({
							// type : 'workorder',
							// id : wo,
							// columns : [ 'status' ]
							// });
							var woRecord = record.load({
								type : "workorder",
								id : wo
							});

							var statusWO = woRecord.getValue({
								fieldId : 'status'
							});
							// debugger;
							try {
								// var statusWO = statusWO.status[0].value;
							} catch (e) {
								statusWO = "";
							}

							return statusWO;
						}
						var response = https.get({
							url : output + "&itemNo=" + itemNo + "&soNo="
									+ soNo
						})

						var finalData = JSON.parse(response.body);

						if (finalData.length > 0) {
							// scriptContext.currentRecord.setText({fieldId:"custpage_upload_files",text:finalData[0].routeFile,ignoreFieldChange:true})
							for (var index = 0; index < finalData.length; index++) {
								// var
								// itemNo=result.getValue(search.createColumn({name:
								// "item", label: "Item"}));
								// var woNumber=result.getValue(
								// search.createColumn({name: "internalid",
								// label: "Internal ID"}));
								scriptContext.currentRecord.selectLine({
									sublistId : 'custpage_item_sublist',
									line : index
								});
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_item_sub',
											line : index,
											value : finalData[index].itemDetails
										});
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_workorder',
											line : index,
											value : finalData[index].workOrder
										});
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_workorder_cf',
											line : index,
											value : finalData[index].createdfrom
										});
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_quantity',
											line : index,
											value : finalData[index].woQty
										});
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_wo_status',
											line : index,
											value : getStatus(finalData[index].workOrder)
										});
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_new_rout',
											line : index,
											value : false,
											ignoreFieldChange : true
										});
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_lot_rec',
											line : index,
											value : false,
											ignoreFieldChange : true
										});
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_cr_status',
											line : index,
											value : finalData[index].crStatus
										});
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_sublistinternalid',
											line : index,
											value : finalData[index].internalId
										});
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_error_details',
											line : index,
											value : finalData[index].errorDetials
										});
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_error_details',
											line : index,
											value : finalData[index].errorDetials
										});
								console.log(finalData[index].errorFile);
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_error_details_file',
											line : index,
											value : finalData[index].errorFile
										});
								scriptContext.currentRecord.commitLine({
									sublistId : 'custpage_item_sublist'
								});

							}
							jQuery.LoadingOverlay("hide");
						}
						// return true;
						// });
					}
				}

			}

			/**
			 * Function to be executed when field is slaved.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * @param {string}
			 *            scriptContext.fieldId - Field name
			 * 
			 * @since 2015.2
			 */
			function postSourcing(scriptContext) {

			}

			/**
			 * Function to be executed after sublist is inserted, removed, or
			 * edited.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * 
			 * @since 2015.2
			 */
			function sublistChanged(scriptContext) {

			}

			/**
			 * Function to be executed after line is selected.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * 
			 * @since 2015.2
			 */
			function lineInit(scriptContext) {

			}

			/**
			 * Validation function to be executed when field is changed.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * @param {string}
			 *            scriptContext.fieldId - Field name
			 * @param {number}
			 *            scriptContext.lineNum - Line number. Will be undefined
			 *            if not a sublist or matrix field
			 * @param {number}
			 *            scriptContext.columnNum - Line number. Will be
			 *            undefined if not a matrix field
			 * 
			 * @returns {boolean} Return true if field is valid
			 * 
			 * @since 2015.2
			 */
			function validateField(scriptContext) {

				if (scriptContext.fieldId == 'custpage_new_rout') {
					var newRoute = scriptContext.currentRecord
							.getCurrentSublistValue({
								sublistId : 'custpage_item_sublist',
								fieldId : 'custpage_new_rout'
							});

					var crStatus = scriptContext.currentRecord
							.getCurrentSublistText({
								sublistId : 'custpage_item_sublist',
								fieldId : 'custpage_cr_status'
							});
					var woStatus = scriptContext.currentRecord
							.getCurrentSublistText({
								sublistId : 'custpage_item_sublist',
								fieldId : 'custpage_wo_status'
							});
					if (crStatus == "Created" || woStatus != "Released") {
						dialog
								.alert({
									title : 'Import Routing Alert',
									message : "You cannot create Routing for the Selected Work Order as the Custom LOT Record is already created."
								});
						return false;
					}

					var currIndex = scriptContext.currentRecord
							.getCurrentSublistIndex({
								sublistId : 'custpage_item_sublist'
							});
				}
				if (scriptContext.fieldId == 'custpage_lot_rec') {
					var lotRec = scriptContext.currentRecord
							.getCurrentSublistValue({
								sublistId : 'custpage_item_sublist',
								fieldId : 'custpage_lot_rec'
							});

					var crStatus = scriptContext.currentRecord
							.getCurrentSublistText({
								sublistId : 'custpage_item_sublist',
								fieldId : 'custpage_cr_status'
							});
					var woStatus = scriptContext.currentRecord
							.getCurrentSublistText({
								sublistId : 'custpage_item_sublist',
								fieldId : 'custpage_wo_status'
							});
					if (crStatus == "Created" || woStatus != "Released") {
						dialog
								.alert({
									title : 'Import Routing Alert',
									message : "you have already created LOT record for the selected Work Order"
								});
						return false;
					}

					var currIndex = scriptContext.currentRecord
							.getCurrentSublistIndex({
								sublistId : 'custpage_item_sublist'
							});
					// getTotalDetails();
					function getTotalDetails() {
						// debugger;

						var woNo = scriptContext.currentRecord
								.getCurrentSublistValue({
									sublistId : 'custpage_item_sublist',
									fieldId : 'custpage_workorder'
								});
						var numLines = scriptContext.currentRecord
								.getLineCount({
									sublistId : 'custpage_item_sublist'
								});
						for (var k = 0; k < numLines; k++) {
							var woCf = scriptContext.currentRecord
									.getSublistValue({
										sublistId : 'custpage_item_sublist',
										fieldId : 'custpage_workorder_cf',
										line : k
									});
							if (woCf == woNo) {
								var crstatus = scriptContext.currentRecord
										.getSublistText({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_cr_status',
											line : k
										});
								if (crstatus != "Created") {
									var lotRec = scriptContext.currentRecord
											.getSublistValue({
												sublistId : 'custpage_item_sublist',
												fieldId : 'custpage_lot_rec',
												line : k
											});
									if (!lotRec) {
										dialog
												.alert({
													title : 'Import Routing Alert',
													message : "Lot record is not created for Sub-assemblies work order(s) of Selected work order. Please create Lot records for Sub-assemblies and try again"
												});
										return false;
									}
								}
							}
						}
					}
				}
				return true;
			}

			/**
			 * Validation function to be executed when sublist line is
			 * committed.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * 
			 * @returns {boolean} Return true if sublist line is valid
			 * 
			 * @since 2015.2
			 */
			function validateLine(scriptContext) {

			}

			/**
			 * Validation function to be executed when sublist line is inserted.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * 
			 * @returns {boolean} Return true if sublist line is valid
			 * 
			 * @since 2015.2
			 */
			function validateInsert(scriptContext) {

			}

			/**
			 * Validation function to be executed when record is deleted.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * 
			 * @returns {boolean} Return true if sublist line is valid
			 * 
			 * @since 2015.2
			 */
			function validateDelete(scriptContext) {

			}

			function cancelButton() {
				debugger;
				var record = currentRecord.get();
				var id = record.getValue("custpage_fabrec");
				var output = url.resolveRecord({
					recordType : 'customrecord_cntm_wo_bom_import_fab',
					recordId : id,
					isEditMode : false
				});
				window.location.assign(output);
			}

			/**
			 * Validation function to be executed when record is saved.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @returns {boolean} Return true if record is valid
			 * 
			 * @since 2015.2
			 */
			function saveRecord(scriptContext) {
				// var flagtosave=false;
				// var options = {
				// title: 'Import Routing Alert',
				// message: 'LOT Custom Records for the Work Orders Selected
				// will be created.Please note that you CANNOT change the
				// Routing on the Work Order once the Custom Records are
				// created. Are you sure you want to proceed further?'
				// };
				// function success(result) {
				// //alert('text')
				//				
				// }
				// function failure(reason) {
				// return false;
				// }

				var lineNumber = scriptContext.currentRecord
						.findSublistLineWithValue({
							sublistId : 'custpage_item_sublist',
							fieldId : 'custpage_new_rout',
							value : "T"
						});

				var lineNumber2 = scriptContext.currentRecord
						.findSublistLineWithValue({
							sublistId : 'custpage_item_sublist',
							fieldId : 'custpage_lot_rec',
							value : "T"
						});

				var files = scriptContext.currentRecord
						.getValue("custpage_upload_files");

				if (lineNumber == -1) {
					dialog
							.alert({
								title : 'Import Routing Alert',
								message : "Please check atleast one option out of Create New Routing to proceed further. "
							});
					return false;

				}
				if (lineNumber > -1 && !files) {
					dialog.alert({
						title : 'Import Routing Alert',
						message : "Please Select Routing File."
					});
					return false;

				}
				return true;
				// if(lineNumber2>-1)
				// {
				// if(confirm('LOT Custom Records for the Work Orders Selected
				// will be created.Please note that you CANNOT change the
				// Routing on the Work Order once the Custom Records are
				// created. Are you sure you want to proceed further?'))
				// {
				//			
				// return true;
				// }
				// else
				// {
				// return false;
				// }
				// }
				// else
				// {
				// return true;
				// }

			}

			return {
				pageInit : pageInit,
				fieldChanged : fieldChanged,
				validateField : validateField,
				saveRecord : saveRecord,
				cancelButton : cancelButton

			};

		});
