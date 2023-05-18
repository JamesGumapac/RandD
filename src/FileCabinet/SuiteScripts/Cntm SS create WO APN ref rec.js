/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/search','N/redirect','N/record'],

		function(runtime, search,redirect,record) {

	/**
	 * Definition of the Scheduled script trigger point.
	 *
	 * @param {Object} scriptContext
	 * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
	 * @Since 2015.2
	 */
	function execute(scriptContext) {
		try{
			log.debug('script called');
			var scriptObj = runtime.getCurrentScript();
			var woParam= scriptObj.getParameter({name: 'custscript_cntm_wo_info'});

			log.debug('woParam'+woParam);
			var parsed_json=JSON.parse(woParam);
			log.debug("parsed_json :"+parsed_json.length,parsed_json);
			for(var counter=0;counter< parsed_json.length;counter++){
				
				var woinfo=parsed_json[counter];
				var woID=woinfo["wo"];
				var apnID=woinfo["apn"];
				log.debug("woID :"+woID,"apnID :"+apnID);
				if(woID){
					//creating operation records
					var fieldLookUp = search
					.lookupFields({
						type : search.Type.WORK_ORDER,
						id : woID,
						columns : [ 'manufacturingrouting','quantity' ]
					});
					var WOQty=fieldLookUp["quantity"];
					var routingLookup = fieldLookUp["manufacturingrouting"];
					log.debug("routingLookup :"
							+ routingLookup);
					var stringJson = JSON
					.stringify(routingLookup);
					var routingExisting = routingLookup[0].value;
					log.debug("routingExisting :"
							+ routingExisting);
					var routingRec=record.load({
						type : record.Type.MANUFACTURING_ROUTING,
						id:routingExisting
					});
					var lineCount=routingRec.getLineCount({
						sublistId: 'routingstep'
					});
					
					/*

					for(var i=0;i<lineCount;i++){
						var opSeq=routingRec.getSublistValue({
							sublistId: 'routingstep',
							fieldId: 'operationsequence',
							line: i
						});
						var opname=routingRec.getSublistValue({
							sublistId: 'routingstep',
							fieldId: 'operationname',
							line: i
						});
						// var laborTime=routingRec.getSublistValue({
						// 	sublistId: 'routingstep',
						// 	fieldId: 'runrate',
						// 	line: i
						// });
						var laborSetupTime=routingRec.getSublistValue({
							sublistId: 'routingstep',
							fieldId: 'setuptime',
							line: i
						});
						//creating records

						var woOperationRec = record.create({
							type : 'customrecord_cntm_client_app_asm_oper',
							// defaultValues : defaultValues,
							isDynamic : true
						});

						if(i==0){
							woOperationRec.setValue({
								fieldId : "custrecord_cntm_is_first_op",
								value : true
							});		
							woOperationRec.setValue({
								fieldId : "custrecord_cntm_remaining_qty",
								value : WOQty
							});
						}
						var opSeqNext=routingRec.getSublistValue({
							sublistId: 'routingstep',
							fieldId: 'operationsequence',
							line: (i+parseInt(1))
						});
						if((opSeqNext!=undefined && opSeqNext!=null && opSeqNext!="")){
						var opnextText=routingRec.getSublistValue({
							sublistId: 'routingstep',
							fieldId: 'operationname',
							line: (i+parseInt(1))
						});
						woOperationRec.setValue({
							fieldId : "custrecord_cntm_next_op",
							value : opSeqNext
						});
						woOperationRec.setValue({
							fieldId : "custrecord_cntm_next_op_next",
							value : opSeqNext+" "+opnextText
						});
						}
						woOperationRec.setValue({
							fieldId : "custrecord_cntm_asm_op_text",
							value : opSeq+" "+opname
						});

						woOperationRec.setValue({
							fieldId : "custrecord_cnmt_asm_laborsetuptime",
							value :  laborSetupTime
						});

						// woOperationRec.setValue({
						// 	fieldId : "custrecord_cntm_asm_laborruntime",
						// 	value : laborTime
						// });
						woOperationRec.setValue({
							fieldId : "custrecord_cntm_asm_wo_ref",
							value : woID
						});
						woOperationRec.setValue({
							fieldId : "custrecord_cntm_asm_operation",
							value : opSeq
						});
						if(i==(lineCount-1)){
							woOperationRec.setValue({
								fieldId : "custrecord_cntm_asm_is_lastop",
								value : true
							});
						}
						if(i==0 &&  (i==(lineCount-1))){
							woOperationRec.setValue({
								fieldId : "custrecord_cntm_is_single_op",
								value : true
							});	
							woOperationRec.setValue({
								fieldId : "custrecord_cntm_asm_is_lastop",
								value : false
							});	
							woOperationRec.setValue({
								fieldId : "custrecord_cntm_is_first_op",
								value : false
							});	
						}
						woOperationRec.save();
					}
					
					*/


					if(apnID){
						var customrecord_cntm_mpn_apn_infoSearchObj = search.create({
							type: "customrecord_cntm_mpn_apn_info",
							filters:
								[
								 ["custrecord_cntm_parent_rec.internalid","anyof",apnID], 
								 "AND", 
								 ["custrecord_cntm_apn.inventorylocation","anyof","4"]

								 ],
								 columns:
									 [
									  search.createColumn({name: "custrecord_cntm_mpn", label: "Item Name"}),
									  search.createColumn({name: "custrecord_cntm_apn", label: "Alternative Part Number"}),
									  search.createColumn({name: "custrecord_cntm_vpn", label: "Vendor"}),
									  search.createColumn({name: "custrecord_cntm_apn_approve", label: "APN Approve"}),
									  search.createColumn({name: "custrecord_cntm_apn_sequence", label: "APN Sequence"}),
									  search.createColumn({name: "custrecord_cntm_apn_stacked", label: "Stacked"}),
									  search.createColumn({
										  name: "locationquantityonhand",
										  join: "CUSTRECORD_CNTM_APN",
										  label: "Location On Hand"
									  })
									  ]
						});
						var searchResultCount = customrecord_cntm_mpn_apn_infoSearchObj.runPaged().count;
						log.debug("customrecord_cntm_mpn_apn_infoSearchObj result count",searchResultCount);
						var index=0;
						customrecord_cntm_mpn_apn_infoSearchObj.run().each(function(result){

							var item=result.getValue({name: "custrecord_cntm_mpn", label: "Item Name"});
							var apn_item=result.getValue({name: "custrecord_cntm_apn", label: "Alternative Part Number"});
							var vendor=result.getValue({name:"custrecord_cntm_vpn", label: "Vendor"});
							var apn_approve=result.getValue({name: "custrecord_cntm_apn_approve", label: "APN Approve"});

							var apn_seq=result.getValue({name: "custrecord_cntm_apn_sequence", label: "APN Sequence"});
							var stacked=result.getValue({name: "custrecord_cntm_apn_stacked", label: "Stacked"});
							var quan=result.getValue({
								name: "locationquantityonhand",
								join: "CUSTRECORD_CNTM_APN",
								label: "Location On Hand"
							});
							var apnWORec = record.create({
								type : 'customrecord_cntm_wo_apn_ref',
								// defaultValues : defaultValues,
								isDynamic : true
							});
							apnWORec.setValue({
								fieldId : "custrecord_cntm_wo_ref",
								value : woID
							});
							apnWORec.setValue({
								fieldId : "custrecord_cntm_wo_apn_ref_item",
								value : item
							});
							apnWORec.setValue({
								fieldId : "custrecord_cntm_apn_item",
								value : apn_item
							});
							apnWORec.setValue({
								fieldId : "custrecord_cntm_apn_vendor",
								value : vendor
							});
							if(apn_approve=="N" || apn_approve==false){
								apnWORec.setValue({
									fieldId : "custrecord_cntm_wo_apn_approve",
									value : false
								});
							}else if(apn_approve=="Y" || apn_approve==true){
								apnWORec.setValue({
									fieldId : "custrecord_cntm_wo_apn_approve",
									value : true
								});
							}

							apnWORec.setValue({
								fieldId : "custrecord_cntm_wo_apn_seq",
								value : apn_seq
							});
							if(stacked=="N" || stacked==false){
								apnWORec.setValue({
									fieldId : "custrecord_cntm_wo_apn_stacked",
									value : false
								});
							}else if(stacked=="Y" || stacked==true){
								apnWORec.setValue({
									fieldId : "custrecord_cntm_wo_apn_stacked",
									value : true
								});
							}


							apnWORec.setValue({
								fieldId : "custrecord_cntm_wo_apn_quan",
								value : quan
							});
							apnWORec.save();
							return true;
						});

					}
				}
			}
		}catch(e){
			log.error("error :",e.message);
		}
	}

	return {
		execute: execute
	};

});
