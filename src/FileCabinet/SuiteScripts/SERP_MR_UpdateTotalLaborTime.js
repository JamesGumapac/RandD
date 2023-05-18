/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime', 'N/error'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search, runtime, error) {

    var CLIENTSUBLIST_RECTYPE = 'customrecord_cntm_clientappsublist';
    var CLIENTSUBLIST_FLD__WORKORDER = 'custrecord_cntm_work_order';
    var CLIENTSUBLIST_FLD__TOTAL_LABOR_TIME = 'custrecord_serp_wo_total_labor_time';

    var CACHE = null;

    var SPARAM_SEARCH_WORKORDERS = 'custscript_serp_search_workorder';
    var SPARAM_SEARCH_CLIENTAPP = 'custscript_serp_search_clientapp';

    function getParameters() {
        if (!CACHE) {
            CACHE = {};

            var params = [
                SPARAM_SEARCH_WORKORDERS,
                SPARAM_SEARCH_CLIENTAPP
            ];

            var script = runtime.getCurrentScript();
            for (var i in params) {
                var key = params[i];
                var value = script.getParameter(key);
                CACHE[key] = value;
            }
        }
        return CACHE;
    }

    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
    function getInputData(context) {
        if (context.isRestarted) {
            return null;
        }
        var params = getParameters();
        return search.load({
            id: params[SPARAM_SEARCH_WORKORDERS]
        });
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
        log.debug('>> Mapping >>');
        log.debug(context.key, context.value);

        var contextValue = JSON.parse(context.value);
        //log.debug('contextValue', contextValue);
        if (contextValue && contextValue.values) {
            contextValue = contextValue.values["GROUP(internalid.CUSTRECORD_CNTM_WORK_ORDER)"];
            //log.debug('contextValue', contextValue);
            // START: If Context Value
            if (contextValue && contextValue.value) {
                var wo_id = contextValue.value;
                if (wo_id) {
                    log.debug('Work Order ID', wo_id);

                    var params = getParameters();

                    var search_obj = search.load({
                        type: null,
                        id: params[SPARAM_SEARCH_CLIENTAPP]
                    });
                    var search_cols = [].concat(search_obj.columns);
                    var search_filters = [].concat(search_obj.filterExpression);
                    search_filters.push('AND');
                    search_filters.push([CLIENTSUBLIST_FLD__WORKORDER, 'is', wo_id]);

                    var resultset = search.create({
                        type: search_obj.searchType,
                        filters: search_filters,
                        columns: search_cols
                    }).run().getRange({
                        start: 0,
                        end: 1000
                    });

                    // START: Start For Loop
                    for (var i=0; i<resultset.length; i++) {
                        var result = resultset[i];
                        var panel_lot = result.getValue(search_cols[0]);
                        var panel_ids = result.getValue(search_cols[1]) || '';
                        //panel_ids = panel_ids.split(',');
                        var total_labor_time = result.getValue(search_cols[2]) || 0;
                        total_labor_time = parseFloat(total_labor_time);

                        context.write({
                            key: wo_id + '__' + panel_lot,
                            value: JSON.stringify({
                                panel_lot: panel_lot,
                                panel_ids: panel_ids,
                                total_labor_time: total_labor_time
                            })
                        });
                    }
                    // END: For Loop
                }
            }
            // END: If Context Value
        }


    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
        log.debug('>> Reduce >>');
        log.debug(context.key, context.values);

        contextValue = context.values[0];
        log.debug('contextValue', contextValue);
        if (contextValue) {
            contextValue = JSON.parse(contextValue);
            var panel_ids = contextValue.panel_ids;
            panel_ids = panel_ids.split(',');
            var total_labor_time = contextValue.total_labor_time;
            var values = {};
            values[CLIENTSUBLIST_FLD__TOTAL_LABOR_TIME] = total_labor_time;

            for (var i in panel_ids) {
                var panel_id = panel_ids[i];
                record.submitFields({
                    type: CLIENTSUBLIST_RECTYPE,
                    id: panel_id,
                    values: values
                });
                log.debug('Updated Client App Sublist Operation ID', panel_id);
            }
        }
    }

    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
        log.debug('>> Summarize');
        var inputSummary = summary.inputSummary;
        var mapSummary = summary.mapSummary;
        var reduceSummary = summary.reduceSummary;

        if (inputSummary.error)
        {
            var e = error.create({
                name: 'INPUT_STAGE_FAILED',
                message: inputSummary.error
            });
            sendNotification(e, 'getInputData');
        }
        stageError('map', mapSummary);
        stageError('reduce', reduceSummary);
    }

    function stageError(stage, summary){
        var errorMsg = [];
        summary.errors.iterator().each(function(key, value){
            var msg = 'Error was: ' + JSON.parse(value).message + '\n';
            errorMsg.push(msg);
            return true;
        });
        if (errorMsg.length > 0)
        {
            var e = error.create({
                name: 'ERROR_IN_STAGE',
                message: JSON.stringify(errorMsg)
            });
            sendNotification(e, stage);
        }
    }

    function sendNotification(e, stage){
        log.error('Stage: ' + stage + ' failed', e);
    }

    function isNullOrEmpty(data) {
        return (data == null || data == '');
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };

});
