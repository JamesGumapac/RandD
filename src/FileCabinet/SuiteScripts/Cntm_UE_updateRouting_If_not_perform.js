/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/ui/serverWidget", "N/search"], function (
    record,
    serverWidget,
    search
  ) {
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {

    }
  
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {}
  
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {

        try {
            var rec = scriptContext.newRecord;
            var recordId = rec.id;
            if (recordId) {
                debugger;

                var objRecord = record.load({
                    type : record.Type.WORK_ORDER,
                    id : recordId,
                    isDynamic : true,
                });

                var routingvalue = objRecord.getValue({
                    fieldId : 'manufacturingrouting'
                });

                log.debug('routingvalue : ',routingvalue)
                var bomvalue = objRecord.getValue({
                    fieldId : 'billofmaterials'
                });
                log.debug('bomvalue : ',bomvalue)
                
                var bomrevval = objRecord.getValue({
                    fieldId : 'billofmaterialsrevision'
                });
                log.debug('bomrevval : ',bomrevval)

          			
                if (checkIfEmpty(bomvalue)) {
                    objRecord.setValue({
                        fieldId : 'billofmaterials',
                        value : "",
                        ignorefieldChanged : false
                    });

                    // setTimeout(function() {
                    //     debugger;
                        objRecord.setValue({
                            fieldId : 'billofmaterials',
                            value : bomvalue,
                            ignorefieldChanged : false
                        })

                        var woId = objRecord.save();
                        log.audit('woId :',woId);
                    // }, 500);

                }

                debugger;
                var temp = record.submitFields({
                    type : record.Type.WORK_ORDER,
                    id : recordId,
                    values : {
                        iswip : false,
                    },
                    options : {
                        enableSourcing : false,
                        ignoreMandatoryFields : true
                    }
                });

                var temp2 = record.submitFields({
                    type : record.Type.WORK_ORDER,
                    id : recordId,
                    values : {

                        billofmaterialsrevision : bomrevval,
                        iswip : true,
                        manufacturingrouting : routingvalue
                    },
                    options : {
                        enableSourcing : false,
                        ignoreMandatoryFields : true
                    }
                });
            }

        } catch (e) {
            log.debug("error occurred in updateandrefresh", e);
           
        }
    }
    function checkIfEmpty(data) {
        if (data != "" && data != undefined && data != "") {
            return true;
        }
        return false;
    }
  
    return {
    //   beforeLoad: beforeLoad,
    //   beforeSubmit: beforeSubmit,
      afterSubmit: afterSubmit
    };
  });
  