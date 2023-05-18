/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/record'],
    (search, record) => {
        const module = {};

        module.beforeSubmit =  (context) => {

            try{
                if (context.type != context.UserEventType.EDIT && context.type != context.UserEventType.XEDIT ) return;
				
					log.debug('Starting script');
                    let newRec = context.newRecord;
               
                    let refHide = newRec.getValue('custbody_cntm_custom_rec_ref_hide');  //will only be 
                    //let opsGateIds = newRec.getValue('custbody_serp_operation_gateid');
					
					var searchLookupObj = search.lookupFields({type: record.Type.WORK_ORDER, id: newRec.id, columns: ['custbody_serp_operation_gateid']});
					var opsGateIds = searchLookupObj?.custbody_serp_operation_gateid;
					
                    if(refHide == true && (!opsGateIds)) //update only refHide is true and there are no GateIDs currently
                    {
                        let objSearch = search.create({
                            type: "manufacturingoperationtask",
                            filters:
                                [["workorder","anyof",newRec.id]],
                            columns:
                                [search.createColumn({name: "formulatext", summary: "MIN", formula: "NS_CONCAT(SUBSTR( {name}, 1, INSTR({name}, '-')-1))"})]
                        });

                        objSearch.run().each(function(rs){
                            opsGateIds = rs.getValue({name: "formulatext", summary: "MIN"});
                            return true;
                        });
                        log.debug('opsGateIds', opsGateIds);
                        newRec.setValue({fieldId: 'custbody_serp_operation_gateid', value: opsGateIds});
                    }
                
            }catch(e){

                log.error(e.name, e.message)
            }
        };

        return module;

    });
