/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

/**
 * Module Description
 *
 *Script Name: CNTM Create Button Wo
 *Script ID: customscript_cntm_ue_create_button - 1506
 *
 * Version    Date            Author           		Remarks
 * 1.0      18-01-2021     	Sharang Kapsikar  	- Added Button on WO.
 * 2.0 		  22-01-2021	  	Vinayak Dethe   		- Added update Operations button on WO.
 * 3.0      16-03-2022      Vishal Naphade      - Added condition To show btn , As per MLO chan
 * 4.0      26-05-2022      Vishal Naphade      - Update condition to show btn,AS per Create LOT on WO creation
 */
define(["N/record", "N/ui/serverWidget", "N/search"], function (
  record,
  serverWidget,
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
  function beforeLoad(scriptContext) {
    var objRecord = scriptContext.currentRecord;
    if (scriptContext.type == "view") {
      var recordId = scriptContext.newRecord.id;
      //    		var form = serverWidget.createForm({
      //    		    title : 'Wo Record Form'
      //    		});

      scriptContext.form.clientScriptModulePath = "./CNTM_CS_Wo_Button.js";

      scriptContext.form.addButton({
        id: "custpage_print_worecord",
        label: "Print WO",
        functionName: "printFinal(" + recordId + ")",
      });

      scriptContext.form.addButton({
        id: "custpage_show_popup",
        label: "Hierarchy",
        functionName: "showPopup(" + recordId + ")",
      });

      /*
       * Button added by Vinayak For updating the operation on WO.
      1)custbody_cntm_custom_rec_ref_hide  - Lot creation on WO
      2)custbody_cntm_ref_for_btn_hide  -  Lot creation on btn click
       */

      var hide_fields_check = scriptContext.newRecord.getValue({
        fieldId: "custbody_cntm_custom_rec_ref_hide", //
      });
      log.debug("hide_fields_check :", hide_fields_check);

      if (!hide_fields_check) {
        scriptContext.form.addButton({
          id: "custpage_updatebtn",
          label: "Update BOM and Routing",
          functionName: "updateandrefresh(" + recordId + ")",
        });
      }
    }

    //	var recordId=scriptContext.newRecord.id;
    //    		var form = serverWidget.createForm({
    //    		    title : 'Wo Record Form'
    //    		});
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
  function beforeSubmit(scriptContext) {}

  /**
   * Function definition to be triggered before record is loaded.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type
   * @Since 2015.2
   */
  function afterSubmit(scriptContext) {}

  return {
    beforeLoad: beforeLoad,
    // beforeSubmit: beforeSubmit,
    // afterSubmit: afterSubmit
  };
});
