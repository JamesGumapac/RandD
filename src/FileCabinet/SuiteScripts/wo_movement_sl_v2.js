/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/runtime", "N/search", "N/task", "N/ui/serverWidget", "N/redirect", "N/url", "./lib/ns.utils"],
/**
* @param{runtime} runtime
* @param{search} search
* @param{task} task
* @param{serverWidget} serverWidget
* @param{redirect} redirect
* @param{url} url
*/
(runtime, search, task, serverWidget, redirect, url, ns_utils) => {

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

            log.debug("PARAMS", { method: request.method, params })

            if (request.method == "GET") {

                if (params.request_type) {
                    // Search all WO numbers first
                    if (params.request_type == "getWoNumbers") {
                        log.debug("getWoNumbers", params.woNumber)

                        let woNumbers = []
                        search.create({
                            type: "workorder",
                            filters:
                            [
                                ["numbertext","contains",params.woNumber],
                                "AND",
                                ["mainline", "is", "T"]
                            ],
                            columns:
                            [
                                search.createColumn({
                                    name: "tranid",
                                    label: "Document Number"
                                })
                            ]
                        }).run().each(each => {
                            woNumbers.push({
                                id: each.id,
                                number: each.getValue({ name: "tranid" })
                            })
                            return true
                        })
    
                        log.debug("woNumbers", woNumbers)
    
                        response.write(JSON.stringify(woNumbers))
                    }
                    // Search result each WO
                    if (params.request_type == "getWoNumbersResult") {
                        log.debug("getWoNumbersResult", params.woId)

                        var customrecord_cntm_clientappsublistSearchObj = search.create({
                            type: "customrecord_cntm_clientappsublist",
                            filters:
                            [
                                ["custrecord_cntm_work_order","is",params.woId],
                                "AND", 
                                ["custrecord_cntm_work_order.mainline","is","T"]
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
                        // var searchResultCount = customrecord_cntm_clientappsublistSearchObj.runPaged().count;
                        // log.debug("customrecord_cntm_clientappsublistSearchObj result count",searchResultCount);
            
                        let result = ns_utils.expandSearch(customrecord_cntm_clientappsublistSearchObj).map(m => ({
                            custrecord_cntm_work_order_tranid: m.getText(m.columns[0]) || m.getValue(m.columns[0]),
                            custrecord_cntm_seq_no: m.getText(m.columns[1]) || m.getValue(m.columns[1]),
                            custrecord_cntm_cso_operaton: m.getText(m.columns[2]) || m.getValue(m.columns[2]),
                            custrecord_cntm_cso_pannellot: m.getText(m.columns[3]) || m.getValue(m.columns[3]),
                            custrecord_cntm_cso_woc_quantity: m.getText(m.columns[4]) || m.getValue(m.columns[4]),
                            custrecord_cntm_cso_quantity_good: m.getText(m.columns[5]) || m.getValue(m.columns[5]),
                            custrecord_cntm_operator: m.getText(m.columns[6]) || m.getValue(m.columns[6]),
                            lastmodified: m.getText(m.columns[7]) || m.getValue(m.columns[7]),
                            custrecord_cntm_cso_status: m.getText(m.columns[8]) || m.getValue(m.columns[8]),
                            custrecord_cntm_cso_scrap_quantity: m.getText(m.columns[9]) || m.getValue(m.columns[9]),
                            custrecord_cntm_cso_scarp_cumulative: m.getText(m.columns[10]) || m.getValue(m.columns[10]),
                            custrecord_cntm_cso_wocnumber_tranid: m.getText(m.columns[1]) || m.getValue(m.columns[1]),
                            custrecord_cntm_cso_wocnumber_datecreated: m.getText(m.columns[12]) || m.getValue(m.columns[12]),
                        }))

                        log.debug("result", result.length)

                        response.write(JSON.stringify(result))
                    }
                } 
                
                else {
                    let form = serverWidget.createForm({ title: "WO Movement" })

                    let f = form.addField({
                        id: "wonumber",
                        label: "WO#",
                        type: "text",
                    })

                    f.isMandatory = true

                    let sublistField = {
                        "custrecord_cntm_work_order_tranid": {id: "custrecord_cntm_work_order_tranid", type: "text", label: "Document Number" },
                        "custrecord_cntm_seq_no": {id: "custrecord_cntm_seq_no", type: "text", label: "Sequence No" },
                        "custrecord_cntm_cso_operaton": {id: "custrecord_cntm_cso_operaton", type: "text", label: "Operation" },
                        "custrecord_cntm_cso_pannellot": {id: "custrecord_cntm_cso_pannellot", type: "text", label: "Panel LOT" },
                        "custrecord_cntm_cso_woc_quantity": {id: "custrecord_cntm_cso_woc_quantity", type: "text", label: "Lot Quantity " },
                        "custrecord_cntm_cso_quantity_good": {id: "custrecord_cntm_cso_quantity_good", type: "text", label: "Quantity Good " },
                        "custrecord_cntm_operator": {id: "custrecord_cntm_operator", type: "text", label: "Operator" },
                        "lastmodified": {id: "lastmodified", type: "text", label: "Last Modified" },
                        "custrecord_cntm_cso_status": {id: "custrecord_cntm_cso_status", type: "text", label: "Status " },
                        "custrecord_cntm_cso_scrap_quantity": {id: "custrecord_cntm_cso_scrap_quantity", type: "text", label: "Scrap Quantity" },
                        "custrecord_cntm_cso_scarp_cumulative": {id: "custrecord_cntm_cso_scarp_cumulative", type: "text", label: "Scrap (CUMULATIVE)" },
                        "custrecord_cntm_cso_wocnumber_tranid": {id: "custrecord_cntm_cso_wocnumber_tranid", type: "text", label: "Document Number" },
                        "custrecord_cntm_cso_wocnumber_datecreated": {id: "custrecord_cntm_cso_wocnumber_datecreated", type: "text", label: "Date Moved" },
                    }

                    let sublist = form.addSublist({
                        id: "details",
                        label: "Sublist (0)",
                        type: "staticlist"
                    })
                    for (id in sublistField) {
                        let f = sublist.addField(sublistField[id])
                    }

                    form.addSubmitButton({
                        label: "Submit"
                    })

                    form.clientScriptModulePath = "./wo_movement_cs"

                    response.writePage({
                        pageObject: form
                    })
                }
            }
            else {
                /* redirect.toSuitelet({
                    scriptId: script.id,
                    deploymentId: script.deploymentId,
                    parameters: {
                        wonumber: params.wonumber 
                    }
                }) */
            }
        }

        return {onRequest}

    });
