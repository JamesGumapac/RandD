/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */

/*
Name                : SERP_UE_IR_Set_Last_Receipt_Date.js
Purpose             : Set the Last Receipt data on the PO sublist
Created On          : 27 Jan 2023
Script Type         : User Event Script

*/


define(["N/record", "N/runtime", "N/search"],
    function (record, runtime, search) {

        function afterSubmit(context) {
            var currentRecord = context.newRecord;
            log.debug('currentRecord', currentRecord)
            
            try {
                
                if (context.type == context.UserEventType.CREATE ) 
                
                {
                        var isFromPO = currentRecord.getText({
                            fieldId: 'createdfrom'
                        });
                        log.debug('IR is from Purchase Order', isFromPO)

                        var poId = currentRecord.getValue({
                            fieldId: 'createdfrom'
                        });
                        log.debug('PO ID', poId)

                        if(isFromPO.indexOf('Purchase Order') != -1){
                            log.debug('Item Receipt is created from Purchase Order')

                            var trandate = currentRecord.getValue({
                                fieldId: 'trandate'
                            });
                            log.debug('IR Trandate', trandate)

                            var irArrayLines = new Array();

                            var irLineCount = currentRecord.getLineCount({
                                sublistId: 'item'
                            });
                            log.debug('IR Total Lines', irLineCount)

                            for (var i = 0; i < irLineCount; i++) { 

                                var isReceived = currentRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'itemreceive',
                                    line: i
                                })
                                log.debug('Is Received', isReceived)

                                if(isReceived == true){

                                    irArrayLines.push(currentRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'orderline',
                                        line: i
                                    }));

                                
                                }
                                log.debug('IR Array Lines', irArrayLines)

                            }

                            var poRecord = record.load({
                                type: record.Type.PURCHASE_ORDER,
                                id: poId
                            });

                            var poLineCount = poRecord.getLineCount({
                                sublistId: 'item'
                            });
                            log.debug('PO Total Lines', poLineCount)

                            for (var i = 0; i < poLineCount; i++) {
                                    
                                    var poLine = poRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'line',
                                        line: i
                                    });
                                    log.debug('PO Line', poLine)

                                    var poLineItem = irArrayLines.indexOf(poLine);
                                    log.debug('PO Line Item', poLineItem)

                                    if(poLineItem > -1){
    
                                        poRecord.setSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_kms_last_rec_date',
                                            line: i,
                                            value: trandate
                                        });
                                    }           
                                }
                                poRecord.save()
                                
                        }

                        } else {
                            return;
                        }                                             
                    
                    
            } catch (err) {
                log.error("AfterSubmit : " + currentRecord.id, err);
                throw err;
            }

         
        }
        return {
            afterSubmit: afterSubmit
        };
    });