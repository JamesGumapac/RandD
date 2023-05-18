/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/currentRecord", "N/record", "N/search"],

    function (currentRecord, record, search) {

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
                if (context.request.method == 'GET') {
                    var params = context.request.parameters;
                  
                    var serialid = params.serialid;
                    var notes = params.notes;

                    if (serialid) {
                        if (serialid[0] == 'W' || serialid[0] == 'w') {
                            var serial = serialid;
                            var mySearch = search.create({
                                type: "customrecord_cntm_client_app_asm_oper_s",
                                filters:
                                    [
                                        ["internalid", "noneof", "@NONE@"], "AND",
                                        ["custrecord_cntm_client_asm_serial_no", "is", serial]

                                    ],
                                columns:
                                    [
                                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                                        search.createColumn({ name: "custrecord_cntm_client_asm_serial_no", label: "Serial ID" })
                                    ]
                            });

                            mySearch.run().each(function (result) {

                                var sid = result.getValue({
                                    name: "custrecord_cntm_client_asm_serial_no",

                                });
                                // log.debug("sid",sid)

                                var internalid = result.getValue({
                                    name: "internalid",

                                });
                                // log.debug("internalid",internalid)
                                updatefield(internalid, notes)
                                context.response.write("Successfully updated")

                                return true;
                            });
                        }

                        else {

                            updatefield(serialid, notes);
                            context.response.write("Successfully updated")

                        }
                    }
                    else {
                        context.response.write("Work order number cannot be null")
                    }
                }
            }
            catch (error) {
                context.response.write("error occured")
                log.error("error", error)
            }

        }

        function updatefield(id, notes) {
            record.submitFields({
                type: 'customrecord_cntm_client_app_asm_oper_s',
                id: id,
                values: {
                    custrecord_cntm_client_app_v2_notes: notes
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });

        }

        return {
            updatefield: updatefield,
            onRequest: onRequest
        };

    });
