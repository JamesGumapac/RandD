/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/format', 'N/runtime', 'N/error'],
    /**
     * @param search
     * @param record
     * @param format
     */
    function (search, record, format, runtime, error) {

        function getInputData() {
            var scriptObj = runtime.getCurrentScript();
            var filters = [];

            var itemSearchObj = search.create({
                type: "item",
                filters:
                    [
                        ["type", "anyof", ["Assembly", "InvtPart", "NonInvtPart"]],

                    ],
                columns:
                    [
                        search.createColumn({name: "type", label: "Type"}),
                    ]
            });

            return itemSearchObj;
        }

        function map(context) {
            var contextObject = JSON.parse(context.value);
            log.debug("contextObject", JSON.stringify(contextObject));
            var id = contextObject.id;
            var itemTranInfo;
            log.debug("id", id);

            try {
                itemTranInfo = getItemTransactionInfo(id);

                log.debug("itemTranInfo", JSON.stringify(itemTranInfo));

                if (!!itemTranInfo) {
                    var nsRec = record.load({
                        type: contextObject.recordType,
                        isDynamic: true,
                        id: id
                    });

                    if (!!itemTranInfo.lastTransactionDate)
                        nsRec.setValue({
                            fieldId: "custitem_rda_last_used_date",
                            value: formatStringToDate(itemTranInfo.lastTransactionDate)
                        });
                    else
                        nsRec.setValue({
                            fieldId: "custitem_rda_last_used_date",
                            value: itemTranInfo.lastTransactionDate
                        });

                    nsRec.setValue({
                        fieldId: "custitem_salora_last_used_transaction",
                        value: itemTranInfo.lastTransactionId
                    });

                    nsRec.save({"ignoreMandatoryFields": true});
                }
            } catch (ex) {
                log.error("error on item " + id, ex.toString());
            }
        }

        /**
         *
         * @param{number} itemInternalId
         */
        function getItemTransactionInfo(itemInternalId) {
            var output;
            var transactionSearchObj = search.create({
                type: "transaction",
                filters:
                    [
                        ["item", "is", itemInternalId],
                        "AND",
                        ["type", "anyof", "ItemRcpt", "WorkOrd"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "trandate",
                            summary: "MAX",
                            label: "Date"
                        }),
                        search.createColumn({
                            name: "internalid",
                            summary: "MAX",
                            label: "Internal ID"
                        })
                    ]
            });

            transactionSearchObj.run().each(function (result) {
                output = {};
                output.lastTransactionDate = result.getValue({
                    name: "trandate",
                    summary: "MAX"
                });
                output.lastTransactionId = result.getValue({
                    name: "internalid",
                    summary: "MAX"
                });
                return true;
            });
            return output;
        }

        function reduce(context) {

        }

        function summarize(context) {

        }

        function formatStringToDate(input) {
            return format.parse({
                value: input,
                type: format.Type.DATE
            });
        }

        return {
            getInputData: getInputData,
            map: map,
            //reduce: reduce,
            summarize: summarize
        };
    }
);