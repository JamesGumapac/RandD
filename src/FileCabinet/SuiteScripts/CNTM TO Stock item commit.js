/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define([], function () {

    function pageInit(context) {
        console.log('Init');
        //log.debug('init');
    }

    function saveRecord(context) {

    }

    function validateField(context) {

    }

    function fieldChanged(context) {

    }

    function postSourcing(context) {

    }

    function lineInit(context) {

    }

    function validateDelete(context) {

    }

    function validateInsert(context) {

    }

    function validateLine(context) {
        try {
            // if(scriptContext.type === scriptContext.UserEventType){
            var currentRecObj = context.currentRecord;
            var sublistId = context.sublistId;
            debugger;
            if (sublistId == 'item') {

                var cseg_cntm_salestyp = currentRecObj.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'cseg_cntm_salestyp'
                })
                if (cseg_cntm_salestyp == '2' || cseg_cntm_salestyp == 2) {

                    currentRecObj.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'commitinventory',
                        value: 2,
                    })
                }
            }
            // }

            return true;
        }
        catch (e) {
            log.error('ERROR', 'ERROR NAME = ' + e.name + ', ERROR TYPE = ' + e.type + ', ERROR MESSAGE = ' + e.message);
        }
    }

    function sublistChanged(context) {

    }

    return {
        pageInit: pageInit,
        // saveRecord: saveRecord,
        // validateField: validateField,
        // fieldChanged: fieldChanged,
        // postSourcing: postSourcing,
        // lineInit: lineInit,
        // validateDelete: validateDelete,
        // validateInsert: validateInsert,
        validateLine: validateLine,
        // sublistChanged: sublistChanged
    }
});
