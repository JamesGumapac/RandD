/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
 define(['N/currentRecord', 'N/log', 'N/record', 'N/search', 'N/task', './lib/rdaSaloraCustomLibrary_lib.js'],
 /**
* @param{currentRecord} currentRecord
* @param{log} log
* @param{record} record
* @param{search} search
* @param{task} task
*/
 (currentRecord, log, record, search, task, rdaSaloraCustomLibrary_lib) => {
     /**
      * Defines the function definition that is executed before record is loaded.
      * @param {Object} scriptContext
      * @param {Record} scriptContext.newRecord - New record
      * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
      * @param {Form} scriptContext.form - Current form
      * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
      * @since 2015.2
      */
     const beforeLoad = (scriptContext) => {

     }

     /**
      * Defines the function definition that is executed before record is submitted.
      * @param {Object} scriptContext
      * @param {Record} scriptContext.newRecord - New record
      * @param {Record} scriptContext.oldRecord - Old record
      * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
      * @since 2015.2
      */
     const beforeSubmit = (scriptContext) => {

     }

     const computeDrillFillCustomValue = (numHitsFill, noOfPanels, drillHitsPerMinute) => {
         return (Number(numHitsFill) * Number(noOfPanels)) / Number(drillHitsPerMinute);
     }

     const computePthCustomValue = (numHitsPth, noOfPanels, drillHitsPerMinute) => {
         return (Number(numHitsPth) * Number(noOfPanels)) / Number(drillHitsPerMinute);
     }

     /**
      * Defines the function definition that is executed after record is submitted.
      * @param {Object} scriptContext
      * @param {Record} scriptContext.newRecord - New record
      * @param {Record} scriptContext.oldRecord - Old record
      * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
      * @since 2015.2
      */
     const afterSubmit = (scriptContext) => {
         try{
           
           if (scriptContext.type != scriptContext.UserEventType.CREATE && scriptContext.type != scriptContext.UserEventType.EDIT) return
           
             var newRec = scriptContext.newRecord;
             var oldRec = scriptContext.oldRecord;
             var NUMHITSPTH_ID = "custitem_rda_num_hits_pth";
             var NUMHITSFILL_ID = "custitem_cntm_numhits";
             var MATERIALTYPE = "custitem_materialtype";
             var PANELSIZE = "custitem_cntm_panelsize";
             var BOARDTHICK = "custitem_boardthickness";
             var BOARDPITCH = "custitem_cnt_boardpitch";
             var numHitsFill = 0;
             var numHitsPth = 0;
             var noOfPanels = 0;
             var wipVariablesSearchResults = rdaSaloraCustomLibrary_lib.returnWipVariablesSearchResults();
             log.debug("wipVariableSearchResults",wipVariablesSearchResults)
             var drillHitsPerMinute = 0
             if(wipVariablesSearchResults){
                drillHitsPerMinute = wipVariablesSearchResults[0].getValue({name: 'custrecord_drillhitsperhour'});
             }
             
             //var drillHitsPerMinute = wipVariablesSearchResults[0].getValue({name: 'custrecord_drillhitsperhour'});
             var drillFillCustomValue = 0;
             var pthCustomValue = 0;

             log.debug("NUMHITSFILL", "OLD: "+oldRec.getValue(NUMHITSFILL_ID)+ " NEW: "+newRec.getValue(NUMHITSFILL_ID));
             log.debug("NUMHITSPTH", "OLD: "+oldRec.getValue(NUMHITSPTH_ID)+ " NEW: "+newRec.getValue(NUMHITSPTH_ID));
             if(newRec.getValue(NUMHITSFILL_ID) != oldRec.getValue(NUMHITSFILL_ID) || newRec.getValue(NUMHITSPTH_ID) != oldRec.getValue(NUMHITSPTH_ID) || newRec.getValue(MATERIALTYPE) != oldRec.getValue(MATERIALTYPE) || newRec.getValue(PANELSIZE) != oldRec.getValue(PANELSIZE) || newRec.getValue(BOARDTHICK) != oldRec.getValue(BOARDTHICK) || newRec.getValue(BOARDPITCH) != oldRec.getValue(BOARDPITCH)){
                 log.debug("updated fields","start computation");
                 numHitsFill = newRec.getValue(NUMHITSFILL_ID);
                 numHitsPth = newRec.getValue(NUMHITSPTH_ID);
                 var materialType = newRec.getValue(MATERIALTYPE);
                 var panelSize = newRec.getValue(PANELSIZE);
                 var boardThick = newRec.getValue(BOARDTHICK);
                 var boardPitch = newRec.getValue(BOARDPITCH);
                 
                 var assemblyitemSearchObj = search.create({
                     type: "assemblyitem",
                     filters:
                     [
                     ["type","anyof","Assembly"], 
                     "AND", 
                     ["internalid","anyof",newRec.id], 
                     "AND", 
                     ["transaction.recordtype","is","workorder"], 
                     "AND", 
                     ["transaction.status","anyof","WorkOrd:D","WorkOrd:B"],
                     "AND",
                     ["transaction.mainline","is","T"]
                     ],
                     columns:
                     [
                         search.createColumn({
                             name: "internalid",
                             join: "transaction"
                         }),
                         search.createColumn({
                             name: "custbody_cntm_no_of_panel",
                             join: "transaction"
                         })
                     ]
                 });
                 var searchResultCount = assemblyitemSearchObj.runPaged().count;
                 log.debug("assemblyitemSearchObj result count",searchResultCount);
                 if(searchResultCount > 0 ){
                    assemblyitemSearchObj.run().getRange(0,100).forEach(function(result){

                        noOfPanels = result.getValue({
                            name: "custbody_cntm_no_of_panel",
                            join: "transaction"
                        });

                        if(drillHitsPerMinute && numHitsFill){
                            drillFillCustomValue = computeDrillFillCustomValue(numHitsFill, noOfPanels, drillHitsPerMinute);
                            log.debug("drillFillCustomValue",drillFillCustomValue);
                        }
    
                        if(drillHitsPerMinute && numHitsPth){
                            pthCustomValue = computePthCustomValue(numHitsPth, noOfPanels, drillHitsPerMinute);
                            log.debug("pthCustomValue",pthCustomValue);
                        }

                        var woId = result.getValue({
                            name: "internalid",
                            join: "transaction"
                        });
                        log.debug("woId", woId);

                        var woObjValues = {
                            "custbody_fill_run_mins": parseFloat(drillFillCustomValue).toFixed(2),
                            "custbody_pth_run_mins": parseFloat(pthCustomValue).toFixed(2),
                            "custbody_material_type": materialType,
                            "custbody_cntm_panelsize": panelSize,
                            "custbody_cnt_board_thickness": boardThick,
                            "custbody_cntm_boardpitch": boardPitch
                        };

                        if(numHitsPth){
                            woObjValues["custbody_rda_num_hits_pth"] = numHitsPth;
                        }

                        if(numHitsFill){
                            woObjValues["custbody_num_hits_fill"] = numHitsFill;
                        }

                        log.debug("hasMapValuesObj",JSON.stringify(woObjValues));

                        var workOrderId = record.submitFields({
                        type: record.Type.WORK_ORDER,
                            id: woId,
                            values: woObjValues,
                            options: {
                                enableSourcing: true,
                                ignoreMandatoryFields : true,
                            },
                        });

                        log.debug("WO ID before record.submit: "+woId, "WO ID after record.submit "+workOrderId)
                    });          
                }else{
                    log.debug("NO WORK ORDERS FOUND FOR ITEM ID", newRec.id);
                } 
             }
         }catch(e){
             log.debug("ERROR AFTER SUBMIT", e);
         }
     }
     return {afterSubmit}

 });