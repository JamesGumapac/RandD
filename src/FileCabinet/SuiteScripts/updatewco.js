/**
*
* @NApiVersion 2.0
* @NScriptType MapReduceScript
* *
*/

define(['N/error', 'N/log', 'N/record', 'N/search'],
		function (error, log, record, search, runtime) {

	function getInputData(){

		log.debug('running search');
		var wcoSearchLoaded = search.load({id: 'customsearch18135'});

		return wcoSearchLoaded

	}

	function map(context){
		
		try{
			var searchResult = JSON.parse(context.value);
			var wcoId = searchResult.id;
			
			log.audit('Object is:', searchResult.values);
						
					log.audit('Attempting to load WCO:', wcoId);
				
					var wcoRec = record.load({
						type: record.Type.WORK_ORDER_COMPLETION,
						id: wcoId,
						isDynamic: false
					});
	 
					var wcoSaved = wcoRec.save({
						enableSourcing: true,
						ignoreMandatoryFields: true
					});
					log.audit('Saved WCO with ID', wcoSaved);

		
		}catch(e){
		log.error(e.name, e.message);
		}
		


	}

	return {

		getInputData: getInputData,
		map: map
	};

});