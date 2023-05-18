/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define(['N/runtime', 'N/search', 'N/record'], (runtime, search, record) => {

    function getInputData() {
        let script      = runtime.getCurrentScript();
        let deployId    = script.deploymentId;
        let searchType  = '';
        
        if (deployId == 'customdeploy1')
            searchType  = search.Type.VENDOR;
        if (deployId == 'customdeploy2')
            searchType = search.Type.CUSTOMER;
        if (deployId == 'customdeploy3')
            searchType = search.Type.EMPLOYEE;
        if (deployId == 'customdeploy4')
            searchType = search.Type.LEAD;
        if (deployId == 'customdeploy5')
            searchType = search.Type.PROSPECT;

        log.debug("######## [START] ########", { deployId, searchType });

        if (!searchType) return []

        // let custRec = getCustomRecordObj(searchType);
        // // let count   = (custRec.currentNumber.match(/0/g) || []).length;
        // let temp = custRec.prefix//`${custRec.prefix}${'0'.repeat(count)}`;

        // log.debug('temp', temp);

        // let ret = searchType ? search.create({
        //     type: 'entity',
        //     filters: [
        //         [
        //             ['isinactive', 'is', 'F'],
        //             // 'AND',
        //             // ['entityid', search.Operator.DOESNOTCONTAIN, temp],
        //             'AND',
        //             ['representingsubsidiary', search.Operator.ANYOF, ['@NONE@', '']]
        //         ]
        //     ],
        //     columns: [
        //         'entityid',
        //         search.createColumn({
        //             name: 'internalid',
        //             sort: search.Sort.ASC
        //         })
        //     ]
        // }) : []

        var employeeSearchObj = search.create({
            type: "employee",
            filters:
            [
                ["representingsubsidiary","anyof","@NONE@"]
            ],
            columns:
            [
               search.createColumn({name: "entityid", label: "Name"}),
               search.createColumn({name: "email", label: "Email"}),
               search.createColumn({name: "phone", label: "Phone"}),
               search.createColumn({name: "altphone", label: "Office Phone"}),
               search.createColumn({name: "fax", label: "Fax"}),
               search.createColumn({name: "supervisor", label: "Supervisor"}),
               search.createColumn({name: "title", label: "Job Title"}),
               search.createColumn({name: "altemail", label: "Alt. Email"}),
               search.createColumn({
                  name: "formulatext",
                  formula: "{entityid}",
                  label: "Formula (Text)"
               })
            ]
         });

        return employeeSearchObj//.run().getRange(0, 1)
    }

    function map(context) {
        let params = JSON.parse(context.value);
        log.debug('map', params)

        let type = params.recordType
        let id = params.id
        let rec = record.load({ type, id });
        //////// beforeSubmit
        let custRec = getCustomRecordObj(type)

        let newEntityIdNum = generateNewDocNum(custRec)
        let newEntityId = ''
        if (record.Type.EMPLOYEE == rec.type) {
            let firstName = rec.getValue({ fieldId: 'firstname' })
            let lastName = rec.getValue({ fieldId: 'lastname' })
            newEntityId = `${firstName} ${lastName} ${newEntityIdNum}` // Ex. Firstname Lastname EMP101
        } else {
            let isPerson = rec.getValue({ fieldId: 'isperson' }) // Radio button returns T/F
            if (isPerson == 'F') { // Company
                let companyName = rec.getValue({ fieldId: 'companyname' })
                newEntityId = `${companyName} ${newEntityIdNum}` // Ex. Company ABC CUS101
            }  else { // Individual
                let firstName = rec.getValue({ fieldId: 'firstname' })
                let lastName = rec.getValue({ fieldId: 'lastname' })
                newEntityId = `${firstName} ${lastName} ${newEntityIdNum}` // Ex. Firstname Lastname EMP101
            }
        }

        rec.setValue({ fieldId: 'entityid', value: newEntityId })
        try {
            rec.save({ ignoreMandatoryFields: true })
             log.debug('afterSubmit newEntityId', newEntityId)
             //////// afterSubmit
             try {
                // let newEntityIdNum = generateNewDocNum(custRec)

                record.submitFields({
                    type: 'customrecord_document_numbering',
                    id: custRec.id,
                    values: {
                        custrecord_docnum_number: custRec.initialNumber, // Ex. 001
                        custrecord_docnum_current_number: `${newEntityIdNum}` // Ex. EMP001
                    }
                })
                context.write({
                    key: custRec.id,
                    value: params
                })
                log.debug(`Updated customdocnum recid`, custRec.id);
            } catch(e) {
                log.debug(`Error update customdocnum recid: ${custRec.id}`, e.message);
            }
        } catch(e) {
            log.debug('Error', e.message)
        }
    }

    function summarize(summary) {
        let totalProcessed    = 0
        summary.output.iterator().each( (key, value) => {
            totalProcessed++ 
            return true
        })
        log.audit({ title: '######## [END] ########', details: `Usage: ${summary.usage}; Concurrency: ${summary.concurrency}; 
        Number of yields: ${summary.yields}; Total items processed: ${totalProcessed}` })
    }

    ///////////////// OTHER FUNCTIONS /////////////////

    const generateNewDocNum = obj => {
        let tranID = '';
        obj.initialNumber++;
        let initialNumber = obj.initialNumber.toString();
        tranID += obj.prefix;
        tranID += obj.digits > initialNumber.length ? '0'.repeat(obj.digits-(initialNumber.length)) : '';
        tranID += initialNumber;
        log.debug('generateNewDocNum tranID', tranID);
        return tranID;
    }

    const getCustomRecordObj = type => {
        let obj = {
            id: '',
            prefix: '',
            digits: '',
            initialNumber: '',
            currentNumber: ''
        };
        if (type == search.Type.PROSPECT || type == search.Type.LEAD)
            type = search.Type.CUSTOMER

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
        log.debug('getCustomRecordObj obj', obj);
        return obj;
    }

    return {
        getInputData,
        map,
        summarize
    };
});
