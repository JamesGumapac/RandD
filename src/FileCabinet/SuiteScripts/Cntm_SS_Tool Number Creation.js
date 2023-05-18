/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define([ 'N/record', 'N/runtime', 'N/search' ],
/**
 * @param {record}
 *            record
 * @param {runtime}
 *            runtime
 * @param {search}
 *            search
 */
function(record, runtime, search) {

	/**
	 * Definition of the Scheduled script trigger point.
	 * 
	 * @param {Object}
	 *            scriptContext
	 * @param {string}
	 *            scriptContext.type - The context in which the script is
	 *            executed. It is one of the values from the
	 *            scriptContext.InvocationType enum.
	 * @Since 2015.2
	 */
	function execute(scriptContext) {
		try {
			/*
			 * var toolNum = runtime.getCurrentScript().getParameter({ name :
			 * 'custscript_cntm_toolnum' }); log.debug('toolNum',toolNum); if
			 * (toolNum) { var asmRev =
			 * runtime.getCurrentScript().getParameter({ name :
			 * 'custscript_cntm_asmrev' }); var pcbRev =
			 * runtime.getCurrentScript().getParameter({ name :
			 * 'custscript_cntm_pcbrev' }); var fieldLookUp =
			 * search.lookupFields({ type : 'customrecord_cntm_job_id', id :
			 * toolNum, columns : [ 'custrecord_cntm_revforasm',
			 * 'custrecord_cntm_revforpcb' ] }); if(!asmRev ){//& var
			 * rev=fieldLookUp.custrecord_cntm_revforasm[0].value } if(!pcbRev){
			 *  } } else {
			 */
			var squence, num;
			var initialToolNum = runtime.getCurrentScript().getParameter({
				name : 'custscript_cntm_initial_toolnum'
			});
			var recType = runtime.getCurrentScript().getParameter({
				name : 'custscript_cntm_job_rectype'
			});
			var recId = runtime.getCurrentScript().getParameter({
				name : 'custscript_cntm_job_recid'
			});

			var sequenseSearch = search.create({
				type : 'customrecord_cntm_job_id',
				columns : [ search.createColumn({
					name : "custrecord5",
					sort : search.Sort.DESC,
					label : "Sequence"
				}), search.createColumn({
					name : "name",
					label : "Name"
				}) ]
			});
			var searchResultCount = sequenseSearch.runPaged().count;
			log.debug("subsidiarysearch result count", searchResultCount);
			sequenseSearch.run().each(function(result) {
				// .run().each has a limit of 4,000 results
				squence = result.getValue({
					name : 'custrecord5'
				});
				num = result.getValue({
					name : 'name'
				});
				return false;
			});
			var objRecord = record.create({
				type : 'customrecord_cntm_job_id',
				isDynamic : true
			});

			var squence1 = (10 - Number(squence) % 10 ) + Number(squence);
			log.audit('squence1 :',squence1);

			var toolNumber = Number(initialToolNum) + Number(squence1);

			//Changes Vishal - Tool Number shouuld be 10's
			// toolNumber = toolNumber*10;
			// num = (10 - num%10) + num

			objRecord.setValue({
				fieldId : 'name',
				value : toolNumber.toString()
			});
			objRecord.setValue({
				fieldId : 'custrecord5',
				value : Number(squence1)
			});
			objRecord.setValue({
				fieldId : 'custrecord_cntm_initial_job',
				value : recId
			});
			var toolNumId = objRecord.save();

           log.debug('toolNumber',toolNumber);
			/*var fieldLookUp = search.lookupFields({
				type : 'customrecord_cntm_job_id',
				id : toolNumId,
				columns : [ 'custrecord_cntm_revforasm',
						'custrecord_cntm_revforpcb' ]
			});
			var revForAsm = fieldLookUp.custrecord_cntm_revforasm[0].text;
			var revForPcb = fieldLookUp.custrecord_cntm_revforpcb[0].text;
			
			 * var revForAsmVal =
			 * fieldLookUp.custrecord_cntm_revforasm[0].value; var revForPcbVal =
			 * fieldLookUp.custrecord_cntm_revforpcb[0].value;
			 
			var asmRevisionRec = record.create({
				type : record.Type.BOM,
				isDynamic : true
			});

			asmRevisionRec.setValue({
				fieldId : 'name',
				value : toolNumber.toString() + '-ASM-' + revForAsm
			});
			asmRevisionRec.setValue({
				fieldId : 'custrecord_cntm_tool_number',
				value : toolNumId
			});
			var asmRevisionRecId = asmRevisionRec.save();

			var pcbRevisionRec = record.create({
				type : record.Type.BOM,
				isDynamic : true
			});

			pcbRevisionRec.setValue({
				fieldId : 'name',
				value : toolNumber.toString() + '-PCB-' + revForPcb
			});
			pcbRevisionRec.setValue({
				fieldId : 'custrecord_cntm_tool_number',
				value : toolNumId
			});
			var pcbRevisionRecId = pcbRevisionRec.save();
			var id = record.submitFields({
				type : 'customrecord_cntm_job_id',
				id : toolNumId,
				values : {
					custrecord_cntm_revforasm : 2,
					custrecord_cntm_revforpcb : 2
				}
			});*/

			var jobRec=record.load({type:recType,id:recId,isDynamic:true});
          log.debug('here');
          jobRec.setValue({fieldId:'custentity_cntm_tool_number',value:toolNumId})
          jobRec.save();
          log.debug('here.');
			// }
		} catch (e) {
			log.error('error', e.message);
		}
	}

	return {
		execute : execute
	};

});
