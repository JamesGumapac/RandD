/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define([
  "N/ui/serverWidget",
  "N/runtime",
  "N/record",
  "N/currentRecord",
  "N/search",
], function (serverWidget, runtime, record, currentRecord, search) {
  var mrRecord = currentRecord.get();
  function beforeLoad(scriptContext) {
    try {
      if (scriptContext.type == "create" || scriptContext.type == "edit") {
        var currentRec = scriptContext.newRecord;
        var form = scriptContext.form;

        form.clientScriptModulePath = "SuiteScripts/Cntm_CS_WO Creation.js";

        var sublistObj = form.getSublist({
          id: "routingstep",
        });

        var opnm = sublistObj.getField({
          id: "operationname",
        });
        opnm.updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

        var optnnmselect = sublistObj.addField({
          id: "custpage_optnnm_select",
          type: serverWidget.FieldType.SELECT,
          label: "Select Operation Name List",
          source: "customrecord_gate_times_and_operations_",
        });

        optnnmselect.updateBreakType({
          breakType: serverWidget.FieldBreakType.STARTROW,
        });

        var recId = currentRec.id;
        log.debug("recId=", recId);
      }

      if (scriptContext.type == "view") {
        var currentRec = scriptContext.newRecord;
        var form = scriptContext.form;

        form.clientScriptModulePath = "SuiteScripts/Cntm_CS_WO Creation.js";

        form.addButton({
          id: "custpage_update_routing_time",
          label: "Update Run Rates",
          functionName: "updateManufacturingRoutingTime(" + currentRec.id + ")",
        });

        log.debug("currentRec.id :", currentRec.id);
      }
    } catch (e) {
      log.debug("error:", e);
    }
  }

  return {
    beforeLoad: beforeLoad,
  };
});
