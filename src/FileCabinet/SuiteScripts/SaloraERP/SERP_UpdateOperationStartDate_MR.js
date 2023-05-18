/**
 *    Copyright (c) 2022, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/search', 'N/record', 'N/format'],
    function (search, record, format) {

    function getInputData() {

        return search.load({
            id: 'customsearch_update_client_app_sublist_2'
        });
    }

    function searchNextOperation (parentId, panelLot, seqNum) {
        log.debug({title: 'searchNextOperation', details: 'seqNum:' + seqNum});

        var nextOpId = null;

        const savedSearch = search.create({
            type: 'customrecord_cntm_clientappsublist',
            filters: [
                search.createFilter({ name: 'custrecord_cntm_cso_parentrec', operator: search.Operator.ANYOF, values: parentId }),
                search.createFilter({ name: 'custrecord_cntm_cso_pannellot', operator: search.Operator.IS, values: panelLot }),
                search.createFilter({ name: 'custrecord_cntm_seq_no', operator: search.Operator.EQUALTO, values: seqNum })
            ]
        });
        const result = savedSearch.run().getRange(0, 1);

        if (result.length > 0) {
            nextOpId = result[0].id;
        }

        log.debug({title: 'searchNextOperation', details: 'nextOpId:' + nextOpId});

        return nextOpId;
    }

    function map(context) {

        try {
            var searchResult = JSON.parse(context.value);
            var SOId = searchResult.id;
            log.debug({title: 'map', details: 'searchResult:' + context.value});

            //var searchResult = JSON.parse(context.value);

            var clientAppHeader = searchResult.values["custrecord_cntm_cso_parentrec"].value;
            log.debug({title: 'map', details: 'clientAppHeader:' + clientAppHeader});
            var panelLot = searchResult.values["custrecord_cntm_cso_pannellot"];
            log.debug({title: 'map', details: 'panelLot:' + panelLot});
            var sequenceNo = Number(searchResult.values["custrecord_cntm_seq_no"]);
            log.debug({title: 'map', details: 'sequenceNo:' + sequenceNo});
            var lastModifiedDate = searchResult.values["date.systemNotes"];
            log.debug({title: 'map', details: 'lastModifiedDate:' + lastModifiedDate});
            var dtLastModifiedDate =  format.parse({value:lastModifiedDate, type: format.Type.DATETIME});
            log.debug({title: 'map', details: 'dtLastModifiedDate:' + dtLastModifiedDate.toString()});



            sequenceNo += 1;

            // Search next operation
            const nextOpId = searchNextOperation(clientAppHeader, panelLot, sequenceNo);

            // Update next operation
            if (nextOpId) {

                record.submitFields({
                    type: 'customrecord_cntm_clientappsublist',
                    id: nextOpId,
                    values: {
                        custrecord_serp_operation_startdate: dtLastModifiedDate
                    },
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    }
                });

            }

        }catch(error){
            log.error(error.message);
        }

    }

    return {
        getInputData: getInputData,
        map: map
    }
});