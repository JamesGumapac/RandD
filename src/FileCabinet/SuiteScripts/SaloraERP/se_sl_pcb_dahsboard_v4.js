/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/redirect', 'N/runtime', 'N/format',
        './se_lib_gwos_v4'],
    (serverWidget, search, redirect, runtime, format,
     gwos3Lib) =>{

        const module = {};
        const resultLimit = 30;
        module.onRequest = (context) => {
            let scriptObj = runtime.getCurrentScript();
            let SEARCH_ID = scriptObj.getParameter({
                name: 'custscript_search_to_use_s'
            });
            DASHBOARD_SELECTED = +context.request.parameters.custparam_db_selected || 0;

            log.debug('DASHBOARD_SELECTED is:', DASHBOARD_SELECTED);


            DASHBOARD_OBJECT_ARRAY = [
                {name: 'Current DB-MCaprio-PC', search: 'customsearch_cdb_mcaprio_pc_cas2'}, //customsearch_cdb_mcaprio_pc_v2
                {name: 'Current DB-DB-FINAL', search: 'customsearch_cdb_final2_cas2'}, // customsearch_cdb_final2_v2
                {name: 'Current DB-DB-DRILL1', search: 'customsearch_cdb_drill12_cas2'}, // customsearch_cdb_drill12_v2
                {name: 'Current DB-DB-VIAFILL', search: 'customsearch_cdb_viafill2_cas2'}, // customsearch_cdb_viafill2_v2
                {name: 'Current DB-DB-ETCH', search: 'customsearch_cdb_viafill2_v2_cas2'},// customsearch_cdb_etch2_v2
                {name: 'Current DB-DB-PLATING', search: 'customsearch_cdb_plating2_cas2'},// customsearch_cdb_plating2_v2
                {name: 'Current DB-DB-Layup', search: 'customsearch_cdb_layup2_cas2'}, // customsearch_cdb_layup2_v2
                {name: 'Current DB-DB-ET', search: 'customsearch_cdb_et2_cas2'}, // customsearch_cdb_et2_v2
                {name: 'Current DB-DB-AOI', search: 'customsearch_cdb_aoi2_cas2'}, // customsearch_cdb_aoi2_v2 //ref
                {name: 'Current DB-DB-OuterLayers', search: 'customsearch_cdb_outerlayers2_cas2'}, // customsearch__cdb_outerlayers2_v2
                {name: 'Current DB-DB-SANDING', search: 'customsearch_cdb_sanding2_cas2'}, // customsearch_cdb_sanding2_v2
                {name: 'Current DB-DB-HDI', search: 'customsearch_cdb_hdi2_cas2'}, // customsearch_cdb_hdi2_v2
                {name: 'Current DB-DB-InnerLayers', search: 'customsearch_cdb_innlays2_cas2'}, // customsearch_cdb_innlays2_v2
                {name: 'Current DB-DB-SolderMask', search: 'customsearch_cdb_soldmask2_cas2'}, // customsearch_cdb_soldmask2_v2
                {name: 'Current DB-DB-Ni-Au', search: 'customsearch_cdb_ni_au2_cas2'}, // customsearch_cdb_ni_au2_v2
                {name: 'Current DB-DB-LASERDRILL', search: 'customsearch_cdb_laserdrill2_cas2'}, // customsearch_cdb_laserdrill2_v2
                {name: 'Current DB-DB-DES', search: 'customsearch_cdb_des2_cas2'}, // customsearch_cdb_des2_v2
                {name: 'Current DB-DB-Inline', search: 'customsearch_cdb_inline2_cas2'}, // customsearch_cdb_inline2_v2
                {name: 'Current DB-DB-DRILL2', search: 'customsearch_cdb_drill22_cas2'}, // customsearch_cdb_drill22_v2
                {name: 'Current DB-DB-ROUT', search: 'customsearch_cdb_rout2_cas2'}, // customsearchcdb_rout2_v2
                {name: 'Current DB-DB-ELEC-CU', search: 'customsearch_cdb_elec_cu2_cas2'}, // customsearch_cdb_elec_cu2_v2
                {name: 'Current DB-DB-DEV-CCLEAN', search: 'customsearch_cdb_dev_cclean2_cas2'}, // customsearch_cdb_dev_cclean2_v2
                {name: 'Current DB-DB-DESMEAR-DB', search: 'customsearch_cdb_desmear_db2_cas2'}, // customsearch_cdb_desmear_db2_v2
                {name: 'Current DB-Enepigdashboard', search: 'customsearch_cdb_enepig_cas2'}, // customsearch_cdb_enepig_v2}
            ];

            if (context.request.method == 'GET') {

                //log governance remaining
                let scriptObj = runtime.getCurrentScript();
                log.debug("Remaining governance units in GET: ", scriptObj.getRemainingUsage());

                let workCenterIdInput = '';
                let startDateInput = '';
                let endDateInput = '';

                // Get parameters
                let pageId = parseInt(context.request.parameters.page);
                let scriptId = context.request.parameters.script;
                let deploymentId = context.request.parameters.deploy;

                // Add sublist that will show results
                let form = serverWidget.createForm({
                    title: "PCB V3 " + DASHBOARD_OBJECT_ARRAY[DASHBOARD_SELECTED].name,
                    hideNavBar: true
                });
                form.clientScriptModulePath = 'SuiteScripts/SaloraERP/manufacturingDashboard_v3_cas.js';

                let sublist = buildFormSublist(form, DASHBOARD_OBJECT_ARRAY);

                // Get subset of data to be shown on page
                let addResults = fetchSearchResult2(DASHBOARD_OBJECT_ARRAY[DASHBOARD_SELECTED].name, DASHBOARD_OBJECT_ARRAY[DASHBOARD_SELECTED].search);

                setSublistFunction(sublist, addResults);
                // Set data returned to columns

                context.response.writePage(form);



            }
            else {

                let scriptObj = runtime.getCurrentScript();
                log.debug("Remaining governance units in POST 1:", scriptObj.getRemainingUsage());


                //Let's get the START DATE and END DATE that are input, if either/any
                let startDateInput = context.request.parameters.custpage_startdate;
                log.debug('startDateInput is:', startDateInput);

                let endDateInput = context.request.parameters.custpage_enddate;
                log.debug('endDateInput is:', endDateInput);


                //Begin displaying page
                //log governance remaining

                // Get parameters
                let scriptId = context.request.parameters.script;
                let deploymentId = context.request.parameters.deploy;

                //add DASHBOARD select dropdown
                let selectOptionsDashboard = form.addField({
                    id: 'custpage_dashboard_select',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Select Dashboard'
                });
                selectOptionsDashboard.layoutType = serverWidget.FieldLayoutType.NORMAL;
                //selectOptionsDashboard.breakType = serverWidget.FieldBreakType.STARTCOL;
                selectOptionsDashboard.isMandatory = true;

                for (let db = 0; db < DASHBOARD_OBJECT_ARRAY.length; db++) {

                    selectOptionsDashboard.addSelectOption({
                        value: db,
                        text: DASHBOARD_OBJECT_ARRAY[db].name
                    });
                }

                // Add sublist that will show results
                let form = serverWidget.createForm({
                    title: 'Manufacturing Dashboard',
                    hideNavBar: true
                });
                let sublist = buildFormSublist(form, DASHBOARD_OBJECT_ARRAY);

                // Get subset of data to be shown on page
                let addResults = fetchSearchResult(SEARCH_ID);

                setSublistFunction(sublist, addResults);

                context.response.writePage(form);



            } //end if GET
        }

        fetchSearchResult2 = (searchName, searchId) => {
            try {
                let searchObj = search.load({
                    id: searchId
                });
                let arrCasIds = gwos3Lib.getCASDetailsToDisplay(searchId, 18399, 25);
                // let arrCasIds = wosLib.getPendingOperations(searchObj.filterExpression, resultLimit, true)||[];
                if(!!arrCasIds && arrCasIds.length){
                    searchObj.filterExpression = searchObj.filterExpression.concat(["AND", ["internalid","anyof",arrCasIds]]);
                }

                log.emergency('arrCasIds: ', JSON.stringify(arrCasIds));
                let searchObjResultCount = searchObj.runPaged().count;
                log.debug("searchObj result count in runSearch function is:", searchObjResultCount);
                let resultRaw = searchObj.run().getRange({
                    start: 0,
                    end: resultLimit
                });
                //log.debug("searchObj result:", JSON.stringify(result));
                let resData =
                    resultRaw.map(function(result) {
                        log.emergency('', result.getValue({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "NVL({custrecord_cntm_priority1}, 4) || ' / ' || NVL({custrecord_cntm_priority2}, 4)",
                        }))
                        return {
                            seqNo: result.getValue({
                                name: "custrecord_cntm_seq_no",
                                summary: "GROUP"
                            }),
                            internalId: result.getValue({
                                name: "internalid",
                                summary: "MIN"
                            }),
                            woDueDate: result.getValue({
                                name: "custrecord_cntm_wo_sched_due_date",
                                summary: "GROUP"
                            }),
                            // woDueDate: result.getValue({
                            //     name: "formuladate",
                            //     summary: "GROUP",
                            //     formula: "NVL({custrecord_cntm_wo_sched_due_date}, {custrecord_cntm_cso_parentrec.custrecord_cntm_cah_woduedate})"
                            // }),
                            woName: result.getValue({
                                name: "custrecord_cntm_work_order",
                                summary: "MIN"
                            }),
                            woId: result.getValue({
                                name: "internalid",
                                join: "CUSTRECORD_CNTM_WORK_ORDER",
                                summary: "GROUP"
                            }),
                            //quantity: result.getValue({name: "custrecord_cntm_cah_total_lot_quantity", join: "CUSTRECORD_CNTM_CSO_PARENTREC", summary: "GROUP"}),
                            panel: result.getValue({
                                name: "custrecord_cntm_num_panels",
                                join: "CUSTRECORD_CNTM_CSO_PARENTREC",
                                summary: "GROUP"
                            }),
                            customer: result.getText({
                                name: "custrecord_cntm_cah_customer",
                                join: "CUSTRECORD_CNTM_CSO_PARENTREC",
                                summary: "GROUP"
                            }),
                            operation: result.getValue({
                                name: "custrecord_cntm_cso_operaton",
                                summary: "GROUP"
                            }),
                            percentCompleted: result.getValue({
                                name: "custrecord_cntm_percent_complete",
                                summary: "GROUP"
                            }),
                            // percentCompleted: result.getValue({
                            //     name: "formulapercent",
                            //     summary: "GROUP",
                            //     formula: "NVL({custrecord_cntm_percent_complete}, {custrecord_cntm_work_order.custbody_wo_percent_completed})"
                            // }),
                            commentsDash: result.getValue({
                                name: "custrecord_cntm_comments_for_dash",
                                summary: "GROUP"
                            }),
                            // commentsDash: result.getValue({
                            //     name: "formulatext",
                            //     summary: "GROUP",
                            //     formula: "NVL({custrecord_cntm_comments_for_dash}, {custrecord_cntm_work_order.custbody_comments_for_dash})"
                            // }),
                            woPriority: result.getValue({
                                name: "formulatext",
                                summary: "GROUP",
                                formula: "NVL({custrecord_cntm_priority1}, 4) || ' / ' || NVL({custrecord_cntm_priority2}, 4)",
                            }),
                            woPriority2: result.getValue({
                                name: "formulatext",
                                summary: "GROUP",
                                formula: "NVL({custrecord_cntm_priority1}, 4) || ' / ' || NVL({custrecord_cntm_priority2}, 4)",
                            }),
                            woPriorityVal: result.getValue({
                                name: "formulanumeric",
                                summary: "GROUP",
                                formula: "(NVL({custrecord_cntm_priority1}, 4) * 100) + NVL({custrecord_cntm_priority2}, 4)"
                            }),
                            woTranDate: result.getValue({
                                name: "custrecord_serp_operation_startdate",
                                summary: "MIN"
                            }),
                            woTranDateOrig: result.getValue({
                                name: "trandate",
                                join: "CUSTRECORD_CNTM_WORK_ORDER",
                                summary: "MIN"
                            }),
                            // woTranDate: result.getValue({
                            //     name: "formuladate",
                            //     summary: "MIN",
                            //     formula: "NVL({custrecord_serp_operation_startdate}, {custrecord_cntm_work_order.trandate})"
                            // }),
                            quantity: result.getValue({
                                name: "formulanumeric",
                                summary: "SUM",
                                formula: "TO_NUMBER({custrecord_cntm_cso_quantity_good})"
                            }),
                            casDueDate: result.getValue({
                                name: "formulanumeric",
                                summary: "SUM",
                                formula: "TO_NUMBER({custrecord_cntm_cso_quantity_good})"
                            })
                        };
                    }) || [];
                log.debug("resData2:", JSON.stringify(resData));
                log.debug("resData:", resData.length);

                let resultArray = [];

                for(let i = 0; i < resData.length; i++){

                    // let woPriority = resData[i].woPriorityVal;
                    let woPriority = resData[i].woPriority;
                    // if (!woPriority){
                    //     woPriority = Math.floor(5).toFixed(0);
                    // } else {
                    //     woPriority = Math.ceil(woPriority).toFixed(0);
                    // }

                    let jobAndNoBoardsArray = givenWOidReturnJobFieldTextAndNoBoardsPerPanel(resData[i].woId);
                    let jobField = jobAndNoBoardsArray[0] ? jobAndNoBoardsArray[0] : 'N/A';

                    let workOrder = resData[i].woName;
                    let workOrderSubString = workOrder.substring(workOrder.indexOf('#'), workOrder.length);

                    let entityString = resData[i].customer || 'N/A';

                    let timerVar = '';
                    let startDate = resData[i].woTranDate||resData[i].woTranDateOrig;
                    if (startDate) {
                        timerVar = getTimeElapsedSince(startDate);
                    }

                    log.emergency('startdate: ' + startDate, typeof startDate)
                    let nextGateOperationName = resData[i].operation||'N/A';

                    // serialNumbers
                    let serialsReturned = getWOlotCreation(resData[i].woId);
                    let woSerials = serialsReturned|| '';


                    resultArray.push({
                        "rownumber": i.toFixed(0),
                        "id": resData[i].internalId,
                        "wopriority": woPriority,
                        "duedate": resData[i].woDueDate || '1/1/1980',
                        "jobnumber": jobField,
                        "workorder": workOrderSubString,
                        "nopanels": resData[i].quantity + "/" + resData[i].panel,
                        "entity": entityString,
                        "currentgate": resData[i].operation,
                        //"order": currOrder,
                        "timer": timerVar,
                        //"enddate": endDate,
                        //"duedate": dueDate,
                        //"completedquantity": completedQuantity,
                        "percentcomplete": resData[i].percentCompleted,
                        "nextgate": nextGateOperationName,
                        "serialnumbers": woSerials,
                        "comments": resData[i].commentsDash
                    });

                }

                // // group by woId
                // let groupedByWoId = [];
                // let i = [];
                // resData.forEach(function(v) {
                //     if (i.indexOf(v.woId) < 0) {
                //         i.push(v.woId);
                //         groupedByWoId.push({
                //             'woId': v.woId,
                //             'data': resData.filter(function(itm) {
                //                 return itm.woId == v.woId;
                //             })
                //         });
                //     }
                // });
                // log.debug("groupedByWoId:", JSON.stringify(groupedByWoId));
                // log.debug("groupedByWoId:", groupedByWoId.length);
                //
                // // get 1st line on each woId
                // let resultArray = [];
                // let q = 0;
                // for (let z = 0; z < groupedByWoId.length; z++) {
                //
                //     // woPriority
                //     let woPriority = groupedByWoId[z].data[0].woPriority;
                //     if (!woPriority) {
                //         woPriority = Math.floor(5).toFixed(0);
                //     } else {
                //         woPriority = Math.ceil(woPriority).toFixed(0);
                //     }
                //
                //     // jobNumber
                //     let jobAndNoBoardsArray = givenWOidReturnJobFieldTextAndNoBoardsPerPanel(groupedByWoId[z].woId);
                //     let jobField = jobAndNoBoardsArray[0] ? jobAndNoBoardsArray[0] : 'N/A';
                //
                //     // woName substring
                //     let workOrder = groupedByWoId[z].data[0].woName;
                //     let workOrderSubString = workOrder.substring(workOrder.indexOf('#'), workOrder.length);
                //
                //     //entity string
                //     let entityStringResult = groupedByWoId[z].data[0].customer;
                //     let entityString = 'N/A'
                //     if (!!entityStringResult) {
                //         entityString = entityStringResult;
                //     }
                //
                //     // nextGate
                //     let nextGateOperationName = 'N/A';
                //     if (groupedByWoId[z].data.length > 1) {
                //         nextGateOperationName = groupedByWoId[z].data[1].operation;
                //     }
                //
                //     // serialNumbers
                //     let serialsReturned = getWOlotCreation(groupedByWoId[z].woId);
                //     let serials = serialsReturned ? serialsReturned : '';
                //     let woSerials = serials ? serials : ' ';
                //
                //     // timer
                //     let timerVar = '';
                //     let startDate = groupedByWoId[z].data[0].woTranDate;
                //     if (startDate) {
                //         timerVar = getTimeElapsedSince(startDate);
                //     }
                //
                //     resultArray.push({
                //         "rownumber": q.toFixed(0),
                //         "id": groupedByWoId[z].data[0].internalId,
                //         "wopriority": woPriority,
                //         "duedate": groupedByWoId[z].data[0].woDueDate,
                //         "jobnumber": jobField,
                //         "workorder": workOrderSubString,
                //         "nopanels": groupedByWoId[z].data[0].quantity + "/" + groupedByWoId[z].data[0].panel,
                //         "entity": entityString,
                //         "currentgate": groupedByWoId[z].data[0].operation,
                //         //"order": currOrder,
                //         "timer": timerVar,
                //         //"enddate": endDate,
                //         //"duedate": dueDate,
                //         //"completedquantity": completedQuantity,
                //         "percentcomplete": groupedByWoId[z].data[0].percentCompleted,
                //         "nextgate": nextGateOperationName,
                //         "serialnumbers": woSerials,
                //         "comments": groupedByWoId[z].data[0].commentsDash
                //     });
                //
                //     q++;
                //
                // }
                log.debug("resultArray:", JSON.stringify(resultArray));
                return resultArray;
            } catch (e) {
                log.debug("error", e);
                return [];
            }
        }

        fetchSearchResult = (searchId) => {
            try {
                let searchObj = search.load({
                    id: searchId
                });

                let searchObjResultCount = searchObj.runPaged().count;
                log.debug("searchObj result count in runSearch function is:", searchObjResultCount);
                log.debug('First search filter is:', searchObj.filters[0].formula);

                let result = searchObj.run().getRange({
                    start: 0,
                    end: 25
                });

                let resultArray = new Array();
                let q = 0;
                for (let z = 0; z < result.length; z++) {

                    let woId = result[z].getValue({
                        name: "internalid",
                        join: "CUSTRECORD_OPERATION_LINE_WO"
                    });
                    if (!woId) {
                        continue;
                    }
                    log.debug('woId is:', woId);
                    let jobAndNoBoardsArray = givenWOidReturnJobFieldTextAndNoBoardsPerPanel(woId);
                    let serialsReturned = getWOlotCreation(woId); //getComponentSerials(woId)
                    let serials = serialsReturned ? serialsReturned : '';
                    log.debug('woId / serials:', woId + ' / ' + serials);
                    let woSerials = serials ? serials : ' ';
                    let operationId = result[z].id;
                    //let operationId = result[z].getValue({name: "formulatext", formula: "{manufacturingoperationtask.internalid)"});
                    let currentGateResult = result[z].getText({
                        name: "custrecord_operation_line_opername"
                    });
                    log.debug('operationId is:', operationId);
                    log.debug('result is:', result[z]);
                    //let workorderTranId = result.getValue({name: "workorder"});
                    let woPriority = result[z].getValue({
                        name: "custbody_rda_wo_priorty",
                        join: "CUSTRECORD_OPERATION_LINE_WO"
                    });
                    if (!woPriority) {
                        woPriority = Math.floor(5).toFixed(0);
                    } else {
                        woPriority = Math.ceil(woPriority).toFixed(0);
                    }
                    let itemName = result[z].getValue({
                        name: "item",
                        join: "CUSTRECORD_OPERATION_LINE_WO"
                    });
                    let entityStringResult = result[z].getText({
                        name: "entity",
                        join: "CUSTRECORD_OPERATION_LINE_WO"
                    });
                    log.debug('entityStringResult is:', entityStringResult);
                    let entityString = 'N/A'
                    if (!!entityStringResult) {
                        entityString = entityStringResult;
                    }
                    let workOrderStatus = result[z].getText({
                        name: "statusref",
                        join: "CUSTRECORD_OPERATION_LINE_WO"
                    });
                    let workOrder = result[z].getValue({
                        name: "tranid",
                        join: "CUSTRECORD_OPERATION_LINE_WO"
                    });
                    let workOrderSubString = workOrder.substring(workOrder.indexOf('#'), workOrder.length);
                    log.debug('workOrder / workOrderSubstring:', workOrder + ' / ' + workOrderSubString);
                    //let workorderpriority = result.getValue({name: "formulatext"});
                    //log.debug('workorderpriority is:', workorderpriority);
                    let startDate = result[z].getValue({
                        name: "custrecord_operation_line_startdate"
                    });
                    log.debug("start date search", result[z].getValue({
                        name: "custrecord_operation_line_startdate"
                    }));
                    log.debug("start datetext search", result[z].getText({
                        name: "custrecord_operation_line_startdate"
                    }));
                    if (startDate) {
                        let timerlet = getTimeElapsedSince(startDate);
                    } else {
                        let timerlet = ' ';
                    }



                    let endDate = result[z].getValue({
                        name: "custrecord_operation_line_enddate"
                    });
                    let dueDate = result[z].getValue({
                        name: "custbody_rda_wo_sched_due_date",
                        join: "CUSTRECORD_OPERATION_LINE_WO"
                    });
                    //let classNoHierarchy = result.getText({name: "classnohierarchy", join: "workOrder"});
                    let noOfPanels = jobAndNoBoardsArray[1] ? jobAndNoBoardsArray[1] : Number(1).toFixed(0);
                    log.debug("NoOfPanels", noOfPanels);

                    let qty = result[z].getValue({
                        name: "quantity",
                        join: "CUSTRECORD_OPERATION_LINE_WO"
                    });
                    let predecessor = result[z].getValue({
                        name: "custrecord_operation_line_predecessor"
                    })
                    let predecessorsCompQty = getPredecessorQty(woId, predecessor); //result[z].getValue({name: "completedquantity", join: "CUSTRECORD_OPERATION_LINE_PREDECESSOR"}) || 0;//returnPredecessorsCompletedQuantity(result[z].getValue({name: }));
                    let panelFormula = Math.ceil(Number(predecessorsCompQty) / Number(noOfPanels))
                    log.debug("panel formula", panelFormula);
                    log.debug("predecessorscompqty", predecessorsCompQty);
                    let qtyAndNoPanels = Number(predecessorsCompQty).toFixed(0) + ' / ' + panelFormula //Math.ceil(predecessorsCompQty / noOfPanels);

                    let jobField = jobAndNoBoardsArray[0] ? jobAndNoBoardsArray[0] : 'N/A'; //Tool Number (CNTM) on PROJEFCT record

                    let workCenterId = result[z].getValue({
                        name: "custrecord_operation_line_mwc"
                    });
                    let operationNameString = result[z].getText({
                        name: "custrecord_operation_line_opername"
                    });
                    let currentOperationNameId = result[z].getValue({
                        name: "custrecord_operation_line_opername"
                    });
                    let nextGateOperationName = getNextGate(woId, currentOperationNameId);
                    let percentCompleted = result[z].getValue({
                        name: "custbody_wo_percent_completed",
                        join: "CUSTRECORD_OPERATION_LINE_WO"
                    });
                    let woPriority1 = result[z].getValue({
                        name: "formulanumeric"
                    });
                    let woPriority2 = result[z].getValue({
                        name: "custbody_rda_wo_priorty_2",
                        join: "CUSTRECORD_OPERATION_LINE_WO"
                    })

                    //let gateId = givenWorkCenterIdAndOperationNameReturnGate(workCenterId, operationNameString);
                    //if(!gateId || gateId === 'undefined' || gateId == '' || gateId == 0){
                    let gateId = operationNameString.substring(0, 2);
                    //}
                    log.debug('workCenterId / operationNameString / gateId:', workCenterId + ' / ' + operationNameString + ' / ' + gateId);



                    let currOrder = result[z].getValue({
                        name: "custrecord_operation_line_operseq"
                    });
                    if (z > 0) {
                        let prevOrder = result[z - 1].getValue({
                            name: "custrecord_operation_line_operseq"
                        });
                    }
                    log.debug('currOrder / prevOrder:', currOrder + ' / ' + prevOrder);

                    let totalOperations = getTotalNumberOfOperations(woId);
                    //log.debug('totalOperations / percentComplete is:', totalOperations +' / '+ percentComplete);
                    //  if(totalOperations && totalOperations !== null && totalOperations !== 'undefined'){
                    //      let percentComplete = (Number(currOrder - 1) / Number(totalOperations)) * 100;
                    //      let percentComplete = percentComplete.toFixed(0)  + '%';
                    //  }
                    //  else{
                    //      let percentComplete = 'TBD';
                    //  }

                    if (!percentCompleted) {
                        percentCompleted = 'TBD';
                    }

                    ////////////////////////////
                    //findNextByFindingPredecessor(operationId);
                    ///////////////////////////
                    let message = result[z].getValue({
                        name: "custbody_comments_for_dash",
                        join: "CUSTRECORD_OPERATION_LINE_WO"
                    });
                    /**
                             //determine if the current result is the 'Next Gate'. If current WO is same as previous interation's WO and ORDER has iterated by one
                             if(z > 0 && result[z].id == result[z-1].id && prevOrder && Number(currOrder) - Number(prevOrder) == 1 && DASHBOARD_OBJECT_ARRAY[DASHBOARD_SELECTED].gatesincluded.indexOf(gateId) == -1){

                                     let nextGate = gateId;
                                     resultArray[q - 1].nextgate = nextGate;


                             }
                             else{

                                     if(z < result.length - 2){
                                         let nextGateByGettingPredecessor = result[z + 2].getText({name: "predecessor", join: "manufacturingOperationTask"});
                                         let nextGateByGettingPredecessorToUse = nextGateByGettingPredecessor.substring(0, 2);
                                     }
                                     else{
                                         nextGateByGettingPredecessorToUse = 'N/A';
                                     }
                     **/
                    //build array of objects
                    resultArray.push({
                        "rownumber": q.toFixed(0),
                        //"searchrownumber": z.toFixed(0),
                        "id": result[z].getValue({
                            name: "internalid",
                            join: "CUSTRECORD_OPERATION_LINE_WO"
                        }),
                        "wopriority": woPriority1 + " / " + woPriority2,
                        "duedate": dueDate, //result[z].getValue({name: "custbody_rda_wo_sched_due_date", join: "CUSTRECORD_OPERATION_LINE_WO"}),
                        "jobnumber": jobField,
                        "workorder": workOrderSubString,
                        "nopanels": qtyAndNoPanels,
                        "entity": entityString,
                        "currentgate": operationNameString,
                        //"order": currOrder,
                        "timer": timerVar,
                        //"enddate": endDate,
                        //"duedate": dueDate,
                        //"completedquantity": completedQuantity,
                        "percentcomplete": percentCompleted,
                        "nextgate": nextGateOperationName, //findNextByFindingPredecessor(operationId), //nextGateByGettingPredecessorToUse,  //
                        "serialnumbers": woSerials,
                        "comments": message
                    });

                    q++;
                    //}



                    //log.debug('resultArray ' + z + ' is:', JSON.stringify(resultArray));
                }


                return resultArray;
            } catch (e) {
                log.debug("error", e);
                return [];
            }
        }


        buildFormSublist = (form, dashboardarray) => {

            //add DASHBOARD select dropdown
            let selectOptionsDashboard = form.addField({
                id: 'custpage_dashboard_select',
                type: serverWidget.FieldType.SELECT,
                label: 'Select Dashboard'
            });
            selectOptionsDashboard.layoutType = serverWidget.FieldLayoutType.NORMAL;
            //selectOptionsDashboard.breakType = serverWidget.FieldBreakType.STARTCOL;
            selectOptionsDashboard.isMandatory = true;

            for (let db = 0; db < dashboardarray.length; db++) {

                selectOptionsDashboard.addSelectOption({
                    value: db,
                    text: dashboardarray[db].name
                });
            }
            selectOptionsDashboard.defaultValue = DASHBOARD_SELECTED;

            let sublist = form.addSublist({
                id: 'custpage_table',
                type: serverWidget.SublistType.LIST,
                label: 'Manufacturing Operation Tasks (Max ' + resultLimit + ' results)'
            });

            // Add columns to be shown on Page
            sublist.addField({
                id: 'rownumber',
                label: 'Row Number',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            sublist.addField({
                id: 'wopriority',
                label: 'Priority',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'duedate',
                label: 'Due Date',
                type: serverWidget.FieldType.DATE
            });
            sublist.addField({
                id: 'jobnumber',
                label: 'Job',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'workorder',
                label: 'Work Order',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'nopanels',
                label: 'Qty / # Panels',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'entity',
                label: 'Customer',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'currentgate',
                label: 'Current Gate',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'timer',
                label: 'Timer',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'percentcomplete',
                label: 'Percent Completed',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'nextgate',
                label: 'Next Gate',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'serialnumbers',
                label: 'Lot #s',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'comments',
                label: 'Comments',
                type: serverWidget.FieldType.TEXT
            });
            return sublist;

        }


        setSublistFunction = (sublist, result) => {
            log.debug("result", result);
            try {
                // Set data returned to columns
                let j = 0;
                result.forEach(function(result) {

                    sublist.setSublistValue({
                        id: 'rownumber',
                        line: j,
                        value: result.rownumber
                    });
                    //sublist.setSublistValue({id: 'id', line : j, value : result.id});
                    //sublist.setSublistValue({id: 'searchrownumber', line : j, value : result.searchrownumber});
                    sublist.setSublistValue({
                        id: 'wopriority',
                        line: j,
                        value: result.wopriority ? result.wopriority : 5
                    });
                    sublist.setSublistValue({
                        id: 'duedate',
                        line: j,
                        value: format.format({value: format.parse({value: result.duedate, type: format.Type.DATE}), type: format.Type.DATE})
                    });
                    sublist.setSublistValue({
                        id: 'jobnumber',
                        line: j,
                        value: result.jobnumber ? result.jobnumber : 'N/A'
                    });
                    sublist.setSublistValue({
                        id: 'workorder',
                        line: j,
                        value: result.workorder ? result.workorder : 'N/A'
                    });
                    sublist.setSublistValue({
                        id: 'nopanels',
                        line: j,
                        value: result.nopanels ? result.nopanels : 0
                    });
                    sublist.setSublistValue({
                        id: 'entity',
                        line: j,
                        value: result.entity ? result.entity : ' '
                    });
                    sublist.setSublistValue({
                        id: 'currentgate',
                        line: j,
                        value: result.currentgate
                    });
                    //sublist.setSublistValue({id: 'order', line : j, value : result.order});
                    sublist.setSublistValue({
                        id: 'timer',
                        line: j,
                        value: result.timer
                    });
                    sublist.setSublistValue({
                        id: 'percentcomplete',
                        line: j,
                        value: result.percentcomplete||"0.00%"
                    });
                    if (result.hasOwnProperty("nextgate")) {
                        if (result.nextgate)
                            sublist.setSublistValue({
                                id: 'nextgate',
                                line: j,
                                value: result.nextgate
                            });
                    }
                    sublist.setSublistValue({
                        id: 'serialnumbers',
                        line: j,
                        value: result.serialnumbers
                    });
                    sublist.setSublistValue({
                        id: 'comments',
                        line: j,
                        value: result.comments ? result.comments : ' '
                    });

                    j++;
                });
            } catch (e) {
                log.debug("error", e);
            }

        }

        getTimeElapsedSince = (startdate) => {
            log.debug("start date", startdate);
            let returnObj = new Object();
            const total = Date.parse(new Date()) - Date.parse(startdate);
            log.debug("total", total);
            returnObj.seconds = Math.floor((total / 1000) % 60);
            returnObj.minutes = Math.floor((total / 1000 / 60) % 60);
            returnObj.hours = Math.floor((total / (1000 * 60 * 60)) % 24);
            returnObj.days = Math.floor(total / (1000 * 60 * 60 * 24));

            return returnObj.days + 'd ' + returnObj.hours + 'h ' + returnObj.minutes + 'm';
        }

        givenWorkCenterIdAndOperationNameReturnGate = (workcenterid, operationnamestring) =>{

            let GATE_ID = 0;
            let operationNameAllUppercase = operationnamestring.toUpperCase();
            //search the GATE TIMES AND OPERATIONS custom record for all custom records with this particular MANUFACTURING WORK CENTER join
            let customrecord_gate_times_and_operations_SearchObj = search.create({
                type: "customrecord_gate_times_and_operations_",
                filters: [
                    ["custrecord_work_center_", "anyof", workcenterid],
                    "AND",
                    ["formulanumeric: CASE WHEN UPPER({custrecord_name_}) LIKE '" + operationNameAllUppercase + "' THEN 1 ELSE 0 END", "equalto", "1"]
                ],
                columns: [
                    search.createColumn({
                        name: "scriptid",
                        sort: search.Sort.ASC,
                        label: "Script ID"
                    }),
                    search.createColumn({
                        name: "custrecord_gate_",
                        label: "Gate ID"
                    }),
                    search.createColumn({
                        name: "custrecord_name_",
                        label: "Name"
                    }),
                    search.createColumn({
                        name: "custrecord_work_center_",
                        label: "Work Center"
                    }),
                    search.createColumn({
                        name: "custrecord_wip_setup_",
                        label: "WIP SetUp"
                    }),
                    search.createColumn({
                        name: "custrecord_wip_time_",
                        label: "WIP Time"
                    }),
                    search.createColumn({
                        name: "custrecord8",
                        label: "Cost Template"
                    })
                ]
            });
            let searchResultCount = customrecord_gate_times_and_operations_SearchObj.runPaged().count;
            log.debug("customrecord_gate_times_and_operations_SearchObj result count", searchResultCount);
            customrecord_gate_times_and_operations_SearchObj.run().each(function(result) {

                MOT_NAME = result.getValue({
                    name: "custrecord_name_"
                });
                GATE_ID = result.getValue({
                    name: "custrecord_gate_"
                });

                return true;
            });

            return GATE_ID;
        }


        /**
         function jsSleep(milliseconds) {
           let date = Date.now();
           let currentDate = null;
           do {
             currentDate = Date.now();
           } while (currentDate - date < milliseconds);
         }
         **/
        //setTimeout(reloadFunction, 10000);


        // reloadSuiteletFunction = (currentdashboard) => {
        //
        //     jsSleep(7000);
        //
        //     redirect.toSuitelet({
        //         scriptId: 1502,
        //         deploymentId: 1,
        //         parameters: {
        //             'custparam_db_selected': currentdashboard
        //         }
        //     });
        //
        //     //window.location.href = "/app/site/hosting/scriptlet.nl?script=1502&deploy=1&custparam_db_selected=' + currentdashboard +'";
        //
        //     log.debug('Called reloadFunction');
        // } //end reloadFunction


        findNextByFindingPredecessor = (manufacturingoperationtaskid) => {


            let PREDECESSOR_NAME = '';
            let workorderSearchObj = search.create({
                type: "workorder",
                filters: [
                    ["mainline", "is", "T"],
                    "AND",
                    ["type", "anyof", "WorkOrd"],
                    "AND",
                    ["status", "anyof", "WorkOrd:D", "WorkOrd:A", "WorkOrd:B"],
                    "AND",
                    ["manufacturingoperationtask.predecessor", "anyof", manufacturingoperationtaskid]
                ],
                columns: [
                    search.createColumn({
                        name: "custbody_rda_wo_priorty",
                        label: "WO Priorty"
                    }),
                    search.createColumn({
                        name: "tranid",
                        sort: search.Sort.ASC,
                        label: "Document Number"
                    }),
                    search.createColumn({
                        name: "name",
                        join: "manufacturingOperationTask",
                        label: "Operation Name"
                    }),
                    search.createColumn({
                        name: "order",
                        join: "manufacturingOperationTask",
                        sort: search.Sort.ASC,
                        label: "Order"
                    }),
                    search.createColumn({
                        name: "item",
                        label: "Item"
                    }),
                    search.createColumn({
                        name: "companyname",
                        join: "jobMain",
                        label: "Project Name"
                    })
                ]
            });
            let searchResultCount = workorderSearchObj.runPaged().count;
            log.debug("workorderSearchObj result count", searchResultCount);
            workorderSearchObj.run().each(function(result) {

                PREDECESSOR_NAME = result.getValue({
                    name: "name",
                    join: "manufacturingOperationTask"
                });
                return true;
            });


            return (PREDECESSOR_NAME ? PREDECESSOR_NAME : 'N/A');


        }

        returnPredecessorsCompletedQuantity = (manufacturingoperationtaskid) => {


            let PREDECESSOR_COMPLETED_QTY = '';
            let manufacturingoperationtaskSearchObj = search.create({
                type: "manufacturingoperationtask",
                filters: [
                    ["internalid", "anyof", manufacturingoperationtaskid]
                ],
                columns: [
                    search.createColumn({
                        name: "predecessor",
                        label: "Predecessor"
                    }),
                    search.createColumn({
                        name: "completedquantity",
                        join: "predecessor",
                        label: "Completed Quantity"
                    })
                ]
            });
            let searchResultCount = manufacturingoperationtaskSearchObj.runPaged().count;
            log.debug("manufacturingoperationtaskSearchObj result count", searchResultCount);
            manufacturingoperationtaskSearchObj.run().each(function(result) {

                PREDECESSOR_COMPLETED_QTY = result.getValue({
                    name: "completedquantity",
                    join: "predecessor"
                });
                return true;
            });


            return PREDECESSOR_COMPLETED_QTY;

        }


        getTotalNumberOfOperations = (woid) => {
            let RESULT = 0;

            let workorderSearchObj = search.create({
                type: "workorder",
                filters: [
                    ["type", "anyof", "WorkOrd"],
                    "AND",
                    ["mainline", "is", "T"],
                    "AND",
                    ["internalid", "anyof", woid]
                ],
                columns: [
                    search.createColumn({
                        name: "name",
                        join: "manufacturingOperationTask",
                        summary: "COUNT",
                        sort: search.Sort.ASC,
                        label: "Operation Name"
                    })
                ]
            });
            let searchResultCount = workorderSearchObj.runPaged().count;
            log.debug("workorderSearchObj result count", searchResultCount);
            workorderSearchObj.run().each(function(result) {
                RESULT = result.getValue({
                    name: "name",
                    join: "manufacturingOperationTask",
                    summary: "COUNT"
                });
                return true;
            });


            return RESULT;
        }

        getWOlotCreation = (woId) => {
            let workorderSearchObj = search.create({
                type: "customrecord_cntm_lot_creation",
                filters: [
                    ["custrecord_cntm_lot_wonum", "anyof", woId],
                ],
                columns: [
                    search.createColumn({
                        name: "custrecord_cntm_lot_lotnumber",
                        label: "Lot #s"
                    }),
                ]
            });
            let lotNumbers = [];
            getAllSSResult(workorderSearchObj.run()).forEach(function(res) {
                let lotNumber = res.getValue({
                    name: "custrecord_cntm_lot_lotnumber"
                });

                if (lotNumber) {
                    lotNumbers.push(lotNumber);
                }
            });

            return lotNumbers.toString();
        }

        getPredecessorQty = (woId, predecessor) =>{
            log.debug("getPredecessor", woId + "/" + predecessor)
            let customrecord_operation_lineSearchObj = search.create({
                type: "customrecord_operation_line",
                filters: [
                    ["custrecord_operation_line_opername", "anyof", predecessor],
                    "AND",
                    ["custrecord_operation_line_wo", "anyof", woId]
                ],
                columns: [
                    "custrecord_operation_line_opername",
                    "custrecord_operation_line_completedqty"
                ]
            });

            let predecessortCompletedQty = "";
            getAllSSResult(customrecord_operation_lineSearchObj.run()).forEach(function(res) {
                predecessortCompletedQty = res.getValue({
                    name: "custrecord_operation_line_completedqty"
                })
            });

            return predecessortCompletedQty
        }

        getNextGate = (woId, predecessor) => {
            let customrecord_operation_lineSearchObj = search.create({
                type: "customrecord_operation_line",
                filters: [
                    ["custrecord_operation_line_predecessor", "anyof", predecessor],
                    "AND",
                    ["custrecord_operation_line_wo", "anyof", woId]
                ],
                columns: [
                    "custrecord_operation_line_opername"
                ]
            });
            let nextOperationName = "";
            getAllSSResult(customrecord_operation_lineSearchObj.run()).forEach(function(res) {
                nextOperationName = res.getText({
                    name: "custrecord_operation_line_opername"
                })
            });

            return nextOperationName;
        }

        getWOIdetails = (woId) =>{
            let woIssueSearch = search.load({
                id: "customsearch_print_bom_pdf"
            });
            woIssueSearch.filters.push(search.createFilter({
                name: 'createdfrom',
                operator: search.Operator.ANYOF,
                values: woId
            }));
            let lotNumbers = [];
            //let invDetails = {};
            getAllSSResult(woIssueSearch.run()).forEach(function(res) {
                //let itemId = res.getValue(res.columns[1]);
                let lotNumber = res.getText(res.columns[2]);
                //let binNumber = res.getText(res.columns[3]);

                // if(!invDetails[itemId]){
                //     invDetails[itemId] = [];
                //     lotNumbers[itemId] = [];
                // }

                // invDetails[itemId].push( lotNumber || binNumber );

                if (lotNumber) {
                    lotNumbers.push(lotNumber);
                }
            });

            return lotNumbers.toString();
        }

        function getAllSSResult(searchResultSet) {
            let result = [];
            for (let x = 0; x <= result.length; x += 1000)
                result = result.concat(searchResultSet.getRange(x, x + 1000) || []);
            return result;
        }


        getComponentSerials = (woid) =>{

            let serialsArray = []

            let workorderSearchObj = search.create({
                type: "workorder",
                filters: [
                    ["type", "anyof", "WorkOrd"],
                    "AND",
                    ["internalid", "anyof", woid],
                    "AND",
                    ["item", "noneof", "@NONE@"],
                    "AND",
                    ["inventorydetail.inventorynumber", "noneof", "@NONE@"]
                ],
                columns: [
                    search.createColumn({
                        name: "trandate",
                        label: "Date"
                    }),
                    search.createColumn({
                        name: "type",
                        label: "Type"
                    }),
                    search.createColumn({
                        name: "tranid",
                        label: "Document Number"
                    }),
                    search.createColumn({
                        name: "entity",
                        label: "Name"
                    }),
                    search.createColumn({
                        name: "memo",
                        label: "Memo"
                    }),
                    search.createColumn({
                        name: "inventorynumber",
                        join: "itemNumber",
                        label: "Number"
                    })
                ]
            });
            let searchResultCount = workorderSearchObj.runPaged().count;
            log.debug("workorderSearchObj result count", searchResultCount);
            workorderSearchObj.run().each(function(result) {

                let serialNumber = result.getValue({
                    name: "inventorynumber",
                    join: "itemNumber"
                });
                if (typeof serialNumber == 'number') {
                    let serialNumber = Number(result.getValue({
                        name: "inventorynumber",
                        join: "itemNumber"
                    })).toFixed(0);
                }
                serialsArray.push(serialNumber);

                return true;
            });

            if (searchResultCount > 0) {
                let serialsStringWithoutCommas = serialsArray.join(', ');
                let serialsString = serialsStringWithoutCommas.toString();
                if (serialsString.length > 298) {
                    let serialsString = serialsString.substring(0, 298);
                }
                return serialsString;
            }

        }

        givenWOidReturnJobFieldTextAndNoBoardsPerPanel = (woid) =>{
            log.debug("givenWOidReturnJobFieldTextAndNoBoardsPerPanel() woid", woid);
            let returnArray = [];

            let workorderSearchObj = search.create({
                type: "workorder",
                filters: [
                    ["type", "anyof", "WorkOrd"],
                    "AND",
                    ["internalid", "anyof", woid],
                    "AND",
                    ["mainline", "is", "T"]
                ],
                columns: [
                    search.createColumn({
                        name: "tranid",
                        label: "Document Number"
                    }),
                    search.createColumn({
                        name: "entityid",
                        join: "jobMain",
                        label: "ID"
                    }),
                    search.createColumn({
                        name: "companyname",
                        join: "jobMain",
                        label: "Project Name"
                    }),
                    search.createColumn({
                        name: "custrecord_cntm_boards_per_panel",
                        join: "bom",
                        label: "Boards Per Panel"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{jobmain.jobname}",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({
                        name: "custentity_cntm_tool_number",
                        join: "jobMain",
                        label: "Tool Number(CNTM)"
                    })
                ]
            });
            let searchResultCount = workorderSearchObj.runPaged().count;
            log.debug("workorderSearchObj result count", searchResultCount);
            let results = workorderSearchObj.run().getRange({
                start: 0,
                end: 1
            });

            if (results && results.length) {

                //returnArray.push(results[0].getValue({name: "entityid", join: "jobMain"}) +' '+ results[0].getValue({name: "formulatext", formula: "{jobmain.jobname}"}));
                returnArray.push(results[0].getText({
                    name: "custentity_cntm_tool_number",
                    join: "jobMain"
                }));
                returnArray.push(results[0].getValue({
                    name: "custrecord_cntm_boards_per_panel",
                    join: "bom"
                }));

                return returnArray;
            }
        }


        return module;
    });