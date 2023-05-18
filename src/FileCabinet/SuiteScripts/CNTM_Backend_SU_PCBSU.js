/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(
		[ 'N/record', 'N/search', 'N/transaction', 'N/ui/serverWidget',
				'N/xml', 'N/runtime', 'N/task', 'N/render', 'N/url', 'N/https',
				'N/file' ],

		function(record, search, transaction, serverWidget, xml, runtime, task,
				render, url, https, file) {

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
						function getStatus(arry) {
							var workorderSearchObj = search.create({
								type : "workorder",
								filters : [ [ "type", "anyof", "WorkOrd" ],
										"AND", [ "internalid", "anyof", arry ],
										"AND", [ "mainline", "is", "T" ] ],
								columns : [ search.createColumn({
									name : "statusref",
									label : "Status"
								}), search.createColumn({
									name : "internalid",
									label : "Internal ID"
								}) ]
							});
							var searchResultCount = workorderSearchObj
									.runPaged().count;
							log.debug("workorderSearchObj result count",
									searchResultCount);
							workorderSearchObj.run().each(
									function(result) {
										// .run().each has a limit of 4,000
										// results
										var status = result.getValue(search
												.createColumn({
													name : "statusref",
													label : "Status"
												}));
										var internalId = result.getValue(search
												.createColumn({
													name : "internalid",
													label : "Internal ID"
												}));

										return true;
									});
						}
						var itemNo = context.request.parameters.itemNo;
						var soNo = context.request.parameters.soNo;
						var filtersales = [];
						if (soNo && itemNo) {
							filtersales = [
									[ "custrecord_cntm_crtd_frm_so", "anyof",
											soNo ], "AND",
									[ "custrecord_cntm_item", "anyof", itemNo ] ];
						} else {

							filtersales = [ [ "custrecord_cntm_crtd_frm_so",
									"anyof", soNo ]

							];
						}

						var customrecord_cntm_pcb_wo_suitelet_dataSearchObj = search
								.create({
									type : "customrecord_cntm_pcb_wo_suitelet_data",
									filters : filtersales,
									columns : [
											search.createColumn({
												name : "internalid",
												label : "Internal ID"
											}),
											search
													.createColumn({
														name : "custrecord_cntm_crtd_frm_so",
														label : "Created From SO"
													}),
											search
													.createColumn({
														name : "custrecord_cntm_crtd_frm",
														label : "Creted From"
													}),
											search.createColumn({
												name : "custrecord_cntm_wo",
												label : "WO"
											}),
											search
													.createColumn({
														name : "custrecord_cntm_wo_status",
														label : "Status"
													}),
											search
													.createColumn({
														name : "custrecord_cntm_rout_file",
														label : "Routing File"
													}),
											search.createColumn({
												name : "custrecord_cntm_item",
												label : "Item"
											}),
											search
													.createColumn({
														name : "custrecord_cntm_wo_qty",
														label : "WO qty"
													}),
											search
													.createColumn({
														name : "custrecord_cntm_create_new_routing",
														label : "Create New Routing"
													}),
											search
													.createColumn({
														name : "custrecord_cntm_create_lot_rec",
														label : "Create Lot Record"
													}),
											search
													.createColumn({
														name : "custrecord_cntm_cr_status",
														label : "CR Status"
													}),
											search
													.createColumn({
														name : "custrecord_cntm_error_in_routing",
														label : "Error"
													}),
											search
													.createColumn({
														name : "custrecord_cntm_rout_status",
														label : "Routing Creation Status"
													}),
											search
													.createColumn({
														name : "custrecord_cntm_err_file_id",
														label : "Error File"
													}) ],

								});
						var searchResultCount = customrecord_cntm_pcb_wo_suitelet_dataSearchObj
								.runPaged().count;
						log
								.debug(
										"customrecord_cntm_pcb_wo_suitelet_dataSearchObj result count",
										searchResultCount);
						var detailShare = [];
						customrecord_cntm_pcb_wo_suitelet_dataSearchObj
								.run()
								.each(
										function(result) {
											// .run().each has a limit of 4,000
											// results
											var mainjson = {};
											var createdfromSO = result
													.getValue(search
															.createColumn({
																name : "custrecord_cntm_crtd_frm_so",
																label : "Created From SO"
															}));
											var internalId = result
													.getValue(search
															.createColumn({
																name : "internalid",
																label : "Internal ID"
															}));
											var woQty = result
													.getValue(search
															.createColumn({
																name : "custrecord_cntm_wo_qty",
																label : "WO qty"
															}));
											var createdfrom = result
													.getValue(search
															.createColumn({
																name : "custrecord_cntm_crtd_frm",
																label : "Creted From"
															}));
											var workOrder = result
													.getValue(search
															.createColumn({
																name : "custrecord_cntm_wo",
																label : "WO"
															}));
											var woStatus = result
													.getText(search
															.createColumn({
																name : "custrecord_cntm_wo_status",
																label : "Status"
															}));
											var routeFile = result
													.getText(search
															.createColumn({
																name : "custrecord_cntm_rout_file",
																label : "Routing File"
															}));
											var itemDetails = result
													.getValue(search
															.createColumn({
																name : "custrecord_cntm_item",
																label : "Item"
															}));
											var newRoute = result
													.getValue(search
															.createColumn({
																name : "custrecord_cntm_create_new_routing",
																label : "Create New Routing"
															}));
											var lotRec = result
													.getValue(search
															.createColumn({
																name : "custrecord_cntm_create_lot_rec",
																label : "Create Lot Record"
															}));
											var crStatus = result
													.getValue(search
															.createColumn({
																name : "custrecord_cntm_cr_status",
																label : "CR Status"
															}));
											var routeStatus = result
													.getValue(search
															.createColumn({
																name : "custrecord_cntm_rout_status",
																label : "Routing Creation Status"
															}));
											var errorDetials = result
													.getValue(search
															.createColumn({
																name : "custrecord_cntm_error_in_routing",
																label : "Error"
															}));
											var errorFile = result
													.getValue(search
															.createColumn({
																name : "custrecord_cntm_err_file_id",
																label : "Error File"
															}));
											log.debug('errorFile', errorFile);
											if (errorFile) {
												var errFileObj = file.load({
													id : errorFile
												});
												log.debug('errFileObj',
														errFileObj);
											}
											if (workOrder) {
												mainjson.createdfromSO = createdfromSO;
												mainjson.createdfrom = createdfrom;
												mainjson.workOrder = workOrder;
												try {
													var fieldLookUp = search
															.lookupFields({
																type : search.Type.WORK_ORDER,
																id : workOrder,
																columns : [ 'statusref' ]
															});
													log.debug("lookup",
															fieldLookUp);
													mainjson.woStatus = fieldLookUp.statusref[0].text;
												} catch (e) {
													mainjson.woStatus = "";
												}
												mainjson.routeFile = routeFile;
												mainjson.itemDetails = itemDetails;
												mainjson.woQty = woQty;
												mainjson.newRoute = newRoute;
												mainjson.lotRec = lotRec;
												mainjson.crStatus = crStatus;
												mainjson.internalId = internalId;
												mainjson.bom = bom;
												mainjson.errorDetials = errorDetials;
												if (errFileObj) {
													log.debug('errFileObj.url',
															errFileObj.url);
													mainjson.errorFile = errFileObj.url;
												}
												mainjson.routeStatus = routeStatus;
												detailShare.push(mainjson);
											}
											return true;
										});
						context.response.write(JSON.stringify(detailShare));

					}

					else if (context.request.method === 'POST') {

						var totalData = context.request.body;
						log.debug("TotalData", totalData);
						totalData = JSON.parse(totalData);
						var fabrec = totalData.fabrec;
						var flag = false;// totalData.flagForRoute;
						totalData = totalData.RouteArray;

						var fileId = totalData[0].routeFileId;
						var lineCount = totalData.length;
						// log.debug("TotalData",totalData[0].sublistIntenalId);
						var routeCreted = [];
						var route = {};
						for (var int = 0; int < lineCount; int++) {

							var customHeadarRecord = record
									.load({
										type : "customrecord_cntm_pcb_wo_suitelet_data",
										id : totalData[int].internalId
									});
							var item = customHeadarRecord.getText({
								fieldId : 'custrecord_cntm_item'
							});
							var bom = customHeadarRecord.getValue({
								fieldId : 'custrecord_cntm_bom_rec'
							});
							var bomName = customHeadarRecord.getText({
								fieldId : 'custrecord_cntm_bom_rec'
							});
							if (totalData[int].newRoute == true
									|| totalData[int].newRoute == 'true') {
								flag = true;
								if (!route[item]) {
									customHeadarRecord.setValue({
										fieldId : 'custrecord_cntm_routing',
										value : ''
									});
									customHeadarRecord
											.setValue({
												fieldId : 'custrecord_cntm_rout_status',
												value : 1
											});
									var routData = {};
									routData.item = item;
									routData.bom = bom;
									routData.bomName = bomName;
									routData.recIds = [];

									route[item] = routData;
								}
								route[item].recIds
										.push(totalData[int].internalId);
							}
							customHeadarRecord.setValue({
								fieldId : 'custrecord_cntm_create_lot_rec',
								value : totalData[int].lotRec
							});
							customHeadarRecord.setValue({
								fieldId : 'custrecord_cntm_rout_file',
								value : totalData[int].routeFileId
							});
							customHeadarRecord.setValue({
								fieldId : 'custrecord_cntm_create_new_routing',
								value : totalData[int].newRoute
							});

							customHeadarRecord.save();
						}
						if (flag == true) {
							var scriptTask = task.create({
								taskType : task.TaskType.MAP_REDUCE
							});
							scriptTask.scriptId = 'customscript_cntm_crt_new_routing';

							scriptTask.params = {
								custscript_cntm_route_file : fileId,
								custscript_cntm_fab_rec : fabrec,
								custscript_cntm_item_map : JSON
										.stringify(route)
							};

							var scriptTaskId = scriptTask.submit();
							var status = task.checkStatus(scriptTaskId).status;
							log.debug(scriptTaskId);
						}
					}

				} catch (e) {
					log.debug("eroorcalllog", e);
				}

			}

			return {
				onRequest : onRequest
			};

		});
