/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([],
    
    () => {
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

                var currentRecord = scriptContext.newRecord;
                var currentRecordID = currentRecord.id;
                var workOrderID = currentRecord.getValue({
                        fieldId:'custrecord_cntm_work_order'
                });

                if(workOrderID) {

                        var workOrderRecord = record.load({
                                type: 'workorder',
                                id: workOrderID,
                                isDynamic: true
                        });

                        var woPriority1 = workOrderRecord.getValue({
                                fieldId:'custbody_rda_wo_priorty'
                        });

                        var woPriority2 = workOrderRecord.getValue({
                                fieldId:'custbody_rda_wo_priorty_2'
                        });

                        var qFactor = workOrderRecord.getValue({
                                fieldId:'custbody_rda_qfactor'
                        });

                        var woScheduledDueDate =  workOrderRecord.getValue({
                                fieldId:'custbody_rda_wo_sched_due_date'
                        });

                        var commentsForDash = workOrderRecord.getValue({
                                fieldId:'custbody_comments_for_dash'
                        });

                        var commentsForProd = workOrderRecord.getValue({
                                fieldId:'custbody_comments_for_prod'
                        });

                        var percentageComplete = workOrderRecord.getValue({
                                fieldId:'custbody_wo_percent_completed'
                        });

                        var clientAppRecord = record.load({
                                type: 'customrecord_cntm_clientappsublist',
                                id: currentRecordID,
                                isDynamic: true
                        });



                        clientAppRecord.setValue({
                                fieldId:'custrecord_cntm_priority1',
                                value: woPriority1
                        });

                        clientAppRecord.setValue({
                                fieldId:'custrecord_cntm_priority2',
                                value: woPriority2
                        });

                        clientAppRecord.setValue({
                                fieldId:'custrecord_cntm_qfactor',
                                value: qFactor
                        });
                        clientAppRecord.setValue({
                                fieldId:'custrecord_cntm_comments_for_prod',
                                value: commentsForProd
                        });
                        clientAppRecord.setValue({
                                fieldId:'custrecord_cntm_comments_for_dash',
                                value: commentsForDash
                        });
                        clientAppRecord.setValue({
                                fieldId:'custrecord_cntm_percent_complete',
                                value: percentageComplete
                        });
                        clientAppRecord.setValue({
                                fieldId:'custrecord_cntm_wo_sched_due_date',
                                value: woScheduledDueDate
                        });

                        clientAppRecord.save();

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
