/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record'],

function(record) {
    

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
    function saveRecord(scriptContext) {
    	try{
				
				var recObj = scriptContext.currentRecord;
				
				var lineCount = recObj.getLineCount({sublistId: 'inventory'});
				console.log('lineCount: '+ lineCount);
				
				var linePriceArray = [];
				
				for(var i = 0; i < lineCount; i++){
						
						recObj.selectLine({sublistId: 'inventory', line: i});
						console.log('Selected line: ' + i);
						
						linePriceArray.push(recObj.getCurrentSublistValue({sublistId: 'inventory', fieldId: 'unitcost'}))		
							

				}
				console.log('linePriceArray is: '+ linePriceArray);
				
				if(linePriceArray.indexOf(0) > -1){
					
					confirm('At least one line EST UNIT COST is $0.00.  Are you sure you want to save?');
					return false;
				}
				
				return true;
				
		}catch(e){		
			log.debug(e.name, e.message);
		}
		
    }//end saveRecord function
	

    return {

        saveRecord: saveRecord

    };
    
});
