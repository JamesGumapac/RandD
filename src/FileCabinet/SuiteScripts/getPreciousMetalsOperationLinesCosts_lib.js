function getPreciousMetalsCosts(woid){
		
		
		var lineLevelPreciousMetalsCostsArrayOfObjects = [];
		
		var workorderSearchObj = search.create({
		   type: "workorder",
		   filters:
		   [
			  ["type","anyof","WorkOrd"], 
			  "AND", 
			  ["internalid","anyof", woid], 
			  "AND", 
			  ["mainline","is","T"], 
			  "AND", 
			  ["item","noneof","@NONE@"], 
			  "AND", 
			  ["item.custitem_cntm_panelsize","isnotempty",""],
			  "AND", 
      ["formulanumeric: CASE WHEN (INSTR({manufacturingoperationtask.name}, 'AI-') = 1 OR INSTR({manufacturingoperationtask.name}, 'AJ-') = 1 OR INSTR({manufacturingoperationtask.name}, 'AV-') = 1 OR INSTR({manufacturingoperationtask.name}, 'AW-') = 1 OR INSTR({manufacturingoperationtask.name}, 'I0-') = 1 OR INSTR({manufacturingoperationtask.name}, 'ENEPIG-') = 1)THEN 1 ELSE 0 END ","equalto","1"]
			  
		   ],
		   columns:
		   [
			  search.createColumn({name: "tranid", sort: search.Sort.ASC, label: "Document Number"}),
			  search.createColumn({name: "entity", label: "Name"}),
			  search.createColumn({name: "built", label: "Built"}),
			  search.createColumn({name: "internalid", join: "manufacturingOperationTask", label: "Internal ID"}),
			  search.createColumn({name: "status", join: "manufacturingOperationTask", label: "Status"}),
			  search.createColumn({name: "name", join: "manufacturingOperationTask", label: "Operation Name"}),
			  search.createColumn({name: "sequence", join: "manufacturingOperationTask", label: "Sequence"}),
			  search.createColumn({name: "order", join: "manufacturingOperationTask", sort: search.Sort.ASC, label: "Order"}),
			  search.createColumn({name: "manufacturingworkcenter", join: "manufacturingOperationTask", label: "Manufacturing Work Center"}),
			  search.createColumn({name: "completedquantity", join: "manufacturingOperationTask", label: "Completed Quantity"}),
			  search.createColumn({name: "item", label: "Item"}),
			  search.createColumn({name: "custitem_cntm_panelsize", join: "item", label: "Panel Size"}),
			  search.createColumn({name: "custbody_cntm_no_of_panel", label: "No of Panels"}),
			  search.createColumn({name: "quantity", label: "Quantity"}),
			  search.createColumn({name: "custrecord_cntm_boards_per_panel", join: "bom", label: "Boards Per Panel"})
		   ]
		});
		var searchResultCount = workorderSearchObj.runPaged().count;
		log.debug("getPreciousMetalsCosts function MOT search result count",searchResultCount);
		var results = workorderSearchObj.run().getRange({start: 0, end: 1000});
		
		//inject this quick search to find the latest custom Manual Costs Input record (WIP Variables)
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
				  search.createColumn({name: "custrecord_thick_gold_thickness", label: "Thick Gold Thickness"})
			   ]
			});
			var searchResultCount = customrecord_manual_costs_inputSearchObj.runPaged().count;
			log.debug("getPreciousMetalsCosts wip variables manual input cost search result count",searchResultCount);
			var custRecordResults = customrecord_manual_costs_inputSearchObj.run().getRange({start: 0, end: 1});
			
			var GOLD_COST = custRecordResults[0].getValue({name: "custrecord_gold"});
			var ENEPIG_GOLD_COST = custRecordResults[0].getValue({name: "custrecord_enepig_gold"});
			var ENEPIG_PALLADIUM_COST = custRecordResults[0].getValue({name: "custrecord_enepig_palladium"});
			
		
		TOTAL_PRECIOUS_METALS_COST = Number(0);
		PRECIOUS_METALS_COST_ARRAY = [];
		
		THIN_GOLD_PCT = custRecordResults[0].getValue({name: "custrecord_thin_gold"}); 
		THICK_GOLD_PCT = custRecordResults[0].getValue({name: "custrecord_thick_gold"}); 
		THIN_GOLD_THICK = custRecordResults[0].getValue({name: "custrecord_thin_gold_thickness"});
		THICK_GOLD_THICK = custRecordResults[0].getValue({name: "custrecord_thick_gold_thickness"});
		
		
		log.debug('THIN_GOLD_PCT / THICK_GOLD_PCT / THIN_GOLD_THICK / THICK_GOLD_THICK:', THIN_GOLD_PCT +' / '+ THICK_GOLD_PCT +' / '+ THIN_GOLD_THICK +' / '+ THICK_GOLD_THICK);
		
		TOTAL_fGold = Number(0);
		TOTAL_fEnepigGold = Number(0);
		TOTAL_fEnepigPalladium = Number(0);
		
		for(var i = 0; i < results.length; i++){
			
			//this object will be passsed into an array, which will then be passed as a parameter to our scheduled script
			var preciousMetalsLineCostObj = {};
			
			var operationName = results[i].getValue({name: "name", join: "manufacturingOperationTask"});
			var operationSequence = results[i].getValue({name: "sequence", join: "manufacturingOperationTask"});
			var panelSize = results[i].getValue({name: "custitem_cntm_panelsize", join: "item"});
			var noOfPanels = results[i].getValue({name: "custbody_cntm_no_of_panel"});
			log.debug('operationName / panelSize / noOfPanels:', operationName +' / '+ panelSize +' /'+ noOfPanels);
			
			var fGold = Number(0);
			var fEnepigGold = Number(0);
			var fEnepigPalladium = Number(0);
			
			//if the OPERATION is AI or AJ
			if(operationName.indexOf('AI-') != -1 || operationName.indexOf('AJ-') != -1){
				
				
					if(panelSize.indexOf('12') != -1 && panelSize.indexOf('18') != -1){
						
						fGold = 12 * 18 * 2;					
						
					}
					if(panelSize.indexOf('18') != -1 && panelSize.indexOf('24') != -1){
						
						fGold = 18 * 24 * 2;
						
					}
					if(panelSize.indexOf('20') != -1 && panelSize.indexOf('26') != -1){
						
						fGold = 20 * 26 * 2;
						
					}
					if(panelSize.indexOf('24') != -1 && panelSize.indexOf('26') != -1){
						
						fGold = 24 * 26 * 2;
						
					}
					if(panelSize.indexOf('24') != -1 && panelSize.indexOf('28') != -1){
						
						fGold = 24 * 28 * 2;
							
					}
					
					fGold = fGold * (THICK_GOLD_PCT / 100) * THICK_GOLD_THICK;
					fGold = fGold / 97959;
					fGold = (fGold * GOLD_COST) * (noOfPanels ? noOfPanels : 1);
					
					//write to our line object for later processing in the scheduled script
					preciousMetalsLineCostObj.operationsequence = operationSequence;
					preciousMetalsLineCostObj.operationname = operationName;
					preciousMetalsLineCostObj.goldcost = Number(fGold).toFixed(2);
					
				
			}
			//if the OPERATION is AV or AW
			if(operationName.indexOf('AV-') != -1 || operationName.indexOf('AW-') != -1){
				
					if(panelSize.indexOf('12') != -1 && panelSize.indexOf('18') != -1){
						
						fGold = 12 * 18 * 2;					
						
					}
					if(panelSize.indexOf('18') != -1 && panelSize.indexOf('24') != -1){
						
						fGold = 18 * 24 * 2;
						
					}
					if(panelSize.indexOf('20') != -1 && panelSize.indexOf('26') != -1){
						
						fGold = 20 * 26 * 2;
						
					}
					if(panelSize.indexOf('24') != -1 && panelSize.indexOf('26') != -1){
						
						fGold = 24 * 26 * 2;
						
					}
					if(panelSize.indexOf('24') != -1 && panelSize.indexOf('28') != -1){
						
						fGold = 24 * 28 * 2;
							
					}
					
					fGold = fGold * (THIN_GOLD_PCT / 100) * THIN_GOLD_THICK;
					fGold = fGold / 97959;
					fGold = (fGold * GOLD_COST) * (noOfPanels ? noOfPanels : 1);
					
					//write to our line object for later processing in the scheduled script
					preciousMetalsLineCostObj.operationsequence = operationSequence;
					preciousMetalsLineCostObj.operationname = operationName;
					preciousMetalsLineCostObj.goldcost = Number(fGold).toFixed(2);
				
				
			}
			//if the OPERATION is I0 or ENEPIG
			if(operationName.indexOf('I0-') != -1 || operationName.indexOf('ENEPIG-') != -1){
				
				if(panelSize.indexOf('12') != -1 && panelSize.indexOf('18') != -1){
						
						pnlSqIn = 12 * 18 * 2;					
						
					}
					if(panelSize.indexOf('18') != -1 && panelSize.indexOf('24') != -1){
						
						pnlSqIn = 18 * 24 * 2;
						
					}
					if(panelSize.indexOf('20') != -1 && panelSize.indexOf('26') != -1){
						
						pnlSqIn = 20 * 26 * 2;
						
					}
					if(panelSize.indexOf('24') != -1 && panelSize.indexOf('26') != -1){
						
						pnlSqIn = 24 * 26 * 2;
						
					}
					if(panelSize.indexOf('24') != -1 && panelSize.indexOf('28') != -1){
						
						pnlSqIn = 24 * 28 * 2;
							
					}
					log.debug('pnlSqIn is:', pnlSqIn);
					
					fEnepigGold = pnlSqIn * (30 / 100) * 3;
					fEnepigGold = fEnepigGold / 97959;
					fEnepigGold = (fEnepigGold * GOLD_COST) * (noOfPanels ? noOfPanels : 1);
					
					fEnepigPalladium = pnlSqIn * ( 30 / 100) * 10;
					log.debug('fEnepigPalladium step 1 is:', fEnepigPalladium);
					fEnepigPalladium = fEnepigPalladium / 97959;
					log.debug('fEnepigPalladium step 2 is:', fEnepigPalladium);
					fEnepigPalladium = (fEnepigPalladium * 1950) * (noOfPanels ? noOfPanels : 1);
					log.debug('fEnepigPalladium step 3 is:', fEnepigPalladium);
					
					//write to our line object for later processing in the scheduled script
					preciousMetalsLineCostObj.operationsequence = operationSequence;
					preciousMetalsLineCostObj.operationname = operationName;
					preciousMetalsLineCostObj.enepiggold = Number(fEnepigGold).toFixed(2);
					preciousMetalsLineCostObj.enepigpalladium = Number(fEnepigPalladium).toFixed(2);
				
			}
			
			log.debug('Finishing iteration ' + i +' TOTAL_fGold / TOTAL_fEnepigGold / TOTAL_fEnepigPalladium:', TOTAL_fGold +' / '+ TOTAL_fEnepigGold +' / '+ TOTAL_fEnepigPalladium);
			TOTAL_fGold += round(fGold, 2); //Number(fGold);
			TOTAL_fEnepigGold += round(fEnepigGold, 2);   //Number(fEnepigGold);
			TOTAL_fEnepigPalladium += round(fEnepigPalladium, 2);  //Number(fEnepigPalladium);
	
			lineLevelPreciousMetalsCostsArrayOfObjects.push(preciousMetalsLineCostObj);
			
		}//end saved search WO OPERATIONS results for loop
		
		PRECIOUS_METALS_COST_ARRAY[0] = TOTAL_fGold;
		PRECIOUS_METALS_COST_ARRAY[1] = TOTAL_fEnepigGold;
		PRECIOUS_METALS_COST_ARRAY[2] = TOTAL_fEnepigPalladium;
		PRECIOUS_METALS_COST_ARRAY[3] = lineLevelPreciousMetalsCostsArrayOfObjects;
		
		log.debug('PRECIOUS_METALS_COST_ARRAY is:', JSON.stringify(PRECIOUS_METALS_COST_ARRAY));
		return PRECIOUS_METALS_COST_ARRAY;
		
	}