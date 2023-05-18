/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @filename      Cntm ST imported Employee Expense.js
 * @scriptname     Cntm ST imported Employee Expense
 * @ScriptId      customscript_cntm_st_imported_emp_exp
 * @author        Vishal Naphade
 * @email         vishal.naphade@gmail.com
 * @date           01-10-2022
 * @description    Imported Employee Expense suitelet

 
 * Copyright 2020, Centium Consulting its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 * Module Description
 * 
 * Sr. No   	 Date           	  Author                  	Remarks
 *  1          01-10-2022        Vishal Naphade         
 *  2          07-10-2022        Vishal Naphade           Employee Centric change  
 */

define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/redirect', 'N/url', 'N/format', 'N/runtime'],

    function(ui, search, record, redirect, url, format, runtime) {

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
                if (context.request.method === 'GET') {

                    // var tool_num = 3003190;
                    var tool_num = 43022;
                    var item = 157965;

                    var final_obj = new Object();
                    var itemFieldLookUp = search.lookupFields({
                        type: "item",
                        id: item,
                        columns: ["itemid"],
                    });
                    log.debug("itemFieldLookUp :", itemFieldLookUp);

                    var itemName = itemFieldLookUp.itemid;
                    log.debug("_itemName", itemName)

                    var bomSearchObj = search.create({
                        type: "bom",
                        filters: [
                            ["custrecord_cntm_tool_number", "anyof", tool_num],
                            "AND", ["custrecord_cntm_fab_rec", "noneof", "@NONE@"]
                            /*
                             * , "AND", [
                             * "custrecord_cntm_boards_per_panel",
                             * "equalto",
                             * boardsPerPanel ]
                             */
                        ],
                        columns: [
                            search.createColumn({
                                name: "name",
                                label: "Name",
                            }),
                            search.createColumn({
                                name: "internalid",
                              //  sort: search.Sort.ASC,
                               sort: search.Sort.DESC,
                                label: "Internal ID",
                            }),
                            search.createColumn({
                                name: "custrecord_cntm_boards_per_panel",
                                label: "Boards Per Panel",
                            }),
                            search.createColumn({
                                name: "restricttoassemblies",
                                label: "Restrict To Assemblies",
                            }),
                            search.createColumn({
                                name: "name",
                                label: "Name",
                            }),
                        ],
                    });
                    var searchResultCount = bomSearchObj.runPaged().count;
                    log.debug("bomSearchObj result count", searchResultCount);


                    var parentItem, parentBOM;
                    var isParentItemFound = false;
                    if (searchResultCount > 0) {
                        bomSearchObj.run().each(function(result) {
                            // .run().each has a limit of 4,000 results
                            var obj = {};
                            obj.bomName = result.getValue({
                                name: "name",
                            });
                            obj.item = result.getValue({
                                name: "restricttoassemblies",
                            });
                            log.debug("obj.item", obj.item);
                            obj.isFA = false;
                            if (obj.item == itemName) obj.isFA = true;

                            log.debug("parentBOM ", parentBOM);
                            log.debug("isParentItemFound", isParentItemFound);
                            if (parentBOM && isParentItemFound == false) {
                                log.debug('--------START----------')
                                log.debug('parentItem :', parentItem);

                                var parentSubAssembly = parentItem ? parentItem.split("-")[1].split("_")[0] : '';
                                log.debug('parentSubAssembly :', parentSubAssembly);
                                var childSubAssembly = obj.item.split("-")[1].split("_")[0];
                                log.debug('childSubAssembly :', childSubAssembly);
                                log.debug('childSubAssembly type :', typeof childSubAssembly);

                                // if ((isMloItem == true || parentSubAssembly == "SM") && childSubAssembly != "SM") {
                           //     if ((parentSubAssembly == "SM") && childSubAssembly != "SM" && isNaN(childSubAssembly)) {
                               if ((parentSubAssembly == "SM") && childSubAssembly != "SM") {
                                    log.debug('---CONDITIOON----')
                                    obj.parentItem = parentItem;
                                    isParentItemFound = true;
                                }
                                log.debug('--------END----------')

                            }
                            parentItem = obj.item;
                            parentBOM = obj.bomName;
                            final_obj[obj.item] = obj;
                            log.audit('obj :', obj)
                            return true;
                        });

                    }
                    log.audit({
                        title: "final_obj",
                        details: final_obj
                    })
                }

            } catch (e) {
                log.error('Error in onRequest', e);
            }
        }



        function validateData(data) {
            if (data != undefined && data != null && data != '') {
                return true;
            } else {
                return false;
            }
        }

        return {
            onRequest: onRequest
        };

    });