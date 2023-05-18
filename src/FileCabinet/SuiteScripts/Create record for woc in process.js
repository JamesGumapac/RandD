/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */

define(['N/search','N/record'],

		function(search, record) {

	/**
	 * Definition of the Scheduled script trigger point.
//	 *
	 * @param {Object} scriptContext
	 * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
	 * @Since 2015.2
	 */


	function execute(scriptContext) {
		try
		{
            var opseqArr=[];
          
			var workorderSearchObj = search.create({
                type: "workorder",
                filters:
                [
                   ["type","anyof","WorkOrd"], 
                   "AND", 
                   ["status","anyof","WorkOrd:D"], 
                   "AND", 
                   ["mainline","is","T"], 
                   "AND", 
                   ["custbody_cntm_is_asm_wo","is","T"],
                   "AND", 
                   ["internalid","anyof","1048429"]
                ],
                columns:
                [
                   search.createColumn({name: "internalid", label: "Internal ID"}),
                   search.createColumn({name: "entity", label: "Name"}),
                   search.createColumn({name: "tranid", label: "Document Number"}),
                   search.createColumn({name: "quantity", label: "Quantity"}),
                   search.createColumn({name: "assembly", label: "Assembly"}),
                   search.createColumn({name: "custbody_rda_wo_priorty", label: "WO Priorty"})
                ]
             });
             var searchResultCount = workorderSearchObj.runPaged().count;
             log.debug("workorderSearchObj result count",searchResultCount);
             workorderSearchObj.run().each(function(result){
                var id = result.getValue(search.createColumn({name: "internalid", label: "Internal ID"}));
                    var objRecord = record.transform({
                        fromType:'workorder',
                        fromId: id,
                        toType: 'workordercompletion',
                        });

                        var asm= objRecord.getValue({
                            fieldId: 'item'
                        });
                        log.debug("item",asm)
                        var objSublist = objRecord.getSublist({
                            sublistId: 'operation'
                        });

                        log.debug("objsublist",objSublist)
                   
                         var inputqty=objRecord.getSublistValue({
                                       sublistId: 'operation',
                                          fieldId: 'inputquantity',
                                          line: 1
                                        });
                         log.debug("input quantity",inputqty)

                         var asmitem = result.getValue( search.createColumn({name: "assembly", label: "Assembly"}));
                        var priority = result.getValue( search.createColumn({name: "custbody_rda_wo_priorty", label: "WO Priorty"}));
                        var woref= result.getValue( search.createColumn({name: "internalid", label: "Internal ID"}));
                           var tranno=result.getValue(  search.createColumn({name: "tranid", label: "Document Number"}));             
                         var numLines = objRecord.getLineCount({
                            sublistId: 'operation'
                        });

                        for(var i=0;i<numLines;i++)
                        {
                            var opseqObj={};
                            var opseq=objRecord.getSublistValue({
                                sublistId: 'operation',
                                   fieldId: 'operationsequence',
                                   line: i
                                 });
                            opseqObj["opseq"]=opseq;
                                 log.debug("operation",opseq)
                            var optext=objRecord.getSublistValue({
                                sublistId: 'operation',
                                   fieldId: 'operationname',
                                   line: i
                                 });
                                 log.debug("operationtext",optext)
                            opseqObj["optext"]=optext;

                            opseqArr.push(opseqObj);

                            
                        }
                        log.debug("operation array",opseqArr)
                       
                        for(var i=0;i<numLines;i++)
                        {
                            var remainingqty=objRecord.getSublistValue({
                                sublistId: 'operation',
                                   fieldId: 'quantityremaining',
                                   line: i
                                 });
                  log.debug("remaining quantity",remainingqty)

                 

                  var operationRecord = record.create({
                    type: 'customrecord_cntm_client_app_asm_oper_s',
                    isDynamic: true,
                });

                operationRecord.setValue({
                    fieldId: 'custrecordcntm_client_asm_priority',
                    value : priority
                 });
                 log.debug("asmitem",asmitem)

                 operationRecord.setValue({
                    fieldId: 'custrecord_cntm_client_asm_asm_item',
                    value : objRecord.getValue({fieldId: 'item'})
                 });

                 operationRecord.setValue({
                    fieldId: 'custrecordcntm_client_asm_wo_ref',
                    value : woref
                 });

                 operationRecord.setValue({
                    fieldId: 'custrecord_cntm_client_asm_serial_no',
                    value : tranno+ '_'+(i+1)
                 });

                 operationRecord.setValue({
                    fieldId: 'name',
                    value : tranno+ '_'+(i+1)
                 });
                 operationRecord.setValue({
                    fieldId: 'custrecordcntm_client_asm_last_op',
                    value : opseqArr[numLines-1].opseq + " " +  opseqArr[numLines-1].optext
                 });



                 var difference = inputqty- remainingqty;
                 if(difference>0)
                 {

                  operationRecord.setValue({
                    fieldId: 'custrecordcntm_client_asm_last_comp_op',
                    value : opseqArr[difference-1].opseq + " " +  opseqArr[difference-1].optext
                 });

                 operationRecord.setValue({
                    fieldId: 'custrecord_cntm_client_asm_nextop',
                    value : opseqArr[difference-1].opseq + " " +  opseqArr[difference-1].optext
                 });
                }
                else{
                    operationRecord.setValue({
                        fieldId: 'custrecordcntm_client_asm_last_comp_op',
                        value :  opseqArr[numLines-1].opseq + " " +  opseqArr[numLines-1].optext
                     });
    
                     operationRecord.setValue({
                        fieldId: 'custrecord_cntm_client_asm_nextop',
                        value : opseqArr[numLines-1].opseq + " " +  opseqArr[numLines-1].optext
                     });
                }

                 var operationRecordid = operationRecord.save();
                 log.debug('operationRecord',operationRecordid)
 

                        }



                // .run().each has a limit of 4,000 results
                return true;
             });
             
		}
		catch(error)
		{
			log.error('error.message'+error.message, JSON.stringify(error));
		}
	}

	return {
		execute: execute
	};

});