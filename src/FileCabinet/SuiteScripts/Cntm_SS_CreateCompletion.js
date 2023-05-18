/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(
    ['N/record', 'N/runtime', 'N/search', 'N/task', 'N/email'],
    /**
     * @param {record}
     *            record
     * @param {runtime}
     *            runtime
     * @param {search}
     *            search
     */
    function(record, runtime, search, task, email) {

        /**
         * Definition of the Scheduled script trigger point.
         * 
         * @param {Object}
         *            scriptContext
         * @param {string}
         *            scriptContext.type - The context in which the script
         *            is executed. It is one of the values from the
         *            scriptContext.InvocationType enum.
         * @Since 2015.2
         */
        function execute(scriptContext) {

            var recId = runtime.getCurrentScript().getParameter({
                name: 'custscript_cntm_client_sublist_rec'
            });
            var isTopWorkOrderFlag = false;
            var WOName;
            try {
                var clientSubRecLookUp = search.lookupFields({
                    type: 'customrecord_cntm_clientappsublist',
                    id: recId,
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
                        'custrecord_cntm_cso_wocnumber'
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
                log.debug('woId' + woId, 'isIssueRec' + isIssueRec +
                    ' recId' + recId);
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


                    /**
                    {
                        manufacturingrouting: [{
                            value: "84677",
                            text: "2020694-PCB-A-2"
                        }],
                        quantity: "6",
                        custbody_cntm_no_of_panel: "3",
                        custbody_rda_boards_per_panel: "2",
                        "createdfrom": []
                    }
                    *
                    *
                    */

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
                    log.debug('operation', operation);
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
                            log.debug('op', op);
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
                                        value: Number(clientSubRecLookUp.custrecord_cntm_cso_laborsetuptime).toFixed(5)
                                    });
                                wocObj
                                    .setCurrentSublistValue({
                                        sublistId: 'operation',
                                        fieldId: 'laborruntime', // 'runrate',
                                        value: Number(clientSubRecLookUp.custrecord_cntm_cso_laborruntime).toFixed(5)
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
                        id: recId,
                        values: {
                            custrecord_cntm_cso_wocnumber: wocId,
                            // custrecord_cntm_cso_status : 4
                        }
                    });
                }
                wocId = woc;
                if (isLastOp == true) {
                    /*
                    						if (parentWOId
                    								&& clientSubRecLookUp.custrecord_cntm_cso_quantity_good > 0) {
                    							var parentWOFieldLookUp = search.lookupFields({
                    								type : 'workorder',
                    								id : parentWOId,
                    								columns : [ 'custbody_rda_wo_issue_okay' ]
                    							});
                    							var isAutoIssue = parentWOFieldLookUp.custbody_rda_wo_issue_okay;
                    							log.debug('isAutoIssue',isAutoIssue);
                    							if (isAutoIssue == true || isAutoIssue == 'true'
                    									|| isAutoIssue == 'T') {
                    								var woIssueObj = record.transform({
                    									fromType : record.Type.WORK_ORDER,
                    									fromId : parentWOId,
                    									toType : record.Type.WORK_ORDER_ISSUE,
                    									isDynamic : true,
                    								});
                    								woIssueObj
                    										.setValue({
                    											fieldId : 'custbody_cntm_lot_from_completion',
                    											value : panelLot
                    										});

                    								var issueLine = woIssueObj.getLineCount({
                    									sublistId : 'component'
                    								});
                    								log.debug('issueLine', issueLine);
                    								if (issueLine > 0) {
                    									for (var i = 0; i < issueLine; i++) {
                    										var component = woIssueObj
                    												.getSublistValue({
                    													sublistId : 'component',
                    													fieldId : 'item',
                    													line : i
                    												});

                    										log.debug('component' + component,
                    												'asmItem' + asmItem);
                    										if (component == asmItem) {
                    											woIssueObj.selectLine({
                    												sublistId : 'component',
                    												line : i
                    											});
                    											var objSubrecord = woIssueObj
                    													.getCurrentSublistSubrecord({
                    														sublistId : 'component',
                    														fieldId : 'componentinventorydetail'
                    													});

                    											var compLine = objSubrecord
                    													.getLineCount({
                    														sublistId : 'inventoryassignment'
                    													});
                    											
                    											 * var lineNumber = objSubrecord
                    											 * .findSublistLineWithValue({
                    											 * sublistId :
                    											 * 'inventoryassignment', fieldId :
                    											 * 'issueinventorynumber', value :
                    											 * panelLot });
                    											 
                    											log.debug('compLine ', compLine);
                    											if (compLine > 0) {

                    												for (var line = 0; line < compLine; line++) {
                    													log.debug('line', line);
                    													objSubrecord
                    															.selectLine({
                    																sublistId : 'inventoryassignment',
                    																line : line
                    															});
                    													var lot = objSubrecord
                    															.getCurrentSublistText({
                    																sublistId : 'inventoryassignment',
                    																fieldId : 'issueinventorynumber',
                    															// line : line
                    															});

                    													log.debug(lot, panelLot);
                    													if (lot == panelLot) {

                    														objSubrecord
                    																.setCurrentSublistValue({
                    																	sublistId : 'inventoryassignment',
                    																	fieldId : 'quantity',
                    																	value : parseFloat(clientSubRecLookUp.custrecord_cntm_cso_quantity_good)
                    																});
                    														objSubrecord
                    																.commitLine({
                    																	sublistId : 'inventoryassignment'
                    																});

                    													} else {
                    														log.debug('else..');

                    														objSubrecord
                    																.removeLine({
                    																	sublistId : 'inventoryassignment',
                    																	line : line
                    																});
                    														
                    														 * objSubrecord
                    														 * .commitLine({
                    														 * sublistId :
                    														 * 'inventoryassignment'
                    														 * });
                    														 
                    													}
                    												}
                    											} else {
                    												log.debug('else');
                    												objSubrecord
                    														.selectNewLine({
                    															sublistId : 'inventoryassignment'
                    														});
                    												objSubrecord
                    														.setCurrentSublistText({
                    															sublistId : 'inventoryassignment',
                    															fieldId : 'issueinventorynumber',
                    															text : panelLot
                    														});
                    												objSubrecord
                    														.setCurrentSublistValue({
                    															sublistId : 'inventoryassignment',
                    															fieldId : 'quantity',
                    															value : parseFloat(clientSubRecLookUp.custrecord_cntm_cso_quantity_good)
                    														});
                    												objSubrecord
                    														.commitLine({
                    															sublistId : 'inventoryassignment'
                    														});
                    											}
                    											log.debug('commiting...');
                    											woIssueObj.commitLine({
                    												sublistId : 'component'
                    											});
                    											break;
                    										}
                    									}
                    								}
                    								log.debug('saving..')
                    								var woIssueId = woIssueObj.save({
                    									ignoreMandatoryFields : true
                    								});
                    								log.debug('woIssueId', woIssueId);
                    							}
                    						}
                    					*/
                }

                record.submitFields({
                    type: 'customrecord_cntm_clientappsublist',
                    id: recId,
                    values: {
                        // custrecord_cntm_cso_wocnumber : wocId,
                        custrecord_cntm_cso_status: 4
                    }
                });
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
                    id: recId,
                    values: {
                        // custrecord_cntm_cso_wocnumber :
                        // wocId,
                        custrecord_cntm_cso_status: 5,
                        custrecord_cntm_cso_createwo_completion: false,
                        custrecord_cntm_failed_reason: e.message
                    }
                });
            }
        }

        return {
            execute: execute
        };

    });