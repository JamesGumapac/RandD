/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @scriptname    Cntm UE WO Creation
 * @ScriptId      customscript_cntm_ue_wo_creation
 * @author        Vishal Naphade
 * @email         vishal.naphade@centium.net
 * @date
 * @description
 * @Script_id    1466
 *
 * Copyright 2020, Centium Consulting its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 * Module Description
 *
 * Sr. No   	 Date           	  Author                  	Remarks
 * 1		    06-05-2022      Vishal Naphade         customer is not setting  issue
 * 2			12-05-2022         Vishal Naphade       Remove linestatus 13 from condition
 * 3      13-10-2022         Vishal Naphade       - added condition for create -workorder (before)
 *
 *
 */
define([
  "N/record",
  "N/runtime",
  "N/search",
  "N/ui/serverWidget",
  "N/task",
  "N/redirect",
  "N/file",
  "N/error",
  "N/email",
  "N/config",
  "N/url",
  "N/https",
], /**
 * @param {record}
 *            record
 * @param {runtime}
 *            runtime
 * @param {search}
 *            search
 * @param {serverWidget}
 *            serverWidget
 */ function (
  record,
  runtime,
  search,
  serverWidget,
  task,
  redirect,
  file,
  error,
  email,
  config,
  url,
  https
) {
  var parmsSet;
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
  function beforeLoad(scriptContext) {
    log.emergency(
      "runtime.ContextType.USER_INTERFACE :",
      runtime.ContextType.USER_INTERFACE
    );
    if (runtime.executionContext === runtime.ContextType.USER_INTERFACE) {
      var currentRec = scriptContext.newRecord;
      var form = scriptContext.form;

      // form.clientScriptModulePath = 'SuiteScripts/Cntm_CS_WO Creation.js';// clientScriptFileId
      form.clientScriptModulePath = "./Cntm_CS_WO Creation.js"; // clientScriptFileId
      //

      //log.debug("currentRec.type", currentRec.type);
      if (scriptContext.type == "copy") {
        //log.debug("copy");
        if (
          currentRec.type == "customrecord_cntm_asm_wocreation" ||
          currentRec.type == "customrecord_cntm_wo_bom_import_fab"
        ) {
          //log.debug("in");
          var errorObj = error.create({
            name: "Not Authorized",
            message: "Not allow to copy this record.",
            notifyOff: true,
          });
          //log.debug("errorObj", JSON.stringify(errorObj));
          throw errorObj;
        }
      }
      if (scriptContext.type == "view") {
        if (currentRec.type == "salesorder") {
          var presentItems = isItemPresent(currentRec);
          if (presentItems.fabFlag == true)
            var button = form.addButton({
              id: "custpage_create_wo_fab",
              label: "PCB WO",
              functionName: "woCreateFab",
            });
          if (presentItems.asmFlag == true)
            var asmButton = form.addButton({
              id: "custpage_create_wo_asm",
              label: "ASM WO",
              functionName: 'woCreateAsm("ASM")',
            });
          if (presentItems.rdisFlag == true)
            var asmButton = form.addButton({
              id: "custpage_create_wo_rdis",
              label: "RDIS WO",
              functionName: 'woCreateAsm("RDIS")',
            });
        }
        if (currentRec.type == "customrecord_cntm_asm_wocreation") {
          //log.debug("in view");
          // var form = scriptContext.form;
          var params = scriptContext.request.parameters;

          if (params.qty) {
            var soQty = currentRec.getValue({
              fieldId: "custrecord_sntm_so_qunty_asmwocreation",
              // value: params.qty,
            });
            if (params.qty != soQty) {
              //log.debug()
              record.submitFields({
                type: "customrecord_cntm_asm_wocreation",
                id: currentRec.id,
                values: {
                  custrecord_sntm_so_qunty_asmwocreation: params.qty,
                },
              });
              redirect.toRecord({
                type: "customrecord_cntm_asm_wocreation",
                id: currentRec.id,
                parameters: params,
              });
            }
          }
          var button = form.addButton({
            id: "custpage_delete_wo",
            label: "Delete WO",
            functionName: "deleteWO",
          });
          currentRec.setValue({
            fieldId: "custrecord_cntm_new_routing",
            value: false,
          });
        }

        if (currentRec.type == "customrecord_cntm_wo_bom_import_fab") {
          var params = scriptContext.request.parameters;

          if (params.qty) {
            var soQty = currentRec.getValue({
              fieldId: "custrecord_cntm_so_qty_fab",
              // value: params.qty,
            });
            if (params.qty != soQty) {
              record.submitFields({
                type: "customrecord_cntm_wo_bom_import_fab",
                id: currentRec.id,
                values: {
                  custrecord_cntm_so_qty_fab: params.qty,
                },
              });
              redirect.toRecord({
                type: "customrecord_cntm_wo_bom_import_fab",
                id: currentRec.id,
                parameters: params,
              });
            }
          }
          var status = currentRec.getValue({
            fieldId: "custrecord_cntm_status_fab_wo_crtn",
          });
          if (status == 6) {
            var isRepJob = currentRec.getValue({
              fieldId: "custrecord_cntm_repeat_job_fab",
            });
            var isNewRev = currentRec.getValue({
              fieldId: "custrecord_cntm_new_to_existing_bom",
            });
            //log.debug("isRepJob: " + isRepJob, "isNewRev: " + isNewRev);
            if (isRepJob == false || isNewRev == true) {
              var button = form.addButton({
                id: "custpage_reprocess_BOM",
                label: "Reprocess",
                functionName: "reprocessBOM",
              });
            }
          }
        }
        if (
          currentRec.type == "customrecord_cntm_asm_wocreation" ||
          currentRec.type == "customrecord_cntm_wo_bom_import_fab"
        ) {
          var refreshButton = form.addButton({
            id: "custpage_refresh",
            label: "Refresh",
            functionName: "refresh",
          });
        }
        // Changes - vishal - lot creation to be on work order

        //Following code is moved in 'Cntm_UE_lot_and_rec'  -- FOR LOT ON CREATION OF WO
        /*
            if (currentRec.type == "workorder") {
              // custbody_cntm_is_asm_wo - ASM check box
              ////////////////////////////////////
              // currentRec.setValue({
              //   fieldId : 'custbody_cntm_hidden_for_woi',
              //   value :false
              // });
  
              // IS ASM check box
              var isPcb_wo = currentRec.getValue({
                fieldId: "custbody_cntm_is_asm_wo",
              });
  
              if (!isPcb_wo) {
                // PCB work order
                var woId = currentRec.id;
                //log.debug("woId :", woId);
  
                var hide_fields_check = currentRec.getValue({
                  fieldId: "custbody_cntm_ref_for_btn_hide",
                });
                //log.debug("hide_fields_check :", hide_fields_check);
  
                if (!hide_fields_check) {
                  // False
                  //log.debug("hide_fields_check FALSE");
  
                  form.removeButton("entercompletionwithbackflush");
                  form.removeButton("issuecomponents");
                  form.removeButton("entercompletion");
                  form.clientScriptModulePath =
                    "./Cntm_CS_WO_check_box_and_function.js"; // For
  
                  form.addButton({
                    id: "custpage_create_lot",
                    label: "Create Client App Operations",
                    functionName: "createlot(" + woId + ")",
                  });
                } else {
                  form.removeButton("custpage_updatebtn");
                }
              }
            } // End WO
            */
      }
      if (currentRec.type == "workorderissue") {
        try {
          var sublist = "component";
          var header = "componentheader";
          var row = "componentrow";
          if (currentRec.type == "workorder") {
            sublist = "item";
            header = "item_headerrow";
            row = "item_row_";
          }
          var DOMFieldMapping =
            currentRec.getValue({
              fieldId: "custbody_cntm_comp_line_fld_map",
            }) || "{}";
          DOMFieldMapping = JSON.parse(DOMFieldMapping);

          // Added by lc for picklist printout
          form.addField({
            id: "custpage_newfield",
            label: "JSON",
            type: "inlinehtml",
          }).defaultValue =
            "<script>" +
            "jQuery(document).ready(function() {" +
            "nlapiSetFieldValue('custbody_cntm_comp_line_fld_map', '" +
            JSON.stringify(DOMFieldMapping) +
            "');" +
            "console.log('>>>>>>>', nlapiGetFieldValue('custbody_cntm_comp_line_fld_map'));" +
            "})" +
            "</script>";

          form.addField({
            id: "custpage_componentflds",
            label: "DOM Handler",
            type: "inlinehtml",
          }).defaultValue =
            "<script>var CUSTSUPP_COL_LABEL = 'CUSTOMER SUPPLIED PART'; " +
            "var BAGNTAG_COL_LABEL  = 'BAG AND TAG';" +
            "var STACKED_COL_LABEL  = 'STACKED';" +
            "var SPECPART_COL_LABEL = 'SPECIFIC PART';console.log('1');" +
            "var DOMFieldMapping = " +
            JSON.stringify(DOMFieldMapping) +
            ";" +
            "console.log(typeof DOMFieldMapping, DOMFieldMapping);" +
            "$ = jQuery;" +
            "$(document).ready(function() {" +
            "$('#" +
            sublist +
            "_splits').find('tr[id*=\"" +
            header +
            "\"]').each(function(i){" +
            '$(this).find(\'td\').eq(0).after(\'<td height="100%" style="" class="listheadertd listheadertextb uir-column-large" data-label="\'+SPECPART_COL_LABEL+\'"><div class="listheader">\'+SPECPART_COL_LABEL+\'</div></td>\');' +
            '$(this).find(\'td\').eq(0).after(\'<td height="100%" style="" class="listheadertd listheadertextb uir-column-large" data-label="\'+STACKED_COL_LABEL+\'"><div class="listheader">\'+STACKED_COL_LABEL+\'</div></td>\');' +
            '$(this).find(\'td\').eq(0).after(\'<td height="100%" style="" class="listheadertd listheadertextb uir-column-large" data-label="\'+BAGNTAG_COL_LABEL+\'"><div class="listheader">\'+BAGNTAG_COL_LABEL+\'</div></td>\');' +
            '$(this).find(\'td\').eq(0).after(\'<td height="100%" style="" class="listheadertd listheadertextb uir-column-large" data-label="\'+CUSTSUPP_COL_LABEL+\'"><div class="listheader">\'+CUSTSUPP_COL_LABEL+\'</div></td>\');' +
            "});" +
            "$('#" +
            sublist +
            "_splits').find('tr[id*=\"" +
            row +
            "\"]').each(function (i) {" +
            "var cs_val = 'No'; var bt_val = 'No'; var st_val = 'No'; var sp_val = 'No';" +
            "if (DOMFieldMapping[i]) {" +
            "if (DOMFieldMapping[i].custsupplied)" +
            "cs_val = 'Yes';" +
            "if (DOMFieldMapping[i].bagntag)" +
            "bt_val = 'Yes';" +
            "if (DOMFieldMapping[i].stacked)" +
            "st_val = 'Yes';" +
            "if (DOMFieldMapping[i].specificpart)" +
            "sp_val = 'Yes';" +
            "}" +
            "$(this).find('td').eq(0).after('<td>'+sp_val+'</td>');" +
            "$(this).find('td').eq(0).after('<td>'+st_val+'</td>');" +
            "$(this).find('td').eq(0).after('<td>'+bt_val+'</td>');" +
            "$(this).find('td').eq(0).after('<td>'+cs_val+'</td>');" +
            "});" +
            "});" +
            "</script>";
          // }
        } catch (e) {
          //log.debug("Error workOrderIssueDOMHandler_CS2.js", e.message);
        }
      }
      if (currentRec.type == "manufacturingrouting") {

        log.audit('-----scriptContext------', scriptContext.type);
        var curInstructions = currentRec.getValue({
          fieldId: "custrecord_routing_instructions",
        });
        var sublist = form.getSublist({
          id: "routingstep",
        });
        sublist.addField({
          id: "custpage_fab_instructions",
          type: serverWidget.FieldType.TEXTAREA,
          label: "Instructions",
        });

        if (scriptContext.type == "view" || scriptContext.type == "edit") {
          try {
            log.audit("curInstructions", curInstructions);
            if (!curInstructions) {
              curInstructions = "{}";
            }
            var instObj = JSON.parse(curInstructions);
            var rsLines = currentRec.getLineCount({
              sublistId: "routingstep",
            });
            // log.audit("rsLines", rsLines);
            for (var i = 0; i < rsLines; i++) {
              var opSequence = sublist.getSublistValue({
                id: "operationsequence",
                line: i,
              });
              if (instObj[opSequence]) {
                // log.audit("instObj[opSequence]=", instObj[opSequence]);
                sublist.setSublistValue({
                  id: "custpage_fab_instructions",
                  line: i,
                  value: instObj[opSequence],
                });
              }
              if (curInstructions == "{}") {
                sublist.setSublistValue({
                  id: "custpage_fab_instructions",
                  line: i,
                  value: " ",
                });
                break;
              }
              /*
               * else { sublist.setSublistValue({ id:
               * 'custpage_fab_instructions', line: i, value: "" }); }
               */
            }
          } catch (e) {
            log.error("Error", e);
          }
        }

        /*
         * var sublist = form.addSublist({ id : 'custpage_fab_instructions',
         * type : serverWidget.SublistType.INLINEEDITOR, label :
         * 'Instructions' }); sublist.addField({ id:
         * 'custpage_fab_instructions12', type: ui.FieldType.TEXT, label:
         * 'Text Field' });
         */
      }
      if (currentRec.type == "customrecord_cntm_asm_wocreation") {
        var hideField = scriptContext.form.addField({
          id: "custpage_hide_fields",
          label: "Hidden",
          type: serverWidget.FieldType.INLINEHTML,
        });

        var src = "";
        // hiding buttons
        src += 'jQuery("#attach").hide();';
        src += 'jQuery("#customize").hide();';

        src += 'jQuery("#tbl_changeid").hide();';

        src += 'jQuery("#inpt_searchid1").hide();';
        src += 'jQuery("#inpt_searchid1_arrow").hide();';
        src +=
          'jQuery("#recmachcustrecord_cntm_asmwoqty_searchid_fs_lbl_uir_label").hide();';
        src +=
          'jQuery("#recmachcustrecord_cntm_asmwoqty_existingrecmachcustrecord_cntm_asmwoqty_fs_lbl_uir_label").hide();';

        src +=
          'jQuery("#recmachcustrecord_cntm_asmwoqty_existingrecmachcustrecord_cntm_asmwoqty_display").hide();';

        src +=
          'jQuery("#parent_actionbuttons_recmachcustrecord_cntm_asmwoqty_existingrecmachcustrecord_cntm_asmwoqty_fs").hide();';
        src += 'jQuery("#tdbody_attach").hide();';
        src += 'jQuery("#tbl_customize").hide();';
        src +=
          'jQuery("#existingrecmachcustrecord_cntm_asmwoqty_popup_muli").hide();';
        src +=
          'jQuery("#recmachcustrecord_cntm_asmwoqty_existingrecmachcustrecord_cntm_asmwoqty_fs").hide();';

        log.audit(src);
        // default the 'src' data in the created inline html
        // field
        hideField.defaultValue =
          "<script>jQuery(function($){require([], function(){" +
          src +
          ";})})</script>";
      }
      if (currentRec.type == "customrecord_cntm_wo_bom_import_fab") {
        var hideField = scriptContext.form.addField({
          id: "custpage_hide_fields",
          label: "Hidden",
          type: serverWidget.FieldType.INLINEHTML,
        });

        var src = "";

        // hiding buttons
        src += 'jQuery("#attach").hide();';
        src += 'jQuery("#customize").hide();';
        src += 'jQuery("#tbl_changeid").hide();';
        src += 'jQuery("#inpt_searchid1").hide();';
        src += 'jQuery("#inpt_searchid1_arrow").hide();';
        src +=
          'jQuery("#recmachcustrecord_cntm_fab_wo_creation_searchid_fs_lbl_uir_label").hide();';
        src +=
          'jQuery("#recmachcustrecord_cntm_fab_wo_creation_existingrecmachcustrecord_cntm_fab_wo_creation_fs_lbl_uir_label").hide();';

        src +=
          'jQuery("#recmachcustrecord_cntm_fab_wo_creation_existingrecmachcustrecord_cntm_fab_wo_creation_display").hide();';
        src += 'jQuery("#newrec515").hide();';
        src += 'jQuery("#uir-listheader-button-table").hide();';
        src +=
          'jQuery("#parent_actionbuttons_recmachcustrecord_cntm_fab_wo_creation_existingrecmachcustrecord_cntm_fab_wo_creation_fs").hide();';
        src += 'jQuery("#tdbody_attach").hide();';
        src += 'jQuery("#tbl_customize").hide();';
        src +=
          'jQuery("#existingrecmachcustrecord_cntm_fab_wo_creation_popup_muli").hide();';
        src +=
          'jQuery("#recmachcustrecord_cntm_fab_wo_creation_existingrecmachcustrecord_cntm_fab_wo_creation_fs").hide();';

        log.audit(src);
        // default the 'src' data in the created inline html
        // field
        hideField.defaultValue =
          "<script>jQuery(function($){require([], function(){" +
          src +
          ";})})</script>";

        /*
         * var inline_html = form.addField({ id: 'custpage_loader',
         * label:'HTMLFIELD', type: serverWidget.FieldType.INLINEHTML });
         * inline_html.defaultValue = '<script
         * type="text/javascript">function
         * preloadFunc(){jQuery("head").append("<script id=cntm_lib_loader
         * src=https://cdn.jsdelivr.net/npm/gasparesganga-jquery-loading-overlay@2.1.5/dist/loadingoverlay.min.js><script>");setTimeout(function(){jQuery.LoadingOverlay("show");},100)}window.onpaint =
         * preloadFunc();</script>';
         */

        var status = currentRec.getValue({
          fieldId: "custrecord_cntm_status_fab_wo_crtn",
        });
        if (status == 8) {
          var isNewJob = currentRec.getValue({
            fieldId: "custrecord_cntm_new_job_fab",
          });
          if (isNewJob == true || isNewJob == "T")
            var buttonBom = form.addButton({
              id: "custpage_update_bom",
              label: "Update BOM & Routing",
              functionName: "updateBomAndRouting",
            });
          var button = form.addButton({
            id: "custpage_create_lot",
            label: "Update Routing",
            functionName: "createLotAndRouting",
          });
        }
        var mfgFileFld = form.getField({
          id: "custrecord_cntm_mfg_routing_filr_fab",
        });
        /*
         * if (!currentRec.getValue({ fieldId : 'custrecord_cntm_bom_fab'
         * })) {
         *
         * if (isNotEmpty(mfgFileFld)) mfgFileFld .updateDisplayType({
         * displayType : serverWidget.FieldDisplayType.DISABLED }); }
         */
        var mfgFld = form.getField({
          id: "custrecord_cntm_mfg_routing_fab",
        });
        var status = currentRec.getValue({
          fieldId: "custrecord_cntm_status_fab_wo_crtn",
        });
        var newRevExistingBOM = currentRec.getValue({
          fieldId: "custrecord_cntm_new_to_existing_bom",
        });

        if (status >= 6 && status != 9 && status != 10 && status != 12) {
          var params = scriptContext.request.parameters;
          //log.debug("params", params);
          if (scriptContext.type == "edit" && params.reprocess == "T") {
            if (isNotEmpty(mfgFileFld))
              mfgFileFld.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY,
              });
          } else if (isNotEmpty(mfgFileFld))
            mfgFileFld.updateDisplayType({
              displayType: serverWidget.FieldDisplayType.INLINE,
            });
          isNotEmpty(mfgFld);
          mfgFld.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE,
          });
        } else if (isNotEmpty(mfgFld))
          /*
           * else if(status=='4' && newRevExistingBOM==true){}
           */
          mfgFld.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN,
          });

        if (status >= 4 && status != 9 && status != 10 && status != 11) {
          if (isNotEmpty(form.getField({ id: "custrecord_cntm_new_job_fab" })))
            form
              .getField({ id: "custrecord_cntm_new_job_fab" })
              .updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED,
              });
          if (
            isNotEmpty(form.getField({ id: "custrecord_cntm_repeat_job_fab" }))
          )
            form
              .getField({ id: "custrecord_cntm_repeat_job_fab" })
              .updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED,
              });
          if (
            isNotEmpty(
              form.getField({ id: "custrecord_cntm_new_to_existing_bom" })
            )
          )
            form
              .getField({ id: "custrecord_cntm_new_to_existing_bom" })
              .updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED,
              });

          //Code added by vishal on 24-08-2022
          if (
            isNotEmpty(
              form.getField({ id: "custrecord_cntm_create_new_routing_fab" })
            )
          )
            form
              .getField({ id: "custrecord_cntm_create_new_routing_fab" })
              .updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED,
              });
        }

        var sublist = form.getSublist({
          id: "recmachcustrecord_cntm_fab_wo_creation",
        });
        if (isNotEmpty(sublist)) {
          var woNoFld = sublist.getField({
            id: "custrecord_cntm_wo_number_fabwo_crtn",
          });

          if (isNotEmpty(woNoFld))
            woNoFld.updateDisplayType({
              displayType: serverWidget.FieldDisplayType.DISABLED,
            });
        }
      }
      if (scriptContext.type == "create" ) {
        log.audit("in create", "currentRec.type :" + currentRec.type);
        var params = scriptContext.request.parameters;
        //log.debug("params", params);
        if (isNotEmpty(params) && params) {
          if (currentRec.type == "customrecord_cntm_wo_bom_import_fab") {
            if (params.item)
              currentRec.setValue({
                fieldId: "custrecord_cntm_fab_item",
                value: params.item,
              });
            if (params.salesOrder)
              currentRec.setValue({
                fieldId: "custrecord_cntm_sales_order_fab",
                value: params.salesOrder,
              });
            if (params.qty)
              currentRec.setValue({
                fieldId: "custrecord_cntm_so_qty_fab",
                value: params.qty,
              });
            var rec = record.load({
              id: params.salesOrder,
              type: "salesorder",
              // isDynamic : true
            });
            var lineCount = rec.getLineCount({
              sublistId: "item",
            });
            var expShipDt;
            for (var i = 0; i < lineCount; i++) {
              var subtype = rec.getSublistText({
                sublistId: "item",
                fieldId: "custcol_cntm_item_subtype",
                line: i,
              });
              //log.debug(subtype, "FAB");
              // alert(subtype+' '+type);
              if (subtype == "FAB") {
                expShipDt = rec.getSublistValue({
                  sublistId: "item",
                  fieldId: "expectedshipdate",
                  line: i,
                });
                break;
              }
            }
            if (expShipDt) {
              //log.debug("params.expShipDt", new Date(params.expShipDt));
              currentRec.setValue({
                fieldId: "custrecord_cntm_so_expctd_ship_dt",
                value: expShipDt,
              });
            }
            if (params.isInterco)
              currentRec.setValue({
                fieldId: "custrecord_cntm_is_interco_tran",
                value: true,
              });
            if (params.isCon)
              currentRec.setValue({
                fieldId: "custrecord_cntm_is_con",
                value: true,
              });
            if (
              params.isMLO &&
              (params.isMLO == true ||
                params.isMLO == "true" ||
                params.isMLO == "T")
            )
              currentRec.setValue({
                fieldId: "custrecord_cntm_mlo",
                value: true,
              });
            if (params.lineKey)
              currentRec.setValue({
                fieldId: "custrecord_cntm_so_line_unique_key",
                value: params.lineKey,
              });
            var soLookUp = search.lookupFields({
              type: "salesorder",
              id: params.salesOrder,
              columns: [
                "custbody_cntm_tool_number",
                "custbody_rda_sales_order_type",
              ],
            });
            if (soLookUp.custbody_rda_sales_order_type[0]) {
              currentRec.setValue({
                fieldId: "custrecord_cntm_so_release_type",
                value: soLookUp.custbody_rda_sales_order_type[0].value,
              });
            }
            if (soLookUp.custbody_cntm_tool_number[0])
              var toolNum = soLookUp.custbody_cntm_tool_number[0].value;
            var bomSearchObj = search.create({
              type: "bom",
              filters: [
                ["restricttoassemblies", "anyof", params.item],
                "AND",
                ["custrecord_cntm_tool_number", "anyof", toolNum],
              ],
              columns: [
                search.createColumn({
                  name: "name",
                  label: "Name",
                }),
                search.createColumn({
                  name: "revisionname",
                  label: "Revision : Name",
                }),
              ],
            });
            var newJobFld = form.getField({
              id: "custrecord_cntm_new_job_fab",
            });
            var repJobFld = form.getField({
              id: "custrecord_cntm_repeat_job_fab",
            });

            var searchResultCount = bomSearchObj.runPaged().count;
            //log.debug("bomSearchObj result count", searchResultCount);
            if (searchResultCount > 0) {
              bomSearchObj.run().each(function (result) {
                // .run().each has a
                // limit
                // of 4,000 results

                currentRec.setValue({
                  fieldId: "custrecord_cntm_bom_fab",
                  value: result.id,
                });

                var manufacturingroutingSearchObj1 = search.create({
                  type: "manufacturingrouting",
                  filters: [
                    ["isdefault", "is", "T"],
                    "AND",
                    ["billofmaterials", "anyof", result.id],
                  ],
                  columns: [
                    search.createColumn({
                      name: "name",
                      sort: search.Sort.ASC,
                    }),
                    "billofmaterials",
                    "location",
                    "isdefault",
                  ],
                });
                var searchResultCount1 =
                  manufacturingroutingSearchObj1.runPaged().count;
                log.debug(
                  "manufacturingroutingSearchObj1 result count",
                  searchResultCount1
                );
                manufacturingroutingSearchObj1.run().each(function (result1) {
                  // .run().each has a limit of 4,000 results
                  currentRec.setValue({
                    fieldId: "custrecord_cntm_mfg_routing_fab",
                    value: result1.id,
                  });
                  return true;
                });

                currentRec.setValue({
                  fieldId: "custrecord_cntm_new_job_fab",
                  value: false,
                });
                currentRec.setValue({
                  fieldId: "custrecord_cntm_repeat_job_fab",
                  value: true,
                });
                newJobFld.updateDisplayType({
                  displayType: serverWidget.FieldDisplayType.DISABLED,
                });
                repJobFld.updateDisplayType({
                  displayType: serverWidget.FieldDisplayType.DISABLED,
                });
                return false;
              });
            } else {
              newJobFld.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED,
              });
              repJobFld.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED,
              });
            }
            /*
             * if (params.expShipDt){
             * //currentRec.selectLine({sublistId:'recmachcustrecord_cntm_fab_wo_creation',line:0});
             * currentRec.setSublistValue({sublistId:'recmachcustrecord_cntm_fab_wo_creation',fieldId:'custrecord_cntm_exp_ship_date',value:new
             * Date(params.expShipDt),line:0}); }
             */
          }
          if (currentRec.type == "customrecord_cntm_asm_wocreation") {
            //Changes for unique key

            if (params.lineKey) {
              currentRec.setValue({
                fieldId: "custrecord_cntm_asm_so_line_uni_key",
                value: params.lineKey,
              });
            }

            if (params.item)
              currentRec.setValue({
                fieldId: "custrecord_cntm_asm_item",
                value: params.item,
              });

            if (params.salesOrder)
              currentRec.setValue({
                fieldId: "custrecord_so_number_asmwo",
                value: params.salesOrder,
              });
            if (params.qty)
              currentRec.setValue({
                fieldId: "custrecord_sntm_so_qunty_asmwocreation",
                value: params.qty,
              });
            if (params.location)
              currentRec.setValue({
                fieldId: "custrecord_cntm_so_location_asm_wo",
                value: params.location,
              });

            // ******************************************************************************

            var form = scriptContext.form;
            var rec = record.load({
              id: params.salesOrder,
              type: "salesorder",
            });
            var toolnum = rec.getValue({
              fieldId: "custbody_cntm_tool_number",
            });
            var project = rec.getValue({
              fieldId: "custbody_cntm_project",
            });
            var intercomptran = rec.getValue({
              fieldId: "intercotransaction",
            });
            var so_type = rec.getValue({
              fieldId: "custbody_rda_sales_order_type",
            });
            currentRec.setValue({
              fieldId: "custrecord_cntm_toolnumber_asmwo",
              value: toolnum,
            });
            currentRec.setValue({
              fieldId: "custrecord_cntm_job",
              value: project,
            });
            var endcustomer = rec.getValue({
              fieldId: "custbody_rda_transbody_end_customer",
            });
            if (intercomptran) {
              currentRec.setValue({
                fieldId: "custrecord_cntm_is_intercompany_so",
                value: true,
              });
            }
            currentRec.setValue({
              fieldId: "custrecord_cntm_asm_end_customer",
              value: endcustomer,
            });

            var bomSearchObj = search.create({
              type: "bom",
              filters: [
                ["restricttoassemblies", "anyof", params.item],
                "AND",
                ["custrecord_cntm_tool_number", "anyof", toolnum],
              ],
              columns: [
                search.createColumn({
                  name: "name",
                  label: "Name",
                }),
                search.createColumn({
                  name: "revisionname",
                  label: "Revision : Name",
                }),
              ],
            });

            var newJob_Fld = form.getField({
              id: "custrecord_cntm_new_jobs",
            });
            var repJob_Fld = form.getField({
              id: "custrecordcntm_repeat_job",
            });

            var searchResultCount = bomSearchObj.runPaged().count;
            //log.debug("bomSearchObj result count", searchResultCount);

            if (searchResultCount > 0) {
              bomSearchObj.run().each(function (result) {
                // .run().each has a
                // limit
                // of 4,000 results

                /*
                 * currentRec .setValue({ fieldId :
                 * 'custrecord_cntm_bom_fab', value : result.id });
                 */
                currentRec.setValue({
                  fieldId: "custrecord_cntm_new_jobs",
                  value: false,
                });
                currentRec.setValue({
                  fieldId: "custrecordcntm_repeat_job",
                  value: true,
                });
                /*
                 * newJobFld.isDisable=true; repJobFld.isDisable=true;
                 */
                newJob_Fld.updateDisplayType({
                  displayType: serverWidget.FieldDisplayType.DISABLED,
                });

                repJob_Fld.updateDisplayType({
                  displayType: serverWidget.FieldDisplayType.DISABLED,
                });
                return false;
              });
            } else {
              currentRec.setValue({
                fieldId: "custrecord_cntm_new_jobs",
                value: true,
              });
              currentRec.setValue({
                fieldId: "custrecordcntm_repeat_job",
                value: false,
              });
              /*
               * newJobFld.isDisable=true; repJobFld.isDisable=true;
               */
              newJob_Fld.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED,
              });
              repJob_Fld.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED,
              });
            }

            var lineCount = rec.getLineCount({
              sublistId: "item",
            });

            //log.debug("lineCount", lineCount);

            // make sublist flds disable
            var sublistObj = form.getSublist({
              id: "recmachcustrecord_cntm_asmwoqty",
            });
            var newJobFld = currentRec.getValue({
              fieldId: "custrecord_cntm_new_jobs",
            });
            var repJobFld = currentRec.getValue({
              fieldId: "custrecordcntm_repeat_job",
            });
            var custRev = sublistObj.getField({
              id: "custrecord_cntm_wo_cust_rev",
            });
            var custRevCopy = sublistObj.getField({
              id: "custrecord_cntm_cust_rev_copy",
            });
            custRevCopy.updateDisplayType({
              displayType: serverWidget.FieldDisplayType.HIDDEN,
            });
            custRev.updateDisplayType({
              displayType: serverWidget.FieldDisplayType.NORMAL,
            });
            var bomrevfld = sublistObj.getField({
              id: "custrecord_cntm_bom_rev_asm",
            });
            bomrevfld.updateDisplayType({
              displayType: serverWidget.FieldDisplayType.HIDDEN,
            });
            var woQaun = sublistObj.getField({
              id: "custrecord_cntm_woqty_asmwocrtn",
            });
            woQaun.updateDisplayType({
              displayType: serverWidget.FieldDisplayType.NORMAL,
            });
            var woTrandate = sublistObj.getField({
              id: "custrecord_cntm_woreleasedate_asmwocrtn",
            });
            woTrandate.updateDisplayType({
              displayType: serverWidget.FieldDisplayType.NORMAL,
            });

            var woProddate = sublistObj.getField({
              id: "custrecord_cntm_scheduledate_wocrtn",
            });
            woProddate.updateDisplayType({
              displayType: serverWidget.FieldDisplayType.NORMAL,
            });

            var routingTemp = sublistObj.getField({
              id: "custrecord_cntm_manufac_template",
            });
            routingTemp.updateDisplayType({
              displayType: serverWidget.FieldDisplayType.NORMAL,
            });
            var manuRouting = sublistObj.getField({
              id: "custrecord_cntm_manufacturing_templ",
            });
            manuRouting.updateDisplayType({
              displayType: serverWidget.FieldDisplayType.NORMAL,
            });
            if (repJobFld == false) {
              var onlyrev = sublistObj.getField({
                id: "custrecord_cntm_rdacreateonlyrevision",
              });
              onlyrev.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED,
              });
              var existingRev = sublistObj.getField({
                id: "custrecord_cntm_use_existingbomrev",
              });
              existingRev.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED,
              });
              var createBOMREV = sublistObj.getField({
                id: "custrecord_cntm_create_bom_and_rev",
              });
              createBOMREV.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED,
              });
            } else {
              var onlyrev = sublistObj.getField({
                id: "custrecord_cntm_rdacreateonlyrevision",
              });
              onlyrev.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.NORMAL,
              });
              var existingRev = sublistObj.getField({
                id: "custrecord_cntm_use_existingbomrev",
              });
              existingRev.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.NORMAL,
              });
              var createBOMREV = sublistObj.getField({
                id: "custrecord_cntm_create_bom_and_rev",
              });
              createBOMREV.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.NORMAL,
              });
              var fromso = sublistObj.getField({
                id: "custrecord_cntm_custrev_fromso",
              });
              fromso.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
              });
            }

            var custRevMap = {};
            for (var i = 0; i < lineCount; i++) {
              var inner_map = {};
              var custRev = rec.getSublistValue({
                sublistId: "item",
                fieldId: "custcolcustcol_cntm_custasmrev",
                line: i,
              });
              var subtype = rec.getSublistText({
                sublistId: "item",
                fieldId: "custcol_cntm_item_subtype",
                line: i,
              });
              var quan = rec.getSublistValue({
                sublistId: "item",
                fieldId: "quantity",
                line: i,
              });
              var shipdate = rec.getSublistValue({
                sublistId: "item",
                fieldId: "expectedshipdate",
                line: i,
              });
              if (subtype == "ASM" || (intercomptran && subtype == "RDIS")) {
                if (custRevMap.hasOwnProperty(custRev)) {
                  var map_existing = custRevMap[custRev];
                  var quanExist = map_existing["quan"];
                  //log.debug("quanExist :" + quanExist, "quan :" + quan);
                  var totalQuan = quanExist + quan;
                  //log.debug("totalQuan :" + totalQuan);
                  map_existing["quan"] = totalQuan * 1;
                  custRevMap[custRev] = map_existing;
                } else {
                  //log.debug("quan :" + quan);
                  inner_map["quan"] = quan * 1;
                  inner_map["shipdate"] = shipdate;
                  custRevMap[custRev] = inner_map;
                }
              }
            }
            //log.debug("custRevMap", JSON.stringify(custRevMap));
            var uniqueCustRev = Object.keys(custRevMap);
            if (uniqueCustRev.length > 0) {
              for (var index = 0; index < uniqueCustRev.length; index++) {
                var custRev = uniqueCustRev[index];
                var revMap = custRevMap[custRev];
                var revQuan = revMap["quan"];
                var woshipdate = revMap["shipdate"];
                currentRec.setSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_wo_cust_rev",
                  line: index,
                  value: custRev,
                });
                currentRec.setSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_cust_rev_copy",
                  line: index,
                  value: custRev,
                });
                currentRec.setSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_woqty_asmwocrtn",
                  line: index,
                  value: revQuan,
                });
                currentRec.setSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_asm_toolnum",
                  line: index,
                  value: toolnum,
                });
                currentRec.setSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_wo_shipdate",
                  line: index,
                  value: woshipdate,
                });
                currentRec.setSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_custrev_fromso",
                  line: index,
                  value: true,
                });
                if (so_type != undefined && so_type != null && so_type != "") {
                  currentRec.setSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_so_release_type",
                    line: index,
                    value: so_type,
                  });
                } else {
                  currentRec.setSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_so_release_type",
                    line: index,
                    value: 1,
                  });
                }
              }
            }

            // *******************************************************************************
          }
           if (currentRec.type == "workorder") {	
            if (params.soid) {	
              //Code added on 13-10-2022 for not triggering if created from is workorder 
              var type = getTransactionType(params.soid)
              log.debug('---type-- :',type)
             
              if(getTransactionType(params.soid) == 'salesorder') {
                if (params.soline) {	
                  var soRec = record.load({	
                    type: "salesorder",	
                    id: params.soid,	
                    isDynamic: true,	
                  });	
                  var lineNumber = soRec.findSublistLineWithValue({	
                    sublistId: "item",	
                    fieldId: "line",	
                    value: Number(params.soline),	
                  });	
                  log.debug("lineNumber", lineNumber);	
                  var soLineUnique = soRec.getSublistValue({	
                    sublistId: "item",	
                    fieldId: "lineuniquekey",	
                    line: lineNumber,	
                  });	
                  log.debug("soLineUnique", soLineUnique);	
                  currentRec.setValue({	
                    fieldId: "custbody_cntm_so_line_unique_key",	
                    value: soLineUnique,	
                  });	
                }	
              }
              // else{
              //   currentRec.setValue({	
              //     fieldId: "custbody_cntm_so_line_unique_key",	
              //     value: "",	
              //   });	
              // }
            }	
          }


       

        }
      }

      if (scriptContext.type == "edit") {
        if (currentRec.type == "manufacturingrouting") {
          try {
            //log.debug("manufacturingrouting", params);
            var params = scriptContext.request.parameters;
            var name = currentRec.getValue({
              fieldId: "name",
            });
            var copied = currentRec.getValue({
              fieldId: "custrecord_cntm_is_copied_from_asm_wo",
            });
            log.debug("copied :" + copied, "params" + JSON.stringify(params));
            if (copied == false) {
              // ******************************remove
              // reference of existing routing and
              // delete*****************************************************************************
              var asmRec = params.asmRecId;
              if (asmRec) {
                var asmRecord = record.load({
                  type: "customrecord_cntm_asm_wocreation",
                  id: asmRec,
                  isDynamic: true,
                });
                var lineCount = asmRecord.getLineCount({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                });

                var lineVal = params.line;
                //log.debug("line val :" + lineVal);
                asmRecord.selectLine({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  line: lineVal,
                });
                var wo = asmRecord.getCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_wonumb_asm_wocrtn",
                });
                var routingID = asmRecord.getCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_manufacturing_templ",
                });
                //log.debug("routingID :" + routingID);

                if (wo) {
                  asmRecord.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_manufacturing_templ",

                    value: "",
                  });

                  asmRecord.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_asm_new_routing",

                    value: false,
                  });

                  var fieldLookUp = search.lookupFields({
                    type: search.Type.WORK_ORDER,
                    id: wo,
                    columns: ["manufacturingrouting"],
                  });
                  var routingLookup = fieldLookUp["manufacturingrouting"];
                  //log.debug("routingLookup :" + routingLookup);
                  var stringJson = JSON.stringify(routingLookup);
                  var routingExisting = routingLookup[0].value;
                  //log.debug("routingExisting :" + routingExisting);
                  var id = record.submitFields({
                    type: record.Type.WORK_ORDER,
                    id: wo,
                    values: {
                      manufacturingrouting: "",
                    },
                    options: {
                      enableSourcing: false,
                      ignoreMandatoryFields: true,
                    },
                  });
                  asmRecord.commitLine({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                  });

                  //log.debug("here...");

                  asmRecord.save();
                  /*
                   * record.delete({ type:'manufacturingrouting', id:
                   * routingExisting });
                   */
                } else {
                  if (routingID) {
                    //log.debug("in else of WO for deleting routing");
                    asmRecord.setCurrentSublistValue({
                      sublistId: "recmachcustrecord_cntm_asmwoqty",
                      fieldId: "custrecord_cntm_manufacturing_templ",

                      value: "",
                    });
                    asmRecord.setCurrentSublistValue({
                      sublistId: "recmachcustrecord_cntm_asmwoqty",
                      fieldId: "custrecord_cntm_status_asm_child",

                      value: 6,
                    });
                    asmRecord.setCurrentSublistValue({
                      sublistId: "recmachcustrecord_cntm_asmwoqty",
                      fieldId: "custrecord_cntm_asm_new_routing",

                      value: false,
                    });
                    asmRecord.commitLine({
                      sublistId: "recmachcustrecord_cntm_asmwoqty",
                    });

                    //log.debug("here...");
                    asmRecord.save();
                    // deleting old routing

                    record.delete({
                      type: "manufacturingrouting",
                      id: routingID,
                    });
                  }
                }

                // *****************************create new
                // routing***************************************************************************************
                var copyrec = record.copy({
                  type: "manufacturingrouting",
                  id: currentRec.id,
                  isDynamic: true,
                });
                copyrec.setValue({
                  fieldId: "customform",
                  value: 97, //110,
                });
                /*
                 * copyrec.setValue({ fieldId : 'subsidiary', value :
                 * params.subsidiary });
                 */
                copyrec.setValue({
                  fieldId: "billofmaterials",
                  value: params.bom,
                });
                copyrec.setValue({
                  fieldId: "custrecord_cntm_is_copied_from_asm_wo",
                  value: true,
                });

                var name1 = copyrec.getText({
                  fieldId: "billofmaterials",
                });
                //log.debug("name1", name1);
                var routingName = "";
                var manufacturingroutingSearchObj = search.create({
                  type: "manufacturingrouting",
                  filters: [
                    ["billofmaterials", "anyof", params.bom],
                    "AND",
                    ["name", "startswith", name1],
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
                    search.createColumn({
                      name: "location",
                      label: "Location",
                    }),
                  ],
                });
                var searchResultCount =
                  manufacturingroutingSearchObj.runPaged().count;
                log.debug(
                  "manufacturingroutingSearchObj result count",
                  searchResultCount
                );
                var name = "";
                if (searchResultCount > 0) {
                  name = name1 + " " + searchResultCount;
                } else {
                  name = name1;
                }
                log.debug(name1, name);
                var flagMap = checkRoutingName(
                  params.bom,
                  name,
                  searchResultCount
                );
                if (flagMap["flag"] == true) {
                  ///name keeps get similar here getting unique name issue
                  routingName = name1 + " " + flagMap[count]; //(parseInt(searchResultCount) + 1);
                } else {
                  routingName = name;
                }
                log.debug("routingName :" + routingName);
                copyrec.setValue({
                  fieldId: "name",
                  value: routingName,
                });
                copyrec.setValue({
                  fieldId: "location",
                  value: params.location,
                });
                copyrec.setValue({
                  fieldId: "custrecord_cntm_asm_wo_crtn_rec",
                  value: params.asmRecId,
                });
                copyrec.setValue({
                  fieldId: "custrecord_cntm_location_asm_wo",
                  value: params.location,
                });
                copyrec.setValue({
                  fieldId: "custrecord_cntm_susidiary",
                  value: params.subsidiary,
                });
                copyrec.setValue({
                  fieldId: "custrecord_cntm_asm_rec_line",
                  value: params.line,
                });
                //log.debug("copyrec", JSON.stringify(copyrec));
                var recId = copyrec.save({
                  enableSourcing: true,
                  ignoreMandatoryFields: true,
                });

                //log.debug("recId", recId);
                // if (params.bom)
                redirect.toRecord({
                  type: record.Type.MANUFACTURING_ROUTING,
                  id: recId,
                  isEditMode: true,
                  // parameters:
                  // {'bom':params.bom,'templt':currentRec.id}
                });
              }
            }
          } catch (e) {
            log.error("Load Error", e);
          }
        }
        if (currentRec.type == "customrecord_cntm_asm_wocreation") {
          // **************************************************************************************************************
          var params = scriptContext.request.parameters;
          //log.debug("parama", params);
          if (params.qty)
            currentRec.setValue({
              fieldId: "custrecord_sntm_so_qunty_asmwocreation",
              value: params.qty,
            });
          var status = currentRec.getValue({
            fieldId: "custrecord_cntm_status_asmwocreation",
          });
          var sublistObj = form.getSublist({
            id: "recmachcustrecord_cntm_asmwoqty",
          });
          var newRouting = currentRec.getValue({
            fieldId: "custrecord_cntm_new_routing",
          });
          var form = scriptContext.form;
          form.removeButton({
            id: "changeid",
          });
          var newJob_Fld = form.getField({
            id: "custrecord_cntm_new_jobs",
          });
          var repJob_Fld = form.getField({
            id: "custrecordcntm_repeat_job",
          });
          newJob_Fld.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED,
          });
          repJob_Fld.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED,
          });
          // if(status ==6){
          var bomrevfld = sublistObj.getField({
            id: "custrecord_cntm_bom_rev_asm",
          });
          bomrevfld.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN,
          });
          var woQaun = sublistObj.getField({
            id: "custrecord_cntm_woqty_asmwocrtn",
          });
          woQaun.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.ENTRY,
          });
          var woTrandate = sublistObj.getField({
            id: "custrecord_cntm_woreleasedate_asmwocrtn",
          });
          woTrandate.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.ENTRY,
          });
          var woProddate = sublistObj.getField({
            id: "custrecord_cntm_scheduledate_wocrtn",
          });
          woProddate.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.ENTRY,
          });

          var routingTemp = sublistObj.getField({
            id: "custrecord_cntm_manufac_template",
          });
          routingTemp.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.ENTRY,
          });
          var manuRouting = sublistObj.getField({
            id: "custrecord_cntm_manufacturing_templ",
          });
          manuRouting.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.ENTRY,
          });
          // }

          var onlyrev = sublistObj.getField({
            id: "custrecord_cntm_rdacreateonlyrevision",
          });
          onlyrev.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.ENTRY,
          });
          var existingRev = sublistObj.getField({
            id: "custrecord_cntm_use_existingbomrev",
          });
          existingRev.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.ENTRY,
          });
          var createBOMREV = sublistObj.getField({
            id: "custrecord_cntm_create_bom_and_rev",
          });
          createBOMREV.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.ENTRY,
          });

          var custRev = sublistObj.getField({
            id: "custrecord_cntm_wo_cust_rev",
          });
          custRev.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.NORMAL,
          });

          var rdafile = sublistObj.getField({
            id: "custrecord_cntm_rda_rev_file",
          });
          rdafile.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.ENTRY,
          });

          var bomfld = sublistObj.getField({
            id: "custrecord_cntm_cust_rev_created",
          });
          bomfld.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.ENTRY,
          });
          var fromso = sublistObj.getField({
            id: "custrecord_cntm_custrev_fromso",
          });
          fromso.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN,
          });
          var custRevCopy = sublistObj.getField({
            id: "custrecord_cntm_cust_rev_copy",
          });
          custRevCopy.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN,
          });

          // updating cusotmer rev form SO and related records
          // var params = scriptContext.request.parameters;
          //log.debug("params", params);
          var empObj = runtime.getCurrentUser();
          var empid = empObj.id;
          var flag = params.flag;
          var scriptObj = runtime.getCurrentScript();

          var recipientsEmail = scriptObj.getParameter({
            name: "custscript_cntm_recipient_email",
          });
          //log.debug("flag :" + flag + " empid :" + empid,"recipientsEmail :" + recipientsEmail);
          if (
            flag == true ||
            flag == "true" ||
            flag == undefined ||
            flag == null ||
            flag == ""
          ) {
            flag = false;
            var soid = currentRec.getValue({
              fieldId: "custrecord_so_number_asmwo",
            });
            var rec = record.load({
              id: soid,
              type: "salesorder",
            });
            var toolNum = currentRec.getValue({
              fieldId: "custrecord_cntm_toolnumber_asmwo",
            });
            //log.debug("toolNum", toolNum);

            var custRev = currentRec.getValue({
              fieldId: "custrecord_cntm_cust_rev",
            });
            var lineCount = rec.getLineCount({
              sublistId: "item",
            });
            //log.debug("lineCount", lineCount);
            var custRevMap = {};
            for (var i = 0; i < lineCount; i++) {
              var inner_map = {};
              var custRevLine = rec.getSublistValue({
                sublistId: "item",
                fieldId: "custcolcustcol_cntm_custasmrev",
                line: i,
              });
              var subtype = rec.getSublistText({
                sublistId: "item",
                fieldId: "custcol_cntm_item_subtype",
                line: i,
              });
              var childRec_id = rec.getSublistValue({
                sublistId: "item",
                fieldId: "custcol_cntm_asm_wo_child_rec",
                line: i,
              });

              //log.debug("custRevLine :" + custRevLine);
              if (
                subtype == "ASM" ||
                (intercomptran && subtype == "RDIS")
                /*
                 * &&
                 * (asmRev!=custRevLine)
                 */
              ) {
                // soRev.pudh(custRevLine);

                custRevMap[custRevLine] = childRec_id;
              }
            }

            var asmCustRecArr = [];

            var count = currentRec.getLineCount({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
            });
            //log.debug("count", count);
            //log.debug("custRevMap :", JSON.stringify(custRevMap));
            /*
             * for(var counter=0;counter<count;counter++){ var asmRev =
             * currentRec.getSublistValue({ sublistId:
             * 'recmachcustrecord_cntm_asmwoqty', fieldId:
             * 'custrecord_cntm_wo_cust_rev', line: counter });
             * asmCustRecArr.push(asmRev); } var
             * uniqueAsmRev=uniqueArr(asmCustRecArr);
             */
            var keys = Object.keys(custRevMap);
            if (keys.length > 0) {
              for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var childRec = custRevMap[key];
                //log.debug("key :" + key + " childRec :" + childRec,"key :" + key);
                // for(var i=0;i<uniqueAsmRev.length;i++){
                /*
                 * var asmRevRec=uniqueAsmRev[i]; //log.debug("asmRevRec
                 * :"+asmRevRec);
                 */
                if (childRec)
                  var woLookup = search.lookupFields({
                    type: "customrecord_cntm_wodetailsfor_asmwocrt",
                    id: childRec,
                    columns: [
                      "custrecord_cntm_wonumb_asm_wocrtn",
                      "custrecord_cntm_wo_cust_rev",
                    ],
                  });
                var custRev = woLookup.custrecord_cntm_wo_cust_rev;
                var woStatusArr = woLookup.custrecord_cntm_wonumb_asm_wocrtn;
                var wo = woStatusArr[0].value;
                log.audit("wo in before load :" + wo, "custRev :" + custRev);
                if (key != custRev) {
                  if (wo) {
                    var woLookup = search.lookupFields({
                      type: record.Type.WORK_ORDER,
                      id: wo,
                      columns: ["status"],
                    });
                    var woStatusArr = woLookup.status;
                    var woStatus = woStatusArr[0].text;
                    // console.log("woStatus
                    // :"+woStatus);
                    if (woStatus == "Released") {
                      updateNewCustRevWO(
                        wo,
                        toolNum,
                        key,
                        childRec,
                        empid,
                        recipientsEmail
                      );
                    }
                  } else {
                    //log.debug("in else no WO");
                    updateNewCustRev(toolNum, key, childRec);
                  }

                  var id = currentRec.id;
                  var childRevMap = {};
                  var searchRec = search.create({
                    type: "customrecord_cntm_wodetailsfor_asmwocrt",
                    filters: [
                      ["custrecord_cntm_asmwoqty", "is", id],
                      "AND",
                      ["isinactive", "is", "F"],
                      "AND",
                      ["custrecord_cntm_wo_cust_rev", "is", custRev],
                    ],
                    columns: [
                      // search.createColumn({name:
                      // "scriptid",
                      // label:
                      // "script
                      // id",sort:
                      // search.Sort.DESC}),
                      search.createColumn({
                        name: "custrecord_cntm_wo_cust_rev",
                      }),
                      search.createColumn({ name: "internalid" }),
                      search.createColumn({
                        name: "custrecord_cntm_wonumb_asm_wocrtn",
                      }),
                    ],
                  });
                  var searchResultCount = searchRec.runPaged().count;
                  log.audit(" searchResultCount:", searchResultCount);
                  if (searchResultCount > 0) {
                    searchRec.run().each(function (result) {
                      var childId = result.getValue("internalid");
                      // var
                      // custRevLine=result.getValue("custrecord_cntm_wo_cust_rev");
                      var woid = result.getValue(
                        "custrecord_cntm_wonumb_asm_wocrtn"
                      );
                      if (woid) {
                        var woLookup = search.lookupFields({
                          type: record.Type.WORK_ORDER,
                          id: woid,
                          columns: ["status"],
                        });
                        var woStatusArr = woLookup.status;
                        var woStatus = woStatusArr[0].text;
                        // console.log("woStatus
                        // :"+woStatus);
                        if (woStatus == "Released") {
                          updateNewCustRevWO(
                            woid,
                            toolNum,
                            key,
                            childId,
                            empid,
                            recipientsEmail
                          );
                        }
                      } else {
                        //log.debug("in else no WO");
                        updateNewCustRev(toolNum, key, childId);
                      }
                      return true;
                    });
                  }
                }
                // }
              }
            }
            redirect.toRecord({
              type: currentRec.type,
              id: currentRec.id,
              isEditMode: true,
              parameters: {
                flag: false,
              },
            });
          }
        }
        if (currentRec.type == "customrecord_cntm_wo_bom_import_fab") {
          var params = scriptContext.request.parameters;
          //log.debug("parama", params);
          if (params.qty)
            currentRec.setValue({
              fieldId: "custrecord_cntm_so_qty_fab",
              value: params.qty,
            });
          if (params.isInterco)
            currentRec.setValue({
              fieldId: "custrecord_cntm_is_interco_tran",
              value: true,
            });
          if (params.reprocess == "T") {
            var bomFld = form.getField({
              id: "custrecord_cntm_bom_fab",
            });
            if (isNotEmpty(bomFld))
              bomFld.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE,
              });
            var bomFileFld = form.getField({
              id: "custrecord_bom_raw_file_fab",
            });
            if (isNotEmpty(bomFileFld))
              bomFileFld.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY,
              });
            var bomDepFileFld = form.getField({
              id: "custrecord_cntm_bom_dependecy_file_fab",
            });
            if (isNotEmpty(bomDepFileFld))
              bomDepFileFld.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY,
              });

            currentRec.setText({
              fieldId: "custrecord_cntm_status_fab_wo_crtn",
              value: "",
            });
            currentRec.setText({
              fieldId: "custrecord_cntm_mfg_routing_fab",
              value: "",
            });
            log.audit("params.reprocess", params.reprocess);
            currentRec.setValue({
              fieldId: "custrecord_cntm_is_reprocess",
              value: true,
            });
          } else if (params.updtbom == "T") {
            var bomFld = form.getField({
              id: "custrecord_cntm_bom_fab",
            });
            if (isNotEmpty(bomFld))
              bomFld.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY,
              });
            var bomFileFld = form.getField({
              id: "custrecord_bom_raw_file_fab",
            });
            if (isNotEmpty(bomFileFld))
              bomFileFld.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY,
              });
            var bomDepFileFld = form.getField({
              id: "custrecord_cntm_bom_dependecy_file_fab",
            });
            if (isNotEmpty(bomDepFileFld))
              bomDepFileFld.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY,
              });
            var mfgFileFld = form.getField({
              id: "custrecord_cntm_mfg_routing_filr_fab",
            });
            if (isNotEmpty(mfgFileFld))
              mfgFileFld.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY,
              });
            var mfgFld = form.getField({
              id: "custrecord_cntm_mfg_routing_fab",
            });
            if (isNotEmpty(mfgFld))
              mfgFld.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
              });
            currentRec.setText({
              fieldId: "custrecord_cntm_bom_fab",
              value: "",
            });
            currentRec.setText({
              fieldId: "custrecord_bom_raw_file_fab",
              value: "",
            });
            currentRec.setText({
              fieldId: "custrecord_cntm_bom_dependecy_file_fab",
              value: "",
            });
            currentRec.setText({
              fieldId: "custrecord_cntm_status_fab_wo_crtn",
              value: "",
            });
            currentRec.setText({
              fieldId: "custrecord_cntm_mfg_routing_fab",
              value: "",
            });
            // log.audit('params.reprocess',params.reprocess);
            currentRec.setValue({
              fieldId: "custrecord_cntm_delete_n_update_bom",
              value: true,
            });
          } else {
            var status = currentRec.getValue({
              fieldId: "custrecord_cntm_status_fab_wo_crtn",
            });
            var bom = currentRec.getValue({
              fieldId: "custrecord_cntm_bom_fab",
            });
            /*
             * var existingBOM = currentRec.getValue({ fieldId :
             * 'custrecord_cntm_use_existing_bom_rev' });
             */
            if (status != "" && status != 9 && bom != "") {
              var bomFld = form.getField({
                id: "custrecord_cntm_bom_fab",
              });
              if (isNotEmpty(bomFld))
                bomFld.updateDisplayType({
                  displayType: serverWidget.FieldDisplayType.INLINE,
                });
            }
            if (
              status != "" &&
              status != 2 &&
              status != 9 &&
              status != 10 &&
              status != 11
            ) {
              var bomFileFld = form.getField({
                id: "custrecord_bom_raw_file_fab",
              });
              if (isNotEmpty(bomFileFld))
                bomFileFld.updateDisplayType({
                  displayType: serverWidget.FieldDisplayType.INLINE,
                });
              var bomDepFileFld = form.getField({
                id: "custrecord_cntm_bom_dependecy_file_fab",
              });
              if (isNotEmpty(bomDepFileFld))
                bomDepFileFld.updateDisplayType({
                  displayType: serverWidget.FieldDisplayType.INLINE,
                });
            }
          }
        }
        if (currentRec.type == "workorder") {
          // custbody_cntm_is_asm_wo - ASM check box

          // IS ASM check box
          var isPcb_wo = currentRec.getValue({
            fieldId: "custbody_cntm_is_asm_wo",
          });

          if (!isPcb_wo) {
            // PCB work order
            var woId = currentRec.id;
            //log.debug("woId :", woId);

            var hide_fields_check = currentRec.getValue({
              fieldId: "custbody_cntm_ref_for_btn_hide",
            });
            //log.debug("hide_fields_check :", hide_fields_check);

            if (hide_fields_check) {
              // False
              var routing_field = form.getField({
                id: "manufacturingrouting", //manufacturingrouting //manufacturingrouting
              });
              //log.debug("routing_field :", routing_field);
              routing_field.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED,
              });
              //log.debug("Hide");
            }
          }
        }
      }
    }
  }
  function isNotEmpty(obj) {
    return obj && JSON.stringify(obj) != "{}";
  }

  function getTransactionType(id){
    var t_type ;
    var transactionSearchObj = search.create({
      type: "transaction",
      filters:
      [
         ["internalid","anyof",id], 
         "AND", 
         ["mainline","is","T"]
      ],
      columns:
      [
         search.createColumn({name: "tranid", label: "Document Number"}),
         search.createColumn({name: "recordtype", label: "Record Type"})
      ]
   });
   var searchResultCount = transactionSearchObj.runPaged().count;
   log.debug("transactionSearchObj result count",searchResultCount);
   transactionSearchObj.run().each(function(result){
      // .run().each has a limit of 4,000 results
      t_type = result.getValue({name: "recordtype", label: "Record Type"})
      return false;
   });
   return t_type;

  }
  function isItemPresent(currentRec) {
    var rec = record.load({
      id: currentRec.id,
      type: currentRec.type,
      // isDynamic : true
    });
    var isInterco = rec.getValue({ fieldId: "intercotransaction" });
    //log.debug("isInterco", isInterco);
    var lineCount = rec.getLineCount({
      sublistId: "item",
    });
    var asmFlag = false;
    var fabFlag = false;
    var rdisFlag = false;
    //log.debug("lineCount", lineCount);
    for (var i = 0; i < lineCount; i++) {
      var subtype = rec.getSublistText({
        sublistId: "item",
        fieldId: "custcol_cntm_item_subtype",
        line: i,
      });
      //log.debug(subtype);
      // alert(subtype+' '+type);
      if (subtype == "FAB") {
        fabFlag = true;
      }
      if (subtype == "ASM") {
        asmFlag = true;
      }
      if (isInterco) {
        if (subtype == "RDIS") rdisFlag = true;
      } else if (asmFlag == true && fabFlag == true) break;
    }
    var obj = {
      asmFlag: asmFlag,
      fabFlag: fabFlag,
      rdisFlag: rdisFlag,
    };
    return obj;
  }

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
  function beforeSubmit(scriptContext) {
    var currentRec = scriptContext.newRecord;
    /*
     * if (currentRec.type == 'customrecord_cntm_wo_bom_import_fab') { var
     * isDeleteProcess=currentRec.getValue({ fieldId :
     * 'custrecord_cntm_delete_n_update_bom' });
     *
     * if(isDeleteProcess==true || isDeleteProcess=='T'){ var
     * SO=currentRec.getValue({ fieldId : 'custrecord_cntm_sales_order_fab' });
     * var item=currentRec.getValue({ fieldId : 'custrecord_cntm_fab_item' });
     * var qty=currentRec.getValue({ fieldId : 'custrecord_cntm_so_qty_fab' });
     * var location=currentRec.getValue({ fieldId :
     * 'custrecord_cntm_so_location_fab' }); var expShip=currentRec.getValue({
     * fieldId : 'custrecord_cntm_so_expctd_ship_dt' }); var
     * isInterco=currentRec.getValue({ fieldId :
     * 'custrecord_cntm_is_interco_tran' }); var isCon=currentRec.getValue({
     * fieldId : 'custrecord_cntm_is_con' }); record.delete({
     * type:'customrecord_cntm_wo_bom_import_fab', id:currentRec.id});
     * redirect.toRecord({ type : 'customrecord_cntm_wo_bom_import_fab', // id :
     * taskRecordId, parameters: { 'item' : item, 'salesOrder' : SO, 'qty' :
     * qty, 'location' : location, 'expShipDt' : expShip, 'isInterco' :
     * isInterco, 'isCon' : isCon } }); } }
     */
    if (currentRec.type == "workorder") {
      if (scriptContext.type == "create") {
        var isStockBoard = currentRec.getValue({
          fieldId: "custbody_cntm_is_rework_wo",
        });
        //log.debug("isStockBoard", isStockBoard);
        if (isStockBoard == true || isStockBoard == "T") {
          var assembly = currentRec.getValue({
            fieldId: "assemblyitem",
          });
          var qty = currentRec.getSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            line: 0,
          });
          var itemFieldLookUp = search.lookupFields({
            type: "item",
            id: assembly,
            columns: ["itemid"],
          });
          var assemblyName = itemFieldLookUp.itemid;
          //log.debug("assemblyName", assemblyName);
          /*
           * var assemblyName=currentRec.getText({ fieldId : 'assemblyitem' });
           */
          var subsidiary = currentRec.getValue({
            fieldId: "subsidiary",
          });
          var location = currentRec.getValue({
            fieldId: "location",
          });
          var bomName = assemblyName + "_StockBoard";
          var newbomInternalId;
          var bomSearchObj = search.create({
            type: "bom",
            filters: [
              ["assemblyitem.assembly", "anyof", assembly],
              "AND",
              ["name", "is", bomName],
            ],
            columns: [
              "name",
              "revisionname",
              "custrecord_cntm_asm_bom_rev_soline",
            ],
          });
          var searchResultCount = bomSearchObj.runPaged().count;
          //log.debug("bomSearchObj result count", searchResultCount);

          if (searchResultCount > 0) {
            bomSearchObj.run().each(function (result) {
              // .run().each has a limit of 4,000 results
              newbomInternalId = result.id;
              return true;
            });
          } else {
            var bom_obj = record.create({
              type: record.Type.BOM,
              isDynamic: true,
            });
            bom_obj.setValue({
              fieldId: "name",
              value: bomName,
            });
            bom_obj.setValue({
              fieldId: "availableforallassemblies",
              value: false,
            });
            bom_obj.setValue({
              fieldId: "availableforalllocations",
              value: false,
            });
            bom_obj.setValue({
              fieldId: "subsidiary",
              value: subsidiary,
            });
            bom_obj.setValue({
              fieldId: "restricttolocations",
              value: location,
            });
            bom_obj.setValue({
              fieldId: "restricttoassemblies",
              value: assembly,
            });
            bom_obj.setValue({
              fieldId: "custrecord_cntm_is_stockboard",
              value: true,
            });

            newbomInternalId = bom_obj.save({
              ignoreMandatoryFields: true,
              enableSourcing: true,
            });
            if (newbomInternalId) {
              // bomInternalId = newbomInternalId;

              var loadRce = record.load({
                type: record.Type.BOM,
                id: newbomInternalId,
                isDynamic: true,
              });
              loadRce.selectNewLine({
                sublistId: "assembly",
              });
              loadRce.setCurrentSublistValue({
                sublistId: "assembly",
                fieldId: "assembly",
                value: assembly,
              });
              loadRce.commitLine({
                sublistId: "assembly",
              });
              loadRce.save({
                ignoreMandatoryFields: true,
                enableSourcing: false,
              });

              var bomrevision_obj = record.create({
                type: "bomrevision",
                isDynamic: true,
              });

              bomrevision_obj.setValue({
                fieldId: "name",
                value: "Rev 1",
              });
              bomrevision_obj.setValue({
                fieldId: "billofmaterials",
                value: newbomInternalId,
              });

              bomrevision_obj.selectNewLine({
                sublistId: "component",
              });
              var configRecObj = config.load({
                type: config.Type.COMPANY_PREFERENCES,
              });
              var dummyItem = configRecObj.getValue({
                fieldId: "custscript_cntm_dummy_item_for_quotes",
              });
              //log.debug("dummyItem", dummyItem);
              bomrevision_obj.setCurrentSublistValue({
                sublistId: "component",
                fieldId: "item",
                value: dummyItem, // assembly
              });
              bomrevision_obj.setCurrentSublistValue({
                sublistId: "component",
                fieldId: "bomquantity",
                value: qty,
              });
              /*
               * bomrevision_obj .setCurrentSublistText({ sublistId : "component", fieldId :
               * "itemsource", text : "Stock" });
               */
              bomrevision_obj.commitLine({
                sublistId: "component",
              });
              var bomRevisionInternalId = bomrevision_obj.save({
                ignoreMandatoryFields: true,
                enableSourcing: true,
              });
            }
          }
          var mfgrecId;
          var manufacturingroutingSearchObj = search.create({
            type: "manufacturingrouting",
            filters: [
              ["billofmaterials", "anyof", newbomInternalId],
              "AND",
              ["name", "is", assemblyName + "_StockBoard"],
            ],
            columns: [
              search.createColumn({
                name: "name",
                sort: search.Sort.ASC,
              }),
              "billofmaterials",
              "location",
              "location",
            ],
          });
          var searchResultCount =
            manufacturingroutingSearchObj.runPaged().count;
          //log.debug("manufacturingroutingSearchObj result count",searchResultCount);
          if (searchResultCount > 0) {
            manufacturingroutingSearchObj.run().each(function (result) {
              // .run().each has a limit of 4,000 results
              mfgrecId = result.id;
              return true;
            });
          } else {
            // var routTemp = 68065;
            var routTemp = 1330;//402;//68065;
            var copyrec = record.copy({
              type: "manufacturingrouting",
              id: routTemp,
              isDynamic: true,
            });
            copyrec.setValue({
              fieldId: "name",
              value: assemblyName + "_StockBoard",
            });
            copyrec.setValue({
              fieldId: "billofmaterials",
              value: newbomInternalId,
            });
            copyrec.setValue({	
              fieldId: "location",	
              value: location,	
            });

            mfgrecId = copyrec.save({
              enableSourcing: true,
              ignoreMandatoryFields: true,
            });
          }
          currentRec.setValue({ fieldId: "iswip", value: true });
          currentRec.setValue({
            fieldId: "billofmaterials",
            value: newbomInternalId,
          });
          currentRec.setValue({
            fieldId: "billofmaterialsrevision",
            value: bomRevisionInternalId,
          });
          currentRec.setValue({
            fieldId: "manufacturingrouting",
            value: mfgrecId,
          });
          // currentRec.selectLine({sublistId:'item',line:0});
          // currentRec.setSublistValue({sublistId:'item',fieldId:'item',value:assembly,line:0});
          // currentRec.commitLine({sublistId:'item'});
          // record.delete({type:'bomrevision',id:bomRevisionInternalId});
        }
      }
    }
  }

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
    log.audit("After Submit", "**INIT**");
    try {
      var currentRec = scriptContext.newRecord;
      //log.debug("currentRec.type", currentRec.type);
      if (scriptContext.type == "copy" && currentRec.type == "workorder") {
        log.audit("in create WO");
        var so = currentRec.getValue({ fieldId: "custbody_cnt_created_fm_so" });
        var rdis_item = currentRec.getValue({ fieldId: "assemblyitem" });
        if (rdis_item) {
          var woID = currentRec.id;
          var subsidairy = currentRec.getValue({ fieldId: "subsidiary" });

          var itemLookup = search.lookupFields({
            type: "item",
            id: rdis_item,
            columns: ["custitem_cntm_subtype"],
          });
          var isAsm = false;
          var itemType = itemLookup.custitem_cntm_subtype[0].value;
          var isasmflag = currentRec.getValue({
            fieldId: "custbody_cntm_is_asm_wo",
          });
          log.audit("itemType :" + itemType, "isasmflag :" + isasmflag);
          if ((isasmflag == false || isasmflag == "F") && itemType == "9") {
            // RDIS
            // item
            //log.debug("in creating op records");
            isAsm = true;
            record.submitFields({
              type: currentRec.type,
              id: currentRec.id,
              values: {
                custbody_cntm_is_asm_wo: isAsm,
              },
            });
            // create custom records for client app
            //createOperationRec(woID);
          } else if (isasmflag == true) {
            // createOperationRec(woID);
          }
        }
      }
      if (currentRec.type == "workorder") {
        var type = scriptContext.type;
        var isStockBoard = currentRec.getValue({
          fieldId: "custbody_cntm_is_rework_wo",
        });

        //log.debug("isStockBoard", isStockBoard);
        if (isStockBoard == true || isStockBoard == "T") {
          var assembly = currentRec.getValue({
            fieldId: "assemblyitem",
          });
          var qty = currentRec.getSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            line: 0,
          });
          var rec = record.load({
            type: "workorder",
            id: currentRec.id,
            isDynamic: true,
          });
          var bomRevisionInternalId = rec.getValue({
            fieldId: "billofmaterialsrevision",
          });
          rec.setValue({ fieldId: "billofmaterialsrevision", value: "" });
          rec.selectNewLine({ sublistId: "item" });
          rec.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "item",
            value: assembly,
          });
          rec.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            value: qty,
          });
          rec.commitLine({ sublistId: "item" });
          rec.save();
          // record.delete({type:'bomrevision',id:bomRevisionInternalId});
          var loadRce = record.load({
            type: "bomrevision",
            id: bomRevisionInternalId,
            isDynamic: true,
          });
          loadRce.removeLine({
            sublistId: "item",
            line: 0,
            ignoreRecalc: true,
          });
          loadRce.save();
        }
      }

      if (currentRec.type == "customrecord_cntm_wo_bom_import_fab") {
        var isDeleteProcess = currentRec.getValue({
          fieldId: "custrecord_cntm_delete_n_update_bom",
        });

        if (isDeleteProcess == true || isDeleteProcess == "T") {
          var SO = currentRec.getValue({
            fieldId: "custrecord_cntm_sales_order_fab",
          });
          var item = currentRec.getValue({
            fieldId: "custrecord_cntm_fab_item",
          });
          var qty = currentRec.getValue({
            fieldId: "custrecord_cntm_so_qty_fab",
          });
          var location = currentRec.getValue({
            fieldId: "custrecord_cntm_so_location_fab",
          });
          var expShip = currentRec.getValue({
            fieldId: "custrecord_cntm_so_expctd_ship_dt",
          });
          var isInterco = currentRec.getValue({
            fieldId: "custrecord_cntm_is_interco_tran",
          });
          var isCon = currentRec.getValue({
            fieldId: "custrecord_cntm_is_con",
          });
          record.delete({
            type: "customrecord_cntm_wo_bom_import_fab",
            id: currentRec.id,
          });
          redirect.toRecord({
            type: "customrecord_cntm_wo_bom_import_fab",
            // id : taskRecordId,
            parameters: {
              item: item,
              salesOrder: SO,
              qty: qty,
              location: location,
              expShipDt: expShip,
              isInterco: isInterco,
              isCon: isCon,
            },
          });
        }
      }
      if (scriptContext.type == "create") {
        if (currentRec.type == "salesorder") {
          var intercoTran = currentRec.getValue({
            fieldId: "intercotransaction",
          });
          var endCustomer;
          var toolNum;
          var revision;
          var project;
          if (intercoTran) {
            var poFieldLookUp = search.lookupFields({
              type: "purchaseorder",
              id: intercoTran,
              columns: [
                "custbody_rda_transbody_end_customer",
                "custbody_cntm_tool_number",
                "custbody_cntm_cust_rev",
                "custbody_cntm_project",
              ],
            });
            if (poFieldLookUp) {
              if (poFieldLookUp.custbody_rda_transbody_end_customer)
                endCustomer = poFieldLookUp
                  .custbody_rda_transbody_end_customer[0]
                  ? poFieldLookUp.custbody_rda_transbody_end_customer[0].value
                  : "";
              toolNum = poFieldLookUp.custbody_cntm_tool_number[0]
                ? poFieldLookUp.custbody_cntm_tool_number[0].value
                : "";
              revision = poFieldLookUp.custbody_cntm_cust_rev;
              project = poFieldLookUp.custbody_cntm_project[0]
                ? poFieldLookUp.custbody_cntm_project[0].value
                : "";
            }
            // if(endCustomer)
            record.submitFields({
              type: currentRec.type,
              id: currentRec.id,
              values: {
                custbody_rda_transbody_end_customer: endCustomer
                  ? endCustomer
                  : "",
                custbody_cntm_tool_number: toolNum ? toolNum : "",
                custbody_cntm_cust_rev: revision ? revision : "",
                custbody_cntm_project: project ? project : "",
              },
            });
            // currentRec.setValue({fielsId:'custbody_rda_transbody_end_customer',value:endCustomer})
          }
        }
        if (currentRec.type == "workorder") {
          log.audit("in create WO");
          var so = currentRec.getValue({
            fieldId: "custbody_cnt_created_fm_so",
          });

          var endCustomer;
          var toolNum;
          var revision;
          var project;
          var woID = currentRec.id;
          var subsidairy = currentRec.getValue({ fieldId: "subsidiary" });
          var woRec = record.load({
            type: currentRec.type,
            id: currentRec.id,
            isDynamic: true,
          });
          var rdis_item = woRec.getValue({ fieldId: "assemblyitem" });
          var itemLookup = search.lookupFields({
            type: "item",
            id: rdis_item,
            columns: ["custitem_cntm_subtype"],
          });
          var isAsm = false;
          var itemType = itemLookup.custitem_cntm_subtype[0].value;
          var isasmflag = currentRec.getValue({
            fieldId: "custbody_cntm_is_asm_wo",
          });
          log.audit("itemType :" + itemType, "isasmflag :" + isasmflag);
          if ((isasmflag == false || isasmflag == "F") && itemType == "9") {
            // RDIS
            // item
            //log.debug("in creating op records");
            isAsm = true;
            woRec.setValue({
              fieldId: "custbody_cntm_is_asm_wo",
              value: isAsm,
            });
            /*record.submitFields({
                  type: currentRec.type,
                  id: currentRec.id,
                  values: {
                    custbody_cntm_is_asm_wo: isAsm,
                  },
                });*/
            // create custom records for client app
            //createOperationRec(woID);
          }
          if (so) {
            var soFieldLookUp = search.lookupFields({
              type: "salesorder",
              id: so,
              columns: [
                "custbody_rda_transbody_end_customer",
                "custbody_cntm_tool_number",
                "custbody_cntm_cust_rev",
                "custbody_cntm_project",
              ],
            });
            if (soFieldLookUp) {
              if (soFieldLookUp.custbody_rda_transbody_end_customer)
                endCustomer = soFieldLookUp
                  .custbody_rda_transbody_end_customer[0]
                  ? soFieldLookUp.custbody_rda_transbody_end_customer[0].value
                  : "";
              toolNum = soFieldLookUp.custbody_cntm_tool_number[0]
                ? soFieldLookUp.custbody_cntm_tool_number[0].value
                : "";
              revision = soFieldLookUp.custbody_cntm_cust_rev;
              project = soFieldLookUp.custbody_cntm_project[0]
                ? soFieldLookUp.custbody_cntm_project[0].value
                : "";
            }
            // if(endCustomer)
            woRec.setValue({
              fieldId: "custbody_rda_transbody_end_customer",
              value: endCustomer ? endCustomer : "",
            });
            woRec.setValue({
              fieldId: "custbody_cntm_tool_number",
              value: toolNum ? toolNum : "",
            });
            woRec.setValue({
              fieldId: "custbody_cntm_cust_rev",
              value: revision ? revision : "",
            });
            woRec.setValue({
              fieldId: "custbody_cntm_project",
              value: project ? project : "",
            });
            /* record.submitFields({
                   type: currentRec.type,
                   id: currentRec.id,
                   values: {
                     custbody_rda_transbody_end_customer: endCustomer
                       ? endCustomer
                       : "",
                     custbody_cntm_tool_number: toolNum ? toolNum : "",
                     custbody_cntm_cust_rev: revision ? revision : "",
                     custbody_cntm_project: project ? project : "",
                   },
                 });*/
            // currentRec.setValue({fielsId:'custbody_rda_transbody_end_customer',value:endCustomer})
          }
          var lines = woRec.getLineCount({ sublistId: "item" });
          for (var line = 0; line < lines; line++) {
            var lineItemType = woRec.getSublistValue({
              sublistId: "item",
              fieldId: "itemtype",
              line: line,
            });
            if (lineItemType == "InvtPart") {
              woRec.selectLine({ sublistId: "item", line: line });
              var bomQty = woRec.getCurrentSublistValue({
                sublistId: "item",
                fieldId: "bomquantity",
              });
              bomQty = Math.round(bomQty);
              woRec.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "bomquantity",
                value: bomQty,
              });
              woRec.commitLine({ sublistId: "item" });
            }
          }
          var savedId = woRec.save();
          log.debug("savedId", savedId);
        }
        /*
         * if (currentRec.type == 'purchaseorder'){ var
         * intercoStat=currentRec.getValue({fieldId:'intercostatus'}); var
         * endCustomer; if(intercoStat==1){ var
         * so=currentRec.getValue({fieldId:'createdfrom'}); var soFieldLookUp =
         * search .lookupFields({ type : 'salesorder', id : so, columns : [
         * 'custbody_rda_transbody_end_customer' ] }); if(soFieldLookUp){
         * if(soFieldLookUp.custbody_rda_transbody_end_customer)
         * endCustomer=soFieldLookUp.custbody_rda_transbody_end_customer[0]?soFieldLookUp.custbody_rda_transbody_end_customer[0].value:''; }
         * if(endCustomer) record .submitFields({ type : currentRec.type, id :
         * currentRec.id, values : { custbody_rda_transbody_end_customer :
         * endCustomer } });
         * //currentRec.setValue({fielsId:'custbody_rda_transbody_end_customer',value:endCustomer}) } }
         */
      }

      // if (currentRec.type == 'workorderissue') { //
      // //log.debug('currentRec.id', currentRec.id);
      // if (scriptContext.type == 'create') {
      // var isRework=currentRec.getValue({
      // fieldId : 'custbody_cntm_is_rework_wo'
      // });
      // var woId = currentRec.getValue({
      // fieldId : 'createdfrom'
      // });

      // if (woId) {
      // var lotFromCompletion = currentRec.getValue({
      // fieldId : 'custbody_cntm_prev_lot_rec'//
      // 'custbody_cntm_lot_from_completion'
      // });
      // //log.debug('lotFromCompletion',lotFromCompletion);
      // var assemblyItem = currentRec
      // .getValue({
      // fieldId : 'item'// 'assemblyitem'
      // });
      // var noOfPanels = currentRec.getValue({
      // fieldId : 'custbody_cntm_no_of_panel'
      // });
      // var isPanelCreated=currentRec.getValue({
      // fieldId : 'custbody_cntm_panel_wo_created'
      // });
      // if(isPanelCreated==true||isPanelCreated=='T')
      // noOfPanels = currentRec.getValue({
      // fieldId : 'custbody_cntm_no_of_new_lots'
      // });
      // var params={};

      // if(lotFromCompletion){
      // /*params={
      // custscript_cntm_woid : woId,
      // custscript_cntm_panels : noOfPanels,
      // custscript_cntm_fab_item : assemblyItem,
      // custscript_cntm_is_issue:'T',
      // custscript_cntm_is_rework:isRework==true?'T':'F',
      // custscript_cntm_issue_id:currentRec.id,
      // custscript_cntm_lot_from_completion:lotFromCompletion
      // };*/
      // }else{
      // var filters=[];
      // filters.push(["custrecord_cntm_lot_wonum",
      // "anyof", woId ]);
      // var customrecord_cntm_lot_creationSearchObj = search
      // .create({
      // type : "customrecord_cntm_lot_creation",
      // filters : filters,
      // columns : [
      // search
      // .createColumn({
      // name : "custrecord_cntm_lot_wonum",
      // sort : search.Sort.ASC,
      // label : "WO#"
      // }),
      // search
      // .createColumn({
      // name : "custrecord_cntm_lot_wo_completion",
      // label : "WO Completion "
      // }),
      // search
      // .createColumn({
      // name : "custrecord_cntm_lot_assembly_item",
      // label : "Assembly Item "
      // }),
      // search
      // .createColumn({
      // name : "custrecord_cntm_lot_lotnumber",
      // label : "LOT#"
      // }),
      // search
      // .createColumn({
      // name : "custrecord_cntm_wo_details_fab",
      // label : "Parent"
      // }) ]
      // });
      // var searchResultCount = customrecord_cntm_lot_creationSearchObj
      // .runPaged().count;
      // log
      // .debug(
      // "customrecord_cntm_lot_creationSearchObj result count",
      // searchResultCount);

      // if (searchResultCount == 0) {
      // //log.debug('noOfPanels', noOfPanels);
      // if (noOfPanels || isRework) {
      // params={
      // custscript_cntm_woid : woId,
      // custscript_cntm_panels : noOfPanels,
      // custscript_cntm_fab_item : assemblyItem,
      // custscript_cntm_is_issue:'T',
      // custscript_cntm_is_rework:isRework==true?'T':'F',
      // custscript_cntm_issue_id:currentRec.id,
      // custscript_cntm_lot_from_completion:lotFromCompletion1186
      // };
      // }
      // }
      // * else if(isRework){
      // *
      // customrecord_cntm_lot_creationSearchObj.run().each(function(result){
      // * //.run().each has a limit of 4,000 results
      // * var lotRecId=result.id; var lotRec =
      // * record.load({ type:
      // * 'customrecord_cntm_lot_creation', id:
      // * lotRecId}); var
      // * woArr=lotRec.getValue({fieldId:'custrecord_cntm_lot_wonum'});
      // * //log.debug('woArr',woArr); woArr.push(woId);
      // * lotRec.setValue({fieldId:'custrecord_cntm_lot_wonum',value:woArr});
      // * lotRec.save(); return true; }); params={
      // * custscript_cntm_woid : woId,
      // * custscript_cntm_panels : noOfPanels,
      // * custscript_cntm_fab_item : assemblyItem,
      // * custscript_cntm_is_issue:'T',
      // * custscript_cntm_is_rework:'T' }; }
      // */
      // if(params && JSON.stringify(params)!='{}'){

      // var scriptTask = task.create({
      // taskType : task.TaskType.SCHEDULED_SCRIPT
      // });
      // scriptTask.scriptId = 'customscript_cntm_ss_pcb_lot_num';
      // // scriptTask.deploymentId =
      // // 'customdeploy_cntm_ss_pcb_lot_num';
      // scriptTask.params =params;
      // var scriptTaskId = scriptTask.submit();
      // var status = task
      // .checkStatus(scriptTaskId).status;
      // //log.debug(scriptTaskId);

      // }
      // }

      // }
      // }
      // }//
      if (runtime.executionContext === runtime.ContextType.USER_INTERFACE) {
        if (currentRec.type == "workorderissue") {
          //log.debug("currentRec.id WOI", currentRec.id);

          if (scriptContext.type == "create") {
            var woId = currentRec.getValue({
              fieldId: "createdfrom",
            });
            //log.debug("WOID WOI :", woId);

            if (woId) {
              // custbody_rda_wo_issue_okay
              record.submitFields({
                type: record.Type.WORK_ORDER,
                id: woId,
                values: {
                  custbody_rda_wo_issue_okay: false,
                  custbody_cntm_hidden_for_woi: true,
                },
              });
              //log.debug("---FALSE SETTED---");
            }
          } // if create
        } // if workorderissue

        //For CREATE NEW ROUTING - change on  25-08-2022
        if (currentRec.type == "customrecord_cntm_wo_bom_import_fab") {
          log.audit("---HERE---");
          var isDeleteProcess = currentRec.getValue({
            fieldId: "custrecord_cntm_delete_n_update_bom",
          });

          if (isDeleteProcess == true || isDeleteProcess == "T") {
            var SO = currentRec.getValue({
              fieldId: "custrecord_cntm_sales_order_fab",
            });
            var item = currentRec.getValue({
              fieldId: "custrecord_cntm_fab_item",
            });
            var qty = currentRec.getValue({
              fieldId: "custrecord_cntm_so_qty_fab",
            });
            var location = currentRec.getValue({
              fieldId: "custrecord_cntm_so_location_fab",
            });
            var expShip = currentRec.getValue({
              fieldId: "custrecord_cntm_so_expctd_ship_dt",
            });
            var isInterco = currentRec.getValue({
              fieldId: "custrecord_cntm_is_interco_tran",
            });
            var isCon = currentRec.getValue({
              fieldId: "custrecord_cntm_is_con",
            });
            record.delete({
              type: "customrecord_cntm_wo_bom_import_fab",
              id: currentRec.id,
            });
            redirect.toRecord({
              type: "customrecord_cntm_wo_bom_import_fab",
              // id : taskRecordId,
              parameters: {
                item: item,
                salesOrder: SO,
                qty: qty,
                location: location,
                expShipDt: expShip,
                isInterco: isInterco,
                isCon: isCon,
              },
            });
          } else {
            log.audit("---isDeleteProcess else---");
            var fabStatus = currentRec.getValue({
              fieldId: "custrecord_cntm_status_fab_wo_crtn",
            });
            log.audit("fabStatus", fabStatus);

            var newJob = currentRec.getValue({
              fieldId: "custrecord_cntm_new_job_fab",
            });
            var repJob = currentRec.getValue({
              fieldId: "custrecord_cntm_repeat_job_fab",
            });
            var newToRepJob = currentRec.getValue({
              fieldId: "custrecord_cntm_new_to_existing_bom",
            });

            var newRouting = currentRec.getValue({
              fieldId: "custrecord_cntm_create_new_routing_fab",
            });
            log.audit(" newRouting :", newRouting);

            var toCrateRouting = false;
            if (repJob == true && newRouting == true) toCrateRouting = true;

            //
            var isRepJob = false;
            if (repJob == true && newToRepJob == false) isRepJob = true;

            log.debug("toCrateRouting", toCrateRouting);
            log.debug("isRepJob", isRepJob);
            var boardsPerPanel = currentRec.getValue({
              fieldId: "custrecord_cntm_boards_per_panel_fab",
            });
            //log.debug("boardsPerPanel", boardsPerPanel);
            var depndFile = currentRec.getValue({
              fieldId: "custrecord_cntm_bom_dependecy_file_fab",
            });
            var item = currentRec.getValue({
              fieldId: "custrecord_cntm_fab_item",
            });
            var isInterco = currentRec.getValue({
              fieldId: "custrecord_cntm_is_interco_tran",
            });
            var isCon = currentRec.getValue({
              fieldId: "custrecord_cntm_is_con",
            });
            if (
              fabStatus == 6 ||
              fabStatus == 13 ||
              fabStatus == 8 ||
              (isRepJob == true && fabStatus == "" && toCrateRouting == false)
            ) {
              log.audit("fabStatus if:", fabStatus);
              try {
                if (isRepJob == false && fabStatus != "")
                  record.submitFields({
                    type: currentRec.type,
                    id: currentRec.id,
                    values: {
                      custrecord_cntm_status_fab_wo_crtn: 7,
                      custrecord_cntm_error_fab: "",
                    },
                  });
                var toolNumId = currentRec.getValue({
                  fieldId: "custrecord_cntm_toolnum_fab",
                });
                var toolNumberFieldLookUp = search.lookupFields({
                  type: "customrecord_cntm_job_id",
                  id: toolNumId,
                  columns: ["name", "custrecord5", "custrecord6"],
                });
                //log.debug("toolNumberFieldLookUp", toolNumberFieldLookUp);
                var toolNum = toolNumberFieldLookUp.name;
                /*
                 * var toolNum = currentRec.getText({ fieldId :
                 * 'custrecord_cntm_toolnum_fab' });
                 */
                var errFile = currentRec.getValue({
                  fieldId: "custrecord_cntm_err_file",
                });
                var location = currentRec.getValue({
                  fieldId: "custrecord_cntm_so_location_fab",
                });
                var scriptTask = task.create({
                  taskType: task.TaskType.MAP_REDUCE,
                });
                scriptTask.scriptId = "customscript_cntm_pcb_wo";
                // scriptTask.deploymentId =
                // 'customdeploy_cntm_mr_qt_item_import';
                scriptTask.params = {
                  custscript_cntm_fab_depend_file: depndFile,
                  custscript_cntm_fab_toolnum: toolNum,
                  custscript_cntm_fab_toolnum_id: toolNumId,
                  custscript_cntm_fab_recid: currentRec.id,
                  custscript_cntm_fab_location: location,
                  custscript_cntm_boards_per_panel: boardsPerPanel,
                  custscript_cntm_errfile: errFile,
                  custscript_cntm_fab_rectype: currentRec.type,
                  custscript_cntm_is_rep_job: isRepJob,
                  custscript_cntm_fab_asmblyitem: item,
                  custscript_cntm_is_interco_tran: isInterco,
                  custscript_cntm_is_con_item: isCon,
                };

                var scriptTaskId = scriptTask.submit();
                var status = task.checkStatus(scriptTaskId).status;
                //log.debug(scriptTaskId);
              } catch (e) {
                log.error("error:", e.message);
                record.submitFields({
                  type: currentRec.type,
                  id: currentRec.id,
                  values: {
                    custrecord_cntm_status_fab_wo_crtn: 13,
                    custrecord_cntm_error_fab: e.message,
                  },
                });
              }
            } else {
              log.audit("fabStatus 6 else");
              var stratStatusMap = { "": 1, 4: 5, 9: 9, 10: 10, 12: 12 };
              var errorStatusMap = { "": 9, 4: 10, 9: 9, 10: 10, 12: 12 };
              if (repJob == true) errorStatusMap[""] = 10;
              var isRoutingProcess = false;

              var isNewRouting = false;
              if (
                fabStatus == 4 ||
                fabStatus == 12 ||
                (toCrateRouting == true && fabStatus == "")
              ) {
                // if (fabStatus == 4 || fabStatus == 12 ) {
                log.audit("Set isRoutingProcess true");
                isRoutingProcess = true;
                isNewRouting = true;
              }
              var bomFile = currentRec.getValue({
                fieldId: "custrecord_bom_raw_file_fab",
              });
              var isReprocess = currentRec.getValue({
                fieldId: "custrecord_cntm_is_reprocess",
              });
              //log.debug("isReprocess", isReprocess);
              var routFile = currentRec.getValue({
                fieldId: "custrecord_cntm_mfg_routing_filr_fab",
              });
              var fileTypeFor = [];
              if (depndFile) {
                var fileObj = file.load({
                  id: depndFile,
                });
                if (
                  fileObj.fileType != "CSV" &&
                  fileObj.fileType != "PLAINTEXT"
                ) {
                  fileTypeFor.push("BOM Dependency File");
                }
              }
              if (bomFile) {
                var fileObj = file.load({
                  id: bomFile,
                });
                if (fileObj.fileType != "CSV") {
                  fileTypeFor.push("BOM Raw File");
                }
              }
              if (routFile) {
                var fileObj = file.load({
                  id: routFile,
                });
                if (fileObj.fileType != "CSV") {
                  fileTypeFor.push("Manufacturing Routing File");
                }
              }
              if (fileTypeFor.length > 0) {
                record.submitFields({
                  type: currentRec.type,
                  id: currentRec.id,
                  values: {
                    custrecord_cntm_status_fab_wo_crtn:
                      errorStatusMap[fabStatus],
                    custrecord_cntm_error_fab:
                      "Import files Must be of CSV or Text format.",
                  },
                });
              } else {
                log.audit("TASK");
                var errFile = currentRec.getValue({
                  fieldId: "custrecord_cntm_err_file",
                });

                var toolNum = currentRec.getValue({
                  fieldId: "custrecord_cntm_toolnum_fab",
                });
                var bom = currentRec.getValue({
                  fieldId: "custrecord_cntm_bom_fab",
                });
                log.audit("bom :", bom);

                var scriptTask = task.create({
                  taskType: task.TaskType.MAP_REDUCE,
                });

                scriptTask.scriptId = "customscript_mr_cntm_bom_creation";
                // scriptTask.deploymentId =
                // 'customdeploy_cntm_mr_qt_item_import';
                scriptTask.params = {
                  custscript_cntm_bom_file: bomFile,
                  custscript_cntm_dependancy_file: depndFile,
                  custscript_cntm_routing_file: routFile,
                  custscript_cntm_tool_number: toolNum,
                  custscript_cntm_curr_record_id: currentRec.id,
                  custscript_cntm_existing_bom: bom,
                  custscript_cntm_is_routing: isRoutingProcess,
                  custscript_cntm_fab_status: fabStatus,
                  custscript_cntm_err_file: errFile,
                  custscript_cntm_boardsperpanel: boardsPerPanel,
                  custscript_cntm_item_fab: item,
                  custscript_cntm_is_reprocess: isReprocess,
                  custscript_cntm_is_interco_trans: isInterco,
                  custscript_cntm_is_con: isCon,
                  //vishal added parameter
                  custscript_cntm_new_routing: isNewRouting,
                };

                var scriptTaskId = scriptTask.submit();
                var status = task.checkStatus(scriptTaskId).status;
                //log.debug(scriptTaskId);

                /*
                 * if (!fabStatus) { record .submitFields({ type :
                 * currentRec.type, id : currentRec.id, values : {
                 * custrecord_cntm_status_fab_wo_crtn : 2 } }); }
                 */
              }
            }
            redirect.toRecord({
              type: currentRec.type,
              id: currentRec.id,
              // isEditMode : true
            });
          }
        }

        //HERE NEED TO LOOK
        //WORKING ON
        if (currentRec.type == "customrecord_cntm_asm_wocreation") {
          log.debug("rec type   customrecord_cntm_asm_wocreation :");

          var userObj = runtime.getCurrentUser();

          var empName = userObj.name; //-
          // var err = '';
          var item = currentRec.getValue({
            //-
            fieldId: "custrecord_cntm_asm_item",
          });
          log.debug("item :", item);

          var subsidiary = currentRec.getValue({
            //-
            fieldId: "custrecord_cntm_so_subsidiary_asm_wo",
          });
          log.debug("subsidiary :", subsidiary);

          var location = currentRec.getValue({
            fieldId: "custrecord_cntm_so_location_asm_wo",
          });
          log.debug("location :", location);

          var status = currentRec.getValue({
            fieldId: "custrecord_cntm_status_asmwocreation",
          });
          log.debug("status :", status);

          var newJob = currentRec.getValue({
            fieldId: "custrecord_cntm_new_jobs",
          });
          log.debug("newJob :", newJob);

          var repeatJob = currentRec.getValue({
            fieldId: "custrecordcntm_repeat_job",
          });
          log.debug("repeatJob", repeatJob);

          var toolNum = currentRec.getValue({
            fieldId: "custrecord_cntm_toolnumber_asmwo",
          });
          log.debug("toolNum", toolNum);

          var toolNumLookUp = search.lookupFields({
            type: "customrecord_cntm_job_id",
            id: toolNum,
            columns: ["name"],
          });
          var toolNumName = toolNumLookUp.name;
          log.debug("toolNumName", toolNumName);

          var so = currentRec.getValue({
            fieldId: "custrecord_so_number_asmwo",
          });
          var custRev = currentRec.getValue({
            fieldId: "custrecord_cntm_cust_rev",
          });
          log.debug("custRev", custRev);

          var soObj = record.load({
            id: so,
            type: "salesorder",
            isDynamic: true,
          });
          var intercomptran = soObj.getValue({ fieldId: "intercotransaction" });
          log.debug("intercomptran", intercomptran);

          var count = soObj.getLineCount({
            sublistId: "item",
          });
          log.debug("count", count);

          var revArr = [];
          for (var i = 0; i < count; i++) {
            //ON SO lines
            var custRev = soObj.getSublistValue({
              sublistId: "item",
              fieldId: "custcolcustcol_cntm_custasmrev",
              line: i,
            });
            var subtype = soObj.getSublistText({
              sublistId: "item",
              fieldId: "custcol_cntm_item_subtype",
              line: i,
            });

            if (subtype == "ASM" || (intercomptran && subtype == "RDIS")) {
              revArr.push(custRev);
            }
          }

          log.debug("revArr", revArr);

          var asmRecord = record.load({
            type: currentRec.type,
            id: currentRec.id,
            isDynamic: true,
          });
          log.debug("IN ASM id", currentRec.id);
          log.debug("IN ASM typpe", currentRec.type);
          var bomRevArr = [];
          var woArr = [];
          var notCSV = [];
          var idsMap = {};

          var lineCount = currentRec.getLineCount({
            sublistId: "recmachcustrecord_cntm_asmwoqty", // ?
          });
          log.audit(
            "scriptContext.type " + scriptContext.type,
            "lineCount :" + lineCount
          );

          for (var i = 0; i < lineCount; i++) {
            var err = "";
            try {
              // get and set child ref on SO lines
              if (scriptContext.type == "create") {
                var asmChildRecSearch = search.create({
                  type: "customrecord_cntm_wodetailsfor_asmwocrt",
                  filters: [["custrecord_cntm_asmwoqty", "is", currentRec.id]],
                  columns: [
                    search.createColumn({ name: "internalid" }),
                    search.createColumn({
                      name: "custrecord_cntm_wo_cust_rev",
                    }),
                  ],
                });
                var asmChildRecCount = asmChildRecSearch.runPaged().count;
                log.debug("asmChildRecSearch : " + asmChildRecCount);

                if (asmChildRecCount > 0) {
                  asmChildRecSearch.run().each(function (result) {
                    var id = result.id;
                    var customRev = result.getValue(
                      "custrecord_cntm_wo_cust_rev"
                    );
                    idsMap[customRev] = id;
                    return true;
                  });
                }
              }
              log.debug("idsMap", idsMap);

              var notcsvfile = {};
              log.audit("in creatingBOM rec");
              var bomRevMap = {};
              var existingBOM = currentRec.getSublistValue({
                //CHECK box
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_use_existingbomrev",
                line: i,
              });

              var createREV = currentRec.getSublistValue({
                //CHECK box
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_rdacreateonlyrevision",
                line: i,
              });
              var bomandrev = currentRec.getSublistValue({
                //CHECK box
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_create_bom_and_rev",
                line: i,
              });

              var bom = currentRec.getSublistValue({
                ///CUSTOMER REVISION (BOM RECORD)
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_cust_rev_created",
                line: i,
              });
              var custRevLine = currentRec.getSublistValue({
                //ASM BOM (CUST REV)
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_wo_cust_rev",
                line: i,
              });
              var bomfile = currentRec.getSublistValue({
                //RDA IMPORT FILE
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_rda_rev_file",
                line: i,
              });
              var linebomrev = currentRec.getSublistValue({
                //BOM REV
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_bom_rev_asm",
                line: i,
              });
              var linestatus = currentRec.getSublistValue({
                //STATUS
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_status_asm_child",
                line: i,
              });
              var reimport = currentRec.getSublistValue({
                //REPROCESS
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_bomrev_reimport",
                line: i,
              });
              log.audit(
                "existingBOM :" +
                  existingBOM +
                  "createREV :" +
                  createREV +
                  "bomandrev :" +
                  bomandrev
              );

              bomRevMap.file = bomfile;
              bomRevMap.index = i;
              bomRevMap.reimport = reimport;

              log.debug(
                "linestatus:" + linestatus,
                "bom :" +
                  bom +
                  " reimport :" +
                  reimport +
                  "linebomrev :" +
                  linebomrev
              );
              if (bom) {
                log.debug("BOM");
                if (reimport == "T" || reimport == true) {
                  log.debug(' IF reimport == "T" ');
                  bomRevMap.bom = bom;

                  if (linebomrev) {
                    bomRevMap.bomrev = linebomrev;
                  }
                  bomRevArr.push(bomRevMap);
                  asmRecord.selectLine({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    line: i,
                  });
                  asmRecord.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_status_asm_child",

                    value: 3,
                  });
                  asmRecord.commitLine({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                  });
                } else {
                  log.debug("BOM ELSE");
                  if (
                    linestatus == "" ||
                    linestatus == 11 ||
                    linestatus == 10 ||
                    linestatus == 15 ||
                    linestatus == 13
                  ) {
                    log.audit("linebomrev :" + linebomrev);
                    bomRevMap.bom = bom;
                    if (
                      linestatus == "" ||
                      linestatus == 11 ||
                      linestatus == 10 ||
                      linestatus == 15
                    ) {
                      if (linebomrev) {
                        bomRevMap.bomrev = linebomrev;
                      }
                    }
                    bomRevArr.push(bomRevMap);
                  }
                }
              }
              log.debug(" bomRevArr  :", bomRevArr);

              log.debug("-----HEREEE-----", linestatus);
              /**
                   * //Modifed here on 12-05-2022 BY Vishal because it doesnt process when there is an error in WO creation
    
                   */
              // if (linestatus == 10 ||linestatus == 11 ||linestatus == "" ||linestatus == 13 ||linestatus == 9) {
              if (
                linestatus == 10 ||
                linestatus == 11 ||
                linestatus == "" ||
                linestatus == 9
              ) {
                log.debug("IF linestatus ");
                if (reimport == "F" || reimport == false) {
                  // if(!bom){
                  log.debug("IF reimport ");
                  if (
                    (newJob == false || newJob == "F") &&
                    (existingBOM == "F" || existingBOM == false) &&
                    (createREV == false || createREV == "F") &&
                    (bomandrev == false || bomandrev == "F")
                  ) {
                    log.debug("IF newJob ");
                  } else {
                    log.debug("ELSE newJob ");
                    if (
                      !bom &&
                      bomfile != undefined &&
                      bomfile != null &&
                      bomfile != ""
                    ) {
                      log.debug("create bom and bom rev");
                      if (linestatus == "") {
                        log.debug("linestatus == ");
                        asmRecord.selectLine({
                          sublistId: "recmachcustrecord_cntm_asmwoqty",
                          line: i,
                        });
                        asmRecord.setCurrentSublistValue({
                          sublistId: "recmachcustrecord_cntm_asmwoqty",
                          fieldId: "custrecord_cntm_status_asm_child",
                          value: 2,
                        });
                        asmRecord.commitLine({
                          sublistId: "recmachcustrecord_cntm_asmwoqty",
                        });
                      }

                      var bomName = toolNumName + "-ASM-" + " " + custRevLine;
                      log.audit("bomName :" + bomName);
                      var bomSearch = search.create({
                        type: "bom",
                        filters: [["name", "is", bomName]],
                        columns: [
                          search.createColumn({
                            name: "internalid",
                          }),
                        ],
                      });
                      var bomCount = bomSearch.runPaged().count;
                      log.debug("bomCount : " + bomCount);
                      if (bomCount > 0) {
                        err = "The BOM record is already exist.";

                        asmRecord.selectLine({
                          sublistId: "recmachcustrecord_cntm_asmwoqty",
                          line: i,
                        });

                        asmRecord.setCurrentSublistValue({
                          sublistId: "recmachcustrecord_cntm_asmwoqty",
                          fieldId: "custrecord_cntm_status_asm_child",
                          value: 9,
                        });

                        asmRecord.setCurrentSublistValue({
                          sublistId: "recmachcustrecord_cntm_asmwoqty",
                          fieldId: "custrecord_cntm_err_asm_child",
                          value: err,
                          ignoreFieldChange: true,
                          forceSyncSourcing: true,
                        });

                        asmRecord.commitLine({
                          sublistId: "recmachcustrecord_cntm_asmwoqty",
                        });
                      } else {
                        log.audit("in create om bom");
                        bomRevMap.file = bomfile;

                        //BOM CREATING HERE
                        var bom_obj = record.create({
                          type: record.Type.BOM,
                          isDynamic: true,
                        });
                        bom_obj.setValue({
                          fieldId: "name",
                          value: bomName,
                        });
                        bom_obj.setValue({
                          fieldId: "custrecord_cntm_asm_bom_rev_soline",
                          value: custRevLine,
                        });
                        bom_obj.setValue({
                          fieldId: "availableforallassemblies",
                          value: false,
                        });
                        bom_obj.setValue({
                          fieldId: "availableforalllocations",
                          value: false,
                        });
                        bom_obj.setValue({
                          fieldId: "subsidiary",
                          value: subsidiary,
                        });
                        bom_obj.setValue({
                          fieldId: "restricttoassemblies",
                          value: item,
                        });
                        bom_obj.setValue({
                          fieldId: "restricttolocations",
                          value: location,
                        });
                        bom_obj.setValue({
                          fieldId: "custrecord_cntm_tool_number",
                          value: toolNum,
                        });
                        bom_obj.setValue({
                          fieldId: "usecomponentyield",
                          value: true,
                        });
                        try {
                          bom = bom_obj.save({
                            ignoreMandatoryFields: true,
                            enableSourcing: true,
                          });
                          bomRevMap.bom = bom;
                          var bomRec = record.load({
                            type: record.Type.BOM,
                            id: bom,
                            isDynamic: true,
                          });
                          bomRec.selectNewLine({
                            sublistId: "assembly",
                          });
                          bomRec.setCurrentSublistValue({
                            sublistId: "assembly",
                            fieldId: "assembly",
                            value: item,
                          });
                          bomRec.commitLine({
                            sublistId: "assembly",
                          });
                          bom = bomRec.save({
                            ignoreMandatoryFields: true,
                            enableSourcing: true,
                          });
                          log.audit("bom :" + bom);
                        } catch (e) {
                          log.error("ERROR WHILE CREATION BOM RECORD-", e);
                          err = e.message;
                        }

                        if (err) {
                          asmRecord.selectLine({
                            sublistId: "recmachcustrecord_cntm_asmwoqty",
                            line: i,
                          });

                          asmRecord.setCurrentSublistValue({
                            sublistId: "recmachcustrecord_cntm_asmwoqty",
                            fieldId: "custrecord_cntm_err_asm_child",

                            value: err,
                          });
                          asmRecord.setCurrentSublistValue({
                            sublistId: "recmachcustrecord_cntm_asmwoqty",
                            fieldId: "custrecord_cntm_status_asm_child",

                            value: 9,
                          });
                          asmRecord.commitLine({
                            sublistId: "recmachcustrecord_cntm_asmwoqty",
                          });
                        } else {
                          asmRecord.selectLine({
                            sublistId: "recmachcustrecord_cntm_asmwoqty",
                            line: i,
                          });

                          asmRecord.setCurrentSublistValue({
                            sublistId: "recmachcustrecord_cntm_asmwoqty",
                            fieldId: "custrecord_cntm_status_asm_child",

                            value: 3,
                          });

                          asmRecord.setValue({
                            fieldId: "custrecord_cntm_error_amswocreation",
                            value: " ",
                            ignoreFieldChange: true,
                            forceSyncSourcing: true,
                          });

                          asmRecord.setCurrentSublistValue({
                            sublistId: "recmachcustrecord_cntm_asmwoqty",
                            fieldId: "custrecord_cntm_cust_rev_created",

                            value: bom,
                          });
                          asmRecord.commitLine({
                            sublistId: "recmachcustrecord_cntm_asmwoqty",
                          });

                          bomRevArr.push(bomRevMap);
                        }
                      }
                    }
                  }
                }
              } else if (
                linestatus == 6 ||
                linestatus == 11 ||
                linestatus == 13 ||
                linestatus == 8
              ) {
                log.debug("ELSE IF linestatus ", linestatus);

                try {
                  var woMap = {};
                  var mfgRoutSearch = search.create({
                    type: "manufacturingrouting",
                    filters: [
                      [
                        "custrecord_cntm_asm_wo_crtn_rec",
                        "anyof",
                        currentRec.id,
                      ],
                      "AND",
                      ["custrecord_cntm_is_copied_from_asm_wo", "is", true],
                      "AND",
                      ["custrecord_cntm_is_saved_from_asm_wo", "is", false],
                    ],
                    columns: [
                      search.createColumn({
                        name: "internalid",
                      }),
                    ],
                  });
                  var routCount = mfgRoutSearch.runPaged().count;
                  if (routCount > 0) {
                    mfgRoutSearch.run().each(function (result) {
                      // .run().each
                      // has a
                      // limit of
                      // 4,000
                      // results
                      var mfgId = result.getValue({
                        name: "internalid",
                      });
                      log.debug("mfgId", mfgId);
                      record.delete({
                        type: record.Type.MANUFACTURING_ROUTING,
                        id: mfgId,
                      });

                      return true;
                    });
                  }

                  var so = asmRecord.getValue({
                    fieldId: "custrecord_so_number_asmwo",
                  });

                  var soSubsidiary = asmRecord.getValue({
                    fieldId: "custrecord_cntm_so_subsidiary_asm_wo",
                  });
                  var soLocation = asmRecord.getValue({
                    fieldId: "custrecord_cntm_so_location_asm_wo",
                  });
                  var soCustomer = asmRecord.getValue({
                    fieldId: "custrecord_cntm_customer_asm_wo",
                  });
                  var isintercompanyso = asmRecord.getValue({
                    fieldId: "custrecord_cntm_is_intercompany_so",
                  });
                  var endcustomer = asmRecord.getValue({
                    fieldId: "custrecord_cntm_asm_end_customer",
                  });
                  var project = asmRecord.getValue({
                    fieldId: "custrecord_cntm_job",
                  });
                  var toolnumber = asmRecord.getValue({
                    fieldId: "custrecord_cntm_toolnumber_asmwo",
                  });
                  //changes for unique key

                  var asm_uniqueKey = asmRecord.getValue({
                    fieldId: "custrecord_cntm_asm_so_line_uni_key",
                  });

                  log.debug("asm_uniqueKey1  ", asm_uniqueKey);
                  var bom = asmRecord.getSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_cust_rev_created",
                    line: i,
                  });

                  var asm_bom = asmRecord.getSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_wo_cust_rev",
                    line: i,
                  });
                  var rdafile = asmRecord.getSublistText({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_rda_rev_file",
                    line: i,
                  });
                  var woNo = asmRecord.getSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_wonumb_asm_wocrtn",
                    line: i,
                  });
                  var woQty = asmRecord.getSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_woqty_asmwocrtn",
                    line: i,
                  });

                  if (!woNo) {
                    log.debug("!woNo");
                    var releasedDate = asmRecord.getSublistValue({
                      sublistId: "recmachcustrecord_cntm_asmwoqty",
                      fieldId: "custrecord_cntm_woreleasedate_asmwocrtn",
                      line: i,
                    });
                    var shipdate = asmRecord.getSublistValue({
                      sublistId: "recmachcustrecord_cntm_asmwoqty",
                      fieldId: "custrecord_cntm_wo_shipdate",
                      line: i,
                    });
                    releasedDate = releasedDate ? releasedDate : new Date();
                    var scheduledDate = asmRecord.getSublistValue({
                      sublistId: "recmachcustrecord_cntm_asmwoqty",
                      fieldId: "custrecord_cntm_scheduledate_wocrtn",
                      line: i,
                    });
                    var so_type = asmRecord.getSublistValue({
                      sublistId: "recmachcustrecord_cntm_asmwoqty",
                      fieldId: "custrecord_so_release_type",
                      line: i,
                    });
                    var routing = asmRecord.getSublistValue({
                      sublistId: "recmachcustrecord_cntm_asmwoqty",
                      fieldId: "custrecord_cntm_manufacturing_templ",
                      line: i,
                    });
                    var job = asmRecord.getValue({
                      fieldId: "custrecord_cntm_job",
                    });
                    var custPartNo = asmRecord.getValue({
                      fieldId: "custrecord_cntm_cust_part_no",
                    });
                    log.debug("job: " + job, "custPartNo: " + custPartNo);
                    log.debug("routing :" + routing);
                    log.debug("woQty :" + woQty);
                    log.debug("releasedDate :" + releasedDate);
                    log.debug("scheduledDate :" + scheduledDate);
                    log.debug("scheduledDate ;", typeof scheduledDate);
                    log.debug("shipdate :", shipdate);
                    if (
                      woQty != undefined &&
                      woQty != null &&
                      woQty != "" &&
                      releasedDate != undefined &&
                      releasedDate != null &&
                      releasedDate != "" &&
                      scheduledDate != undefined &&
                      scheduledDate != null &&
                      scheduledDate != ""
                    ) {
                      log.debug("FIRST IF");
                      if (revArr.indexOf(asm_bom) > -1) {
                        log.debug("SECOFNd IF");

                        //Calling backend suitelet for WO creation
                        var callSuitelet = url.resolveScript({
                          scriptId: "customscriptcntm_cntm_st_wocreation_back",
                          deploymentId:
                            "customdeploy_cntm_st_wocreation_back_dep",
                          params: {
                            soSubsidiary1: soSubsidiary, //
                            soCustomer1: soCustomer, //
                            isintercompanyso1: isintercompanyso, //
                            project1: project, //
                            endcustomer1: endcustomer, //
                            toolnumber1: toolnumber, //
                            item1: item, //
                            // 'soLocation1': soLocation,//
                            soLocation1: soLocation ? soLocation : 4, //
                            scheduledDate1: scheduledDate, //
                            so_type1: so_type, //
                            bom1: bom, //
                            shipdate1: shipdate, //
                            routing1: routing, //
                            releasedDate1: releasedDate, //
                            woQty1: woQty, //
                            so1: so, //
                            empName1: empName, //
                            // 'job1':job,
                            custPartNo1: custPartNo,
                            asm_uniqueKey1: asm_uniqueKey,
                          },
                          returnExternalUrl: true,
                        });
                        // log.debug('params :',params);
                        log.debug("callSuitelet :", callSuitelet);
                        var response = https.get({
                          url: callSuitelet,
                        });
                        log.debug("response :", response);

                        if (response != "") {
                          var error = JSON.parse(response.body).error;
                          if (error) {
                            asmRecord.selectLine({
                              sublistId: "recmachcustrecord_cntm_asmwoqty",
                              line: i,
                            });
                            log.debug("1");
                            asmRecord.setCurrentSublistValue({
                              sublistId: "recmachcustrecord_cntm_asmwoqty",
                              fieldId: "custrecord_cntm_err_asm_child",
                              value: error,
                            });
                            log.debug("2");
                            asmRecord.setCurrentSublistValue({
                              sublistId: "recmachcustrecord_cntm_asmwoqty",
                              fieldId: "custrecord_cntm_status_asm_child",
                              value: 13,
                            });
                            log.debug("3");
                            asmRecord.commitLine({
                              sublistId: "recmachcustrecord_cntm_asmwoqty",
                            });
                          } else {
                            var woId = JSON.parse(response.body).woId;
                            var bomRev = JSON.parse(response.body).bomRev;
                            log.debug("woId :", woId);
                            log.debug("bomRev :", bomRev);

                            if (woId) {
                              log.debug("INSIDE woid");
                              asmRecord.selectLine({
                                sublistId: "recmachcustrecord_cntm_asmwoqty",
                                line: i,
                              });
                              log.debug("1");
                              asmRecord.setCurrentSublistValue({
                                sublistId: "recmachcustrecord_cntm_asmwoqty",
                                fieldId: "custrecord_cntm_wonumb_asm_wocrtn",
                                value: woId,
                              });
                              log.debug("2");
                              asmRecord.setCurrentSublistValue({
                                sublistId: "recmachcustrecord_cntm_asmwoqty",
                                fieldId: "custrecord_cntm_status_asm_child",
                                value: 8,
                              });
                              asmRecord.setCurrentSublistValue({
                                sublistId: "recmachcustrecord_cntm_asmwoqty",
                                fieldId: "custrecord_cntm_err_asm_child",
                                value: "",
                              });

                              log.debug("3");
                              asmRecord.commitLine({
                                sublistId: "recmachcustrecord_cntm_asmwoqty",
                              });
                              log.debug("Commit");
                              woMap["wo"] = woId;
                              woMap["apn"] = JSON.parse(response.body).apn_ref;
                              woArr.push(woMap);
                              log.debug("woArr :", woArr);
                            }
                            if (bomRev && woId) {
                              log.debug("Inside bom rev ");

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
                              bomrevisionSearchObj
                                .run()
                                .each(function (result) {
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
                                    bagNtagVal && bagNtagVal == "Y"
                                      ? true
                                      : false;
                                  var specPart =
                                    specPartVal && specPartVal == "Y"
                                      ? true
                                      : false;
                                  var custsupplied =
                                    custsuppliedVal && custsuppliedVal == "Y"
                                      ? true
                                      : false;
                                  var stacked =
                                    stackedVal && stackedVal == "Y"
                                      ? true
                                      : false;
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
                                    fieldId: "item",
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
                              log.debug("10");
                              loadWO.save();
                              log.debug("SAVED");
                            }
                          }
                        } else {
                          log.debug("throw ");
                          throw { message: ",Error : WO Creation Process" };
                        }
                      } //IF END
                      else {
                        log.debug("ELSE 1");

                        log.audit(
                          "in error of WO creation ",
                          "cusotmer revision not same on suitelet and sales order"
                        );

                        asmRecord.selectLine({
                          sublistId: "recmachcustrecord_cntm_asmwoqty",
                          line: i,
                        });

                        asmRecord.setCurrentSublistValue({
                          sublistId: "recmachcustrecord_cntm_asmwoqty",
                          fieldId: "custrecord_cntm_status_asm_child",
                          value: 13,
                        });
                        asmRecord.setCurrentSublistValue({
                          sublistId: "recmachcustrecord_cntm_asmwoqty",
                          fieldId: "custrecord_cntm_err_asm_child",
                          value:
                            "The Cusotmer Revision does not match to the one on Sales Order.",
                        });
                        asmRecord.commitLine({
                          sublistId: "recmachcustrecord_cntm_asmwoqty",
                        });
                        log.debug("COMMIT asmRecord");
                      }
                    }
                  } else {
                    /*
                     * //log.debug("update WO Quant"); var id =
                     * record.submitFields({ type: record.Type.WORK_ORDER, id:
                     * woNo, values: { 'quantity': woQty }, options: {
                     * enableSourcing: false, ignoreMandatoryFields : true } });
                     */
                  }
                } catch (e) {
                  log.error("in error of WO creation", e);

                  // log.audit("in error of WO");
                  asmRecord.selectLine({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    line: i,
                  });

                  asmRecord.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_status_asm_child",
                    value: 13,
                  });
                  asmRecord.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_err_asm_child",
                    value: e.message,
                  });
                  asmRecord.commitLine({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                  });
                }
              }
              log.debug("------END-----");
            } catch (e) {
              log.error("error:" + e.message, JSON.stringify(e.message));
            }
          }
          log.audit("ids map ", JSON.stringify(idsMap));
          if (scriptContext.type == "create") {
            log.audit("in create loop for child rec ref");
            for (var i = 0; i < count; i++) {
              var soCustRev = soObj.getSublistValue({
                sublistId: "item",
                fieldId: "custcolcustcol_cntm_custasmrev",
                line: i,
              });
              log.audit(" soCustRev :", soCustRev);
              if (idsMap.hasOwnProperty(soCustRev)) {
                log.audit("in map property");
                soObj.selectLine({
                  sublistId: "item",
                  line: i,
                });

                soObj.setCurrentSublistValue({
                  sublistId: "item",
                  fieldId: "custcol_cntm_asm_wo_child_rec",

                  value: idsMap[soCustRev],
                });
                soObj.commitLine({
                  sublistId: "item",
                });
              }
            }
          }
          soObj.save();
          asmRecord.save();

          // ***********calling map
          // reduce*************************************************************************
          if (bomRevArr.length > 0) {
            log.audit("bomRevArr :", bomRevArr);
            var scriptTask = task.create({
              taskType: task.TaskType.MAP_REDUCE,
            });
            scriptTask.scriptId = "customscript_cntm_asm_bom_crtn";
            // scriptTask.deploymentId =
            // 'customdeploy_cntm_mr_qt_item_import';
            scriptTask.params = {
              custscript_cntm_bomrev_info: JSON.stringify(bomRevArr),
              // custscript_cntm_fileid : apnFile,
              custscript_cntm_asm_toolnum: toolNum,
              custscript_cntm_curr_rec_id: currentRec.id,
              custscript_cntm_curr_rec_type: currentRec.type,
              custscript_cntm_sales_order: so,
              custscript_cntm_item: item,
              custscript_cntm_asm_wo_status: status,
              // custscript_cntm_bom_rev_asm_wo : bomRev
            };
            var scriptTaskId = scriptTask.submit();
            var scriptStatus = task.checkStatus(scriptTaskId).status;
            //log.debug(scriptTaskId);
          }

          if (woArr.length > 0) {
            //log.debug("in sch :");
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
            //log.debug("taskID :" + taskID);
            var schStatus = task.checkStatus(taskID);
            //log.debug("schStatus :" + schStatus);
          }
          // ****************************************************************************************************************

          redirect.toRecord({
            type: "customrecord_cntm_asm_wocreation",
            id: currentRec.id,
            // isEditMode : true
          });
        }
        //ENDDDDD

        if (currentRec.type == "manufacturingrouting") {
          if (scriptContext.type == "edit") {
            // if (runtime.executionContext ===
            // runtime.ContextType.USER_INTERFACE) {

            var isCopied = currentRec.getValue({
              fieldId: "custrecord_cntm_is_copied_from_asm_wo",
            });

            var isSaved = currentRec.getValue({
              fieldId: "custrecord_cntm_is_saved_from_asm_wo",
            });
            //log.debug(isCopied, isSaved);
            if (isCopied == true && isSaved == false) {
              log.debug("here---"); // ////////SubmitField
              // throws error
              var savedMfgRec = record.load({
                type: currentRec.type,
                id: currentRec.id,
                isDynamic: true,
              });
              savedMfgRec.setValue({
                fieldId: "custrecord_cntm_is_saved_from_asm_wo",
                value: true,
              });
              //var lineVal = savedMfgRec.getValue({
              //fieldId: "custrecord_cntm_asm_rec_line",
              //});
              savedMfgRec.save();
            }
          }
        }
      }
    } catch (e) {
      log.error("error in after submit :" + e.message, JSON.stringify(e));
    }
  }
  function checkRoutingName(bom, name1, searchResultCount1) {
    var flag = false;
    var manufacturingroutingSearchObj = search.create({
      type: "manufacturingrouting",
      filters: [
        ["billofmaterials", "anyof", bom],
        "AND",
        ["name", "startswith", name1],
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
        search.createColumn({
          name: "location",
          label: "Location",
        }),
      ],
    });
    var searchResultCount = manufacturingroutingSearchObj.runPaged().count;
    var count = 0;
    var map = {};
    map["flag"] = false;
    map["count"] = searchResultCount;
    log.debug("searchResultCount", searchResultCount); //map['name']=name1;
    name1Arr = name1.split(" ");
    name1Arr.splice(name1Arr.length - 1, 1);
    var name2 = name1Arr.join(" ");
    log.debug("name2", name2);
    if (searchResultCount > 0) {
      log.debug("parseInt(searchResultCount)+1", parseInt(searchResultCount)); //+1);
      map["flag"] = true;
      map["count"] = parseInt(searchResultCount); //+1;
      name1 = name1 + " " + parseInt(searchResultCount); //+1;
      var nextMap = checkRoutingName(bom, name1, parseInt(searchResultCount)); //+1);
      if (nextMap["flag"] == true) {
        map["count"] = nextMap["count"];
      }
    }
    return map;
  }

  function convertDate(date1) {
    var date = new Date();
    date = date1;
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
  function updateNewCustRev(toolNum, custRevLine, childRec_id) {
    var childRec = record.load({
      id: childRec_id,
      type: "customrecord_cntm_wodetailsfor_asmwocrt",
    });
    var bomSearch = search.create({
      type: "bom",
      filters: [
        ["custrecord_cntm_tool_number", "is", toolNum],
        "AND",
        ["custrecord_cntm_asm_bom_rev_soline", "is", custRevLine],
      ],
      columns: [
        search.createColumn({
          name: "internalid",
        }),
      ],
    });
    var bomCount = bomSearch.runPaged().count;
    //log.debug("bomCount : " + bomCount);
    var bomid;
    if (bomCount > 0) {
      bomSearch.run().each(function (result) {
        // .run().each has a limit of 4,000
        // results
        bomid = result.id;
        return false;
      });
    }
    if (bomid != undefined && bomid != null && bomid != "") {
      // set existing bom on the line
      childRec.setValue({
        fieldId: "custrecord_cntm_cust_rev_created",
        value: bomid,
      });
      childRec.setValue({
        fieldId: "custrecord_cntm_wo_cust_rev",
        value: custRevLine,
      });
      var revSearch = search.create({
        type: "bomrevision",
        filters: [["billofmaterials", "anyof", bomid]],
        columns: [
          search.createColumn({
            name: "internalid",
            sort: search.Sort.DESC,
          }),
        ],
      });
      var revCount = revSearch.runPaged().count;
      //log.debug("revCount", revCount);

      if (revCount > 0) {
        var revId;
        revSearch.run().each(function (result) {
          revId = result.id;
          //log.debug("revId", revId);

          childRec.setValue({
            fieldId: "custrecord_cntm_bom_rev_asm",
            value: revId,
          });
          childRec.setValue({
            fieldId: "custrecord_cntm_status_asm_child",
            value: 4,
          });
          return false;
        });
      }
      // *******************manufacturing
      // routing**************************************************
      var mfg;
      var manufacturingroutingSearchObj = search.create({
        type: "manufacturingrouting",
        filters: [["billofmaterials", "anyof", bomid]],
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
          search.createColumn({
            name: "location",
            label: "Location",
          }),
        ],
      });
      var searchResultCount = manufacturingroutingSearchObj.runPaged().count;
      //log.debug(
      //   "manufacturingroutingSearchObj result count",
      //   searchResultCount
      // );
      manufacturingroutingSearchObj.run().each(function (result) {
        // .run().each has a
        // limit of 4,000
        // results
        mfg = result.id;
        return true;
      });

      if (mfg) {
        childRec.setValue({
          fieldId: "custrecord_cntm_manufacturing_templ",
          value: mfg,
        });
        childRec.setValue({
          fieldId: "custrecord_cntm_status_asm_child",
          value: 6,
        });
      }
    } else {
      // set blank values for creation of new
      //log.debug("setting blank values");
      childRec.setValue({
        fieldId: "custrecord_cntm_status_asm_child",
        value: "",
      });
      childRec.setValue({
        fieldId: "custrecord_cntm_err_asm_child",
        value: "",
      });
      childRec.setValue({
        fieldId: "custrecord_cntm_asm_err_file",
        value: "",
      });
      childRec.setValue({
        fieldId: "custrecord_cntm_woreleasedate_asmwocrtn",
        value: "",
      });
      childRec.setValue({
        fieldId: "custrecord_cntm_scheduledate_wocrtn",
        value: "",
      });
      childRec.setValue({
        fieldId: "custrecord_cntm_cust_rev_created",
        value: "",
      });
      childRec.setValue({
        fieldId: "custrecord_cntm_manufacturing_templ",
        value: "",
      });
      childRec.setValue({
        fieldId: "custrecord_cntm_bom_rev_asm",
        value: "",
      });
      childRec.setValue({
        fieldId: "custrecord_cntm_wo_cust_rev",
        value: custRevLine,
      });
      childRec.setValue({
        fieldId: "custrecord_cntm_rda_rev_file",
        value: "",
      });
    }
    childRec.save();
  }
  function updateNewCustRevWO(
    wo,
    toolNum,
    custRevLine,
    childRec_id,
    empid,
    recipientsEmail
  ) {
    var childRec = record.load({
      id: childRec_id,
      type: "customrecord_cntm_wodetailsfor_asmwocrt",
    });
    var woRec = record.load({
      id: wo,
      type: record.Type.WORK_ORDER,
    });
    var tranid = woRec.getValue("tranid");
    var so = woRec.getText("custbody_cnt_created_fm_so");
    removeWoRef(wo);
    var bomSearch = search.create({
      type: "bom",
      filters: [
        ["custrecord_cntm_tool_number", "is", toolNum],
        "AND",
        ["custrecord_cntm_asm_bom_rev_soline", "is", custRevLine],
      ],
      columns: [
        search.createColumn({
          name: "internalid",
        }),
      ],
    });
    var bomCount = bomSearch.runPaged().count;
    //log.debug("bomCount : " + bomCount);
    var bomid;
    if (bomCount > 0) {
      bomSearch.run().each(function (result) {
        // .run().each has a limit of 4,000
        // results
        bomid = result.id;
        return false;
      });
    }
    if (bomid != undefined && bomid != null && bomid != "") {
      // set existing bom on the line
      childRec.setValue({
        fieldId: "custrecord_cntm_cust_rev_created",
        value: bomid,
      });
      childRec.setValue({
        fieldId: "custrecord_cntm_wo_cust_rev",
        value: custRevLine,
      });
      woRec.setValue({
        fieldId: "billofmaterials",
        value: bomid,
      });

      var revSearch = search.create({
        type: "bomrevision",
        filters: [["billofmaterials", "anyof", bomid]],
        columns: [
          search.createColumn({
            name: "internalid",
            sort: search.Sort.DESC,
          }),
          search.createColumn({
            name: "custrecord_cntm_alt_part_no_rec",
          }),
        ],
      });
      var revCount = revSearch.runPaged().count;
      //log.debug("revCount", revCount);

      var revId;
      var apnId;
      if (revCount > 0) {
        revSearch.run().each(function (result) {
          revId = result.id;
          apnId = result.getValue("custrecord_cntm_alt_part_no_rec");
          //log.debug("revId", revId);

          childRec.setValue({
            fieldId: "custrecord_cntm_bom_rev_asm",
            value: revId,
          });
          /*
           * childRec.setValue({
           * fieldId:"custrecord_cntm_status_asm_child", value:4 });
           */
          woRec.setValue({
            fieldId: "billofmaterialsrevision",
            value: revId,
          });
          return false;
        });
      }
      createWoApnRec(wo, apnId);
      // *******************manufacturing
      // routing**************************************************
      var mfg;
      var manufacturingroutingSearchObj = search.create({
        type: "manufacturingrouting",
        filters: [["billofmaterials", "anyof", bomid]],
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
          search.createColumn({
            name: "location",
            label: "Location",
          }),
        ],
      });
      var searchResultCount = manufacturingroutingSearchObj.runPaged().count;
      //log.debug(
      //   "manufacturingroutingSearchObj result count",
      //   searchResultCount
      // );
      manufacturingroutingSearchObj.run().each(function (result) {
        // .run().each has a
        // limit of 4,000
        // results
        mfg = result.id;
        return true;
      });

      if (mfg) {
        childRec.setValue({
          fieldId: "custrecord_cntm_manufacturing_templ",
          value: mfg,
        });

        woRec.setValue({
          fieldId: "manufacturingrouting",
          value: mfg,
        });
      }
      woRec.save();
      childRec.save();
    } else {
      // set blank values for creation of new
      //log.debug("setting blank values");
      childRec.setValue({
        fieldId: "custrecord_cntm_status_asm_child",
        value: "",
      });
      childRec.setValue({
        fieldId: "custrecord_cntm_err_asm_child",
        value: "",
      });
      childRec.setValue({
        fieldId: "custrecord_cntm_asm_err_file",
        value: "",
      });
      childRec.setValue({
        fieldId: "custrecord_cntm_woreleasedate_asmwocrtn",
        value: "",
      });
      childRec.setValue({
        fieldId: "custrecord_cntm_scheduledate_wocrtn",
        value: "",
      });
      childRec.setValue({
        fieldId: "custrecord_cntm_cust_rev_created",
        value: "",
      });
      childRec.setValue({
        fieldId: "custrecord_cntm_manufacturing_templ",
        value: "",
      });
      childRec.setValue({
        fieldId: "custrecord_cntm_bom_rev_asm",
        value: "",
      });
      childRec.setValue({
        fieldId: "custrecord_cntm_wo_cust_rev",
        value: custRevLine,
      });
      childRec.setValue({
        fieldId: "custrecord_cntm_wonumb_asm_wocrtn",
        value: "",
      });
      childRec.setValue({
        fieldId: "custrecord_cntm_rda_rev_file",
        value: "",
      });

      childRec.save();

      var emailArr = recipientsEmail.split(",");

      var body = GenerateBody(tranid, so);
      /*
       * var fieldLookUpItemType = search.lookupFields({ type:'employee', id:
       * employeeName, columns: ['firstname','email'] });
       * //log.debug("fieldLookUpItemType",JSON.stringify(fieldLookUpItemType));
       * if(Object.keys(fieldLookUpItemType).length>0){ firstName =
       * fieldLookUpItemType.firstname; customerEmailId =
       * fieldLookUpItemType.email; }
       */

      email.send({
        author: empid,
        recipients: emailArr,
        subject: "Work Order Deleted : " + tranid,
        body: body,
        attachments: null,
      });
      record.delete({
        type: record.Type.WORK_ORDER,
        id: wo,
      });
    }
  }
  function GenerateBody(tranid, so) {
    var empObj = runtime.getCurrentUser();
    var name = empObj.name;

    var body = "Hi" + ",<br>";

    body +=
      "<br>The Work Order " +
      tranid +
      " has been deleted as the Customer Revision is changed on the " +
      so +
      ".<br>";
    body += "<br>Thank you.<br>";
    return body;
  }
  function removeWoRef(wo) {
    if (wo) {
    }
    var woApnSearch = search.create({
      type: "customrecord_cntm_wo_apn_ref",
      filters: ["custrecord_cntm_wo_ref", "is", wo],
      columns: [
        search.createColumn({
          name: "internalid",
        }),
        search.createColumn({
          name: "custrecord_cntm_wo_ref",
        }),
      ],
    });
    var woApnSearchCount = woApnSearch.runPaged().count;
    //log.debug("woApnSearchCount : " + woApnSearchCount);
    if (woApnSearchCount > 0) {
      woApnSearch.run().each(function (result) {
        var woapnrecid = result.getValue("internalid");
        record.submitFields({
          type: "customrecord_cntm_wo_apn_ref",
          id: woapnrecid,
          values: {
            custrecord_cntm_wo_ref: "",
          },
          options: {
            enableSourcing: false,
            ignoreMandatoryFields: true,
          },
        });
        return true;
      });
    }
  }
  function createWoApnRec(woID, apnID) {
    //log.debug("createWoApnRec :woID :" + woID, "apnID :" + apnID);
    if (woID) {
      if (apnID) {
        var customrecord_cntm_mpn_apn_infoSearchObj = search.create({
          type: "customrecord_cntm_mpn_apn_info",
          filters: [
            ["custrecord_cntm_parent_rec.internalid", "anyof", apnID],
            "AND",
            ["custrecord_cntm_apn.inventorylocation", "anyof", "4"],
          ],
          columns: [
            search.createColumn({
              name: "custrecord_cntm_mpn",
              label: "Item Name",
            }),
            search.createColumn({
              name: "custrecord_cntm_apn",
              label: "Alternative Part Number",
            }),
            search.createColumn({
              name: "custrecord_cntm_vpn",
              label: "Vendor",
            }),
            search.createColumn({
              name: "custrecord_cntm_apn_approve",
              label: "APN Approve",
            }),
            search.createColumn({
              name: "custrecord_cntm_apn_sequence",
              label: "APN Sequence",
            }),
            search.createColumn({
              name: "custrecord_cntm_apn_stacked",
              label: "Stacked",
            }),
            search.createColumn({
              name: "locationquantityonhand",
              join: "CUSTRECORD_CNTM_APN",
              label: "Location On Hand",
            }),
          ],
        });
        var searchResultCount =
          customrecord_cntm_mpn_apn_infoSearchObj.runPaged().count;
        //log.debug(
        //   "customrecord_cntm_mpn_apn_infoSearchObj result count",
        //   searchResultCount
        // );
        var index = 0;
        customrecord_cntm_mpn_apn_infoSearchObj.run().each(function (result) {
          var item = result.getValue({
            name: "custrecord_cntm_mpn",
            label: "Item Name",
          });
          var apn_item = result.getValue({
            name: "custrecord_cntm_apn",
            label: "Alternative Part Number",
          });
          var vendor = result.getValue({
            name: "custrecord_cntm_vpn",
            label: "Vendor",
          });
          var apn_approve = result.getValue({
            name: "custrecord_cntm_apn_approve",
            label: "APN Approve",
          });

          var apn_seq = result.getValue({
            name: "custrecord_cntm_apn_sequence",
            label: "APN Sequence",
          });
          var stacked = result.getValue({
            name: "custrecord_cntm_apn_stacked",
            label: "Stacked",
          });
          var quan = result.getValue({
            name: "locationquantityonhand",
            join: "CUSTRECORD_CNTM_APN",
            label: "Location On Hand",
          });
          var apnWORec = record.create({
            type: "customrecord_cntm_wo_apn_ref",
            // defaultValues : defaultValues,
            isDynamic: true,
          });
          apnWORec.setValue({
            fieldId: "custrecord_cntm_wo_ref",
            value: woID,
          });
          apnWORec.setValue({
            fieldId: "custrecord_cntm_wo_apn_ref_item",
            value: item,
          });
          apnWORec.setValue({
            fieldId: "custrecord_cntm_apn_item",
            value: apn_item,
          });
          apnWORec.setValue({
            fieldId: "custrecord_cntm_apn_vendor",
            value: vendor,
          });
          if (apn_approve == "N" || apn_approve == false) {
            apnWORec.setValue({
              fieldId: "custrecord_cntm_wo_apn_approve",
              value: false,
            });
          } else if (apn_approve == "Y" || apn_approve == true) {
            apnWORec.setValue({
              fieldId: "custrecord_cntm_wo_apn_approve",
              value: true,
            });
          }

          apnWORec.setValue({
            fieldId: "custrecord_cntm_wo_apn_seq",
            value: apn_seq,
          });
          if (stacked == "N" || stacked == false) {
            apnWORec.setValue({
              fieldId: "custrecord_cntm_wo_apn_stacked",
              value: false,
            });
          } else if (stacked == "Y" || stacked == true) {
            apnWORec.setValue({
              fieldId: "custrecord_cntm_wo_apn_stacked",
              value: true,
            });
          }

          apnWORec.setValue({
            fieldId: "custrecord_cntm_wo_apn_quan",
            value: quan,
          });
          apnWORec.save();
          return true;
        });
      }
    }
  }
  function uniqueArr(arr) {
    var distinct_axes2 = [];

    for (var i = 0; i < arr.length; i++) {
      var str = arr[i];
      if (distinct_axes2.indexOf(str) == -1) {
        distinct_axes2.push(str);
      }
    }
    //log.debug("distinct_axes2 : " + distinct_axes2);
    return distinct_axes2;
  }
  function createOperationRec(woID) {
    if (woID) {
      var fieldLookUp = search.lookupFields({
        type: search.Type.WORK_ORDER,
        id: woID,
        columns: ["manufacturingrouting", "quantity"],
      });
      var WOQty = fieldLookUp["quantity"];
      var routingLookup = fieldLookUp["manufacturingrouting"];
      //log.debug("routingLookup :" + routingLookup);
      var stringJson = JSON.stringify(routingLookup);
      var routingExisting = routingLookup[0].value;
      //log.debug("routingExisting :" + routingExisting);
      var routingRec = record.load({
        type: record.Type.MANUFACTURING_ROUTING,
        id: routingExisting,
      });
      var lineCount = routingRec.getLineCount({
        sublistId: "routingstep",
      });

      for (var i = 0; i < lineCount; i++) {
        var opSeq = routingRec.getSublistValue({
          sublistId: "routingstep",
          fieldId: "operationsequence",
          line: i,
        });
        var opname = routingRec.getSublistValue({
          sublistId: "routingstep",
          fieldId: "operationname",
          line: i,
        });
        /*
         * var laborTime=routingRec.getSublistValue({ sublistId: 'routingstep',
         * fieldId: 'runrate', line: i });
         */
        var laborSetupTime = routingRec.getSublistValue({
          sublistId: "routingstep",
          fieldId: "setuptime",
          line: i,
        });
        // creating records

        var woOperationRec = record.create({
          type: "customrecord_cntm_client_app_asm_oper",
          // defaultValues : defaultValues,
          isDynamic: true,
        });

        if (i == 0) {
          woOperationRec.setValue({
            fieldId: "custrecord_cntm_is_first_op",
            value: true,
          });
          woOperationRec.setValue({
            fieldId: "custrecord_cntm_remaining_qty",
            value: WOQty,
          });
        }
        var opSeqNext = routingRec.getSublistValue({
          sublistId: "routingstep",
          fieldId: "operationsequence",
          line: i + parseInt(1),
        });
        if (opSeqNext != undefined && opSeqNext != null && opSeqNext != "") {
          var opnextText = routingRec.getSublistValue({
            sublistId: "routingstep",
            fieldId: "operationname",
            line: i + parseInt(1),
          });
          woOperationRec.setValue({
            fieldId: "custrecord_cntm_next_op",
            value: opSeqNext,
          });
          woOperationRec.setValue({
            fieldId: "custrecord_cntm_next_op_next",
            value: opSeqNext + " " + opnextText,
          });
        }
        woOperationRec.setValue({
          fieldId: "custrecord_cntm_asm_op_text",
          value: opSeq + " " + opname,
        });

        woOperationRec.setValue({
          fieldId: "custrecord_cnmt_asm_laborsetuptime",
          value: laborSetupTime,
        });

        /*
         * woOperationRec.setValue({ fieldId :
         * "custrecord_cntm_asm_laborruntime", value : laborTime });
         */
        woOperationRec.setValue({
          fieldId: "custrecord_cntm_asm_wo_ref",
          value: woID,
        });
        woOperationRec.setValue({
          fieldId: "custrecord_cntm_asm_operation",
          value: opSeq,
        });
        if (i == lineCount - 1) {
          woOperationRec.setValue({
            fieldId: "custrecord_cntm_asm_is_lastop",
            value: true,
          });
        }
        woOperationRec.save();
      }
    }
  }
  return {
    beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit,
  };
});
