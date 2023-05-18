/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
 define(['N/log', 'N/record', 'N/search'],
 /**
* @param{log} log
* @param{record} record
*/
 (log, record, search) => {
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

     const parseFloatOrZero = (a) => {a=parseFloat(a);return isNaN(a)?0:a}

     const searchScrapBuilt = (woId) => {
         var workorderSearchObj = search.create({
             type: "workorder",
             filters:
             [
                ["type","anyof","WorkOrd"], 
                "AND", 
                ["internalid","anyof",woId], 
                "AND", 
                ["isscrap","is","T"]
             ],
             columns:
             [
                "isscrap",
                "quantityshiprecv",
                "built"
             ]
          });
          var searchResult = workorderSearchObj.run().getRange({start: 0, end: 1});
          var searchResultCount = workorderSearchObj.runPaged().count;
          var totalScrapBuilt = 0;
          log.debug("search count result", searchResultCount);
          if(searchResultCount > 0){
             totalScrapBuilt = parseFloatOrZero(searchResult[0].getValue({name: "quantityshiprecv"})) + parseFloatOrZero(searchResult[0].getValue({name: "built"}));
          }
          return totalScrapBuilt;
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
         log.debug("context", scriptContext.type);
         try {
             var wcoRecord = scriptContext.newRecord;
             

             if(scriptContext.type == 'create' || scriptContext.type == 'edit'){
               log.debug("!return","");
             }else{
               log.debug("return","");
               return;
             }
             //     log.debug("wo record id",scriptContext.newRecord.id)
             //     var createdFromWOobj = search.lookupFields({
             //         type: record.Type.WORK_ORDER_CLOSE,
             //         id: scriptContext.newRecord.id,
             //         columns: ["createdfrom"]
             //     });
             //     log.debug("wo lookup",JSON.stringify(createdFromWOobj))
             //     var createdFromWO = createdFromWOobj.createdfrom[0].value;
             // }else{}

             var createdFromWO = wcoRecord.getValue({
                 fieldId: "createdfrom"
             });
             
            //  var woRecordObj = record.load({    //this is unneeded, use search.lookupFields
            //      type: "workorder",
            //      id: createdFromWO
            //  });

             var woRecordLookup = search.lookupFields({
                type: "workorder",
                id: createdFromWO,
                columns: ['quantity','custbody_qty_scrapped_custom', 'built']
             })

             //var woQuantity = parseFloatOrZero(woRecordObj.getValue({fieldId: "quantity"}));
             var woQuantity = woRecordLookup.quantity;
             var woTotalScrapQty = parseFloatOrZero(woRecordLookup.custbody_qty_scrapped_custom);
             var wcoScrapQty = parseFloatOrZero(wcoRecord.getValue({fieldId: 'scrapquantity'}));
             woTotalScrapQty += wcoScrapQty;
             var builtQty = parseFloatOrZero(woRecordLookup.built);
             

             log.debug('wcoScrapQty is:', wcoScrapQty);

             //var builtScrap = searchScrapBuilt(createdFromWO);
             var builtScrap = builtQty + woTotalScrapQty;

             log.debug("builtScrap "+builtScrap, "woQuantity "+woQuantity);
             if(builtScrap == woQuantity){
                 var woCloseObj = record.transform({
                     fromType: "workorder",
                     fromId: createdFromWO,
                     toType: "workorderclose",
                     isDynamic: true,
                 });

                 var woCloseId = woCloseObj.save();

                 log.debug("work order close id", woCloseId);
             }else{
                record.submitFields({
                    type: "workorder",
                    id: createdFromWO,
                    values: {
                        custbody_qty_scrapped_custom : woTotalScrapQty
                    },
                    options: {
                        ignoreMandatoryFields: true
                    }
                })

                log.debug("custbody_qty_scrapped_custom value is : ", woTotalScrapQty)
             }
         }catch(error){
             log.debug("unexpected error", error);
         }
     }

     return {/*beforeLoad, beforeSubmit,*/ afterSubmit}

 });
