/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search', 'N/task'],

function(record, runtime, search, task) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
    	var recId = runtime.getCurrentScript().getParameter({
			name : 'custscript_cntm_asm_op_rec_id'
		});
 
    	try{
    		var asmOpRecLookup = search.lookupFields({
				type : 'customrecord_cntm_asm_client_app',
				id : recId,
				columns : [ 'custrecord_cntm_sublist_woc_qty',
						'custrecord_cntm_sublst_parent_op',
						'custrecord_cntm_sublst_scrapqty',
						'custrecord_cntm_sublst_machineruntime',
						'custrecord_cntm_sublst_machinesetuptime',
						'custrecord_cntm_sublst_laborruntime',
						'custrecord_cntm_sublst_laborsetuptime',
						'custrecord_cntm_sublst_woc',
						'custrecord_cntm_sublst_operator',
						'custrecord_cntm_sublst_completed_qty',
						'custrecord_cntm_sublst_status',
						'custrecord_cntm_rework_info',
						'custrecord_cntm_scrap_info',
						'custrecord_cntm_sublst_completed_qty',
						'custrecord_cntm_last_op_inv_num',
						'custrecord_cntm_enter_scrap',
						'custrecord_cntm_cumm_scrap_to_enter_woc',
						'custrecord_cntm_qty_woc_final'
					]
			});
			log.debug('asmOpRecLookup', JSON
					.stringify(asmOpRecLookup));
			var parentRec=asmOpRecLookup.custrecord_cntm_sublst_parent_op[0].value;
			log.debug("parentRec"+parentRec);
			var reworkInfo=asmOpRecLookup.custrecord_cntm_rework_info;
			var scrapInfo=asmOpRecLookup.custrecord_cntm_scrap_info;
			var scrapQty=asmOpRecLookup.custrecord_cntm_sublst_scrapqty;
		    var completedQty=asmOpRecLookup.custrecord_cntm_sublst_completed_qty;
		  var operator=asmOpRecLookup.custrecord_cntm_sublst_operator[0].value;
		var enterScrap=asmOpRecLookup.custrecord_cntm_enter_scrap;
		var cummScrap=asmOpRecLookup.custrecord_cntm_cumm_scrap_to_enter_woc;
		var totalQtyWOC=asmOpRecLookup.custrecord_cntm_qty_woc_final;
			var asmHeaderLookup = search.lookupFields({
				type : 'customrecord_cntm_client_app_asm_oper',
				id : parentRec,
				columns : [ 'custrecord_cntm_asm_wo_ref',
						'custrecord_cntm_asm_is_lastop',
						'custrecord_cntm_is_first_op',
						'custrecord_cntm_next_op',
						'custrecord_cntm_asm_op_text',
						'custrecord_cntm_asm_operation',
						'custrecord_cntm_is_single_op'
						]
					
			});
			log.debug("completedQty :"+completedQty,"scrapQty :"+scrapQty);
			var wo=asmHeaderLookup.custrecord_cntm_asm_wo_ref[0].value;
			var isLastOp=asmHeaderLookup.custrecord_cntm_asm_is_lastop;
			var isFirst=asmHeaderLookup.custrecord_cntm_is_first_op;
			var oprtn = asmHeaderLookup.custrecord_cntm_asm_op_text.split(' ')[0];
			var nextOp=asmHeaderLookup.custrecord_cntm_next_op;
			var op=asmHeaderLookup.custrecord_cntm_asm_operation;
			var isSingleOp=asmHeaderLookup.custrecord_cntm_is_single_op;
			
			    var opText=asmOpRecLookup.custrecord_cntm_asm_op_text
			
			log.debug("wo :"+wo);
			
	        if(scrapInfo){
	        	updateSerialNumForScrap(scrapInfo);
	        }
			    
			log.debug('completion--');
			var wocObj = record.transform({
				fromType : record.Type.WORK_ORDER,
				fromId : wo,
				toType : record.Type.WORK_ORDER_COMPLETION,
				isDynamic : true,
			});
			
			wocObj.setText({
				fieldId : 'startoperation',
				text : oprtn
			});
			wocObj.setText({
				fieldId : 'custbody_cntm_woc_good',
				text :(completedQty*1)
			});
			wocObj.setText({
				fieldId : 'custbody_cntm_woc_scrapqty',
				text : (scrapQty*1)
			});
            log.debug("oprtn :"+oprtn);
			wocObj.setText({
				fieldId : 'endoperation',
				text : oprtn
			});
			wocObj.setValue({
				fieldId : 'custbody_cntm_op_client_app',
				value :operator
				});
	
			log.debug("totalQtyWOC :"+totalQtyWOC);
				wocObj
				.setValue({
					fieldId : 'completedquantity',
					value : totalQtyWOC
				// custrecord_cntm_cso_woc_quantity
				});
		//	}
			
			log.debug("asmOpRecLookup.custrecord_cntm_sublist_woc_qty :"+asmOpRecLookup.custrecord_cntm_sublist_woc_qty);
			if(asmHeaderLookup.custrecord_cntm_asm_op_text[0]){
				log.debug("in condition");
				
				var finalSerialNum=[];
				if (isLastOp == true || isSingleOp==true) {
					
					if(enterScrap==true){
					
						
						wocObj.setValue({
									fieldId : 'scrapquantity',
									value : cummScrap
								});
				
				}
				
					var lastopdetails=asmOpRecLookup.custrecord_cntm_last_op_inv_num;
					var parsed_data=JSON.parse(lastopdetails);
					finalSerialNum=parsed_data;
				
			log.debug("finalSerialNum :",JSON.stringify(finalSerialNum));
					for(var counter=0;counter<finalSerialNum.length;counter++){
						
						var result=finalSerialNum[counter];
						log.debug("result :"+result);
						var id=result["serialid"];
				
							var serialNum=result["serialName"];
							//var scrap=result["scrap"];
							log.debug("id :"+id,"serialNum :"+serialNum);
							var subRec = wocObj.getSubrecord({
								fieldId : 'inventorydetail'
							});
							
							subRec.selectNewLine({
								sublistId : 'inventoryassignment'
							});
							subRec.setCurrentSublistValue({
								sublistId : 'inventoryassignment',
								fieldId : 'receiptinventorynumber',
								value : serialNum
							});
						
							subRec
									.setCurrentSublistValue({
										sublistId : 'inventoryassignment',
										fieldId : 'quantity',
										value :"1"
									});
							subRec.commitLine({
								sublistId : 'inventoryassignment'
							});
							
							record.submitFields({
								type : 'customrecord_cntm_asm_serial_ids',
								id : id,
								values : {
									custrecord_cntm_is_process :true,
								
								}
							});
						//   return true;
						//});
					}
						
				}	
						
				
				var oprtseq = asmHeaderLookup.custrecord_cntm_asm_op_text.split(' ')[0];
				log.debug("oprtseq :"+oprtseq);
				var operationLine = wocObj.getLineCount({
					sublistId : 'operation'
				});
				log.debug('operationLine', operationLine);
				if (operationLine > 0) {
					for (var i = 0; i < operationLine; i++) {
						var op = wocObj.getSublistValue({
							sublistId : 'operation',
							fieldId : 'operationsequence',
							line : i
						});
						if (oprtseq == op) {
							log.debug("in same operation");
							wocObj.selectLine({
								sublistId : 'operation',
								line : i
							});
							log.debug("asmOpRecLookup.custrecord_cntm_sublst_laborsetuptime ",asmOpRecLookup.custrecord_cntm_sublst_laborsetuptime)
							log.debug("asmOpRecLookup.custrecord_cntm_sublst_laborruntime",asmOpRecLookup.custrecord_cntm_sublst_laborruntime);
						
						
							
							wocObj.setCurrentSublistValue({
								sublistId : 'operation',
								fieldId : 'laborsetuptime',
								value : asmOpRecLookup.custrecord_cntm_sublst_laborsetuptime
							});
							wocObj.setCurrentSublistValue({
								sublistId : 'operation',
								fieldId : 'laborruntime',
								value : asmOpRecLookup.custrecord_cntm_sublst_laborruntime
							});
							wocObj.commitLine({
								sublistId : 'operation'
							});
							break;
						}
					}
				}
				try{
				
					var wocId = wocObj.save({
						ignoreMandatoryFields : true
					});
					log.debug("wocId :"+wocId);
				
					var totalscrapQtyWOC=getTotalScrapQty(wo);
					record.submitFields({
						type : record.Type.WORK_ORDER_COMPLETION,
						id : wocId,
						values : {
							'custbody_cntm_wo_cumulative_scrap' :totalscrapQtyWOC,
							
						}
					});
					updateWoRec(wo);
					if(reworkInfo){
						createReworkRec(wocId,reworkInfo,op,opText,wo);
					}
					
					
				var totalWOCQty=updateHeaderRec(parentRec,completedQty,scrapQty,oprtn,wo);
				if (isLastOp != true && isSingleOp==false){
					updateNextOp(nextOp,completedQty,parentRec,totalWOCQty,wo,scrapQty);
					if(scrapQty){
					updateScrapOnNextOp(wo,scrapQty,parentRec,oprtn);
					}
					
				}
				record.submitFields({
					type : 'customrecord_cntm_asm_client_app',
					id : recId,
					values : {
						custrecord_cntm_sublst_woc : wocId,
						custrecord_cntm_sublst_status : 4
					}
				});
				 record.submitFields({
						type :'customrecord_cntm_client_app_asm_oper',
						id :parentRec ,
						values : {
							'custrecord_cntm_asm_woc_status' :4,
							
						}
					});
				}catch(e){
					log.error("error while saving WOC",JSON.stringify(e));
					//release the used serail numbers in case of error if last operation
					record.submitFields({
						type : 'customrecord_cntm_asm_client_app',
						id : recId,
						values : {
							// custrecord_cntm_cso_wocnumber :
							// wocId,
							'custrecord_cntm_asm_woc_status':"5",
							'custrecord_cntm_err_fld':e.message
							
						}
					});
					 record.submitFields({
							type :'customrecord_cntm_client_app_asm_oper',
							id : wocId,
							values : {
								'custrecord_cntm_asm_woc_status' :5,
								
							}
						});
					var lastopdetails=asmOpRecLookup.custrecord_cntm_last_op_inv_num;
					if(isLastOp==true || isSingleOp==true ){
						var parsed_data=JSON.parse(lastopdetails);
						for(var counter=0;counter<parsed_data.length;counter++){
							
							var result=parsed_data[counter];
							log.debug("result :"+result);
							var id=result["serialid"];
					
								var serialNum=result["serialName"];
								log.debug("id :"+id,"serialNum :"+serialNum);
								
								record.submitFields({
									type : 'customrecord_cntm_asm_serial_ids',
									id : id,
									values : {
										'custrecord_cntm_is_process':false,
									
									}
								});
						}
					}
					//scrapinfo is set to false if error in saving WOC
					 if(scrapInfo){
				        	
				        	  var parseScrapInfo2=JSON.parse(scrapInfo);
				      		for(var i=0;i<parseScrapInfo2.length;i++){
				      			var individualScrapInfo=parseScrapInfo2[i];
				      			var id=individualScrapInfo["id"];
				      			var rsn=individualScrapInfo["scrapreason"];
				      			log.debug("id :"+id,"rsn :"+rsn);
				      			record.submitFields({
				      				type : 'customrecord_cntm_asm_serial_ids',
				      				id : id,
				      				
				      				values : {
				      					'custrecord_cntm_is_scrap':false,
				      					'custrecord_cntm_asm_scrap_rsn':""
				      					
				      				}
				      			});
				      		} 
				        	
				        	
				        }
					
				}
			
				
		
			}	
			
    
    	}catch(e){
    		log.error('error'+ e.message,JSON.stringify(e));
			record.submitFields({
				type : 'customrecord_cntm_asm_client_app',
				id : recId,
				values : {
					// custrecord_cntm_cso_wocnumber :
					// wocId,
					'custrecord_cntm_asm_woc_status':"5",
					'custrecord_cntm_err_fld':e.message
					
				}
			});
    	}
    }
  function getTotalScrapQty(wo){
	  var customrecord_cntm_client_app_asm_operSearchObj = search.create({
		   type: "customrecord_cntm_asm_client_app",
		   filters:
		   [
		      ["custrecord_cntm_wo_reference","is",wo], 
		      "AND", 
		      ["custrecord_cntm_sublst_scrapqty","notequalto","0"],
		      "AND",
		      ["custrecord_cntm_sublst_status","is","4"]
		      
		   ],
		   columns:
		   [
		      
		      search.createColumn({name: "internalid", label: "ID"}),
		     
		      search.createColumn({name: "custrecord_cntm_sublst_scrapqty", label: "Scrap Qty"}),
		    
		   ]
		});
	  var scrapQty=0;
		var searchResultCount = customrecord_cntm_client_app_asm_operSearchObj.runPaged().count;
		log.debug("customrecord_cntm_client_app_asm_operSearchObj result count",searchResultCount);
		customrecord_cntm_client_app_asm_operSearchObj.run().each(function(result){
		   // .run().each has a limit of 4,000 results
			var scrap=result.getValue("custrecord_cntm_sublst_scrapqty")
			scrapQty=(scrapQty*1)+(scrap*1);
		   return true;
		});
		return scrapQty;
  }
  function updateNextOp(nextOp,completedQty,parentRec,totalWOCQty,wo,scrapQty){
	  
	  try{
	  log.debug("updateNextOp :"+nextOp,"completedQty :"+completedQty);

	  var recid;
	  var customrecord_cntm_client_app_asm_operSearchObj = search.create({
		   type: "customrecord_cntm_client_app_asm_oper",
		   filters:
		   [
		      ["custrecord_cntm_asm_operation","is",nextOp], 
		      "AND",
		      ["custrecord_cntm_asm_wo_ref","is",wo]
		    
		   ],
		   columns:
		   [
		      search.createColumn({
		         name: "scriptid",
		         sort: search.Sort.ASC,
		         label: "Script ID"
		      }),
		      
		      search.createColumn({name: "internalid", label: "Id"})
		   ]
		});
	 
		var searchResultCount = customrecord_cntm_client_app_asm_operSearchObj.runPaged().count;
		log.debug("customrecord_cntm_client_app_asm_operSearchObj result count",searchResultCount);
		customrecord_cntm_client_app_asm_operSearchObj.run().each(function(result){
		   // .run().each has a limit of 4,000 results
			recid=result.getValue("internalid");
			
		   return false;
		});
		log.debug("recid",recid);
		 var fieldLookUp = search
			.lookupFields({
				type : "customrecord_cntm_client_app_asm_oper",
				id : recid,
				columns : [ 'custrecord_cntm_remaining_qty','custrecord_cntm_completed_qty' ]
			});
		  var initailVal=fieldLookUp["custrecord_cntm_remaining_qty"];
		  var compl_qty=fieldLookUp["custrecord_cntm_completed_qty"];
		  log.debug("initailVal :"+initailVal,"completedQty :"+completedQty);
		  var recObj=record.load({
  			type :"customrecord_cntm_client_app_asm_oper",
  			id:recid
  		});
		  recObj.setValue({
			  fieldId:"custrecord_cntm_remaining_qty",
			 
			  value:(initailVal?parseInt(initailVal):0)+ (completedQty?parseInt(completedQty):0)
		  })
	
		  recObj.save();
		
		log.debug("next op updated successfully");
	  }catch(e){
		  log.debug("error" ,JSON.stringify(e));
	  }
		
  }
    
  function updateHeaderRec(parentRec,completedQty,scrapQty,oprtn,wo){
	  log.debug("updateHeaderRec :"+parentRec );
	  var newCompletedQty=completedQty;
	  var newQty=0;
	  if(scrapQty){
			
			newQty=(completedQty*1)+(scrapQty*1);
		 }else{
			 newQty= completedQty;
		 }
	  log.debug("newQty :"+newQty );
	  //get total scrap for each operation
	  var totalOperationScrapSearch = search.create({
		   type: "customrecord_cntm_asm_client_app",
		   filters:
		   [
		  
		      ["custrecord_cntm_sublst_parent_op","is",parentRec], 
		      "AND",
		      ["custrecord_cntm_sublst_status","is","4"],
		    
		   ],
		   columns:
		   [
		    
		      search.createColumn({name: "custrecord_cntm_sublst_completed_qty", label: "WOC quantity"}),
		      search.createColumn({name: "custrecord_cntm_sublist_woc_qty", label: "WOC quantity"}),
		      search.createColumn({name: "custrecord_cntm_sublst_scrapqty", label: "Scrap Qty"}),
		   
		      search.createColumn({name: "internalid", label: "Id"})
		   ]
		});
	var totalScrapForOp=0;
	 var totalWOCQty=0;
		var searchResultCountForTotalScrapOp = totalOperationScrapSearch.runPaged().count;
		log.debug("totalOperationScrapSearch result count",searchResultCountForTotalScrapOp);
		totalOperationScrapSearch.run().each(function(result){
		   // .run().each has a limit of 4,000 results
			
			var scrapQtyEachOp=result.getValue("custrecord_cntm_sublst_scrapqty");
			log.debug("scrapQtyEachOp :"+scrapQtyEachOp);
		    totalScrapForOp=(totalScrapForOp*1)+(scrapQtyEachOp*1);
		   return true;
		});
		log.debug("totalScrapForOp :"+totalScrapForOp);
		//get total scrap for entrire WO
	  var customrecord_cntm_client_app_asm_SubSearchObj = search.create({
		   type: "customrecord_cntm_asm_client_app",
		   filters:
		   [
		    ["custrecord_cntm_wo_reference","is",wo],
		    "AND",
		     ["custrecord_cntm_sublst_parent_op","is",parentRec], 
		      "AND",
		      ["custrecord_cntm_sublst_status","is","4"],
		    
		   ],
		   columns:
		   [
		    
		      search.createColumn({name: "custrecord_cntm_sublst_completed_qty", label: "WOC quantity"}),
		      search.createColumn({name: "custrecord_cntm_sublist_woc_qty", label: "WOC quantity"}),
		      search.createColumn({name: "custrecord_cntm_sublst_scrapqty", label: "Scrap Qty"}),
		      
		      search.createColumn({
		          name: "custrecord_cntm_remaining_qty",
		          join: "CUSTRECORD_CNTM_SUBLST_PARENT_OP",
		          label: "remaining Qty"
		       }),
		      search.createColumn({name: "internalid", label: "Id"})
		   ]
		});
	
	 var cummscrap_qty=0;
	 
		var searchResultCount = customrecord_cntm_client_app_asm_SubSearchObj.runPaged().count;
		log.debug("customrecord_cntm_client_app_asm_SubSearchObj result count",searchResultCount);
		customrecord_cntm_client_app_asm_SubSearchObj.run().each(function(result){
		 
			var scrapQtyOp=result.getValue("custrecord_cntm_sublst_scrapqty");
			
		
			cummscrap_qty=(cummscrap_qty*1)+(scrapQtyOp*1);
		   return true;
		});
	log.debug("cummscrap_qty :"+cummscrap_qty);
	var fieldLookUp = search
	.lookupFields({
		type : "customrecord_cntm_client_app_asm_oper",
		id : parentRec,
		columns : [ 'custrecord_cntm_remaining_qty','custrecord_cntm_completed_qty' ]
	});
	
	var remainingQty=fieldLookUp["custrecord_cntm_remaining_qty"];
	var totalCom=fieldLookUp["custrecord_cntm_completed_qty"];
log.debug("remainingQty :"+remainingQty,"parseInt(completedQty)+parseInt(totalCom):"+((completedQty*1)+(totalCom*1)));

		record.submitFields({
			type : 'customrecord_cntm_client_app_asm_oper',
			id : parentRec,
			values : {
				custrecord_cntm_remaining_qty :(remainingQty*1)-(newQty*1),
				custrecord_cntm_completed_qty:(newCompletedQty*1)+(totalCom*1),
				custrecord_cntm_asm_cumm_scrap:cummscrap_qty,
				custrecord_cntm_asm_scrap_qty:totalScrapForOp
				
			}
		});
		return totalWOCQty;
  }
  
  function createReworkRec(wocId,reworkInfo,op,opText,wo){
	  try{
		  log.debug("createReworkRec ",reworkInfo);
		  var parseReworkInfo=JSON.parse(reworkInfo);
		  
		  for(var i=0;i<parseReworkInfo.length;i++){
			  
		 var serialNumInfo=parseReworkInfo[i];
		 var reworkNum=serialNumInfo["id"];
		 
		 var reason=serialNumInfo["reworkreason"];
		  var reworkRec = record.create({
				type : 'customrecord_cntm_asm_rework',
				
			});
		  
		  reworkRec.setValue({
	    		fieldId:"custrecord_cntm_serialnum_rework",
	    		value:reworkNum
	    	});
		  reworkRec.setValue({
	    		fieldId:"custrecord_cntm_rework_reason",
	    		value:reason
	    	});
		  reworkRec.setValue({
	    		fieldId:"custrecord_cntm_asmwoc_ref",
	    		value:wocId
	    	});
		  reworkRec.setValue({
	    		fieldId:"custrecord_cntm_operationseq",
	    		value:op
	    	});
		  reworkRec.setValue({
	    		fieldId:"custrecord_cntm_operationtext",
	    		value:opText
	    	});
		  reworkRec.setValue({
	    		fieldId:"custrecord_cntm_rework_wo_ref",
	    		value:wo
	    	});
		  reworkRec.save();
		  }
		  
	  }catch(e){
		  log.debug("error in creating rework record")
	  }
  }
  
  function updateSerialNumForScrap(scrapInfo){
	  try{
	  if(scrapInfo){
		  var parseScrapInfo=JSON.parse(scrapInfo);
		for(var i=0;i<parseScrapInfo.length;i++){
			var individualScrapInfo=parseScrapInfo[i];
			var id=individualScrapInfo["id"];
			var rsn=individualScrapInfo["scrapreason"];
			log.debug("id :"+id,"rsn :"+rsn);
			record.submitFields({
				type : 'customrecord_cntm_asm_serial_ids',
				id : id,
				values : {
					custrecord_cntm_is_scrap :true,
					custrecord_cntm_asm_scrap_rsn:rsn
					
				}
			});
		}  
	  }
	  }catch(e){
		  log.error("error while updating scrap info",e.message);
	  }
  }
  
  function updateScrapOnNextOp(wo,scrapQty,parentRec,oprtn){
	  log.debug("updateScrapOnNextOp");
	  var customrecord_cntm_client_app_asm_Search = search.create({
		   type: "customrecord_cntm_client_app_asm_oper",
		   filters:
		   [
		      ["custrecord_cntm_asm_wo_ref","is",wo], 
		     
		   ],
		   columns:
		   [
		    
		      search.createColumn({name: "custrecord_cntm_asm_operation", label: "Operation"}),
		      search.createColumn({name: "custrecord_cntm_scrap_fr_next_op", label: "Scrap for next op"}),
		    
		      search.createColumn({name: "internalid", label: "Id"})
		   ]
		});
	  
		var searchResultCount = customrecord_cntm_client_app_asm_Search.runPaged().count;
		log.debug("customrecord_cntm_client_app_asm_Search result count",searchResultCount);
		
		customrecord_cntm_client_app_asm_Search.run().each(function(result){
			var id=result.getValue("internalid");
			var scrapForNextOp=result.getValue("custrecord_cntm_scrap_fr_next_op");
			var operation=result.getValue("custrecord_cntm_asm_operation");
			if((oprtn!=operation) && (operation>oprtn)){
				var totalScrap=(scrapForNextOp*1)+(scrapQty*1);
				log.debug("totalScrap :"+totalScrap);
				record.submitFields({
					type : 'customrecord_cntm_client_app_asm_oper',
					id : id,
					values : {
						custrecord_cntm_scrap_fr_next_op :totalScrap,
					
					}
				});
			}
			return true;
		});
	  
  }
   function updateSerailNumRec(finalSerialNum){
	   try{
			for(var i=0;i<finalSerialNum.length;i++){
				var individualSerialInfo=finalSerialNum[i];
				var id=individualSerialInfo["serialid"];
				var name=individualSerialInfo["serialName"];
				log.debug("id :"+id,"name :"+name);
				record.submitFields({
					type : 'customrecord_cntm_asm_serial_ids',
					id : id,
					values : {
						custrecord_cntm_is_process :false,
					
					}
				});
			}   
	   }catch(e){
		   log.error("error while updating serial number info",e.message);
	   }
   }
   function updateWoRec(wo){
	   var serailNumberSearch = search.create({
		   type: "customrecord_cntm_asm_serial_ids",
		   filters:
		   [
		      ["isinactive","is","F"],
		      "AND",
		     /* ["custrecord_cntm_is_scrap","is","F"],
		      "AND",
		      ["custrecord_cntm_is_process","is","F"],
		      "AND",*/
		      ["custrecord10","is",wo]
		      ],
		   columns:
		   [
		      search.createColumn({name: "internalid", label: "Id"}),
		      search.createColumn({name: "custrecord9", label: "SerailId"}),
		      search.createColumn({name: "custrecord_cntm_is_scrap", label: "Is Scrapped"}),
		      search.createColumn({name: "custrecord_cntm_is_process", label: "Is Processed"})
		    
		   ]
		});
	var scrapCount=0;
	var goodQty=0;
		var serailNumberSearchCount = serailNumberSearch.runPaged().count;
		log.debug("serailNumberSearchCount result count",serailNumberSearchCount);
		
		serailNumberSearch.run().each(function(result){
		
		var isScrapped=result.getValue("custrecord_cntm_is_scrap");
		if(isScrapped==true || isScrapped=="T"){
			scrapCount++;
		}else{
			goodQty++;
		}
		
		
	
			return true;
		});
		
		
		log.audit("goodQty "+goodQty,"scrapCount :"+scrapCount);
	
			var id = record.submitFields({
				type : record.Type.WORK_ORDER,
				id : wo,
				values : {
					'custbody_cntm_good_boards' : goodQty,
					'custbody_cntm_scrapped_boards':scrapCount
				},
				options : {
					enableSourcing : false,
					ignoreMandatoryFields : true
				}
			});
		
		
   }
    return {
        execute: execute
    };
    
});