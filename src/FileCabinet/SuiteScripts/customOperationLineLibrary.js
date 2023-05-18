/**
 *@NApiVersion 2.1
 %@NModuleScope Public
 *
 * Library file for target gate 1, 2, 3 and projected end date fields computation
 * Usages: createCustomOperationLineRecords_UE2.1.v2.0.js, createCustomOperationLineRecords_MR2.1.js
 */
 define(['N/search', 'N/format', './lib/moment.min', './lib/ns.utils','N/record'], (search, format, moment, ns_utils,record) => {

    const diffDates = (start, end) => {
        start = new Date(start).getTime()
        end = new Date(end).getTime()
        var d = Math.abs(end - start) / 1000 // delta
        var r = {} // result
        var s = { // structure
            year: 31536000,
            month: 2592000,
            week: 604800, // uncomment row to ignore
            day: 86400, // feel free to add your own row
            hour: 3600,
            minute: 60,
            second: 1
        }
        Object.keys(s).forEach(function (key) {
            r[key] = Math.floor(d / s[key])
            d -= r[key] * s[key]
        })
        str = ""
        for (k in r) {
            if (r[k]) {
                str += `${Math.round(r[k])} ${k}(s) `
            }
        }
        ////////// OUTPUT FORMAT: "2 Day(s) 2 hr(s) 30 min(s)"
        return str
    } //end diffDates function

    const findCustomGateTimeRecordTimes = (formulatextstringfull) => {
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
                    name: "name",
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
                name: "name"
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

    const searchCustomOperations = woIds => {
        let ops = []
        var customrecord_operation_lineSearchObj = search.create({
            type: "customrecord_operation_line",
            filters:
            [
                ["custrecord_operation_line_wo","anyof",woIds]
             ],
            columns:
            [
               search.createColumn({name: "custrecord_operation_line_oper", label: "Operator"}),
               search.createColumn({name: "custrecord_operation_line_operseq", sort: search.Sort.ASC, label: "Operation Sequence"}),
               search.createColumn({name: "custrecord_operation_line_opername", label: "Operation Name"}),
               search.createColumn({name: "custrecord_operation_line_mwc", label: "Manufacturing Work Center"}),
               search.createColumn({name: "custrecord_operation_line_predecessor", label: "Predecessor"}),
               search.createColumn({name: "custrecord_operation_line_startdate", label: "Start Date"}),
               search.createColumn({name: "custrecord_operation_line_enddate", label: "End Date"}),
               search.createColumn({name: "custrecord_operation_line_wo", label: "Work Order"}),
               search.createColumn({name: "custrecord_operation_line_timetaken", label: "Time Taken"}),
               search.createColumn({name: "custrecord_operation_line_inputqty", label: "Input Quantity"}),
               search.createColumn({name: "custrecord_operation_line_projectedendda", label: "Projected End Date"}),
               search.createColumn({name: "custrecord_operation_line_completedqty", label: "Completed Quantity"}),
               search.createColumn({name: "custrecord_operation_line_setuptime", label: "Production Setup Time (Min)"}),
               search.createColumn({name: "custrecord_operation_line_runtime", label: "Production Run Time (Min)"}),
               search.createColumn({name: "custrecord_operation_line_each", label: "Each"}),
               search.createColumn({name: "custrecord_operation_line_core", label: "Core"}),
               search.createColumn({name: "custrecord_operation_line_wco_goodpanel", label: "WCO Good Panel"}),
               search.createColumn({name: "custrecord_operation_line_panel_lot_no", label: "Panel/Lot#"}),
               search.createColumn({name: "custrecord_operation_line_panel_lot_no", label: "Panel/Lot#"}),
               search.createColumn({name: "custrecord_operation_line_setup_qfactor", label: "Production Setup Time (QFactor)"}),
               search.createColumn({name: "custrecord_operation_line_run_qfactor", label: "Production Run Time (QFactor)"})
            ]
         });
         customrecord_operation_lineSearchObj = ns_utils.expandSearch(customrecord_operation_lineSearchObj)
         customrecord_operation_lineSearchObj.forEach(result => {
            let sequence    = parseFloat(result.getValue('custrecord_operation_line_operseq')) || 0
            let setuptime   = parseFloat(result.getValue('custrecord_operation_line_setuptime')) || 0
            let runtime     = parseFloat(result.getValue('custrecord_operation_line_runtime')) || 0
            let core        = result.getValue('custrecord_operation_line_core')
            let setupqfactor= parseFloat(result.getValue('custrecord_operation_line_setup_qfactor')) || 0
            let runqfactor  = parseFloat(result.getValue('custrecord_operation_line_run_qfactor')) || 0
            
            ops.push({
                id          : result.id,
                name        : result.getText('custrecord_operation_line_opername') || result.getValue('custrecord_operation_line_opername'),
                operator    : result.getValue('custrecord_operation_line_oper'),
                sequence,
                timetaken   : result.getValue('custrecord_operation_line_timetaken'),
                completedqty: parseFloat(result.getValue('custrecord_operation_line_completedqty')) || 0,
                startdate   : result.getValue('custrecord_operation_line_startdate'),
                enddate     : result.getValue('custrecord_operation_line_enddate'),
                setuptime   : setuptime,
                runtime     : runtime,
                projected   : result.getValue('custrecord_operation_line_projectedendda'),
                minstoadd   : setuptime + runtime,
                core        : core,
                wcogood     : parseFloat(result.getValue('custrecord_operation_line_wco_goodpanel')) || 0,
                panellot    : result.getValue('custrecord_operation_line_panel_lot_no'),
                setupqfactor: setupqfactor,
                runqfactor  : runqfactor,
                woId        : result.getValue('custrecord_operation_line_wo')
            })
         });
        return ops
    }

    const computeWOTargetFields = woIds => {
        let allCustOperationLines = searchCustomOperations(woIds)
        let date = moment(ns_utils.dateNowByCompanyTimezone()).format('M/D/YYYY hh:mm a') // '12/21/2021 11:22 am' '12/11/2021 11:10 am' // testing
        // let date = '1/3/2022 8:24 pm' // Testing purposes
        log.debug('Current date', date)
        let shifts = searchRecentShiftTime()
        let result = {}

        for (woId of woIds) {
            let allCustOperations = allCustOperationLines.filter(f => f.woId == woId)
            let mdyyyy = moment(new Date()).format('M/D/YYYY')
            let shift = JSON.parse(JSON.stringify(shifts))
            shift.start_1st = mdyyyy + ' ' + shifts.start_1st
            shift.end_1st = mdyyyy + ' ' + shifts.end_1st
            shift.start_2nd = mdyyyy + ' ' + shifts.start_2nd
            let mdyyyy_1 = moment(mdyyyy).add('day', 1).format('M/D/YYYY') // Next day
            shift.end_2nd = mdyyyy_1 + ' ' + shifts.end_2nd
            shift.start_3rd = mdyyyy_1 + ' ' + shifts.start_3rd
            shift.end_3rd = mdyyyy_1 + ' ' + shifts.end_3rd

            // Scenario sample: WO4002 with the current date Jan22020 12:41pm
            if (new Date(shift.end_3rd) < new Date(shift.end_2nd)) {
                shift.end_2nd = mdyyyy + ' ' + shifts.end_2nd
            }
            log.debug('Updated shifts', shift)
    
            // Filter out custoperations with projected end date less then the current date
            let _allCustOperations = allCustOperations//.filter(f => new Date(f.projected) > new Date(date)) // Feb112022 Removed this filter as per request
            log.debug('Updated allCustOperations', allCustOperations)
    
            // Compute target gates
            let gate1 = {}
            let gate2 = {}
            let gate3 = {}
    
            for (let i in _allCustOperations) {
                let custOperation = _allCustOperations[i]
                if (new Date(shift.end_1st) < new Date(custOperation.projected)) {
                    gate1.custOperationId = _allCustOperations[i==0?i:(i-1)].name
                    gate1.sequence = _allCustOperations[i==0?i:(i-1)].sequence
                    break
                }
            }
            /*for (custOperation of _allCustOperations) {
                if (new Date(shift.end_2nd) < new Date(custOperation.projected)) {
                    gate2.custOperationId = custOperation.name
                    gate2.sequence = custOperation.sequence
                    break
                }
            }
            for (custOperation of _allCustOperations) {
                if (new Date(shift.end_3rd) < new Date(custOperation.projected)) {
                    gate3.custOperationId = custOperation.name
                    gate3.sequence = custOperation.sequence
                    break
                }
            } */
            // Jan042022 Changed the formula as per request
            // Jan112022 Changed back to this formula as per request
            for (let i in _allCustOperations) {
                let custOperation = _allCustOperations[i]
                if (new Date(shift.end_2nd) < new Date(custOperation.projected)) {
                    gate2.custOperationId = _allCustOperations[i==0?i:(i-1)].name
                    gate2.sequence = _allCustOperations[i==0?i:(i-1)].sequence
                    break
                }
            }
            for (let i in _allCustOperations) {
                let custOperation = _allCustOperations[i]
                if (new Date(shift.end_3rd) < new Date(custOperation.projected)) {
                    gate3.custOperationId = _allCustOperations[i==0?i:(i-1)].name
                    gate3.sequence = _allCustOperations[i==0?i:(i-1)].sequence
                    break
                }
            }
            // Feb042022 Changed back the formula as per request
            /* for (custOperation of _allCustOperations) {
                if (new Date(shift.end_1st) < new Date(custOperation.projected)) {
                    gate1.custOperationId = custOperation.name
                    gate1.sequence = custOperation.sequence
                    break
                }
            }
            for (custOperation of _allCustOperations) {
                if (new Date(shift.end_2nd) < new Date(custOperation.projected)) {
                    gate2.custOperationId = custOperation.name
                    gate2.sequence = custOperation.sequence
                    break
                }
            }
            for (custOperation of _allCustOperations) {
                if (new Date(shift.end_3rd) < new Date(custOperation.projected)) {
                    gate3.custOperationId = custOperation.name
                    gate3.sequence = custOperation.sequence
                    break
                }
            } */
            // Handling: If all past the current date, just grab the last operation lines'
            if (!gate1.custOperationId) {
                gate1.custOperationId = allCustOperations[allCustOperations.length-1].name
                gate1.sequence = allCustOperations[allCustOperations.length-1].sequence
            }
            if (!gate2.custOperationId) {
                gate2.custOperationId = allCustOperations[allCustOperations.length-1].name
                gate2.sequence = allCustOperations[allCustOperations.length-1].sequence
            }
            if (!gate3.custOperationId) {
                gate3.custOperationId = allCustOperations[allCustOperations.length-1].name
                gate3.sequence = allCustOperations[allCustOperations.length-1].sequence
            }

            result[woId] = {
                gate1,
                gate2,
                gate3,
                projected: allCustOperations[allCustOperations.length-1].projected
            }
        }
        log.debug('TARGET FIELDS', result)
        return result
    }

    const searchRecentShiftTime = () => {
        var customrecord_shift_timesSearchObj = search.create({
            type: "customrecord_shift_times",
            filters:
            [
                ["isinactive","is","F"]
            ],
            columns:
            [
               search.createColumn({name: "internalid", sort: search.Sort.DESC}),
               search.createColumn({name: "custrecord_first_shift_end", label: "1st Shift End"}),
               search.createColumn({name: "custrecord_first_shift_start", label: "1st Shift Start"}),
               search.createColumn({name: "custrecord_second_shift_end", label: "2nd Shift End"}),
               search.createColumn({name: "custrecord_second_shift_start", label: "2nd Shift Start"}),
               search.createColumn({name: "custrecord_third_shift_end", label: "3rd Shift End"}),
               search.createColumn({name: "custrecord_third_shift_start", label: "3rd Shift Start"}),
               search.createColumn({name: "created", label: "Date Created"}),
               search.createColumn({name: "displaynametranslated", label: "Display Name (Translated)"})
            ]
         });
         var shift = {}
         customrecord_shift_timesSearchObj.run().each(function(result){ // Return 1 result
            shift.start_1st = result.getValue({ name: 'custrecord_first_shift_start' })
            shift.end_1st   = result.getValue({ name: 'custrecord_first_shift_end' })
            shift.start_2nd = result.getValue({ name: 'custrecord_second_shift_start' })
            shift.end_2nd   = result.getValue({ name: 'custrecord_second_shift_end' })
            shift.start_3rd = result.getValue({ name: 'custrecord_third_shift_start' })
            shift.end_3rd   = result.getValue({ name: 'custrecord_third_shift_end' })
         });
        log.debug('Recent shift', shift)
        return shift
    }

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
                operationnamenogate: opName,//opName.substring(3, opName.length),
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
                //estimatedhrscustomgatetimerecordarr   : customGateTimeRecordTimesArray,
                projectedenddate: ''
            })
            z++
            return true;
        });

        return woOperations
    } //end manufacturingOperationTasks function

