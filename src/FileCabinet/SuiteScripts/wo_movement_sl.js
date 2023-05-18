/**
* @NApiVersion 2.1
* @NScriptType Suitelet
*/
define(["N/runtime", "N/search", "N/task", "N/ui/serverWidget", "N/redirect", "N/url"],
/**
* @param{runtime} runtime
* @param{search} search
* @param{task} task
* @param{serverWidget} serverWidget
* @param{redirect} redirect
* @param{url} url
*/
(runtime, search, task, serverWidget, redirect, url) => {
    /**
    * Defines the Suitelet script trigger point.
    * @param {Object} scriptContext
    * @param {ServerRequest} scriptContext.request - Incoming request
    * @param {ServerResponse} scriptContext.response - Suitelet response
    * @since 2015.2
    */
    const onRequest = (scriptContext) => {
        let { request, response } = scriptContext
        let params = request.parameters
        let script = runtime.getCurrentScript()
        
        if (request.method == "GET") {
            log.debug("GET", script)
            
            let form = serverWidget.createForm({ title: "WO Movement" })
            
            form.addField({
                id: "wonumber",
                label: "WO#",
                type: serverWidget.FieldType.TEXT,
            }).isMandatory = true

            form.addSubmitButton({
                label: "Submit"
            })
            response.writePage({
                pageObject: form
            })
        }
        else {
            log.debug("POST", params)
            
            var customrecord_cntm_clientappsublistSearchObj = search.create({
                type: "customrecord_cntm_clientappsublist",
                filters:
                [
                    ["custrecord_cntm_work_order.numbertext","contains",params.wonumber]
                ],
                columns:
                [
                    search.createColumn({
                        name: "tranid",
                        join: "CUSTRECORD_CNTM_WORK_ORDER",
                        summary: "GROUP",
                        sort: search.Sort.ASC,
                        label: "Document Number"
                    }),
                    search.createColumn({
                        name: "custrecord_cntm_seq_no",
                        summary: "GROUP",
                        sort: search.Sort.ASC,
                        label: "Sequence No"
                    }),
                    search.createColumn({
                        name: "custrecord_cntm_cso_operaton",
                        summary: "GROUP",
                        label: "Operation"
                    }),
                    search.createColumn({
                        name: "custrecord_cntm_cso_pannellot",
                        summary: "GROUP",
                        label: "Panel LOT"
                    }),
                    search.createColumn({
                        name: "custrecord_cntm_cso_woc_quantity",
                        summary: "GROUP",
                        label: "Lot Quantity "
                    }),
                    search.createColumn({
                        name: "custrecord_cntm_cso_quantity_good",
                        summary: "GROUP",
                        label: "Quantity Good "
                    }),
                    search.createColumn({
                        name: "custrecord_cntm_operator",
                        summary: "GROUP",
                        label: "Operator"
                    }),
                    search.createColumn({
                        name: "lastmodified",
                        summary: "GROUP",
                        label: "Last Modified"
                    }),
                    search.createColumn({
                        name: "custrecord_cntm_cso_status",
                        summary: "GROUP",
                        label: "Status "
                    }),
                    search.createColumn({
                        name: "custrecord_cntm_cso_scrap_quantity",
                        summary: "GROUP",
                        label: "Scrap Quantity"
                    }),
                    search.createColumn({
                        name: "custrecord_cntm_cso_scarp_cumulative",
                        summary: "GROUP",
                        label: "Scrap (CUMULATIVE)"
                    }),
                    search.createColumn({
                        name: "tranid",
                        join: "CUSTRECORD_CNTM_CSO_WOCNUMBER",
                        summary: "GROUP",
                        label: "Document Number"
                    }),
                    search.createColumn({
                        name: "datecreated",
                        join: "CUSTRECORD_CNTM_CSO_WOCNUMBER",
                        summary: "GROUP",
                        label: "Date Moved"
                    })
                ]
            });
            var searchResultCount = customrecord_cntm_clientappsublistSearchObj.runPaged().count;
            log.debug("customrecord_cntm_clientappsublistSearchObj result count",searchResultCount);
            
            redirect.toSearchResult(customrecord_cntm_clientappsublistSearchObj.run().getRange(0, 1))
        }
    }
    
    return {onRequest}
    
});
