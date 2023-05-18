/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define([ 'N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url' ],
/**
 * @param {record}
 *            record
 * @param {runtime}
 *            runtime
 * @param {search}
 *            search
 * @param {serverWidget}
 *            serverWidget
 * @param {url}
 *            url
 */
function(record, runtime, search, serverWidget, url) {

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
		if (context.request.method === 'GET') {
			var form = serverWidget.createForm({
				title : 'Enter Serial Ids'
			});
			var woQty = context.request.parameters.qty;
			var wo = context.request.parameters.wo;
			var woItem = context.request.parameters.item;
			var chkfield = form.addField({
				id : 'custpage_chk',
				type : serverWidget.FieldType.TEXT,
				// source : 'item',
				label : 'Chk'
			});
			chkfield.defaultValue = 1;
			chkfield.updateDisplayType({
				displayType : serverWidget.FieldDisplayType.HIDDEN
			});
			var qtyfield = form.addField({
				id : 'custpage_wo',
				type : serverWidget.FieldType.TEXT,
				// source : 'item',
				label : 'Selected Quantity'
			});
			qtyfield.defaultValue = wo;
			qtyfield.updateDisplayType({
				displayType : serverWidget.FieldDisplayType.HIDDEN
			});
			var woqtyfield = form.addField({
				id : 'custpage_wo_qty',
				type : serverWidget.FieldType.TEXT,
				// source : 'item',
				label : 'WO Quantity'
			});
			woqtyfield.defaultValue = woQty;
			woqtyfield.updateDisplayType({
				displayType : serverWidget.FieldDisplayType.HIDDEN
			});
			var woitemfield = form.addField({
				id : 'custpage_wo_item',
				type : serverWidget.FieldType.TEXT,
				// source : 'item',
				label : 'WO Item'
			});
			woitemfield.defaultValue = woItem;
			woitemfield.updateDisplayType({
				displayType : serverWidget.FieldDisplayType.HIDDEN
			});
			var subList = form.addSublist({
				id : "custpage_ids",
				type : serverWidget.SublistType.INLINEEDITOR,
				label : "Serial Ids"
			});
			var checkbox = subList.addField({
				id : "custpage_serial_id",
				type : serverWidget.FieldType.TEXT,
				label : "Serial Id"
			});
			form.addSubmitButton({
				label : 'Submit'
			});
			context.response.writePage(form);
			form.clientScriptModulePath = './Cntm_serial_ids.js';
			//form.clientScriptFileId = 24417;
		}
		//else {
//			var wo = context.request.parameters.custpage_wo;
//			var lineCount = context.request.getLineCount({
//				group : 'custpage_ids'
//			});
//			for (var int = 0; int < lineCount; int++) {
//				var serialIdRec = record.create({
//					type : 'customrecord_cntm_asm_serial_ids',
//					isDynamic : true
//				});
//				var serialId=context.request.getSublistValue({
//					group : 'custpage_ids',
//					name : 'custpage_serial_id',
//					line : int
//				})
//				serialId=serialId.replace(/ /g,"_");
//				serialIdRec.setValue({
//					fieldId : 'name',
//					value : serialId
//				});
//				serialIdRec.setValue({
//					fieldId : 'custrecord10',
//					value : wo
//				});
//				serialIdRec.save();
//			}
			
		//}
	}

	return {
		onRequest : onRequest
	};

});
