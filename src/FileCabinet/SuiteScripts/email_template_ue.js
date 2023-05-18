/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
 define(['N/record', 'N/search', 'N/format'],
 /**
* @param{record} record
* @param{search} search
* @param{format} format
*/
 (record, search, format) => {
     /**
      * Defines the function definition that is executed before record is loaded.
      * @param {Object} scriptContext
      * @param {Record} scriptContext.newRecord - New record
      * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
      * @param {Form} scriptContext.form - Current form
      * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
      * @since 2015.2
      */
     const beforeLoad = (scriptContext) => {
         try {
             if (scriptContext.type.match(/create|edit/g)) {
                let { form, newRecord, request } = scriptContext
                let { type, id } = newRecord
                let params = request.parameters
                log.debug('Enter', { type, id, eventType: scriptContext.type, params })
                
                if (params.transaction && type == 'message') {
                    let transactionId = params.transaction
                    let transactionType = search.lookupFields({
                       type: 'transaction',
                       id: transactionId,
                       columns: 'recordtype'
                   }).recordtype
                   log.debug('Transaction transactionType', transactionType)
      
                   if (transactionType.match(/itemfulfillment|invoice/g)) 
                      updateEmailTemplateField(transactionType, transactionId)
                }
             }
         } catch(e) {
             log.error('beforeLoad error', e.message)
         }
     }

     const updateEmailTemplateField = (type, id) => {
         let rec = record.load({ type, id })
         let items = []
         
         for (let i=0;i<rec.getLineCount({ sublistId: 'item' });i++) {
             items.push({
                orderline       : rec.getSublistValue({ sublistId: 'item', fieldId: 'orderline', line: i }),
                itemname        : rec.getSublistValue({ sublistId: 'item', fieldId: 'itemname', line: i }) || rec.getSublistText({ sublistId: 'item', fieldId: 'item', line: i }),
                description     : rec.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i }),
                order_qty       : 0,
                shipped_qty     : parseFloatOrZero(rec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i })),
                backordered_qty : 0,
                remaining_qty   : 0
            })
         }
         let createdFromId = rec.getValue({ fieldId: 'createdfrom' })
         if (!createdFromId) return

         if (rec.getText({ fieldId: 'createdfrom' }).match(/sales order/gi)) {
             let so = record.load({
                 type: 'salesorder',
                 id: createdFromId
             })
             for (let i=0;i<so.getLineCount({ sublistId: 'item' });i++) {
                 let line = so.getSublistValue({ sublistId: 'item', fieldId: 'line', line: i })
                 let idx = items.findIndex(fi => fi.orderline == line)
                 if (idx > -1) {
                     items[idx].order_qty = parseFloatOrZero(so.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i }))
                     items[idx].backordered_qty = parseFloatOrZero(so.getSublistValue({ sublistId: 'item', fieldId: 'quantitybackordered', line: i }))
                     items[idx].remaining_qty = parseFloatOrZero(so.getSublistValue({ sublistId: 'item', fieldId: 'custcol_remaining_qty', line: i }))
                     
                 }
             }
         }
         log.debug('ITEMS', { createdFromId, items })

         let html = `<table align="center" border="1" cellpadding="1" cellspacing="1" style="margin-left: 0px; margin-right: 0px; width: 966px;">
            <thead>
                <tr>
                <th style="text-align: center;"><b>ITEM NAME</b></th>
                <th style="text-align: center;"><b>ITEM DESCRIPTION</b></th>
                <th style="text-align: center;"><b>ORDERED QTY</b></th>
                <th style="text-align: center;"><b>SHIPPED QTY</b></th>
                <th style="text-align: center; width: 187px;"><b>BACKORDERED QTY</b></th>
                <th style="text-align: center; width: 114px;"><b>REMAINING QTY</b></th>
                </tr>
            </thead>
            <tbody>
                ${(() => {
                    let str = ""
                    for (item of items) {
                        str += `
                        <tr>
                            <td style="text-align: center;" width="120px">${item.itemname}</td>
                            <td style="text-align: center;" width="120px">${item.description}</td>
                            <td style="text-align: center;" width="120px">${addCommas(item.order_qty)}</td>
                            <td style="text-align: center;" width="120px">${addCommas(item.shipped_qty)}</td>
                            <td style="text-align: center;" width="120px">${addCommas(item.backordered_qty)}</td>
                            <td style="text-align: center;" width="120px">${addCommas(item.remaining_qty)}</td>
                        </tr>
                        `
                    }
                    return str
                })()}
            </tbody>
        </table>
         `
         log.debug('html', html)

         rec.setValue({ fieldId: 'custbody_email_template', value: html })
         rec.save({ ignoreMandatoryFields: true })
     }

    /**
     * Defines the function definition that is executed after record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
     * @since 2015.2
     */
    const afterSubmit = (scriptContext) => {
        try {
            if (scriptContext.type == 'delete') return
            let { type, id } = scriptContext.newRecord

            if (type.match(/itemfulfillment|invoice/g)) 
                updateEmailTemplateField(type, id)
        } catch(e) {
            log.debug('afterSubmit error', e.message)
        }
    }
     ////////////////////////////////////////////////////////////////////////////////////
     
     const parseFloatOrZero = n => {return parseFloat(n)||0}

     const addCommas = n => {
         return format.format({
             value: n,
             type: format.Type.FLOAT
         })
     }

     return {beforeLoad, afterSubmit}

 });
