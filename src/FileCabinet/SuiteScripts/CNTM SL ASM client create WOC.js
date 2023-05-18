/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(['N/file', 'N/http', 'N/https', 'N/record', 'N/runtime', 'N/search',
'N/url'], function (file, http, https, record, runtime, search, url) {
    function onRequest(context) {
        try {
            log.debug('request', context.request);
            var params = JSON.parse(context.request.body);
            if (context.request.method === 'POST') {
                log.debug('requestData', params);
                var woID = context.request.parameters.i_woid;
                // var rwqParams = {
                //     startoperation
                //     custbody_cntm_woc_good
                //     custbody_cntm_woc_scrapqty
                //     endoperation
                //     completedquantity
                // }
                var recordId = createSublistRecord(params,context);
                log.debug('recordId', recordId);
                createWOC(params,recordId,context);

                context.response.write('success');
                return 'success';
            } else {
                log.debug('GET requestData', context.request.parameters);
                // context.response.write(context.request.parameters)
                return context.request.parameters;
            }
        } catch (error) {
            log.error({
                title: 'error Onrequest',
                details: error,
            });
        }
    }

    function createWOC(woc_map,recordId,context) {
        try {
            log.debug('createWOC INIT')
            // if (woc_map.scrapinfo) {
            //   updateSerialNumForScrap(woc_map.scrapinfo,recordId);
            // }
      
            log.debug("completion--");
            var wocObj = record.transform({
              fromType: record.Type.WORK_ORDER,
              fromId: woc_map.wo,
              toType: record.Type.WORK_ORDER_COMPLETION,
              isDynamic: true,
            });
      
            wocObj.setText({
              fieldId: "startoperation",
              text: woc_map.operation.split(' ')[0],
            });
            wocObj.setText({
              fieldId: "custbody_cntm_woc_good",
              text: woc_map.completedQty * 1,
            });
            wocObj.setText({
              fieldId: "custbody_cntm_woc_scrapqty",
              text: woc_map.scrapQty * 1,
            });
          //   log.debug("oprtn :" + woc_map.oprtn);
            // var t =parseInt(woc_map.endingopdetails.id)*1
            // log.debug("woc_map.endingopdetails.id :" , t);
            if(params.scrapinfo.length > 0){
              var opData =  getOperationsFormRouting(params,true)
              wocObj.setText({
                fieldId: "endoperation",
                text: opData.sequence,
              });
            }else{
              wocObj.setText({
                fieldId: "endoperation",
                text: woc_map.endingopdetails.id,
              });
            }
            
            wocObj.setValue({
              fieldId: "custbody_cntm_op_client_app",
              value: parseInt(woc_map.operator),
            });
      
            // log.debug("totalQtyWOC :" + woc_map.totalQtyWOC);
            wocObj.setValue({
              fieldId: "completedquantity",
              value: 1,
              // custrecord_cntm_cso_woc_quantity
            });
            // }
      
            // log.debug(
            //   "asmOpRecLookup.custrecord_cntm_sublist_woc_qty :" + woc_map.wocQty
            // );
            if (woc_map.operation) {
              log.debug("in condition");
      
              var finalSerialNum = [];
              if (woc_map.isLastOp == true || woc_map.isSingleOp == true) {
                if (woc_map.enterScrap == true) {
                  wocObj.setValue({
                    fieldId: "scrapquantity",
                    value: woc_map.cummScrap,
                  });
                }
                log.debug("woc_map.lastopdetails", woc_map.lastopdetails);
                var parsed_data = woc_map.lastopdetails;
                finalSerialNum = parsed_data;
      
                log.debug("finalSerialNum :", JSON.stringify(finalSerialNum));
                for (var counter = 0; counter < finalSerialNum.length; counter++) {
                  var result = finalSerialNum[counter];
                  log.debug("result :" + result);
                  var id = result["serialid"];
      
                  var serialNum = result["serialName"];
                  // var scrap=result["scrap"];
                  log.debug("id :" + id, "serialNum :" + serialNum);
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
      
                  record.submitFields({
                    type: "customrecord_cntm_asm_serial_ids",
                    id: id,
                    values: {
                      custrecord_cntm_is_process: true,
                    },
                  });
                  // return true;
                  // });
                }
              }
      
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
              var totalscrapQtyWOC = getTotalScrapQty(woc_map.wo);
              log.audit("totalscrapQtyWOC", totalscrapQtyWOC);
              wocObj.setValue({
                fieldId: "custbody_cntm_wo_cumulative_scrap",
                value: totalscrapQtyWOC,
              });
              try {
                var wocId = wocObj.save({
                  ignoreMandatoryFields: true,
                });
                log.audit("wocId :" + wocId);
                updateSublistRecord(wocId,recordId);
                updateOperationRecord(woc_map);
                woc_map.wocId = wocId;
                /*var totalscrapQtyWOC = getTotalScrapQty(woc_map.wo);
                              record
                                      .submitFields({
                                          type : record.Type.WORK_ORDER_COMPLETION,
                                          id : wocId,
                                          values : {
                                              'custbody_cntm_wo_cumulative_scrap' : totalscrapQtyWOC,
      
                                          }
                                      });*/
                updateWoRec(woc_map.wo);
                if (woc_map.reworkinfo.length > 0 ) {
                  createReworkRec(
                    wocId,
                    woc_map.reworkinfo,
                    op,
                    woc_map.opText,
                    woc_map.wo
                  );
                  }
      
      
      
                // }
              } catch (e) {
                woc_map.errMsg = e.message;
                log.error('error save',e)
                // context.write({
                //   key: "Failure",
                //   value: woc_map,
                // });
              }
            }
            // context.write({
            //   key: "Success",
            //   value: woc_map,
            // });
          } catch (e) {
            // context.write({
            //   key: "Failure",
            //   value: woc_map,
            // });
            log.error("error" + e.message, JSON.stringify(e));
            record.submitFields({
              type: "customrecord_cntm_asm_client_app_s",
              id: recordId,
              values: {
                // custrecord_cntm_cso_wocnumber :
                // wocId,
                custrecord_cntm_sublst_op_status: "5",
                custrecord_cntm_sublst_error: e.message,
              },
            });
          }
    }
    function updateSerialNumForScrap(scrapInfo,recordId) {
        try {
            log.debug('updatScrapInfo')
          if (scrapInfo) {
            var parseScrapInfo = scrapInfo;
            for (var i = 0; i < parseScrapInfo.length; i++) {
              var individualScrapInfo = parseScrapInfo[i];
              var id = individualScrapInfo["id"];
              var rsn = individualScrapInfo["scrapreason"];
              log.debug("id :" + id, "rsn :" + rsn);
              record.submitFields({
                type: "customrecord_cntm_asm_client_app_s",
                id: recordId,
                values: {
                  custrecord_cntm_sublst_scrapped: true,
                  custrecord_cntm_sublst_scrapinfo: rsn,
                },
              });
            }
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


      function createSublistRecord(requestBody,context){
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
      
      function updateOperationRecord(params) {
        log.debug('WOC Params',params);
       
        var isScrapped = false;
        var opData =  getOperationsFormRouting(params,false)
        if(params.scrapinfo.length > 0){
          isScrapped = true;
          updateSerialNumForScrap(params);
        }
            
            record.submitFields({
                type: 'customrecord_cntm_client_app_asm_oper_s',
                id: params.asmOpRec,
                values: {
                    'custrecordcntm_client_asm_operator':params.operator,
                    // 'custrecordcntm_client_asm_status':4,
                    'custrecord_cntm_client_asm_nextop':opData.name,
                    'custrecordcntm_client_asm_last_comp_op':params.endingopdetails.value,
                    'custrecord_cntm_client_asm_sequence':params.endingopdetails.id,
                    custrecordcntm_client_asm_is_scrapped: isScrapped,
                }
            })
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

    function createReworkRec(wocId, reworkInfo, op, opText, wo) {
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
            value: reworkNum,
          });
          reworkRec.setValue({
            fieldId: "custrecord_cntm_rework_reason",
            value: reason,
          });
          reworkRec.setValue({
            fieldId: "custrecord_cntm_asmwoc_ref",
            value: wocId,
          });
          log.audit("operation",opText.split(" ")[0])
          reworkRec.setValue({
            fieldId: "custrecord_cntm_operationseq",
            value: opText.split(" ")[0],
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
        onRequest: onRequest,
    };
});
