/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @scriptname   Cntm UE update op on WOC
 * @ScriptId      customscript_cntm_ue_update_op_woc
 * @author        Vishal Naphade
 * @email         vishal.naphade@centium.net
 * @date          09/01/2023
 * @description   
 *
 * Copyright 2020, Centium Consulting its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 * Module Description
 *
 * Sr. No   	 Date           	  Author                  	Remarks
 * 1           09/01/2023           Vishal Naphade
 */

define(["N/record", "N/runtime", "N/search", "N/ui/serverWidget", "N/task"],
    /**
     * @param {record}
     *            record
     * @param {runtime}
     *            runtime
     * @param {search}
     *            search
     * @param {serverWidget}
     *            serverWidget
     */
    function(record, runtime, search, serverWidget, task) {
        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object}
         *            scriptContext
         * @param {Record}
         *            scriptContext.newRecord - New record
         * @param {Record}
         *            scriptContext.oldRecord - Old record
         * @param {string}
         *            scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {
            try {
                if (scriptContext.type == "edit" || scriptContext.type == "create" || scriptContext.type == "copy") {
                    var firstOp = scriptContext.newRecord.getText('startoperation')
                    log.debug('firstOp :', firstOp);
                    
                    var endOp = scriptContext.newRecord.getText('endoperation')
                    log.debug('endOp :', endOp);
                    
                    var parentRec = scriptContext.newRecord.getValue('custbody_pcb_rec_id')
                    log.debug('parentRec :', parentRec);
                    var lotRec = scriptContext.newRecord.getValue('custbody_cntm_panel_lot')
                    log.debug('lotRec :', lotRec);
                    
                    var wo = scriptContext.newRecord.getValue('createdfrom')
                    log.debug('wo :', wo);
                    
                    // intermediateInternalId(parentRec, firstOp, endOp, lotRec)
                    var parentRec = getParentRecId(wo, lotRec)
                    log.debug('parentRec :', parentRec);
                    
                    scriptContext.newRecord.setValue('custbody_cntm_startoperation', firstOp)
                    scriptContext.newRecord.setValue('custbody_cntm_endoperation', endOp)
                    
                    
                    firstOp = firstOp.substring(0, firstOp.length - 1);
                    endOp = endOp.substring(0, endOp.length - 1);
                    scriptContext.newRecord.setValue('custbody_cntm_inter_operation', intermediateInternalId(parentRec, firstOp, endOp, lotRec))

                }
            } catch (error) {
                log.error("error in after Submit :", error);
            }
        }

        function getParentRecId(wo, lotRec) {
            try {
                var woId;
                var customrecord_cntm_clientappsublistSearchObj = search.create({
                    type: "customrecord_cntm_clientappsublist",
                    filters: [
                        ["custrecord_cntm_lot_record", "anyof", lotRec],
                        "AND", ["custrecord_cntm_work_order", "anyof", wo]
                    ],
                    columns: [
                        search.createColumn({ name: "custrecord_cntm_seq_no", label: "Sequence No" }),
                        search.createColumn({ name: "custrecord_cntm_cso_operaton", label: "Operation" }),
                        search.createColumn({ name: "custrecord_cntm_work_order", label: "WO" }),
                        search.createColumn({ name: "custrecord_cntm_last_operation", label: "Last Operation" }),
                        search.createColumn({ name: "custrecord_cntm_cso_parentrec", label: "Client App Header Record " })
                    ]
                });
                var searchResultCount = customrecord_cntm_clientappsublistSearchObj.runPaged().count;
                // log.debug("customrecord_cntm_clientappsublistSearchObj result count", searchResultCount);
                customrecord_cntm_clientappsublistSearchObj.run().each(function(result) {
                    // .run().each has a limit of 4,000 results
                    woId = result.getValue({ name: "custrecord_cntm_cso_parentrec", label: "Client App Header Record " })
                    return false;
                });

                return woId;

            } catch (error) {
                log.error('Error in getParentRecId :', error)
            }
        }

        function intermediateInternalId(parentRec, firstOp, endOp, lotRec) {
            try {

                var seqArray = [];
                var customrecord_cntm_clientappsublistSearchObj = search.create({
                    type: "customrecord_cntm_clientappsublist",
                    filters: [
                        ["custrecord_cntm_cso_parentrec", "anyof", parentRec],
                        "AND", ["custrecord_cntm_seq_no", "between", firstOp, endOp],
                        "AND", ["custrecord_cntm_lot_record", "anyof", lotRec],
                    ],
                    columns: [
                        search.createColumn({
                            name: "custrecord_cntm_seq_no",
                            label: "Sequence No",
                        }),
                        search.createColumn({
                            name: "custrecord_cntm_cso_operaton",
                            label: "Operation",
                        }),
                        search.createColumn({
                            name: "custrecord_cntm_work_order",
                            label: "WO",
                        }),
                        search.createColumn({
                            name: "custrecord_cntm_last_operation",
                            label: "Last Operation",
                        }),
                    ],
                    // title: 'Intermediate operation',
                    // id: 'customsearch_cntm_inter_op',
                });
                // var id = customrecord_cntm_clientappsublistSearchObj.save()
                var searchResultCount = customrecord_cntm_clientappsublistSearchObj.runPaged()
                    .count;
                log.debug(
                    "customrecord_cntm_clientappsublistSearchObj result count",
                    searchResultCount
                );
                customrecord_cntm_clientappsublistSearchObj.run().each(function(result) {
                    var seq = result.getValue({
                        name: "custrecord_cntm_cso_operaton",
                        label: "Operation",
                    });
                    var opId = seq.split(" ")[0].substring(0, 4);

                    var lastOp = result.getValue({
                        name: "custrecord_cntm_last_operation",
                        label: "Last Operation",
                    });
                    seqArray.push(opId);
                    return true;
                });

                log.debug('seqArray :', seqArray)
                return seqArray.toString();

            } catch (error) {
                log.error('Error in intermeidate :', error)
            }
        }


        return {
            // beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            // afterSubmit: afterSubmit,
        };
    });