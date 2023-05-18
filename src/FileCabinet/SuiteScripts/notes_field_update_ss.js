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
                    var woid = params.woid;
                    var notes = params.notes;

                    if (woid) {
                        //  if (woid[0] == 'W' || woid[0] == 'w') {
                        //     var workorderno = woid.slice(2);
                        //     var mySearch = search.create({
                        //         type: "workorder",
                        //         filters:
                        //         [
                        //            ["type","anyof","WorkOrd"], 
                        //            "AND", 
                        //            ["mainline","is","T"],
                        //            "AND",
                        //            ["number","equalto",workorderno]
                        //         ],
                        //         columns:
                        //         [
                        //            search.createColumn({
                        //               name: "internalid",
                        //               label: "Internal ID"
                        //            }),
                        //            search.createColumn({
                        //               name: "tranid",
                        //               label: "Document Number"
                        //            }),
                        //         ]
                        //      });

                        //     mySearch.run().each(function (result) {

                        //         var wono = result.getValue({
                        //             name: "tranid",

                        //         });

                        //         var internalid = result.getValue({
                        //             name: "internalid",

                        //         });

                        //         updatefield(internalid,notes)
                        //         context.response.write("Successfully updated")

                        //         return true;
                        //     });
                        //  }

                        //  else {

                        updatefield(woid, notes);
                        context.response.write("Successfully updated")

                        // }
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
                type: record.Type.WORK_ORDER,
                id: id,
                values: {
                    custbody_cntm_notes_field: notes
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
