/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/record', 'N/search', 'N/redirect', 'N/task'],
/**
 * @param {format} format
 * @param {record} record
 */
function(runtime, record, search, redirect, task) {

    var WO_FLD__CUSTOMRECORD_REF_HIDE = 'custbody_cntm_custom_rec_ref_hide';
    var WO_FLD__TOTAL_LABOR_TIME = 'custbody_wo_total_labor_time';

    var CLIENTSUBLIST_RECTYPE = 'customrecord_cntm_clientappsublist';
    var CLIENTSUBLIST_FLD__WORKORDER = 'custrecord_cntm_work_order';
    var CLIENTSUBLIST_FLD__TOTAL_LABOR_TIME = 'custrecord_serp_wo_total_labor_time';

    var SPARAM_SEARCH__CLIENT_APP_SUBLIST_OPERATION = 'custscript_serp_search_clientappsublist';

    var MR__COMPUTE_TOTAL_LABOR_TIME__SCRIPT_ID = 'customscript_serp_mr_computelabortimeue';
    var SPARAM__WORK_ORDER_ID = 'custscript_serp_sparam_workorderid';
    var SPARAM__PANEL_LOT = 'custscript_serp_sparam_panellot';
    var SPARAM__CLIENT_APP_SUBLIST_OPERATION_IDS = 'custscript_serp_sparam_clientsublistids';
    var SPARAM__TOTAL_LABOR_TIME = 'custscript_serp_sparam_totallabortime';

    function afterSubmit(context) {
        if (context.type != context.UserEventType.DELETE) {
            var thisRecord = context.newRecord;

            log.debug('Work Order ID', thisRecord.id);

            try {
                var recordLookUp = search.lookupFields({
                    type: thisRecord.type,
                    id: thisRecord.id,
                    columns: [WO_FLD__CUSTOMRECORD_REF_HIDE]
                });

                var is_ref_hide = recordLookUp.custbody_cntm_custom_rec_ref_hide//thisRecord.getValue(WO_FLD__CUSTOMRECORD_REF_HIDE);
                //is_ref_hide = is_ref_hide == true || is_ref_hide == 'T';

                log.debug("is_ref_hide: "+thisRecord,is_ref_hide)
                if (is_ref_hide) {
                    updateTotalLaborTime(thisRecord.id);
                }
            }
            catch (error) {
                log.debug(error.message, error);
            }

        }
    }

    function updateTotalLaborTime(wo_id) {
        // var script = runtime.getCurrentScript();
        // var search_id = script.getParameter(SPARAM_SEARCH__CLIENT_APP_SUBLIST_OPERATION);
        // var search_obj = search.load({
        //     type: null,
        //     id: search_id
        // });
        // var search_cols = [].concat(search_obj.columns);
        // var search_filters = [].concat(search_obj.filterExpression);
        // if (search_filters.length > 0) search_filters.push('AND');
        // search_filters.push([CLIENTSUBLIST_FLD__WORKORDER, 'is', wo_id]);
        //
        // var resultset = search.create({
        //     type: search_obj.searchType,
        //     filters: search_filters,
        //     columns: search_cols
        // }).run().getRange({
        //     start: 0,
        //     end: 1000
        // });

        // Uncomment this to not used script parameter search
        var search_filters = [
            [
               ["isinactive","is","F"],
               "AND",
               ["custrecord_cntm_cso_pannellot","isnotempty",""]
            ]
        ];
        search_filters.push('AND');
        search_filters.push([CLIENTSUBLIST_FLD__WORKORDER, 'is', wo_id]);
        var search_cols = [
            search.createColumn({
               name: "custrecord_cntm_cso_pannellot",
               summary: "GROUP"
            }),
            search.createColumn({
               name: "formulatext",
               summary: "MAX",
               formula: "NS_CONCAT({internalid})"
            }),
            search.createColumn({
               name: "formulanumeric",
               summary: "SUM",
               formula: "TO_NUMBER(NVL({custrecord_cntm_cso_laborruntime}, 0)) + TO_NUMBER(NVL({custrecord_cntm_cso_laborsetuptime}, 0))"
            })
        ];
        var resultset = search.create({
            type: "customrecord_cntm_clientappsublist",
            filters: search_filters,
            columns: search_cols
        }).run().getRange({
            start: 0,
            end: 1000
        });

        for (var i in resultset) {
            var result = resultset[i];
            var panel_lot = result.getValue(search_cols[0]);
            var client_app_sublists = result.getValue(search_cols[1]) || '';
            if (!isNullOrEmpty(client_app_sublists)) {
                client_app_sublists = client_app_sublists.split(',');
            }
            else {
                client_app_sublists = [];
            }
            var total_labor_time = result.getValue(search_cols[2]) || 0;
            total_labor_time = parseFloat(total_labor_time);

            var obj = {};
            obj[SPARAM__WORK_ORDER_ID] = wo_id;
            obj[SPARAM__PANEL_LOT] = panel_lot;
            obj[SPARAM__CLIENT_APP_SUBLIST_OPERATION_IDS] = client_app_sublists.join(',');
            obj[SPARAM__TOTAL_LABOR_TIME] = total_labor_time;
            var task_id = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: MR__COMPUTE_TOTAL_LABOR_TIME__SCRIPT_ID,
                deploymentId: null,
                params: obj
            }).submit();
            log.debug('Task Id', task_id);


            // for (var j in client_app_sublists) {
            //     var client_app_sublist = client_app_sublists[j];
            //     var o = {};
            //     o[CLIENTSUBLIST_FLD__TOTAL_LABOR_TIME] = total_labor_time;
            //     try {
            //         record.submitFields({
            //             type: CLIENTSUBLIST_RECTYPE,
            //             id: client_app_sublist,
            //             values: o
            //         });
            //         log.debug('Updated Client App Sublist Operation ID', client_app_sublist);
            //     }
            //     catch (err) {
            //         log.debug('Unable to update Client App Sublist Operation ID: ' + client_app_sublist, err);
            //     }
            // }

        }
    }

    function isNullOrEmpty(data) {
        return (data == null || data == '');
    }

    return {
        afterSubmit: afterSubmit
    };

});
