/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
 define(['N/search', 'N/currentRecord', "N/url"],
 
    function(search,currentRecord,url) 
    {
        
        var record = currentRecord.get();

            function abc()
            {

            }
    
            function pageInit(context) 
            {
                alert("Welcome to RDA")
        
            }
        
            
            function fieldChanged(context)
            {
                debugger
                var currentRec = scriptContext.currentRecord;

                if(context.sublistId == 'routingstep' && context.fieldId == 'custpage_optnnmchecbxfield') 
                {
                               
                    var checbx = currentRec.getCurrentSublistValue({
                       sublistId: 'routingstep',
                       fieldId:'custpage_optnnmchecbxfield'
                    });               

                  if(checbx == 'T')                
                   { 
                       alert("True")
                      
                    }
                    else if(checbx == 'F')
                    {
                        alert("fALSE")
                        return;
                    }

                  //url resolve
                        // var slurl = url.resolveScript
                        // ({
                        // scriptId: 'customscriptcntm_sb_wes_suitelet_try',
                        // deploymentId: 'customdeploycntm_sb_wes_suitelet_deploy',
                        // // params: {rectype: record.type, recid: record.id, item: itemname}
                        // params : {
                        //          'itemID' : itemname,
                        //          'itemtxt': itemtext
                        //          }
                                 
                        // });
                      
                        // window.open(slurl,'_self', false);
                       // window.location.open(slurl);
                }
            }
        
    
            function saveRecord(context) {
        
            }
        
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,      
            saveRecord: saveRecord,
            abc: abc
        };
        
    });
    




