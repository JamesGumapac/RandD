/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(["N/record", "N/currentRecord", "N/search"], function (
  record,
  currentRecord,
  search
) {
  /**
   * Function definition to be triggered before record is loaded.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {string} scriptContext.type - Trigger type
   * @param {Form} scriptContext.form - Current form
   * @Since 2015.2
   */
  function beforeLoad(scriptContext) {}

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
    try {
      log.debug('TRIGGEREd')
      if (scriptContext.type == "edit") {
        var objRecord = scriptContext.newRecord;
        var status = objRecord.getValue({ fieldId: "status" });
        if (status == "In Process") {
          var woid = objRecord.getValue({ fieldId: "id" });
          var customer = objRecord.getValue({ fieldId: "entity" });

          log.debug("customer", customer);
          var pcb_rec = objRecord.getValue({ fieldId: "custbody_pcb_rec_id" });

          var numLines = objRecord.getLineCount({
            sublistId: "item",
          });

          log.debug("numlines", numLines);
          for (var i = 0; i < numLines; i++) {
            var bom, routing;
            var remakeWoCheck = objRecord.getSublistValue({
              sublistId: "item",
              fieldId: "custcol_cntm_is_remake_wo",
              line: i,
            });
            // log.debug("remakeWoCheck", remakeWoCheck);

            var existingWoid = objRecord.getSublistValue({
              sublistId: "item",
              fieldId: "woid",
              line: i,
            });
            // log.debug("existingWoid", existingWoid);

            // var existingWoid = objRecord.getSublistValue({
            //   sublistId: "item",
            //   fieldId: "woid",
            //   line: i,
            // });
            // log.debug("existingWoid", existingWoid);
            

            if (remakeWoCheck == true && !validateData(existingWoid)) {
              log.debug("---Line requiring wo exists---line : " ,i);

              var currentitem = objRecord.getSublistValue({
                sublistId: "item",
                fieldId: "item",
                line: i,
              });

              var currentitemtext = objRecord.getSublistText({
                sublistId: "item",
                fieldId: "item",
                line: i,
              });
              log.debug("item", currentitem);
              var woline = objRecord.getSublistValue({
                sublistId: "item",
                fieldId: "line",
                line: i,
              });
              log.debug("woline", woline);
              var qty = objRecord.getSublistValue({
                sublistId: "item",
                fieldId: "quantity",
                line: i,
              });
              log.debug("qty", qty);

              var lineNumber = objRecord.findSublistLineWithValue({
                sublistId: "item",
                fieldId: "item",
                value: currentitem,
              });

              log.debug("lineNumber", lineNumber);

              var manufacturingroutingSearchObj = search.create({
                type: "manufacturingrouting",
                filters: [
                  ["custrecord_cntm_fabrec_id", "anyof", pcb_rec],
                  "AND",
                  ["isdefault", "is", "T"],
                  "AND",
                  ["name", "contains", currentitemtext],
                ],
                columns: [
                  search.createColumn({
                    name: "name",
                    sort: search.Sort.ASC,
                    label: "Name",
                  }),
                  search.createColumn({
                    name: "billofmaterials",
                    label: "Bill of Materials",
                  }),
                  search.createColumn({ name: "location", label: "Location" }),
                  search.createColumn({
                    name: "internalid",
                    label: "Internal ID",
                  }),
                ],
              });
              var searchResultCount = manufacturingroutingSearchObj.runPaged().count;
              log.debug("manufacturingroutingSearchObj result count",searchResultCount);
              manufacturingroutingSearchObj.run().each(function (result) {
                bom = result.getValue(
                  search.createColumn({
                    name: "billofmaterials",
                    label: "Bill of Materials",
                  })
                );
                routing = result.getValue(
                  search.createColumn({
                    name: "internalid",
                    label: "Internal ID",
                  })
                );
                return false;
              });

              createremakewo(woid,woline,currentitem,qty,bom,routing,customer);
            }
          }
        }
      }
    } catch (error) {
      log.debug("Error occured", error);
    }
  }
  
  function createremakewo(woid,woline,item,qty,bom,routing,customer) {
    try {
      var params = {
        soid: woid,
        soline: woline,
        specord: "T",
        assemblyitem: item,
      };

      var workOrder = record.create({
        type: record.Type.WORK_ORDER,
        // isDynamic: true,
        defaultValues: params,
      });

      workOrder.setValue({
        fieldId: "billofmaterials",
        value: bom,
      });

      workOrder.setValue({
        fieldId: "entity",
        value: customer,
      });

      workOrder.setValue({
        fieldId: "manufacturingrouting",
        value: routing,
      });
      workOrder.setValue({
        fieldId: "quantity",
        value: qty,
      });

      var woId = workOrder.save({
        enableSourcing: true,
        ignoreMandatoryFields: true,
      });
      log.debug({ title: "woId", details: woId });
    } catch (error) {
      log.debug("error in creating wo", error);
    }
  }
  function validateData(data) {
    if (data != undefined && data != null && data != "") {
      return true;
    } else {
      return false;
    }
  }

  return {
    // beforeLoad: beforeLoad,
    // beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit,
  };
});
