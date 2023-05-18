/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define([ 'N/ui/serverWidget', 'N/record', 'N/search', 'N/transaction',
		'N/ui/serverWidget', 'N/xml', 'N/runtime', 'N/task', 'N/render',
		'N/https', 'N/url', 'N/redirect' ],

function(ui, record, search, transaction, serverWidget, xml, runtime, task,
		render, https, url, redirect) {

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
		var fabRec = context.request.parameters.fabRec;
		var WOs = [];
		var customrecord_cntm_wo_bom_import_fabSearchObj = search.create({
			type : "customrecord_cntm_wo_bom_import_fab",
			filters : [ [ "internalidnumber", "equalto", fabRec ] ],
			columns : [ "custrecord_cntm_bom_fab",
					"custrecord_cntm_status_fab_wo_crtn", search.createColumn({
						name : "custrecord_cntm_wo_number_fabwo_crtn",
						join : "CUSTRECORD_CNTM_FAB_WO_CREATION"
					}) ]
		});
		var searchResultCount = customrecord_cntm_wo_bom_import_fabSearchObj
				.runPaged().count;
		log.debug("customrecord_cntm_wo_bom_import_fabSearchObj result count",
				searchResultCount);
		customrecord_cntm_wo_bom_import_fabSearchObj.run().each(
				function(result) {
					// .run().each has a limit of 4,000 results
					var wo = result.getValue({
						name : "custrecord_cntm_wo_number_fabwo_crtn",
						join : "CUSTRECORD_CNTM_FAB_WO_CREATION"
					});
					if (wo)
						WOs.push(wo);
					return true;
				});
		log.debug('WOs', WOs);
		var scriptTask = task.create({
			taskType : task.TaskType.MAP_REDUCE
		});
		scriptTask.scriptId = 'customscript_cntm_mr_update_bom';
		// scriptTask.deploymentId =
		// 'customdeploy_cntm_mr_qt_item_import';
		scriptTask.params = {
			custscript_cntm_fab_id : fabRec,
			custscript_cntm_wo_arr : WOs
		};

		var scriptTaskId = scriptTask.submit();
		var status = task.checkStatus(scriptTaskId).status;
		log.debug(scriptTaskId);
	}

	return {
		onRequest : onRequest
	};

});
