/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/redirect', './createCustomOperationLineRecords_CM2.1.js'],
    
    (record, redirect, custLib) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let recId = scriptContext.request.parameters.recId
            let vars = {
                custbody_target_gate_first: '',
                custbody_target_gate_second: '',
                custbody_target_gate_third: '',
            }
            let target = custLib.computeWOTargetFields([recId])

            if (target[recId]) {
                if (target[recId].gate1.custOperationId) 
                    vars.custbody_target_gate_first = target[recId].gate1.custOperationId
                if (target[recId].gate2.custOperationId) 
                    vars.custbody_target_gate_second = target[recId].gate2.custOperationId
                if (target[recId].gate3.custOperationId) 
                    vars.custbody_target_gate_third = target[recId].gate3.custOperationId
                if (target[recId].projected) 
                    vars.custbody_latest_proj_end_date = target[recId].projected
            }

            log.debug('Updating gates', target)

            if (Object.keys(vars).length) { // If has any to update
                try {
                    record.submitFields({
                        type: record.Type.WORK_ORDER,
                        id: recId,
                        values: vars,
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });
                    log.debug('Success updating WO gates')
                } catch(e) {
                    log.debug('Error updating WO gates', e.message)
                }
            }

            redirect.toRecord({
                id: recId,
                type: record.Type.WORK_ORDER,
                isEditMode: false
            })
        }

        return {onRequest}

    });
