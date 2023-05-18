/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/record'],
    /**
     * @param {record} record
     */
    (record) => {

        const pageInit = (scriptContext) => {

            var currentRecord = scriptContext.currentRecord;
            var stUrlRef = window.location.href;
            var stUrlParam = stUrlRef.split("&bill=");

            if (stUrlParam[1]) {
                var intVendorBillId = stUrlParam[1].split("&");
                log.debug('intVendorBillId', intVendorBillId[0]);
                var objVendorBill = record.load({
                    type: record.Type.VENDOR_BILL,
                    id: intVendorBillId[0]
                });
                var intPaymentMethod = objVendorBill.getValue({
                    fieldId: 'custbody_bill_payment_method'
                });
                log.debug('intPaymentMethod', intPaymentMethod);
                currentRecord.setValue({
                    fieldId: 'custbody_bill_payment_payment_method',
                    value: intPaymentMethod
                });
            }
        }

        const fieldChanged = (scriptContext) => {

            var currentRecord = scriptContext.currentRecord;
            var sublistName = scriptContext.sublistId;
            var sublistFieldName = scriptContext.fieldId;
            var line = scriptContext.line;

            if (sublistName === 'apply' && sublistFieldName === 'apply') {

                var blApply = currentRecord.getCurrentSublistValue({
                    sublistId: 'apply',
                    fieldId: 'apply'
                });

                if (blApply) {

                    var intInternalId = currentRecord.getSublistValue({
                        sublistId: 'apply',
                        fieldId: 'internalid',
                        line: line
                    });

                    var stTranType = currentRecord.getSublistValue({
                        sublistId: 'apply',
                        fieldId: 'trantype',
                        line: line
                    });

                    if (stTranType === 'VendBill') {

                        var objVendorBill = record.load({
                            type: record.Type.VENDOR_BILL,
                            id: intInternalId
                        });
                        var intPaymentMethod = objVendorBill.getValue({
                            fieldId: 'custbody_bill_payment_method'
                        });

                        log.debug('intPaymentMethod', intPaymentMethod);
                        if (intPaymentMethod) {
                            currentRecord.setValue({
                                fieldId: 'custbody_bill_payment_payment_method',
                                value: intPaymentMethod
                            });
                        }
                    }
                }
            }
        }

        return { pageInit, fieldChanged }
    });