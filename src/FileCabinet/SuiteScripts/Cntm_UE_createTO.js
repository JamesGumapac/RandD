/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
/**
 * Script for update an inventory details Form item receipt to work order
 */
define(["N/record", "N/ui/serverWidget", "N/search"], function (
  record,
  serverWidget,
  search
) {
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
  //TRY to set inventory details on TO
  function beforeLoad(context) {
    log.debug("Before load");
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
  function beforeSubmit(context) {}

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
    log.debug("----START----");
    // log.debug('aftersubmit :',scriptContext);
    if (
      scriptContext.type === scriptContext.UserEventType.CREATE ||
      scriptContext.type === scriptContext.UserEventType.EDIT
    ) {
      try {
        // (I)
        var SublistItemArray = [];
        var TODetailMap = {};
        var ids1 = [];
  //      log.debug("after Submit");
        var currentRec = scriptContext.newRecord;
        var wo = currentRec.getValue({
          fieldId: "createdfrom",
        });
        log.debug("wo :", wo);

       
        var exceptLot = currentRec.getText({
          fieldId: "custbody_cntm_lot_recid",
        });
        log.debug("exceptLot :", exceptLot);

        var islastOperationCheck = currentRec.getValue({
          fieldId: "custbody_cntm_last_op_check",
        });
  //      log.debug("islastOperationCheck :", islastOperationCheck);

        var upperWoId = currentRec.getValue({
          fieldId: "custbody_cntm_last_wo_id",
        });
  //      log.debug("upperWoId :", upperWoId);
        
            var exceptLotArray1 = [];
            exceptLotArray1 = getLotArray(wo, exceptLot);
            log.debug('TEMP Except lot arr :',exceptLotArray1)

            var searchResultcount1 = getSearchResult(wo, exceptLotArray1);
            log.debug('TEMP searchResultcount1 :',searchResultcount1)

        if (islastOperationCheck == true || islastOperationCheck == "T") {
          // (II) trying to load WO

          var woLoad = record.load({
            type: record.Type.WORK_ORDER,
            id: wo,
          });

          var itemOnUpperWO = woLoad.getValue({
            fieldId: "custbody_cntm_wo_ref_for_to",
          });
         // log.debug("itemOnUpperWO :", itemOnUpperWO);

          var createToCheck = woLoad.getValue({
            fieldId: "custbody_cntm_check_create_to",
          }); // check BOX
       //   log.debug("createToCheck :", createToCheck);

          if (itemOnUpperWO && createToCheck) {
            //ONLY IF
            // create to check and item present on WO then only
            // following code will executed
            itemOnUpperWO = convertNameIntoId(itemOnUpperWO); // Item
            // internal
            // Id
      //      log.debug("itemOnUpperWO 1:", itemOnUpperWO);

            var isMloWo = woLoad.getValue({
              fieldId: "custbody_cntm_mlo",
            });
            var so = woLoad.getValue({
              fieldId: "custbody_cnt_created_fm_so",
            }); // SO id on WO
     //       log.debug("so :", so);
            var assemblyItem = woLoad.getValue({
              fieldId: "assemblyitem",
            });
            TODetailMap["assemblyItem"] = assemblyItem;

            var subsidiary = woLoad.getValue({
              fieldId: "subsidiary",
            });
            TODetailMap["subsidiary"] = subsidiary;

            /**
             * Qty = goodBoards/no of panels
             */
            var goodBoards = woLoad.getValue({
              fieldId: "quantity",
            });
            TODetailMap["goodBoards"] = goodBoards;

            var noOfpanel = woLoad.getValue({
              fieldId: "custbody_cntm_no_of_panel",
            });
            var buildQty = goodBoards / noOfpanel;
            TODetailMap["buildQty"] = buildQty;

            var fromLocation = woLoad.getValue({
              fieldId: "location",
            });
            TODetailMap["fromLocation"] = fromLocation;

            var upperWoFieldLookUp = search.lookupFields({
              type: "workorder",
              id: upperWoId,
              columns: ["location"],
            });

            var toLocation = upperWoFieldLookUp.location[0].value;
            TODetailMap["toLocation"] = toLocation;
            log.debug("TODetailMap :", JSON.stringify(TODetailMap));

            // TODO: Check Condition
            var exceptLotArray = [];
            exceptLotArray = getLotArray(wo, exceptLot);

            var searchResultcount = getSearchResult(wo, exceptLotArray);
            log.debug('SEARCH RESULT COUNT :',searchResultcount);
            if (searchResultcount == 0) {
              // CREATE MAP
              var inventoryLot = getLotArrayForInvDetail(wo);
         //     log.debug("inventoryLot :", inventoryLot);

              var sublistItemObj = {};
              var tempItemArray = [];
              sublistItemObj["assemblyItem"] = assemblyItem;
              for (var index = 0; index < inventoryLot.length; index++) {
                var tempItemObj = {};
                tempItemObj["serialNumber"] = inventoryLot[index];
                tempItemObj["quantity"] = buildQty;
                tempItemArray.push(tempItemObj);
              }
              sublistItemObj["inventory"] = tempItemArray;
              SublistItemArray.push(sublistItemObj);
         //     log.debug("SublistItemArray :", JSON.stringify(SublistItemArray));

              // CREATING TRANSFER ORDER
              var ToId = createTo(TODetailMap, wo, upperWoId, SublistItemArray);
              log.debug("ToId :", ToId);

              // CREATING ITEM FULLFILMENT
              if (validateData(ToId)) {
                // setting TO id on lower level WO
                record.submitFields({
                  type: record.Type.WORK_ORDER,
                  id: wo,
                  values: {
                    custbody_cntm_transfer_order_id: ToId,
                  },
                }); //ORR
                log.debug("SETIN SUBMIT FILEDS");

                var itemFullfillmentId = itemFullfillment(ToId);
                log.debug("itemFullfillmentId :", itemFullfillmentId);
              }

              // // CREATING ITEM RECEIPT
              if (validateData(itemFullfillmentId)) {
                //Creating ITEM RECEIPT
                var itemReceiptId = createItemReceipt(ToId);
                log.debug("itemReceiptId :", itemReceiptId);
                // //SETTING INVENTORY DETAILS ON WO
                setInventoryDetailOnWO(upperWoId, SublistItemArray, ToId); // can set to id here //Setting TO id on upper level WO
              }
            }
          }
        }
      } catch (e) {
        log.error("Error :", e);
      }
    }

    log.debug("----ENDDD----");
  }
  function findLastWO(id, so, item) {
//    log.debug("INSIDE FUNCTION");
//    log.debug("id :", id);
//    log.debug("so :", so);
 //   log.debug("item :", item);

    var workorderSearchObj = search.create({
      type: "workorder",
      filters: [
        ["type", "anyof", "WorkOrd"],
        "AND",
        ["custbody_cnt_created_fm_so", "anyof", so],
        "AND",
        ["mainline", "is", "T"],
        "AND",
        ["createdfrom", "anyof", id],
      ],
      columns: ["internalid", "item"],
    });
    var searchResultCount = workorderSearchObj.runPaged().count;
  //  log.debug("workorderSearchObj result count", searchResultCount);
    var ids = [];
    var WOID;
    if (searchResultCount > 0) {
      workorderSearchObj.run().each(function (result) {
        // .run().each has a limit of 4,000 results
        log.debug("item :", result.getValue({ name: "item" }));
        if (result.getValue({ name: "item" }) == item) {
          WOID = result.id;
    //      log.debug("WOID FALSE :", WOID);
          return false;
        }
        ids.push(result.id);
  //      log.debug(" ids :", ids);
        return true;
      });
      if (!WOID) WOID = findLastWO(ids, so, item);
      // log.debug("CALLED FUNCTION INSIDE", WOID);
      // log.debug("OUTSIDE", WOID);
      return WOID;
    }
  }
  function setInventoryDetailOnWO(WoId, SublistInvDetails, ToId) {
    try {
      var upperWOObj = record.load({
        type: record.Type.WORK_ORDER,
        id: WoId,
        isDynamic: true,
      });

      //Setting TO id on upper level WO
      upperWOObj.setValue({
        fieldId: "custbody_cntm_transfer_order_id",
        value: ToId,
      });

      var itemLinesOnWo = upperWOObj.getLineCount({
        sublistId: "item",
      });

      for (var woLine = 0; woLine < itemLinesOnWo; woLine++) {
        //Item Rec Line items
        upperWOObj.selectLine({
          sublistId: "item",
          line: woLine,
        });
        var sublistItem = upperWOObj.getSublistValue({
          sublistId: "item",
          fieldId: "item",
          line: woLine,
        });
    //    log.debug("sublistItem :", sublistItem);

        if (sublistItem == SublistInvDetails[0].assemblyItem) {
          var inventorywoDetailSubrecord =
            upperWOObj.getCurrentSublistSubrecord({
              sublistId: "item",
              fieldId: "inventorydetail",
              // line: line,
            });

          var serialLines = inventorywoDetailSubrecord.getLineCount({
            sublistId: "inventoryassignment",
          });
   //       log.debug("serialLines :", serialLines);
          if (serialLines > 0) {
  ///          log.debug("REMOVE LINE");
            for (
              var lineIndex = serialLines.length - 1;
              lineIndex >= 0;
              lineIndex--
            ) {
              invItemSubRec.removeLine({
                sublistId: "inventoryassignment",
                line: lineIndex,
                ignoreRecalc: true,
              });
            }
          } else {
            var key = SublistInvDetails[0].inventory;
   //         log.debug("KEY :", key);
            for (var iterator = 0; iterator < key.length; iterator++) {
              inventorywoDetailSubrecord.selectNewLine({
                sublistId: "inventoryassignment",
              });
              inventorywoDetailSubrecord.setCurrentSublistText({
                sublistId: "inventoryassignment",
                fieldId: "receiptinventorynumber",
                text: key[iterator].serialNumber,
              });
    //          log.debug("1", key[iterator].serialNumber);

              inventorywoDetailSubrecord.setCurrentSublistValue({
                sublistId: "inventoryassignment",
                fieldId: "quantity",
                value: key[iterator].quantity,
              });
  //            log.debug("2", key[iterator].quantity);
              inventorywoDetailSubrecord.commitLine({
                sublistId: "inventoryassignment",
              });
              log.debug("Inventory commit");
            } // inv details for
          } // serial line else

          upperWOObj.commitLine({
            sublistId: "item",
          });
          log.debug("ITEM COMMITED");
        }
      }
      var savedWOId = upperWOObj.save();
      log.debug("savedWOId", savedWOId);
    } catch (error) {
      log.error("ERROR IN SETINVENTORY", error);
    }
  }

  function createItemReceipt(Id) {
    var irId;
    var itemReceiptObj = record.transform({
      fromType: record.Type.TRANSFER_ORDER,
      fromId: Id,
      toType: record.Type.ITEM_RECEIPT,
      isDynamic: true,
    });

    irId = itemReceiptObj.save();
    return irId;
  }

  function itemFullfillment(ToId) {
    try {
      var fullfilmmentId;
      var itemFullfillmentObj = record.transform({
        fromType: record.Type.TRANSFER_ORDER,
        fromId: ToId,
        toType: record.Type.ITEM_FULFILLMENT,
        isDynamic: true,
      });

      var fullfilmmentId = itemFullfillmentObj.save();
      return fullfilmmentId;
    } catch (error) {
      // try end
      log.error("ERROR In itemFullfillment:", error);
    }
  }

  function createTo(toDetailsmap, wo, upperWoId, SublistItemArrayfun) {
    try {
      var tranId;

      var to_record = record.create({
        type: "transferorder",
        isDynamic: true,
      });
      to_record.setValue({
        fieldId: "subsidiary",
        value: toDetailsmap.subsidiary,
      });
      to_record.setValue({
        fieldId: "location",
        value: toDetailsmap.fromLocation,
      });
      to_record.setValue({
        fieldId: "transferlocation",
        value: toDetailsmap.toLocation,
      });
      to_record.setValue({
        fieldId: "incoterm",
        value: 1,//In SB1 it is 2 but in SB2 it is 1 
      }); // INCOTERM = DAP
      //Set to location wo id in field
      to_record.setValue({
        fieldId: "custbody_cntm_wo_id",
        value: upperWoId,
      }); // To used for seting inv details on WO

      //Set from location wo id in field
      to_record.setValue({
        fieldId: "custbody_cntm_wo_id_to_from_loc",
        value: wo,
      });

      var itemLineCount = to_record.getLineCount({
        sublistId: "item",
      });
      log.debug({
        title: "itemLineCount",
        details: itemLineCount,
      });

      // if (itemLineCount > 0) {
      // for (var line = 0; line < itemLineCount; line++) {
      to_record.selectNewLine({
        sublistId: "item",
        // line: line,
      });

      to_record.setCurrentSublistValue({
        sublistId: "item",
        fieldId: "item",
        value: toDetailsmap.assemblyItem,
      });
      to_record.setCurrentSublistValue({
        sublistId: "item",
        fieldId: "quantity",
        value: toDetailsmap.goodBoards,
      });
      // log.debug("itemOnItemFullfillment :", itemOnItemFullfillment);
      //   if (itemOnItemFullfillment == SublistItemArrayfun[0].assemblyItem) {
      log.debug("1");
      var inventorywoDetailSubrecord = to_record.getCurrentSublistSubrecord({
        sublistId: "item",
        fieldId: "inventorydetail",
        // line: line,
      });

      var serialLines = inventorywoDetailSubrecord.getLineCount({
        sublistId: "inventoryassignment",
      });
      log.debug("serialLines :", serialLines);
      if (serialLines > 0) {
        log.debug("REMOVE LINE");
        for (
          var lineIndex = serialLines.length - 1;
          lineIndex >= 0;
          lineIndex--
        ) {
          invItemSubRec.removeLine({
            sublistId: "inventoryassignment",
            line: lineIndex,
            ignoreRecalc: true,
          });
        }
      } else {
        var key = SublistItemArrayfun[0].inventory;
 //       log.debug("KEY :", key);
        for (var iterator = 0; iterator < key.length; iterator++) {
          inventorywoDetailSubrecord.selectNewLine({
            sublistId: "inventoryassignment",
          });
          inventorywoDetailSubrecord.setCurrentSublistText({
            sublistId: "inventoryassignment",
            fieldId: "receiptinventorynumber",
            text: key[iterator].serialNumber,
          });
   //       log.debug("1", key[iterator].serialNumber);

          inventorywoDetailSubrecord.setCurrentSublistValue({
            sublistId: "inventoryassignment",
            fieldId: "quantity",
            value: key[iterator].quantity,
          });
     //     log.debug("2", key[iterator].quantity);
          inventorywoDetailSubrecord.commitLine({
            sublistId: "inventoryassignment",
          });
       //   log.debug("Inventory commit");
        } // inv details for
      } // serial line else
      //   } // end hasInventoryDetailSubrecord
      to_record.commitLine({
        sublistId: "item",
      });
      // } // FOR end
      // }
      // log.debug("Item commit");
      tranId = to_record.save();
      // log.debug("SAVED", tranId);

      return tranId;
    } catch (error) {
      log.error("ERROR IN TO CREATION :", error);
      record.submitFields({
        type: record.Type.WORK_ORDER,
        id: wo,
        values: {
          custbody_cntm_error_in_transferorder: error.message,
        },
      });
    }
  }
  function validateData(data) {
    if (data != undefined && data != null && data != "") {
      return true;
    } else {
      return false;
    }
  }
  // function getLotArray(wo) {
  function getLotArray(wo, exceptLot) {
    var templotRecIdArray = [];
    var customrecord_cntm_lot_creationSearchObj = search.create({
      type: "customrecord_cntm_lot_creation",
      filters: [
        ["custrecord_cntm_lot_wonum", "anyof", wo], // pass
        // wo
        // id
        "AND",
        ["internalid", "noneof", exceptLot],
      ],
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
    var lotsearchResultCount =
      customrecord_cntm_lot_creationSearchObj.runPaged().count;
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
      return true;
    });

    return templotRecIdArray;
  }
  function getLotArrayForInvDetail(wo) {
    var templotRecIdArray = [];
    var customrecord_cntm_lot_creationSearchObj = search.create({
      type: "customrecord_cntm_lot_creation",
      filters: [
        ["custrecord_cntm_lot_wonum", "anyof", wo], // pass
        // wo
        // id
        // "AND",
        // ["internalid", "noneof", exceptLot],
      ],
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
    var lotsearchResultCount =
      customrecord_cntm_lot_creationSearchObj.runPaged().count;

    customrecord_cntm_lot_creationSearchObj.run().each(function (result) {
      // .run().each has a limit of 4,000 results
      templotRecIdArray.push(
        result.getValue({
          name: "custrecord_cntm_lot_lotnumber",
          label: "LOT#",
        })
      );
      return true;
    });

    return templotRecIdArray;
  }

  function getSearchResult(wo, lotRecIdArray) {
    // Search on sublist opration -Client App Sublist Op new
    var customrecord_cntm_clientappsublistSearchObj = search.create({
      type: "customrecord_cntm_clientappsublist",
      filters: [
        ["custrecord_cntm_work_order", "anyof", wo],
        "AND",
        ["custrecord_cntm_last_operation", "is", "T"],
        "AND",
        ["custrecord_cntm_lot_record", "anyof", lotRecIdArray],
        "AND",
        ["custrecord_cntm_cso_status", "noneof", "4"],
      ],

      columns: [
        search.createColumn({
          name: "internalid",
          label: "Internal ID",
        }),
      ],
    });
    var searchResultCount =
      customrecord_cntm_clientappsublistSearchObj.runPaged().count;
    // log.debug("searchResultCount ", searchResultCount);
    return searchResultCount;
  }

  function convertNameIntoId(itemName) {
    // Item Search to get item internal ID
    var itemId;

    var assemblyitemSearchObj = search.create({
      type: "assemblyitem",
      filters: [["type", "anyof", "Assembly"], "AND", ["name", "is", itemName]],
      columns: [
        search.createColumn({
          name: "internalid",
          label: "Internal ID",
        }),
        search.createColumn({
          name: "displayname",
          label: "Display Name",
        }),
      ],
    });
    var searchResultCount = assemblyitemSearchObj.runPaged().count;
//    log.debug("assemblyitemSearchObj result count", searchResultCount);
    assemblyitemSearchObj.run().each(function (result) {
      // .run().each has a limit of 4,000 results
      itemId = result.getValue({
        name: "internalid",
        label: "Internal ID",
      });
      return false;
    });
    return itemId;
  }

  function getUpperWOid(item, soId) {
    // TO search for getting WO ID
    var woID;
    // log.debug("INSIDE FUNCTION getUpperWOid");
    // log.debug("item :", item);
    // log.debug("soId :", soId);
    var workorderSearchObj = search.create({
      type: "workorder",
      filters: [
        ["type", "anyof", "WorkOrd"],
        "AND",
        ["item", "anyof", item],
        "AND",
        ["custbody_cnt_created_fm_so", "anyof", soId],
        "AND",
        ["mainline", "is", "T"],
      ],
      columns: [
        search.createColumn({
          name: "internalid",
          label: "Internal ID",
        }),
      ],
    });
    var searchResultCount = workorderSearchObj.runPaged().count;
  //  log.debug("workorderSearchObj result count", searchResultCount);
    workorderSearchObj.run().each(function (result) {
      // .run().each has a limit of 4,000 results
      woID = result.id;
      return false;
    });

    return woID;
  }
  return {
    beforeLoad: beforeLoad,
    // beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit,
  };
});
