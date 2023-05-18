/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
 define(['N/log', 'N/record', 'N/search'],
 /**
* @param{log} log
* @param{record} record
* @param{search} search
*/
 (log, record, search) => {
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
        var woIds = [];

        var workorderSearchObj = search.create({
            type: "workorder",
            filters:
            [
               ["type","anyof","WorkOrd"], 
               "AND", 
               ["mainline","is","T"], 
               "AND", 
               ["status","anyof","WorkOrd:D","WorkOrd:A","WorkOrd:B"],
               "AND", 
                ["custbody2","is","F"]
            ],
            columns:
            [
               "tranid",
               search.createColumn({
                  name: "trandate",
                  sort: search.Sort.ASC
               }),
               "custbody_cntm_so_line_unique_key",
               "custbody2"
            ]
         });
         var searchResultCount = workorderSearchObj.runPaged().count;

         var woSearchResults = workorderSearchObj.run().getRange({
            start: 0,
            end: 1000
        });

         log.debug("workorderSearchObj result count",searchResultCount);

         if(woSearchResults.length > 0){
            // woIds.push(woSearchResults[0].id);
            // woIds.push(woSearchResults[1].id);
            woSearchResults.forEach(function(result){
                 woIds.push(result.id);
             })
         }

         return woIds;
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
         log.debug("map key/value",mapContext.key+"/"+mapContext.value);
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
         var params = JSON.parse(reduceContext.values);
         log.debug({
             title: "reduce "+reduceContext.key,
             details: params
         });
         var woId = params;
         log.debug("load woid", woId);
         if(woId){
             var woRecord = record.load({
                 type: "workorder",
                 id: woId,
                 isDynamic: true,
             });

             woRecord.setValue({
                fieldId: "custbody2",
                value: true,
             })

             var woIdSave = woRecord.save({
                 ignoreMandatoryFields: true
             });

             log.debug("Updated WOID", woIdSave);
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
