/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @filename      Cntm_MR_Multiple_Order_Completion.js
 * @scriptname    Cntm_MR_Multiple_Order_Completion
 * @ScriptId      customscript_cntm_mr_multiple_order_com
 * @author        Vishal Naphade
 * @email         vishal.naphade@gmail.com
 * @date          23/03/2022 
 * @description   This map reduce used for completion creation in RDA
 
 * Copyright 2020, Centium Consulting its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 * Module Description
 * 
 * Sr. No   	 Date           	  Author                  	Remarks
 * 1	      	23 March 2022 		  Vishal Naphade    	 -   
 * 2			    02 Nov 2022         Vishal Naphade       - Panel Scrap changes 
 * 3          15 Nov 2022         Vishal Naphade       - added panelLot in pcb rework record
 */

////VERSION 1.1
define(["N/file", "N/record", "N/search", "N/runtime"],
    /**
     * @param {file}
     *            file
     * @param {record}
     *            record
     * @param {search}
     *            search
     */
    function(file, record, search, runtime) {
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
            //Input data from backend Suitelet
            log.debug("-----getInputData-----");
            var data = runtime.getCurrentScript().getParameter({
                name: "custscript_cntm_mul_woc_data",
            });
            log.debug("woc_data :", data);
            var woc_data = JSON.parse(data);
            // var scriptObj = runtime.getCurrentScript();
            // log.debug('Remaining governance units input: ' + scriptObj.getRemainingUsage());
            return woc_data;
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
            log.debug("-----MAP-----");
            var key = context.key;
            log.debug("key", key);
            var woc_map = JSON.parse(context.value);
            log.audit("data", woc_map);
            var isTopWorkOrderFlag = false;
            var isLastOperation = false;
            var isLotUpdated = false;
            var goodQtyFlag = false;
            try {
                var clientSubRecLookUp = search.lookupFields({
                    type: "customrecord_cntm_clientappsublist",
                    id: woc_map.sublistIntenalId,
                    columns: [
                        "custrecord_cntm_cso_parentrec",
                        "custrecord_cntm_work_order",
                        "custrecord_cntm_cso_woc_quantity",
                        "custrecord_cntm_cso_operaton",
                        "custrecord_cntm_cso_scarp_cumulative",
                        "custrecord_cntm_cso_quantity_good",
                        "custrecord_cntm_last_operation",
                        "custrecord_cntm_cso_laborsetuptime",
                        "custrecord_cntm_cso_laborruntime",
                        "custrecord_cntm_operator",
                        "custrecord_cntm_cso_wocnumber",
                        "custrecord_cntm_seq_no",
                        "custrecord_cntm_lot_record",
                        "custrecord_cntm_cso_pannellot",
                        //previus scrapped check
                        "custrecord_cntm_previously_scrapepd",
                        //last
                    ],
                });
                log.debug("clientSubRecLookUp", JSON.stringify(clientSubRecLookUp));
                // log.debug("custrecord_cntm_work_order",clientSubRecLookUp.custrecord_cntm_work_order);

                var previouslyScraped =
                    clientSubRecLookUp.custrecord_cntm_previously_scrapepd;
                // log.debug()
                var woc;
                if (clientSubRecLookUp.custrecord_cntm_cso_wocnumber) {
                    woc = clientSubRecLookUp.custrecord_cntm_cso_wocnumber[0].value;
                }

                log.debug("woc", woc);

                // if (!woc) {
                var multipleOperationId;
                var woId = clientSubRecLookUp.custrecord_cntm_work_order[0].value;
                var starting_oprtn = clientSubRecLookUp.custrecord_cntm_cso_operaton.split(
                    " "
                )[0];
                var starting_oprtn_text = clientSubRecLookUp.custrecord_cntm_cso_operaton;
                var starting_oprtn_seqNo = clientSubRecLookUp.custrecord_cntm_seq_no;
                var parent = clientSubRecLookUp.custrecord_cntm_cso_parentrec[0].value;

                var lotRecId = clientSubRecLookUp.custrecord_cntm_lot_record[0].value;
                log.debug("lotRecId", lotRecId);

                if (isNotEmpty(woc_map.endingoperation)) {
                    var ending_oprtn, ending_oprtn_text, ending_oprtn_SeqNo;
                    ending_oprtn = woc_map.endingoperation.value.split(" ")[0]; //from get input
                    // log.debug("ending_oprtn 1 ", ending_oprtn);

                    ending_oprtn_text = woc_map.endingoperation.value; //from get input
                    // log.debug("ending_oprtn_text 1", ending_oprtn_text);

                    ending_oprtn_SeqNo = woc_map.endingoperation.id; //from get input
                    // log.debug("ending_oprtn_SeqNo 1", ending_oprtn_SeqNo);
                }
                var panelLot = clientSubRecLookUp.custrecord_cntm_cso_pannellot;

                //checking good qty //qtyGoodSub
                var goodQuantity = woc_map.qtyGoodSub;
                log.audit("goodQuantity :", goodQuantity);

                //If good quantity is zero then scrap whole panel and create completion for remaining operation
                if (goodQuantity == 0) {
                    goodQtyFlag = true;
                    var lastOperation = [];
                    lastOperation = getLastOperation(parent, lotRecId);
                    // log.debug('lastOperation :',lastOperation);
                    isLastOperation = true;
                    ending_oprtn = lastOperation[0].lastOp.split(" ")[0];
                    ending_oprtn_text = lastOperation[0].lastOp;
                    ending_oprtn_SeqNo = lastOperation[0].lastSeq;
                }
                //Getting all sublist internal id for selected sequence MAP
                var idAndSequenceMap = intermediateInternalId(
                    parent,
                    starting_oprtn_seqNo,
                    ending_oprtn_SeqNo,
                    lotRecId
                );
                // log.debug("idAndSequenceMap :", idAndSequenceMap);

                var isLastOp = idAndSequenceMap.lastOp;
                //checking Multiple operation record present for that perticular startOp, endOp and sublist record
                var isMulrecordPresent = isMultipleRecordPresent(
                    starting_oprtn_text,
                    ending_oprtn_text,
                    parent
                );
                if (isMulrecordPresent == true) {
                    //Check if record is present or not
                    //IF NOT then Creating Record
                    try {
                        var multipleOperation = record.create({
                            type: "customrecord_cntm_ca_multiple_operation",
                            isDynamic: true,
                        });
                        // log.debug("1");
                        multipleOperation.setValue({
                            fieldId: "custrecord_cntm_start_operation",
                            value: starting_oprtn_text,
                        });
                        // log.debug("2");
                        multipleOperation.setValue({
                            fieldId: "custrecord_cntm_end_operation",
                            value: ending_oprtn_text,
                        });
                        // log.debug("3");

                        multipleOperation.setValue({
                            fieldId: "custrecord_cntm_ca_mul_opearation",
                            value: parent,
                        });
                        multipleOperationId = multipleOperation.save();
                        log.debug("multipleOperationId :", multipleOperationId);
                    } catch (error) {
                        log.error("Error in creatin rec", error);
                    }
                } else {
                    // log.debug("isMulrecordPresent  PRESENT :", isMulrecordPresent);
                    multipleOperationId = isMulrecordPresent;
                }

                //Checking Created from field from WO
                var woFieldLookUpWo = search.lookupFields({
                    type: "workorder",
                    id: woId,
                    columns: [
                        "quantity",
                        "custbody_cntm_no_of_panel",
                        "custbody_rda_boards_per_panel",
                        "createdfrom", //Here
                        "custbody_cntm_last_wo_id",
                    ],
                });
                //
                // log.debug("woFieldLookUpWo :", woFieldLookUpWo);
                var isTransfered = "";
                if (woFieldLookUpWo.custbody_cntm_last_wo_id.length != 0)
                    isTransfered = woFieldLookUpWo.custbody_cntm_last_wo_id[0].value;
                if (woFieldLookUpWo.createdfrom.length != 0) {
                    var createdFrom = woFieldLookUpWo.createdfrom[0].value;
                    var isCreatedFromWO = true;
                    if (createdFrom) {
                        var transactionSearchObj = search.create({
                            type: "transaction",
                            filters: [
                                ["internalid", "anyof", createdFrom],
                                "AND", ["mainline", "is", "T"],
                            ],
                            columns: ["type", "tranid"],
                        });
                        var searchResultCount = transactionSearchObj.runPaged().count;
                        log.debug("transactionSearchObj result count", searchResultCount);
                        transactionSearchObj.run().each(function(result) {
                            // .run().each has a limit of 4,000 results
                            var type = result.getValue({ name: "type" });
                            log.debug("type:", type);
                            if (type == "SalesOrd") isCreatedFromWO = false;
                            return false;
                        });
                    }
                    if (
                        (createdFrom == "" ||
                            createdFrom == null ||
                            createdFrom == undefined ||
                            isCreatedFromWO == false) &&
                        (isTransfered == "" ||
                            isTransfered == null ||
                            isTransfered == undefined)
                    ) {
                        isTopWorkOrderFlag = true;
                    }
                } else {
                    if (
                        isTransfered == "" ||
                        isTransfered == null ||
                        isTransfered == undefined
                    )
                        isTopWorkOrderFlag = true;
                }

                //Record transform from WO to WOC
                var wocObj = record.transform({
                    fromType: record.Type.WORK_ORDER,
                    fromId: woId,
                    toType: record.Type.WORK_ORDER_COMPLETION,
                    isDynamic: true,
                });

                wocObj.setText({
                    fieldId: "startoperation",
                    text: starting_oprtn,
                });

                wocObj.setText({
                    fieldId: "endoperation",
                    text: ending_oprtn,
                });

                var scrapQty = clientSubRecLookUp.custrecord_cntm_cso_scarp_cumulative;
                log.debug("scrapQty  :", scrapQty);
                var completedQty = clientSubRecLookUp.custrecord_cntm_cso_woc_quantity;
                log.debug("completedQty  :", completedQty);

                if (previouslyScraped) {
                    // completedQty = 0;
                    scrapQty = woc_map.scrapQtysub; //scrapQtyCum
                }

                log.debug("scrapQty later :", scrapQty);
                // log.debug("completedQty later :", completedQty);

                log.audit(
                    "isLastOp :",
                    isLastOp + "isTopWorkOrderFlag :" + isTopWorkOrderFlag
                );

                if (isLastOp == true && (isTopWorkOrderFlag || goodQtyFlag)) {
                    // log.audit("---true---");
                    // log.debug("IF isLastOp == true && isTopWorkOrderFlag");
                    completedQty = Number(completedQty) - Number(scrapQty); //clientSubRecLookUp.custrecord_cntm_cso_quantity_good;
                }
                wocObj.setValue({
                    fieldId: "completedquantity",
                    // value: completedQty, //clientSubRecLookUp.custrecord_cntm_cso_quantity_good,
                    value: previouslyScraped == true ? 0 : completedQty, //clientSubRecLookUp.custrecord_cntm_cso_quantity_good,
                });

                // previouslyScraped == true ? 0 : completedQty,

                if (isLastOp == true) {
                    wocObj.setValue({
                        fieldId: "quantity",
                        value: completedQty, //clientSubRecLookUp.custrecord_cntm_cso_quantity_good,
                        value: previouslyScraped == true ? 0 : completedQty,
                    });
                    // var scrapQty = 0;
                    if (isTopWorkOrderFlag || goodQtyFlag || previouslyScraped) {
                        log.debug("Inside istopworkingflag");
                        //completedQty = clientSubRecLookUp.custrecord_cntm_cso_quantity_good;
                        wocObj.setValue({
                            fieldId: "scrapquantity",
                            value: scrapQty,
                        });
                    }

                    if (parseInt(completedQty) > 0) {
                        // log.debug("IF completedQty :", completedQty + "panelLot :", panelLot);
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
                    // Setting operator - Commented Here Because it is setting on the completion which having last operation.
                    //  if (clientSubRecLookUp.custrecord_cntm_operator[0])
                    //      wocObj.setValue({
                    //        fieldId: "custbody_cntm_op_client_app",
                    //        value: clientSubRecLookUp.custrecord_cntm_operator[0].value,
                    //      });

                    wocObj.setValue({
                        //Check to trigger TO creation
                        fieldId: "custbody_cntm_last_op_check",
                        value: true,
                    });
                    log.debug("checkk SETTED true");
                }

                if (clientSubRecLookUp.custrecord_cntm_operator[0])
                    wocObj.setValue({
                        fieldId: "custbody_cntm_op_client_app",
                        value: clientSubRecLookUp.custrecord_cntm_operator[0].value,
                    });

                var operationLine = wocObj.getLineCount({
                    sublistId: "operation",
                });
                if (operationLine > 0) {
                    for (var i = 0; i < operationLine; i++) {
                        var opSeq = wocObj.getSublistValue({
                            sublistId: "operation",
                            fieldId: "operationsequence",
                            line: i,
                        });
                        var mapIndex = idAndSequenceMap.seq.indexOf(opSeq.toString());
                        if (mapIndex != -1) {
                            wocObj.selectLine({
                                sublistId: "operation",
                                line: i,
                            });
                            wocObj.setCurrentSublistValue({
                                sublistId: "operation",
                                fieldId: "recordsetup", // 'checkbox',
                                value: true,
                            });
                            wocObj.setCurrentSublistValue({
                                sublistId: "operation",
                                fieldId: "laborsetuptime", // 'setuptime',
                                // value: clientSubRecLookUp.custrecord_cntm_cso_laborsetuptime,
                                // value:goodQuantity == 0 ? 0 : idAndSequenceMap.runTimes[mapIndex].setup, //woc_map.laborSetupSub,
                                value: goodQuantity == 0 ?
                                    0 : Number(idAndSequenceMap.runTimes[mapIndex].setup).toFixed(
                                        6
                                    ),
                            });
                            // log.audit("----------Value 1  :", idAndSequenceMap.runTimes[mapIndex].setup);
                            wocObj.setCurrentSublistValue({
                                sublistId: "operation",
                                fieldId: "laborruntime", // 'runrate',
                                // value: clientSubRecLookUp.custrecord_cntm_cso_laborruntime,
                                // value: goodQuantity == 0 ? 0 : idAndSequenceMap.runTimes[mapIndex].run, //woc_map.laborRunSub,
                                value: goodQuantity == 0 ?
                                    0 : Number(idAndSequenceMap.runTimes[mapIndex].run).toFixed(6),
                            });
                            // log.debug("Value  :", woc_map.laborSetupSub);
                            // log.audit("----------Value 2  :", idAndSequenceMap.runTimes[mapIndex].run);
                            wocObj.commitLine({
                                sublistId: "operation",
                            });
                        }
                        //if (starting_oprtn == opSeq.toString() && goodQuantity != 0)
                        //  break;
                    }
                } //END OF IF

                var boardsPerPanel = woFieldLookUpWo.custbody_rda_boards_per_panel;
                var noOfPanels = woFieldLookUpWo.custbody_cntm_no_of_panel;
                log.debug("boardsPerPanel ", boardsPerPanel);
                log.debug("noOfPanels ", noOfPanels);
                if (woc_map.scrapQtyCum)
                    log.audit(
                        "woc_map.scrapQtyCum :" +
                        woc_map.scrapQtyCum +
                        " woc_map.lotRecId :" +
                        woc_map.lotRecId
                    );
                record.submitFields({
                    type: "customrecord_cntm_lot_creation",
                    id: woc_map.lotRecId,
                    values: {
                        custrecord_cntm_cumulative_scrap_qty: woc_map.scrapQtyCum,
                        custrecord_cntm_scraped_panel: isLastOperation == true ? true : false,
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true,
                    },
                });
                isLotUpdated = true;
                var totalScrappedPanel = totalScrapedPanelFun(woId);
                log.debug("totalScrappedPanel :", totalScrappedPanel);

                var scrapCount = 0;
                var goodQty = 0;
                var cumScrap = 0;
                cumScrap = cumScrapQty(woId);
                log.debug("cumScrap :", cumScrap);

                var customrecord_cntm_lot_creationSearchObj2 = search.create({
                    type: "customrecord_cntm_lot_creation",
                    filters: [
                        ["custrecord_cntm_lot_wonum", "anyof", woId]
                    ],
                    columns: ["custrecord_cntm_cumulative_scrap_qty"],
                });

                var searchResultCount = customrecord_cntm_lot_creationSearchObj2.runPaged()
                    .count;
                log.debug("searchResultCount :", searchResultCount);
                //error

                if (boardsPerPanel && noOfPanels) {
                    scrapCount = boardsPerPanel * searchResultCount - cumScrap;
                    goodQty = noOfPanels * boardsPerPanel - cumScrap;
                }
                log.debug("scrapCount :", scrapCount);
                log.debug("noOfPanels :", noOfPanels);
                log.debug("goodQty :", goodQty);

                // var scriptObj = runtime.getCurrentScript();
                // log.debug('Remaining governance units map: ' + scriptObj.getRemainingUsage());

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
                // log.debug("1");
                wocObj.setValue({
                    fieldId: "custbody_cntm_wco_good_boards",
                    value: Number(boardsPerPanel) - (scrapQty ? Number(scrapQty) : 0),
                });
                // log.debug("2");
                wocObj.setValue({
                    fieldId: "custbody_cntm_wco_scrap_boards",
                    value: scrapQty ? Number(scrapQty) : 0,
                });
                // log.debug("3");
                wocObj.setValue({
                    fieldId: "custbody_cntm_wco_good_panels",
                    value: goodQuantity == 0 ? 0 : 1,
                });
                // log.debug("4");
                wocObj.setValue({
                    fieldId: "custbody_cntm_wco_scrap_panel",
                    value: goodQuantity == 0 ? 1 : 0,
                });
                // log.debug("5");
                wocObj.setValue({
                    fieldId: "custbody_cntm_good_boards",
                    value: goodQty,
                });
                // log.debug("6");
                wocObj.setValue({
                    fieldId: "custbody_cntm_scrapped_boards",
                    value: cumScrap,
                });
                // log.debug("7");
                wocObj.setValue({
                    fieldId: "custbody_cntm_good_panels",
                    value: searchResultCount - totalScrappedPanel,
                });
                // log.debug("8");
                wocObj.setValue({
                    fieldId: "custbody_cnt_scrapped_panels",
                    value: totalScrappedPanel,
                });
                // log.debug("9");
                //Setting lotrec id - used in Transfer order flow
                wocObj.setValue({
                    fieldId: "custbody_cntm_lot_recid",
                    value: lotRecId,
                });
                // log.debug("10");
                wocObj.setValue({
                    fieldId: "custbody_cntm_panel_lot",
                    value: lotRecId,
                });
                // log.debug("11");
                // wocObj.setValue({
                //   fieldId:'custbody_cntm_last_op_check',
                //   value :isLastOperationCheck
                // });

                var wocId = wocObj.save({
                    //ignoreMandatoryFields: true,
                });
                log.debug("TRANSFORMED", wocId);
                // log.debug("TRANSFORMED dummy", wocId1);


                //setting WOC id on Mul-Op record
                record.submitFields({
                    type: "customrecord_cntm_ca_multiple_operation",
                    id: multipleOperationId,
                    values: {
                        custrecord_cntm_woc_id: wocId,
                    },
                });
                log.debug("SECOND");

                // var scriptObj = runtime.getCurrentScript();
                // log.debug('Remaining governance units map 1: ' + scriptObj.getRemainingUsage());

                var sublistArr = idAndSequenceMap.subInternalId;
                log.debug('sublistArr', sublistArr);
                for (var j = 0; j < sublistArr.length; j++) {
                    record.submitFields({
                        type: "customrecord_cntm_clientappsublist",
                        id: sublistArr[j],
                        values: {
                            custrecord_cntm_cso_status: 4,
                            custrecord_cntm_cso_scrap_quantity: woc_map.scrapQtysub,
                            custrecord_cntm_cso_scarp_cumulative: woc_map.scrapQtyCum,
                            custrecord_cntm_cso_quantity_good: woc_map.qtyGoodSub,
                            custrecord_cntm_cso_scarpreason: woc_map.scrapDetailssub,
                            custrecord_cntm_cso_createwo_completion: false,
                            // custrecord_cntm_cso_laborsetuptime: woc_map.laborSetupSub,
                            // custrecord_cntm_cso_laborruntime: woc_map.laborRunSub,
                            custrecord_cntm_operator: woc_map.clientopid,
                            custrecord_cnrm_multiple_op: multipleOperationId,
                            custrecord_cntm_cso_wocnumber: wocId,
                            custrecord_cntm_scrapped: isLastOperation == true ? true : false,
                            custrecord_cntm_old_clientapp_process: false,
                        },
                    });
                }

                //HERE need to add rework map

                var responseObj = {};

                if (woc_map.hasOwnProperty("reworkInfo")) {
                    if (woc_map.reworkInfo.length > 0) {
                        responseObj.starting_oprtn = starting_oprtn;
                        responseObj.starting_oprtn_text = starting_oprtn_text;
                        responseObj.starting_oprtn_seqNo = starting_oprtn_seqNo;
                        responseObj.ending_oprtn = ending_oprtn;
                        responseObj.ending_oprtn_SeqNo = ending_oprtn_SeqNo;
                        responseObj.ending_oprtn_text = ending_oprtn_text;
                        responseObj.wocId = wocId;
                        responseObj.woId = woId;
                        responseObj.reworkInfo = woc_map.reworkInfo; //HERE NEED TO LOOK
                        responseObj.opId =
                            clientSubRecLookUp.custrecord_cntm_operator[0].value;
                        responseObj.panelLot = panelLot;
                    }
                }

                context.write({
                    key: wocId,
                    value: responseObj,
                });

                // log.audit("final");
            } catch (error) {
                log.error("ERROR In MAP :", error);

                var wocIdNew = searchCompletion(starting_oprtn, ending_oprtn, woc_map.lotRecId)
                log.debug('wocIdNew :', wocIdNew);
                //check if completion is created or not if created then update records accordingly.
                if (validateData(wocIdNew)) {
                    log.error("if");

                    var sublistArr = idAndSequenceMap.subInternalId;
                    for (var j = 0; j < sublistArr.length; j++) {
                        record.submitFields({
                            type: "customrecord_cntm_clientappsublist",
                            id: sublistArr[j],
                            values: {
                                custrecord_cntm_cso_status: 4,
                                custrecord_cntm_cso_scrap_quantity: woc_map.scrapQtysub,
                                custrecord_cntm_cso_scarp_cumulative: woc_map.scrapQtyCum,
                                custrecord_cntm_cso_quantity_good: woc_map.qtyGoodSub,
                                custrecord_cntm_cso_scarpreason: woc_map.scrapDetailssub,
                                custrecord_cntm_cso_createwo_completion: false,
                                // custrecord_cntm_cso_laborsetuptime: woc_map.laborSetupSub,
                                // custrecord_cntm_cso_laborruntime: woc_map.laborRunSub,
                                custrecord_cntm_operator: woc_map.clientopid,
                                custrecord_cnrm_multiple_op: multipleOperationId,
                                custrecord_cntm_cso_wocnumber: wocId,
                                custrecord_cntm_scrapped: isLastOperation == true ? true : false,
                                custrecord_cntm_old_clientapp_process: false,
                            },
                        });
                    }
                } else {
                    //log error in record
                    log.error("else");
                    record.submitFields({
                        type: "customrecord_cntm_ca_multiple_operation",
                        id: multipleOperationId,
                        values: {
                            custrecord_cntm_error_in_completion: error.message,
                        },
                    });
                    if (woc_map.lotRecId && isLotUpdated == true && woc_map.scrapQtyCum) {
                        var lotLookup = search.lookupFields({
                            type: "customrecord_cntm_lot_creation",
                            id: woc_map.lotRecId,
                            columns: ["custrecord_cntm_cumulative_scrap_qty"],
                        });
                        var scrpQt = lotLookup.custrecord_cntm_cumulative_scrap_qty;
                        record.submitFields({
                            type: "customrecord_cntm_lot_creation",
                            id: woc_map.lotRecId,
                            values: {
                                custrecord_cntm_cumulative_scrap_qty: Number(scrpQt) - Number(woc_map.scrapQtyCum),
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true,
                            },
                        });
                    }

                    for (var j = 0; j < idAndSequenceMap.subInternalId.length; j++) {
                        record.submitFields({
                            type: "customrecord_cntm_clientappsublist",
                            id: idAndSequenceMap.subInternalId[j],
                            values: {
                                custrecord_cntm_completion_error: error.message,
                                custrecord_cntm_cso_status: j == 0 ? 5 : 1, //failed
                                custrecord_cntm_cso_createwo_completion: false,
                                custrecord_cntm_old_clientapp_process: false,
                            },
                        });
                    }

                }


                //to be uncommented later
            }
        }

        function isNotEmpty(obj) {
            return obj && JSON.stringify(obj) != "{}";
        }

        function validateData(data) {
            if (data != undefined && data != null && data != "") {
                return true;
            } else {
                return false;
            }
        }

        function searchCompletion(starting_oprtn, ending_oprtn, lotRecId) {
            try {
                var wocid;
                var workordercompletionSearchObj = search.create({
                    type: "workordercompletion",
                    filters: [
                        ["type", "anyof", "WOCompl"],
                        "AND", ["custbody_cntm_startoperation", "is", starting_oprtn],
                        "AND", ["custbody_cntm_endoperation", "is", ending_oprtn],
                        "AND", ["custbody_cntm_panel_lot", "anyof", lotRecId],
                        "AND", ["mainline", "is", "T"]
                    ],
                    columns: [
                        search.createColumn({ name: "tranid", label: "Document Number" }),
                        search.createColumn({ name: "custbody_cntm_startoperation", label: "Starting Operation" }),
                        search.createColumn({ name: "custbody_cntm_endoperation", label: "Ending Operation" }),
                        search.createColumn({ name: "custbody_cntm_lot_recid", label: "Lot Record id" }),
                        search.createColumn({ name: "custbody_cntm_panel_lot", label: "Panel Lot" }),
                        search.createColumn({ name: "custbody_cntm_lot_from_completion", label: "Panel lot" })
                    ]
                });
                var searchResultCount = workordercompletionSearchObj.runPaged().count;
                log.debug("workordercompletionSearchObj result count", searchResultCount);
                if (searchResultCount > 0) {
                    workordercompletionSearchObj.run().each(function(result) {
                        wocid = result.id;
                        return false;
                    });

                    return wocid;
                } else {
                    return false
                }

            } catch (error) {
                log.error('Error in search completion :', error)
            }
        }

        function intermediateInternalId(parentRec, firstOp, endOp, lotRec) {
            var resArray = [];
            var seqArray = [];
            var lastOpArray = [];
            var runTimes = [];
            var tempObj = {};
            var customrecord_cntm_clientappsublistSearchObj = search.create({
                type: "customrecord_cntm_clientappsublist",
                filters: [
                    ["custrecord_cntm_cso_parentrec", "anyof", parentRec],
                    "AND", ["custrecord_cntm_seq_no", "between", firstOp, endOp],
                    "AND", ["custrecord_cntm_lot_record", "anyof", lotRec],
                ],
                columns: [
                    search.createColumn({
                        name: "custrecord_cntm_seq_no",
                        label: "Sequence No",
                    }),
                    search.createColumn({
                        name: "custrecord_cntm_cso_operaton",
                        label: "Operation",
                    }),
                    search.createColumn({
                        name: "custrecord_cntm_work_order",
                        label: "WO",
                    }),
                    search.createColumn({
                        name: "custrecord_cntm_last_operation",
                        label: "Last Operation",
                    }),
                    search.createColumn({
                        name: "custrecord_cntm_cso_laborsetuptime",
                        label: "Labor Setup time",
                    }),
                    search.createColumn({
                        name: "custrecord_cntm_cso_laborruntime",
                        label: "Labor Run time",
                    }),
                ],
            });
            var searchResultCount = customrecord_cntm_clientappsublistSearchObj.runPaged()
                .count;
            log.debug(
                "customrecord_cntm_clientappsublistSearchObj result count",
                searchResultCount
            );
            customrecord_cntm_clientappsublistSearchObj.run().each(function(result) {
                var seq = result.getValue({
                    name: "custrecord_cntm_cso_operaton",
                    label: "Operation",
                });
                var opId = seq.split(" ")[0].substring(0, 4);

                var lastOp = result.getValue({
                    name: "custrecord_cntm_last_operation",
                    label: "Last Operation",
                });
                var timeMap = {};
                timeMap["run"] = result.getValue({
                    name: "custrecord_cntm_cso_laborruntime",
                    label: "Labor Run time",
                });
                timeMap["setup"] = result.getValue({
                    name: "custrecord_cntm_cso_laborsetuptime",
                    label: "Labor Setup time",
                });
                runTimes.push(timeMap);
                resArray.push(result.id);
                seqArray.push(opId);
                if (lastOp == true || lastOp == "T") {
                    tempObj["lastOp"] = true;
                } else {
                    tempObj["lastOp"] = false;
                }
                return true;
            });
            // log.debug("seqArray :", seqArray);
            tempObj["subInternalId"] = resArray;
            tempObj["seq"] = seqArray;
            tempObj["runTimes"] = runTimes;
            // tempObj["isLastOp"] = lastOpArray;

            return tempObj;
        }

        function cumScrapQty(id) {
            log.debug("INSIDE FUNCTION cumScrapQty");
            var totalCumScrap = 0;
            var customrecord_cntm_lot_creationSearchObj2 = search.create({
                type: "customrecord_cntm_lot_creation",
                filters: [
                    ["custrecord_cntm_lot_wonum", "anyof", id]
                ],
                columns: ["custrecord_cntm_cumulative_scrap_qty"],
            });

            // log.debug('noOfPanels :',noOfPanels);
            var searchResultCount = customrecord_cntm_lot_creationSearchObj2.runPaged()
                .count;
            customrecord_cntm_lot_creationSearchObj2.run().each(function(result) {
                if (result.getValue({ name: "custrecord_cntm_cumulative_scrap_qty" }))
                    totalCumScrap += parseInt(
                        result.getValue({ name: "custrecord_cntm_cumulative_scrap_qty" })
                    );
                return true;
            });
            log.debug("totalCumScrap :", totalCumScrap);
            return totalCumScrap;
        }

        function totalScrapedPanelFun(id) {
            var totalScrappedPanel = 0;
            var customrecord_cntm_lot_creationSearchObj = search.create({
                type: "customrecord_cntm_lot_creation",
                filters: [
                    ["custrecord_cntm_lot_wonum", "anyof", id],
                    "AND", ["custrecord_cntm_scraped_panel", "is", "T"],
                ],
                columns: [
                    "custrecord_cntm_num_of_panels",
                    "custrecord_cntm_brds_per_panel",
                ],
            });
            totalScrappedPanel = customrecord_cntm_lot_creationSearchObj.runPaged()
                .count;
            return totalScrappedPanel;
        }

        function isMultipleRecordPresent(firstOp, endOp, parent) {
            var mulRecId;
            var customrecord_cntm_ca_multiple_operationSearchObj = search.create({
                type: "customrecord_cntm_ca_multiple_operation",
                filters: [
                    ["custrecord_cntm_start_operation", "is", firstOp],
                    "AND", ["custrecord_cntm_end_operation", "is", endOp],
                    "AND", ["custrecord_cntm_ca_mul_opearation", "anyof", parent],
                ],
                columns: [
                    search.createColumn({
                        name: "scriptid",
                        sort: search.Sort.ASC,
                        label: "Script ID",
                    }),
                    search.createColumn({
                        name: "custrecord_cntm_start_operation",
                        label: "Start Operation",
                    }),
                    search.createColumn({
                        name: "custrecord_cntm_end_operation",
                        label: "End Operation",
                    }),
                    search.createColumn({
                        name: "custrecord_cntm_create_completion",
                        label: "Create WO Completion",
                    }),
                    search.createColumn({
                        name: "custrecord_cntm_ca_mul_opearation",
                        label: "Client App Header",
                    }),
                    search.createColumn({
                        name: "custrecord_cntm_error_in_completion",
                        label: "Error in completion",
                    }),
                ],
            });
            var searchResultCount = customrecord_cntm_ca_multiple_operationSearchObj.runPaged()
                .count;
            log.debug(
                "customrecord_cntm_ca_multiple_operationSearchObj result count",
                searchResultCount
            );
            if (searchResultCount == 0) {
                return true;
            } else {
                customrecord_cntm_ca_multiple_operationSearchObj
                    .run()
                    .each(function(result) {
                        mulRecId = result.id;
                        return true;
                    });
                return mulRecId;
            }
        }

        function getLastOperation(headerRecId, lotRecId) {
            log.debug("FUNCTION");
            var forLastOp = [];

            var customrecord_cntm_clientappsublistSearchObj = search.create({
                type: "customrecord_cntm_clientappsublist",
                filters: [
                    ["custrecord_cntm_cso_parentrec", "anyof", headerRecId],
                    "AND", ["custrecord_cntm_lot_record", "anyof", lotRecId],
                    "AND", ["custrecord_cntm_last_operation", "is", "T"],
                ],
                columns: [
                    search.createColumn({
                        name: "custrecord_cntm_cso_operaton",
                        label: "Operation",
                    }),
                    search.createColumn({
                        name: "custrecord_cntm_seq_no",
                        label: "Sequence No",
                    }),
                ],
            });
            var searchResultCount = customrecord_cntm_clientappsublistSearchObj.runPaged()
                .count;
            log.debug(
                "customrecord_cntm_clientappsublistSearchObj result count",
                searchResultCount
            );
            customrecord_cntm_clientappsublistSearchObj.run().each(function(result) {
                var tempObj = {};
                var lastSeq = result.getValue({
                    name: "custrecord_cntm_seq_no",
                    label: "Sequence No",
                });
                var lastOp = result.getValue({
                    name: "custrecord_cntm_cso_operaton",
                    label: "Operation",
                });

                tempObj["lastSeq"] = lastSeq;
                tempObj["lastOp"] = lastOp;
                forLastOp.push(tempObj);
                return true;
            });
            return forLastOp;
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
            log.debug("---REDUCE ---");
            var dataObj = JSON.parse(context.values[0]);
            log.debug("dataObj :", dataObj);

            if (isNotEmpty(dataObj)) {
                var startOp = dataObj.starting_oprtn;
                var startOpText = dataObj.starting_oprtn_text;
                var startOpSeq = dataObj.starting_oprtn_seqNo;
                var endOp = dataObj.ending_oprtn;
                var endOpSeq = dataObj.ending_oprtn_SeqNo;
                var endOpText = dataObj.ending_oprtn_text;
                var wocId = dataObj.wocId;
                var woId = dataObj.woId;
                var reworkInfoObj = dataObj.reworkInfo;
                var opid = dataObj.opId;
                var panelLot = dataObj.panelLot;

                if (dataObj.reworkInfo) {
                    createReworkRecord(
                        woId,
                        wocId,
                        startOp,
                        startOpText,
                        endOp,
                        endOpText,
                        reworkInfoObj,
                        opid,
                        panelLot
                    );
                }
            }
        }

        function isNotEmpty(obj) {
            return obj && JSON.stringify(obj) != "{}";
        }

        function createReworkRecord(
            woId,
            wocId,
            startOp,
            startOpText,
            endOp,
            endOpText,
            reworkInfoObj,
            opid,
            panelLot
        ) {
            try {
                var parentRecObj = record.create({
                    type: "customrecord_cntm_pcb_rework",
                });

                parentRecObj.setValue({
                    fieldId: "custrecord_cntm_pcb_rework_wo_ref",
                    value: woId,
                });
                parentRecObj.setValue({
                    fieldId: "custrecord_cntm_pcbwoc_ref",
                    value: wocId,
                });
                parentRecObj.setValue({
                    fieldId: "custrecord_cntm_first_opseq",
                    value: startOp,
                });
                parentRecObj.setValue({
                    fieldId: "custrecord_cntm_first_optext",
                    value: startOpText,
                });
                parentRecObj.setValue({
                    fieldId: "custrecord_cntm_last_opseq",
                    value: endOp,
                });
                parentRecObj.setValue({
                    fieldId: "custrecord_cntm_last_optext",
                    value: endOpText,
                });

                parentRecObj.setValue({
                    fieldId: "custrecord_cntm_op_name",
                    value: opid,
                });
                parentRecObj.setValue({
                    fieldId: "custrecord_cntm_lot_number",
                    value: panelLot,
                });

                var parentRecId = parentRecObj.save();
                log.audit("parentRecId :", parentRecId);

                if (parentRecId) {
                    createSubRecord(woId, wocId, parentRecId, reworkInfoObj);
                }
            } catch (error) {
                log.error("Error in createReworkRecord :", error);
            }
        }

        function createSubRecord(woId, wocId, parentRecId, reworkInfoObj) {
            try {
                // var parseReworkInfo = JSON.parse(reworkInfoObj);
                log.debug("reworkInfoObj :", reworkInfoObj);
                // var parseReworkInfo = reworkInfoObj;
                for (var i = 0; i < reworkInfoObj.length; i++) {
                    var reworkQty = reworkInfoObj[i]["qty"];
                    var reason = reworkInfoObj[i]["reworkreasonid"];
                    log.debug("reworkQty :", reworkQty);
                    log.debug("reason :", reason);

                    var reworkRec = record.create({
                        type: "customrecord_cntm_pcb_rework_subrecord",
                    });

                    reworkRec.setValue({
                        fieldId: "custrecord_cntm_sub_wo",
                        value: woId,
                    });
                    reworkRec.setValue({
                        fieldId: "custrecord_cntm_sub_woc",
                        value: wocId,
                    });

                    reworkRec.setValue({
                        fieldId: "custrecord_cntm_sub_quantity",
                        value: reworkQty,
                    });
                    reworkRec.setValue({
                        fieldId: "custrecord_cntm_sub_rework_reason",
                        value: reason,
                    });
                    reworkRec.setValue({
                        fieldId: "custrecord_cntm_sub_pcb_rework",
                        value: parentRecId,
                    });
                    var childRecId = reworkRec.save();
                    log.audit("childRecId :", childRecId);
                }
            } catch (error) {
                log.error("error in createSubRecord :", error);
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
                summary.mapSummary.errors
                    .iterator()
                    .each(function(key, error, executionNo) {
                        log.error({
                            title: "Map error for key: " + key + ", execution no.  " + executionNo,
                            details: error,
                        });
                        return true;
                    });
            } catch (error) {
                log.error("Error in Summary :", error);
            }
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize,
        };
    });