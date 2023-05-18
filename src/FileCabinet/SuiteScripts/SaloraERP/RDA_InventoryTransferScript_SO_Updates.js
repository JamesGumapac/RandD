/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
 define(["N/log", "N/record"],

    function(log, record) {

        
        function afterSubmit(context) {

         log.debug('Script context',context.newRecord)

         var myInvTransfer = context.newRecord;
         var invTransferId = myInvTransfer.id;

         var myInvTransfer = record.load({
            type: record.Type.INVENTORY_TRANSFER,
            id: invTransferId
         });

         var mySOValue = myInvTransfer.getValue('custbodysolink');
         log.debug('Ths is so Value',mySOValue);

         if(mySOValue == ''){
            log.debug('No Inv SO exiting script');

            return;
         }

         

         var myQuantity = myInvTransfer.getSublistValue({
            sublistId: 'inventory',
            fieldId: 'adjustqtyby',
            line: 0
         });

         var myItem =  myInvTransfer.getSublistValue({
            sublistId: 'inventory',
            fieldId: 'item',
            line: 0
         });


         log.debug('This is my Quantity',myQuantity);

         log.debug('This is my Item',myItem)

         myInvTransfer.setValue('custbody_inv_transfer_quantity',myQuantity);

         log.debug('You have saved Record',myInvTransfer.save());


   

         if(mySOValue){
             log.debug('There is a value here, will attempt to set SO Field');

             var mySORecord = record.load({
                 type: record.Type.SALES_ORDER,
                 id: mySOValue,
                 isDynamic: false
             });

           var myLineCount = mySORecord.getLineCount('item');

           var soItem;

           for(var i = 0; i < myLineCount; i++){
                soItem = mySORecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });

                if(soItem == myItem){

                    log.debug('Found a matching item, setting value');

                    mySORecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_kms_item_transfer_to_asm',
                        line: i,
                        value: invTransferId
                        
                    });

                    break;
                }

           }

            try{
            let newSO =  mySORecord.save();

             log.debug('You have saved',newSO);
            } catch (e){
                log.error('This is your Error',e);

            }

         }

        }

        return {
                afterSubmit: afterSubmit
            }

})