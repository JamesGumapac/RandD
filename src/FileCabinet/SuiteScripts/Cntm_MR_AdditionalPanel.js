/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define([ 'N/record', 'N/runtime', 'N/search', 'N/email' ],
/**
 * @param {record}
 *            record
 * @param {runtime}
 *            runtime
 * @param {search}
 *            search
 */
function(record, runtime, search,email) {

	/**
	 * Marks the beginning of the Map/Reduce process and generates input data.
	 * 
	 * @typedef {Object} ObjectRef
	 * @property {number} id - Internal ID of the record instance
	 * @property {string} type - Record type id
	 * 
	 * @return {Array|Object|Search|RecordRef} inputSummary
	 * @since 2015.1
	 */
	function getInputData() {
		var wo = runtime.getCurrentScript().getParameter({
			name : 'custscript_cntm_wo_no'
		});
		var panel = runtime.getCurrentScript().getParameter({
			name : 'custscript_cntm_panel_no'
		});
		var recId = runtime.getCurrentScript().getParameter({
			name : 'custscript_cntm_sublist_recid'
		});
		var scrapped = runtime.getCurrentScript().getParameter({
			name : 'custscript_cntm_scrapped'
		});
		var lotQty = runtime.getCurrentScript().getParameter({
			name : 'custscript_cntm_lotqty'
		});
		log.debug('lotQty',lotQty);
		var results = getSublistRec(wo, panel, recId,scrapped,lotQty);
		return results;
	}

	function getSublistRec(wo, panel, recId,scrapped,lotQty) {
		var sublists = [];
		var filters=[[ "custrecord_cntm_work_order", "anyof", wo ], "AND",
					[ "custrecord_cntm_cso_pannellot", "is", panel ], "AND",
					[ "custrecord_cntm_cso_wocnumber", "anyof", "@NONE@" ]];
		if(scrapped == true || scrapped == 'true' || scrapped == 'T'){
			filters.push("AND");
			filters.push([ "internalid", "noneof", recId ]);
		}
		var customrecord_cntm_clientappsublistSearchObj = search.create({
			type : "customrecord_cntm_clientappsublist",
			filters : filters,
			columns : [ "custrecord_cntm_cso_pannellot",
					"custrecord_cntm_cso_operaton",
					search.createColumn({
				         name: "custrecord_cntm_seq_no",
				         sort: search.Sort.ASC,
				         label: "Sequence No"
				      })]
		});
		var searchResultCount = customrecord_cntm_clientappsublistSearchObj
				.runPaged().count;
		log.debug("customrecord_cntm_clientappsublistSearchObj result count",
				searchResultCount);
		customrecord_cntm_clientappsublistSearchObj.run().each(
				function(result) {
					// .run().each has a limit of 4,000 results
					sublists.push(result.id);
					record.submitFields({
                        type: 'customrecord_cntm_clientappsublist',
                        id: result.id,
                        values: {
                           
                            custrecord_cntm_cso_scarp_cumulative : lotQty,
        					custrecord_cntm_cso_quantity_good : 0,
        					//custrecord_cntm_cso_woc_quantity : lotQty,
        					custrecord_cntm_cso_status : 3,
        					// custrecord_cntm_cso_scarpreason :
        					// totalData[int].scrapDetailssub,
        					//custrecord_cntm_cso_createwo_completion : true,
        					custrecord_cntm_cso_laborsetuptime : 0,
        					custrecord_cntm_cso_laborruntime : 0,
        					custrecord_cntm_is_add_panel_wo : scrapped == true
        							|| scrapped == 'true' || scrapped == 'T' ? false
        							: true,
        					custrecord_cntm_pnel_wo_status : scrapped == true
        							|| scrapped == 'true' || scrapped == 'T' ? '' : 3,
        					custrecord_cntm_scrapped : scrapped == true
        							|| scrapped == 'true' || scrapped == 'T' ? true
        							: false
                        }
                    });
					return true;
				});
		return sublists;
	}

	/**
	 * Executes when the map entry point is triggered and applies to each
	 * key/value pair.
	 * 
	 * @param {MapSummary}
	 *            context - Data collection containing the key/value pairs to
	 *            process through the map stage
	 * @since 2015.1
	 */
	function map(context) {
		try {
			var key = context.key;
			var value = context.value;
			var lotQty = runtime.getCurrentScript().getParameter({
				name : 'custscript_cntm_lotqty'
			});
			var cumScrap = runtime.getCurrentScript().getParameter({
				name : 'custscript_cntm_scrapcum'
			});
			var scrapped = runtime.getCurrentScript().getParameter({
				name : 'custscript_cntm_scrapped'
			});
			log.debug('scrapped', scrapped);
			try {
				 var isTopWorkOrderFlag = false;
                var clientSubRecLookUp = search.lookupFields({
                    type: 'customrecord_cntm_clientappsublist',
                    id: value,
                    columns: ['custrecord_cntm_cso_pannellot',
                        'custrecord_cntm_cso_parentrec',
                        'custrecord_cntm_work_order',
                        'custrecord_cntm_is_create_issue',
                        'custrecord_cntm_cso_woc_quantity',
                        'custrecord_cntm_cso_operaton',
                        'custrecord_cntm_cso_scrap_quantity',
                        'custrecord_cntm_cso_scarp_cumulative',
                        'custrecord_cntm_cso_quantity_good',
                        'custrecord_cntm_lot_details',
                        'custrecord_cntm_last_operation',
                        'custrecord_cntm_cso_laborsetuptime',
                        'custrecord_cntm_cso_laborruntime',
                        'custrecord_cntm_operator',
                        'custrecord_cntm_failed_reason',
                        'custrecord_cntm_cso_wocnumber',
                        'custrecord_cntm_scrapped'
                    ]
                });
                log.debug('clientSubRecLookUp', JSON
                    .stringify(clientSubRecLookUp));
                var parent = clientSubRecLookUp.custrecord_cntm_cso_parentrec[0].value;
                var woc;
                if (clientSubRecLookUp.custrecord_cntm_cso_wocnumber)
                    woc = clientSubRecLookUp.custrecord_cntm_cso_wocnumber[0].value;

                var woFieldLookUp = search.lookupFields({
                    type: 'customrecord_cntm_clientapp_header',
                    id: parent,
                    columns: ['custrecord_cntm_cah_jobnumber',
                        'custrecord_cntm_wo_created_from',
                        'custrecord_cntm_cah_assemblyitem'
                    ]
                });

                var woId = woFieldLookUp.custrecord_cntm_cah_jobnumber[0].value;
                var parentWOId = woFieldLookUp.custrecord_cntm_wo_created_from[0].value;
                var asmItem = woFieldLookUp.custrecord_cntm_cah_assemblyitem[0].value;
                WOName = woFieldLookUp.custrecord_cntm_cah_jobnumber[0].text;
                var isIssueRec = clientSubRecLookUp.custrecord_cntm_is_create_issue;
                log.debug('woId' + woId, 'isIssueRec' + isIssueRec);
                var isLastOp = clientSubRecLookUp.custrecord_cntm_last_operation;
                var panelLot = clientSubRecLookUp.custrecord_cntm_cso_pannellot;
                if (!woc) {
                    var oprtn = clientSubRecLookUp.custrecord_cntm_cso_operaton
                        .split(' ')[0];

                    log.debug('completion--');

                    //Checking Created from field 
                    var woFieldLookUp = search.lookupFields({
                        type: 'workorder',
                        id: woId,
                        columns: ['manufacturingrouting', 'quantity',
                            'custbody_cntm_no_of_panel',
                            'custbody_rda_boards_per_panel',
                            'createdfrom' //Here
                        ]
                    });
                    log.debug('woFieldLookUp :', woFieldLookUp);

                    log.debug('isLastOp :', isLastOp);
                    if (woFieldLookUp.createdfrom.length != 0) {
                        log.debug('IF woFieldLookUp.createdfrom.length != 0')
                        var createdFrom = woFieldLookUp.createdfrom[0].value;
                        log.debug('createdFrom :', createdFrom);

                        if (createdFrom == '' || createdFrom == null || createdFrom == undefined) {
                            isTopWorkOrderFlag = true;
                        }
                    } else {
                        isTopWorkOrderFlag = true;
                        log.debug('ELSE isTopWorkOrderFlag = true')
                    }

                    /*
                    if(woFieldLookUp.createdfrom.length == 0){
                        isTopWorkOrderFlag = true;
                    }else{
                        isTopWorkOrderFlag = false;
                        var createdFrom = woFieldLookUp.createdfrom[0].value;
                        if (createdFrom == '' || createdFrom == null || createdFrom == undefined) {
                            isTopWorkOrderFlag = true;
                        }
                    }
                    */



                    var wocObj = record.transform({
                        fromType: record.Type.WORK_ORDER,
                        fromId: woId,
                        toType: record.Type.WORK_ORDER_COMPLETION,
                        isDynamic: true,
                    });

                    wocObj.setText({
                        fieldId: 'startoperation',
                        text: oprtn
                    });

                    wocObj.setText({
                        fieldId: 'endoperation',
                        text: oprtn
                    });
                    //Changes ii) - last operation and top assemblyy work order

                    log.debug('isTopWorkOrderFlag :', isTopWorkOrderFlag)
                    if (isLastOp == true && isTopWorkOrderFlag) {
                        log.debug('IF inside condtion')
                        wocObj.setValue({
                            fieldId: 'completedquantity',
                            value: clientSubRecLookUp.custrecord_cntm_cso_quantity_good
                        });
                    } else {
                        log.debug('ELSE')
                        wocObj.setValue({
                            fieldId: 'completedquantity',
                            value: clientSubRecLookUp.custrecord_cntm_cso_woc_quantity
                        });
                    }

                    if (clientSubRecLookUp.custrecord_cntm_operator[0])
                        wocObj.setValue({
                            fieldId: 'custbody_cntm_op_client_app',
                            value: clientSubRecLookUp.custrecord_cntm_operator[0].value
                        });


                    if (isLastOp == true) {
                        var completedQty = clientSubRecLookUp.custrecord_cntm_cso_woc_quantity;
                        var scrapQty = 0;

                        if (isTopWorkOrderFlag) {
                            completedQty = clientSubRecLookUp.custrecord_cntm_cso_quantity_good;
                            scrapQty = clientSubRecLookUp.custrecord_cntm_cso_scarp_cumulative;
                        }

                        wocObj.setValue({
                            fieldId: 'scrapquantity',
                            value: scrapQty
                        });
                        if (parseInt(completedQty) > 0) {

                            var subRec = wocObj.getSubrecord({
                                fieldId: 'inventorydetail'
                            });
                            subRec.selectNewLine({
                                sublistId: 'inventoryassignment'
                            });
                            subRec.setCurrentSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'receiptinventorynumber',
                                value: panelLot
                            });
                            subRec.setCurrentSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'quantity',
                                value: completedQty
                            });
                            subRec.commitLine({
                                sublistId: 'inventoryassignment'
                            });
                        }
                    }
                    var operation = clientSubRecLookUp.custrecord_cntm_cso_operaton;
                    var operationLine = wocObj.getLineCount({
                        sublistId: 'operation'
                    });
                    //log.debug('operation', operation);
                    log
                        .debug(
                            'laborsetuptime: ' +
                            clientSubRecLookUp.custrecord_cntm_cso_laborsetuptime,
                            'laborrutime: ' +
                            clientSubRecLookUp.custrecord_cntm_cso_laborruntime)
                    if (operationLine > 0) {
                        for (var i = 0; i < operationLine; i++) {
                            var opSeq = wocObj.getSublistValue({
                                sublistId: 'operation',
                                fieldId: 'operationsequence',
                                line: i
                            });
                            var op = wocObj.getSublistValue({
                                sublistId: 'operation',
                                fieldId: 'operationname',
                                line: i
                            });
                            //log.debug('op', op);
                            if ((opSeq + ' ' + op) == operation) {
                                wocObj.selectLine({
                                    sublistId: 'operation',
                                    line: i
                                });
                                wocObj.setCurrentSublistValue({
                                    sublistId: 'operation',
                                    fieldId: 'recordsetup', // 'setuptime',
                                    value: true
                                });
                                wocObj
                                    .setCurrentSublistValue({
                                        sublistId: 'operation',
                                        fieldId: 'laborsetuptime', // 'setuptime',
                                        value:  Number(clientSubRecLookUp.custrecord_cntm_cso_laborsetuptime).toFixed(6)
                                    });
                                wocObj
                                    .setCurrentSublistValue({
                                        sublistId: 'operation',
                                        fieldId: 'laborruntime', // 'runrate',
                                        value:  Number(clientSubRecLookUp.custrecord_cntm_cso_laborruntime).toFixed(6)
                                    });
                                wocObj.commitLine({
                                    sublistId: 'operation'
                                });
                                break;
                            }
                        }
                    }
                    var boardsPerPanel = woFieldLookUp.custbody_rda_boards_per_panel;
                    var customrecord_cntm_lot_creationSearchObj = search
                        .create({
                            type: "customrecord_cntm_lot_creation",
                            filters: [
                                ["custrecord_cntm_lot_wonum",
                                    "anyof", woId
                                ],
                                "AND", ["custrecord_cntm_scraped_panel",
                                    "is", "T"
                                ]
                            ],
                            columns: [
                                "custrecord_cntm_num_of_panels",
                                "custrecord_cntm_brds_per_panel"
                            ]
                        });
                    var totalScrappedPanel = customrecord_cntm_lot_creationSearchObj
                        .runPaged().count;
                    var customrecord_cntm_lot_creationSearchObj2 = search
                        .create({
                            type: "customrecord_cntm_lot_creation",
                            filters: [
                                ["custrecord_cntm_lot_wonum",
                                    "anyof", woId
                                ]
                            ],
                            columns: ["custrecord_cntm_cumulative_scrap_qty"]
                        });
                    var cumScrap = 0;
                    var scrapCount = 0;
                    var goodQty = 0;
                    var noOfPanels = woFieldLookUp.custbody_cntm_no_of_panel;
                    var searchResultCount = customrecord_cntm_lot_creationSearchObj2
                        .runPaged().count;
                    customrecord_cntm_lot_creationSearchObj2
                        .run()
                        .each(
                            function(result) {
                                // .run().each has a
                                // limit of 4,000
                                // results
                                if (result
                                    .getValue({
                                        name: 'custrecord_cntm_cumulative_scrap_qty'
                                    }))
                                    cumScrap += parseInt(result
                                        .getValue({
                                            name: 'custrecord_cntm_cumulative_scrap_qty'
                                        }));
                                log.debug('cumScrap', cumScrap);
                                return true;
                            });
                    if (boardsPerPanel && noOfPanels) {
                        scrapCount = (boardsPerPanel * searchResultCount) -
                            cumScrap;
                        goodQty = (noOfPanels * boardsPerPanel) - cumScrap;
                    }

                    var id = record
                        .submitFields({
                            type: record.Type.WORK_ORDER,
                            id: woId,
                            values: {
                                'custbody_cntm_good_boards': goodQty,
                                'custbody_cntm_scrapped_boards': cumScrap,
                                'custbody_cntm_good_panels': searchResultCount -
                                    totalScrappedPanel,
                                'custbody_cnt_scrapped_panels': totalScrappedPanel
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });

                    wocObj.setValue({
                        fieldId: 'custbody_cntm_good_boards',
                        value: goodQty
                    });
                    wocObj.setValue({
                        fieldId: 'custbody_cntm_scrapped_boards',
                        value: scrapCount
                    });
                    wocObj.setValue({
                        fieldId: 'custbody_cntm_good_panels',
                        value: searchResultCount - totalScrappedPanel
                    });
                    wocObj.setValue({
                        fieldId: 'custbody_cnt_scrapped_panels',
                        value: totalScrappedPanel
                    });
                    var wocId = wocObj.save({
                        ignoreMandatoryFields: true
                    });
                    record.submitFields({
                        type: 'customrecord_cntm_clientappsublist',
                        id: value,
                        values: {
                            custrecord_cntm_cso_wocnumber: wocId,
                            custrecord_cntm_cso_status : 4,
                            custrecord_cntm_cso_createwo_completion: true
                        }
                    });
                }
                /*wocId = woc;
                
                record.submitFields({
                    type: 'customrecord_cntm_clientappsublist',
                    id: recId,
                    values: {
                        // custrecord_cntm_cso_wocnumber : wocId,
                        custrecord_cntm_cso_status: 4
                    }
                });*/
            } catch (e) {
                log.error('error', JSON.stringify(e));
                var recipientId = runtime.getCurrentScript().getParameter({
                    name: 'custscript_cntm_error_notify_to'
                });
                email.send({
                    author: 2968,
                    recipients: recipientId,
                    subject: 'Completion Failed',
                    body: 'Completion failed for Work Order: ' + WOName +
                        '. Error:' + e.message
                });
                record.submitFields({
                    type: 'customrecord_cntm_clientappsublist',
                    id: value,
                    values: {
                        // custrecord_cntm_cso_wocnumber :
                        // wocId,
                        custrecord_cntm_cso_status: 5,
                        custrecord_cntm_cso_createwo_completion: false,
                        custrecord_cntm_failed_reason: e.message
                    }
                });
            }
			/*record.submitFields({
				type : 'customrecord_cntm_clientappsublist',
				id : value,
				values : {
					// custrecord_cntm_cso_scrap_quantity :
					// totalData[int].scrapQtysub,
					custrecord_cntm_cso_scarp_cumulative : lotQty,
					custrecord_cntm_cso_quantity_good : 0,
					custrecord_cntm_cso_woc_quantity : lotQty,
					custrecord_cntm_cso_status : 3,
					// custrecord_cntm_cso_scarpreason :
					// totalData[int].scrapDetailssub,
					custrecord_cntm_cso_createwo_completion : true,
					custrecord_cntm_cso_laborsetuptime : 0,
					custrecord_cntm_cso_laborruntime : 0,
					custrecord_cntm_is_add_panel_wo : scrapped == true
							|| scrapped == 'true' || scrapped == 'T' ? false
							: true,
					custrecord_cntm_pnel_wo_status : scrapped == true
							|| scrapped == 'true' || scrapped == 'T' ? '' : 3,
					custrecord_cntm_scrapped : scrapped == true
							|| scrapped == 'true' || scrapped == 'T' ? true
							: false
				},
				options : {
					enableSourcing : false,
					ignoreMandatoryFields : true
				}
			});*/
		} catch (e) {
			log.error('error-map', e.message);
		}
	}

	/**
	 * Executes when the reduce entry point is triggered and applies to each
	 * group.
	 * 
	 * @param {ReduceSummary}
	 *            context - Data collection containing the groups to process
	 *            through the reduce stage
	 * @since 2015.1
	 */
	function reduce(context) {

	}

	/**
	 * Executes when the summarize entry point is triggered and applies to the
	 * result set.
	 * 
	 * @param {Summary}
	 *            summary - Holds statistics regarding the execution of a
	 *            map/reduce script
	 * @since 2015.1
	 */
	function summarize(summary) {
		try {
			var createWO = runtime.getCurrentScript().getParameter({
				name : 'custscript_cntm_createwo'
			});
			var isLastline = runtime.getCurrentScript().getParameter({
				name : 'custscript_cntm_lastline'
			});
			if ((createWO == true || createWO == 'true')
					&& (isLastline == true || isLastline == 'true')) {
				var wo = runtime.getCurrentScript().getParameter({
					name : 'custscript_cntm_wo_no'
				});
				var item = runtime.getCurrentScript().getParameter({
					name : 'custscript_cntm_wo_item'
				});
				var sublistId = runtime.getCurrentScript().getParameter({
					name : 'custscript_cntm_sublist_recid'
				});
				var noOfLots = runtime.getCurrentScript().getParameter({
					name : 'custscript_cntm_no_of_lots'
				});
				var lotQty = runtime.getCurrentScript().getParameter({
					name : 'custscript_cntm_lotqty'
				});
				var woQty = parseInt(lotQty) * parseInt(noOfLots);
				var woFieldLookUp = search.lookupFields({
					type : 'workorder',
					id : wo,
					columns : [ 'createdfrom' ]
				});
				if (woFieldLookUp.createdfrom) {
					var parentWO = record.load({
						type : 'workorder',
						id : woFieldLookUp.createdfrom[0].value,
						isDynamic : true
					});
					parentWO.setValue({
						fieldId : 'custbody_cntm_panel_wo_created',
						value : true
					});
					parentWO.setValue({
						fieldId : 'custbody_cntm_no_of_new_lots',
						value : noOfLots
					});
					var lineCount = parentWO.getLineCount({
						sublistId : 'item'
					});
					parentWO.selectNewLine({
						sublistId : 'item'
					});
					parentWO.setCurrentSublistValue({
						sublistId : 'item',
						fieldId : 'item',
						value : item
					});
					parentWO.setCurrentSublistValue({
						sublistId : 'item',
						fieldId : 'quantity',
						value : woQty
					});
					parentWO.setCurrentSublistValue({
						sublistId : 'item',
						fieldId : 'itemsource',
						value : 'WORK_ORDER'
					});
					parentWO.commitLine({
						sublistId : 'item'
					});
					var woId = parentWO.save();

					var parentWO1 = record.load({
						type : 'workorder',
						id : woId,
						isDynamic : true
					});
					parentWO1.setValue({
						fieldId : 'custbody_cntm_panel_wo_created',
						value : false
					});
					parentWO1.setValue({
						fieldId : 'custbody_cntm_no_of_new_lots',
						value : ''
					});
					/*
					 * var lineCount1 = parentWO1.getLineCount({ sublistId :
					 * 'item' });
					 */
					var panelWO = parentWO1.getSublistValue({
						sublistId : 'item',
						fieldId : 'woid',
						line : lineCount
					});
					var parentWOId = parentWO1.save();
					/*
					 * record.submitFields({ type : 'workorder', id : woId,
					 * values : { custbody_cntm_panel_wo_created : false,
					 * custbody_cntm_no_of_new_lots : '' } });
					 */
					if (panelWO) {
						var ids = JSON.parse(runtime.getCurrentScript()
								.getParameter({
									name : 'custscript_cntm_sublist_ids'
								}));
						for (var id = 0; id < ids.length; id++)
							record.submitFields({
								type : 'customrecord_cntm_clientappsublist',
								id : ids[id],
								values : {
									custrecord_cntm_pnel_wo_status : 4,
									custrecord_cntm_add_panel_wo : panelWO
								}
							});
					}

				}
			} else if (isLastline == true || isLastline == 'true') {
				var ids = JSON.parse(runtime.getCurrentScript().getParameter({
					name : 'custscript_cntm_sublist_ids'
				}));
				for (var id = 0; id < ids.length; id++)
					record.submitFields({
						type : 'customrecord_cntm_clientappsublist',
						id : ids[id],
						values : {
							custrecord_cntm_pnel_wo_status : 4
						}
					});
			}
		} catch (e) {
			log.error('error-summary', e.message);
		}
	}

	return {
		getInputData : getInputData,
		map : map,
		// reduce: reduce,
		summarize : summarize
	};

});
