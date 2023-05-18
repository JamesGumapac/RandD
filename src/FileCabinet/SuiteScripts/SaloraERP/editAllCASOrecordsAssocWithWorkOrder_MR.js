/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/log', 'N/record', 'N/search', 'N/runtime'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 */
    (log, record, search, runtime) => {
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

            var customrecord_cntm_clientappsublistSearchObj = search.create({
                type: "customrecord_cntm_clientappsublist",
                filters:
                [
                   ["custrecord_inherited_from_wo","is","F"], // only update Client App Sublist Operations (CASO) once
                   "AND", 
                   ["custrecord_cntm_work_order.custbody_cntm_custom_rec_ref_hide","is","T"], // WO should be released = TRUE
                   "AND", 
                   ["custrecord_cntm_work_order.mainline","is","T"], // remove extra lines
                   //"AND",                                            // testing
                   //["custrecord_cntm_work_order","anyof","202600"]   // testing
                ],
                columns:
                [
                   "custrecord_inherited_from_wo",
                   search.createColumn({
                      name: "custbody_cntm_custom_rec_ref_hide",
                      join: "CUSTRECORD_CNTM_WORK_ORDER"
                   }),
                   search.createColumn({
                      name: "custbody_rda_wo_priorty",
                      join: "CUSTRECORD_CNTM_WORK_ORDER"
                   }),
                   search.createColumn({
                      name: "custbody_rda_wo_priorty_2",
                      join: "CUSTRECORD_CNTM_WORK_ORDER"
                   }),
                   search.createColumn({
                      name: "custbody_rda_wo_sched_due_date",
                      join: "CUSTRECORD_CNTM_WORK_ORDER"
                   }),
                   search.createColumn({
                      name: "custbody_comments_for_dash",
                      join: "CUSTRECORD_CNTM_WORK_ORDER"
                   }),
                   search.createColumn({
                      name: "custbody_comm_for_planning",
                      join: "CUSTRECORD_CNTM_WORK_ORDER"
                   }),
                   search.createColumn({
                      name: "custbody_comments_for_prod",
                      join: "CUSTRECORD_CNTM_WORK_ORDER"
                   }),
                   search.createColumn({
                      name: "custbody_rda_qfactor",
                      join: "CUSTRECORD_CNTM_WORK_ORDER"
                   }),
                   "custrecord_cntm_work_order"
                ]
             });

             return customrecord_cntm_clientappsublistSearchObj;
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
            let obj = JSON.parse(mapContext.value)

            var casoId = record.submitFields({
                type: obj.recordType,
                id: obj.id,
                values: {
                    custrecord_cntm_priority1 : obj.values['custbody_rda_wo_priorty.CUSTRECORD_CNTM_WORK_ORDER'],
                    custrecord_cntm_priority2 : obj.values['custbody_rda_wo_priorty_2.CUSTRECORD_CNTM_WORK_ORDER'],
                    custrecord_cntm_qfactor : obj.values['custbody_rda_qfactor.CUSTRECORD_CNTM_WORK_ORDER'],
                    custrecord_cntm_comments_for_prod : obj.values['custbody_comments_for_prod.CUSTRECORD_CNTM_WORK_ORDER'],
                    custrecord_cntm_comments_for_dash : obj.values['custbody_comments_for_dash.CUSTRECORD_CNTM_WORK_ORDER'],
                    custrecord_cntm_comments_for_planning : obj.values['custbody_comm_for_planning.CUSTRECORD_CNTM_WORK_ORDER'],
                    custrecord_cntm_wo_sched_due_date : obj.values['custbody_rda_wo_sched_due_date.CUSTRECORD_CNTM_WORK_ORDER'],
                    custrecord_inherited_from_wo : true
                }
            });

            log.debug("Updated CASO ID: " + casoId);
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
            let errorStack = logErrors(summaryContext)
            let unexpectedErrors = errorStack.filter(f => f.match(/unexpected_suite|unexpected error|unexpected_error/gi))
            let script = runtime.getCurrentScript()
            
            let result = []
            summaryContext.output.iterator().each( (key, value) => {
                result.push(key)
                return true
            })
            
            log.debug({ title: '-------- [END] --------', details: `Usage: ${summaryContext.usage}; Concurrency: ${summaryContext.concurrency}; Number of yields: ${summaryContext.yields}; Total items processed: ${result.length}` })
        }

        const logErrors = ctx => {
            let errorStack = []
            if (ctx.inputSummary.error) {
                errorStack.push(`Input Error: ${ctx.inputSummary.error}`)
                log.debug('Input Error', ctx.inputSummary.error)
            }
            
            ctx.mapSummary.errors.iterator().each((code, message) => {
                errorStack.push(`Map Error ${code}: ${message}`)
                // if (!(code+message).match(/unexpected error/gi))
                log.debug(`Map Error ${code}`, message)
                return true
            })
            ctx.reduceSummary.errors.iterator().each((code, message) => {
                errorStack.push(`Reduce Error ${code}: ${message}`)
                log.debug(`Reduce Error ${code}`, message)
                return true
            })
            return errorStack
        }

        return {getInputData, map, reduce, summarize}

    });
