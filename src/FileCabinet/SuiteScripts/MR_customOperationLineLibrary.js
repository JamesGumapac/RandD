/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
 define(['N/record', 'N/search','N/log', './customOperationLineLibrary.js','N/runtime'],
 /**
* @param{record} record
* @param{search} search
*/
 (record, search, log, custOpLib, runtime) => {

     const getWOtoCreate = (searchId) => {
        log.debug("search id", searchId);
        log.error("search id", searchId);
        //  var workorderSearchObj = search.create({
        //      type: "workorder",
        //      filters:
        //      [
        //         ["type","anyof","WorkOrd"], 
        //         "AND", 
        //         ["custbody_cntm_ref_for_btn_hide","is","T"], 
        //         "AND", 
        //         ["mainline","is","T"], 
        //         "AND", 
        //         ["custbody_mr_custom_op_line","is","F"],
        //         "AND", 
        //          ["trandate","onorafter","5/22/2022"],
        //          "AND",
        //          ["manufacturingrouting","noneof","@NONE@"]
        //      ],
        //      columns:
        //      [
        //         "tranid",
        //         "trandate",
        //         "quantity",
        //          "custbody_cntm_good_panels",
        //          "custbody_total_num_cores"
        //      ]
        //   });
        if(searchId){
            var workorderSearchObj = search.load({
                id: searchId
            });

            var searchResultCount = workorderSearchObj.runPaged().count;
            log.error("workorderSearchObj result count",searchResultCount);
            if(searchResultCount > 0){
                var searchResults = workorderSearchObj.run().getRange({start: 0, end: 1000});
                var woIds = [];
                searchResults.forEach(function(result){
                    woIds.push(result.getValue({name:"tranid"}));
                });
                log.error("WORK ORDER IDS: ",woIds.toString());
            }

            return workorderSearchObj.run().getRange({start: 0, end: 1000});
        }else{
            return [];
        }
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
        var searchId = runtime.getCurrentScript().getParameter({
            name: 'custscript_searchid'
        });
           
         return getWOtoCreate(searchId);
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
             var parameters = JSON.parse(reduceContext.values)

             var woId = parameters.id;
             var currUser = "";
             var quantity = parameters.values.quantity || 0;
             var goodnumofpanels = parameters.values.custbody_cntm_good_panels || 0;
             var totalnumofcores = parameters.values.custbody_total_num_cores || 0;
             var qfactor = parameters.values.custbody_rda_qfactor || 0;

             log.debug("parameters", woId+"/"+currUser+"/"+quantity+"/"+goodnumofpanels+"/"+totalnumofcores);

             var woTargetGateFields = custOpLib.deleteAndCreateCustomOperationLines(woId, currUser, quantity, goodnumofpanels, totalnumofcores, qfactor);
             
             record.submitFields({
                 type: record.Type.WORK_ORDER,
                 id: woId,
                 values: {
                     custbody_target_gate_first: woTargetGateFields.custbody_target_gate_first,
                     custbody_target_gate_second: woTargetGateFields.custbody_target_gate_second,
                     custbody_target_gate_third: woTargetGateFields.custbody_target_gate_third,
                     custbody_mr_custom_op_line: true,
                     custbody_wipreport_firstopname: woTargetGateFields.first_op_name,
                     custbody_latest_proj_end_date : woTargetGateFields.projectedEndDate,
                 },
                 options: {
                 enableSourcing: false,
                 ignoreMandatoryFields: true
                 }
             });
             log.error("Done for WO ID: "+woId);
         }catch(e){
             log.debug("ERROR REDUCE",e.message);
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
