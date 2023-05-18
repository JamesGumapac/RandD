/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @filename      Cntm_CS_WO_check_box_and_function.js
 * @scriptname    Cntm_CS_WO_check_box_and_function
 * @ScriptId      customscript_cntm_cs_wo_check_box_and_fn
 * @author        Vishal Naphade
 * @email         mailto:vishal.naphade@centium.net
 * @date           
 * @description   
 * @script_id   1772
 
 * Copyright 2020, Centium Consulting its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 * Module Description
 * 
 * Sr. No   	 Date           	  Author                  	Remarks
 * 1	      	23 March 2022 		  Vishal Naphade    	 -   
 * 2			    18-04-2022          Vishal Naphade       - Added disable btn in function
 * 3          30-04-2022          Vishal Naphade       - Added conditon for Stock Board
 * 4          10-05-2022          Vishal Naphade       - Condition for present Manaufacturing routing
 * 5          18-05-2022          Vishal Naphade       - Added Function for create Header and Sublist Record
 * 6          16-11-2022          Vishal Naphade       - Added validation to check no of panels
 * 7          22-11-2022          Vishal Naphade       - Validation on No of panels
 */
define([
        "N/record",
        "N/search",
        "N/runtime",
        "N/https",
        "N/currentRecord",
        "N/url",
        "N/ui/dialog",
        "N/runtime"
       
    ],
    /**
     * @param {record}
     *            record
     * @param {search}
     *            search
     */
    function(record, search, runtime, https, currentRecord, url, dialog,runtime) {
        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object}
         *            scriptContext
         * @param {Record}
         *            scriptContext.currentRecord - Current form record
         * @param {string}
         *            scriptContext.mode - The mode in which the record is
         *            being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        /**
         * 02-05-2022      Vishal Naphade           Added field change on Stock Board
         */
        var step;
        var governance_cs = 950;
        var $ = jQuery;
        jQuery('head').append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/sweetalert/1.1.3/sweetalert.min.css">');
        jQuery('body').append('<script src="https://cdnjs.cloudflare.com/ajax/libs/sweetalert/1.1.3/sweetalert.min.js"></script>');
        function pageInit(scriptContext) {
            console.log("Page init");
            sessionStorage.setItem("routing", scriptContext.currentRecord.getValue({ fieldId: "manufacturingrouting" }));
        }

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object}
         *            scriptContext
         * @param {Record}
         *            scriptContext.currentRecord - Current form record
         * @param {string}
         *            scriptContext.sublistId - Sublist name
         * @param {string}
         *            scriptContext.fieldId - Field name
         * @param {number}
         *            scriptContext.lineNum - Line number. Will be undefined
         *            if not a sublist or matrix field
         * @param {number}
         *            scriptContext.columnNum - Line number. Will be
         *            undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {
            var rec = scriptContext.currentRecord;

            try {
                //custbody_rda_wo_issue_okay
                //custbody_cntm_hidden_for_woi
                if (runtime.executionContext === runtime.ContextType.USER_INTERFACE) {
                    if (scriptContext.fieldId == "custbody_rda_wo_issue_okay") {
                        var issue_from_UI = scriptContext.currentRecord.getValue({
                            fieldId: "custbody_cntm_hidden_for_woi",
                        });
                        console.log("issue_from_UI :", issue_from_UI);

                        var okay_to_issue = scriptContext.currentRecord.getValue({
                            fieldId: "custbody_rda_wo_issue_okay",
                        });
                        console.log("okay_to_issue :", okay_to_issue);

                        //if the issue is created from UI
                        if (issue_from_UI && okay_to_issue) {
                            alert("Issue is created from UI");
                            scriptContext.currentRecord.setValue({
                                fieldId: "custbody_rda_wo_issue_okay",
                                value: false,
                            });
                        }
                    }
                }

                //Changes Done on 01-05-2022
                if (rec.type == "workorder") {
                    if (scriptContext.fieldId == "custbody_cntm_is_rework_wo") {
                        if (rec.getValue({ fieldId: "custbody_cntm_is_rework_wo" }) == true) {
                            alert(
                                "Please enter Boards Per Panel , No of Panels and Lot for Stock Board before saving the record. This field is mandatory for Stock Board Work Orders. " //Please enter value(s) 
                            );
                            rec.getField({
                                fieldId: "custbody_cntm_lot_stock_board",
                            }).isMandatory = true;

                            rec.getField({
                                fieldId: "custbody_cntm_no_of_panel",
                            }).isMandatory = true;

                            rec.getField({
                                fieldId: "custbody_rda_boards_per_panel",
                            }).isMandatory = true;
                        } else {
                            rec.setValue({
                                fieldId: "custbody_cntm_lot_stock_board",
                                value: "",
                            });
                            rec.setValue({
                                fieldId: "custbody_cntm_no_of_panel",
                                value: "",
                            });
                            rec.setValue({
                                fieldId: "custbody_rda_boards_per_panel",
                                value: "",
                            });
                            rec.setValue({
                                fieldId: "quantity",
                                value: "",
                            });
                            rec.getField({
                                fieldId: "custbody_cntm_lot_stock_board",
                            }).isMandatory = false;

                            rec.getField({
                                fieldId: "custbody_cntm_no_of_panel",
                            }).isMandatory = false;

                            rec.getField({
                                fieldId: "custbody_rda_boards_per_panel",
                            }).isMandatory = false;
                        }
                    }

                    if (scriptContext.fieldId == "custbody_cntm_no_of_panel" || scriptContext.fieldId == "custbody_rda_boards_per_panel") {
                        debugger
                        //change on 22-11-2022
                        // if (rec.getValue({ fieldId: "custbody_cntm_is_rework_wo" }) == true) {
                        var noOfpanels = rec.getValue({
                            fieldId: "custbody_cntm_no_of_panel",
                        });
                        var boardsPerPanel = rec.getValue({
                            fieldId: "custbody_rda_boards_per_panel",
                        });
                        if (!noOfpanels) noOfpanels = 1;
                        if (!boardsPerPanel) boardsPerPanel = 1;
                        rec.setValue({
                            fieldId: "quantity",
                            value: noOfpanels * boardsPerPanel,
                        });
                        // }
                    }

                    // debugger;
                    if (rec.getValue({ fieldId: "custbody_cntm_is_rework_wo" }) == true) {
                        if (scriptContext.fieldId == "custbody_cntm_lot_stock_board") {

                            var lotForStock = rec.getValue({
                                fieldId: "custbody_cntm_lot_stock_board",
                            });
                            console.log("lotForStock :", lotForStock);
                            console.log("lotForStock type:", typeof lotForStock);

                            var noOfpanels = rec.getValue({
                                fieldId: "custbody_cntm_no_of_panel",
                            });
                            console.log("noOfpanels :", noOfpanels);
                            console.log("noOfpanels type:", typeof noOfpanels);

                            if (lotForStock.split(",").length != noOfpanels) {
                                alert("Lot of stock must be equal to number of panels");
                                //custbody_cntm_lot_stock_board
                                // rec.setValue({
                                //   fieldId: "custbody_cntm_lot_stock_board",
                                //   value: "",
                                // });
                            } else {
                                console.log("ELSE");
                            }
                        }
                    }

                    //If user try to enter lot for line then restrict user bcos that for only remke 
                    if (scriptContext.sublistId == 'item' && scriptContext.fieldId == 'custcol_cntm_lot_for_remake') {
                        var remakeCheckBox = scriptContext.currentRecord.getCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_cntm_is_remake_wo"
                        });

                        if (remakeCheckBox == 'F' || remakeCheckBox == false || remakeCheckBox == 'false') {
                            alert('You can enter lot only for remake')
                            scriptContext.currentRecord.setCurrentSublistValue({
                                sublistId: "item",
                                fieldId: "custcol_cntm_lot_for_remake",
                                value: " ",
                                ignoreFieldChange: true,
                            });

                        }
                    }
                    //change 1
                    //Changes to prevent manufacturing routing 05/12/2022
                    // if (scriptContext.fieldId == 'iswip') {
                    //     debugger;
                    //     if (rec.getValue({ fieldId: "custbody_cntm_custom_rec_ref_hide" }) == true) { // custbody_cntm_custom_rec_ref_hide
                    //         alert("You Can not change this field");
                    //         console.log('scriptContext :', scriptContext)
                    //         rec.setValue({
                    //             fieldId: "iswip",
                    //             value: true,
                    //             ignoreFieldChange: true,
                    //         });

                    //     }
                    // }

                    //change 2
                    // if (scriptContext.fieldId == 'manufacturingrouting') {
                    //     try {
                    //         // debugger;
                    //         if (rec.getValue({ fieldId: "custbody_cntm_custom_rec_ref_hide" }) == true && rec.getValue({ fieldId: "iswip" }) == true) { // custbody_cntm_custom_rec_ref_hide
                    //             // alert("You Can not change this field");

                    //             var routing = rec.getValue({ fieldId: "manufacturingrouting" })
                    //             console.log('routing :', routing)

                    //             rec.setValue({
                    //                 fieldId: "manufacturingrouting",
                    //                 value: routing,
                    //                 ignoreFieldChange: true,
                    //             });

                    //         }
                    //     } catch (error) {
                    //         console.log('error :', error)
                    //     }
                    // }

                }
            } catch (e) {
                console.log("error_fchange :" + e.message);
            }
        }

        function validateField(scriptContext) {

            if (scriptContext.fieldId == 'manufacturingrouting') {

                try {
                    var routing = scriptContext.currentRecord.getValue({ fieldId: "manufacturingrouting" })
                    console.log('routing :', routing);
                    console.log('sessionStorage :', sessionStorage.getItem('routing'))

                    if (validateData(routing) && validateData(sessionStorage.getItem('routing')) && scriptContext.currentRecord.getValue({ fieldId: "custbody_cntm_custom_rec_ref_hide" }) == true && scriptContext.currentRecord.getValue({ fieldId: "iswip" }) == true) {
                        if (sessionStorage.getItem('routing') == routing) {
                            return true;
                        } else {
                            debugger
                            scriptContext.currentRecord.setValue({
                                fieldId: "manufacturingrouting",
                                value: parseInt(sessionStorage.getItem('routing')),
                                ignoreFieldChange: true,
                            });
                            alert('You can not change Manufacturing Routing after creation of Client App Operations ')
                            return false;
                        }
                    }

                    return true;
                } catch (error) {
                    console.log('Error in validate fields :', error)
                }
            }
            return true;

        }

        function validateLine(scriptContext) {
            try {
                if (scriptContext.sublistId == "item") {


                    var noOfPanels = scriptContext.currentRecord.getValue({
                        fieldId: "custbody_cntm_no_of_panel",
                    });
                    console.log("noOfPanels :" + noOfPanels);

                    var stockBoard = scriptContext.currentRecord.getValue({
                        fieldId: "custbody_cntm_is_rework_wo",
                    });
                    console.log("stockBoard :" + stockBoard);

                    var currentItem = scriptContext.currentRecord.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "item",
                    });
                    console.log("currentItem :" + currentItem);

                    var lineCount = scriptContext.currentRecord.getLineCount({
                        sublistId: "item",
                    });
                    console.log("lineCount :" + lineCount);

                    var currentLine = scriptContext.currentRecord.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "line",
                    });
                    console.log("currentLine :" + currentLine);




                    var lineNum = scriptContext.currentRecord.getCurrentSublistIndex({
                        sublistId: "item",
                    });
                    // console.log("lineNum :"+lineNum);
                    lineNum = lineNum + 1;
                    // console.log("lineNum 1 :"+lineNum);

                    // debugger;
                    var itemLookup = search.lookupFields({
                            type: 'lotnumberedassemblyitem',
                            id: currentItem,
                            columns: ['custitem_cntm_subtype']
                        })
                        // console.log("itemLookup :"+ itemLookup);
                    if (isNotEmpty(itemLookup)) {
                        var itemSubType = itemLookup.custitem_cntm_subtype[0].value;
                        // console.log("itemSubType :"+ JSON.stringify(itemSubType));

                        if (!validateData(stockBoard)) {
                            if (lineNum > lineCount && (itemSubType == 1 || itemSubType == "FAB")) {
                                // var message = confirm(
                                //   "Number of panels are : " +
                                //     noOfPanels +
                                //     " for remake , click Ok then change number of panels on line"
                                // );
                                alert('This line will be consider as remake workorder, please enter the required number of panels on line.')
                                    // if (message) {
                                scriptContext.currentRecord.setCurrentSublistValue({
                                    sublistId: "item",
                                    fieldId: "custcol_cntm_lot_for_remake",
                                    value: noOfPanels,
                                    ignoreFieldChange: true,
                                });
                                scriptContext.currentRecord.setCurrentSublistValue({
                                    sublistId: "item",
                                    fieldId: "custcol_cntm_is_remake_wo",
                                    value: true,
                                    ignoreFieldChange: true,
                                });
                                return true;

                                // }
                                // else{
                                //   return false;
                                // }

                            }
                        }


                    }



                    return true;

                }

            } catch (error) {
                console.log('Error in validate line CS_WO_check_box :' + error)
            }

        }

        function saveRecord(scriptContext) {
            var rec = scriptContext.currentRecord;
            try {
                var isStock = rec.getValue({ fieldId: "custbody_cntm_is_rework_wo" });
                if (isStock) {
                    var noOfpanels = rec.getValue({
                        fieldId: "custbody_cntm_no_of_panel",
                    });
                    if (noOfpanels == "" | noOfpanels == null || noOfpanels == undefined) {
                        alert('Please enter value(s): Number of panels');
                        return false;
                    }
                    var boardsPerPanel = rec.getValue({
                        fieldId: "custbody_rda_boards_per_panel",
                    });
                    if (boardsPerPanel == "" | boardsPerPanel == null || boardsPerPanel == undefined) {
                        alert('Please enter value(s): Boards per panel');
                        return false;
                    }
                    var lotForStock = rec.getValue({
                        fieldId: "custbody_cntm_lot_stock_board",
                    });
                    if (lotForStock == "" || lotForStock == null || lotForStock == undefined) {
                        alert('Please enter value(s) : lot for stock');
                        return false;
                    }
                }
            } catch (error) {
                console.log('ERROR in SAVE REC :', error)
            }

            return true;
        }
        function successcallfrommr(mrscript){
            var count;
            var percentdone;
            showLoader(0.0);
            var looping = setInterval(function() {
                

                if(percentdone == 100 || count==100){
                    console.log("hiding loader")
                    clearInterval(looping);  
                    hideLoader();
                    location.reload();
                }
                count=0;
                console.log("count initialized to 0")
            var scheduledscriptinstanceSearchObj = search.create({
                type: "scheduledscriptinstance",
                filters:
                [
                   ["script.name","is","Cntm_MR_create_custom_record"], 
                   "AND", 
                   ["datecreated","on","today"], 
                   "AND", 
                   ["status","anyof","PROCESSING"]
                ],
                columns:
                [
                   search.createColumn({
                      name: "name",
                      join: "script",
                      label: "Name"
                   }),
                   search.createColumn({
                      name: "scriptid",
                      join: "scriptDeployment",
                      label: "Custom ID"
                   }),
                   search.createColumn({name: "timestampcreated", label: "Date Created"}),
                   search.createColumn({name: "mapreducestage", label: "Map/Reduce Stage"}),
                   search.createColumn({name: "status", label: "Status"}),
                   search.createColumn({
                      name: "percentcomplete",
                      sort: search.Sort.DESC,
                      label: "Percent Complete"
                   }),
                   search.createColumn({name: "prioritytimestamp", label: "Priority Timestamp"}),
                   search.createColumn({name: "taskid", label: "Task ID"})
                ]
             });
             var searchResultCount = scheduledscriptinstanceSearchObj.runPaged().count;
             log.debug("scheduledscriptinstanceSearchObj result count",searchResultCount);
             scheduledscriptinstanceSearchObj.run().each(function(result){
            var taskid = result.getValue(  search.createColumn({name: "taskid", label: "Task ID"}));
            if(taskid ==mrscript)
            {
                 percentdone = result.getValue( search.createColumn({
                    name: "percentcomplete",
                    sort: search.Sort.DESC,
                    label: "Percent Complete"
                 }));
                 count++;
                 console.log("count 1")
            }
            // else{
            //     percentdone = 100;
            //     console.log("percent is now 100")
            // }
                return true;
             });
             if(count>0)
             {
                console.log("percentdone",percentdone)
                step.innerHTML="Please Wait.....Page Will be reloaded automatically."+" \nProcessing percent completed is "+ percentdone;
             }
             else{
                console.log("count 100")
                count=100;

             }
            

            },10000);


            // setTimeout(function() {
            //     // jQuery("#loadingIndicator").hide();
            //     hideLoader();
            //     location.reload();
            // }, 45000);

        }

        function createHeaderAndSublistRecordTemp(woId) {
            try {
                debugger;
                console.log('woId :', woId);
                //custbody_cntm_prevent_dup_record
                var woLookup = search.lookupFields({
                    type: record.Type.WORK_ORDER,
                    id: woId,
                    columns: ["custbody_cntm_prevent_dup_record", "custbody_cntm_no_of_panel", "manufacturingrouting", "custbody_cntm_routing_check", "custbody_cntm_custom_rec_ref_hide"],
                });

                var dupRecFlag = woLookup.custbody_cntm_prevent_dup_record;
                var noOfpanelOnWo = woLookup.custbody_cntm_no_of_panel;
                var manufacturingRouting = woLookup.manufacturingrouting;
                var routingCheck = woLookup.custbody_cntm_routing_check;
                var isOperationComplete = woLookup.custbody_cntm_custom_rec_ref_hide

                if (validateData(routingCheck)) {
                    // alert('On the Work Order, the routing appears to have been changed. Please click "Update BOM and Routing", then proceed.')
                    alert('A change has been made to the routing on the Work Order, Click "Update BOM and Routing" button and then proceed.')
                    showButton();
                } else if (!validateData(manufacturingRouting)) {
                    alert('Client App Operation can not be created for this Work order. Please select Manufacturing routing and then proceed.');
                    showButton();
                } else if (validateData(dupRecFlag)) {
                    alert("Custom Records Creation for this Work Order is in progress. Please refresh after some time.");
                    showButton();
                } else if (validateData(isOperationComplete)) {
                    alert('A custom record has been created for this work order')
                    showButton();
                    window.location.reload()

                } else {
                    if (checkSame(woId, noOfpanelOnWo)) {
                        var message = confirm(
                            "Manufacturing Routing cannot be updated after creation of Client App Operations. Click OK to proceed, else Cancel."
                        );
                        if (message) {
                            record.submitFields({
                                type: record.Type.WORK_ORDER,
                                id: woId,
                                values: { custbody_cntm_prevent_dup_record: true },
                            });

                            showLoader(0.0);
                            setTimeout(function() {
                                var suiteletURLForCustomRec = url.resolveScript({
                                    scriptId: "customscript_cntm_st_customrcreate_back",
                                    deploymentId: "customdeploy_cntm_st_customrcreate_dep",
                                    returnExternalUrl: true,
                                    params: {
                                        woId: woId,
                                    },
                                });
                                console.log("suiteletURLForCustomRec :", suiteletURLForCustomRec);

                                var response = https.get({
                                    url: suiteletURLForCustomRec,
                                });
                                console.log("response :", response);
                                 
                                if (JSON.parse(response.body).status == "SUCCESS") {

                                    var count;
                                    var mrscript =JSON.parse(response.body).mrtaskid ;

                                    log.audit("map reduce task id",mrscript)
                                    console.log("mrtaskid",mrscript)

                                   successcallfrommr(mrscript);

                                  

                                } else if (JSON.parse(response.body).status == "ERROR") {
                                    record.submitFields({
                                        type: record.Type.WORK_ORDER,
                                        id: woId,
                                        values: { custbody_cntm_prevent_dup_record: false },
                                    });

                                    hideLoader();

                                   var searchobj= search.create({
                                        type: "scheduledscriptinstance",
                                        filters:
                                        [
                                           ["script.name","is","Cntm_MR_create_custom_record"], 
                                           "AND", 
                                           ["datecreated","on","today"], 
                                           "AND", 
                                           ["status","anyof","PROCESSING"]
                                        ],
                                     
                                     });
                                     var searchResultCount = searchobj.runPaged().count;
                                     var inner_percent;
                                     var temp_count = searchResultCount;
                                     console.log("temp count",temp_count);


                                     var looping = setInterval(function() {

                                   var scheduledscriptinstanceSearchObj=search.create({
                                        type: "scheduledscriptinstance",
                                        filters:
                                        [
                                           ["script.name","is","Cntm_MR_create_custom_record"], 
                                           "AND", 
                                           ["datecreated","on","today"], 
                                           "AND", 
                                           ["status","anyof","PROCESSING"]
                                        ],
                                        columns:
                                        [
                                           search.createColumn({
                                              name: "name",
                                              join: "script",
                                              label: "Name"
                                           }),
                                           search.createColumn({
                                              name: "scriptid",
                                              join: "scriptDeployment",
                                              label: "Custom ID"
                                           }),
                                           search.createColumn({name: "timestampcreated", label: "Date Created"}),
                                           search.createColumn({name: "mapreducestage", label: "Map/Reduce Stage"}),
                                           search.createColumn({name: "status", label: "Status"}),
                                           search.createColumn({
                                              name: "percentcomplete",
                                              sort: search.Sort.DESC,
                                              label: "Percent Complete"
                                           }),
                                           search.createColumn({name: "prioritytimestamp", label: "Priority Timestamp"}),
                                           search.createColumn({name: "taskid", label: "Task ID"})
                                        ]
                                     });
                                     var searchResultCount_inner = scheduledscriptinstanceSearchObj.runPaged().count;
                                     log.debug("scheduledscriptinstanceSearchObj result count",searchResultCount);
                                     if(searchResultCount_inner == temp_count)
                                     {
                                        scheduledscriptinstanceSearchObj.run().each(function(result){
                                             inner_percent = result.getValue(search.createColumn({
                                                name: "percentcomplete",
                                                sort: search.Sort.DESC,
                                                label: "Percent Complete"
                                             }));
                                  
                                   
                                            return false;
                                        });
                                        swal({ title: "INFO!", text:  'Previous Deployment running ' +inner_percent+ ' . Operations will be created once deployment becomes available.', type: "info", confirmButtonText: "Ok",});
                                        var scriptObj = runtime.getCurrentScript();
                                        var remainingusage = scriptObj.getRemainingUsage();
                                        if((1000-remainingusage >governance_cs))
                                        {
                                          console.log("reloading page")
                                            location.reload();
                                        }

                                        // function success(result) { console.log('Success with value: ' + result) }
                                        // function failure(reason) { console.log('Failure: ' + reason) }
                                
                                        // dialog.alert({
                                        //     title: 'Netsuite Alert',
                                        //     message: 'Someting went wrong please try again after some time.Previous Deployment running ' +inner_percent+ '',
                                        // }).then(success).catch(failure);


                                     }
                                     else{
                                        console.log("hiding dialog")
                                        clearInterval(looping); 
                                        swal.close();
                                        setTimeout(function(){
                                            var suiteletURLForCustomRec = url.resolveScript({
                                                scriptId: "customscript_cntm_st_customrcreate_back",
                                                deploymentId: "customdeploy_cntm_st_customrcreate_dep",
                                                returnExternalUrl: true,
                                                params: {
                                                    woId: woId,
                                                },
                                            });
                                            console.log("suiteletURLForCustomRec :", suiteletURLForCustomRec);
            
                                            var response = https.get({
                                                url: suiteletURLForCustomRec,
                                            });
                                            console.log("response :", response);
                                             
                                            if (JSON.parse(response.body).status == "SUCCESS") {
            
                                                var count;
                                                var mrscript =JSON.parse(response.body).mrtaskid ;
            
                                                log.audit("map reduce task id",mrscript)
                                                console.log("mrtaskid",mrscript)
            
                                               successcallfrommr(mrscript);
                                                         
                                            }
                                        },10000);
                                            

                                        
                                     }
                                    
                                        });
                                    
                                    

                                    







                                    
                                    // setTimeout(function(){
                                    //     function success(result) { console.log('Success with value: ' + result) }
                                    //     function failure(reason) { console.log('Failure: ' + reason) }
                                
                                    //     dialog.alert({
                                    //         title: 'Netsuite Alert',
                                    //         message: 'Someting went wrong please try again after some time.Previous Deployment running ' + JSON.parse(response.body).remaining_percent + '',
                                    //     }).then(success).catch(failure);
                                    //  // dialog.alert('Someting went wrong please try again after some time.Previous Deployment running ' + JSON.parse(response.body).remaining_percent + '');
                                    // },100);
                                    // location.reload();
                                }
                            }, 100);
                        } else {
                            record.submitFields({
                                type: record.Type.WORK_ORDER,
                                id: woId,
                                values: { custbody_cntm_prevent_dup_record: false },
                            });
                            showButton();
                        }
                    } else {
                        alert("Make sure that the number of panels on the lot record and work order are the same. Also, Make sure the lot record count matches the number of panels on the work order.");
                        showButton();
                    }
                }


            } catch (error) {
                log.error('Error in cration of custom record :', error)
                console.log('Error in cration of custom record :', error)
            }
        }

        function checkSame(woId, noOfpanelOnWo) {
            try {
                var arr = getBoardsPerPanelArray(woId);
                var temp = 0
                arr.forEach((a) => {
                    if (a !== noOfpanelOnWo) {
                        temp++
                    }
                })
                if (temp == arr.length) {
                    // console.log("Your noOfpanelOnWo variable is different.")
                    return false;
                } else if (temp > 0 && temp < arr.length) {
                    // console.log("Found different element in arr.")
                    return false;
                } else if (arr.length != noOfpanelOnWo) {
                    return false
                } else {
                    return true;
                }
            } catch (error) {
                console.log('checkSame :', error)
            }

        }

        function getBoardsPerPanelArray(woId) {
            var arr = []
            try {
                var customrecord_cntm_lot_creationSearchObj = search.create({
                    type: "customrecord_cntm_lot_creation",
                    filters: [
                        ["custrecord_cntm_lot_wonum", "anyof", woId]
                    ],
                    columns: [
                        search.createColumn({
                            name: "scriptid",
                            sort: search.Sort.ASC,
                            label: "Script ID"
                        }),
                        search.createColumn({ name: "custrecord_cntm_lot_wonum", label: "WO#" }),
                        search.createColumn({ name: "custrecord_cntm_lot_wo_completion", label: "WO Completion " }),
                        search.createColumn({ name: "custrecord_cntm_lot_assembly_item", label: "Assembly Item " }),
                        search.createColumn({ name: "custrecord_cntm_lot_lotnumber", label: "LOT#" }),
                        search.createColumn({ name: "custrecord_cntm_wo_details_fab", label: "Parent" }),
                        search.createColumn({ name: "custrecord_cntm_num_of_panels", label: "Number of Panels" })
                    ]
                });
                var searchResultCount = customrecord_cntm_lot_creationSearchObj.runPaged().count;
                //  log.debug("customrecord_cntm_lot_creationSearchObj result count",searchResultCount);
                customrecord_cntm_lot_creationSearchObj.run().each(function(result) {
                    arr.push(result.getValue({ name: "custrecord_cntm_num_of_panels", label: "Number of Panels" }))
                    return true;
                });
                return arr;
            } catch (e) {
                console.log('error in getBoardsPerPanelArray :', e)
            }
        }

        function createHeaderAndSublistRecord(woId) {
            console.log("___CALLAD SUBLIST___");

            hideButton()
            setTimeout(function() {
                createHeaderAndSublistRecordTemp(woId);
            }, 100);
        }

        function hideButton() {
            jQuery("#custpage_custom_record").parent().hide();
            jQuery("#secondarycustpage_custom_record").parent().hide();
        }

        function showButton() {
            jQuery("#custpage_custom_record").parent().show();
            jQuery("#secondarycustpage_custom_record").parent().show();

        }


        function showLoader(printtext) {
            var css = "body.modal-open { overflow: hidden !important; } .custom-overlay { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 1000; display: none; opacity: 0; background: rgba(0, 0, 0, 0.1); transition: opacity 500ms; } .custom-overlay.show { display: block; opacity: 1; } .modal {width: 300px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 20px; border-radius: 5px; background: #fff; } .spinner { box-sizing: border-box; width: 45px; height: 45px; margin: 15px auto; border-radius: 50%; border-top: 4px solid rgba(96, 119, 153, 1.0); border-right: 4px solid rgba(96, 119, 153, 0.0); border-bottom: 4px solid rgba(96, 119, 153, 1.0); border-left: 4px solid rgba(96, 119, 153, 1.0); animation: spinner 1s linear infinite; } .step { width: 100%; margin-top: 30px; margin-bottom: 15px; text-transform: capitalize; text-align: center; font-size: 18px; color: rgba(0, 0, 0, 0.8);} @keyframes spinner { to { transform: rotate(360deg); } }";

            var style = document.createElement("style");
            style.type = "text/css";
            style.appendChild(document.createTextNode(css));

            var head = document.getElementsByTagName("head")[0];
            head.appendChild(style);

            var overlay = document.createElement("div");
            overlay.className = "custom-overlay";

            var modal = document.createElement("div");
            modal.className = "modal";
            modal.innerHTML = '<div class="spinner"></div>';

             step = document.createElement("p");
            step.className = "step";
            step.innerHTML = "Please Wait.....Page Will be reloaded automatically."+" \nProcessing percent completed is "+ printtext;

            modal.appendChild(step);
            overlay.appendChild(modal);

            var body = document.getElementsByTagName("body")[0];
            body.appendChild(overlay);

            body.classList.add("modal-open");
            overlay.classList.add("show");
        }

        function hideLoader() {
            jQuery(".custom-overlay").remove();
            // document.body.classList.remove("modal-open");
            // document
            //     .getElementsByClassName("custom-overlay")[0]
            //     .classList.remove("show");
        }

        function validateData(data) {
            if (data != undefined && data != null && data != "") {
                return true;
            } else {
                return false;
            }
        }

        function isNotEmpty(obj) {
            return obj && JSON.stringify(obj) != "{}";
        }


        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord,
            createHeaderAndSublistRecord: createHeaderAndSublistRecord,
            validateLine: validateLine,
            validateField: validateField
        };
    });