/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/search', 'N/ui/dialog'], function(search, dialog) {

    function fieldChanged(context) {
        var rec             = context.currentRecord;
        var prefix          = rec.getValue({ fieldId: 'custrecord_docnum_prefix' });
        var digits          = parseFloat(rec.getValue({ fieldId: 'custrecord_docnum_digits' })) || 0;
        var initialNumber   = (rec.getValue({ fieldId: 'custrecord_docnum_number' }) || 0).toString();
        var currentNumber   = '';

        if (prefix && digits && initialNumber) {
            var currentNumber = '';
            currentNumber += prefix;
            currentNumber += digits > initialNumber.length ? '0'.repeat(digits-(initialNumber.length)) : '';
            currentNumber += initialNumber;

            console.log('currentNumber', currentNumber);

            rec.setValue({
                fieldId             : 'custrecord_docnum_current_number',
                value               : currentNumber,
                ignoreFieldChange   : true
            });
        }
    }

    function saveRecord(context) {
        var rec = context.currentRecord;
        var rectype_id = rec.getValue({ fieldId: 'custrecord_docnum_rectype_id' });
        var filterExp = [
            ['isinactive', search.Operator.IS, 'F'],
            'AND',
            ['custrecord_docnum_rectype_id', search.Operator.IS, rectype_id]
        ]
        if (rec.id) {
            filterExp.push(
                'AND',
                ['internalid', search.Operator.NONEOF, [rec.id]]
            )
        }
        console.log('filterExp', filterExp);

        var s = search.create({
            type: rec.type,
            filters: filterExp
        }).run().getRange(0, 1);

        if (s.length) {
            dialog.alert({
                title: 'Notice',
                message: 'There is already an active Document Numbering for this record type id <b>' + rectype_id + '</b>'
            });
            return false;
        }
        return true;
    }

    return {
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    }
});
