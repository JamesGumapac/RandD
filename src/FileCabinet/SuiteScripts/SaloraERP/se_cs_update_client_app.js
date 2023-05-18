/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord'],
    function (url, currentRecord) {
        
        const scriptId = "customscript_se_sl_update_client_app_sub"
        const deploymentId = "customdeploy_se_sl_update_client_app_sub"
        
        
        
        function pageInit(context) {
        
        }
        function goBack() {
            let URL = url.resolveScript({
                scriptId: scriptId,
                deploymentId: deploymentId
            });
            window.onbeforeunload = null
            console.log(URL)
            window.open(URL, "_self");
            
        }
        
      
        return {
            
            pageInit: pageInit,
            goBack: goBack
        };
        
    });