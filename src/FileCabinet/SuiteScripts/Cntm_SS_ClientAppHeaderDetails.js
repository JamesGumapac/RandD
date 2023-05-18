/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(
    [ 'N/record', 'N/runtime', 'N/search', 'N/task' ],
    /**
     * @param {record}
     *            record
     * @param {runtime}
     *            runtime
     * @param {search}
     *            search
     */
    function(record, runtime, search, task) {

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

            var woId = runtime.getCurrentScript().getParameter({
                name : 'custscript_cntm_wo'
            });
            var lot = runtime.getCurrentScript().getParameter({
                name : 'custscript_cntm_lotno'
            });
            var lotRec = runtime.getCurrentScript().getParameter({
                name : 'custscript_cntm_lot_recid'
            });
            var noOfPanels = runtime.getCurrentScript().getParameter({
                name : 'custscript_cntm_num_of_panels'
            });
            var isCreated = runtime.getCurrentScript().getParameter({
                name : 'custscript_cntm_is_created'
            });
            try {
                var woFieldLookUp = search.lookupFields({
                    type : 'workorder',
                    id : woId,
                    columns : [ 'manufacturingrouting' ]
                });

                var routing = woFieldLookUp.manufacturingrouting[0].value;
                var clientAppHeaderRecId=getClientAppRec(woId);
                
                var clientAppHeaderRec;
                if (routing) {
                    var routingRec = record.load({
                        type : 'manufacturingrouting',
                        id : routing,
                        isDynamic : true
                    });
                    var routingLines = routingRec.getLineCount({
                        sublistId : 'routingstep'
                    });
                    var subRec = false;

                    if (routingLines > 0) {
                        if (clientAppHeaderRecId) {

                            clientAppHeaderRec = record
                                    .load({
                                        type : 'customrecord_cntm_clientapp_header',
                                        id : clientAppHeaderRecId,
                                        isDynamic : true
                                    });
                            /*
                             * var
                             * customrecord_cntm_clientappsublistSearchObj =
                             * search .create({ type :
                             * "customrecord_cntm_clientappsublist", filters : [ [
                             * "custrecord_cntm_work_order", "anyof", woId ],
                             * "AND", [ "custrecord_cntm_cso_pannellot",
                             * "is", lot ] ], columns : [ search
                             * .createColumn({ name :
                             * "custrecord_cntm_cso_pannellot", label :
                             * "Panel LOT" }), ] }); var searchResultCount =
                             * customrecord_cntm_clientappsublistSearchObj
                             * .runPaged().count; log .debug(
                             * "customrecord_cntm_clientappsublistSearchObj
                             * result count", searchResultCount);
                             * 
                             * 
                             * customrecord_cntm_clientappsublistSearchObj.run().each(function(result){ //
                             * .run().each has a limit of 4,000 results
                             * return true; });
                             * 
                             * if (searchResultCount == 0) subRec = true;
                             */

                            /*
                             * var
                             * lines=clientAppHeaderRec.getLineCount({sublistId:''});
                             * for(var line=0;line<lines;line++){ }
                             */
                        } else {
                            if (isCreated == true || isCreated == 'true') {
                                clientAppHeaderRecId=getClientAppRec(woId);
                                if(clientAppHeaderRecId)
                                clientAppHeaderRec = record
                                .load({
                                    type : 'customrecord_cntm_clientapp_header',
                                    id : clientAppHeaderRecId,
                                    isDynamic : true
                                });
                                
                            } else {
                                clientAppHeaderRec = record
                                        .create({
                                            type : 'customrecord_cntm_clientapp_header',
                                            isDynamic : true
                                        });
                                clientAppHeaderRec
                                        .setValue({
                                            fieldId : 'custrecord_cntm_cah_jobnumber',
                                            value : woId
                                        });
                            }
                        }
                        var WOqty = clientAppHeaderRec.getValue({
                            fieldId : 'custrecord_cntm_cah_woquantity'
                        });
                        log.debug('WOqty', WOqty);
                        var lotQty = parseInt(WOqty / parseInt(noOfPanels));
                        var oprationArr = {};
                        var componentOprationLines = routingRec
                                .getLineCount({
                                    sublistId : 'routingcomponent'
                                });
                        var typeArr = 0;
                        for (var j = 0; j < componentOprationLines; j++) {
                            var item = routingRec.getSublistValue({
                                sublistId : 'routingcomponent',
                                fieldId : 'item',
                                line : j
                            });
                            /*
                             * var itemRecLookUp = search.lookupFields({
                             * type : 'item', id :item , columns :
                             * ['itemtype'] });
                             * 
                             * var itemType=itemRecLookUp.itemtype;
                             * if(itemType!='Assembly') typeArr++;
                             */
                            var compOpSeq = routingRec.getSublistValue({
                                sublistId : 'routingcomponent',
                                fieldId : 'operationsequencenumber',
                                line : j
                            });
                            if (compOpSeq) {
                                if (!oprationArr[compOpSeq])
                                    oprationArr[compOpSeq] = [];
                                oprationArr[compOpSeq].push(item);
                            }
                        }
                        log.debug('oprationArr', oprationArr);
                        log.debug('routingLines', routingLines);
                        for (var i = 0; i < routingLines; i++) {
                          log.debug('i', i);
                            var mcnRunTime = routingRec.getSublistValue({
                                sublistId : 'routingstep',
                                fieldId : 'runrate',
                                line : i
                            });
                            var mcnSetupTime = routingRec.getSublistValue({
                                sublistId : 'routingstep',
                                fieldId : 'setuptime',
                                line : i
                            });
                            var laborRunTime = routingRec.getSublistValue({
                                sublistId : 'routingstep',
                                fieldId : 'runrate',
                                line : i
                            });
                            var laborSetupTime = routingRec
                                    .getSublistValue({
                                        sublistId : 'routingstep',
                                        fieldId : 'setuptime',
                                        line : i
                                    });
                            var opSeq = routingRec.getSublistValue({
                                sublistId : 'routingstep',
                                fieldId : 'operationsequence',
                                line : i
                            }).toString();
                            var opName = routingRec.getSublistValue({
                                sublistId : 'routingstep',
                                fieldId : 'operationname',
                                line : i
                            })
                            // log.debug('opSeq' + opSeq, opName);
                            // if (!clientAppHeaderRecId && subRec == false)
                            // {
                            clientAppHeaderRec
                                    .selectNewLine({
                                        sublistId : 'recmachcustrecord_cntm_cso_parentrec'
                                    });
                            clientAppHeaderRec
                                    .setCurrentSublistValue({
                                        sublistId : 'recmachcustrecord_cntm_cso_parentrec',
                                        fieldId : 'custrecord_cntm_cso_pannellot',
                                        value : lot
                                    });
                            clientAppHeaderRec
                                    .setCurrentSublistValue({
                                        sublistId : 'recmachcustrecord_cntm_cso_parentrec',
                                        fieldId : 'custrecord_cntm_cso_woc_quantity',
                                        value : lotQty
                                    });
                            clientAppHeaderRec
                                    .setCurrentSublistValue({
                                        sublistId : 'recmachcustrecord_cntm_cso_parentrec',
                                        fieldId : 'custrecord_cntm_cso_quantity_good',
                                        value : lotQty
                                    });
                            clientAppHeaderRec
                                    .setCurrentSublistValue({
                                        sublistId : 'recmachcustrecord_cntm_cso_parentrec',
                                        fieldId : 'custrecord_cntm_cso_operaton',
                                        value : opSeq + ' ' + opName
                                    });
                            clientAppHeaderRec
                                    .setCurrentSublistValue({
                                        sublistId : 'recmachcustrecord_cntm_cso_parentrec',
                                        fieldId : 'custrecord_cntm_cso_machinesetuptime',
                                        value : mcnSetupTime
                                    });
                            clientAppHeaderRec
                                    .setCurrentSublistValue({
                                        sublistId : 'recmachcustrecord_cntm_cso_parentrec',
                                        fieldId : 'custrecord_cntm_cso_machinerunetime',
                                        value : mcnRunTime
                                    });
                            clientAppHeaderRec
                                    .setCurrentSublistValue({
                                        sublistId : 'recmachcustrecord_cntm_cso_parentrec',
                                        fieldId : 'custrecord_cntm_cso_laborsetuptime',
                                        value : Number(laborSetupTime).toFixed(5)
                                    });
                            clientAppHeaderRec
                                    .setCurrentSublistValue({
                                        sublistId : 'recmachcustrecord_cntm_cso_parentrec',
                                        fieldId : 'custrecord_cntm_cso_laborruntime',
                                        value : Number(laborRunTime).toFixed(5)
                                    });
                            clientAppHeaderRec
                                    .setCurrentSublistValue({
                                        sublistId : 'recmachcustrecord_cntm_cso_parentrec',
                                        fieldId : 'custrecord_cntm_lot_record',
                                        value : lotRec
                                    });
                            clientAppHeaderRec
                                    .setCurrentSublistValue({
                                        sublistId : 'recmachcustrecord_cntm_cso_parentrec',
                                        fieldId : 'custrecord_cntm_seq_no',
                                        value : (i + 1)
                                    });
                            clientAppHeaderRec
                                    .setCurrentSublistValue({
                                        sublistId : 'recmachcustrecord_cntm_cso_parentrec',
                                        fieldId : 'custrecord_cntm_work_order',
                                        value : woId
                                    });
                            if (i == (routingLines - 1))
                                clientAppHeaderRec
                                        .setCurrentSublistValue({
                                            sublistId : 'recmachcustrecord_cntm_cso_parentrec',
                                            fieldId : 'custrecord_cntm_last_operation',
                                            value : true
                                        });
                            /*
                             * log .debug( 'oprationArr.indexOf(opSeq) > -1 &&
                             * typeArr.length>0', oprationArr.indexOf(opSeq) >
                             * -1 && typeArr.length > 0)
                             */
                            if (opSeq in oprationArr /*
                                                         * &&
                                                         * typeArr.length>0
                                                         */) {
                                clientAppHeaderRec
                                        .setCurrentSublistValue({
                                            sublistId : 'recmachcustrecord_cntm_cso_parentrec',
                                            fieldId : 'custrecord_cntm_is_create_issue',
                                            value : true
                                        });
                                clientAppHeaderRec
                                        .setCurrentSublistValue({
                                            sublistId : 'recmachcustrecord_cntm_cso_parentrec',
                                            fieldId : 'custrecord_cntm_items_to_issue',
                                            value : oprationArr[opSeq]
                                        });
                            }
                            clientAppHeaderRec
                                    .commitLine({
                                        sublistId : 'recmachcustrecord_cntm_cso_parentrec'
                                    });

                            /*
                             * } else if (clientAppHeaderRecId && subRec ==
                             * true) {
                             * 
                             * var clientAppSublistRec = record .create({
                             * type : 'customrecord_cntm_clientappsublist',
                             * isDynamic : true }); clientAppSublistRec
                             * .setValue({ fieldId :
                             * 'custrecord_cntm_cso_pannellot', value : lot
                             * }); clientAppSublistRec .setValue({ fieldId :
                             * 'custrecord_cntm_cso_woc_quantity', value :
                             * lotQty }); clientAppSublistRec .setValue({
                             * fieldId :
                             * 'custrecord_cntm_cso_quantity_good', value :
                             * lotQty }); clientAppSublistRec .setValue({
                             * fieldId : 'custrecord_cntm_cso_operaton',
                             * value : opSeq + ' ' + opName });
                             * clientAppSublistRec .setValue({ fieldId :
                             * 'custrecord_cntm_cso_machinesetuptime', value :
                             * mcnSetupTime }); clientAppSublistRec
                             * .setValue({ fieldId :
                             * 'custrecord_cntm_cso_machinerunetime', value :
                             * mcnRunTime }); clientAppSublistRec
                             * .setValue({ fieldId :
                             * 'custrecord_cntm_cso_laborsetuptime', value :
                             * laborSetupTime }); clientAppSublistRec
                             * .setValue({ fieldId :
                             * 'custrecord_cntm_cso_laborruntime', value :
                             * laborRunTime });
                             * clientAppSublistRec.setValue({ fieldId :
                             * 'custrecord_cntm_lot_record', value : lotRec
                             * }); clientAppSublistRec.setValue({ fieldId :
                             * 'custrecord_cntm_seq_no', value : (i + 1) });
                             * clientAppSublistRec.setValue({ fieldId :
                             * 'custrecord_cntm_work_order', value : woId
                             * }); if (i == (routingLines - 1))
                             * clientAppSublistRec .setValue({ fieldId :
                             * 'custrecord_cntm_last_operation', value :
                             * true });
                             * 
                             * log .debug( 'oprationArr.indexOf(opSeq) > -1 &&
                             * typeArr.length>0', oprationArr.indexOf(opSeq) >
                             * -1 && typeArr.length > 0)
                             * 
                             * if (opSeq in oprationArr && typeArr.length>0 ) {
                             * clientAppSublistRec .setValue({ fieldId :
                             * 'custrecord_cntm_is_create_issue', value :
                             * true }); clientAppSublistRec .setValue({
                             * fieldId : 'custrecord_cntm_items_to_issue',
                             * value : oprationArr[opSeq] });
                             * clientAppSublistRec.save(); } }
                             */
                        }
                        // if (!clientAppHeaderRecId)
                        clientAppHeaderRec.save();
                    }
                }
            } catch (e) {
                if (e.message == 'Unable to save record. Record was change by a different user. Please reload and try again.') {
                    var scriptTask = task.create({
                        taskType : task.TaskType.SCHEDULED_SCRIPT
                    });
                    scriptTask.scriptId = 'customscript_cntm_ss_clntapp_hdr_detls';
                    // scriptTask.deploymentId =
                    // 'customdeploy_cntm_ss_pcb_lot_num';
                    scriptTask.params = {
                        custscript_cntm_wo : woId,
                        custscript_cntm_lotno : lot,
                        custscript_cntm_lot_recid : lotRec,
                        custscript_cntm_num_of_panels : noOfPanels,
                        custscript_cntm_is_compltn_proces : 'F'
                    };

                    var scriptTaskId = scriptTask.submit();
                    var status = task.checkStatus(scriptTaskId).status;
                    log.debug(scriptTaskId);
                }
            }
        }
        function getClientAppRec(woId) {
            var clientAppHeaderRecId;
            var clientAppHeaderSearchObj = search.create({
                type : "customrecord_cntm_clientapp_header",
                filters : [ [ "custrecord_cntm_cah_jobnumber", "anyof",
                        woId ] ],
                columns : [ search.createColumn({
                    name : "internalid",
                    sort : search.Sort.ASC,
                    label : "Internal ID"
                }) ]
            });
            var searchResultCount = clientAppHeaderSearchObj.runPaged().count;
            log.debug("bomSearchObj result count", searchResultCount);
            clientAppHeaderSearchObj.run().each(function(result) {
                // .run().each has a limit of 4,000
                // results
                clientAppHeaderRecId = result.id;
                return true;
            });
            return clientAppHeaderRecId;
        }
        return {
            execute : execute
        };

    });
