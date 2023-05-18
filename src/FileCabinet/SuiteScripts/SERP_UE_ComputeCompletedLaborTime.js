/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/record', 'N/search'],
/**
 * @param {format} format
 * @param {record} record
 */
function(runtime, record, search) {

    var CLIENTSUBLIST_RECTYPE = 'customrecord_cntm_clientappsublist';
    var CLIENTSUBLIST_FLD__STATUS = 'custrecord_cntm_cso_status';
    var CLIENTSUBLIST_FLD__COMPLETED_LABOR_TIME = 'custrecord_cntm_completed_labor_time';
    var CLIENTSUBLIST_FLD__PERCENT_COMPLETE = 'custrecord_cntm_percent_complete';
    var CLIENTSUBLIST_FLD__PANEL_LOT = 'custrecord_cntm_cso_pannellot';
    var CLIENTSUBLIST_FLD__SEQUENCE_NUMBER = 'custrecord_cntm_seq_no';
    var CLIENTSUBLIST_FLD__CLIENTHEADER = 'custrecord_cntm_cso_parentrec';
    var CLIENTSUBLIST_FLD__TOTAL_LABOR_TIME = 'custrecord_serp_wo_total_labor_time';

    var STATUS_COMPLETED = '4';

    var SPARAM_SEARCH__NEXT_CLIENT_SUBLIST_OPERATION = 'custscript_serp_search_nextclientsublist';
    var SPARAM_SEARCH__GET_COMPLETED_LABOR_TIME = 'custscript_serp_search_completedlabortim';

    function afterSubmit(context) {
        if (context.type != context.UserEventType.DELETE) {
            try{
                var newRecord = context.newRecord;
                var oldRecord = context.oldRecord;

                log.debug("Current Client App Sublist Record Id:", newRecord.id);

                //var oldRecord__status = oldRecord.getValue(CLIENTSUBLIST_FLD__STATUS);
                //var newRecord__status = newRecord.getValue(CLIENTSUBLIST_FLD__STATUS);

                var recordLookUp = search.lookupFields({
                    type: newRecord.type,
                    id: newRecord.id,
                    columns: [CLIENTSUBLIST_FLD__STATUS, CLIENTSUBLIST_FLD__CLIENTHEADER, CLIENTSUBLIST_FLD__PANEL_LOT, CLIENTSUBLIST_FLD__SEQUENCE_NUMBER, CLIENTSUBLIST_FLD__COMPLETED_LABOR_TIME]
                })

                var newRecord__status = recordLookUp.custrecord_cntm_cso_status[0].value;
                var client_header = recordLookUp.custrecord_cntm_cso_parentrec[0].value;
                var panel_lot = recordLookUp.custrecord_cntm_cso_pannellot;
                var sequence_number = recordLookUp.custrecord_cntm_seq_no;
                sequence_number = parseInt(sequence_number);
                var completed_labor_time = recordLookUp.custrecord_cntm_completed_labor_time;

                log.debug("status/clientheader/panellot/seqno/completedlabortime",newRecord__status+"/"+client_header+"/"+panel_lot+"/"+sequence_number+"/"+completed_labor_time);

                //if (!completed_labor_time) {
                    // var client_header = newRecord.getValue(CLIENTSUBLIST_FLD__CLIENTHEADER);
                    // var panel_lot = newRecord.getValue(CLIENTSUBLIST_FLD__PANEL_LOT);
                    // var sequence_number = newRecord.getValue(CLIENTSUBLIST_FLD__SEQUENCE_NUMBER);
                    // sequence_number = parseInt(sequence_number);

                    var next_client_sublist_operation = getNextClientSublitOperation(client_header, panel_lot, sequence_number);
                    log.debug('next_client_sublist_operation', next_client_sublist_operation);
                    if (next_client_sublist_operation) {
                        updateCompletedLaborTime(next_client_sublist_operation, client_header, panel_lot);
                    }

                //}
            }catch(error){
                log.error(error.message,error)
            }

        }
    }

    function updateCompletedLaborTime(client_sublist_id, client_header, panel_lot) {
        var search_filters = [
            ["isinactive","is","F"],
            "AND",
            ["custrecord_cntm_cso_status","anyof","4"],
            "AND",
            ["custrecord_cntm_cso_pannellot", "is", panel_lot],
            "AND",
            ["custrecord_cntm_work_order.mainline","is","T"]
        ];
        var search_cols = [
           search.createColumn({
              name: "formulanumeric",
              summary: "SUM",
              formula: "TO_NUMBER(NVL({custrecord_cntm_cso_laborruntime}, 0)) + TO_NUMBER(NVL({custrecord_cntm_cso_laborsetuptime},0))"
           }),
           search.createColumn({
              name: CLIENTSUBLIST_FLD__TOTAL_LABOR_TIME,
              summary: "GROUP"
           })
       ];
       search_filters.push('AND');
       search_filters.push([CLIENTSUBLIST_FLD__CLIENTHEADER, 'is', client_header]);
        // var search_obj = search.create({
        //     type: "customrecord_cntm_clientappsublist",
        //     filters: search_filters,
        //     columns: search_cols
        // });

        // var search_obj = search.load({
        //     type: null,
        //     id: search_id
        // });
        // var search_cols = [].concat(search_obj.columns);
        // var search_filters = [].concat(search_obj.filterExpression);


        var resultset = search.create({
            type: "customrecord_cntm_clientappsublist",
            filters: search_filters,
            columns: search_cols
        }).run().getRange({
            start: 0,
            end: 1
        });

        if (resultset.length > 0) {
            var total_completed_labor_time = parseFloatOrZero(resultset[0].getValue(search_cols[0]));
            total_completed_labor_time = parseFloatOrZero(total_completed_labor_time);
            var total_labor_time = parseFloatOrZero(resultset[0].getValue(search_cols[1]));
            total_labor_time = parseFloat(total_labor_time);

            var obj = {};
            if(total_labor_time != 0){
                obj[CLIENTSUBLIST_FLD__COMPLETED_LABOR_TIME] = total_completed_labor_time;
                obj[CLIENTSUBLIST_FLD__PERCENT_COMPLETE] = ((total_completed_labor_time / total_labor_time) * 100).toFixed(2);

                record.submitFields({
                    type: CLIENTSUBLIST_RECTYPE,
                    id: client_sublist_id,
                    values: obj
                });
            }
        }
    }

    function parseFloatOrZero(a){a=parseFloat(a);return isNaN(a)?0:a}

    function getNextClientSublitOperation(client_header, panel_lot, sequence_number) {
        if (isNullOrEmpty(client_header) || isNullOrEmpty(panel_lot) || isNullOrEmpty(sequence_number)) {
            return null;
        }
        var next_sequence_number = sequence_number + 1;

        var search_obj = search.create({
           type: "customrecord_cntm_clientappsublist",
           filters:
           [
              ["isinactive","is","F"],
              "AND",
              ["custrecord_cntm_cso_status","noneof","4"]
           ],
           columns:
           [
              "internalid",
              "custrecord_cntm_cso_parentrec",
              "custrecord_cntm_cso_pannellot",
              "custrecord_cntm_seq_no",
              "custrecord_cntm_cso_operaton",
              "custrecord_cntm_work_order"
           ]
        });

        // var search_obj = search.load({
        //     type: null,
        //     id: search_id
        // });
        var search_cols = [].concat(search_obj.columns);
        var search_filters = [].concat(search_obj.filterExpression);
        search_filters.push('AND');
        search_filters.push([CLIENTSUBLIST_FLD__CLIENTHEADER, 'is', client_header]);
        search_filters.push('AND');
        search_filters.push([CLIENTSUBLIST_FLD__PANEL_LOT, 'is', panel_lot]);
        search_filters.push('AND');
        search_filters.push(['formulanumeric: TO_NUMBER(NVL({'+ CLIENTSUBLIST_FLD__SEQUENCE_NUMBER +'}, 0))', 'equalto', next_sequence_number]);

        log.debug('search_filters', search_filters);

        var resultset = search.create({
            type: search_obj.searchType,
            filters: search_filters,
            columns: search_cols
        }).run().getRange({
            start: 0,
            end: 1
        });

        if (resultset.length > 0) {
            return resultset[0].id;
        }
        return null;
    }

    function isNullOrEmpty(data) {
        return (data == null || data == '');
    }

    return {
        afterSubmit: afterSubmit
    };

});
