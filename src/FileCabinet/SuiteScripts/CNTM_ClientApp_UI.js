/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
var mainMap = {};
define(
		[ 'N/ui/serverWidget', 'N/record', 'N/search', 'N/transaction',
				'N/ui/serverWidget', 'N/xml', 'N/runtime', 'N/task',
				'N/render', 'N/https', 'N/url', 'N/redirect' ],

		function(ui, record, search, transaction, serverWidget, xml, runtime,
				task, render, https, url, redirect) {

			/**
			 * Definition of the Suitelet script trigger point.
			 * 
			 * @param {Object}
			 *            context
			 * @param {ServerRequest}
			 *            context.request - Encapsulation of the incoming
			 *            request
			 * @param {ServerResponse}
			 *            context.response - Encapsulation of the Suitelet
			 *            response
			 * @Since 2015.2
			 */
			function onRequest(context) {
				try {
					if (context.request.method === 'GET') {
						var isPanel = context.request.parameters.isPanel;
						var wo = context.request.parameters.wo;
						var title = 'RDA Work order Completion';
						if (isPanel == 'T')
							title = 'Scrap Panel';
						var form = ui.createForm({
							title : title
						});
						// form.clientScriptModulePath =
						// './CNTM_CS_ClientAppWOC.js'
						var isView = context.request.parameters.isView;
						if (isView != 'true') {
							form.addSubmitButton({
								label : 'Submit'
							});
							if (isPanel != 'T') {
								var button = form.addButton({
									id : 'custpage_delete',
									label : 'Delete Completion',
									functionName : 'deleteCompletion'
								});

								var button = form.addButton({
									id : 'custpage_edit',
									label : 'Edit Completions',
									functionName : 'editCompletion'
								});
								// }

								var button = form.addButton({
									id : 'custpage_add_panel_wo',
									label : 'Scrap Panel',
									functionName : 'createPanelWO'
								});

							} else {
								var backbutton = form.addButton({
									id : 'custpage_back',
									label : 'Back',
									functionName : 'processNew'
								});
							}
						} else {
							var button = form.addButton({
								id : 'custpage_process',
								label : 'New',
								functionName : 'processNew'
							});
							var refreshButton = form.addButton({
								id : 'custpage_refresh',
								label : 'Refresh',
								functionName : 'refresh'
							});
						}
						// form.addButton({
						// label: 'Submit',
						// id: 'custpage_add_btn'
						//    				
						// });
						//
						// form.addButton({
						// label: 'Close',
						// id: 'custpage_close_btn'
						//    				
						// });
						//    			
						// form.addButton({
						// label: 'Clear',
						// id: 'custpage_clear_btn'
						//    				
						// });

						var hiddenheaderId = form.addField({
							id : 'custpage_hidden_id',
							type : ui.FieldType.TEXT,
							label : 'headerID'
						});
						hiddenheaderId.defaultValue = "";
						hiddenheaderId.updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});
						var availableQtyMapFld = form.addField({
							id : 'custpage_avl_qty_map',
							type : ui.FieldType.TEXTAREA,
							label : 'Available Quantity Map'
						});
						availableQtyMapFld.updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});
						var hiddenFld = form.addField({
							id : 'custpage_hidden_chkfld',
							type : ui.FieldType.TEXT,
							label : 'hdn'
						});
						hiddenFld.defaultValue = 1;
						hiddenFld.updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});
						if (isPanel == 'T') {
							var hiddenFld1 = form.addField({
								id : 'custpage_hidden_panel_chkfld',
								type : ui.FieldType.TEXT,
								label : 'hdn'
							});
							hiddenFld1.defaultValue = 1;
							hiddenFld1.updateDisplayType({
								displayType : ui.FieldDisplayType.HIDDEN
							});
						}
						var workOrder = form.addField({
							id : 'custpage_jobnumber_text',
							source : 'workorder',
							type : ui.FieldType.SELECT,
							label : 'Work Order'
						});
						workOrder.isMandatory = true;

						if (isPanel == 'T')
							workOrder.defaultValue = wo;
						/*
						 * workOrder.updateDisplayType({ displayType :
						 * ui.FieldDisplayType.HIDDEN });
						 */
						if (isPanel != 'T' && isView != 'true') {
							var workOrderScanner = form.addField({
								id : 'custpage_wo_scanner',
								// source : 'workorder',
								type : ui.FieldType.INLINEHTML,
								label : 'Work Order'
							});
							/*
							 * var workOrderScannerHdn = form.addField({ id :
							 * 'custpage_wo_scanner_hdn', //source :
							 * 'workorder', type : ui.FieldType.TEXT, label :
							 * 'Work Order' });
							 */
							var xVal;
							var setoption = '<option></option>';
							var finaldataset = [];
							var workorderSearchObj = search.create({
								type : "workorder",
								filters : [ [ "type", "anyof", "WorkOrd" ],
										"AND", [ "mainline", "is", "T" ] ],
								columns : [ search.createColumn({
									name : "tranid",
									label : "Document Number"
								}), search.createColumn({
									name : "internalid",
									label : "Internal ID"
								}) ]
							});
							var searchResultCount = workorderSearchObj
									.runPaged().count;
							log.debug("workorderSearchObj result count",
									searchResultCount);
							var finaldataset = [];
							workorderSearchObj.run().each(
									function(result) {
										// .run().each has a limit of 4,000
										// results
										var jsondata = {};
										var workOrder = result.getValue(search
												.createColumn({
													name : "tranid",
													label : "Document Number"
												}));
										var workOrderid = result
												.getValue(search.createColumn({
													name : "internalid",
													label : "Internal ID"
												}));
										jsondata.workOrderid = workOrderid;
										jsondata.workOrder = workOrder;
										finaldataset.push(jsondata);
										setoption += '<option data-value="'
												+ workOrderid + '" id="'
												+ workOrder + '" label="'
												+ workOrder + '">' + workOrder
												+ '<option>';
										return true;
									});
							workOrderScanner.defaultValue = '<span class="labelSpanEdit smallgraytextnolink"><label class="smallgraytextnolink" for="workorder" style=" font-size: 12px; font-weight: normal !important;">WORK ORDER:</label></span>'
									+ '<div class="uir-select-input-container"><input list="workordelist" name="workorder" id="workorder_cntm" style="width: 420px; height: 23px;" onchange="myFunction(this)" /><datalist id="workordelist">'
									+ setoption
									+ '</datalist></div>'
									+ '<script> nlapiGetField("custpage_jobnumber_text").setDisplayType("hidden"); function myFunction(val){console.log(val.id); console.log(document.getElementById("workordelist").options.namedItem(val.value).getAttribute("data-value"));nlapiSetFieldValue("custpage_jobnumber_text",document.getElementById("workordelist").options.namedItem(val.value).getAttribute("data-value"));};</script>';

						}

						if (isView == 'true' || isPanel == 'T')
							workOrder.updateDisplayType({
								displayType : ui.FieldDisplayType.INLINE
							});
						var customer = form.addField({
							id : 'custpage_customer_text',
							source : 'customer',
							type : ui.FieldType.SELECT,
							label : 'Customer'
						});
						// customer.defaultValue = "";
						customer.updateDisplayType({
							displayType : ui.FieldDisplayType.INLINE
						});

						var customerPartNumber = form.addField({
							id : 'custpage_customerpartnumber_text',
							type : ui.FieldType.TEXT,
							label : 'Customer Part Number'
						});
						customerPartNumber.defaultValue = "";
						customerPartNumber.updateDisplayType({
							displayType : ui.FieldDisplayType.INLINE
						});
						var operatorID = form.addField({
							id : 'custpage_operator_id',
							type : ui.FieldType.SELECT,
							source : 'employee',
							label : 'Operator ID'
						});
						operatorID.defaultValue = runtime.getCurrentUser().id;
						if (isView == 'true')
							operatorID.updateDisplayType({
								displayType : ui.FieldDisplayType.INLINE
							});
						var displayNameCode = form.addField({
							id : 'custpage_display_namecode',
							type : ui.FieldType.SELECT,
							source : 'item',
							label : 'Assembly Item Number'
						});
						displayNameCode.defaultValue = "";
						displayNameCode.updateDisplayType({
							displayType : ui.FieldDisplayType.INLINE
						});
						var primaryInfo = form.addFieldGroup({
							id : 'custpage_primary_info',
							label : 'Primary Information'
						});

						/*
						 * var componentsInfo = form.addFieldGroup({ id :
						 * 'custpage_components_grp', label : 'Choose
						 * Components' });
						 */

						var jobFld = form.addField({
							id : 'custpage_job',
							source : 'job',
							type : ui.FieldType.SELECT,
							label : 'Job Number',
						});
						jobFld.updateDisplayType({
							displayType : ui.FieldDisplayType.INLINE
						});

						var woQty = form.addField({
							id : 'custpage_woqty',
							type : ui.FieldType.TEXT,
							label : 'WO Qty',
						// container: 'custpage_primary_info'
						});
						woQty.defaultValue = "";
						woQty.updateDisplayType({
							displayType : ui.FieldDisplayType.INLINE
						});
						var noOfPanel = form.addField({
							id : 'custpage_no_of_panel',
							type : ui.FieldType.TEXT,
							label : 'Number Of Panel',
						// container: 'custpage_primary_info'
						});

						noOfPanel.updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});
						var dueDate = form.addField({
							id : 'custpage_duedate',
							type : ui.FieldType.TEXT,
							label : 'Due Date',
						// container: 'custpage_primary_info'
						});
						dueDate.defaultValue = "";
						dueDate.updateDisplayType({
							displayType : ui.FieldDisplayType.INLINE
						});
                      if (isPanel == 'T') {
							var isPanelWOFld = form.addField({
								id : 'custpage_create_panel_wo',
								type : ui.FieldType.CHECKBOX,
								label : 'Create Panel WO'
							});
						}
						var sublistType = ui.SublistType.INLINEEDITOR;

						var itemSublist = form.addSublist({
							id : 'custpage_item_sublist',
							type : sublistType,
							label : 'Work Order Completions',
							container : 'custpage_components_grp'
						});

						// var salesType = itemSublist.addField({
						// id : 'custpage_sales_type',
						// source: 'customrecord_cseg_cntm_salestyp',
						// label : 'Sales Type',
						// type : ui.FieldType.SELECT
						// });
						var createWoc = itemSublist
								.addField({
									id : 'custpage_createwoc',
									label : isPanel == 'T' ? 'Scrap Panel Lot'
											: 'Create WOC',
									type : ui.FieldType.CHECKBOX
								});
						if (isView == 'true')
							createWoc.updateDisplayType({
								displayType : ui.FieldDisplayType.HIDDEN
							});
						var panelLot = itemSublist.addField({
							id : 'custpage_panel_lot',
							label : 'Panel Lot',
							type : ui.FieldType.TEXT
						});
						panelLot.isMandatory = true;
						panelLot.updateDisplayType({
							displayType : ui.FieldDisplayType.DISABLED
						});
						var lotQty = itemSublist.addField({
							id : 'custpage_lot_qty',
							label : 'Lot Qty',
							type : ui.FieldType.INTEGER
						});
						lotQty.updateDisplayType({
							displayType : ui.FieldDisplayType.DISABLED
						});

						var scrapQty = itemSublist.addField({
							id : 'custpage_scrap_qty',
							label : 'Scrap Qty (Operation)',
							type : ui.FieldType.INTEGER
						});
						if (isView == 'true')
							scrapQty.updateDisplayType({
								displayType : ui.FieldDisplayType.DISABLED
							});
						
						var scrapDetailsCheck = itemSublist.addField({
							id : 'custpage_select_scrap_details',
							label : 'Select Scrap Reason',
							// source : 'customlist_cnt_scrap_reason',
							type : ui.FieldType.CHECKBOX
						});
						if(isPanel == 'T'){
							scrapQty.updateDisplayType({
								displayType : ui.FieldDisplayType.HIDDEN
							});
							scrapDetailsCheck.updateDisplayType({
								displayType : ui.FieldDisplayType.HIDDEN
							});
						}
						var scrapDetails = itemSublist.addField({
							id : 'custpage_scrap_details',
							label : 'Scrap Reason',
							// source : 'customlist_cnt_scrap_reason',
							type : ui.FieldType.TEXTAREA
						});
						var scrapDetailsHdn = itemSublist.addField({
							id : 'custpage_scrap_details_hdn',
							label : 'Scrap Reason Hdn',
							// source : 'customlist_cnt_scrap_reason',
							type : ui.FieldType.TEXTAREA
						});
						// scrapDetails.isMandatory = true;
						if (isView == 'true')
							scrapDetailsCheck.updateDisplayType({
								displayType : ui.FieldDisplayType.DISABLED
							});
						scrapDetails.updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});
						scrapDetailsHdn.updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});
						var scrapCumulative = itemSublist.addField({
							id : 'custpage_scrap_qty_cum',
							label : 'Scrap Qty (Cumulative)',
							type : ui.FieldType.INTEGER
						});
						scrapCumulative.updateDisplayType({
							displayType : ui.FieldDisplayType.DISABLED
						});
						var qtyGood = itemSublist.addField({
							id : 'custpage_qty_good',
							label : 'Qty Good',
							type : ui.FieldType.INTEGER
						});
						qtyGood.updateDisplayType({
							displayType : ui.FieldDisplayType.DISABLED
						});
						var Operation = itemSublist.addField({
							id : 'custpage_operation',
							label : 'Operation',
							type : ui.FieldType.TEXT
						});
						Operation.updateDisplayType({
							displayType : ui.FieldDisplayType.DISABLED
						});
						/*
						 * var machSetup = itemSublist.addField({ id :
						 * 'custpage_mach_setup', label : 'Mach Setup', type :
						 * ui.FieldType.FLOAT }); if (isView == 'true')
						 * machSetup.updateDisplayType({ displayType :
						 * ui.FieldDisplayType.DISABLED }); var MachRun =
						 * itemSublist.addField({ id : 'custpage_machrun', label :
						 * 'Mach Run', type : ui.FieldType.FLOAT }); if (isView ==
						 * 'true') MachRun.updateDisplayType({ displayType :
						 * ui.FieldDisplayType.DISABLED });
						 */
						var laborSetup = itemSublist.addField({
							id : 'custpage_labor_setup',
							label : 'Labor Setup',
							type : ui.FieldType.FLOAT
						});
						if (isView == 'true')
							laborSetup.updateDisplayType({
								displayType : ui.FieldDisplayType.DISABLED
							});
						var laborRun = itemSublist.addField({
							id : 'custpage_labor_run',
							label : 'Labor Run',
							type : ui.FieldType.FLOAT
						});
						if (isView == 'true')
							laborRun.updateDisplayType({
								displayType : ui.FieldDisplayType.DISABLED
							});
						var status = itemSublist.addField({
							id : 'custpage_status',
							source : 'customlist_cntm_statuslist_woc',
							label : 'Status',
							type : ui.FieldType.SELECT
						});
						status.updateDisplayType({
							displayType : ui.FieldDisplayType.DISABLED
						});
						// ------------------- Used for Issue ---------------//
						/*
						 * var inventoryDetails = itemSublist.addField({ id :
						 * 'custpage_inventory_details', //source :
						 * 'workordercompletion', label : 'Issue Inventory
						 * Detail', type : ui.FieldType.CHECKBOX });
						 */

						var woc = itemSublist.addField({
							id : 'custpage_item_woc',
							source : isPanel == 'T' ? 'workorder'
									: 'workordercompletion',
							label : isPanel == 'T' ? 'WO' : 'WOC',
							type : ui.FieldType.SELECT
						});
						woc.updateDisplayType({
							displayType : ui.FieldDisplayType.DISABLED
						});
						// ------------------- Used for Issue ---------------//
						/*
						 * var isIssue = itemSublist.addField({ id :
						 * 'custpage_is_issue', //source :
						 * 'workordercompletion', label : 'Is Issue', type :
						 * ui.FieldType.CHECKBOX }); isIssue.updateDisplayType({
						 * displayType : ui.FieldDisplayType.HIDDEN });
						 */
						var isLastOpration = itemSublist.addField({
							id : 'custpage_is_last_op',
							// source : 'workordercompletion',
							label : 'Is Last Operation',
							type : ui.FieldType.CHECKBOX
						});
						isLastOpration.updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});
						var itemList = itemSublist.addField({
							id : 'custpage_itemlist',
							source : 'item',
							label : 'Issue Item List',
							type : ui.FieldType.TEXTAREA
						});
						itemList.updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});
						var sublistId = itemSublist.addField({
							id : 'custpage_sublistinternalid',
							label : 'SublistId',
							type : ui.FieldType.INTEGER
						});
						sublistId.updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});
						var lotRec = itemSublist.addField({
							id : 'custpage_lot_recid',
							label : 'LotRecId',
							type : ui.FieldType.INTEGER
						});
						lotRec.updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});
						var lots = itemSublist.addField({
							id : 'custpage_lots',
							label : 'Lots',
							type : ui.FieldType.TEXTAREA
						});
						lots.updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});

						form.clientScriptModulePath = './CNTM_CS_ClientAppWOC.js';
						// form.clientScriptFileId = 16154;
						context.response.writePage(form);
					} else {
						log.debug("in Post");
						log.debug("Parameters:-", context.request.parameters);
						log
								.debug(
										"sublist:-",
										context.request.parameters.custpage_item_sublistdata);
						var isPanel = context.request.parameters.custpage_hidden_panel_chkfld;
						log.debug('isPanel', isPanel);
						var lineCount = context.request.getLineCount({
							group : 'custpage_item_sublist'
						});
						log.debug('Total Lines ' + lineCount);
						var custId = context.request.parameters.custpage_hidden_id;
						var jobID = context.request.parameters.custpage_jobnumber_text;
						var totalData = [];
						var subArr = [];
						var panelSublistIds = [];
						var checkedLines=0;
						if (isPanel){
							for (var i = 0; i < lineCount; i++) {
								var createWocCheck = context.request
										.getSublistValue({
											group : 'custpage_item_sublist',
											name : 'custpage_createwoc',
											line : i
										});
								if (createWocCheck == 'T')
									checkedLines++;
							}
						}
						var selectLine=0;
						for (var int = 0; int < lineCount; int++) {
							var setSublist = {};
							var createWocCheck = context.request
									.getSublistValue({
										group : 'custpage_item_sublist',
										name : 'custpage_createwoc',
										line : int
									});
							var lotRecId = context.request.getSublistValue({
								group : 'custpage_item_sublist',
								name : 'custpage_lot_recid',
								line : int
							});
							var sublistIntenalId = context.request
									.getSublistValue({
										group : 'custpage_item_sublist',
										name : 'custpage_sublistinternalid',
										line : int
									});
							var panelLotSub = context.request.getSublistValue({
								group : 'custpage_item_sublist',
								name : 'custpage_panel_lot',
								line : int
							});
							var changeLotQty = context.request
									.getSublistValue({
										group : 'custpage_item_sublist',
										name : 'custpage_lot_qty',
										line : int

									});
							var scrapQtysub = context.request.getSublistValue({
								group : 'custpage_item_sublist',
								name : 'custpage_scrap_qty',

								line : int
							});
							var scrapDetailssub = context.request
									.getSublistValue({
										group : 'custpage_item_sublist',
										name : 'custpage_scrap_details',

										line : int
									});
							var scrapQtyCum = context.request.getSublistValue({
								group : 'custpage_item_sublist',
								name : 'custpage_scrap_qty_cum',

								line : int
							});
							if (scrapQtyCum)
								record
										.submitFields({
											type : 'customrecord_cntm_lot_creation',
											id : lotRecId,
											values : {
												custrecord_cntm_cumulative_scrap_qty : scrapQtyCum
											},
											options : {
												enableSourcing : false,
												ignoreMandatoryFields : true
											}
										});
							log.debug('createWocCheck', createWocCheck);
							subArr.push(sublistIntenalId);
							if (isPanel) {
								if (createWocCheck == 'T') {
								 panelSublistIds.push(sublistIntenalId);
									selectLine++;
									var item = context.request.parameters.custpage_display_namecode;
									var creteWo=context.request.parameters.custpage_create_panel_wo;
									var scriptTask = task.create({
										taskType : task.TaskType.MAP_REDUCE
									});
									scriptTask.scriptId = 'customscript_cntm_mr_additional_panel';
									// scriptTask.deploymentId =
									// 'customdeploy_cntm_mr_qt_item_import';
									scriptTask.params = {
										custscript_cntm_panel_no : panelLotSub,
										custscript_cntm_wo_no : jobID,
										custscript_cntm_scrapcum : scrapQtyCum,
										custscript_cntm_lotqty : changeLotQty,
										custscript_cntm_lastline : selectLine == checkedLines ? true
												: false,
										custscript_cntm_wo_item : item,
										custscript_cntm_no_of_lots : checkedLines,
										custscript_cntm_sublist_recid:sublistIntenalId,
										custscript_cntm_sublist_ids:panelSublistIds,
										custscript_cntm_createwo:creteWo=='T'?true:false
									};
									var scriptTaskId = scriptTask.submit();
									var status = task.checkStatus(scriptTaskId).status;
									log.debug(scriptTaskId);
									
								}
							} else {
								setSublist.createWocCheck = createWocCheck;
								setSublist.lotRecId = lotRecId;
								setSublist.sublistIntenalId = sublistIntenalId;
								
								setSublist.panelLotSub = panelLotSub;
								setSublist.changeLotQty = changeLotQty;
								setSublist.scrapQtysub = scrapQtysub;
								setSublist.scrapDetailssub = scrapDetailssub;
								setSublist.scrapQtyCum = scrapQtyCum;

								var qtyGoodSub = context.request
										.getSublistValue({
											group : 'custpage_item_sublist',
											name : 'custpage_qty_good',

											line : int
										});
								setSublist.qtyGoodSub = qtyGoodSub;
								var operationSub = context.request
										.getSublistValue({
											group : 'custpage_item_sublist',
											name : 'custpage_operation',

											line : int
										});
								setSublist.operationSub = operationSub;
								var machineSetupSub = context.request
										.getSublistValue({
											group : 'custpage_item_sublist',
											name : 'custpage_mach_setup',

											line : int
										});
								setSublist.machineSetupSub = machineSetupSub;
								var machineRunsub = context.request
										.getSublistValue({
											group : 'custpage_item_sublist',
											name : 'custpage_machrun',

											line : int
										});
								setSublist.machineRunsub = machineRunsub;
								var laborSetupSub = context.request
										.getSublistValue({
											group : 'custpage_item_sublist',
											name : 'custpage_labor_setup',

											line : int
										});
								setSublist.laborSetupSub = laborSetupSub;
								var laborRunSub = context.request
										.getSublistValue({
											group : 'custpage_item_sublist',
											name : 'custpage_labor_run',

											line : int
										});
								setSublist.laborRunSub = laborRunSub;
								var statusListWoc = context.request
										.getSublistValue({
											group : 'custpage_item_sublist',
											name : 'custpage_status',

											line : int
										});
								setSublist.statusListWoc = statusListWoc;
								var wocListsub = context.request
										.getSublistValue({
											group : 'custpage_item_sublist',
											name : 'custpage_item_woc',
											line : int
										});
								setSublist.wocListsub = wocListsub;
								// --------- used for issue -------------------
								/*
								 * var itemListsub =
								 * context.request.getSublistValue({ group :
								 * 'custpage_item_sublist', name :
								 * 'custpage_itemlist', line : int }); var lots =
								 * context.request.getSublistValue({ group :
								 * 'custpage_item_sublist', name :
								 * 'custpage_lots', line : int });
								 * 
								 * setSublist.lots = lots;
								 * setSublist.itemListsub = itemListsub;
								 */
								setSublist.custId = custId;
								setSublist.jobID = jobID;
								totalData.push(setSublist);
							}
						}

						log.debug("in Post", JSON.stringify(totalData));
						log.debug("in Post", custId);
						var headerObj = {
							name : 'Accept-Language',
							value : 'en-us'
						};
						var output = url
								.resolveScript({
									scriptId : 'customscript_cntm_backend_suiteletgetdat',
									deploymentId : 'customdeploy_cntm_backend_suiteletgetdat',
									returnExternalUrl : true
								});
						var response = https.post({
							url : output,
							body : JSON.stringify(totalData),
						});
						log.debug("resp", response);

						redirect.toSuitelet({
							scriptId : 'customscript_cntm_client_su',
							deploymentId : 'customdeploy_cntm_client_su',
							parameters : {
								'msgShow' : 'true',
								'isView' : 'true',
								'isPanel':isPanel?'T':'F',
								'woId' : jobID,
								'subArr' : JSON.stringify(subArr)
							}
						});
						// var output = url.resolveScript({
						// scriptId: 'customscript_cntm_client_su',
						// deploymentId: 'customdeploy_cntm_client_su',
						// returnExternalUrl: false
						// });
						// output+'&msgShow=true';
					}
				} catch (e) {
					log.error('Error in onReq', e);
				}
			}

			function validateData(data) {
				if (data != undefined && data != null && data != '') {
					return true;
				} else {
					return false;
				}
			}

			return {
				onRequest : onRequest
			};

		});
