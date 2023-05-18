/**
 *@NApiVersion 2.1
 *@NScriptType MassUpdateScript
 */
define(['N/search', 'N/record'], (search, record) => {

    // Generate new document number
    function beforeSubmit(rec) {
        let newID = generateNewDocNum(rec.type);
        
        if (newID) {
            if (record.Type.EMPLOYEE == rec.type) {
                let firstName = rec.getValue({
                    fieldId: 'firstname'
                });
                let lastName = rec.getValue({
                    fieldId: 'lastname'
                });
                newID = `${firstName} ${lastName} ${newID}`;
            } else {
                let companyName = rec.getValue({
                    fieldId: 'companyname'
                });
                newID = `${companyName} ${newID}`;
            }
        }

        return newID;
    }

    function afterSubmit(params) {
        let { type, id } = params;
        let rec = record.load({ type, id });
        log.debug('afterSubmit recid', { type, id });

        let newID = beforeSubmit(rec);
        rec.setValue({
            fieldId: 'entityid',
            value: newID
        })
        try {
            rec.save({
                ignoreMandatoryFields: true
            })
             log.debug('afterSubmit newID', newID);
             let docNum = documentNumbering(rec.type);
             if (docNum.id) {
                docNum.initialNumber++;
                try {
                    if (record.Type.EMPLOYEE == rec.type) {
                        let firstName = rec.getValue({
                            fieldId: 'firstname'
                        });
                        let lastName = rec.getValue({
                            fieldId: 'lastname'
                        });
                        newID = newID.replace(`${firstName} ${lastName} `, '')
                    } else {
                        let companyName = rec.getValue({
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
        } catch(e) {
            log.debug('Error', e.message)
        }
    }

    const generateNewDocNum = type => {
        let tranID = '';
        let docNum = documentNumbering(type);
        if (docNum.id) {
            docNum.initialNumber++;
            docNum.initialNumber = docNum.initialNumber.toString();
            tranID += docNum.prefix;
            tranID += docNum.digits > docNum.initialNumber.length ? '0'.repeat(docNum.digits-(docNum.initialNumber.length)) : '';
            tranID += docNum.initialNumber;
        }
        log.debug('generateNewDocNum tranID', tranID);
        return tranID;
    }

    const documentNumbering = type => {
        let obj = {
            id: '',
            prefix: '',
            digits: '',
            initialNumber: '',
            currentNumber: ''
        };
        let s = search.create({
            type: 'customrecord_document_numbering',
            filters: [
                ['isinactive', search.Operator.IS, 'F'],
                 'AND',
                ['custrecord_docnum_rectype_id', search.Operator.IS, type]
            ],
            columns: [
                'custrecord_docnum_prefix',
                'custrecord_docnum_digits',
                'custrecord_docnum_number',
                'custrecord_docnum_current_number'
            ]
        });
        s.run().each(each => {
            obj.id              = each.id;
            obj.prefix          = each.getValue({ name: 'custrecord_docnum_prefix' });
            obj.digits          = parseFloat(each.getValue({ name: 'custrecord_docnum_digits' })) || 0;
            obj.initialNumber   = parseFloat(each.getValue({ name: 'custrecord_docnum_number' })) || 0;
            obj.currentNumber   = each.getValue({ name: 'custrecord_docnum_current_number' });
            return false;
        })
        log.debug('documentNumbering obj', obj);
        return obj;
    }

    return {
        each: afterSubmit
    };
});
