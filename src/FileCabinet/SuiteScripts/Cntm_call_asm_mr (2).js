/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define([ 'N/runtime', 'N/search', 'N/task' ],
/**
 * @param {runtime}
 *            runtime
 * @param {search}
 *            search
 * @param {task}
 *            task
 */
function(runtime, search, task) {

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
		if (context.request.method === "GET") {

		} else {
			try {
				var jobId = context.request.body;// .parameters.jobId;
				log.debug('jobId',jobId);
				var scriptTask = task.create({
					taskType : task.TaskType.MAP_REDUCE
				});
				scriptTask.scriptId = 'customscript_cntm_asm_woc';
				// scriptTask.deploymentId =
				// 'customdeploy_cntm_mr_qt_item_import';
				scriptTask.params = {
					custscript_cntm_requestbody : JSON.stringify(jobId)// _subrecIds :
														// subrecIds
				};
				var scriptTaskId = scriptTask.submit();
				var scriptStatus = task.checkStatus(scriptTaskId).status;
				log.debug(scriptTaskId);
			} catch (e) {
				log.error('e', e.message);
			}
		}
	}

	return {
		onRequest : onRequest
	};

});
