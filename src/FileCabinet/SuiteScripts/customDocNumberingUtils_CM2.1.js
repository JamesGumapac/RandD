/**
 *@NApiVersion 2.1
 %@NModuleScope Public
 */
define(['N/search'], search => {

    const mapRecordType = type => {
        let recType = type;
        switch(type) {
            case search.Type.PROSPECT:
            case search.Type.LEAD:
                recType = search.Type.CUSTOMER;
                break;
        }
        return recType;
    }

    const isRepresentsSubsidiary = rec => {
        let subsidiaryRep = rec.getValue({
            fieldId: 'representingsubsidiary'
        });
        let bool = subsidiaryRep ? true : false;
        log.debug('isRepresentsSubsidiary', { subsidiaryRep, bool });
        return bool
    }

    const isAlreadyNumbered = (rec, obj) => {
        let bool = false;
        let entityID = rec ? rec.getValue({
            fieldId: 'entityid'
        }) : '';
        let prefix = obj.prefix;
        let digits = obj.digits;
        let pos = entityID.indexOf(` ${prefix}`);
        if (pos > -1) {
            // EX. bool true if TESTNAME VEN0001 contains TESTNAME VEN
            let originalEntityID = entityID.substr(0, pos);
            if (entityID.indexOf(`${originalEntityID} ${prefix}`) > -1) {
                bool = true
            }
        }
        log.debug('isAlreadyNumbered', { entityID, prefix, digits, bool });
        return bool;
    }

    const generateNewDocNum = obj => {
        let tranID = '';
        obj.initialNumber++;
        obj.initialNumber = obj.initialNumber.toString();
        tranID += obj.prefix;
        tranID += obj.digits > obj.initialNumber.length ? '0'.repeat(obj.digits-(obj.initialNumber.length)) : '';
        tranID += obj.initialNumber;
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
                ['custrecord_docnum_rectype_id', search.Operator.IS, mapRecordType(type)]
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

    const updateDocNumRecord = (rec1, rec2, obj) => {
        let bool = false;
        if (!isAlreadyNumbered(rec1, obj) && isAlreadyNumbered(rec2, obj)) {
            bool = true;
        }
        log.debug('updateDocNumRecord', { bool });
        return bool;
    }

    return {
        isRepresentsSubsidiary,
        isAlreadyNumbered,
        generateNewDocNum,
        documentNumbering,
        updateDocNumRecord
    }
})