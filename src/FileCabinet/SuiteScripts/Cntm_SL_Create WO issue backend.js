/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
 define([ 'N/record', 'N/runtime', 'N/search', 'N/task' ],
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
           log.debug('TRIGGERED...')
             var params = context.request.parameters;
             var wo = params.wo;
             var map = params.map;
             var headerRec=params.headerRec;
             var scriptTask = task.create({
                 taskType : task.TaskType.MAP_REDUCE
             });
             var lotsArray = JSON.parse(map);
            
             scriptTask.scriptId = 'customscript_cntm_mr_create_wo_issue';
             scriptTask.params = {
                 custscript_cntm_wo_rec : wo,
                 custscript_cntm_lots : map,
                 custscript_cntm_header_rec:headerRec
             };

             var scriptTaskId = scriptTask.submit();
             var status = task.checkStatus(scriptTaskId).status;
             log.debug(scriptTaskId);
             context.response.write('true');
             
             if(lotsArray.length>0){
                for(var i=0;i<lotsArray.length;i++){
                    var rec=lotsArray[i].id;
                    var id = record.submitFields({
                        type : 'customrecord_cntm_clientappsublist',
                        id : rec,
                        values : {
                            'custrecord_cntm_issue_in_process' : true
                        },
                        options : {
                            enableSourcing : false,
                            ignoreMandatoryFields : true
                        }
                    });
                }
            }
         } catch (e) {
             log.debug('error', e.message);
             context.response.write(e.message);
         }
 
     }
 
     return {
         onRequest : onRequest
     };
 
 });
 