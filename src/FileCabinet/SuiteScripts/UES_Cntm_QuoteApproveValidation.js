/**
 * 
 * Version    Modified By         Reviewed By           Date               Changes Mode
 * 1.0        Harish                                  28th Sep 2020      Validating the approved lines if the approved checkbox is not checked removing the line 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/ui/message','N/error','N/ui/serverWidget'],
	function(record,message,error,serverWidget) {
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
	 	var rec         = scriptContext.newRecord;
	    var recType = rec.type;
        var form=scriptContext.form;
        var status=rec.getValue({fieldId:'status'});
        var createdfrom=rec.getValue({fieldId:'createdfrom'});
	   	try{
	   if(recType == 'salesorder'){
         // DISABLED approve custom field on item line
	   	var sublist = form.getSublist({id : 'item'});
      var fiedlobj=sublist.getField({id : 'custcol_cntm_qt_line_approved'});
 fiedlobj.updateDisplayType({
    displayType: serverWidget.FieldDisplayType.DISABLED
});
       }
        }catch(e){log.error("ERROR",e)}
      
			if(scriptContext.type == 'create'&&recType == 'salesorder' &&createdfrom){
              	try{
				var numLines = rec.getLineCount({sublistId: 'item' }); 
	             numLines = Number(numLines)
              var endgroupFlg = false;
	    	   var errorFlg         = false;
                                          log.debug('numLines',numLines);

	            if(numLines != '' || numLines != null && numLines > 0){
	                for(var i=numLines;i>=0;i--){
	                    var quoteApproval =rec.getSublistValue({
	                        sublistId : 'item',
	                        fieldId : 'custcol_cntm_qt_line_approved',
	                        line:i
	                    });
                      var itemtype =rec.getSublistValue({
	                        sublistId : 'item',
	                        fieldId : 'itemtype',
	                        line:i
	                    });
                        log.debug('quoteApproval'+i,quoteApproval);
                      if(itemtype=='Group'&&quoteApproval==true){
                         endgroupFlg=true;
                         }
                      if(quoteApproval==true)
                      errorFlg=true;
                      if(quoteApproval == false){
	                    	rec.removeLine({
							    sublistId: 'item',
							    line: i,
							    ignoreRecalc: true
							});
	                    }
	                }
	            }else{
	         		log.debug('No Lines selected!')
			        return false;
	            }
                }catch(e){log.error("ERROR Remove button is:",e)}
	           if(errorFlg==false){
	            var myCustomError = error.create({
	                name: 'WRONG_PARAMETER_TYPE',
	                message: 'Please approve atleast one line on the Quote and try again....',
	                notifyOff: false
	            });
	            // This will write 'Error: WRONG_PARAMETER_TYPE Wrong parameter type selected' to the log
	            log.error('Error: ' + myCustomError.name , myCustomError.message);
	            throw myCustomError.message;
	            }
			}//if close
	   	/*}catch(error){
			log.error('An error occured while setting email',error);
		}*/
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
         
	    }
	return {
		beforeLoad: beforeLoad,
	};

});