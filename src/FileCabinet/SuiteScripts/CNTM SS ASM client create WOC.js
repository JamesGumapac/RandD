/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/record', 'N/runtime', 'N/search',"N/cache"], function(record, runtime, search,cache) {

    function execute(context) {
        try {
            log.audit('WO_PROCESS INIT',new Date().getTime());
            var data = JSON.parse(runtime.getCurrentScript().getParameter('custscript_cntm_wo_details'));
            // var paramsMult = data.finalDataPush;
            // log.debug('request', paramsMult);
            data.forEach(params => {
                log.debug('requestData', params);
               
                var recordId = createSublistRecord(params);
                log.debug('recordId', recordId);
                createWOCUpdated(params,recordId);
                
            });               
           
        } catch (error) {
            log.error({
                title: 'error Onrequest',
                details: error,
            });
        }
      log.audit('WO_PROCESS COMPLETED',new Date().getTime());
    }
    function createWOCUpdated(woc_map,recordId) {
      try {
        log.debug('createWOCUpdated INIT')

        var wocObj = record.transform({
          fromType: record.Type.WORK_ORDER,
          fromId: woc_map.wo,
          toType: record.Type.WORK_ORDER_COMPLETION,
          isDynamic: true,
        });


        var opRec = search.lookupFields({
          type:'customrecord_cntm_client_app_asm_oper_s',
          id: woc_map.asmOpRec,
          columns: ['custrecordcntm_client_asm_last_op']
        });

       
        
        log.debug("opRec",opRec);
        var lastOperation = opRec.custrecordcntm_client_asm_last_op;
        log.debug("opRec",lastOperation);
        var isLastOp = lastOperation.split(' ')[0]
        log.debug("isLastOp",isLastOp);
        


        wocObj.setText({
          fieldId: "startoperation",
          text: woc_map.operation.split(' ')[0],
        });
        wocObj.setText({
          fieldId: "custbody_cntm_serial_id_ref",
          text: woc_map.serialno,
        });
        wocObj.setText({
          fieldId: "endoperation",
          text: woc_map.endingopdetails.id,
        });

        wocObj.setValue({
          fieldId: "completedquantity",
          value: 1,
         });
        if (woc_map.isScrapped) {

          if(woc_map.endingopdetails.id != isLastOp){
            wocObj.setText({
              fieldId: "endoperation",
              text: isLastOp
            });
          }
          wocObj.setValue({
            fieldId: "scrapquantity",
            value: 1,
           });
          wocObj.setValue({
            fieldId: "completedquantity",
            value: 0,
           });
          
        }

        if(isLastOp ==  woc_map.endingopdetails.id  && !woc_map.isScrapped){
          // inv code
          var serialNum = woc_map.serialno;
         
          log.debug("serialNum :" , serialNum);
          var subRec = wocObj.getSubrecord({
            fieldId: "inventorydetail",
          });

          subRec.selectNewLine({
            sublistId: "inventoryassignment",
          });
          subRec.setCurrentSublistValue({
            sublistId: "inventoryassignment",
            fieldId: "receiptinventorynumber",
            value: serialNum,
          });

          subRec.setCurrentSublistValue({
            sublistId: "inventoryassignment",
            fieldId: "quantity",
            value: "1",
          });
          subRec.commitLine({
            sublistId: "inventoryassignment",
          });

        }
        
        // TODO: Update Sublist
        log.debug("oprtseq :" + woc_map.operation);
        var operationLine = wocObj.getLineCount({
          sublistId: "operation",
        });
        log.debug("operationLine",operationLine);
        operationLine = parseInt(operationLine);
        var op = '';
        if (operationLine > 0) {
          for (var i = 0, j = 0; i < operationLine; i++) {
              op = wocObj.getSublistValue({
              sublistId: "operation",
              fieldId: "operationsequence",
              line: i,
            });
            log.debug("op", op);
            log.debug("in",woc_map.operation.indexOf("" + op));
            if (woc_map.operation.indexOf("" + op) > -1) {
              j++; // (woc_map.oprtseq == op) {
              log.debug("in same operation", op);
              wocObj.selectLine({
                sublistId: "operation",
                line: i,
              });
            //   log.debug(
            //     "asmOpRecLookup.custrecord_cntm_sublst_laborsetuptime ",
            //     woc_map.labourSetupTime
            //   );
            //   log.debug(
            //     "asmOpRecLookup.custrecord_cntm_sublst_laborruntime",
            //     woc_map.labourRunTime
            //   );

              wocObj.setCurrentSublistValue({
                sublistId: "operation",
                fieldId: "laborsetuptime",
                value: woc_map.laborSetupTime,
              });
              wocObj.setCurrentSublistValue({
                sublistId: "operation",
                fieldId: "laborruntime",
                value: woc_map.laborRunTime,
              });
              wocObj.commitLine({
                sublistId: "operation",
              });
              // break;
            }
          //   if (j == woc_map.oprtseq.length) break;
          }
        }
        
        try {
          var wocId = wocObj.save({
            ignoreMandatoryFields: true,
          });
          log.audit("wocId :" + wocId);


          
          var temporaryCache = cache.getCache({
            name: 'myCache',
            scope: cache.Scope.PUBLIC
        });
      //  log.audit("cache here",temporaryCache)

        var arrayForSerial = temporaryCache.get({
            key:'serial',
            ttl: 300
        });
        log.audit("arrayForSerial",arrayForSerial)
       // arrayForSerial = arrayForSerial.split()
     //   log.audit("arrayForSerial",typeof arrayForSerial)
      //  log.audit("--START----")
        
        try {
          var arrayForSerialNew = '';

          
        
          
         //   log.audit("serial exists in cache",woc_map.serialno)
            arrayForSeriallen  =arrayForSerial.split(",").length;
            for(var i=0;i<arrayForSeriallen;i++)
            {
              if(arrayForSerial.split(",")[i] != woc_map.serialno)
              arrayForSerialNew =arrayForSerialNew+','+ arrayForSerial.split(",")[i];
            }


            
            log.audit("arrayForSerialNew after woc completed",arrayForSerialNew)
            temporaryCache.put({
              key:'serial' ,
              value:arrayForSerialNew,
              ttl: 300
          })
          
          log.audit("--END----")
          
        } catch (error) {
          log.error('Error in index :',error)
        }
           


          updateSublistRecord(wocId,recordId);
          updateOperationRecord(woc_map,recordId);
          woc_map.wocId = wocId;
          updateWoRec(woc_map.wo);
          log.debug("rework length",woc_map.reworkinfo.length)
          if (woc_map.reworkinfo.length > 0 ) {
            createReworkRec(
              wocId,
              woc_map.reworkinfo,
              op,
              woc_map.details.operationtext,
              woc_map.wo,
              woc_map.asmOpRec,
              woc_map.endingopdetails.value
            );
            }


        } catch (error) {
          
        }

      } catch (error) {
        log.error('error',error)
      }
    }

   
    function updateSerialNumForScrap(params,recordId) {
        try {
            log.debug('updatScrapInfo')
          if (params.scrapinfo) {
              record.submitFields({
                type: "customrecord_cntm_asm_client_app_s",
                id: recordId,
                values: {
                  custrecord_cntm_sublst_scrapped: true,
                  // custrecord_cntm_sublst_scrapinfo: 190,
                  custrecord_cntm_sublst_scrapinfo: parseInt(params.scrapinfo),
                },
              });
          }
        } catch (e) {
          log.error("error while updating scrap info", e.message);
        }
      }

      function getTotalScrapQty(wo) {
        var total_scrap_qty = 0;
        try {
            var customrecord_cntm_asm_client_app_sSearchObj = search.create({
                type: "customrecord_cntm_asm_client_app_s",
                filters:
                [
                ["custrecord_cntm_sublst_wo_ref","anyof",wo], 
                "AND", 
                ["custrecord_cntm_sublst_op_status","anyof","4"]
                ],
                columns:
                [
                search.createColumn({name: "internalid", label: "Internal ID"})
                ]
            });
            var searchResultCount = customrecord_cntm_asm_client_app_sSearchObj.runPaged().count;
            log.debug("customrecord_cntm_asm_client_app_sSearchObj result count",searchResultCount);
            total_scrap_qty = searchResultCount;
            
        } catch (error) {
            log.error('getTotalScrapQty',error)
        }
        return total_scrap_qty
      }

      function updateWoRec(wo) {
        // log.audit('update wo :',wo);
        var customrecord_cntm_asm_client_app_sSearchObj = search.create({
            type: "customrecord_cntm_asm_client_app_s",
            filters:
            [
               ["custrecord_cntm_sublst_wo_ref","anyof",wo], 
               "AND", 
               ["isinactive","is","F"]
            ],
            columns:
            [
               search.createColumn({name: "internalid", label: "Internal ID"}),
               search.createColumn({name: "custrecord_cntm_sublst_scrapped", label: "Scrapped"})
            ]
         });
         var goodQty,scrapCount = 0
         
         var searchResultCount = customrecord_cntm_asm_client_app_sSearchObj.runPaged().count;
         log.debug("customrecord_cntm_asm_client_app_sSearchObj result count",searchResultCount);
         customrecord_cntm_asm_client_app_sSearchObj.run().each(function(result){
            var isScrapped = result.getValue(search.createColumn({name: "custrecord_cntm_sublst_scrapped", label: "Scrapped"}));
            if (isScrapped == true || isScrapped == "T") {
                scrapCount++;
            } else {
                goodQty++;
            }
            return true;
         });
    
        // log.audit("goodQty " + goodQty, "scrapCount :" + scrapCount);
    
        var id = record.submitFields({
          type: record.Type.WORK_ORDER,
          id: wo,
          values: {
            custbody_cntm_good_boards: goodQty,
            custbody_cntm_scrapped_boards: scrapCount,
          },
          options: {
            enableSourcing: false,
            ignoreMandatoryFields: true,
          },
        });
        log.audit ('function end')
      }


      function createSublistRecord(requestBody){
        try {
            log.debug('createSublistRecord', 'init')
            var sublistRec = record.create({
                type: 'customrecord_cntm_asm_client_app_s',
                isDynamic: true,
                // defaultValues: Object
            })

            sublistRec.setValue({
                fieldId:'custrecord_cntm_sublst_startingop',
                value:requestBody.operation,
            })
            sublistRec.setValue({
                fieldId:'custrecord_cntm_sublst_endingop',
                value:requestBody.endingopdetails.value,
            })
            sublistRec.setValue({
                fieldId:'custrecord_cntm_sublst_op_status',
                value:1,
            })
        
            sublistRec.setValue({
                fieldId:'custrecord_cntm_sublst_parentop',
                value:requestBody.asmOpRec,
            })
            
            
            sublistRec.setValue({
                fieldId:'custrecord_cntm_sublst_operator_info',
                value:requestBody.operator,
            })
            // sublistRec.setValue({
            //     fieldId:'custrecord_cntm_sublst_woc_ref',
            //     value:,
            // })
            sublistRec.setValue({
                fieldId:'custrecord_cntm_sublst_wo_ref',
                value:requestBody.wo,
            })
            sublistRec.setValue({
                fieldId:'custrecord_cntm_sublst_laborsetup',
                value:requestBody.laborSetupTime,
            })
            sublistRec.setValue({
                fieldId:'custrecord_cntm_sublst_laborrun',
                value:requestBody.laborRunTime,
            })
            sublistRec.setValue({
                fieldId:'custrecord_cntm_sublst_machinesetup',
                value:requestBody.machinesetuptime,
            })
            sublistRec.setValue({
                fieldId:'custrecord_cntm_sublst_machinerun',
                value:requestBody.machineruntime,
            })

            return sublistRec.save();

        } catch (error) {
            log.error('createSublistRecord',error);
            return null;
        }
      }

      function updateSublistRecord(wocId,recordId) {
            record.submitFields({
                type: 'customrecord_cntm_asm_client_app_s',
                id: recordId,
                values: {
                    'custrecord_cntm_sublst_op_status':4,
                    'custrecord_cntm_sublst_woc_ref':wocId,
                }
            })

           
      }
      
      function updateOperationRecord(params,recordId) {
        log.debug('WOC Params',params);
       
        var isScrapped = false;
        // var opData =  getOperationsFormRouting(params,false)
        var values = {
          'custrecordcntm_client_asm_status':1,
          'custrecord_cntm_client_asm_is_comp':false,
          'custrecord_cntm_client_asm_nextop':params.endingopdetails.value,
          'custrecordcntm_client_asm_last_comp_op':params.endingopdetails.value,
          'custrecord_cntm_client_asm_sequence':params.endingopdetails.id,
          custrecordcntm_client_asm_is_scrapped: isScrapped,
          custrecordcntm_client_asm_lst_comp_op: params.operator,
          custrecord_cnmt_asm_laborruntime:params.laborRunTime,
          custrecordcntm_client_asm_laborsetuptime:params.laborSetupTime,

        }

          if(params.isScrapped){
            log.debug('Record Log','isScrapped');
            isScrapped = true;
            updateSerialNumForScrap(params,recordId);
            values.custrecordcntm_client_asm_status = 4;
            // values.custrecord_cntm_client_asm_is_comp = true;
            values.custrecordcntm_client_asm_is_scrapped = true;
          }else{
            var opData =  getOperationsFormRouting(params,false)
            if(opData != null){    
              // log.debug('Record Log','IS not null');
              values.custrecord_cntm_client_asm_nextop =opData.name;
              values.custrecord_cnmt_asm_laborruntime =opData.runrate;
              values.custrecordcntm_client_asm_laborsetuptime =opData.setuptime;
            }else{
              log.debug('Record Log','null');
              values.custrecordcntm_client_asm_status = 4;
              values.custrecord_cntm_client_asm_is_comp = true;
            }
          }

          try {
            log.debug('values',values)
            record.submitFields({
              type: 'customrecord_cntm_client_app_asm_oper_s',
              id: params.asmOpRec,
              values: values
           })  
          } catch (error) {
            log.error('updateOperationRecord',updateOperationRecord);
          }
        
      }

      function getOperationsFormRouting(params,getlast) {
        // log.debug('startingOp',startingOp)
        // log.debug('woId',woId)
        // var RoutingSeqlist = [];

        try {
            
            var woLookup = search.lookupFields({
                type : 'workorder',
                id : params.wo,
                columns : [ 'manufacturingrouting' ],
            });
            var manufacturingrouting = woLookup.manufacturingrouting[0].value;
            var endop = params.endingopdetails.id 
            log.debug('manufacturingrouting',manufacturingrouting)
            var endingOperation = ''
            var manufacturingroutingSearchObj = search.create({
                type: "manufacturingrouting",
                filters:
                [
                ["internalid","anyof",manufacturingrouting]
                ],
                columns:
                [
                search.createColumn({name: "sequence",sort: search.Sort.ASC,label: "Operation Sequence"}),
                search.createColumn({name: "operationname", label: "Operation Name"}),
                search.createColumn({name: "setuptime", label: "Setup Time"}),
                search.createColumn({name: "runrate", label: "Run Rate"})
                ]
            });
            var searchResultCount = manufacturingroutingSearchObj.runPaged().count;
            log.debug("manufacturingroutingSearchObj result count",searchResultCount);
            
            manufacturingroutingSearchObj.run().each(function(result,i){
                
                var temp = {
                sequence : result.getValue(search.createColumn({name: "sequence",sort: search.Sort.ASC,label: "Operation Sequence"})),
                name : ""+ result.getValue(search.createColumn({name: "sequence",sort: search.Sort.ASC,label: "Operation Sequence"}))  +' ' + result.getValue(search.createColumn({name: "operationname", label: "Operation Name"})),
                setuptime : result.getValue(search.createColumn({name: "setuptime", label: "Setup Time"})),
                runrate : result.getValue(search.createColumn({name: "runrate", label: "Run Rate"})),
                isLastOp : false
                }
                if (getlast) {
                   if (i == (searchResultCount-1)) {
                    endingOperation = temp;
                    return false;
                   }
                }else{
                  log.debug(parseFloat(temp.sequence), parseFloat(endop) )
                  if(parseFloat(temp.sequence) > parseFloat(endop)){
                      log.debug('inif')
                      endingOperation = temp;
                      return false    
                  }else{
                      log.debug('in else')
                  }
                }
                return true;
            });
            if(endingOperation){
                return endingOperation
            }else{
                //Return Error
                return null
            }
        } catch (error) {
            log.error('Error getOperationsFormRouting',error)
        }
    }

    function createReworkRec(wocId, reworkInfo, op, opText, wo,serialnum,endoptext) {
      try {
       
        // var parseReworkInfo = JSON.parse(reworkInfo);
        var parseReworkInfo = reworkInfo;
  
        for (var i = 0; i < parseReworkInfo.length; i++) {
          var serialNumInfo = parseReworkInfo[i];
          var reworkNum = serialNumInfo["id"];
  
          var reason = serialNumInfo["reworkreason"];
          var reworkRec = record.create({
            type: "customrecord_cntm_asm_rework",
          });
  
          reworkRec.setValue({
            fieldId: "custrecord_cntm_serialnum_rework",
            value: serialnum,
          });
          reworkRec.setValue({
            fieldId: "custrecord_cntm_rework_reason",
            value: reason,
          });
          reworkRec.setValue({
            fieldId: "custrecord_cntm_asmwoc_ref",
            value: wocId,
          });
          reworkRec.setValue({
            fieldId: "custrecord_cntm_operationseq",
            value: opText.split(" ")[0],
          });
          
          reworkRec.setValue({
            fieldId: "custrecord_cntm_endop_rework",
            value: endoptext,
          });
          reworkRec.setValue({
            fieldId: "custrecord_cntm_operationtext",
            value: opText,
          });
          reworkRec.setValue({
            fieldId: "custrecord_cntm_rework_wo_ref",
            value: wo,
          });
       
          var rec = reworkRec.save();
          log.audit('rec ;',rec);
        }
      } catch (e) {
        log.error("error in creating rework record",e);
      }
    }
    return {
        execute: execute
    }
});