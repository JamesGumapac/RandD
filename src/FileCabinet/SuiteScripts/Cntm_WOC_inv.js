/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define([ 'N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget' ],
/**
 * @param {record}
 *            record
 * @param {runtime}
 *            runtime
 * @param {search}
 *            search
 * @param {serverWidget}
 *            serverWidget
 */
function(record, runtime, search, serverWidget) {

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
				title : 'Inventory Details'
			});
			var wo = context.request.parameters.wo;
			log.debug('wo', wo);
			var qty = context.request.parameters.qty
			var hdnFld = form.addField({
				id : 'custpage_hdn_inv_chk',
				type : serverWidget.FieldType.TEXT,
				label : 'HdnFld'
			});
			hdnFld.defaultValue = 1;
			hdnFld.updateDisplayType({
				displayType : serverWidget.FieldDisplayType.HIDDEN
			});
			/*
			 * var itemnamefield = form.addField({ id : 'custpage_itemdropdown',
			 * type : serverWidget.FieldType.SELECT, source : 'item', label :
			 * 'Item' }); itemnamefield.defaultValue = item;
			 * itemnamefield.updateDisplayType({ displayType :
			 * serverWidget.FieldDisplayType.INLINE }); var locationfield =
			 * form.addField({ id : 'custpage_item_location', type :
			 * serverWidget.FieldType.SELECT, source : 'location', label :
			 * 'Location' }); locationfield.defaultValue = location;
			 * locationfield.updateDisplayType({ displayType :
			 * serverWidget.FieldDisplayType.INLINE });
			 */
			var temp = 0;
			var qtyfield = form.addField({
				id : 'custpage_selectedqty',
				type : serverWidget.FieldType.FLOAT,
				// source : 'item',
				label : 'Quantity'
			});
			if (qty) {
				qtyfield.defaultValue = qty;
			} else {
				qtyfield.defaultValue = temp;
			}

			qtyfield.updateDisplayType({
				displayType : serverWidget.FieldDisplayType.INLINE
			});
			var subList = form.addSublist({
				id : "custpage_lotnumberitem",
				type : serverWidget.SublistType.LIST,
				label : "Lots"
			});
			subList.addField({
				id : 'custpage_mark_copy',
				type: serverWidget.FieldType.CHECKBOX,
				label: 'To Copy'
			});
			subList.addMarkAllButtons();
			var number_col = subList.addField({
				id : "custpage_inventorynumber",
				type : serverWidget.FieldType.SELECT,
				label : "Serial/LOT Number"
			});
			var customrecord_cntm_asm_serial_idsSearchObj = search.create({
				type : "customrecord_cntm_asm_serial_ids",
				filters : [
				           ["custrecord10","anyof",wo], 
				           "AND", 
				           ["custrecord_cntm_is_process","is","F"]
				        ],
				columns : [
				           search.createColumn({
				               name: "name",
				               sort: search.Sort.ASC,
				               label: "Name"
				            }),
				            search.createColumn({name: "internalid", label: "Internal ID"})
				         ]
			});
			

			// var bin_col = subList.addField("custpage_bin", "select",
			// "Bin", 'bin').setDisplayType('inline');
			var bin_col = subList.addField({
				id : "custpage_bin",
				type : serverWidget.FieldType.SELECT,
				label : "Bin",
				source : 'bin'
			}).updateDisplayType({
				displayType : serverWidget.FieldDisplayType.HIDDEN
			});
			var status_col = subList.addField({
				id : "custpage_status",
				type : serverWidget.FieldType.SELECT,
				label : "Inventory Status",
				source : "inventorystatus"
			}).updateDisplayType({
				displayType : serverWidget.FieldDisplayType.HIDDEN
			});
			var qty_col = subList.addField({
				id : "custpage_quantity",
				type : serverWidget.FieldType.FLOAT,
				label : "Quantity"
			}).updateDisplayType({
				displayType : serverWidget.FieldDisplayType.DISABLED
			});
			qty_col.defaultValue = 1;
			var qty_avail = subList.addField({
				id : "custpage_quantity_avail",
				type : serverWidget.FieldType.FLOAT,
				label : "Available"
			}).updateDisplayType({
				displayType : serverWidget.FieldDisplayType.INLINE
			});
			
			var searchResultCount = customrecord_cntm_asm_serial_idsSearchObj
			.runPaged().count;
				log.debug("customrecord_cntm_asm_serial_idsSearchObj result count",
						searchResultCount);
				var index=0;
	customrecord_cntm_asm_serial_idsSearchObj.run().each(
			function(result) {
				// .run().each has a limit of 4,000 results
				number_col.addSelectOption({
					value : result.getValue({
						name : 'internalid'
					}),
					text : result.getValue({
						name : 'name'
					})
				});
				
				subList.setSublistValue({
					id : 'custpage_inventorynumber',
					line : index,
					value : result.getValue({
						name : 'internalid'
					})
				});
				index++;
				return true;
			});
			form.addSubmitButton({
				label : 'Submit'
			});
			
			form.clientScriptModulePath = './Cntm_serial_ids.js';
			//form.clientScriptFileId = 24417;
			context.response.writePage(form);
		}
	}

	return {
		onRequest : onRequest
	};

});
