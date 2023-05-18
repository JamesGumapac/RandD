/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([],

    function () {

        function saveRecord(scriptContext) {
            try {
                const curRec = scriptContext.currentRecord;
                const totalAmountFromInvoice = curRec.getValue("custbody5")
                const amount = curRec.getValue("usertotal")
                log.debug("amount", {totalAmountFromInvoice, amount})
                if (totalAmountFromInvoice != amount){
                    alert("Total Amount from Invoice is different from Total Amount from Line Items.")
                    return false
                }
                return true
            } catch (e) {
                log.error("saveRecord", e.message)
            }
        }

        return {

            saveRecord: saveRecord
        };

    });
