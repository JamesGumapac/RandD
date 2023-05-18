/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @scriptname    Cntm_UE_lot_and_rec
 * @ScriptId     customscript_cntm_ue_lot_and_rec
 * @author        Vishal Naphade
 * @email         vishal.naphade@centium.net
 * @date          18/05/2022
 * @description
 * @Script_id    1830
 *
 * Copyright 2020, Centium Consulting its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 * Module Description
 *
 * Sr. No   	 Date           	  Author                  	Remarks
 * 1		 	18 May 2022	      Vishal Naphade    	     -
 * 2			27 May 2022       Vishal Naphade             - Added condition for hiding operation btn for old wo's
 * 3            26 sept 2022      Vishal Naphade             - Added code for setvalue of 'custbody_cnt_created_fm_so'
 * 4            29 sept 2022      Vishal Naphade             - Handled for lot (if new item added on line)
 * 5            04 Oct 2022       Vishal  Naphade            - Added xedit code 
 * 6            23 Nov 2022       Vishal  Naphade            - Added code to create WO if WO is in In Process.
 * 7            18 Jan 2023       Vishal Naphade             - Added code to default fields   
 */

//For testing removed xedit code 

define(["N/record", "N/runtime", "N/search", "N/ui/serverWidget", "N/task"],
    /**
     * @param {record}
     *            record
     * @param {runtime}
     *            runtime
     * @param {search}
     *            search
     * @param {serverWidget}
     *            serverWidget
     */
    function(record, runtime, search, serverWidget, task) {
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
            try {
                // log.audit("----Before load Triggered ----:"+scriptContext.newRecord.id +  ",type:" + scriptContext.type);

                var woId = scriptContext.newRecord.id;

                if (scriptContext.type == "view") {
                    scriptContext.form.clientScriptModulePath =
                        "./Cntm_CS_WO_check_box_and_function.js";

                    // scriptContext.form.addButton({
                    //   id: "custpage_custom_record",
                    //   label: "Create Custom Operation",
                    //   functionName: 'createHeaderAndSublistRecord('+woId+')'
                    // });

                    //IS ASM check box
                    var isPcb_wo = scriptContext.newRecord.getValue({
                        fieldId: "custbody_cntm_is_asm_wo",
                    });

                    if (!isPcb_wo) {
                        //PCB work order
                        var woId = scriptContext.newRecord.id;
                        // log.debug("woId :", woId);

                        var hide_button_check = scriptContext.newRecord.getValue({
                            fieldId: "custbody_cntm_custom_rec_ref_hide", //custbody_cntm_ref_for_btn_hide
                        });
                        // log.debug("hide_button_check :", hide_button_check);

                        if (!hide_button_check) {
                            //False
                            // log.debug("if , hide_button_check ");

                            scriptContext.form.removeButton("entercompletionwithbackflush");
                            scriptContext.form.removeButton("issuecomponents");
                            scriptContext.form.removeButton("entercompletion");

                            var count = isRecordPresent(woId);
                            if (count == 0) {
                                scriptContext.form.addButton({
                                    id: "custpage_custom_record",
                                    label: "Create Client App Operations",
                                    functionName: "createHeaderAndSublistRecord(" + woId + ")",
                                });
                            }
                        } else {
                            //true
                            // log.debug("else , hide_button_check ");
                            scriptContext.form.removeButton("custpage_updatebtn");
                        }
                    }
                }
                //for setting salesOrder ref in case of stock board WO
                if (scriptContext.type == "create") {
                    if (runtime.executionContext == "USERINTERFACE") {
                        var createdFrom = scriptContext.newRecord.getValue({
                            fieldId: "createdfrom",
                        });
                        log.audit("createdFrom :", createdFrom);
                        if (createdFrom) {
                            scriptContext.newRecord.setValue({
                                fieldId: "custbody_cnt_created_fm_so",
                                value: createdFrom,
                            });
                            log.debug("created from setted");
                        }
                    }
                }

                //  log.audit("----Before load End ----" ) 
            } catch (error) {
                log.error("Error in before load :", error);
            }
        }

        function isRecordPresent(WO) {
            var customrecord_cntm_clientapp_headerSearchObj = search.create({
                type: "customrecord_cntm_clientapp_header",
                filters: [
                    ["custrecord_cntm_cah_jobnumber", "anyof", WO]
                ],
                columns: [
                    search.createColumn({
                        name: "scriptid",
                        sort: search.Sort.ASC,
                        label: "Script ID",
                    }),
                ],
            });
            var searchResultCount =
                customrecord_cntm_clientapp_headerSearchObj.runPaged().count;
            log.debug(
                "customrecord_cntm_clientapp_headerSearchObj result count",
                searchResultCount
            );

            return searchResultCount;
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


            log.audit("AFTER SUBMIT :" + scriptContext.newRecord.id, "TYPE :" + scriptContext.type + " , executionContext :" + runtime.executionContext);
            try {
                if (scriptContext.type == "create" || scriptContext.type == "edit") {

                    //uncheck the check box because button is not visible on created WO's.
                    //Here added userinterface because in case of INPROCESS order
                    if (scriptContext.type == "create" && (runtime.executionContext == runtime.ContextType.USEREVENT || runtime.executionContext == runtime.ContextType.USERINTERFACE)) {
                        record.submitFields({
                            type: record.Type.WORK_ORDER,
                            id: scriptContext.newRecord.id,
                            values: { custbody_cntm_custom_rec_ref_hide: false },
                        })
                    }
                    // if(scriptContext.type == "edit" && (runtime.executionContext == runtime.ContextType.MAPREDUCE || runtime.executionContext == runtime.ContextType.USERINTERFACE   )){ //MAPREDUCE //USERINTERFACE
                    if (scriptContext.type == "edit") { //MAPREDUCE //USERINTERFACE
                        var newRouting = scriptContext.newRecord.getValue('manufacturingrouting')
                        log.debug('newRouting :', newRouting);
                        var oldRouting = scriptContext.oldRecord.getValue('manufacturingrouting')
                        log.debug('oldRouting :', oldRouting);


                        // if((newRouting != oldRouting) && !validateData(oldRouting) && !validateData(newRouting)){
                        if ((newRouting != oldRouting) && validateData(oldRouting) && validateData(newRouting)) {
                            record.submitFields({
                                type: record.Type.WORK_ORDER,
                                id: scriptContext.newRecord.id,
                                values: { custbody_cntm_routing_check: true },
                            })
                        }
                    }
                    var toProcessLot = false;
                    var remakeFlag = false;
                    var woID = scriptContext.newRecord.id;
                    var woLoad = record.load({
                        type: record.Type.WORK_ORDER,
                        id: woID,
                    });
                    var status = woLoad.getValue({ fieldId: "status" });
                    if (status == "In Process") {
                        log.debug("---- In PROCESS---");

                        var customer = woLoad.getValue({ fieldId: "entity" });

                        log.debug("customer ip", customer);
                        var pcb_rec = woLoad.getValue({ fieldId: "custbody_pcb_rec_id" });
                        var boardsPerPanel = woLoad.getValue({ fieldId: "custbody_rda_boards_per_panel" });

                        var numLines = woLoad.getLineCount({
                            sublistId: "item",
                        });

                        log.debug("numlines ip", numLines);
                        for (var i = 0; i < numLines; i++) {
                            var bom, routing;
                            var remakeWoCheck = woLoad.getSublistValue({
                                sublistId: "item",
                                fieldId: "custcol_cntm_is_remake_wo",
                                line: i,
                            });
                            // log.debug("remakeWoCheck ip", remakeWoCheck);


                            var existingWoid = woLoad.getSublistValue({
                                sublistId: "item",
                                fieldId: "woid",
                                line: i,
                            });
                            // log.debug("existingWoid", existingWoid);

                            var itemSource = woLoad.getSublistText({
                                sublistId: "item",
                                fieldId: "itemsource",
                                line: i,
                            });
                            // log.debug("itemSource", itemSource);

                            if (remakeWoCheck == true && !validateData(existingWoid) && itemSource == "Work Order") {
                                log.debug("---Line requiring wo exists---line ip: ", i);

                                var currentitem = woLoad.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "item",
                                    line: i,
                                });

                                var currentitemtext = woLoad.getSublistText({
                                    sublistId: "item",
                                    fieldId: "item",
                                    line: i,
                                });
                                log.debug("item ip", currentitem);
                                var woline = woLoad.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "line",
                                    line: i,
                                });
                                var lotRemake = woLoad.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "custcol_cntm_lot_for_remake",
                                    line: i,
                                });
                                log.debug("lotRemake ip:", lotRemake);

                                var qty = woLoad.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "quantity",
                                    line: i,
                                });
                                log.debug("qty ip", qty);

                                var lineNumber = woLoad.findSublistLineWithValue({
                                    sublistId: "item",
                                    fieldId: "item",
                                    value: currentitem,
                                });

                                log.debug("lineNumber ip", lineNumber);

                                var manufacturingroutingSearchObj = search.create({
                                    type: "manufacturingrouting",
                                    filters: [
                                        ["custrecord_cntm_fabrec_id", "anyof", pcb_rec],
                                        "AND", ["isdefault", "is", "T"],
                                        "AND", ["name", "contains", currentitemtext],
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
                                        search.createColumn({ name: "location", label: "Location" }),
                                        search.createColumn({
                                            name: "internalid",
                                            label: "Internal ID",
                                        }),
                                    ],
                                });
                                var searchResultCount = manufacturingroutingSearchObj.runPaged().count;
                                log.debug("manufacturingroutingSearchObj result count ip", searchResultCount);
                                manufacturingroutingSearchObj.run().each(function(result) {
                                    bom = result.getValue(
                                        search.createColumn({
                                            name: "billofmaterials",
                                            label: "Bill of Materials",
                                        })
                                    );
                                    routing = result.getValue(
                                        search.createColumn({
                                            name: "internalid",
                                            label: "Internal ID",
                                        })
                                    );
                                    return false;
                                });

                                createremakewo(woID, woline, currentitem, qty, bom, routing, customer, i, woLoad, lotRemake,boardsPerPanel);
                            }
                        }

                    } else if (status == "Released") {
                        log.debug("---- RELEASED---");

                        var assemblyitem = woLoad.getValue({ fieldId: 'assemblyitem' })
                        log.debug('assemblyitem :', assemblyitem);

                        var isPcb_wo = woLoad.getValue({
                            fieldId: "custbody_cntm_is_asm_wo",
                        });

                        var pcbRec_id = woLoad.getValue({
                            fieldId: "custbody_pcb_rec_id",
                        });
                        // log.audit("pcbRec_id :", pcbRec_id +"isRework :"+ isRework + "executionContext :"+ runtime.executionContext);

                        //IS STOCK BOARD WO
                        var isRework = woLoad.getValue({
                            fieldId: "custbody_cntm_is_rework_wo",
                        });
                        log.debug("isRework :", isRework);

                        var createdFrom_wo = woLoad.getValue({
                            fieldId: "createdfrom",
                        });
                        log.debug('createdFrom_wo :', createdFrom_wo)

                        var createdFrom_wo_text = woLoad.getText({
                            fieldId: "createdfrom",
                        });

                        //the following code will not trigger in case of Stock Board WO
                        if (!createdFrom_wo_text.includes("Sales Order")) {
                            if (validateData(createdFrom_wo)) {
                                var woLine = toprocessRemake(createdFrom_wo, assemblyitem);
                                // log.audit("woLine :", woLine);
                                if (woLine.length > 0) {
                                    var index = woLine[0].index.toString();
                                    woLoad.setValue({
                                        fieldId: "custbody_cntm_no_of_panel", // new i
                                        value: woLine[0].lot,
                                    });
                                    if (validateData(index)) {
                                        remakeFlag = true;
                                    } else {
                                        remakeFlag = false;
                                    }
                                }
                            }
                        }

                        if ((!isPcb_wo && isRework) || (remakeFlag == true)) {
                            toProcessLot = true;
                        } else {
                            toProcessLot = false;
                        }
                        log.audit('toProcessLot :', toProcessLot);

                        if (woID) {
                            var lotFromCompletion = woLoad.getValue({
                                fieldId: "custbody_cntm_prev_lot_rec", // 'custbody_cntm_lot_from_completion'
                            });
                            //  log.debug("lotFromCompletion", lotFromCompletion);
                            var assemblyItem = woLoad.getValue({
                                fieldId: "assemblyitem", // 'assemblyaitem'
                            });
                            var noOfPanels = woLoad.getValue({
                                fieldId: "custbody_cntm_no_of_panel", // new i
                            });
                            log.debug('noOfpanels new :', noOfPanels)
                            var isPanelCreated = woLoad.getValue({
                                fieldId: "custbody_cntm_panel_wo_created",
                            });

                            var lotForStock = woLoad.getValue({
                                fieldId: "custbody_cntm_lot_stock_board",
                            });
                            log.debug("lotForStock :", lotForStock);

                            if (isPanelCreated == true || isPanelCreated == "T")
                                noOfPanels = woLoad.getValue({
                                    fieldId: "custbody_cntm_no_of_new_lots",
                                });
                            var params = {};

                            if (!validateData(lotFromCompletion)) {
                                var filters = [];
                                filters.push(["custrecord_cntm_lot_wonum", "anyof", woID]);
                                var customrecord_cntm_lot_creationSearchObj = search.create({
                                    type: "customrecord_cntm_lot_creation",
                                    filters: filters,
                                    columns: [
                                        search.createColumn({
                                            name: "custrecord_cntm_lot_wonum",
                                            sort: search.Sort.ASC,
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
                                var searchResultCount =
                                    customrecord_cntm_lot_creationSearchObj.runPaged().count;
                                if (searchResultCount == 0) {
                                    if (noOfPanels || isRework) {
                                        params = {
                                            custscript_cntm_woid: woID,
                                            custscript_cntm_panels: noOfPanels,
                                            custscript_cntm_fab_item: assemblyItem,
                                            custscript_cntm_is_issue: "T",
                                            custscript_cntm_is_rework: isRework == true ? "T" : "F",
                                            custscript_cntm_lot_from_completion: lotFromCompletion,
                                            custscript_cntm_lot_stock_boards: lotForStock,
                                            custscript_wo_line_no_remake: index,
                                            custscript_cntm_change_lot_wo: toProcessLot == true ? "T" : "F",
                                        };
                                    }
                                }

                                if (toProcessLot) {
                                    var checkTrue = record.submitFields({
                                        type: record.Type.WORK_ORDER,
                                        id: woID, //
                                        values: {
                                            custbody_cntm_cust_rec_on_lotrec_hide: true,
                                        },
                                        options: {
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true,
                                        },
                                    });
                                    if (params && JSON.stringify(params) != "{}") {
                                        log.audit("FINALLY  ", woID + 'params' + JSON.stringify(params));

                                        var scriptTask = task.create({
                                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                                        });
                                        scriptTask.scriptId = "customscript_cntm_ss_pcb_lot_num";
                                        scriptTask.params = params;
                                        var scriptTaskId = scriptTask.submit();
                                        log.audit("scriptTaskId", scriptTaskId);
                                    }
                                }
                            }
                        }
                    }
                }
                log.audit("----After Submit End ----")
            } catch (error) {
                log.error("error in after Submit :", error);
            }
        }

        function createremakewo(woID, woline, item, qty, bom, routing, customer, index, woLoad, lotRemake,boardsPerPanel) {
            try {
                log.debug('------START-------')
                var woparams = {
                    soid: woID,
                    soline: woline,
                    specord: "T",
                    assemblyitem: item,
                };

                log.debug('woparams ip:', woparams);

                var workOrder = record.create({
                    type: record.Type.WORK_ORDER,
                    isDynamic: true,
                    defaultValues: woparams,
                });
                // log.debug('workOrder BEFORE:', JSON.stringify(workOrder));

                workOrder.setValue({
                    fieldId: "entity",
                    value: customer,
                });
                log.debug('1')
                workOrder.setValue({
                    fieldId: "billofmaterials",
                    value: bom,
                });

                workOrder.setValue({
                    fieldId: "quantity",
                    value: qty,
                });


                workOrder.setValue({
                    fieldId: "manufacturingrouting",
                    value: routing,
                });
                workOrder.setValue({
                    fieldId: "custbody_rda_wo_issue_okay",
                    value: false,
                });

                workOrder.setValue({
                    fieldId: "custbody_cntm_custom_rec_ref_hide",
                    value: false,
                });
                workOrder.setValue({
                    fieldId: "custbody_cntm_good_boards",
                    value: parseInt(lotRemake * boardsPerPanel),
                });
                workOrder.setValue({
                    fieldId: "custbody_cntm_good_panels",
                    value: parseInt(lotRemake),
                });

                workOrder.setValue({
                    fieldId: "custbody_cntm_scrapped_boards",
                    value: 0,
                });
                workOrder.setValue({
                    fieldId: "custbody_cnt_scrapped_panels",
                    value: 0,
                });

                var woIdSaved = workOrder.save();
                log.debug({ title: "---woId--- ip", details: woIdSaved });

                var noOfPanels = woLoad.getValue({
                    fieldId: "custbody_cntm_no_of_panel", // new i
                });

                log.debug('noOfPanels ip:', noOfPanels);

                var assemblyItem = woLoad.getValue({
                    fieldId: "assemblyitem", // 'assemblyaitem'
                });
                log.debug('assemblyItem :', assemblyItem);
                var isRework = woLoad.getValue({
                    fieldId: "custbody_cntm_is_rework_wo",
                });
                log.debug("isRework ip:", isRework);

                var lotFromCompletion = woLoad.getValue({
                    fieldId: "custbody_cntm_prev_lot_rec", // 'custbody_cntm_lot_from_completion'
                });
                log.debug("lotFromCompletion ip:", lotFromCompletion)


                var lotForStock = woLoad.getValue({
                    fieldId: "custbody_cntm_lot_stock_board",
                });
                log.debug("lotForStock ip:", lotForStock)

                var toProcessLot = true;
                var params = {};
                if (!validateData(lotFromCompletion)) {
                    log.debug('---INSIDE---')
                    var filters = [];
                    filters.push(["custrecord_cntm_lot_wonum", "anyof", woIdSaved]);
                    var customrecord_cntm_lot_creationSearchObj = search.create({
                        type: "customrecord_cntm_lot_creation",
                        filters: filters,
                        columns: [
                            search.createColumn({
                                name: "custrecord_cntm_lot_wonum",
                                sort: search.Sort.ASC,
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
                    var searchResultCount = customrecord_cntm_lot_creationSearchObj.runPaged().count;
                    log.debug('searchResultCount :', searchResultCount);
                    if (searchResultCount == 0) {
                        if (noOfPanels || isRework) {
                            params = {
                                custscript_cntm_woid: woIdSaved,
                                custscript_cntm_panels: lotRemake,
                                custscript_cntm_fab_item: item,
                                custscript_cntm_is_issue: "T",
                                custscript_cntm_is_rework: isRework == true ? "T" : "F",
                                custscript_cntm_lot_from_completion: lotFromCompletion,
                                custscript_cntm_lot_stock_boards: lotForStock,
                                custscript_wo_line_no_remake: index,
                                custscript_cntm_change_lot_wo: toProcessLot == true ? "T" : "F",
                            };
                        }
                    }

                    if (toProcessLot) {
                        var checkTrue = record.submitFields({
                            type: record.Type.WORK_ORDER,
                            id: woID, //
                            values: {
                                custbody_cntm_cust_rec_on_lotrec_hide: true,
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true,
                            },
                        });
                        if (params && JSON.stringify(params) != "{}") {
                            log.audit("FINALLY  IP ", woIdSaved + 'params' + JSON.stringify(params));

                            var scriptTask = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                            });
                            scriptTask.scriptId = "customscript_cntm_ss_pcb_lot_num";
                            scriptTask.params = params;
                            var scriptTaskId = scriptTask.submit();
                            log.audit("scriptTaskId", scriptTaskId);
                        }
                    }
                }

                log.debug('------END-------')
            } catch (error) {
                log.debug("error in creating wo", error);
            }
        }


        function toprocessRemake(wo_id, assemblyitem) {
            try {
                log.debug("INSIDE toprocessRemake ");

                var checkArr = [];
                var woLoad = record.load({
                    type: record.Type.WORK_ORDER,
                    id: wo_id,
                });

                var lineCount = woLoad.getLineCount({
                    sublistId: "item",
                });
                log.debug('lineCount :', lineCount)
                for (var index = 0; index < lineCount; index++) {
                    var checkBox = woLoad.getSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_cntm_is_remake_wo",
                        line: index,
                    });

                    var lineItem = woLoad.getSublistValue({
                        sublistId: "item",
                        fieldId: "item",
                        line: index,
                    });

                    // var lot =
                    // log.debug('lot :',lot);

                    if ((checkBox == true) && (lineItem == assemblyitem)) {
                        if (checkArr.length == 0) {
                            var map = {}
                            map['lot'] = woLoad.getSublistValue({ sublistId: "item", fieldId: "custcol_cntm_lot_for_remake", line: index, });
                            map['index'] = index;
                            checkArr.push(map);
                        }
                    }

                }
                log.audit("checkArr :", checkArr);
                return checkArr


            } catch (error) {
                log.error("Error in toprocessRemake :", error);
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
            beforeLoad: beforeLoad,
            afterSubmit: afterSubmit,
        };
    });