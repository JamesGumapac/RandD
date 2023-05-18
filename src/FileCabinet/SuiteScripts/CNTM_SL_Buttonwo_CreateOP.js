/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(["N/record", "N/search"],
    function (record, search) {

        function onRequest(context) {
            try {
                log.debug('request', context.request);
                if (context.request.method === 'GET') {
                    log.debug('requestData', context.request.parameters);
                    log.debug('requestData', context.request.parameters.i_woid);

                    var woID = context.request.parameters.i_woid;
                    createOperationRec(woID)
                    log.debug('FINISH');

                    context.response.write('success');
                    return 'success';
                } else {
                    log.debug('GET requestData', context.request.parameters);
                    // context.response.write(context.request.parameters)
                    return context.request.parameters;
                }
            } catch (error) {
                log.error({
                    title: 'onRequest',
                    details: error
                });
                context.response.write(error);
            }
        }

        function createOperationRec(woID) {
            log.debug('woID', woID);
            if (woID) {
                log.debug('in IF', woID);
                var fieldLookUp = search.lookupFields({
                    type: search.Type.WORK_ORDER,
                    id: woID,
                    columns: ["manufacturingrouting", "quantity",'custbody_total_num_cores','custbody_cntm_no_of_panel','custbody_cntm_ref_for_btn_hide'],
                });
                var WOQty = validatedata(fieldLookUp["quantity"]);
                var custbody_cntm_no_of_panel = validatedata(fieldLookUp['custbody_cntm_no_of_panel']);
                var custbody_total_num_cores = validatedata(fieldLookUp['custbody_total_num_cores']);
                var custbody_cntm_ref_for_btn_hide = validatedata(fieldLookUp['custbody_cntm_ref_for_btn_hide']);


                try {
                    log.debug('custbody_cntm_ref_for_btn_hide',custbody_cntm_ref_for_btn_hide)
                    if(!custbody_cntm_ref_for_btn_hide){
                        record.submitFields({
                            type: record.Type.WORK_ORDER,
                            id: woID,
                            values: {
                                // 'custbody_cntm_ref_for_btn_hide':true
                                'custbody_cntm_ref_for_btn_hide':true
                            }
                        });
                        log.debug('custbody_cntm_ref_for_btn_hide', 'set');
                    }else{
                        log.debug('ELSE custbody_cntm_ref_for_btn_hide');
                    }
                } catch (error) {
                    log.audit('ERROR custbody_cntm_ref_for_btn_hide', error);   
                }


                var operator = 0;
                var routingLookup = fieldLookUp["manufacturingrouting"];
                //log.debug("routingLookup :" + routingLookup);
                var stringJson = JSON.stringify(routingLookup);
                var routingExisting = routingLookup[0].value;
                //log.debug("routingExisting :" + routingExisting);
                var routingRec = record.load({
                    type: record.Type.MANUFACTURING_ROUTING,
                    id: routingExisting,
                });
                var lineCount = routingRec.getLineCount({
                    sublistId: "routingstep",
                });
                log.debug('lineCount',lineCount);
                for (var i = 0; i < lineCount; i++) {
                    var opSeq = routingRec.getSublistValue({
                        sublistId: "routingstep",
                        fieldId: "operationsequence",
                        line: i,
                    });
                    var opname = routingRec.getSublistValue({
                        sublistId: "routingstep",
                        fieldId: "operationname",
                        line: i,
                    });
                    /*
                     * var laborTime=routingRec.getSublistValue({ sublistId: 'routingstep',
                     * fieldId: 'runrate', line: i });
                     */
                    var laborSetupTime = routingRec.getSublistValue({
                        sublistId: "routingstep",
                        fieldId: "setuptime",
                        line: i,
                    });
                    // creating records

                    var woOperationRec = record.create({
                        type: "customrecord_cntm_client_app_asm_oper",
                        // defaultValues : defaultValues,
                        isDynamic: true,
                    });

                    if (i == 0) {
                        woOperationRec.setValue({
                            fieldId: "custrecord_cntm_is_first_op",
                            value: true,
                        });
                        woOperationRec.setValue({
                            fieldId: "custrecord_cntm_remaining_qty",
                            value: WOQty,
                        });
                    }
                    var opSeqNext = routingRec.getSublistValue({
                        sublistId: "routingstep",
                        fieldId: "operationsequence",
                        line: i + parseInt(1),
                    });
                    if (opSeqNext != undefined && opSeqNext != null && opSeqNext != "") {
                        var opnextText = routingRec.getSublistValue({
                            sublistId: "routingstep",
                            fieldId: "operationname",
                            line: i + parseInt(1),
                        });
                        woOperationRec.setValue({
                            fieldId: "custrecord_cntm_next_op",
                            value: opSeqNext,
                        });
                        woOperationRec.setValue({
                            fieldId: "custrecord_cntm_next_op_next",
                            value: opSeqNext + " " + opnextText,
                        });
                    }
                    woOperationRec.setValue({
                        fieldId: "custrecord_cntm_asm_op_text",
                        value: opSeq + " " + opname,
                    });

                    woOperationRec.setValue({
                        fieldId: "custrecord_cnmt_asm_laborsetuptime",
                        value: laborSetupTime,
                    });

                    /*
                     * woOperationRec.setValue({ fieldId :
                     * "custrecord_cntm_asm_laborruntime", value : laborTime });
                     */
                    woOperationRec.setValue({
                        fieldId: "custrecord_cntm_asm_wo_ref",
                        value: woID,
                    });
                    woOperationRec.setValue({
                        fieldId: "custrecord_cntm_asm_operation",
                        value: opSeq,
                    });
                    if (i == lineCount - 1) {
                        woOperationRec.setValue({
                            fieldId: "custrecord_cntm_asm_is_lastop",
                            value: true,
                        });
                    }
                    try {
                        if(parseInt(lineCount) == 1){
                            log.debug('singleOP')
                            woOperationRec.setValue({
                                fieldId: "custrecord_cntm_is_single_op",
                                value: true,
                            });
                        }    
                    } catch (error) {
                        log.debug('Error in lineCount', error)
                    }
                    
                    woOperationRec.save();
                    
                }
                // try {
                //     log.debug({
                //         title: 'params',
                //         details: woID + ' /-/ ' + operator+ ' /-/ ' +WOQty+ ' /-/ ' +custbody_cntm_no_of_panel+ ' /-/ ' +custbody_total_num_cores
                //     })
                //     customOperationLineLibrary.deleteAndCreateCustomOperationLines(woID, operator, WOQty, custbody_cntm_no_of_panel, custbody_total_num_cores) 
                // } catch (error) {
                //     log.error('customOperationLineLibrary',customOperationLineLibrary);        
                // }
            }
        }


        function validatedata(data) {
            if (data != undefined && data != null && data != '') {
                return data;
            } else {
                return 0;
            }
        }
        return {
            onRequest: onRequest
        }
    });
