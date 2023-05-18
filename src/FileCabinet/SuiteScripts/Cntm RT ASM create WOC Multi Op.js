/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
 define([ 'N/file', 'N/http', 'N/https', 'N/record', 'N/runtime', 'N/search',
 'N/url', 'N/task','N/cache' ],

function(file, http, https, record, runtime, search, url, task,cache) {

/**
* Function called upon sending a GET request to the RESTlet.
* 
* @param {Object}
*            requestParams - Parameters from HTTP request URL; parameters
*            will be passed into function as an Object (for all supported
*            content types)
* @returns {string | Object} HTTP response body; return string when request
*          Content-Type is 'text/plain'; return Object when request
*          Content-Type is 'application/json'
* @since 2015.1
*/
function doGet(requestParams) {

}

/**
* Function called upon sending a PUT request to the RESTlet.
* 
* @param {string |
*            Object} requestBody - The HTTP request body; request body will
*            be passed into function as a string when request Content-Type
*            is 'text/plain' or parsed into an Object when request
*            Content-Type is 'application/json' (in which case the body
*            must be a valid JSON)
* @returns {string | Object} HTTP response body; return string when request
*          Content-Type is 'text/plain'; return Object when request
*          Content-Type is 'application/json'
* @since 2015.2
*/
function doPut(requestBody) {

}

/**
* Function called upon sending a POST request to the RESTlet.
* 
* @param {string |
*            Object} requestBody - The HTTP request body; request body will
*            be passed into function as a string when request Content-Type
*            is 'text/plain' or parsed into an Object when request
*            Content-Type is 'application/json' (in which case the body
*            must be a valid JSON)
* @returns {string | Object} HTTP response body; return string when request
*          Content-Type is 'text/plain'; return Object when request
*          Content-Type is 'application/json'
* @since 2015.2
*/
function doPost(requestBody) {
 try {
     // log.debug('requestParams', JSON.stringify(requestBody));
     log.debug('requestParams', JSON.stringify(requestBody));
     var finaldata_length= requestBody.finalDataPush.length;
     log.debug("finaldatapush length--------------",JSON.stringify(finaldata_length));
     var myCache = cache.getCache({
        name: 'myCache',
        scope: cache.Scope.PUBLIC
    });

    var cache_existing = myCache.get({
        key:'serial',
        ttl: 300
    });
    log.debug("cache_existing",cache_existing)

    var arr='';
     for(var i=0;i<finaldata_length;i++)
     {
        if(cache_existing!=null )
        { if(cache_existing.includes(requestBody.finalDataPush[i].serialno)){

            log.audit("serial id " +requestBody.finalDataPush[i].serialno+" completion in progress")
            return {
                "success" : "false",
                "datain" : "Work order completion for the same serial id is already in process. Please wait"
            }

        }}
       
        else{
            log.debug("serialno input", JSON.stringify(requestBody.finalDataPush[i].serialno))
            // arr.push(requestBody.finalDataPush[i].serialno);
            arr=arr+ ','+(requestBody.finalDataPush[i].serialno);
            log.debug("arr",arr)
        }
      
     }

     log.debug("arr outside",arr)
    

     myCache.put({
        key:'serial',
        value:cache_existing +arr,
        ttl: 300
    })
   

     var requestBody = requestBody.finalDataPush;
     // var recid = requestBody.asmOpRec;
     // var operation = requestBody.operation;
     // var completedQty = requestBody.completedQty;
     // var wocQty = requestBody.woQty;
     // var scrapQty = requestBody.scrapQty;
     // var laborRunTime = requestBody.laborRunTime;
     // var laborSetupTime = requestBody.laborSetupTime;
     // var rework_info = requestBody.reworkinfo;
     // var scrap_info = requestBody.scrapinfo;
     // var operator = requestBody.operator;
     // var lastOp_invnum = requestBody.lastopdetails;
     // var enterScrap = requestBody.enterScrap;
     // var cum_scr_Qty = requestBody.cum_scr_Qty;
     // var totalQtyfinal = requestBody.totalQtyfinal

     requestBody.forEach(element => {
         try {
             var recid = element.asmOpRec;
             log.debug("recid :" + recid);

             record.submitFields({
                 type : 'customrecord_cntm_client_app_asm_oper_s',
                 id : recid,
                 values : {
                     'custrecordcntm_client_asm_status' : 3,

                 }
             });
             
             // var scriptTask = task.create({
             // 	taskType: task.TaskType.SCHEDULED_SCRIPT
             // });
             // scriptTask.scriptId = 'customscript_cntm_ss_client_create_woc';
             // scriptTask.params= {
             // 	custscript_cntm_wo_details: requestBody
             // }
             // var scriptTaskId = scriptTask.submit();
             // log.audit({
             // 	title: 'scriptTaskId',
             // 	details: scriptTaskId
             // });
 
             } catch (error) {
             log.error('--', e);
             if(e.message.includes('The host you are trying')){
             // 	var output_url = url.resolveScript({
             // 		scriptId : 'customscript_cntm_backend_asm',
             // 		deploymentId : 'customdeploy_cntm_backend_asm_a',
             // 		returnExternalUrl : true
             // 	});
             // 	var resp = https.post({
             // 		url : output_url,
             // 		body : JSON.stringify(requestBody),
             // 	});
             // 	log.debug('resp',resp)
             // }else{
             // 	record.submitFields({
             // 		type : 'customrecord_cntm_client_app_asm_oper_s',
             // 		id : recid,
             // 		values : {
             // 			'custrecordcntm_client_asm_status' : 5,
     
             // 		}
             // 	});
             }
             
         }
     });

     var output = url.resolveScript({
         scriptId : 'customscript_cntm_sl_client_call_woc',
         deploymentId : 'customdeploy_cntm_sl_client_call_woc',
         returnExternalUrl : true
     });
     var response = https.post({
         url : output,
         body : JSON.stringify(requestBody),
     });
     log.debug('response',response)
     // log.debug("recid :" + recid);

     // record.submitFields({
     // 	type : 'customrecord_cntm_client_app_asm_oper_s',
     // 	id : recid,
     // 	values : {
     // 		'custrecordcntm_client_asm_status' : 1,

     // 	}
     // });
     // var output = url.resolveScript({
     // 	scriptId : 'customscript_cntm_sl_client_call_woc',
     // 	deploymentId : 'customdeploy_cntm_sl_client_call_woc',
     // 	returnExternalUrl : true
     // });
     // var response = https.post({
     // 	url : output,
     // 	body : JSON.stringify(requestBody),
     // });
     // log.debug('response',response)

     // var scriptTask = task.create({
     // 	taskType: task.TaskType.SCHEDULED_SCRIPT
     // });
     // scriptTask.scriptId = 'customscript_cntm_ss_client_create_woc';
     // scriptTask.params= {
     // 	custscript_cntm_wo_details: requestBody
     // }
     // var scriptTaskId = scriptTask.submit();
     // log.audit({
     // 	title: 'scriptTaskId',
     // 	details: scriptTaskId
     // });
 } catch (e) {
     log.error('---', e);
     // if(e.message.includes('The host you are trying')){
     // 	var output_url = url.resolveScript({
     // 		scriptId : 'customscript_cntm_backend_asm',
     // 		deploymentId : 'customdeploy_cntm_backend_asm_a',
     // 		returnExternalUrl : true
     // 	});
     // 	var resp = https.post({
     // 		url : output_url,
     // 		body : JSON.stringify(requestBody),
     // 	});
     // 	log.debug('resp',resp)
     // }else{
     // 	record.submitFields({
     // 		type : 'customrecord_cntm_client_app_asm_oper_s',
     // 		id : recid,
     // 		values : {
     // 			'custrecordcntm_client_asm_status' : 5,

     // 		}
     // 	});
     // }
     
 }
}
function updateSerialNumber(invNum, woId) {

}
/**
* Function called upon sending a DELETE request to the RESTlet.
* 
* @param {Object}
*            requestParams - Parameters from HTTP request URL; parameters
*            will be passed into function as an Object (for all supported
*            content types)
* @returns {string | Object} HTTP response body; return string when request
*          Content-Type is 'text/plain'; return Object when request
*          Content-Type is 'application/json'
* @since 2015.2
*/
function doDelete(requestParams) {

}

return {
 'get' : doGet,
 put : doPut,
 post : doPost,
 'delete' : doDelete
};

});