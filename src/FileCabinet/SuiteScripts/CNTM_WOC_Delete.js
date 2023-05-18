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
//		if(scriptContext.type!="delete")
//		{
//		var objRecord=scriptContext.oldRecord;

//		var serialIds = objRecord.getValue({
//		fieldId: 'custbody_cntm_map_serialid_woc'
//		});

//		serialIds=serialIds?serialIds.split(','):serialIds;
//		}


		var objRecord=scriptContext.oldRecord;


		if(scriptContext.type=="cancel")
		{
			log.debug("triggred",'cancel');
			var serialIds = objRecord.getValue({
				fieldId: 'custbody_cntm_map_serialid_woc'
			});
			serialIds=serialIds?serialIds.split(','):serialIds;
			for (var i=0;i<serialIds.length;i++)
			{
				var customAsmR= record.load({
					type: "customrecord_cntm_asm_serial_ids",
					id: serialIds[i]
				});		
				customAsmR.setValue({
					fieldId : 'custrecord_cntm_is_process',
					value : false
				});
				customAsmR.save();			
			}
		}
		if(scriptContext.type=="delete")
		{
			var customrecord_cntm_asm_serial_idsSearchObj = search.create({
				type: "customrecord_cntm_asm_serial_ids",
				filters:
					[
					 ["custrecord_cntm_woc_serialid","anyof",objRecord.id]
					 ],
					 columns:
						 [
						  search.createColumn({name: "internalid", label: "Internal ID"}),
						  search.createColumn({name: "custrecord_cntm_is_process", label: "Is Processed"})
						  ]
			});
			var searchResultCount = customrecord_cntm_asm_serial_idsSearchObj.runPaged().count;
			log.debug("customrecord_cntm_asm_serial_idsSearchObj result count",searchResultCount);
			customrecord_cntm_asm_serial_idsSearchObj.run().each(function(result){
				// .run().each has a limit of 4,000 results
				var customAsmR= record.load({
					type: "customrecord_cntm_asm_serial_ids",
					id: result.getValue(search.createColumn({name: "internalid", label: "Internal ID"}))
				});				
				customAsmR.setValue({
					fieldId : 'custrecord_cntm_is_process',
					value : false
				});
				customAsmR.save();
				return true;
			});	
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

		var objRecord=scriptContext.newRecord;


		var serialIds = objRecord.getValue({
			fieldId: 'custbody_cntm_map_serialid_woc'
		});
		serialIds=serialIds?serialIds.split(','):serialIds;
		for (var i=0;i<serialIds.length;i++)
		{
			var customAsmR= record.load({
				type: "customrecord_cntm_asm_serial_ids",
				id: serialIds[i]
			});		
			customAsmR.setValue({
				fieldId : 'custrecord_cntm_woc_serialid',
				value : objRecord.id
			});
			customAsmR.save();			
		}


//		var invdetail = objRecord.getSubrecord({
//			fieldId: 'inventorydetail'
//		});
//		if(invdetail)
//			{
//		var cnt = invdetail.getLineCount({
//			sublistId: 'inventoryassignment'
//		});
//		var serialId=[];
//		for (var j=0;j<cnt;j++)
//		{
//			var serialno = invdetail.getSublistValue({
//				sublistId: 'inventoryassignment',
//				fieldId: 'issueinventorynumber',
//				line: j
//			});
//			serialId.push(serialno)
//		}
//		var wo = objRecord.getValue({
//			fieldId: 'createdfrom'
//		});
//		var customrecord_cntm_asm_serial_idsSearchObj = search.create({
//			type : "customrecord_cntm_asm_serial_ids",
//			filters : [
//			           ["custrecord10","anyof",wo] 			          
//			           ],
//			           columns : [
//			                      search.createColumn({
//			                    	  name: "name",
//			                    	  sort: search.Sort.ASC,
//			                    	  label: "Name"
//			                      }),
//			                      search.createColumn({name: "internalid", label: "Internal ID"})
//			                      ]
//		});
//
//		customrecord_cntm_asm_serial_idsSearchObj.run().each(
//				function(result) {
//					// .run().each has a limit of 4,000 results
//					result.getValue({
//						name : 'internalid'
//					});
//
//					var serialnock=result.getValue(search.createColumn({
//						name: "name",
//						sort: search.Sort.ASC,
//						label: "Name"
//					}));
//					if(serialId.indexOf(serialnock)==-1)
//					{
//
//						var customAsmR= record.load({
//							type: "customrecord_cntm_asm_serial_ids",
//							id: result.getValue(search.createColumn({name: "internalid", label: "Internal ID"}))
//						});		
//						customAsmR.setValue({
//							fieldId : 'custrecord_cntm_is_process',
//							value : false
//						});
//						customAsmR.save();	
//					}
//				});
//
//			}

	}

	return {
		beforeLoad: beforeLoad,
		beforeSubmit: beforeSubmit,
		afterSubmit: afterSubmit
	};

});
