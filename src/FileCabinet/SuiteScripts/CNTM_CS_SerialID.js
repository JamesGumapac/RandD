/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/url','N/ui/dialog','N/search'],

function(record,url,dialog,search) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {

    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {

    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {

    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {

    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {

    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {

    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {
    	try{
    	debugger;
    		var custpage_wo= scriptContext.currentRecord.getValue({
    			fieldId : 'custpage_wo'
    		});
    		var custpage_wo_item= scriptContext.currentRecord.getValue({
    			fieldId : 'custpage_wo_item'
    		});
    		var custpage_wo_qty= scriptContext.currentRecord.getValue({
    			fieldId : 'custpage_wo_qty'
    		});
    		var lines = scriptContext.currentRecord.getLineCount({
				sublistId : 'custpage_ids'
			});
//    		var wo = context.request.parameters.custpage_wo;
//			var lineCount = context.request.getLineCount({
//				group : 'custpage_ids'
//			});
    		
    		if(lines>custpage_wo_qty)
    			{
    			dialog.alert({
					title : 'Alert',
					message : 'Quantity Should be less than or equal to work order quantity'
				});
				return false;
    			}
    		function checkPresent(serialid,custpage_wo_item)
    		{
    			var customrecord_cntm_asm_serial_idsSearchObj = search.create({
    				   type: "customrecord_cntm_asm_serial_ids",
    				   filters:
    					   [
    					      ["custrecord_cntm_item_serial_id","anyof",custpage_wo_item], 
    					      "AND", 
    					      ["name","is",serialid]
    					   ],
    				   columns:
    				   [
    				      search.createColumn({
    				         name: "name",
    				         sort: search.Sort.ASC,
    				         label: "Name"
    				      })
    				   ]
    				});
    				var searchResultCount = customrecord_cntm_asm_serial_idsSearchObj.runPaged().count;
    				if(searchResultCount>0)
    					return true;
    				else
    					return false;
    				//return searchResultCount
    		}
    		var duplicate=[];
			for (var int = 0; int < lines; int++) {
			
				var serialId=scriptContext.currentRecord.getSublistValue({
					sublistId : 'custpage_ids',
					fieldId : 'custpage_serial_id',
					line : int
				});
			
				serialId=serialId.replace(/ /g,"_");	
				if(checkPresent(serialId,custpage_wo_item))
					{
					duplicate.push(serialId)
					}
			
			}
			if(duplicate.length>0)
				{
				dialog.alert({
					title : 'Alert',
					message : 'Ducpliate Serial ID Not Allowed :- '+duplicate.toString()
				});
				return false;
				}
			else
			{
				for (var int = 0; int < lines; int++) {
					var serialId=scriptContext.currentRecord.getSublistValue({
						sublistId : 'custpage_ids',
						fieldId : 'custpage_serial_id',
						line : int
					})
					serialId=serialId.replace(/ /g,"_");

					var serialIdRec = record.create({
						type : 'customrecord_cntm_asm_serial_ids',
						isDynamic : true
					});
					serialIdRec.setValue({
						fieldId : 'name',
						value : serialId
					});
					serialIdRec.setValue({
						fieldId : 'custrecord10',
						value : custpage_wo
					});
					serialIdRec.setValue({
						fieldId : 'custrecord_cntm_item_serial_id',
						value : custpage_wo_item
					});
					serialIdRec.save();
				}
			}
		//	alert('closing...')
			if (window.onbeforeunload) {
				window.onbeforeunload = function() {
					null;
				};
			}
    	window.close();
    	return true;
    	
    	}
    	catch(e)
    	{
    		
    	}
    }

    return {

        saveRecord: saveRecord
    };
    
});
