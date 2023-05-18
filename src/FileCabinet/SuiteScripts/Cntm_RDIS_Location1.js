/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define([ 'N/record', 'N/search' ],
/**
 * @param {record}
 *            record
 * @param {search}
 *            search
 */
function(record, search) {

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
		var rec = scriptContext.newRecord;
		var subsidiary = rec.getValue({
			fieldId : 'subsidiary'
		});
		log.debug('subsidiary', subsidiary);
		if (subsidiary == 4) {	
          rec.setValue({
				fieldId : 'location',
				value : 205
			});
			var lines = rec.getLineCount({
				sublistId : 'item'
			});
			for (var i = 0; i < lines; i++) {
				var type = rec.getSublistValue({
					sublistId : 'item',
					fieldId : 'custcol_cntm_item_subtype',
					line : i
				});
				log.debug('type', type);
				if (type == 9) {
					// rec.selectLine({sublistId : 'item',line:i});
					rec.setSublistValue({
						sublistId : 'item',
						fieldId : 'location',
						value : 205,//13,
						line : i
					});

					// rec.commitLine({sublistId : 'item'});
				}
			}
		}
		if(subsidiary == 2){
			rec.setValue({
				fieldId : 'location',
				value : 202
			});
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
	function afterSubmit(scriptContext) {

	}

	return {
		//beforeLoad : beforeLoad,
		beforeSubmit : beforeSubmit,
		//afterSubmit : afterSubmit
	};

});
