/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/email', 'N/log', 'N/search', 'N/runtime'],
    /**
 * @param{email} email
 * @param{log} log
 * @param{search} search
 */
    (email, log, search, runtime) => {

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
                var newRecord = scriptContext.newRecord;
                var oldRecord = scriptContext.oldRecord;

                var scriptObj = runtime.getCurrentScript();

                // author is internal id of employee only
                var authorId = scriptObj.getParameter({
                    name: 'custscript_author_id',
                });

                var recipientIds = scriptObj.getParameter({
                    name: 'custscript_recipient_id',
                });

                recipientIds = recipientIds.split(","); // recipient can be comma separated internal ids or email addresses, or single internal id or email address

                var workOrderObj = '';
                var workOrderId = '';
                var containsAssemblyLine = '';
                var operationName = '';

                if(scriptContext.type == 'delete') return;

                // check if old record and new record objects are defined
                if(oldRecord && newRecord){
                    var oldStatus = oldRecord.getValue({
                        fieldId: 'custrecord_cntm_cso_status'
                    });

                    var newStatus = newRecord.getValue({
                        fieldId: 'custrecord_cntm_cso_status'
                    })

                    log.debug('Status',`oldStatus: ${oldStatus} | newStatus: ${newStatus}`)

                    if(oldStatus != 4 && newStatus == 4){ // 4 = complete

                        // we need to lookup these fields if context will be xedit [Map/Reduce] or else recordObject will not return any values
                       
                        var casoRecordLookupObj = search.lookupFields({
                            type: 'customrecord_cntm_clientappsublist',
                            id: newRecord.id,
                            columns: ['custrecord_cntm_cso_operaton', 'custrecord_cntm_work_order']
                        })
                        var workOrderId = casoRecordLookupObj?.custrecord_cntm_work_order[0].value;
                      
                        var operationName = casoRecordLookupObj?.custrecord_cntm_cso_operaton
                        log.debug('operationName is:', operationName);

                        if(!operationName) return;

                        // the email will only send if the operation is EXPOSE 0/L
                        if(operationName.indexOf('EXPOSE O/L') == -1){     
                            log.debug('operationName does not include EXPOSE O/L returning');
                            return;
                          } 

                        // get the sales order internal id from the work order related to the CASO Record
                        if(workOrderId){
                            workOrderObj = search.lookupFields({
                                type: 'workorder',
                                id: workOrderId,
                                columns: ['custbody_cnt_created_fm_so', 'tranid', 'custbody_cntm_tool_number']
                            });
                            log.debug('workOrderObj is:', JSON.stringify(workOrderObj));
                            var workOrderTranId = workOrderObj?.tranid;
                            var toolNumber = workOrderObj?.custbody_cntm_tool_number[0].text;
                            log.debug("toolNumber is: ", toolNumber);

                            // get the checkbox value from the sales order
                            if(workOrderObj.custbody_cnt_created_fm_so[0].value){
                                containsAssemblyLine = search.lookupFields({
                                    type: 'salesorder',
                                    id: workOrderObj.custbody_cnt_created_fm_so[0].value,
                                    columns: ['custbody_contains_assembly_line','tranid']
                                })
                                
                                var salesOrderTranId = containsAssemblyLine?.tranid;
                            }
                        }
                        log.debug("ASM CASO ID: " + newRecord.id);
                        log.debug(containsAssemblyLine.tranid + " containsAssemblyLine? " + containsAssemblyLine.custbody_contains_assembly_line)

                        // only send an email if assembly line = true
                        if(containsAssemblyLine.custbody_contains_assembly_line){
                            var emailBody = `
                                Sales Order #: ${salesOrderTranId} <br/>
                                Work Order #: ${workOrderTranId} <br/>
                                Scale data is available for the following panels to adjust the scale on the Solder Paste Stencil if needed. <br/>
                            `
                            email.send({
                                author: authorId, // from script parameter
                                recipients: recipientIds, // comma separated field from script parameter
                                subject: `Scale data Available for Job # ${toolNumber}, ${workOrderTranId}`,
                                body: emailBody,
                            })

                            log.debug("EMAIL SENT SUCCESSFULLY")
                        }
                    }
                }
            }catch(e){
                log.error(e.name, e.message);
            }
        }

        return {afterSubmit}

    });
