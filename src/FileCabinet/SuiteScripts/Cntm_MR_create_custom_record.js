/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @filename      Cntm_MR_create_custom_record.js
 * @scriptname    Cntm_MR_create_custom_record
 * @ScriptId      customscript_cntm_mr_create_custom_rec
 * @author        Vishal Naphade
 * @email         vishal.naphade@gmail.com
 * @date          19-02-2022
 * @description
 * @SCRIPT_ID - 1832
 *
 * Copyright 2020, Centium Consulting its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 * Module Description
 *
 * Sr. No   	 Date           	  Author                  	Remarks
 * 1		25 May 2022  		  Vishal Naphade    	 -   Called library
 * 2
 *
 */
define([
    "N/search",
    "N/record",
    "N/runtime",
    "N/url",
    "N/https" /*,"./customOperationLineLibrary.js"*/,
  ], function (
    // Loader_Library
  
    search,
    record,
    runtime,
    url,
    https
    // customOperationLineLibrary
  ) {
    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
  
    function getInputData() {
      log.debug("------------INPUT------------");
      var lotArray = [];
      var workOrderid = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_woid_cust_rec",
      });
      log.debug("workOrderid", workOrderid);
  
      lotArray = getLotArray(workOrderid);
  
      return lotArray;
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
  
    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(mapContext) {
      var callLibrary = false;
      try {
        log.debug("------------MAP------------");
        var WO = runtime.getCurrentScript().getParameter({
          name: "custscript_cntm_woid_cust_rec",
        });
        log.debug("WO", WO);
  
        var lotPanelId = JSON.parse(mapContext.value);
        log.debug("lotPanelId :", lotPanelId);
  
        //  var rec = record.load({
        //    type: "customrecord_cntm_lot_creation",
        //    id: lotPanelId,
        //    // isDynamic: boolean,
        //    // defaultValues: Object
        //  });
        //  // log.debug('rec ;',rec);
  
        if (WO) {
          var lotRecLookUp = search.lookupFields({
            type: "customrecord_cntm_lot_creation",
            id: lotPanelId,
            columns: [
              "custrecord_cntm_lot_lotnumber",
              "custrecord_cntm_cumulative_scrap_qty",
              "custrecord_cntm_previous_scrap",
              "custrecord_cntm_num_of_panels",
              "custrecord_cntm_brds_per_panel",
              "custrecord_cntm_stock_lot_qty",
            ],
          });
  
          log.audit("lotRecLookUp", lotRecLookUp);
  
          var lot = lotRecLookUp.custrecord_cntm_lot_lotnumber; /*rec.getValue({
          fieldId: "custrecord_cntm_lot_lotnumber",
        });*/
          var cumScrapQty =
            lotRecLookUp.custrecord_cntm_cumulative_scrap_qty; /*rec.getValue({
          fieldId: "custrecord_cntm_cumulative_scrap_qty",
        });*/
          var prevScrap =
            lotRecLookUp.custrecord_cntm_previous_scrap; /*rec.getValue({
          fieldId: "custrecord_cntm_previous_scrap",
        });*/
          log.debug("lot", lot);
          var noOfPanels =
            lotRecLookUp.custrecord_cntm_num_of_panels; /*rec.getValue({
          fieldId: "custrecord_cntm_num_of_panels",
        });*/
          var woFieldLookUp = search.lookupFields({
            type: "workorder",
            id: WO,
            columns: [
              "manufacturingrouting",
              "quantity",
              //"custbody_cntm_no_of_panel",
              // "custbody_rda_boards_per_panel",
              // "custbody_cntm_good_panels",
              // "custbody_total_num_cores",
            ],
          });
  
          log.debug("woFieldLookUp :", woFieldLookUp);
          if (!noOfPanels) noOfPanels = woFieldLookUp.custbody_cntm_no_of_panel;
  
          //             var boardsPerPanel = lotRecLookUp.custrecord_cntm_brds_per_panel;/*rec.getValue({
          //     fieldId: "custrecord_cntm_brds_per_panel",
          //   });*/
          //             if (!boardsPerPanel)
          //                 boardsPerPanel = woFieldLookUp.custbody_rda_boards_per_panel;
          //             var customrecord_cntm_lot_creationSearchObj = search.create({
          //                 type: "customrecord_cntm_lot_creation",
          //                 filters: [
          //                     ["custrecord_cntm_lot_wonum", "anyof", WO],
          //                     "AND",
          //                     ["custrecord_cntm_scraped_panel", "is", "T"],
          //                 ],
          //                 columns: [
          //                     "custrecord_cntm_num_of_panels",
          //                     "custrecord_cntm_brds_per_panel",
          //                 ],
          //             });
          //             var totalScrappedPanel =
          //                 customrecord_cntm_lot_creationSearchObj.runPaged().count;
          //             var customrecord_cntm_lot_creationSearchObj2 = search.create({
          //                 type: "customrecord_cntm_lot_creation",
          //                 filters: [["custrecord_cntm_lot_wonum", "anyof", WO]],
          //                 columns: ["custrecord_cntm_cumulative_scrap_qty"],
          //             });
          //             var cumScrap = 0;
  
          // var searchResultCount =
          //     customrecord_cntm_lot_creationSearchObj2.runPaged().count;
          // customrecord_cntm_lot_creationSearchObj2.run().each(function (result) {
          //     // .run().each has a
          //     // limit of 4,000
          //     // results
          //     cumScrap += result.getValue({
          //         name: "custrecord_cntm_cumulative_scrap_qty",
          //     });
          //     return true;
          // });
          // var scrapCount = 0;
          // var goodQty = 0;
          // if (boardsPerPanel && noOfPanels) {
          //     scrapCount = boardsPerPanel * searchResultCount - cumScrap;
          //     goodQty = noOfPanels * boardsPerPanel - cumScrap;
          // }
  
          // var id = record.submitFields({
          //     type: record.Type.WORK_ORDER,
          //     id: WO,
          //     values: {
          //         custbody_cntm_good_boards: goodQty,
          //         custbody_cntm_scrapped_boards: cumScrap,
          //         custbody_cntm_good_panels: searchResultCount - totalScrappedPanel,
          //         custbody_cnt_scrapped_panels: totalScrappedPanel,
          //     },
          //     options: {
          //         enableSourcing: false,
          //         ignoreMandatoryFields: true,
          //     },
          // });
          var routing = woFieldLookUp.manufacturingrouting[0].value;
          var WOqty = woFieldLookUp.quantity;
          // log.debug("WOqty", WOqty);
          var lotQty =
            lotRecLookUp.custrecord_cntm_stock_lot_qty; /*rec.getValue({
           fieldId: "custrecord_cntm_stock_lot_qty",
         });*/
          if (!lotQty) lotQty = parseInt(WOqty / parseInt(noOfPanels));
          // log.audit("lotQty", lotQty);
  
          var clientAppHeaderRecId;
          var clientAppHeaderSearchObj = search.create({
            type: "customrecord_cntm_clientapp_header",
            filters: [["custrecord_cntm_cah_jobnumber", "anyof", WO]],
            columns: [
              search.createColumn({
                name: "internalid",
                sort: search.Sort.ASC,
                label: "Internal ID",
              }),
            ],
          });
          var searchResultCount = clientAppHeaderSearchObj.runPaged().count;
          // log.debug("bomSearchObj result count", searchResultCount);
          clientAppHeaderSearchObj.run().each(function (result) {
            // .run().each has a
            // limit of 4,000
            // results
            clientAppHeaderRecId = result.id;
            return true;
          });
          var clientAppHeaderRec;
          var isCreate = false;
          log.debug("clientAppHeaderRec :", clientAppHeaderRec);
          if (!clientAppHeaderRecId) {
            log.debug("CREATE REC");
            clientAppHeaderRec = record.create({
              type: "customrecord_cntm_clientapp_header",
              isDynamic: true,
            });
            clientAppHeaderRec.setValue({
              fieldId: "custrecord_cntm_cah_jobnumber",
              value: WO,
            });
            isCreate = true;
          } else {
            log.debug("LOAD REC");
            clientAppHeaderRec = record.load({
              type: "customrecord_cntm_clientapp_header",
              id: clientAppHeaderRecId,
              isDynamic: true,
            });
            isCreate = true;
          }
          log.debug("is Create :", isCreate);
          // if (scriptContext.type == "create" || isCreate == true) {
          if (isCreate == true) {
            log.debug("IN CREATE :", routing);
            if (routing) {
              var routingRec = record.load({
                type: "manufacturingrouting",
                id: routing,
                isDynamic: true,
              });
              var routingLines = routingRec.getLineCount({
                sublistId: "routingstep",
              });
              var oprationArr = {};
              var componentOprationLines = routingRec.getLineCount({
                sublistId: "routingcomponent",
              });
              var typeArr = 0;
              for (var j = 0; j < componentOprationLines; j++) {
                var item = routingRec.getSublistValue({
                  sublistId: "routingcomponent",
                  fieldId: "item",
                  line: j,
                });
  
                var compOpSeq = routingRec.getSublistValue({
                  sublistId: "routingcomponent",
                  fieldId: "operationsequencenumber",
                  line: j,
                });
                if (compOpSeq) {
                  if (!oprationArr[compOpSeq]) oprationArr[compOpSeq] = [];
                  oprationArr[compOpSeq].push(item);
                }
              }
              log.debug("oprationArr", oprationArr);
  
              if (routingLines <= 70) {
                log.debug("IF");
                log.debug("routingLines", routingLines);
                for (var i = 0; i < routingLines; i++) {
                  var mcnRunTime = routingRec.getSublistValue({
                    sublistId: "routingstep",
                    fieldId: "runrate",
                    line: i,
                  });
                  var mcnSetupTime = routingRec.getSublistValue({
                    sublistId: "routingstep",
                    fieldId: "setuptime",
                    line: i,
                  });
                  var laborRunTime = routingRec.getSublistValue({
                    sublistId: "routingstep",
                    fieldId: "runrate",
                    line: i,
                  });
                  var laborSetupTime = routingRec.getSublistValue({
                    sublistId: "routingstep",
                    fieldId: "setuptime",
                    line: i,
                  });
                  var opSeq = routingRec
                    .getSublistValue({
                      sublistId: "routingstep",
                      fieldId: "operationsequence",
                      line: i,
                    })
                    .toString();
                  var opName = routingRec.getSublistValue({
                    sublistId: "routingstep",
                    fieldId: "operationname",
                    line: i,
                  });
                  // log.debug('opSeq' +
                  // opSeq,
                  // opName);
                  // if (!clientAppHeaderRecId
                  // &&
                  // subRec == false) {
                  clientAppHeaderRec.selectNewLine({
                    sublistId: "recmachcustrecord_cntm_cso_parentrec",
                  });
                  clientAppHeaderRec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_cso_parentrec",
                    fieldId: "custrecord_cntm_cso_pannellot",
                    value: lot.toString(),
                  });
                  clientAppHeaderRec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_cso_parentrec",
                    fieldId: "custrecord_cntm_cso_woc_quantity",
                    value: lotQty,
                  });
                  clientAppHeaderRec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_cso_parentrec",
                    fieldId: "custrecord_cntm_cso_quantity_good",
                    value: lotQty,
                  });
                  clientAppHeaderRec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_cso_parentrec",
                    fieldId: "custrecord_cntm_cso_operaton",
                    value: opSeq + " " + opName,
                  });
                  clientAppHeaderRec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_cso_parentrec",
                    fieldId: "custrecord_cntm_cso_machinesetuptime",
                    value: mcnSetupTime,
                  });
                  clientAppHeaderRec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_cso_parentrec",
                    fieldId: "custrecord_cntm_cso_machinerunetime",
                    value: mcnRunTime,
                  });
                  clientAppHeaderRec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_cso_parentrec",
                    fieldId: "custrecord_cntm_cso_laborsetuptime",
                    value: Number(laborSetupTime).toFixed(6),
                  });
                  clientAppHeaderRec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_cso_parentrec",
                    fieldId: "custrecord_cntm_cso_laborruntime",
                    value: Number(laborRunTime).toFixed(6),
                  });
                  clientAppHeaderRec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_cso_parentrec",
                    fieldId: "custrecord_cntm_lot_record",
                    value: lotPanelId, //rec.id,
                  });
                  clientAppHeaderRec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_cso_parentrec",
                    fieldId: "custrecord_cntm_seq_no",
                    value: i + 1,
                  });
                  clientAppHeaderRec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_cntm_cso_parentrec",
                    fieldId: "custrecord_cntm_work_order",
                    value: WO,
                  });
                  if (i == routingLines - 1)
                    clientAppHeaderRec.setCurrentSublistValue({
                      sublistId: "recmachcustrecord_cntm_cso_parentrec",
                      fieldId: "custrecord_cntm_last_operation",
                      value: true,
                    });
  
                  if (opSeq in oprationArr) {
                    clientAppHeaderRec.setCurrentSublistValue({
                      sublistId: "recmachcustrecord_cntm_cso_parentrec",
                      fieldId: "custrecord_cntm_is_create_issue",
                      value: true,
                    });
                    clientAppHeaderRec.setCurrentSublistValue({
                      sublistId: "recmachcustrecord_cntm_cso_parentrec",
                      fieldId: "custrecord_cntm_items_to_issue",
                      value: oprationArr[opSeq],
                    });
                  }
                  clientAppHeaderRec.commitLine({
                    sublistId: "recmachcustrecord_cntm_cso_parentrec",
                  });
                }
                clientAppHeaderRecId = clientAppHeaderRec.save();
              } else {
                log.debug("ELSE");
                if (!clientAppHeaderRecId)
                  clientAppHeaderRecId = clientAppHeaderRec.save();
                var finalCount = 70;
                for (var i = 0; i < finalCount; i++) {
                  var mcnRunTime = routingRec.getSublistValue({
                    sublistId: "routingstep",
                    fieldId: "runrate",
                    line: i,
                  });
                  var mcnSetupTime = routingRec.getSublistValue({
                    sublistId: "routingstep",
                    fieldId: "setuptime",
                    line: i,
                  });
                  var laborRunTime = routingRec.getSublistValue({
                    sublistId: "routingstep",
                    fieldId: "runrate",
                    line: i,
                  });
                  var laborSetupTime = routingRec.getSublistValue({
                    sublistId: "routingstep",
                    fieldId: "setuptime",
                    line: i,
                  });
                  var opSeq = routingRec
                    .getSublistValue({
                      sublistId: "routingstep",
                      fieldId: "operationsequence",
                      line: i,
                    })
                    .toString();
                  var opName = routingRec.getSublistValue({
                    sublistId: "routingstep",
                    fieldId: "operationname",
                    line: i,
                  });
                  var clientAppSublistRec = record.create({
                    type: "customrecord_cntm_clientappsublist",
                    isDynamic: true,
                  });
                  clientAppSublistRec.setValue({
                    fieldId: "custrecord_cntm_cso_parentrec",
                    value: clientAppHeaderRecId,
                  });
                  clientAppSublistRec.setValue({
                    fieldId: "custrecord_cntm_cso_pannellot",
                    value: lot.toString(),
                  });
                  clientAppSublistRec.setValue({
                    fieldId: "custrecord_cntm_cso_woc_quantity",
                    value: lotQty,
                  });
                  clientAppSublistRec.setValue({
                    fieldId: "custrecord_cntm_cso_quantity_good",
                    value: lotQty, // - prevScrap,
                  });
                  //clientAppSublistRec.setValue({
                  // fieldId: "custrecord_cntm_cso_scrap_quantity",
                  // value: prevScrap,
                  //});
                  clientAppSublistRec.setValue({
                    fieldId: "custrecord_cntm_cso_scarp_cumulative",
                    value: cumScrapQty,
                  });
                  clientAppSublistRec.setValue({
                    fieldId: "custrecord_cntm_cso_operaton",
                    value: opSeq + " " + opName,
                  });
                  clientAppSublistRec.setValue({
                    fieldId: "custrecord_cntm_cso_machinesetuptime",
                    value: mcnSetupTime,
                  });
                  clientAppSublistRec.setValue({
                    fieldId: "custrecord_cntm_cso_machinerunetime",
                    value: mcnRunTime,
                  });
                  clientAppSublistRec.setValue({
                    fieldId: "custrecord_cntm_cso_laborsetuptime",
                    value: Number(laborSetupTime).toFixed(6),
                  });
                  clientAppSublistRec.setValue({
                    fieldId: "custrecord_cntm_cso_laborruntime",
                    value: Number(laborRunTime).toFixed(6),
                  });
                  clientAppSublistRec.setValue({
                    fieldId: "custrecord_cntm_lot_record",
                    value: lotPanelId, //rec.id,
                  });
                  clientAppSublistRec.setValue({
                    fieldId: "custrecord_cntm_seq_no",
                    value: i + 1,
                  });
                  clientAppSublistRec.setValue({
                    fieldId: "custrecord_cntm_work_order",
                    value: WO,
                  });
                  if (i == routingLines - 1)
                    clientAppSublistRec.setValue({
                      fieldId: "custrecord_cntm_last_operation",
                      value: true,
                    });
  
                  if (opSeq in oprationArr) {
                    clientAppSublistRec.setValue({
                      fieldId: "custrecord_cntm_is_create_issue",
                      value: true,
                    });
                    clientAppSublistRec.setValue({
                      fieldId: "custrecord_cntm_items_to_issue",
                      value: oprationArr[opSeq],
                    });
                  }
                  clientAppSublistRec.save();
                } //for
                var remainLines = finalCount;
                if (routingLines > remainLines) {
                  var output = url.resolveScript({
                    scriptId: "customscript_cntm_sl_create_cah",
                    deploymentId: "customdeploy_cntm_sl_create_cah",
                    returnExternalUrl: true,
                  });
                  output =
                    output +
                    "&wo=" +
                    WO +
                    "&routing=" +
                    routing +
                    "&header=" +
                    clientAppHeaderRecId +
                    "&rem=" +
                    remainLines +
                    "&oprationArr=" +
                    JSON.stringify(oprationArr) +
                    "&lot=" +
                    lot +
                    "&lotRec=" +
                    lotPanelId + //rec.id +
                    "&lotQty=" +
                    lotQty;
                  var response = https.get({
                    url: output,
                  });
                  log.debug("resp", response.body);
                } //routingLines > remainLines
              } //else
              //
            } //routing
  
            //Setting true value of check box
            var checkTrue = record.submitFields({
              type: record.Type.WORK_ORDER,
              id: WO,
              values: {
                // custbody_cntm_custom_rec_ref_hide: true,
                custbody_cntm_prevent_dup_record: false,
              },
              options: {
                enableSourcing: false,
                ignoreMandatoryFields: true,
              },
            });
            log.debug("CHECK TRUE");
          }
        } //WO
  
        mapContext.write({
          key: WO,
          value: callLibrary,
        });
      } catch (error) {
        log.error("ERRRO IN MAP :", error);
        callLibrary = true;
        mapContext.write({
          key: WO,
          value: callLibrary,
        });
  
        var checkTrue = record.submitFields({
          type: record.Type.WORK_ORDER,
          id: WO,
          values: {
            custbody_cntm_prevent_dup_record: false,
          },
          options: {
            enableSourcing: false,
            ignoreMandatoryFields: true,
          },
        });
        log.debug("CHECK TRUE");
      }
    }
  
    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(reduceContext) {
      try {
        reduceContext.write({
          key: reduceContext.key,
          value: reduceContext.values,
        });
      } catch (error) {
        log.error("erron in red");
      }
    }
  
    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summaryContext) {
      log.debug("IN SUMMARIZE", summaryContext);
      try {
        var WO = runtime.getCurrentScript().getParameter({
          name: "custscript_cntm_woid_cust_rec",
        });
        log.debug("WO", WO);
        var woFieldLookUp = search.lookupFields({
          type: "workorder",
          id: WO,
          columns: [
            "manufacturingrouting",
            "quantity",
            "custbody_cntm_no_of_panel",
            "custbody_rda_boards_per_panel",
            "custbody_cntm_good_panels",
            "custbody_total_num_cores",
          ],
        });
  
        log.debug("woFieldLookUp :", woFieldLookUp);
        var boardsPerPanel = woFieldLookUp.custbody_rda_boards_per_panel;
        var customrecord_cntm_lot_creationSearchObj = search.create({
          type: "customrecord_cntm_lot_creation",
          filters: [
            ["custrecord_cntm_lot_wonum", "anyof", WO],
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
          filters: [["custrecord_cntm_lot_wonum", "anyof", WO]],
          columns: ["custrecord_cntm_cumulative_scrap_qty"],
        });
        var cumScrap = 0;
        var noOfPanels = woFieldLookUp.custbody_cntm_no_of_panel;
        var searchResultCount =
          customrecord_cntm_lot_creationSearchObj2.runPaged().count;
        customrecord_cntm_lot_creationSearchObj2.run().each(function (result) {
          // .run().each has a
          // limit of 4,000
          // results
          cumScrap += result.getValue({
            name: "custrecord_cntm_cumulative_scrap_qty",
          });
          return true;
        });
        var scrapCount = 0;
        var goodQty = 0;
        if (boardsPerPanel && noOfPanels) {
          scrapCount = boardsPerPanel * searchResultCount - cumScrap;
          goodQty = noOfPanels * boardsPerPanel - cumScrap;
        }
  
        var id = record.submitFields({
          type: record.Type.WORK_ORDER,
          id: WO,
          values: {
            custbody_cntm_custom_rec_ref_hide: true,
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
      } catch (err) {
        log.error("error in summary", err);
      }
      /* var libraryFlag = false;
           var WO = runtime.getCurrentScript().getParameter({
             name: "custscript_cntm_woid_cust_rec",
           });
        
           summaryContext.output.iterator().each(function (key, value) {
             var values = JSON.parse(value);
             log.debug("values", values);
        
             if (values.indexOf('true') > -1) {
               log.debug('IF')
               libraryFlag = false; //error in map do not call library
             } else {
               log.debug('ELSE')
               libraryFlag = true; // call library
             }
             return false;
           });
        
           if (libraryFlag == true || libraryFlag == 'T') {
             var woFieldLookUp = search.lookupFields({
               type: "workorder",
               id: WO,
               columns: [
                 "quantity",
                 "custbody_cntm_good_panels",
                 "custbody_total_num_cores",
               ],
             });
        
             var operatorId = "";
             var WOqty = validatedata(woFieldLookUp.quantity);
             var goodNumberOfPanels = validatedata(woFieldLookUp.custbody_cntm_good_panels);
             var totalNumberOfCores = validatedata(woFieldLookUp.custbody_total_num_cores);
        
             try {
               log.debug('CALLLED');
               //    customOperationLineLibrary.deleteAndCreateCustomOperationLines(WO,operatorId,WOqty,goodNumberOfPanels,totalNumberOfCores)
               // log.debug('CALLLED');
        
             } catch (error) {
               log.error('ERROR WHILE CALLING LIBRARY', error)
        
             }
        
           }*/
    }
    function validatedata(data) {
      if (data != undefined && data != null && data != "") {
        return data;
      } else {
        return 0;
      }
    }
  
    return {
      getInputData: getInputData,
      map: map,
      // reduce: reduce,
      summarize: summarize,
    };
  });
  