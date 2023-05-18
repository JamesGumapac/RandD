
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/search', 'N/record'],
    function (search, record) {

        function getInputData() {

            return search.load({
                id: 'customsearch_serp_wo_completion'
            });
        }

        function map(context) {

            var searchResult = JSON.parse(context.value);
            var WCO_Id = searchResult.id;
            log.debug({title: 'map', details: 'WCO_Id:' + WCO_Id});

            //load SO and save
            var recWCO = record.load({
                type: record.Type.WORK_ORDER_COMPLETION,
                id: WCO_Id
            });

            recWCO.setValue('custbody_serp_mr_isprocessed', true);

            recWCO.save();

        }

        return {
            getInputData: getInputData,
            map: map
        }
    });