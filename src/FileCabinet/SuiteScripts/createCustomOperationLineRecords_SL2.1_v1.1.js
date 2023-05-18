/**
* @NApiVersion 2.1
* @NScriptType Suitelet
*/
define(['N/record', 'N/runtime', 'N/search', './lib/moment.min', './lib/ns.utils', './customOperationLineLibrary.js'],
/**
* @param{record} record
* @param{runtime} runtime
* @param{search} search
*/
(record, runtime, search, moment, ns_utils, custOpLib) => {
    /**
    * Defines the Suitelet script trigger point.
    * @param {Object} scriptContext
    * @param {ServerRequest} scriptContext.request - Incoming request
    * @param {ServerResponse} scriptContext.response - Suitelet response
    * @since 2015.2
    */
    const onRequest = (scriptContext) => {
        let { request, response } = scriptContext
        let params = request.parameters
        let woId = params.id
        
        log.debug('PARAMS', params)
        
        if (woId) {
            let rec = record.load({ type: 'workorder', id: woId })
            // Actually this field doesnt exist in WO
            var currUser = rec.getValue({ fieldId: 'custbody_cntm_op_client_app' }) || ''
            var quantity = rec.getValue({ fieldId: 'quantity' })
            var goodNumberOfPanels = rec.getValue({ fieldId: 'custbody_cntm_good_panels' })
            var totalNumberOfCores = rec.getValue({ fieldId: 'custbody_total_num_cores' })
            var qFactor = rec.getValue({ fieldId: 'custbody_rda_qfactor' })            
            
            custOpLib.deleteAndCreateCustomOperationLines(woId, currUser, quantity, goodNumberOfPanels, totalNumberOfCores, qFactor);
            
            // Search last WO's WOC
            let wocId = recentWOC(woId)
            if (wocId) {
                
                // WOC variables
                let woc                     = record.load({ type: 'workordercompletion', id: wocId })
                let startOperation          = parseFloat(woc.getText({ fieldId: 'startoperation' })) || 0 // SEQUENCE START // return null when on delete
                let endOperation            = parseFloat(woc.getText({ fieldId: 'endoperation' })) || 0 // SEQUENCE END // return null when on delete
                let noOfPanels              = parseFloat(rec.getValue({ fieldId: 'custbody_cntm_no_of_panel' })) || 0
                
                
                let completedquantity_new   = parseFloat(woc.getValue({ fieldId: 'completedquantity' })) || 0
                let wcogoodpanel            = woc.getValue({ fieldId: 'custbody_cntm_wco_good_panels' })
                let lotOld                  = '' //TBA
                let lotNew                  = '' //TBA
                let dateCreated             = moment(woc.getText({ fieldId: 'createddate' })).format('M/D/YYYY hh:mm a')
                
                updateExistingCustomOperationLinesUponCreationOfWorkCompletion(woId, currUser, startOperation, endOperation, noOfPanels, goodNumberOfPanels, totalNumberOfCores, completedquantity_new, qFactor, wcogoodpanel, lotOld, lotNew, dateCreated)   
            }
        }
    }
    
    const recentWOC = woId => {
        var wocId = ''
        var workordercompletionSearchObj = search.create({
            type: "workordercompletion",
            filters:
            [
                ["createdfrom","anyof",woId], 
                "AND", 
                ["type","anyof","WOCompl"], 
                "AND", 
                ["mainline","is","T"]
            ],
            columns:
            [
                search.createColumn({name: "tranid", label: "Document Number"})
            ]
        });
        var searchResultCount = workordercompletionSearchObj.runPaged().count;
        log.debug("workordercompletionSearchObj result count",searchResultCount);
        workordercompletionSearchObj.run().each(function(result){
            wocId = result.id
        });
        return woId
    }
    
    const updateExistingCustomOperationLinesUponCreationOfWorkCompletion = (woId, currentUser, startOperation, endOperation, noOfPanels, goodNumberOfPanels, totalNumberOfCores, completedquantity_new, qFactor, wcogoodpanel, lotOld, lotNew, dateCreated) => {
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
            var date = dateCreated
            var nativeOperations = custOpLib.manufacturingOperationTasks(woId, '')
            var custOperations = custOpLib.searchCustomOperations(woId)
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
                m.timetaken = (m.startdate && m.enddate) ? custOpLib.diffDates(custOperations[0].startdate, m.enddate) : ''
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
                
                let target = custOpLib.computeWOTargetFields([woId])
                
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
    
    return {onRequest}
    
});
