/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define([ 'N/https', 'N/record','N/url', 'N/task','N/cache'], function(https, record, url, task,cache) {

    function onRequest(context) {
        try {


            var temporaryCache = cache.getCache({
                name: 'myCache',
                scope: cache.Scope.PUBLIC
            });
            log.debug("cache here",temporaryCache)

            var arrayForSerial = temporaryCache.get({
                key:'serial',
                ttl: 300
            });
            log.debug("arrayForSerial",arrayForSerial)
            if(arrayForSerial)
            {
                log.debug("serial exists")
            }





            log.debug('Init',context);
            var  requestBody = JSON.parse(context.request.body);
            log.debug('requestBody',requestBody);
            
            var scriptTask = task.create({
				taskType: task.TaskType.SCHEDULED_SCRIPT
			});
			scriptTask.scriptId = 'customscript_cntm_ss_client_create_woc';
			scriptTask.params= {
				custscript_cntm_wo_details: requestBody
			}
			var scriptTaskId = scriptTask.submit();
			log.audit({
				title: 'scriptTaskId',
				details: scriptTaskId
			});
        } catch (error) {
            log.error('onRequest',error);
        }
    }

    return {
        onRequest: onRequest
    }
});
