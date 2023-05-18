/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
//ORIGINAL
define(
    [ "N/record", "N/search", "N/transaction", "N/ui/serverWidget",
        "N/xml", "N/runtime", "N/task", "N/render", ],
    function(record, search, transaction, serverWidget, xml, runtime, task,
        render) {
      /**
       * Definition of the Suitelet script trigger point.
       * 
       * @param {Object}
       *            context
       * @param {ServerRequest}
       *            context.request - Encapsulation of the incoming
       *            request
       * @param {ServerResponse}
       *            context.response - Encapsulation of the Suitelet
       *            response
       * @Since 2015.2
       */
      function onRequest(context) {
        try {
          if (context.request.method === "GET") {
            var jobId = context.request.parameters.jobId;
            var isView = context.request.parameters.isView;
            log.debug("isView: " + isView, "called" + jobId);
            log.debug("context.request.parameters.subArr",
                context.request.parameters.subArr);
  
            /*
             * [["custrecord_cntm_cah_jobnumber","anyof","350213"]],
             * "AND",
             * [[["custrecord_cntm_cso_parentrec.custrecord_cntm_cso_status","anyof","1","5"]],"OR",[["custrecord_cntm_cso_parentrec.custrecord_cntm_last_operation","is","T"],"AND",["custrecord_cntm_cso_parentrec.custrecord_cntm_cso_status","anyof","4"],"AND",["custrecord_cntm_cso_parentrec.custrecord_cntm_scrapped","is","T"]]]
             */
  
            var filters = [
                [ "custrecord_cntm_cah_jobnumber", "anyof",
                    jobId ], "AND", ];
            if (isView == "true") {
              var subArr = JSON
                  .parse(context.request.parameters.subArr);
              filters.push([
                  "custrecord_cntm_cso_parentrec.internalid",
                  "anyof", subArr, ]);
            } else
              filters
                  .push([
                      [
                          [
                              "custrecord_cntm_cso_parentrec.custrecord_cntm_cso_status",
                              "anyof", "1", "5", ], ],
                      "OR",
                      [
                          [
                              "custrecord_cntm_cso_parentrec.custrecord_cntm_last_operation",
                              "is", "T", ],
                          "AND",
                          [
                              "custrecord_cntm_cso_parentrec.custrecord_cntm_cso_status",
                              "anyof", "4", ],
                          "AND",
                          [
                              "custrecord_cntm_cso_parentrec.custrecord_cntm_scrapped",
                              "is", "T", ], ], ]);
            // filters.push([])
            var customrecord_cntm_clientapp_headerSearchObj = search
                .create({
                  type : "customrecord_cntm_clientapp_header",
                  filters : filters,
                  columns : [
                      search
                          .createColumn({
                            name : "custrecord_cntm_cah_customer",
                            label : "Customer ",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_cah_assemblyitem",
                            label : "Assembly Item Name/Number ",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_cso_createwo_completion",
                            join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                            label : "Create WOC",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_cso_wocnumber",
                            join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                            label : "WOC#",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_cso_woc_quantity",
                            join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                            label : "WOC Quantity ",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_cso_status",
                            join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                            label : "Status ",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_cso_scarpreason",
                            join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                            label : "Scrap Reason ",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_cso_scrap_quantity",
                            join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                            label : "Scrap Quantity",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_cso_scarp_cumulative",
                            join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                            label : "Cumulative Scrap Quantity",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_cso_quantity_good",
                            join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                            label : "Quantity Good ",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_cso_pannellot",
                            join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                            label : "Panel LOT",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_cso_operaton",
                            join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                            label : "Operation",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_seq_no",
                            join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                            sort : search.Sort.ASC,
                            label : "Sequence No",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_cso_machinesetuptime",
                            join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                            label : "Machine Setup Time",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_cso_machinerunetime",
                            join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                            label : "Machine Run Time ",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_cso_laborsetuptime",
                            join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                            label : "Labor Setup time",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_cso_laborruntime",
                            join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                            label : "Labor Run Time",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_lot_record",
                            join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                            label : "Lot Rec",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_items_to_issue",
                            join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                          // label: "Lot Rec"
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_is_create_issue",
                            join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                          // label: "Lot Rec"
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_last_operation",
                            join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                          // label: "Lot Rec"
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_cah_custpartnumber",
                            label : "Customer Part Number ",
                          }),
                      search.createColumn({
                        name : "created",
                        label : "Date Created",
                      }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_cah_woquantity",
                            label : "Work Order Quantity ",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_cah_woduedate",
                            label : "Work Order Due Date",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_cah_total_scrap_qty",
                            label : "Total Scrap Quantity ",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_cah_total_qty_good",
                            label : "Total Quantity GOOD",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_cah_total_lot_quantity",
                            label : "Total LOT Quantity ",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_job_num",
                            label : "Job",
                          }),
                      search.createColumn({
                        name : "scriptid",
                        label : "Script ID",
                      }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_cah_operatorid",
                            label : "Operator ID",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_num_panels",
                            label : "Number Of Panel",
                          }),
                      search.createColumn({
                        name : "internalid",
                        label : "Internal ID",
                      }),
                      search
                          .createColumn({
                            name : "internalid",
                            join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                            label : "Internal ID",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_add_panel_wo",
                            join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                            label : "Internal ID",
                          }),
                      search
                          .createColumn({
                            name : "custrecord_cntm_failed_reason",
                            join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                            label : "Error",
                          }), ],
                });
            var searchResultCount = customrecord_cntm_clientapp_headerSearchObj
                .runPaged().count;
            log
                .debug(
                    "customrecord_cntm_clientapp_headerSearchObj result count",
                    searchResultCount);
            var sublistjosn = {};
            var finalarray = [];
            var checkPresnt = {};
            customrecord_cntm_clientapp_headerSearchObj
                .run()
                .each(
                    function(result) {
                      // .run().each has a limit of 4,000
                      // results
                      var mainjson = {};
                      var wocCheck = result
                          .getValue(search
                              .createColumn({
                                name : "custrecord_cntm_cso_createwo_completion",
                                join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                label : "Create WOC",
                              }));
                      var panelLot = result
                          .getValue(search
                              .createColumn({
                                name : "custrecord_cntm_cso_pannellot",
                                join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                label : "Panel LOT",
                              }));
                      var sequenceNo = result
                          .getValue(search
                              .createColumn({
                                name : "custrecord_cntm_seq_no",
                                join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                label : "Sequence No",
                              }));
  
                      if (wocCheck != "Yes"
                          && checkPresnt[panelLot] == undefined) {
                        // Header Part Info
                        var headerID = result
                            .getValue(search
                                .createColumn({
                                  name : "internalid",
                                  label : "Internal ID",
                                }));
                        var customer = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_cah_customer",
                                  label : "Customer ",
                                }));
                        var customerText = result
                            .getText(search
                                .createColumn({
                                  name : "custrecord_cntm_cah_customer",
                                  label : "Customer ",
                                }));
                        var assPartNO = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_cah_assemblyitem",
                                  label : "Assembly Item Name/Number ",
                                }));
                        var assPartNOText = result
                            .getText(search
                                .createColumn({
                                  name : "custrecord_cntm_cah_assemblyitem",
                                  label : "Assembly Item Name/Number ",
                                }));
                        var custPartNo = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_cah_custpartnumber",
                                  label : "Customer Part Number ",
                                }));
                        var dateCreated = result
                            .getValue(search
                                .createColumn({
                                  name : "created",
                                  label : "Date Created",
                                }));
                        var woQty = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_cah_woquantity",
                                  label : "Work Order Quantity ",
                                }));
                        var woDueDate = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_cah_woduedate",
                                  label : "Work Order Due Date",
                                }));
                        var totalScrapQty = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_cah_total_scrap_qty",
                                  label : "Total Scrap Quantity ",
                                }));
                        var totalQGood = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_cah_total_qty_good",
                                  label : "Total Quantity GOOD",
                                }));
                        var totalLotQ = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_cah_total_lot_quantity",
                                  label : "Total LOT Quantity ",
                                }));
                        var jobNo = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_job_num",
                                  label : "Job",
                                }));
                        var jobNoText = result
                            .getText(search
                                .createColumn({
                                  name : "custrecord_cntm_job_num",
                                  label : "Job",
                                }));
                        var opId = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_cah_operatorid",
                                  label : "Operator ID",
                                }));
                        var opIdText = result
                            .getText(search
                                .createColumn({
                                  name : "custrecord_cntm_cah_operatorid",
                                  label : "Operator ID",
                                }));
                        var noOfPanel = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_num_panels",
                                  label : "Number Of Panel",
                                }));
                        mainjson.customer = customer;
                        mainjson.customerText = customerText;
                        mainjson.assPartNO = assPartNO;
                        mainjson.assPartNOText = assPartNOText;
                        mainjson.custPartNo = custPartNo;
                        mainjson.dateCreated = dateCreated;
                        mainjson.woQty = woQty;
                        mainjson.woDueDate = woDueDate;
                        mainjson.totalScrapQty = totalScrapQty;
                        mainjson.totalQGood = totalQGood;
                        mainjson.totalLotQ = totalLotQ;
                        mainjson.jobNo = jobNo;
                        mainjson.jobNoText = jobNoText;
                        mainjson.opId = opId;
                        mainjson.opIdText = opIdText;
                        mainjson.noOfPanel = noOfPanel;
                        mainjson.headerID = headerID;
                        // sublist part Info
                        var wocId = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_cso_wocnumber",
                                  join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                  label : "WOC#",
                                }));
                        var wocIdText = result
                            .getText(search
                                .createColumn({
                                  name : "custrecord_cntm_cso_wocnumber",
                                  join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                  label : "WOC#",
                                }));
                        var wocQTy = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_cso_woc_quantity",
                                  join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                  label : "WOC Quantity ",
                                }));
                        var status = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_cso_status",
                                  join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                  label : "Status ",
                                }));
                        var failedReason = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_failed_reason",
                                  join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                  label : "Error",
                                }));
                        var statusText = result
                            .getText(search
                                .createColumn({
                                  name : "custrecord_cntm_cso_status",
                                  join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                  label : "Status ",
                                }));
                        log.debug("status", status);
                        var scrapReason = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_cso_scarpreason",
                                  join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                  label : "Scrap Reason ",
                                }));
                        var scrapQty = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_cso_scrap_quantity",
                                  join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                  label : "Scrap Quantity",
                                }));
                        var scrapCumQty = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_cso_scarp_cumulative",
                                  join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                  label : "Cumulative Scrap Quantity",
                                }));
                        var qtyGood = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_cso_quantity_good",
                                  join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                  label : "Quantity Good ",
                                }));
  
                        var operation = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_cso_operaton",
                                  join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                  label : "Operation",
                                }));
                        var mcSetup = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_cso_machinesetuptime",
                                  join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                  label : "Machine Setup Time ",
                                }));
                        log.debug("mcSetup", mcSetup);
                        var mcRuntime = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_cso_machinerunetime",
                                  join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                  label : "Machine Run Time  ",
                                }));
                        var laborSetuptime = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_cso_laborsetuptime",
                                  join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                  label : "Labor Setup time ",
                                }));
                        var laborRuntime = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_cso_laborruntime",
                                  join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                  label : "Labor Run Time",
                                }));
                        var sublistID = result
                            .getValue(search
                                .createColumn({
                                  name : "internalid",
                                  join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                  label : "Internal ID",
                                }));
                        log.debug("sublistID",
                            sublistID);
  
                        var itemListSub = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_items_to_issue",
                                  join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                // label: ""
                                }));
                        var isIssue = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_is_create_issue",
                                  join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                // label: ""
                                }));
                        var isLastOp = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_last_operation",
                                  join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                // label: ""
                                }));
                        var panelWOId = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_add_panel_wo",
                                  join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                  label : "WOC#",
                                }));
  
                        var lotRecID = result
                            .getValue(search
                                .createColumn({
                                  name : "custrecord_cntm_lot_record",
                                  join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                  label : "Lot Rec",
                                }));
  
                        // Changes
  
                        var fieldLookUp = search
                            .lookupFields({
                              type : search.Type.WORK_ORDER,
                              id : jobId,
                              columns : [
                                  "tranid",
                                  "custbody_rda_wo_priorty",
                                  "custbody_rda_transbody_end_customer",
                                  "custbody_cntm_hidden_for_woi",
                                  "status" ],
                            });
                        // In process
                        log
                            .debug(
                                'fieldLookUp NEWW :',
                                JSON
                                    .stringify(fieldLookUp));
                        var woStatus = fieldLookUp.status[0].text;
  
                        log.debug("woStatus", woStatus);
  
                        var workorderSearchObj = search
                            .create({
                              type : "workorder",
                              filters : [
                                  [
                                      "type",
                                      "anyof",
                                      "WorkOrd" ],
                                  "AND",
                                  [
                                      "createdfrom",
                                      "anyof",
                                      jobId ] ],
                              columns : [ search
                                  .createColumn({
                                    name : "tranid",
                                    label : "Document Number"
                                  }) ]
                            });
                        var searchResultCount = workorderSearchObj
                            .runPaged().count;
                        log
                            .debug(
                                "NEWW workorderSearchObj result count",
                                searchResultCount);
  
                        if (searchResultCount == 0
                            && woStatus == 'In Process') {
                          log.debug("IF INSIDE")
                          mainjson.isIssueCreated = true;
                        } else {
                          log.debug("ELSE")
                          mainjson.isIssueCreated = false;
                        }
                        if (fieldLookUp.custbody_cntm_hidden_for_woi == true) {
                          mainjson.isIssueCreated = true;
                        } else {
                          var previousLotRec = search
                              .lookupFields({
                                type : "customrecord_cntm_lot_creation",
                                id : lotRecID,
                                columns : [ "custrecord_cntm_prev_lot_rec" ],
                              });
                          log.debug(
                              "previousLotRec :",
                              previousLotRec);
  
                          log
                              .debug(
                                  'previousLotRec.custrecord_cntm_prev_lot_rec[0]',
                                  previousLotRec.custrecord_cntm_prev_lot_rec[0]);
  
                          if (previousLotRec.custrecord_cntm_prev_lot_rec[0]) {
                            var previousLotRecID = previousLotRec.custrecord_cntm_prev_lot_rec[0].value;
                            log
                                .debug(
                                    "previousLotRecID :",
                                    previousLotRecID);
                            log.debug("jobId :",
                                jobId);
  
                            var customrecord_cntm_clientappsublistSearchObj = search
                                .create({
                                  type : "customrecord_cntm_clientappsublist",
                                  filters : [
                                      [
                                          "custrecord_cntm_cso_status",
                                          "anyof",
                                          "4" ],
                                      "AND",
                                      [
                                          "custrecord_cntm_last_operation",
                                          "is",
                                          "T" ],
                                      "AND",
                                      [
                                          "custrecord_cntm_cso_quantity_good",
                                          "isnot",
                                          "0.0" ],
                                      "AND",
                                      [
                                          "custrecord_cntm_cso_quantity_good",
                                          "isnot",
                                          "0" ],
                                      "AND",
                                      [
                                          "custrecord_cntm_work_order.createdfrom",
                                          "anyof",
                                          jobId ],
                                      "AND",
                                      [
                                          "custrecord_cntm_issue_created",
                                          "is",
                                          "T" ],
                                      "AND",
                                      [
                                          "custrecord_cntm_lot_record",
                                          "anyof",
                                          previousLotRecID ], ],
                                  columns : [
                                      search
                                          .createColumn({
                                            name : "scriptid",
                                            sort : search.Sort.ASC,
                                            label : "Script ID",
                                          }),
                                      search
                                          .createColumn({
                                            name : "custrecord_cntm_issue_in_process",
                                            label : "Issue In Process",
                                          }),
                                      search
                                          .createColumn({
                                            name : "custrecord_cntm_issue_created",
                                            label : "WO Issue Created",
                                          }),
                                      search
                                          .createColumn({
                                            name : "custrecord_cntm_prev_lot_rec",
                                            join : "CUSTRECORD_CNTM_LOT_RECORD",
                                            label : "Previous Lot Rec",
                                          }), ],
                                });
                            var searchResultCount = customrecord_cntm_clientappsublistSearchObj
                                .runPaged().count;
                            log
                                .debug(
                                    "MY customrecord_cntm_clientappsublistSearchObj result count",
                                    searchResultCount);
  
                            if (searchResultCount > 0) {
                              mainjson.isIssueCreated = true;
                            } else {
                              mainjson.isIssueCreated = false;
                            }
                          }
                        }
  
                        mainjson.wocCheck = wocCheck;
                        mainjson.wocId = wocId;
                        mainjson.wocIdText = wocIdText;
                        mainjson.wocQTy = wocQTy;
                        mainjson.status = status;
                        mainjson.statusText = statusText;
                        mainjson.scrapReason = scrapReason;
                        mainjson.scrapQty = scrapQty;
                        mainjson.scrapCumQty = scrapCumQty;
                        mainjson.qtyGood = qtyGood;
                        mainjson.panelLot = panelLot;
                        mainjson.operation = operation;
                        mainjson.mcSetup = mcSetup;
                        mainjson.mcRuntime = mcRuntime;
                        mainjson.laborSetuptime = laborSetuptime;
                        mainjson.laborRuntime = laborRuntime;
                        mainjson.sublistID = sublistID;
                        mainjson.sequenceNo = sequenceNo;
                        mainjson.lotRecID = lotRecID;
                        mainjson.panelWOId = panelWOId;
                        mainjson.failedReason = failedReason;
                        var lotRecFieldLookUp = search
                            .lookupFields({
                              type : "customrecord_cntm_lot_creation",
                              id : lotRecID,
                              columns : [ "custrecord_cntm_cumulative_scrap_qty" ],
                            });
  
                        log
                            .debug(
                                lotRecID,
                                lotRecFieldLookUp.custrecord_cntm_cumulative_scrap_qty);
                        var cumQty = lotRecFieldLookUp.custrecord_cntm_cumulative_scrap_qty ? lotRecFieldLookUp.custrecord_cntm_cumulative_scrap_qty
                            : 0;
                        mainjson.cumQty = cumQty;
                        mainjson.itemListSub = itemListSub;
                        mainjson.isIssue = isIssue;
                        mainjson.isLastOp = isLastOp;
                        // var fieldLookUp =
                        // search.lookupFields({
                        // type: search.Type.WORK_ORDER,
                        // id: jobId,
                        // columns: [
                        // "tranid",
                        // "custbody_rda_wo_priorty",
                        // "custbody_rda_transbody_end_customer",
                        // "status"
                        // ],
                        // });
                        var endCust = fieldLookUp.custbody_rda_transbody_end_customer;
                        endCust = endCust ? endCust[0]
                            : "";
                        mainjson.woText = fieldLookUp.tranid;
                        mainjson.priority = fieldLookUp.custbody_rda_wo_priorty;
  
                        mainjson.endCust = endCust ? endCust.text
                            : "";
                        log
                            .debug(
                                "parseInt(sequenceNo)+1",
                                parseInt(sequenceNo) + 1);
  
                        var customrecord_cntm_clientapp_headerSearchObj1 = search
                            .create({
                              type : "customrecord_cntm_clientapp_header",
                              filters : [
                                  [
                                      "custrecord_cntm_cah_jobnumber",
                                      "anyof",
                                      jobId ],
                                  "AND",
                                  [
                                      "custrecord_cntm_cso_parentrec.custrecord_cntm_cso_status",
                                      "anyof",
                                      "1",
                                      "5", ],
                                  "AND",
                                  [
                                      "custrecord_cntm_cso_parentrec.custrecord_cntm_seq_no",
                                      "greaterthanorequalto",// "greaterthan",
                                      parseInt(sequenceNo) ],
                                  "AND",
                                  [
                                      "custrecord_cntm_cso_parentrec.custrecord_cntm_cso_pannellot",
                                      "is",
                                      panelLot, ], ],
                              columns : [
                                  search
                                      .createColumn({
                                        name : "custrecord_cntm_cso_operaton",
                                        join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                      }),
                                  search
                                      .createColumn({
                                        name : "custrecord_cntm_seq_no",
                                        join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                        sort : search.Sort.ASC,
                                      }), ],
                            });
                        var searchResultCount = customrecord_cntm_clientapp_headerSearchObj1
                            .runPaged().count;
                        log
                            .debug(
                                "customrecord_cntm_clientapp_headerSearchObj1 result count",
                                searchResultCount);
                        mainjson.nextOpList = [];
                        customrecord_cntm_clientapp_headerSearchObj1
                            .run()
                            .each(
                                function(result) {
                                  // .run().each
                                  // has a
                                  // limit of
                                  // 4,000
                                  // results
  
                                  mainjson.nextOpList
                                      .push(result
                                          .getValue(search
                                              .createColumn({
                                                name : "custrecord_cntm_cso_operaton",
                                                join : "CUSTRECORD_CNTM_CSO_PARENTREC",
                                              })));
                                  return true;
                                });
                        mainjson.nextOp = mainjson.nextOpList[1];
                        finalarray.push(mainjson);
                        checkPresnt[panelLot] = sequenceNo;
                      }
                      return true;
                    });
            log.debug("finalarray", JSON.stringify(finalarray));
            context.response.write(JSON.stringify(finalarray));
          } else if (context.request.method === "POST") {
            log.debug("--------------POST--------------");
            var totalData = context.request.body;
            log.debug("TotalData", totalData);
            totalData = JSON.parse(totalData);
            var lineCount = totalData.length;
            log.debug("TotalData", totalData[0].sublistIntenalId);
  
            for (var int = 0; int < lineCount; int++) {
              var isWOC = totalData[int].createWocCheck == "T"
                  || totalData[int].createWocCheck == "true"
                  || totalData[int].createWocCheck == true ? true
                  : false;
              log.debug("isWOC", isWOC);
              if (isWOC == true) {
                if (totalData[int].scrapQtyCum)
                  record
                      .submitFields({
                        type : "customrecord_cntm_lot_creation",
                        id : totalData[int].lotRecId,
                        values : {
                          custrecord_cntm_cumulative_scrap_qty : totalData[int].scrapQtyCum,
                        },
                        options : {
                          enableSourcing : false,
                          ignoreMandatoryFields : true,
                        },
                      });
                record
                    .submitFields({
                      type : "customrecord_cntm_clientappsublist",
                      id : totalData[int].sublistIntenalId,
                      values : {
                        custrecord_cntm_cso_scrap_quantity : totalData[int].scrapQtysub,
                        custrecord_cntm_cso_scarp_cumulative : totalData[int].scrapQtyCum,
                        custrecord_cntm_cso_quantity_good : totalData[int].qtyGoodSub,
                        custrecord_cntm_cso_woc_quantity : totalData[int].changeLotQty,
                        custrecord_cntm_cso_status : 3,
                        custrecord_cntm_cso_scarpreason : totalData[int].scrapDetailssub,
                        custrecord_cntm_cso_createwo_completion : isWOC,
                        custrecord_cntm_cso_laborsetuptime :   Number(totalData[int].laborSetupSub).toFixed(6),
                        custrecord_cntm_cso_laborruntime :  Number(totalData[int].laborRunSub).toFixed(6),
                        custrecord_cntm_operator : totalData[int].clientopid,
                        custrecord_cntm_old_clientapp_process:true
                      },
                      options : {
                        enableSourcing : false,
                        ignoreMandatoryFields : true,
                      },
                    });
              }
            }
  
            log.debug("TotalData", totalData);
          }
        } catch (e) {
          log.debug("eroorcalllog", e);
        }
      }
  
      return {
        onRequest : onRequest,
      };
    });
  