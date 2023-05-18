/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search','N/record','N/format'],
    
    (search,record,format) => {
        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

        const getInputData = (inputContext) => {

                try {

                        var dateFilter = getDateFilter();
                        return search.create({
                                type: 'salesorder',
                                columns: [{
                                        name: 'internalid',
                                        summary: 'GROUP'
                                }], filters: [{
                                        name: 'type',
                                        operator: 'anyof',
                                        values: ['SalesOrd']
                                }, {

                                        name: 'commit',
                                        operator: 'anyof',
                                        values: ['3']
                                }, {
                                        name: 'shipdate',
                                        operator: 'isnotempty',
                                        values: ['']
                                },{
                                        name:'trandate',
                                        operator:'onorafter',
                                        values: dateFilter
                                }]
                        });


                }catch(e){
                        log.debug({title:'ERROR',details:e});
                }

        }

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */

        const map = (mapContext) => {
                try{

                var searchResult = JSON.parse(mapContext.value);
                var soInternalID = searchResult.values['GROUP(internalid)'].value;
                log.debug('soInternalID',soInternalID);

                var salesOrderRecord = record.load({
                        type: record.Type.SALES_ORDER,
                        id: parseInt(soInternalID),
                        isDynamic: true,
                        });
                        var trandate = salesOrderRecord.getValue({
                                fieldId: 'trandate'
                        });
                        log.debug('trandate',trandate);

                        var numLines = salesOrderRecord.getLineCount({
                                sublistId: 'item'
                        });
                var dateToday = new Date();
                log.debug('dateToday',dateToday);

                        for(var i=0; i<numLines; i++){
                                var expectedShipDate = salesOrderRecord.getSublistValue({
                                        sublistId:'item',
                                        fieldId:'expectedshipdate',
                                        line:i
                                });
                                var isClosed = salesOrderRecord.getSublistValue({
                                        sublistId:'item',
                                        fieldId:'isclosed',
                                        line:i
                                });

                                var quantity = salesOrderRecord.getSublistValue({
                                        sublistId:'item',
                                        fieldId:'quantity',
                                        line:i
                                });

                                var quantityfulfilled = salesOrderRecord.getSublistValue({
                                        sublistId:'item',
                                        fieldId:'quantityfulfilled',
                                        line:i
                                });

                                var commit = salesOrderRecord.getSublistValue({
                                        sublistId:'item',
                                        fieldId:'commitinventory',
                                        line:i
                                });



                                log.debug('expectedShipDate',expectedShipDate);
                                log.debug('isClosed',isClosed);
                                log.debug('quantity',quantity);
                                log.debug('quantityfulfilled',quantityfulfilled);
                                log.debug('commit',commit);
                                if(expectedShipDate && isClosed == false && ( parseInt(quantity) > parseInt(quantityfulfilled) ) && parseInt(commit) == 3 ) {
                                        log.debug('validation 1');

                                        var dateDifference = parseInt(getDateDifference(expectedShipDate, trandate));
                                        log.debug('dateDifference', dateDifference);

                                        if(dateDifference <= 14){

                                                salesOrderRecord.selectLine({
                                                        sublistId: 'item',
                                                        line: i
                                                });

                                                salesOrderRecord.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'commitinventory',
                                                        value: 1

                                                });


                                                salesOrderRecord.commitLine({
                                                        sublistId: 'item'
                                                });

                                        }else{
                                                log.debug('validation 2');
                                                var dateDifference = parseInt(getDateDifference(expectedShipDate, dateToday));
                                                log.debug('dateDifference', dateDifference);
                                                if(dateDifference <= 14){

                                                        salesOrderRecord.selectLine({
                                                                sublistId: 'item',
                                                                line: i
                                                        });

                                                        salesOrderRecord.setCurrentSublistValue({
                                                                sublistId: 'item',
                                                                fieldId: 'commitinventory',
                                                                value: 1

                                                        });


                                                        salesOrderRecord.commitLine({
                                                                sublistId: 'item'
                                                        });

                                                }

                                        }

                                }
                        }


                        salesOrderRecord.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                        });


                }catch(e){
                        log.debug({title:'ERROR',details:e});
                }

        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {

        }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {

        }

            const getDateDifference = (expectedShipDate,date2) => {

                    var formattedExpectedShipDate = format.format({
                            value:expectedShipDate,
                            type:format.Type.DATE
                    });
                    log.debug('formattedExpectedShipDate',formattedExpectedShipDate);
                    var formatteddate2  =  format.format({
                            value:date2,
                            type:format.Type.DATE
                    });
                    log.debug('formatteddate2',formatteddate2);

                    var diffInMs = new Date(formattedExpectedShipDate) - new Date (formatteddate2);
                    log.debug('diffInMs',diffInMs);
                    var diffInDays = diffInMs / (1000*60*60*24);
                    return diffInDays;

            }
            const getDateFilter = () => {

                    var dateToday = new Date();
                    dateToday.setDate(dateToday.getDate()-14);
                    var subtractedDateToday = format.format({
                            value:dateToday,
                            type:format.Type.DATE
                    });
                    log.debug('subtractedDateToday',subtractedDateToday);
                    return subtractedDateToday;

            }

        return {getInputData, map, reduce, summarize}

    });
