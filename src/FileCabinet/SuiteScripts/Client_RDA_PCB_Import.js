/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       06 Apr 2021     Sharang Kapsikar
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */
function clientPageInit(type){
	var soNo=nlapiGetFieldValue("custpage_sales_order");
	var url=nlapiResolveURL('SUITELET', 'customscript_cntm_pcb_backend_su','customdeploy_cntm_pcb_backen', null)
	var response=nlapiRequestURL(url+"&soNo="+soNo);
	var finalData=JSON.parse(response.getBody());
	var woArray=[];
	
	for(var index=0;index<=finalData.length;index++)
	{
		nlapiSelectLineItem('custpage_item_sublist',index+1)
		nlapiSetCurrentLineItemValue('custpage_item_sublist', 'custpage_item_sub', finalData[index].itemDetails);
		console.log(finalData[index].itemDetails);
		console.log(finalData[index]);
		nlapiSetCurrentLineItemValue('custpage_item_sublist', 'custpage_workorder',  finalData[index].workOrder);
		nlapiSetCurrentLineItemValue('custpage_item_sublist', 'custpage_workorder_cf',  finalData[index].createdfrom);
		nlapiSetCurrentLineItemValue('custpage_item_sublist', 'custpage_quantity', finalData[index].woQty);
		nlapiSetCurrentLineItemValue('custpage_item_sublist', 'custpage_wo_status',finalData[index].woStatus);
		nlapiSetCurrentLineItemValue('custpage_item_sublist', 'custpage_new_rout', false);
		nlapiSetCurrentLineItemValue('custpage_item_sublist', 'custpage_lot_rec', false);
		nlapiSetCurrentLineItemValue('custpage_item_sublist', 'custpage_cr_status', finalData[index].crStatus);
		nlapiSetCurrentLineItemValue('custpage_item_sublist', 'custpage_sublistinternalid',  finalData[index].internalId);
		nlapiSetCurrentLineItemValue('custpage_item_sublist', 'custpage_error_details',  finalData[index].errorDetials);
		nlapiSetCurrentLineItemValue('custpage_item_sublist', 'custpage_routing_status',  finalData[index].routeStatus);
		nlapiCommitLineItem('custpage_item_sublist');
	}
	
}
