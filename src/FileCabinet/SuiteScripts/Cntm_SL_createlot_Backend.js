/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 *//**
 30-04-22     Added Submit Field on WO to set field as true
 
 */
 define(["N/record", "N/runtime", "N/search", "N/task"]
 /**
  * @param {record}
  *            record
  * @param {runtime}
  *            runtime
  * @param {search}
  *            search
  */, function (record, runtime, search, task) {
   //For creating task for lot record creation
 
   /**
    * Definition of the Suitelet script trigger point.
    *
    * @param {Object}
    *            context
    * @param {ServerRequest}
    *            context.request - Encapsulation of the incoming request
    * @param {ServerResponse}
    *            context.response - Encapsulation of the Suitelet response
    * @Since 2015.2
    */
   function onRequest(context) {
     try {
       log.debug("IN Suitelet");
       var woID = parseInt(context.request.parameters.woId);
       log.debug("WO IN suitelet :", woID);
 
       var woLoad = record.load({
         type: record.Type.WORK_ORDER,
         id: woID,
         //   isDynamic: boolean,
         //   defaultValues: Object
       });
       log.debug("woLoad IN suitelet :", woLoad);
 
       var isRework = woLoad.getValue({
         fieldId: "custbody_cntm_is_rework_wo",
       });
       log.debug("isRework :", isRework);
 
       if (woID) {
         var lotFromCompletion = woLoad.getValue({
           fieldId: "custbody_cntm_prev_lot_rec", // 'custbody_cntm_lot_from_completion'
         });
         log.debug("lotFromCompletion", lotFromCompletion);
         var assemblyItem = woLoad.getValue({
           fieldId: "assemblyitem", // 'assemblyaitem'
         });
         var noOfPanels = woLoad.getValue({
           fieldId: "custbody_cntm_no_of_panel",
         });
         var isPanelCreated = woLoad.getValue({
           fieldId: "custbody_cntm_panel_wo_created",
         });

         var lotForStock = woLoad.getValue({
          fieldId: "custbody_cntm_lot_stock_board",
         });
         log.debug('lotForStock :',lotForStock);

         if (isPanelCreated == true || isPanelCreated == "T")
           noOfPanels = woLoad.getValue({
             fieldId: "custbody_cntm_no_of_new_lots",
           });
         var params = {};
 
         if (lotFromCompletion) {
         } else {
           var filters = [];
           filters.push(["custrecord_cntm_lot_wonum", "anyof", woID]);
           var customrecord_cntm_lot_creationSearchObj = search.create({
             type: "customrecord_cntm_lot_creation",
             filters: filters,
             columns: [
               search.createColumn({
                 name: "custrecord_cntm_lot_wonum",
                 sort: search.Sort.ASC,
                 label: "WO#",
               }),
               search.createColumn({
                 name: "custrecord_cntm_lot_wo_completion",
                 label: "WO Completion ",
               }),
               search.createColumn({
                 name: "custrecord_cntm_lot_assembly_item",
                 label: "Assembly Item ",
               }),
               search.createColumn({
                 name: "custrecord_cntm_lot_lotnumber",
                 label: "LOT#",
               }),
               search.createColumn({
                 name: "custrecord_cntm_wo_details_fab",
                 label: "Parent",
               }),
             ],
           });
         //  log.debug(
           //  "customrecord_cntm_lot_creationSearchObj :",
             //customrecord_cntm_lot_creationSearchObj
           // );
           var searchResultCount =
             customrecord_cntm_lot_creationSearchObj.runPaged().count;
           log.debug(
             "customrecord_cntm_lot_creationSearchObj result count",
             searchResultCount
           );
 
           if (searchResultCount == 0) { //karen 
             log.debug("noOfPanels", noOfPanels);       
             if (noOfPanels || isRework) {
               params = {
                 custscript_cntm_woid: woID,
                 custscript_cntm_panels: noOfPanels,
                 custscript_cntm_fab_item: assemblyItem,
                 custscript_cntm_is_issue: "T", //Previous it was true for Stock board it is setted to F
                 custscript_cntm_is_rework: isRework == true ? "T" : "F",
                 custscript_cntm_lot_from_completion: lotFromCompletion,
                 custscript_cntm_lot_stock_boards:lotForStock
               };
             }
           }
 
           log.debug("JSON.stringify(params) :", JSON.stringify(params));
           if (params && JSON.stringify(params) != "{}") {
             log.debug("Finally");

             var scriptTask = task.create({
               taskType: task.TaskType.SCHEDULED_SCRIPT,
             });
             scriptTask.scriptId = "customscript_cntm_ss_pcb_lot_num";
             // scriptTask.deploymentId =
             // 'customdeploy_cntm_ss_pcb_lot_num';
             scriptTask.params = params;
             var scriptTaskId = scriptTask.submit();
             var status = task.checkStatus(scriptTaskId).status;
             log.debug('scriptTaskId' ,scriptTaskId);
             log.debug('status' ,status);
 
           }
           context.response.write('Suitelet Run');
         }
       }
 
       // var id = record.submitFields({
       //     type: record.Type.WORK_ORDER,
       //     id: headerRec, //
       //     values: {
       //         custbody_cntm_ref_for_btn_hide: true,
       //     },
       //     options: {
       //         enableSourcing: false,
       //         ignoreMandatoryFields: true,
       //     },
       // });
     } catch (e) {
       log.debug("error", e.message);
       context.response.write(e.message);

       record.submitFields({
        type: record.Type.WORK_ORDER,
        id: woID,
        values: {custbody_cntm_hidden_prevent_dup_lot : false }
      });
     }
   }
 
   return {
     onRequest: onRequest,
   };
 });
 