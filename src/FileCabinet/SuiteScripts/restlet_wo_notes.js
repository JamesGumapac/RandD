/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(["N/currentRecord", "N/record", "N/search"],

function(currentRecord, record, search) {
   
    /**
     * Function called upon sending a GET request to the RESTlet.
     *
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.1
     */
    function doGet(requestParams) {
             

    }

    /**
     * Function called upon sending a PUT request to the RESTlet.
     *
     * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
     * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doPut(requestBody) {

    }


    /**
     * Function called upon sending a POST request to the RESTlet.
     *
     * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
     * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doPost(requestBody) {
        try {
            var response;
          log.debug("requestBody",requestBody)
               // var params = context.request.parameters;
                var woid = requestBody.woid;
                var notes = requestBody.notes;

                if (woid) {
                   //  if (woid[0] == 'W' || woid[0] == 'w') {
                        // var workorderno = woid.slice(2);
                        var mySearch = search.create({
                            type: "workorder",
                            filters:
                            [
                               ["type","anyof","WorkOrd"], 
                               "AND", 
                               ["mainline","is","T"],
                               "AND",
                               ["numbertext","haskeywords",woid]
                            ],
                            columns:
                            [
                               search.createColumn({
                                  name: "internalid",
                                  label: "Internal ID"
                               }),
                               search.createColumn({
                                  name: "tranid",
                                  label: "Document Number"
                               }),
                            ]
                         });

                        mySearch.run().each(function (result) {

                            var wono = result.getValue({
                                name: "tranid",

                            });

                            var internalid = result.getValue({
                                name: "internalid",

                            });

                            updatefield(internalid,notes)
                            log.debug("Successfully updated")
                            return true;
                        });
                    // }

                //      else {

                //     updatefield(woid, notes);
                //     log.debug("Successfully updated")
                //   //  context.response.write("Successfully updated")

                //      }
                }
                else {
                    log.debug("Work order number cannot be null")
                    //context.response.write("Work order number cannot be null")
                }
            }
        
        catch (error) {
          //  context.response.write("error occured")
            log.error("error", error)
        }
        return {isValid:true}
        
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

    /**
     * Function called upon sending a DELETE request to the RESTlet.
     *
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doDelete(requestParams) {

    }

    return {
        'get': doGet,
        put: doPut,
        post: doPost,
        'delete': doDelete,
        updatefield:updatefield
    };
    
});
