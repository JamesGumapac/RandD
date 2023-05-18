/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
/*
* Copyright 2020, Centium Consulting its affiliates. All rights reserved.
* DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
* Module Description
* 
* Sr. No   	 Date           	  Author                  	Remarks
* 1		      03 Nov 2022         Vishal Naphde             
* 2			 
*/ 

define(["N/record", "N/runtime", "N/search", "N/task", "N/url", "N/https"]
/**
 * @param {record}
 *            record
 * @param {runtime}
 *            runtime
 * @param {search}
 *            search
 * @param {task}
 *            task
 */, function (record, runtime, search, task, url, https) {
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
  function beforeSubmit(scriptContext) {}

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
  function comparer(otherArray) {
    return function (current) {
      return (
        otherArray.filter(function (other) {
          // console.log(other+','+current);
          return other == current;
        }).length == 0
      );
    };
  }

  function afterSubmit(scriptContext) {
    try {
      var oldRec = scriptContext.oldRecord;
      var rec = scriptContext.newRecord;
      // log.debug("After submit : rec.type :", rec.type + 'scriptContext.type :'+scriptContext.type);

      //check lot is present in previous lot field then get WO and lot create new searchh using that changes on 03-Nov-2022
      if (rec.type == "customrecord_cntm_lot_creation") {
        log.debug("--INSIDE LOT CREATION---", scriptContext.type +'--CONTEXT--- :'+runtime.executionContext);
        // log.debug("--CONTEXT---", runtime.executionContext);
       if (scriptContext.type == "xedit" || scriptContext.type == "edit") {
           var scrapPanelOld  = oldRec.getValue({
            fieldId: "custrecord_cntm_scraped_panel",
          });
          log.debug("scrapPanelOld :", scrapPanelOld);

          var scrapPanel = rec.getValue({
            fieldId: "custrecord_cntm_scraped_panel",
          });
          log.debug("scrapPanel :", scrapPanel);

          // if (runtime.executionContext == "MAPREDUCE") {
            //old value and new value check 

            if(scrapPanelOld != scrapPanel ){

            var lotWOArr = [];
            if (scrapPanel) {
              var customrecord_cntm_lot_creationSearchObj = search.create({
                type: "customrecord_cntm_lot_creation",
                filters: [["custrecord_cntm_prev_lot_rec", "anyof", rec.id]],
                columns: [
                  search.createColumn({
                    name: "custrecord_cntm_lot_wonum",
                    label: "WO#",
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
              customrecord_cntm_lot_creationSearchObj
                .run()
                .each(function (result) {
                  var map = {};
                  map["wo"] = result.getValue({
                    name: "custrecord_cntm_lot_wonum",
                    label: "WO#",
                  });
                  map["lot"] = result.id;
                  lotWOArr.push(map);
                  return true;
                });

              log.debug("lotWOArr :", lotWOArr);

              if (lotWOArr.length > 0) {
                var scriptTask = task.create({
                  taskType: task.TaskType.MAP_REDUCE,
                });
                scriptTask.scriptId = "customscript_cntm_mr_prev_scrap_check";
                scriptTask.params = {
                  custscript_lot_wo_map_array: JSON.stringify(lotWOArr),
                };

                var scriptTaskId = scriptTask.submit();
                var status = task.checkStatus(scriptTaskId).status;
                log.debug("previous scrap : ", scriptTaskId);
              }
            }
          }
        }
      }
      /*
        if (rec.type == "customrecord_cntm_lot_creation") {
          if (scriptContext.type == "create" || scriptContext.type == "edit") {
            try {
              var WO = rec.getValue({
                fieldId: "custrecord_cntm_lot_wonum",
              });
              log.debug("wo", WO);
              
              if (WO) {
                // if (scriptContext.type == 'create')
                WO = WO[0];
                log.debug("WO", WO);

                var lot = rec.getValue({
                  fieldId: "custrecord_cntm_lot_lotnumber",
                });
                var cumScrapQty = rec.getValue({
                  fieldId: "custrecord_cntm_cumulative_scrap_qty",
                });
                var prevScrap = rec.getValue({
                  fieldId: "custrecord_cntm_previous_scrap",
                });
                log.debug("lot", lot);
                var noOfPanels = rec.getValue({
                  fieldId: "custrecord_cntm_num_of_panels",
                });
                var woFieldLookUp = search.lookupFields({
                  type: "workorder",
                  id: WO,
                  columns: [
                    "manufacturingrouting",
                    "quantity",
                    "custbody_cntm_no_of_panel",
                    "custbody_rda_boards_per_panel",
                    "custbody_cntm_cust_rec_on_lotrec_hide" //added on 23-05-2022
                  ],
                });
                log.debug('woFieldLookUp :',woFieldLookUp);

                // check the value of check Box if its true then do not proceed

                if (woFieldLookUp.custbody_cntm_cust_rec_on_lotrec_hide == false || woFieldLookUp.custbody_cntm_cust_rec_on_lotrec_hide == F) 
                {
                  log.debug('---FALSE---')
                  var boardsPerPanel = rec.getValue({
                    fieldId: "custrecord_cntm_brds_per_panel",
                  });
                  if (!boardsPerPanel)
                    boardsPerPanel = woFieldLookUp.custbody_rda_boards_per_panel;
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
                  if (!noOfPanels)
                    noOfPanels = woFieldLookUp.custbody_cntm_no_of_panel;
                  var searchResultCount =
                    customrecord_cntm_lot_creationSearchObj2.runPaged().count;
                  customrecord_cntm_lot_creationSearchObj2
                    .run()
                    .each(function (result) {
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
                      custbody_cntm_good_boards: goodQty,
                      custbody_cntm_scrapped_boards: cumScrap,
                      custbody_cntm_good_panels:
                        searchResultCount - totalScrappedPanel,
                      custbody_cnt_scrapped_panels: totalScrappedPanel,
                    },
                    options: {
                      enableSourcing: false,
                      ignoreMandatoryFields: true,
                    },
                  });
                  var routing = woFieldLookUp.manufacturingrouting[0].value;
                  var WOqty = woFieldLookUp.quantity;
                  log.debug("WOqty", WOqty);
                  var lotQty = rec.getValue({
                    fieldId: "custrecord_cntm_stock_lot_qty",
                  });
                  if (!lotQty) lotQty = parseInt(WOqty / parseInt(noOfPanels));
                  log.audit("lotQty", lotQty);
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
                  log.debug("bomSearchObj result count", searchResultCount);
                  clientAppHeaderSearchObj.run().each(function (result) {
                    // .run().each has a
                    // limit of 4,000
                    // results
                    clientAppHeaderRecId = result.id;
                    return true;
                  });
                  var clientAppHeaderRec;
                  var isCreate = false;
                  if (!clientAppHeaderRecId) {
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
                    clientAppHeaderRec = record.load({
                      type: "customrecord_cntm_clientapp_header",
                      id: clientAppHeaderRecId,
                      isDynamic: true,
                    });
                    if (scriptContext.type == "edit") {
                      var customrecord_cntm_clientappsublistSearchObj1 = search.create({
                        type: "customrecord_cntm_clientappsublist",
                        filters:
                          [
                            ["custrecord_cntm_work_order", "anyof", WO],
                            "AND",
                            ["custrecord_cntm_lot_record", "anyof", rec.id],
                            "AND",
                            ["custrecord_cntm_cso_parentrec", "anyof", clientAppHeaderRecId]
                          ],
                        columns:
                          [
                            "custrecord_cntm_cso_pannellot",
                            "custrecord_cntm_cso_operaton",
                            search.createColumn({
                              name: "custrecord_cntm_seq_no",
                              sort: search.Sort.ASC
                            })
                          ]
                      });
                      var searchResultCount1 = customrecord_cntm_clientappsublistSearchObj1.runPaged().count;
                      log.debug("customrecord_cntm_clientappsublistSearchObj1 result count", searchResultCount1);
                      if (searchResultCount1 <= 0)
                        isCreate = true;
                    }
  
                  }
                  if (scriptContext.type == "create" || isCreate == true) {
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
                            value: laborSetupTime,
                          });
                          clientAppHeaderRec.setCurrentSublistValue({
                            sublistId: "recmachcustrecord_cntm_cso_parentrec",
                            fieldId: "custrecord_cntm_cso_laborruntime",
                            value: laborRunTime,
                          });
                          clientAppHeaderRec.setCurrentSublistValue({
                            sublistId: "recmachcustrecord_cntm_cso_parentrec",
                            fieldId: "custrecord_cntm_lot_record",
                            value: rec.id,
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
                            value: lotQty// - prevScrap,
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
                            value: laborSetupTime,
                          });
                          clientAppSublistRec.setValue({
                            fieldId: "custrecord_cntm_cso_laborruntime",
                            value: laborRunTime,
                          });
                          clientAppSublistRec.setValue({
                            fieldId: "custrecord_cntm_lot_record",
                            value: rec.id,
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
                        }
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
                            rec.id +
                            "&lotQty=" +
                            lotQty;
                          var response = https.get({
                            url: output,
                          });
                          log.debug("resp", response.body);
                        }
                      }
                      //
                    }
                  } else {
                    var oldLot = oldRec.getValue({
                      fieldId: "custrecord_cntm_lot_lotnumber",
                    });
                    var newLot = rec.getValue({
                      fieldId: "custrecord_cntm_lot_lotnumber",
                    });
                    if (oldLot != newLot) {
                      var customrecord_cntm_clientappsublistSearchObj =
                        search.create({
                          type: "customrecord_cntm_clientappsublist",
                          filters: [
                            ["custrecord_cntm_lot_record", "anyof", rec.id],
                          ],
                          columns: [
                            "custrecord_cntm_cso_pannellot",
                            "custrecord_cntm_cso_operaton",
                          ],
                        });
                      var searchResultCount =
                        customrecord_cntm_clientappsublistSearchObj.runPaged()
                          .count;
                      log.debug(
                        "customrecord_cntm_clientappsublistSearchObj result count",
                        searchResultCount
                      );
                      customrecord_cntm_clientappsublistSearchObj
                        .run()
                        .each(function (result) {
                          // .run().each
                          // has a limit
                          // of 4,000
                          // results
  
                          record.submitFields({
                            type: "customrecord_cntm_clientappsublist",
                            id: result.id,
                            values: {
                              custrecord_cntm_cso_pannellot: newLot,
                            },
                          });
                          return true;
                        });
                    }
                  }
                }
              }
            } catch (e) {
              log.error("error lot", e);     
            }
          }
        }
       */
      if (rec.type == "customrecord_cntm_clientappsublist") { //Added on 03-11-2022
        try {
          // log..('----SUBLiST Operation----')
          var isOldProcess = rec.getValue({
            fieldId: "custrecord_cntm_old_clientapp_process",
          });

          if (isOldProcess == true || isOldProcess == "T") {
            var createWOC = rec.getValue({
              fieldId: "custrecord_cntm_cso_createwo_completion",
            });
            var status = rec.getValue({
              fieldId: "custrecord_cntm_cso_status",
            });
            log.debug("createWOC", createWOC);
            if (createWOC == true && status != 4) {
              var scriptTask = task.create({
                taskType: task.TaskType.SCHEDULED_SCRIPT,
              });
              scriptTask.scriptId = "customscript_cntm_ss_create_completion";
              scriptTask.params = {
                custscript_cntm_client_sublist_rec: rec.id,
              };

              var scriptTaskId = scriptTask.submit();
              var status = task.checkStatus(scriptTaskId).status;
              log.debug('create completion :',scriptTaskId);
              //if (runtime.executionContext !== runtime.ContextType.MAP_REDUCE) {
              var scrapped = rec.getValue({
                fieldId: "custrecord_cntm_scrapped",
              });

              var changeLotQty = rec.getValue({
                fieldId: "custrecord_cntm_cso_woc_quantity",
              });
              var scrapQtyCum = rec.getValue({
                fieldId: "custrecord_cntm_cso_scarp_cumulative",
              });
              log.debug(
                "changeLotQty " + changeLotQty,
                "scrapQtyCum " + scrapQtyCum
              );
              log.debug("scrapped", scrapped);
              if (changeLotQty == scrapQtyCum && scrapped != true) {
                var subFieldLookUp = search.lookupFields({
                  type: "customrecord_cntm_clientappsublist",
                  id: rec.id,
                  columns: [
                    "custrecord_cntm_work_order",
                    "custrecord_cntm_cso_pannellot",
                    "custrecord_cntm_scrapped",
                    "custrecord_cntm_lot_record",
                  ],
                });
                var panelLotSub = subFieldLookUp.custrecord_cntm_cso_pannellot;
                /*
                 * rec
                 * .getValue({
                 * fieldId :
                 * 'custrecord_cntm_cso_pannellot'
                 * });
                 */
                var jobID = subFieldLookUp.custrecord_cntm_work_order[0].value;
                /*
                 * rec.getValue({
                 * fieldId :
                 * 'custrecord_cntm_work_order'
                 * });
                 */
                var lotrec = subFieldLookUp.custrecord_cntm_lot_record[0].value;
                scrapped = subFieldLookUp.custrecord_cntm_scrapped;
                log.debug("scrapped", scrapped);
                if (scrapped != true && scrapped != "true") {
                  record.submitFields({
                    type: "customrecord_cntm_lot_creation",
                    id: lotrec,
                    values: {
                      // custrecord_cntm_cso_wocnumber
                      // :
                      // wocId,
                      custrecord_cntm_scraped_panel: true,
                    },
                  });
                  var scriptTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                  });
                  scriptTask.scriptId = "customscript_cntm_mr_additional_panel";
                  // scriptTask.deploymentId =
                  // 'customdeploy_cntm_mr_qt_item_import';
                  scriptTask.params = {
                    custscript_cntm_panel_no: panelLotSub,
                    custscript_cntm_wo_no: jobID,
                    custscript_cntm_scrapcum: scrapQtyCum,
                    custscript_cntm_lotqty: changeLotQty,
                    custscript_cntm_lastline: false,
                    // custscript_cntm_wo_item :
                    // item,
                    // custscript_cntm_no_of_lots :
                    // checkedLines,
                    custscript_cntm_sublist_recid: rec.id,
                    // custscript_cntm_sublist_ids:panelSublistIds,
                    custscript_cntm_scrapped: true,
                    custscript_cntm_lot_rec:
                      subFieldLookUp.custrecord_cntm_lot_record[0].value,
                  };
                  var scriptTaskId = scriptTask.submit();
                  var status = task.checkStatus(scriptTaskId).status;
                  log.debug('additional panel :',scriptTaskId);
                }
              }
            }
          }

          if (scriptContext.type == "create" || scriptContext.type == "edit") {
            //  log.debug('1')
            var zeroCompletionMap = {}
            var finalMap = []
            var lastOperation = rec.getValue({
              fieldId: "custrecord_cntm_last_operation",
            });
            // log.audit('lastOperation :',lastOperation);

            var isScrapped = rec.getValue({
              // fieldId: "custrecord_cntm_scrapped",
              fieldId: "custrecord_cntm_previously_scrapepd",
            });
            // log.audit('isScrapped :',isScrapped);

            
            if(validateData(lastOperation) && validateData(isScrapped)){
              log.audit('---ACTUAL OPERATION---',scriptContext.type);

              var lotQty= rec.getValue({
                fieldId: "custrecord_cntm_cso_woc_quantity",
              });
              // log.audit('lotQty :',lotQty);
              
              var lotRecId = rec.getValue({
                fieldId: "custrecord_cntm_lot_record",
              });
              // log.audit('lotRecId :',lotRecId);

              var wo = rec.getValue({
                fieldId: "custrecord_cntm_work_order",
              });
              // log.audit('wo :',wo);
              
              var detailsMap = getFirstOpInternalID(wo,lotRecId)
              // log.audit('detailsMap :',detailsMap);
              
              zeroCompletionMap['lotRecId'] = lotRecId;
              zeroCompletionMap['sublistIntenalId'] = detailsMap.sublistIntenalId
              zeroCompletionMap['operationSub'] = detailsMap.operationSub
              zeroCompletionMap['scrapQtysub'] = lotQty;
              zeroCompletionMap['scrapQtyCum'] = lotQty;
              zeroCompletionMap['scrapDetailssub'] = "";
              zeroCompletionMap['qtyGoodSub'] = 0;
              zeroCompletionMap['endingoperation'] = {};
              log.audit('zeroCompletionMap :',zeroCompletionMap);


              finalMap.push(zeroCompletionMap)

              var scriptTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
              });
              scriptTask.scriptId = "customscript_cntm_mr_multiple_order_com";
              scriptTask.params = {
                custscript_cntm_mul_woc_data: JSON.stringify(finalMap),
              };

              var scriptTaskId = scriptTask.submit();
              var status = task.checkStatus(scriptTaskId).status;
              log.debug('completion for 0 qty :',scriptTaskId);


            }
          }
        
          //create 
          // last operaion and scrapped check box 
          //calll MR 
          /**
           * param scrap = purn
           * good =  0 
           * 
           */
        } catch (e) {
          log.error("error-ss trigger", e);
          record.submitFields({
            type: "customrecord_cntm_clientappsublist",
            id: rec.id,
            values: {
              // custrecord_cntm_cso_wocnumber :
              // wocId,
              custrecord_cntm_cso_status: 5,
              custrecord_cntm_cso_createwo_completion: false,
            },
          });
        }
      }
    } catch (e) {
      log.error("error", e);
    }
  }
  function getFirstOpInternalID(wo,lot){
    try {
      var map ={}
      var customrecord_cntm_clientappsublistSearchObj = search.create({
        type: "customrecord_cntm_clientappsublist",
        filters:
        [
          ["custrecord_cntm_work_order", "anyof", wo],
          "AND",
          ["custrecord_cntm_lot_record", "anyof", lot],
        ],
        columns:
        [
           search.createColumn({name: "internalid", label: "Internal ID"}),
           search.createColumn({name: "custrecord_cntm_work_order", label: "WO"}),
           search.createColumn({name: "custrecord_cntm_lot_record", label: "Lot Rec"}),
           search.createColumn({name: "custrecord_cntm_cso_operaton", sort: search.Sort.ASC, label: "Operation"})
        ]
     });
     var searchResultCount = customrecord_cntm_clientappsublistSearchObj.runPaged().count;
     log.debug("customrecord_cntm_clientappsublistSearchObj result count",searchResultCount);
     customrecord_cntm_clientappsublistSearchObj.run().each(function(result){
      map['sublistIntenalId'] = result.getValue({name: "internalid", label: "Internal ID"});
      map['operationSub'] = result.getValue({name: "custrecord_cntm_cso_operaton", sort: search.Sort.ASC, label: "Operation"});
        return false;
     });
     return map;
     
    } catch (error) {
      log.error({
        title: 'Error in getFirstOpInternalID :',
        details: error
      })
    }

  }
  function validateData(data) {
    if (data != undefined && data != null && data != "") {
      return true;
    } else {
      return false;
    }
  }
  function retry(rec) {
    try {
      var WO = rec.getValue({
        fieldId: "custrecord_cntm_lot_wonum",
      });
      var lot = rec.getValue({
        fieldId: "custrecord_cntm_lot_lotnumber",
      });
      var noOfPanels = rec.getValue({
        fieldId: "custrecord_cntm_num_of_panels",
      });
      var scriptTask = task.create({
        taskType: task.TaskType.SCHEDULED_SCRIPT,
      });
      scriptTask.scriptId = "customscript_cntm_ss_clntapp_hdr_detls";
      // scriptTask.deploymentId =
      // 'customdeploy_cntm_ss_clntapp_hdr_detls';
      scriptTask.params = {
        custscript_cntm_wo: WO,
        custscript_cntm_lotno: lot,
        custscript_cntm_lot_recid: rec.id,
        custscript_cntm_num_of_panels: noOfPanels,
        custscript_cntm_is_compltn_proces: "F",
      };

      var scriptTaskId = scriptTask.submit();
      var status = task.checkStatus(scriptTaskId).status;
      log.debug(scriptTaskId);
    } catch (e) {
      log.error("error", e);

      retry(rec);
    }
  }
  return {
    // beforeLoad : beforeLoad,
    // beforeSubmit : beforeSubmit,
    afterSubmit: afterSubmit,
  };
});
