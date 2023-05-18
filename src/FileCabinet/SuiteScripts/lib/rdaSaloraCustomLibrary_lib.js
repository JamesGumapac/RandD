		
/**
 *@NApiVersion 2.1
 *@NModuleScope Public
 *
 *
 *
 */
define(['N', 'N/search'], function (N, search) {

const exports = {}
 
//RETURN CURRENT WIP COSTS VARIABLES FROM CUSTOM RECORD
exports.returnWipVariablesSearchResults = () => {
	
	var customrecord_manual_costs_inputSearchObj = search.create({
		type: "customrecord_manual_costs_input",
		filters:
		[
		],
		columns:
		[
			search.createColumn({name: "created", sort: search.Sort.DESC, label: "Date Created"}),
			search.createColumn({name: "custrecord_labor", label: "Labor"}),
			search.createColumn({name: "custrecord_overhead", label: "Overhead"}),
			search.createColumn({name: "custrecord_gold", label: "Gold"}),
			search.createColumn({name: "custrecord_enepig_gold", label: "Enepig Gold"}),
			search.createColumn({name: "custrecord_enepig_palladium", label: "Enepig Palladium"}),
			search.createColumn({name: "custrecord_thin_gold", label: "Thin Gold"}),
			search.createColumn({name: "custrecord_thin_gold_thickness", label: "Thin Gold Thickness"}),
			search.createColumn({name: "custrecord_thick_gold", label: "Thick Gold"}),
			search.createColumn({name: "custrecord_thick_gold_thickness", label: "Thick Gold Thickness"}),
			search.createColumn({name: "custrecord_drillhitsperhour", label: "Drill Hits Per Hour"}),
          search.createColumn({name: "custrecord_qfactor", label: "Q-Factor"}),
		]
		});
		var searchResultCount = customrecord_manual_costs_inputSearchObj.runPaged().count;
		log.debug("getPreciousMetalsCosts wip variables manual input cost search result count",searchResultCount);
		var manualCostsInputSearchResults = customrecord_manual_costs_inputSearchObj.run().getRange({start: 0, end: 1});
		
	return manualCostsInputSearchResults;
			
}

//CUSTOM QUANTITY DEPENDING ON WHETHER CORE OPERATION OR NOT//
exports.returnCustomQuantity = (quantity, goodnumofpanels, totalnumofcores, coreboolean) => {
	
	
	        //if no value present in these two fields we just use the default QUANTITY value on the WO
        var totalNumberOfCores = totalnumofcores ? totalnumofcores : quantity;
        var goodNumberOfPanels = goodnumofpanels ? goodnumofpanels : quantity;
        //if CORE operation indicated on GATE TIME record we use TOTAL NUM OF CORES value, else we use GOOD NUMBER OF PANELSvalue
        var quantityToUse = coreboolean == true ? totalNumberOfCores : goodNumberOfPanels;
		
		return quantityToUse;
}


exports.returnPthAndFillFieldValues = (assemblyitemid, noofpanels, lineuniquekey) => {
	
	var fieldValueObject = {}
	
		var lineUniqueKey = 0
        var shipDate = 0
        var qtyDue = 0
        var numHitsPth = 0
		var numHitsFill = 0
		var delDays = 0
		var drillFillCustomValue = 0
		var pthCustomValue = 0
		var shipTo = 0
			 
             //set TOTAL NUM OF CORES body field, counting the 'Cores' by looking at components
             var totalNumberOfCores = returnTotalNumberOfCores(recId);  //get total number of Cores.  This is designated by custitem field INVENTORY ITEM TYPE when it's equal to CORE
             var totalNumberOfCoresValue = totalNumberOfCores ? totalNumberOfCores : 0
             
			var lineUniqueKeyArray = []
             lineuniquekey = rec.getValue({fieldId: 'custbody_cntm_so_line_unique_key'})  //may be a comma separated list

			 if(lineuniquekey.indexOf(',') > -1){
				 
				 lineuniquekey = lineuniquekey.split(',') 
				 
			 }

             //only search for the correct Sales Order line if some custbody LUK is present on the Work Order already.
             if(lineuniquekey != 0){
				 
				 
                 if(lineUniqueKeyArray.length > 0) {
					 
					 log.debug('lineUniqueKeyArray is:', lineUniqueKeyArray)
					 var returnObject = returnSalesOrderLineData(lineUniqueKeyArray[0])
					 
				 }
				 else{
					 log.debug('lineuniquekey is:', lineuniquekey)
			         var returnObject = returnSalesOrderLineData(lineuniquekey)
				 }
                   
                 shipDate = returnObject.shipdate
                 
                 qtyDue = returnObject.qtydue
				 
				 delDays = returnObject.deliverydays
				 
				 shipTo = returnObject.shipto
				 
				 if(shipTo && shipTo != null && shipTo.indexOf('1660 East Race') == -1){

					 shipTo = 'Cust'
					 
				 }
				 else if(shipTo && shipTo != null){
					
					 shipTo = 'ASM'					
					 
				 }
				 	 

             }
             
             //whether LINE UNIQUE KEY value is present on the WORK ORDER or not, we can still lookup the DRILLHITSPTH custom field on the ASSEMBLY ITEM
             var itemReturnObject = returnCustomAssemblyItemFields(assemblyitemid)	
			 numHitsPth = itemReturnObject.numhitspth	
			 numHitsFill = itemReturnObject.numhitsfill
			
			
			//Return WIP variables in order to do custom calculations using custom formulas
			var wipVariablesSearchResults = returnWipVariablesSearchResults()
			if(wipVariablesSearchResults[0].getValue({name: 'custrecord_drillhitsperhour'})){   

				var drillHitsPerMinute = wipVariablesSearchResults[0].getValue({name: 'custrecord_drillhitsperhour'})  //now considered a per minute value even though scriptid still named 'hour'
				log.debug('drillHitsPerMinute is:', drillHitsPerMinute)
			
				if(numHitsFill && drillHitsPerMinute){
					
					
					//tempvar1 = NUMBER OF HITS * NUMBER OF PANELS
					//tempvar1 = tempvar1 / NUM HITS PER MIN
				
					//altogether as one formula:
					// (NUMBER OF HITS * NUMBER OF PANELS) / NUM HITS PER MIN) / 60
					var drillFillCustomValue = ((Number(numHitsFill) * Number(noofpanels)) / Number(drillHitsPerMinute))
					
				}
				if(numHitsPth && drillHitsPerMinute){
					
					//tempvar1 = NUMBER OF HITS PTH * NUMBER OF PANELS
					//tempvar1 = tempvar1 / NUM HITS PER MIN
				
					//altogether as one formula:
					// (NUMBER OF HITS PTH * NUMBER OF PANELS) / NUM HITS PER MIN
					var pthCustomValue = ((Number(numHitsPth) * Number(noofpanels)) / Number(drillHitsPerMinute))
					
						
				}


			}	

			fieldValuesObject.custbody_wo_ship_date = shipDate
			fieldValuesObject.custbody_qty_due = qtyDue
			fieldValuesObject.custbody_rda_num_hits_pth = numHitsPth
			fieldValuesObject.custbody_num_hits_fill = numHitsFill
			fieldValuesObject.custbody_delivery_days = delDays
			fieldValuesObject.custbody_fill_run_hrs = parseFloat(drillFillCustomValue).toFixed(2)
			fieldValuesObject.custbody_pth_run_hrs = parseFloat(pthCustomValue).toFixed(2)
			fieldValuesObject.custbody_ship_to = shipTo
		

		log.debug('library file returnPthAndFillFieldValues returning:', JSON.stringify(fieldValuesObject))
		return fieldValueObject;
}



    return exports;
});