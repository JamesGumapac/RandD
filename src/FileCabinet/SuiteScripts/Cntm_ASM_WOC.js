/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(["N/record", "N/runtime", "N/search"], /**
 * @param {record}
 *            record
 * @param {runtime}
 *            runtime
 * @param {search}
 *            search
 */
function (record, runtime, search) {
  /**
   * Marks the beginning of the Map/Reduce process and generates input
   * data.
   *
   * @typedef {Object} ObjectRef
   * @property {number} id - Internal ID of the record instance
   * @property {string} type - Record type id
   *
   * @return {Array|Object|Search|RecordRef} inputSummary
   * @since 2015.1
   */
  function getInputData() {
    log.debug("-----getInputData-----");
    var requestBody = JSON.parse(
      runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_requestbody",
      })
    );
    log.debug("woc_data :", requestBody);
    requestBody = JSON.parse(requestBody);
    var recid = requestBody.asmOpRec;
    var operation = requestBody.operation;
    var completedQty = requestBody.completedQty;
    var wocQty = requestBody.woQty;
    var scrapQty = requestBody.scrapQty;
    var laborRunTime = requestBody.laborRunTime;
    var laborSetupTime = requestBody.laborSetupTime;
    var rework_info = JSON.stringify(requestBody.reworkinfo);
    var scrap_info = requestBody.scrapinfo;
    var operator = requestBody.operator;
    var lastOp_invnum = requestBody.lastopdetails;
    var enterScrap = requestBody.enterScrap;
    var cum_scr_Qty = requestBody.cum_scr_Qty;
    var totalQtyfinal = requestBody.totalQtyfinal;
    var endOp = requestBody.endingopdetails;

    log.debug("recid :" + recid);

    var asmHeaderLookup = search.lookupFields({
      type: "customrecord_cntm_client_app_asm_oper",
      id: recid, // requestBody.parentRec,
      columns: [
        "custrecord_cntm_asm_wo_ref",
        "custrecord_cntm_asm_is_lastop",
        "custrecord_cntm_is_first_op",
        "custrecord_cntm_next_op",
        "custrecord_cntm_asm_op_text",
        "custrecord_cntm_asm_operation",
        "custrecord_cntm_is_single_op",
      ],
    });
    log.debug("completedQty :" + completedQty, "scrapQty :" + scrapQty);
    requestBody.wo = asmHeaderLookup.custrecord_cntm_asm_wo_ref[0].value;
    // requestBody.isLastOp =
    // asmHeaderLookup.custrecord_cntm_asm_is_lastop;
    requestBody.isFirst = asmHeaderLookup.custrecord_cntm_is_first_op;
    requestBody.oprtn =
      asmHeaderLookup.custrecord_cntm_asm_op_text.split(" ")[0];
    // requestBody.nextOp = asmHeaderLookup.custrecord_cntm_next_op;
    requestBody.op = asmHeaderLookup.custrecord_cntm_asm_operation;
    requestBody.isSingleOp = asmHeaderLookup.custrecord_cntm_is_single_op;
    var oprtseq = [];
    var oprText = [];

    log.debug("wo :" + requestBody.wo);
    var multiOprec = record.create({
      type: "customrecord_cntm_asm_multi_op",
    });
    multiOprec.setValue({
      fieldId: "custrecord_cntm_asm_end_op",
      value: endOp.id,
    });
    multiOprec.setValue({
      fieldId: "custrecord_cntm_asm_start_op",
      value: operation,
    });
    multiOprec.setValue({
      fieldId: "custrecord_cntm_asm_work_ord",
      value: requestBody.wo,
    });
    requestBody.multiRecId = multiOprec.save();
    var subrecIds = [];
    var parentRecIds = [];
    var customrecord_cntm_client_app_asm_operSearchObj = search.create({
      type: "customrecord_cntm_client_app_asm_oper",
      filters: [
        ["custrecord_cntm_asm_wo_ref", "anyof", requestBody.wo],
        "AND",
        [
          "formulanumeric: TO_NUMBER({custrecord_cntm_asm_operation})",
          "between",
          operation,
          endOp.id,
        ],
      ],
      columns: [
        search.createColumn({
          name: "custrecord_cntm_asm_operation",
          label: "Operation",
        }),
        search.createColumn({
          name: "custrecord_cntm_asm_op_text",
          label: "Operation num and Text",
        }),
        search.createColumn({
          name: "custrecord_cntm_next_op",
          label: "Next Operation",
        }),
        search.createColumn({
          name: "custrecord_cntm_next_op_next",
          label: "Next Operation Text",
        }),
        search.createColumn({
          name: "custrecord_cntm_asm_is_lastop",
        }),
      ],
    });
    // VAR COUNTER = 0;
    var searchResultCount =
      customrecord_cntm_client_app_asm_operSearchObj.runPaged().count;
    log.debug(
      "customrecord_cntm_client_app_asm_operSearchObj result count",
      searchResultCount
    );
    customrecord_cntm_client_app_asm_operSearchObj
      .run()
      .each(function (result) {
        // .run().each has a limit of 4,000 results
        var recid = result.id;
		log.audit('recid :',recid);
        requestBody.nextOp = result.getValue({
          name: "custrecord_cntm_next_op",
        });
        oprtseq.push(
          result
            .getValue({
              name: "custrecord_cntm_asm_op_text",
            })
            .split(" ")[0]
        );
        oprText.push(
          result.getValue({
            name: "custrecord_cntm_asm_op_text",
          })
        );
        record.submitFields({
          type: "customrecord_cntm_client_app_asm_oper",
          id: recid,
          values: {
            custrecord_cntm_asm_woc_status: 3,
            custrecord_cntm_multiop: requestBody.multiRecId,
          },
        });

        log.debug("operation :" + operation, "completedQty :" + completedQty);
        log.debug("scrap_info :" + JSON.stringify(scrap_info), "rework_info :" + JSON.stringify(rework_info));
        log.debug("lastOp_invnum", lastOp_invnum);
        log.debug("enterScrap :" + enterScrap + "cum_scr_Qty :" + cum_scr_Qty);
        var sublstRec = record.create({
          type: "customrecord_cntm_asm_client_app",
        });
        sublstRec.setValue({
          fieldId: "custrecord_cntm_wo_reference",
          value: requestBody.wo,
        });
        sublstRec.setValue({
          fieldId: "custrecord_cntm_sublst_parent_op",
          value: recid,
        });
        sublstRec.setValue({
          fieldId: "custrecord_cntm_sublist_woc_qty",
          value: requestBody.completedQty,
        });
        /*
         * if(scrapQty){ sublstRec.setValue({
         * fieldId:"custrecord_cntm_sublst_completed_qty",
         * value:parseInt(completedQty)-parseInt(scrapQty)
         * }); }else{
         */
        sublstRec.setValue({
          fieldId: "custrecord_cntm_sublst_completed_qty",
          value: requestBody.completedQty,
        });

        var asmOperation = result.getValue(
          search.createColumn({
            name: "custrecord_cntm_asm_operation",
            label: "Operation",
          })
        );

        asmOperation = parseInt(asmOperation) + "";
        // endOp.id
        if (asmOperation == endOp.id) {
          sublstRec.setValue({
            fieldId: "custrecord_cntm_sublst_scrapqty",
            value: requestBody.scrapQty,
          });
        }

        sublstRec.setValue({
          fieldId: "custrecord_cntm_sublst_status",
          value: 3,
        });
        sublstRec.setValue({
          fieldId: "custrecord_cntm_sublst_laborruntime",
          value: requestBody.laborRunTime,
        });
        sublstRec.setValue({
          fieldId: "custrecord_cntm_qty_woc_final",
          value: requestBody.totalQtyfinal,
        });
        sublstRec.setValue({
          fieldId: "custrecord_cntm_sublst_laborsetuptime",
          value: requestBody.laborSetupTime,
        });
		//to be uncommented later
        // sublstRec.setValue({
        //   fieldId: "custrecord_cntm_sublst_operator",
        //   value: requestBody.operator,
        // });
        sublstRec.setValue({
          fieldId: "custrecord_cntm_rework_info",
          value: JSON.stringify(requestBody.rework_info),
        });

        sublstRec.setValue({
          fieldId: "custrecord_cntm_scrap_info",
          value: JSON.stringify(requestBody.scrap_info),
        });
        sublstRec.setValue({
          fieldId: "custrecord_cntm_last_op_inv_num",
          value: JSON.stringify(requestBody.lastOp_invnum),
        });
        if (
          requestBody.enterScrap == true ||
          requestBody.enterScrap == "true"
        ) {
          sublstRec.setValue({
            fieldId: "custrecord_cntm_enter_scrap",
            value: true,
          });
        }
        if (requestBody.cum_scr_Qty) {
          sublstRec.setValue({
            fieldId: "custrecord_cntm_cumm_scrap_to_enter_woc",
            value: requestBody.cum_scr_Qty,
          });
        }
        var subrecId = sublstRec.save();
        var map = {};
        map.subrecId = subrecId;
        map.parentRec = recid;
        // map.isLastOp = result.getValue({
        // 	name : 'custrecord_cntm_asm_is_lastop'
        // });

        // if (subrecIds.length == 1) {
        var asmOpRecLookup = search.lookupFields({
          type: "customrecord_cntm_asm_client_app",
          id: subrecId,
          columns: [
            "custrecord_cntm_sublist_woc_qty",
            "custrecord_cntm_sublst_parent_op",
            "custrecord_cntm_sublst_scrapqty",
            "custrecord_cntm_sublst_machineruntime",
            "custrecord_cntm_sublst_machinesetuptime",
            "custrecord_cntm_sublst_laborruntime",
            "custrecord_cntm_sublst_laborsetuptime",
            "custrecord_cntm_sublst_woc",
            "custrecord_cntm_sublst_operator",
            "custrecord_cntm_sublst_completed_qty",
            "custrecord_cntm_sublst_status",
            "custrecord_cntm_rework_info",
            "custrecord_cntm_scrap_info",
            "custrecord_cntm_sublst_completed_qty",
            "custrecord_cntm_last_op_inv_num",
            "custrecord_cntm_enter_scrap",
            "custrecord_cntm_cumm_scrap_to_enter_woc",
            "custrecord_cntm_qty_woc_final",
          ],
        });
        log.debug("asmOpRecLookup", JSON.stringify(asmOpRecLookup));
        var parentRec =
          asmOpRecLookup.custrecord_cntm_sublst_parent_op[0].value;
        log.debug("parentRec" + parentRec);

        map.opText = asmOpRecLookup.custrecord_cntm_asm_op_text;
        log.audit('map.opText :',map.opText);
        map.lastopdetails = asmOpRecLookup.custrecord_cntm_last_op_inv_num;
        map.wocQty = asmOpRecLookup.custrecord_cntm_sublist_woc_qty;
        // if (subrecIds.length == 1) {
        requestBody.cummScrap =
          asmOpRecLookup.custrecord_cntm_cumm_scrap_to_enter_woc;
        // requestBody.totalQtyWOC = asmOpRecLookup.custrecord_cntm_qty_woc_final;
        requestBody.labourSetupTime =
          asmOpRecLookup.custrecord_cntm_sublst_laborsetuptime;
        requestBody.labourRunTime =
          asmOpRecLookup.custrecord_cntm_sublst_laborruntime;
        // }
        // }
        subrecIds.push(map);
        return true;
      });
    requestBody.oprtseq = oprtseq;
    requestBody.oprText = oprText;
    requestBody.subrecIds = subrecIds;
    var arr = [];
    arr.push(requestBody);
    // var woc_data = requestBody;
    return arr;
  }

  /**
   * Executes when the map entry point is triggered and applies to
   * each key/value pair.
   *
   * @param {MapSummary}
   *            context - Data collection containing the key/value
   *            pairs to process through the map stage
   * @since 2015.1
   */
  function map(context) {
    var woc_map = JSON.parse(context.value);
    log.audit('MAP woc_map :',woc_map);
    // log.audit('MAP woc_map type :', typeof woc_map);

    var recIds = woc_map.subrecIds;

    try {
      if (woc_map.scrapinfo) {
        updateSerialNumForScrap(woc_map.scrapinfo);
      }

      log.debug("completion--");
      var wocObj = record.transform({
        fromType: record.Type.WORK_ORDER,
        fromId: woc_map.wo,
        toType: record.Type.WORK_ORDER_COMPLETION,
        isDynamic: true,
      });

      wocObj.setText({
        fieldId: "startoperation",
        text: woc_map.oprtn,
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
      wocObj.setText({
        fieldId: "endoperation",
        text: woc_map.endingopdetails.id,
      });
      // wocObj.setValue({
      //   fieldId: "custbody_cntm_op_client_app",
      //   value: woc_map.operator,
      // });

      log.debug("totalQtyWOC :" + woc_map.totalQtyWOC);
      wocObj.setValue({
        fieldId: "completedquantity",
        value: woc_map.totalQtyfinal,
        // custrecord_cntm_cso_woc_quantity
      });
      // }

      log.debug(
        "asmOpRecLookup.custrecord_cntm_sublist_woc_qty :" + woc_map.wocQty
      );
      if (woc_map.oprText) {
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

        log.debug("oprtseq :" + woc_map.oprtseq);
        var operationLine = wocObj.getLineCount({
          sublistId: "operation",
        });
        log.debug("operationLine", woc_map.operationLine);
        operationLine = parseInt(operationLine);
        if (operationLine > 0) {
          for (var i = 0, j = 0; i < operationLine; i++) {
            var op = wocObj.getSublistValue({
              sublistId: "operation",
              fieldId: "operationsequence",
              line: i,
            });
            if (woc_map.oprtseq.indexOf("" + op) > -1) {
              j++; // (woc_map.oprtseq == op) {
            //   log.debug("in same operation");
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
                value: woc_map.labourSetupTime,
              });
              wocObj.setCurrentSublistValue({
                sublistId: "operation",
                fieldId: "laborruntime",
                value: woc_map.labourRunTime,
              });
              wocObj.commitLine({
                sublistId: "operation",
              });
              // break;
            }
            if (j == woc_map.oprtseq.length) break;
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
              woc_map.oprText,
              woc_map.wo
            );
            }



          // }
        } catch (e) {
          woc_map.errMsg = e.message;
          context.write({
            key: "Failure",
            value: woc_map,
          });
        }
      }
      context.write({
        key: "Success",
        value: woc_map,
      });
    } catch (e) {
      context.write({
        key: "Failure",
        value: woc_map,
      });
      log.error("error" + e.message, JSON.stringify(e));
      record.submitFields({
        type: "customrecord_cntm_asm_client_app",
        id: recId,
        values: {
          // custrecord_cntm_cso_wocnumber :
          // wocId,
          custrecord_cntm_asm_woc_status: "5",
          custrecord_cntm_err_fld: e.message,
        },
      });
    }
  }
  function getTotalScrapQty(wo) {
    var customrecord_cntm_client_app_asm_operSearchObj = search.create({
      type: "customrecord_cntm_asm_client_app",
      filters: [
        ["custrecord_cntm_wo_reference", "is", wo],
        "AND",
        ["custrecord_cntm_sublst_scrapqty", "notequalto", "0"],
        "AND",
        ["custrecord_cntm_sublst_status", "is", "4"],
      ],
      columns: [
        search.createColumn({
          name: "internalid",
          label: "ID",
        }),

        search.createColumn({
          name: "custrecord_cntm_sublst_scrapqty",
          label: "Scrap Qty",
        }),
      ],
    });
    var scrapQty = 0;
    var searchResultCount =
      customrecord_cntm_client_app_asm_operSearchObj.runPaged().count;
    log.debug(
      "customrecord_cntm_client_app_asm_operSearchObj result count",
      searchResultCount
    );
    customrecord_cntm_client_app_asm_operSearchObj
      .run()
      .each(function (result) {
        // .run().each has a limit of 4,000 results
        var scrap = result.getValue("custrecord_cntm_sublst_scrapqty");
        scrapQty = scrapQty * 1 + scrap * 1;
        return true;
      });
    return scrapQty;
  }
  function updateNextOp(
    nextOp,
    completedQty,
    parentRec,
    totalWOCQty,
    wo,
    scrapQty
  ) {
    try {
      log.debug("updateNextOp :" + nextOp, "completedQty :" + completedQty);

      var recid;
      var customrecord_cntm_client_app_asm_operSearchObj = search.create({
        type: "customrecord_cntm_client_app_asm_oper",
        filters: [
          ["custrecord_cntm_asm_operation", "is", nextOp],
          "AND",
          ["custrecord_cntm_asm_wo_ref", "is", wo],
        ],
        columns: [
          search.createColumn({
            name: "scriptid",
            sort: search.Sort.ASC,
            label: "Script ID",
          }),

          search.createColumn({
            name: "internalid",
            label: "Id",
          }),
        ],
      });

      var searchResultCount =
        customrecord_cntm_client_app_asm_operSearchObj.runPaged().count;
      log.debug(
        "customrecord_cntm_client_app_asm_operSearchObj result count",
        searchResultCount
      );
      customrecord_cntm_client_app_asm_operSearchObj
        .run()
        .each(function (result) {
          // .run().each has a limit of 4,000 results
          recid = result.getValue(
            search.createColumn({
              name: "internalid",
              label: "Id",
            })
          );

          return false;
        });
      log.debug("recid", recid);
      var fieldLookUp = search.lookupFields({
        type: "customrecord_cntm_client_app_asm_oper",
        id: recid,
        columns: [
          "custrecord_cntm_remaining_qty",
          "custrecord_cntm_completed_qty",
        ],
      });
      var initailVal = fieldLookUp["custrecord_cntm_remaining_qty"];
      var compl_qty = fieldLookUp["custrecord_cntm_completed_qty"];
      log.debug("initailVal :" + initailVal, "completedQty :" + completedQty);
      var recObj = record.load({
        type: "customrecord_cntm_client_app_asm_oper",
        id: recid,
      });
      recObj.setValue({
        fieldId: "custrecord_cntm_remaining_qty",

        value:
          (initailVal ? parseInt(initailVal) : 0) +
          (completedQty ? parseInt(completedQty) : 0),
      });

      recObj.save();

      log.debug("next op updated successfully");
    } catch (e) {
      log.debug("error", JSON.stringify(e));
    }
  }

  function updateHeaderRec(parentRec, completedQty, scrapQty, oprtn, wo) {
    log.debug("updateHeaderRec :" + parentRec);
    var newCompletedQty = completedQty;
    var newQty = 0;
    if (scrapQty) {
      newQty = completedQty * 1 + scrapQty * 1;
    } else {
      newQty = completedQty;
    }
    log.debug("newQty :" + newQty);
    // get total scrap for each operation
    var totalOperationScrapSearch = search.create({
      type: "customrecord_cntm_asm_client_app",
      filters: [
        ["custrecord_cntm_sublst_parent_op", "is", parentRec],
        "AND",
        ["custrecord_cntm_sublst_status", "is", "4"],
      ],
      columns: [
        search.createColumn({
          name: "custrecord_cntm_sublst_completed_qty",
          label: "WOC quantity",
        }),
        search.createColumn({
          name: "custrecord_cntm_sublist_woc_qty",
          label: "WOC quantity",
        }),
        search.createColumn({
          name: "custrecord_cntm_sublst_scrapqty",
          label: "Scrap Qty",
        }),

        search.createColumn({
          name: "internalid",
          label: "Id",
        }),
      ],
    });
    var totalScrapForOp = 0;
    var totalWOCQty = 0;
    var searchResultCountForTotalScrapOp =
      totalOperationScrapSearch.runPaged().count;
    log.debug(
      "totalOperationScrapSearch result count",
      searchResultCountForTotalScrapOp
    );
    totalOperationScrapSearch.run().each(function (result) {
      // .run().each has a limit of 4,000 results

      var scrapQtyEachOp = result.getValue("custrecord_cntm_sublst_scrapqty");
      log.debug("scrapQtyEachOp :" + scrapQtyEachOp);
      totalScrapForOp = totalScrapForOp * 1;
      // + (scrapQtyEachOp * 1);
      return true;
    });
    log.debug("totalScrapForOp :" + totalScrapForOp);
    // get total scrap for entrire WO
    var customrecord_cntm_client_app_asm_SubSearchObj = search.create({
      type: "customrecord_cntm_asm_client_app",
      filters: [
        ["custrecord_cntm_wo_reference", "is", wo],
        "AND",
        ["custrecord_cntm_sublst_parent_op", "is", parentRec],
        "AND",
        ["custrecord_cntm_sublst_status", "is", "4"],
      ],
      columns: [
        search.createColumn({
          name: "custrecord_cntm_sublst_completed_qty",
          label: "WOC quantity",
        }),
        search.createColumn({
          name: "custrecord_cntm_sublist_woc_qty",
          label: "WOC quantity",
        }),
        search.createColumn({
          name: "custrecord_cntm_sublst_scrapqty",
          label: "Scrap Qty",
        }),

        search.createColumn({
          name: "custrecord_cntm_remaining_qty",
          join: "CUSTRECORD_CNTM_SUBLST_PARENT_OP",
          label: "remaining Qty",
        }),
        search.createColumn({
          name: "internalid",
          label: "Id",
        }),
      ],
    });

    var cummscrap_qty = 0;

    var searchResultCount =
      customrecord_cntm_client_app_asm_SubSearchObj.runPaged().count;
    log.debug(
      "customrecord_cntm_client_app_asm_SubSearchObj result count",
      searchResultCount
    );
    customrecord_cntm_client_app_asm_SubSearchObj.run().each(function (result) {
      var scrapQtyOp = result.getValue("custrecord_cntm_sublst_scrapqty");

      cummscrap_qty = cummscrap_qty * 1 + scrapQtyOp * 1;
      return true;
    });
    log.debug("cummscrap_qty :" + cummscrap_qty);
    var fieldLookUp = search.lookupFields({
      type: "customrecord_cntm_client_app_asm_oper",
      id: parentRec,
      columns: [
        "custrecord_cntm_remaining_qty",
        "custrecord_cntm_completed_qty",
      ],
    });

    var remainingQty = fieldLookUp["custrecord_cntm_remaining_qty"];
    var totalCom = fieldLookUp["custrecord_cntm_completed_qty"];
    // var totalCom = newQty["custrecord_cntm_completed_qty"];
    log.debug(
      "remainingQty :" + remainingQty,
      "parseInt(completedQty)+parseInt(totalCom):" +
        (completedQty * 1 + totalCom * 1)
    );

    /*
     * record.submitFields({ type :
     * 'customrecord_cntm_client_app_asm_oper', id : parentRec,
     * values : { custrecord_cntm_remaining_qty : (remainingQty * 1) -
     * (newQty * 1), custrecord_cntm_completed_qty :
     * (newCompletedQty * 1) + (totalCom * 1),
     * custrecord_cntm_asm_cumm_scrap : cummscrap_qty,
     * custrecord_cntm_asm_scrap_qty : totalScrapForOp } });
     */
    var map = {};
    map.remQty = remainingQty * 1 - newQty * 1;
    // map.cmpltQty = (newCompletedQty * 1) + (totalCom * 1);
    map.cmpltQty = totalCom * 1 + newQty * 1;
    log.debug({
      title: "Completed Qty After change",
      details: map.cmpltQty,
    });
    log.debug({
      title: "completedQty -- scrapQty",
      details: completedQty + "--" + scrapQty,
    });

    map.cumScrp = cummscrap_qty;
    map.totalScrapForOp = totalScrapForOp;
    map.totalWOCQty = totalWOCQty;
    map.newQty = newQty;
    return map;
  }

  function createReworkRec(wocId, reworkInfo, op, opText, wo) {
    try {
      log.audit({
        title: "Rework Data",
        details: 'wocId: ' + wocId + ': reworkInfo :' + reworkInfo + ': op :' + op + ' : opText : ' + opText +  ' : wo :' + wo
      })
      // var parseReworkInfo = JSON.parse(reworkInfo);
      var parseReworkInfo = reworkInfo;

      for (var i = 0; i < parseReworkInfo.length; i++) {
        var serialNumInfo = parseReworkInfo[i];
        var reworkNum = serialNumInfo["id"];

        var reason = serialNumInfo["reworkreason"];
        var reworkRec = record.create({
          type: "customrecord_cntm_asm_rework",
        });
       var check_flag = getserialidcount(reworkNum);
       if(check_flag<=0)
       {
        reworkRec.setValue({
          fieldId: "custrecord_cntm_serialnum_rework",
          value: reworkNum,
        });
      }
      else{
        reworkRec.setValue({
          fieldId: "custrecord_cntm_serialnum_rework_v",
          value: reworkNum,
        });
      }
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
          value: op,
        });
        log.debug("operation text",opText[0])
        reworkRec.setValue({
          fieldId: "custrecord_cntm_operationtext",
          value: opText[0],
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
function getserialidcount(serial_internalid)
{
  var customrecord_cntm_asm_serial_idsSearchObj = search.create({
    type: "customrecord_cntm_asm_serial_ids",
    filters:
    [
       ["internalid","is",serial_internalid]
    ],
    columns:
    [
       search.createColumn({
          name: "name",
          sort: search.Sort.ASC,
          label: "Name"
       }),
       search.createColumn({name: "scriptid", label: "Script ID"}),
       search.createColumn({name: "custrecord_cntm_is_scrap", label: "Is Scrap"}),
       search.createColumn({name: "custrecord_cntm_asm_scrap_rsn", label: "Scrap Reason"})
    ]
 });
 var searchResultCount = customrecord_cntm_asm_serial_idsSearchObj.runPaged().count;
 log.audit("customrecord_cntm_asm_serial_idsSearchObj result count",searchResultCount);
 return searchResultCount;
}
  function updateSerialNumForScrap(scrapInfo) {
    try {
      if (scrapInfo) {
        var parseScrapInfo = scrapInfo;
        for (var i = 0; i < parseScrapInfo.length; i++) {
          var individualScrapInfo = parseScrapInfo[i];
          var id = individualScrapInfo["id"];
          var rsn = individualScrapInfo["scrapreason"];
          log.debug("id :" + id, "rsn :" + rsn);
          record.submitFields({
            type: "customrecord_cntm_asm_serial_ids",
            id: id,
            values: {
              custrecord_cntm_is_scrap: true,
              custrecord_cntm_asm_scrap_rsn: rsn,
            },
          });
        }
      }
    } catch (e) {
      log.error("error while updating scrap info", e.message);
    }
  }

  function updateScrapOnNextOp(wo, scrapQty, parentRec, oprtn) {
    log.debug("updateScrapOnNextOp");
    var customrecord_cntm_client_app_asm_Search = search.create({
      type: "customrecord_cntm_client_app_asm_oper",
      filters: [["custrecord_cntm_asm_wo_ref", "is", wo]],
      columns: [
        search.createColumn({
          name: "custrecord_cntm_asm_operation",
          label: "Operation",
        }),
        search.createColumn({
          name: "custrecord_cntm_scrap_fr_next_op",
          label: "Scrap for next op",
        }),

        search.createColumn({
          name: "internalid",
          label: "Id",
        }),
      ],
    });

    var searchResultCount =
      customrecord_cntm_client_app_asm_Search.runPaged().count;
    log.debug(
      "customrecord_cntm_client_app_asm_Search result count",
      searchResultCount
    );

    customrecord_cntm_client_app_asm_Search.run().each(function (result) {
      var id = result.getValue("internalid");
      var scrapForNextOp = result.getValue("custrecord_cntm_scrap_fr_next_op");
      var operation = result.getValue("custrecord_cntm_asm_operation");
      if (oprtn != operation && operation > oprtn) {
        var totalScrap = scrapForNextOp * 1 + scrapQty * 1;
        log.debug("totalScrap :" + totalScrap);
        record.submitFields({
          type: "customrecord_cntm_client_app_asm_oper",
          id: id,
          values: {
            custrecord_cntm_scrap_fr_next_op: totalScrap,
          },
        });
      }
      return true;
    });
  }
  function updateSerailNumRec(finalSerialNum) {
    try {
      for (var i = 0; i < finalSerialNum.length; i++) {
        var individualSerialInfo = finalSerialNum[i];
        var id = individualSerialInfo["serialid"];
        var name = individualSerialInfo["serialName"];
        log.debug("id :" + id, "name :" + name);
        record.submitFields({
          type: "customrecord_cntm_asm_serial_ids",
          id: id,
          values: {
            custrecord_cntm_is_process: false,
          },
        });
      }
    } catch (e) {
      log.error("error while updating serial number info", e.message);
    }
  }
  function updateWoRec(wo) {
    // log.audit('update wo :',wo);
    var serailNumberSearch = search.create({
      type: "customrecord_cntm_asm_serial_ids",
      filters: [
        ["isinactive", "is", "F"],
        "AND",
        /*
         * ["custrecord_cntm_is_scrap","is","F"], "AND",
         * ["custrecord_cntm_is_process","is","F"], "AND",
         */
        ["custrecord10", "is", wo],
      ],
      columns: [
        search.createColumn({
          name: "internalid",
          label: "Id",
        }),
        search.createColumn({
          name: "custrecord9",
          label: "SerailId",
        }),
        search.createColumn({
          name: "custrecord_cntm_is_scrap",
          label: "Is Scrapped",
        }),
        search.createColumn({
          name: "custrecord_cntm_is_process",
          label: "Is Processed",
        }),
      ],
    });
    var scrapCount = 0;
    var goodQty = 0;
    var serailNumberSearchCount = serailNumberSearch.runPaged().count;
    log.debug("serailNumberSearchCount result count", serailNumberSearchCount);

    serailNumberSearch.run().each(function (result) {
      var isScrapped = result.getValue("custrecord_cntm_is_scrap");
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
  /**
   * Executes when the reduce entry point is triggered and applies to
   * each group.
   *
   * @param {ReduceSummary}
   *            context - Data collection containing the groups to
   *            process through the reduce stage
   * @since 2015.1
   */
  function reduce(context) {
    // send the subrecid to reduce

    if ("Failure") {
    }
  }

  /**
   * Executes when the summarize entry point is triggered and applies
   * to the result set.
   *
   * @param {Summary}
   *            summary - Holds statistics regarding the execution of
   *            a map/reduce script
   * @since 2015.1
   */
  function summarize(summary) {

   try {
    summary.output.iterator().each(function (key, value) {
      var valueMap = JSON.parse(value);
      var subrecIds = valueMap.subrecIds;
      if (key == "Success") {
        var wocId = valueMap.wocId;
        var totalWOCQtyMap = updateHeaderRec(
          subrecIds[0].parentRec,
          valueMap.completedQty,
          valueMap.scrapQty,
          valueMap.oprtn,
          valueMap.wo
        );
        for (var id = 0; id < subrecIds.length; id++) {
          var fieldLookUp = search.lookupFields({
            type: "customrecord_cntm_client_app_asm_oper",
            id: subrecIds[id].parentRec,
            columns: [
              "custrecord_cntm_remaining_qty",
              "custrecord_cntm_completed_qty",
            ],
          });

          var remainingQty = fieldLookUp["custrecord_cntm_remaining_qty"];
          var completedQty = fieldLookUp["custrecord_cntm_completed_qty"];

          record.submitFields({
            type: "customrecord_cntm_asm_client_app",
            id: subrecIds[id].subrecId,
            values: {
              custrecord_cntm_sublst_woc: wocId,
              custrecord_cntm_sublst_status: 4,
            },
          });

          record.submitFields({
            type: "customrecord_cntm_client_app_asm_oper",
            id: subrecIds[id].parentRec,
            values: {
              custrecord_cntm_asm_woc_status: 4,
              custrecord_cntm_remaining_qty:
                id == 0 ? totalWOCQtyMap.remQty : remainingQty,
              custrecord_cntm_completed_qty:
                completedQty * 1 + totalWOCQtyMap.newQty * 1,
              custrecord_cntm_asm_cumm_scrap: totalWOCQtyMap.cumScrp,
              custrecord_cntm_asm_scrap_qty: totalWOCQtyMap.totalScrapForOp,
            },
          });
        }
        if (valueMap.isLastOp != true && valueMap.isSingleOp == false) {
          updateNextOp(
            valueMap.nextOp,
            valueMap.completedQty,
            subrecIds[subrecIds.length - 1].parentRec,
            totalWOCQtyMap.totalWOCQty,
            valueMap.wo,
            valueMap.scrapQty
          );
          if (valueMap.scrapQty) {
            updateScrapOnNextOp(
              valueMap.wo,
              valueMap.scrapQty,
              subrecIds[0].parentRec,
              valueMap.endingopdetails.id
            );
          }
        }
      } else {
        log.error("error while saving WOC", JSON.stringify(valueMap.errMsg));
        // release the used serail numbers in
        // case of error
        // if last operation
        for (var id = 0; id < subrecIds.length; id++) {
          record.submitFields({
            type: "customrecord_cntm_asm_client_app",
            id: subrecIds[id].subrecId,
            values: {
              custrecord_cntm_asm_woc_status: 5,
              custrecord_cntm_err_fld: valueMap.errMsg,
            },
          });
          record.submitFields({
            type: "customrecord_cntm_client_app_asm_oper",
            id: subrecIds[id].parentRec,
            values: {
              custrecord_cntm_asm_woc_status: 5,
            },
          });
        }
        if (valueMap.isLastOp == true || valueMap.isSingleOp == true) {
          var parsed_data = JSON.parse(valueMap.lastopdetails);
          for (var counter = 0; counter < parsed_data.length; counter++) {
            var result = parsed_data[counter];
            log.debug("result :" + result);
            var id = result["serialid"];

            var serialNum = result["serialName"];
            log.debug("id :" + id, "serialNum :" + serialNum);

            record.submitFields({
              type: "customrecord_cntm_asm_serial_ids",
              id: id,
              values: {
                custrecord_cntm_is_process: false,
              },
            });
          }
        }
        // scrapinfo is set to false if error in
        // saving WOC
        if (valueMap.scrapInfo) {
          var parseScrapInfo2 = JSON.parse(valueMap.scrapInfo);
          for (var i = 0; i < parseScrapInfo2.length; i++) {
            var individualScrapInfo = parseScrapInfo2[i];
            var id = individualScrapInfo["id"];
            var rsn = individualScrapInfo["scrapreason"];
            log.debug("id :" + id, "rsn :" + rsn);
            record.submitFields({
              type: "customrecord_cntm_asm_serial_ids",
              id: id,

              values: {
                custrecord_cntm_is_scrap: false,
                custrecord_cntm_asm_scrap_rsn: "",
              },
            });
          }
        }
      }
      return true;
    });
   } catch (error) {
    log.error('error in sum :',error)
   }



  }

  return {
    getInputData: getInputData,
    map: map,
    // reduce : reduce,
    summarize: summarize,
  };
});
