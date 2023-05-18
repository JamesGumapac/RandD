/**
 *    Copyright (c) 2022, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record'],
    /**
     * @param {record} record
     */
    function (record) {

        function beforeSubmit(scriptContext) {

            if (scriptContext.type == scriptContext.UserEventType.CREATE) {
                var InvAdjRec = scriptContext.newRecord;

                //get the Division of the first line
                //iterate the SO lines and set if Dropship line
                var lineCount = InvAdjRec.getLineCount({sublistId: 'inventory'});

                for (var lineNum = 0; lineNum < lineCount; lineNum++) {
                    var lineDepartment = InvAdjRec.getSublistValue({
                        sublistId: 'inventory',
                        fieldId: 'department',
                        line: lineNum
                    });

                    if (lineDepartment){
                        break;
                    }
                }

                log.debug({title: 'beforeSubmit', details: 'lineDepartment:' + lineDepartment});

                if (lineDepartment) {
                    InvAdjRec.setValue({
                        fieldId: 'department',
                        value: lineDepartment
                    });
                }
            }

        }


        return {
            beforeSubmit: beforeSubmit

        };

    });
