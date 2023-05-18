/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
/**
 * Module Description
 * 
 * Sr. No   	 Date           	  Author                  	Remarks
 * 1		 	9 Jan 2023	      Harsha Bhakare   	-           Script to add notes on line level as well as wo in pcb.
 * 2			13 Jan 2023	      Harsha Bhakare    -           Changes to add starting operation on the custom record
 * 
 */
define(["N/currentRecord", "N/record", "N/search"],

    function (currentRecord, record, search) {
        // var record_id;

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
                log.debug("requestBody", requestBody)

              
                var panellot = requestBody.panellot;
                var woid = requestBody.woid;
                var notes = requestBody.notes;
                var startop= requestBody.startop;

                if (woid) {
                    log.debug("init work order id")
                    var mySearch = search.create({
                        type: "workorder",
                        filters:
                            [
                                ["type", "anyof", "WorkOrd"],
                                "AND",
                                ["mainline", "is", "T"],
                                "AND",
                                ["numbertext", "haskeywords", woid]
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

                        updatefield(internalid, notes)
                        log.debug("Successfully updated")
                        return true;
                    });

                }
               


                if (panellot) {
                  log.debug("init panellot id")
                    var panel = panellot;
                 
             
                        updatecustomfield(panellot, notes,startop)
                        log.debug("Successfully updated");
               
                   

                
            }
          
            }

            catch (error) {

                log.error("error", error)
            }
            return { isValid: true }

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
        function updatecustomfield(id, notes,startop) {
            
            var customrecord_cntm_pcb_lot_notesSearchObj = search.create({
                type: "customrecord_cntm_pcb_lot_notes",
                filters:
                [
                   ["custrecord_cntm_panel_lot","is",id]
                ],
                columns:
                [
                   search.createColumn({
                      name: "scriptid",
                      sort: search.Sort.ASC,
                      label: "Script ID"
                   }),
                   search.createColumn({name: "custrecord_cntm_lot_number_cust", label: "Lot number"}),
                   search.createColumn({name: "custrecord_cntm_pcb_lot_level_notes", label: "Client App Notes"}),
                   search.createColumn({name: "custrecord_cntm_wo_ref_notes_pcb", label: "WO reference"})
                ]
              
             });
             var searchResultCount = customrecord_cntm_pcb_lot_notesSearchObj.runPaged().count;
             log.debug("customrecord_cntm_pcb_lot_notesSearchObj result count",searchResultCount);
            //  log.debug("searchResultCount",searchResultCount)
             if(searchResultCount>0)
             {
                customrecord_cntm_pcb_lot_notesSearchObj.run().each(function(result){
                // record_id = result.getValue({name:"internalid"});
                // var record_id = 
                var id = record.submitFields({
                    type: 'customrecord_cntm_pcb_lot_notes',
                    id: result.id,
                    values: {
                        custrecord_cntm_pcb_lot_level_notes: notes,
                        custrecord_cntm_startop_notes_line:startop
                    },
                   
                });
   
                   return true;
                });
                // log.debug("record_id",record_id)
            }
            else
            {
                var customRecord = record.create({
                    type:'customrecord_cntm_pcb_lot_notes',
                    isDynamic: true
                });
                customRecord.setValue({
                    fieldId: 'custrecord_cntm_panel_lot',
                    value: id,
                    
                });
                customRecord.setValue({
                    fieldId: 'custrecord_cntm_pcb_lot_level_notes',
                    value: notes,
                    
                });
                customRecord.setValue({
                    fieldId: 'custrecord_cntm_startop_notes_line',
                    value: startop,
                    
                });
               var custrecid= customRecord.save();
               log.audit("Custom record id for notes",custrecid)
    
    
            }
          
         
    
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
            updatefield: updatefield
        };

    });
