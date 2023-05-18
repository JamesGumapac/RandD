/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/task',
		  'N/redirect', 'N/file', 'N/error','N/email'],

function(record, runtime, search, serverWidget, task, redirect, file,
		  error,email) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {
    	var currentRec = scriptContext.newRecord;
		log.debug('currentRec.type', currentRec.type);
      
		if (currentRec.type == 'customrecord_cntm_asm_client_app' && scriptContext.type == 'create') {	
			if(runtime.executionContext != runtime.ContextType.MAP_REDUCE){
			var recid=currentRec.id;
			var recType=currentRec.type;
			/*var createWOC = rec.getValue({
				fieldId : 'custrecord_cntm_cso_createwo_completion'
			});*/
			var status = currentRec.getValue({
				fieldId : 'custrecord_cntm_asm_woc_status'
			});
			
			if (status!=4) {

				var scriptTask = task.create({
					taskType : task.TaskType.SCHEDULED_SCRIPT
				});
				scriptTask.scriptId = 'customscript_cntm_ss_create_asm_woc';
				scriptTask.params = {
						custscript_cntm_asm_op_rec_id : recid
				};

				var scriptTaskId = scriptTask.submit();
				var status = task.checkStatus(scriptTaskId).status;
				log.debug(scriptTaskId);
			}
            }
		}
    }

    return {
     //   beforeLoad: beforeLoad,
      //  beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
