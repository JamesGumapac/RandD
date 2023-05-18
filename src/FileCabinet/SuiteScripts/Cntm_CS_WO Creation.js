/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @scriptname    
 * @ScriptId     
 * @author        Vishal Naphade
 * @email         vishal.naphade@centium.net
 * @date          
 * @description  
 * @Script_id    1467
 * 
 * Copyright 2020, Centium Consulting its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 * Module Description
 * 
 * Sr. No   	 Date           	  Author                  	Remarks
 * 1		 	  11-05-2022          Vishal Naphade
 * 2        02-06-2022          Vishal Naphade            changes for Unique key
 * 3        06-10-2022          Vishal Naphade            changes for bin number location

 */

var my_window;
define([
  "N/record",
  "N/search",
  "N/runtime",
  "N/https",
  "N/currentRecord",
  "N/url",
], /**
 * @param {record}
 *            record
 * @param {search}
 *            search
 */

function (record, search, runtime, https, currentRecord, url) {
  var manuID;

  /**
   * Function to be executed after page is initialized.
   *
   * @param {Object}
   *            scriptContext
   * @param {Record}
   *            scriptContext.currentRecord - Current form record
   * @param {string}
   *            scriptContext.mode - The mode in which the record is
   *            being accessed (create, copy, or edit)
   *
   * @since 2015.2
   */
  var $ = null;
  var DOMFieldMapping = {};
  function pageInit(scriptContext) {
    if (window.onbeforeunload) {
      window.onbeforeunload = function () {
        null;
      };
    }
    var rec = scriptContext.currentRecord;
    if (scriptContext.mode == "create") {
      if (rec.type == "manufacturingrouting") {
        /*
         * var routinDetails = window.opener.getValue({ fieldId :
         * 'custrecord_cntm_routing_details' });
         * log.debug('routinDetails', routinDetails);
         */
        var bom = rec.getValue({
          fieldId: "billofmaterials",
        });
        rec.setValue({
          fieldId: "billofmaterials",
          value: bom,
        });
        var lineCount = rec.getLineCount({
          sublistId: "routingstep",
        });
        log.debug("lineCount", lineCount);

        for (var line = 0; line < lineCount; line++) {
          rec.selectLine({
            sublistId: "routingstep",
            line: line,
          });
          var manufacturingworkcenter = rec.getSublistValue({
            sublistId: "routingstep",
            fieldId: "manufacturingworkcenter",
            line: line,
          });
          rec.setCurrentSublistValue({
            sublistId: "routingstep",
            fieldId: "manufacturingworkcenter",
            value: manufacturingworkcenter,
            // line : line
          });
          rec.commitLine({
            sublistId: "routingstep",
          });
        }
      }
      if (rec.type == "customrecord_cntm_wo_bom_import_fab") {
        rec.selectNewLine({
          sublistId: "recmachcustrecord_cntm_fab_wo_creation",
        });
        var expShipDt = rec.getValue({
          fieldId: "custrecord_cntm_so_expctd_ship_dt",
        }); // getParameterFromURL('expShipDt');
        // alert(expShipDt)
        var releaseType = rec.getValue({
          fieldId: "custrecord_cntm_so_release_type",
        });
        if (
          rec.getLineCount({
            sublistId: "recmachcustrecord_cntm_fab_wo_creation",
          }) == 0
        ) {
          if (expShipDt) {
            // rec.selectLine({sublistId:'recmachcustrecord_cntm_fab_wo_creation',line:0});
            rec.setCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_fab_wo_creation",
              fieldId: "custrecord_cntm_exp_ship_date",
              value: expShipDt,
              line: 0,
            });
          }
          if (releaseType) {
            // rec.selectLine({sublistId:'recmachcustrecord_cntm_fab_wo_creation',line:0});
            rec.setCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_fab_wo_creation",
              fieldId: "custrecord_cntm_release_type",
              value: releaseType,
              line: 0,
            });
          }
          rec.cancelLine({
            sublistId: "recmachcustrecord_cntm_fab_wo_creation",
            line: 0,
          });
        }
      }
      if (rec.type == "workorder") {
        if (runtime.executionContext === runtime.ContextType.USER_INTERFACE) {
          var createdFrom = rec.getValue({
            fieldId: "createdfrom",
          });
          if (createdFrom) {
            var soFieldLookUp = search.lookupFields({
              type: "salesorder",
              id: createdFrom,
              columns: [
                "intercostatus",
                "custbody_rda_transbody_end_customer",
                "custbody_cntm_tool_number",
                "custbody_cntm_cust_rev",
                "custbody_cntm_project",
              ],
            });

            if (soFieldLookUp) {
              if (soFieldLookUp.intercostatus) {
                var endCust = rec.getValue({
                  fieldId: "custbody_rda_transbody_end_customer",
                });
                var toolNum = rec.getValue({
                  fieldId: "custbody_cntm_tool_number",
                });
                var rev = rec.getValue({
                  fieldId: "custbody_cntm_cust_rev",
                });
                var project = rec.getValue({
                  fieldId: "custbody_cntm_project",
                });
                if (endCust) window.sessionStorage.setItem("endCust", endCust);
                if (toolNum) window.sessionStorage.setItem("toolNum", toolNum);
                if (rev) window.sessionStorage.setItem("rev", rev);
                if (project) window.sessionStorage.setItem("project", project);
              } else {
                var endCust =
                  soFieldLookUp.custbody_rda_transbody_end_customer || "";
                var toolNum = soFieldLookUp.custbody_cntm_tool_number || "";
                var rev = soFieldLookUp.custbody_cntm_cust_rev;
                var project = soFieldLookUp.custbody_cntm_project || "";
                if (endCust)
                  rec.setValue({
                    fieldId: "custbody_rda_transbody_end_customer",
                    value: endCust[0] ? endCust[0].value : "",
                  });
                if (toolNum)
                  rec.setValue({
                    fieldId: "custbody_cntm_tool_number",
                    value: toolNum[0] ? toolNum[0].value : "",
                  });
                if (rev)
                  rec.setValue({
                    fieldId: "custbody_cntm_cust_rev",
                    value: rev,
                  });
                if (project)
                  rec.setValue({
                    fieldId: "custbody_cntm_project",
                    value: project[0] ? project[0].value : "",
                  });
              }
            }
          }
        }
      }
    }
    if (rec.type == "workorderissue") {
      var CUSTSUPP_COL_LABEL = "CUSTOMER SUPPLIED PART";
      var BAGNTAG_COL_LABEL = "BAG AND TAG";
      var STACKED_COL_LABEL = "STACKED";
      var SPECPART_COL_LABEL = "SPECIFIC PART";
      // var rec = context.currentRecord;
      DOMFieldMapping =
        rec.getValue({
          fieldId: "custbody_cntm_comp_line_fld_map",
        }) || "{}";
      DOMFieldMapping = JSON.parse(DOMFieldMapping);

      console.log(
        "mode:" + scriptContext.mode,
        "DOMFieldMapping",
        DOMFieldMapping
      );

      $ = jQuery;
      $(document).ready(function () {
        $("#component_splits")
          .find('tr[id*="componentheader"]')
          .each(function (i) {
            $(this)
              .find("td")
              .eq(0)
              .after(
                '<td height="100%" style="" class="listheadertd listheadertextb uir-column-large" data-label="' +
                  SPECPART_COL_LABEL +
                  '"><div class="listheader">' +
                  SPECPART_COL_LABEL +
                  "</div></td>"
              );
            $(this)
              .find("td")
              .eq(0)
              .after(
                '<td height="100%" style="" class="listheadertd listheadertextb uir-column-large" data-label="' +
                  STACKED_COL_LABEL +
                  '"><div class="listheader">' +
                  STACKED_COL_LABEL +
                  "</div></td>"
              );
            $(this)
              .find("td")
              .eq(0)
              .after(
                '<td height="100%" style="" class="listheadertd listheadertextb uir-column-large" data-label="' +
                  BAGNTAG_COL_LABEL +
                  '"><div class="listheader">' +
                  BAGNTAG_COL_LABEL +
                  "</div></td>"
              );
            $(this)
              .find("td")
              .eq(0)
              .after(
                '<td height="100%" style="" class="listheadertd listheadertextb uir-column-large" data-label="' +
                  CUSTSUPP_COL_LABEL +
                  '"><div class="listheader">' +
                  CUSTSUPP_COL_LABEL +
                  "</div></td>"
              );
          });
        $("#component_splits")
          .find('tr[id*="componentrow"]')
          .each(function (i) {
            var cs_val = "!checked";
            var bt_val = "!checked";
            var st_val = "!checked";
            var sp_val = "!checked";
            if (DOMFieldMapping[i]) {
              if (DOMFieldMapping[i].custsupplied) cs_val = "checked";
              if (DOMFieldMapping[i].bagntag) bt_val = "checked";
              if (DOMFieldMapping[i].stacked) st_val = "checked";
              if (DOMFieldMapping[i].specificpart) sp_val = "checked";
            }
            $(this)
              .find("td")
              .eq(0)
              .after(
                '<td><input type="checkbox" id="specificpart" ' +
                  sp_val +
                  "></input></td>"
              );
            $(this)
              .find("td")
              .eq(0)
              .after(
                '<td><input type="checkbox" id="stacked" ' +
                  st_val +
                  "></input></td>"
              );
            $(this)
              .find("td")
              .eq(0)
              .after(
                '<td><input type="checkbox" id="bagntag" ' +
                  bt_val +
                  "></input></td>"
              );
            $(this)
              .find("td")
              .eq(0)
              .after(
                '<td><input type="checkbox" id="custsupplied" ' +
                  cs_val +
                  "></input></td>"
              );
          });
        fieldChangedHandler(rec, "component");
      });
    }
    /*
     * if (rec.type == 'workorder') { var CUSTSUPP_COL_LABEL =
     * 'CUSTOMER SUPPLIED PART'; var BAGNTAG_COL_LABEL = 'BAG AND
     * TAG'; var STACKED_COL_LABEL = 'STACKED'; var
     * SPECPART_COL_LABEL = 'SPECIFIC PART'; // var rec =
     * context.currentRecord; DOMFieldMapping = rec.getValue({
     * fieldId: 'custbody_cntm_comp_line_fld_map' }) || '{}';
     * DOMFieldMapping = JSON.parse(DOMFieldMapping);
     *
     * console.log('mode:'+scriptContext.mode, 'DOMFieldMapping',
     * DOMFieldMapping); $ = jQuery; $(document).ready(function() {
     * $('#item_splits').find('tr[id*="item_headerrow"]').each(function(i){
     * $(this).find('td').eq(0).after('<td height="100%" style="" class="listheadertd listheadertextb uir-column-large" data-label="'+SPECPART_COL_LABEL+'"><div
     * class="listheader">'+SPECPART_COL_LABEL+'</div></td>');
     * $(this).find('td').eq(0).after('<td height="100%" style="" class="listheadertd listheadertextb uir-column-large" data-label="'+STACKED_COL_LABEL+'"><div
     * class="listheader">'+STACKED_COL_LABEL+'</div></td>');
     * $(this).find('td').eq(0).after('<td height="100%" style="" class="listheadertd listheadertextb uir-column-large" data-label="'+BAGNTAG_COL_LABEL+'"><div
     * class="listheader">'+BAGNTAG_COL_LABEL+'</div></td>');
     * $(this).find('td').eq(0).after('<td height="100%" style="" class="listheadertd listheadertextb uir-column-large" data-label="'+CUSTSUPP_COL_LABEL+'"><div
     * class="listheader">'+CUSTSUPP_COL_LABEL+'</div></td>');
     * });
     * $('#item_splits').find('tr[id*="item_row_"]').each(function
     * (i) { var cs_val = '!checked'; var bt_val = '!checked'; var
     * st_val = '!checked'; var sp_val = '!checked'; if
     * (DOMFieldMapping[i]) { if (DOMFieldMapping[i].custsupplied)
     * cs_val = 'checked'; if (DOMFieldMapping[i].bagntag) bt_val =
     * 'checked'; if (DOMFieldMapping[i].stacked) st_val =
     * 'checked'; if (DOMFieldMapping[i].specificpart) sp_val =
     * 'checked'; } $(this).find('td').eq(0).after('<td><input
     * type="checkbox" id="specificpart" '+sp_val+'></input></td>');
     * $(this).find('td').eq(0).after('<td><input type="checkbox"
     * id="stacked" '+st_val+'></input></td>');
     * $(this).find('td').eq(0).after('<td><input type="checkbox"
     * id="bagntag" '+bt_val+'></input></td>');
     * $(this).find('td').eq(0).after('<td><input type="checkbox"
     * id="custsupplied" '+cs_val+'></input></td>'); });
     * fieldChangedHandler(rec,'item'); }); }
     */
    if (scriptContext.mode == "edit") {
      // debugger;
      if (rec.type == "manufacturingrouting") {
        var close = getParameterFromURL("close");
        if (close == "T") {
          window.close();
        }
      }
      if (rec.type == "customrecord_cntm_wo_bom_import_fab") {
        var reprocess = getParameterFromURL("reprocess");
        if (reprocess == "T") {
          rec.setValue({
            fieldId: "custrecord_cntm_is_reprocess",
            value: true,
          });
        }
        var interCo = getParameterFromURL("isInterco");
        if (interCo) {
          rec.setValue({
            fieldId: "custrecord_cntm_is_interco_tran",
            value: true,
          });
        }
      }
    }
  }
  function fieldChangedHandler(rec, sublist) {
    // Customer Supplier Part on tick
    $("#" + sublist + "_splits").on(
      "change",
      'input[id*="custsupplied"]',
      function () {
        var i = $(this).closest("tr").index();
        console.log(i, i in DOMFieldMapping);
        if (DOMFieldMapping[i]) {
          DOMFieldMapping[i].custsupplied = !DOMFieldMapping[i].custsupplied;
          console.log("UPDATED", DOMFieldMapping[i]);
        }
        window.onbeforeunload = null;
      }
    );
    // Bag and Tag on tick
    $("#" + sublist + "_splits").on(
      "change",
      'input[id*="bagntag"]',
      function () {
        var i = $(this).closest("tr").index();
        console.log(i, i in DOMFieldMapping);
        if (DOMFieldMapping[i]) {
          DOMFieldMapping[i].bagntag = !DOMFieldMapping[i].bagntag;
          console.log("UPDATED", DOMFieldMapping[i]);
        }
      }
    );
    // Stacked on tick
    $("#" + sublist + "_splits").on(
      "change",
      'input[id*="stacked"]',
      function () {
        var i = $(this).closest("tr").index();
        console.log(i, i in DOMFieldMapping);
        if (DOMFieldMapping[i]) {
          DOMFieldMapping[i].stacked = !DOMFieldMapping[i].stacked;
          console.log("UPDATED", DOMFieldMapping[i]);
        }
      }
    );
    // Specific part on tick
    $("#" + sublist + "_splits").on(
      "change",
      'input[id*="specificpart"]',
      function () {
        var i = $(this).closest("tr").index();
        console.log(i, i in DOMFieldMapping);
        if (DOMFieldMapping[i]) {
          DOMFieldMapping[i].specificpart = !DOMFieldMapping[i].specificpart;
          console.log("UPDATED", DOMFieldMapping[i]);
        }
      }
    );
  }
  function woCreateFab() {
    debugger;
    var curRec = currentRecord.get();
    log.debug("fab");
    var itemObj = getItem(curRec, "FAB");
    log.debug("item", itemObj.item);

    var redirectUrl;
    var fabWOSearch = search.load({
      id: "customsearch_cntm_fab_wo_crtn",
    });
    var filters = new Array();
    filters.push(
      search.createFilter({
        name: "custrecord_cntm_sales_order_fab",
        operator: search.Operator.ANYOF,
        values: [curRec.id],
      })
    );
    fabWOSearch.filters = filters;
    var searchResult = fabWOSearch.runPaged().count;
    log.audit("searchResult", searchResult);
    // alert(curRec.id+''+searchResult);
    if (searchResult > 0) {
      var fabWOId;
      fabWOSearch.run().each(function (result) {
        // .run().each has a limit of 4,000 results
        fabWOId = result.id;
        return false;
      });
      redirectUrl = url.resolveRecord({
        recordType: "customrecord_cntm_wo_bom_import_fab",
        recordId: fabWOId,
        isEditMode: false,
        params: {
          isInterco: itemObj.isInterco,
          isCon: itemObj.isCon,
          qty: itemObj.qty,
        },
      });
    } else
      redirectUrl = url.resolveRecord({
        recordType: "customrecord_cntm_wo_bom_import_fab",
        // recordId : curRec.id,
        isEditMode: true,
        params: {
          item: itemObj.item,
          salesOrder: curRec.id,
          qty: itemObj.qty,
          location: itemObj.location,
          expShipDt: itemObj.expShipDt,
          isInterco: itemObj.isInterco,
          isCon: itemObj.isCon,
          isMLO: itemObj.isMLO,
          lineKey: itemObj.lineKey.length > 0 ? itemObj.lineKey.join(",") : "",
        },
      });
    if (redirectUrl) window.open(redirectUrl);
  }
  function woCreateAsm(type) {
    debugger;
    log.debug("----ASM WO ----");
    log.audit("type", type);
    var curRec = currentRecord.get();
    var itemObj = getItem(curRec, type);
    log.debug("item obj ASM ", itemObj);
    var redirectUrl;
    var asmWOSearch = search.load({
      id: "customsearch_cntm_asm_wo_crtn_search",
    });
    var filters = new Array();
    filters.push(
      search.createFilter({
        name: "custrecord_so_number_asmwo",
        operator: search.Operator.ANYOF,
        values: [curRec.id],
      })
    );
    asmWOSearch.filters = filters;
    var searchResult = asmWOSearch.runPaged().count;
    log.audit("searchResult", searchResult);
    // alert(curRec.id+''+searchResult);
    if (searchResult > 0) {
      var asmWOId;
      asmWOSearch.run().each(function (result) {
        // .run().each has a limit of 4,000 results
        asmWOId = result.id;
        return false;
      });
      redirectUrl = url.resolveRecord({
        recordType: "customrecord_cntm_asm_wocreation",
        recordId: asmWOId,
        // isEditMode : true,
        params: {
          flag: true,
          qty: itemObj.qty,
        },
        /*
         * params : { 'item' : itemObj.item, 'salesOrder' :
         * curRec.id, 'qty' : itemObj.qty, 'location' :
         * itemObj.location }
         */
      });
    } else {
      if (itemObj.isInterco && type == "RDIS") {
        var numLines = curRec.getLineCount({
          sublistId: "item",
        });

        var noCustRevArr = [];
        for (var index = 0; index < numLines; index++) {
          var subtype = curRec.getSublistText({
            sublistId: "item",
            fieldId: "custcol_cntm_item_subtype",
            line: index,
          });
          if (subtype == "RDIS") {
            var custRev = curRec.getSublistText({
              sublistId: "item",
              fieldId: "custcolcustcol_cntm_custasmrev",
              line: index,
            });
            if (custRev == undefined || custRev == null || custRev == "") {
              noCustRevArr.push(index);
            }
          }
        }
        if (noCustRevArr.length > 0) {
          alert(
            "Please enter the value for Customer REV for all RDIS line items."
          );
          return false;
        } else
          redirectUrl = url.resolveRecord({
            recordType: "customrecord_cntm_asm_wocreation",
            // recordId : curRec.id,
            // isEditMode : true,
            params: {
              item: itemObj.item,
              salesOrder: curRec.id,
              qty: itemObj.qty,
              location: itemObj.location,
              flag: true,
              lineKey:
                itemObj.lineKey.length > 0 ? itemObj.lineKey.join(",") : "",
            },
          });
      } else
        redirectUrl = url.resolveRecord({
          recordType: "customrecord_cntm_asm_wocreation",
          // recordId : curRec.id,
          // isEditMode : true,
          params: {
            item: itemObj.item,
            salesOrder: curRec.id,
            qty: itemObj.qty,
            location: itemObj.location,
            flag: true,
            lineKey:
              itemObj.lineKey.length > 0 ? itemObj.lineKey.join(",") : "",
          },
        });
    }
    console.log("redirectUrl :" + redirectUrl);
    if (redirectUrl) window.open(redirectUrl);
  }
  function getItem(curRec, type) {
    debugger;
    log.debug("type", type);
    var rec = record.load({
      id: curRec.id,
      type: curRec.type,
      // isDynamic : true
    });
    var lineCount = rec.getLineCount({
      sublistId: "item",
    });
    var flag = false;
    log.debug("lineCount", lineCount);
    var item;
    var qty;
    var location;
    var expShipDt;
    var isCon = false;
    var lineKeys = [];
    var isMLO = false;
    var isInterco = rec.getValue({
      fieldId: "intercotransaction",
    });

    for (var i = 0; i < lineCount; i++) {
      var subtype = rec.getSublistText({
        sublistId: "item",
        fieldId: "custcol_cntm_item_subtype",
        line: i,
      });
      log.debug(subtype, type);
      // alert(subtype+' '+type);
      if (subtype == type)
        if (flag == false) {
          item = rec.getSublistValue({
            sublistId: "item",
            fieldId: "item",
            line: i,
          });
          var itemName = rec.getSublistText({
            sublistId: "item",
            fieldId: "item",
            line: i,
          });
          var itemNameArr = itemName.split("-");
          isCon = itemNameArr[itemNameArr.length - 1] == "CON";
          log.debug("isCon", isCon);
          flag = true; // break;
          qty = rec.getSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            line: i,
          });
          location = rec.getSublistValue({
            sublistId: "item",
            fieldId: "location",
            line: i,
          });
          expShipDt = rec.getSublistValue({
            sublistId: "item",
            fieldId: "expectedshipdate",
            line: i,
          });
          if (isMLO != true && isMLO != "T")
            isMLO = rec.getSublistValue({
              sublistId: "item",
              fieldId: "custcol_rda_mlo_checkbox",
              line: i,
            });
          console.log(isMLO);
          var lineKey = rec.getSublistValue({
            sublistId: "item",
            fieldId: "lineuniquekey",
            line: i,
          });
          console.log(lineKey);
          if (lineKey) lineKeys.push(lineKey);
        } else {
          if (
            item ==
            rec.getSublistValue({
              sublistId: "item",
              fieldId: "item",
              line: i,
            })
          )
            qty += rec.getSublistValue({
              sublistId: "item",
              fieldId: "quantity",
              line: i,
            });
          if (isMLO != true && isMLO != "T")
            isMLO = rec.getSublistValue({
              sublistId: "item",
              fieldId: "custcol_rda_mlo_checkbox",
              line: i,
            });
          console.log(isMLO);
          var lineKey = rec.getSublistValue({
            sublistId: "item",
            fieldId: "lineuniquekey",
            line: i,
          });
          console.log(lineKey);
          if (lineKey) lineKeys.push(lineKey);
        }
    }
    // alert(lineKey);
    var obj = {};
    obj.item = item;
    obj.qty = qty;
    obj.location = location;
    obj.lineKey = lineKeys;
    if (expShipDt) obj.expShipDt = expShipDt;
    if (isInterco) obj.isInterco = isInterco;
    if (isCon) obj.isCon = isCon;
    if (isMLO) obj.isMLO = isMLO;
    console.log(JSON.stringify(obj));
    return obj;
  }
  /**
   * Function to be executed when field is changed.
   *
   * @param {Object}
   *            scriptContext
   * @param {Record}
   *            scriptContext.currentRecord - Current form record
   * @param {string}
   *            scriptContext.sublistId - Sublist name
   * @param {string}
   *            scriptContext.fieldId - Field name
   * @param {number}
   *            scriptContext.lineNum - Line number. Will be undefined
   *            if not a sublist or matrix field
   * @param {number}
   *            scriptContext.columnNum - Line number. Will be
   *            undefined if not a matrix field
   *
   * @since 2015.2
   */
  function fieldChanged(scriptContext) {
    try {
      //  debugger;
      var rec = scriptContext.currentRecord;

      // debugger;
      // mrcode start
      if (rec.type == "manufacturingrouting") {
        if (
          scriptContext.sublistId == "routingstep" &&
          scriptContext.fieldId == "custpage_optnnm_select"
        ) {
          // alert('std')
          var selectdata = rec.getCurrentSublistValue({
            sublistId: "routingstep",
            fieldId: "custpage_optnnm_select",
          });
          var selecttext = rec.getCurrentSublistText({
            sublistId: "routingstep",
            fieldId: "custpage_optnnm_select",
          });

          var recId = rec.id;
          var opgetset = rec.getCurrentSublistValue({
            sublistId: "routingstep",
            fieldId: "operationname",
          });

          rec.setCurrentSublistValue({
            sublistId: "routingstep",
            fieldId: "operationname",
            value: selecttext,
            ignoreFieldChange: true,
          });

          var lookup = search.lookupFields({
            type: "customrecord_gate_times_and_operations_",
            id: selectdata,
            columns: [
              "custrecord_work_center_",
              "custrecord8",
              "custrecord_production_setup",
              "custrecord_production_runtime",
            ],
          });

          var workcenter = lookup.custrecord_work_center_[0].value;
          var template = lookup.custrecord8[0].value;
          var setuptime = lookup["custrecord_production_setup"];
          var runrate = lookup["custrecord_production_runtime"];

          if (
            workcenter != "" &&
            template != "" &&
            setuptime != "" &&
            runrate != ""
          ) {
            rec.setCurrentSublistValue({
              sublistId: "routingstep",
              fieldId: "manufacturingworkcenter",
              value: workcenter,
              // ignoreFieldChange : true
            });
            rec.setCurrentSublistValue({
              sublistId: "routingstep",
              fieldId: "manufacturingcosttemplate",
              value: template,
              ignoreFieldChange: true,
            });
            rec.setCurrentSublistValue({
              sublistId: "routingstep",
              fieldId: "setuptime",
              value: setuptime,
              ignoreFieldChange: true,
            });
            rec.setCurrentSublistValue({
              sublistId: "routingstep",
              fieldId: "runrate",
              value: runrate,
              ignoreFieldChange: true,
            });

            rec.commitLine({
              sublistId: "routingstep",
            });

            // alert("Operation Name, workcenter,
            // template, setuptime and runtime data
            // set sucessfully plase save th
            // record")
          }
        }
        // return;
        if (scriptContext.fieldId == "billofmaterials") {
          var bomId = rec.getValue({ fieldId: "billofmaterials" });
          if (bomId) {
            var bomFieldLookUp = search.lookupFields({
              type: record.Type.BOM,
              id: bomId,
              columns: ["custrecord_cntm_boards_per_panel"],
            });
            var boardsPerPanel =
              bomFieldLookUp.custrecord_cntm_boards_per_panel;
            if (boardsPerPanel)
              rec.setValue({
                fieldId: "custrecord_cntm_fab_boards_per_panel",
                value: boardsPerPanel,
              });
          }
        }
      }
      // mrcode end

      if (rec.type == "workorder") {
        debugger;
        //  alert(rec.type+' '+scriptContext.fieldId);
        if (scriptContext.fieldId == "entity") {
          if (rec.getValue({ fieldId: "entity" }) == "") {
            // alert(window.sessionStorage.getItem("endCust")+',
            // '+window.sessionStorage.getItem("toolNum")+',
            // '+window.sessionStorage.getItem("rev"));
            if (window.sessionStorage.getItem("endCust")) {
              rec.setValue({
                fieldId: "custbody_rda_transbody_end_customer",
                value: window.sessionStorage.getItem("endCust"),
              });
              window.sessionStorage.removeItem("endCust");
            }
            if (window.sessionStorage.getItem("toolNum")) {
              rec.setValue({
                fieldId: "custbody_cntm_tool_number",
                value: window.sessionStorage.getItem("toolNum"),
              });
              window.sessionStorage.removeItem("toolNum");
            }
            if (window.sessionStorage.getItem("rev")) {
              rec.setValue({
                fieldId: "custbody_cntm_cust_rev",
                value: window.sessionStorage.getItem("rev"),
              });
              window.sessionStorage.removeItem("rev");
            }
            if (window.sessionStorage.getItem("project")) {
              rec.setValue({
                fieldId: "custbody_cntm_project",
                value: window.sessionStorage.getItem("project"),
              });
              window.sessionStorage.removeItem("project");
            }
          }
        }
      }
      if (scriptContext.fieldId == "custrecord_cntm_sales_order_fab") {
        // alert('SO')
      }
      if (
        scriptContext.sublistId == "recmachcustrecord_cntm_asmwoqty" &&
        scriptContext.fieldId == "custrecord_cntm_manufac_template"
      ) {
        // debugger;
        var location = rec.getValue({
          fieldId: "custrecord_cntm_so_location_asm_wo",
        });
        var repJob = rec.getValue({
          fieldId: "custrecordcntm_repeat_job",
        });
        var newJob = rec.getValue({
          fieldId: "custrecord_cntm_new_job_fab",
        });
        var subsidiary = rec.getValue({
          fieldId: "custrecord_cntm_so_subsidiary_asm_wo",
        });
        log.debug("--" + location, subsidiary);

        /*
         * var bom = rec.getValue({ fieldId :
         * 'custrecordcntm_custoemrrevision_bomrec' });
         */
        var bom = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_cust_rev_created",
        });
        var linestatus = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_status_asm_child",
        });

        var routTemp = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_manufac_template",
        });
        log.debug("routTemp", routTemp);
        var routingID = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_manufacturing_templ",
        });
        var addBomRev = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_create_bom_and_rev",
        });
        var addRev = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_rdacreateonlyrevision",
        });
        var useExisting = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_use_existingbomrev",
        });
        if (repJob) {
          if (addBomRev == false && addRev == false && useExisting == false) {
            alert(
              "Please check one of the following options before proceeding further: \n 1. Use Existing Customer and RDA Revision \n 2. Create New RDA for Existing Customer Revision \n 3. Create New Customer Revision and RDA Revision"
            );
            rec.setCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_manufac_template",
              value: "",
              ignoreFieldChange: true,
            });
          }
        }
        if (linestatus != 9 || linestatus != 10 || linestatus != 11) {
          if (bom) {
            var currIndex = rec.getCurrentSublistIndex({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
            });
            log.debug("rec.id", rec.id);

            var lineCnt = rec.getLineCount({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
            });

            /*
             * if(lineCnt>0){ for(var i=0;i<lineCnt;i++){
             * if(currIndex!=i){ var lineNum =
             * rec.selectLine({ sublistId:
             * 'recmachcustrecord_cntm_asmwoqty', line: i
             * }); rec.commitLine({ sublistId:
             * 'recmachcustrecord_cntm_asmwoqty' }); } }
             * rec.save({ enableSourcing: true,
             * ignoreMandatoryFields: false }); }
             */

            var redirectUrl = url.resolveRecord({
              recordType: "manufacturingrouting",
              recordId: routTemp,
              isEditMode: true,
              params: {
                bom: bom,
                asmRecId: rec.id,
                //  'location': location ? location : 4,
                location: location ? location : 204,
                subsidiary: subsidiary,
                line: currIndex,
                // 'routingID':routingID
              },
            });

            if (redirectUrl)
              // window.open(redirectUrl, '_self');
              popuponclick(redirectUrl);
            /*
             * winObj= window .open( redirectUrl,
             * 'popupWindow',
             * 'directories=no,location=no,menubar=no,status=no,width=850,height=300,titlebar=no,toolbar=no,scrollbars=yes,resizeable=yes,left=300,top=100');
             */
          } else {
            alert(
              "You cannot create Manufacturing Routing unless the BOM record is created."
            );
            rec.setCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_manufac_template",
              value: "",
              ignoreFieldChange: true,
            });
          }
        } else {
          alert(
            "You cannot create Manufacturing Routing unless the BOM record is created."
          );
          rec.setCurrentSublistValue({
            sublistId: "recmachcustrecord_cntm_asmwoqty",
            fieldId: "custrecord_cntm_manufac_template",
            value: "",
            ignoreFieldChange: true,
          });
        }
      }
      if (
        scriptContext.sublistId == "recmachcustrecord_cntm_asmwoqty" &&
        scriptContext.fieldId == "custrecord_cntm_cust_rev_created"
      ) {
        // debugger;
        var bom = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_cust_rev_created",
        });
        var bomandrev = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_create_bom_and_rev",
        });
        var onlyrev = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_rdacreateonlyrevision",
        });
        var existingbom = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_use_existingbomrev",
        });
        var asmbomrev = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_wo_cust_rev",
        });
        var toolnumber = rec.getValue({
          fieldId: "custrecord_cntm_toolnumber_asmwo",
        });
        var fromso = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_custrev_fromso",
        });
        if (bom) {
          var newJob = rec.getValue({
            fieldId: "custrecord_cntm_new_jobs",
          });
          var repJob = rec.getValue({
            fieldId: "custrecordcntm_repeat_job",
          });
          if (newJob == true && onlyrev == true && existingbom == true) {
            alert("You cannot select Customer Revision for New JOB");
            var bom = rec.setCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_cust_rev_created",
              value: "",
              ignoreFieldChange: true,
            });
          } // else if(repJob==true){

          if (
            repJob == true &&
            fromso == true &&
            bomandrev == false &&
            onlyrev == false &&
            existingbom == false
          ) {
            alert(
              "Please check one of the following options before creating Work Orders:\n 1. Use Existing Details. \n 2. Create New RDA for Existing Customer Revision. \n 3. Create New Customer Revision"
            );
            rec.setCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_cust_rev_created",
              value: "",
            });
          } else if (
            repJob == true &&
            fromso == false &&
            bomandrev == false &&
            onlyrev == false &&
            existingbom == false
          ) {
            alert(
              "Please check one of the following options before creating Work Orders:\n 1. Use Existing Details. \n 2. Create New RDA for Existing Customer Revision."
            );
            rec.setCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_cust_rev_created",
              value: "",
            });
          }
          if (onlyrev == true || existingbom == true) {
            var bomRec = record.load({
              id: bom,
              type: record.Type.BOM,
              // isDynamic : true
            });
            var bomToolnum = bomRec.getValue("custrecord_cntm_tool_number");
            var asmRevRef = bomRec.getValue(
              "custrecord_cntm_asm_bom_rev_soline"
            );
            if (bomToolnum == toolnumber && asmRevRef == asmbomrev) {
              // do nothing
            } else {
              alert(
                "Please select BOM with same Tool Number and customer revision"
              );
              rec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_cust_rev_created",
                value: "",
              });
            }
          }

          // }
        }
      }
      if (scriptContext.fieldId == "custrecord_cntm_bom_fab") {
        var newJob = rec.getValue({
          fieldId: "custrecord_cntm_new_job_fab",
        });
        if (newJob == true) {
          alert("You cannot select Customer Revision for New JOB");
          rec.setValue({
            fieldId: "custrecord_cntm_bom_fab",
            value: "",
            ignoreFieldChange: true,
          });
        } else {
        }
      }
      if (scriptContext.fieldId == "custrecord_cntm_new_jobs") {
        var newJob = rec.getValue({
          fieldId: "custrecord_cntm_new_jobs",
        });
        if (newJob == true) {
          rec.setValue({
            fieldId: "custrecordcntm_repeat_job",
            value: false,
            // ignoreFieldChange : true
          });

          // *************************************************************************************
        } else
          rec.setValue({
            fieldId: "custrecordcntm_repeat_job",
            value: true,
            ignoreFieldChange: false,
          });
      }
      if (scriptContext.fieldId == "custrecord_cntm_new_job_fab") {
        var newJob = rec.getValue({
          fieldId: "custrecord_cntm_new_job_fab",
        });
        if (newJob == true) {
          rec.setValue({
            fieldId: "custrecord_cntm_repeat_job_fab",
            value: false,
            // ignoreFieldChange : true
          });
        } else
          rec.setValue({
            fieldId: "custrecord_cntm_repeat_job_fab",
            value: true,
            ignoreFieldChange: true,
          });
      }
      if (scriptContext.fieldId == "custrecordcntm_repeat_job") {
        var repJob = rec.getValue({
          fieldId: "custrecordcntm_repeat_job",
        });
        if (repJob == true) {
          rec.setValue({
            fieldId: "custrecord_cntm_new_jobs",
            value: false,
            ignoreFieldChange: true,
          });
        } else {
          rec.setValue({
            fieldId: "custrecord_cntm_new_jobs",
            value: true,
            ignoreFieldChange: false,
          });
        }
      }
      if (scriptContext.fieldId == "custrecord_cntm_repeat_job_fab") {
        var repJob = rec.getValue({
          fieldId: "custrecord_cntm_repeat_job_fab",
        });
        if (repJob == true) {
          rec.setValue({
            fieldId: "custrecord_cntm_new_job_fab",
            value: false,
            ignoreFieldChange: true,
          });
        } else {
          rec.setValue({
            fieldId: "custrecord_cntm_new_job_fab",
            value: true,
            ignoreFieldChange: true,
          });
          rec.setValue({
            fieldId: "custrecord_cntm_new_to_existing_bom",
            value: false,
            ignoreFieldChange: true,
          });
        }
      }

      if (scriptContext.fieldId == "custrecord_cntm_new_to_existing_bom") {
        // debugger;
        var addBomRev = rec.getValue({
          fieldId: "custrecord_cntm_new_to_existing_bom",
        });
        var repJob = rec.getValue({
          fieldId: "custrecord_cntm_repeat_job_fab",
        });
        var newRouting = rec.getValue({
          fieldId: "custrecord_cntm_create_new_routing_fab",
        });

        if (addBomRev == true) {
          if (repJob == false) {
            alert("This Option is available for Repeat Job only.");
            rec.setValue({
              fieldId: "custrecord_cntm_new_to_existing_bom",
              value: false,
              ignoreFieldChange: true,
            });
          } else {
          }
        }

        if (newRouting == true) {
          // alert('Please Select Either Create New RDA Revision or Create New Routing For Repeat Job')
          rec.setValue({
            fieldId: "custrecord_cntm_create_new_routing_fab",
            value: false,
            ignoreFieldChange: true,
          });
        }
      }

      //change for Bin Number updation on 06-10-2022
      if (
        scriptContext.sublistId == "item" &&
        scriptContext.fieldId == "location"
      ) {
        debugger;
        rec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "custcol_cntm_to_process_bin_number", //to create field in netsuite
          value: true,
          ignoreFieldChange: true,
        });
      }

      //Vishal added code on 26-08-2022
      if (scriptContext.fieldId == "custrecord_cntm_create_new_routing_fab") {
        debugger;
        var newRouting = rec.getValue({
          fieldId: "custrecord_cntm_create_new_routing_fab",
        });
        // log.audit(' newRouting :', newRouting);
        var repJob = rec.getValue({
          fieldId: "custrecord_cntm_repeat_job_fab",
        });
        var addBomRev = rec.getValue({
          fieldId: "custrecord_cntm_new_to_existing_bom",
        });
        var boardsPerPanel = rec.getValue({
          fieldId: "custrecord_cntm_boards_per_panel_fab",
        });
        var bom = rec.getValue({
          fieldId: "custrecord_cntm_bom_fab",
        });

        if (newRouting == true) {
          if (repJob == false) {
            alert("This Option is available for Repeat Job only.");
            rec.setValue({
              fieldId: "custrecord_cntm_create_new_routing_fab",
              value: false,
              ignoreFieldChange: true,
            });
          }
          if (validateData(boardsPerPanel)) {
            var fieldLookUp = search.lookupFields({
              type: search.Type.BOM,
              id: bom,
              columns: ["custrecord_cntm_boards_per_panel"],
            });
            var old_boardsPerPanel =
              fieldLookUp.custrecord_cntm_boards_per_panel;
            console.log("old_boardsPerPanel :" + old_boardsPerPanel);

            if (old_boardsPerPanel != boardsPerPanel) {
              alert(
                "You can not change Boards per panel When Create New Routing is selected"
              );
              rec.setValue({
                fieldId: "custrecord_cntm_boards_per_panel_fab",
                value: old_boardsPerPanel,
                ignoreFieldChange: true,
              });

              rec.selectNewLine({
                sublistId: "recmachcustrecord_cntm_fab_wo_creation",
              });
              if (
                rec.getLineCount({
                  sublistId: "recmachcustrecord_cntm_fab_wo_creation",
                }) == 0
              )
                rec.cancelLine({
                  sublistId: "recmachcustrecord_cntm_fab_wo_creation",
                  line: 0,
                });
            }
          }
        }

        if (addBomRev == true) {
          // alert('Please Select Either Create New RDA Revision or Create New Routing For Repeat Job')
          rec.setValue({
            fieldId: "custrecord_cntm_new_to_existing_bom",
            value: false,
            ignoreFieldChange: true,
          });
        }
      }
      if (
        scriptContext.sublistId == "recmachcustrecord_cntm_asmwoqty" &&
        scriptContext.fieldId == "custrecord_cntm_create_bom_and_rev"
      ) {
        var addBomRev = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_create_bom_and_rev",
        });
        var repJob = rec.getValue({
          fieldId: "custrecordcntm_repeat_job",
        });
        if (addBomRev == true) {
          if (repJob == false) {
            alert("This Option is available for Repeat Job only.");
            rec.setCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_create_bom_and_rev",
              value: false,
            });
          } else {
            rec.setCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_use_existingbomrev",
              value: false,
            });
            rec.setCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_rdacreateonlyrevision",
              value: false,
            });
          }
        }
      }

      if (
        scriptContext.sublistId == "recmachcustrecord_cntm_asmwoqty" &&
        scriptContext.fieldId == "custrecord_cntm_rdacreateonlyrevision"
      ) {
        var addRev = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_rdacreateonlyrevision",
        });
        var fromso = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_custrev_fromso",
        });
        var repJob = rec.getValue({
          fieldId: "custrecordcntm_repeat_job",
        });
        var toolnumber = rec.getValue({
          fieldId: "custrecord_cntm_toolnumber_asmwo",
        });
        var rev = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_wo_cust_rev",
        });
        if (addRev == true) {
          if (repJob == false && fromso == true) {
            alert("This Option is available for Repeat Job only.");
            rec.setCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_rdacreateonlyrevision",
              value: false,
            });
          } else {
            rec.setCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_create_bom_and_rev",
              value: false,
            });

            rec.setCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_use_existingbomrev",
              value: false,
            });

            var bomSearch = search.create({
              type: "bom",
              filters: [
                ["custrecord_cntm_tool_number", "is", toolnumber],
                "AND",
                ["custrecord_cntm_asm_bom_rev_soline", "is", rev],
              ],
              columns: [
                search.createColumn({
                  name: "internalid",
                }),
              ],
            });
            var bomCount = bomSearch.runPaged().count;
            log.debug("bomCount : " + bomCount);
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
              rec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_cust_rev_created",
                value: bomid,
              });
            }
          }
        }
      }
      if (
        scriptContext.sublistId == "recmachcustrecord_cntm_asmwoqty" &&
        scriptContext.fieldId == "custrecord_cntm_use_existingbomrev"
      ) {
        var useExisting = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_use_existingbomrev",
        });
        var repJob = rec.getValue({
          fieldId: "custrecordcntm_repeat_job",
        });

        var bom = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_cust_rev_created",
        });
        var fromso = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_custrev_fromso",
        });
        var toolnumber = rec.getValue({
          fieldId: "custrecord_cntm_toolnumber_asmwo",
        });
        var rev = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_wo_cust_rev",
        });
        if (useExisting == true) {
          if (repJob == false && fromso == true) {
            alert("This Option is available for Repeat Job only.");

            rec.setCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_use_existingbomrev",
              value: false,
            });
          } else {
            rec.setCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_create_bom_and_rev",
              value: false,
            });
            rec.setCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_rdacreateonlyrevision",
              value: false,
            });
            var bomSearch = search.create({
              type: "bom",
              filters: [
                ["custrecord_cntm_tool_number", "is", toolnumber],
                "AND",
                ["custrecord_cntm_asm_bom_rev_soline", "is", rev],
              ],
              columns: [
                search.createColumn({
                  name: "internalid",
                }),
              ],
            });
            var bomCount = bomSearch.runPaged().count;
            log.debug("bomCount : " + bomCount);
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
              rec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_cust_rev_created",
                value: bomid,
              });
            }
          }
        }
      }

      if (
        scriptContext.sublistId == "recmachcustrecord_cntm_asmwoqty" &&
        scriptContext.fieldId == "custrecord_cntm_rda_rev_file"
      ) {
        var useExisting = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_use_existingbomrev",
        });
        var bomfile = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_rda_rev_file",
        });
        var repJob = rec.getValue({
          fieldId: "custrecordcntm_repeat_job",
        });
        var newJob = rec.getValue({
          fieldId: "custrecord_cntm_new_jobs",
        });
        var bomandrev = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_create_bom_and_rev",
        });
        var onlyrev = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_rdacreateonlyrevision",
        });
        var existingbom = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_use_existingbomrev",
        });
        var fromso = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_custrev_fromso",
        });
        var reprocess = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_bomrev_reimport",
        });
        if (bomfile) {
          if (repJob == true) {
            if (
              bomandrev == false &&
              onlyrev == false &&
              existingbom == false
            ) {
              alert(
                "Please check one of the following options before creating Work Orders:\n 1. Use Existing Details. \n2. Create New RDA for Existing Customer Revision.\n3. Create New Customer Revision"
              );
              rec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_rda_rev_file",
                value: "",
                ignoreFieldChange: true,
              });
            }
          } else if (newJob == true && fromso == false) {
            if (onlyrev == false && existingbom == false) {
              alert(
                "Please check one of the following options before creating Work Orders:\n 1. Use Existing Details. \n2. Create New RDA for Existing Customer Revision."
              );
              rec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_rda_rev_file",
                value: "",
                ignoreFieldChange: true,
              });
            }
          }

          if (useExisting == true) {
            if (reprocess == true) {
            } else {
              alert(
                "You cannot upload file with Use Existing Customer and RDA Revision is checked."
              );

              rec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_rda_rev_file",
                value: "",
                ignoreFieldChange: true,
              });
            }
          }
          // }
        }
      }

      // validation for customer revision entered by user
      if (
        scriptContext.sublistId == "recmachcustrecord_cntm_asmwoqty" &&
        scriptContext.fieldId == "custrecord_cntm_wo_cust_rev"
      ) {
        debugger;
        var newJob = rec.getValue({
          fieldId: "custrecord_cntm_new_jobs",
        });
        var repJob = rec.getValue({
          fieldId: "custrecordcntm_repeat_job",
        });
        var toolnumber = rec.getValue({
          fieldId: "custrecord_cntm_toolnumber_asmwo",
        });

        if (newJob == true || repJob == true) {
          var currIndex = rec.getCurrentSublistIndex({
            sublistId: "recmachcustrecord_cntm_asmwoqty",
          });
          var rev = rec.getCurrentSublistValue({
            sublistId: "recmachcustrecord_cntm_asmwoqty",
            fieldId: "custrecord_cntm_wo_cust_rev",
          });
          var woquan = rec.getCurrentSublistValue({
            sublistId: "recmachcustrecord_cntm_asmwoqty",
            fieldId: "custrecord_cntm_woqty_asmwocrtn",
          });
          var fromso = rec.getCurrentSublistValue({
            sublistId: "recmachcustrecord_cntm_asmwoqty",
            fieldId: "custrecord_cntm_custrev_fromso",
          });
          if (rev) {
            if (fromso == false) {
              var lineCnt = rec.getLineCount({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
              });
              var revArr = [];
              for (var i = 0; i < lineCnt; i++) {
                var custRev = rec.getSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_wo_cust_rev",
                  line: i,
                });
                if (currIndex != i) {
                  revArr.push(custRev);
                }
              }
              rec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_cust_rev_copy",
                value: rev,
              });
              if (revArr.indexOf(rev) >= 0) {
                var bomSearch = search.create({
                  type: "bom",
                  filters: [
                    ["custrecord_cntm_tool_number", "is", toolnumber],
                    "AND",
                    ["custrecord_cntm_asm_bom_rev_soline", "is", rev],
                  ],
                  columns: [
                    search.createColumn({
                      name: "internalid",
                    }),
                  ],
                });
                var bomCount = bomSearch.runPaged().count;
                log.debug("bomCount : " + bomCount);
                var bomid;
                if (bomCount > 0) {
                  bomSearch.run().each(function (result) {
                    // .run().each has a
                    // limit of 4,000
                    // results
                    bomid = result.id;
                    return false;
                  });
                }
                if (bomid != undefined && bomid != null && bomid != "") {
                  rec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_cust_rev_created",
                    value: bomid,
                  });
                }
              } else {
                alert(
                  "Please select  ASM BOM (CUST REV) from the existing ones."
                );
                rec.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_wo_cust_rev",
                  value: "",
                });
              }
            } else if (fromso == true) {
              var custRev = rec.getCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_cust_rev_copy",
              });
              alert(
                "Please select  ASM BOM (CUST REV) from the existing ones."
              );
              rec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_wo_cust_rev",
                value: custRev,
                ignoreFieldChange: true,
              });
            }
          }
        }
      }
      if (
        scriptContext.sublistId == "recmachcustrecord_cntm_asmwoqty" &&
        scriptContext.fieldId == "custrecord_cntm_woqty_asmwocrtn"
      ) {
        // debugger;
        var newJob = rec.getValue({
          fieldId: "custrecord_cntm_new_jobs",
        });
        var repJob = rec.getValue({
          fieldId: "custrecordcntm_repeat_job",
        });

        var linestatus = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_status_asm_child",
        });
        var quan = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_woqty_asmwocrtn",
        });
        if (linestatus == 6) {
        } else {
          if (quan) {
            if (repJob == true) {
              var bomandrev = rec.getCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_create_bom_and_rev",
              });
              var onlyrev = rec.getCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_rdacreateonlyrevision",
              });
              var existingbom = rec.getCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_use_existingbomrev",
              });
              if (
                bomandrev == false &&
                onlyrev == false &&
                existingbom == false
              ) {
                alert(
                  "Please check one of the following options before creating Work Orders: \n 1. Use Existing Customer and RDA Revision \n 2. Create New RDA for Existing Customer Revision \n 3. Create New Customer Revision and RDA Revision"
                );
                var quan = rec.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_woqty_asmwocrtn",
                  value: "",
                });
              }
            }
            var quan1 = rec.getCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_woqty_asmwocrtn",
            });
            if (linestatus == "") {
              if (quan1) {
                alert(
                  "Please Create Customer Rev (Bill of Materials) and Manufacturing Routing before entering Work Order details. "
                );
                rec.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_woqty_asmwocrtn",
                  value: "",
                });
              }
            } else {
              if (linestatus == 4) {
                if (quan1) {
                  alert(
                    "Manufacturing Routing for the selected line item is not created, please create the same before entering Work Order details."
                  );
                  rec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_woqty_asmwocrtn",
                    value: "",
                  });
                }
              }
            }
            // ***************************updating WO
            // quantity on
            // WO*********************************************
            var wo = rec.getCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_wonumb_asm_wocrtn",
            });

            if (linestatus == 8 && wo != undefined && wo != null && wo != "") {
              var fieldLookUpStatus = search.lookupFields({
                type: search.Type.WORK_ORDER,
                id: wo,
                columns: ["status"],
              });
              var status = fieldLookUpStatus["status"];
              console.log("WO status :" + status);
              var stringJson = JSON.stringify(status);
              var wostatus = status[0].text;
              console.log("wostatus :" + wostatus);
              if (wostatus == "In Process") {
                alert(
                  "You cannot change the quantity of Work Order when it is In Process"
                );
                var fieldLookUp = search.lookupFields({
                  type: search.Type.WORK_ORDER,
                  id: wo,
                  columns: ["quantity"],
                });
                var woQty = fieldLookUp["quantity"];
                rec.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_woqty_asmwocrtn",
                  value: woQty,
                  ignoreFieldChange: true,
                });
              } else {
                var toContinue = confirm(
                  "Do you want to update quantity on Work Order ?"
                );
                if (toContinue == true) {
                  var id = record.submitFields({
                    type: record.Type.WORK_ORDER,
                    id: wo,
                    values: {
                      quantity: quan,
                    },
                    options: {
                      enableSourcing: false,
                      ignoreMandatoryFields: true,
                    },
                  });
                } else {
                  var fieldLookUp = search.lookupFields({
                    type: search.Type.WORK_ORDER,
                    id: wo,
                    columns: ["quantity"],
                  });
                  var woQty = fieldLookUp["quantity"];
                  rec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_woqty_asmwocrtn",
                    value: woQty,
                    ignoreFieldChange: true,
                  });
                }
              }
            }
          }
        }
      }
      if (
        scriptContext.sublistId == "recmachcustrecord_cntm_asmwoqty" &&
        scriptContext.fieldId == "custrecord_cntm_woreleasedate_asmwocrtn"
      ) {
        // debugger;
        var newJob = rec.getValue({
          fieldId: "custrecord_cntm_new_jobs",
        });
        var repJob = rec.getValue({
          fieldId: "custrecordcntm_repeat_job",
        });
        var linestatus = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_status_asm_child",
        });
        var quan = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_woreleasedate_asmwocrtn",
        });
        if (linestatus == 6) {
        } else {
          if (quan) {
            if (repJob == true) {
              var bomandrev = rec.getCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_create_bom_and_rev",
              });
              var onlyrev = rec.getCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_rdacreateonlyrevision",
              });
              var existingbom = rec.getCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_use_existingbomrev",
              });
              if (
                bomandrev == false &&
                onlyrev == false &&
                existingbom == false
              ) {
                alert(
                  "Please check one of the following options before creating Work Orders: \n1. Use Existing Details. \n 2. Create New RDA for Existing Customer Revision. \n3. Create New Customer Revision"
                );
                rec.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_woreleasedate_asmwocrtn",
                  value: "",
                });
              }
            }
            var quan1 = rec.getCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_woreleasedate_asmwocrtn",
            });
            if (linestatus == "") {
              if (quan1) {
                alert(
                  "Please Create Customer Rev (Bill of Materials) and Manufacturing Routing before entering Work Order details. "
                );
                rec.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_woreleasedate_asmwocrtn",
                  value: "",
                });
              }
            } else {
              if (linestatus == 4) {
                if (quan1) {
                  alert(
                    "Manufacturing Routing for the selected line item is not created, please create the same before entering Work Order details."
                  );
                  rec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_woreleasedate_asmwocrtn",
                    value: "",
                  });
                }
              }
            }
          }
        }
      }
      if (
        scriptContext.sublistId == "recmachcustrecord_cntm_asmwoqty" &&
        scriptContext.fieldId == "custrecord_cntm_scheduledate_wocrtn"
      ) {
        // debugger;
        var newJob = rec.getValue({
          fieldId: "custrecord_cntm_new_jobs",
        });
        var repJob = rec.getValue({
          fieldId: "custrecordcntm_repeat_job",
        });
        var linestatus = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_status_asm_child",
        });
        var quan = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_scheduledate_wocrtn",
        });

        if (linestatus == 6) {
        } else {
          if (quan) {
            if (repJob == true) {
              var bomandrev = rec.getCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_create_bom_and_rev",
              });
              var onlyrev = rec.getCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_rdacreateonlyrevision",
              });
              var existingbom = rec.getCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_use_existingbomrev",
              });
              if (
                bomandrev == false &&
                onlyrev == false &&
                existingbom == false
              ) {
                alert(
                  "Please check one of the following options before creating Work Orders: \n 1. Use Existing Customer and RDA Revision \n 2. Create New RDA for Existing Customer Revision \n 3. Create New Customer Revision and RDA Revision"
                );

                rec.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_scheduledate_wocrtn",
                  value: "",
                });
              }
            }
            var quan1 = rec.getCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_scheduledate_wocrtn",
            });

            if (linestatus == "") {
              if (quan1) {
                alert(
                  "Please Create Customer Rev (Bill of Materials) and Manufacturing Routing before entering Work Order details. "
                );
                var quan = rec.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_scheduledate_wocrtn",
                  value: "",
                  ignoreFieldChange: true,
                });
              }
            } else {
              if (linestatus == 4) {
                if (quan1) {
                  alert(
                    "Manufacturing Routing for the selected line item is not created, please create the same before entering Work Order details."
                  );
                  rec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_scheduledate_wocrtn",
                    value: "",
                    ignoreFieldChange: true,
                  });
                }
              }
            }
          }
        }
      }
      if (
        scriptContext.sublistId == "recmachcustrecord_cntm_asmwoqty" &&
        scriptContext.fieldId == "custrecord_cntm_manufacturing_templ"
      ) {
        // debugger;
        var useExisting = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_use_existingbomrev",
        });
        var routingID = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_manufacturing_templ",
        });
        var bom = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_cust_rev_created",
        });

        var linestatus = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_status_asm_child",
        });
        var wo = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_wonumb_asm_wocrtn",
        });
        console.log("bom :" + bom);
        if (routingID) {
          if (bom) {
            var fieldLookUp = search.lookupFields({
              type: search.Type.MANUFACTURING_ROUTING,
              id: routingID,
              columns: ["billofmaterials"],
            });
            var bomRec = fieldLookUp["billofmaterials"];
            console.log("bomRec :" + bomRec);
            var stringJson = JSON.stringify(bomRec);
            var bomexisting = bomRec[0].value;
            console.log("bomexisting :" + bomexisting);
            if (bomexisting == bom) {
              if (linestatus == 8) {
                var toContinue = confirm(
                  "Do you want to change the manufacturing routing on Work Order ?"
                );
                if (toContinue == true) {
                  var id = record.submitFields({
                    type: record.Type.WORK_ORDER,
                    id: wo,
                    values: {
                      manufacturingrouting: routingID,
                    },
                    options: {
                      enableSourcing: false,
                      ignoreMandatoryFields: true,
                    },
                  });
                }
              } else {
                if (linestatus == 4) {
                  rec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_status_asm_child",
                    value: 6,
                    ignoreFieldChange: true,
                  });
                } else {
                  alert(
                    "You cannot create Manufacturing Routing unless the BOM and BOM revision are created."
                  );
                  rec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_manufacturing_templ",
                    value: "",
                    ignoreFieldChange: true,
                  });
                }
              }
            } else {
              alert(
                "Please select manufacturing routing with same Customer Revision"
              );
              rec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_manufacturing_templ",
                value: "",
                ignoreFieldChange: true,
              });
            }
          } else {
            alert(
              "Please create/select Customer Rev (Bill of Material ) first. "
            );
            rec.setCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_manufacturing_templ",
              value: "",
              ignoreFieldChange: true,
            });
          }
        }

        if (useExisting == true) {
          rec.setValue({
            fieldId: "custrecord_cntm_status_asmwocreation",
            value: 6,
            ignoreFieldChange: true,
          });
        }
      }

      if (
        scriptContext.sublistId == "recmachcustrecord_cntm_asmwoqty" &&
        scriptContext.fieldId == "custrecord_cntm_bomrev_reimport"
      ) {
        // debugger;
        var newJob = rec.getValue({
          fieldId: "custrecord_cntm_new_jobs",
        });
        var repJob = rec.getValue({
          fieldId: "custrecordcntm_repeat_job",
        });
        var bom = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_cust_rev_created",
        });
        var revFile = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_rda_rev_file",
        });
        var reprocess = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_bomrev_reimport",
        });
        var linestatus = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_status_asm_child",
        });
        var wo = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_wonumb_asm_wocrtn",
        });
        var useExisting = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_use_existingbomrev",
        });
        if (reprocess == true || reprocess == "T") {
          if (
            repJob == true ||
            repJob == "T" ||
            newJob == true ||
            newJob == "T"
          ) {
            if ((useExisting == true || useExisting == "T") && !wo) {
              alert(
                "Reprocess is not available while using 'USE EXISTING CUSTOMER AND RDA REVISION' option"
              );
              rec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_bomrev_reimport",
                value: false,
                ignoreFieldChange: true,
              });
            }
          } else {
            if (bom) {
              if (linestatus == 10 || linestatus == 11) {
                alert("You can upadte the file and try again.");
                rec.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_bomrev_reimport",
                  value: false,
                  ignoreFieldChange: true,
                });
              }
            } else {
              alert("Please create BOM and BOM rev before reprocess.");
              rec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_bomrev_reimport",
                value: false,
                ignoreFieldChange: true,
              });
            }
          }
        }
      }
      if (
        scriptContext.sublistId == "recmachcustrecord_cntm_fab_wo_creation" &&
        (scriptContext.fieldId == "custrecord_cntm_boardsperpanel_fabwo_crt" ||
          scriptContext.fieldId == "custrecord_cntm_num_of_panels_fabwo_crtn")
      ) {
        var boardPanel = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_fab_wo_creation",
          fieldId: "custrecord_cntm_boardsperpanel_fabwo_crt",
        });
        var noFoPanel = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_fab_wo_creation",
          fieldId: "custrecord_cntm_num_of_panels_fabwo_crtn",
        });

        if (!boardPanel) boardPanel = 1;
        if (!noFoPanel) {
          noFoPanel = 1;
          rec.setCurrentSublistValue({
            sublistId: "recmachcustrecord_cntm_fab_wo_creation",
            fieldId: "custrecord_cntm_num_of_panels_fabwo_crtn",
            value: noFoPanel,
            ignoreFieldChange: true,
          });
        }
        rec.setCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_fab_wo_creation",
          fieldId: "custrecord_cntm_wo_qty_fab_wo",
          value: noFoPanel * boardPanel,
          ignoreFieldChange: true,
        });
      }

      if (
        scriptContext.sublistId == "recmachcustrecord_cntm_fab_wo_creation" &&
        scriptContext.fieldId == "custrecord_cntm_wo_qty_fab_wo"
      ) {
        var boardPanel = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_fab_wo_creation",
          fieldId: "custrecord_cntm_boardsperpanel_fabwo_crt",
        });
        var qty = rec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_fab_wo_creation",
          fieldId: "custrecord_cntm_wo_qty_fab_wo",
        });
        if (!qty) qty = 1;
        if (!boardPanel) boardPanel = 1;
        rec.setCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_fab_wo_creation",
          fieldId: "custrecord_cntm_num_of_panels_fabwo_crtn",
          value: Math.ceil(qty / boardPanel),
          ignoreFieldChange: false,
        });
      }
      if (scriptContext.fieldId == "custrecord_cntm_boards_per_panel_fab") {
        var boardsPerPanel = rec.getValue({
          fieldId: "custrecord_cntm_boards_per_panel_fab",
        });
        var newRouting = rec.getValue({
          fieldId: "custrecord_cntm_create_new_routing_fab",
        });

        rec.selectNewLine({
          sublistId: "recmachcustrecord_cntm_fab_wo_creation",
        });
        if (
          rec.getLineCount({
            sublistId: "recmachcustrecord_cntm_fab_wo_creation",
          }) == 0
        )
          rec.cancelLine({
            sublistId: "recmachcustrecord_cntm_fab_wo_creation",
            line: 0,
          });
        var bom = rec.getValue({
          fieldId: "custrecord_cntm_bom_fab",
        });

        if (newRouting == true || newRouting == "true") {
          var fieldLookUp = search.lookupFields({
            type: search.Type.BOM,
            id: bom,
            columns: ["custrecord_cntm_boards_per_panel"],
          });
          var old_boardsPerPanel = fieldLookUp.custrecord_cntm_boards_per_panel;
          console.log("old_boardsPerPanel :" + old_boardsPerPanel);

          if (old_boardsPerPanel != boardsPerPanel) {
            alert(
              "You can not change Boards per panel When Create New Routing is selected"
            );
            rec.setValue({
              fieldId: "custrecord_cntm_boards_per_panel_fab",
              value: old_boardsPerPanel,
              ignoreFieldChange: true,
            });

            rec.selectNewLine({
              sublistId: "recmachcustrecord_cntm_fab_wo_creation",
            });
            if (
              rec.getLineCount({
                sublistId: "recmachcustrecord_cntm_fab_wo_creation",
              }) == 0
            )
              rec.cancelLine({
                sublistId: "recmachcustrecord_cntm_fab_wo_creation",
                line: 0,
              });
          }
        }
      }
      //Added validation for 'Create New Routing'
      if (
        scriptContext.fieldId == "custrecord_bom_raw_file_fab" ||
        scriptContext.fieldId == "custrecord_cntm_bom_dependecy_file_fab" ||
        scriptContext.fieldId == "custrecord_cntm_mfg_routing_filr_fab"
      ) {
        debugger;
        var newRdaRev = rec.getValue({
          fieldId: "custrecord_cntm_new_to_existing_bom",
        });
        var repJob = rec.getValue({
          fieldId: "custrecord_cntm_repeat_job_fab",
        });
        var newRouting = rec.getValue({
          fieldId: "custrecord_cntm_create_new_routing_fab",
        });
        // log.audit(' newRouting :', newRouting);

        if (repJob == true && newRdaRev == false && newRouting == false) {
          alert(
            'You cannot import files when only Repeat Job Checkbox is checked and/or when there is change in Boards Per Panel. Please check "Create New RDA Revision" if you want to create new RDA revision for existing customer revision. This will allow you to import file for RDA Revision.\nNote: If you want to create new Customer Revision with different Boards Per Panel calculation, please change the number on Boards Per Panel and save the SuiteLet.'
          );
          rec.setValue({
            fieldId: scriptContext.fieldId,
            value: "",
            ignoreFieldChange: true,
          });
        }
      }

      // if (scriptContext.sublistId == "routingstep" && scriptContext.fieldId == "custpage_fab_instructions" ) {
      if (scriptContext.sublistId == "routingstep" && (scriptContext.fieldId == "custpage_fab_instructions" || scriptContext.fieldId == "operationsequence" )) {
        // alert('std');
        // debugger;
        var curInst = rec.getCurrentSublistValue({
          sublistId: "routingstep",
          fieldId: "custpage_fab_instructions",
        });
        var allInstructions = rec.getValue({
          fieldId: "custrecord_routing_instructions",
        });
        // alert(curInst + ' ' + allInstructions);
        if (!allInstructions) {
          allInstructions = "{}";
        }

        allInstructions = JSON.parse(allInstructions);
        var opSequence = rec.getCurrentSublistValue({
          sublistId: "routingstep",
          fieldId: "operationsequence",
        });
        // alert(opSequence);

        if(validateData(opSequence)){
          allInstructions[opSequence] = curInst;
          console.log(curInst + ' ' +
          JSON.stringify(allInstructions));
  
          rec.setValue({
            fieldId: "custrecord_routing_instructions",
            value: JSON.stringify(allInstructions),
          });

        }
      }
      if (scriptContext.fieldId == "billofmaterialsrevision") {
        var bom = rec.getValue({
          fieldId: "billofmaterialsrevision",
        });
        rec.setValue({
          fieldId: "custbody_cntm_comp_line_fld_map",
          value: "",
        });
      }
    } catch (e) {
      log.error("error_fchange", e.message);
      console.log("error_fchange :" + e.message);
    }
  }

  /**
   * Function to be executed when field is slaved.
   *
   * @param {Object}
   *            scriptContext
   * @param {Record}
   *            scriptContext.currentRecord - Current form record
   * @param {string}
   *            scriptContext.sublistId - Sublist name
   * @param {string}
   *            scriptContext.fieldId - Field name
   *
   * @since 2015.2
   */
  function postSourcing(scriptContext) {
    var rec = scriptContext.currentRecord;
  }

  /**
   * Function to be executed after sublist is inserted, removed, or
   * edited.
   *
   * @param {Object}
   *            scriptContext
   * @param {Record}
   *            scriptContext.currentRecord - Current form record
   * @param {string}
   *            scriptContext.sublistId - Sublist name
   *
   * @since 2015.2
   */
  function sublistChanged(scriptContext) {
    try {
      log.debug("scriptContext.sublistId", scriptContext.sublistId);
      if (scriptContext.sublistId == "recmachcustrecord_cntm_asmwoqty") {
        var rec = scriptContext.currentRecord;
        var soQty = rec.getValue({
          fieldId: "custrecord_sntm_so_qunty_asmwocreation",
        });
        var lineCount = rec.getLineCount({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
        });
        var WOqty = 0;
        log.debug("lineCount", lineCount);
        if (lineCount > 0) {
          for (var line = 0; line < lineCount; line++) {
            var qty = rec.getSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_woqty_asmwocrtn",
              line: line,
              // ignoreRecalc:true
            });
            log.debug("qty", qty);
            WOqty += qty;
          }
        } else {
          /*
           * var qty = rec.getCurrentSublistValue({
           * sublistId :
           * 'recmachcustrecord_cntm_asmwoqty', fieldId :
           * 'custrecord_cntm_wo_qty_fab_wo', // line :
           * line, // ignoreRecalc:true }); WOqty += qty;
           */
        }
        log.debug("WOqty", WOqty);
        rec.setValue({
          fieldId: "custrecord_cntm_wo_qunty_asmwocreation",
          value: WOqty,
        });
        rec.setValue({
          fieldId: "custrecord_cntm_wobalance_qunty",
          value: soQty - WOqty,
        });
      }
      if (scriptContext.sublistId == "recmachcustrecord_cntm_fab_wo_creation") {
        var rec = scriptContext.currentRecord;
        var soQty = rec.getValue({
          fieldId: "custrecord_cntm_so_qty_fab",
        });
        var lineCount = rec.getLineCount({
          sublistId: "recmachcustrecord_cntm_fab_wo_creation",
        });
        var WOqty = 0;
        log.debug("lineCount", lineCount);
        if (lineCount > 0) {
          for (var line = 0; line < lineCount; line++) {
            var qty = rec.getSublistValue({
              sublistId: "recmachcustrecord_cntm_fab_wo_creation",
              fieldId: "custrecord_cntm_wo_qty_fab_wo",
              line: line,
              // ignoreRecalc:true
            });
            log.debug("qty", qty);
            WOqty += qty;
          }
        } else {
          /*
           * var qty = rec.getCurrentSublistValue({
           * sublistId :
           * 'recmachcustrecord_cntm_asmwoqty', fieldId :
           * 'custrecord_cntm_wo_qty_fab_wo', // line :
           * line, // ignoreRecalc:true }); WOqty += qty;
           */
        }
        log.debug("WOqty", WOqty);
        rec.setValue({
          fieldId: "custrecord_cntm_tot_wo_qty",
          value: WOqty,
        });
        rec.setValue({
          fieldId: "custrecord_cntm_wo_balance_qty",
          value: soQty - WOqty,
        });
      }
    } catch (e) {
      log.error("error_woqty", e.message);
    }
  }

  /**
   * Function to be executed after line is selected.
   *
   * @param {Object}
   *            scriptContext
   * @param {Record}
   *            scriptContext.currentRecord - Current form record
   * @param {string}
   *            scriptContext.sublistId - Sublist name
   *
   * @since 2015.2
   */
  function lineInit(scriptContext) {
    if (scriptContext.sublistId == "recmachcustrecord_cntm_fab_wo_creation") {
      var rec = scriptContext.currentRecord;
      var wo = rec.getCurrentSublistValue({
        sublistId: "recmachcustrecord_cntm_fab_wo_creation",
        fieldId: "custrecord_cntm_wo_number_fabwo_crtn",
      });
      log.audit("wo", wo);
      if (wo) {
        jQuery("#recmachcustrecord_cntm_fab_wo_creation_remove").hide();
      } else jQuery("#recmachcustrecord_cntm_fab_wo_creation_remove").show();
      var boardsPerPanel = rec.getValue({
        fieldId: "custrecord_cntm_boards_per_panel_fab",
      });
      rec.setCurrentSublistValue({
        sublistId: "recmachcustrecord_cntm_fab_wo_creation",
        fieldId: "custrecord_cntm_boardsperpanel_fabwo_crt",
        value: boardsPerPanel,
      });
      var expDt = rec.getValue({
        fieldId: "custrecord_cntm_so_expctd_ship_dt",
      });
      var expLine = rec.getCurrentSublistValue({
        sublistId: "recmachcustrecord_cntm_fab_wo_creation",
        fieldId: "custrecord_cntm_exp_ship_date",
      });
      if (!expLine)
        rec.setCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_fab_wo_creation",
          fieldId: "custrecord_cntm_exp_ship_date",
          value: expDt,
        });
      var releaseType = rec.getValue({
        fieldId: "custrecord_cntm_so_release_type",
      });
      var releaseTypeLine = rec.getCurrentSublistValue({
        sublistId: "recmachcustrecord_cntm_fab_wo_creation",
        fieldId: "custrecord_cntm_release_type",
      });
      // alert(releaseType)
      // if(!releaseTypeLine)
      rec.setCurrentSublistValue({
        sublistId: "recmachcustrecord_cntm_fab_wo_creation",
        fieldId: "custrecord_cntm_release_type",
        value: releaseType,
      });
    }
  }

  /**
   * Validation function to be executed when field is changed.
   *
   * @param {Object}
   *            scriptContext
   * @param {Record}
   *            scriptContext.currentRecord - Current form record
   * @param {string}
   *            scriptContext.sublistId - Sublist name
   * @param {string}
   *            scriptContext.fieldId - Field name
   * @param {number}
   *            scriptContext.lineNum - Line number. Will be undefined
   *            if not a sublist or matrix field
   * @param {number}
   *            scriptContext.columnNum - Line number. Will be
   *            undefined if not a matrix field
   *
   * @returns {boolean} Return true if field is valid
   *
   * @since 2015.2
   */
  function validateField(scriptContext) {}

  /**
   * Validation function to be executed when sublist line is
   * committed.
   *
   * @param {Object}
   *            scriptContext
   * @param {Record}
   *            scriptContext.currentRecord - Current form record
   * @param {string}
   *            scriptContext.sublistId - Sublist name
   *
   * @returns {boolean} Return true if sublist line is valid
   *
   * @since 2015.2
   */
  /*
   * function validateLine(scriptContext) { }
   */
  /**
   * Validation function to be executed when sublist line is inserted.
   *
   * @param {Object}
   *            scriptContext
   * @param {Record}
   *            scriptContext.currentRecord - Current form record
   * @param {string}
   *            scriptContext.sublistId - Sublist name
   *
   * @returns {boolean} Return true if sublist line is valid
   *
   * @since 2015.2
   */
  function validateInsert(scriptContext) {
    var currentRec = scriptContext.currentRecord;

    if (currentRec.type == "customrecord_cntm_asm_wocreation") {
      var lineCnt = currentRec.getLineCount({
        sublistId: "recmachcustrecord_cntm_asmwoqty",
      });
      var woArr = [];
      if (lineCnt) {
        for (var i = 0; i < lineCnt; i++) {
          var wo = currentRec.getSublistValue({
            sublistId: "recmachcustrecord_cntm_asmwoqty",
            fieldId: "custrecord_cntm_wonumb_asm_wocrtn",
            line: i,
          });
          if (wo) {
            woArr.push(wo);
          }
        }
        if (woArr.length == lineCnt) {
          return true;
        } else {
          alert("Please create Work Orders for all lines first.");
          return false;
        }
      }
    } else {
      return true;
    }
  }

  /**
   * Validation function to be executed when record is deleted.
   *
   * @param {Object}
   *            scriptContext
   * @param {Record}
   *            scriptContext.currentRecord - Current form record
   * @param {string}
   *            scriptContext.sublistId - Sublist name
   *
   * @returns {boolean} Return true if sublist line is valid
   *
   * @since 2015.2
   */
  function validateDelete(scriptContext) {
    var currentRec = scriptContext.currentRecord;
    if (currentRec.type == "customrecord_cntm_asm_wocreation") {
      if (scriptContext.sublistId == "recmachcustrecord_cntm_asmwoqty") {
        var so = currentRec.getValue("custrecord_so_number_asmwo");

        var wo = currentRec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_wonumb_asm_wocrtn",
        });
        if (wo) {
          return false;
        } else {
          var toContinue = confirm(
            "Are you sure you want to remove this line ?"
          );
          if (toContinue == true) {
            var soRec = record.load({
              type: record.Type.SALES_ORDER,
              id: so,
              isDynamic: true,
            });
            var lineCount = soRec.getLineCount({
              sublistId: "item",
            });
            var fromSO = currentRec.getCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_custrev_fromso",
            });
            var custRev = currentRec.getCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_wo_cust_rev",
            });
            if (fromSO == true || fromSO == "true")
              for (var i = 0; i < lineCount; i++) {
                var soRev = soRec.getSublistValue({
                  sublistId: "item",
                  fieldId: "custcolcustcol_cntm_custasmrev",
                  line: i,
                });
                if (custRev == soRev) {
                  soRec.selectLine({
                    sublistId: "item",
                    line: i,
                  });
                  /*
                   * var childRecId =
                   * soRec.getCurrentSublistValue({
                   * sublistId: 'item', fieldId:
                   * 'custcol_cntm_asm_wo_child_rec'
                   * });
                   */
                  soRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_cntm_asm_wo_child_rec",
                    value: "",
                    ignoreFieldChange: true,
                  });
                  soRec.commitLine({
                    sublistId: "item",
                  });
                }
              }
            soRec.save();

            return true;
          } else {
            return false;
          }
        }
      } else {
        return false;
      }
    } else {
      return true;
    }
  }

  function validateLine(scriptContext) {
    // debugger;
    var currentRec = scriptContext.currentRecord;
    if (currentRec.type == "customrecord_cntm_asm_wocreation") {
      var newJob = currentRec.getValue({
        fieldId: "custrecord_cntm_new_jobs",
      });
      var repJob = currentRec.getValue({
        fieldId: "custrecordcntm_repeat_job",
      });

      var toolnumber = currentRec.getValue({
        fieldId: "custrecord_cntm_toolnumber_asmwo",
      });
      var linestatus = currentRec.getCurrentSublistValue({
        sublistId: "recmachcustrecord_cntm_asmwoqty",
        fieldId: "custrecord_cntm_status_asm_child",
      });
      var bom = currentRec.getCurrentSublistValue({
        sublistId: "recmachcustrecord_cntm_asmwoqty",
        fieldId: "custrecord_cntm_cust_rev_created",
      });
      var revFile = currentRec.getCurrentSublistValue({
        sublistId: "recmachcustrecord_cntm_asmwoqty",
        fieldId: "custrecord_cntm_rda_rev_file",
      });
      var reprocess = currentRec.getCurrentSublistValue({
        sublistId: "recmachcustrecord_cntm_asmwoqty",
        fieldId: "custrecord_cntm_bomrev_reimport",
      });
      var fromso = currentRec.getCurrentSublistValue({
        sublistId: "recmachcustrecord_cntm_asmwoqty",
        fieldId: "custrecord_cntm_custrev_fromso",
      });
      // alert("toolnumber :"+toolnumber);
      if (scriptContext.sublistId == "recmachcustrecord_cntm_asmwoqty") {
        if (reprocess == true) {
          if (!revFile) {
            alert("Please Provide BOM Import File to Proceed Further.");
            return false;
          }
        }
        var addRevOnly = currentRec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_rdacreateonlyrevision",
        });
        var useExisting = currentRec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_use_existingbomrev",
        });
        var bomAndRev = currentRec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_create_bom_and_rev",
        });
        var bom = currentRec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_cust_rev_created",
        });
        var revFile = currentRec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_rda_rev_file",
        });
        var asmbomrev = currentRec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_wo_cust_rev",
        });

        var linestatus = currentRec.getCurrentSublistValue({
          sublistId: "recmachcustrecord_cntm_asmwoqty",
          fieldId: "custrecord_cntm_status_asm_child",
        });

        if (
          repJob == true ||
          repJob == "T" ||
          newJob == "T" ||
          newJob == true
        ) {
          if (
            useExisting == true &&
            addRevOnly == false &&
            bomAndRev == false
          ) {
            var bomSearch = search.create({
              type: "bom",
              filters: [
                ["custrecord_cntm_tool_number", "is", toolnumber],
                "AND",
                ["custrecord_cntm_asm_bom_rev_soline", "is", asmbomrev],
              ],
              columns: [
                search.createColumn({
                  name: "internalid",
                }),
              ],
            });
            var bomCount = bomSearch.runPaged().count;
            log.debug("bomCount : " + bomCount);
            if (bomCount > 0) {
              if (!bom) {
                alert(
                  "Please choose existing Customer Revision to proceed further."
                );
                return false;
              } else {
                try {
                  var fieldLookUp = search.lookupFields({
                    type: "bom",
                    id: bom,
                    columns: ["custrecord_cntm_tool_number"],
                  });
                  var toolnumberbom =
                    fieldLookUp["custrecord_cntm_tool_number"];
                  // alert("toolnumberbom
                  // :"+JSON.stringify(toolnumberbom
                  // ));
                  var stringJson = JSON.stringify(toolnumberbom);
                  var bomtoolnum = toolnumberbom[0].value;
                  if (bomtoolnum == toolnumber) {
                    var revSearch = search.create({
                      type: "bomrevision",
                      filters: [["billofmaterials", "anyof", bom]],
                      columns: [
                        search.createColumn({
                          name: "internalid",
                          sort: search.Sort.DESC,
                        }),
                      ],
                    });
                    var revCount = revSearch.runPaged().count;
                    log.debug("revCount", revCount);
                    if (revCount > 0) {
                      var revId;
                      revSearch.run().each(function (result) {
                        // .run().each
                        // has
                        // a
                        // limit
                        // of
                        // 4,000
                        // results
                        revId = result.id;
                        log.debug("revId", revId);

                        currentRec.setCurrentSublistValue({
                          sublistId: "recmachcustrecord_cntm_asmwoqty",
                          fieldId: "custrecord_cntm_bom_rev_asm",
                          value: revId,
                          ignoreFieldChange: true,
                        });
                        currentRec.setCurrentSublistValue({
                          sublistId: "recmachcustrecord_cntm_asmwoqty",
                          fieldId: "custrecord_cntm_status_asm_child",
                          value: 4,
                          ignoreFieldChange: true,
                        });

                        return false;
                      });
                    } else {
                      // nothing
                    }

                    // *******************manufacturing
                    // routing**************************************************
                    var mfg;
                    var manufacturingroutingSearchObj = search.create({
                      type: "manufacturingrouting",
                      filters: [["billofmaterials", "anyof", bom]],
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
                    manufacturingroutingSearchObj.run().each(function (result) {
                      // .run().each
                      // has a
                      // limit of
                      // 4,000
                      // results
                      mfg = result.id;
                      return true;
                    });

                    if (mfg) {
                      currentRec.setCurrentSublistValue({
                        sublistId: "recmachcustrecord_cntm_asmwoqty",
                        fieldId: "custrecord_cntm_manufacturing_templ",
                        value: mfg,
                        ignoreFieldChange: true,
                      });
                      currentRec.setCurrentSublistValue({
                        sublistId: "recmachcustrecord_cntm_asmwoqty",
                        fieldId: "custrecord_cntm_status_asm_child",
                        value: 6,
                        ignoreFieldChange: true,
                      });
                    } else {
                    }
                  } else {
                    alert(
                      "Please select the Customer revision with same tool number."
                    );
                    return false;
                  }
                  /*
                   * }else{ alert("There are no
                   * customer revision created for the
                   * specified customer Rev and tool
                   * number."); return false; }
                   */
                } catch (e) {
                  currentRec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_err_asm_child",
                    value: e.message,
                    ignoreFieldChange: true,
                  });
                  currentRec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_asmwoqty",
                    fieldId: "custrecord_cntm_status_asm_child",
                    value: 14,
                    ignoreFieldChange: true,
                  });
                  /*
                   * currentRec.commitLine({
                   * sublistId:
                   * 'recmachcustrecord_cntm_asmwoqty'
                   * });
                   */
                }

                return true;
              }
            } else {
              alert(
                "You cannot select this option because Customer Revision is not present for selected ASM BOM."
              );
              return false;
            }
          } else if (
            useExisting == false &&
            addRevOnly == true &&
            bomAndRev == false
          ) {
            var bomSearch = search.create({
              type: "bom",
              filters: [
                ["custrecord_cntm_tool_number", "is", toolnumber],
                "AND",
                ["custrecord_cntm_asm_bom_rev_soline", "is", asmbomrev],
              ],
              columns: [
                search.createColumn({
                  name: "internalid",
                }),
              ],
            });
            var bomCount = bomSearch.runPaged().count;
            log.debug("bomCount : " + bomCount);
            if (bomCount > 0) {
              if (!bom) {
                alert(
                  "Please choose existing Customer Revision to proceed further."
                );
                return false;
              } else {
                if (!revFile) {
                  alert("Please Provide BOM Import File to Proceed Further.");
                  return false;
                } else {
                  var bomSearch = search;

                  var fieldLookUp = search.lookupFields({
                    type: "bom",
                    id: bom,
                    columns: ["custrecord_cntm_tool_number"],
                  });
                  var toolnumberbom =
                    fieldLookUp["custrecord_cntm_tool_number"];
                  // alert("toolnumberbom
                  // :"+JSON.stringify(toolnumberbom
                  // ));
                  var stringJson = JSON.stringify(toolnumberbom);
                  var bomtoolnum = toolnumberbom[0].value;
                  if (bomtoolnum == toolnumber) {
                    /*
                     * currentRec.setCurrentSublistValue({
                     * sublistId:
                     * 'recmachcustrecord_cntm_asmwoqty',
                     * fieldId:
                     * 'custrecord_cntm_status_asm_child',
                     * value: 15, ignoreFieldChange:
                     * true });
                     */
                    return true;
                  } else {
                    alert(
                      "Please select the Customer revision with same tool number."
                    );
                    return false;
                  }
                }
              }
            } else {
              alert(
                "You cannot select this option because Customer Revision is already created for selected ASM BOM."
              );
              return false;
            }
          } else if (
            (repJob == "T" || repJob == true) &&
            useExisting == false &&
            addRevOnly == false &&
            bomAndRev == true
          ) {
            // *****************check if the customer
            // revisions is created for selected
            // BOM**********************************************

            var bomSearch = search.create({
              type: "bom",
              filters: [
                ["custrecord_cntm_tool_number", "is", toolnumber],
                "AND",
                ["custrecord_cntm_asm_bom_rev_soline", "is", asmbomrev],
              ],
              columns: [
                search.createColumn({
                  name: "internalid",
                }),
              ],
            });
            var bomCount = bomSearch.runPaged().count;
            log.debug("bomCount : " + bomCount);
            if (linestatus == "") {
              if (bomCount > 0) {
                alert(
                  "Customer revision is already created .You cannot use the CREATE NEW CUSTOMER REVISION AND RDA REVISION.Please check USE EXISTING CUSTOMER AND RDA REVISION"
                );
                return false;
              } else {
                if (revFile) {
                  return true;
                } else {
                  alert("Please Provide BOM Import File to Proceed Further.");
                }
              }
            } else {
              return true;
            }
          } else if (
            (repJob == "T" || repJob == true) &&
            useExisting == false &&
            addRevOnly == false &&
            bomAndRev == false
          ) {
            alert(
              "Please check one of the following options before proceeding further: \n 1. Use Existing Customer and RDA Revision \n 2. Create New RDA for Existing Customer Revision \n 3. Create New Customer Revision and RDA Revision"
            );
            return false;
          } else if (
            (newJob == "T" || newJob == true) &&
            useExisting == false &&
            addRevOnly == false &&
            bomAndRev == false &&
            fromso == false
          ) {
            alert(
              "Please check one of the following options before proceeding further: \n 1. Use Existing Customer and RDA Revision \n 2. Create New RDA for Existing Customer Revision."
            );
            return false;
          } else {
            return true;
          }
          /*
           * }else{ alert("Please select the cusotmer revision
           * for same Tool Number."); return false; }
           */
        } else {
          return true;
        }
      }
    } else {
      return true;
    }
  }

  /**
   * Validation function to be executed when record is saved.
   *
   * @param {Object}
   *            scriptContext
   * @param {Record}
   *            scriptContext.currentRecord - Current form record
   * @returns {boolean} Return true if record is valid
   *
   * @since 2015.2
   */
  function saveRecord(scriptContext) {
    try {
      if (
        scriptContext.currentRecord.type == "customrecord_cntm_asm_wocreation"
      ) {
        log.debug("INIT", "INIT");
        jQuery("#btn_multibutton_submitter")
          .closest("table")
          .css("pointer-events", "none");
        jQuery("#btn_secondarymultibutton_submitter")
          .closest("table")
          .css("pointer-events", "none");
      } else {
        // log.debug('INIT 2', 'INIT 2')
        jQuery("#btn_multibutton_submitter")
          .closest("table")
          .css("pointer-events", "");
        jQuery("#btn_secondarymultibutton_submitter")
          .closest("table")
          .css("pointer-events", "");
      }
    } catch (error) {
      log.debug("INIT error", error);
    }

    setTimeout(function () {
      log.debug("INIT 2", "INIT 2");
      jQuery("#btn_multibutton_submitter")
        .closest("table")
        .css("pointer-events", "");
      jQuery("#btn_secondarymultibutton_submitter")
        .closest("table")
        .css("pointer-events", "");
    }, 15000);
    debugger;
    var currentRec = scriptContext.currentRecord;
    if (currentRec.type == "customrecord_cntm_asm_wocreation") {
      var newJob = currentRec.getValue({
        fieldId: "custrecord_cntm_new_jobs",
      });
      var repJob = currentRec.getValue({
        fieldId: "custrecordcntm_repeat_job",
      });
      var item = currentRec.getValue({
        fieldId: "custrecord_cntm_asm_item",
      });
      var toolNum = currentRec.getValue({
        fieldId: "custrecord_cntm_toolnumber_asmwo",
      });

      var lineCnt = currentRec.getLineCount({
        sublistId: "recmachcustrecord_cntm_asmwoqty",
      });
      var bomfileArr = [];
      var bomArr = [];
      var bomRevArr = [];
      var routingArr = [];
      var woQuanArr = [];
      var tranDate = [];
      var prodDate = [];
      var noaction = [];
      if (lineCnt) {
        for (var i = 0; i < lineCnt; i++) {
          var addRevOnly = currentRec.getSublistValue({
            sublistId: "recmachcustrecord_cntm_asmwoqty",
            fieldId: "custrecord_cntm_rdacreateonlyrevision",
            line: i,
          });
          var useExisting = currentRec.getSublistValue({
            sublistId: "recmachcustrecord_cntm_asmwoqty",
            fieldId: "custrecord_cntm_use_existingbomrev",
            line: i,
          });
          var bomandrev = currentRec.getSublistValue({
            sublistId: "recmachcustrecord_cntm_asmwoqty",
            fieldId: "custrecord_cntm_create_bom_and_rev",
            line: i,
          });
          var bomfile = currentRec.getSublistValue({
            sublistId: "recmachcustrecord_cntm_asmwoqty",
            fieldId: "custrecord_cntm_rda_rev_file",
            line: i,
          });
          if (bomfile == undefined || bomfile == null || bomfile == "") {
            bomfileArr.push(i);
          }
          var bom = currentRec.getSublistValue({
            sublistId: "recmachcustrecord_cntm_asmwoqty",
            fieldId: "custrecord_cntm_cust_rev_created",
            line: i,
          });
          var bomrev = currentRec.getSublistValue({
            sublistId: "recmachcustrecord_cntm_asmwoqty",
            fieldId: "custrecord_cntm_bom_rev_asm",
            line: i,
          });
          var routing = currentRec.getSublistValue({
            sublistId: "recmachcustrecord_cntm_asmwoqty",
            fieldId: "custrecord_cntm_manufacturing_templ",
            line: i,
          });
          var woQuan = currentRec.getSublistValue({
            sublistId: "recmachcustrecord_cntm_asmwoqty",
            fieldId: "custrecord_cntm_woqty_asmwocrtn",
            line: i,
          });
          var linestatus = currentRec.getSublistValue({
            sublistId: "recmachcustrecord_cntm_asmwoqty",
            fieldId: "custrecord_cntm_status_asm_child",
            line: i,
          });
          var woTranDate = currentRec.getSublistValue({
            sublistId: "recmachcustrecord_cntm_asmwoqty",
            fieldId: "custrecord_cntm_woreleasedate_asmwocrtn",
            line: i,
          });
          var woProdDate = currentRec.getSublistValue({
            sublistId: "recmachcustrecord_cntm_asmwoqty",
            fieldId: "custrecord_cntm_scheduledate_wocrtn",
            line: i,
          });
          if (woQuan == undefined || woQuan == null || woQuan == "") {
            woQuanArr.push(i);
          }
          if (
            woTranDate == undefined ||
            woTranDate == null ||
            woTranDate == ""
          ) {
            tranDate.push(i);
          }
          if (
            woProdDate == undefined ||
            woProdDate == null ||
            woProdDate == ""
          ) {
            prodDate.push(i);
          }
          // ***********************************************************************
          if (repJob == true) {
            if (
              addRevOnly == false &&
              useExisting == false &&
              bomandrev == false
            ) {
              noaction.push(i);
            }

            if (
              !bomfile &&
              useExisting == false &&
              (addRevOnly == true || bomandrev == true)
            ) {
              alert("Please Provide BOM Import File to Proceed Further.");
              return false;
            }

            if (linestatus == 6) {
              if (routing == undefined || routing == null || routing == "") {
                if (newJob == true || (repJob == true && bomandrev == true)) {
                  alert(
                    "Manufacturing Routing is not created for this Item. Please create one to proceed further."
                  );
                  return false;
                }
              }
            }
          }
        }
        if (noaction.length > 0) {
          if (noaction.length == lineCnt) {
            alert(
              "Please check one of the following options before creating Work Orders: \n1. Use Existing Customer and RDA Revision \n 2. Create New RDA for Existing Customer Revision \n 3. Create New Customer Revision and RDA Revision"
            );
            return false;
          }
        }
        if (newJob == true) {
          if (bomfileArr.length == lineCnt) {
            alert("Please Import BOM File to Proceed Further.");
            return false;
          } else {
            return true;
          }
        }
      }
    }

    if (currentRec.type == "customrecord_cntm_wo_bom_import_fab") {
      var status = currentRec.getValue({
        fieldId: "custrecord_cntm_status_fab_wo_crtn",
      });
      log.debug("status", status);
      var newJob = currentRec.getValue({
        fieldId: "custrecord_cntm_new_job_fab",
      });
      var repJob = currentRec.getValue({
        fieldId: "custrecord_cntm_repeat_job_fab",
      });
      var newRev = currentRec.getValue({
        fieldId: "custrecord_cntm_new_to_existing_bom",
      });
      if (status == "") {
        var item = currentRec.getValue({
          fieldId: "custrecord_cntm_fab_item",
        });
        var toolNum = currentRec.getValue({
          fieldId: "custrecord_cntm_toolnum_fab",
        });
        var bom = currentRec.getValue({
          fieldId: "custrecord_cntm_bom_fab",
        });

        var bomFile = currentRec.getValue({
          fieldId: "custrecord_bom_raw_file_fab",
        });
        var depFile = currentRec.getValue({
          fieldId: "custrecord_cntm_bom_dependecy_file_fab",
        });
        var mfgFile = currentRec.getValue({
          fieldId: "custrecord_cntm_mfg_routing_filr_fab",
        });

        var newRouting = currentRec.getValue({
          fieldId: "custrecord_cntm_create_new_routing_fab",
        });

        if (repJob == false && newJob == false) {
          alert("Please select if its New Job or Repeat Job.");
          return false;
        } else if (newJob == true || newRev == true || newRouting == true) {
          var files = [];

          if (!bomFile) {
            if (newRev == true) {
              files.push("BOM file");
            }
          }

          if (!depFile) {
            if (newRev == true) {
              files.push("Dependency File");
            }
          }

          if (!mfgFile && (newRev == false || newRouting == true)) {
            files.push("Routing file");
          }
          if (files.length > 0) {
            var alertMsg = "";
            if (files.length == 2) alertMsg += files.join(" and ");
            else if (files.length > 2) {
              for (var i = 0; i < files.length; i++) {
                alertMsg += files[i];
                if (i == files.length - 2) alertMsg += " and ";
                else if (i != files.length - 1) alertMsg += ",";
              }
            } else alertMsg += files.join();
            alert("Please provide " + alertMsg + " to Proceed Further.");
            return false;
          }
        } else if (repJob == true) {
          if (newRev == true) {
            if (!bom) {
              alert(
                "Please choose existing Customer Revision to proceed further."
              );
              return false;
            }
          }
        }
      }
    }
    if (currentRec.type == "salesorder") {
      var isInterco = currentRec.getValue({ fieldId: "intercotransaction" });
      var numLines = currentRec.getLineCount({
        sublistId: "item",
      });

      var noCustRevArr = [];
      for (var index = 0; index < numLines; index++) {
        var subtype = currentRec.getSublistText({
          sublistId: "item",
          fieldId: "custcol_cntm_item_subtype",
          line: index,
        });
        if (subtype == "ASM" || (isInterco && subtype == "RDIS")) {
          var custRev = currentRec.getSublistText({
            sublistId: "item",
            fieldId: "custcolcustcol_cntm_custasmrev",
            line: index,
          });
          if (custRev == undefined || custRev == null || custRev == "") {
            noCustRevArr.push(index);
          }
        }
      }
      if (noCustRevArr.length > 0) {
        alert(
          "Please enter the value for Customer ASM REV for all ASM line items."
        );
        return false;
      }
    }
    if (currentRec.type == "manufacturingrouting") {
      try {
        debugger;
        alert("Please ensure that the 'Update BOM and Routing' button on the Work Order is clicked after manipulation of the routing steps.")
        var lineVal = currentRec.getValue({
          fieldId: "custrecord_cntm_asm_rec_line",
        });
        var asmRec = currentRec.getValue({
          fieldId: "custrecord_cntm_asm_wo_crtn_rec",
        });
        currentRec.setValue({
          fieldId: "custrecord_cntm_close_rec",
          value: true,
        });
        console.log("lineVal :" + lineVal, "asmRec :" + asmRec);
        window.opener.require(
          ["/SuiteScripts/Cntm_CS_WO Creation"],
          function (myModule) {
            myModule.updateRouting(
              currentRec.id,
              lineVal,
              asmRec,
              scriptContext
            );
          }
        );
        /*
         * var id = record .submitFields({ type :
         * record.Type.MANUFACTURING_ROUTING, id :
         * currentRec.id, values : {
         * 'custrecord_cntm_is_saved_from_asm_wo' : true },
         * options : { enableSourcing : false,
         * ignoreMandatoryFields : true } });
         */
        if (asmRec) {
          // alert(asmRec);
          currentRec.setValue({
            fieldId: "custrecord_cntm_is_saved_from_asm_wo",
            value: "T",
          });
        }
        try {
          currentRec.save({ ignoreMandatoryFields: false });
        } catch (e) {
          return false;
        }
        //
        // return true;
        window.close();
      } catch (e) {
        console.log(e);
      }
    }
    if (currentRec.type == "workorderissue") {
      // var rec = context.currentRecord;
      $("#component_splits")
        .find('tr[id*="componentrow"]')
        .each(function (i) {
          DOMFieldMapping[i] = {};
          DOMFieldMapping[i].item = currentRec.getSublistValue({
            sublistId: "component",
            fieldId: "item",
            line: i,
          });
          DOMFieldMapping[i].custsupplied =
            $(this).find("input#custsupplied")[0].checked;
          DOMFieldMapping[i].bagntag = $(this).find("input#bagntag")[0].checked;
          DOMFieldMapping[i].stacked = $(this).find("input#stacked")[0].checked;
          DOMFieldMapping[i].specificpart =
            $(this).find("input#specificpart")[0].checked;
        });
      console.log("DOMFieldMapping", JSON.stringify);
      currentRec.setValue({
        fieldId: "custbody_cntm_comp_line_fld_map",
        value: JSON.stringify(DOMFieldMapping),
      });
    }
    if (currentRec.type == "workorder") {
      // var rec = context.currentRecord;
      var oldDOMFieldMaping = currentRec.getValue({
        fieldId: "custbody_cntm_comp_line_fld_map",
      });
      var lines = currentRec.getLineCount({
        sublistId: "item",
      });
      if (oldDOMFieldMaping && JSON.stringify(oldDOMFieldMaping) != "{}") {
        var DOMFieldMapping = {};

        for (var i = 0; i < lines; i++) {
          // $('#item_splits').find('tr[id*="item_row_"]').each(function
          // (i) {
          DOMFieldMapping[i] = {};
          DOMFieldMapping[i].item = currentRec.getSublistValue({
            sublistId: "item",
            fieldId: "item",
            line: i,
          });
          DOMFieldMapping[i].custsupplied = currentRec.getSublistValue({
            sublistId: "item",
            fieldId: "custcol_cntm_cust_supplied",
            line: i,
          }); // $(this).find('input#custsupplied')[0].checked;
          DOMFieldMapping[i].bagntag = currentRec.getSublistValue({
            sublistId: "item",
            fieldId: "custcol_cntm_bag_tag",
            line: i,
          }); // $(this).find('input#bagntag')[0].checked;
          DOMFieldMapping[i].stacked = currentRec.getSublistValue({
            sublistId: "item",
            fieldId: "custcol_cntm_stacked",
            line: i,
          }); // $(this).find('input#stacked')[0].checked;
          DOMFieldMapping[i].specificpart = currentRec.getSublistValue({
            sublistId: "item",
            fieldId: "custcol_cntm_specific_part",
            line: i,
          }); // $(this).find('input#specificpart')[0].checked;
          // });
          console.log("DOMFieldMapping", JSON.stringify);
          currentRec.setValue({
            fieldId: "custbody_cntm_comp_line_fld_map",
            value: JSON.stringify(DOMFieldMapping),
          });
        }
      } else {
        // if(!rec.id){
        var asmItem = currentRec.getValue({
          fieldId: "assemblyitem",
        });
        var lineItem = currentRec.getSublistValue({
          sublistId: "item",
          fieldId: "item",
          line: 0,
        });
        if (lines == 1 && lineItem == asmItem) {
        } else {
          var bomRev = currentRec.getValue({
            fieldId: "billofmaterialsrevision",
          });
          if (bomRev) {
            var DOMFieldMapping = {};
            var bomrevisionSearchObj = search.create({
              type: "bomrevision",
              filters: [
                ["internalidnumber", "equalto", bomRev],
                /*
                 * "AND",
                 * ["component.item","anyof",item]
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
            var searchResultCount = bomrevisionSearchObj.runPaged().count;
            // log.debug("bomrevisionSearchObj result
            // count",searchResultCount);
            var line = 0;
            bomrevisionSearchObj.run().each(function (result) {
              // .run().each has a limit
              // of 4,000 results
              var bagNtagVal = result.getValue({
                name: "custrecord_cntm_bag_n_tag_rev",
                join: "component",
              });
              var specPartVal = result.getValue({
                name: "custrecord_cntm_spec_part",
                join: "component",
              });
              var custsuppliedVal = result.getValue({
                name: "custrecord_cntm_customer_supplied",
                join: "component",
              });
              var stackedVal = result.getValue({
                name: "custrecord_cntm_stacked_rev",
                join: "component",
              });
              // log.audit(bagNtagVal+specPartVal,custsuppliedVal+stackedVal);
              var bagNtag = bagNtagVal && bagNtagVal == "Y" ? true : false;
              var specPart = specPartVal && specPartVal == "Y" ? true : false;
              var custsupplied =
                custsuppliedVal && custsuppliedVal == "Y" ? true : false;
              var stacked = stackedVal && stackedVal == "Y" ? true : false;
              var item = result.getValue({
                name: "item",
                join: "component",
              });
              currentRec.selectLine({
                sublistId: "item",
                line: line,
              });
              currentRec.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "custcol_cntm_cust_supplied",
                value: custsupplied,
                line: line,
              });
              currentRec.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "custcol_cntm_stacked",
                value: stacked,
                line: line,
              });
              currentRec.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "custcol_cntm_specific_part",
                value: specPart,
                line: line,
              });
              currentRec.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "custcol_cntm_bag_tag",
                value: bagNtag,
                line: line,
              });
              currentRec.commitLine({
                sublistId: "item",
              });
              var map = {};
              if (line in DOMFieldMapping) {
                // log.debug('if');
                map = DOMFieldMapping[line];
              } else {
                // DOMFieldMapping[line]={};
                // log.debug('else');
                map.item = item;
                // map.custsupplied=false;
              }
              // log.debug('map',map);
              map.custsupplied = custsupplied;
              map.bagntag = bagNtag;
              map.stacked = stacked;
              map.specificpart = specPart;
              DOMFieldMapping[line] = map;
              line++;
              return true;
            });
            // woRec.cancelLine({sublistId:'item'});
            currentRec.setValue({
              fieldId: "custbody_cntm_comp_line_fld_map",
              value: JSON.stringify(DOMFieldMapping),
            });
            // loadWO.save();
          }
        }
      }
      // }
    }
    return true;
  }
  function updateRouting(recid, lineVal, asmRec, scriptContext) {
    debugger;
    console.log("updateRouting  recid :" + recid, "lineval :" + lineVal);

    var recordObj = currentRecord.get();
    recordObj.selectLine({
      sublistId: "recmachcustrecord_cntm_asmwoqty",
      line: lineVal,
    });
    var wo = recordObj.getCurrentSublistValue({
      sublistId: "recmachcustrecord_cntm_asmwoqty",
      fieldId: "custrecord_cntm_wonumb_asm_wocrtn",
    });
    var linestatus = recordObj.getCurrentSublistValue({
      sublistId: "recmachcustrecord_cntm_asmwoqty",
      fieldId: "custrecord_cntm_status_asm_child",
    });
    recordObj.setCurrentSublistValue({
      sublistId: "recmachcustrecord_cntm_asmwoqty",
      fieldId: "custrecord_cntm_manufac_template",

      value: "",
      ignoreFieldChange: true,
    });

    console.log("linestatus :" + linestatus);
    if (wo) {
      recordObj.setCurrentSublistValue({
        sublistId: "recmachcustrecord_cntm_asmwoqty",
        fieldId: "custrecord_cntm_manufacturing_templ",

        value: recid,
        ignoreFieldChange: true,
      });

      recordObj.setCurrentSublistValue({
        sublistId: "recmachcustrecord_cntm_asmwoqty",
        fieldId: "custrecord_cntm_asm_new_routing",

        value: false,
      });

      var id = record.submitFields({
        type: record.Type.WORK_ORDER,
        id: wo,
        values: {
          manufacturingrouting: recid,
        },
        options: {
          enableSourcing: false,
          ignoreMandatoryFields: true,
        },
      });
      recordObj.commitLine({
        sublistId: "recmachcustrecord_cntm_asmwoqty",
      });

      log.debug("here...");
    } else {
      recordObj.setCurrentSublistValue({
        sublistId: "recmachcustrecord_cntm_asmwoqty",
        fieldId: "custrecord_cntm_manufacturing_templ",

        value: recid,
        ignoreFieldChange: true,
      });
      recordObj.setCurrentSublistValue({
        sublistId: "recmachcustrecord_cntm_asmwoqty",
        fieldId: "custrecord_cntm_status_asm_child",

        value: 6,
      });
      recordObj.setCurrentSublistValue({
        sublistId: "recmachcustrecord_cntm_asmwoqty",
        fieldId: "custrecord_cntm_asm_new_routing",

        value: false,
      });
      recordObj.commitLine({
        sublistId: "recmachcustrecord_cntm_asmwoqty",
      });

      log.debug("here...");
      // asmRecord.save();
      // }
    }
    closepopup();
  }
  function createNewRouting() {
    var curRec = currentRecord.get();
    record.submitFields({
      type: curRec.type,
      id: curRec.id,
      values: {
        // custrecord_cntm_status_asmwocreation : 5,
        custrecord_cntm_new_routing: true,
      },
    });
    var redirectUrl = url.resolveRecord({
      recordType: curRec.type,
      recordId: curRec.id,
      isEditMode: true,
    });
    if (redirectUrl) window.open(redirectUrl, "_self");
  }
  function getParameterFromURL(param) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      // alert(pair);
      if (pair[0] == param) {
        return decodeURIComponent(pair[1]);
      }
    }
    return false;
  }
  function reprocessBOM() {
    var curRec = currentRecord.get();
    /*
     * record.submitFields({ type : curRec.type, id : curRec.id,
     * values : { custrecord_cntm_is_reprocess : true,
     * custrecord_cntm_status_fab_wo_crtn:'',
     * custrecord_cntm_mfg_routing_fab:'' } });
     */
    var redirectUrl = url.resolveRecord({
      recordType: curRec.type,
      recordId: curRec.id,
      isEditMode: true,
    });
    redirectUrl = redirectUrl + "&reprocess=T";
    if (redirectUrl) window.open(redirectUrl, "_self");
  }
  function refresh() {
    // alert('refresh');
    window.location.reload();
  }
  function createLotAndRouting() {
    var curRec = currentRecord.get();
    var createdFromSO = curRec.getValue({
      fieldId: "custrecord_cntm_sales_order_fab",
    });
    var bom = curRec.getValue({
      fieldId: "custrecord_cntm_bom_fab",
    });
    var fabRec = curRec.id;
    var fabLookUp = search.lookupFields({
      type: curRec.type,
      id: fabRec,
      columns: ["custrecord_cntm_routing_err_file"],
    });
    var errfile = fabLookUp.custrecord_cntm_routing_err_file;
    /*
     * curRec.getValue({
     * fieldId :
     * 'custrecord_cntm_routing_err_file'
     * });
     */
    // alert(JSON.stringify(errfile));
    // alert(createdFromSO);
    var callSuitelet = url.resolveScript({
      scriptId: "customscript_cntm_pcb_sutielet",
      deploymentId: "customdeploy_cntm_pcb_suitlet",
      params: {
        so: createdFromSO,
        bom: bom,
        fabRec: fabRec,
        errfile: errfile[0].value,
      },
      returnExternalUrl: false,
    });
    // alert(callSuitelet);
    window.open(callSuitelet, "_self");
  }
  function updateBomAndRouting() {
    var curRec = currentRecord.get();
    var createdFromSO = curRec.getValue({
      fieldId: "custrecord_cntm_sales_order_fab",
    });
    var workorderSearchObj = search.create({
      type: "workorder",
      filters: [
        ["type", "anyof", "WorkOrd"],
        "AND",
        ["custbody_pcb_rec_id", "anyof", curRec.id],
        "AND",
        ["status", "noneof", "WorkOrd:B"],
        "AND",
        ["mainline", "is", "T"],
      ],
      columns: ["tranid", "statusref", "item", "assembly"],
    });
    var searchResultCount = workorderSearchObj.runPaged().count;
    log.debug("workorderSearchObj result count", searchResultCount);
    /*
     * workorderSearchObj.run().each(function(result){ //
     * .run().each has a limit of 4,000 results return true; });
     */
    if (searchResultCount > 0) {
      alert(
        "Some of the Work Orders are already processed. You can not update the BOM for processed Work orders."
      );
    } else {
      if (
        confirm(
          "Existing BOM, Routing and Work Order details will be deleted. Do you want to continue?"
        )
      ) {
        jQuery("body").append(
          '<div id="loadingIndicator" style=" position: fixed; top: 0; left: 0; height: 100%; width: 100%; z-index: 9999; background-color:rgba(255, 255, 255, 0.85);"><img class="global-loading-indicator" src="data:image/gif;base64,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" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%)"></div>'
        );

        // jQuery('#loadingIndicator').show();

        setTimeout(function () {
          var callSuitelet = url.resolveScript({
            scriptId: "customscript_cntm_sl_update_bom",
            deploymentId: "customdeploy_cntm_sl_update_bom",
            params: {
              // so : createdFromSO,
              // bom : bom,
              fabRec: curRec.id,
            },
            returnExternalUrl: false,
          });
          var response = https.get({
            url: callSuitelet,
          });
          /*
           * var redirectUrl = url.resolveRecord({ recordType :
           * curRec.type, recordId : curRec.id, isEditMode :
           * true }); redirectUrl = redirectUrl +
           * '&updtbom=T'; if (redirectUrl)
           * window.open(redirectUrl, '_self');
           */
        });
      }
    }
    /*
     * var bom = curRec.getValue({ fieldId :
     * 'custrecord_cntm_bom_fab' }); var fabRec = curRec.id; //
     * alert(createdFromSO); var callSuitelet = url.resolveScript({
     * scriptId : 'customscript_cntm_sl_update_bom', deploymentId :
     * 'customdeploy_cntm_sl_update_bom', params : { so :
     * createdFromSO, bom : bom, fabRec : fabRec },
     * returnExternalUrl : false }); // alert(callSuitelet);
     * window.open(callSuitelet, '_self');
     */
  }
  function popuponclick(mywindow) {
    my_window = window.open(
      mywindow,
      "mywindow",
      "directories=no,location=no,menubar=no,status=no,width=900,height400,titlebar=no,toolbar=no,scrollbars=yes,resizeable=yes,left=300,top=100"
    );
  }
  function closepopup() {
    my_window.close();
  }

  /*
   * function deleteWO(){ jQuery('body').append('<div
   * id="loadingIndicator" style=" position: fixed; top: 0; left: 0;
   * height: 100%; width: 100%; z-index: 9999;
   * background-color:rgba(255, 255, 255, 0.85);"><img
   * class="global-loading-indicator"
   * src="data:image/gif;base64,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"
   * style="position: fixed; top: 50%; left: 50%; transform:
   * translate(-50%, -50%)"></div>');
   *
   * setTimeout(function() {
   *
   * try{ debugger; var currRec = currentRecord.get(); var recid=
   * currRec.id; var type=currRec.type; var noWO=[]; var woDel={}; var
   * recordObj = record.load({ type : type, id : recid, isDynamic :
   * true }); var lineNum= recordObj.getLineCount({ sublistId:
   * 'recmachcustrecord_cntm_asmwoqty' }); for(var line=0;line<lineNum;line++){
   * var lineStatus=recordObj.getSublistValue({ sublistId:
   * 'recmachcustrecord_cntm_asmwoqty', fieldId:
   * 'custrecord_cntm_status_asm_child', line: line }); var
   * wo=recordObj.getSublistValue({ sublistId:
   * 'recmachcustrecord_cntm_asmwoqty', fieldId:
   * 'custrecord_cntm_wonumb_asm_wocrtn', line: line });
   *
   *
   *
   * if(wo==undefined || wo==null || wo==""){ noWO.push(line); }else
   * if(wo && (lineStatus==8)){ var woLookup = search.lookupFields({
   * type : record.Type.WORK_ORDER, id : wo, columns : ['status'] });
   * var woStatusArr=woLookup.status; var
   * woStatus=woStatusArr[0].text; console.log("woStatus :"+woStatus);
   * if(woStatus=="Released"){ woDel[line]=wo;
   *
   *
   *
   * recordObj.selectLine({ sublistId:
   * 'recmachcustrecord_cntm_asmwoqty', line: line });
   * recordObj.setCurrentSublistValue({ sublistId :
   * 'recmachcustrecord_cntm_asmwoqty', fieldId :
   * 'custrecord_cntm_status_asm_child',
   *
   * value : 6 }); recordObj.setCurrentSublistValue({ sublistId :
   * 'recmachcustrecord_cntm_asmwoqty', fieldId :
   * 'custrecord_cntm_err_asm_child',
   *
   * value : "" }); recordObj.setCurrentSublistValue({ sublistId :
   * 'recmachcustrecord_cntm_asmwoqty', fieldId :
   * 'custrecord_cntm_asm_err_file',
   *
   * value : "" }); recordObj.setCurrentSublistValue({ sublistId :
   * 'recmachcustrecord_cntm_asmwoqty', fieldId :
   * 'custrecord_cntm_woreleasedate_asmwocrtn',
   *
   * value : "" });
   *
   * recordObj.setCurrentSublistValue({ sublistId :
   * 'recmachcustrecord_cntm_asmwoqty', fieldId :
   * 'custrecord_cntm_scheduledate_wocrtn',
   *
   * value : "" }); recordObj.setCurrentSublistValue({ sublistId :
   * 'recmachcustrecord_cntm_asmwoqty', fieldId :
   * 'custrecord_cntm_wonumb_asm_wocrtn',
   *
   * value : "" }); recordObj.commitLine({ sublistId :
   * 'recmachcustrecord_cntm_asmwoqty' }); record.delete({
   * type:record.Type.WORK_ORDER, id: wo }); }else{
   * recordObj.selectLine({ sublistId:
   * 'recmachcustrecord_cntm_asmwoqty', line: line });
   * recordObj.setCurrentSublistValue({ sublistId :
   * 'recmachcustrecord_cntm_asmwoqty', fieldId :
   * 'custrecord_cntm_err_asm_child',
   *
   * value : "Work Order cannot be deleted as it is already
   * processed." }); recordObj.commitLine({ sublistId :
   * 'recmachcustrecord_cntm_asmwoqty' }); } } } if(noWO.length ==
   * lineNum){ alert("There are no Work Orders to delete.") }else{
   *
   * var keys=Object.keys(woDel); if(keys.length>0){ for(var i=0;i<keys.length;i++){
   * var key=keys[i]; var wo=woDel[key]; } } recordObj.save();
   * window.location.reload(); }
   *
   * }catch(e){ console.log(e.message);
   * jQuery('#loadingIndicator').hide(); } }); }
   */

  function deleteWO() {
    // debugger;
    var currRec = currentRecord.get();
    var recid = currRec.id;
    var type = currRec.type;
    var noWO = [];
    var woDel = {};
    var recordObj = record.load({
      type: type,
      id: recid,
      isDynamic: true,
    });
    var lineNum = recordObj.getLineCount({
      sublistId: "recmachcustrecord_cntm_asmwoqty",
    });
    for (var line = 0; line < lineNum; line++) {
      var lineStatus = recordObj.getSublistValue({
        sublistId: "recmachcustrecord_cntm_asmwoqty",
        fieldId: "custrecord_cntm_status_asm_child",
        line: line,
      });
      var wo = recordObj.getSublistValue({
        sublistId: "recmachcustrecord_cntm_asmwoqty",
        fieldId: "custrecord_cntm_wonumb_asm_wocrtn",
        line: line,
      });
      if (wo == undefined || wo == null || wo == "") {
        noWO.push(line);
      } else if (wo && lineStatus == 8) {
        woDel[line] = wo;
      }
    }
    if (noWO.length == lineNum) {
      alert("There are no Work Orders to delete.");
    } else {
      try {
        var keys = Object.keys(woDel);
        if (keys.length > 0) {
          jQuery("body").append(
            '<div id="loadingIndicator" style=" position: fixed; top: 0; left: 0; height: 100%; width: 100%; z-index: 9999; background-color:rgba(255, 255, 255, 0.85);"><img class="global-loading-indicator" src="data:image/gif;base64,R0lGODlhyADIAPQHAOjo6Y2Nk4SEi7S0tZuboHh4gHp6gr+/v83NzfPz86qqqsbGxs7OztPT1OTk5qWlqtvb3cDAxP7+/snJzO3t7pycooGBiIqKkZOTmfb2966us9LS1be3u////wAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh/wtYTVAgRGF0YVhNUAI/eAAh+QQFCgAHACwAAAAAyADIAAAF/+AhjmRpnmiqrmzrvnAsz3Rt33iu73zv/8CgcEgsGo/IpHLJbDqf0Kh0Sq1ar9isdsvter/gsHhMLpvP6LR6zW673/C4fE6v2+/4vH7P7/v/gIGCg4SFhoeIiYqLjI2Oj5CRkpOUlZaXmJmTAAMBBgUCAwCaZBIDnwWpqQYDEqRgEgSqs6oErq9dA7S7BQO4XACovKoGo79ZusO0vsdYAcq0As1YwtCp01fV1thWz9ap0tw3nJ6gojXJ38wy5J+hxqSm2gWstzHB38Uy8rv1mrHQbM1Ip2zdC4DKBGIiOMzgQVkJ7b1gyMvhpnn94MHgR8vfPYwdNU6i2LAGOXDnBv9+S2Uxkrdv4Z68tBaTEkheUW7uuqSTVs6V1yzNhFazyVBlRSWRrBhl6a6WkPBZ0wdFKjSqlpyqgrpEK8tMCIcpjBKW19hLHGd5nJKWWCtcJ82JpBL3nbi7ePPq3cu3r9+/gAMLHky4sOFj7eQGSmyXTttVb/k8phcZTtldZ+9cppWZjddeez5zPWNVGVY7pYedXvP5K57WoN0cHZZ0zmxetdH0nJVnt6o3voPeCV7gze1dueMcj/YG9ujmQJ+TSc1rNR3qGeGIDq0uzuZZnet8ryXRzeS1es5XllM35Z/2cw/Ln0+/vv37+PPr38+/v///AAYo4IAEFggYY+75gWD/fOad0s96eahXXhvjpRKeYxCJNSFr3emx3RvYhZRHiGoxeIZzeaAoG1DJwbHcLC2WQVxvQBXnxox44NjGi6rEuOJKPo6h4h1DskEiMSbCceQqSZrxYYodvlFhARfOMWWVaUjYh5bXdYJSk6h5qZiBZJZp5plopqnmmmy26eabcA6xYBZzvsIlWw52BGElV27IRJ+ZPAmFoJQsSQ+YRRhqXSRFNtGoJDyCE0WkoPBU409AWZopFDpSQmmQRHx6yaNdRXeJooiiUCc7uy3KaJQx3AkDoZQAuk+GZvmpgq2YyDorrAflqdaep4rZ2Ayo0gAffqSqKSqcnbYZLZvPvtls/5rJxklrm7zG6WucBywL7rjklmvuGBlEEIEDeVGQSgRZuFvABCRgMG8z8sKLhbz0iiBvBfi+G28q/Ypgb8G45DvwvXgpvC/B7Qr8MMN3OdxCBPamckEEGZxAQQQa0PLABik4wIEqGx/ALwkSixBBARockO4FqoyMwscWKAPBHharAEHOu1iwcwkZWGBBBBSIsAHNMZvw8i4XOADxCC0f8DIGDgBNS9MkQDB1BiEX8ADCefSMgtQFXFDwBBkPTQLJJXhdgNtKp4IB3FanPbUIVb9s9NEjOFDB3jLnTPYDBQDch9kn0HxBxyRkYO8FLtjLQQk5P14C2hQf0HcqFiQdOf/ND5DgtwkbpAI5z1WfkHoBeHdNeAqIK1535yOEjfDnBehbwskWkBCy7SPIS3fZrZsAfAr2ls7C8CQs7zrhvLPrtHAHQF+C8YsnX8LgxJeAOAYtaC/C4OSfgPbuvZuu+glPR19A8CW8vroejH+feAohUx55BCfbBfHsFb7iUa99I4gf/LAnr9hlD2Z+yB8JwMe/tLkPZgij4AhoVkB/HdB3ebPR9UTosvn1C2yJux/+vEeC8dGuAOkL4fEOoMHz7c9jH7wgChRIggloLXFkYx0CUyC9xoltBDnj2gRvKIIi1i+HCcSeDvU3wz9IcARyC+IBsujBIZIgZ8SbQCqqGEDQ9oGQhyVAY94uV4grjmBwmovc5EaQgeTJjXhFg6EJKAA0M05xhPrTohVZSAI+pm1tbasXE0WQgQtwMI12c1sELECzzvFuh1IcnwoBIS9l+E8EDqjkLhyYNQi6bGNiLODTaBE1mvkxiiT8IyiHcbRN3qGTw/hkAjOWNo55bJUw25nUOgiBAM5PX4N7ZQljCcs08jJoootT86zXQzCC62W6hCQz2WQvEJZAjNtcE8286b4Yvsl8m8uZA9tEAQLSbQPAW+ebJmBMVajrXPjMJxtCAAAh+QQFCgAAACxcACUAEAAQAAAFOiAgAgkyKMqAJGOLoDCMtMAR38oxvvg9J71eKYgzEW+no/KYXKqWqBVUweIdZyIbUecKYmmlpIo1CgEAIfkEBQoAAQAsXAAlADAAGgAABXlgIIrNGCxmqq5se7KoK890bcNzfO80wNclmu5HLBqPyKRyCawNb4nGQKEYLBI/H29B7XaHz1WYdvCaFQem+HwG43gJNlsF1vIa8rZ6NM17B3sifmeBAYNmhX2HgIF4hwpjSXGPhSJcg5FLZXlplSOXep4mCQt9VikhACH5BAUKAAAALF0AJQBDADYAAAWwICCOI0KeaKquLIsocAybbW3feK7v5yv/M55wmEoQj0MacslsOp/QqHRKtSmP16px5wNmuUBvdXzrhoNEs+zr3KZJCLeUTa7b7/i8fl/iD+V+ImphdIGGPINohypXcYuPkJGSk5SVlpeYmZqbnG0NAzADjpWJCoWBB2cwB5Kla5AJqj+Afg2yr4ugt6GPuzK9vjCPursDj7a+p3ixvrR+rjHKeqmqrJOl0n4JCLqiciEAIfkEBQoAAAAsXAAlAEQAVwAABbYgIIrIaJ5oqq5s675wHC9ybd94ru98XvbAoHBILBqPyKTqh2Qqn1AbDTmNWq9YgDPL7Xq/4PBrKy6bv9Wzes1uu9/wuHxOr9vv+DxJL0/z/2pkgIOEhUmCholZfoqNjo+QkZKTlJWWl5iZmnYJCAMKCgMICW8IoKeniGELqK0KB2umrq2qXAmzs6RlsriotVifvagDZsKuxcaoZsHJxLvJoL9Xt9C6z8bSi8KwbLy0b53BotYAIQAh+QQFCgAAACxeACcANQBxAAAFruABjGRpnmiqrmzrvnAsz3Rt33iu73zv/8CgUEQjCo/IpHLJbDqf0Kh0ejJSr9isdsvter/gsHhMLkut5rR6zW6731M0fE6v2+/4vH7P7/v/dnKAg4SFhodagoiLjI2Oj5CRLgkIAwoKAwgJUQiXnp4ITwefpAqKQZ2lpKFKCaqqm0mpr5+sSJa0nwNKuaW8vZ9KuMC7ssCXtkeux7HGvclJo7SnQrOrUZS4mc0pIQAh+QQFCgAAACxcACUAOgB+AAAF9CAgisxonmiqruxYtnAsn8ts3+qL73zvw7qfcEgsGo/IpLIVVDaXt2dUWRNWjVKolknMbr/gsHhMzpXPRy/adF27feq3fE6v2+/4vH7P7/vjZ4BnbXWCfmKGh4qLjD2JjVqPZISQa5KVmJmam5ydnp+goaKji5dfpl+Uc6ikMaytsLE7r7IrtFqqtUO3ur2+v8DBwqK8SMVIuW/HusvDzpvNCQwDCgoDCAlyDNXc3Ag8xQvd4woHPMkz2+Tj32QJ6+vZ4ODw5O1i1PXdA2T65P3+upHJF5DfGHUB74V5F1CBvIMJ0YirZ24NAngK0UjLd+1hmRAAIfkEBQoAAAAsMAAvABsAaQAABZEgII5kWQZmqq5s675wLM90i9Z4Xt967//AoHBILBqPyKRy6eIxn9CoySlFUqvYrHbL7Xq/4LBYfB2bveWzLK1uu9/wuHyeSzAGCsUAkaAx8oCACDILgYYKBzB/h4aDLQmMjH0si5GBjit4loEDLZuHnp+BLZqinZSieZgqkKmTqJ+rLIWWiTEIkbIvdpp7rwAhACH5BAUKAAAALCcALwAkAE0AAAWVICCOZGmWgpiebOu+cCzPdG3fOL3Ce+7/v55LCCwaj8ikkrdsOp/QqHRKrVqvrRURy+16fdtT+Csdo8jotJplXrvf8Lh8Tq/b76wEY6BQDBAJRwx9hIQIRQuFigoHP4OLioc4CZCQgTePlYWSNnyahQM4n4uio4U4nqahmKZ9nDWUrZeso683iZqNQAiVtj56nn+zOSEAIfkEBQoAAAAsJwAvABsALAAABWogII5kaZbBqa5s675wLM80Wt/4neZ87//A2i5ILBqPyKRyyQQkGAOFYoBI0BjSbBYhW2i/igMMC/5yW4ly2coiq7XnVfStHbTo4Dte25rv7W17UnEqaYJsgXiELF5vYjEIaosvT3NUiC4hACH5BAUKAAAALDsALwAQABAAAAU7ICACCTMoyoAkY8ugMIy0wBLfyjG++D0nvV4piEOciLEjcklULgc85oqJYkWJM5GNqGshglla6ahijUIAIfkEBQoABwAsXAAlABAAEAAABULgIR7AEBiFMABjO6BFHBtDexByLhPjoP+FGgAGlBlKxZ8pqRMQmTNoLiCNqarBofR48EFrIlyS53rOwLYSNbVqhQAAIfkEBQoABwAsZQAlACcAGgAABWhgcIxkaZ5oqq5s675wLM90bafire+8nffAEmAQMBQCA0BwNDAWnk/DIEiAWqGE3uDKLUx1AGcXalDetuPr15e+/mri9lMXl+sCcuibhs6va2F5ZTt9aX83VWlZQE1cUksHQ3gFAkklIQAh+QQFCgAHACw0ACUAbAB8AAAF/+AhjmRpnmhKCmrrvnAsz3Rt33iu73zv/8CgcEgsGoWso3LJbDqfziR0GqVar68Fdsvter/gsPgmHZvP6LStrG673/CiNk6v2+/4vH7P7/v/gIGCg4SFhodhAAMBBgUCAwCIKgONBZaWBgMjc5IHBJeglwSdJAOhpwWapACVqJcGkZ2mrqGqkgG0oWyGrbmWpL2+pLi+lruFs8W2iKzFsKQHybSanJKftKPQI5SnmdolisSPsd/l5ufo6err7O3u7/Dx8vP09fZ91en59/z9/v8AAwocGGPfOYMEEypcyLChw4cQI0qcSPENwjAXK2rcyLGjx48dM+IQaYMkyJMoUwmqXMlSoMkmIQAAIfkEBQoACAAsNAAxAGwAcAAABesgIo5kWR5mqq5s675wLM90bd94ru987//AoHBILBqPyKRyyWw6n9ColIeaWq/YrHbL7Xq/4LB4TC6bz+i0es1uu99wcjVOr9vv+Lx+z+/7/4Ayc4GEhYaHiImKi4yNjo+QkZKTlJWWl5g1AAMBBgUCAwCLA54FpqYGAyODfwSnr6cEhwOwtQWqhACltqcGooG0vLC4gAHCsAKEu8emysyvhMbPn4TBz8R/us++hdbCqqx+rsKyiKS1qYub0qC/me/w8fLz9PX29/j5mOFe/Pr/AAMKHEiwYB9/OhDiUGiwocOHECNKnJiFYZMQACH5BAUKAAgALCkAMQBjAHAAAAXiICKOZFkeZqqubOu+cCzPdG3feK7vfO//wKBwSCwaj8ikcslsOp9QHCpKrVqv2Kx2y+16v+CweEwum8/otHrNbi+n7rh8Tq/b7/i8fs+HwvuAgYKDhIWGh4iJiouMjY6PkJGSk5Q/f5WYmZqbnJ2en2eXoKOkpaanqKmqq6ytegADAQYFAgMAggOzBbu7BgM5ol4EvMS8BHwDxcoFv3kAusu8Brd4ydHFzXcB18UCedDcu9/hxHnb5LR51uTZds/k03rr1+0zwTv3OcPXx325yr4EwTpXi5qrgwgTKlyIJZ+REAAh+QQFCgAGACwpACUAdgB+AAAF/6AhjmRpnmiqjsXqvnAsz3Jh3zat73zv/8CgcEgsGnFIpHHJbDqf0Kj015pandWrdst9MrqxLPj03SXP4hlauxi7l+W3HLo2o5Xz+HzP7/tdaX99gYKFhiJ6h4pWd3hviYtQbZF7kIh+dW6WlJydnp+goaKjpKWmp6ipqqusra4ym68ohCqxsgaZk7dTtru+PY04L72/xcaMx1TJcsTLziXBNy7NxrrPNJvUrJko2tff4OHi4+Tl5ufo6err7O3u7/Cl3q+0KfOpufHT+sXROfv8AtKLV09gjHsGPfkreImcNXfZnHEjk7CixYsYM2rcyLGjx48rEF5h2EXkk4lRHmVWNAnyxcJKLWMCIigTDMt4AAYEsCFgAAAeL5nxGIBmACmVQQg0IkAq4g6iwYzaSSKUB4CFP8NBjSYV3E5/AsQt/AduLMlfX6OF1bqw67er/rKyjVpO6R2m5rYicVsu59eecueEAAAh+QQFCgAHACw7ACUAZAB9AAAF/+AhjmRpnihppGzrvnDsriUt33iu73zv/8Cg8GBLFYfIpHLJbDp3x6c0F51ar9hssKplcVVQ07dLLpvPsui4tSai3/C4/NeeK+v2vH6fb+P5gIGCQ2qDhoeIiYqLjI2Oj5CRkpOUlZaXQn+WhZidnk5+n6KjPpqYpqSpqi+hq66vRmKws7S1tre4ubq7vL2+v8DBwsN3s5zEyHytycxwqJvN0YbL0tVlx9bZ2tvc3d7f4OFnAAMBBgUCAwDKSAPnBfDwBgN22DsE8fnxBKID+v8F6HUC8A5gPAPrzlCT4c+gPoGXAjjUJ6BTwYnwFDK5iFHjEokY4VXE1DAkREsEQzEiLEVnxo6SDk/isAcHn0N+o9z9m1dPFhByINMl1LFQnNEbzyolPcqUlcumUJH6jBMCACH5BAUKAAYALCcAJQB4AH0AAAX/oCGOZGmeaKqWxeq+cCzPdGHfNq3vfO//wKBwSCwaTbhk8shsOp/QqHTKa1GvTit2y+0aESSw96X1ik3nmnJdZW8P4zgvjaLL7zBAW7lf46Z2dXiDhIWGOmWHiomKjXiBJ5COd3pxfnyALpKTUHCch5CbXX5jaQiVn6mqq6ytrq+wsbKztLW2t7i5uru6prw1KqG/LqQknsNfmshNqMuXSaIj0cvU1YOM1j7Y2U/TBt7cL83Iz3/R4NzH4T/C6wbFaGHj7vT19vf4+fr7/P3+/wADChxIsKDBQwAGBLAhYMC8ddtEDPAzgB48EQSeEfg3sVxFfgDK3XjIS6SNjiI/eupbaFIAP5M3qsGcmYPaTJYiXe5D6REkTJK7YBrgSfFfxksbARK9oTLcxREJWTYEerCq1atYs2rdyrWr169ZIxYSS+UpHrNg02ozeUeo2rc7yF4jJPcs3LtH3GoDoncWWryN/lpyQ6sv4MOx6vpTjLixLMOOI7MS3CUEACH5BAUKAAYALCcALwAkACwAAAWHoCGOZGmSDXqurHqmbTwuLS23MH7vbMKXuVjwRywaj8ik0iUbLk2+o9M0/dlW12S1KkVFn+CweEwum8/otHqdBgwChYJgAAgP4nj84EnI+wsESnd/fntHAISESIOJeYZFcI15AkeSf5WWeUeRmZRGjJaPRIiZBUmgiaJGfY2BS6h6YW6Rc08hADs=" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%)"></div>'
          );
          setTimeout(function () {
            var length = keys.length;
            for (var i = 0; i < length; i++) {
              var key = keys[i];
              var wo = woDel[key];
              console.log("key :" + key, "wo :" + wo);
              var woLookup = search.lookupFields({
                type: record.Type.WORK_ORDER,
                id: wo,
                columns: ["status"],
              });
              var woStatusArr = woLookup.status;
              var woStatus = woStatusArr[0].text;
              console.log("woStatus :" + woStatus);
              if (woStatus == "Released") {
                recordObj.selectLine({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  line: key,
                });
                recordObj.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_status_asm_child",

                  value: 6,
                });
                recordObj.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_err_asm_child",

                  value: "",
                });
                recordObj.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_asm_err_file",

                  value: "",
                });
                recordObj.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_woreleasedate_asmwocrtn",

                  value: "",
                });

                recordObj.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_scheduledate_wocrtn",

                  value: "",
                });
                recordObj.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_wonumb_asm_wocrtn",

                  value: "",
                });
                recordObj.commitLine({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                });
                record.delete({
                  type: record.Type.WORK_ORDER,
                  id: wo,
                });
              } else {
                recordObj.selectLine({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  line: key,
                });
                recordObj.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_err_asm_child",

                  value:
                    "Work Order cannot be deleted as it is already processed.",
                });
                recordObj.commitLine({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                });
              }
            }
            recordObj.save();
            window.location.reload();
          });
        }
      } catch (e) {
        console.log(e.message);
        jQuery("#loadingIndicator").hide();
      }
    }

    /*
     * }catch(e){ console.log(e.message);
     * jQuery('#loadingIndicator').hide(); }
     */
  }

  function updateManufacturingRoutingTime(routingId) {
    console.log("updateManufacturingRoutingTime id :", routingId);
    try {
      var message = confirm(
        "The Run Rates of the Routing Steps will be updated according to the Boards per Panel. Click OK to proceed, else Cancel.."
      );
      if (message) {
        jQuery("body").append(
          '<div id="loadingIndicator" style=" position: fixed; top: 0; left: 0; height: 100%; width: 100%; z-index: 9999; background-color:rgba(255, 255, 255, 0.85);"><img class="global-loading-indicator" src="data:image/gif;base64,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" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%)"></div>'
        );
        jQuery("#loadingIndicator").show();

        setTimeout(function () {
          var suiteletURL = url.resolveScript({
            scriptId: "customscript_cntm_sl_update_routing_time",
            deploymentId: "customdeploy_cntm_sl_ud_routing_time_dep",
            returnExternalUrl: true,
            params: {
              routingId: routingId,
              rem: 0,
            },
          });
          console.log("suiteletURL :", suiteletURL);
          var response = https.get({
            url: suiteletURL,
          });
          console.log("response :", response);

          if (response.body == "SUCCESS" || response.body == "ERROR") {
            window.location.reload();
            // jQuery("#loadingIndicator").hide();
          }
        }, 100);
      } else {
        console.log("failure");
      }
    } catch (error) {
      console.log("error in updateManufacturingRoutingTime:" + error);
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
    pageInit: pageInit,
    sublistChanged: sublistChanged,
    fieldChanged: fieldChanged,
    /*
     * postSourcing : postSourcing, lineInit : lineInit,
     * validateField : validateField, validateLine : validateLine,
     * validateInsert : validateInsert, validateDelete :
     * validateDelete,
     */
    // validateField : validateField,
    validateDelete: validateDelete,
    createLotAndRouting: createLotAndRouting,
    updateBomAndRouting: updateBomAndRouting,
    validateLine: validateLine,
    lineInit: lineInit,
    saveRecord: saveRecord,
    woCreateFab: woCreateFab,
    woCreateAsm: woCreateAsm,
    createNewRouting: createNewRouting,
    reprocessBOM: reprocessBOM,
    updateRouting: updateRouting,
    popuponclick: popuponclick,
    closepopup: closepopup,
    // validateInsert : validateInsert,
    refresh: refresh,
    deleteWO: deleteWO,
    updateManufacturingRoutingTime: updateManufacturingRoutingTime,
  };
});
