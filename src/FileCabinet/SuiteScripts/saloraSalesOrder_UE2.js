/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * 
 * Check the CONTAINS ASSEMBLY LINE box if any line is DEPT = ASSEMBLY and LOCATION = PA-1660
 *                  
 */
define(['N/record', 'N/https'], function (record, https) {

function beforeSubmit(scriptContext){
	
 try{
			
	var recObj = scriptContext.newRecord;
	
	if(scriptContext.type == 'delete') return;
	
	log.debug('Starting script, scriptContext.type is', scriptContext.type);

	var itemLineCount = recObj.getLineCount({sublistId: 'item'});
	
	
	for(var i = 0; i < itemLineCount; i++){
		
		var dept = recObj.getSublistText({sublistId: 'item', fieldId: 'department', line: i});
		var loc = recObj.getSublistText({sublistId: 'item', fieldId: 'location', line: i});
		
		log.debug('dept | loc:', dept +' | '+ loc);
		
		if(dept.toLowerCase() == 'assembly' && loc.indexOf('PA-1660') != -1){	
			//check the box
			recObj.setValue({fieldId: 'custbody_contains_assembly_line', value: true})
				
		}	
		
	}
	


    } catch (e) {
         log.error( e.name, e.message );
    }
 }

    return {

        beforeSubmit: beforeSubmit
    }
});