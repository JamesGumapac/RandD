/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([],

function() {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {

    }



    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {

        var currentRecord = scriptContext.currentRecord;

        var ictoCheckbox =  currentRecord.getValue({
            fieldId:'custbody_ats_ic_to'
        });

        var transferRequestCheckbox =  currentRecord.getValue({
            fieldId:'custbody_ats_transferrequest'
        });

        log.debug('ictoCheckbox',ictoCheckbox);
        log.debug('transferRequestCheckbox',transferRequestCheckbox);

        if(!ictoCheckbox && !transferRequestCheckbox ){
            alert('Please check either of the checkboxes:  (1) ATS | INTERCOMPANY TRANSFER ORDER (2)  ATS | TRANSFER REQUEST  ');
            return false;
        }
        return true;

    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord
    };
    
});
