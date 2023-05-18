/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([],

function() {
    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
        let { fieldId, currentRecord } = scriptContext
        if (fieldId.match(/startoperation|endoperation/g)) {
            currentRecord.setValue({
                fieldId: `custbody_${fieldId}`,
                value: currentRecord.getText({
                    fieldId
                })
            })
        }
    }

    return {fieldChanged};
    
});
