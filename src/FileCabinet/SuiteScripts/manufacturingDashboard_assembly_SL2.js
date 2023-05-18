/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

 define(['N/ui/serverWidget', 'N/search', 'N/redirect', 'N/runtime', 'N/format', 'N/record'],
 function (serverWidget, search, redirect, runtime, format, record) {
     
             
 function onRequest(context) {
     
     var scriptObj = runtime.getCurrentScript();
     //var PAGE_SIZE = scriptObj.getParameter({name: 'custscript_page_size_s'});
     var SEARCH_ID = scriptObj.getParameter({name: 'custscript_search_to_use_s'});
     DASHBOARD_SELECTED = context.request.parameters.custparam_db_selected ? context.request.parameters.custparam_db_selected : 0;
     
     log.debug('DASHBOARD_SELECTED is:', DASHBOARD_SELECTED);


	 DASHBOARD_OBJECT_ARRAY = [
		{name: 'DB-Shipping', search: 'customsearch_cdb_dbshipping_v2'}, 
		];
		

 
     
   if (context.request.method == 'GET') {

         //log governance remaining
         var scriptObj = runtime.getCurrentScript();
         log.debug("Remaining governance units in GET: ", scriptObj.getRemainingUsage());
         
         var workCenterIdInput = '';
         var startDateInput = '';
         var endDateInput = '';

         // Get parameters
         var pageId = parseInt(context.request.parameters.page);
         var scriptId = context.request.parameters.script;
         var deploymentId = context.request.parameters.deploy;
     
         // Add sublist that will show results
            var form = serverWidget.createForm({
             title : "Assembly " + DASHBOARD_OBJECT_ARRAY[DASHBOARD_SELECTED].name,
             hideNavBar : true
         });
         form.clientScriptModulePath = 'SuiteScripts/manufacturingDashboard_CS2_v2.js';
                 
         var sublist = buildFormSublist(form, DASHBOARD_OBJECT_ARRAY);

         // Get subset of data to be shown on page
         var addResults = fetchSearchResult(DASHBOARD_OBJECT_ARRAY[DASHBOARD_SELECTED].search);

         setSublistFunction(sublist, addResults);
         // Set data returned to columns

         context.response.writePage(form);
      
         
      
   } else {
       
             var scriptObj = runtime.getCurrentScript();
                 log.debug("Remaining governance units in POST 1:", scriptObj.getRemainingUsage());
                 
                 var workCenterIdInput = '';
                 var startDateInput = '';
                 var endDateInput = '';

                     
             //Let's get the START DATE and END DATE that are input, if either/any
             var startDateInput = context.request.parameters.custpage_startdate;
             log.debug('startDateInput is:', startDateInput);
             
             var endDateInput = context.request.parameters.custpage_enddate;
             log.debug('endDateInput is:', endDateInput);
       
 
     //Begin displaying page
                 //log governance remaining

                 // Get parameters
                 var scriptId = context.request.parameters.script;
                 var deploymentId = context.request.parameters.deploy;
                 
                 //add DASHBOARD select dropdown
                 var selectOptionsDashboard = form.addField({
                         id: 'custpage_dashboard_select',
                         type: serverWidget.FieldType.SELECT,
                         label: 'Select Dashboard'
                 });
                 selectOptionsDashboard.layoutType = serverWidget.FieldLayoutType.NORMAL;
                 //selectOptionsDashboard.breakType = serverWidget.FieldBreakType.STARTCOL;
                 selectOptionsDashboard.isMandatory = true;
                 
                 for(var db = 0; db < DASHBOARD_OBJECT_ARRAY.length; db++){
                     
                     selectOptionsDashboard.addSelectOption({
                         value: db,
                         text: DASHBOARD_OBJECT_ARRAY[db].name
                     });					
                 }
                 
                 // Add sublist that will show results
                 var form = serverWidget.createForm({
                     title : 'Manufacturing Dashboard',
                     hideNavBar : true
                 });
                 var sublist = buildFormSublist(form, DASHBOARD_OBJECT_ARRAY);
 
                 // Get subset of data to be shown on page
                 var addResults = fetchSearchResult(SEARCH_ID);

                 setSublistFunction(sublist, addResults);

                 context.response.writePage(form);
                 
                 
 
   }//end if GET
/**	  
   //sleep for 2 minutes then reload
   jsSleep(120000);
   
   onRequest(context);
**/	

 //setTimeout(onRequest(context), 8000);
 
 //setTimeout(function(){log.debug('Executed setTimeout function');}, 10000);
 //reloadSuiteletFunction(DASHBOARD_SELECTED);
 
 }

 return {
     onRequest : onRequest
 };
/**
 function runSearch(searchId) {
     
     //added 05-24-2020	
     var formulaString = '';

     var searchObj = search.load({id : searchId});
     
     var searchObjResultCount = searchObj.runPaged().count;
     log.debug("searchObj result count in runSearch function is:", searchObjResultCount);
     log.debug('First search filter is:', searchObj.filters[0].formula);

     return searchObj.run().getRange({start: 0, end: 999});//Paged({pageSize : 999});
 }
**/	

 function fetchSearchResult(searchId) {
     
     try{
     var searchObj = search.load({id : searchId});
     
     var searchObjResultCount = searchObj.runPaged().count;
     log.debug("searchObj result count in runSearch function is:", searchObjResultCount);
     log.debug('First search filter is:', searchObj.filters[0].formula);

     var result = searchObj.run().getRange({start: 0, end: 25});

     var resultArray = new Array();
     var q = 0;
     for(var z = 0; z < result.length; z++){
         
         var woId = result[z].getValue({name: "internalid", join: "CUSTRECORD_OPERATION_LINE_WO"});
         if(!woId){
            continue;
         }
         log.debug('woId is:', woId);
         var jobAndNoBoardsArray = givenWOidReturnJobFieldTextAndNoBoardsPerPanel(woId);
         var serialsReturned = getWOlotCreation(woId);//getComponentSerials(woId)
         var serials = serialsReturned ? serialsReturned : '';
         log.debug('woId / serials:', woId +' / '+ serials);
         var woSerials =  serials ? serials : ' ';
         var operationId = result[z].id;
         //var operationId = result[z].getValue({name: "formulatext", formula: "{manufacturingoperationtask.internalid)"});
         var currentGateResult = result[z].getText({name: "custrecord_operation_line_opername"});
         log.debug('operationId is:', operationId);
         log.debug('result is:', result[z]);
         //var workorderTranId = result.getValue({name: "workorder"});
         var woPriority1 = result[z].getValue({name: "formulanumeric"}) ? result[z].getValue({name: "formulanumeric"}) : "-";
         var woPriority2 = result[z].getValue({name: "custbody_rda_wo_priorty_2", join: "CUSTRECORD_OPERATION_LINE_WO"}) ? result[z].getValue({name: "custbody_rda_wo_priorty_2", join: "CUSTRECORD_OPERATION_LINE_WO"}) : "-";
         var woPriority = woPriority1 + " / " + woPriority2;
        //  if(!woPriority){
        //      woPriority = Math.floor(5).toFixed(0);
        //  }
        //  else{
        //      woPriority = Math.ceil(woPriority).toFixed(0);
        //  }
         var itemName = result[z].getValue({name: "item", join: "CUSTRECORD_OPERATION_LINE_WO"});
         var entityStringResult = result[z].getText({name: "entity", join: "CUSTRECORD_OPERATION_LINE_WO"});
         log.debug('entityStringResult is:', entityStringResult);
         if(!entityStringResult){
             entityString = 'N/A';
         }
         else{
             var entityString = entityStringResult;
         }
         var workOrderStatus = result[z].getText({name: "statusref", join: "CUSTRECORD_OPERATION_LINE_WO"});
         var workOrder = result[z].getValue({name: "tranid", join: "CUSTRECORD_OPERATION_LINE_WO"});
         var workOrderSubString = workOrder.substring(workOrder.indexOf('#'), workOrder.length);
         log.debug('workOrder / workOrderSubstring:', workOrder +' / '+ workOrderSubString);
         //var workorderpriority = result.getValue({name: "formulatext"});
         //log.debug('workorderpriority is:', workorderpriority);
         var startDate = result[z].getValue({name: "custrecord_operation_line_startdate"});
         log.debug("start date search",result[z].getValue({name: "custrecord_operation_line_startdate"}));
         log.debug("start datetext search",result[z].getText({name: "custrecord_operation_line_startdate"}));
         if(startDate){
             var timerVar = getTimeElapsedSince(startDate);
         }
         else{var timerVar = ' ';}
         
         
     
         var endDate = result[z].getValue({name: "custrecord_operation_line_enddate"});
         var dueDate = result[z].getValue({name: "custbody_rda_wo_sched_due_date", join: "CUSTRECORD_OPERATION_LINE_WO"});
         //var classNoHierarchy = result.getText({name: "classnohierarchy", join: "workOrder"});
         var noOfPanels = jobAndNoBoardsArray[1] ? jobAndNoBoardsArray[1] : Number(1).toFixed(0);
         log.debug("NoOfPanels",noOfPanels);

         var qty = result[z].getValue({name: "quantity", join: "CUSTRECORD_OPERATION_LINE_WO"});
         var predecessor = result[z].getValue({name: "custrecord_operation_line_predecessor"})
         var predecessorsCompQty = getPredecessorQty(woId, predecessor);//result[z].getValue({name: "completedquantity", join: "CUSTRECORD_OPERATION_LINE_PREDECESSOR"}) || 0;//returnPredecessorsCompletedQuantity(result[z].getValue({name: }));
         var panelFormula = Math.ceil(Number(predecessorsCompQty) / Number(noOfPanels))
        log.debug("panel formula", panelFormula);
        log.debug("predecessorscompqty",predecessorsCompQty);
         var qtyAndNoPanels = Number(predecessorsCompQty).toFixed(0) +' / '+ panelFormula//Math.ceil(predecessorsCompQty / noOfPanels);
         
         var jobField = jobAndNoBoardsArray[0] ? jobAndNoBoardsArray[0] : 'N/A';  //Tool Number (CNTM) on PROJEFCT record
         
         var workCenterId = result[z].getValue({name: "custrecord_operation_line_mwc"});
         var operationNameString = result[z].getText({name: "custrecord_operation_line_opername"});
         var currentOperationNameId = result[z].getValue({name: "custrecord_operation_line_opername"});
         var nextGateOperationName = getNextGate(woId, currentOperationNameId);
         
         //var gateId = givenWorkCenterIdAndOperationNameReturnGate(workCenterId, operationNameString);
         //if(!gateId || gateId === 'undefined' || gateId == '' || gateId == 0){ 
             var gateId = operationNameString.substring(0, 2);
         //}
         log.debug('workCenterId / operationNameString / gateId:', workCenterId +' / '+ operationNameString +' / '+ gateId);
         
         
              
         var currOrder = result[z].getValue({name: "custrecord_operation_line_operseq"});
         if(z > 0){
             var prevOrder = result[z-1].getValue({name: "custrecord_operation_line_operseq"});
         }
         log.debug('currOrder / prevOrder:', currOrder +' / '+ prevOrder);
         
         var totalOperations = getTotalNumberOfOperations(woId);
         log.debug('totalOperations / percentComplete is:', totalOperations +' / '+ percentComplete);
        //  if(totalOperations && totalOperations !== null && totalOperations !== 'undefined'){
        //      var percentComplete = (Number(currOrder - 1) / Number(totalOperations)) * 100;
        //      var percentComplete = percentComplete.toFixed(0)  + '%';
        //  }
        //  else{
        //      var percentComplete = 'TBD';
        //  }

        var percentComplete = result[z].getValue({name: "custbody_wo_percent_completed", join: "CUSTRECORD_OPERATION_LINE_WO"}) ? result[z].getValue({name: "custbody_wo_percent_completed", join: "CUSTRECORD_OPERATION_LINE_WO"}) : "TBD";
         
         ////////////////////////////
         //findNextByFindingPredecessor(operationId);
         ///////////////////////////
         var message = result[z].getValue({name: "custbody_comments_for_dash", join: "CUSTRECORD_OPERATION_LINE_WO"});

         // Added values on 08-26-22
         var salesorder = result[z].getText({name: "custbody_cnt_created_fm_so", join: "CUSTRECORD_OPERATION_LINE_WO"});
         var itemText = result[z].getText({name: "item", join: "CUSTRECORD_OPERATION_LINE_WO"});
         var qtyoperation = result[z].getValue({name: "custrecord_operation_line_inputqty"});
         var shipdate = result[z].getValue({name: "custbody_wo_ship_date", join: "CUSTRECORD_OPERATION_LINE_WO"});

/**			
         //determine if the current result is the 'Next Gate'. If current WO is same as previous interation's WO and ORDER has iterated by one
         if(z > 0 && result[z].id == result[z-1].id && prevOrder && Number(currOrder) - Number(prevOrder) == 1 && DASHBOARD_OBJECT_ARRAY[DASHBOARD_SELECTED].gatesincluded.indexOf(gateId) == -1){
             
                 var nextGate = gateId;
                 resultArray[q - 1].nextgate = nextGate;
                 
             
         }
         else{
             
                 if(z < result.length - 2){
                     var nextGateByGettingPredecessor = result[z + 2].getText({name: "predecessor", join: "manufacturingOperationTask"});
                     var nextGateByGettingPredecessorToUse = nextGateByGettingPredecessor.substring(0, 2);
                 }
                 else{
                     nextGateByGettingPredecessorToUse = 'N/A';
                 }
**/					
                 //build array of objects
                 resultArray.push(
                 {
                     "rownumber": q.toFixed(0),
                     //"searchrownumber": z.toFixed(0),
                     "id": result[z].getValue({name: "internalid", join: "CUSTRECORD_OPERATION_LINE_WO"}),
                     "wopriority": woPriority,
                     "duedate": dueDate,//result[z].getValue({name: "custbody_rda_wo_sched_due_date", join: "CUSTRECORD_OPERATION_LINE_WO"}),
                     "jobnumber": jobField,
                     "workorder": workOrderSubString,
                     "nopanels": qtyAndNoPanels,
                     "entity": entityString,
                     "currentgate": operationNameString,
                     //"order": currOrder,
                     "timer": timerVar,
                     //"enddate": endDate,
                     //"duedate": dueDate,
                     //"completedquantity": completedQuantity,
                     "percentcomplete": percentComplete,
                     "nextgate": nextGateOperationName,//findNextByFindingPredecessor(operationId), //nextGateByGettingPredecessorToUse,  //
                     "serialnumbers": woSerials,
                     "comments": message,
                     // Added values on 08-26-22
                     "salesorder": salesorder,
                     "item": itemText,
                     "qtyoperation": qtyoperation,
                     "shipdate": shipdate
                 });


                 /** Results before 08-26-22
                 resultArray.push(
                 {
                     "rownumber": q.toFixed(0),
                     //"searchrownumber": z.toFixed(0),
                     "id": result[z].getValue({name: "internalid", join: "CUSTRECORD_OPERATION_LINE_WO"}),
                     "wopriority": woPriority,
                     "duedate": dueDate,//result[z].getValue({name: "custbody_rda_wo_sched_due_date", join: "CUSTRECORD_OPERATION_LINE_WO"}),
                     "jobnumber": jobField,
                     "workorder": workOrderSubString,
                     "nopanels": qtyAndNoPanels,
                     "entity": entityString,
                     "currentgate": operationNameString,
                     //"order": currOrder,
                     "timer": timerVar,
                     //"enddate": endDate,
                     //"duedate": dueDate,
                     //"completedquantity": completedQuantity,
                     "percentcomplete": percentComplete,
                     "nextgate": nextGateOperationName,//findNextByFindingPredecessor(operationId), //nextGateByGettingPredecessorToUse,  //
                     "serialnumbers": woSerials,
                     "comments": message	
                 });
                 */
                 
                 q++;
         //}
         
         
         
         //log.debug('resultArray ' + z + ' is:', JSON.stringify(resultArray));
     }
     

     return resultArray;
    }catch(e){
        log.debug("error",e);
        return [];
    }
 }
 
 
 function buildFormSublist(form, dashboardarray){
     
                                     //add DASHBOARD select dropdown
                 var selectOptionsDashboard = form.addField({
                         id: 'custpage_dashboard_select',
                         type: serverWidget.FieldType.SELECT,
                         label: 'Select Dashboard'
                 });
                 selectOptionsDashboard.layoutType = serverWidget.FieldLayoutType.NORMAL;
                 //selectOptionsDashboard.breakType = serverWidget.FieldBreakType.STARTCOL;
                 selectOptionsDashboard.isMandatory = true;
                 
                 for(var db = 0; db < dashboardarray.length; db++){
                     
                     selectOptionsDashboard.addSelectOption({
                         value: db,
                         text: dashboardarray[db].name
                     });					
                 }
                 selectOptionsDashboard.defaultValue =  DASHBOARD_SELECTED;
     
                 var sublist = form.addSublist({
                     id : 'custpage_table',
                     type : serverWidget.SublistType.LIST,
                     label : 'Manufacturing Operation Tasks'
                 });

                 // Add columns to be shown on Page
                 sublist.addField({id : 'rownumber', label : 'Row Number', type : serverWidget.FieldType.TEXT}).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
                 sublist.addField({id : 'workorder', label : 'Work Order', type : serverWidget.FieldType.TEXT});
                 sublist.addField({id : 'salesorder', label : 'Created From SO', type : serverWidget.FieldType.TEXT});
                 sublist.addField({id : 'item', label : 'Item', type : serverWidget.FieldType.TEXT});
                 sublist.addField({id : 'entity', label : 'Customer', type : serverWidget.FieldType.TEXT});
                 sublist.addField({id : 'qtyoperation', label : 'Qty@Operation', type : serverWidget.FieldType.TEXT});
                 sublist.addField({id : 'currentgate', label : 'Operation Name', type : serverWidget.FieldType.TEXT});
                 sublist.addField({id : 'shipdate', label : 'Ship Date', type : serverWidget.FieldType.DATE});

                 /** Columns before 08-26-22
                 sublist.addField({id : 'rownumber', label : 'Row Number', type : serverWidget.FieldType.TEXT}).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
                 sublist.addField({id : 'wopriority', label : 'Priority', type : serverWidget.FieldType.TEXT});
                 sublist.addField({id : 'duedate', label : 'Due Date', type : serverWidget.FieldType.DATE});
                 sublist.addField({id : 'jobnumber', label : 'Job', type : serverWidget.FieldType.TEXT});
                 sublist.addField({id : 'workorder', label : 'Work Order', type : serverWidget.FieldType.TEXT});
                 sublist.addField({id : 'nopanels', label : 'Qty / # Panels', type : serverWidget.FieldType.TEXT});
                 sublist.addField({id : 'entity', label : 'Customer', type : serverWidget.FieldType.TEXT});
                 sublist.addField({id : 'currentgate', label : 'Current Gate', type : serverWidget.FieldType.TEXT});
                 sublist.addField({id : 'timer', label : 'Timer', type : serverWidget.FieldType.TEXT});
                 sublist.addField({id : 'percentcomplete', label : '%', type : serverWidget.FieldType.TEXT});
                 sublist.addField({id : 'nextgate', label : 'Next Gate', type : serverWidget.FieldType.TEXT});
                 sublist.addField({id : 'serialnumbers', label : 'Lot #s', type : serverWidget.FieldType.TEXT});
                 sublist.addField({id : 'comments', label : 'Comments', type : serverWidget.FieldType.TEXT});
                 */

/**					
                 sublist.addField({id : 'startdate', label : 'Start Date', type : serverWidget.FieldType.TEXT});
                 sublist.addField({id : 'enddate', label : 'End Date', type : serverWidget.FieldType.TEXT});
                 sublist.addField({id : 'routing', label : 'Routing', type : serverWidget.FieldType.TEXT});
                 sublist.addField({id : 'operationname', label : 'Op Name', type : serverWidget.FieldType.TEXT});
                 sublist.addField({id : 'operationsequence', label : 'Op Sequence', type : serverWidget.FieldType.TEXT});
                 
                 sublist.addField({id : 'itemname', label : 'Assembly', type : serverWidget.FieldType.TEXT});
**/					
/**					
                 //add SUBMIT button
                 form.addSubmitButton({
                     label: 'Submit',
                         
                 });
**/			
     
     return sublist;
 
 }
 
 
 function setSublistFunction(sublist, result){
     log.debug("result",result);
     try{
     // Set data returned to columns
                 var j = 0;
                 result.forEach(function (result) {
                     
                     sublist.setSublistValue({id: 'rownumber', line : j, value : result.rownumber});
                     //sublist.setSublistValue({id: 'id', line : j, value : result.id});
                     //sublist.setSublistValue({id: 'searchrownumber', line : j, value : result.searchrownumber});
                     sublist.setSublistValue({id: 'workorder', line : j, value : result.workorder ? result.workorder : 'N/A'});
                     sublist.setSublistValue({id: 'salesorder', line : j, value : result.salesorder ? result.salesorder : 'N/A'});
                     sublist.setSublistValue({id: 'item', line : j, value : result.item ? result.item : 'N/A'});
                     sublist.setSublistValue({id: 'entity', line : j, value : result.entity ? result.entity : 'N/A'});
                     sublist.setSublistValue({id: 'qtyoperation', line : j, value : result.qtyoperation ? result.qtyoperation : 0});
                     sublist.setSublistValue({id: 'currentgate', line : j, value : result.currentgate});
                     sublist.setSublistValue({id: 'shipdate', line : j, value : result.shipdate ? result.shipdate : '01/01/1980'});

                    /** Setting before 08-26-22
                     sublist.setSublistValue({id: 'wopriority', line : j, value : result.wopriority ? result.wopriority : 5});
                     sublist.setSublistValue({id: 'duedate', line : j, value : result.duedate ? result.duedate : '01/01/1980'});
                     sublist.setSublistValue({id: 'jobnumber', line : j, value : result.jobnumber ? result.jobnumber : 'N/A'});
                     sublist.setSublistValue({id: 'workorder', line : j, value : result.workorder ? result.workorder : 'N/A'});
                     sublist.setSublistValue({id: 'nopanels', line : j, value : result.nopanels ? result.nopanels : 0});
                     sublist.setSublistValue({id: 'entity', line : j, value : result.entity ? result.entity : ' '});
                     sublist.setSublistValue({id: 'currentgate', line : j, value : result.currentgate});
                     //sublist.setSublistValue({id: 'order', line : j, value : result.order});
                     sublist.setSublistValue({id: 'timer', line : j, value : result.timer});
                     sublist.setSublistValue({id: 'percentcomplete', line : j, value : result.percentcomplete});
                     if(result.hasOwnProperty("nextgate")){
                        if(result.nextgate)
                            sublist.setSublistValue({id: 'nextgate', line : j, value : result.nextgate});   
                     }
                     sublist.setSublistValue({id: 'serialnumbers', line : j, value : result.serialnumbers});
                     sublist.setSublistValue({id: 'comments', line : j, value : result.comments ? result.comments : ' '});
                     */

                     j++;
                 });	
                }catch(e){
                    log.debug("error",e);
                }
     
 }
 
 function getTimeElapsedSince(startdate){
    log.debug("start date",startdate);
     var returnObj = new Object();
     const total = Date.parse(new Date()) - Date.parse(startdate);
     log.debug("total", total);
     returnObj.seconds = Math.floor( (total/1000) % 60 );
     returnObj.minutes = Math.floor( (total/1000/60) % 60 );
     returnObj.hours = Math.floor( (total/(1000*60*60)) % 24 );
     returnObj.days = Math.floor( total/(1000*60*60*24) );

 return returnObj.days +'d '+ returnObj.hours +'h '+ returnObj.minutes +'m';
 }
 
 function givenWorkCenterIdAndOperationNameReturnGate(workcenterid, operationnamestring){
     
     var GATE_ID = 0;
     var operationNameAllUppercase = operationnamestring.toUpperCase();
     //search the GATE TIMES AND OPERATIONS custom record for all custom records with this particular MANUFACTURING WORK CENTER join
     var customrecord_gate_times_and_operations_SearchObj = search.create({
        type: "customrecord_gate_times_and_operations_",
        filters:
        [
           ["custrecord_work_center_","anyof", workcenterid], 
           "AND", 
           ["formulanumeric: CASE WHEN UPPER({custrecord_name_}) LIKE '" + operationNameAllUppercase + "' THEN 1 ELSE 0 END","equalto","1"]
        ],
        columns:
        [
           search.createColumn({name: "scriptid", sort: search.Sort.ASC, label: "Script ID"}),
           search.createColumn({name: "custrecord_gate_", label: "Gate ID"}),
           search.createColumn({name: "custrecord_name_", label: "Name"}),
           search.createColumn({name: "custrecord_work_center_", label: "Work Center"}),
           search.createColumn({name: "custrecord_wip_setup_", label: "WIP SetUp"}),
           search.createColumn({name: "custrecord_wip_time_", label: "WIP Time"}),
           search.createColumn({name: "custrecord8", label: "Cost Template"})
        ]
     });
     var searchResultCount = customrecord_gate_times_and_operations_SearchObj.runPaged().count;
     log.debug("customrecord_gate_times_and_operations_SearchObj result count",searchResultCount);
     customrecord_gate_times_and_operations_SearchObj.run().each(function(result){
        
         MOT_NAME = result.getValue({name: "custrecord_name_"});
         GATE_ID = result.getValue({name: "custrecord_gate_"});
        
        return true;
     });	
     
     return GATE_ID;
 }


/**
 function jsSleep(milliseconds) {
   var date = Date.now();
   let currentDate = null;
   do {
     currentDate = Date.now();
   } while (currentDate - date < milliseconds);
 }
**/
     //setTimeout(reloadFunction, 10000);


 function reloadSuiteletFunction(currentdashboard){
     
     jsSleep(7000);
         
     redirect.toSuitelet({
         scriptId: 1502,
         deploymentId: 1,
         parameters: {
             'custparam_db_selected': currentdashboard
         }
     });
         
     //window.location.href = "/app/site/hosting/scriptlet.nl?script=1502&deploy=1&custparam_db_selected=' + currentdashboard +'";
         
     log.debug('Called reloadFunction');
 }//end reloadFunction
 
 
 function findNextByFindingPredecessor(manufacturingoperationtaskid){
     
     
 var PREDECESSOR_NAME = '';
 var workorderSearchObj = search.create({
    type: "workorder",
    filters:
    [
       ["mainline","is","T"], 
       "AND", 
       ["type","anyof","WorkOrd"], 
       "AND", 
       ["status","anyof","WorkOrd:D","WorkOrd:A","WorkOrd:B"], 
       "AND", 
       ["manufacturingoperationtask.predecessor","anyof", manufacturingoperationtaskid]
    ],
    columns:
    [
       search.createColumn({name: "custbody_rda_wo_priorty", label: "WO Priorty"}),
       search.createColumn({name: "tranid", sort: search.Sort.ASC, label: "Document Number"}),
       search.createColumn({name: "name", join: "manufacturingOperationTask", label: "Operation Name"}),
       search.createColumn({name: "order", join: "manufacturingOperationTask", sort: search.Sort.ASC, label: "Order"}),
       search.createColumn({name: "item", label: "Item"}),
       search.createColumn({name: "companyname", join: "jobMain", label: "Project Name"})
    ]
 });
     var searchResultCount = workorderSearchObj.runPaged().count;
     log.debug("workorderSearchObj result count",searchResultCount);
     workorderSearchObj.run().each(function(result){
        
         PREDECESSOR_NAME = result.getValue({name: "name", join: "manufacturingOperationTask"});
         return true;
     });
 
     
     return (PREDECESSOR_NAME ? PREDECESSOR_NAME : 'N/A');
     
     
 }
 
 function returnPredecessorsCompletedQuantity(manufacturingoperationtaskid){
     
     
 var PREDECESSOR_COMPLETED_QTY = '';
     var manufacturingoperationtaskSearchObj = search.create({
        type: "manufacturingoperationtask",
        filters:
        [
           ["internalid","anyof", manufacturingoperationtaskid]
        ],
        columns:
        [
           search.createColumn({name: "predecessor", label: "Predecessor"}),
           search.createColumn({name: "completedquantity", join: "predecessor", label: "Completed Quantity"})
        ]
     });
     var searchResultCount = manufacturingoperationtaskSearchObj.runPaged().count;
     log.debug("manufacturingoperationtaskSearchObj result count",searchResultCount);
     manufacturingoperationtaskSearchObj.run().each(function(result){
        
         PREDECESSOR_COMPLETED_QTY = result.getValue({name: "completedquantity", join: "predecessor"});
         return true;
     });
 
     
     return PREDECESSOR_COMPLETED_QTY;
         
 }
 
 
 function getTotalNumberOfOperations(woid){
     var RESULT = 0;
     
     var workorderSearchObj = search.create({
        type: "workorder",
        filters:
        [
           ["type","anyof","WorkOrd"], 
           "AND", 
           ["mainline","is","T"], 
           "AND", 
           ["internalid","anyof", woid]
        ],
        columns:
        [
           search.createColumn({name: "name", join: "manufacturingOperationTask", summary: "COUNT", sort: search.Sort.ASC, label: "Operation Name"})
        ]
     });
     var searchResultCount = workorderSearchObj.runPaged().count;
     log.debug("workorderSearchObj result count",searchResultCount);
     workorderSearchObj.run().each(function(result){
        RESULT = result.getValue({name: "name", join: "manufacturingOperationTask", summary: "COUNT"});
        return true;
     });
     
     
     return RESULT;
 }

 function getWOlotCreation(woId){
    var workorderSearchObj = search.create({
        type: "customrecord_cntm_lot_creation",
        filters:
        [
            ["custrecord_cntm_lot_wonum","anyof",woId],
        ],
        columns:
        [
            search.createColumn({name: "custrecord_cntm_lot_lotnumber", label: "Lot #s"}),
        ]
        });
        var lotNumbers = [];
        getAllSSResult(workorderSearchObj.run()).forEach(function(res){
            var lotNumber = res.getValue({name: "custrecord_cntm_lot_lotnumber"});
    
            if(lotNumber){
                lotNumbers.push(lotNumber);
            }
        });

        return lotNumbers.toString();
 }

 function getPredecessorQty(woId, predecessor){
    log.debug("getPredecessor",woId+"/"+predecessor)
    var customrecord_operation_lineSearchObj = search.create({
        type: "customrecord_operation_line",
        filters:
        [
           ["custrecord_operation_line_opername","anyof",predecessor], 
           "AND", 
           ["custrecord_operation_line_wo","anyof",woId]
        ],
        columns:
        [
           "custrecord_operation_line_opername",
           "custrecord_operation_line_completedqty"
        ]
     });

     var predecessortCompletedQty = "";
     getAllSSResult(customrecord_operation_lineSearchObj.run()).forEach(function(res){
        predecessortCompletedQty = res.getValue({name: "custrecord_operation_line_completedqty"})
    });

    return predecessortCompletedQty
 }

 function getNextGate(woId, predecessor){
    var customrecord_operation_lineSearchObj = search.create({
        type: "customrecord_operation_line",
        filters:
        [
           ["custrecord_operation_line_predecessor","anyof",predecessor], 
           "AND", 
           ["custrecord_operation_line_wo","anyof",woId]
        ],
        columns:
        [
           "custrecord_operation_line_opername"
        ]
     });
     var nextOperationName = "";
     getAllSSResult(customrecord_operation_lineSearchObj.run()).forEach(function(res){
        nextOperationName = res.getText({name: "custrecord_operation_line_opername"})
    });

    return nextOperationName;
 }

 function getWOIdetails (woId) {
    var woIssueSearch = search.load({ id: "customsearch_print_bom_pdf" });
    woIssueSearch.filters.push(search.createFilter({
        name: 'createdfrom',
        operator: search.Operator.ANYOF,
        values: woId
    }));
    var lotNumbers = [];
    //var invDetails = {};
    getAllSSResult(woIssueSearch.run()).forEach(function(res){
        //var itemId = res.getValue(res.columns[1]);
        var lotNumber = res.getText(res.columns[2]);
        //var binNumber = res.getText(res.columns[3]);

        // if(!invDetails[itemId]){
        //     invDetails[itemId] = [];
        //     lotNumbers[itemId] = [];
        // }

        // invDetails[itemId].push( lotNumber || binNumber );

        if(lotNumber){
            lotNumbers.push(lotNumber);
        }
    });

    return lotNumbers.toString();
 }

 function getAllSSResult (searchResultSet){
    var result = [];
    for(var x=0;x<=result.length;x+=1000)
        result = result.concat(searchResultSet.getRange(x,x+1000)||[]);
    return result;
 }
 
 
 function getComponentSerials(woid){

     var serialsArray = []

     var workorderSearchObj = search.create({
     type: "workorder",
     filters:
     [
         ["type","anyof","WorkOrd"], 
         "AND", 
         ["internalid","anyof", woid], 
         "AND", 
         ["item","noneof","@NONE@"], 
         "AND", 
         ["inventorydetail.inventorynumber","noneof","@NONE@"]
     ],
     columns:
     [
         search.createColumn({name: "trandate", label: "Date"}),
         search.createColumn({name: "type", label: "Type"}),
         search.createColumn({name: "tranid", label: "Document Number"}),
         search.createColumn({name: "entity", label: "Name"}),
         search.createColumn({name: "memo", label: "Memo"}),
         search.createColumn({name: "inventorynumber", join: "itemNumber", label: "Number"})
     ]
     });
     var searchResultCount = workorderSearchObj.runPaged().count;
     log.debug("workorderSearchObj result count",searchResultCount);
     workorderSearchObj.run().each(function(result){
         
         var serialNumber = result.getValue({name: "inventorynumber", join: "itemNumber"});
         if(typeof serialNumber ==  'number'){
             var serialNumber = Number(result.getValue({name: "inventorynumber", join: "itemNumber"})).toFixed(0);
         }
         serialsArray.push(serialNumber);

     return true;
     });

     if(searchResultCount > 0){
         var serialsStringWithoutCommas = serialsArray.join(', ');
         var serialsString = serialsStringWithoutCommas.toString();
         if(serialsString.length > 298){
             var serialsString = serialsString.substring(0, 298);
         }
         return serialsString;
     }

 }
 
 function givenWOidReturnJobFieldTextAndNoBoardsPerPanel(woid){
     log.debug("givenWOidReturnJobFieldTextAndNoBoardsPerPanel() woid", woid);
     var returnArray = [];
     
     var workorderSearchObj = search.create({
        type: "workorder",
        filters:
        [
           ["type","anyof","WorkOrd"], 
           "AND", 
           ["internalid","anyof", woid], 
           "AND", 
           ["mainline","is","T"]
        ],
        columns:
        [
           search.createColumn({name: "tranid", label: "Document Number"}),
           search.createColumn({name: "entityid", join: "jobMain", label: "ID"}),
           search.createColumn({name: "companyname", join: "jobMain", label: "Project Name"}),
           search.createColumn({name: "custrecord_cntm_boards_per_panel", join: "bom", label: "Boards Per Panel"}),
           search.createColumn({name: "formulatext", formula: "{jobmain.jobname}", label: "Formula (Text)"}),
           search.createColumn({name: "custentity_cntm_tool_number", join: "jobMain", label: "Tool Number(CNTM)"})
        ]
     });
     var searchResultCount = workorderSearchObj.runPaged().count;
     log.debug("workorderSearchObj result count",searchResultCount);
     var results = workorderSearchObj.run().getRange({start: 0, end: 1});
        
     if(results && results.length){   

     //returnArray.push(results[0].getValue({name: "entityid", join: "jobMain"}) +' '+ results[0].getValue({name: "formulatext", formula: "{jobmain.jobname}"}));
     returnArray.push(results[0].getText({name: "custentity_cntm_tool_number", join: "jobMain"}));
     returnArray.push(results[0].getValue({name: "custrecord_cntm_boards_per_panel", join: "bom"}));

      return returnArray;
     }		 

     
     
     
 }



 
         
     

 
});
