/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/record', 'N/url'],
    function (search, record, url) {
        var SUITELET_ID = "customscript_serp_invtransferprntsuite";
        var SUITELET_DEPLOYMENT_ID = "customdeploy_serp_invtransfe";

        /**
         * Returns void
         * @param {object} context
         */
        function beforeLoad(context) {
            if (context.type == context.UserEventType.VIEW) {
                var cr = context.newRecord;
                var scriptFLD, scriptCode;
                var suiteletURL = url.resolveScript({
                    scriptId: SUITELET_ID,
                    deploymentId: SUITELET_DEPLOYMENT_ID
                });
                context.form.addButton({
                    id: 'custpage_invtransferprnt',
                    label: 'Print',
                    functionName: "openPrint"
                });

                scriptFLD = context.form.addField({type: "inlinehtml", id: "custpage_inhtml", label: "html"});
                scriptCode = "function openPrint () {  var url = 'https://'+ window.location.hostname + '" + suiteletURL + "'+'&recid=" + cr.id + "';";
                scriptCode = scriptCode + "  nlOpenWindow(url,'_blank'); } ";

                scriptFLD.defaultValue = "<script>" + scriptCode + "</script>";

            }
        }

        return {
            beforeLoad: beforeLoad
        };
    });