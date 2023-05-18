/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/record", "N/https"],

    function (record, https) {

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

             //   var fieldarr = ["custrecord_cntm_asm_woc_qty_v2", "custrecord_cntm_asm_scrap_qty_v2", "custrecord_cntm_client_app_asm_serial_v2"]
               
                if (context.request.method == 'GET') {
                    context.response.write("Custom record creation in process")
                   

                    var params = context.request.parameters;
                    // log.debug('params', params);

                    create_record(params);

                    function create_record(params) {
                      
                       // var paramsarr = [];

                        // var wo_qty = params.wo_qty;
                        // paramsarr.push(wo_qty);
                        // var scrap_qty = params.scrap_qty;
                        // paramsarr.push(scrap_qty);
                        // var serialno = params.serialno;
                        // paramsarr.push(serialno);

                        var jsondata = {
                            "custrecord_cntm_asm_woc_qty_v2":"params.wo_qty",
                            "custrecord_cntm_asm_scrap_qty_v2":"params.scrap_qty",
                            "custrecord_cntm_client_app_asm_serial_v2":"serialno",
                            "custrecord_cntm_client_app_asm_prty_v2":"priority"
                        }

                        var rec = record.create({
                            type: 'customrecord_cntm_asm_client_app_v2',
                            isDynamic: true
                        });
                        var obj;
                        Object.keys(jsondata).forEach(function(key){
                            rec.setValue({
                                fieldId: key,
                                value: jsondata[key]
                            });
  
                          });

                        }
                        // for (var i = 0; i < 3; i++) {
                        //     rec.setValue({
                        //         fieldId: fieldarr[i],
                        //         value: paramsarr[i]
                        //     });
                        // }
                        let recordId = rec.save({
                            enableSourcing: false,
                            ignoreMandatoryFields: false
                        });
                        log.debug("record created successfully..");
                    }
                
            }
            catch (error) {
                log.error("error in function", error);
            }
        }
        return {
            onRequest: onRequest
        }
    });
