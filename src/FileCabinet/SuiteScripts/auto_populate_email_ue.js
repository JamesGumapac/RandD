/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/runtime'],
    /**
 * @param{search} search
 * @param{runtime} runtime
 */
    (search, runtime) => {
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
                let { newRecord, request } = scriptContext
                let params = request.parameters
                let id = params.transaction
                log.debug('Params', params)
                
                if (id) {
                    let type = search.lookupFields({ type: 'transaction', id, columns: 'recordtype'}).recordtype
                    log.debug('Transaction type', type)

                    if (type == 'salesorder') {
                        newRecord.setSublistValue({
                            sublistId: 'otherrecipientslist',
                            fieldId: 'email',
                            line: 0,
                            value: 'brian@saloraerp.com'
                        })
                        newRecord.setSublistValue({
                            sublistId: 'otherrecipientslist',
                            fieldId: 'cc',
                            line: 0,
                            value: true
                        })
                    }
                }
            } catch(e) {
                log.debug('beforeLoad error', e.message)
            }
        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

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

        }

        return {beforeLoad/* , beforeSubmit, afterSubmit */}

    });
