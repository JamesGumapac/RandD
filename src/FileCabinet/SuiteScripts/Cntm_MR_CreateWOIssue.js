/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(
		[ "N/record", "N/runtime", "N/search" ],
		/**
		 * @param {record}
		 *            record
		 * @param {runtime}
		 *            runtime
		 * @param {search}
		 *            search
		 */
		function(record, runtime, search) {
			/**
			 * Marks the beginning of the Map/Reduce process and generates input
			 * data.
			 * 
			 * @typedef {Object} ObjectRef
			 * @property {number} id - Internal ID of the record instance
			 * @property {string} type - Record type id
			 * 
			 * @return {Array|Object|Search|RecordRef} inputSummary
			 * @since 2015.1
			 */
			function getInputData() {
				var lots = runtime.getCurrentScript().getParameter({
					name : "custscript_cntm_lots",
				});
				log.debug("lots", lots);
				if (lots)
					var lotsArray = JSON.parse(lots);
				var headerRec = runtime.getCurrentScript().getParameter({
					name : "custscript_cntm_header_rec",
				});
				var id = record.submitFields({
					type : "customrecord_cntm_clientapp_header",
					id : headerRec,
					values : {
						custrecord_cntm_wo_issue_inprocess : true,
					},
					options : {
						enableSourcing : false,
						ignoreMandatoryFields : true,
					},
				});
				return lotsArray;
			}

			/**
			 * Executes when the map entry point is triggered and applies to
			 * each key/value pair.
			 * 
			 * @param {MapSummary}
			 *            context - Data collection containing the key/value
			 *            pairs to process through the map stage
			 * @since 2015.1
			 */
			function map(context) {
				// setTimeout(function(){ log.debug('Ran after 10 seconds'); },
				// 10000);
				var panelLotMap = JSON.parse(context.value);
				log.debug("panelLotMap", panelLotMap);
				var recId = panelLotMap.id;
				var id = record.submitFields({
					type : "customrecord_cntm_clientappsublist",
					id : recId,
					values : {
						custrecord_cntm_issue_in_process : true,
					},
					options : {
						enableSourcing : false,
						ignoreMandatoryFields : true,
					},
				});
				try {
					var woId = runtime.getCurrentScript().getParameter({
						name : "custscript_cntm_wo_rec",
					});

					/*
					 * var woFieldLookUp = search.lookupFields({ type :
					 * 'workorder', id : woId, columns : [ 'assemblyitem',
					 * 'quantity', 'custbody_cntm_no_of_panel',
					 * 'custbody_rda_boards_per_panel' ] });
					 */

					var asmItem = panelLotMap.item;

					log.debug("woId" + woId, "asmItem" + asmItem);

					var panelLot = panelLotMap.lot;
					var goodQty = panelLotMap.goodQty;
					log.debug('goodQty :', goodQty);

					var lotRec = panelLotMap.lotRec;
					if (goodQty > 0) {
						/*
						 * var parentWOFieldLookUp = search.lookupFields({ type :
						 * 'workorder', id : parentWOId, columns : [
						 * 'custbody_rda_wo_issue_okay' ] }); var isAutoIssue =
						 * parentWOFieldLookUp.custbody_rda_wo_issue_okay;
						 * log.debug('isAutoIssue',isAutoIssue); if (isAutoIssue ==
						 * true || isAutoIssue == 'true' || isAutoIssue == 'T') {
						 */
						var woIssueObj = record.transform({
							fromType : record.Type.WORK_ORDER,
							fromId : woId,
							toType : record.Type.WORK_ORDER_ISSUE,
							isDynamic : true,
						});
						/*
						 * woIssueObj.setValue({ fieldId :
						 * 'custbody_cntm_lot_from_completion', value : panelLot
						 * });
						 */
						woIssueObj.setValue({
							fieldId : "custbody_cntm_prev_lot_rec",
							value : lotRec,
						});

						var issueLine = woIssueObj.getLineCount({
							sublistId : "component",
						});
						log.debug("issueLine", issueLine);
						if (issueLine > 0) {
							log.debug('issueLine') // 3
							var lineNumber = woIssueObj
									.findSublistLineWithValue({
										sublistId : "component",
										fieldId : "item",
										value : asmItem,
									});
							log.debug("lineNumber", lineNumber); // 0
							if (lineNumber > -1) {
								log.debug('lineNumber')
								for (var lines = 0; lines < issueLine; lines++) { // 3
									log.debug('FOR LINES', lines)
									woIssueObj.selectLine({
										sublistId : "component",
										line : lines,
									});
									if (lineNumber == lines) {
										log.debug('lineNumber == lines', lines)
										woIssueObj.setCurrentSublistValue({
											sublistId : "component",
											fieldId : "quantity",
											value : goodQty,
										});
                                      log.debug('---');
										var objSubrecord = woIssueObj
												.getCurrentSublistSubrecord({
													sublistId : "component",
													fieldId : "componentinventorydetail",
												});
										log.debug('here');

										var compLine = objSubrecord
												.getLineCount({
													sublistId : "inventoryassignment",
												});

										log.debug('compLine ', compLine); // 4
										if (compLine > 0) {
											log.debug('compline')
											for (var line = compLine - 1; line >= 0; line--) {
												log.debug('FOR')
												log.debug('line', line);
												objSubrecord
														.selectLine({
															sublistId : "inventoryassignment",
															line : line,
														});
												var lot = objSubrecord
														.getCurrentSublistText({
															sublistId : "inventoryassignment",
															fieldId : "issueinventorynumber",
														// line : line
														});

												log.debug("lot", lot);
												log.debug("panelLot", panelLot);

												if (lot == panelLot) {
													log.debug('FOR IF')
													objSubrecord
															.setCurrentSublistValue({
																sublistId : "inventoryassignment",
																fieldId : "quantity",
																value : parseFloat(goodQty),
															});
													// Setting status to Good
													objSubrecord
															.setCurrentSublistValue({
																sublistId : "inventoryassignment",
																fieldId : "inventorystatus",
																value : 1,
															});

													objSubrecord
															.commitLine({
																sublistId : "inventoryassignment",
															});
												} else {
													log.debug('FOR ELSE')
													// log.debug('else..');

													objSubrecord
															.removeLine({
																sublistId : "inventoryassignment",
																line : line,
															});
												}
											}
										} else {
											log.debug('compline else')
											// log.debug('else');
											objSubrecord
													.selectNewLine({
														sublistId : "inventoryassignment",
													});
											objSubrecord
													.setCurrentSublistText({
														sublistId : "inventoryassignment",
														fieldId : "issueinventorynumber",
														text : panelLot,
													});
											objSubrecord
													.setCurrentSublistValue({
														sublistId : "inventoryassignment",
														fieldId : "quantity",
														value : parseFloat(goodQty),
													});
											objSubrecord
													.commitLine({
														sublistId : "inventoryassignment",
													});
										}
									} else {
										log.debug('ELSE lineNumber == lines ',
												lines)
										woIssueObj.setCurrentSublistValue({
											sublistId : "component",
											fieldId : "quantity",
											value : '0',
										// ignoreFieldChange : true
										});

										var objSubrecord = woIssueObj
												.getCurrentSublistSubrecord({
													sublistId : "component",
													fieldId : "componentinventorydetail",
												});
										log.debug('objSubrecord', objSubrecord);
										
										var compLine = objSubrecord
												.getLineCount({
													sublistId : "inventoryassignment",
												});
										objSubrecord
										.selectLine({
											sublistId : "inventoryassignment",
											line : 0,
										});
										objSubrecord.cancelLine({
											sublistId : "inventoryassignment",
											//line : 0,
										});

										log.debug('compLine ', compLine); // 4
										/*objSubrecord.commitLine({
											sublistId : "inventoryassignment",
										// ignoreRecalc : true
										});*/
									}
									log.debug("commiting...");
									woIssueObj.commitLine({
										sublistId : "component",
									// ignoreRecalc : true
									});
								}
							}
						}
						log.debug("saving..");
						var item = woIssueObj.getValue({
							fieldId : "item"
						});
						log.debug("item", item);
						var woIssueId = woIssueObj.save({
							enableSourcing : true,
							ignoreMandatoryFields : true
						});
						var id = record.submitFields({
							type : "customrecord_cntm_clientappsublist",
							id : recId,
							values : {
								custrecord_cntm_issue_created : true,
							// custrecord_cntm_issue_in_process: false,
							},
							options : {
								enableSourcing : false,
								ignoreMandatoryFields : true,
							},
						});
						/*
						 * var itemFieldLookUp = search.lookupFields({ type:
						 * "item", id: item, columns:
						 * ["custitem_cnt_next_lot_no"], }); var nextLotNo =
						 * itemFieldLookUp.custitem_cnt_next_lot_no; var
						 * fieldLookUp = search.lookupFields({ type:
						 * search.Type.WORK_ORDER, id: woId, columns:
						 * ["custbody_cntm_no_of_panel"], }); var noOfPanels =
						 * fieldLookUp.custbody_cntm_no_of_panel;
						 * log.debug(nextLotNo, "noOfPanels: " +
						 * parseInt(noOfPanels));
						 * 
						 * if (!nextLotNo) nextLotNo = 1; createLot(woId, item,
						 * nextLotNo, noOfPanels, lotRec); nextLotNo++;
						 * log.debug("nextLotNo", nextLotNo); var idToCheck =
						 * record.submitFields({ // type:
						 * "lotnumberedassemblyitem", id: item, values: {
						 * custitem_cnt_next_lot_no: nextLotNo, }, options: {
						 * enableSourcing: false, ignoreMandatoryFields: true, },
						 * }); log.debug("NEXT LOT SETTED :", idToCheck);
						 */
					}

					log.debug("woIssueId", woIssueId);
				} catch (e) {
					log.error("map error", e.message);

					if (recId)
						var id = record.submitFields({
							type : "customrecord_cntm_clientappsublist",
							id : recId,
							values : {
								custrecord_cntm_error_in_issue : e.message,
							// custrecord_cntm_issue_in_process: false,
							},
							options : {
								enableSourcing : false,
								ignoreMandatoryFields : true,
							},
						});
				}
			}
			// function createLot(woId, item, nextLotNo, noOfPanels,
			// isFromCompletion) {
			// //count
			// var WOLotRec = record.create({
			// type: "customrecord_cntm_lot_creation",
			// isDynamic: true,
			// });
			// WOLotRec.setValue({
			// fieldId: "custrecord_cntm_lot_wonum",
			// value: woId,
			// });
			// WOLotRec.setValue({
			// fieldId: "custrecord_cntm_lot_assembly_item",
			// value: item,
			// });
			// WOLotRec.setValue({
			// fieldId: "custrecord_cntm_lot_lotnumber",
			// value: nextLotNo,
			// });
			// WOLotRec.setValue({
			// fieldId: "custrecord_cntm_num_of_panels",
			// value: noOfPanels,
			// });
			// var woFieldLookUp = search.lookupFields({
			// type: "workorder",
			// id: woId,
			// columns: ["custbody_rda_boards_per_panel"],
			// });
			// var boardsPerPanel = woFieldLookUp.custbody_rda_boards_per_panel;
			// WOLotRec.setValue({
			// fieldId: "custrecord_cntm_brds_per_panel",
			// value: boardsPerPanel,
			// });
			// if (isFromCompletion) {
			// WOLotRec.setValue({
			// fieldId: "custrecord_cntm_prev_lot_rec",
			// value: isFromCompletion,
			// });

			// var cumScrap = WOLotRec.getValue({
			// fieldId: "custrecord_cntm_previous_scrap",
			// });

			// var cumScrapQty = WOLotRec.getValue({
			// fieldId: "custrecord_cntm_cumulative_scrap_qty",
			// });
			// log.debug("My cumScrapQty :", cumScrapQty); //

			// //changes - Vishal
			// if (cumScrap == "" || cumScrap == null || cumScrap == undefined)
			// {
			// cumScrap = 0;
			// }
			// if (
			// cumScrapQty == "" ||
			// cumScrapQty == null ||
			// cumScrapQty == undefined
			// ) {
			// cumScrapQty = 0;
			// }

			// // WOLotRec.setValue({
			// // fieldId: 'custrecord_cntm_cumulative_scrap_qty',
			// // value: parseInt(cumScrap) + parseInt(cumScrapQty)
			// // });

			// /**
			// *
			// var cumScrap = WOLotRec.getValue({
			// fieldId: 'custrecord_cntm_previous_scrap'
			// });
			// log.debug('My cumScrap Prevoius:', cumScrap); //Previous

			// var cumScrapQty = WOLotRec.getValue({
			// fieldId: 'custrecord_cntm_cumulative_scrap_qty'
			// });
			// log.debug('My cumScrapQty :', cumScrapQty); //

			// if (cumScrap) {

			// }
			// WOLotRec.setValue({
			// fieldId: 'custrecord_cntm_cumulative_scrap_qty',
			// value: cumScrap
			// });
			// */
			// } else {
			// //Code
			// //Search (woId) - child
			// //child che lot
			// //current rec chya previous lot
			// }
			// var lotRecId = WOLotRec.save({
			// ignoreMandatoryFields: true,
			// });
			// }
			/*
			 * function setTimeout(aFunction, milliseconds){ var date = new
			 * Date(); date.setMilliseconds(date.getMilliseconds() +
			 * milliseconds); while(new Date() < date){ }
			 * 
			 * return aFunction(); }
			 */
			/**
			 * Executes when the reduce entry point is triggered and applies to
			 * each group.
			 * 
			 * @param {ReduceSummary}
			 *            context - Data collection containing the groups to
			 *            process through the reduce stage
			 * @since 2015.1
			 */
			function reduce(context) {
			}

			/**
			 * Executes when the summarize entry point is triggered and applies
			 * to the result set.
			 * 
			 * @param {Summary}
			 *            summary - Holds statistics regarding the execution of
			 *            a map/reduce script
			 * @since 2015.1
			 */
			function summarize(summary) {
				try {
					var headerRec = runtime.getCurrentScript().getParameter({
						name : "custscript_cntm_header_rec",
					});
					log.debug("headerRec :", headerRec);
					var lots = runtime.getCurrentScript().getParameter({
						name : "custscript_cntm_lots",
					});
					log.debug("lots in Summary", lots);
					if (lots)
						var lotsArray = JSON.parse(lots);

					if (lotsArray.length > 0) {
						for (var i = 0; i < lotsArray.length; i++) {
							var rec = lotsArray[i].id;
							var id = record.submitFields({
								type : 'customrecord_cntm_clientappsublist',
								id : rec,
								values : {
									'custrecord_cntm_issue_in_process' : false
								},
								options : {
									enableSourcing : false,
									ignoreMandatoryFields : true
								}
							});
						}
					}

					// var id = record.submitFields({
					// type: "customrecord_cntm_clientapp_header",
					// id: headerRec,
					// values: {
					// custrecord_cntm_wo_issue_inprocess: false,
					// },
					// options: {
					// enableSourcing: false,
					// ignoreMandatoryFields: true,
					// },
					// });
				} catch (error) {
					log.debug("error" + error.message);

				}

			}

			return {
				getInputData : getInputData,
				map : map,
				// reduce : reduce,
				summarize : summarize,
			};
		});
