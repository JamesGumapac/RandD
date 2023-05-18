/**
 *    Copyright (c) 2022, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/search', 'N/record'],
    function (search, record) {

        function getInputData() {

            return search.load({
                id: 'customsearch_serp_client_app_sublist_bf'
            });
        }

        function map(context) {

            try {
                var searchResult = JSON.parse(context.value);
                log.debug({title: 'map', details: 'context.value:' + context.value});

                var clientAppSublistId = searchResult.id;
                log.debug({title: 'map', details: 'clientAppSublistId:' + clientAppSublistId});

                var woID = searchResult.values["custrecord_cntm_work_order"].value;

                //get fields from WO
                var fieldsWO = search.lookupFields({
                    type: search.Type.WORK_ORDER,
                    id: woID,
                    columns: ['custbody_rda_wo_priorty', 'custbody_rda_wo_priorty_2', 'custbody_rda_qfactor',
                        'custbody_rda_wo_sched_due_date', 'custbody_comments_for_prod', 'custbody_comments_for_dash',
                        'custbody_wo_percent_completed']
                });
                log.debug({title: 'map', details: 'fieldsWO:' + fieldsWO});
                var woPriority = fieldsWO.custbody_rda_wo_priorty;
                var woPriority2 = fieldsWO.custbody_rda_wo_priorty_2;
                var qFactor = fieldsWO.custbody_rda_qfactor;
                var woSchedDueDate = fieldsWO.custbody_rda_wo_sched_due_date;
                var commentsForProd = fieldsWO.custbody_comments_for_prod;
                var commentsForDash = fieldsWO.custbody_comments_for_dash;
                var percentCompleted = fieldsWO.custbody_wo_percent_completed;

                //Update Client App Sublist Operation record
                record.submitFields({
                    type: 'customrecord_cntm_clientappsublist',
                    id: clientAppSublistId,
                    values: {
                        custrecord_cntm_priority1: woPriority,
                        custrecord_cntm_priority2: woPriority2,
                        custrecord_cntm_qfactor: qFactor,
                        custrecord_cntm_wo_sched_due_date: woSchedDueDate,
                        custrecord_cntm_comments_for_prod: commentsForProd,
                        custrecord_cntm_comments_for_dash: commentsForDash,
                        custrecord_cntm_percent_complete: percentCompleted
                    },
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    }
                });
            } catch (e) {
                log.error("ERROR",e.message);
            }


        }

        return {
            getInputData: getInputData,
            map: map
        }
    });