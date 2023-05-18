/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(
		[ 'N/currentRecord', 'N/url', 'N/search', 'N/runtime', 'N/record',
				'N/https', 'N/ui/message' ],

		function(currentRecord, url, search, runtime, record, https, message) {
			var mainUrl = "";
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
			var lineWiseMap = {};
			var lineWiseMapLot = {};
			var globalMapQty = {};
			var totallinecount = 0;
			function createWoc(recordId) {
				if (recordId) {
					// alert('recordId '+recordId);

					// var url = nlapiResolveURL('SUITELET',
					// 'customscript_cntm_print_final_invoice',
					// 'customdeploy_cntm_print_final_invoice')+'&recId='+recordId;
					// window.open(url);
					var output = url.resolveScript({
						scriptId : 'customscript_cntm_client_su',
						deploymentId : 'customdeploy_cntm_client_su',
						returnExternalUrl : false
					});
					window.open(output + '&recId=' + recordId);
				}
			}
			function pageInit(scriptContext) {
				if (window.onbeforeunload) {
					window.onbeforeunload = function() {
						null;
					}
				}
				var isPanel = getParameterFromURL('isPanel') == 'T'
						|| getParameterFromURL('isPanel') == 'true' ? true
						: false;
				console.log('sesnVal: '
						+ sessionStorage.getItem("checkedLines"));
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
							var myMsg = message
									.create({
										title : isPanel == true ? 'Pnel WO'
												: 'RDA WOC',
										message : (isPanel == true ? 'Panel WO Creation'
												: 'WOC')
												+ ' Process Is Initiated Successfully',
										type : message.Type.CONFIRMATION
									});

							// will disappear after 5s
							myMsg.show({
								duration : 5000
							});
							mainUrl = mainUrl.replace('&msgShow=true', '');
							setTimeout(function() {
								// window.location.assign(mainUrl);
							}, 2500);

						}

					}

				}
				setParamersCheck1("&delMsg=", "delMsg")
				setParamersCheck1("&editMsg=", "editMsg")
				function setParamersCheck1(param, mainparam) {
					mainUrl = window.location.href;
					var obj = new URL(mainUrl);
					if (mainUrl.includes(param)) {
						var value = obj.searchParams.get(mainparam);
						// debugger;
						value = value.trim();
						value = value.replace(/\s+/g, " ");
						if (value == "true") {
							var msg = 'Completion Deleted Successfully';
							if (mainparam == 'editMsg')
								msg = 'Completion Edited Successfully';
							var myMsg = message.create({
								title : 'RDA WOC',
								message : msg,
								type : message.Type.CONFIRMATION
							});

							// will disappear after 5s
							myMsg.show({
								duration : 7000
							});
							mainUrl = mainUrl.replace('&msgShow=true', '');
							setTimeout(function() {
								// window.location.assign(mainUrl);
							}, 2500);

						}

					}

				}
				var woId = getParameterFromURL('woId');
				var isView = getParameterFromURL('isView');

				if (isView == 'true') {
					scriptContext.currentRecord.setValue({
						fieldId : "custpage_jobnumber_text",
						value : woId,
						ignoreFieldChange : true
					});
					setFields(woId, scriptContext, isView, false);
				}
				// alert('triggred')
				// ----------------- used for Issue
				// ----------------------------------
				var isPopup = scriptContext.currentRecord.getValue({
					fieldId : 'custpage_check_fld'
				});
				var isChildPopup = scriptContext.currentRecord.getValue({
					fieldId : 'custpage_hidden_checkfieldid'
				});
				var isPanelScreen = scriptContext.currentRecord.getValue({
					fieldId : 'custpage_hidden_panel_chkfld'
				});
				if (isPanel) {
					// var woId = getParameterFromURL('wo');
					var wo = scriptContext.currentRecord.getValue({
						fieldId : "custpage_jobnumber_text",
					/*
					 * value : woId, ignoreFieldChange : true
					 */
					});
					setFields(isView == 'true' ? woId : wo, scriptContext,
							isView, isPanel)
				}
				if (isPopup) {
					var availQtyMap = getParameterFromURL('map');/*
																	 * window.opener.require( [
																	 * '/SuiteScripts/CNTM_CS_ClientAppWOC' ],
																	 * function(
																	 * myModule) {
																	 * 
																	 * myModule.getMainQtyMap();
																	 * 
																	 * });
																	 */
					// alert(availQtyMap);
					scriptContext.currentRecord.setValue({
						fieldId : 'custpage_av_qty_map_fld',
						value : availQtyMap
					});
				}
				if (isChildPopup) {
					var availQtyMap = getParameterFromURL('map') ? JSON
							.parse(getParameterFromURL('map')) : {};/*
																	 * window.opener.require( [
																	 * '/SuiteScripts/CNTM_CS_ClientAppWOC' ],
																	 * function(
																	 * myModule) {
																	 * 
																	 * myModule.getQtyMap();
																	 * 
																	 * });
																	 */
					// alert(availQtyMap);
					var lineCount = scriptContext.currentRecord.getLineCount({
						sublistId : 'custpage_lotnumberitem'
					});
					for (var i = 0; i < lineCount; i++) {
						var lot = scriptContext.currentRecord.getSublistValue({
							sublistId : 'custpage_lotnumberitem',
							fieldId : 'custpage_inventorynumber',
							line : i
						});

						var bin = scriptContext.currentRecord.getSublistValue({
							sublistId : 'custpage_lotnumberitem',
							fieldId : 'custpage_bin',
							line : i
						});
						if (lot && lot in availQtyMap) {
							if (bin in availQtyMap[lot]) {
								scriptContext.currentRecord.selectLine({
									sublistId : 'custpage_lotnumberitem',
									line : i
								})
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_lotnumberitem',
											fieldId : 'custpage_quantity_avail',
											value : parseFloat(availQtyMap[lot][bin].aQty),

										});
								scriptContext.currentRecord.commitLine({
									sublistId : 'custpage_lotnumberitem'
								});
							}
						} else if ('Bin__' + bin in availQtyMap) {
							scriptContext.currentRecord.selectLine({
								sublistId : 'custpage_lotnumberitem',
								line : i
							})
							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : 'custpage_lotnumberitem',
										fieldId : 'custpage_quantity_avail',
										value : parseFloat(availQtyMap['Bin__'
												+ bin].aQty),

									});
							scriptContext.currentRecord.commitLine({
								sublistId : 'custpage_lotnumberitem'
							});
						}
					}
				}
				// ------------------------------------------------------------------------
			}
			function getParameterFromURL(param) {
				var query = window.location.search.substring(1);
				var vars = query.split("&");
				for (var i = 0; i < vars.length; i++) {
					var pair = vars[i].split("=");
					// alert(pair);
					if (pair[0] == param) {
						return decodeURIComponent(pair[1]);
					}
				}
				return (false);
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
			/*
			 * function getQtyMap(panelLot) { return globalMapQty[panelLot]; }
			 */
			function setQtyMap(panelLot, scarpQty) {
				if (globalMapQty.hasOwnProperty(panelLot)) {
					// debugger;
					var temp = globalMapQty[panelLot];
					console.log("fisrt", temp)
					// temp=temp*1;
					temp = temp * 1 + scarpQty * 1;
					console.log("finaltoadd", temp)
					globalMapQty[panelLot] = temp;
				} else {
					console.log("initial", scarpQty)
					globalMapQty[panelLot] = scarpQty * 1;
				}

			}
			function setFields(woId, scriptContext, isView, isPanel) {
				var output = url.resolveScript({
					scriptId : 'customscript_cntm_backend_suiteletgetdat',
					deploymentId : 'customdeploy_cntm_backend_suiteletgetdat',
					returnExternalUrl : false
				});
				output = output + "&jobId=" + woId
				if (isView == 'true') {
					var subArr = getParameterFromURL('subArr');
					output = output + "&isView=" + isView + "&subArr=" + subArr;
				}
				var response = https.get({
					url : output
				});
				try {
					// debugger;
					var finalData = JSON.parse(response.body);
					console.log(response.body);
					if (finalData.length > 0) {
						scriptContext.currentRecord.setValue({
							fieldId : "custpage_customer_text",
							value : finalData[0].customer,
							ignoreFieldChange : true
						});
						// scriptContext.currentRecord.setValue({fieldId:"custpage_receipt_date",value:"",ignoreFieldChange:true});
						scriptContext.currentRecord.setValue({
							fieldId : "custpage_customerpartnumber_text",
							value : finalData[0].custPartNo,
							ignoreFieldChange : true
						});
						scriptContext.currentRecord.setValue({
							fieldId : "custpage_display_namecode",
							value : finalData[0].assPartNO,
							ignoreFieldChange : true
						});
						scriptContext.currentRecord.setValue({
							fieldId : "custpage_job",
							value : finalData[0].jobNo,
							ignoreFieldChange : true
						});
						scriptContext.currentRecord.setValue({
							fieldId : "custpage_woqty",
							value : finalData[0].woQty,
							ignoreFieldChange : true
						});
						scriptContext.currentRecord.setValue({
							fieldId : "custpage_no_of_panel",
							value : finalData[0].noOfPanel,
							ignoreFieldChange : true
						});
						scriptContext.currentRecord.setValue({
							fieldId : "custpage_duedate",
							value : finalData[0].woDueDate,
							ignoreFieldChange : true
						});
						scriptContext.currentRecord.setValue({
							fieldId : "custpage_operator_id",
							value : finalData[0].opId,
							ignoreFieldChange : true
						});
						scriptContext.currentRecord.setValue({
							fieldId : "custpage_hidden_id",
							value : finalData[0].headerID,
							ignoreFieldChange : true
						});
						// debugger;
						for (var i = 0; i < finalData.length; i++) {
							totallinecount++;
							scriptContext.currentRecord.selectLine({
								sublistId : 'custpage_item_sublist',
								line : i
							});
							// debugger;
							console.log('finalData[i].wocCheck '
									+ finalData[i].wocCheck);
							var wocCheck = finalData[i].wocCheck == 'Yes'
									|| finalData[i].wocCheck == 'true'
									|| finalData[i].wocCheck == true
									|| finalData[i].wocCheck == "T" ? 'T' : 'F';

							console.log('wocCheck ' + wocCheck);
							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : 'custpage_createwoc',
										fieldId : 'custpage_createwoc',
										value : wocCheck
									});
							setQtyMap(finalData[i].panelLot,
									finalData[i].scrapQty);
							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : 'custpage_item_sublist',
										fieldId : 'custpage_panel_lot',
										value : finalData[i].panelLot
									});
							// debugger;
							lineWiseMap[i] = finalData[i].scrapQty;
							lineWiseMapLot[i] = finalData[i].panelLot;
							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : 'custpage_item_sublist',
										fieldId : 'custpage_lot_qty',

										value : finalData[i].wocQTy
									// totalLotQ
									});
							if (isView == 'true')
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_item_sublist',
											fieldId : 'custpage_scrap_qty',
											value : finalData[i].scrapQty,
											ignoreFieldChange : true
										});

							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : 'custpage_item_sublist',
										fieldId : 'custpage_scrap_details',

										value : finalData[i].scrapReason
									});
							var lotRecFieldLookUp = search
									.lookupFields({
										type : 'customrecord_cntm_lot_creation',
										id : finalData[i].lotRecID,
										columns : [ 'custrecord_cntm_cumulative_scrap_qty' ]
									});
							console
									.log(finalData[i].lotRecID
											+ ','
											+ lotRecFieldLookUp.custrecord_cntm_cumulative_scrap_qty);
							var cumQty = lotRecFieldLookUp.custrecord_cntm_cumulative_scrap_qty ? lotRecFieldLookUp.custrecord_cntm_cumulative_scrap_qty
									: 0
							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : 'custpage_item_sublist',
										fieldId : 'custpage_scrap_qty_cum',
										value : finalData[i].cumQty
									});
							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : 'custpage_item_sublist',
										fieldId : 'custpage_qty_good',

										value : parseFloat(finalData[i].wocQTy)
										- parseFloat(cumQty)/*isView == 'true' ? parseFloat(finalData[i].wocQTy)
												- parseFloat(cumQty)
												: parseFloat(finalData[i].qtyGood)
														- parseFloat(cumQty)*/
									});
							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : 'custpage_item_sublist',
										fieldId : 'custpage_operation',
										value : finalData[i].operation
									});
							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : 'custpage_item_sublist',
										fieldId : 'custpage_mach_setup',
										value : isPanel == true
												|| isPanel == 'true' ? 0
												: finalData[i].mcSetup
									});
							// scriptContext.currentRecord.setSublistValue({
							// sublistId: 'custpage_components_grp',
							// fieldId: 'custpage_createwoc',
							// line: i,
							// value: finalData[i].
							// });
							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : 'custpage_item_sublist',
										fieldId : 'custpage_machrun',

										value : isPanel == true
												|| isPanel == 'true' ? 0
												: finalData[i].mcRuntime
									});
							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : 'custpage_item_sublist',
										fieldId : 'custpage_labor_setup',

										value : isPanel == true
												|| isPanel == 'true' ? 0
												: finalData[i].laborSetuptime
									});
							// scriptContext.currentRecord.setSublistValue({
							// sublistId: 'custpage_components_grp',
							// fieldId: 'custpage_createwoc',
							// line: i,
							// value: finalData[i].
							// });
							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : 'custpage_item_sublist',
										fieldId : 'custpage_labor_run',

										value : isPanel == true
												|| isPanel == 'true' ? 0
												: finalData[i].laborRuntime
									});
							console.log("stauts", finalData[i].status);
							var status = finalData[i].status;
							if (isPanel == true || isPanel == 'true') {
								var sublistFieldLookUp = search
										.lookupFields({
											type : 'customrecord_cntm_clientappsublist',
											id : finalData[i].sublistID,
											columns : [ 'custrecord_cntm_pnel_wo_status' ]
										});
								// alert(JSON.stringify(sublistFieldLookUp.custrecord_cntm_pnel_wo_status));
								if (sublistFieldLookUp.custrecord_cntm_pnel_wo_status[0])
									status = sublistFieldLookUp.custrecord_cntm_pnel_wo_status[0].value;
								// alert(status);
							}
							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : 'custpage_item_sublist',
										fieldId : 'custpage_status',
										value : status
									});
							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : 'custpage_item_sublist',
										fieldId : 'custpage_sublistinternalid',
										value : finalData[i].sublistID
									});
							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : 'custpage_item_sublist',
										fieldId : 'custpage_lot_recid',
										value : finalData[i].lotRecID
									});
							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : 'custpage_item_sublist',
										fieldId : 'custpage_itemlist',
										value : finalData[i].itemListSub
									});
							var isIssue = finalData[i].isIssue == 'Yes'
									|| finalData[i].isIssue == 'true'
									|| finalData[i].isIssue == true ? true
									: false;
							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : 'custpage_item_sublist',
										fieldId : 'custpage_is_issue',
										value : isIssue
									});
							var isLastOp = finalData[i].isLastOp == 'Yes'
									|| finalData[i].isLastOp == 'true'
									|| finalData[i].isLastOp == true ? true
									: false;
							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : 'custpage_item_sublist',
										fieldId : 'custpage_is_last_op',
										value : isLastOp
									});
							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : 'custpage_item_sublist',
										fieldId : 'custpage_item_woc',
										value : isPanel == true
												|| isPanel == 'true' ? finalData[i].panelWOId
												: finalData[i].wocId
									});
							scriptContext.currentRecord.commitLine({
								sublistId : 'custpage_item_sublist'
							});
						}

					}
				} catch (e) {
				}
			}
			function fieldChanged(scriptContext) {
				if (scriptContext.fieldId == 'custpage_wo_scanner_hdn') {
					var woText = scriptContext.currentRecord
							.getValue("custpage_wo_scanner_hdn");
					alert(wotext);
					var workorderSearchObj = search.create({
						type : "workorder",
						filters : [ [ "type", "anyof", "WorkOrd" ], "AND",
								[ "numbertext", "is", "WO" ] ],
						columns : [ "tranid", ]
					});
					var searchResultCount = workorderSearchObj.runPaged().count;
					log.debug("workorderSearchObj result count",
							searchResultCount);
					workorderSearchObj.run().each(function(result) {
						// .run().each has a limit of 4,000 results
						scriptContext.currentRecord.setValue({
							fieldId : "custpage_jobnumber_text",
							value : result.id
						});
						return false;
					});

				}
				if (scriptContext.fieldId == 'custpage_jobnumber_text') {
					var woId = scriptContext.currentRecord
							.getValue("custpage_jobnumber_text");
					if (woId) {
						var customrecord_cntm_clientapp_headerSearchObj = search
								.create({
									type : "customrecord_cntm_clientapp_header",
									filters : [
											[
													"custrecord_cntm_cah_jobnumber.createdfrom",
													"anyof", woId ],
											"AND",
											[
													"custrecord_cntm_cso_parentrec.custrecord_cntm_cso_status",
													"noneof", "4" ],
											"AND",
											[
													"custrecord_cntm_cso_parentrec.custrecord_cntm_last_operation",
													"is", "T" ] ],
									columns : [
											"custrecord_cntm_cah_assemblyitem",
											search
													.createColumn({
														name : "custrecord_cntm_cso_createwo_completion",
														join : "CUSTRECORD_CNTM_CSO_PARENTREC"
													}),
											search
													.createColumn({
														name : "custrecord_cntm_cso_wocnumber",
														join : "CUSTRECORD_CNTM_CSO_PARENTREC"
													}),
											search
													.createColumn({
														name : "custrecord_cntm_cso_woc_quantity",
														join : "CUSTRECORD_CNTM_CSO_PARENTREC"
													}),
											search
													.createColumn({
														name : "custrecord_cntm_cso_status",
														join : "CUSTRECORD_CNTM_CSO_PARENTREC"
													}),
											search
													.createColumn({
														name : "custrecord_cntm_cso_scarpreason",
														join : "CUSTRECORD_CNTM_CSO_PARENTREC"
													}),
											search
													.createColumn({
														name : "custrecord_cntm_cso_scrap_quantity",
														join : "CUSTRECORD_CNTM_CSO_PARENTREC"
													}),
											search
													.createColumn({
														name : "custrecord_cntm_cso_quantity_good",
														join : "CUSTRECORD_CNTM_CSO_PARENTREC"
													}),
											search
													.createColumn({
														name : "custrecord_cntm_cso_pannellot",
														join : "CUSTRECORD_CNTM_CSO_PARENTREC"
													}),
											search
													.createColumn({
														name : "custrecord_cntm_cso_operaton",
														join : "CUSTRECORD_CNTM_CSO_PARENTREC"
													}),
											search
													.createColumn({
														name : "custrecord_cntm_seq_no",
														join : "CUSTRECORD_CNTM_CSO_PARENTREC",
														sort : search.Sort.ASC
													}),
											search
													.createColumn({
														name : "custrecord_cntm_cso_machinesetuptime",
														join : "CUSTRECORD_CNTM_CSO_PARENTREC"
													}),
											search
													.createColumn({
														name : "custrecord_cntm_cso_machinerunetime",
														join : "CUSTRECORD_CNTM_CSO_PARENTREC"
													}),
											search
													.createColumn({
														name : "custrecord_cntm_cso_laborsetuptime",
														join : "CUSTRECORD_CNTM_CSO_PARENTREC"
													}),
											search
													.createColumn({
														name : "custrecord_cntm_cso_laborruntime",
														join : "CUSTRECORD_CNTM_CSO_PARENTREC"
													}),
											"custrecord_cntm_cah_jobnumber",
											"internalid",
											search
													.createColumn({
														name : "internalid",
														join : "CUSTRECORD_CNTM_CSO_PARENTREC"
													}) ]
								});
						var searchResultCount = customrecord_cntm_clientapp_headerSearchObj
								.runPaged().count;
						log
								.debug(
										"customrecord_cntm_clientapp_headerSearchObj result count",
										searchResultCount);
						if (searchResultCount == 0){
							var output = url
									.resolveScript({
										scriptId : 'customscript_cntm_sl_clientapp_validatio',
										deploymentId : 'customdeploy_cntm_sl_clientapp_validatio',
										returnExternalUrl : false
									});
							output = output + "&jobId=" + woId

							var response = https.get({
								url : output
							});
							log.debug('response-', response.body);
							if (response.body == 'true')
								setFields(woId, scriptContext, 'false', false);
							else {

								alert('The completions for previous operations are in process. Please try in some time.');
								scriptContext.currentRecord.setValue({
									fieldId : "custpage_jobnumber_text",
									value : ''
								});

							}
						}
						else {
							alert('Selected work order has Sub-assemblies work order(s) to be completed. Please create Work Order Completion for Sub-assemblies and try again.');
							scriptContext.currentRecord.setValue({
								fieldId : "custpage_jobnumber_text",
								value : ''
							});
						}
					}
				}

				if (scriptContext.sublistId == 'custpage_item_sublist'
						&& scriptContext.fieldId == 'custpage_scrap_qty') {
					var scrapQty = scriptContext.currentRecord
							.getCurrentSublistValue({
								sublistId : 'custpage_item_sublist',
								fieldId : 'custpage_scrap_qty'
							});

					var panelLotQty = scriptContext.currentRecord
							.getCurrentSublistValue({
								sublistId : 'custpage_item_sublist',
								fieldId : 'custpage_lot_qty'
							});
					if (!scrapQty || scrapQty > panelLotQty) {
						if (scrapQty > panelLotQty)
							alert('Scrap Quantity can not be greater than Lot Quantity.');
						scrapQty = 0;
						scriptContext.currentRecord.setCurrentSublistValue({
							sublistId : 'custpage_item_sublist',
							fieldId : 'custpage_scrap_qty',
							value : scrapQty,
							ignoreFieldChange : true
						});
					}
					var lotRec = scriptContext.currentRecord
							.getCurrentSublistValue({
								sublistId : 'custpage_item_sublist',
								fieldId : 'custpage_lot_recid'
							});
					var lotRecFieldLookUp = search.lookupFields({
						type : 'customrecord_cntm_lot_creation',
						id : lotRec,
						columns : [ 'custrecord_cntm_cumulative_scrap_qty' ]
					});
					var cumQty = 0;
					if (lotRecFieldLookUp.custrecord_cntm_cumulative_scrap_qty)
						cumQty = lotRecFieldLookUp.custrecord_cntm_cumulative_scrap_qty;
					cumQty = parseInt(cumQty) + parseInt(scrapQty);
					scriptContext.currentRecord.setCurrentSublistValue({
						sublistId : 'custpage_item_sublist',
						fieldId : 'custpage_scrap_qty_cum',
						value : cumQty,
						ignoreFieldChange : true
					});
					scriptContext.currentRecord.setCurrentSublistValue({
						sublistId : 'custpage_item_sublist',
						fieldId : 'custpage_qty_good',
						value : parseInt(panelLotQty) - parseInt(cumQty),
						ignoreFieldChange : true
					});
				}
				if (scriptContext.sublistId == 'custpage_completion_sublist'
						&& scriptContext.fieldId == 'custpage_scrap') {
					var scrapQty = scriptContext.currentRecord
							.getCurrentSublistValue({
								sublistId : 'custpage_completion_sublist',
								fieldId : 'custpage_scrap'
							});
					var origScrapQty = scriptContext.currentRecord
							.getCurrentSublistValue({
								sublistId : 'custpage_completion_sublist',
								fieldId : 'custpage_scrap_origin'
							});
					if (scrapQty < 0) {
						alert('Scrap quantity cannot be negative. Please enter positive number.');
						scriptContext.currentRecord.setCurrentSublistValue({
							sublistId : 'custpage_completion_sublist',
							fieldId : 'custpage_scrap',
							value : '',
							ignoreFieldChange : true
						});
					} else {

						var currIndex = scriptContext.currentRecord
								.getCurrentSublistIndex({
									sublistId : 'custpage_completion_sublist'
								});
						var panelLotQty = scriptContext.currentRecord
								.getSublistValue({
									sublistId : 'custpage_completion_sublist',
									fieldId : 'custpage_wo_qty',
									line : currIndex
								});

						if (scrapQty > panelLotQty) {
							alert('Scrap Quantity can not be greater than Lot Quantity.');
							scrapQty = origScrapQty;
							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : 'custpage_completion_sublist',
										fieldId : 'custpage_scrap',
										value : scrapQty,
									// ignoreFieldChange : true
									});
						} else {
							/*
							 * var lotRec = scriptContext.currentRecord
							 * .getCurrentSublistValue({ sublistId :
							 * 'custpage_completion_sublist', fieldId :
							 * 'custpage_lotrec' });
							 */
							var cumQty = scriptContext.currentRecord
									.getSublistValue({
										sublistId : 'custpage_completion_sublist',
										fieldId : 'custpage_cumscrap_origin',
										line : currIndex
									});
							/*
							 * var lotRecFieldLookUp = search.lookupFields({
							 * type : 'customrecord_cntm_lot_creation', id :
							 * lotRec, columns : [
							 * 'custrecord_cntm_cumulative_scrap_qty' ] }); var
							 * cumQty = 0; if
							 * (lotRecFieldLookUp.custrecord_cntm_cumulative_scrap_qty)
							 * cumQty =
							 * lotRecFieldLookUp.custrecord_cntm_cumulative_scrap_qty;
							 */
							cumQty = cumQty ? cumQty : 0;
							// alert(cumQty);
							var diff = origScrapQty - scrapQty;
							diff = Math.abs(diff);
							if (origScrapQty > scrapQty)
								cumQty = parseInt(cumQty) - (diff);
							else if (origScrapQty < scrapQty)
								cumQty = parseInt(cumQty) + (diff);
							// alert('_'+cumQty);
							if (cumQty > panelLotQty) {
								alert('Cumulitive Scrap Quantity can not be greater than Lot Quantity.');
								scrapQty = origScrapQty;
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_completion_sublist',
											fieldId : 'custpage_scrap',
											value : scrapQty,
										// ignoreFieldChange : true
										});
							} else {
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_completion_sublist',
											fieldId : 'custpage_cum_scrap',
											value : cumQty,
											// line:currIndex,
											ignoreFieldChange : true
										});
								// alert(scriptContext.currentRecord.getValue({fieldId:'custpage_lot_cumqty_map'}));
								var cumQtMap = JSON
										.parse(scriptContext.currentRecord
												.getValue({
													fieldId : 'custpage_lot_cumqty_map'
												}));

								var panelLot = scriptContext.currentRecord
										.getSublistValue({
											sublistId : 'custpage_completion_sublist',
											fieldId : 'custpage_panel_no',
											line : currIndex
										});
								cumQtMap[panelLot] = cumQty;
								// alert(cumQtMap[panelLot]);
								scriptContext.currentRecord
										.setCurrentSublistValue({
											sublistId : 'custpage_completion_sublist',
											fieldId : 'custpage_good_qty',
											value : parseInt(panelLotQty)
													- parseInt(cumQty),
											ignoreFieldChange : true
										});
								scriptContext.currentRecord.setValue({
									fieldId : 'custpage_lot_cumqty_map',
									value : JSON.stringify(cumQtMap)
								});
								var lineCount = scriptContext.currentRecord
										.getLineCount({
											sublistId : 'custpage_completion_sublist'
										});
								for (var i = 0; i < lineCount; i++) {
									if (i != currIndex) {
										var lot = scriptContext.currentRecord
												.getSublistValue({
													sublistId : 'custpage_completion_sublist',
													fieldId : 'custpage_panel_no',
													line : i
												});
										if (lot == panelLot) {
											scriptContext.currentRecord
													.selectLine({
														sublistId : 'custpage_completion_sublist',
														line : i
													});
											scriptContext.currentRecord
													.setCurrentSublistValue({
														sublistId : 'custpage_completion_sublist',
														fieldId : 'custpage_cum_scrap',
														value : cumQty,
														// line:i,
														ignoreFieldChange : true
													});
											scriptContext.currentRecord
													.commitLine({
														sublistId : 'custpage_completion_sublist'
													});
										}
									}
								}
							}
						}
					}
				}

				if (scriptContext.sublistId == 'custpage_item_sublist'
						&& scriptContext.fieldId == 'custpage_select_scrap_details') {
					var chk = scriptContext.currentRecord
							.getCurrentSublistValue({
								sublistId : "custpage_item_sublist",
								fieldId : "custpage_select_scrap_details"
							});
					if (chk == true || chk == 'T') {
						var currIndex = scriptContext.currentRecord
								.getCurrentSublistIndex({
									sublistId : 'custpage_item_sublist'
								});
						var reasons = scriptContext.currentRecord
								.getCurrentSublistValue({
									sublistId : "custpage_item_sublist",
									fieldId : "custpage_scrap_details_hdn"
								});
						var qty = scriptContext.currentRecord
								.getCurrentSublistValue({
									sublistId : "custpage_item_sublist",
									fieldId : "custpage_scrap_qty"
								});
						if (!qty || qty == 0) {
							alert('Please enter Scrap Quantity to enter Scrap Reason.');
							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : "custpage_item_sublist",
										fieldId : "custpage_select_scrap_details",
										value : false
									});
						} else {
							var sublistId = scriptContext.currentRecord
									.getCurrentSublistValue({
										sublistId : "custpage_item_sublist",
										fieldId : "custpage_sublistinternalid"
									});
							var output = url
									.resolveScript({
										scriptId : 'customscript_cntm_sl_scrap_reason',
										deploymentId : 'customdeploy_cntm_sl_scrap_reason',
										returnExternalUrl : false
									});
							// if (reasons)
							output = output + "&reasons=" + reasons + "&qty="
									+ qty + "&sublistId=" + sublistId
									+ '&line=' + currIndex;

							window.open(output, "_blank", "top=1,left=1")
									.resizeTo(980, 530);
						}
					}
				}
				if (scriptContext.sublistId == 'custpage_completion_sublist'
						&& scriptContext.fieldId == 'custpage_scrap_rsn_chk') {
					var chk = scriptContext.currentRecord
							.getCurrentSublistValue({
								sublistId : "custpage_completion_sublist",
								fieldId : "custpage_scrap_rsn_chk"
							});
					if (chk == true || chk == 'T') {
						var currIndex = scriptContext.currentRecord
								.getCurrentSublistIndex({
									sublistId : 'custpage_completion_sublist'
								});
						var reasons = scriptContext.currentRecord
								.getCurrentSublistValue({
									sublistId : "custpage_completion_sublist",
									fieldId : "custpage_scrap_reason_hdn"
								});
						var qty = scriptContext.currentRecord
								.getCurrentSublistValue({
									sublistId : "custpage_completion_sublist",
									fieldId : "custpage_scrap"
								});
						// alert(qty);
						if (!qty || qty == 0) {
							alert('Please enter Scrap Quantity to enter Scrap Reason.');
							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : "custpage_completion_sublist",
										fieldId : "custpage_scrap_rsn_chk",
										value : false
									});
						} else {
							var sublistId = scriptContext.currentRecord
									.getCurrentSublistValue({
										sublistId : "custpage_completion_sublist",
										fieldId : "custpage_id"
									});
							var output = url
									.resolveScript({
										scriptId : 'customscript_cntm_sl_scrap_reason',
										deploymentId : 'customdeploy_cntm_sl_scrap_reason',
										returnExternalUrl : false
									});
							// if (reasons)
							output = output + "&reasons=" + reasons + "&qty="
									+ qty + "&sublistId=" + sublistId
									+ "&isedit=T" + '&line=' + currIndex;

							window.open(output, "_blank", "top=1,left=1")
									.resizeTo(980, 530);
						}
					}
				}
				if (scriptContext.sublistId == 'custpage_scrap_reasons'
						&& scriptContext.fieldId == 'custpage_scrap_qty') {
					var totalScrap = scriptContext.currentRecord.getValue({
						fieldId : 'custpage_tot_scrap_qty'
					});
					var scrap = scriptContext.currentRecord
							.getCurrentSublistValue({
								sublistId : "custpage_scrap_reasons",
								fieldId : "custpage_scrap_qty"
							});
					// alert('totalScrap: '+totalScrap+' scrap: '+scrap);
					if (parseInt(scrap) > parseInt(totalScrap)) {
						alert('Scrap Reason quantity must not be greater than '
								+ totalScrap);

						scriptContext.currentRecord.setCurrentSublistValue({
							sublistId : "custpage_scrap_reasons",
							fieldId : "custpage_scrap_qty",
							value : '',
							ignoreFieldChange : true
						});
					} else {
						var qtyselected = parseInt(scrap);
						var currIndex = scriptContext.currentRecord
								.getCurrentSublistIndex({
									sublistId : 'custpage_scrap_reasons'
								});
						// alert(currIndex);
						var lineCount = scriptContext.currentRecord
								.getLineCount({
									sublistId : 'custpage_scrap_reasons'
								});
						for (var i = 0; i < lineCount; i++) {
							if (i != currIndex) {
								var selectedQty = scriptContext.currentRecord
										.getSublistValue({
											sublistId : "custpage_scrap_reasons",
											fieldId : "custpage_scrap_qty",
											line : i
										});
								// alert('selectedQty-'+selectedQty);
								if (selectedQty != "") {
									qtyselected += parseInt(selectedQty);
								}
							}
						}
						// alert(qtyselected+'/'+totalScrap);
						if (parseInt(qtyselected) > parseInt(totalScrap)) {
							alert('Total scrap reason quantity can not be greater than '
									+ totalScrap);

							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : "custpage_scrap_reasons",
										fieldId : "custpage_scrap_qty",
										value : '',
										ignoreFieldChange : true
									});
						}
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
				if (scriptContext.sublistId == 'custpage_item_sublist') {
					var isWOC = scriptContext.currentRecord
							.getCurrentSublistValue({
								sublistId : scriptContext.sublistId,
								fieldId : 'custpage_createwoc'
							});
					if (isWOC == true) {
						var scrap = scriptContext.currentRecord
								.getCurrentSublistValue({
									sublistId : scriptContext.sublistId,
									fieldId : 'custpage_scrap_qty'
								});
						if (scrap && scrap > 0) {
							var scrapDetls = scriptContext.currentRecord
									.getCurrentSublistValue({
										sublistId : scriptContext.sublistId,
										fieldId : 'custpage_scrap_details_hdn'
									});
							var scrapDetlsChk = scriptContext.currentRecord
									.getCurrentSublistValue({
										sublistId : scriptContext.sublistId,
										fieldId : 'custpage_select_scrap_details'
									});
							if (scrapDetlsChk == false) {
								alert('Please select Scrap Reason for entered scrap quantity.');
								return false;
							}
						}
					}
				}
				if (scriptContext.sublistId == 'custpage_completion_sublist') {
					var isWOC = scriptContext.currentRecord
							.getCurrentSublistValue({
								sublistId : scriptContext.sublistId,
								fieldId : 'custpage_selectwoc'
							});
					if (isWOC == true) {

						var scrap = scriptContext.currentRecord
								.getCurrentSublistValue({
									sublistId : scriptContext.sublistId,
									fieldId : 'custpage_scrap'
								});
						var scrapOrig = scriptContext.currentRecord
								.getCurrentSublistValue({
									sublistId : scriptContext.sublistId,
									fieldId : 'custpage_scrap_origin'
								});
						if (scrap > 0 && scrap != scrapOrig) {
							var scrapDetls = scriptContext.currentRecord
									.getCurrentSublistValue({
										sublistId : scriptContext.sublistId,
										fieldId : 'custpage_scrap_reason'
									});
							var scrapDetlsChk = scriptContext.currentRecord
									.getCurrentSublistValue({
										sublistId : scriptContext.sublistId,
										fieldId : 'custpage_scrap_rsn_chk'
									});
							if (scrapDetlsChk == false) {
								alert('Please select Scrap Reason for entered scrap quantity.');
								return false;
							}
						}
					}
				}
				return true;
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
				// alert('save');
				var deletePopup = scriptContext.currentRecord.getValue({
					fieldId : 'custpage_chkfld'
				});
				if (window.opener != null && !(window.opener.closed)) {
					// alert('win');
					var scrapPopup = scriptContext.currentRecord.getValue({
						fieldId : 'custpage_hidden'
					});

					// alert(deletePopup);
					if (scrapPopup) {

						var subId = scriptContext.currentRecord.getValue({
							fieldId : 'custpage_scrap_subid'
						});
						var origLine = scriptContext.currentRecord.getValue({
							fieldId : 'custpage_scrap_orig_line'
						});
						var isEdit = scriptContext.currentRecord.getValue({
							fieldId : 'custpage_isedit'
						});
						var editRecArr = [];
						var resnArr = [];
						var linecount = scriptContext.currentRecord
								.getLineCount({
									sublistId : 'custpage_scrap_reasons'
								});
						if (linecount > 0) {
							for (var k = 0; k < linecount; k++) {
								var reason = scriptContext.currentRecord
										.getSublistValue({
											sublistId : "custpage_scrap_reasons",
											fieldId : "custpage_scrap_reason",
											line : k
										});
								var qty = scriptContext.currentRecord
										.getSublistValue({
											sublistId : "custpage_scrap_reasons",
											fieldId : "custpage_scrap_qty",
											line : k
										});
								var resnMap = {};
								resnMap.reason = reason;
								resnMap.qty = qty;
								resnArr.push(resnMap);

							}
						}
						window.opener.require(
								[ '/SuiteScripts/CNTM_CS_ClientAppWOC' ],
								function(myModule) {
									myModule.setReason(JSON.stringify(resnArr),
											origLine);
								});

						window.close();
						return true;
					}

				}
				var isMain = scriptContext.currentRecord.getValue({
					fieldId : 'custpage_hidden_chkfld'
				});
				if (isMain) {
					var linecount = scriptContext.currentRecord.getLineCount({
						sublistId : 'custpage_item_sublist'
					});
					var checked = false;
					if (linecount > 0) {
						for (var k = 0; k < linecount; k++) {
							var check = scriptContext.currentRecord
									.getSublistValue({
										sublistId : "custpage_item_sublist",
										fieldId : 'custpage_createwoc',
										line : k
									});
							if (check == true) {
								if (checked == false)
									checked = true;
								var subId = scriptContext.currentRecord
										.getSublistValue({
											sublistId : "custpage_item_sublist",
											fieldId : 'custpage_sublistinternalid',
											line : k
										});
								var reasons = scriptContext.currentRecord
										.getSublistValue({
											sublistId : "custpage_item_sublist",
											fieldId : 'custpage_scrap_details_hdn',
											line : k
										});
								reasons = reasons && reasons != {} ? JSON
										.parse(reasons) : '';
								// alert(reasons);
								if (reasons.length > 0) {
									for (var resn = 0; resn < reasons.length; resn++) {
										var reason = reasons[resn].reason;
										var qty = reasons[resn].qty;
										var customrecord_cntm_scrap_historySearchObj = search
												.create({
													type : "customrecord_cntm_scrap_history",
													filters : [
															[
																	"custrecord_cntm_parent",
																	"anyof",
																	subId ],
															"AND",
															[
																	"custrecord_cntm_sh_scrap_reason",
																	"anyof",
																	reason ] ],
													columns : [
															search
																	.createColumn({
																		name : "custrecord_cntm_sh_scrap_qty",
																		label : "Scrap Quantity "
																	}),
															search
																	.createColumn({
																		name : "custrecord_cntm_sh_scrap_reason",
																		label : "Scrap Reason "
																	}) ]
												});
										var searchResultCount = customrecord_cntm_scrap_historySearchObj
												.runPaged().count;
										log
												.debug(
														"customrecord_cntm_scrap_historySearchObj result count",
														searchResultCount);
										var rec;
										if (searchResultCount > 0)
											customrecord_cntm_scrap_historySearchObj
													.run()
													.each(
															function(result) {
																// .run().each
																// has a
																// limit of
																// 4,000
																// results
																rec = record
																		.load({
																			type : 'customrecord_cntm_scrap_history',
																			id : result.id
																		});
																return true;
															});
										else {
											rec = record
													.create({
														type : 'customrecord_cntm_scrap_history'
													});
											rec
													.setValue({
														fieldId : 'custrecord_cntm_parent',
														value : subId
													});

											rec
													.setValue({
														fieldId : 'custrecord_cntm_sh_scrap_reason',
														value : reason
													});
										}
										if (rec) {

											// alert(qty);
											rec
													.setValue({
														fieldId : 'custrecord_cntm_sh_scrap_qty',
														value : qty
													});
											var recId = rec.save();
											// editRecArr.push(recId);
										}
									}
								}
							}
						}
						if (checked == false) {
							alert('Select at least one line.');
							return false;
						}
					} else {
						alert('No lines are available to submit.');
						return false;
					}
				}
				if (deletePopup) {
					var linecount = scriptContext.currentRecord.getLineCount({
						sublistId : 'custpage_completion_sublist'
					});
					var checked = false;
					if (linecount > 0) {
						var rsnLines = [];
						for (var k = 0; k < linecount; k++) {
							var check = scriptContext.currentRecord
									.getSublistValue({
										sublistId : "custpage_completion_sublist",
										fieldId : 'custpage_selectwoc',
										line : k
									});
							if (check == true) {
								if (checked == false)
									checked = true;
								// break;
								var scrap = scriptContext.currentRecord
										.getSublistValue({
											sublistId : "custpage_completion_sublist",
											fieldId : 'custpage_scrap',
											line : k
										});
								var scrapOrig = scriptContext.currentRecord
										.getSublistValue({
											sublistId : "custpage_completion_sublist",
											fieldId : 'custpage_scrap_origin',
											line : k
										});
								if (scrap > 0 && scrap != scrapOrig) {
									var scrapDetls = scriptContext.currentRecord
											.getSublistValue({
												sublistId : "custpage_completion_sublist",
												fieldId : 'custpage_scrap_reason',
												line : k
											});
									var scrapDetlsChk = scriptContext.currentRecord
											.getSublistValue({
												sublistId : "custpage_completion_sublist",
												fieldId : 'custpage_scrap_rsn_chk',
												line : k
											});
									if (scrapDetlsChk == false) {
										rsnLines.push(k + 1);
									}
								}
							}
						}
						if (checked == false) {
							alert('Select at least one line.');
							return false;
						}
						if (rsnLines.length > 0) {
							alert('Please select Scrap Reason for entered scrap quantity on line(s): '
									+ rsnLines + '.');
							return false;
						}
					} else {
						alert('No lines are available to submit.');
						return false;
					}
				}
				return true;
			}
			function issueItemPopupSaveRecord(scriptContext) {
				var linecount = scriptContext.currentRecord.getLineCount({
					sublistId : 'custpage_items'
				});
				var map = {};
				if (linecount > 0) {
					for (var k = 0; k < linecount; k++) {

						var check = scriptContext.currentRecord
								.getSublistValue({
									sublistId : "custpage_items",
									fieldId : "custpage_inv_details",
									line : k
								});
						if (check == true) {
							var item = scriptContext.currentRecord
									.getSublistValue({
										sublistId : "custpage_items",
										fieldId : "custpage_item",
										line : k
									});
							var lots = scriptContext.currentRecord
									.getSublistValue({
										sublistId : "custpage_items",
										fieldId : "custpage_inv_lot_details",
										line : k
									});
							map[item] = JSON.parse(lots)
						}
					}
					if (window.onbeforeunload) {
						window.onbeforeunload = function() {
							null;
						};
					}
					var avQtyMap = scriptContext.currentRecord.getValue({
						fieldId : 'custpage_av_qty_map_fld'
					});
					// alert(avQtyMap);
					window.opener.require(
							[ '/SuiteScripts/CNTM_CS_ClientAppWOC' ], function(
									myModule) {
								myModule.setAvQty(avQtyMap);
							});
					if (map && JSON.stringify(map) != '{}') {
						// alert(JSON.stringify(map));

						window.opener.nlapiSetCurrentLineItemValue(
								'custpage_item_sublist', 'custpage_lots', JSON
										.stringify(map), true, false);

						window.close();
						return true;
					}
				}
			}
			function setReason(resnArr, line) {
				console.log(line);
				console.log(resnArr);
				var objRecord = currentRecord.get();
				var deletePopup = objRecord.getValue({
					fieldId : 'custpage_chkfld'
				});

				if (deletePopup) {
					objRecord.selectLine({
						sublistId : 'custpage_completion_sublist',
						line : line
					});
					objRecord.setCurrentSublistValue({
						sublistId : 'custpage_completion_sublist',
						fieldId : 'custpage_scrap_reason_hdn',
						value : resnArr,
					// line:line
					});
					objRecord.commitLine({
						sublistId : 'custpage_completion_sublist'
					});
				} else {
					objRecord.selectLine({
						sublistId : 'custpage_item_sublist',
						line : line
					});
					objRecord.setCurrentSublistValue({
						sublistId : 'custpage_item_sublist',
						fieldId : 'custpage_scrap_details_hdn',
						value : resnArr,
					// line:line
					});
					objRecord.commitLine({
						sublistId : 'custpage_item_sublist'
					});
				}
			}
			function setAvQty(avQtyMap) {

				var objRecord = currentRecord.get();
				objRecord.setValue({
					fieldId : 'custpage_avl_qty_map',
					value : avQtyMap
				});
				objRecord.setValue({
					fieldId : 'custpage_av_qty_map_fld',
					value : avQtyMap
				});
			}
			function selectLOTPopupSaveRecord(scriptContext) {
				// alert('Inside Select LOT Popup');
				var selectedQty = parseFloat(scriptContext.currentRecord
						.getValue({
							fieldId : 'custpage_selectedqty'
						}));
				var requiredQty = parseFloat(scriptContext.currentRecord
						.getValue({
							fieldId : 'custpage_requirqty'
						}));
				var lotRecId = scriptContext.currentRecord.getValue({
					fieldId : 'custpage_hidden_lot_id'
				});
				if (selectedQty == requiredQty) {
					var count = scriptContext.currentRecord
							.getLineCount("custpage_lotnumberitem");

					var item = scriptContext.currentRecord.getValue({
						fieldId : 'custpage_itemdropdown'
					});
					var location = scriptContext.currentRecord.getValue({
						fieldId : 'custpage_location'
					});

					var map = {};
					map.qty = requiredQty;
					var outermap = {};
					var innermap = {};

					if (window.onbeforeunload) {
						window.onbeforeunload = function() {
							null;
						};
					}

					var availQtyMap = getParameterFromURL('map') ? JSON
							.parse(getParameterFromURL('map')) : {};

					for (var k = 0; k < count; k++) {

						var dd = scriptContext.currentRecord.getSublistValue({
							sublistId : "custpage_lotnumberitem",
							fieldId : "custpage_checkbox",
							line : k
						});

						if (dd == 'T' || dd == true) {

							var lotnumber = scriptContext.currentRecord
									.getSublistValue({
										sublistId : "custpage_lotnumberitem",
										fieldId : "custpage_inventorynumber",
										line : k
									});
							var bin = scriptContext.currentRecord
									.getSublistValue({
										sublistId : "custpage_lotnumberitem",
										fieldId : "custpage_bin",
										line : k
									});
							var status = scriptContext.currentRecord
									.getSublistValue({
										sublistId : "custpage_lotnumberitem",
										fieldId : "custpage_status",
										line : k
									});
							var qtyOnHand = scriptContext.currentRecord
									.getSublistValue({
										sublistId : "custpage_lotnumberitem",
										fieldId : "custpage_quantityslected",
										line : k
									});
							var qtyAvail = scriptContext.currentRecord
									.getSublistValue({
										sublistId : "custpage_lotnumberitem",
										fieldId : "custpage_quantity_avail",
										line : k
									});
							log.debug('lotnumber,qtyOnHand', lotnumber + ','
									+ qtyOnHand);

							if (lotnumber && item) {
								var itemSearch = search.create({
									type : "inventorynumber",
									filters : [
											[ "inventorynumber", "is",
													lotnumber ], "AND",
											[ "item", 'anyof', item ] ]
								});
								var searchResultCount = itemSearch.runPaged().count;

								if (searchResultCount > 0) {
									var lotnumberid;
									itemSearch.run().each(function(result) {
										lotnumberid = result.id;
										return false;
									});
									if (map[lotnumberid])
										map[lotnumberid] = {}
									var binMap = {};
									binMap[bin] = qtyOnHand;
									map[lotnumberid] = binMap;
								}

								if (qtyAvail) {

									if (!availQtyMap[lotnumber])
										availQtyMap[lotnumber] = {};
									var qmap = {};
									qmap[bin] = {
										'aQty' : parseFloat(qtyAvail)
												- parseFloat(qtyOnHand)
									}
									availQtyMap[lotnumber] = qmap;

								}
							} else if (bin) {
								map['Bin__' + bin] = qtyOnHand;
								if (qtyAvail)
									availQtyMap['Bin__' + bin] = {
										'aQty' : parseFloat(qtyAvail)
												- parseFloat(qtyOnHand)
									};
							}
						}
					}

					window.opener.require(
							[ '/SuiteScripts/CNTM_CS_ClientAppWOC' ], function(
									myModule) {

								myModule.setAvQty(JSON.stringify(availQtyMap));

							});

					var text = "";
					if (Object.keys(map).length > 0) {
						text = JSON.stringify(map);
					}

					console.log("testing.");

					if (window.onbeforeunload) {
						window.onbeforeunload = function() {
							null;
						};
					}

					window.opener.getComponentfieldvalue(text);

					window.close();
					return true;

				} else if (!isNaN(selectedQty)) {
					alert("The total inventory detail quantity must be "
							+ requiredQty);
					return false;
				} else {
					window.close();
					return true;
				}
			}
			function getQtyMap() {
				var objRecord = currentRecord.get();
				var map = objRecord.getValue({
					fieldId : 'custpage_av_qty_map_fld'
				});
				// alert('-' + map);
				return map;
			}
			function getMainQtyMap() {
				var objRecord = currentRecord.get();
				var map = objRecord.getValue({
					fieldId : 'custpage_avl_qty_map'
				});
				// alert('--' + map);
				return map;
			}
			function setComponentQuantity(compoQty) {
				scriptContext.currentRecord.SetCurrentSublistValue({
					sublistId : 'custpage_componentlist',
					fieldId : 'custpage_originalselectedqty',
					value : compoQty
				});
				return false;
			}
			function calculateQty(scriptContext, lineNo) {

			}
			function processNew() {
				var redirectUrl = url.resolveScript({
					scriptId : 'customscript_cntm_client_su',
					deploymentId : 'customdeploy_cntm_client_su',
					returnExternalUrl : false
				});
				window.open(redirectUrl, '_self');
			}
			function refresh() {
				// alert('refresh');
				window.location.reload();
			}
			function close() {
				// alert('refresh');
				window.close();
			}
			function deleteCompletion() {
				var objRecord = currentRecord.get();
				var wo = objRecord.getValue({
					fieldId : 'custpage_jobnumber_text'
				});
				if (wo) {
					var redirectUrl = url
							.resolveScript({
								scriptId : 'customscript_cntm_sl_delete_completion',
								deploymentId : 'customdeploy_cntm_sl_delete_completion',
								returnExternalUrl : false
							});
					window.open(redirectUrl + '&wo=' + wo, '_self');
				} else
					alert('Please enter the Work Order first.');
			}
			function editCompletion() {
				var objRecord = currentRecord.get();
				var wo = objRecord.getValue({
					fieldId : 'custpage_jobnumber_text'
				});
				if (wo) {
					var redirectUrl = url
							.resolveScript({
								scriptId : 'customscript_cntm_sl_delete_completion',
								deploymentId : 'customdeploy_cntm_sl_delete_completion',
								returnExternalUrl : false
							});
					window.open(redirectUrl + '&wo=' + wo + '&isedit=T',
							'_self');
				} else
					alert('Please enter the Work Order first.');
			}
			function createPanelWO() {
				var objRecord = currentRecord.get();
				var wo = objRecord.getValue({
					fieldId : 'custpage_jobnumber_text'
				});
				if (wo) {
					var woFieldLookUp = search.lookupFields({
						type : 'workorder',
						id : wo,
						columns : [ 'createdfrom' ]
					});
					// alert(woFieldLookUp.createdfrom);
					// alert(woFieldLookUp.createdfrom[0]);
					var isParent = woFieldLookUp.createdfrom[0];
					if (isParent) {
						var lineCount = objRecord.getLineCount({
							sublistId : 'custpage_item_sublist'
						});
						if (lineCount > 0) {
							var redirectUrl = window.location.href;
							window.open(redirectUrl + '&isPanel=T&wo=' + wo,
									'_self');
						} else
							alert('No completion details available for this WO.');
					} else
						alert('You can not create Additional panel for top assembly.');
				} else
					alert('Please enter the Work Order first.');
			}
			return {
				pageInit : pageInit,
				fieldChanged : fieldChanged,
				validateLine : validateLine,
				saveRecord : saveRecord,
				createWoc : createWoc,
				processNew : processNew,
				refresh : refresh,
				getComponentfieldvalue : getComponentfieldvalue,
				setAvQty : setAvQty,
				setReason : setReason,
				deleteCompletion : deleteCompletion,
				editCompletion : editCompletion,
				close : close,
				createPanelWO : createPanelWO
			};

		});
function getComponentfieldvalue(text) {
	// consolw.log('getComponentfieldvalue: ' + text);
	// alert('inside');
	nlapiSetCurrentLineItemValue('custpage_items', 'custpage_inv_lot_details',
			text, true, false);
	return false;

}
