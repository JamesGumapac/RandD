/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(
		[ 'N/record', 'N/runtime', 'N/search', 'N/file' ],
		/**
		 * @param {record}
		 *            record
		 * @param {runtime}
		 *            runtime
		 * @param {search}
		 *            search
		 */
		function(record, runtime, search, file) {

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
				var itemMap = JSON.parse(runtime.getCurrentScript()
						.getParameter({
							name : 'custscript_cntm_item_map'
						}));
				return itemMap;
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
			function map(context) {/*
									 * var dataObj = JSON.parse(context.value);
									 * try { var item = dataObj.item; var
									 * routingFileId =
									 * runtime.getCurrentScript()
									 * .getParameter({ name :
									 * 'custscript_cntm_route_file' }); var
									 * bomInternalId = dataObj.bom; var bomName =
									 * dataObj.bomName; var itemTextArr =
									 * item.split('-'); var subassembly; if
									 * (itemTextArr[itemTextArr.length - 1] ==
									 * 'PCB'||itemTextArr[itemTextArr.length -
									 * 1] == 'CON') subassembly = 'FA'; else {
									 * itemTextArr.splice(0, 1); //subassembly =
									 * itemTextArr.join('-');
									 * if(itemTextArr[0]=='CON'){
									 * itemTextArr.splice(0, 1); //subassembly =
									 * itemTextArr.join('-'); } subassembly =
									 * itemTextArr.join('-'); }
									 * log.debug('subassembly', subassembly);
									 * var routData = {}; var
									 * manufacturingroutingSearchObj = search
									 * .create({ type : "manufacturingrouting",
									 * filters : [ [ "billofmaterials", "anyof",
									 * bomInternalId ] ], columns : [
									 * search.createColumn({ name : "name", //
									 * sort : search.Sort.ASC, label : "Name"
									 * }), search.createColumn({ name :
									 * "billofmaterials", label : "Bill of
									 * Materials" }), search.createColumn({ name :
									 * "internalid", sort : search.Sort.DESC,
									 * label : "Internal Id" }),
									 * search.createColumn({ name : "location",
									 * label : "Location" }) ] }); var
									 * searchResultCount =
									 * manufacturingroutingSearchObj
									 * .runPaged().count;
									 * log.debug("manufacturingroutingSearchObj
									 * result count", searchResultCount); var
									 * lastRoutingId; var routingName; if
									 * (searchResultCount > 0) { routingName =
									 * bomName + ' ' + searchResultCount;
									 * manufacturingroutingSearchObj.run().each(
									 * function(result) { // .run().each has a
									 * limit of 4,000 results lastRoutingId =
									 * result.id; return false; }); }
									 * 
									 * if (routingFileId) {
									 * 
									 * var instructions = "";// Instructions var
									 * oprationNames = new Array(); var
									 * opration_Instructions = {}; // var oData =
									 * {}; var routing_fileObj = file.load({ id :
									 * parseInt(routingFileId) });
									 * 
									 * var routing_iterator =
									 * routing_fileObj.lines.iterator();
									 * defaultRouting(bomInternalId); var
									 * routing_obj = record.create({ type :
									 * record.Type.MANUFACTURING_ROUTING, // id :
									 * lastRoutingId, isDynamic : true });
									 * routing_obj.setValue({ fieldId : "name",
									 * value : routingName });
									 * routing_obj.setValue({ fieldId :
									 * "subsidiary", value : 3 });
									 * routing_obj.setValue({ fieldId :
									 * "location", value : 9 });// 4
									 * routing_obj.setValue({ fieldId :
									 * "billofmaterials", value : bomInternalId
									 * });
									 * 
									 * routing_obj.setValue({ fieldId :
									 * "isdefault", value : true }); var
									 * boardsPerPanelLookUp =
									 * search.lookupFields({ type : 'bom', id :
									 * bomInternalId, columns : [
									 * 'custrecord_cntm_boards_per_panel' ] });
									 * var boardsPerPanel =
									 * boardsPerPanelLookUp.custrecord_cntm_boards_per_panel;
									 * var lines = routing_obj.getLineCount({
									 * sublistId : 'routingstep' }); var
									 * routingId;
									 * 
									 * for (var j = lines - 1; j >= 0; j--) {
									 * routing_obj.removeLine({ sublistId :
									 * 'routingstep', line : j, ignoreRecalc :
									 * true }); }
									 * 
									 * var column = new Array();
									 * column.push(search.createColumn({ name :
									 * "custrecord_work_center_", label : "Work
									 * Center" }));
									 * column.push(search.createColumn({ name :
									 * "custrecord8", label : "Cost Template"
									 * })); column.push(search.createColumn({
									 * name : "custrecord_wip_setup_", label :
									 * "WIP SetUp" }));
									 * column.push(search.createColumn({ name :
									 * "custrecord_wip_time_", label : "WIP
									 * Time" })); var opSequence = 10; var
									 * errorObjArr = new Array(); var instObj =
									 * {}; var isPresent = false; var
									 * opSequenceArr = [];
									 * opSequenceArr.push(opSequence);
									 * routing_iterator .each(function(line) {
									 * var body = line.value; var bodyArray =
									 * body.split('|'); var item = bodyArray[1]; //
									 * log.debug(item,subassembly); if (item ==
									 * subassembly || item.split('_')[0] ==
									 * subassembly) { isPresent = true; var
									 * OPERATION_SEQUENCE = bodyArray[2]; var
									 * GATE_ID = bodyArray[5] var
									 * GATE_DESCRIPTION = bodyArray[6] ?
									 * bodyArray[6] .replace(/,/g, " ") : " ";
									 * GATE_DESCRIPTION = GATE_DESCRIPTION
									 * .trim(); // var //
									 * GATE_DESCRIPTION=bodyArray[6]; //
									 * log.debug('oprationNames',oprationNames);
									 * oprationNames.push(GATE_ID + '-' +
									 * GATE_DESCRIPTION);
									 * opration_Instructions[opSequence] = [];
									 * var GATE_Instructions = ''; var lastOp =
									 * opSequenceArr[opSequenceArr.length - 2];
									 * if (bodyArray.length > 7) { var
									 * lastArrIndex =
									 * Number(oprationNames.length) - 1; var
									 * lastOPName = oprationNames[lastArrIndex];
									 * 
									 * GATE_Instructions = bodyArray[7] ?
									 * bodyArray[7] .replace(/,/g, " ") :
									 * bodyArray[7]; GATE_Instructions =
									 * GATE_Instructions .trim();
									 * 
									 * opration_Instructions[lastOp]
									 * .push(GATE_Instructions); }
									 * 
									 * if (GATE_ID) { //
									 * log.debug('OPERATION_SEQUENCE',OPERATION_SEQUENCE);
									 * var operation_name = GATE_ID + '-' +
									 * GATE_DESCRIPTION; var gateDescription =
									 * GATE_DESCRIPTION;
									 * 
									 * var filter = new Array();
									 * filter.push(search.createFilter({ name :
									 * "custrecord_gate_", operator :
									 * "contains", values : GATE_ID }));
									 * filter.push(search.createFilter({ name :
									 * "custrecord_name_", operator : "is",
									 * values : gateDescription })); var
									 * operations_SearchObj = search .create({
									 * type :
									 * "customrecord_gate_times_and_operations_",
									 * filters : filter, columns : column });
									 * var searchResultCount =
									 * operations_SearchObj .runPaged().count; //
									 * log.debug('gateId='+ //
									 * GATE_ID,'searchResultCount='+ //
									 * searchResultCount); if (searchResultCount >
									 * 0) { operations_SearchObj .run() .each(
									 * function(result) { var workcenter =
									 * result .getValue(result.columns[0]); var
									 * costtemplate = result
									 * .getValue(result.columns[1]); var
									 * setuptime = result
									 * .getValue(result.columns[2]); var runrate =
									 * result .getValue(result.columns[3]);
									 * runrate = runrate / boardsPerPanel; if
									 * (workcenter && costtemplate && (setuptime ||
									 * setuptime == 0) && (runrate || runrate ==
									 * 0)) { try { routing_obj .selectNewLine({
									 * sublistId : "routingstep" }); routing_obj
									 * .setCurrentSublistValue({ sublistId :
									 * "routingstep", fieldId :
									 * "operationsequence", value : opSequence
									 * });// operation_sequnce routing_obj
									 * .setCurrentSublistValue({ sublistId :
									 * "routingstep", fieldId : "operationname",
									 * value : operation_name }); routing_obj
									 * .setCurrentSublistValue({ sublistId :
									 * "routingstep", fieldId :
									 * "manufacturingworkcenter", value :
									 * workcenter }); routing_obj
									 * .setCurrentSublistValue({ sublistId :
									 * "routingstep", fieldId :
									 * "manufacturingcosttemplate", value :
									 * costtemplate }); routing_obj
									 * .setCurrentSublistValue({ sublistId :
									 * "routingstep", fieldId : "runrate", value :
									 * runrate }); routing_obj
									 * .setCurrentSublistValue({ sublistId :
									 * "routingstep", fieldId : "setuptime",
									 * value : setuptime }); routing_obj
									 * .commitLine({ sublistId : "routingstep"
									 * }); } catch (e) {
									 * 
									 * log .error({ title : "Routing Line
									 * Error:" + e.name, details : e.message });
									 * errorObjArr .push(e.message); }
									 * 
									 * opSequence = (Number(opSequence) + 10);
									 * opSequenceArr .push(opSequence); //
									 * log.debug('opSequence',opSequence); }
									 * else { log .error( 'error', 'Missing Gate
									 * Time Details');
									 * 
									 * log .debug( 'errorObjArr', errorObjArr);
									 * errorObjArr .push('Missing Gate Time
									 * Details for Gate Id: ' + GATE_ID); } }); }
									 * else { log .error('error', 'Missing Gate
									 * Time Record'); errorObjArr .push('Record
									 * for Gate ID and Gate Description could
									 * not be found in NetSuite for' + GATE_ID); } }
									 * else { if (!instObj[lastOp])
									 * instObj[lastOp] = ''; instObj[lastOp] = "" +
									 * opration_Instructions[lastOp]
									 * .join('\n'); } } return true; }); if
									 * (isPresent == false) { dataObj.error =
									 * 'Item is not present in the file'; } else {
									 * if (instObj) { var instructionsStr =
									 * JSON.stringify(instObj);
									 * log.debug('instObj', instructionsStr);
									 * routing_obj .setValue({ fieldId :
									 * "custrecord_routing_instructions", value :
									 * instructionsStr }); } //
									 * log.error('errorObjArr.length',errorObjArr.length);
									 * 
									 * if (errorObjArr.length > 0) { var obj = {
									 * 'Error' : 'Error while operation lines',
									 * 
									 * 'errorObjArr' : errorObjArr, 'status' :
									 * 12 }; dataObj.error = 'Error while
									 * operation lines'; dataObj.errorObjArr =
									 * errorObjArr;
									 * 
									 * reduceContext.write({ key : routingName,
									 * value : obj }); } else {
									 * dataObj.routingId = routing_obj.save({
									 * ignoreMandatoryFields : true,
									 * enableSourcing : true }); } } } // var
									 * responseObj; context.write({ key :
									 * subassembly, value : dataObj }); } catch
									 * (e) { log.error('catch_error', e); }
									 */
			}

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
				log.debug('context.values', context.values);
				var dataObj = JSON.parse(context.values[0]);
				try {
					var item = dataObj.item;
					var routingFileId = runtime.getCurrentScript()
							.getParameter({
								name : 'custscript_cntm_route_file'
							});
					var bomInternalId = dataObj.bom;
					var bomName = dataObj.bomName;
					var itemTextArr = item.split('-');
					var subassembly;
					if (itemTextArr[itemTextArr.length - 1] == 'PCB'
							|| itemTextArr[itemTextArr.length - 1] == 'CON')
						subassembly = 'FA';
					else {
						itemTextArr.splice(0, 1);
						// subassembly = itemTextArr.join('-');
						if (itemTextArr[0] == 'CON') {
							itemTextArr.splice(0, 1);
							// subassembly = itemTextArr.join('-');
						}
						subassembly = itemTextArr.join('-');
					}
					log.debug('subassembly', subassembly);
					var routData = {};
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
					var routingName = bomName;
					if (searchResultCount > 0) {
						routingName = bomName + ' ' + searchResultCount;
						manufacturingroutingSearchObj.run().each(
								function(result) {
									// .run().each has a limit of 4,000 results
									lastRoutingId = result.id;
									return false;
								});
					}
					dataObj.routingName = routingName;
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
							// id : lastRoutingId,
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
						routing_obj.setValue({
							fieldId : "custrecord_cntm_fab_boards_per_panel",
							value : boardsPerPanel
						});
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
						column.push(search.createColumn({
							name : "custrecord_cntm_no_use_rout_operation",
							// label : "WIP Time"
						}));
						var opSequence = 10;
						var errorObjArr = [];
						var MissingGateTime = [];
						var instObj = {};
						var isPresent = false;
						var opSequenceArr = [];
						opSequenceArr.push(opSequence);
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
										log.debug('oprationNames',
												oprationNames);
										oprationNames.push(GATE_ID + '-'
												+ GATE_DESCRIPTION);
										log.debug('oprationNames',
												oprationNames);
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
											if (!opration_Instructions[lastOp])
												opration_Instructions[lastOp] = [];
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
																	var doNotUse = result
																			.getValue(result.columns[4]);
																	// log.audit('doNotUse',doNotUse);
																	if (doNotUse == false
																			|| doNotUse == "F") {
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
																						.error({
																							title : "Routing Line Error:"
																									+ e.name,
																							details : e.message
																						});
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

																			log
																					.debug(
																							'errorObjArr',
																							errorObjArr);
																			// errorObjArr
																			MissingGateTime
																					.push('Missing Gate Time Details for Gate Id: '
																							+ GATE_ID);
																		}
																	}
																});
											} else {
												log.error('error',
														'Missing Gate Time Record '
																+ errorObjArr);
												// errorObjArr
												MissingGateTime.push(GATE_ID);
												log
														.error('error',
																'Missing Gate Time Record --');
											}
										} else {
											if (!instObj[lastOp])
												instObj[lastOp] = '';
											instObj[lastOp] = ""
													+ opration_Instructions[lastOp]
															.join('\n');
										}
									}
									return true;
								});
						if (isPresent == false) {
							dataObj.error = 'Item is not present in the file';
							log.error('error-',
									'Item is not present in the file');
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
							if (MissingGateTime.length > 0)
								errorObjArr
										.push('Record for Gate ID and Gate Description could not be found in NetSuite for'
												+ MissingGateTime.join('|'));
							if (errorObjArr.length > 0) {
								var obj = {
									'Error' : 'Error while adding operation lines.',

									'errorObjArr' : errorObjArr,
									'status' : 12
								};
								dataObj.error = 'Error while adding operation lines.';
								dataObj.errorObjArr = errorObjArr;
								log.error('error-',
										'Error while operation lines');
								/*
								 * reduceContext.write({ key : routingName,
								 * value : obj });
								 */
							} else {
								dataObj.routingId = routing_obj.save({
									ignoreMandatoryFields : true,
									enableSourcing : true
								});
							}
						}
					}

					// var responseObj;
					context.write({
						key : subassembly,
						value : dataObj
					});
				} catch (e) {
					log.error('catch-error', e);
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
				summary.output
						.iterator()
						.each(
								function(key, value) {
									var dataObj = JSON.parse(value);
									var recArray = dataObj.recIds;
									for (var id = 0; id < recArray.length; id++) {
										var customHeadarRecord = record
												.load({
													type : "customrecord_cntm_pcb_wo_suitelet_data",
													id : recArray[id]
												});
										var wo = customHeadarRecord.getValue({
											fieldId : 'custrecord_cntm_wo'
										});
										var woText = customHeadarRecord
												.getText({
													fieldId : 'custrecord_cntm_wo'
												});// log.debug('dataObj.routingId',dataObj.routingId);
										if (dataObj.routingId) {
											customHeadarRecord
													.setValue({
														fieldId : 'custrecord_cntm_routing',
														value : dataObj.routingId
													});
											customHeadarRecord
													.setValue({
														fieldId : 'custrecord_cntm_error_in_routing',
														value : ''
													});
											customHeadarRecord
													.setValue({
														fieldId : 'custrecord_cntm_rout_status',
														value : 2
													});
											customHeadarRecord
													.setValue({
														fieldId : 'custrecord_cntm_create_new_routing',
														value : false
													});
										}
										if (dataObj.error) {
											customHeadarRecord
													.setValue({
														fieldId : 'custrecord_cntm_routing',
														value : ''
													});
											customHeadarRecord
													.setValue({
														fieldId : 'custrecord_cntm_error_in_routing',
														value : dataObj.error
													});
											if (dataObj.errorObjArr) {
												var finalErrFile = customHeadarRecord
														.getValue({
															fieldId : 'custrecord_cntm_combined_error_file'
														});
												var fileObj = file.load({
													id : finalErrFile
												});
												var newContents = '';
												var file_iterator = fileObj.lines
														.iterator();
												var flag = false;
												file_iterator
														.each(function(line) {
															var body = line.value;

															var bodyArray = body
																	.split(',');
															if (bodyArray[0] == woText) {
																bodyArray[1] = dataObj.errorObjArr
																		.join(',');
																newContents += bodyArray
																		.join(',');
																newContents += '\n';
																flag = true;
																// return false;
															} else
																newContents += body
																		+ '\n';
															return true;
														});
												if (flag == false)
													newContents += woText
															+ ','
															+ dataObj.errorObjArr
																	.join(',');
												var newFinalFile = file
														.create({
															name : fileObj.name,
															fileType : file.Type.CSV,
															contents : newContents,
															folder : 967//1676
														});
												/*
												 * fileObj .appendLine({ value :
												 * woText + ',' +
												 * dataObj.errorObjArr
												 * .join(',') });
												 */
												var errFile = newFinalFile
														.save();
												var contents = 'Error\n'
														+ dataObj.errorObjArr
																.join('\n');

												var newFile = file
														.create({
															name : 'Error File for'
																	+ dataObj.routingName,
															fileType : file.Type.CSV,
															contents : contents,
															folder : 967//1676

														});
												var errFileId = newFile.save();
												customHeadarRecord
														.setValue({
															fieldId : 'custrecord_cntm_err_file_id',
															value : errFileId
														});
											}
											customHeadarRecord
													.setValue({
														fieldId : 'custrecord_cntm_rout_status',
														value : 3
													});
											customHeadarRecord
													.setValue({
														fieldId : 'custrecord_cntm_create_new_routing',
														value : false
													});
										}
										customHeadarRecord.save();
										if (dataObj.routingId) {
											var WORecord = record.load({
												type : "workorder",
												id : wo
											});
                                          var isWip = WORecord
									.getValue({
										fieldId: 'iswip'
									});
								log.debug('isWip', isWip);
								if (isWip != true && isWip != 'T')
									WORecord
										.setValue({
											fieldId: 'iswip',
											value: true
										});
											WORecord
													.setValue({
														fieldId : 'manufacturingrouting',
														value : dataObj.routingId
													});
											WORecord.save();
										}

									}
									return true;
								});
			}

			return {
				getInputData : getInputData,
				// map : map,
				reduce : reduce,
				summarize : summarize
			};

		});
