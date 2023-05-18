/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
 define(['N/runtime', 'N/record', 'N/search', './lib/moment.min', './lib/ns.utils', './createCustomOperationLineRecords_CM2.1.js', './customOperationLineLibrary.js'],
 function (runtime, record, search, moment, ns_utils, custLib, custOpLineLibrary) {

     function afterSubmit(context) {
         try {
             var rec = context.newRecord
             var oldRecord = context.oldRecord
             var recId = rec.id
             let date = moment(ns_utils.dateNowByCompanyTimezone()).format('M/D/YYYY hh:mm a')
             
             log.debug('-------- START --------', { contextType: context.type, execCtx: runtime.executionContext, recType: rec.type, recId, date  })    
             /////////////WORK ORDER COMPLETION - CREATE OR EDIT CONTEXT////////////////
             if (rec.type == 'workordercompletion' && (context.type.match(/create|copy|edit|delete/g))) {
                let { type, id } = rec
                
                let woId = ''
                if (context.type == 'xedit') {
                    let lookup = search.lookupFields({ type:rec.type, id:recId, columns:['createdfrom','custbody_cntm_op_client_app','custbody_startoperation','custbody_endoperation','quantity'] })
                    if (lookup.createdfrom.length) 
                        woId = lookup.createdfrom[0].value
                } else {
                    woId = rec.getValue({ fieldId: 'createdfrom' })
                }
                let currentUser            = rec.getValue({fieldId: 'custbody_cntm_op_client_app'})
                let date                   = moment(ns_utils.dateNowByCompanyTimezone()).format('M/D/YYYY hh:mm a')
                let startOperation         = parseFloat(rec.getText({ fieldId: 'startoperation' }) || oldRecord.getValue({ fieldId: 'custbody_startoperation' })) || 0 // SEQUENCE START // return null when on delete
                let endOperation           = parseFloat(rec.getText({ fieldId: 'endoperation' }) || oldRecord.getValue({ fieldId: 'custbody_endoperation' })) || 0 // SEQUENCE END // return null when on delete
                let completedquantity_old  = oldRecord ? parseFloat(oldRecord.getValue({ fieldId: 'completedquantity' })) : 0
                let completedquantity_new  = parseFloat(rec.getValue({ fieldId: 'completedquantity' })) || 0
                let wcogoodpanel_old      = oldRecord ? parseFloat(oldRecord.getValue({ fieldId: 'custbody_cntm_wco_good_panels' })) : 0
                let wcogoodpanel_new      = parseFloat(rec.getValue({ fieldId: 'custbody_cntm_wco_good_panels' })) || 0
                let panelLot_old          = oldRecord ? oldRecord.getValue({ fieldId: 'custbody_cntm_panel_lot' }) : ''
                let panelLot_new          = rec.getValue({ fieldId: 'custbody_cntm_panel_lot' }) || ''
                log.debug('WOC vars', { woId, currentUser, date, startOperation, endOperation, completedquantity_old, completedquantity_new, wcogoodpanel_old, wcogoodpanel_new, panelLot_old, panelLot_new })

                 // Still execute below on copy
                 if (context.type.match(/copy|delete/g))
                    completedquantity_old = 0
                //(completedquantity_old != completedquantity_new || wcogoodpanel_old != wcogoodpanel_new) && 
                if (woId) {
                    let nativeOperations = manufacturingOperationTasks(woId, '')
                    //the COMPLETED QUANTITY value we use in our time calculation can now vary, depending on whether the CUSTOM OPERATION LINE record is CORE = TRUE or FALSE
                    //using 3 different possible QUANTITY values, that we will multiply by the CUSTOM OPERATION LINE record's PRODUCTION TIME value, to get total Production Time per operation
                    var woLookupObj = search.lookupFields({type: record.Type.WORK_ORDER, id: woId, columns: ['custbody_cntm_no_of_panel', 'custbody_cntm_good_panels', 'custbody_total_num_cores', 'custbody_rda_qfactor']})
                    //If the CUSTOM OPERATION LINE record is CORE = TRUE, then we use the TOTAL NUMBER CORES field on the WO (custbody_total_num_cores)
                    //If the CUSTOM OPERATION LINE record is CORE = FALSE, then we use the GOOD NUMBER OF BOARDS (custbody_cntm_good_boards)
                    log.debug('woLookupObj is:', JSON.stringify(woLookupObj))
                    var noOfPanels = woLookupObj?.custbody_cntm_no_of_panel                 
                    var goodNumberOfPanels = woLookupObj?.custbody_cntm_good_panels
                    var totalNumberOfCores = woLookupObj?.custbody_total_num_cores
                    var qFactor = parseFloat(woLookupObj?.custbody_rda_qfactor)

                    // WCO SCRAP PANEL VALUE    
                    var wcogoodpanel = 0
                    // on create    
                    //if (context.type == 'create') {   
                    wcogoodpanel = wcogoodpanel_new;
                    //} 
                    // on edit  
                    //else if (context.type == 'edit') {    
                        //if (wcogoodpanel_old != wcogoodpanel_new) {   
                        //    wcogoodpanel = wcogoodpanel_new - wcogoodpanel_old;   
                        //}
                   //}

                    // PANEL LOT VALUE
                    var lot_old = '', lotOld = '';
                    if (panelLot_old) {
                        var woLotObj_old = search.lookupFields({type: 'customrecord_cntm_lot_creation', id: panelLot_old, columns: ['custrecord_cntm_lot_lotnumber'] });
                        var lot_old = woLotObj_old?.custrecord_cntm_lot_lotnumber;
                        lotOld = lot_old;
                    }
                    
                    var lot_new = '', lotNew = '';
                    if (panelLot_new) {
                        var woLotObj_new = search.lookupFields({type: 'customrecord_cntm_lot_creation', id: panelLot_new, columns: ['custrecord_cntm_lot_lotnumber'] });
                        lot_new = woLotObj_new?.custrecord_cntm_lot_lotnumber;
                        lotNew = lot_new;
                    }
                    
                    // on create    
                    //if (context.type == 'create') {
                       // lotNew = lot_new;
                    //}
                    // on edit  
                    //else if (context.type == 'edit') {
                        //if (panelLot_old != panelLot_new || lot_new != lot_old) {
                            //lotNew = lot_new;
                            //lotOld = lot_old;
                        //}
                   //}

                    log.debug('qFactor/wcogoodpanel/lotOld/lotNew', qFactor +" "+ wcogoodpanel +" "+ lotOld +" "+ lotNew)
                    //////////////////

                    log.debug('vars', { type, id, completedquantity_old, completedquantity_new, woId, date, startOperation, endOperation, wcogoodpanel })
                    if(runtime.executionContext == 'MAPREDUCE' && context.type == 'edit'){
                        custOpLineLibrary.updateWCOgoodPanelCustomOperationLinesUponCreationOfWorkCompletion(woId, currentUser, startOperation, endOperation, noOfPanels, goodNumberOfPanels, totalNumberOfCores, completedquantity_new, qFactor, wcogoodpanel);
                    }else{
                        custOpLineLibrary.updateExistingCustomOperationLinesUponCreationOfWorkCompletion(woId, currentUser, startOperation, endOperation, noOfPanels, goodNumberOfPanels, totalNumberOfCores, completedquantity_new, qFactor, wcogoodpanel, lotOld, lotNew);
                    }
                    
                } // end if woc quantity old != new record

                if(woId){
                
                    var workOrderQty = search.lookupFields({
                        type: "workorder",
                        id: woId,
                        columns: "quantity"
                    }).quantity;

                    if(workOrderQty){
                        workOrderQty = Number(workOrderQty)
                    }else{
                        workOrderQty = 0;
                    }

                    var scrapQty = 0;
                    var builtQty = 0;

                    var woSearch = search.create({
                        type: "workorder",
                        filters:
                        [
                        ["type","anyof","WorkOrd"], 
                        "AND", 
                        ["isscrap","is","T"], 
                        "AND", 
                        ["internalid","anyof",woId]
                        ],
                        columns:
                        [
                        "built",
                        "quantityshiprecv",
                        "isscrap"
                        ]
                    });
                    var searchResultCount = woSearch.runPaged().count;
                    log.debug("woSearch result count",searchResultCount);
                    var woSearchResults = woSearch.run().getRange({
                        start: 0,
                        end: 1000
                    });
        
                    var woIds = [];
                    log.debug("woSearchResults length", woSearchResults.length)
                    if(woSearchResults.length > 0){
                        woSearchResults.forEach(function(result){
                            builtQty = parseFloat(result.getValue({name:"built"})) || 0;
                            scrapQty = parseFloat(result.getValue({name:"quantityshiprecv"})) || 0;
                        })
                    }

                    let custOperations = custLib.searchCustomOperations(woId)
                    let noOfOperations = custOperations.length 
                    // let completedSumQty = getCompletedSumQty(woId)

                    // Aug172022 as per request
                    let completedSumQty = custOperations.filter(f => f.completedqty > 0).length
                    let woPercentCompleted = (completedSumQty/noOfOperations) * 100
                    log.debug('woPercentCompleted', { 
                        'formula': `(completedSumQty/noOfOperations) * 100`, 
                        'values': `(${completedSumQty}/${noOfOperations}) * 100`,
                        woPercentCompleted 
                    })

                    if(woPercentCompleted){
                        record.submitFields({
                            type: "workorder",
                            id: woId,
                            values: {
                                custbody_wo_percent_completed: woPercentCompleted.toFixed(2)
                            },
                            options: {
                                ignoreMandatoryFields: true,
                            }
                        });
                    }
                }
             } //end if firing on WOCP
            
             log.debug('-------- END --------', { remainingUsage: runtime.getCurrentScript().getRemainingUsage() })
         } catch (e) {
             log.error(e.name, e/* .message */);
         }
     } //end afterSubmit function

     // =========================================================================================

     const manufacturingOperationTasks = (woID, currUser) => {
         let woOperations = []
         let manufacturingoperationtaskSearchObj = search.create({
             type: "manufacturingoperationtask",
             filters: [
                 ["workorder", "anyof", woID]
             ],
             columns: [
                 search.createColumn({
                     name: "name",
                     label: "Operation Name"
                 }),
                 search.createColumn({
                     name: "sequence",
                     sort: search.Sort.ASC,
                     label: "Operation Sequence"
                 }),
                 search.createColumn({
                     name: "manufacturingworkcenter",
                     label: "Manufacturing Work Center"
                 }),
                 search.createColumn({
                     name: "predecessor",
                     label: "Predecessor"
                 }),
                 search.createColumn({
                     name: "internalid",
                     join: "predecessor",
                     label: "Internal ID"
                 }),
                 search.createColumn({
                     name: "startdate",
                     label: "Start Date)"
                 }),
                 search.createColumn({
                     name: "enddate",
                     label: "End Date"
                 }),
                 search.createColumn({
                     name: "inputquantity",
                     label: "Input Quantity"
                 }),
                 search.createColumn({
                     name: "completedquantity",
                     label: "Completed Quantity"
                 }),
                 search.createColumn({
                     name: "setuptime",
                     label: "Setup Time (Min)"
                 }),
                 search.createColumn({
                     name: "runrate",
                     label: "Each"
                 }),
                 search.createColumn({
                     name: "lagtype",
                     label: "Lag Type"
                 }),
                 search.createColumn({
                     name: "lagamount",
                     label: "Lag Amount"
                 }),
                 search.createColumn({
                     name: "lagunits",
                     label: "Lag Units"
                 }),
                 search.createColumn({
                     name: "custevent_scm_operationtask_dispatched",
                     label: "Dispatched"
                 }),
                 search.createColumn({
                     name: "estimatedwork",
                     label: "Estimated Hours"
                 })
             ]
         });
         let searchResultCount = manufacturingoperationtaskSearchObj.runPaged().count;
         log.debug("manufacturingoperationtaskSearchObj result count", searchResultCount);
         z = 0
         manufacturingoperationtaskSearchObj.run().each(result => {
             opName = result.getValue('name')
             woOperations.push({
                 operator: currUser,
                 id: result.id,
                 operationname: opName,
                 operationnamenogate: opName.substring(3, opName.length),
                 workcenter_id: result.getValue('manufacturingworkcenter'),
                 workcenter_txt: result.getText('manufacturingworkcenter') || '',
                 predecessor: result.getValue('predecessor') || '',
                 sequence: parseFloat(result.getValue('sequence')) || 0,
                 startdate: result.getText('startdate') || '',
                 enddate: result.getText('enddate') || '',
                 timetaken: '',
                 inputquantity: result.getValue('inputquantity'),
                 manufacturingoperationtaskid: result.id,
                 completedquantity: result.getValue('completedquantity'),
                 setuptime: result.getValue('setuptime'),
                 runrate: result.getValue('runrate'),
                 lagtype: result.getValue('lagtype'),
                 lagamount: result.getValue('lagamount'),
                 lagunits: result.getValue('lagunits'),
                 dispatch: result.getValue('custevent_scm_operationtask_dispatched'),
                 estimatedhrs: parseFloat(result.getValue('estimatedwork')) || 0,
                 //estimatedhrscustomgatetimerecordarr  : customGateTimeRecordTimesArray,
                 projectedenddate: ''
             })
             z++
             return true;
         });

         return woOperations
     } //end manufacturingOperationTasks function

    function getCompletedSumQty(woId) {
        let qty = 0
        let ls = search.load('customsearch_general_wo_percent_complete')
        ls.filters.push(search.createFilter({
            name: 'workorder',
            operator: 'is',
            values: woId
        }))
        ls.run().each(each => {
            qty = parseFloat(each.getValue({ name: 'completedquantity', summary: 'SUM' })) || 0
        })
        log.debug('Completed Sum QTY', qty)
        return qty
    }

     function findCustomGateTimeRecordTimes(formulatextstringfull) {
         var GATE_TIMES_RETURN_ARRAY = []
         var customrecord_gate_times_and_operations_SearchObj = search.create({
             type: "customrecord_gate_times_and_operations_",
             filters: [
                 ["formulanumeric: " + formulatextstringfull, "equalto", "1"]
             ],
             columns: [
                 search.createColumn({
                     name: "internalid",
                     label: "Internal ID"
                 }),
                 search.createColumn({
                     name: "scriptid",
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
                     name: "custrecord_production_setup",
                     label: "Production Setup"
                 }),
                 search.createColumn({
                     name: "custrecord_production_runtime",
                     label: "Production Run Time"
                 }),
                 search.createColumn({
                     name: "custrecord8",
                     label: "Cost Template"
                 }),
                 search.createColumn({
                     name: "custrecord_rda_prod_group",
                     label: "Production Group"
                 }),
                 search.createColumn({
                     name: "custrecord_rda_is_core",
                     label: "Core"
                 })
             ]
         });
         var searchResultCount = customrecord_gate_times_and_operations_SearchObj.runPaged().count;
         log.debug("customrecord_gate_times_and_operations_SearchObj result count", searchResultCount);
         customrecord_gate_times_and_operations_SearchObj.run().each(function (result) {
             
             var lineObj = {}

             lineObj.id = result.getValue({
                 name: "internalid"
             })
             lineObj.name = result.getValue({
                 name: "custrecord_name_"
             })
             lineObj.wipsetup = result.getValue({
                 name: "custrecord_wip_setup_"
             })
             lineObj.wiptime = result.getValue({
                 name: "custrecord_wip_time_"
             })
             lineObj.productionsetup = result.getValue({
                 name: "custrecord_production_setup"
             })
             lineObj.productiontime = result.getValue({
                 name: "custrecord_production_runtime"
             })
             lineObj.core = result.getValue({
                 name: "custrecord_rda_is_core"
             })

             GATE_TIMES_RETURN_ARRAY.push(lineObj)

             return true;
         });
         //returns unsorted list
         return GATE_TIMES_RETURN_ARRAY
     }

    function deleteExistingCustomOperationLines(woid) {
        let custOperations = custLib.searchCustomOperations(woid)
        for (custOperation of custOperations) {
            record.delete({
                type: 'customrecord_operation_line',
                id: custOperation.id
            })
            log.debug('Deleted', { type: 'customrecord_operation_line', id: custOperation.id })
        }
        return custOperations
    }

     function createAllNewCustomOperationLines(woid, date, curruser, quantity, goodnumofpanels, totalnumofcores, deletedCustLines) {
         var nativeOperations = manufacturingOperationTasks(woid, curruser)
         log.debug('nativeOperations is:', JSON.stringify(nativeOperations));

         //using reduce function build formula to find custom Gate Time Records WIP Times
         var formulaTextString = nativeOperations.reduce(function (prevVal, currVal, idx) {
             return idx == 0 ? currVal.operationname.substring(3, currVal.operationname.length) : prevVal + "' THEN 1 WHEN '" + currVal.operationname.substring(3, currVal.operationname.length);
         }, "")

         var formulaTextStringFull = "CASE {custrecord_name_} WHEN '"
         formulaTextStringFull += formulaTextString
         formulaTextStringFull += "' THEN 1 ELSE 0 END"
         log.debug('formulatTextStringFull is:', formulaTextStringFull)
         log.debug('formulaTextStringFull is:', formulaTextStringFull)

         //return array of ordered custom GATE TIME record WIP times
         var customGateTimesArrayofObjs = findCustomGateTimeRecordTimes(formulaTextStringFull)
         log.debug('customGateTimesArrayofObjs is:', JSON.stringify(customGateTimesArrayofObjs))

         //now create all new CUSTOM OPERATION LINES
         log.debug('nativeOperations.length is:', nativeOperations.length)
         var projectedEndDate = '';
         i = 0
         nativeOperations.forEach(function (result) {
             log.debug('i is:', i)
             //return the proper index of our customGateTimesArrayofObjs to use, since that array is not sorted according to operation sequence
             var opNameNoGate = result.operationnamenogate;
             var elementPosition = customGateTimesArrayofObjs.map(function (x) {
                 return x.name;
             }).indexOf(opNameNoGate);

             if (elementPosition != -1) {
                 log.debug('Line ' + i + ' opNameNoGate elementPosition found / name:', elementPosition + ' / ' + customGateTimesArrayofObjs[elementPosition].name);
             } else {
                 log.debug('No opNameNoGate position found! Seeking:', opNameNoGate)
             }
             var newCustomOperationLine = record.create({
                 type: 'customrecord_operation_line',
                 isDynamic: true
             })
             newCustomOperationLine.setValue({
                 fieldId: 'custrecord_operation_line_wo',
                 value: woid
             })
             newCustomOperationLine.setValue({
                 fieldId: 'custrecord_operation_line_operseq',
                 value: parseInt(result.sequence)
             })
             newCustomOperationLine.setValue({
                 fieldId: 'custrecord_operation_line_opername',
                 value: result.manufacturingoperationtaskid
             })
             // Feb042022 Added as per request
             newCustomOperationLine.setValue({
                fieldId: 'custrecord_operation_line_inputqty',
                value: quantity
            })
            
            // End restore computed fields
            var setuptime = 0
            var totalNumberOfCores = totalnumofcores ? totalnumofcores : quantity
            var goodNumberOfPanels = goodnumofpanels ? goodnumofpanels : quantity
            var quantityToUse = goodNumberOfPanels || 1
            log.debug('quantity / goodNumberOfPanels / quantityToUse is:', quantity +' / '+ goodNumberOfPanels +' / '+ quantityToUse)
            var runtime = 0
            var gatetime = ''
            var core = false
            var totalRunTimeOfGateTimeRecord = 0

             if (elementPosition > -1) {
                setuptime = Number(customGateTimesArrayofObjs[elementPosition].productionsetup)
                //CUSTOM QUANTITY LOGIC, CREATE LIBRARY FILE FROM THIS//////////
                //if no value present in these two fields we just use the default QUANTITY value on the WO
                //if CORE operation indicated on GATE TIME record we use TOTAL NUM OF CORES value, else we use GOOD NUMBER OF PANELSvalue
                if (customGateTimesArrayofObjs[elementPosition].core == true) 
                    quantityToUse = totalNumberOfCores
                ////////////////////////////
                runtime = (Number(customGateTimesArrayofObjs[elementPosition].productiontime) * Number(quantityToUse))
                gatetime = customGateTimesArrayofObjs[elementPosition].id
                core = customGateTimesArrayofObjs[elementPosition].core
                //no need to set START or END DATES since this is a brand new WO, with no WOCP's against it, we only set the START DATE of the first OPERATION
                //newCustomOperationLine.setValue({fieldId: 'custrecord_operation_line_startdate', value: woId})
                //newCustomOperationLine.setValue({fieldId: 'custrecord_operation_line_enddate', value: woId})
                //newCustomOperationLine.setValue({fieldId: 'custrecord_operation_line_timetaken', value: woId})
                //add the PRODUCTION SETUP and PRODUCTION RUN TIME
                totalRunTimeOfGateTimeRecord = Number(customGateTimesArrayofObjs[elementPosition].productionsetup) + (Number(customGateTimesArrayofObjs[elementPosition].productiontime) * Number(quantityToUse))
                log.debug('productionsetup / productiontime / totalRunTimeOfGateTimeRecord at index ' + i + ' is:', Number(customGateTimesArrayofObjs[elementPosition].productionsetup) + ' / ' + Number(customGateTimesArrayofObjs[elementPosition].productiontime) + ' / ' + totalRunTimeOfGateTimeRecord)
             }
             newCustomOperationLine.setValue({
                fieldId: 'custrecord_operation_line_setuptime',
                value: parseFloat(setuptime).toFixed(3)
            })       
             newCustomOperationLine.setValue({
                 fieldId: 'custrecord_operation_line_runtime',
                 value: parseFloat(runtime).toFixed(3)
             })
             newCustomOperationLine.setValue({
                 fieldId: 'custrecord_operation_line_mwc',
                 value: result.workcenter_id
             })
             newCustomOperationLine.setValue({
                 fieldId: 'custrecord_operation_line_predecessor',
                 value: result.predecessor
             })
             newCustomOperationLine.setValue({
                 fieldId: 'custrecord_operation_line_gate_tim',
                 value: gatetime
             })
             newCustomOperationLine.setValue({
                 fieldId: 'custrecord_operation_line_core',
                 value: core
             })

             //if on first OPERATION line then we just paste START DATE and PROJECTED END DATE only upon WO create
             if (i == 0) {
                 projectedEndDate = moment(new Date(date)).add(totalRunTimeOfGateTimeRecord, 'minutes').format('M/D/YYYY hh:mm a')
                 log.debug('projectedEndDate / totalRunTimeOfGateTimeRecord at index ' + i + ' is:', projectedEndDate + ' / ' + totalRunTimeOfGateTimeRecord);

                 newCustomOperationLine.setValue({
                     fieldId: 'custrecord_operation_line_startdate',
                     value: date
                 })
                 log.debug('date at index ' + i + ' is:', date + ' / ' + totalRunTimeOfGateTimeRecord);
                 log.debug('moment is:', moment(new Date(date)));
             }
             //on second and subsequent custom OPERATION lines we project out what END DATES may be
             if (i > 0) {
                 log.debug('projectedEndDate at index ' + i + ' is:', projectedEndDate)
                 log.debug('projectedEndDate / totalRunTimeOfGateTimeRecord at index ' + i + ' is:', projectedEndDate + ' / ' + totalRunTimeOfGateTimeRecord);
                 log.debug('moment at index ' + i + ' is:', moment(new Date(projectedEndDate)));
                 projectedEndDate = moment(new Date(projectedEndDate)).add(totalRunTimeOfGateTimeRecord, 'minutes').format('M/D/YYYY hh:mm a')                  
             }
             newCustomOperationLine.setValue({
                 fieldId: 'custrecord_operation_line_projectedendda',
                 value: projectedEndDate
             })

            // Added 03222022: Restore the computed fields
            let deletedIdx = deletedCustLines.findIndex(fi => fi.sequence == parseInt(result.sequence))
            if (deletedIdx > -1) {
                // Since this function is only called under WO and MOT, we could just skip setting this custoperator field
                // newCustomOperationLine.setValue({
                //     fieldId: 'custrecord_operation_line_oper',
                //     value: deletedCustLines[deletedIdx].operator
                // })
                newCustomOperationLine.setValue({
                    fieldId: 'custrecord_operation_line_startdate',
                    value: deletedCustLines[deletedIdx].startdate
                })
                newCustomOperationLine.setValue({
                    fieldId: 'custrecord_operation_line_enddate',
                    value: deletedCustLines[deletedIdx].enddate
                })
                newCustomOperationLine.setValue({
                    fieldId: 'custrecord_operation_line_timetaken',
                    value: deletedCustLines[deletedIdx].timetaken
                })
                newCustomOperationLine.setValue({
                    fieldId: 'custrecord_operation_line_projectedendda',
                    value: deletedCustLines[deletedIdx].projected
                })
                newCustomOperationLine.setValue({
                    fieldId: 'custrecord_operation_line_timetaken',
                    value: deletedCustLines[deletedIdx].timetaken
                })
                newCustomOperationLine.setValue({
                    fieldId: 'custrecord_operation_line_setuptime',
                    value: parseFloat(deletedCustLines[deletedIdx].setuptime).toFixed(3)
                })
                newCustomOperationLine.setValue({
                    fieldId: 'custrecord_operation_line_runtime',
                    value: parseFloat(deletedCustLines[deletedIdx].runtime).toFixed(3)
                })
            }
            newCustomOperationLine.setValue({
                fieldId: 'custrecord_operation_line_completedqty',
                value: result.completedquantity
            })
             newCustomOperationLine.save({
                 enableSourcing: false,
                 ignoreMandatoryFields: true
             })
             i++
             return true;
         });
     }
     
     return {
        afterSubmit
     };
 });