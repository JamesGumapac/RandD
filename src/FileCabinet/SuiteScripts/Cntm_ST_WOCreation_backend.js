/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
 define(["N/record", "N/runtime", "N/search", "N/task","N/format"], 
function (record, runtime, search, task,format) {
  //For creating task for lot record creation
/*WORKING FINE ST
Took 0n 06-05-2022 for customer is not setting  issue 

*/
  /**
   * Definition of the Suitelet script trigger point.
   *
   * @param {Object}
   *            context
   * @param {ServerRequest}
   *            context.request - Encapsulation of the incoming request
   * @param {ServerResponse}
   *            context.response - Encapsulation of the Suitelet response
   * @Since 2015.2
   */
  function onRequest(context) {
     log.debug('SUITELET',context.type);
	 var map = {}
     try {       
      log.debug('context.request.parameters', context.request.parameters);
        var asmWOCRecordId  = context.request.parameters.asmWOCRecordId;
        var soSubsidiary = context.request.parameters.soSubsidiary1; 
       var soCustomer = context.request.parameters.soCustomer1;
       var isintercompanyso = context.request.parameters.isintercompanyso1;
        var project =context.request.parameters.project1;
        var endcustomer= context.request.parameters.endcustomer1;
        var toolnumber =  context.request.parameters.toolnumber1;
        var item = context.request.parameters.item1;
        var soLocation = context.request.parameters.soLocation1;
        var scheduledDate = context.request.parameters.scheduledDate1;
        // log.debug('scheduledDate old ;',scheduledDate);
        scheduledDate = convertDate(scheduledDate);
        // log.debug('scheduledDate new ;',scheduledDate);

        var so_type = context.request.parameters.so_type1;
        var bom = context.request.parameters.bom1;

        var asm_uniqueKey = context.request.parameters.asm_uniqueKey1;
        log.debug('asm_uniqueKey :',asm_uniqueKey);


        

         var shipdate =  context.request.parameters.shipdate1;
        //  log.debug('shipdate old ;',shipdate);
		 if(shipdate)
         shipdate = convertDate(shipdate);
        //  log.debug('shipdate new ;',shipdate);
     

         var  routing = context.request.parameters.routing1;
         var  releasedDate = context.request.parameters.releasedDate1;
         releasedDate = convertDate(releasedDate);

         var woQty =  context.request.parameters.woQty1;
         var so = context.request.parameters.so1;
         var empName = context.request.parameters.empName1;
         var custPartNo = context.request.parameters.custPartNo1;      
        

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
          //log.debug(
          //   "bomrevisionSearchObj result count",
          //   searchResultCount
          // );
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
                      log.debug('Else errorField.includes');
                    }
                  }else{
                    log.debug('Else status.toString');
                  }
              }
    
              } catch (error) {
                  log.error('** Lookup Error',error);                
              }


              map["bomRev"] = bomRev;
              map["woId"] = woId;
              map["apn_ref"] = apn_ref;
              log.debug('map :',map)
              context.response.write(JSON.stringify(map)) ;
              // context.response.write();  
              return false;
            });
        }
        
     } catch (e) {
         log.error('ERROR IN SUITELET',e);
		 map['error']=e.message;
         context.response.write(JSON.stringify(map)) ;
      }
    
  }

  function convertDate(date1) {
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
  }

  return {
    onRequest: onRequest,
  };
});