// workOrderId = the WORK ORDER INTERNAL ID in the WORK ORDER COMPLETION (ID: createdfrom)
// operatorId = the OP CLIENT APP/OPERATOR in the WORK ORDER COMPLETION (ID: custbody_cntm_op_client_app)
// workOrderQuantity = the WORK ORDER QUANTITY of the WORK ORDER COMPLETION (ID: quantity)
// goodNumberOfPanels = WORK ORDER main line field (ID: custbody_cntm_good_panels)
// totalNumberOfCores = WORK ORDER main line field (ID: custbody_total_num_cores)
// qfactor = WORK ORDER main line field (ID: custbody_rda_qfactor)
    const deleteAndCreateCustomOperationLines = (woId, currUser, quantity, goodnumofpanels, totalnumofcores, qfactor) => {
        try{
            var woRecordObj = search.lookupFields({
                type: "workorder",
                id: woId,
                columns: ["custbody_rda_wo_priorty", "custbody_rda_wo_priorty_2", "custbody_comments_for_dash", "custbody_comments_for_prod", "custbody_rda_wo_sched_due_date", "custbody_wo_percent_completed"]
            });

            var woPriority1 = woRecordObj.custbody_rda_wo_priorty;
            var woPriority2 = woRecordObj.custbody_rda_wo_priorty_2;
            var commentsDash = woRecordObj.custbody_comments_for_dash;
            var commentsProd = woRecordObj.custbody_comments_for_prod;
            var woSchedDue = woRecordObj.custbody_rda_wo_sched_due_date;
            var percentComp = woRecordObj.custbody_wo_percent_completed;

            log.debug("wop1/wop2/commentDash/commentProd/woSchedDue/percentComp",woPriority1+" "+woPriority2+ " "+commentsDash+" "+commentsProd+" "+woSchedDue+" "+percentComp)

            log.debug("woId, currUser, quantity, goodnumofpanels, totalnumofcores, qfactor",woId+"/"+currUser+"/"+quantity+"/"+goodnumofpanels+"/"+totalnumofcores+"/"+qfactor)
            // DELETE LINES START
            var deletedCustLines = searchCustomOperations(woId);
            var target = {};
            var firstOpName = "";
            for (custOperation of deletedCustLines) {
                record.delete({
                    type: 'customrecord_operation_line',
                    id: custOperation.id
                })
                log.debug('Deleted', { type: 'customrecord_operation_line', id: custOperation.id })
            }
            // DELETE LINE END

            // CREATE LINES START
            var date = moment(ns_utils.dateNowByCompanyTimezone()).format('M/D/YYYY hh:mm a')
            var nativeOperations = manufacturingOperationTasks(woId, currUser)
            log.debug('nativeOperations is:', JSON.stringify(nativeOperations));

            //using reduce function build formula to find custom Gate Time Records WIP Times
            var formulaTextString = nativeOperations.reduce(function (prevVal, currVal, idx) {
                // return idx == 0 ? currVal.operationname.substring(3, currVal.operationname.length) : prevVal + "' THEN 1 WHEN '" + currVal.operationname.substring(3, currVal.operationname.length);
                return idx == 0 ? currVal.operationname : prevVal + "' THEN 1 WHEN '" + currVal.operationname;
            }, "")

            var formulaTextStringFull = "CASE {name} WHEN '"
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
            var wipOpObj = {};
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
                    value: woId
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

                newCustomOperationLine.setValue({
                    fieldId: 'custrecord_operation_line_percentcomp',
                    value: parseFloat(percentComp)
                })

                newCustomOperationLine.setValue({
                    fieldId: 'custrecord_operation_line_wopriority1',
                    value: woPriority1
                })

                newCustomOperationLine.setValue({
                    fieldId: 'custrecord_operation_line_wopriority2',
                    value: woPriority2
                })

                newCustomOperationLine.setValue({
                    fieldId: 'custrecord_operation_line_wo_scheddue',
                    value: (woSchedDue)?format.parse({ value : woSchedDue, type : format.Type.DATE}):''
                })

                newCustomOperationLine.setValue({
                    fieldId: 'custrecord_operation_line_comments_prod',
                    value: commentsProd
                })

                newCustomOperationLine.setValue({
                    fieldId: 'custrecord_operation_line_commentsdash',
                    value: commentsDash
                })

                if(result.sequence == "10"){
                    firstOpName = result.operationname;
                }

                wipOpObj[result.sequence] = 0;
                
                // End restore computed fields
                var setuptime = 0
                var totalNumberOfCores = totalnumofcores ? totalnumofcores : quantity
                var goodNumberOfPanels = goodnumofpanels ? goodnumofpanels : quantity
                var quantityToUse = goodNumberOfPanels
                var runtime = 0
                var gatetime = ''
                var core = false
                var totalRunTimeOfGateTimeRecord = 0
                var qfactorProduction = parseFloat(qfactor)/100;
                
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
                    totalRunTimeOfGateTimeRecord = (Number(customGateTimesArrayofObjs[elementPosition].productionsetup) / Number(qfactorProduction)) + ((Number(customGateTimesArrayofObjs[elementPosition].productiontime) * Number(quantityToUse)) / Number(qfactorProduction))
                    log.debug('productionsetup / productiontime / qfactorProduction / totalRunTimeOfGateTimeRecord at index ' + i + ' is:', Number(customGateTimesArrayofObjs[elementPosition].productionsetup) + ' / ' + Number(customGateTimesArrayofObjs[elementPosition].productiontime) + ' / ' + Number(qfactorProduction) + ' / ' + totalRunTimeOfGateTimeRecord)
                }
                log.debug("runtime/setuptime",runtime+"/"+setuptime)
                newCustomOperationLine.setValue({
                    fieldId: 'custrecord_operation_line_setuptime',
                    value: setuptime//parseFloat(setuptime).toFixed(3)
                })       
                newCustomOperationLine.setValue({
                    fieldId: 'custrecord_operation_line_runtime',
                    value: runtime//parseFloat(runtime).toFixed(3)
                })
                newCustomOperationLine.setValue({
                    fieldId: 'custrecord_operation_line_setup_qfactor',
                    value: parseFloat(Number(customGateTimesArrayofObjs[elementPosition].productionsetup) / Number(qfactorProduction)).toFixed(2)
                })       
                newCustomOperationLine.setValue({
                    fieldId: 'custrecord_operation_line_run_qfactor',
                    value: parseFloat((Number(customGateTimesArrayofObjs[elementPosition].productiontime) * Number(quantityToUse)) / Number(qfactorProduction)).toFixed(2)
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
                    newCustomOperationLine.setValue({
                        fieldId: 'custrecord_operation_line_oper',
                        value: deletedCustLines[deletedIdx].operator
                    })
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
                    // newCustomOperationLine.setValue({
                    //     fieldId: 'custrecord_operation_line_setuptime',
                    //     value: parseFloat(deletedCustLines[deletedIdx].setuptime).toFixed(3)
                    // })
                    // newCustomOperationLine.setValue({
                    //     fieldId: 'custrecord_operation_line_runtime',
                    //     value: parseFloat(deletedCustLines[deletedIdx].runtime).toFixed(3)
                    // })
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

            target = computeWOTargetFields([woId])
        }catch(e){
            log.debug("error",e);
        }

        var targetGateObjReturn = {
        };
        
        if(target[woId].gate1.custOperationId){
            targetGateObjReturn["custbody_target_gate_first"] = target[woId].gate1.custOperationId;
        }

        if(target[woId].gate2.custOperationId){
            targetGateObjReturn["custbody_target_gate_second"] = target[woId].gate2.custOperationId;
        }

        if(target[woId].gate3.custOperationId){
            targetGateObjReturn["custbody_target_gate_third"] = target[woId].gate3.custOperationId;
        }

        if(firstOpName){
            targetGateObjReturn["first_op_name"] = firstOpName;
        }

        if(projectedEndDate){
            targetGateObjReturn["projectedEndDate"] = projectedEndDate;
        }

        targetGateObjReturn["wip_op_list"] = wipOpObj;

        return targetGateObjReturn;
    }

    const updateExistingCustomOperationLinesUponCreationOfWorkCompletion = (woId, currentUser, startOperation, endOperation, noOfPanels, goodNumberOfPanels, totalNumberOfCores, completedquantity_new, qFactor, wcogoodpanel, lotOld, lotNew) => {
        try{
            var woRecordObj = search.lookupFields({
                type: "workorder",
                id: woId,
                columns: ["custbody_rda_wo_priorty", "custbody_rda_wo_priorty_2", "custbody_comments_for_dash", "custbody_comments_for_prod", "custbody_rda_wo_sched_due_date", "custbody_wo_percent_completed"]
            });

            var woPriority1 = woRecordObj.custbody_rda_wo_priorty;
            var woPriority2 = woRecordObj.custbody_rda_wo_priorty_2;
            var commentsDash = woRecordObj.custbody_comments_for_dash;
            var commentsProd = woRecordObj.custbody_comments_for_prod;
            var woSchedDue = woRecordObj.custbody_rda_wo_sched_due_date;
            var percentComp = woRecordObj.custbody_wo_percent_completed;
            var wcoGoodPanel = Number(wcogoodpanel) || 0;
            var lotOld = lotOld;
            var lotNew = lotNew;

            log.debug("wop1/wop2/commentDash/commentProd/woSchedDue/percentComp/wcoGoodPanel/lotOld/lotNew",woPriority1+" "+woPriority2+ " "+commentsDash+" "+commentsProd+" "+woSchedDue+" "+percentComp+" "+wcoGoodPanel+" "+lotOld+" "+lotNew)

            var qfactorProduction = Number(qFactor)/100;
            var date = moment(ns_utils.dateNowByCompanyTimezone()).format('M/D/YYYY hh:mm a');
            var nativeOperations = manufacturingOperationTasks(woId, '')
            var custOperations = searchCustomOperations(woId)
            custOperations = custOperations.filter(f => f.sequence >= startOperation)
            var custOperationsWithinRange = custOperations.filter(f => f.sequence <= endOperation)
            custOperationsWithinRange = custOperationsWithinRange.map(m => {
                m.operator = currentUser
                return m
            })
            log.debug('Current user', currentUser)
            log.debug('Custoperations within range', custOperationsWithinRange)
            var custOperationsSucceeding = custOperations.filter(f => f.sequence > endOperation)

            for (i in custOperationsWithinRange) {
                var finalLot = '';
                var finalLotArray = [];

                custOperationsWithinRange[i].setupqfactor = custOperationsWithinRange[i].setupqfactor
                custOperationsWithinRange[i].runqfactor = custOperationsWithinRange[i].runqfactor

                if (i == 0) {
                    custOperationsWithinRange[i].enddate   = date
                    custOperationsWithinRange[i].projected = date
                } 
                else {
                    custOperationsWithinRange[i].enddate   = date
                    custOperationsWithinRange[i].startdate = date
                    custOperationsWithinRange[i].projected = date
                }

                // Panel Lot Value
                var currentPanelLotArray = custOperationsWithinRange[i].panellot == ''? [] : custOperationsWithinRange[i].panellot.split(",");
                var finalLot = '';
                if (lotOld != '') {
                    // edit
                    log.debug('edit', currentPanelLotArray);
                    if (currentPanelLotArray.indexOf(lotOld) >= 0) {
                        // edit and lot has changed
                        if (lotOld != lotNew) {
                            var clearedLotArray = currentPanelLotArray.splice(currentPanelLotArray.indexOf(lotOld), 1);
                            log.debug('clearedLotArray', clearedLotArray);
                            clearedLotArray.push(lotNew);
                            log.debug('clearedLotArray', clearedLotArray);
                            finalLot = clearedLotArray.join();
                        }
                        // edit and lot has not changed
                        else {
                            log.debug('lotOld == lotNew', (lotOld == lotNew));
                            finalLot = currentPanelLotArray.join();;
                        }
                        
                    }
                    // edit but lot is not yet added
                    else {
                        currentPanelLotArray.push(lotNew);
                        finalLot = currentPanelLotArray.join();
                    }
                }
                // create
                else {
                    log.debug('create', currentPanelLotArray);
                    currentPanelLotArray.push(lotNew);
                    log.debug('currentPanelLotArray', currentPanelLotArray);
                    finalLot = currentPanelLotArray.join();
                }

                // Feb042022 Added as per request
                let idx = nativeOperations.findIndex(fi => fi.sequence == custOperationsWithinRange[i].sequence)
                custOperationsWithinRange[i].completedqty = (idx > -1) ? nativeOperations[idx].completedquantity : 0
                custOperationsWithinRange[i].wcogood = (idx > -1) ? custOperationsWithinRange[i].wcogood + wcoGoodPanel : custOperationsWithinRange[i].wcogood
                custOperationsWithinRange[i].panellot = (idx > -1) ? finalLot : custOperationsWithinRange[i].panellot
            }

            for (i in custOperationsSucceeding) {
                //determine whether the CUSTOM OPERATION LINE is CORE = TRUE or FALSE
                    var coreBool = custOperationsSucceeding[i].core
                    var nonCoreQty = goodNumberOfPanels ? goodNumberOfPanels: noOfPanels
                    var qtyToUse = coreBool == true ? totalNumberOfCores : nonCoreQty
                    //if CORE = TRUE we use totalNumberOfCores, else we use goodNumberOfPanels.. if goodNumberOfPanels is null, we use noOfPanels.. if that's null we use COMPLETED QTY
                    var qtyToUse = qtyToUse ? qtyToUse : completedquantity_new
                    //var minsToAdd = custOperationsSucceeding[i-1].runtime + custOperationsSucceeding[i-1].setuptime
                    //  log.debug('OPERATIONSEQUENCE / coreBool:', custOperationsSucceeding[i].sequence +' / '+ coreBool)
                    
                if (i == 0) {
                    custOperationsSucceeding[i].startdate = date
                    custOperationsSucceeding[i].projected = moment(new Date(date)).add((custOperationsSucceeding[i].minstoadd / qfactorProduction), 'minutes').format('M/D/YYYY hh:mm a')
                    custOperationsSucceeding[i].setupqfactor = parseFloat(Number(custOperationsSucceeding[i].setuptime) / Number(qfactorProduction)).toFixed(2)
                    custOperationsSucceeding[i].runqfactor = parseFloat(Number(custOperationsSucceeding[i].runtime) / Number(qfactorProduction)).toFixed(2)
                } 
                else {
                    //var minsToAdd = custOperationsSucceeding[i-1].runtime + custOperationsSucceeding[i-1].setuptime
                    custOperationsSucceeding[i].startdate       = custOperationsSucceeding[i].startdate ? custOperationsSucceeding[i].startdate : '';
                    custOperationsSucceeding[i].enddate         = custOperationsSucceeding[i].enddate ? custOperationsSucceeding[i].enddate : '';
                    custOperationsSucceeding[i].prev_projected  = custOperationsSucceeding[i-1].projected
                    custOperationsSucceeding[i].projected       = moment(new Date(custOperationsSucceeding[i].prev_projected)).add((custOperationsSucceeding[i].minstoadd / qfactorProduction), 'minutes').format('M/D/YYYY hh:mm a')
                    custOperationsSucceeding[i].setupqfactor = parseFloat(Number(custOperationsSucceeding[i].setuptime) / Number(qfactorProduction)).toFixed(2)
                    custOperationsSucceeding[i].runqfactor = parseFloat(Number(custOperationsSucceeding[i].runtime) / Number(qfactorProduction)).toFixed(2)
                }
            }
            custOperations = custOperationsWithinRange.concat(custOperationsSucceeding)

            //// Compute time taken
            custOperations = custOperations.map(m => {
                m.timetaken = (m.startdate && m.enddate) ? diffDates(custOperations[0].startdate, m.enddate) : ''
                return m
            })

            log.debug('Final custoperations', custOperations)
            // return

            if (custOperations.length) {
                for (custOperation of custOperations) {
                    try {
                        // UNCOMMENT AFTER TESTING
                        record.submitFields({
                            type: "customrecord_operation_line",
                            id: custOperation.id,
                            values: {
                                custrecord_operation_line_oper: custOperation.operator,
                                custrecord_operation_line_startdate: custOperation.startdate,
                                custrecord_operation_line_enddate: custOperation.enddate,
                                custrecord_operation_line_projectedendda: custOperation.projected,
                                custrecord_operation_line_timetaken: custOperation.timetaken,
                                custrecord_operation_line_completedqty: custOperation.completedqty,
                                custrecord_operation_line_wopriority1: woPriority1,
                                custrecord_operation_line_wopriority2: woPriority2,
                                custrecord_operation_line_wo_scheddue: (woSchedDue)?format.parse({ value : woSchedDue, type : format.Type.DATE}):'',
                                custrecord_operation_line_comments_prod: commentsProd,
                                custrecord_operation_line_commentsdash: commentsDash,
                                custrecord_operation_line_wco_goodpanel: custOperation.wcogood,
                                custrecord_operation_line_panel_lot_no: custOperation.panellot,
                                custrecord_operation_line_setup_qfactor: custOperation.setupqfactor,
                                custrecord_operation_line_run_qfactor: custOperation.runqfactor
                            },
                            options: {
                                ignoreMandatoryFields: true,
                            }
                        })
                    } catch (e) {
                        log.debug('Error updating custoperator', {
                            custOperation,
                            error: e.message
                        })
                    }
                }
                //write LATEST PROJECTED END DATE value to associated WORK ORDER, if we're on the last OPERATION line (highest OPERATION SEQUENCE number)
                //this is the latest PROJECTED END DATE on the entire WORK ORDER
                log.debug('latestProjectedEndDate:', custOperations[custOperations.length-1].projected)
                
                var vars = {
                    'custbody_latest_proj_end_date': custOperations[custOperations.length-1].projected
                }

                let target = computeWOTargetFields([woId])

                if (target[woId]) {
                    if (target[woId].gate1.custOperationId) 
                        vars.custbody_target_gate_first = target[woId].gate1.custOperationId
                    if (target[woId].gate2.custOperationId) 
                        vars.custbody_target_gate_second = target[woId].gate2.custOperationId
                    if (target[woId].gate3.custOperationId) 
                        vars.custbody_target_gate_third = target[woId].gate3.custOperationId
                }

                log.debug('WO fields to update', vars)

                // UNCOMMENT AFTER TESTING
                // try {
                //     if (context.type == 'xedit') {
                //         for (k in vars) 
                //             rec.setValue({ fieldId: k, value: vars[k] })
                //         rec.save({ ignoreMandatoryFields: true })
                //     } else {
                        record.submitFields({
                            type: record.Type.WORK_ORDER,
                            id: woId,
                            values: vars,
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });
                    //}
                    log.debug('Success updating WO fields')
                // } catch(e) {
                //     log.debug('Error updating WO fields', e.message)
                // }
            }
        }catch(e){
            log.debug('Error updateExistingCustomOperationLinesUponCreationOfWorkCompletion', e.message)
        }
    }

    const updateWCOgoodPanelCustomOperationLinesUponCreationOfWorkCompletion = (woId, currentUser, startOperation, endOperation, noOfPanels, goodNumberOfPanels, totalNumberOfCores, completedquantity_new, qFactor, wcogoodpanel) => {
        try{
            var woRecordObj = search.lookupFields({
                type: "workorder",
                id: woId,
                columns: ["custbody_rda_wo_priorty", "custbody_rda_wo_priorty_2", "custbody_comments_for_dash", "custbody_comments_for_prod", "custbody_rda_wo_sched_due_date", "custbody_wo_percent_completed"]
            });

            var woPriority1 = woRecordObj.custbody_rda_wo_priorty;
            var woPriority2 = woRecordObj.custbody_rda_wo_priorty_2;
            var commentsDash = woRecordObj.custbody_comments_for_dash;
            var commentsProd = woRecordObj.custbody_comments_for_prod;
            var woSchedDue = woRecordObj.custbody_rda_wo_sched_due_date;
            var percentComp = woRecordObj.custbody_wo_percent_completed;
            var wcoGoodPanel = Number(wcogoodpanel) || 0;

            log.debug("wop1/wop2/commentDash/commentProd/woSchedDue/percentComp/wcoGoodPanel",woPriority1+" "+woPriority2+ " "+commentsDash+" "+commentsProd+" "+woSchedDue+" "+percentComp+" "+wcoGoodPanel)

            var qfactorProduction = Number(qFactor)/100;
            var date = moment(ns_utils.dateNowByCompanyTimezone()).format('M/D/YYYY hh:mm a');
            var nativeOperations = manufacturingOperationTasks(woId, '')
            var custOperations = searchCustomOperations(woId)
            custOperations = custOperations.filter(f => f.sequence >= startOperation)
            var custOperationsWithinRange = custOperations.filter(f => f.sequence <= endOperation)
            custOperationsWithinRange = custOperationsWithinRange.map(m => {
                m.operator = currentUser
                return m
            })
            log.debug('Current user', currentUser)
            log.debug('Custoperations within range', custOperationsWithinRange)
            var custOperationsSucceeding = custOperations.filter(f => f.sequence > endOperation)

            for (i in custOperationsWithinRange) {                     
                if (i == 0) {
                    custOperationsWithinRange[i].enddate   = date
                    custOperationsWithinRange[i].projected = date
                } 
                else {
                    custOperationsWithinRange[i].enddate   = date
                    custOperationsWithinRange[i].startdate = date
                    custOperationsWithinRange[i].projected = date
                }
                // Feb042022 Added as per request
                let idx = nativeOperations.findIndex(fi => fi.sequence == custOperationsWithinRange[i].sequence)
                custOperationsWithinRange[i].completedqty = (idx > -1) ? nativeOperations[idx].completedquantity : 0
                custOperationsWithinRange[i].wcogood = (idx > -1) ? custOperationsWithinRange[i].wcogood + wcoGoodPanel : custOperationsWithinRange[i].wcogood
            }

            for (i in custOperationsSucceeding) {
                //determine whether the CUSTOM OPERATION LINE is CORE = TRUE or FALSE
                    var coreBool = custOperationsSucceeding[i].core
                    var nonCoreQty = goodNumberOfPanels ? goodNumberOfPanels: noOfPanels
                    var qtyToUse = coreBool == true ? totalNumberOfCores : nonCoreQty
                    //if CORE = TRUE we use totalNumberOfCores, else we use goodNumberOfPanels.. if goodNumberOfPanels is null, we use noOfPanels.. if that's null we use COMPLETED QTY
                    var qtyToUse = qtyToUse ? qtyToUse : completedquantity_new
                    //var minsToAdd = custOperationsSucceeding[i-1].runtime + custOperationsSucceeding[i-1].setuptime
                    //  log.debug('OPERATIONSEQUENCE / coreBool:', custOperationsSucceeding[i].sequence +' / '+ coreBool)
            
                
                if (i == 0) {
                    custOperationsSucceeding[i].startdate = date
                    custOperationsSucceeding[i].projected = moment(new Date(date)).add((custOperationsSucceeding[i].minstoadd / qfactorProduction), 'minutes').format('M/D/YYYY hh:mm a')
                } 
                else {
                    //var minsToAdd = custOperationsSucceeding[i-1].runtime + custOperationsSucceeding[i-1].setuptime
                    custOperationsSucceeding[i].startdate       = custOperationsSucceeding[i].startdate ? custOperationsSucceeding[i].startdate : '';
                    custOperationsSucceeding[i].enddate         = custOperationsSucceeding[i].enddate ? custOperationsSucceeding[i].enddate : '';
                    custOperationsSucceeding[i].prev_projected  = custOperationsSucceeding[i-1].projected
                    custOperationsSucceeding[i].projected       = moment(new Date(custOperationsSucceeding[i].prev_projected)).add((custOperationsSucceeding[i].minstoadd / qfactorProduction), 'minutes').format('M/D/YYYY hh:mm a')
                }
            }
            custOperations = custOperationsWithinRange.concat(custOperationsSucceeding)

            //// Compute time taken
            custOperations = custOperations.map(m => {
                m.timetaken = (m.startdate && m.enddate) ? diffDates(custOperations[0].startdate, m.enddate) : ''
                return m
            })

            log.debug('Final custoperations', custOperations)
            // return

            if (custOperations.length) {
                for (custOperation of custOperations) {
                    try {
                        // UNCOMMENT AFTER TESTING
                        record.submitFields({
                            type: "customrecord_operation_line",
                            id: custOperation.id,
                            values: {
                                // custrecord_operation_line_oper: custOperation.operator,
                                // custrecord_operation_line_startdate: custOperation.startdate,
                                // custrecord_operation_line_enddate: custOperation.enddate,
                                // custrecord_operation_line_projectedendda: custOperation.projected,
                                // custrecord_operation_line_timetaken: custOperation.timetaken,
                                // custrecord_operation_line_completedqty: custOperation.completedqty,
                                // custrecord_operation_line_wopriority1: woPriority1,
                                // custrecord_operation_line_wopriority2: woPriority2,
                                // custrecord_operation_line_wo_scheddue: (woSchedDue)?format.parse({ value : woSchedDue, type : format.Type.DATE}):'',
                                // custrecord_operation_line_comments_prod: commentsProd,
                                // custrecord_operation_line_commentsdash: commentsDash,
                                custrecord_operation_line_wco_goodpanel: custOperation.wcogood,
                            },
                            options: {
                                ignoreMandatoryFields: true,
                            }
                        })
                    } catch (e) {
                        log.debug('Error updating custoperator', {
                            custOperation,
                            error: e.message
                        })
                    }
                }
                //write LATEST PROJECTED END DATE value to associated WORK ORDER, if we're on the last OPERATION line (highest OPERATION SEQUENCE number)
                //this is the latest PROJECTED END DATE on the entire WORK ORDER
                // log.debug('latestProjectedEndDate:', custOperations[custOperations.length-1].projected)
                
                // var vars = {
                //     'custbody_latest_proj_end_date': custOperations[custOperations.length-1].projected
                // }

                // let target = computeWOTargetFields([woId])

                // if (target[woId]) {
                //     if (target[woId].gate1.custOperationId) 
                //         vars.custbody_target_gate_first = target[woId].gate1.custOperationId
                //     if (target[woId].gate2.custOperationId) 
                //         vars.custbody_target_gate_second = target[woId].gate2.custOperationId
                //     if (target[woId].gate3.custOperationId) 
                //         vars.custbody_target_gate_third = target[woId].gate3.custOperationId
                // }

                //log.debug('WO fields to update', vars)

                // UNCOMMENT AFTER TESTING
                // try {
                //     if (context.type == 'xedit') {
                //         for (k in vars) 
                //             rec.setValue({ fieldId: k, value: vars[k] })
                //         rec.save({ ignoreMandatoryFields: true })
                //     } else {
                        //record.submitFields({
                        //     type: record.Type.WORK_ORDER,
                        //     id: woId,
                        //     values: vars,
                        //     options: {
                        //         enableSourcing: false,
                        //         ignoreMandatoryFields: true
                        //     }
                        // });
                    //}
                    log.debug('Success updating WO fields')
                // } catch(e) {
                //     log.debug('Error updating WO fields', e.message)
                // }
            }
        }catch(e){
            log.debug('Error updateExistingCustomOperationLinesUponCreationOfWorkCompletion', e.message)
        }
    }

    return {
        searchCustomOperations,
        computeWOTargetFields,
        deleteAndCreateCustomOperationLines,
        updateExistingCustomOperationLinesUponCreationOfWorkCompletion,
        updateWCOgoodPanelCustomOperationLinesUponCreationOfWorkCompletion
    }
})