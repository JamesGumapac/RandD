    /**
     * @NApiVersion 2.x
     * @NScriptType Restlet
     * @NModuleScope SameAccount
     */
    define(
        [ 'N/file', 'N/http', 'N/https', 'N/record', 'N/runtime', 'N/search',
                'N/url' ],

        function(file, http, https, record, runtime, search, url) {

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
                log.debug('requestParams', JSON.stringify(requestBody));
                var getwodetails = requestBody.getwodetails;
                var woid = requestBody.wo;
                log.debug("wo id :" + woid);
                if (getwodetails == 'true') {

                    // var recCount=getInprogressRecs(woid);
                    var customrecord_cntm_client_app_asm_SubSearchObj = search
                            .create({
                                type : "customrecord_cntm_client_app_asm_oper_s",
                                filters:
                                [
                                ["custrecordcntm_client_asm_status","anyof","3"], 
                                "AND", 
                                ["custrecordcntm_client_asm_wo_ref","anyof",woid]
                                ],
                                columns : [

                                search.createColumn({
                                    name : "internalid",
                                    label : "Id"
                                }) ]
                            });

                    var recCount = customrecord_cntm_client_app_asm_SubSearchObj
                            .runPaged().count;
                    log.debug("recCount in :" + recCount);
                    if (recCount > 0) {
                        return {
                            "success" : "false",
                            "datain" : "Previous completion is in progress.Please try after sometime."
                        };
                    }



                    try {
                        var customrecord_cntm_client_app_asm_operSearchObj = search.create({
                            type: "customrecord_cntm_client_app_asm_oper",
                            filters:
                                [
                                    ["custrecord_cntm_asm_wo_ref", "anyof", woid]
                                ],
                    
                        });
                        var searchResultCountcustrec = customrecord_cntm_client_app_asm_operSearchObj.runPaged().count;
                        log.debug("customrecord_cntm_client_app_asm_operSearchObj result count", searchResultCountcustrec);
                     
                    
                    
                         var workordercompletionSearchObj = search.create({
                             type: "workordercompletion",
                        	   filters:
                            [
                                ["type","anyof","WOCompl"], 
                                "AND", 
                                ["createdfrom","anyof",woid], 
                                "AND", 
                                ["mainline","is","T"]
                             ],
                           
                          });
                          var searchResultCountwoc = workordercompletionSearchObj.runPaged().count;
                         
                         log.debug("customrecord_cntm_client_app_asm_operSearchObj result count", searchResultCountwoc);
                    
                    
                        if (searchResultCountcustrec > 0 && searchResultCountwoc > 0) {
                           // if (searchResultCountcustrec > 0 ) {
                            return {
                                "success": "false",
                                "datain": "This work order is already being processed in Client App Version 1.Please proceed further there"
                            };
                    
                        }
                    
                    }
                    catch (error) {
                        log.debug("Error in finding previous version records", error)
                    }
                    
                    // var woInfo=getWoInfo(woid);

                    var woinfo = {};
                    var woArr = [];
                    var woObj = record.load({
                        type : record.Type.WORK_ORDER,
                        id : woid
                    });
                    var tranid = woObj.getValue("tranid");
                    var itemname = woObj.getText("assemblyitem");
                    var itemid = woObj.getValue("assemblyitem");
                    var priority = woObj.getValue("custbody_rda_wo_priorty");
                    var endCustomer = woObj
                            .getValue("custbody_rda_transbody_end_customer");
                    var endCustName = woObj
                            .getText("custbody_rda_transbody_end_customer");
                    var customer = woObj.getValue("entity");
                    var customername = woObj.getText("entity");
                    var customerPartNum = woObj
                            .getValue("custbody_cntm_cust_part_no");
                    var woQty = woObj.getValue("quantity");

                    var dueDate = woObj
                            .getText("custbody_rda_wo_sched_due_date");
                    var status = woObj.getValue("status");
                    var statusText = woObj.getText("status");
                    var dateCreated = woObj.getText("trandate");
                    var totalScrapQty = woObj.getText("scrapquantity");
                    var jobNo = woObj.getValue("job");
                    var jobNoText = woObj.getText("job");
                    var noOfPanel = woObj.getValue("custbody_cntm_no_of_panel");
                    var priority = woObj.getValue("custbody_rda_wo_priorty");
                    log.audit("dueDate :" + dueDate);
                    var operatorName = woObj.getText("custbody_cntm_wo_created_by");
                    var manufacturingrouting = woObj.getValue("manufacturingrouting");
                    var notes= woObj.getValue("custbody_cntm_notes_field")


                    woinfo.customer = customer;
                    woinfo.customerText = customername;
                    woinfo.assPartNO = itemid;
                    woinfo.assPartNOText = itemname;
                    woinfo.endCust = endCustName;
                    woinfo.woText = tranid;
                    woinfo.custPartNo = customerPartNum;
                    woinfo.dateCreated = dateCreated;
                    woinfo.woQty = woQty;
                    woinfo.woDueDate = dueDate;
                    woinfo.totalScrapQty = totalScrapQty;
                    woinfo.priority = priority;
                    // mainjson.totalQGood = totalQGood;
                    // mainjson.totalLotQ = totalLotQ;
                    woinfo.jobNo = jobNo;
                    woinfo.jobNoText = jobNoText;
                    // mainjson.opId = opId;
                    woinfo.opIdText = operatorName;
                    woinfo.noOfPanel = noOfPanel;
                    // mainjson.headerID = headerID;

                    // mainjson.wocCheck = wocCheck;
                    // mainjson.wocId = wocId;
                    // mainjson.wocIdText = wocIdText;
                    // mainjson.wocQTy = wocQTy;
                    woinfo.status = status;
                    woinfo.statusText = statusText;
                    woinfo.notes = notes;

                    // mainjson.scrapReason = scrapReason;
                    // mainjson.scrapQty = scrapQty;
                    // mainjson.scrapCumQty = scrapCumQty;
                    // mainjson.qtyGood = qtyGood;
                    // mainjson.panelLot = panelLot;
                    // mainjson.operation = operation;
                    // mainjson.mcSetup = mcSetup;
                    // mainjson.mcRuntime = mcRuntime;
                    // mainjson.laborSetuptime = laborSetuptime;
                    // mainjson.laborRuntime = laborRuntime;
                    // mainjson.sublistID = sublistID;
                    // mainjson.sequenceNo = sequenceNo;
                    // mainjson.lotRecID = lotRecID;

                    log.debug("status :" + status, "statusText :" + statusText);
                    var totalScrap = 0;
                    var firstOp = "";
                    var lastOp = "";
                    var opSeqArr = [];

                    var totalScrap = getTotalScrap(woid);
                    log.debug('status',status);
                    if (status == "In Process") {

                        var customrecord_cntm_client_app_asm_oper_sSearchObj = search.create({
                            type: "customrecord_cntm_client_app_asm_oper_s",
                            filters:
                            [
                            ["custrecordcntm_client_asm_wo_ref","anyof",woid]
                            ],
                            columns:
                            [
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC,
                                label: "Name"
                            }),
                            search.createColumn({name: "internalid", label: "Internal ID"}),
                            search.createColumn({name: "custrecord_cntm_client_asm_serial_no", label: "Serial ID"}),
                            search.createColumn({name: "custrecordcntm_client_asm_priority", label: "Priority"}),
                            search.createColumn({name: "custrecordcntm_client_asm_status", label: "Status"}),
                            search.createColumn({name: "custrecordcntm_client_asm_wo_ref", label: "WO Reference"}),
                            search.createColumn({name: "custrecordcntm_client_asm_laborsetuptime", label: "labor Setup Time"}),
                            search.createColumn({name: "custrecord_cnmt_asm_laborruntime", label: "labor run time"}),
                            search.createColumn({name: "custrecordcntm_client_asm_operator", label: "Operator"}),
                            search.createColumn({name: "custrecordcntm_client_asm_last_comp_op", label: "Last Completed OP "}),
                            search.createColumn({name: "custrecordcntm_client_asm_last_op", label: "Last Operation"}),
                            search.createColumn({name: "custrecordcntm_client_asm_is_scrapped", label: "Is Scrapped"}),
                            search.createColumn({name: "custrecord_cntm_client_asm_nextop", label: "Next Operation"}),
                            search.createColumn({name: "custrecord_cntm_client_asm_sequence", label: "Last Completed Sequence "}),
                            search.createColumn({name: "custrecordcntm_client_asm_lst_comp_op", label: "Operator Last Completed"}),
                            search.createColumn({name: "custrecord_cntm_client_asm_is_comp", label: "Is Completed"}),
                            search.createColumn({name: "custrecord_cntm_client_app_v2_notes", label: "Notes"})
                            ]
                        });
                        var searchResultCount = customrecord_cntm_client_app_asm_oper_sSearchObj.runPaged().count;
                        log.debug("customrecord_cntm_client_app_asm_oper_sSearchObj result count",searchResultCount);
                        
                        

                        if(searchResultCount == 0){
                            woinfo.msg = 'Please create serial IDs'
                            return {
                                "success" : "false",
                                "datain" : woinfo
                            };
                        }else{
                            customrecord_cntm_client_app_asm_oper_sSearchObj.run().each(function(result){
                                var inner_op_map = {};
                                inner_op_map.id = result.getValue(search.createColumn({name: "internalid", label: "Internal ID"}))
                                inner_op_map.serial_no = result.getValue(search.createColumn({name: "custrecord_cntm_client_asm_serial_no", label: "Serial ID"}))
                                inner_op_map.priority = result.getValue(search.createColumn({name: "custrecordcntm_client_asm_priority", label: "Priority"}))
                                inner_op_map.status = result.getValue(search.createColumn({name: "custrecordcntm_client_asm_status", label: "Status"}))
                                inner_op_map.wo_ref = result.getValue(search.createColumn({name: "custrecordcntm_client_asm_wo_ref", label: "WO Reference"}))
                                inner_op_map.laborsetuptime = result.getValue(search.createColumn({name: "custrecordcntm_client_asm_laborsetuptime", label: "labor Setup Time"}))
                                inner_op_map.laborruntime = result.getValue(search.createColumn({name: "custrecord_cnmt_asm_laborruntime", label: "labor run time"}))
                                inner_op_map.operator = result.getText(search.createColumn({name: "custrecordcntm_client_asm_operator", label: "Operator"}))
                                inner_op_map.operation =   result.getValue(search.createColumn({name: "custrecord_cntm_client_asm_nextop", label: "Next Operation"}))
                                inner_op_map.operationtext =  result.getValue(  search.createColumn({name: "custrecord_cntm_client_asm_nextop", label: "Next Operation"}))
                                inner_op_map.last_op = result.getValue(search.createColumn({name: "custrecordcntm_client_asm_last_op", label: "Last Operation"})),
                                inner_op_map.is_scrapped = result.getValue(search.createColumn({name: "custrecordcntm_client_asm_is_scrapped", label: "Is Scrapped"}))

                                inner_op_map.last_comp_operator = result.getText(search.createColumn({name: "custrecordcntm_client_asm_lst_comp_op", label: "Operator Last Completed"}))
                                inner_op_map.is_completed = result.getValue(search.createColumn({name: "custrecord_cntm_client_asm_is_comp", label: "Is Completed"}))
                                inner_op_map.last_comp_operation = result.getValue(search.createColumn({name: "custrecordcntm_client_asm_last_comp_op", label: "Last Completed OP "}))

                                inner_op_map. opDetails= getOperationsFormRouting(manufacturingrouting, inner_op_map.operation  )
                                inner_op_map.next_op =  result.getValue(  search.createColumn({name: "custrecord_cntm_client_asm_nextop", label: "Next Operation"}))
                                inner_op_map.woc_qty = woQty,
                                inner_op_map.scrap_qty = 0,
                                inner_op_map.machineruntime = '',
                                inner_op_map.machinesetuptime = '',
                                inner_op_map.isLastOp = '',
                                inner_op_map.isFirst = '',
                                inner_op_map.remainingQty = '',
                                inner_op_map.nextOp = '',
                                inner_op_map.scrapForNext = '',
                                inner_op_map.issingleop = '',
                                inner_op_map.comp_qty = '',
                                inner_op_map.scrap_reason = getScrapInfo(woid, inner_op_map.serial_no),
                                inner_op_map.notes= result.getValue(search.createColumn({name: "custrecord_cntm_client_app_v2_notes", label: "Notes"}))
                                opSeqArr.push(inner_op_map)
                                return true;
                            });
                        }


    /*
                        var operationRecSearch = search
                                .create({
                                    type : "customrecord_cntm_asm_client_app_v2",
                                    filters : [
                                            [ "custrecord_cntm_asm_wo_ref_v2",
                                                    "is", woid ]
                                    ],
                                    columns : [
                                            search
                                                    .createColumn({
                                                        name : "custrecord_cntm_asm_wo_ref",
                                                        label : "WO Num"
                                                    }),
                                            search
                                                    .createColumn({
                                                        name : "custrecord_cntm_completed_qty",
                                                        label : "WOC qty"
                                                    }),
                                            search
                                                    .createColumn({
                                                        name : "custrecord_cntm_asm_scrap_qty",
                                                        label : "Scrap Qty"
                                                    }),

                                            search
                                                    .createColumn({
                                                        name : "custrecord_cntm_asm_machinesetuptime",
                                                        label : "Machine Setup time"
                                                    }),
                                            search
                                                    .createColumn({
                                                        name : "custrecord_cntm_asm_machineruntime",
                                                        label : "Machine Run time"
                                                    }),
                                            search
                                                    .createColumn({
                                                        name : "custrecord_cnmt_asm_laborsetuptime",
                                                        label : "Labor Setup time"
                                                    }),
                                            search
                                                    .createColumn({
                                                        name : "custrecord_cntm_asm_laborruntime",
                                                        label : "Labor Run time"
                                                    }),
                                            search
                                                    .createColumn({
                                                        name : "custrecord_cntm_asm_is_lastop",
                                                        label : "Is last Op"
                                                    }),
                                            search
                                                    .createColumn({
                                                        name : "custrecord_cntm_asm_operation",
                                                        label : "Operation"
                                                    }),
                                            search
                                                    .createColumn({
                                                        name : "custrecord_cntm_is_first_op",
                                                        label : "First Operation"
                                                    }),
                                            search.createColumn({
                                                name : "internalid",
                                                label : "Id"
                                            }),
                                            search
                                                    .createColumn({
                                                        name : "custrecord_cntm_asm_op_text",
                                                        label : "Operation name"
                                                    }),
                                            search
                                                    .createColumn({
                                                        name : "custrecord_cntm_remaining_qty",
                                                        label : "Remaining Qty"
                                                    }),
                                            search
                                                    .createColumn({
                                                        name : "custrecord_cntm_completed_qty",
                                                        label : "Completed Qty"
                                                    }),
                                            search
                                                    .createColumn({
                                                        name : "custrecord_cntm_next_op",
                                                        label : "Next Op"
                                                    }),
                                            search
                                                    .createColumn({
                                                        name : "custrecord_cntm_next_op_next",
                                                        label : "Next Op"
                                                    }),
                                            search
                                                    .createColumn({
                                                        name : "custrecord_cntm_asm_cumm_scrap",
                                                        label : "Cumm scrap"
                                                    }),
                                            search
                                                    .createColumn({
                                                        name : "custrecord_cntm_scrap_fr_next_op",
                                                        label : "Scrap For Next"
                                                    }),
                                            search
                                                    .createColumn({
                                                        name : "custrecord_cntm_is_single_op",
                                                        label : "Is single Op"
                                                    })

                                    ]
                                });
                        var searchResultCount = operationRecSearch.runPaged().count;
                        log.debug("searchResultCount  operation result count",
                                searchResultCount);

                        operationRecSearch
                                .run()
                                .each(
                                        function(result) {
                                            var inner_op_map = {};
                                            var woc_qty = result
                                                    .getValue("custrecord_cntm_asm_woc_qty_v2");
                                            var scrap_qty = result
                                                    .getValue("custrecord_cntm_asm_scrap_qty");
                                            var cumm_scrap = result
                                                    .getValue("custrecord_cntm_asm_cumm_scrap");
                                            // totalScrap=totalScrap+cumm_scrap;
                                            var machineruntime = result
                                                    .getValue("custrecord_cntm_asm_machineruntime");
                                            var machinesetuptime = result
                                                    .getValue("custrecord_cntm_asm_machinesetuptime");
                                            var laborruntime = result
                                                    .getValue("custrecord_cntm_asm_laborruntime");
                                            var laborsetuptime = result
                                                    .getValue("custrecord_cnmt_asm_laborsetuptime");
                                            var isLastOp = result
                                                    .getValue("custrecord_cntm_asm_is_lastop");
                                            var operation = result
                                                    .getValue("custrecord_cntm_asm_operation");
                                            var isFirst = result
                                                    .getValue("custrecord_cntm_is_first_op");
                                            var id = result
                                                    .getValue("internalid");
                                            var operationText = result
                                                    .getValue("custrecord_cntm_asm_op_text");
                                            var remainingQty = result
                                                    .getValue("custrecord_cntm_remaining_qty");
                                            var nextOp = result
                                                    .getValue("custrecord_cntm_next_op_next");
                                            var comp_qty = result
                                                    .getValue("custrecord_cntm_completed_qty");
                                            var scrapForNext = result
                                                    .getValue("custrecord_cntm_scrap_fr_next_op");
                                            var isSingleOp = result
                                                    .getValue("custrecord_cntm_is_single_op");
                                            var serialId = result
                                                    .getValue("custrecord_cntm_client_app_asm_serial_v2");
                                            if (isFirst == true) {
                                                firstOp = operation;
                                            }
                                            log.audit("isLastOp :" + isLastOp,
                                                    "operation :" + operation);
                                            if (isLastOp == true) {
                                                lastOp = operation;
                                            }

                                            inner_op_map.woc_qty = woc_qty;
                                            inner_op_map.scrap_qty = 0;
                                            inner_op_map.machineruntime = machineruntime;
                                            inner_op_map.machinesetuptime = machinesetuptime;
                                        log.debug("laborruntime",laborruntime)
                                            inner_op_map.laborruntime = 0;
                                            inner_op_map.laborsetuptime = laborsetuptime;
                                            inner_op_map.isLastOp = isLastOp;
                                            inner_op_map.operation = operation;
                                            inner_op_map.operationtext = operationText;
                                            inner_op_map.id = id;
                                            inner_op_map.isFirst = isFirst;
                                            inner_op_map.remainingQty = remainingQty;
                                            inner_op_map.nextOp = nextOp;
                                            inner_op_map.scrapForNext = scrapForNext;
                                            inner_op_map.issingleop = isSingleOp;
                                            inner_op_map.serialId = serialId;
                                            if (comp_qty) {
                                                inner_op_map.comp_qty = comp_qty;
                                            } else {
                                                inner_op_map.comp_qty = 0;
                                            }
                                            // inner_op_map.comp_qty=comp_qty;
                                            inner_op_map.cum_scr_Qty = scrap_qty;
                                            var opDetails = getOperationsFormRouting(
                                                    woid, operation);
                                            inner_op_map.opDetails = opDetails;
                                            opSeqArr.push(inner_op_map);
                                            return true;
                                        });

                                        */
                    } else {
                        return {
                            "success" : "false",
                            "datain" : "Previous completion is in progress.Please try after sometime."
                        };
                    }
                    log.debug ('opSeqArr', JSON.stringify(opSeqArr))
                    woinfo.operationlist = opSeqArr;
                    woinfo.totalScrap = totalScrap;
                    log.audit("lastOp :" + lastOp);
                    woinfo.firstoperation = firstOp;
                    woinfo.lastoperation = lastOp;

                    // ***********rework
                    // Reason**************************************************************
                    var reworkSearch = search.create({
                        type : "customlist_rda_asm_rework_codes",
                        filters : [ [ "isinactive", "is", "F" ], ],
                        columns : [ search.createColumn({
                            name : "name",
                            label : "Name"
                        }), search.createColumn({
                            name : "internalid",
                            label : "Id"
                        })

                        ]
                    });
                    var searchResultCount = reworkSearch.runPaged().count;
                    log.debug("searchResultCount result count",
                            searchResultCount);

                    var reworkArr = [];
                    reworkSearch.run().each(function(result) {
                        var inner_rework_map = {};
                        var name = result.getValue("name");
                        var id = result.getValue("internalid");
                        inner_rework_map.id = id;
                        inner_rework_map.name = name;

                        reworkArr.push(inner_rework_map);
                        return true;
                    });

                    woinfo.rework = reworkArr;

                    // ***********Scrap
                    // Reasons*********************************************************************
                    var scrapReasonSearch = search.create({
                        type : "customlist_cnt_scrap_reason",
                        filters : [ [ "isinactive", "is", "F" ], ],
                        columns : [ search.createColumn({
                            name : "name",
                            label : "Name"
                        }), search.createColumn({
                            name : "internalid",
                            label : "Id"
                        })

                        ]
                    });
                    var scrapReasonSearchtCount = scrapReasonSearch.runPaged().count;
                    log.debug("scrapReasonSearchCount result count",
                            scrapReasonSearchtCount);

                    var scrapReasonArr = [];
                    scrapReasonSearch.run().each(function(result) {
                        var inner_scrap_map = {};
                        var name = result.getValue("name");
                        var id = result.getValue("internalid");
                        inner_scrap_map.id = id;
                        inner_scrap_map.name = name;

                        scrapReasonArr.push(inner_scrap_map);
                        return true;
                    });

                    woinfo.scrapReason = scrapReasonArr;
                    // ***********serial
                    // numbers***************************************************************
                    var serailNumberSearch = search.create({
                        type : "customrecord_cntm_asm_serial_ids",
                        filters : [ [ "isinactive", "is", "F" ], "AND",
                                [ "custrecord_cntm_is_scrap", "is", "F" ],
                                "AND",
                                [ "custrecord_cntm_is_process", "is", "F" ],
                                "AND", [ "custrecord10", "is", woid ] ],
                        columns : [ search.createColumn({
                            name : "internalid",
                            label : "Id"
                        }), search.createColumn({
                            name : "custrecord9",
                            label : "SerailId"
                        }), search.createColumn({
                            name : "created",
                            label : "Created Date",
                            sort : search.Sort.DESC
                        })

                        ]
                    });
                    var serailNumberSearchCount = serailNumberSearch.runPaged().count;
                    log.debug("serailNumberSearchCount result count",
                            serailNumberSearchCount);

                    var serialNumArr = [];
                    serailNumberSearch.run().each(function(result) {
                        var inner_serail_map = {};
                        var name = result.getValue("custrecord9");
                        var id = result.getValue("internalid");
                        inner_serail_map.id = id;
                        inner_serail_map.number = name;

                        serialNumArr.push(inner_serail_map);
                        return true;
                    });

                    woinfo.serailnumber = serialNumArr;

                    // *******************get serial number
                    // count*****************************************************************
                    var serailNumberSearch2 = search.create({
                        type : "customrecord_cntm_asm_serial_ids",
                        filters : [
                        /*
                        * ["isinactive","is","F"], "AND",
                        * ["custrecord_cntm_is_scrap","is","F"], "AND",
                        * ["custrecord_cntm_is_process","is","F"], "AND",
                        */
                        [ "custrecord10", "is", woid ] ],
                        columns : [ search.createColumn({
                            name : "internalid",
                            label : "Id"
                        }), search.createColumn({
                            name : "custrecord9",
                            label : "SerailId"
                        })

                        ]
                    });
                    var serailNumberSearch2Count = serailNumberSearch2
                            .runPaged().count;
                    log.debug("total serail number for WO",
                            serailNumberSearch2Count);
                    if (serailNumberSearch2Count) {
                        woinfo.serailnumbercount = serailNumberSearch2Count;
                    } else {
                        woinfo.serailnumbercount = 0;
                    }

                    log.debug("wo info :", JSON.stringify(woinfo));
                    woArr.push(woinfo);
                    // return JSON.stringify(woinfo);

                    return {
                        "success" : "true",
                        "datain" : woArr
                    };
                }
                var woid = requestBody.wo;
                log.debug("wo id :" + woid);
                var serailNum = requestBody.serialNums;
                var completedQuan = requestBody.completedQuan;
                /*
                * var fieldLookUp = search.lookupFields({ type :
                * search.Type.WORK_ORDER, id : woid, columns : [
                * 'quantity','assemblyitem' ] }); var
                * woQuan=fieldLookUp.quantity; var
                * asmItem=fieldLookUp.assemblyitem;
                */
                var woObj = record.load({
                    type : record.Type.WORK_ORDER,
                    id : woid
                });
                var woQuan = woObj.getValue("quantity");
                var asmItem = woObj.getValue("assemblyitem");
                log.debug("completedQuan :" + completedQuan, "woQuan :"
                        + woQuan + "asmItem :" + asmItem);
                /*
                * if(completedQuan!=woQuan){ log.debug("WO Quan not equal to
                * completed quan"); return { "success" : "false", "datain" :
                * "WO quantity not equal to completed quantity." }; }else
                */// if(completedQuan<=woQuan){
                log.debug("create serail number records.");
                var duplicate = [];
                function checkPresent(serialid, custpage_wo_item) {
                    var customrecord_cntm_asm_serial_idsSearchObj = search
                            .create({
                                type : "customrecord_cntm_asm_serial_ids",
                                filters : [
                                        [ "custrecord_cntm_item_serial_id",
                                                "anyof", custpage_wo_item ],
                                        "AND", [ "name", "is", serialid ] ],
                                columns : [ search.createColumn({
                                    name : "name",
                                    sort : search.Sort.ASC,
                                    label : "Name"
                                }) ]
                            });
                    var searchResultCount = customrecord_cntm_asm_serial_idsSearchObj
                            .runPaged().count;
                    if (searchResultCount > 0)
                        return true;
                    else
                        return false;
                    // return searchResultCount
                }

                for (var int = 0; int < serailNum.length; int++) {

                    var serialId = serailNum[int];

                    serialId = serialId.replace(/ /g, "_");
                    if (checkPresent(serialId, asmItem)) {
                        duplicate.push(serialId)
                    }

                }
                if (duplicate.length > 0) {
                    log.debug("Ducpliate Serial ID Not Allowed ", duplicate);
                    return {
                        "success" : "false",
                        "datain" : "Ducpliate Serial ID Not Allowed : "
                                + duplicate
                    };
                } else {
                    var invNumMap = {};
                    for (var int = 0; int < serailNum.length; int++) {
                        var serialId = serailNum[int];
                        serialId = serialId.replace(/ /g, "_");

                        var serialIdRec = record.create({
                            type : 'customrecord_cntm_asm_serial_ids',
                            isDynamic : true
                        });
                        serialIdRec.setValue({
                            fieldId : 'name',
                            value : serialId
                        });
                        serialIdRec.setValue({
                            fieldId : 'custrecord10',
                            value : woid
                        });
                        serialIdRec.setValue({
                            fieldId : 'custrecord9',
                            value : serialId
                        });
                        serialIdRec.setValue({
                            fieldId : 'custrecord_cntm_item_serial_id',
                            value : asmItem
                        });
                        var invNumId = serialIdRec.save();
                        invNumMap[invNumId] = serialId;
                    }
                    return {
                        "success" : "true",
                        "datain" : invNumMap
                    };
                }

                // }

            }
            function manufacturingRoutingOp(woId, startingOp) {
                try {
                    var manufacturingroutingList = [];

                    var woLookup = search.lookupFields({
                        type : 'workorder',
                        id : woId,
                        columns : [ 'manufacturingrouting' ],
                    });
                    var manufacturingrouting = woLookup.manufacturingrouting[0].value;
                    log.debug(manufacturingrouting)

                    var customrecord_cntm_client_app_asm_operSearchObj = search
                            .create({
                                type : "customrecord_cntm_client_app_asm_oper",
                                filters : [ [ "custrecord_cntm_asm_wo_ref",
                                        "anyof", woId ] ],
                                columns : [ search.createColumn({
                                    name : "custrecord_cntm_asm_wo_ref",
                                    label : "WO reference"
                                }), search.createColumn({
                                    name : "custrecord_cntm_asm_is_lastop",
                                    label : "Last Operation"
                                }), search.createColumn({
                                    name : "custrecord_cntm_asm_operation",
                                    label : "Operation"
                                }), search.createColumn({
                                    name : "custrecord_cntm_is_first_op",
                                    label : "Is First Operation"
                                }), search.createColumn({
                                    name : "custrecord_cntm_asm_op_text",
                                    label : "Operation num and Text"
                                }) ]
                            });
                    var searchResultCount = customrecord_cntm_client_app_asm_operSearchObj
                            .runPaged().count;
                    log
                            .debug(
                                    "customrecord_cntm_client_app_asm_operSearchObj result count",
                                    searchResultCount);

                    customrecord_cntm_client_app_asm_operSearchObj
                            .run()
                            .each(
                                    function(result) {
                                        var obj = {
                                            name : '',
                                            sequence : '',
                                            isLastOp : ''
                                        };

                                        var name = result
                                                .getValue(search
                                                        .createColumn({
                                                            name : "custrecord_cntm_asm_op_text",
                                                            label : "Operation num and Text"
                                                        }));
                                        var sequence = result
                                                .getValue(search
                                                        .createColumn({
                                                            name : "custrecord_cntm_asm_operation",
                                                            label : "Operation"
                                                        }));
                                        var lastOp = result
                                                .getValue(search
                                                        .createColumn({
                                                            name : "custrecord_cntm_asm_is_lastop",
                                                            label : "Last Operation"
                                                        }));

                                        obj.name = name;
                                        obj.sequence = parseInt(sequence)*1;
                                        obj.isLastOp = lastOp;

                                        if (parseInt(sequence) >= parseInt(startingOp)) {
                                            manufacturingroutingList.push(obj);
                                        } else {
                                            log
                                                    .debug('ELSE sequence',
                                                            sequence);
                                        }
                                        return true;
                                    });

                    if (manufacturingroutingList.length > 0) {
                        return manufacturingroutingList;
                    } else {
                        return null;
                    }
                } catch (error) {
                    log.error('ERROR manufacturingRoutingOp', error);
                }
            }


            function getOperationsFormRouting(manufacturingrouting,startingOp) {

                log.debug('startingOp',startingOp)
                startingOp = startingOp.split(' ')[0];
                log.debug('startingOp seq',startingOp)
                // log.debug('woId',woId)
                var RoutingSeqlist = [];
                try {
                    
                    // var woLookup = search.lookupFields({
                    //     type : 'workorder',
                    //     id : woId,
                    //     columns : [ 'manufacturingrouting' ],
                    // });
                    // var manufacturingrouting = woLookup.manufacturingrouting[0].value;
                    log.debug('manufacturingrouting',manufacturingrouting)

                    var manufacturingroutingSearchObj = search.create({
                        type: "manufacturingrouting",
                        filters:
                        [
                        ["internalid","anyof",manufacturingrouting]
                        ],
                        columns:
                        [
                        search.createColumn({name: "sequence",sort: search.Sort.ASC,label: "Operation Sequence"}),
                        search.createColumn({name: "operationname", label: "Operation Name"}),
                        search.createColumn({name: "setuptime", label: "Setup Time"}),
                        search.createColumn({name: "runrate", label: "Run Rate"})
                        ]
                    });
                    var searchResultCount = manufacturingroutingSearchObj.runPaged().count;
                    log.debug("manufacturingroutingSearchObj result count",searchResultCount);
                    
                    manufacturingroutingSearchObj.run().each(function(result){
                        
                        var temp = {
                        sequence : result.getValue(search.createColumn({name: "sequence",sort: search.Sort.ASC,label: "Operation Sequence"})),
                        name : ""+ result.getValue(search.createColumn({name: "sequence",sort: search.Sort.ASC,label: "Operation Sequence"}))  +' ' + result.getValue(search.createColumn({name: "operationname", label: "Operation Name"})),
                        laborsetuptime : result.getValue(search.createColumn({name: "setuptime", label: "Setup Time"})),
                        laborruntime : result.getValue(search.createColumn({name: "runrate", label: "Run Rate"})),
                        isLastOp : false
                        }
                        log.debug(parseFloat(temp.sequence), parseFloat(startingOp) )
                        if(parseFloat(temp.sequence) >= parseFloat(startingOp)){
                            log.debug('inif')
                            RoutingSeqlist.push(temp);
                        }else{
                            log.debug('in else')
                        }
                        return true;
                    });
                    if(RoutingSeqlist.length > 0){
                        return RoutingSeqlist
                    }else{
                        //Return Error
                        return null
                    }
                } catch (error) {
                    log.error('Error getOperationsFormRouting',error)
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
            function getScrapInfo(woid, serialid) {
                var reason = '';
                try {
    
    
                   
                    var customrecord_cntm_client_app_asm_oper_sSearchObj = search.create({
                        type: "customrecord_cntm_client_app_asm_oper_s",
                        filters:
                            [
                                ["custrecordcntm_client_asm_is_scrapped", "is", "T"],
                                "AND",
                                ["custrecordcntm_client_asm_wo_ref", "anyof", woid],
                                "AND",
                                ["custrecord_cntm_client_asm_serial_no","is",serialid],
                               "AND",
      ["custrecord_cntm_sublst_parentop.custrecord_cntm_sublst_scrapped","is","T"]
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
                        reason = result.getText(search.createColumn({
                            name: "custrecord_cntm_sublst_scrapinfo",
                            join: "CUSTRECORD_CNTM_SUBLST_PARENTOP",
                            label: "Scrap Info"
                        })
                                               
    
                        );
                       log.audit("scrap reason",reason)
                        var scrapid = result.getValue(search.createColumn({
                            name: "custrecord_cntm_sublst_scrapinfo",
                            join: "CUSTRECORD_CNTM_SUBLST_PARENTOP",
                            label: "Scrap Info"
                        })
    
                        );
                        var ser = result.getValue(search.createColumn({ name: "custrecord_cntm_client_asm_serial_no", label: "Serial ID" })
    
                        );
    
                    
    
                     
                        return true;
                    });
    
                
    
    
                    if (reason) {
                        log.debug("reason",reason)
                        return reason;
                    } else {
                        return null;
                    }
    
    
    
                }
                catch (error) {
                    log.error("error occurred", error)
                }
    
    
            }
            // function getScrapInfo(woid, serialid) {
            //     try {
    
    
            //         var reason;
            //         var customrecord_cntm_client_app_asm_oper_sSearchObj = search.create({
            //             type: "customrecord_cntm_client_app_asm_oper_s",
            //             filters:
            //                 [
            //                     ["custrecordcntm_client_asm_is_scrapped", "is", "T"],
            //                     "AND",
            //                     ["custrecordcntm_client_asm_wo_ref", "anyof", woid],
            //                     //    "AND", 
            //                     //    ["custrecordcntm_client_asm_wo_ref","anyof",serialid]
            //                 ],
            //             columns:
            //                 [
            //                     search.createColumn({ name: "custrecordcntm_client_asm_wo_ref", label: "WO Reference" }),
            //                     search.createColumn({ name: "custrecord_cntm_client_asm_serial_no", label: "Serial ID" }),
            //                     search.createColumn({
            //                         name: "internalid",
            //                         join: "CUSTRECORD_CNTM_SUBLST_PARENTOP",
            //                         label: "Internal ID"
            //                     }),
            //                     search.createColumn({
            //                         name: "custrecord_cntm_sublst_scrapinfo",
            //                         join: "CUSTRECORD_CNTM_SUBLST_PARENTOP",
            //                         label: "Scrap Info"
            //                     }),
            //                     search.createColumn({
            //                         name: "custrecord_cntm_sublst_parentop",
            //                         join: "CUSTRECORD_CNTM_SUBLST_PARENTOP",
            //                         label: "Parent Operation"
            //                     }),
    
            //                 ]
            //         });
               
            //         customrecord_cntm_client_app_asm_oper_sSearchObj.run().each(function (result) {
    
            //             var sublistid = result.getValue(search.createColumn({
            //                 name: "internalid",
            //                 join: "CUSTRECORD_CNTM_SUBLST_PARENTOP",
            //                 label: "Internal ID"
            //             })
    
            //             );
            //             var scraptext = result.getText(search.createColumn({
            //                 name: "custrecord_cntm_sublst_scrapinfo",
            //                 join: "CUSTRECORD_CNTM_SUBLST_PARENTOP",
            //                 label: "Scrap Info"
            //             })
    
            //             );
            //             var scrapid = result.getValue(search.createColumn({
            //                 name: "custrecord_cntm_sublst_scrapinfo",
            //                 join: "CUSTRECORD_CNTM_SUBLST_PARENTOP",
            //                 label: "Scrap Info"
            //             })
    
            //             );
            //             var ser = result.getValue(search.createColumn({ name: "custrecord_cntm_client_asm_serial_no", label: "Serial ID" })
    
            //             );
    
            //             if (ser == serialid) {
    
            //                 reason = scraptext;
            //                 // log.debug("reason",reason)
            //             }
    
    
                     
            //             return true;
            //         });
    
                
    
    
            //         if (reason) {
            //             // log.debug("reason",reason)
            //             return reason;
            //         } else {
            //             return null;
            //         }
    
    
    
            //     }
            //     catch (error) {
            //         log.error("error occurred", error)
            //     }
    
    
            // }
            function getTotalScrap(woid) {

                var totalScrap = 0;
                var operationRecSearch = search.create({
                    type : "customrecord_cntm_asm_client_app",
                    filters : [ [ "custrecord_cntm_wo_reference", "is", woid ],

                    ],
                    columns : [ search.createColumn({
                        name : "custrecord_cntm_sublst_completed_qty",
                        label : "Completed Qty"
                    }), search.createColumn({
                        name : "custrecord_cntm_sublst_parent_op",
                        label : "Parent Op"
                    }), search.createColumn({
                        name : "custrecord_cntm_sublst_scrapqty",
                        label : "Scrap Qty"
                    }),

                    ]
                });
                var searchResultCount = operationRecSearch.runPaged().count;
                log.debug("searchResultCount result count for total scrap",
                        searchResultCount);

                operationRecSearch
                        .run()
                        .each(
                                function(result) {

                                    var cumm_scrap = result
                                            .getValue("custrecord_cntm_sublst_scrapqty");
                                    totalScrap = (totalScrap * 1)
                                            + (cumm_scrap * 1);

                                    return true;
                                });
                log.debug("totalScrap :" + totalScrap);
                return totalScrap;

                /*
                * var totalScrap=0; var operationRecSearch = search.create({
                * type: "customrecord_cntm_client_app_asm_oper", filters: [
                * ["custrecord_cntm_asm_wo_ref","is",woid],
                *  ], columns: [ search.createColumn({name:
                * "custrecord_cntm_asm_wo_ref", label: "WO Num"}),
                * search.createColumn({name: "custrecord_cntm_completed_qty",
                * label: "WOC qty"}), search.createColumn({name:
                * "custrecord_cntm_asm_scrap_qty", label: "Scrap Qty"}),
                * 
                * 
                * search.createColumn({name:
                * "custrecord_cntm_asm_machinesetuptime", label: "Machine Setup
                * time"}), search.createColumn({name:
                * "custrecord_cntm_asm_machineruntime", label: "Machine Run
                * time"}), search.createColumn({name:
                * "custrecord_cnmt_asm_laborsetuptime", label: "Labor Setup
                * time"}), search.createColumn({name:
                * "custrecord_cntm_asm_laborruntime", label: "Labor Run
                * time"}), search.createColumn({name:
                * "custrecord_cntm_asm_is_lastop", label: "Is last Op"}),
                * search.createColumn({name: "custrecord_cntm_asm_operation",
                * label: "Operation"}), search.createColumn({name:
                * "custrecord_cntm_is_first_op", label: "First Operation"}),
                * search.createColumn({name: "internalid", label: "Id"}),
                * search.createColumn({name: "custrecord_cntm_asm_op_text",
                * label: "Operation name"}), search.createColumn({name:
                * "custrecord_cntm_remaining_qty", label: "Remaining Qty"}),
                * search.createColumn({name: "custrecord_cntm_completed_qty",
                * label: "Completed Qty"}), search.createColumn({name:
                * "custrecord_cntm_next_op", label: "Next Op"}),
                * search.createColumn({name: "custrecord_cntm_next_op_next",
                * label: "Next Op"}), search.createColumn({name:
                * "custrecord_cntm_asm_cumm_scrap", label: "Cumm scrap"})
                *  ] }); var searchResultCount =
                * operationRecSearch.runPaged().count;
                * log.debug("searchResultCount result count for total
                * scrap",searchResultCount);
                * 
                * operationRecSearch.run().each(function(result){
                * 
                * var
                * cumm_scrap=result.getValue("custrecord_cntm_asm_cumm_scrap");
                * totalScrap=(totalScrap*1)+(cumm_scrap*1);
                * 
                * return true; }); log.debug("totalScrap :"+totalScrap); return
                * totalScrap;
                */}

            function getInprogressRecs(woid) {
                /*
                * log.debug("getInprogressRecs"); var
                * customrecord_cntm_client_app_asm_SubSearchObj =
                * search.create({ type: "customrecord_cntm_asm_client_app",
                * filters: [ ["custrecord_cntm_sublst_status","is",3], "AND",
                * ["custrecord_cntm_wo_reference","is",woid]
                *  ], columns: [
                * 
                * search.createColumn({name: "custrecord_cntm_sublist_woc_qty",
                * label: "WOC quantity"}),
                * 
                * 
                * search.createColumn({name: "internalid", label: "Id"}) ] });
                * 
                * var searchResultCount =
                * customrecord_cntm_client_app_asm_SubSearchObj.runPaged().count;
                * log.debug("searchResultCount in :"+searchResultCount); return
                * searchResultCount;
                */
                log.debug("getInprogressRecs");
                var customrecord_cntm_client_app_asm_SubSearchObj = search
                        .create({
                            type : "customrecord_cntm_client_app_asm_oper",
                            filters : [
                                    [ "custrecord_cntm_asm_woc_status", "is", 3 ],
                                    "AND",
                                    [ "custrecord_cntm_asm_wo_ref", "is", woid ]

                            ],
                            columns : [

                            search.createColumn({
                                name : "internalid",
                                label : "Id"
                            }) ]
                        });

                var searchResultCount = customrecord_cntm_client_app_asm_SubSearchObj
                        .runPaged().count;
                log.debug("searchResultCount in :" + searchResultCount);
                return searchResultCount;
            }


            // function formatNumber(params) {
            //     return parseFloat(params.replace(/[,]/g,''));
            // }
            return {
                'get' : doGet,
                put : doPut,
                post : doPost,
                'delete' : doDelete

            };

        });
