/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(
		[ 'N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget',
				'N/redirect' ],
		/**
		 * @param {record}
		 *            record
		 * @param {runtime}
		 *            runtime
		 * @param {search}
		 *            search
		 */
		function(record, runtime, search, ui, redirect) {

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
						var isEdit = context.request.parameters.isedit;
						var title = 'Delete Completion';
						if (isEdit)
							title = 'Edit Completions';
						var form = ui.createForm({
							title : title
						});
						var chkFld = form.addField({
							id : 'custpage_chkfld',
							label : 'Chk',
							type : ui.FieldType.TEXT
						});
						chkFld.defaultValue = 1;
						chkFld.updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});
						var wo = context.request.parameters.wo;

						if (isEdit) {
							var isEditChk = form.addField({
								id : 'custpage_iseditchk',
								label : 'Chk',
								type : ui.FieldType.TEXT
							});
							isEditChk.defaultValue = 1;
							isEditChk.updateDisplayType({
								displayType : ui.FieldDisplayType.HIDDEN
							});
							var lotCumulitiveMap = form.addField({
								id : 'custpage_lot_cumqty_map',
								label : 'Chk',
								type : ui.FieldType.TEXTAREA
							});
							
							lotCumulitiveMap.updateDisplayType({
								displayType : ui.FieldDisplayType.HIDDEN
							});
						}
						var itemSublist = form.addSublist({
							id : 'custpage_completion_sublist',
							type : ui.SublistType.LIST,
							label : 'Work Order Completions',
							container : 'custpage_components_grp'
						});
						if (!isEdit)
							itemSublist.addMarkAllButtons();
						var chk = itemSublist.addField({
							id : 'custpage_selectwoc',
							label : 'Select',
							type : ui.FieldType.CHECKBOX
						});
						var panelLot = itemSublist.addField({
							id : 'custpage_panel_no',
							label : 'Panel Lot',
							type : ui.FieldType.TEXT
						});
						panelLot.isMandatory = true;
						panelLot.updateDisplayType({
							displayType : ui.FieldDisplayType.DISABLED
						});
						if (isEdit) {
							var woQty = itemSublist.addField({
								id : 'custpage_wo_qty',
								label : 'Lot Qty',
								type : ui.FieldType.INTEGER
							});
							// woQty.isMandatory = true;
							/*
							 * woQty.updateDisplayType({ displayType :
							 * ui.FieldDisplayType.ENTRY }).updateDisplayType({
							 * displayType : ui.FieldDisplayType.DISABLED });
							 */
						}
						var opration = itemSublist.addField({
							id : 'custpage_operation',
							label : 'Operation',
							type : ui.FieldType.TEXT
						});

						opration.updateDisplayType({
							displayType : ui.FieldDisplayType.DISABLED
						});
						var scrap = itemSublist.addField({
							id : 'custpage_scrap',
							// source : 'workordercompletion',
							label : 'Scrap Quantity',
							type : ui.FieldType.INTEGER
						});
						scrap.updateDisplayType({
							displayType : ui.FieldDisplayType.ENTRY
						});

						if (!isEdit)
							scrap.updateDisplayType({
								displayType : ui.FieldDisplayType.INLINE
							});
						var cumScrap = itemSublist.addField({
							id : 'custpage_cum_scrap',
							// source : 'workordercompletion',
							label : 'Cum Scrap Quantity',
							type : ui.FieldType.INTEGER
						});
						cumScrap.updateDisplayType({
							displayType : ui.FieldDisplayType.ENTRY
						}).updateDisplayType({
							displayType : ui.FieldDisplayType.DISABLED
						});
						if (isEdit) {
							var scrapOrig = itemSublist.addField({
								id : 'custpage_scrap_origin',
								// source : 'workordercompletion',
								label : 'Scrap Quantity Orig',
								type : ui.FieldType.INTEGER
							});
							scrapOrig.updateDisplayType({
								displayType : ui.FieldDisplayType.HIDDEN
							});
                          var cumScrapOrig = itemSublist.addField({
								id : 'custpage_cumscrap_origin',
								// source : 'workordercompletion',
								label : 'Cum Scrap Quantity Orig',
								type : ui.FieldType.INTEGER
							});
							cumScrapOrig.updateDisplayType({
								displayType : ui.FieldDisplayType.HIDDEN
							});
							/*var goodQtOrig = itemSublist.addField({
								id : 'custpage_gd_qty_origin',
								// source : 'workordercompletion',
								label : 'Good Quantity Orig',
								type : ui.FieldType.INTEGER
							});
                          goodQtOrig.updateDisplayType({
								displayType : ui.FieldDisplayType.HIDDEN
							});*/
							var scrapRsn = itemSublist.addField({
								id : 'custpage_scrap_rsn_chk',
								label : 'Scrap Reason',
								type : ui.FieldType.CHECKBOX
							});
                          var qtyGood = itemSublist.addField({
								id : 'custpage_good_qty',
								// source : 'workordercompletion',
								label : 'Quantity Good',
								type : ui.FieldType.FLOAT
							});
							qtyGood.updateDisplayType({
								displayType : ui.FieldDisplayType.ENTRY
							}).updateDisplayType({
								displayType : ui.FieldDisplayType.DISABLED
							});
							var laborSetup = itemSublist.addField({
								id : 'custpage_labor_setup_time',
								label : 'Labor Setup',
								type : ui.FieldType.FLOAT
							});
							laborSetup.updateDisplayType({
								displayType : ui.FieldDisplayType.ENTRY
							});
							var laborRun = itemSublist.addField({
								id : 'custpage_labor_run_time',
								label : 'Labor Run',
								type : ui.FieldType.FLOAT
							});
							laborRun.updateDisplayType({
								displayType : ui.FieldDisplayType.ENTRY
							});

							var isLast = itemSublist.addField({
								id : 'custpage_last_operation',
								label : 'Last Operation',
								type : ui.FieldType.CHECKBOX
							});
							isLast.updateDisplayType({
								displayType : ui.FieldDisplayType.HIDDEN
							});
						}

						var woc = itemSublist.addField({
							id : 'custpage_woc',
							source : 'workordercompletion',
							label : 'WOC',
							type : ui.FieldType.SELECT
						});
						woc.updateDisplayType({
							displayType : ui.FieldDisplayType.INLINE
						});
						var subId = itemSublist.addField({
							id : 'custpage_id',
							// source : 'workordercompletion',
							label : 'Id',
							type : ui.FieldType.TEXT
						});
						subId.updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});
						var lotRec = itemSublist.addField({
							id : 'custpage_lotrec',
							// source : 'workordercompletion',
							label : 'Lot Rec',
							type : ui.FieldType.TEXT
						});
						lotRec.updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});
						var scrapReason = itemSublist.addField({
							id : 'custpage_scrap_reason',
							// source : 'workordercompletion',
							label : 'Scrap Reason',
							type : ui.FieldType.TEXTAREA
						});
						scrapReason.updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});
						var scrapReasonHdn = itemSublist.addField({
							id : 'custpage_scrap_reason_hdn',
							// source : 'workordercompletion',
							label : 'Scrap Reason',
							type : ui.FieldType.TEXTAREA
						});
						scrapReasonHdn.updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});
						// var lots=[];
						if (!isEdit) {
							var customrecord_cntm_lot_creationSearchObj = search
									.create({
										type : "customrecord_cntm_lot_creation",
										filters : [ [
												"custrecord_cntm_lot_wonum",
												"anyof", wo ] ],
										columns : [
												search.createColumn({
													name : "scriptid",
													sort : search.Sort.ASC
												}),
												"custrecord_cntm_lot_wonum",
												"custrecord_cntm_lot_wo_completion",
												"custrecord_cntm_lot_assembly_item",
												"custrecord_cntm_lot_lotnumber",
												"custrecord_cntm_wo_details_fab" ]
									});

							var i = 0;
							var searchResultCount = customrecord_cntm_lot_creationSearchObj
									.runPaged().count;
							log
									.debug(
											"customrecord_cntm_lot_creationSearchObj result count",
											searchResultCount);
							customrecord_cntm_lot_creationSearchObj
									.run()
									.each(
											function(result) {
												// .run().each has a limit of
												// 4,000
												// results
												// lots.push(result.getValue({name:'custrecord_cntm_lot_lotnumber'}));
												var lot = result
														.getValue({
															name : 'custrecord_cntm_lot_lotnumber'
														});
												var customrecord_cntm_clientappsublistSearchObj = search
														.create({
															type : "customrecord_cntm_clientappsublist",
															filters : [
																	[
																			"custrecord_cntm_work_order",
																			"anyof",
																			wo ],
																	"AND",
																	/*
																	 * ["custrecord_cntm_cso_wocnumber","noneof",'null'],
																	 * "AND",
																	 */
																	[
																			"custrecord_cntm_cso_pannellot",
																			"is",
																			lot ] ],
															columns : [
																	"custrecord_cntm_cso_pannellot",
																	"custrecord_cntm_cso_operaton",
																	"custrecord_cntm_cso_wocnumber",
																	"custrecord_cntm_cso_scrap_quantity",
																	search
																			.createColumn({
																				name : "custrecord_cntm_seq_no",
																				sort : search.Sort.DESC
																			}),
																	search
																			.createColumn({
																				name : "custrecord_cntm_lot_record",
																			// sort
																			// :
																			// search.Sort.DESC
																			}) ]
														});

												var searchResultCount = customrecord_cntm_clientappsublistSearchObj
														.runPaged().count;
												log
														.debug(
																"customrecord_cntm_clientappsublistSearchObj result count",
																searchResultCount);
												customrecord_cntm_clientappsublistSearchObj
														.run()
														.each(
																function(result) {
																	// .run().each
																	// has a
																	// limit
																	// of 4,000
																	// results
																	var woc = result
																			.getValue({
																				name : 'custrecord_cntm_cso_wocnumber'
																			});
																	log
																			.debug(
																					'woc',
																					woc);
																	if (woc) {
																		itemSublist
																				.setSublistValue({
																					id : 'custpage_panel_no',
																					line : i,
																					value : result
																							.getValue({
																								name : 'custrecord_cntm_cso_pannellot'
																							})
																				});

																		itemSublist
																				.setSublistValue({
																					id : 'custpage_operation',
																					line : i,
																					value : result
																							.getValue({
																								name : 'custrecord_cntm_cso_operaton'
																							})
																				});

																		itemSublist
																				.setSublistValue({
																					id : 'custpage_woc',
																					line : i,
																					value : woc
																				});
																		itemSublist
																				.setSublistValue({
																					id : 'custpage_id',
																					line : i,
																					value : result.id
																				});
																		var lotRec = result
																				.getValue({
																					name : 'custrecord_cntm_lot_record'
																				});
																		log
																				.debug(
																						'lotRec',
																						lotRec);
																		itemSublist
																				.setSublistValue({
																					id : 'custpage_lotrec',
																					line : i,
																					value : lotRec
																				});
																		var scrap = result
																				.getValue({
																					name : 'custrecord_cntm_cso_scrap_quantity'
																				});
																		log
																				.debug(
																						'scrap',
																						scrap);
																		if (scrap)
																			itemSublist
																					.setSublistValue({
																						id : 'custpage_scrap',
																						line : i,
																						value : scrap
																					});
																		var lotRecFieldLookUp = search
																				.lookupFields({
																					type : 'customrecord_cntm_lot_creation',
																					id : lotRec,
																					columns : [ 'custrecord_cntm_cumulative_scrap_qty' ]
																				});
																		log
																				.debug(
																						lotRec,
																						lotRecFieldLookUp.custrecord_cntm_cumulative_scrap_qty);
																		var cumQty = lotRecFieldLookUp.custrecord_cntm_cumulative_scrap_qty/* ? lotRecFieldLookUp.custrecord_cntm_cumulative_scrap_qty
																				: 0*/;
																		if(cumQty)
																		itemSublist
																				.setSublistValue({
																					id : 'custpage_cum_scrap',
																					line : i,
																					value : cumQty
																				});
																		var scrapReason = [];
																		var customrecord_cntm_scrap_historySearchObj = search
																				.create({
																					type : "customrecord_cntm_scrap_history",
																					filters : [ [
																							"custrecord_cntm_parent",
																							"anyof",
																							result.id ] ],
																					columns : [
																							"custrecord_cntm_sh_lotref_num",
																							"custrecord_cntm_sh_scrap_reason",
																							"custrecord_cntm_parent",
																							"custrecord_cntm_sh_scrap_qty" ]
																				});
																		var searchResultCount = customrecord_cntm_scrap_historySearchObj
																				.runPaged().count;
																		log
																				.debug(
																						"customrecord_cntm_scrap_historySearchObj result count",
																						searchResultCount);
																		customrecord_cntm_scrap_historySearchObj
																				.run()
																				.each(
																						function(
																								result) {
																							// .run().each
																							// has
																							// a
																							// limit
																							// of
																							// 4,000
																							// results
																							scrapReason
																									.push(result.id);
																							return true;
																						});
																		log
																				.debug(
																						'scrapReason',
																						scrapReason);
																		itemSublist
																				.setSublistValue({
																					id : 'custpage_scrap_reason',
																					line : i,
																					value : JSON
																							.stringify(scrapReason)
																				});
																		i++;
																		return false;
																	}
																	return true;
																});
												return true;
											});
						} else {
							var cumQtMap={};
							var i = 0;
							var customrecord_cntm_clientappsublistSearchObj = search
									.create({
										type : "customrecord_cntm_clientappsublist",
										filters : [
												[ "custrecord_cntm_work_order",
														"anyof", wo ], ],
										columns : [
												"custrecord_cntm_cso_pannellot",
												"custrecord_cntm_cso_operaton",
												"custrecord_cntm_cso_wocnumber",
												"custrecord_cntm_cso_scrap_quantity",
												"custrecord_cntm_cso_woc_quantity",
												"custrecord_cntm_cso_laborsetuptime",
												"custrecord_cntm_cso_laborruntime",
												"custrecord_cntm_last_operation",
												"custrecord_cntm_cso_quantity_good",
												search
														.createColumn({
															name : "custrecord_cntm_seq_no",
															sort : search.Sort.DESC
														}),
												search
														.createColumn({
															name : "custrecord_cntm_lot_record",
														// sort :
														// search.Sort.DESC
														}) ]
									});

							var searchResultCount = customrecord_cntm_clientappsublistSearchObj
									.runPaged().count;
							log
									.debug(
											"customrecord_cntm_clientappsublistSearchObj result count",
											searchResultCount);
							customrecord_cntm_clientappsublistSearchObj
									.run()
									.each(
											function(result) {
												// .run().each
												// has a limit
												// of 4,000
												// results
												var woc = result
														.getValue({
															name : 'custrecord_cntm_cso_wocnumber'
														});
												log.debug('woc', woc);
												if (woc) {
													var lot=result
													.getValue({
														name : 'custrecord_cntm_cso_pannellot'
													});
													itemSublist
															.setSublistValue({
																id : 'custpage_panel_no',
																line : i,
																value : lot
															});
													itemSublist
															.setSublistValue({
																id : 'custpage_wo_qty',
																line : i,
																value : result
																		.getValue({
																			name : 'custrecord_cntm_cso_woc_quantity'
																		})
															});
													itemSublist
															.setSublistValue({
																id : 'custpage_operation',
																line : i,
																value : result
																		.getValue({
																			name : 'custrecord_cntm_cso_operaton'
																		})
															});
													var goodQty=result
													.getValue({
														name : 'custrecord_cntm_cso_quantity_good'
													});
															itemSublist
															.setSublistValue({
																id : 'custpage_good_qty',
																line : i,
																value : parseInt(goodQty)
															});
                                                  /*itemSublist
															.setSublistValue({
																id : 'custpage_gd_qty_origin',
																line : i,
																value : parseInt(goodQty)
															});*/
													itemSublist
															.setSublistValue({
																id : 'custpage_labor_setup_time',
																line : i,
																value : result
																		.getValue({
																			name : 'custrecord_cntm_cso_laborsetuptime'
																		})
															});
													itemSublist
															.setSublistValue({
																id : 'custpage_labor_run_time',
																line : i,
																value : result
																		.getValue({
																			name : 'custrecord_cntm_cso_laborruntime'
																		})
															});
													itemSublist
															.setSublistValue({
																id : 'custpage_woc',
																line : i,
																value : woc
															});
													itemSublist
															.setSublistValue({
																id : 'custpage_id',
																line : i,
																value : result.id
															});
													var lotRec = result
															.getValue({
																name : 'custrecord_cntm_lot_record'
															});
													log.debug('lotRec', lotRec);
													itemSublist
															.setSublistValue({
																id : 'custpage_lotrec',
																line : i,
																value : lotRec
															});
													var lotRecFieldLookUp = search
															.lookupFields({
																type : 'customrecord_cntm_lot_creation',
																id : lotRec,
																columns : [ 'custrecord_cntm_cumulative_scrap_qty' ]
															});
													log
															.debug(
																	lotRec,
																	lotRecFieldLookUp.custrecord_cntm_cumulative_scrap_qty);
													var cumQty = lotRecFieldLookUp.custrecord_cntm_cumulative_scrap_qty/* ? lotRecFieldLookUp.custrecord_cntm_cumulative_scrap_qty
															: 0*/;
													log.debug('cumQty',cumQty);
													cumQtMap[lot]=cumQty?cumQty:0;
													if(cumQty){
													itemSublist
															.setSublistValue({
																id : 'custpage_cum_scrap',
																line : i,
																value : cumQty
															});
                                                  itemSublist
													.setSublistValue({
														id : 'custpage_cumscrap_origin',
														line : i,
														value : cumQty 
													});
													}
													var lstOP=result
													.getValue({
														name : 'custrecord_cntm_last_operation'
													});
													log.debug('lstOP',lstOP);
													itemSublist
															.setSublistValue({
																id : 'custpage_last_operation',
																line : i,
																value :  lstOP?'T':'F'
															});
													var scrap = result
															.getValue({
																name : 'custrecord_cntm_cso_scrap_quantity'
															});
													log.debug('scrap', scrap);
												 if(scrap){
													itemSublist
															.setSublistValue({
																id : 'custpage_scrap',
																line : i,
																value : scrap /*
																				 * ?
																				 * scrap :
																				 * parseInt(0)
																				 */
															});
													itemSublist
															.setSublistValue({
																id : 'custpage_scrap_origin',
																line : i,
																value : scrap /*
																				 * ?
																				 * scrap :
																				 * parseInt(0)
																				 */
															});
												 }
													var scrapReason = [];
													var customrecord_cntm_scrap_historySearchObj = search
															.create({
																type : "customrecord_cntm_scrap_history",
																filters : [ [
																		"custrecord_cntm_parent",
																		"anyof",
																		result.id ] ],
																columns : [
																		"custrecord_cntm_sh_lotref_num",
																		"custrecord_cntm_sh_scrap_reason",
																		"custrecord_cntm_parent",
																		"custrecord_cntm_sh_scrap_qty" ]
															});
													var searchResultCount = customrecord_cntm_scrap_historySearchObj
															.runPaged().count;
													log
															.debug(
																	"customrecord_cntm_scrap_historySearchObj result count",
																	searchResultCount);
													customrecord_cntm_scrap_historySearchObj
															.run()
															.each(
																	function(
																			result) {
																		// .run().each
																		// has a
																		// limit
																		// of
																		// 4,000
																		// results
																		var map={};
																		map.reason=result.getValue({
									name : 'custrecord_cntm_sh_scrap_reason'
								});
																		map.qty=result.getValue({
																			name : 'custrecord_cntm_sh_scrap_qty'
																		});
																		scrapReason
																		.push(map);
																		/*scrapReason
																				.push(result.id);*/
																		return true;
																	});
													log.debug('scrapReason',
															scrapReason);
													itemSublist
															.setSublistValue({
																id : 'custpage_scrap_reason_hdn',
																line : i,
																value : JSON
																		.stringify(scrapReason)
															});
													i++;
													return true;
												}
												return true;
											});
							lotCumulitiveMap.defaultValue = JSON.stringify(cumQtMap);
						}
						form.addSubmitButton({
							label : 'Submit'
						});
						var button = form.addButton({
							id : 'custpage_process',
							label : 'Back',
							functionName : 'processNew'
						});
						form.clientScriptModulePath = './CNTM_CS_ClientAppWOC.js';
						//form.clientScriptFileId = 16154;
						context.response.writePage(form);
					} else {
						try {
							var isEdit = context.request.parameters.custpage_iseditchk;
							var lineCount = context.request.getLineCount({
								group : 'custpage_completion_sublist'
							});
							log.debug('Total Lines ' + lineCount);
							for (var int = 0; int < lineCount; int++) {
								var setSublist = {};
								var createWocCheck = context.request
										.getSublistValue({
											group : 'custpage_completion_sublist',
											name : 'custpage_selectwoc',
											line : int
										});
								if (createWocCheck == true
										|| createWocCheck == 'T') {
									var woc = context.request.getSublistValue({
										group : 'custpage_completion_sublist',
										name : 'custpage_woc',
										line : int
									});
									var subId = context.request
											.getSublistValue({
												group : 'custpage_completion_sublist',
												name : 'custpage_id',
												line : int
											});
									var operation = context.request
											.getSublistValue({
												group : 'custpage_completion_sublist',
												name : 'custpage_operation',
												line : int
											});
									var lotRec = context.request
											.getSublistValue({
												group : 'custpage_completion_sublist',
												name : 'custpage_lotrec',
												line : int
											});
									var scrap = context.request
											.getSublistValue({
												group : 'custpage_completion_sublist',
												name : 'custpage_scrap',
												line : int
											});
									scrap = scrap ? scrap : 0;
									var cumScrap = context.request
											.getSublistValue({
												group : 'custpage_completion_sublist',
												name : 'custpage_cum_scrap',
												line : int
											});
									cumScrap = cumScrap ? cumScrap : 0
											log.debug('cumScrap', cumScrap);
											if (!isEdit)
												cumScrap = cumScrap - scrap;
									var qtyGood=context.request
									.getSublistValue({
										group : 'custpage_completion_sublist',
										name : 'custpage_good_qty',
										line : int
									});
									var scrapReason = context.request
											.getSublistValue({
												group : 'custpage_completion_sublist',
												name : 'custpage_scrap_reason',
												line : int
											});
									var scrapReasonHdn = context.request
									.getSublistValue({
										group : 'custpage_completion_sublist',
										name : 'custpage_scrap_reason_hdn',
										line : int
									});
									var laborSetup = context.request
											.getSublistValue({
												group : 'custpage_completion_sublist',
												name : 'custpage_labor_setup_time',
												line : int
											});
									var laborRun = context.request
											.getSublistValue({
												group : 'custpage_completion_sublist',
												name : 'custpage_labor_run_time',
												line : int
											});
									var isLast = context.request
											.getSublistValue({
												group : 'custpage_completion_sublist',
												name : 'custpage_last_operation',
												line : int
											});
									if (scrapReason)
										scrapReason = JSON.parse(scrapReason);
									log.debug('-scrapReason', scrapReason);
									if (!isEdit) {
										  var recId = record.delete({
										  type:record.Type.WORK_ORDER_COMPLETION,
										  id: woc });
										log.debug('recId', recId);
                                      }										 
									if (!isEdit || scrap==0) {
										if(scrapReason)
										if (scrapReason.length > 0) {
											for (var i = 0; i < scrapReason.length; i++) {
												
												  var scrapId = record.delete({
												  type:'customrecord_cntm_scrap_history',
												  id: scrapReason[i] });
												 
												log.debug('scrapId', scrapId)
											}
										}
										/*
										 * var fieldLookUp =
										 * search.lookupFields({ type:
										 * 'customrecord_cntm_lot_creation', id:
										 * lotRec, columns:
										 * ['custrecord_cntm_cumulative_scrap_qty']
										 * });
										 * 
										 * var
										 * cumScrap=fieldLookUp.custrecord_cntm_cumulative_scrap_qty;
										 */							
										
									}else{
										if (scrapReasonHdn){
											var editRecArr=[];
											scrapReasonHdn = JSON.parse(scrapReasonHdn);
										if (scrapReasonHdn.length > 0) {
											for (var resn = 0; resn < scrapReasonHdn.length; resn++) {
												var reason = scrapReasonHdn[resn].reason;
												var qty = scrapReasonHdn[resn].qty;
												log.debug(reason,qty);
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
													 editRecArr.push(recId);
												}
											
											}
										}
										if (editRecArr.length > 0) {
											var customrecord_cntm_scrap_historySearchObj1 = search
													.create({
														type : "customrecord_cntm_scrap_history",
														filters : [
																[ "custrecord_cntm_parent",
																		"anyof", subId ],
																"AND",
																[ "internalid", "noneof",
																		editRecArr ] ],
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
											var searchResultCount1 = customrecord_cntm_scrap_historySearchObj1
													.runPaged().count;
											log
													.debug(
															"customrecord_cntm_scrap_historySearchObj1 result count",
															searchResultCount1);

											if (searchResultCount > 0)
												customrecord_cntm_scrap_historySearchObj1
														.run().each(function(result) {
															var scrapId = record.delete({
																  type:'customrecord_cntm_scrap_history',
																  id: result.id });
															log.debug('scrapId', scrapId);
															return true;
														});
										}
										}
									}
									record
									.submitFields({
										type : 'customrecord_cntm_lot_creation',
										id : lotRec,
										values : {
											custrecord_cntm_cumulative_scrap_qty : cumScrap
										},
										options : {
											enableSourcing : false,
											ignoreMandatoryFields : true
										}
									});
									var clientAppfieldLookUp = search
											.lookupFields({
												type : 'customrecord_cntm_clientappsublist',
												id : subId,
												columns : [
														'custrecord_cntm_cso_quantity_good',
														'custrecord_cntm_cso_woc_quantity' ]
											});
									var qtyGoodRec = clientAppfieldLookUp.custrecord_cntm_cso_quantity_good;
									log.debug('qtyGoodRec', qtyGoodRec);
									qtyGoodRec = qtyGoodRec ? qtyGoodRec : 0;
									if (!isEdit)
										qtyGood = parseInt(qtyGoodRec)
												+ parseInt(scrap);
									/*
									 * else { var woQty =
									 * clientAppfieldLookUp.custrecord_cntm_cso_woc_quantity;
									 * log.debug('woQty', woQty); qtyGood =
									 * parseInt(woQty) - parseInt(scrap); }
									 */
									if (isEdit) {
										log.debug('scrap: ' + scrap,
												'qtyGood: ' + qtyGood);
										var wocRec = record
												.load({
													type : record.Type.WORK_ORDER_COMPLETION,
													id : woc
												});
										
										wocRec.setValue({
											fieldId : 'completedquantity',
											value : qtyGood
										});
										var operationLine = wocRec
												.getLineCount({
													sublistId : 'operation'
												});
										log.debug('operationLine',
												operationLine);
										if (operationLine > 0) {
											for (var i = 0; i < operationLine; i++) {
												var op = wocRec
														.getSublistValue({
															sublistId : 'operation',
															fieldId : 'operationname',
															line : i
														});
												if (op == operation) {
													wocRec
															.selectLine({
																sublistId : 'operation',
																line : i
															});
													wocRec
															.setCurrentSublistValue({
																sublistId : 'operation',
																fieldId : 'setuptime',
																value : laborSetup
															});
													wocRec
															.setCurrentSublistValue({
																sublistId : 'operation',
																fieldId : 'runrate',
																value : laborRun
															});
													wocRec.commitLine({
														sublistId : 'operation'
													});
													break;
												}
											}
										}
										/*wocRec.setValue({
											fieldId : 'scrapquantity',
											value : ''
										});*/
										log.debug('isLast', isLast);
										if (isLast=='T') {
											wocRec.setValue({
												fieldId : 'scrapquantity',
												value : parseInt(cumScrap)
											});
											var inventory = wocRec
													.getSubrecord({
														fieldId : 'inventorydetail'
													});
											var inventoryLine = inventory
													.getLineCount({
														sublistId : 'inventoryassignment'
													});
											log.debug('inventoryLine',
													inventoryLine);
											if (inventoryLine > 0) {
												// for(var
												// j=0;j<inventoryLine;j++){
												// inventory.selectLine({sublistId:'inventoryassignment',line:0});
												log.debug('1');
												inventory
														.setSublistValue({
															sublistId : 'inventoryassignment',
															fieldId : 'quantity',
															value : qtyGood,
															line : 0
														});
												log.debug('2');
												// inventory.commitLine({sublistId:'inventoryassignment'});
												// //}
											}
										}
										var wocRecId = wocRec.save();
										log.debug('wocRecId', wocRecId);

										/*
										 * record .submitFields({ type :
										 * record.Type.WORK_ORDER_COMPLETION, id :
										 * woc, values : { scrapquantity :
										 * parseInt(scrap),
										 * completedquantity:qtyGood }, options : {
										 * enableSourcing : false,
										 * ignoreMandatoryFields : true } });
										 */
										record
												.submitFields({
													type : 'customrecord_cntm_clientappsublist',
													id : subId,
													values : {
														// custrecord_cntm_cso_status
														// : 1,
														custrecord_cntm_cso_scrap_quantity : scrap,
													 custrecord_cntm_cso_scarp_cumulative:cumScrap,
														// custrecord_cntm_cso_createwo_completion
														// : false,
														custrecord_cntm_cso_quantity_good : qtyGood
													},
													options : {
														enableSourcing : false,
														ignoreMandatoryFields : true
													}
												});
									} else
										record
												.submitFields({
													type : 'customrecord_cntm_clientappsublist',
													id : subId,
													values : {
														custrecord_cntm_cso_status : 1,
														custrecord_cntm_cso_scrap_quantity : '',
														custrecord_cntm_cso_scarp_cumulative : '',
														custrecord_cntm_cso_createwo_completion : false,
														custrecord_cntm_cso_quantity_good : qtyGood
													},
													options : {
														enableSourcing : false,
														ignoreMandatoryFields : true
													}
												});
								}
								var params = {
									'delMsg' : 'true'
								};
								if (isEdit)
									params = {
										'editMsg' : 'true'
									};
								redirect
										.toSuitelet({
											scriptId : 'customscript_cntm_client_su',
											deploymentId : 'customdeploy_cntm_client_su',

											parameters : params

										});
							}
						} catch (e) {
							throw e.message;
						}
					}
				} catch (err) {
					log.error('error', err.message);
				}
			}

			return {
				onRequest : onRequest
			};

		});
