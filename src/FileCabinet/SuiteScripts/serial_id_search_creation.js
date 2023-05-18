/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/https", "N/search"],

    function (https, search) {

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {
            try {
                var response;
                if (context.request.method == 'GET')
                    // {
                    //     log.debug("inside get method")
                    //      response = https.request({
                    //         method: https.Method.GET,
                    //         url: 'https://api-generator.retool.com/WdUgMK/griddata',
                    //         body: 'My REQUEST Data',
                    //        // headers: headerObj
                    //     });
                    //     log.debug("response",response)
                    //     // let jsonstr = response.split('\n').join(",");
                    //     context.response.write(JSON.stringify(response.body))

                    // var response = https.get({
                    //     url: 'https://5361187-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=7791&deploy=1&compid=5361187_SB1&h=bc75a40dd7d743afcbe3&woid=WO37',
                    //     headers: headerObj
                    // });

                    var params = context.request.parameters;
                log.debug('params', params);
                var woid = params.woid;
                log.debug("url woid", woid)


                var workorderSearchObj = search.create({
                    type: "workorder",
                    filters:
                        [
                            ["type", "anyof", "WorkOrd"],
                            "AND",
                            ["mainline", "is", "T"],
                            "AND",
                            ["internalid", "is",woid ]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "internalid",
                                join: "CUSTRECORD10",
                                summary: "COUNT",
                                label: "Internal ID"
                            }),
                            search.createColumn({
                                name: "quantity",
                                summary: "SUM",
                                label: "Quantity"
                            }),
                            search.createColumn({
                                name: "tranid",
                                summary: "GROUP",
                                label: "Document Number"
                            })
                           
                        ]
                });
               // var searchResultCount = workorderSearchObj.runPaged().count;
             // log.debug("workorderSearchObj result count",searchResultCount);
                workorderSearchObj.run().each(function (result) {


                    // .run().each has a limit of 4,000 results
                    var serialidno = result.getValue({
                        name: "internalid",
                        join: "CUSTRECORD10",
                        summary: "COUNT",
                        label: "Internal ID"
                    })
                    var quantity = result.getValue({
                        name: "quantity",
                        summary: "SUM",
                        label: "Quantity"
                    })
                    var workorderno = result.getValue({
                        name: "tranid",
                        summary: "GROUP",
                        label: "Document Number"
                    })

                  
                        //If no serial ids are present return the internal id/workorder number 
                        if (serialidno == 0) {
                            context.response.write("No serial ids created for the workorder\n")
                        }
                        else {
                            context.response.write(workorderno + "\n")
                        }

                        //If the quantity and the number of serial ids created are not same return false
                        if (quantity == serialidno) {
                            context.response.write(JSON.stringify(result))
                            log.debug("serial id and quantity same")
                            context.response.write("\n")
                        }
                        else {

                            //context.response.write("no matching result found")
                            //code for creating remaining number of serial ids.
                        }
                    


                    // log.debug("quantity",quantity)
                    //context.response.write(JSON.stringify(quantity))
                    return true;
                });

                // mySearch.run().each(function(result) {
                //     var quantity= result.getValue({
                //         name: "quantity",
                //         summary: "SUM",
                //         label: "Quantity"
                //      })
                //     log.debug("result of saved search",quantity)
                // });



                if (context.request.method == 'POST') {
                    //  log.debug("inside post method")
                    //  log.debug("response in post",response)
                    context.response.write(JSON.stringify(response))

                }
            }

            catch (error) {
                log.error("error occured", error)
            }

        }
        return {
            onRequest: onRequest
        };

    });


