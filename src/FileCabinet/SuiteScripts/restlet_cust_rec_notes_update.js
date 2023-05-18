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
          
                ///var params = context.request.parameters;
              
                var serialid = requestBody.serialid;
                var notes = requestBody.notes;

                if (serialid) {
                  
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
                            log.debug("Successfully updated");
                           // context.response.write("Successfully updated")

                            return true;
                        });
                    

                    
                }
                else {
                    log.debug("Work order number cannot be null")
                    //context.response.write("Work order number cannot be null")
                }
            
        }
        catch (error) {

           // context.response.write("error occured")
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
