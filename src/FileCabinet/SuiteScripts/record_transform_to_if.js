/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(["N/https", "N/url", "N/record", "N/currentRecord"],

    function (https, url, record, currentRecord) {

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */
        function beforeLoad(scriptContext) {
            debugger;
            try {
                if (scriptContext.type === scriptContext.UserEventType.EDIT) {
                    var form = scriptContext.form;


                    var rec = scriptContext.newRecord;
                    var id = rec.id;
                    log.debug("id", id)


                    var memo = form.getField({
                        id: 'memo'
                    });
                    // var internalid = form.getField({
                    //     id: 'tranid'
                    // });


                    log.debug("memo field", memo)
                    var memoval = memo.defaultValue;
                 
                    log.debug("memo field value", memo.defaultValue)
                    if (memoval == "Embedded Components") {
                        //debugger;
                        var output = url.resolveScript({
                            scriptId: 'customscript_cntm_suitelet_call_in_ue',
                            deploymentId: 'customdeploy_cntm_suitelet_call_deploy1',
                            returnExternalUrl: false
                        });
                        var obj = { "memo": "abcd" }

                        //    function credentials(){
                        //     this.email = "harsha.bhakare@centium.net";
                        //     this.account = "5361187";
                        //     this.password = "harsha";
                        // }
                        // var cred = new credentials();
                        //    var headers = {"User-Agent-x": "SuiteScript-Call",
                        //    "Authorization":  " nlauth_email=" + cred.email +
                        //                     ", nlauth_signature= " + cred.password + ", nlauth_account=" + cred.account,
                        //    "Content-Type": "application/json"};

                        log.debug("url", output)
                        var data = { "id": id };
                        var response = https.post({
                            url: output,
                            body: data,
                            headers: { "Content-Type": "application/json" }
                        });


                        // var getresponse = https.get({
                        //     url: output,
                        //     headers: {"Content-Type": "application/json"}
                        // });
                        // log.debug('get response',getresponse)
                        log.debug("response", response)

                    }
                }


            }
            catch (error) {
                log.error("Error occured", error)
            }


        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {

        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function afterSubmit(scriptContext) {

        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });
