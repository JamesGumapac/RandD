/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 *
 * Script Description:
 * A user event script deployed on sales order record that:
 * - Detects changes on Item Sublist > Expected Ship Date column and updates Ship Date on corresponding Work Order.
 * - Detects changes on Item Sublist > FAB Ship To column and if line Department == 4, updates FAB Ship To on Work Order.
 *
 */
 define(['N/log', 'N/record', 'N/search'],

    function(log, record, search) {

        function getWorkOrderIds(uniqueKey) {
            var searchObj = search.create({
                type: 'workorder',
                filters: [
                    ['type', 'anyof', 'WorkOrd'],
                    'AND',
                    ['custbody_cntm_so_line_unique_key', 'startswith', uniqueKey],
                    'AND',
                    ['mainline', 'is', 'T']
                ],
                columns:[
                    'internalid'
                ]
            });
            var searchRes = searchObj.run().getRange(0, 1000);
            var data = 
                searchRes.map(function (result) {
                    var cols = result.columns;
                    return {
                        woId: result.getValue(cols[0])
                    };
                });
            return data;
        }

        function getLineUniqueKeys(rec, itemCount) {
            var keysArray = [];
            for (var i = 0; i < itemCount; i++) {
                keysArray.push(rec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'lineuniquekey',
                    line: i
                }));
            }
            return keysArray;
        }

        function afterSubmit(context) {
            try{
                var contextType = context.type;
                var oldRec = context.oldRecord;
                var newRec = context.newRecord;

                // Run only on Edit
                if (contextType == context.UserEventType.EDIT) {
                    // Get line count on new record only
                    var itemCount = newRec.getLineCount({
                        sublistId: 'item'
                    });

                    // Get lineuniquekeys
                    var lineUniqueKeys = getLineUniqueKeys(newRec, itemCount);
                    log.debug({ title: 'SO-afterSubmit', details: 'lineUniqueKeys: ' + JSON.stringify(lineUniqueKeys) });

                    // Check if lineUniqueKeys array has values
                    if (lineUniqueKeys.length > 0) {

                        // Loop through old and new sublists using new lineuniquekey values
                        for (var x = 0; x < lineUniqueKeys.length; x++) {
                            var oldLineNumber = oldRec.findSublistLineWithValue({
                                sublistId: 'item',
                                fieldId: 'lineuniquekey',
                                value: lineUniqueKeys[x]
                            });
                            var newLineNumber = newRec.findSublistLineWithValue({
                                sublistId: 'item',
                                fieldId: 'lineuniquekey',
                                value: lineUniqueKeys[x]
                            });

                            log.debug({ title: 'SO-afterSubmit', details: 'Old and new line numbers based on lineUniqueKeys - ' + oldLineNumber + newLineNumber });

                            // Check if both lines are present in old and new record
                            if (newLineNumber > -1 && oldLineNumber > -1) {

                                // Get old and new Expected Ship Date column values
                                var oldExpectedShipDate = oldRec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'expectedshipdate',
                                    line: oldLineNumber
                                });
                                var newExpectedShipDate = newRec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'expectedshipdate',
                                    line: newLineNumber
                                });

                                // Get new Department column value
                                var newDepartment = newRec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'department',
                                    line: newLineNumber
                                });

                                // Get old and new FAB Ship To column values
                                var oldFABShipTo = oldRec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_kms_fab_ship_to',
                                    line: oldLineNumber
                                });
                                var newFABShipTo = newRec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_kms_fab_ship_to',
                                    line: newLineNumber
                                });
                                var newFABShipToText = newRec.getSublistText({
                                    sublistId: 'item',
                                    fieldId: 'custcol_kms_fab_ship_to',
                                    line: newLineNumber
                                });

                                log.debug({ title: 'SO-afterSubmit', details: 'Expected Ship Date values: Old = ' + oldExpectedShipDate + typeof(oldExpectedShipDate) + ' | New = ' + newExpectedShipDate + typeof(newExpectedShipDate) });
                                log.debug({ title: 'SO-afterSubmit', details: 'Department value: ' +  newDepartment });
                                log.debug({ title: 'SO-afterSubmit', details: 'FAB Ship To values: Old = ' + oldFABShipTo + typeof(oldFABShipTo) + ' | New = ' + newFABShipTo + typeof(newFABShipTo) });

                                // Assign flag if changes are detected to update Work Orders
                                var needsUpdate = false;
                                // Assign container for fields and values to be updated
                                var fieldValues = {};

                                // If Expected Ship Date has changed, search for Work Orders with SO Line Unique Key value that starts with current lineuniquekey
                                if (oldExpectedShipDate.toString() != newExpectedShipDate.toString()) {
                                    needsUpdate = true;
                                    fieldValues['custbody_wo_ship_date'] = newExpectedShipDate;
                                }

                                // If FAB Ship To has changed and Department == 4, search for Work Orders with SO Line Unique Key value that starts with current lineuniquekey
                                // 4 == Design
                                if (((oldFABShipTo.toString() != newFABShipTo.toString()) && newDepartment == 4) || newDepartment == 4) {
                                    needsUpdate = true;
                                    fieldValues['custbody_ship_to'] = newFABShipToText;
                                }
                                    
                                if (needsUpdate) {
                                    log.debug({ title: 'SO-afterSubmit', details: 'Update needed as changes were detected.' });
                                    var workOrderIds = getWorkOrderIds(lineUniqueKeys[x]);
                                    log.debug({ title: 'SO-afterSubmit', details: 'workOrderIds: ' + JSON.stringify(workOrderIds) });

                                    // If workOrderIds has values, update each record's Ship Date field (custbody_wo_ship_date) with line 0's Expected Ship Date
                                    if (workOrderIds.length > 0) {
                                        for (var i = 0; i < workOrderIds.length; i++) {
                                            try {
                                                log.debug({ title: 'SO-afterSubmit', details: 'fieldValues: ' + JSON.stringify(fieldValues) });
                                                var updateWO = record.submitFields({
                                                    type: 'workorder',
                                                    id: workOrderIds[i].woId,
                                                    values: fieldValues
                                                });
                                                if (updateWO) {
                                                    log.debug({ title: 'SO-afterSubmit', details: 'workorder updated: ' + updateWO });
                                                }
                                            }
                                            catch (e) {
                                                log.error('ERROR: ',e);
                                            }
                                        }
                                    }
                                }

                                else {
                                    log.debug({ title: 'SO-afterSubmit', details: 'No Update Needeed. No changes on either Expected Ship Date and FAB Ship To column values.' });
                                }
                                
                            }
                        }
                    }
                } // end context type == edit
            }catch(error){
                log.debug("ERROR",error)
            }
        } // end after submit

    return {
        afterSubmit: afterSubmit
    }

});