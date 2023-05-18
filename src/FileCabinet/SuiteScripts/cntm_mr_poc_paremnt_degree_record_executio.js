/**
 * @NApiVersion  2.1
 * @NScriptType  MapReduceScript
 * @NModuleScope SameAccount
 * @author       Shweta Badagu
 * Sr. No   	 Date           	  Author                  	Remarks
 *@description   Edit and save the child record sublist of client APP
 * Sr. No   	 Date           	  Author                  	Remarks
 * 1		  18 Jan 2022 		   Shweta Badagu    	 -   Edit and Save the child record
 * 2           09 March 2022      Vishal Naphade         -   Last operation and top WO 
 */
define(["N/search", "N/record", "N/runtime"], function (
    search,
    record,
    runtime
  ) {
    function getInputData() {
      try {
        var filters = runtime
          .getCurrentScript()
          .getParameter({ name: "custscript_clientapp_parent_parameter" });
        var jsonData = JSON.parse(filters);
        var recArray = [];
        log.debug("Map/Reduced jsonData", jsonData);
  
        for (var i = 0; i < jsonData.length; i++) {
          var childrecIds = jsonData[i].childid;
          log.debug("recIds=", childrecIds);
          recArray.push(childrecIds);
        }
        log.debug("recArray=", JSON.stringify(recArray));
        return recArray;
      } catch (e) {
        log.error("Error in getInputData", e);
      }
    }
  
    function map(context) {
      try {
        var recId = JSON.parse(context.value); //read the data
        log.debug("recId", recId);
  
        var clientSubRecLookUp = search.lookupFields({
          type: "customrecord_cntm_clientappsublist",
          id: recId,
          columns: [
            "custrecord_cntm_cso_pannellot",
            "custrecord_cntm_cso_parentrec",
            "custrecord_cntm_work_order",
            "custrecord_cntm_is_create_issue",
            "custrecord_cntm_cso_woc_quantity",
            "custrecord_cntm_cso_operaton",
            "custrecord_cntm_cso_scrap_quantity",
            "custrecord_cntm_cso_scarp_cumulative",
            "custrecord_cntm_cso_quantity_good",
            "custrecord_cntm_lot_details",
            "custrecord_cntm_last_operation",
            "custrecord_cntm_cso_laborsetuptime",
            "custrecord_cntm_cso_laborruntime",
            "custrecord_cntm_operator",
            "custrecord_cntm_failed_reason",
            "custrecord_cntm_cso_wocnumber",
          ],
        });
        log.debug("clientSubRecLookUp", JSON.stringify(clientSubRecLookUp));
        var parent = clientSubRecLookUp.custrecord_cntm_cso_parentrec[0].value;
        var woc;
        if (clientSubRecLookUp.custrecord_cntm_cso_wocnumber)
          woc = clientSubRecLookUp.custrecord_cntm_cso_wocnumber[0].value;
        var woFieldLookUp = search.lookupFields({
          type: "customrecord_cntm_clientapp_header",
          id: parent,
          columns: [
            "custrecord_cntm_cah_jobnumber",
            "custrecord_cntm_wo_created_from",
            "custrecord_cntm_cah_assemblyitem",
          ],
        });
  
        var woId = woFieldLookUp.custrecord_cntm_cah_jobnumber[0].value;
        var parentWOId = woFieldLookUp.custrecord_cntm_wo_created_from[0].value;
        var asmItem = woFieldLookUp.custrecord_cntm_cah_assemblyitem[0].value;
        WOName = woFieldLookUp.custrecord_cntm_cah_jobnumber[0].text;
        var isIssueRec = clientSubRecLookUp.custrecord_cntm_is_create_issue;
        log.debug("woId" + woId, "isIssueRec" + isIssueRec + " recId" + recId);
        var isLastOp = clientSubRecLookUp.custrecord_cntm_last_operation;
        var panelLot = clientSubRecLookUp.custrecord_cntm_cso_pannellot;
        var isTopWorkOrderFlag=false;
        if (!woc) {
          var oprtn =
            clientSubRecLookUp.custrecord_cntm_cso_operaton.split(" ")[0];
  
          log.debug("completion--");
  
          // //Checking Created from field
          var woFieldLookUp = search.lookupFields({
            type: "workorder",
            id: woId,
            columns: [
              "manufacturingrouting",
              "quantity",
              "custbody_cntm_no_of_panel",
              "custbody_rda_boards_per_panel",
              "createdfrom",
            ],
          });
          log.debug("woFieldLookUp :", woFieldLookUp);
  
          log.debug("isLastOp :", isLastOp);
          if (woFieldLookUp.createdfrom.length != 0) {
            log.debug("IF woFieldLookUp.createdfrom.length != 0");
            var createdFrom = woFieldLookUp.createdfrom[0].value;
            log.debug("createdFrom :", createdFrom);
  
            if (createdFrom == "" ||createdFrom == null ||createdFrom == undefined) {
              isTopWorkOrderFlag = true;
            }
          } else {
            isTopWorkOrderFlag = true;
            log.debug("ELSE isTopWorkOrderFlag = true");
          }
  
          var wocObj = record.transform({
            fromType: record.Type.WORK_ORDER,
            fromId: woId,
            toType: record.Type.WORK_ORDER_COMPLETION,
            isDynamic: true,
          });
  
          wocObj.setText({
            fieldId: "startoperation",
            text: oprtn,
          });
  
          wocObj.setText({
            fieldId: "endoperation",
            text: oprtn,
          });
  
          // wocObj.setValue({
          //   fieldId: "completedquantity",
          //   value: clientSubRecLookUp.custrecord_cntm_cso_woc_quantity, //custrecord_cntm_cso_quantity_good
          //   // custrecord_cntm_cso_woc_quantity
          // });
  
          //Changes -Vishal Same as Cntm_SS_CreateCompletion
          log.debug("isTopWorkOrderFlag :", isTopWorkOrderFlag);
          if (isLastOp == true && isTopWorkOrderFlag) {
              log.debug("IF inside condtion");
              wocObj.setValue({
                  fieldId: "completedquantity",
                  value: clientSubRecLookUp.custrecord_cntm_cso_quantity_good,
              });
          } else {
              log.debug("ELSE");
              wocObj.setValue({
                  fieldId: "completedquantity",
                  value: clientSubRecLookUp.custrecord_cntm_cso_woc_quantity,
              });
          }
  
          if (clientSubRecLookUp.custrecord_cntm_operator[0])
            wocObj.setValue({
              fieldId: "custbody_cntm_op_client_app",
              value: clientSubRecLookUp.custrecord_cntm_operator[0].value,
            });
  
          if (isLastOp == true) {
              var completedQty =
                  clientSubRecLookUp.custrecord_cntm_cso_woc_quantity;
              var scrapQty = 0;
  
              if (isTopWorkOrderFlag) {
                  completedQty = clientSubRecLookUp.custrecord_cntm_cso_quantity_good;
                  scrapQty = clientSubRecLookUp.custrecord_cntm_cso_scarp_cumulative;
              }
  
              wocObj.setValue({
                  fieldId: "scrapquantity",
                  value: scrapQty,
              });
              if (parseInt(completedQty) > 0) {
                  var subRec = wocObj.getSubrecord({
                      fieldId: "inventorydetail",
                  });
                  subRec.selectNewLine({
                      sublistId: "inventoryassignment",
                  });
                  subRec.setCurrentSublistValue({
                      sublistId: "inventoryassignment",
                      fieldId: "receiptinventorynumber",
                      value: panelLot,
                  });
                  subRec.setCurrentSublistValue({
                      sublistId: "inventoryassignment",
                      fieldId: "quantity",
                      value: completedQty,
                  });
                  subRec.commitLine({
                      sublistId: "inventoryassignment",
                  });
              }
          }
  
  
  
            /*
          if (isLastOp == true) {
            wocObj.setValue({
              fieldId: "scrapquantity",
              value: clientSubRecLookUp.custrecord_cntm_cso_scarp_cumulative,
            });
            if (parseInt(clientSubRecLookUp.custrecord_cntm_cso_quantity_good) > 0) {
              var subRec = wocObj.getSubrecord({
                fieldId: "inventorydetail",
              });
              subRec.selectNewLine({
                sublistId: "inventoryassignment",
              });
              subRec.setCurrentSublistValue({
                sublistId: "inventoryassignment",
                fieldId: "receiptinventorynumber",
                value: panelLot,
              });
              subRec.setCurrentSublistValue({
                sublistId: "inventoryassignment",
                fieldId: "quantity",
                value: clientSubRecLookUp.custrecord_cntm_cso_quantity_good,
              });
              subRec.commitLine({
                sublistId: "inventoryassignment",
              });
            }
          }
          */
  
  
  
  
          var operation = clientSubRecLookUp.custrecord_cntm_cso_operaton;
          var operationLine = wocObj.getLineCount({
            sublistId: "operation",
          });
          log.debug("operation", operation);
          log.debug(
            "laborsetuptime: " +
              clientSubRecLookUp.custrecord_cntm_cso_laborsetuptime,
            "laborrutime: " + clientSubRecLookUp.custrecord_cntm_cso_laborruntime
          );
          if (operationLine > 0) {
            for (var i = 0; i < operationLine; i++) {
              var opSeq = wocObj.getSublistValue({
                sublistId: "operation",
                fieldId: "operationsequence",
                line: i,
              });
              var op = wocObj.getSublistValue({
                sublistId: "operation",
                fieldId: "operationname",
                line: i,
              });
              log.debug("op", op);
              if (opSeq + " " + op == operation) {
                wocObj.selectLine({
                  sublistId: "operation",
                  line: i,
                });
                wocObj.setCurrentSublistValue({
                  sublistId: "operation",
                  fieldId: "recordsetup", // 'setuptime',
                  value: true,
                });
                wocObj.setCurrentSublistValue({
                  sublistId: "operation",
                  fieldId: "laborsetuptime", // 'setuptime',
                  value: Number(clientSubRecLookUp.custrecord_cntm_cso_laborsetuptime).toFixed(6),
                });
                wocObj.setCurrentSublistValue({
                  sublistId: "operation",
                  fieldId: "laborruntime", // 'runrate',
                  value: Number(clientSubRecLookUp.custrecord_cntm_cso_laborruntime).toFixed(6),
                });
                wocObj.commitLine({
                  sublistId: "operation",
                });
                break;
              }
            }
          }
          var boardsPerPanel = woFieldLookUp.custbody_rda_boards_per_panel;
          var customrecord_cntm_lot_creationSearchObj = search.create({
            type: "customrecord_cntm_lot_creation",
            filters: [
              ["custrecord_cntm_lot_wonum", "anyof", woId],
              "AND",
              ["custrecord_cntm_scraped_panel", "is", "T"],
            ],
            columns: [
              "custrecord_cntm_num_of_panels",
              "custrecord_cntm_brds_per_panel",
            ],
          });
          var totalScrappedPanel =
            customrecord_cntm_lot_creationSearchObj.runPaged().count;
          var customrecord_cntm_lot_creationSearchObj2 = search.create({
            type: "customrecord_cntm_lot_creation",
            filters: [["custrecord_cntm_lot_wonum", "anyof", woId]],
            columns: ["custrecord_cntm_cumulative_scrap_qty"],
          });
          var cumScrap = 0;
          var scrapCount = 0;
          var goodQty = 0;
          var noOfPanels = woFieldLookUp.custbody_cntm_no_of_panel;
          var searchResultCount =
            customrecord_cntm_lot_creationSearchObj2.runPaged().count;
          customrecord_cntm_lot_creationSearchObj2.run().each(function (result) {
            // .run().each has a
            // limit of 4,000
            // results
            if (
              result.getValue({
                name: "custrecord_cntm_cumulative_scrap_qty",
              })
            )
              cumScrap += parseInt(
                result.getValue({
                  name: "custrecord_cntm_cumulative_scrap_qty",
                })
              );
            log.debug("cumScrap", cumScrap);
            return true;
          });
          if (boardsPerPanel && noOfPanels) {
            scrapCount = boardsPerPanel * searchResultCount - cumScrap;
            goodQty = noOfPanels * boardsPerPanel - cumScrap;
          }
  
          var id = record.submitFields({
            type: record.Type.WORK_ORDER,
            id: woId,
            values: {
              custbody_cntm_good_boards: goodQty,
              custbody_cntm_scrapped_boards: cumScrap,
              custbody_cntm_good_panels: searchResultCount - totalScrappedPanel,
              custbody_cnt_scrapped_panels: totalScrappedPanel,
            },
            options: {
              enableSourcing: false,
              ignoreMandatoryFields: true,
            },
          });
  
          wocObj.setValue({
            fieldId: "custbody_cntm_good_boards",
            value: goodQty,
          });
          wocObj.setValue({
            fieldId: "custbody_cntm_scrapped_boards",
            value: scrapCount,
          });
          wocObj.setValue({
            fieldId: "custbody_cntm_good_panels",
            value: searchResultCount - totalScrappedPanel,
          });
          wocObj.setValue({
            fieldId: "custbody_cnt_scrapped_panels",
            value: totalScrappedPanel,
          });
          var wocId = wocObj.save({
            ignoreMandatoryFields: true,
          });
          record.submitFields({
            type: "customrecord_cntm_clientappsublist",
            id: recId,
            values: {
              custrecord_cntm_cso_wocnumber: wocId,
              // custrecord_cntm_cso_status : 4
            },
          });
        }
        wocId = woc;
        if (isLastOp == true) {
        }
  
        record.submitFields({
          type: "customrecord_cntm_clientappsublist",
          id: recId,
          values: {
            // custrecord_cntm_cso_wocnumber : wocId,
            custrecord_cntm_cso_status: 4,
          },
        });
  
        log.debug("Processing Done ");
        var saveID = "OK";
      } catch (e) {
        log.error("error", JSON.stringify(e));
      }
    }
  
    return {
      getInputData: getInputData,
      map: map,
    };
  });
  