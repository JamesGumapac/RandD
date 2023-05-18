/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */

define(['N/runtime', 'N/record', 'N/search', 'N/http', 'N/file', 'N/render', 'N/xml', 'N/format'],
    function (runtime, record, search, http, file, render, xml, format) {
        function onRequest(params) {
            try {
                if (params.request.method === 'GET') {
                    var scriptObj = runtime.getCurrentScript();
                    var request = params.request, resultData;
                    var recid = request.parameters.recid;
                    var nsRec, tranLineCount, pdfLine;
                    log.debug("recid", recid);

                    if (!!recid) {
                        nsRec = record.load({type: "inventorytransfer", id: recid});
                        resultData = {};
                        resultData.trandate = formatDateToString(nsRec.getValue({fieldId: "trandate"}));
                        resultData.tranid = nsRec.getValue({fieldId: "tranid"});
                        resultData.subsidiary = xml.escape({
                            xmlText: nsRec.getText({fieldId: "subsidiary"})
                        });
                        resultData.fromlocation = xml.escape({
                            xmlText: nsRec.getText({fieldId: "location"})
                        });
                        resultData.tolocation = xml.escape({
                            xmlText: nsRec.getText({fieldId: "transferlocation"})
                        });
                        resultData.lines = [];
                        tranLineCount = nsRec.getLineCount({sublistId: "inventory"});

                        for (var i = 0; i < tranLineCount; i++) {
                            pdfLine = {};
                            pdfLine.item = nsRec.getSublistValue({sublistId: "inventory", fieldId: "item", line: i});
                            pdfLine.item_text = xml.escape({
                                xmlText: nsRec.getSublistText({
                                    sublistId: "inventory",
                                    fieldId: "item",
                                    line: i
                                })
                            });
                            pdfLine.description = xml.escape({
                                xmlText: nsRec.getSublistValue({
                                    sublistId: "inventory",
                                    fieldId: "description",
                                    line: i
                                })
                            });
                            pdfLine.unit = nsRec.getSublistValue({sublistId: "inventory", fieldId: "units", line: i});
                            pdfLine.unit_text = nsRec.getSublistText({
                                sublistId: "inventory",
                                fieldId: "units",
                                line: i
                            });
                            pdfLine.quantity = nsRec.getSublistValue({
                                sublistId: "inventory",
                                fieldId: "adjustqtyby",
                                line: i
                            });
                            resultData.lines.push(pdfLine);
                        }

                        log.debug("resultData", JSON.stringify(resultData));
                        var renderer = render.create();
                        renderer.setTemplateByScriptId({
                            //scriptId: scriptObj.getParameter({name: 'custscript_fmt_bomprint'})
                            scriptId: "CUSTTMPL_128_5361187_SB1_393"
                        });

                        renderer.addCustomDataSource({
                            format: render.DataSource.OBJECT,
                            alias: "JSON",
                            data: {data: resultData}
                        });

                        var nsPDF = renderer.renderAsPdf();
                        params.response.writeFile({file: nsPDF, isInline: true});
                    }
                }
            } catch (e) {
                log.debug('Error Occured', e)
            }
        }

        function formatStringToDate(input) {
            return format.parse({
                value: input,
                type: format.Type.DATE
            });
        }

         function formatDateToString(input) {
            return (input.getMonth() + 1) + "/" + input.getDate() + "/" + input.getFullYear();
        }

        return {
            onRequest: onRequest
        };
    });