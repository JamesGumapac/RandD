/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
 define(["N/log", "N/record","N/search"],

    function(log, record, search) {

        
        function afterSubmit(context) {

            var currentRec = context.newRecord;

            try{

                var myFulfillment = record.load({
                    type: record.Type.ITEM_FULFILLMENT,
                    id: currentRec.id
                });

                var mylocation = myFulfillment.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'location',
                    line: 0
                });

                log.debug('This is my Record loaded',myFulfillment);
                log.debug('This is my location',mylocation);

             var myLocationLoaded = record.load({
                 type: record.Type.LOCATION,
                 id: mylocation});

             var addressText = myLocationLoaded.getText('mainaddress_text');

             log.debug('This is address',addressText);

             

              

                myFulfillment.setValue('custbody_salora_fulfillment_location',addressText);

                

                log.debug('You have saved',myFulfillment.save());

           

            } catch(e){
                log.debug('Error',e)
            }

        }

        return {
                afterSubmit : afterSubmit
            }

})