/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */

 define(['N/record', 'N/search', 'N/log'],
 (record, search, log) => {
 
 const beforeSubmit = (scriptContext) => {
	
	try{

   var newRecord = scriptContext.newRecord;
   var woId = newRecord.id;
   
   
   if(scriptContext.type == 'edit' || scriptContext.type == 'xedit'){ 
     // var customRecRefHid = newRecord.getValue({fieldId: 'custbody_cntm_custom_rec_ref_hide'});
     // log.debug('customRecRefHid is:', customRecRefHid);
   
       setGwosEditableFields(woId);   //needs to have if 'custbody_cntm_custom_rec_ref_hide' == true once we transition to using GWOS V4 permanently, so that inheritance only ever happens once
	   
   }
   
	}catch(e){		
		log.error(e.name, e.message);
	}
   
 };

 const searchWorkOrderFields = (woId) => {
   var workorderSearchObj = search.create({
     type: "workorder",
     filters:
     [
        ["type","anyof","WorkOrd"], 
        "AND", 
        ["internalid","anyof",woId]
     ],
     columns:
     [
        "custbody_rda_wo_priorty",
        "custbody_rda_wo_priorty_2",
        "custbody_rda_qfactor",
        "custbody_comments_for_prod",
        "custbody_comments_for_dash",
       // "custbody_wo_percent_completed",
        "custbody_rda_wo_sched_due_date",
        "custbody_comm_for_planning"
     ]
  });
  var searchResultCount = workorderSearchObj.runPaged().count;
  //log.debug("workorderSearchObj result count",searchResultCount);
  var woFieldObj = {};

  workorderSearchObj.run().each(function(result){
     woFieldObj['custbody_rda_wo_priorty'] = result.getValue({ name: 'custbody_rda_wo_priorty' })
     woFieldObj['custbody_rda_wo_priorty_2'] = result.getValue({ name: 'custbody_rda_wo_priorty_2' })
     woFieldObj['custbody_rda_qfactor'] = result.getValue({ name: 'custbody_rda_qfactor' })
     woFieldObj['custbody_comments_for_prod'] = result.getValue({ name: 'custbody_comments_for_prod' })
     woFieldObj['custbody_comments_for_dash'] = result.getValue({ name: 'custbody_comments_for_dash' })
     //woFieldObj['custbody_wo_percent_completed'] = result.getValue({ name: 'custbody_wo_percent_completed' })
     woFieldObj['custbody_rda_wo_sched_due_date'] = result.getValue({ name: 'custbody_rda_wo_sched_due_date' })
     woFieldObj['custbody_comm_for_planning'] = result.getValue({ name: 'custbody_comm_for_planning' })

     return true;
  });

  Object.keys(woFieldObj).forEach(key => {
   if (woFieldObj[key] === null || woFieldObj[key] === undefined || woFieldObj[key] === '') {
     delete woFieldObj[key];
   }
 });

   log.debug('woFieldObj is:', JSON.stringify(woFieldObj));
  return woFieldObj;
 }

 const setGwosEditableFields = (woId) => {
   try{
	   	   
     var objData = searchWorkOrderFields(woId);
	 
	 //search to find all CLIENT APP SUBLIST OPERATION records associated with our WORK ORDER
     const savedSearch = search.create({
       type: 'customrecord_cntm_clientappsublist',
       filters: [
        ["custrecord_cntm_work_order","anyof", woId] 
	//	"AND", 
	//	["custrecord_inherited_from_wo","is","F"]    //commented out because we now will inherit to all custom records on every WO edit
       ]
     });
    var searchResultCount = savedSearch.runPaged().count;
log.debug("savedSearch result count",searchResultCount);

if(Object.keys(objData).length == 0) return;
if(searchResultCount == 0){

   log.debug('no CASO records found to update, returning');
   return;
} 

savedSearch.run().each(function(result){
	
   // .run().each has a limit of 4,000 results
    var recid = record.submitFields({
       type: 'customrecord_cntm_clientappsublist',
        id: result.id,
        values: objData
     });
     
      
   return true;
});

	 

   }catch(e){
     log.error(e.name, e.message);
   }
 }



 
 return { beforeSubmit }
});
