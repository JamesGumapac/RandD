/**
 *@NApiVersion 2.1
*@NScriptType UserEventScript
*
* SS: [Salora] Card Connect Payment Event Search
*/
define(['N/runtime', 'N/search', './lib/moment.min', 'N/record', 'N/log', './lib/ns.utils'], 

(runtime, search, moment, record, log, ns_utils) => {

    // Environment Variables
    var script = runtime.getCurrentScript();

    function afterSubmit(context) {
        
    try{
        var newRecord = context.newRecord;
        var woId = newRecord.id;
        
        if(context.type == "edit"){
            
            var oldRecord = context.oldRecord;
            var newRecQfactor = newRecord.getValue({
                fieldId: "custbody_rda_qfactor"
            });

            var oldRecQfactor = oldRecord.getValue({
                fieldId: "custbody_rda_qfactor"
            });

            

            if(oldRecQfactor != newRecQfactor){
               
                    var woRecord = record.load({
                        type: newRecord.type,
                        id: woId,
                    })
                    var qfactor = parseFloatOrZero(woRecord.getValue({
                        fieldId: "custbody_rda_qfactor" // source from wip variables on WO create action
                    }));
                    var efficiency = qfactor / 100;
                    var customOperationLines = getCustomOperationLines(woId, efficiency);
                    var lastProjectedEndDate = "";
                    if(customOperationLines.length > 0){
                        for(i in customOperationLines){
                            if(i == 0 ){
                                customOperationLines[i].projected = moment(new Date(customOperationLines[i].startdate)).add(customOperationLines[i].minstoadd, 'minutes').format('M/D/YYYY hh:mm a')
                            }else{
                                customOperationLines[i].prev_projected  = customOperationLines[i-1].projected
                                customOperationLines[i].projected = moment(new Date(customOperationLines[i].prev_projected)).add(customOperationLines[i].minstoadd, 'minutes').format('M/D/YYYY hh:mm a')
                                lastProjectedEndDate = customOperationLines[i].projected
                            }

                            log.debug("new projected end date", customOperationLines[i].projected)
                            record.submitFields({
                                type: "customrecord_operation_line",
                                id: customOperationLines[i].id,
                                values: {
                                    custrecord_operation_line_projectedendda: customOperationLines[i].projected,
                                    custrecord_operation_line_setup_qfactor: customOperationLines[i].setupqfactor,
                                    custrecord_operation_line_run_qfactor: customOperationLines[i].runqfactor
                                },
                                options: {
                                    ignoreMandatoryFields: true,
                                }
                            });

                            log.debug("UPDATED","Custom Op Record: "+customOperationLines[i].id)
                        }

                        woRecord.setValue({
                            fieldId: "custbody_latest_proj_end_date",
                            value: lastProjectedEndDate,
                            ignoreFieldChange: true
                        })

                        woRecord.save({
                            ignoreMandatoryFields: true,
                        })

                        log.debug("UPDATED WO "+woId, "latest projected end date: "+lastProjectedEndDate)
                    }
 
            }else{
                log.debug("NO CHANGES IN QFACTOR", "Ending script execution..")
            }
        }
        else if(context.type == "create"){
            
            //search the latest MANUAL COSTS INPUT record, and return its Q-FACTOR PRODUCTION value
            //place that in the Q-FACTOR custbody field on the WO record
            
            
        }
        
        
    }catch(e){
        
        log.error(e.name, e.message)
    }
    }

    function parseFloatOrZero(a){a=parseFloat(a);return isNaN(a)?0:a}

    function getCustomOperationLines (woId, efficiency) {
        let ops = []
        var customrecord_operation_lineSearchObj = search.create({
            type: "customrecord_operation_line",
            filters:
            [
                ["custrecord_operation_line_wo","anyof",woId],
                "AND", 
                ["custrecord_operation_line_enddate","isempty",""]
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
            log.debug("EFFICIENCY MULTIPLIER", efficiency)
            log.debug("ORIGINAL SETUP TIME / RECOMPUTED BASED ON EFFICIENY", setuptime + " / " + setuptime + " * " + efficiency +" = " + setuptime*efficiency);
            log.debug("ORIGINAL RUN TIME / RECOMPUTED BASED ON EFFICIENY", runtime + " / " + runtime + " * " + efficiency +" = " + runtime*efficiency);

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
                minstoadd   : (setuptime + runtime) / efficiency, // 1.2x
                core        : core,
                setupqfactor: parseFloat(Number(setuptime) / Number(efficiency)).toFixed(2),
                runqfactor  : parseFloat(Number(runtime) / Number(efficiency)).toFixed(2),
                woId        : result.getValue('custrecord_operation_line_wo')
            })
         });
        return ops 
    }

    return {
        afterSubmit
    };
});
