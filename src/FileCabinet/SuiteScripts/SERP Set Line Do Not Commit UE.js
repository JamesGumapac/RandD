/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record','N/format'],
    
    (record,format) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */

        const afterSubmit = (scriptContext) => {
                var type = scriptContext.type;
                log.debug('type',type);
                if(type == 'create'){
                        var salesOrderID = scriptContext.newRecord.id;

                        log.debug('salesOrderID',salesOrderID);

                        var salesOrderRecord = record.load({
                                type: record.Type.SALES_ORDER,
                                id: salesOrderID,
                                isDynamic:true
                        });

                        var salesOrderDate = salesOrderRecord.getValue({
                                fieldId:'trandate'
                        });

                        log.debug('salesOrderDate',salesOrderDate);

                        var numLines = salesOrderRecord.getLineCount({
                                sublistId:'item'
                        });
                        log.debug('numLines',numLines);
                        for(var i=0; i<numLines; i++){
                                var expectedShipDate = salesOrderRecord.getSublistValue({
                                        sublistId:'item',
                                        fieldId:'expectedshipdate',
                                        line:i
                                });
                                log.debug('expectedShipDate',expectedShipDate);
                                if(expectedShipDate) {
                                        var dateDifference = parseInt(getDateDifference(expectedShipDate, salesOrderDate));
                                        log.debug('dateDifference', dateDifference);

                                        if (parseInt(dateDifference) > 14) {
                                                log.debug('date difference is greater than 14');
                                                salesOrderRecord.selectLine({
                                                        sublistId: 'item',
                                                        line: i
                                                });

                                                salesOrderRecord.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'commitinventory',
                                                        value: 3

                                                });
                                                salesOrderRecord.commitLine({
                                                        sublistId: 'item'
                                                });
                                        }
                                }
                        }
                        salesOrderRecord.save();


                }



        }
        const getDateDifference = (expectedShipDate,salesOrderDate) => {

        var formattedExpectedShipDate = format.format({
                        value:expectedShipDate,
                        type:format.Type.DATE
                });
        log.debug('formattedExpectedShipDate',formattedExpectedShipDate);
        var formattedsalesOrderDate  =  format.format({
                        value:salesOrderDate,
                        type:format.Type.DATE
                });
        log.debug('formattedsalesOrderDate',formattedsalesOrderDate);

        var diffInMs = new Date(formattedExpectedShipDate) - new Date (salesOrderDate);
        log.debug('diffInMs',diffInMs);
        var diffInDays = diffInMs / (1000*60*60*24);
        return diffInDays;

        }

        return {afterSubmit}

    });
