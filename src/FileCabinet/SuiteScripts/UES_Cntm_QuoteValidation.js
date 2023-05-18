/**
 * 
 * Version    Modified By         Reviewed By           Date               Changes Mode 
 * 1.0       Harish                                  07th Oct 2020      remove the edit button and DISABLED approve custom field on item line
 */
/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/ui/serverWidget','N/runtime'],
		function(record,serverWidget,runtime) {
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
      try{
		var rec         = scriptContext.newRecord;
		var recType = rec.type;
		var form=scriptContext.form;
		var status=rec.getValue({fieldId:'status'});
        var userId = runtime.getCurrentUser().id;
				log.debug('userId',userId);
/*record.submitFields({
                      type: recType,
                      id: rec.id,
                      values: {'custbody_cntm_user_details':userId},
                      options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true,
                      },
                    });*/
				
			if(recType == 'estimate'&&status == "Processed"){
                      log.debug('status',status)
				// DISABLED approve custom field on item line and remove edit button is quote is Processed
				var sublist = form.getSublist({id : 'item'});
				var fiedlobj=sublist.getField({id : 'custcol_cntm_qt_line_approved'});
				fiedlobj.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.DISABLED
				});
                      log.debug('status',status)

				form.removeButton('edit')
			}
		}catch(e){log.error("ERROR",e)}

	}

	return {
		beforeLoad: beforeLoad,
	};

});