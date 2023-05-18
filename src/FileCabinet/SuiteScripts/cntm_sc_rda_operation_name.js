    /**
     * @NApiVersion 	2.x
     * @NScriptType 	Suitelet
     * @NModuleScope 	SameAccount 
     * @author        	Shweta Badagu
     */

     define(['N/log','N/ui/serverWidget','N/record','N/redirect','N/search'],

     function(log,serverWidget,record,redirect,search) {
         
         function onRequest(scriptContext) {
     
             if(scriptContext.request.method=='GET'){
 
                 var form = serverWidget.createForm({title:'RDA Operation Name List'});  

                 var mrId=scriptContext.request.parameters.mrID;  
                 var LocId=scriptContext.request.parameters.location;  
                 var wcId=scriptContext.request.parameters.wrkcenter;
                 var wcIdname=scriptContext.request.parameters.wrkcentrnm;  
  

                 log.audit("mrId: "+mrId) 
                 log.audit("LocId: "+LocId)
                 log.audit("wcId: "+wcId)
                 log.audit("wcIdNm: "+wcIdname)  

                  

                 var searctext = scriptContext.request.parameters.changeopnmame; 
                 var changedwcId = scriptContext.request.parameters.changewrkcenter; 
                 var changedwcTxt= scriptContext.request.parameters.changewrkcentertext
                 var changedLocId= scriptContext.request.parameters.changelocation; 
               
               
                 log.audit("searctext: "+searctext) 
                 log.audit("changedworkid: "+changedwcId)
                 log.audit("changedwcTxt: "+changedwcTxt)
                 log.audit("changedlocation: "+changedLocId)

                 
                form.clientScriptModulePath = 'SuiteScripts/Cntm_CS_WO Creation.js';

                 var optnmnlist1 = form.addFieldGroup ({                        
                     id : 'custpage_grp1',
                     label : 'Filters'                 
                 });

                 var optnmnlist2 = form.addFieldGroup ({                        
                    id : 'custpage_grp2',
                    label : 'Sublist'                 
                });

                var flagop = form.addField({                    
                    id : 'cutpage_flagop',
                    type : serverWidget.FieldType.TEXT,
                    label : 'Flag',
                    //container:'custpage_grp1'
                });

                flagop.updateDisplayType({
        		    displayType: serverWidget.FieldDisplayType.HIDDEN
        		});

        		flagop.defaultValue ="OpIdmrRecFlag";

                var location = form.addField({                    
                    id : 'cutpage_flaglocation',
                    type : serverWidget.FieldType.TEXT,
                    label : 'Location',
                    //container:'custpage_grp1'
                });
                location.defaultValue = LocId;
                location.updateDisplayType({
        		    displayType: serverWidget.FieldDisplayType.HIDDEN
        		});

                var newlocation = form.addField({                    
                    id : 'cutpage_flaglocation_change',
                    type : serverWidget.FieldType.TEXT,
                    label : 'Location',
                    //container:'custpage_grp1'
                });
                newlocation.defaultValue = changedLocId;
                newlocation.updateDisplayType({
        		    displayType: serverWidget.FieldDisplayType.HIDDEN
        		});
        		
        		

                 //sublist add start
                 var sublist = form.addSublist({
                    id : 'custpage_table',
                    type : serverWidget.SublistType.LIST,
                    label : 'Opernation Name List with WorkCenter Filter'
                    });

                    var checkBox =  sublist.addField({
                        id: 'custpage_checkbox_abch',        
                        label: 'Check Box',
                        type: serverWidget.FieldType.CHECKBOX
                        });

                    //adding sublist fields start                                            
                    var abc = sublist.addField({
                        id: 'custpage_rcord_id',
                        type: serverWidget.FieldType.TEXT,                                                   
                        label: 'Internal ID'
                    });  
                    var abc2 = sublist.addField({
                        id: 'custpage_oprtnname',
                        type: serverWidget.FieldType.TEXT,          
                        label: 'Operation Name'
                    });                  
                    sublist.addField({
                        id: 'custpage_wrk_cntr',
                        type: serverWidget.FieldType.TEXT,                                                   
                        label: 'Work Center'
                    }); 
                    sublist.addField({
                        id: 'custpage_loc_centr',
                        type: serverWidget.FieldType.TEXT,                                                   
                        label: 'Location'
                    });                    
                    //adding sublist fields end

                    var workcenter = form.addField({                    
                        id : 'cutpage_workcenter',
                        type : serverWidget.FieldType.SELECT,
                        label : 'Work Center',
                        container:'custpage_grp1'
                    });

                    var opratnnm = form.addField({                    
                        id : 'cutpage_opratnnm',
                        type : serverWidget.FieldType.INLINEHTML,
                        label : 'Operation Name List',
                        container:'custpage_grp1'
                    });


                  
    
                    
                    
            if(changedwcId != '' && changedwcId != undefined && changedwcId != null)
            {
                //WORK CENTER  START DROPDOWN DISPLAY CHANGED

                var entitygroupSearchObj = search.create({
                    type: "entitygroup",
                    filters:
                    [
                        ["ismanufacturingworkcenter","is","T"]
                    ],
                    columns:
                    [
                        search.createColumn({
                            name: "groupname",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                        search.createColumn({name: "grouptype", label: "Type"}),
                        search.createColumn({name: "owner", label: "Owner"}),
                        search.createColumn({name: "internalid", label: "Internal ID"})
                    ]
                    });
                    var searchResultCount = entitygroupSearchObj.runPaged().count;
                    log.debug("entitygroupSearchObj result count",searchResultCount);

                            workcenter.addSelectOption({
                                value: changedwcId,
                                text: changedwcTxt  
                            });

                            entitygroupSearchObj.run().each(function(result){
                            // .run().each has a limit of 4,000 results
                            var workname = result.getValue({
                                name: "groupname",
                                sort: search.Sort.ASC,
                                label: "Name"
                            });
                          //  log.debug("workname: "+workname);
                            var workid = result.getValue({name: "internalid", label: "Internal ID"});

                            workcenter.addSelectOption({
                                value: workid,
                                text: workname  
                         })
                     return true;
                    });
                    // workcenter.updateDisplayType({
                    //     displayType: serverWidget.FieldDisplayType.HIDDEN
                    // });
                }

                 //WORK CENTER  END DROPDOWN DISPLAY CHANGED

                if(wcId != '' && wcId != undefined && wcId != null)
                 {
                     //WORK CENTER  START DROPDOWN DISPLAY  NORMAL
     
                     var entitygroupSearchObj = search.create({
                         type: "entitygroup",
                         filters:
                         [
                             ["ismanufacturingworkcenter","is","T"]
                         ],
                         columns:
                         [
                             search.createColumn({
                                 name: "groupname",
                                 sort: search.Sort.ASC,
                                 label: "Name"
                             }),
                             search.createColumn({name: "grouptype", label: "Type"}),
                             search.createColumn({name: "owner", label: "Owner"}),
                             search.createColumn({name: "internalid", label: "Internal ID"})
                         ]
                         });
                         var searchResultCount = entitygroupSearchObj.runPaged().count;
                         log.debug("entitygroupSearchObj result count",searchResultCount);
                                 workcenter.addSelectOption({
                                     value: wcId,
                                     text: wcIdname              
                                 });
                                 entitygroupSearchObj.run().each(function(result){
                                 // .run().each has a limit of 4,000 results
                                 var workname = result.getValue({
                                     name: "groupname",
                                     sort: search.Sort.ASC,
                                     label: "Name"
                                 });
                                 //log.debug("workname: "+workname);
     
                                
                                var workid = result.getValue({name: "internalid", label: "Internal ID"});
                               // log.debug("workname: "+workname);

                                workcenter.addSelectOption({
                                    value: workid,
                                    text: workname  
                                });

                          return true;
                         });

                        
                     }
     
                      //WORK CENTER  END DROPDOWN DISPLAY NORMAL

                 //Search Bar start


        //TYPE SELECT START DROPDOWN DISPLAY NORMAL
          log.audit("sublist home page: "+wcId+LocId);     
        if(wcId != '', LocId != '' || wcId != undefined, LocId != undefined || wcId != null, LocId != null)
        {
                var optionValues = '';
                var tempString = '';
              // var tempString1 = '<option value="' +data+ '"> </option>';
                var mysearch = search.create
                ({
                    type: "customrecord_gate_times_and_operations_",
                    filters:
                    [
                       ["custrecord_custpage_location_mr","anyof", LocId],
                       "AND", 
                       ["custrecord_work_center_","anyof",wcId]
                    ],
                    columns:
                    [
                    search.createColumn({name: "custrecord_gate_", label: "Gate ID"}),
                    search.createColumn({name: "custrecord_name_", label: "Name"}),
                    search.createColumn({
                        name: "formulatext",                        
                        formula: "CASE WHEN {custrecord_name_} != ' ' THEN ( {custrecord_gate_} || '-' || {custrecord_name_} || '' ) ELSE 'NULL' END",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({name: "internalid", label: "Internal ID"}),
                    search.createColumn({name: "custrecord_work_center_", label: "Work Center"}),
                    search.createColumn({name: "custrecord_custpage_location_mr", label: "Location"})                    
                    ]
                });
                var mysearchcount = mysearch.runPaged().count;
                log.debug("mysearch result count",mysearchcount);   
                var line = 0;         
                mysearch.run().each(function(result){
                    // .run().each has a limit of 4,000 results
                    var data = result.getValue({name: 'formulatext'});  
                    var recordid  = result.getValue({name: "internalid", label: "Internal ID"});
                    var wrkcnt = result.getText({name: "custrecord_work_center_", label: "Work Center"});
                    var locatn = result.getText({name: "custrecord_custpage_location_mr", label: "Location"});

                        sublist.setSublistValue({
                            id: 'custpage_rcord_id',
                            line: line,
                            value: recordid
                        });
                       // log.audit(recordid);
                        sublist.setSublistValue({
                            id: 'custpage_oprtnname',
                            line: line,
                            value: data
                        });
                      //  log.audit(data);
                        sublist.setSublistValue({
                            id: 'custpage_wrk_cntr',
                            line: line,
                            value: wrkcnt
                        });
                    //    log.audit(wrkcnt);
                        sublist.setSublistValue({
                            id: 'custpage_loc_centr',
                            line: line,
                            value: locatn
                        });
                     //   log.audit(locatn);
                        //var tempString = '<option value="' +data+ '"> </option>';
                        //var tempString = '<option value="' +data+ '">' +recordid+ '</option>';
                         var tempString = '<option value="' +data+ '"> </option>';
                    //    // <option data-value="42" value="The answer">
                        optionValues += tempString;
   
                    line++
                    return true;
                });
                //top: 133px; left: 7.98611px;
                var htmlStr = '';
                    htmlStr += '<html>';
                    htmlStr +='<body>';
                    htmlStr += '<p style="padding-top: 14px; font-color:#52595D; font-size:11px;">\n';
                    htmlStr +='<label for="customerSelect">OPERATION NAME</label>';
                    htmlStr += "</p>\n";
                   // htmlStr +='<input list="customer" value="' +tempString1+ '" name="customerSelect" id="customerSelect" style="top: 133px;" style="left: 7.98611px;">\n';
                    htmlStr +='<input list="customer" name="customerSelect" id="customerSelect" style="width: 300px; height: 26px;">\n';
                    htmlStr +='<datalist id="customer">';
                    htmlStr +=optionValues;
                    htmlStr +='</datalist>';
                    htmlStr +='</body>';
                    htmlStr += '</html>';                          
                    opratnnm.defaultValue = htmlStr;


                

        }//if end

         //TYPE SELECT END DROPDOWN DISPLAY NORMAL



         //TYPE SELECT START DROPDOWN DISPLAY CHANGED
       // else if(changedwcId != '', changedLocId != '',searctext != '' && changedwcId != undefined, changedLocId != undefined,searctext != undefined && changedwcId != null, changedLocId != null,searctext != null)
       log.audit("sublist after search page: "+changedwcId+changedLocId+searctext); 
       if(changedwcId != '', searctext != '' || changedwcId != undefined, searctext != undefined || changedwcId != null, searctext != null)

        {

                var optionValues1 = '';
                var optionValues2 = '';
         
                var tempString1 = searctext
                
                var searchTextArray = searctext.split('-');
                var gateid = searchTextArray[0];
                var nameid = searchTextArray[1];
              //  log.audit(gateid);
              //  log.audit(nameid);

               // optionValues1 += tempString1;
                var mysearch = search.create
                ({
                    type: "customrecord_gate_times_and_operations_",
                    filters:
                    [
                       ["custrecord_custpage_location_mr","anyof", changedLocId],
                       "AND", 
                       ["custrecord_work_center_","anyof", changedwcId],
                       "AND", 
                       ["formulatext:  ( {custrecord_gate_} || '-' || {custrecord_name_} || '' )","contains",searctext]
  
                    ],
                    columns:
                    [
                    search.createColumn({name: "custrecord_gate_", label: "Gate ID"}),
                    search.createColumn({name: "custrecord_name_", label: "Name"}),
                    search.createColumn({
                        name: "formulatext",                        
                        formula: "CASE WHEN {custrecord_name_} != ' ' THEN ( {custrecord_gate_} || '-' || {custrecord_name_} || '' ) ELSE 'NULL' END",
                        label: "Formula (Text)"
                    }),
                    search.createColumn({name: "internalid", label: "Internal ID"}),
                    search.createColumn({name: "custrecord_work_center_", label: "Work Center"}),
                    search.createColumn({name: "custrecord_custpage_location_mr", label: "Location"})                    
                    ]
                });
                var mysearchcount = mysearch.runPaged().count;
                log.debug("mysearch result count",mysearchcount);   
                var line = 0;         
                mysearch.run().each(function(result){
                    // .run().each has a limit of 4,000 results
                    var data = result.getValue({name: 'formulatext'});  
                    var recordid  = result.getValue({name: "internalid", label: "Internal ID"});
                    var wrkcnt = result.getText({name: "custrecord_work_center_", label: "Work Center"});
                    var locatn = result.getText({name: "custrecord_custpage_location_mr", label: "Location"});

                        sublist.setSublistValue({
                            id: 'custpage_rcord_id',
                            line: line,
                            value: recordid
                        });
                     //   log.audit(recordid);
                        sublist.setSublistValue({
                            id: 'custpage_oprtnname',
                            line: line,
                            value: data
                        });
                     //   log.audit(data);
                        sublist.setSublistValue({
                            id: 'custpage_wrk_cntr',
                            line: line,
                            value: wrkcnt
                        });
                     //   log.audit(wrkcnt);
                        sublist.setSublistValue({
                            id: 'custpage_loc_centr',
                            line: line,
                            value: locatn
                        });
                     //   log.audit(locatn);
                        //var tempString = '<option value="' +data+ '"> </option>';
                        //var tempString = '<option value="' +data+ '">' +recordid+ '</option>';
                          var tempString2 = '<option value="' +data+ '"> </option>';
                          tempString2 = '<option value="' +data+ '"> </option>';
                    //    // <option data-value="42" value="The answer">
                        optionValues2 += tempString2;
   
                    line++
                    return true;
                });
                var htmlStr = '';
                    htmlStr += '<html>';
                    htmlStr +='<body>';
                    htmlStr += '<p style="padding-top: 14px; font-color:#52595D; font-size:11px;">\n';
                    htmlStr +='<label for="customerSelect">OPERATION NAME</label>';
                    htmlStr += "</p>\n";
                    htmlStr +='<input list="customer" value="' +tempString1+ '" name="customerSelect" id="customerSelect" style="width: 300px; height: 26px;"">\n';
                    htmlStr +='<datalist id="customer">'; 
                   // htmlStr +=optionValues1;
                    htmlStr +=optionValues2;
                    htmlStr +='</datalist>';
                    htmlStr +='</body>';
                    htmlStr += '</html>';                          
                    opratnnm.defaultValue = htmlStr;


                    // <input list="cars" value="BMW" class="form-control" name="caBrands" style="width:300px;">
                    // <datalist id="cars">
                    // <option value="BMW">
                    // <option value="Toyota">
                    // <option value="Mitsubishi">




                       
                    
        }//if end
          //TYPE SELECT START DROPDOWN DISPLAY CHANGED
         
                
                  //ADD SEARCH BUTTON ONLY 
                  var searchbutton = form.addButton({
                    id: 'cutpage_searchbutton',
                    label: 'Search',                   
                    functionName: 'updateMRSuitelet("' + LocId + '")' 
                   // functionName: updateMRSuitelet()
                });


            //ADD SUBMIT BUTTON 
            var submitbutton = form.addSubmitButton({
                label: "Submit"
            });   





             scriptContext.response.writePage(form);
                                    
             }
             
     }
         return {
             onRequest: onRequest,       
         };
         
     });	
 
 
 
 
 
 
 
 
 
 
 
 
 
 