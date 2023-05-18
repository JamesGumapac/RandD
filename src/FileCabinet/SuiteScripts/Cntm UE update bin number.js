/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @scriptname
 * @ScriptId
 * @author        Vishal Naphade
 * @email
 * @date
 * @description
 * @Script_id
 *
 * Copyright 2020, Centium Consulting its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 * Module Description
 *
 * Sr. No   	 Date           	  Author                  	Remarks
 * 1
 */

define(["N/record", "N/runtime", "N/search", "N/ui/serverWidget", "N/task"], /**
 * @param {record}
 *            record
 * @param {runtime}
 *            runtime
 * @param {search}
 *            search
 * @param {serverWidget}
 *            serverWidget
 */ function (record, runtime, search, serverWidget, task) {
  /**
   * Function definition to be triggered before record is loaded.
   *
   * @param {Object}
   *            scriptContext
   * @param {Record}
   *            scriptContext.newRecord - New record
   * @param {string}
   *            scriptContext.type - Trigger type
   * @param {Form}
   *            scriptContext.form - Current form
   * @Since 2015.2
   */
  function beforeLoad(scriptContext) {}

  /**
   * Function definition to be triggered before record is loaded.
   *
   * @param {Object}
   *            scriptContext
   * @param {Record}
   *            scriptContext.newRecord - New record
   * @param {Record}
   *            scriptContext.oldRecord - Old record
   * @param {string}
   *            scriptContext.type - Trigger type
   * @Since 2015.2
   */
  function afterSubmit(scriptContext) {
    log.audit(
      "AFTER SUBMIT :" + scriptContext.newRecord.id,
      "TYPE :" + scriptContext.type
    );
    try {
      //   if (scriptContext.type == "create" || scriptContext.type == "edit") {
      if (scriptContext.type == "edit" || scriptContext.type == "create" || scriptContext.type == "copy" ) {
        var soId = scriptContext.newRecord.id;
        var soObj = record.load({
          type: record.Type.SALES_ORDER,
          id: soId,
        //   isDynamic : true
        });

        var soSublistCount = soObj.getLineCount({
          sublistId: "item",
        });
        log.debug('soSublistCount :',soSublistCount);

        if (soSublistCount > 0) {
          for (var index = 0; index < soSublistCount; index++) {
            log.debug('--START---')

            // check field value and then procced
            // if( (soObj.getSublistValue({sublistId: "item",fieldId: "custcol_cntm_to_process_bin_number",line: index,}) == true) && (soObj.getSublistValue({sublistId: "item",fieldId: "custcol_cntm_item_subtype",line: index,}) == '1')){
            if( (soObj.getSublistValue({sublistId: "item",fieldId: "custcol_cntm_to_process_bin_number",line: index,}) == true) ){

                log.debug('---SO Line---')
                var location = soObj.getSublistValue({
                    sublistId: "item",
                    fieldId: "location",
                    line: index,
                  });
                  log.debug("location :", location);
      
                  var item = soObj.getSublistValue({
                    sublistId: "item",
                    fieldId: "item",
                    line: index,
                  });
                  log.debug("item :", item);
      
                  if(checkInvoice(item, location)){
                    soObj.setSublistValue({
                      sublistId: 'item',
                      fieldId: 'custcol_cntm_to_process_bin_number',
                      line: index,
                      value: false
                  });

                  }

                // soObj.commitLine({
                //     sublistId: 'item',
                //     // ignoreRecalc: boolean
                // })
            }
           

          }
        }
        var newSoId = soObj.save();
        log.debug('newSoId :',newSoId);
      }
    } catch (error) {
      log.error("error in after Submit :", error);
    }
  }

  function checkInvoice(item, location) {
    try {
        
    var binDetailsMap = {}
    var locationArray = [];
    binDetailsMap['binnumber'] = getBinNumber(location)

    if(binDetailsMap.hasOwnProperty('binnumber')){
        binDetailsMap['location'] = location;
    }

    log.debug('binDetailsMap :',binDetailsMap);
    // var invObj ;
    // try {
      // log.debug('try')
      var invObj = record.load({
        // type: record.Type.LOT_NUMBERED_ASSEMBLY_ITEM, //assembly item
        type: record.Type.ASSEMBLY_ITEM, //assembly item
        id: item,
        isDynamic : true
      });
      
    // } catch (error) {
    //   log.debug('catch')
    //   invObj =  record.load({
    //    type: record.Type.LOT_NUMBERED_INVENTORY_ITEM,
    //    id: item,
    //    isDynamic : true
    //  });
      
    // }

    var invoiceSublistCount = invObj.getLineCount({
      sublistId: "binnumber",
    });
    log.debug('invoiceSublistCount :',invoiceSublistCount);

    if (invoiceSublistCount == 0) {
        // newSelectLine(invObj,binDetailsMap)
        invObj.selectNewLine({
            sublistId: "binnumber",
          });
    
        invObj.setCurrentSublistValue({
            sublistId: "binnumber",
            fieldId: "location",
            value: binDetailsMap.location,
          });
          invObj.setCurrentSublistValue({
            sublistId: "binnumber",
            fieldId: "binnumber",
            value: binDetailsMap.binnumber,
          });
          invObj.setCurrentSublistValue({
            sublistId: "binnumber",
            fieldId: "preferredbin",
            value: true,
          });
    
          invObj.commitLine({
            sublistId: "binnumber",
          });
    }
    else {
      for (var i = 0; i <invoiceSublistCount; i++) {
        locationArray.push(invObj.getSublistValue({sublistId: "binnumber",fieldId: "location", line : i}));
      }
      log.debug('locationArray :',locationArray);
      if(!locationArray.includes(location)){
        log.debug('--INSIDE CONDITION--');
        // newSelectLine(invObj,binDetailsMap)
        invObj.selectNewLine({
            sublistId: "binnumber",
          });
    
        invObj.setCurrentSublistValue({
            sublistId: "binnumber",
            fieldId: "location",
            value: binDetailsMap.location,
          });
          invObj.setCurrentSublistValue({
            sublistId: "binnumber",
            fieldId: "binnumber",
            value: binDetailsMap.binnumber,
          });
          invObj.setCurrentSublistValue({
            sublistId: "binnumber",
            fieldId: "preferredbin",
            value: true,
          });
    
          invObj.commitLine({
            sublistId: "binnumber",
          });
        }
    }
    //seting value to false
    var savedInv = invObj.save();
    log.debug("savedInv :", savedInv);
    return true;
  
    } catch (error) {
      log.error('Error in checkInvoice :',error)  
      return false;
    }
  }

  function newSelectLine(invObj,binDetailsMap){
    try {
        
    invObj.selectNewLine({
        sublistId: "binnumber",
      });

      invObj.setCurrentSublistValue({
        sublistId: "binnumber",
        fieldId: "location",
        value: binDetailsMap.location,
      });
      invObj.setCurrentSublistValue({
        sublistId: "binnumber",
        fieldId: "binnumber",
        value: binDetailsMap.binnumber,
      });
      invObj.setCurrentSublistValue({
        sublistId: "binnumber",
        fieldId: "preferredbin",
        value: true,
      });

      invObj.commitLine({
        sublistId: "binnumber",
      });

      return true;
    } catch (error) {
        log.error('Error in newSelectLine :',error)  
    }
  }
  function getBinNumber(loc) {
    try {
        var binNo;
    var customrecord_cntm_location_bin_mapSearchObj = search.create({
        type: "customrecord_cntm_location_bin_map",
        filters: [["custrecord_cntm_location_so", "anyof", loc]],
        columns: [
          search.createColumn({
            name: "custrecord_cntm_location_so",
            label: "Location",
          }),
          search.createColumn({
            name: "custrecord_cntm_bin_number_so",
            label: "Bin Number",
          }),
        ],
      });
      var searchResultCount =
        customrecord_cntm_location_bin_mapSearchObj.runPaged().count;
      log.debug(
        "customrecord_cntm_location_bin_mapSearchObj result count",
        searchResultCount
      );
      customrecord_cntm_location_bin_mapSearchObj.run().each(function (result) {
        // .run().each has a limit of 4,000 results
         binNo = result.getValue({
          name: "custrecord_cntm_bin_number_so",
          label: "Bin Number",
        });
        return false;
      });
  
      return binNo;
    
    } catch (error) {
  log.error('Error in getBinNumber :',error)      
    }
  }

  return {
    beforeLoad: beforeLoad,
    afterSubmit: afterSubmit,
  };
});


/**
 client sccript code 
  if (context.sublistId == "item" && context.fieldId == "location" ) {
   
       var currentRecord = context.currentRecord;
       currentRecord.setCurrentSublistValue({
         sublistId: "item",
         fieldId: "custcol_cntm_toprocess", //to create field in netsuite
         value: true,
         ignoreFieldChange:true
       })

   }
 */