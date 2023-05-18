/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */

 define(['N/record', 'N/search'],
 (record, search) => {
 
 const afterSubmit = (scriptContext) => {

   var currentRecord = scriptContext.newRecord;
   var clientAppSublistId = currentRecord.id;

   var rec = search.lookupFields({
        type: currentRecord.type,
        id: currentRecord.id,
        columns: ['custrecord_cntm_work_order','custrecord_cntm_cso_parentrec','custrecord_cntm_cso_pannellot','custrecord_cntm_seq_no', 'custrecord_cntm_cso_status']
    })
    var woId = rec.custrecord_cntm_work_order[0].value;
    //log.debug("contextType",scriptContext.type)
  //  var woId = currentRecord.getValue({
  //          fieldId: 'custrecord_cntm_work_order'
  //  });
   //log.debug("WOID/clientAppSublistId/type",woId+"/"+clientAppSublistId+'/'+scriptContext.type);
   if(scriptContext.type == 'xedit' || scriptContext.type == 'create' || scriptContext.type == 'edit'){
     
       setGwosEditableFields(woId, clientAppSublistId);
   }
   
   updateLastMovementDate(scriptContext,rec);
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
        "custbody_wo_percent_completed",
        "custbody_rda_wo_sched_due_date",
        "custbody_comm_for_planning"
     ]
  });
  var searchResultCount = workorderSearchObj.runPaged().count;
  //log.debug("workorderSearchObj result count",searchResultCount);
  var woFieldObj = {};

  workorderSearchObj.run().each(function(result){
     woFieldObj['priority_1'] = result.getValue({ name: 'custbody_rda_wo_priorty' })
     woFieldObj['priority_2'] = result.getValue({ name: 'custbody_rda_wo_priorty_2' })
     woFieldObj['qfactor'] = result.getValue({ name: 'custbody_rda_qfactor' })
     woFieldObj['comments_prod'] = result.getValue({ name: 'custbody_comments_for_prod' })
     woFieldObj['comments_dash'] = result.getValue({ name: 'custbody_comments_for_dash' })
     woFieldObj['percent_completed'] = result.getValue({ name: 'custbody_wo_percent_completed' })
     woFieldObj['wo_duedate'] = result.getValue({ name: 'custbody_rda_wo_sched_due_date' })
     woFieldObj['comments_planning'] = result.getValue({ name: 'custbody_comm_for_planning' })

     return true;
  });

  return woFieldObj;
 }

 const setGwosEditableFields = (woId, clientAppSublistId) => {
   try{
     var objData = searchWorkOrderFields(woId);

     var recid = record.submitFields({
       type: 'customrecord_cntm_clientappsublist',
        id: clientAppSublistId,
        values: {
          custrecord_cntm_priority1: objData.priority_1,
          custrecord_cntm_priority2: objData.priority_2,
          custrecord_cntm_qfactor: objData.qfactor,
          custrecord_cntm_comments_for_prod: objData.comments_prod,
          custrecord_cntm_comments_for_dash: objData.comments_dash,
          custrecord_cntm_comments_for_planning: objData.comments_planning,
          custrecord_cntm_percent_complete: objData.percent_completed,
          custrecord_cntm_wo_sched_due_date: objData.wo_duedate
        }
     });
     
//      var clientAppRecord = record.load({
//        type: 'customrecord_cntm_clientappsublist',
//        id: clientAppSublistId,
//        isDynamic: true
//      });

//      clientAppRecord.setValue({
//            fieldId: 'custrecord_cntm_priority1',
//            value: objData.priority_1
//      });

//      clientAppRecord.setValue({
//            fieldId: 'custrecord_cntm_priority2',
//            value: objData.priority_2
//      });

//      clientAppRecord.setValue({
//            fieldId: 'custrecord_cntm_qfactor',
//            value: objData.qfactor
//      });
//      clientAppRecord.setValue({
//            fieldId: 'custrecord_cntm_comments_for_prod',
//            value: objData.comments_prod
//      });
//      clientAppRecord.setValue({
//            fieldId: 'custrecord_cntm_comments_for_dash',
//            value: objData.comments_dash
//      });
//      clientAppRecord.setValue({
//        fieldId: 'custrecord_cntm_comments_for_planning',
//        value: objData.comments_planning
//  });
//      clientAppRecord.setValue({
//            fieldId: 'custrecord_cntm_percent_complete',
//            value: objData.percent_completed
//      });
//      clientAppRecord.setValue({
//            fieldId: 'custrecord_cntm_wo_sched_due_date',
//            value: objData.wo_duedate
//      });

//      var clientAppRecId = clientAppRecord.save();
     log.audit("set editable fields for clientAppId",recid)
   }catch(e){
     log.debug("ERROR",e);
   }
 }

 const updateLastMovementDate = (context, rec) => {
   try {
     const modeType = context.type;
     const eventType = context.UserEventType;
     var oldRecord = context.oldRecord;
     const clientSubRec = context.newRecord;

    //  let seqNum = clientSubRec.getValue({
    //    fieldId: 'custrecord_cntm_seq_no'
    //  });

    let seqNum = parseFloat(rec.custrecord_cntm_seq_no);

    // const status = clientSubRec.getValue({
    //   fieldId: 'custrecord_cntm_cso_status'
    // });

    const status = rec.custrecord_cntm_cso_status[0].value

    const parentId = rec.custrecord_cntm_cso_parentrec[0].value;

    const panelLot = rec.custrecord_cntm_cso_pannellot;

    log.debug("seqNum/parentId/panelLot/status",seqNum+"/"+parentId+"/"+panelLot+"/"+status)

     if(modeType == eventType.CREATE && seqNum == 1){
       record.submitFields({
         type: 'customrecord_cntm_clientappsublist',
         id: context.newRecord.id,
         values: {
           custrecord_serp_operation_startdate: new Date()
         },
         options: {
           enableSourcing: true,
           ignoreMandatoryFields : true
         }
       });
     }

     
     if ((modeType == eventType.EDIT || modeType == eventType.XEDIT) && status == 4) { // 4 = completed
       
        //  const parentId = clientSubRec.getValue({
        //    fieldId: 'custrecord_cntm_cso_parentrec'
        //  });

         

        //  const panelLot = clientSubRec.getValue({
        //    fieldId: 'custrecord_cntm_cso_pannellot'
        //  });

         seqNum += 1;

         log.audit("params parentId/panelLot/seqNum",parentId+"/"+panelLot+"/"+seqNum);
         // Search next operation
         const nextOpId = searchNextOperation(parentId, panelLot, seqNum);

         log.audit("nextOpId",nextOpId);
         // Update next operation
         if (nextOpId) {
           var updatedId = record.submitFields({
             type: 'customrecord_cntm_clientappsublist',
             id: nextOpId,
             values: {
               custrecord_serp_operation_startdate: new Date()
             },
             options: {
               enableSourcing: true,
               ignoreMandatoryFields : true
             }
           });

           log.audit("set lastmovement date for clientAppId",updatedId);
         }
     }
   } catch(error) {
     log.debug({ title: 'Unexpected Error', details: error });
   }
 }

 const searchNextOperation = (parentId, panelLot, seqNum) => {
   let nextOpId = null;

   if(parentId && panelLot && seqNum){
     const savedSearch = search.create({
       type: 'customrecord_cntm_clientappsublist',
       filters: [
         search.createFilter({ name: 'custrecord_cntm_cso_parentrec', operator: search.Operator.ANYOF, values: parentId }),
         search.createFilter({ name: 'custrecord_cntm_cso_pannellot', operator: search.Operator.IS, values: panelLot }),
         search.createFilter({ name: 'custrecord_cntm_seq_no', operator: search.Operator.EQUALTO, values: seqNum })
       ]
     });
     const result = savedSearch.run().getRange(0, 1);

     if (result.length > 0) {
       nextOpId = result[0].id;
     }
   }else{
     log.debug("parentId/panelLot/seqNum",parentId+"/"+panelLot+"/"+seqNum);
   }

   return nextOpId;
 };
 
 return { afterSubmit }
});
