/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/ui/serverWidget','N/search'],

		function(record,serverWidget,search) {

	/**
	 * Function definition to be triggered before record is loaded.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {string} scriptContext.type - Trigger type
	 * @param {Form} scriptContext.form - Current form
	 * @Since 2015.2
	 */
	function beforeLoad(scriptContext) {
		log.debug('triggred')
	}

	/**
	 * Function definition to be triggered before record is loaded.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {Record} scriptContext.oldRecord - Old record
	 * @param {string} scriptContext.type - Trigger type
	 * @Since 2015.2
	 */
	function beforeSubmit(scriptContext) {
		var objRecord = scriptContext.newRecord;

		try{
			var customer = objRecord.getValue({
				fieldId: 'entity'
			});
			log.debug(customer)


			if(customer)
			{
				var customerRecord=record.load({
					type: "customer",
					id: customer
				});
				
				var contactname=customerRecord.getSublistValue({
					sublistId: 'contactroles',
					fieldId: 'contactname',
					line: 0
				});
				log.debug(contactname)
				objRecord.setValue({
					fieldId: 'custbody_cntm_primary_contact',
					value: contactname,
					ignoreFieldChange: true
				});
			}

		}
		catch(e)
		{

		}
	}

	/**
	 * Function definition to be triggered before record is loaded.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {Record} scriptContext.oldRecord - Old record
	 * @param {string} scriptContext.type - Trigger type
	 * @Since 2015.2
	 */
	function afterSubmit(scriptContext) {

	}

	return {
		beforeLoad: beforeLoad,
		beforeSubmit: beforeSubmit,
		afterSubmit: afterSubmit
	};

});
