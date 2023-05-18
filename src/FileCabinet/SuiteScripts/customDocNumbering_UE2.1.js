/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record', './customDocNumberingUtils_CM2.1'], (record, docNumUtils) => {

    function beforeLoad(context) {
        if (['create', 'copy', 'edit', 'xedit'].indexOf(context.type) == -1) return;
        let { newRecord, form } = context;
        if (docNumUtils.isRepresentsSubsidiary(newRecord))
            return false;
        if (['create','copy'].indexOf(context.type) > -1) {
            newRecord.setValue({
                fieldId: 'entityid',
                value: 'To Be Generated'
            });
        }
        try { // Hide the autoname checkbox on create
            newRecord.setValue({
                fieldId: 'autoname',
                value: false
            });
            form.getField({
                id: 'autoname'
            }).updateDisplayType({
                displayType : 'hidden'
            });
        } catch(e) {
            log.debug('Hiding autoname field error', e.message)
        }
        if (['edit','xedit'].indexOf(context.type) > -1) {
            try { // Hide the entity field on edit
                form.getField({
                    id: 'entityid'
                }).updateDisplayType({
                    displayType : 'hidden'
                });
            } catch(e) {
                log.debug('Hiding entityid field error', e.message)
            }
        }
    }

    // Generate new document number
    function beforeSubmit(context) {
        if (context.type == 'delete') return;
        let { oldRecord, newRecord } = context;

        if (docNumUtils.isRepresentsSubsidiary(newRecord))
            return false;

        let docNum = docNumUtils.documentNumbering(newRecord.type);

        if (docNum.id) {
            if (!docNumUtils.isAlreadyNumbered(newRecord, docNum)) {
                let newID = docNumUtils.generateNewDocNum(docNum);
                if (newID) {
                    if (record.Type.EMPLOYEE == newRecord.type) {
                        let firstName = newRecord.getValue({
                            fieldId: 'firstname'
                        });
                        let lastName = newRecord.getValue({
                            fieldId: 'lastname'
                        });
                        newID = `${firstName} ${lastName} ${newID}`;
                    } else {
                        let companyName = newRecord.getValue({
                            fieldId: 'companyname'
                        }) || newRecord.getValue({ 
                            fieldId: 'entityid'
                        });
                        newID = `${companyName} ${newID}`;
                    }
                }
                newRecord.setValue({
                    fieldId: 'entityid',
                    value: newID
                });
            } else if (['edit', 'xedit'].indexOf(context.type) > -1) {
                let oldEntityID = oldRecord.getValue({
                    fieldId: 'entityid'
                });
                let oldCompanyName = oldRecord.getValue({
                    fieldId: 'companyname'
                }) || oldRecord.getValue({ 
                    fieldId: 'entityid'
                });
                let newCompanyName = newRecord.getValue({
                    fieldId: 'companyname'
                }) || newRecord.getValue({ 
                    fieldId: 'entityid'
                });
                log.debug(`Edited: ${(oldCompanyName != newCompanyName)}`, { oldCompanyName, newCompanyName });
                
                if (oldCompanyName != newCompanyName) {
                    let newID = oldEntityID.replace(oldCompanyName, newCompanyName);
                    log.debug('Updated entityid', { oldEntityID, newID });
    
                    newRecord.setValue({
                        fieldId: 'entityid',
                        value: newID
                    });
                }
            }
        }
    }

    // Update custom record's initial and current numbering
    function afterSubmit(context) {
        try {
            if (context.type == 'delete') return;
            let { oldRecord, newRecord } = context;

            if (docNumUtils.isRepresentsSubsidiary(newRecord))
                return false;

                let docNum = docNumUtils.documentNumbering(newRecord.type);
             
                if (docNum.id) {
                    if (docNumUtils.updateDocNumRecord(oldRecord, newRecord, docNum)) {
                        docNum.initialNumber++;
                        try {
                            let newID = newRecord.getValue({ 
                                fieldId: 'entityid'
                            });
                            if (record.Type.EMPLOYEE == newRecord.type) {
                                let firstName = newRecord.getValue({
                                    fieldId: 'firstname'
                                });
                                let lastName = newRecord.getValue({
                                    fieldId: 'lastname'
                                });
                                newID = newID.replace(`${firstName} ${lastName} `, '')
                            } else {
                                let companyName = newRecord.getValue({
                                    fieldId: 'companyname'
                                });
                                newID = newID.replace(`${companyName} `, '')
                            }
                            record.submitFields({
                                type: 'customrecord_document_numbering',
                                id: docNum.id,
                                values: {
                                    custrecord_docnum_number: docNum.initialNumber,
                                    custrecord_docnum_current_number: newID
                                }
                            })
                            log.debug(`Updated customdocnum recid`, docNum.id);
                        } catch(e) {
                            log.debug(`Error update customdocnum recid: ${docNum.id}`, e.message);
                        }
                    }
                }
        } catch(e) {
            log.debug('Error', e.message);
        }
    }

    return {
        beforeLoad,
        beforeSubmit,
        afterSubmit
    };
});
