/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/record'], (search, record) => {

    function beforeLoad(context) {
        try{
            let { form, newRecord, request } = context
            let { type, id } = newRecord
            log.debug('Enter', { type, id, eventType: context.type })

            // Add field to store the transaction/PO internalid to the field and beforeSubmit function reads it
            if (type == 'message') {
                if (context.type.match(/create|edit/g)) {
                    let params = request.parameters
                    let f = form.addField({
                        id: 'custpage_transaction_id',
                        label: 'Transaction Internalid',
                        type: 'text'
                    })
                    f.defaultValue = params.transaction
                    f.updateDisplayType({
                        displayType: 'hidden'
                    })
                }
            }
            if (type == 'purchaseorder') {
                if (context.type == 'print') {
                    if (!id) return
        
                    // JOB Mapping // record.createdfrom.job returns error field mapping
                    let job = newRecord.getText({ fieldId: 'custbody_rda_ref_toolnumber' })
                    if (!job)
                        job = getSOJobID(id)
                    
                    form.addField({
                        id: 'custpage_job',
                        label: 'Job ID',
                        type: 'richtext'
                    }).defaultValue = job
        
                    // Item Verbiages Mapping
                    let verbiages = getItemsVerbiage(newRecord)
                    form.addField({
                        id: 'custpage_verbiages',
                        label: 'Verbiages',
                        type: 'textarea'
                    }).defaultValue = verbiages
                }

                // else if (context.type == 'edit' || context.type =='create'){
                //     log.debug('This is Sam, Say Hi');
                // }

                // else{
                //     log.debug('This is the context',context.type);
                // }
            }
        } catch(e){
            log.error('beforeLoad error', e.message);
        }
    }
    // Update the purchase order record to update the verbiage and jobid fields
    function beforeSubmit(context) {
        try {
            let { form, newRecord } = context
            let { type, id } = newRecord
            log.debug('Enter', { type, id, eventType: context.type })

            if (type == 'message') {
                let transactionId = newRecord.getValue({ fieldId: 'custpage_transaction_id' })
                let transactionType = search.lookupFields({
                    type: 'transaction',
                    id: transactionId,
                    columns: 'recordtype'
                }).recordtype
                log.debug('Transaction transactionType', transactionType)

                // Make sure the verbiage and jobid fields are updated before this email is submitted
                if (transactionType == 'purchaseorder') 
                    updatePOAdvancedPDFFields(transactionType, transactionId)
            }
        } catch(e) {
            log.error('beforeSubmit error', e.message);
        }
    }

    function afterSubmit(context) {
        try{
            let { form, newRecord } = context
            let { type, id } = newRecord
            log.debug('Enter', { type, id, eventType: context.type })
            
            if (type == 'purchaseorder')
                updatePOAdvancedPDFFields(type, id)
        } catch(e){
            log.error('afterSubmit error', e.message);
        }
    }

    const updatePOAdvancedPDFFields = (type, id) => {
        if (!id) return
        let newRecord = record.load({ type, id })
    
        // JOB Mapping // record.createdfrom.job returns error field mapping
        let job = newRecord.getText({ fieldId: 'custbody_rda_ref_toolnumber' })
        if (!job)
            job = getSOJobID(id)
        
        newRecord.setValue({ fieldId: 'custbody_job_id', value: job || '' })

        // Item Verbiages Mapping
        let verbiages = getItemsVerbiage(newRecord)
        newRecord.setValue({ fieldId: 'custbody_rd_verbiages_po_field', value: verbiages || '' })
        newRecord.save({ ignoreMandatoryFields: true })
        log.debug('PO advanced pdf fields updated successfully')
    }

    const getSOJobID = poid => {
        let job = ''
        search.create({
            type: search.Type.SALES_ORDER,
            filters: [
                ['purchaseorder', search.Operator.IS, poid]
            ],
            columns: ['jobMain.entityid']
        }).run().each(each => {
            job = each.toJSON().values['jobMain.entityid']
            return false
        })
        log.debug('getSOJobID', job)
        return job
    }

    const getItemsVerbiage = newRecord => {
        let verbiages = ''
        let itemIDs = []
        for (var i=0;i<newRecord.getLineCount('item');i++) {
            itemIDs.push(newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i
            }))
        }
        log.debug('Item IDs', itemIDs)

        let invtypeIDs = []
        search.create({
            type: search.Type.ITEM,
            filters: [
                ['internalid', search.Operator.ANYOF, itemIDs]
            ],
            columns: ['custitem_rda_item_type']
        }).run().each(each => {
            invtypeIDs.push(each.getValue('custitem_rda_item_type'))
            return true
        })
        invtypeIDs = invtypeIDs.filter(f=>f!=''&&f!=null)
        log.debug('Inventory Item Type IDs', invtypeIDs)
        var messagesDuplicateCheck = [];
        if (invtypeIDs.length) {
            search.create({
                type: 'customrecord_item_type',
                filters: [
                    ['internalid', search.Operator.ANYOF, invtypeIDs],
                    'AND',
                    [
                        ['custrecord_item_type_details', search.Operator.DOESNOTCONTAIN, 'TEST-'],
                        'OR',
                        ['custrecord_item_type_details', search.Operator.DOESNOTCONTAIN, 'test-']
                    ]
                ],
                columns: ['custrecord_item_type_details']
            }).run().each(each => {
                if(messagesDuplicateCheck.indexOf(each.getValue('custrecord_item_type_details')) == -1){
                    messagesDuplicateCheck.push(each.getValue('custrecord_item_type_details'));
                verbiages += `- ${each.getValue('custrecord_item_type_details') || ''}\n\n`
                return true
                }
            })
        }
        log.debug('custbody_rd_verbiages_po_field', verbiages)
        return verbiages
    }

    return {
        beforeLoad,
        beforeSubmit,
        afterSubmit
    };
});
