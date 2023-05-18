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

    var SPARAM__WORK_ORDER_ID = 'custscript_serp_sparam_workorderid';
    var SPARAM__PANEL_LOT = 'custscript_serp_sparam_panellot';
    var SPARAM__CLIENT_APP_SUBLIST_OPERATION_IDS = 'custscript_serp_sparam_clientsublistids';
    var SPARAM__TOTAL_LABOR_TIME = 'custscript_serp_sparam_totallabortime';

    var CACHE = null;

    function getParameters() {
        if (!CACHE) {
            CACHE = {};

            var params = [
                SPARAM__WORK_ORDER_ID,
                SPARAM__PANEL_LOT,
                SPARAM__CLIENT_APP_SUBLIST_OPERATION_IDS,
                SPARAM__TOTAL_LABOR_TIME
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
    function getInputData() {
        var params = getParameters();
        var client_app_sublists = params[SPARAM__CLIENT_APP_SUBLIST_OPERATION_IDS];
        if (!isNullOrEmpty(client_app_sublists)) {
            client_app_sublists = client_app_sublists.split(',');
        }
        else {
            client_app_sublists = [];
        }

        log.debug('Processing...');
        log.debug('Work Order ID', params[SPARAM__WORK_ORDER_ID]);
        log.debug('Panel Lot', params[SPARAM__PANEL_LOT]);
        log.debug('Client Sublist Operation IDs', client_app_sublists);
        log.debug('Total Labor Time', params[SPARAM__TOTAL_LABOR_TIME]);

        return client_app_sublists;
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
        var params = getParameters();
        var client_app_sublist_id = context.value;
        var obj = {};
        obj[CLIENTSUBLIST_FLD__TOTAL_LABOR_TIME] = params[SPARAM__TOTAL_LABOR_TIME];

        try {
            record.submitFields({
                type: CLIENTSUBLIST_RECTYPE,
                id: client_app_sublist_id,
                values: obj
            });
            log.debug('Updated Client App Sublist Operation ID', client_app_sublist_id);
        }
        catch (err) {
            log.debug('Unable to update Client App Sublist Operation ID: ' + client_app_sublist_id, err);
        }
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {

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
        //reduce: reduce,
        summarize: summarize
    };

});
