/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */


/**
 * Version    Date            Author                Remarks
 * 1.0      27 Apr 2022	     MuzasarAli			Library for Creating ASM WO Custom records
 *          19 Dec 2022       Harsha            Commenting the makerequest function that create custom record.
 */

define(["N/record", "N/search",'N/url','N/https','N/ui/dialog'],
    function (record, search,url,https,dialog) {

        function pageInit(context) {
            //console.log('Ali test');
        }

        function createOperationRecClientCall(woID) {
            try {
                //alert('test');
                console.log('test');
			    jQuery('#tbl_custpage_create_operation').parent().hide()

                var temp = searchVTwoCustomRecords(woID);
                log.debug("temp result",temp);
                if(temp)
                {
                    var set_status = record.submitFields({
                        type: record.Type.WORK_ORDER,
                        id: woID,
                        values: {
                            custbody_cntm_asm_v2_wo_status: 2
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields : true
                        }
                    });
                    log.debug("Status set to in progress",set_status)
                }
                else
                {

                    var set_status = record.submitFields({
                        type: record.Type.WORK_ORDER,
                        id: woID,
                        values: {
                            custbody_cntm_asm_v2_wo_status: 1
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields : true
                        }
                    });
                    log.debug("Status set to ready",set_status)
                }

               // setTimeout(function(){
                //   makeRequest(woID)
                // }, 100);
                

                dialogAlert();
                setTimeout(function(){
                    location.reload();    
                }, 3000);
                

            } catch (error) {
                console.log('error',error)
            }
        }

        function makeRequest(woID){
            var suitletURL = url.resolveScript({
                scriptId          : 'customscript_cntm_sl_asm_create_wo_rec',
                deploymentId      : 'customdeploy_cntm_sl_asm_create_wo_rec',
                params: {i_woid:woID},
                returnExternalUrl : true

           });      
            
            var response = https.get({
                url: suitletURL,
           });
           log.debug('response', response.body);
            
        }

        function dialogAlert () {
            var options = {
                title: 'Message',
                message: 'Please wait, page will reload...'
             };
    
            dialog.alert(options);
        };

        function  searchVTwoCustomRecords(woID){
                try{

                    var customrecord_cntm_client_app_asm_oper_sSearchObj = search.create({
                        type: "customrecord_cntm_client_app_asm_oper_s",
                        filters:
                        [
                           ["custrecordcntm_client_asm_wo_ref","anyof","1106245"]
                        ],
                       
                     });
                     var searchResultCount = customrecord_cntm_client_app_asm_oper_sSearchObj.runPaged().count;
                     log.debug("customrecord_cntm_client_app_asm_oper_sSearchObj result count",searchResultCount);
                    if(searchResultCount<=0)
                    return false;
                    else
                    return true;



                }
                catch(error){log.error("Error in searchVTwoCustomRecords function ",error)}
        };
        return {
            pageInit: pageInit,
            createOperationRecClientCall: createOperationRecClientCall

        }
    });
