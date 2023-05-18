/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @filename       Cntm CS operation alert
 * @scriptname    
 * @ScriptId      
 * @author        Vishal Naphade
 * @email         vishal.naphade@centium.net
 * @date           
 * @description   
 
 * Copyright 2020, Centium Consulting its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 * Module Description
 * 
 * Sr. No   	 Date           	  Author                  	Remarks
 * 1	      	23 March 2022 		  Vishal Naphade    	 -   
 */
define([
        "N/record",
        "N/search",
        "N/runtime",
        "N/https",
        "N/currentRecord",
        "N/url",
        "N/ui/dialog",
    ],
    /**
     * @param {record}
     *            record
     * @param {search}
     *            search
     */
    function(record, search, runtime, https, currentRecord, url, dialog) {
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
        function pageInit(scriptContext) {
            try {
                // if (scriptContext.currentRecord.type == "customrecord_cntm_clientapp_header") {

                // }
                if (scriptContext.currentRecord.type == "customrecord_cntm_clientappsublist") {
                    try {
                        sessionStorage.setItem("woc_id", scriptContext.currentRecord.getValue({ fieldId: "custrecord_cntm_cso_wocnumber" }));
                    } catch (error) {
                        console.log('Sublist page init :', error)
                    }

                }
            } catch (error) {
                console.log('Errror in page in it :', error)
            }
        }

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object}
         *            scriptContext
         * @param {Record}
         *            scriptContext.currentRecord - Current form record
         * @param {string};
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

        function lineInit(scriptContext) {
            try {
                if (scriptContext.currentRecord.type == "customrecord_cntm_clientapp_header") {
                    var lineWOC = scriptContext.currentRecord.getCurrentSublistValue("recmachcustrecord_cntm_cso_parentrec", "custrecord_cntm_cso_wocnumber");
                    console.log("lineWOC :", lineWOC);

                    var lineId = scriptContext.currentRecord.getCurrentSublistValue("recmachcustrecord_cntm_cso_parentrec", "id");
                    console.log("lineId :", lineId);

                    if (!sessionStorage.getItem(lineId)) {
                        sessionStorage.setItem(lineId, lineWOC);
                    }
                }
            } catch (error) {
                console.log("Error in line it :", error);
            }
        }

        function validateField(scriptContext) {
            try {
                if (scriptContext.currentRecord.type == "customrecord_cntm_clientapp_header") {

                    if (scriptContext.sublistId == "recmachcustrecord_cntm_cso_parentrec" && (scriptContext.fieldId == "custrecord_cntm_cso_status" || scriptContext.fieldId == "custrecord_cntm_cso_wocnumber")) {
                        // alert('Got it')
                        debugger;
                        var lineStatus = scriptContext.currentRecord.getCurrentSublistValue("recmachcustrecord_cntm_cso_parentrec", "custrecord_cntm_cso_status");
                        console.log("lineStatus :", lineStatus)

                        var lineWOC = scriptContext.currentRecord.getCurrentSublistValue("recmachcustrecord_cntm_cso_parentrec", "custrecord_cntm_cso_wocnumber");
                        console.log("lineWOC :", lineWOC)

                        var lineWO = scriptContext.currentRecord.getCurrentSublistValue("recmachcustrecord_cntm_cso_parentrec", "custrecord_cntm_work_order");
                        console.log("lineWO :", lineWO)

                        var lineOperation = scriptContext.currentRecord.getCurrentSublistValue("recmachcustrecord_cntm_cso_parentrec", "custrecord_cntm_cso_operaton");
                        if (validateData(lineOperation)) {
                            lineOperation = lineOperation.split(" ")[0]
                            console.log("lineOperation :", lineOperation)
                        }

                        var lineLotRecId = scriptContext.currentRecord.getCurrentSublistValue("recmachcustrecord_cntm_cso_parentrec", "custrecord_cntm_lot_record");
                        console.log("lineLotRecId :", lineLotRecId)

                        var lineId = scriptContext.currentRecord.getCurrentSublistValue("recmachcustrecord_cntm_cso_parentrec", "id");
                        console.log("lineId :", lineId);

                        if (checkOperationIsPresent(lineOperation, lineLotRecId, lineWO)) {
                            debugger;
                            alert('Please Check ')
                                // scriptContext.currentRecord.setCurrentSublistValue("recmachcustrecord_cntm_cso_parentrec", "custrecord_cntm_cso_status", );
                            if (scriptContext.fieldId == "custrecord_cntm_cso_status") {
                                scriptContext.currentRecord.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_cntm_cso_parentrec",
                                    fieldId: "custrecord_cntm_cso_status",
                                    value: 4, //1 - pending , 4 - Completed
                                    ignoreFieldChange: true
                                })
                                // return false;
                            }
                            if (scriptContext.fieldId == "custrecord_cntm_cso_wocnumber") {
                                scriptContext.currentRecord.setCurrentSublistValue({
                                    sublistId: "recmachcustrecord_cntm_cso_parentrec",
                                    fieldId: "custrecord_cntm_cso_wocnumber",
                                    value: parseInt(sessionStorage.getItem(lineId)),
                                    ignoreFieldChange: true
                                })
                                return false;
                            }

                        }

                    }
                    return true;
                }
                if (scriptContext.currentRecord.type == "customrecord_cntm_clientappsublist") {
                    if (scriptContext.fieldId == "custrecord_cntm_cso_status" || scriptContext.fieldId == "custrecord_cntm_cso_wocnumber") {

                        debugger;
                        console.log('scriptContext :', JSON.stringify(scriptContext.currentRecord.type))
                        var status = scriptContext.currentRecord.getValue({
                            fieldId: "custrecord_cntm_cso_status",
                        });
                        console.log("status :", status);

                        var woc = scriptContext.currentRecord.getValue({
                            fieldId: "custrecord_cntm_cso_wocnumber",
                        });
                        console.log("woc :", woc);

                        var woId = scriptContext.currentRecord.getValue({
                            fieldId: "custrecord_cntm_work_order",
                        });
                        console.log("woId :", woId);

                        var lotRecId = scriptContext.currentRecord.getValue({
                            fieldId: "custrecord_cntm_lot_record",
                        });
                        console.log("lotRecId :", lotRecId);

                        var operation = scriptContext.currentRecord.getValue({
                            fieldId: "custrecord_cntm_cso_operaton",
                        });
                        if (validateData(operation)) {
                            operation = operation.split(" ")[0]
                            console.log("operation :", operation)
                        }

                        if (checkOperationIsPresent(operation, lotRecId, woId)) {
                            alert('Please Check ')

                            if (scriptContext.fieldId == "custrecord_cntm_cso_status") {
                                debugger
                                scriptContext.currentRecord.setValue({
                                        fieldId: "custrecord_cntm_cso_status",
                                        value: 4, //1 - pending , 4 - Completed
                                        ignoreFieldChange: true
                                    })
                                    // return false;
                            }
                            if (scriptContext.fieldId == "custrecord_cntm_cso_wocnumber") {
                                scriptContext.currentRecord.setValue({
                                    fieldId: "custrecord_cntm_cso_wocnumber",
                                    value: parseInt(sessionStorage.getItem('woc_id')),
                                    ignoreFieldChange: true
                                })
                                return false;
                            }
                        }

                        return true;

                    }

                    return true;
                }
                return true
            } catch (error) {
                console.log("Error in validate fields :", error);
            }
        }

        function checkOperationIsPresent(operation, lotRecId, woId) {
            try {

                var workordercompletionSearchObj = search.create({
                    type: "workordercompletion",
                    filters: [
                        ["type", "anyof", "WOCompl"],
                        "AND", ["mainline", "is", "T"],
                        "AND", ["custbody_cntm_inter_operation", "contains", operation],
                        "AND", ["custbody_cntm_panel_lot", "anyof", lotRecId],
                        "AND", ["createdfrom", "anyof", woId],
                    ],
                    columns: [
                        search.createColumn({ name: "tranid", label: "Document Number" }),
                        search.createColumn({
                            name: "custbody_cntm_startoperation",
                            label: "Starting Operation",
                        }),
                        search.createColumn({
                            name: "custbody_cntm_endoperation",
                            label: "Ending Operation",
                        }),
                        search.createColumn({
                            name: "custbody_cntm_inter_operation",
                            label: "Intermediate Operation",
                        }),
                    ],
                });
                var searchResultCount = workordercompletionSearchObj.runPaged().count;
                log.debug('searchResultCount :', searchResultCount);

                if (searchResultCount > 0) {
                    return true;
                } else {
                    return false;
                }

            } catch (error) {
                console.log("Error in checkOperation :", error);
            }
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
            lineInit: lineInit,
            validateField: validateField,
        };
    });