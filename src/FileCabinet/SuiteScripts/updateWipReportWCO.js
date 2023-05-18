/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/record','N/search'],
    /**
 * @param{log} log
 * @param{record} record
 */
    (log, record, search) => {
        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            try{

                if(scriptContext.type != "delete"){
                    var rec = scriptContext.newRecord;

                    var woId = rec.getValue({
                        fieldId: "createdfrom"
                    });

                    var startOperation = Number(rec.getText({
                        fieldId: "startoperation"
                    }));

                    var endOperation = Number(rec.getText({
                        fieldId: "endoperation"
                    }));

                    if(woId){
                        var wipOpNamesObj = search.lookupFields({
                            type: search.Type.WORK_ORDER,
                            id: woId,
                            columns: ['custbody_wip_operations']
                        });

                        if(wipOpNamesObj){
                            wipOpNamesObj = JSON.parse(wipOpNamesObj.custbody_wip_operations);

                            Object.keys(wipOpNamesObj).forEach(function(i){
                                //log.debug(i);
                                var seq = Number(i);

                                
                                if(seq >= startOperation && seq <= endOperation){
                                    log.debug("COMPARE SEQ to START/END OPERATION", seq+"/"+startOperation+"/"+endOperation)
                                    wipOpNamesObj[i] += 1;
                                }
                            });
                            
                            log.debug("WIP OP OBJ",JSON.stringify(wipOpNamesObj));

                            record.submitFields({
                                type: record.Type.WORK_ORDER,
                                id: woId,
                                values: {
                                    custbody_wip_operations: JSON.stringify(wipOpNamesObj),
                                },
                                options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                                }
                            });

                            log.debug("Successfully Updated WIP Operations","");
                        }
                        
                    }
                }
            }catch(e){
                log.error("ERROR",e.message);
                log.debug("ERROR",e.message);
            }
        }

        return {beforeSubmit}

    });
