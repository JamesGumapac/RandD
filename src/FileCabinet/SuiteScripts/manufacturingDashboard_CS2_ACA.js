/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/url', 'N/currentRecord'],

function(record, url, currentRecord) {
	
	
	function pageInit(scriptContext) {
		console.log('Starting CLIENT SCRIPT');
		var slrec = scriptContext.currentRecord;


		var tdColor = '#BAFBFA'; //(Teal)

		var numLines = slrec.getLineCount({sublistId: 'custpage_table'});

		for(i = 0; i < numLines; i++){
			//Grab the rownumber value
			var levelValue = slrec.getSublistValue({
				sublistId:'custpage_table',
				fieldId:'rownumber',
				line: i
			});
    		
			//Row Change core
			if(Number(levelValue) % 2 == 0){
				
				//We are going to be using HTML DOM object to accomplish our goal.
				//IMPORTANT:
				//	Hacking DOM object isn't supported by NetSuite.
				//	IF NetSuite changes the way forms and element IDs are generated,
				//	THIS WILL Fail.
						
				//NetSuite uses following format to generate TR Element ID:
				//	[ID of sublist]+"row"+[line Index]
				//	Example: 
				//		Line 1 of sublist would be custpage_table0
				var trDom = document.getElementById('custpage_tablerow'+i),
					//We now grab child element of the TR tag.
					//  These will be individual TD tags that represents the columns 
					//	we've added on the Suitelet Sublist
					trDomChild = trDom.children;
					//IMPORTANT:
					//	Based on CURRENT generation, we know that last column is hidden
					//	We ONLY want to change the back ground color of Cells being SHOWN
					//	This can be coordinated during your SL development.
					//	This Maybe NS SS2.0 defect
					for (var t=1; t < (trDomChild.length); t+=1)
					{
						//get the child TD DOM element
						var tdDom = trDomChild[t];

						//We are now going to override the style of THIS CELL 
						//	and change the background color
						//	by using setAttribute method of DOM object

						tdDom.setAttribute(
							'style',
							//This is the magic CSS that changes the color
							//	This is Same method used when NetSuite returns saved search results
							//	with user defined row high lighting logic
							'background-color: '+tdColor+'!important;border-color: white '+tdColor+' '+tdColor+' '+tdColor+'!important;'
						);
					}//end trDom for loop
					
			}//if remainder is 0

		} //end for loop


		var currentDashboardSelected = slrec.getValue({fieldId: 'custpage_dashboard_select'});
		

		setTimeout(function (){document.location.reload()}, 300000);
		
console.log('Finished pageInit function');
} //end pageInit

function sleepAndReload(scriptContext, currentDashboardSelected){
	
	var slrec = scriptContext.currentRecord;
	//var slrec = record.get();
	
	//var currentDashboardSelected = slrec.getValue({fieldId: 'custpage_dashboard_select'});
	
		//jsSleep(15000);
		console.log('called jsSleep');
		
		reloadSuiteletFunction(currentDashboardSelected);
		console.log('called reloadSuiteletFunction');
	
	console.log('Finished with sleepAndReload');
	
}


//sleepAndReload(scriptContext);



	

function fieldChanged(scriptContext){
	
	var rec = scriptContext.currentRecord;
		console.log('starting fieldChanged function');
	
	
	if(scriptContext.fieldId == 'custpage_dashboard_select'){
		
		var currentDashboardSelected = rec.getValue({fieldId: 'custpage_dashboard_select'});
		log.debug('currentDashboardSelected is:', currentDashboardSelected);
		
		reloadSuiteletFunction(currentDashboardSelected);

	}// end if SELECT DASHBOARD field changes	
	
	
}


function jsSleep(milliseconds) {
	  var date = Date.now();
	  var currentDate = null;
	  do {
		currentDate = Date.now();
	  } while (currentDate - date < milliseconds);
	}
	

function reloadSuiteletFunction(currentdashboard){
			
			//window.location.href = "/app/site/hosting/scriptlet.nl?script=1502&deploy=1&custparam_db_selected=' + currentdashboard +'";
			var URL = url.resolveScript({scriptId: 'customscript_manuf_dashboard_assy_aca', deploymentId: 'customdeploy_manuf_dashboard_assy_aca', returnExternalUrl: false});
			URL += '&custparam_db_selected=';
			URL += currentdashboard;
			
			window.open(URL, '_self', false);
			
			console.log('Called reloadFunction');
		}//end reloadFunction
	
	
    return {
        pageInit: pageInit,
		fieldChanged: fieldChanged,
		sleepAndReload: sleepAndReload

    };
    
});