/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define([ 'N/file', 'N/http', 'N/https', 'N/record', 'N/runtime', 'N/search',
		'N/url', 'N/task' ],

function(file, http, https, record, runtime, search, url, task) {

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
			var recid = requestBody.asmOpRec;
			var operation = requestBody.operation;
			var completedQty = requestBody.completedQty;
			var wocQty = requestBody.woQty;
			var scrapQty = requestBody.scrapQty;
			var laborRunTime = requestBody.laborRunTime;
			var laborSetupTime = requestBody.laborSetupTime;
			var rework_info = requestBody.reworkinfo;
			var scrap_info = requestBody.scrapinfo;
			var operator = requestBody.operator;
			var lastOp_invnum = requestBody.lastopdetails;
			var enterScrap = requestBody.enterScrap;
			var cum_scr_Qty = requestBody.cum_scr_Qty;
			var totalQtyfinal = requestBody.totalQtyfinal
			log.debug("recid :" + recid);

			record.submitFields({
				type : 'customrecord_cntm_client_app_asm_oper',
				id : recid,
				values : {
					'custrecord_cntm_asm_woc_status' : 3,

				}
			});
			var output = url.resolveScript({
				scriptId : 'customscript_cntm_backend_asm',
				deploymentId : 'customdeploy_cntm_backend_asm',
				returnExternalUrl : true
			});
			var response = https.post({
				url : output,
				body : JSON.stringify(requestBody),
			});
			log.debug('response',response)
		} catch (e) {
			log.error('--', e);
			if(e.name == 'SSS_CONNECTION_TIME_OUT'){
				var output_url = url.resolveScript({
					scriptId : 'customscript_cntm_backend_asm',
					deploymentId : 'customdeploy_cntm_backend_asm_a',
					returnExternalUrl : true
				});
				var resp = https.post({
					url : output_url,
					body : JSON.stringify(requestBody),
				});
				log.debug('resp',resp)
			}else{
				record.submitFields({
					type : 'customrecord_cntm_client_app_asm_oper',
					id : recid,
					values : {
						'custrecord_cntm_asm_woc_status' : 5,
	
					}
				});
			}
			
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
