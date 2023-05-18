function returnWipVariablesSearchResults(){
//RETURN CURRENT WIP COSTS FROM CUSTOM RECORD
	
	var customrecord_manual_costs_inputSearchObj = nlapiSearchRecord("customrecord_manual_costs_input", null,
		[
		],
		[
			new nlobjSearchColumn("created").setSort(true), 
			new nlobjSearchColumn("custrecord_labor"),
			new nlobjSearchColumn("custrecord_overhead"),
			new nlobjSearchColumn("custrecord_gold"),
			new nlobjSearchColumn("custrecord_enepig_gold"),
			new nlobjSearchColumn("custrecord_enepig_palladium"),
			new nlobjSearchColumn("custrecord_thin_gold"),
			new nlobjSearchColumn("custrecord_thin_gold_thickness"),
			new nlobjSearchColumn("custrecord_thick_gold"),
			new nlobjSearchColumn("custrecord_thick_gold_thickness"),
			new nlobjSearchColumn("custrecord_drillhitsperhour"),
            new nlobjSearchColumn("custrecord_qfactor")
      
		]
		);
		var searchResultCount = customrecord_manual_costs_inputSearchObj.length;
		nlapiLogExecution("DEBUG", "libraryFile 1.0 - getPreciousMetalsCosts wip variables manual input cost search result count",searchResultCount);

		
	return customrecord_manual_costs_inputSearchObj;
			
}

//CUSTOM QUANTITY DEPENDING ON WHETHER CORE OPERATION OR NOT//
function returnCustomQuantity(quantity, goodnumofpanels, totalnumofcores, coreboolean){
	
	
	        //if no value present in these two fields we just use the default QUANTITY value on the WO
        var totalNumberOfCores = totalnumofcores ? totalnumofcores : quantity;
        var goodNumberOfPanels = goodnumofpanels ? goodnumofpanels : quantity;
        //if CORE operation indicated on GATE TIME record we use TOTAL NUM OF CORES value, else we use GOOD NUMBER OF PANELSvalue
        var quantityToUse = coreboolean == true ? totalNumberOfCores : goodNumberOfPanels;
		
		return quantityToUse;
}



    return exports;
});