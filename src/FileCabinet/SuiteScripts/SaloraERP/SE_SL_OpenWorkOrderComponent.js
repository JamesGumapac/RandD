/**
 *@NApiVersion 2.1
*@NScriptType Suitelet
*/
define(['N/ui/serverWidget', 'N/search', 'N/runtime'], function (serverWidget, search, runtime) {

    let scriptObj = runtime.getCurrentScript();

    const onRequest = context => {
        const { request, response } = context;
        let params = request.parameters;
        try {

            //Creation of Form
            let form = serverWidget.createForm({
                title: 'Open WO Component/Lot'
            });

            let stItemNumber = form.addField({
                id: 'custpage_itemnum',
                type: serverWidget.FieldType.TEXT,
                label: 'Item #'
            });

            let stLotNumber = form.addField({
                id: 'custpage_lotnum',
                type: serverWidget.FieldType.TEXT,
                label: 'Serial/Lot #'
            });

            let stBinNumber = form.addField({
                id: 'custpage_binnum',
                type: serverWidget.FieldType.TEXT,
                label: 'Bin #'
            });

            //Sublist Creation
            let sublist = form.addSublist({
                id: 'custpage_sublist',
                type: serverWidget.SublistType.LIST,
                label: 'Work Order Issue'
            });

            form.addSubmitButton({
                label: 'Filter'
            });

            if (context.request.method == 'GET') {

                //Prepare Saved Search Data and Add to Sublist
                let objSavedSearch = getSavedSearches();
                let objWorkOrderDetails = {};
                objWorkOrderDetails = JSON.parse(getWorkOrderSearchDetails());
                let savedSearchResults = getSearchResults(objSavedSearch, objWorkOrderDetails);
                writeSublistData(savedSearchResults, sublist);

                context.response.writePage({
                    pageObject: form
                });
            }
            else {
                let itemNumber = params.custpage_itemnum;
                let lotNumber = params.custpage_lotnum;
                let binNumber = params.custpage_binnum;

                stItemNumber.defaultValue = itemNumber;
                stLotNumber.defaultValue = lotNumber;
                stBinNumber.defaultValue = binNumber;

                let objSavedSearch = getSavedSearches();
                if (itemNumber || lotNumber || binNumber) {
                    let arrSavedSearchFilters = objSavedSearch.filterExpression;

                    if (itemNumber) {
                        arrSavedSearchFilters.push('AND', ["name", "is", itemNumber]);
                    }
                    if (lotNumber) {
                        arrSavedSearchFilters.push('AND', ["transaction.serialnumber", "is", lotNumber]);
                    }
                    if (binNumber) {
                        arrSavedSearchFilters.push('AND', ["transaction.binnumber", "is", binNumber]);
                    }

                    objSavedSearch.filterExpression = arrSavedSearchFilters;
                }
                let objWorkOrderDetails = {};
                objWorkOrderDetails = JSON.parse(getWorkOrderSearchDetails());
                let savedSearchResults = getSearchResults(objSavedSearch, objWorkOrderDetails);
                writeSublistData(savedSearchResults, sublist);

                context.response.writePage({
                    pageObject: form
                });
            }
        }

        catch (ex) {
            log.error('ERROR', 'An unexpected error occured. Please contact your NetSuite Administrator. For more details see: '
                + ex);
            throw 'An unexpected error occured. Please contact your NetSuite Administrator. For more details see: ' + ex;
        }

    }



    const getSavedSearches = () => {
        let inventoryitemSearchObj = search.create({
            type: "item",
            filters:
                [
                    ["type", "anyof", "InvtPart", "Assembly"],
                    "AND",
                    ["department", "anyof", "1"],
                    "AND",
                    ["transaction.type", "anyof", "WOIssue"],
                    "AND",
                    ["transaction.mainline", "is", "F"],
                    "AND",
                    ["formulanumeric: CASE WHEN {transaction.quantity} > 0 THEN 1 ELSE 0 END ", "equalto", "1"]
                ],
            columns:
                [
                    search.createColumn({ name: "itemid", label: "Name" }),
                    search.createColumn({
                        name: "location",
                        join: "transaction",
                        label: "Location"
                    }),
                    search.createColumn({
                        name: "tranid",
                        join: "transaction",
                        sort: search.Sort.DESC,
                        label: "WOI #"
                    }),
                    search.createColumn({
                        name: "createdfrom",
                        join: "transaction",
                        label: "Created From"
                    }),
                    search.createColumn({
                        name: "serialnumber",
                        join: "transaction",
                        label: "Transaction Serial/Lot Number"
                    }),
                    search.createColumn({
                        name: "binnumber",
                        join: "transaction",
                        label: "Transaction Bin Number"
                    }),
                    search.createColumn({
                        name: "formulanumeric",
                        formula: "CASE WHEN {transaction.serialnumber} IS NULL THEN {transaction.binnumberquantity} ELSE {transaction.serialnumberquantity} END",
                        label: "Quantity"
                    })
                ]
        });

        return inventoryitemSearchObj
    }

    const getWorkOrderSearchDetails = () => {
        let objWorkOrderDate = {};
        let objWorkOrderSearch = search.create({
            type: "transaction",
            filters:
                [
                    ["status", "anyof", "WorkOrd:D"],
                    "AND",
                    ["mainline", "is", "T"]
                ],
            columns:
                [
                    search.createColumn({ name: "internalid", label: "Internal ID" }),
                    search.createColumn({ name: "entity", label: "Name" }),
                    search.createColumn({ name: "statusref", label: "Status" })
                ]
        });
        getAllSSResult(objWorkOrderSearch.run()).forEach((result) => {
            let intInternalId = result.getValue({ name: "internalid" });

            objWorkOrderDate[intInternalId] = {
                internalId: intInternalId,
                entityName: (result.getText({ name: "entity" }) || ''),
                status: (result.getText({ name: "statusref" }) || '')
            };
            return true;
        });

        return JSON.stringify(objWorkOrderDate)
    }

    const getSearchResults = (objSavedSearch, objWorkOrderDetails) => {
        let objItemData = [];

        getAllSSResult(objSavedSearch.run()).forEach((result) => {

            let intCreatedById = result.getValue({ name: "createdfrom", join: "transaction" });

            if (objWorkOrderDetails.hasOwnProperty(intCreatedById)) {
                obj = {}
                obj.itemid = result.getValue({ name: "itemid" });
                obj.inventorynumber = result.getValue({ name: "serialnumber", join: "transaction" });
                obj.location = result.getText({ name: "location", join: "transaction" });
                obj.customer = objWorkOrderDetails[intCreatedById].entityName;
                obj.tranid = result.getValue({ name: "tranid", join: "transaction" });
                obj.woid = result.getText({ name: "createdfrom", join: "transaction" });
                obj.wostatus = objWorkOrderDetails[intCreatedById].status;
                obj.binnumber = result.getValue({ name: "binnumber", join: "transaction" });
                obj.quantity = result.getValue({ name: "formulanumeric" });

                objItemData.push(obj)
            }
            return true
        });

        return objItemData
    }


    const writeSublistData = (savedSearchResults, sublist) => {
        sublist.addField({
            id: 'custcol_itemid',
            type: serverWidget.FieldType.TEXT,
            label: 'Item'
        });
        sublist.addField({
            id: 'custcol_inventorynumber',
            type: serverWidget.FieldType.TEXT,
            label: 'Serial/Lot Number'
        });
        sublist.addField({
            id: 'custcol_location',
            type: serverWidget.FieldType.TEXT,
            label: 'Location'
        });
        sublist.addField({
            id: 'custcol_customer',
            type: serverWidget.FieldType.TEXT,
            label: 'Customer'
        });
        sublist.addField({
            id: 'custcol_tranid',
            type: serverWidget.FieldType.TEXT,
            label: 'WOI #'
        });
        sublist.addField({
            id: 'custcol_woid',
            type: serverWidget.FieldType.TEXT,
            label: 'Work Order #'
        });
        sublist.addField({
            id: 'custcol_wostatus',
            type: serverWidget.FieldType.TEXT,
            label: 'Status'
        });
        sublist.addField({
            id: 'custcol_binnumber',
            type: serverWidget.FieldType.TEXT,
            label: 'Bin Number'
        });
        sublist.addField({
            id: 'custcol_quantity',
            type: serverWidget.FieldType.TEXT,
            label: 'Quantity'
        });

        for (let i = 0; i < savedSearchResults.length; i++) {

            sublist.setSublistValue({
                id: 'custcol_itemid',
                line: i,
                value: savedSearchResults[i].itemid || ' '
            });
            sublist.setSublistValue({
                id: 'custcol_inventorynumber',
                line: i,
                value: savedSearchResults[i].inventorynumber || ' '
            });
            sublist.setSublistValue({
                id: 'custcol_location',
                line: i,
                value: savedSearchResults[i].location || ' '
            });
            sublist.setSublistValue({
                id: 'custcol_customer',
                line: i,
                value: savedSearchResults[i].customer || ' '
            });
            sublist.setSublistValue({
                id: 'custcol_tranid',
                line: i,
                value: savedSearchResults[i].tranid || ' '
            });
            sublist.setSublistValue({
                id: 'custcol_woid',
                line: i,
                value: savedSearchResults[i].woid || ' '
            });
            sublist.setSublistValue({
                id: 'custcol_wostatus',
                line: i,
                value: savedSearchResults[i].wostatus || ' '
            });
            sublist.setSublistValue({
                id: 'custcol_binnumber',
                line: i,
                value: savedSearchResults[i].binnumber || ' '
            });
            sublist.setSublistValue({
                id: 'custcol_quantity',
                line: i,
                value: savedSearchResults[i].quantity || ' '
            });
        }

        return true
    }

    const getAllSSResult = searchResultSet => {
        let result = [];
        for (let x = 0; x <= result.length; x += 1000)
            result = result.concat(searchResultSet.getRange(x, x + 1000) || []);
        return result;
    };

    return {
        onRequest: onRequest
    }
});
