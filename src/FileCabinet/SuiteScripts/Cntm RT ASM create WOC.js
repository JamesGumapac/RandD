/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/file', 'N/http', 'N/https', 'N/record', 'N/runtime', 'N/search', 'N/url'],

function(file, http, https, record, runtime, search, url) {
   
    /**
     * Function called upon sending a GET request to the RESTlet.
     *
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.1
     */
    function doGet(requestParams) {

    }

    /**
     * Function called upon sending a PUT request to the RESTlet.
     *
     * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
     * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doPut(requestBody) {

    }


    /**
     * Function called upon sending a POST request to the RESTlet.
     *
     * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
     * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doPost(requestBody) {
    	log.debug('requestParams', JSON.stringify(requestBody));
    	var recid=requestBody.asmOpRec;
    	var operation=requestBody.operation;
    	var completedQty=requestBody.completedQty;
    	var wocQty=requestBody.woQty;
    	var scrapQty=requestBody.scrapQty;
    	var laborRunTime=requestBody.laborRunTime;
    	var laborSetupTime=requestBody.laborSetupTime;
    	var rework_info=requestBody.reworkinfo;
    	var scrap_info=requestBody.scrapinfo;
    var operator=requestBody.operator;
    var lastOp_invnum=requestBody.lastopdetails;
    var enterScrap=requestBody.enterScrap;
    var cum_scr_Qty=requestBody.cum_scr_Qty;
    var totalQtyfinal=requestBody.totalQtyfinal
    	log.debug("recid :"+recid);
    
    
    record.submitFields({
		type :'customrecord_cntm_client_app_asm_oper',
		id : recid,
		values : {
			'custrecord_cntm_asm_woc_status' :3,
			
		}
	});
    var asmOpRecLookup = search.lookupFields({
		type : 'customrecord_cntm_client_app_asm_oper',
		id : recid,
		columns : [ 'custrecord_cntm_asm_wo_ref',
				]
	});
	log.debug('asmOpRecLookup', JSON
			.stringify(asmOpRecLookup));
	var woID=asmOpRecLookup.custrecord_cntm_asm_wo_ref[0].value;
    
    
    	log.debug("operation :"+operation,"completedQty :"+completedQty);
    	log.debug("scrap_info :"+scrap_info,"rework_info :"+rework_info);
    	log.debug("lastOp_invnum",lastOp_invnum);
    	log.debug("enterScrap :"+enterScrap+"cum_scr_Qty :"+cum_scr_Qty);
    	var sublstRec = record.create({
			type : 'customrecord_cntm_asm_client_app',
			
		});
    	sublstRec.setValue({
    		fieldId:"custrecord_cntm_wo_reference",
    		value:woID
    	});
    	sublstRec.setValue({
    		fieldId:"custrecord_cntm_sublst_parent_op",
    		value:recid
    	});
    	sublstRec.setValue({
    		fieldId:"custrecord_cntm_sublist_woc_qty",
    		value:completedQty
    	});
    /*	if(scrapQty){
    		sublstRec.setValue({
        		fieldId:"custrecord_cntm_sublst_completed_qty",
        		value:parseInt(completedQty)-parseInt(scrapQty)
        	});
    	}else{*/
    		sublstRec.setValue({
        		fieldId:"custrecord_cntm_sublst_completed_qty",
        		value:completedQty
        	});
    
    	sublstRec.setValue({
    		fieldId:"custrecord_cntm_sublst_scrapqty",
    		value:scrapQty
    	});
    	sublstRec.setValue({
    		fieldId:"custrecord_cntm_sublst_status",
    		value:3
    	});
    	sublstRec.setValue({
    		fieldId:"custrecord_cntm_sublst_laborruntime",
    		value:laborRunTime
    	});
    	sublstRec.setValue({
    		fieldId:"custrecord_cntm_qty_woc_final",
    		value:totalQtyfinal
    	});
    	sublstRec.setValue({
    		fieldId:"custrecord_cntm_sublst_laborsetuptime",
    		value:laborSetupTime
    	});
    	sublstRec.setValue({
    		fieldId:"custrecord_cntm_sublst_operator",
    		value:operator
    	});
    	sublstRec.setValue({
    		fieldId:"custrecord_cntm_rework_info",
    		value:JSON.stringify(rework_info)
    	});
    	
    	sublstRec.setValue({
    		fieldId:"custrecord_cntm_scrap_info",
    		value:JSON.stringify(scrap_info)
    	});
    	sublstRec.setValue({
    		fieldId:"custrecord_cntm_last_op_inv_num",
    		value:JSON.stringify(lastOp_invnum)
    	});
    	if(enterScrap==true || enterScrap=="true"){
    		sublstRec.setValue({
        		fieldId:"custrecord_cntm_enter_scrap",
        		value:true
        	});
    	}
    	if(cum_scr_Qty){
    		sublstRec.setValue({
        		fieldId:"custrecord_cntm_cumm_scrap_to_enter_woc",
        		value:cum_scr_Qty
        	});
    	}
    	sublstRec.save();
		

    }
   function  updateSerialNumber(invNum,woId){
	   
   }
    /**
     * Function called upon sending a DELETE request to the RESTlet.
     *
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doDelete(requestParams) {

    }

    return {
        'get': doGet,
        put: doPut,
        post: doPost,
        'delete': doDelete
    };
    
});
