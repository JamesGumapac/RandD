/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

/**
 * Version    Date            Author                Remarks
 * 1.0      27 Apr 2022	     MuzasarAli			Add Create OP button
 * 1.1		01 May 2022		 MuzasarAli			Hide update bom and routing after operations are created
 */
define(['N/record', 'N/ui/serverWidget', 'N/search'],

	function (record, serverWidget, search) {

		function beforeLoad(scriptContext) {

			try {

				var objRecord = scriptContext.currentRecord;
				
				
				if (scriptContext.type == 'view') {
					var wo_record= scriptContext.newRecord;
					var recordId = scriptContext.newRecord.id;
					var value = wo_record.getValue({
						fieldId: 'status'
					});
					//log.debug("value",value)
					if(value == 'Closed')
					{
						var set_status = record.submitFields({
							type: record.Type.WORK_ORDER,
							id: recordId,
							values: {
								custbody_cntm_asm_v2_wo_status: 3
							},
							options: {
								enableSourcing: false,
								ignoreMandatoryFields : true
							}
						});
						log.debug("Status set to completed",set_status)
					}
					else{
						var set_status = record.submitFields({
							type: record.Type.WORK_ORDER,
							id: recordId,
							values: {
								custbody_cntm_asm_v2_wo_status: 1
							},
							options: {
								enableSourcing: false,
								ignoreMandatoryFields : true
							}
						});
						log.debug("Status set to ready",set_status)

						
					var isAsm = scriptContext.newRecord.getValue({
						fieldId: 'custbody_cntm_is_asm_wo'
					})
					log.debug('recordId',recordId);
					log.debug('isAsm',isAsm);


					if(isAsm){
						scriptContext.form.clientScriptModulePath = './Cntm CS ASM create wo custom Rec.js';
						var flag = searchCustomRecords(recordId)
	
						if (flag) {
							log.debug('if flag', flag);		
							scriptContext.form.addButton({
								id: 'custpage_create_operation',
								label: 'Create Operation',
								functionName: 'createOperationRecClientCall(' + recordId + ')'
							});
             /**
							scriptContext.form.removeButton({
								id: 'issuecomponents'
							});
							scriptContext.form.removeButton({
								id: 'entercompletion'
							});
							scriptContext.form.removeButton({
								id: 'entercompletionwithbackflush'
							});
              **/
						} else {
							log.debug('else flag', 'Update Bom and Routing button hidden');		
							// var form = scriptContext.form;
							// form.removeButton({
							// 	id: 'entercompletion'
							// });
							scriptContext.form.removeButton({
								id: 'custpage_updatebtn'
							});
						}
	
					}else{
						log.debug('isAsm',isAsm);
					}
					}
					


				}
			} catch (error) {
				log.error('ERROR', error);
			}
		}

		function searchCustomRecords(woID) {
			try {
				var customrecord_cntm_client_app_asm_operSearchObj = search.create({
					type: "customrecord_cntm_client_app_asm_oper",
					filters:
						[
							["custrecord_cntm_asm_wo_ref", "anyof", woID]
						],
					columns:
						[
							search.createColumn({ name: "custrecord_cntm_asm_wo_ref", label: "WO reference" }),
							search.createColumn({ name: "custrecord_cntm_asm_woc_qty", label: "WOC quantity" }),
							search.createColumn({ name: "custrecord_cntm_completed_qty", label: "Completed qty" }),
							search.createColumn({ name: "custrecord_cntm_asm_woc_status", label: "Status" })
						]
				});
				var searchResultCount = customrecord_cntm_client_app_asm_operSearchObj.runPaged().count;
				log.debug("customrecord_cntm_client_app_asm_operSearchObj result count", searchResultCount);
				//  customrecord_cntm_client_app_asm_operSearchObj.run().each(function(result){
				// 	// .run().each has a limit of 4,000 results
				// 	return true;
				//  });

				if (searchResultCount <= 0) {
					return true  // create op   // hide issue , completion // Backflush
				} else {
					return false
				}
			} catch (error) {
				log.error('ERROR searchCustomRecords', error)
			}
		}

		function validateData(data) {
			if (data != undefined && data != null && data != '') {
				return true;
			} else {
				return false;
			}
		}
		return {
			beforeLoad: beforeLoad,
		};

	});
