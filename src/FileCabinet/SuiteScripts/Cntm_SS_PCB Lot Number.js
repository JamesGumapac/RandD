/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
/**
 * Modified script for handling stock board condition on 02-05-2022
 */
define(["N/record", "N/runtime", "N/search", "N/task"], /**
 * @param {record}
 *            record
 * @param {runtime}
 *            runtime
 * @param {search}
 *            search
 */ function (record, runtime, search, task) {
  /**
   * Definition of the Scheduled script trigger point.
   *
   * @param {Object}
   *            scriptContext
   * @param {string}
   *            scriptContext.type - The context in which the script
   *            is executed. It is one of the values from the
   *            scriptContext.InvocationType enum.
   * @Since 2015.2
   */
  //   const woId;
  function execute(scriptContext) {
    try {
      log.audit("---START---");
      var woId = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_woid",
      });
      log.audit("woId : ", woId);

      var noOfPanels = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_panels",
      });
      log.audit("noOfPanels : ", noOfPanels);

      var bom = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_wo_bom",
      });
      log.audit("bom : ", bom);

      var isIssue = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_is_issue",
      });
      log.audit("isIssue : ", isIssue);

      // log.debug("woId: " + woId, "noOfPanels: " + noOfPanels);

      var isRework = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_is_rework",
      });
      log.audit("isRework : ", isRework);

      var item = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_fab_item",
      });
      log.audit("fab item :", item); //

      var pcbRec = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_pcb_rec",
      });
      log.debug("audit : ", pcbRec);

      if (noOfPanels != null && noOfPanels != undefined && noOfPanels != "") {
        if (isIssue == false) {
          setLotForSubWo(woId, noOfPanels, isIssue, pcbRec);

          var workorderSearchObj = search.create({
            type: "workorder",
            filters: [["internalid", "anyof", woId]],
            columns: [
              search.createColumn({
                name: "item",
                label: "Item",
              }),
              search.createColumn({
                name: "name",
                join: "bom",
                label: "Name",
              }),
              search.createColumn({
                name: "internalid",
                join: "bom",
                label: "Internal ID",
              }),
            ],
          });
          var searchResultCount = workorderSearchObj.runPaged().count;
          //   log.debug("workorderSearchObj result count", searchResultCount);
          workorderSearchObj.run().each(function (result) {
            // .run().each has a limit of 4,000 results
            bom = result.getValue({
              name: "internalid",
              join: "bom",
            });
            return true;
          });
          setLot(woId, item, noOfPanels, bom, isIssue);
        } else {
          try {
            setLotForSubWo(woId, noOfPanels, isIssue, pcbRec); //change here
            setLot(woId, item, noOfPanels, bom, isIssue, pcbRec);

            var checkTrue = record.submitFields({
              type: record.Type.WORK_ORDER,
              id: woId, //
              values: {
                custbody_cntm_ref_for_btn_hide: true,
                // custbody_cntm_cust_rec_on_lotrec_hide :true
              },
              options: {
                enableSourcing: false,
                ignoreMandatoryFields: true,
              },
            });
            // log.debug("CHECK TRUE", checkTrue);
          } catch (error) {
            log.debug("ERROR IN LOT CREATION", error);

            var errMsg = record.submitFields({
              type: record.Type.WORK_ORDER,
              id: woId, //
              values: {
                custbody_cntm_create_lot_error: error.message,
                custbody_cntm_hidden_prevent_dup_lot: false,
              },
              options: {
                enableSourcing: false,
                ignoreMandatoryFields: true,
              },
            });
            // log.debug("ERROR MSG", errMsg);
          }
        }
      } else if (isRework == true)
        try {
          setLot(woId, item, noOfPanels, bom, isIssue, pcbRec);

          var checkTrue = record.submitFields({
            type: record.Type.WORK_ORDER,
            id: woId, //
            values: {
              custbody_cntm_ref_for_btn_hide: true,
              // custbody_cntm_cust_rec_on_lotrec_hide :true
            },
            options: {
              enableSourcing: false,
              ignoreMandatoryFields: true,
            },
          });
          //   log.debug("CHECK TRUE", checkTrue);

          //setcheck box value..
          //custbody_cntm_ref_for_btn_hide
        } catch (error) {
          //field made value jayil

          //   log.debug("ERROR IN LOT CREATION", error);

          var errMsg = record.submitFields({
            type: record.Type.WORK_ORDER,
            id: woId, //
            values: {
              custbody_cntm_create_lot_error: error.message,
              custbody_cntm_hidden_prevent_dup_lot: false,
            },
            options: {
              enableSourcing: false,
              ignoreMandatoryFields: true,
            },
          });
          //   log.debug("ERROR MSG", errMsg);
        }
      // setLot(woId, item, noOfPanels, bom, isIssue, pcbRec);
      //Uncheck check box on WO
      uncheckValueOnWo(woId);

      log.audit("---END---");
    } catch (e) {
      log.error("error", e.message);
    }
  }
  function validateData(data) {
    if (data != undefined && data != null && data != "") {
      return true;
    } else {
      return false;
    }
  }

  function uncheckValueOnWo(woId) {
    try {
      log.debug("inside uncheckValueOnWo");
      var woLine = runtime.getCurrentScript().getParameter({
        name: "custscript_wo_line_no_remake",
      });
      log.debug("woLine : ", woLine);

      var woLookup = search.lookupFields({
        type: record.Type.WORK_ORDER,
        id: woId,
        columns: ["createdfrom"],
      });
      log.debug("--woLookup--", JSON.stringify(woLookup));

      if (validateData(woLine)) {
        if (isNotEmpty(woLookup) && woLookup) {
          var woObj = record.load({
            type: record.Type.WORK_ORDER,
            id: woLookup.createdfrom[0].value,
            isDynamic: true,
            // defaultValues: Object
          });

          woObj.selectLine({
            sublistId: "item",
            line: woLine,
          });

          woObj.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol_cntm_is_remake_wo",
            line: woLine,
            value: false,
          });

          woObj.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol_cntm_lot_for_remake",
            line: woLine,
            value: "",
          });
          woObj.commitLine({
            sublistId: "item",
          });
          log.debug("Commit");
          var id = woObj.save();
          log.audit("id : ", id);
        }
      }

      // if(woLookup.createdfrom.length > 0){

      //   var createdfrom = woLookup.createdfrom[0].value;

      //   var singleLine = woLine.split(',');
      //   // var singleLine = woLine.split(',');
      //   log.debug('singleLine :',singleLine);

      //   var woObj = record.load({
      //     type: record.Type.WORK_ORDER,
      //     id: createdfrom,
      //     isDynamic: true,
      //     // defaultValues: Object
      //   });
      //   for (var index = 0; index < singleLine.length; index++) {

      //     woObj.selectLine({
      //       sublistId: "item",
      //       line: singleLine[index],
      //     });

      //     woObj.setCurrentSublistValue({
      //       sublistId: "item",
      //       fieldId: "custcol_cntm_is_remake_wo",
      //       line:  singleLine[index],
      //       value: false,
      //     });
      //     woObj.commitLine({
      //       sublistId: "item",
      //     });
      //     log.debug('Commit')

      //   }

      //   // log.audit('value Setted ')
      //   var id = woObj.save();
      //   log.audit('id : ',id)
      // }
    } catch (error) {
      log.error("Error in uncheck value :", error);
    }
  }
  function setLotForSubWo(woId, noOfPanels, isIssue, pcbRec) {
    log.audit("---setLotForSubWo :-woId---", woId);
    var workorderSearchObj = search.create({
      type: "workorder",
      filters: [
        ["type", "anyof", "WorkOrd"],
        "AND",
        ["mainline", "is", "T"],
        "AND",
        [
          ["createdfrom", "anyof", woId],
          "OR",
          ["custbody_cntm_last_wo_id", "anyof", woId],
        ],
      ],
      columns: [
        search.createColumn({
          name: "item",
          label: "Item",
        }),
        search.createColumn({
          name: "name",
          join: "bom",
          label: "Name",
        }),
        search.createColumn({
          name: "internalid",
          join: "bom",
          label: "Internal ID",
        }),
      ],
    });
    var searchResultCount = workorderSearchObj.runPaged().count;
    // log.debug("workorderSearchObj result count", searchResultCount);
    workorderSearchObj.run().each(function (result) {
      // .run().each has a limit of 4,000 results
      setLotForSubWo(result.id, noOfPanels, isIssue, pcbRec);
      var subAsm = result.getValue({
        name: "item",
      });
      var subBOM = result.getValue({
        name: "internalid",
        join: "bom",
      });
      //   log.debug("subWOId: " + result.id, "subAsm: " + subAsm);
      setLot(result.id, subAsm, noOfPanels, subBOM, isIssue, pcbRec);
      if (isIssue == true)
        var checkTrue = record.submitFields({
          type: record.Type.WORK_ORDER,
          id: result.id, //
          values: {
            custbody_cntm_ref_for_btn_hide: true,
            // custbody_cntm_cust_rec_on_lotrec_hide :true
          },
          options: {
            enableSourcing: false,
            ignoreMandatoryFields: true,
          },
        });
      return true;
    });
  }

  function setLot(woId, item, noOfPanels, bom, isIssue, pcbRec) {
    if (isIssue == false) {
      var WOLotRec = record.create({
        type: "customrecord_cntm_pcb_wo_suitelet_data",
        isDynamic: true,
      });
      WOLotRec.setValue({
        fieldId: "custrecord_cntm_wo",
        value: woId,
      });
      var woLookup = search.lookupFields({
        type: record.Type.WORK_ORDER,
        id: woId,
        columns: ["createdfrom", "custbody_cntm_last_wo_id"],
      });

      log.debug("--woLookup", JSON.stringify(woLookup));
      if (
        (woLookup.createdfrom
          ? woLookup.createdfrom.length == 0
            ? true
            : false
          : true) &&
        woLookup.custbody_cntm_last_wo_id
      ) {
        if (woLookup.custbody_cntm_last_wo_id[0])
          WOLotRec.setValue({
            fieldId: "custrecord_cntm_crtd_frm",
            value: woLookup.custbody_cntm_last_wo_id[0].value,
          });
      }
      WOLotRec.setValue({
        fieldId: "custrecord_cntm_bom_rec",
        value: bom,
      });

      WOLotRec.setValue({
        fieldId: "custrecord_cntm_combined_error_file",
        value: pcbRec,
      });
      var lotRecId = WOLotRec.save({
        ignoreMandatoryFields: true,
      });
      log.debug("lotRecId setlot ", lotRecId);
    } else {
      var isRework = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_is_rework",
      });
      log.debug("isRework :", isRework);

      var changeLotOnWO = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_change_lot_wo",
      });
      log.audit("changeLotOnWO :", changeLotOnWO);
      //changes for reflecting no of panels on WO
      // var changeLotOnWO = false;

      if (isRework == false) {
        // isFromCompletion is used in another purpose
        // var isFromCompletion = runtime.getCurrentScript().getParameter({
        //   name: "custscript_cntm_lot_from_completion",
        // });
        var itemRec = record.load({
          type: "lotnumberedassemblyitem",
          id: item,
        });
        var itemFieldLookUp = search.lookupFields({
          type: "item",
          id: item,
          columns: ["custitem_cnt_next_lot_no"],
        });
        var nextLotNo = itemFieldLookUp.custitem_cnt_next_lot_no;
        // log.debug(
        //   nextLotNo +
        //     " " +
        //     itemRec.getValue({ fieldId: "custitem_cnt_next_lot_no" }),
        //   "noOfPanels: " + parseInt(noOfPanels)
        // );

        if (!nextLotNo) nextLotNo = 1;
        // if (isFromCompletion) {
        //   //createLot(woId, item, nextLotNo, noOfPanels, isFromCompletion);
        //   //nextLotNo++;
        // } else
        if (noOfPanels) {
          //Seach , filter - created from - wo,  result lot rec miltitl
          ///Array
          var isFromCompletion = [];
          var lotRecord;
          var customrecord_cntm_lot_creationSearchObj = search.create({
            type: "customrecord_cntm_lot_creation",
            filters: [
              ["custrecord_cntm_lot_wonum.createdfrom", "anyof", woId],
              "OR",
              [
                "custrecord_cntm_lot_wonum.custbody_cntm_last_wo_id",
                "anyof",
                woId,
              ],
            ],
            columns: [
              search.createColumn({
                name: "scriptid",
                sort: search.Sort.ASC,
                label: "Script ID",
              }),
              search.createColumn({
                name: "custrecord_cntm_lot_wonum",
                label: "WO#",
              }),
              search.createColumn({
                name: "custrecord_cntm_lot_wo_completion",
                label: "WO Completion ",
              }),
              search.createColumn({
                name: "custrecord_cntm_lot_assembly_item",
                label: "Assembly Item ",
              }),
              search.createColumn({
                name: "custrecord_cntm_lot_lotnumber",
                label: "LOT#",
              }),
              search.createColumn({
                name: "custrecord_cntm_wo_details_fab",
                label: "Parent",
              }),
            ],
          });
          var searchResultCount = customrecord_cntm_lot_creationSearchObj.runPaged()
            .count;
          log.debug(
            "customrecord_cntm_lot_creationSearchObj result count",
            searchResultCount
          );

          if (searchResultCount > 0) {
            customrecord_cntm_lot_creationSearchObj
              .run()
              .each(function (result) {
                // .run().each has a limit of 4,000 results
                // lotRecord = result.getValue({name: "custrecord_cntm_lot_lotnumber", label: "LOT#"});
                lotRecord = result.id;
                if (lotRecord) {
                  isFromCompletion.push(lotRecord);
                }
                return true;
              });
          }
          log.debug(
            "isFromCompletion Array :" + isFromCompletion + "woId :",
            woId
          );
          //   log.debug("isFromCompletion Array type:", typeof isFromCompletion);

          var lotArray = [];
          lotArray = getLotArray(woId);
          log.audit("lotArray ;", lotArray);
          if (!(lotArray.length >= noOfPanels)) {
            for (var i = 0; i < parseInt(noOfPanels); i++) {
              //hereeee....
              // log.debug(" isFromCompletion[i] :", isFromCompletion[i]);
              createLot(woId, item, nextLotNo, noOfPanels, isFromCompletion[i]);
              /*
               * var scriptTask = task.create({ taskType :
               * task.TaskType.SCHEDULED_SCRIPT });
               * scriptTask.scriptId =
               * 'customscript_cntm_ss_clntapp_hdr_detls'; //
               * scriptTask.deploymentId = //
               * 'customdeploy_cntm_ss_clntapp_hdr_detls';
               * scriptTask.params = { custscript_cntm_wo :
               * woId, custscript_cntm_lotno : nextLotNo,
               * custscript_cntm_lot_recid : lotRecId,
               * custscript_cntm_num_of_panels : noOfPanels,
               * custscript_cntm_is_compltn_proces : 'F' };
               *
               * var scriptTaskId = scriptTask.submit(); var
               * status =
               * task.checkStatus(scriptTaskId).status;
               * log.debug(scriptTaskId);
               */
              nextLotNo++;
            }
          }
          //In case user selected different lot for remake then that lot should appear on header of WO
          if (changeLotOnWO == true) {
            record.submitFields({
              type: record.Type.WORK_ORDER,
              id: woId, //
              values: {
                custbody_cntm_no_of_panel: noOfPanels,
                // custbody_cntm_cust_rec_on_lotrec_hide :true
              },
              options: {
                enableSourcing: false,
                ignoreMandatoryFields: true,
              },
            });
          }
        }
        log.debug("nextLotNo", nextLotNo);

        var idToCheck = record.submitFields({
          //
          type: "lotnumberedassemblyitem",
          id: item,
          values: {
            custitem_cnt_next_lot_no: nextLotNo,
          },
          options: {
            enableSourcing: false,
            ignoreMandatoryFields: true,
          },
        });
        log.debug("NEXT LOT SETTED :", idToCheck);
      } else {
        // log.debug('__6__');
        log.audit("INSIDE");
        var stokBoardLot = runtime.getCurrentScript().getParameter({
          name: "custscript_cntm_lot_stock_boards",
        });
        log.audit("Stock Board lot:", stokBoardLot);

        var stockBoardArray = stokBoardLot.split(",");
        log.audit("stockBoardArray :", stockBoardArray);

        var woLookup = search.lookupFields({
          type: record.Type.WORK_ORDER,
          id: woId,
          columns: ["quantity", "custbody_rda_boards_per_panel"],
        });
        log.debug("woLookup :", woLookup);

        var lotQty = woLookup.quantity / stockBoardArray.length;

        for (var index = 0; index < stockBoardArray.length; index++) {
          var WOLotRec = record.create({
            type: "customrecord_cntm_lot_creation",
            isDynamic: true,
          });
          WOLotRec.setValue({
            fieldId: "custrecord_cntm_lot_wonum",
            value: woId,
          });
          WOLotRec.setValue({
            fieldId: "custrecord_cntm_brds_per_panel",
            value: woLookup.custbody_rda_boards_per_panel,
          });
          WOLotRec.setValue({
            fieldId: "custrecord_cntm_lot_assembly_item",
            value: item,
          });
          WOLotRec.setValue({
            fieldId: "custrecord_cntm_lot_lotnumber",
            value: stockBoardArray[index],
          });
          log.debug("stockBoardArray[index] :", stockBoardArray[index]);
          WOLotRec.setValue({
            fieldId: "custrecord_cntm_stock_lot_qty",
            value: lotQty,
          });
          WOLotRec.setValue({
            fieldId: "custrecord_cntm_num_of_panels",
            value: noOfPanels,
          });
          var lotRecId = WOLotRec.save({
            ignoreMandatoryFields: true,
          });
          log.audit("New lotRecId :", lotRecId);
        }
      } //else
    }
  }

  function createLot(woId, item, nextLotNo, noOfPanels, isFromCompletion) {
    log.audit("---INSIDE CREATE LOT FUNCTION---");
    // log.audit("isFromCompletion :", isFromCompletion);
    var changeLotOnWO = true;
    //count
    var WOLotRec = record.create({
      type: "customrecord_cntm_lot_creation",
      isDynamic: true,
    });
    WOLotRec.setValue({
      fieldId: "custrecord_cntm_lot_wonum",
      value: woId,
    });
    WOLotRec.setValue({
      fieldId: "custrecord_cntm_lot_assembly_item",
      value: item,
    });
    WOLotRec.setValue({
      fieldId: "custrecord_cntm_lot_lotnumber",
      value: nextLotNo,
    });
    WOLotRec.setValue({
      fieldId: "custrecord_cntm_num_of_panels",
      value: noOfPanels,
    });
    var woFieldLookUp = search.lookupFields({
      type: "workorder",
      id: woId,
      columns: ["custbody_rda_boards_per_panel"],
    });
    var boardsPerPanel = woFieldLookUp.custbody_rda_boards_per_panel;
    WOLotRec.setValue({
      fieldId: "custrecord_cntm_brds_per_panel",
      value: boardsPerPanel,
    });
    if (isFromCompletion) {
      log.debug("INSIDE isFromCompletion");
      WOLotRec.setValue({
        fieldId: "custrecord_cntm_prev_lot_rec",
        value: parseInt(isFromCompletion), // lot Record id
        // value : '28'
      });

      var cumScrap = WOLotRec.getValue({
        fieldId: "custrecord_cntm_previous_scrap",
      });

      var cumScrapQty = WOLotRec.getValue({
        fieldId: "custrecord_cntm_cumulative_scrap_qty",
      });
      //   log.debug("My cumScrapQty :", cumScrapQty); //

      //changes - Vishal
      if (cumScrap == "" || cumScrap == null || cumScrap == undefined) {
        cumScrap = 0;
      }
      if (
        cumScrapQty == "" ||
        cumScrapQty == null ||
        cumScrapQty == undefined
      ) {
        cumScrapQty = 0;
      }

      // WOLotRec.setValue({
      //     fieldId: 'custrecord_cntm_cumulative_scrap_qty',
      //     value: parseInt(cumScrap) + parseInt(cumScrapQty)
      // });

      /**
                            *                 
                           var cumScrap = WOLotRec.getValue({
                               fieldId: 'custrecord_cntm_previous_scrap'
                           });
                           log.debug('My cumScrap Prevoius:', cumScrap); //Previous
           
                           var cumScrapQty = WOLotRec.getValue({
                               fieldId: 'custrecord_cntm_cumulative_scrap_qty'
                           });
                           log.debug('My cumScrapQty :', cumScrapQty); //
           
                           if (cumScrap) {
           
                           }
                           WOLotRec.setValue({
                               fieldId: 'custrecord_cntm_cumulative_scrap_qty',
                               value: cumScrap
                           });
                            */
    } else {
      //Code
      //Search (woId) - child
      //child che lot
      //current rec chya previous lot
    }
    var lotRecId = WOLotRec.save({
      ignoreMandatoryFields: true,
    });

    log.audit("lotRecId end ", lotRecId);
  }
  function getLotArray(wo) {
    var templotRecIdArray = [];
    var customrecord_cntm_lot_creationSearchObj = search.create({
      type: "customrecord_cntm_lot_creation",
      filters: [["custrecord_cntm_lot_wonum", "anyof", wo]],
      columns: [
        search.createColumn({
          name: "custrecord_cntm_lot_lotnumber",
          label: "LOT#",
        }),
        search.createColumn({
          name: "internalid",
          label: "Internal ID",
        }),
      ],
    });
    var lotsearchResultCount = customrecord_cntm_lot_creationSearchObj.runPaged()
      .count;
    // log.debug(
    // "customrecord_cntm_lot_creationSearchObj result count",
    // lotsearchResultCount
    // );
    customrecord_cntm_lot_creationSearchObj.run().each(function (result) {
      // .run().each has a limit of 4,000 results
      templotRecIdArray.push(
        result.getValue({
          name: "internalid",
          label: "Internal ID",
        })
      );

      /**
           *  templotRecIdArray.push(
            result.getValue({
              name: "custrecord_cntm_lot_lotnumber",
              label: "LOT#",
            })
          );
           */

      return true;
    });

    return templotRecIdArray;
  }
  function isNotEmpty(obj) {
    return obj && JSON.stringify(obj) != "{}";
  }

  return {
    execute: execute,
  };
});
