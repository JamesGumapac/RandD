/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search','N/log'],
    /**
 * @param{record} record
 * @param{search} search
 */
    (record, search, log) => {

        const deleteAllJournalWithWCL = (journalIdArray) => {
            log.debug("finding wcl to be deleted", journalIdArray.toString())
            if(journalIdArray.length > 0){
                try{
                    var journalentrySearchObj = search.create({
                        type: "journalentry",
                        filters:
                        [
                        ["type","anyof","Journal"], 
                        "AND", 
                        ["custbody_suitegl_woc_ref","anyof",journalIdArray], 
                        "AND", 
                        ["mainline","is","T"]
                        ],
                        columns:
                        [
                        search.createColumn({
                            name: "tranid",
                            summary: "GROUP"
                        }),
                        search.createColumn({
                            name: "internalid",
                            summary: "GROUP"
                        })
                        ]
                    });
                    var searchResultCount = journalentrySearchObj.runPaged().count;
                    log.debug("journalentrySearchObj result count",searchResultCount);
                    
                    if(searchResultCount > 0){
                        journalentrySearchObj.run().getRange({start:0, end: 1000}).forEach(function(result){
                            record.delete({
                                type: 'journalentry',
                                id: result.getValue({
                                    name: 'internalid',
                                    summary: 'GROUP'
                                })
                            })
                        })
                    }
                }catch(error){
                    log.debug("ERROR IN DELETING JOURNAL ENTRY WITH WCL", error);
                }
            }
        }

        const getWorkOrderCloseList = () => {
            var workordercloseSearchObj = search.create({
                type: "workorderclose",
                filters:
                [
                   ["type","anyof","WOClose"], 
                   "AND", 
                   ["mainline","is","T"],
                   "AND", 
                   ["systemnotes.field","anyof","TRANDOC.IMPACT"], 
                    "AND", 
                    ["systemnotes.date","on","today"], 
                   "AND", 
                   ["createdfrom.mainline","is","T"],
                   //"AND", 
                   //["internalid","anyof","1856605"]
                ],
                columns:
                [
                   search.createColumn({
                      name: "internalid",
                      summary: "GROUP"
                   }),
                   search.createColumn({
                      name: "trandate",
                      summary: "GROUP"
                   }),
                   search.createColumn({
                      name: "tranid",
                      summary: "GROUP"
                   }),
                   search.createColumn({
                      name: "createdfrom",
                      summary: "GROUP"
                   }),
                   search.createColumn({
                      name: "date",
                      join: "systemNotes",
                      summary: "MAX"
                   }),
                   search.createColumn({
                    name: "subsidiary",
                    summary: "GROUP",
                    label: "Subsidiary"
                 }),
                 search.createColumn({
                    name: "department",
                    summary: "GROUP",
                    label: "Division"
                 })
                ]
             });
             var searchResultCount = workordercloseSearchObj.runPaged().count;
             log.debug("workordercloseSearchObj result count",searchResultCount);
             var wclResult = workordercloseSearchObj.run().getRange({start:0, end: 1000});
             var wclResultArray = [];
             wclResult.forEach(function(result){
                wclResultArray.push(result.getValue({name: "internalid", summary: "GROUP"}));
             })
             deleteAllJournalWithWCL(wclResultArray);

             return wclResult;
        }

        const getGLimpactLines = (woId) =>  {
            var workordercloseSearchObj = search.create({
                type: "workorderclose",
                filters:
                [
                   ["type","anyof","WOClose"], 
                   "AND", 
                   ["internalid","anyof",woId]
                ],
                columns:
                [
                   search.createColumn({
                      name: "account",
                      summary: "GROUP"
                   }),
                   search.createColumn({
                      name: "debitamount",
                      summary: "SUM"
                   }),
                   search.createColumn({
                      name: "creditamount",
                      summary: "SUM"
                   })
                ]
             });
             var searchResultCount = workordercloseSearchObj.runPaged().count;
             log.debug("workordercloseSearchObj result count",searchResultCount);

             return workordercloseSearchObj.run().getRange({start: 0, end: 1000});
        }
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
            return getWorkOrderCloseList();
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
            log.debug("mapContext", mapContext.key+" "+mapContext.value);
            mapContext.write({
                key: mapContext.key,
                value: mapContext.value
            });
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

            try{
                log.debug("reduceContext", reduceContext.key+" "+reduceContext.values);
                var params = JSON.parse(reduceContext.values);
                var woId = params.values["GROUP(internalid)"][0].value;
                var subsidiary = params.values["GROUP(subsidiary)"][0].value;
                var division = params.values["GROUP(department)"][0].value;
                var trandate = new Date(params.values["GROUP(trandate)"]);
                log.debug("woId/sub/division/trandate",woId+"/"+subsidiary+"/"+division+"/"+trandate);
                var glImpactLines = getGLimpactLines(woId);
                log.debug("glImpactLinesResults",JSON.stringify(glImpactLines));
                if(glImpactLines && glImpactLines.length > 0){
                    var journalRec = record.create({
                        type: "journalentry",
                        isDynamic: true,
                        defaultValues: {
                            subsidiary : subsidiary,
                            //custbody_suitegl_woc_ref: woId
                            //approvalstatus: 2
                        }
                    });
                    var jeSub = journalRec.getValue({
                        fieldId: "subsidiary"
                    });

                    jeApprovalStatus = journalRec.getValue({
                        fieldId: "approvalstatus"
                    });

                    suiteGLrefNo = journalRec.setValue({
                        fieldId: "custbody_suitegl_woc_ref",
                        value: woId
                    });

                    journalRec.setValue({
                        fieldId: "trandate",
                        value: trandate
                    });

                    log.debug("journalRec defaultvalues subsidiary/approvalstatus/suiteGLrefNo",jeSub+"/"+jeApprovalStatus+"/"+suiteGLrefNo);
                    glImpactLines.forEach(function(result){
                        var account = result.getValue({
                            name: "account",
                            summary: "GROUP"
                        });

                        var debit = Number(result.getValue({
                            name: "debitamount",
                            summary: "SUM"
                        }));

                        var credit = Number(result.getValue({
                            name: "creditamount",
                            summary: "SUM"
                        }));

                        if(debit && debit > 0 && credit && credit > 0){
                            //log.debug("params to create account/debit/credit", account+"/"+debit+"/"+credit);

                            journalRec.selectNewLine({
                                sublistId: "line"
                            });

                            journalRec.setCurrentSublistValue({
                                sublistId: "line",
                                fieldId: "account",
                                value: account
                            });

                            journalRec.setCurrentSublistValue({
                                sublistId: "line",
                                fieldId: "debit",
                                value: credit
                            });
                          
                          journalRec.setCurrentSublistValue({
                                sublistId: "line",
                                fieldId: "memo",
                                value: "SuiteGL Reversing Entry for WO Close"
                            });

                            journalRec.setCurrentSublistValue({
                                sublistId: "line",
                                fieldId: "department",
                                value: division
                            });

                            journalRec.commitLine({
                                sublistId: "line",
                            });

                            journalRec.selectNewLine({
                                sublistId: "line"
                            });

                            journalRec.setCurrentSublistValue({
                                sublistId: "line",
                                fieldId: "account",
                                value: account
                            });

                            journalRec.setCurrentSublistValue({
                                sublistId: "line",
                                fieldId: "credit",
                                value: debit
                            });
                          
                          journalRec.setCurrentSublistValue({
                                sublistId: "line",
                                fieldId: "memo",
                                value: "SuiteGL Reversing Entry for WO Close"
                            });

                            journalRec.setCurrentSublistValue({
                                sublistId: "line",
                                fieldId: "department",
                                value: division
                            });

                            journalRec.commitLine({
                                sublistId: "line",
                            });

                            var jeId = journalRec.save();

                            log.debug("journal entry ID", jeId);
                        }
                    });
                }
            }catch(e){
                log.debug("ERROR",e.message);
            }
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

        return {getInputData, map, reduce, summarize}

    });
