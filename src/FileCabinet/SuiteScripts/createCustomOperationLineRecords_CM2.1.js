/**
 *@NApiVersion 2.1
 %@NModuleScope Public
 *
 * Library file for target gate 1, 2, 3 and projected end date fields computation
 * Usages: createCustomOperationLineRecords_UE2.1.v2.0.js, createCustomOperationLineRecords_MR2.1.js
 */
define(['N/search', './lib/moment.min', './lib/ns.utils'], (search, moment, ns_utils) => {

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
               search.createColumn({name: "custrecord_operation_line_core", label: "Core"})
            ]
         });
         customrecord_operation_lineSearchObj = ns_utils.expandSearch(customrecord_operation_lineSearchObj)
         customrecord_operation_lineSearchObj.forEach(result => {
            let sequence    = parseFloat(result.getValue('custrecord_operation_line_operseq')) || 0
            let setuptime   = parseFloat(result.getValue('custrecord_operation_line_setuptime')) || 0
            let runtime     = parseFloat(result.getValue('custrecord_operation_line_runtime')) || 0
            let core        = result.getValue('custrecord_operation_line_core')
            
            ops.push({
                id          : result.id,
                name        : result.getText('custrecord_operation_line_opername') || result.getValue('custrecord_operation_line_opername'),
                operator    : '',
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
            let mdyyyy = moment(allCustOperations[0].projected).format('M/D/YYYY')
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

    return {
        searchCustomOperations,
        computeWOTargetFields,
    }
})