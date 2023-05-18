/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/redirect', 'N/url', 'N/format','N/https','N/task','N/runtime'], function(search, record, redirect, url, format,https,task,runtime) {

    function execute(context) {
        try {
            
            log.debug('INIT', 'INIT');
            var request = runtime.getCurrentScript().getParameter('custscript_cntm_request');
            request = JSON.parse(request);
            log.debug({
                title: 'request',
                details: request
            })
            var response = createWorkOrder(context,request);
            log.debug('createWorkOrder', response);
            if(response){
                log.debug('WO Creation CREATED', 'CREATED');
                updateRecordsAfterCreation(response);
                
            }else{
                log.debug('WO Creation Complete', 'NOT CREATED');
            }
            log.debug('END', 'END');
        } catch (error) {
            log.error('Execute ERROR', error);
        }
    }


    function createWorkOrder(context, request) {
        log.debug('INIT createWorkOrder', request);
        var map = {}
        try {       
            log.debug('request', request);
            var asmWOCRecordId  = request.asmWOCRecordId;
            var soSubsidiary = request.soSubsidiary1; 
           var soCustomer = request.soCustomer1;
           var isintercompanyso = request.isintercompanyso1;
            var project =request.project1;
            var endcustomer= request.endcustomer1;
            var toolnumber =  request.toolnumber1;
            var item = request.item1;
            var soLocation = request.soLocation1;
            var scheduledDate = request.scheduledDate1;
            // log.debug('scheduledDate old ;',scheduledDate);
            scheduledDate = convertDate(scheduledDate);
            // log.debug('scheduledDate new ;',scheduledDate);
    
            var so_type = request.so_type1;
            var bom = request.bom1;
    
            var asm_uniqueKey = request.asm_uniqueKey1;
            log.debug('asm_uniqueKey :',asm_uniqueKey);
    
    
            
    
             var shipdate =  request.shipdate1;
            //  log.debug('shipdate old ;',shipdate);
             if(shipdate)
             shipdate = convertDate(shipdate);
            //  log.debug('shipdate new ;',shipdate);
         
    
             var  routing = request.routing1;
             var  releasedDate = request.releasedDate1;
             releasedDate = convertDate(releasedDate);
    
             var woQty =  request.woQty1;
             var so = request.so1;
             var empName = request.empName1;
             var custPartNo = request.custPartNo1;      
            
    
             var woRec = record.create({
                type: record.Type.WORK_ORDER,
                isDynamic: true,
              });
              // log.debug(
              //   "soSubsidiary :" + soSubsidiary,
              //   "soCustomer :" + soCustomer
              // );
              log.debug('soCustomer :',soCustomer);
              log.debug('endcustomer :',endcustomer);
              log.debug('soSubsidiary :',soSubsidiary);
              log.debug('isintercompanyso :',isintercompanyso);
              log.debug('isintercompanyso type :',typeof(isintercompanyso));
    
    
              
    
              woRec.setValue({
                fieldId: "subsidiary",
                value: soSubsidiary,
              });
              // woRec.setValue({
              //   fieldId: "entity",
              //   value: soCustomer,
              // });
              // log.debug('outside Saved')
              if (isintercompanyso == false || isintercompanyso == 'false') {
                log.debug('isintercompanyso false:' ,isintercompanyso)
    
                woRec.setValue({
                  fieldId: "entity",
                  value: soCustomer,
                });
                woRec.setValue({
                  fieldId: "job",
                  value: project,
                });
                log.debug('project :',project);
                woRec.setValue({
                  fieldId: "custbody_cntm_project",
                  value: project,
                });
              } else if (isintercompanyso == true || isintercompanyso == 'true') {
                log.debug('isintercompanyso true:' ,isintercompanyso)
    
                woRec.setValue({
                  fieldId: "entity",
                  value: "",
                });
                woRec.setValue({
                  fieldId: "custbody_cntm_project",
                  value: project,
                });
              }
              woRec.setValue({
                fieldId: "custbody_rda_transbody_end_customer",
                value: endcustomer,
              });
              log.debug('endcustomer :' ,endcustomer)
    
              woRec.setValue({
                fieldId: "custbody_cntm_tool_number",
                value: toolnumber,
              });
    
              log.debug('toolnumber:' ,toolnumber)
              //log.debug("item" + item, "soLocation :" + soLocation);
              woRec.setValue({
                fieldId: "assemblyitem",
                value: item,
              });
              log.debug('item:' ,item);
              
             
    
              woRec.setValue({
                fieldId: "location",
                value: soLocation,
              });
              log.debug('soLocation:' ,soLocation);
    
              woRec.setValue({
                fieldId: "iswip",
                value: true,
              });
              //log.debug(
              //   "scheduledDate" + scheduledDate,
              //   "bom :" + bom
              // );
              woRec.setText({
                fieldId: "startdate",
                text: scheduledDate,
                // value :scheduledDateparsedDate
              });
              log.debug('scheduledDate:' ,scheduledDate)
    
              woRec.setValue({
                fieldId: "custbody_cnt_release_type",
                value: so_type,
              });
              log.debug('so_type:' ,so_type)
    
              woRec.setValue({
                fieldId: "billofmaterials",
                value: bom,
              });
              log.debug('bom:' ,bom)
    
              if (
                shipdate != undefined &&
                shipdate != null &&
                shipdate != ""
              ) {
                woRec.setText({
                  fieldId: "custbody_rda_wo_sched_due_date",
                  text: shipdate,
                  // value :shipdateparsedDate
                });
              }
              woRec.setValue({
                fieldId: "manufacturingrouting",
                value: routing,
              });
              log.debug("routing" + routing, "shipdate :" + shipdate);
    
              //unique key changes
              if(asm_uniqueKey){
                woRec.setValue({
                  fieldId: "custbody_cntm_so_line_unique_key",
                  value: asm_uniqueKey,
                });
              }
              if (releasedDate) {
                releasedDate = convertDate(releasedDate);
              }
              var bomRev;
              var bomrevisionSearchObj = search.create({
                type: "bomrevision",
                filters: [
                  [
                    [
                      [
                        "effectivestartdate",
                        "onorbefore",
                        releasedDate,
                      ],
                      "AND",
                      ["effectiveenddate", "onorafter", releasedDate],
                    ],
                    "OR",
                    [
                      ["effectiveenddate", "isempty", ""],
                      "AND",
                      [
                        "effectivestartdate",
                        "onorbefore",
                        releasedDate,
                      ],
                    ],
                  ],
                  "AND",
                  ["billofmaterials", "anyof", bom],
                ],
    
                columns: [
                  search.createColumn({
                    name: "billofmaterials",
                    label: "Bill of Materials",
                  }),
                  search.createColumn({
                    name: "name",
                    label: "Name",
                  }),
                  search.createColumn({
                    name: "effectiveenddate",
                    label: "Effective End Date",
                  }),
                  search.createColumn({
                    name: "effectivestartdate",
                    label: "Effective Start Date",
                  }),
                  search.createColumn({
                    name: "internalid",
                    sort: search.Sort.DESC,
                    label: "Internal ID",
                  }),
                  search.createColumn({
                    name: "custrecord_cntm_alt_part_no_rec",
                    label: "APN",
                  }),
    
                  search.createColumn({
                    name: "custrecord_cntm_rev_import_file",
                    label: "RDA Import File",
                  }),
                ],
              });
              var searchResultCount =
                bomrevisionSearchObj.runPaged().count;
              log.debug(
                "bomrevisionSearchObj result count",
                searchResultCount
              );
              var woId;
              var map = {}
              if (searchResultCount > 0) {
                bomrevisionSearchObj.run().each(function (result) {
                  bomRev = result.id;
                  woRec.setValue({
                    fieldId: "billofmaterialsrevision",
                    value: result.id,
                  });
                  apn_ref = result.getValue(
                    "custrecord_cntm_alt_part_no_rec"
                  );
                  woRec.setValue({
                    fieldId: "custbody_cntm_wo_apn_ref",
                    value: apn_ref,
                  });
                  log.debug(
                    "result.id :" + result.id,
                    "apn_ref :" + apn_ref
                  );
                  var rdaimportfile = result.getText(
                    "custrecord_cntm_rev_import_file"
                  );
                  woRec.setValue({
                    fieldId: "custbody_cntm_asm_cust_rev",
                    value: rdaimportfile,
                  });
                  woRec.setValue({
                    fieldId: "quantity",
                    value: woQty,
                    ignoreFieldChange: false,
                  });
                  woRec.setValue({
                    fieldId: "custbody_cnt_created_fm_so",
                    value: so,
                  });
                  log.debug("rdaimportfile :" + rdaimportfile,"so :" + so);
                //   var job = asmRecord.getValue({
                //     fieldId: "custrecord_cntm_job",
                //   });
                //   var custPartNo = asmRecord.getValue({
                //     fieldId: "custrecord_cntm_cust_part_no",
                //   });
                //   log.debug("custPartNo: " + custPartNo);
                  
                  //changes for class on Workorder
                var soFieldLookUp = search.lookupFields({
                  type: "salesorder",
                  id: so,
                  columns: [
                    "class"
                  ],
                });
                log.debug('class soFieldLookUp :',soFieldLookUp);
    
                if(soFieldLookUp.class[0]){
                  woRec.setValue({
                  fieldId: "class",
                  value: soFieldLookUp.class[0].value,
                });
                }
                 
                  woRec.setValue({
                    fieldId: "custbody_cntm_cust_part_no",
                    value: custPartNo,
                  });
                  // setApnlines(woRec,apn_ref);
                  log.debug("empName :" + empName);
    
                  woRec.setValue({
                    fieldId: "custbody_cntm_wo_created_by",
                    value: empName,
                  });
    
                  woRec.setValue({
                    fieldId: "custbody_cntm_is_asm_wo",
                    value: true,
                  });
                  woId = woRec.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true,
                  });
                  log.debug('**WOID', woId);
    
                  try {
                    var fieldLookUp = search.lookupFields({
                      type: 'customrecord_cntm_wodetailsfor_asmwocrt',
                      id:asmWOCRecordId ,
                      columns: ["custrecord_cntm_status_asm_child", "custrecord_cntm_err_asm_child"],
                    });
                    var status = fieldLookUp["custrecord_cntm_status_asm_child"];
                    var errorField = fieldLookUp["custrecord_cntm_err_asm_child"];
    
                    if(woId){
                      if(status.toString() == '13'){
                        if(errorField.includes('host you are trying to connect to has exceeded')){
                            record.submitFields({
                              type: 'customrecord_cntm_wodetailsfor_asmwocrt',
                              id: asmWOCRecordId,
                              values: {
                                "custrecord_cntm_status_asm_child":8,
                                "custrecord_cntm_err_asm_child":'',
                                'custrecord_cntm_wonumb_asm_wocrtn': woId
                              }});
                        }else{
                          log.debug('Else errorField.includes')
                        }
                      }else{
                        log.debug('Else status.toString')
                      }
                  }
        
                  } catch (error) {
                      log.error('** Lookup Error',error);                
                  }
    
                  
                  map["bomRev"] = bomRev;
                  map["woId"] = woId;
                  map["apn_ref"] = apn_ref;
                  map['request'] = request
                  log.debug('map :',map)
                //   return map;
                  // return ();  
                  return false;
                });
            }else{
              log.debug('in Else search')
            }
            
         } catch (e) {
            log.debug('ERROR createWorkOrder', e);
            //  log.error('ERROR IN SUITELET',e);
             map['error']=e.message;
             return map;
          }
          return map
    }
    function updateRecordsAfterCreation(response) {
        log.debug('INIT responce', response);
        try {
            var woMap = {};
            var woArr = [];
            
            var i = response.request.lineNumber;
            var asmRecord = record.load({
                type: response.request.asmRecord.type,
                id: response.request.asmRecord.id,
                isDynamic: true,
            });
            if (response != '') {
                var error = response.error;
                if (error) {
                asmRecord.selectLine({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    line: i,
                });
                log.debug('1');
                asmRecord.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_err_asm_child",
                    value: error,
                });
                log.debug('2');
                asmRecord.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_status_asm_child",
                    value: 13,
                });
                log.debug('3');
                asmRecord.commitLine({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                });
                } else {
                var woId = response.woId;
                var bomRev = response.bomRev;
                log.debug("woId :", woId);
                log.debug("bomRev :", bomRev);


                if (woId) {
                    log.debug('INSIDE woid');
                    asmRecord.selectLine({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    line: i,
                    });
                    log.debug('1');
                    asmRecord.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_wonumb_asm_wocrtn",
                    value: woId,
                    });
                    log.debug('2');
                    asmRecord.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_status_asm_child",
                    value: 8,
                    });
                    asmRecord.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_err_asm_child",
                    value: '',
                    });

                    log.debug('3');
                    asmRecord.commitLine({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    });
                    log.debug('Commit');
                    woMap["wo"] = woId;
                    woMap["apn"] = response.apn_ref;
                    woArr.push(woMap);
                    log.debug('woArr :', woArr);
                }
                if (bomRev && woId) {
                    log.debug('Inside bom rev ');

                    var loadWO = record.load({
                    type: "workorder",
                    id: woId,
                    isDynamic: true,
                    });
                    var DOMFieldMapping = {};
                    var bomrevisionSearchObj = search.create({
                    type: "bomrevision",
                    filters: [
                        ["internalidnumber", "equalto", bomRev],
                        /*
                        * "AND", ["component.item","anyof",item]
                        */
                    ],
                    columns: [
                        "billofmaterials",
                        "name",
                        search.createColumn({
                        name: "custrecord_cntm_bag_n_tag_rev",
                        join: "component",
                        }),
                        search.createColumn({
                        name: "custrecord_cntm_customer_supplied",
                        join: "component",
                        }),
                        search.createColumn({
                        name: "custrecord_cntm_spec_part",
                        join: "component",
                        }),
                        search.createColumn({
                        name: "custrecord_cntm_stacked_rev",
                        join: "component",
                        }),
                        search.createColumn({
                        name: "item",
                        join: "component",
                        }),
                    ],
                    });
                    var searchResultCount =
                    bomrevisionSearchObj.runPaged().count;
                    // //log.debug("bomrevisionSearchObj
                    // result
                    // count",searchResultCount);
                    var line = 0;
                    bomrevisionSearchObj.run().each(function (result) {
                    // .run().each
                    // has a limit
                    // of 4,000
                    // results
                    var bagNtagVal = result.getValue({
                        name: "custrecord_cntm_bag_n_tag_rev",
                        join: "component",
                    });
                    // log.debug('4');
                    var specPartVal = result.getValue({
                        name: "custrecord_cntm_spec_part",
                        join: "component",
                    });
                    // log.debug('5');
                    var custsuppliedVal = result.getValue({
                        name: "custrecord_cntm_customer_supplied",
                        join: "component",
                    });
                    // log.debug('6');
                    var stackedVal = result.getValue({
                        name: "custrecord_cntm_stacked_rev",
                        join: "component",
                    });
                    // log.debug('7');
                    // log.audit(bagNtagVal+specPartVal,custsuppliedVal+stackedVal);
                    var bagNtag =
                        bagNtagVal && bagNtagVal == "Y" ? true : false;
                    var specPart =
                        specPartVal && specPartVal == "Y"
                        ? true
                        : false;
                    var custsupplied =
                        custsuppliedVal && custsuppliedVal == "Y"
                        ? true
                        : false;
                    var stacked =
                        stackedVal && stackedVal == "Y" ? true : false;
                    var item = result.getValue({
                        name: "item",
                        join: "component",
                    });
                    // log.debug('8');
                    loadWO.selectLine({
                        sublistId: "item",
                        line: line,
                    });
                    // log.debug('9');
                    loadWO.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_cntm_cust_supplied",
                        value: custsupplied,
                    });

                    // log.debug('custsupplied :',custsupplied);
                    loadWO.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_cntm_stacked",
                        value: stacked,
                    });
                    // log.debug('stacked :',stacked);
                    loadWO.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_cntm_specific_part",
                        value: specPart,
                    });
                    // log.debug('specPart ;',specPart);
                    loadWO.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_cntm_bag_tag",
                        value: bagNtag,
                    });
                    // log.debug('bagNtag :',bagNtag);
                    // log.debug('Line :',line);
                    var testItem = loadWO.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "item"
                        // value: stacked,
                    });
                    // log.debug('testItem :',testItem);





                    loadWO.commitLine({ sublistId: "item" });
                    // log.debug('commit item line');
                    var map = {};
                    if (line in DOMFieldMapping) {
                        // //log.debug('if');
                        map = DOMFieldMapping[line];
                    } else {
                        // DOMFieldMapping[line]={};
                        // //log.debug('else');
                        map.item = item;
                        // map.custsupplied=false;
                    }
                    // //log.debug('map',map);
                    map.custsupplied = custsupplied;
                    map.bagntag = bagNtag;
                    map.stacked = stacked;
                    map.specificpart = specPart;
                    DOMFieldMapping[line] = map;
                    line++;
                    return true;
                    });

                    loadWO.setValue({
                    fieldId: "custbody_cntm_comp_line_fld_map",
                    value: JSON.stringify(DOMFieldMapping),
                    });
                    log.debug('10');
                    loadWO.save();
                    log.debug('SAVED');
                }
                }
            }
            else {
                log.debug('ELSE responce');
                // throw { "message": ",Error : WO Creation Process" };

            }
            asmRecord.save();
            log.debug('ASM RECORD SAVE',asmRecord );
            taskCallToCreateApnRecord(woArr);
        } catch (error) {
            log.debug('ERROR updateRecordsAfterCreation', error)
        }
    }
    

    function taskCallToCreateApnRecord(woArr) {
        try {
            
        log.debug('inittaskCallToCreateApnRecord',  woArr)
        if (woArr.length > 0) {
            log.debug("in sch :");
            var scheduledScript = task.create({
              taskType: task.TaskType.SCHEDULED_SCRIPT,
            });
            scheduledScript.scriptId = "customscript_cntm_ss_create_wo_apn_ref";
            scheduledScript.deploymentId =
              "customdeploy_cntm_ss_create_wo_apn_ref";
            scheduledScript.params = {
              custscript_cntm_wo_info: woArr,
            };

            var taskID = scheduledScript.submit();
            log.debug("taskID :" + taskID);
            var schStatus = task.checkStatus(taskID);
            log.debug("schStatus :" + schStatus);
          }
        } catch (error) {
         log.debug('ERROR taskCallToCreateApnRecord', error);
        }
    }

    function convertDate(date1) {
      try {
        
      
        var date = new Date(date1);
        // date = date1;
        var dd = date.getDate();
        var mm = date.getMonth() + 1;
        var yyyy = date.getFullYear();
        date = mm + "/" + dd + "/" + yyyy; // change the format
        // depending on the date
        // format preferences set on
        // your account
        // log.audit('date', dd + mm + yyyy)
        return date;
      } catch (error) {
        log.error('Convert DAte error ',error);
      }
      }
    return {
        execute: execute
    }
});
