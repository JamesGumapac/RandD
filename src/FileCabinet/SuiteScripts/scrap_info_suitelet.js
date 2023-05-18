/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/search"],

    function (search) {

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {
            // try{
            if (context.request.method == 'GET') {
                var params = context.request.parameters;
                var woid = params.woid;
                var serialid = params.serialid;



                var scrapreason = getScrapInfo(woid, serialid);
                log.debug("scrapreason", scrapreason)
            }

        }

        function getScrapInfo(woid, serialid) {
            try {


                var reason;
                var customrecord_cntm_client_app_asm_oper_sSearchObj = search.create({
                    type: "customrecord_cntm_client_app_asm_oper_s",
                    filters:
                        [
                            ["custrecordcntm_client_asm_is_scrapped", "is", "T"],
                            "AND",
                            ["custrecordcntm_client_asm_wo_ref", "anyof", woid],
                            //    "AND", 
                            //    ["custrecordcntm_client_asm_wo_ref","anyof",serialid]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custrecordcntm_client_asm_wo_ref", label: "WO Reference" }),
                            search.createColumn({ name: "custrecord_cntm_client_asm_serial_no", label: "Serial ID" }),
                            search.createColumn({
                                name: "internalid",
                                join: "CUSTRECORD_CNTM_SUBLST_PARENTOP",
                                label: "Internal ID"
                            }),
                            search.createColumn({
                                name: "custrecord_cntm_sublst_scrapinfo",
                                join: "CUSTRECORD_CNTM_SUBLST_PARENTOP",
                                label: "Scrap Info"
                            }),
                            search.createColumn({
                                name: "custrecord_cntm_sublst_parentop",
                                join: "CUSTRECORD_CNTM_SUBLST_PARENTOP",
                                label: "Parent Operation"
                            }),

                        ]
                });
           
                customrecord_cntm_client_app_asm_oper_sSearchObj.run().each(function (result) {

                    var sublistid = result.getValue(search.createColumn({
                        name: "internalid",
                        join: "CUSTRECORD_CNTM_SUBLST_PARENTOP",
                        label: "Internal ID"
                    })

                    );
                    var scraptext = result.getText(search.createColumn({
                        name: "custrecord_cntm_sublst_scrapinfo",
                        join: "CUSTRECORD_CNTM_SUBLST_PARENTOP",
                        label: "Scrap Info"
                    })

                    );
                    var scrapid = result.getValue(search.createColumn({
                        name: "custrecord_cntm_sublst_scrapinfo",
                        join: "CUSTRECORD_CNTM_SUBLST_PARENTOP",
                        label: "Scrap Info"
                    })

                    );
                    var ser = result.getValue(search.createColumn({ name: "custrecord_cntm_client_asm_serial_no", label: "Serial ID" })

                    );

                    if (ser == serialid) {

                        reason = scraptext;
                        // log.debug("reason",reason)
                    }


                 
                    return true;
                });

            


                if (reason) {
                    // log.debug("reason",reason)
                    return reason;
                } else {
                    return null;
                }



            }
            catch (error) {
                log.error("error occurred", error)
            }


        }

        return {
            onRequest: onRequest
        };

    });
