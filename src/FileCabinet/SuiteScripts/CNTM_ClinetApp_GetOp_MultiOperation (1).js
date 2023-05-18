/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(
    ['N/file', 'N/http', 'N/https', 'N/record', 'N/runtime', 'N/search',
        'N/url', 'N/task'
    ],

    function (file, http, https, record, runtime, search, url, task) {

        /**
         * Function called upon sending a GET request to the RESTlet.
         * 
         * @param {Object}
         *            requestParams - Parameters from HTTP request URL;
         *            parameters will be passed into function as an Object
         *            (for all supported content types)
         * @returns {string | Object} HTTP response body; return string when
         *          request Content-Type is 'text/plain'; return Object when
         *          request Content-Type is 'application/json'
         * @since 2015.1
         */
        function doGet(requestParams) {

        }

        /**
         * Function called upon sending a PUT request to the RESTlet.
         * 
         * @param {string |
         *            Object} requestBody - The HTTP request body; request
         *            body will be passed into function as a string when
         *            request Content-Type is 'text/plain' or parsed into an
         *            Object when request Content-Type is 'application/json'
         *            (in which case the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; return string when
         *          request Content-Type is 'text/plain'; return Object when
         *          request Content-Type is 'application/json'
         * @since 2015.2
         */
        function doPut(requestBody) {

        }

        /**
         * Function called upon sending a POST request to the RESTlet.
         * 
         * @param {string |
         *            Object} requestBody - The HTTP request body; request
         *            body will be passed into function as a string when
         *            request Content-Type is 'text/plain' or parsed into an
         *            Object when request Content-Type is 'application/json'
         *            (in which case the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; return string when
         *          request Content-Type is 'text/plain'; return Object when
         *          request Content-Type is 'application/json'
         * @since 2015.2
         */
        function doPost(requestBody) {
            log.debug('GET REQUEST');
            log.debug('requestParams', JSON.stringify(requestBody));
            var getOpID = requestBody.getopid;
            var getOpIDtotal = requestBody.getOpIDtotal;
            if (getOpID == 'getop') {
                return {
                    "success": "true",
                    "datain": getOperatorDetails()
                };
            }
            if (getOpID == 'vaerifyserial') {
                return {
                    "success": true,
                    "datain": checkPresent(requestBody.serialNums,
                        requestBody.asmPartNo)
                };
                // checkPresent(requestBody.serialNums,
                // requestBody.asmPartNo)

            }
            if (getOpID == 'vaerifyworkorder') {
                log.debug('vaerifyworkorder', requestBody.woid);
                if (requestBody.woid) {

                    var innerworkorderSearchObj = search.create({
                        type: "workorder",
                        filters: [
                            ["type", "anyof", "WorkOrd"],
                            "AND", [["createdfrom", "anyof", requestBody.woid], "OR", [
                                "custbody_cntm_last_wo_id",
                                "anyof",
                                requestBody.woid
                            ]]
                        ],
                        columns: ["internalid", "tranid"]
                    });
                    var innersearchResultCount = innerworkorderSearchObj.runPaged().count;
                    log.debug("innerworkorderSearchObj result count", innersearchResultCount);
                    if (innersearchResultCount > 0) {
                        var workorderSearchObj = search.create({
                            type: "workorder",
                            filters: [
                                ["type", "anyof", "WorkOrd"],
                                "AND", ["mainline", "is", "T"],
                                "AND",

                                ["custbody_pcb_rec_id", "noneof",
                                    "@NONE@"
                                ],
                                "AND", ["internalid", "anyof",
                                    requestBody.woid
                                ]

                            ],
                            columns: [search.createColumn({
                                name: "tranid",
                                label: "Document Number"
                            }), search.createColumn({
                                name: "internalid",
                                label: "Internal ID"
                            }), search.createColumn({
                                name: "assembly",
                                label: "Assembly Item"
                            })]
                        });
                        var searchResultCountwoid = workorderSearchObj.runPaged().count;
                        log.debug("workorderSearchObj result count", searchResultCountwoid);

                        if (searchResultCountwoid > 0) {
                            // var wo=requestParams.wo;
                            var customrecord_cntm_clientappsublistSearchObj2 = search.create({
                                type: "customrecord_cntm_clientappsublist",
                                filters:
                                    [
                                        ["custrecord_cntm_work_order", "anyof", requestBody.woid],
                                        "AND",
                                        ["custrecord_cntm_cso_status", "noneof", "4"]
                                    ],
                                columns:
                                    [
                                        search.createColumn({ name: "displaynametranslated", label: "Display Name (Translated)" })
                                    ]
                            });
                            var searchResultCountCheck = customrecord_cntm_clientappsublistSearchObj2.runPaged().count;
                            log.debug("customrecord_cntm_clientappsublistSearchObj result count", searchResultCountCheck);
                            if (searchResultCountCheck > 0) {

                                var woFieldLookUp = search.lookupFields({
                                    type: 'workorder',
                                    id: requestBody.woid,
                                    columns: ['custbody_rda_wo_issue_okay']
                                });
                                log.debug("requestBody.woid " + requestBody.woid, "woFieldLookUp " + woFieldLookUp);
                                var isWoIssue = woFieldLookUp.custbody_rda_wo_issue_okay;
                                log.debug('isWoIssue', isWoIssue);

                                if (isWoIssue == true) {
                                    var headerRec;
                                    var customrecord_cntm_clientappsublistSearchObj = search.create({
                                        type: "customrecord_cntm_clientappsublist",
                                        filters: [
                                            [
                                                "custrecord_cntm_cso_status",
                                                "anyof", "4"
                                            ],
                                            "AND", [
                                                "custrecord_cntm_last_operation",
                                                "is", "T"
                                            ],
                                            "AND", [[
                                                "custrecord_cntm_work_order.createdfrom",
                                                "anyof",
                                                requestBody.woid
                                            ], "OR", [
                                                "custrecord_cntm_work_order.custbody_cntm_last_wo_id",
                                                "anyof",
                                                requestBody.woid
                                            ]],

                                            "AND", 
                                            ["custrecord_cntm_scrapped","is","F"]
                                            
                                            /*"AND", [
                                                "custrecord_cntm_cso_quantity_good",
                                                "isnot", "0.0"
                                            ],
                                            "AND", [
                                                "custrecord_cntm_cso_quantity_good",
                                                "isnot", "0"
                                            ],*/
                                            // "AND", [
                                            //     "custrecord_cntm_issue_created",
                                            //     "is", "F"
                                            // ],

                                            // "AND", [
                                            //     "custrecord_cntm_issue_in_process",
                                            //     "is", "F"
                                            // ]
                                        ],
                                        columns: [
                                            "custrecord_cntm_cso_pannellot",
                                            "custrecord_cntm_cso_quantity_good",
                                            "custrecord_cntm_lot_record",
                                            "custrecord_cntm_cso_parentrec",
                                            "custrecord_cntm_work_order",
                                            "custrecord_cntm_cso_woc_quantity",
                                            //search.createColumn({
                                            //    name: "item",
                                            //    join: "CUSTRECORD_CNTM_WORK_ORDER"
                                            //}),
                                            search.createColumn({
                                                name: "createdfrom",
                                                join: "CUSTRECORD_CNTM_WORK_ORDER"
                                            }),
                                            search.createColumn({ name: "custrecord_cntm_issue_in_process", label: "Issue In Process" }),
                                            search.createColumn({ name: "custrecord_cntm_issue_created", label: "WO Issue Created" }),
                                            search.createColumn({
                                                name: "custrecord_cntm_prev_lot_rec",
                                                join: "CUSTRECORD_CNTM_LOT_RECORD"
                                            })
                                        ]
                                    });
                                    var searchResultCount = customrecord_cntm_clientappsublistSearchObj.runPaged().count;
                                    log.debug("customrecord_cntm_clientappsublistSearchObj result count", searchResultCount);

                                    var mapdetails = [];
                                    // ***********rework Reason PCB **************************************************************
                                //     var reworkSearch = search.create({
                                //         type : "customlist_cntm_pcb_rework_codes",
                                //         filters : [ [ "isinactive", "is", "F" ], ],
                                //         columns : [ search.createColumn({
                                //             name : "name",
                                //             label : "Name"
                                //         }), search.createColumn({
                                //             name : "internalid",
                                //             label : "Id"
                                //         })
                                
                                //         ]
                                //     });
                                //     var searchResultCount = reworkSearch.runPaged().count;
                                //     log.debug("searchResultCount result count",
                                //             searchResultCount);
                                
                                //     var reworkArr = [];
                                //     reworkSearch.run().each(function(result) {
                                //         var inner_rework_map = {};
                                //         var name = result.getValue("name");
                                //         var id = result.getValue("internalid");
                                //         inner_rework_map.id = id;
                                //         inner_rework_map.name = name;
                                
                                //         reworkArr.push(inner_rework_map);
                                //         return true;
                                //     });
                                
                                //    mapdetails.push(reworkArr);

                                    if (searchResultCount > 0) {
                                        var map = {};
                                        var flagArray = [];
                                        customrecord_cntm_clientappsublistSearchObj.run().each(function (result) {
                                            var map = {};
                                            // .run().each has a
                                            // limit
                                            // of 4,000 results
                                            var lot_rec = result.getValue(({
                                                name: "custrecord_cntm_prev_lot_rec",
                                                join: "CUSTRECORD_CNTM_LOT_RECORD"
                                            }));
                                            log.debug('lot_rec :', lot_rec);

                                            headerRec = result.getValue({
                                                name: 'custrecord_cntm_cso_parentrec'
                                            });
                                            map.lot = result.getValue({
                                                name: 'custrecord_cntm_cso_pannellot'
                                            });
                                            map.goodQty = result.getValue({
                                                name: 'custrecord_cntm_cso_woc_quantity'//'custrecord_cntm_cso_quantity_good'
                                            });
                                            map.lotRec = result.getValue({
                                                name: 'custrecord_cntm_lot_record'
                                            });
                                            map.id = result.id;
                                            var WoId = result.getValue({
                                                name: "custrecord_cntm_work_order"
                                            });
                                            var woFieldLookUp1 = search.lookupFields({
                                                type: 'workorder',
                                                id: WoId,
                                                columns: ['item']
                                            });
                                            log.debug("woFieldLookUp1", woFieldLookUp1);
                                            map.item = woFieldLookUp1.item[0].value; //result.getValue({
                                            //    name: "item",
                                            //   join: "CUSTRECORD_CNTM_WORK_ORDER"
                                            //});

                                            var inProcess = result.getValue({ name: "custrecord_cntm_issue_in_process", label: "Issue In Process" });
                                            flagArray.push(inProcess);
                                            log.debug('inProcess :', inProcess);
                                            var issueCreated = result.getValue({ name: "custrecord_cntm_issue_created", label: "WO Issue Created" });
                                            log.debug('issueCreated :', issueCreated);
                                            if (!issueCreated) {
                                                mapdetails.push(map);
                                            }
                                            return true;
                                        });
                                        if (mapdetails.length <= 0) {

                                            return {
                                                "success": false,
                                                // "datain": "No Lot Has Been Completed for previous work order"
                                                "datain": "Issue is already been created for this Work Order"
                                            };
                                        } else {
                                            
	
   



                                            log.debug('mapdetails :', JSON.stringify(mapdetails));
                                            log.debug('flagArray :', JSON.stringify(flagArray));
                                            if (getOpIDtotal != 'createissues') {
                                                log.debug('createissues', getOpIDtotal);
                                                return mapdetails;
                                            }
                                            // if (mapdetails.length > 0) {
                                            //     return mapdetails;
                                            // } else {
                                            //     return { "success": "true", "datain": [] }
                                            // }
                                            else {

                                                log.debug('ELSE');
                                                if (myindexOf(flagArray, true) > -1) {
                                                    log.debug('1');
                                                    return {
                                                        "success": false,
                                                        "datain": "Previous work order issue is in progress please try after some time"
                                                    };
                                                } else {
                                                    log.debug('2');

                                                    try {
                                                        log.debug('inside map');
                                                        log.debug('done map');
                                                        var output = url.resolveScript({
                                                            scriptId: 'customscript_cntm_wo_issue_backend',
                                                            deploymentId: 'customdeploy_cntm_wo_issue_backend',
                                                            returnExternalUrl: true
                                                        });

                                                        var response = https.get({
                                                            url: output + '&wo=' + requestBody.woid + "&headerRec=" + headerRec + "&map=" + JSON.stringify(requestBody.detailmap)
                                                        })
                                                        return {
                                                            "success": true,
                                                            "datain": "Request Submitted Successfully"
                                                        };
                                                    } catch (e) {
                                                        log.debug(e);
                                                        return {
                                                            "success": false,
                                                            "datain": "something went wrong"

                                                        };
                                                    }
                                                } //end of else
                                            }
                                        }
                                    } else {
                                        return {
                                            "success": false,
                                            "datain": "No Lot Has Been Completed for previous work order"
                                        };
                                    }
                                } else {
                                    return {
                                        "success": false,
                                        "datain": "Work Order Issue could not be created for the selected Work Order. Please contact the admin to create it in NetSuite."
                                    };
                                }
                            } else {
                                return {
                                    "success": false,
                                    "datain": "No details found for selected Work Order."
                                };
                            }
                        } else {
                            return {
                                "success": false,
                                "datain": "Invalid Work Order"
                            };
                        }
                    } else {
                        return {
                            "success": false,
                            "datain": "No details found for selected WO."
                        };
                    }
                } else {
                    return {
                        "success": true,
                        "datain": verifywo(requestBody.woid)
                    };
                }
                // checkPresent(requestBody.serialNums,
                // requestBody.asmPartNo)

            }
            var verify = requestBody.verify;
            if (verify == 'verify') {
                var verifyOp = requestBody.verifyOp;
                var opPassword = requestBody.opPassword + "";
                // verifyOp(verifyOp,opPassword);

                var getverified = verifyOpDetails(verifyOp, opPassword);
                var response = false;
                log.debug('getverified', JSON.stringify(getverified));
                if (getverified.userpassD == opPassword)
                    response = true;

                return {
                    "success": response,
                    "datain": ""
                };

            }
            var getwot = requestBody.getwot;
            if (getwot == "getwot") {
                var woid = requestBody.woid;
                return {
                    "success": "true",
                    "datain": getwotdetails(woid)
                };
            }

            function verifywo(woid) {

                var workorderSearchObj = search.create({
                    type: "workorder",
                    filters: [
                        ["type", "anyof", "WorkOrd"], "AND", ["mainline", "is", "T"], "AND",

                        ["custbody_pcb_rec_id", "noneof", "@NONE@"],
                        "AND", ["internalid", "anyof", woid],
                        // "AND", ["status", "noneof", "WorkOrd:H"]

                    ],
                    columns: [search.createColumn({
                        name: "tranid",
                        label: "Document Number"
                    }), search.createColumn({
                        name: "internalid",
                        label: "Internal ID"
                    }), search.createColumn({
                        name: "assembly",
                        label: "Assembly Item"
                    })]
                });
                var searchResultCountwoid = workorderSearchObj.runPaged().count;
                log.debug("workorderSearchObj result count",
                    searchResultCountwoid);
                if (searchResultCountwoid > 0) {
                    var wo = requestParams.wo;
                    var customrecord_cntm_clientappsublistSearchObj = search
                        .create({
                            type: "customrecord_cntm_clientappsublist",
                            filters: [
                                ["custrecord_cntm_cso_status",
                                    "anyof", "4"
                                ],
                                "AND", ["custrecord_cntm_last_operation",
                                    "is", "T"
                                ],
                                "AND", [[
                                    "custrecord_cntm_work_order.createdfrom",
                                    "anyof", wo
                                ], "OR", ["custrecord_cntm_work_order.custbody_cntm_last_wo_id",
                                    "anyof", wo]]
                            ],
                            columns: [
                                "custrecord_cntm_cso_pannellot",
                                "custrecord_cntm_cso_quantity_good",
                                "custrecord_cntm_lot_record"
                            ]
                        });
                    var searchResultCount = customrecord_cntm_clientappsublistSearchObj
                        .runPaged().count;
                    log
                        .debug(
                            "customrecord_cntm_clientappsublistSearchObj result count",
                            searchResultCount);
                    if (searchResultCount > 0) {
                        var map = {};
                        customrecord_cntm_clientappsublistSearchObj
                            .run()
                            .each(
                                function (result) {
                                    // .run().each has a limit of
                                    // 4,000 results
                                    map.lot = result
                                        .getValue({
                                            name: 'custrecord_cntm_cso_pannellot'
                                        });
                                    map.goodQty = result
                                        .getValue({
                                            name: 'custrecord_cntm_cso_quantity_good'
                                        });
                                    map.lotRec = result
                                        .getValue({
                                            name: 'custrecord_cntm_lot_record'
                                        });
                                    map.id = result.id;
                                    return true;
                                });

                        return map;
                        // var scriptTask = task.create({
                        // taskType : task.TaskType.MAP_REDUCE
                        // });
                        // scriptTask.scriptId =
                        // 'customscript_cntm_mr_create_wo_issue';
                        // scriptTask.params = {
                        // custscript_cntm_wo_rec : wo,
                        // custscript_cntm_lots : map
                        // };
                        //
                        // var scriptTaskId = scriptTask.submit();
                        // var status =
                        // task.checkStatus(scriptTaskId).status;
                        // log.debug(scriptTaskId);
                    }
                } else {

                }
            }

            function checkPresent(serialid, custpage_wo_item) {
                log.debug('serialid', serialid);
                log.debug('custpage_wo_item', custpage_wo_item);
                var duplicatelist = [];
                for (var i = 0; i < serialid.length; i++) {
                    var customrecord_cntm_asm_serial_idsSearchObj = search
                        .create({
                            type: "customrecord_cntm_asm_serial_ids",
                            filters: [
                                ["custrecord_cntm_item_serial_id",
                                    "anyof", custpage_wo_item
                                ],
                                "AND", ["name", "is",
                                    serialid[i].serialId
                                ]
                            ],
                            columns: [search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC,
                                label: "Name"
                            })]
                        });
                    var searchResultCount = customrecord_cntm_asm_serial_idsSearchObj
                        .runPaged().count;
                    if (searchResultCount > 0)
                        duplicatelist.push(serialid[i].serialId)

                }

                return duplicatelist;

            }

            function getwotdetails(woid) {
                var output = url.resolveScript({
                    scriptId: 'customscript_cntm_print_wot',
                    deploymentId: 'customdeploy_cntm_print_wot',
                    returnExternalUrl: true
                });

                var response = https.get({
                    url: output + '&recId=' + woid + "&clientapp=Yes"
                })
                return response;
            }

            function getOperatorDetails() {
                var finaldata = [];
                var wodetails = {};
                var employeeSearchObj = search.create({
                    type: "employee",
                    filters: [
                        ["custentity_cntm_enabled_for_clientapp",
                            "is", "T"
                        ]
                    ],
                    columns: [search.createColumn({
                        name: "internalid",
                        label: "Internal ID"
                    }), search.createColumn({
                        name: "custentity_rda_woc_password",
                        label: "WOC Password"
                    }), search.createColumn({
                        name: "entityid",
                        sort: search.Sort.ASC,
                        label: "Name"
                    })]
                });
                var searchResultCount = employeeSearchObj.runPaged().count;
                log.debug("employeeSearchObj result count",
                    searchResultCount);
                var finaldataset = [];
                employeeSearchObj.run().each(function (result) {
                    // .run().each has a limit of 4,000 results

                    var jsondata = {};
                    var opId = result.getValue(search.createColumn({
                        name: "internalid",
                        label: "Internal ID"
                    }));
                    var opName = result.getValue(search.createColumn({
                        name: "entityid",
                        sort: search.Sort.ASC,
                        label: "Name"
                    }));

                    jsondata.opId = opId;
                    jsondata.opName = opName;
                    finaldataset.push(jsondata);

                    return true;
                });

                // var customrecord_cntm_op_detailsSearchObj =
                // search.create({
                // type: "customrecord_cntm_op_details",
                // filters:
                // [
                // ],
                // columns:
                // [
                // search.createColumn({
                // name: "name",
                // sort: search.Sort.ASC,
                // label: "Name"
                // }),
                // search.createColumn({name: "custrecord_cntm_op_id",
                // label: "Operator ID"})
                // ]
                // });
                // var searchResultCount =
                // customrecord_cntm_op_detailsSearchObj.runPaged().count;
                // log.debug("customrecord_cntm_op_detailsSearchObj result
                // count",searchResultCount);
                // var finaldataset=[];
                // customrecord_cntm_op_detailsSearchObj.run().each(function(result){
                // // .run().each has a limit of 4,000 results
                // var jsondata={};
                // var opId = result.getValue(search.createColumn({name:
                // "custrecord_cntm_op_id", label: "Operator ID"}));
                // var opName = result.getValue(search.createColumn({
                // name: "name",
                // sort: search.Sort.ASC,
                // label: "Name"
                // }));
                //	    			
                // jsondata.opId=opId;
                // jsondata.opName=opName;
                // finaldataset.push(jsondata);
                // return true;
                // });
                return finaldataset;
            }

            function verifyOpDetails(username, password) {
                log.debug("passworduser", username);
                log.debug("password", password);

                var employeeSearchObj = search.create({
                    type: "employee",
                    filters: [
                        ["internalid", "anyof", username]
                    ],
                    columns: [search.createColumn({
                        name: "internalid",
                        label: "Internal ID"
                    }), search.createColumn({
                        name: "custentity_rda_woc_password",
                        label: "WOC Password"
                    }), search.createColumn({
                        name: "entityid",
                        sort: search.Sort.ASC,
                        label: "Name"
                    })]
                });
                var searchResultCount = employeeSearchObj.runPaged().count;
                log.debug("employeeSearchObj result count",
                    searchResultCount);
                var userpass = {};
                employeeSearchObj
                    .run()
                    .each(
                        function (result) {
                            // .run().each has a limit of 4,000
                            // results

                            var userpassDetails = result.getValue(search.createColumn({
                                name: "custentity_rda_woc_password",
                                label: "WOC Password"
                            }));
                            log.debug("userpassinside", userpass);
                            userpass.userpassD = userpassDetails
                            return true;

                        });

                // var customrecord_cntm_op_detailsSearchObj =
                // search.create({
                // type: "customrecord_cntm_op_details",
                // filters:
                // [
                // ["custrecord_cntm_op_id","equalto",username]
                // ],
                // columns:
                // [
                // search.createColumn({name: "custrecord_cntm_password",
                // label: "Validation Key (Password)"})
                // ]
                // });
                // // var searchResultCount =
                // customrecord_cntm_op_detailsSearchObj.runPaged().count;
                // //log.debug("customrecord_cntm_op_detailsSearchObj result
                // count",searchResultCount);
                // var userpass ={};
                // customrecord_cntm_op_detailsSearchObj.run().each(function(result){
                // // .run().each has a limit of 4,000 results
                // var userpassDetails =
                // result.getValue(search.createColumn({name:
                // "custrecord_cntm_password", label: "Validation Key
                // (Password)"}));
                // log.debug("userpassinside",userpass);
                // userpass.userpassD=userpassDetails
                // return true;
                // });
                log.debug("userpass", userpass);
                log.debug("password", password);
                return userpass;
            }

            function myindexOf(array, string) {
                var i = 0;
                while (i < array.length) {
                    if (array[i] == string) {
                        return i
                    }
                    i++
                }
                return -1;
            }
        }

        /**
         * Function called upon sending a DELETE request to the RESTlet.
         * 
         * @param {Object}
         *            requestParams - Parameters from HTTP request URL;
         *            parameters will be passed into function as an Object
         *            (for all supported content types)
         * @returns {string | Object} HTTP response body; return string when
         *          request Content-Type is 'text/plain'; return Object when
         *          request Content-Type is 'application/json'
         * @since 2015.2
         */
        function doDelete(requestParams) {

        }

        return {
            'get': doGet,
            put: doPut,
            post: doPost,
            'delete': doDelete
        };

    });