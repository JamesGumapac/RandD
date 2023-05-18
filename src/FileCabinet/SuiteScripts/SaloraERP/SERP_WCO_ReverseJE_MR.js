/**
 *    Copyright (c) 2022, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/search', 'N/record'],
    function (search, record) {

        function deleteAllJournalWithRef(arrayWCO){
            log.debug({title: 'deleteAllJournalWithWCO', details: 'arrayWCO:' + arrayWCO.toString()});

            if(arrayWCO.length > 0){
                try{
                    var journalentrySearchObj = search.create({
                        type: "journalentry",
                        filters:
                            [
                                ["type","anyof","Journal"],
                                "AND",
                                ["custbody_suitegl_ref","anyof",arrayWCO],
                                "AND",
                                ["mainline","is","T"]
                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "tranid",
                                    summary: "GROUP"
                                }),
                                search.createColumn({
                                    name: "internalid",
                                    summary: "GROUP"
                                })
                            ]
                    });
                    var searchResultCount = journalentrySearchObj.runPaged().count;
                    log.debug({title: 'deleteAllJournalWithWCO', details: 'searchResultCount:' + searchResultCount});

                    if(searchResultCount > 0){
                        journalentrySearchObj.run().getRange({start:0, end: 1000}).forEach(function(result){
                            record.delete({
                                type: 'journalentry',
                                id: result.getValue({
                                    name: 'internalid',
                                    summary: 'GROUP'
                                })
                            })
                        })
                    }
                }catch(error){
                    log.error("ERROR IN DELETING JOURNAL ENTRY WITH WCO",error.message);
                }
            }
        }

    function getInputData() {
        log.debug({title: 'getInputData', details: 'start'});
        // Search all WORK ORDER COMPLETION(WCO's) TODAY with changes in projected value for finished goods account
        var wocSearch = search.load({
            id: 'customsearch_suitegl_reverse_fg_2'
        });

        var arrWOC = [];
        wocSearch.run().each(function(result) {
            arrWOC.push(result.getValue({name: "internalid", summary: "GROUP"}));
            return true;
        });

        //delete JEs
        deleteAllJournalWithRef(arrWOC);

        return wocSearch;

    }

    function map(context) {

        try {
            log.debug({title: 'map', details: 'mapContext.key:' + context.key});
            log.debug({title: 'map', details: 'mapContext.value:' + context.value});

            var searchResult = JSON.parse(context.value);

            var wcoId = searchResult.values["GROUP(internalid)"].value;
            log.debug({title: 'map', details: 'wcoId:' + wcoId});
            var subsidiary = searchResult.values["GROUP(subsidiary)"].value;
            var fgAccount = searchResult.values["GROUP(account)"].value;
            log.debug({title: 'map', details: 'fgAccount:' + fgAccount});
            var division = searchResult.values["GROUP(department)"].value;
            var trandate = new Date(searchResult.values["GROUP(trandate)"]);
            var newValueAmount = Number(searchResult.values["MAX(formulanumeric)"]);
            log.debug({title: 'map', details: 'newValueAmount:' + newValueAmount});
            var location = searchResult.values["GROUP(location)"].value;
            var assemblyItem = searchResult.values["GROUP(item)"].value;
            var workOrder = searchResult.values["GROUP(createdfrom)"].value;
            log.debug({title: 'map', details: 'workOrder:' + workOrder});

            //search for wip acct
            var wipAcct = search.lookupFields({
                type: search.Type.ITEM,
                id: assemblyItem,
                columns:'wipacct'
            });

            log.debug({title: 'map', details: 'wipAcct:' + wipAcct.wipacct[0].value});

            //Create JE
            var journalRec = record.create({
                type: "journalentry",
                isDynamic: true,
                defaultValues: {
                    subsidiary : subsidiary
                }
            });

            suiteGLrefNo = journalRec.setValue({
                fieldId: "custbody_suitegl_ref",
                value: wcoId
            });

            journalRec.setValue({
                fieldId: "trandate",
                value: trandate
            });

            journalRec.setValue({
                fieldId: "approvalstatus",
                value: 2
            });

            //Credit line
            journalRec.selectNewLine({
                sublistId: "line"
            });

            journalRec.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "account",
                value: fgAccount
            });

            journalRec.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "credit",
                value: newValueAmount
            });

            journalRec.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "memo",
                value: "Reversing Entry for WCO"
            });

            journalRec.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "department",
                value: division
            });

            journalRec.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "location",
                value: location
            });

            journalRec.commitLine({
                sublistId: "line",
            });

            // Debit Line
            journalRec.selectNewLine({
                sublistId: "line"
            });

            journalRec.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "account",
                value: wipAcct.wipacct[0].value
            });

            journalRec.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "debit",
                value: newValueAmount
            });

            journalRec.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "memo",
                value: "Reversing Entry for WCO"
            });

            journalRec.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "department",
                value: division
            });

            journalRec.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "location",
                value: location
            });

            journalRec.commitLine({
                sublistId: "line",
            });

            var jeId = journalRec.save();
            log.debug({title: 'map', details: 'jeId:' + jeId});

            context.write({
                key: workOrder  + '|' + fgAccount,
                value: wcoId
            });


        } catch(error){
            log.error("ERROR",error.message);
        }

    }

        function createJournalEntryForWO(workOrder, fgAccount){
            //load search all WCOs for the WO and filter by WO
            log.debug({title: 'createJournalEntryForWO', details: 'start'});
            var searchResultWCO = search.load({
                id: 'customsearch_add_customgl_fg'
            });

            var defaultFilters = searchResultWCO.filters;
            var customFilter = {};
            customFilter = {"name":"createdfrom","operator":"anyof","values":[workOrder],"isor":false,"isnot":false,"leftparens":0,"rightparens":0};

            defaultFilters.push(customFilter);
            searchResultWCO.filters = defaultFilters;

            var arrResultSet = searchResultWCO.run().getRange({
                start: 0,
                end: 1
            });

            var totalWCOAmount = arrResultSet[0].getValue({name: "debitamount", summary: "SUM"});
            log.debug({title: 'createJournalEntryForWO', details: 'totalWCOAmount:' + totalWCOAmount});
            var wipAcct = arrResultSet[0].getValue({name: "account", summary: "GROUP"});
            log.debug({title: 'createJournalEntryForWO', details: 'wipAcct:' + wipAcct});
            var subsidiary = arrResultSet[0].getValue({name: "subsidiary", summary: "GROUP"});
            var division = arrResultSet[0].getValue({name: "department", summary: "GROUP"});
            var location = arrResultSet[0].getValue({name: "location", summary: "GROUP"});

            //delete  existing JEs with WO
            arrWO = [];
            arrWO.push(workOrder);
            deleteAllJournalWithRef(arrWO);

            // Create JE reversal for the WO
            var journalRec = record.create({
                type: "journalentry",
                isDynamic: true,
                defaultValues: {
                    subsidiary : subsidiary
                }
            });

            suiteGLrefNo = journalRec.setValue({
                fieldId: "custbody_suitegl_ref",
                value: workOrder
            });

            journalRec.setValue({
                fieldId: "approvalstatus",
                value: 2
            });

            //Debit line
            journalRec.selectNewLine({
                sublistId: "line"
            });

            journalRec.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "account",
                value: fgAccount
            });

            journalRec.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "debit",
                value: totalWCOAmount
            });

            journalRec.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "memo",
                value: "Custom GL FG"
            });

            journalRec.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "department",
                value: division
            });

            journalRec.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "location",
                value: location
            });

            journalRec.commitLine({
                sublistId: "line",
            });

            // Credit Line
            journalRec.selectNewLine({
                sublistId: "line"
            });

            journalRec.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "account",
                value: wipAcct
            });

            journalRec.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "credit",
                value: totalWCOAmount
            });

            journalRec.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "memo",
                value: "Custom GL FG"
            });

            journalRec.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "department",
                value: division
            });

            journalRec.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "location",
                value: location
            });

            journalRec.commitLine({
                sublistId: "line",
            });

            var jeId = journalRec.save();
            log.debug({title: 'createJournalEntryForWO', details: 'jeId:' + jeId});

        }

        function reduce(context) {
            log.debug({title: 'reduce', details: 'reduceContext.key:' + context.key});
            log.debug({title: 'reduce', details: 'reduceContext.value:' + JSON.stringify(context.values)});

            try {
                var keys = context.key.toString().split('|');
                var workOrderId = keys[0];
                log.debug({title: 'reduce', details: 'workOrderId:' + workOrderId});
                var fgAcct = keys[1];
                log.debug({title: 'reduce', details: 'fgAcct:' + fgAcct});

                createJournalEntryForWO(workOrderId, fgAcct);

            }  catch(error){
                log.error("ERROR",error.message);
            }

        }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce
    }
});