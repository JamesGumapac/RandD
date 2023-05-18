/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */

define(['N/record', 'N/search'],
  (record, search) => {
	
  const afterSubmit = (context) => {
    try {
      const modeType = context.type;
      const eventType = context.UserEventType;
      var oldRecord = context.oldRecord;
      const clientSubRec = context.newRecord;

      let seqNum = clientSubRec.getValue({
        fieldId: 'custrecord_cntm_seq_no'
      });

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

      if (modeType == eventType.EDIT || modeType == eventType.XEDIT && oldRecord && oldRecord.getValue('custrecord_cntm_cso_status') != 4) { // 4 = completed
        
        const status = clientSubRec.getValue({
          fieldId: 'custrecord_cntm_cso_status'
        });

        // If status is Completed
        if (status == 4) {
          const parentId = clientSubRec.getValue({
            fieldId: 'custrecord_cntm_cso_parentrec'
          });
          const panelLot = clientSubRec.getValue({
            fieldId: 'custrecord_cntm_cso_pannellot'
          });
          
          seqNum += 1;

          // Search next operation
          const nextOpId = searchNextOperation(parentId, panelLot, seqNum);

          // Update next operation
          if (nextOpId) {
            record.submitFields({
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
          }
        }
      }
    } catch(error) {
      log.debug({ title: 'Unexpected Error', details: error });
    }
  };

  const searchNextOperation = (parentId, panelLot, seqNum) => {
    let nextOpId = null;

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

    return nextOpId;
  };
  
  return { afterSubmit }
});
