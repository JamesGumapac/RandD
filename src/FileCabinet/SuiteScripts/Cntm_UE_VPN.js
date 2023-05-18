/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
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
	 * Function definition to be triggered before record is loaded.
	 * 
	 * @param {Object}
	 *            scriptContext
	 * @param {Record}
	 *            scriptContext.newRecord - New record
	 * @param {string}
	 *            scriptContext.type - Trigger type
	 * @param {Form}
	 *            scriptContext.form - Current form
	 * @Since 2015.2
	 */
	function beforeLoad(scriptContext) {
		var form = scriptContext.form;
		/*if (scriptContext.type == 'create') {
			var pckQtyFld = form.getField({
				id : 'custrecord_cnt_pack_qty'
			});
			pckQtyFld.updateDisplayType({
				displayType : serverWidget.FieldDisplayType.DISABLED
			});
		}*/
		if (scriptContext.type == 'create'||scriptContext.type == 'edit') {
			
			var packageQty = form.addField({
				id : 'custpage_package_qty',
				type : serverWidget.FieldType.SELECT,
				// source : 'unit',
				label : 'Package Qty'
			});
			var pckQtyFld = form.getField({
				id : 'custrecord_cnt_pack_qty'
			});
			pckQtyFld.updateDisplayType({
				displayType : serverWidget.FieldDisplayType.HIDDEN
			});
			var unitType = scriptContext.newRecord.getValue({
				fieldId : 'custrecord_cnt_unit'
			});
			if (unitType) {
				var unitTypesRec = record.load({
					type : 'unitstype',
					id : unitType
				})
				var lines = unitTypesRec.getLineCount({
					sublistId : 'uom'
				});
				packageQty.addSelectOption({
					value : '',
					text : ''
				});
				for (var line = 0; line < lines; line++) {
					packageQty.addSelectOption({
						value : unitTypesRec.getSublistValue({
							sublistId : 'uom',
							fieldId : 'internalid',
							line : line
						}),
						text : unitTypesRec.getSublistValue({
							sublistId : 'uom',
							fieldId : 'unitname',
							line : line
						})
					});
				}
				packageQty.defaultValue = scriptContext.newRecord.getValue({
					fieldId : 'custrecord_cnt_pack_qty'
				});
			}
		}
	}

	/**
	 * Function definition to be triggered before record is loaded.
	 * 
	 * @param {Object}
	 *            scriptContext
	 * @param {Record}
	 *            scriptContext.newRecord - New record
	 * @param {Record}
	 *            scriptContext.oldRecord - Old record
	 * @param {string}
	 *            scriptContext.type - Trigger type
	 * @Since 2015.2
	 */
	function beforeSubmit(scriptContext) {

	}

	/**
	 * Function definition to be triggered before record is loaded.
	 * 
	 * @param {Object}
	 *            scriptContext
	 * @param {Record}
	 *            scriptContext.newRecord - New record
	 * @param {Record}
	 *            scriptContext.oldRecord - Old record
	 * @param {string}
	 *            scriptContext.type - Trigger type
	 * @Since 2015.2
	 */
	function afterSubmit(scriptContext) {

	}

	return {
		beforeLoad : beforeLoad,
		beforeSubmit : beforeSubmit,
		afterSubmit : afterSubmit
	};

});
