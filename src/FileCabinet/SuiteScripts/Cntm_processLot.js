/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search'],
/**
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 */
function(record, runtime, search) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
    	var woId = runtime.getCurrentScript().getParameter({
			name : 'custscript_cntm_wo_id'
		});
    	var item = runtime.getCurrentScript().getParameter({
			name : 'custscript_cntm_item_id'
		});
    	var recId = runtime.getCurrentScript().getParameter({
			name : 'custscript_cntm_pcb_suitlet_data'
		});
		var itemFieldLookUp = search.lookupFields({
			type : 'item',
			id : item,
			columns : [ 'custitem_cnt_next_lot_no' ]
		});
		var nextLotNo = itemFieldLookUp.custitem_cnt_next_lot_no;
		var woFieldLookUp = search.lookupFields({
			type : 'workorder',
			id : woId,
			columns : [ 'custbody_cntm_no_of_panel' ]
		});
		var noOfPanels=woFieldLookUp.custbody_cntm_no_of_panel;
		log.debug('nextLotNo: ' + nextLotNo, 'noOfPanels: '+
				parseInt(noOfPanels));
		if (!nextLotNo)
			nextLotNo = 1;
		if (noOfPanels) {
          var created=false;
			for (var i = 0; i < parseInt(noOfPanels); i++) {
				var WOLotRec = record.create({
					type : 'customrecord_cntm_lot_creation',
					isDynamic : true
				});
				WOLotRec.setValue({
					fieldId : 'custrecord_cntm_lot_wonum',
					value : woId
				});
				WOLotRec.setValue({
					fieldId : 'custrecord_cntm_lot_assembly_item',
					value : item
				});
				WOLotRec.setValue({
					fieldId : 'custrecord_cntm_lot_lotnumber',
					value : nextLotNo
				});
				/*WOLotRec.setValue({
					fieldId : 'custrecord_cntm_num_of_panels',
					value : noOfPanels
				});*/
				var lotRecId=WOLotRec.save();				
				nextLotNo++;
			}
		}
		log.debug('nextLotNo', nextLotNo);
		record.submitFields({
			type : 'customrecord_cntm_pcb_wo_suitelet_data',
			id : recId,
			values : {
				custrecord_cntm_cr_status : 2
			},
			options : {
				enableSourcing : false,
				ignoreMandatoryFields : true
			}
		});
		record.submitFields({
			type : 'lotnumberedassemblyitem',
			id : item,
			values : {
				custitem_cnt_next_lot_no : nextLotNo
			},
			options : {
				enableSourcing : false,
				ignoreMandatoryFields : true
			}
		});
	
    	
    }

    return {
        execute: execute
    };
    
});
