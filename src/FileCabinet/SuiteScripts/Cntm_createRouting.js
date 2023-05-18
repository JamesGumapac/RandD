/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(
		[ 'N/record', 'N/search', 'N/file' ],
		/**
		 * @param {record}
		 *            record
		 * @param {search}
		 *            search
		 */
		function(record, search, file) {

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
					var totalData = context.request.body;
					log.debug("TotalData", totalData);
					totalData = JSON.parse(totalData);
					var routingFileId = totalData.fileId;
					var bomInternalId = totalData.bom;
					var bomName = totalData.bomName;
					var subassembly = totalData.subAsm
					log.debug('subassembly', subassembly);
					var manufacturingroutingSearchObj = search
							.create({
								type : "manufacturingrouting",
								filters : [ [ "billofmaterials", "anyof",
										bomInternalId ] ],
								columns : [ search.createColumn({
									name : "name",
									// sort : search.Sort.ASC,
									label : "Name"
								}), search.createColumn({
									name : "billofmaterials",
									label : "Bill of Materials"
								}), search.createColumn({
									name : "internalid",
									sort : search.Sort.DESC,
									label : "Internal Id"
								}), search.createColumn({
									name : "location",
									label : "Location"
								}) ]
							});
					var searchResultCount = manufacturingroutingSearchObj
							.runPaged().count;
					log.debug("manufacturingroutingSearchObj result count",
							searchResultCount);
					var lastRoutingId;
					var routingName;
					if (searchResultCount > 0) {
						routingName = bomName + ' ' + searchResultCount;
						manufacturingroutingSearchObj.run().each(
								function(result) {
									// .run().each has a limit of 4,000 results
									lastRoutingId = result.id;
									return false;
								});
					}

					if (routingFileId) {

						var instructions = "";// Instructions
						var oprationNames = new Array();
						var opration_Instructions = {};
						// var oData = {};
						var routing_fileObj = file.load({
							id : parseInt(routingFileId)
						});

						var routing_iterator = routing_fileObj.lines.iterator();
						defaultRouting(bomInternalId);
						var routing_obj = record.create({
							type : record.Type.MANUFACTURING_ROUTING,
							//id : lastRoutingId,
							isDynamic : true
						});
						routing_obj.setValue({
							fieldId : "name",
							value : routingName
						});

						routing_obj.setValue({
							fieldId : "subsidiary",
							value : 2
						});
						routing_obj.setValue({
							fieldId : "location",
							value : 202
						});// 4
						routing_obj.setValue({
							fieldId : "billofmaterials",
							value : bomInternalId
						});

						routing_obj.setValue({
							fieldId : "isdefault",
							value : true
						});
						var boardsPerPanelLookUp = search.lookupFields({
							type : 'bom',
							id : bomInternalId,
							columns : [ 'custrecord_cntm_boards_per_panel' ]
						});
						var boardsPerPanel = boardsPerPanelLookUp.custrecord_cntm_boards_per_panel;
						var lines = routing_obj.getLineCount({
							sublistId : 'routingstep'
						});
						var routingId;
						/*
						 * for (var j = lines - 1; j >= 0; j--) {
						 * routing_obj.removeLine({ sublistId : 'routingstep',
						 * line : j, ignoreRecalc : true }); }
						 */
						var column = new Array();
						column.push(search.createColumn({
							name : "custrecord_work_center_",
							label : "Work Center"
						}));
						column.push(search.createColumn({
							name : "custrecord8",
							label : "Cost Template"
						}));
						column.push(search.createColumn({
							name : "custrecord_wip_setup_",
							label : "WIP SetUp"
						}));
						column.push(search.createColumn({
							name : "custrecord_wip_time_",
							label : "WIP Time"
						}));
						var opSequence = 10;
						var errorObjArr = new Array();
						var instObj = {};
						var opSequenceArr = [];
						opSequenceArr.push(opSequence);
						var isPresent = false;
						routing_iterator
								.each(function(line) {
									var body = line.value;
									var bodyArray = body.split('|');
									var item = bodyArray[1];
									// log.debug(item,subassembly);
									if (item == subassembly
											|| item.split('_')[0] == subassembly) {
										isPresent = true;
										var OPERATION_SEQUENCE = bodyArray[2];
										var GATE_ID = bodyArray[5]
										var GATE_DESCRIPTION = bodyArray[6] ? bodyArray[6]
												.replace(/,/g, " ")
												: " ";
										GATE_DESCRIPTION = GATE_DESCRIPTION
												.trim();
										// var
										// GATE_DESCRIPTION=bodyArray[6];
										// log.debug('oprationNames',oprationNames);
										oprationNames.push(GATE_ID + '-'
												+ GATE_DESCRIPTION);
										opration_Instructions[opSequence] = [];
										var GATE_Instructions = '';
										var lastOp = opSequenceArr[opSequenceArr.length - 2];
										if (bodyArray.length > 7) {
											var lastArrIndex = Number(oprationNames.length) - 1;
											var lastOPName = oprationNames[lastArrIndex];

											GATE_Instructions = bodyArray[7] ? bodyArray[7]
													.replace(/,/g, " ")
													: bodyArray[7];
											GATE_Instructions = GATE_Instructions
													.trim();

											opration_Instructions[lastOp]
													.push(GATE_Instructions);
										}

										if (GATE_ID) {
											// log.debug('OPERATION_SEQUENCE',OPERATION_SEQUENCE);
											var operation_name = GATE_ID + '-'
													+ GATE_DESCRIPTION;
											var gateDescription = GATE_DESCRIPTION;

											var filter = new Array();
											filter.push(search.createFilter({
												name : "custrecord_gate_",
												operator : "contains",
												values : GATE_ID
											}));
											filter.push(search.createFilter({
												name : "custrecord_name_",
												operator : "is",
												values : gateDescription
											}));
											var operations_SearchObj = search
													.create({
														type : "customrecord_gate_times_and_operations_",
														filters : filter,
														columns : column
													});
											var searchResultCount = operations_SearchObj
													.runPaged().count;
											// log.debug('gateId='+
											// GATE_ID,'searchResultCount='+
											// searchResultCount);
											if (searchResultCount > 0) {
												operations_SearchObj
														.run()
														.each(
																function(result) {
																	var workcenter = result
																			.getValue(result.columns[0]);
																	var costtemplate = result
																			.getValue(result.columns[1]);
																	var setuptime = result
																			.getValue(result.columns[2]);
																	var runrate = result
																			.getValue(result.columns[3]);
																	runrate = runrate
																			/ boardsPerPanel;
																	if (workcenter
																			&& costtemplate
																			&& (setuptime || setuptime == 0)
																			&& (runrate || runrate == 0)) {
																		try {
																			routing_obj
																					.selectNewLine({
																						sublistId : "routingstep"
																					});
																			routing_obj
																					.setCurrentSublistValue({
																						sublistId : "routingstep",
																						fieldId : "operationsequence",
																						value : opSequence
																					});// operation_sequnce
																			routing_obj
																					.setCurrentSublistValue({
																						sublistId : "routingstep",
																						fieldId : "operationname",
																						value : operation_name
																					});
																			routing_obj
																					.setCurrentSublistValue({
																						sublistId : "routingstep",
																						fieldId : "manufacturingworkcenter",
																						value : workcenter
																					});
																			routing_obj
																					.setCurrentSublistValue({
																						sublistId : "routingstep",
																						fieldId : "manufacturingcosttemplate",
																						value : costtemplate
																					});
																			routing_obj
																					.setCurrentSublistValue({
																						sublistId : "routingstep",
																						fieldId : "runrate",
																						value : runrate
																					});
																			routing_obj
																					.setCurrentSublistValue({
																						sublistId : "routingstep",
																						fieldId : "setuptime",
																						value : setuptime
																					});
																			routing_obj
																					.commitLine({
																						sublistId : "routingstep"
																					});
																		} catch (e) {
																			log
																					.error(
																							'workcenter='
																									+ workcenter
																									+ "  costtemplate="
																									+ costtemplate,
																							'setuptime='
																									+ setuptime
																									+ "  runrate="
																									+ runrate);
																			log
																					.error({
																						title : "Routing Line Error:"
																								+ e.name,
																						details : e.message
																					});
																			var params = {};
																			params.custrecord_cntm_status_fab_wo_crtn = 12;
																			params.custrecord_cntm_error_fab = e.message;

																			var obj1 = {};
																			obj1.routingName = routingName;
																			obj1.gateId = GATE_ID;
																			obj1.opSequence = opSequence;
																			obj1.Error = e.message;
																			obj1.status = 12;
																			log
																					.debug(
																							'errorObjArr',
																							errorObjArr);
																			errorObjArr
																					.push(e.message);

																		}

																		opSequence = (Number(opSequence) + 10);
																		opSequenceArr
																				.push(opSequence);
																		// log.debug('opSequence',opSequence);
																	} else {
																		log
																				.error(
																						'error',
																						'Missing Gate Time Details');
																		var obj1 = {};
																		obj1.routingName = routingName;
																		obj1.gateId = GATE_ID;
																		obj1.opSequence = opSequence;
																		obj1.Error = 'Missing Gate Time Details';
																		obj1.status = 12;
																		log
																				.debug(
																						'errorObjArr',
																						errorObjArr);
																		errorObjArr
																				.push('Missing Gate Time Details for Gate Id: '
																						+ GATE_ID);
																	}
																});
											} else {
												log
														.error('error',
																'Missing Gate Time Record');
												errorObjArr
														.push('Record for Gate ID and Gate Description could not be found in NetSuite for'
																+ GATE_ID);
											}
										} else {
											if (GATE_Instructions) {
												if (!instObj[lastOp])
													instObj[lastOp] = '';
												instObj[lastOp] = ""
														+ opration_Instructions[lastOp]
																.join('\n');
											}
										}
									}
									return true;
								});
						var routeData = {};
						if (isPresent == false) {
							routeData.error = 'Item is not present in the file';
						} else {
							if (instObj) {
								var instructionsStr = JSON.stringify(instObj);
								log.debug('instObj', instructionsStr);
								routing_obj
										.setValue({
											fieldId : "custrecord_routing_instructions",
											value : instructionsStr
										});
							}
							// log.error('errorObjArr.length',errorObjArr.length);

							if (errorObjArr.length > 0) {
								routeData.error= 'Error while operation lines';
								var contents = 'Error\n' + errorObjArr.join('\n');

								var newFile = file.create({
									name : 'Error File for' + routingName,
									fileType : file.Type.CSV,
									contents : contents,
									folder : 967//1676

								});
								routeData.errFileId = newFile.save();
								
							} else {
								routeData.routeId = routing_obj.save({
									ignoreMandatoryFields : true,
									enableSourcing : true
								});
							}
						}
					}
					
					//routeData.routeId = routingId;
					//routeData.error=error;
					//routeData.errArray=errorObjArr;
					context.response.write(JSON.stringify(routeData));
				} catch (e) {
					log.error('error', e.message);
				}
			}
			function defaultRouting(bom) {
				var manufacturingroutingSearchObj = search.create({
					type : "manufacturingrouting",
					filters : [ [ "isdefault", "is", "T" ], "AND",
							[ "billofmaterials", "anyof", bom ] ],
					columns : [ search.createColumn({
						name : "name",
						sort : search.Sort.ASC,
						label : "Name"
					}) ]
				});
				var searchResultCount = manufacturingroutingSearchObj
						.runPaged().count;
				log.debug("manufacturingroutingSearchObj result count",
						searchResultCount);
				manufacturingroutingSearchObj.run().each(function(result) {
					// .run().each has a limit of 4,000 results
					record.submitFields({
						type : 'manufacturingrouting',
						id : result.id,
						values : {
							isdefault : false
						}
					});
					return true;
				});
			}
			return {
				onRequest : onRequest
			};

		});
