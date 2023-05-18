//reverse impact of any posting to 4010, and instead post that to 4022
//Deployed on Credit Memo


function customizeGlImpact(transactionRecord, standardLines, customLines, book)
{
nlapiLogExecution("DEBUG","START TIME",new Date().toString());
try{
	var woId = transactionRecord.getFieldValue('createdfrom');
	var woRecordObj = nlapiLoadRecord("workorder",woId);
	var woRecordQuantity = woRecordObj.getFieldValue("quantity") ? Number(woRecordObj.getFieldValue("quantity")) : 0;
	// var woRecordScrap = woRecordObj.getFieldValue("scrapquantity") ? Number(woRecordObj.getFieldValue("scrapquantity")) : 0;
	// var woRecordBuilt = woRecordObj.getFieldValue("built") ? Number(woRecordObj.getFieldValue("built")) : 0;
	var builtScrap = 0;
	

	var scrapBuiltSearch = nlapiSearchRecord("workorder",null,
	[
	["type","anyof","WorkOrd"], 
	"AND", 
	["internalid","anyof",woId], 
	"AND", 
	["isscrap","is","T"]
	], 
	[
	new nlobjSearchColumn("built"), 
	new nlobjSearchColumn("quantityshiprecv"), 
	new nlobjSearchColumn("isscrap")
	]
	);

	if(scrapBuiltSearch){
		var scrapQty = scrapBuiltSearch[0].getValue("quantityshiprecv") ? Number(scrapBuiltSearch[0].getValue("quantityshiprecv")) : 0;
		var builtQty = scrapBuiltSearch[0].getValue("built") ? Number(scrapBuiltSearch[0].getValue("built")) : 0;
		builtScrap = scrapQty + builtQty;
	}

	var recId = transactionRecord.getId();
    var recType = transactionRecord.getRecordType();
	var divisionId = transactionRecord.getFieldValue('department');
	//var costObj = JSON.parse(transactionRecord.getFieldValue('custbody_hidden_mfg_cost_temp')); // get costobj custom field
	nlapiLogExecution('DEBUG', 'recType / recId:', recType +' / '+ recId);

	 /**
	  * COST CATEGORY PRICE VARIABLES
	  */
	  var OH_SETUP_PRICE = 0;
	  var LR_OH_PRICE = 0;
	  var LS_LABOR_SETUP_PRICE = 0;
	  var LR_LABOR_RUN_PRICE = 0;
	  var WIP_OH_PRICE = 0;
	  var WIP_LABOR_PRICE = 0;

	  /**
	   * GET ALL WOC CUSTOM GL LINES COST
	   */
	   var wocOperationCostGL = nlapiSearchRecord("workordercompletion",null,
	   [
		  ["type","anyof","WOCompl"], 
		  "AND", 
		  ["customgl","is","T"], 
		  "AND", 
		  ["createdfrom","anyof",woId], 
		  "AND", 
		  ["memo","doesnotcontain","reversing"], 
		  "AND", 
		  ["debitamount","greaterthan","0.00"]
	   ], 
	   [
		  new nlobjSearchColumn("tranid",null,"GROUP"), 
		  new nlobjSearchColumn("memo",null,"GROUP"), 
		  new nlobjSearchColumn("debitamount",null,"SUM")
	   ]
	   );

	   /**
		* BUILD OPERATION COST GL MAPPING TABLE
	    */
	   var wocGLcostObj = {};
	   if(wocOperationCostGL){
		wocOperationCostGL.forEach(function(result){
			var opName = result.getValue("memo",null,"GROUP");
			var opTotalCost = Number(result.getValue("debitamount",null,"SUM"));
			if(!wocGLcostObj.hasOwnProperty(opName)){
				wocGLcostObj[opName] = {}
			}
			wocGLcostObj[opName] = {
				"totalCost": opTotalCost,
				"completedQty": 0, // update this value with a MOT Search completed qty against Work Order
				"costPerQty": 0 // divide the totalCost by completedQty
			}
		});
	   }

	   /**
		* GET OUR COMPLETED QTY PER OPERATION
		*/
		var motCompletedQtyPerOp = nlapiSearchRecord("workorder",null,
			[
				["type","anyof","WorkOrd"], 
				"AND", 
				["internalid","anyof",woId]
				], 
			[
				new nlobjSearchColumn("tranid"), 
				new nlobjSearchColumn("workorder","manufacturingOperationTask",null), 
				new nlobjSearchColumn("name","manufacturingOperationTask",null), 
				new nlobjSearchColumn("completedquantity","manufacturingOperationTask",null), 
				new nlobjSearchColumn("sequence","manufacturingOperationTask",null).setSort(false),
				new nlobjSearchColumn("custbody_cntm_no_of_panel"),   //NO OF PANELS                        //added 5-18-22
		        //new nlobjSearchColumn("custbody_cntm_good_boards"),   //GOOD NUMBER OF BOARDS
		        new nlobjSearchColumn("custbody_total_num_cores")   //TOTAL NUMBER CORES                    //added 5-18-22
			]
		);
		nlapiLogExecution("DEBUG","motCompletedQtyPerOp.length is:", motCompletedQtyPerOp.length);

			motCompletedQtyPerOp.forEach(function(result){
				var motOpName = result.getValue("name","manufacturingOperationTask",null);
				var motOpCompletedQty = result.getValue("completedquantity","manufacturingOperationTask",null);

				totalNumCores = result.getValue("custbody_total_num_cores")
				woNoOfPanels = result.getValue("custbody_cntm_no_of_panel")
				/**
				 * Compute our costPerQty by dividing totalCost over completedQty
				 */
				if(wocGLcostObj.hasOwnProperty(motOpName)){
					wocGLcostObj[motOpName].completedQty = motOpCompletedQty?Number(motOpCompletedQty) : 0;
				}
			});


	var numHits = transactionRecord.getFieldValue("custbody_num_hits_fill");
	var numHitsPTH = transactionRecord.getFieldValue("custbody_rda_num_hits_pth");
	var boardPerPanel = transactionRecord.getFieldValue('custbody_rda_boards_per_panel') ? Number(transactionRecord.getFieldValue('custbody_rda_boards_per_panel')) : 1;
	var completedQty = Number(transactionRecord.getFieldValue('completedquantity')); // 04052022 update to call a custom library file to get completedQty
	nlapiLogExecution("DEBUG","bultScrap += completedQty",builtScrap+"/"+completedQty);
	
	if(completedQty == 0){	
		nlapiLogExecution("DEBUG","completed quantity is 0, exiting SuiteGL")	
		return;	
	}
	

	// MULTIPLIER = ROUNDUP(COMPLETEDQTY/BOARDSPERPANEL)
	if(boardPerPanel && divisionId != 3) {  //is not 'ASSEMBLY'
	
		var numOfPanels = Math.ceil(completedQty/boardPerPanel);
		
	}
	else {
		var numOfPanels = completedQty
	}
	nlapiLogExecution("DEBUG","numOfPanels is:", numOfPanels);
	
	
	
	//grab WO custbody field:  custbody_cntm_no_of_panel
	
	//grab WO custbody_total_num_cores
	
	//divide custbody_total_num_cores by custbody_cntm_no_of_panel
	var numCoresPerPanel =    parseFloat(totalNumCores / woNoOfPanels)
	nlapiLogExecution("DEBUG","totalNumCores / woNoOfPanels / numCoresPerPanel is:", totalNumCores +' / '+ woNoOfPanels +' / '+ numCoresPerPanel);
	

	nlapiLogExecution("DEBUG","BOARD/PANEL",boardPerPanel);
	

	if(recType != 'workordercompletion'){
        return;
    }
    
    var createdFromText = transactionRecord.getFieldText('createdfrom');
	if(createdFromText.toLowerCase().indexOf('work order') == -1){
		nlapiLogExecution('DEBUG', 'Created From is not Work Order, returning');
		return;
	}
    
	
	var lineCount = standardLines.getCount();
	nlapiLogExecution('DEBUG', 'GL lineCount is:', lineCount);
	if (lineCount == 0) {
		nlapiLogExecution('DEBUG', '0 GL lines, returning:');
		return;  // no need to add WIP costs if no existing GL impact
	}

	var startOp = transactionRecord.getFieldText('startoperation');
	var endOp = transactionRecord.getFieldText('endoperation');
	nlapiLogExecution('DEBUG', 'woId / startOp / endOp:', woId +' / '+ startOp +' / '+ endOp)

    /**
     * GATE TIMES AND OPERATIONS HASHMAP CREATION
     * START 03302022
	 * 
     */
    var gateTimesOperationsFilters = null;
    var operationMapping = {};
    var gateTimesOperationsColumns = [
        new nlobjSearchColumn("name"),
        new nlobjSearchColumn("custrecord_rda_is_core"),
        new nlobjSearchColumn("custrecord_wip_setup_"),
        new nlobjSearchColumn("custrecord_wip_time_"),
    ];
    var gateTimesOperations = nlapiSearchRecord("customrecord_gate_times_and_operations_", null, gateTimesOperationsFilters, gateTimesOperationsColumns);

    if(gateTimesOperations){
        gateTimesOperations.forEach(function(result){
            var operationName = result.getValue("name");
            if(!operationMapping.hasOwnProperty(operationName)){
                operationMapping[operationName] = {};
            }
            operationMapping[operationName] = {
                "isCore": result.getValue("custrecord_rda_is_core"),
                "wipSetupTime": result.getValue("custrecord_wip_setup_"),
                "wipRunTime": result.getValue("custrecord_wip_time_")
            }
        });
    }
	//nlapiLogExecution("DEBUG","operationMapping",JSON.stringify(operationMapping))
    /**
     * GATE TIMES AND OPERATIONS HASHMAP CREATION
     * END 03302022
     */

	//update
    //those record types where we need to join to CREATED FROM to get the MEMO
		var workorderSearchObj = nlapiSearchRecord("workorder",null,
		[
		   ["type","anyof","WorkOrd"], 
		   "AND", 
		   ["mainline","is","T"], 
		   "AND", 
		   ["internalid","anyof", woId],
		   "AND", 
           ["manufacturingoperationtask.sequence","greaterthanorequalto", startOp], 
           "AND", 
           ["manufacturingoperationtask.sequence","lessthanorequalto", endOp],
		   "AND", 
		   ["item","noneof","@NONE@"], 
		   //"AND", // 033022 remove for other costs condition
		   //["item.custitem_cntm_panelsize","isnotempty",""],  //WO must have the PANEL SIZE value, or our precious metals calculation will not work
		    //"AND",

            // 033022 removed for other costs condition
		   //["formulanumeric: CASE WHEN (INSTR({manufacturingoperationtask.name}, 'AI-') = 1 OR INSTR({manufacturingoperationtask.name}, 'AJ-') = 1 OR INSTR({manufacturingoperationtask.name}, 'HZ-') = 1 OR INSTR({manufacturingoperationtask.name}, 'HR-') = 1 OR INSTR({manufacturingoperationtask.name}, 'HM-') = 1 OR INSTR({manufacturingoperationtask.name}, 'AV-') = 1 OR INSTR({manufacturingoperationtask.name}, 'AW-') = 1 OR INSTR({manufacturingoperationtask.name}, 'I0-') = 1 OR INSTR({manufacturingoperationtask.name}, 'B2-') = 1 OR INSTR({manufacturingoperationtask.name}, 'I8-') = 1 OR INSTR({manufacturingoperationtask.name}, 'ENEPIG-') = 1) THEN 1 ELSE 0 END","equalto","1"] 
			
           //Precious Metals OPERATIONS are:  AI-, AJ-, HZ-, HR-, HM-, AV-, AW-, I0-, B2-, I8-, ENEPIG-
			//Drill and Fill OPERATIONS are:  78- or D5-
		], 
		[
		   new nlobjSearchColumn("trandate"), 
		   new nlobjSearchColumn("type"), 
		   new nlobjSearchColumn("tranid"), 
		   new nlobjSearchColumn("entity"),
		   new nlobjSearchColumn("location"),
           new nlobjSearchColumn("department"),
           new nlobjSearchColumn("class"),		   
		   new nlobjSearchColumn("sequence","manufacturingOperationTask",null).setSort(false), 
		   new nlobjSearchColumn("name","manufacturingOperationTask",null),
		   new nlobjSearchColumn("completedquantity","manufacturingOperationTask",null),
		   new nlobjSearchColumn("quantity"),
		   new nlobjSearchColumn("custitem_cntm_panelsize", "item", null),
		   new nlobjSearchColumn("custbody_cntm_no_of_panel"),   //NO OF PANELS
		   new nlobjSearchColumn("custbody_cntm_good_boards"),   //GOOD NUMBER OF BOARDS
		   new nlobjSearchColumn("custbody_total_num_cores"),   //TOTAL NUMBER CORES
		   new nlobjSearchColumn("custrecord_cntm_boards_per_panel","bom",null),  //BOARDS PER PANEL
		   new nlobjSearchColumn("runrate","manufacturingOperationTask",null), // 04042022
		   new nlobjSearchColumn("setuptime","manufacturingOperationTask",null), //04042022
		   new nlobjSearchColumn("manufacturingcosttemplate","manufacturingOperationTask",null) // 04042022
		]
		);
		
		nlapiLogExecution('DEBUG', 'workorderSearchObj is:', JSON.stringify(workorderSearchObj));
		
     if(!workorderSearchObj){
			
		nlapiLogExecution('DEBUG', 'No precious metals or DRILL AND FILL operations found on WOCP, returning');
		return;
	}
	
/**
						DEBIT								CREDIT
AI	PLATE THICK HARD AU	12020	Work In Process - Boards	50180   ID = 661
AJ	PLATE THICK SOFT AU	12020	Work In Process - Boards	50180
AV	PLATE THIN HARD AU	12020	Work In Process - Boards	50180
AW	PLATE THIN SOFT AU	12020	Work In Process - Boards	50180
I0	ENEPIG				12020	Work In Process - Boards	50192	ID = 665
HZ	ENIG				12020	Work In Process - Boards	50192
HR	PLATE THICK HARD AU 12020	Work In Process - Boards	50180
HM	PLATE THIN HARD AU  12020	Work In Process - Boards	50180
B2	PLATE WRAP GOLD		12020	Work In Process - Boards	50180
I8	PLATING AU STRIKE	12020	Work In Process - Boards	50180

						ID=333
**/


    ///////////////Process GL Lines///////////////

//before we get the workorderSearchObj results, search our custom WIP costs record to get latest costs

		var THIN_GOLD_PCT = Number(0);
		var THICK_GOLD_PCT = Number(0);
		var THIN_GOLD_THICK = Number(0);
		var THICK_GOLD_THICK = Number(0);
		var numDrillHitsPerHr = Number(0);

		var GOLD_COST = Number(0);
		var ENEPIG_GOLD_COST = Number(0);
		var ENEPIG_PALLADIUM_COST = Number(0);

		var FAB_LABOR = Number(0);
		var ASSEMBLY_LABOR = Number(0);
		var MLO_LABOR = Number(0);
		var RDIS_LABOR = Number(0);
		var FAB_OVERHEAD = Number(0);
		var ASSEMBLY_OVERHEAD = Number(0);
		var MLO_OVERHEAD = Number(0);
		var RDIS_OVERHEAD = Number(0);
		
		var customrecord_manual_costs_inputSearch = nlapiSearchRecord("customrecord_manual_costs_input",null,
			[
			], 
			[
			   new nlobjSearchColumn("scriptid"), 
			   new nlobjSearchColumn("created").setSort(true), 

			   new nlobjSearchColumn("custrecord_labor"), // FAB LABOR (defaults to fab if division does not match)
			   new nlobjSearchColumn("custrecord_assembly_labor"), // ASSEMBLY LABOR
			   new nlobjSearchColumn("custrecord_mlo_labor"), // MLO LABOR
			   new nlobjSearchColumn("custrecord_rdis_labor"), // RDIS LABOR
			   new nlobjSearchColumn("custrecord_overhead"),  // FAB OVERHEAD
			   new nlobjSearchColumn("custrecord_assembly_overhead"), // ASSEMBLY OVERHEAD
			   new nlobjSearchColumn("custrecord_mlo_overhead"), // MLO OVERHEAD
			   new nlobjSearchColumn("custrecord_rdis_overhead"),  // RDIS OVERHEAD

			   new nlobjSearchColumn("custrecord_gold"), 
			   new nlobjSearchColumn("custrecord_thin_gold"), 
			   new nlobjSearchColumn("custrecord_thick_gold"),
			   new nlobjSearchColumn("custrecord_thin_gold_thickness"), 
			   new nlobjSearchColumn("custrecord_thick_gold_thickness"), 
			   new nlobjSearchColumn("custrecord_enepig_gold"), 
			   new nlobjSearchColumn("custrecord_enepig_palladium"),
			   new nlobjSearchColumn("custrecord_drillhitsperhour"),
			]
			);
			
		nlapiLogExecution('DEBUG', 'customrecord_manual_costs_inputSearch is:', JSON.stringify(customrecord_manual_costs_inputSearch));
		
		if(customrecord_manual_costs_inputSearch){
			numDrillHitsPerHr = customrecord_manual_costs_inputSearch[0].getValue('custrecord_drillhitsperhour') ? Number(customrecord_manual_costs_inputSearch[0].getValue('custrecord_drillhitsperhour')) : 0;
			FAB_LABOR = Number(customrecord_manual_costs_inputSearch[0].getValue("custrecord_labor"));
			ASSEMBLY_LABOR = Number(customrecord_manual_costs_inputSearch[0].getValue("custrecord_assembly_labor"));
			MLO_LABOR = Number(customrecord_manual_costs_inputSearch[0].getValue("custrecord_mlo_labor"));
			RDIS_LABOR = Number(customrecord_manual_costs_inputSearch[0].getValue("custrecord_rdis_labor"));
			FAB_OVERHEAD = Number(customrecord_manual_costs_inputSearch[0].getValue("custrecord_overhead"));
			ASSEMBLY_OVERHEAD = Number(customrecord_manual_costs_inputSearch[0].getValue("custrecord_assembly_overhead"));
			MLO_OVERHEAD = Number(customrecord_manual_costs_inputSearch[0].getValue("custrecord_mlo_overhead"));
			RDIS_OVERHEAD = Number(customrecord_manual_costs_inputSearch[0].getValue("custrecord_rdis_overhead"));

			/** START UPDATE 04252022 
			 * FAB = BOARDS
			 * MLO = PROBE
			 * RDIS = RDIS
			 * ASSEMBLY = ASSEMBLY
			*/
			var DIVISION_WIP_VARIABLES = {
				"PROBE" : {
					labor : MLO_LABOR,
					overhead : MLO_OVERHEAD,
					account: 934 // add account name
				},
				"RDIS" : {
					labor : RDIS_LABOR,
					overhead: RDIS_OVERHEAD,
					account: 935
				},
				"BOARDS" : {
					labor : FAB_LABOR,
					overhead : FAB_OVERHEAD,
					account: 931
				},
				"ASSEMBLY" : {
					labor : ASSEMBLY_LABOR,
					overhead : ASSEMBLY_OVERHEAD,
					account: 932
				}
			}
			/** END UPDATE 04252022 */
			
			THIN_GOLD_PCT = customrecord_manual_costs_inputSearch[0].getValue("custrecord_thin_gold"); 
			THICK_GOLD_PCT = customrecord_manual_costs_inputSearch[0].getValue("custrecord_thick_gold"); 
			THIN_GOLD_THICK = customrecord_manual_costs_inputSearch[0].getValue("custrecord_thin_gold_thickness");
			THICK_GOLD_THICK = customrecord_manual_costs_inputSearch[0].getValue("custrecord_thick_gold_thickness");
			
			GOLD_COST = customrecord_manual_costs_inputSearch[0].getValue("custrecord_gold");
			ENEPIG_GOLD_COST = customrecord_manual_costs_inputSearch[0].getValue("custrecord_enepig_gold");
			ENEPIG_PALLADIUM_COST = customrecord_manual_costs_inputSearch[0].getValue("custrecord_enepig_palladium");
				
		}

		nlapiLogExecution('debug', 'THIN_GOLD_PCT / THICK_GOLD_PCT / THIN_GOLD_THICK / THICK_GOLD_THICK:', THIN_GOLD_PCT +' / '+ THICK_GOLD_PCT +' / '+ THIN_GOLD_THICK +' / '+ THICK_GOLD_THICK);

		//get the workorderSearchObj results and add GL lines will looping through results
		var newLinesObj = {};
		var withFinalOperation = false;

		for(var i = 0; i < workorderSearchObj.length; i++){
			
			//this object will be passsed into an array, which will then be passed as a parameter to our scheduled script
			var preciousMetalsLineCostObj = {};
			
			var locationId = workorderSearchObj[i].getValue("location");
			var deptId = workorderSearchObj[i].getValue("department");
			var classId = workorderSearchObj[i].getValue("class");
			/** START UPDATE 04252022 
			 * FAB = BOARDS
			 * MLO = PROBE
			 * RDIS = RDIS
			 * ASSEMBLY = ASSEMBLY
			*/
			var classText = workorderSearchObj[i].getText("department");
			nlapiLogExecution("DEBUG","DIVISION TEXT",classText);
			
			Object.keys(DIVISION_WIP_VARIABLES).forEach(function(classTxt){
				nlapiLogExecution("DEBUG","DIVISION INDEXOF "+classText+"/"+classTxt,classText.toUpperCase().indexOf(classTxt.toUpperCase()));
				if(classText.toUpperCase().indexOf(classTxt.toUpperCase()) >= 0){
					classId = classTxt;
				}
			});
				
			if(!DIVISION_WIP_VARIABLES.hasOwnProperty(classId)){
				classId = "BOARDS";
			}
			nlapiLogExecution("DEBUG","DIVISION",classId);
			/** END UPDATE 04252022 */

			var operationName = workorderSearchObj[i].getValue("name", "manufacturingOperationTask");
			var operationSequence = workorderSearchObj[i].getValue("sequence", "manufacturingOperationTask");
			var panelSize = workorderSearchObj[i].getValue("custitem_cntm_panelsize", "item");
			//var noOfPanels = workorderSearchObj[i].getValue("custbody_cntm_no_of_panel"); // update this to use the noOfPanel formula
			var noOfPanels = numOfPanels; // sourced from line 41
			nlapiLogExecution('DEBUG', 'operationName / panelSize / noOfPanels:', operationName +' / '+ panelSize +' /'+ noOfPanels);  
			//customize this to use our customQuantity from library file!!!  Not of noOfPanels!
			//call custom library file here and use 'customQuantity' instead of 'noOfPanels'
			if(wocGLcostObj.hasOwnProperty(operationName)){
				wocGLcostObj[operationName].completedQty += completedQty;
				if(wocGLcostObj[operationName].completedQty){
					wocGLcostObj[operationName].costPerQty = wocGLcostObj[operationName].totalCost/wocGLcostObj[operationName].completedQty;
				}
			}
			
			/**
			 * PRECIOUS METALS MOVED AT THE END OF THE SCRIPT AND GETS EXECUTED LAST
			 */
			var fGold = Number(0);
			var fEnepigGold = Number(0);
			var fEnepigPalladium = Number(0);

			/**
			 * FINAL OPERATION LOGIC
			 * operation tasks are sorted in ascending order, which means if our FINAL OPERATION is within our WOC
			 * it will always be the last operation
			 * 
			 * We use the inventory detail field to identify if the WOC contains our FINAL OPERATION
			 */
			
			var isFinalOperation = false;
			
			if(i == workorderSearchObj.length-1){
				isFinalOperation = true;
			}
			
			//DRILL AND FILL custom costs
			var isDrill = false; // this is our flag to identify if an operation is a drill, we don't want to execute our OH and LABOR if this is TRUE
			nlapiLogExecution("DEBUG","numHits/numDrillHitsPerHr/numHitsPTH",numHits+"/"+numDrillHitsPerHr+"/"+numHitsPTH)
			if(operationName.indexOf('78-') > -1 && numHits && numDrillHitsPerHr|| operationName.indexOf('D5-') > -1 && numHitsPTH && numDrillHitsPerHr){

				if(!operationMapping.hasOwnProperty(operationName)){
					continue;
				}
				isDrill = true; // this flag means that our OTHER COSTS for OH and LABOR condition after DRILL won't get executed
				nlapiLogExecution("DEBUG","CALCULATING DRILL AND FILL","");

				WIP_OH_PRICE = DIVISION_WIP_VARIABLES[classId].overhead ? DIVISION_WIP_VARIABLES[classId].overhead : 0;
				//LR_OH_PRICE = DIVISION_WIP_VARIABLES[classId].overhead ? DIVISION_WIP_VARIABLES[classId].overhead : 0;
				WIP_LABOR_PRICE = DIVISION_WIP_VARIABLES[classId].labor ? DIVISION_WIP_VARIABLES[classId].labor : 0;
				//LR_LABOR_RUN_PRICE = DIVISION_WIP_VARIABLES[classId].labor ? DIVISION_WIP_VARIABLES[classId].labor : 0;

				var LABOR_TOTAL = 0;
				var OH_TOTAL = 0;
				var numDrillHitsPerMin = Number(numDrillHitsPerHr) //   / 60;
				nlapiLogExecution('DEBUG','numDrillHitsPerHr:', numDrillHitsPerHr);
				nlapiLogExecution('DEBUG','numDrillHitsPerMin:', numDrillHitsPerMin);

				//var setupTime = operationMapping[operationName].wipSetupTime ? Number(operationMapping[operationName].wipSetupTime) : 0;//motSetupTime;// sourced from MOT
                var setupTimeInMinutes = operationMapping[operationName].wipSetupTime ? Number(operationMapping[operationName].wipSetupTime) : 0;
				
				if(operationName.indexOf('78-') > -1){
					//log.debug('Calculating DRILL AND FILL custom costs now');					
					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA 78-: tempVarMinutes", "(((" + numHits + ")) x " + noOfPanels + " / " + numDrillHitsPerMin + " ) "+ " + " + setupTimeInMinutes);
					var tempVarMinutes = (((Number(numHits)) * noOfPanels ) / numDrillHitsPerMin) + setupTimeInMinutes;
					nlapiLogExecution("DEBUG","tempVarMinutes/60",tempVarMinutes+" / " + 60);
					var tempVarHours = tempVarMinutes/60

					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA 78-: OH SETUP", "(" + tempVarHours + ") x " + WIP_OH_PRICE);
					WIP_OH_PRICE = (tempVarHours) * WIP_OH_PRICE;
					WIP_OH_PRICE = Number(WIP_OH_PRICE.toFixed(2));
					WIP_OH_PRICE = Math.round((WIP_OH_PRICE) * 100) / 100;
					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA 78-: OH SETUP", WIP_OH_PRICE);

					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA 78-: LS LABOR SETUP", "( " + tempVarHours + " ) x " + WIP_LABOR_PRICE);
					WIP_LABOR_PRICE = (tempVarHours) * WIP_LABOR_PRICE;
					WIP_LABOR_PRICE = Number(WIP_LABOR_PRICE.toFixed(2));
					WIP_LABOR_PRICE = Math.round((WIP_LABOR_PRICE) * 100) / 100;
					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA 78-: LS LABOR", WIP_LABOR_PRICE);

					LABOR_TOTAL = WIP_LABOR_PRICE;   // + LR_LABOR_RUN_PRICE;
					OH_TOTAL = WIP_OH_PRICE;   // + LR_OH_PRICE;
					if(!newLinesObj.hasOwnProperty(operationSequence)){
						newLinesObj[operationSequence] = {};
					}
					newLinesObj[operationSequence] = {
						"accountDebitOH": DIVISION_WIP_VARIABLES[classId].account,
						"accountCreditOH":  647,
						"accountDebitLABOR": DIVISION_WIP_VARIABLES[classId].account,
						"accountCreditLABOR": 731,
						"LABOR_TOTAL": LABOR_TOTAL,
						"OH_TOTAL": OH_TOTAL,
						"isPM": false,
						"operationName": operationName,
						"isFinalOperation": isFinalOperation
					}
					
					
				}else{
					// if D5-
					// (16326/60 * 2) / 5
					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA D5-: tempVarMinutes", "(((" + numHitsPTH + ")) x " + noOfPanels + " / " + numDrillHitsPerMin + " ) "+ " + " + setupTimeInMinutes);
					var tempVarMinutes = (((Number(numHitsPTH)) * noOfPanels ) / numDrillHitsPerMin) + setupTimeInMinutes;
					nlapiLogExecution("DEBUG","tempVarMinutes/60",tempVarMinutes+" / " + 60);
					var tempVarHours = tempVarMinutes/60

					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA D5-: LR OH PRICE", "( " + tempVarHours + " ) x" + WIP_OH_PRICE);
					WIP_OH_PRICE = tempVarHours * WIP_OH_PRICE;
					WIP_OH_PRICE = Number(WIP_OH_PRICE.toFixed(2));
					WIP_OH_PRICE = Math.round((WIP_OH_PRICE) * 100) / 100;
					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA D5-: LR OH", WIP_OH_PRICE);

					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA D5-: LR LABOR RUN", "( " + tempVarHours + " x " + WIP_LABOR_PRICE);
					WIP_LABOR_PRICE = tempVarHours * WIP_LABOR_PRICE;
					WIP_LABOR_PRICE = Number(WIP_LABOR_PRICE.toFixed(2));
					WIP_LABOR_PRICE = Math.round((WIP_LABOR_PRICE) * 100) / 100;
					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA D5-: LR LABOR RUN", WIP_LABOR_PRICE);

					LABOR_TOTAL = WIP_LABOR_PRICE; // + LR_LABOR_RUN_PRICE;
					OH_TOTAL = WIP_OH_PRICE; // + LR_OH_PRICE;
					if(!newLinesObj.hasOwnProperty(operationSequence)){
						newLinesObj[operationSequence] = {};
					}
					newLinesObj[operationSequence] = {
						"accountDebitOH": DIVISION_WIP_VARIABLES[classId].account,
						"accountCreditOH": 647,
						"accountDebitLABOR": DIVISION_WIP_VARIABLES[classId].account,
						"accountCreditLABOR": 731,
						"LABOR_TOTAL": LABOR_TOTAL,
						"OH_TOTAL": OH_TOTAL,
						"isPM": false,
						"operationName": operationName,
						"isFinalOperation": isFinalOperation
					}
					
				}
			}
            // ELSE OTHER COSTS COMPUTATION 03302022
			// only execute this condition if it is not a DRILL operation
			// this condition block will be executed even if an operation is PRECIOUS METALS
			nlapiLogExecution("DEBUG","isDrill",isDrill+"/ not!"+!isDrill);
        	if(!isDrill){
                //nlapiLogExecution("DEBUG", "OPERATION GATE REC MAPPING", JSON.stringify(operationMapping[operationName]));
                
				/**
				 * This condition checks if the operation has a GATE TIME RECORD
				 * If no gate time record then it skips the current loop iteration
				 */
				if(!operationMapping.hasOwnProperty(operationName)){
					continue;
				}
				
				var isCore = operationMapping[operationName].isCore;
                var setupTime = operationMapping[operationName].wipSetupTime ? Number(operationMapping[operationName].wipSetupTime) : 0;//motSetupTime;// sourced from MOT
				// 04252022 updated formula of runTime = runRate x completedQty
                var runTime = operationMapping[operationName].wipRunTime ? Number(operationMapping[operationName].wipRunTime) : 0;
				//runTime *= completedQty;// sourced from MOT
				nlapiLogExecution("DEBUG","setupTime/runTime",setupTime+"/"+runTime);
				 //nlapiLogExecution("DEBUG","MFG COST TEMPLATE", JSON.stringify(costObj['mfgcosttemp']));
				 nlapiLogExecution("DEBUG","isCore?",isCore);
				 
                if(isCore == "T"){
					// MULTIPLIER = TOTAL NUMBER OF CORES
                    var numOfCores = transactionRecord.getFieldValue('custbody_total_num_cores') ? Number(transactionRecord.getFieldValue('custbody_total_num_cores')) : 1;
					nlapiLogExecution('DEBUG', 'numOfCores is:', numOfCores)
					/**
					 * GET THE VALUES FROM THE COST OBJ FIELD IN WOC UNDER CUSTOM COSTS TAB
					 * FIELD ID = custbody_hidden_mfg_cost_temp
					 */

					OH_SETUP_PRICE = DIVISION_WIP_VARIABLES[classId].overhead ? DIVISION_WIP_VARIABLES[classId].overhead : 0;
					LR_OH_PRICE = DIVISION_WIP_VARIABLES[classId].overhead ? DIVISION_WIP_VARIABLES[classId].overhead : 0;
					LS_LABOR_SETUP_PRICE = DIVISION_WIP_VARIABLES[classId].labor ? DIVISION_WIP_VARIABLES[classId].labor : 0;
					LR_LABOR_RUN_PRICE = DIVISION_WIP_VARIABLES[classId].labor ? DIVISION_WIP_VARIABLES[classId].labor : 0;

					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA IS CORE: OH SETUP", "(" + setupTime + "/60) x " + OH_SETUP_PRICE);
					OH_SETUP_PRICE = (setupTime / 60) * OH_SETUP_PRICE;
					OH_SETUP_PRICE = Number(OH_SETUP_PRICE.toFixed(2));
					OH_SETUP_PRICE = Math.round((OH_SETUP_PRICE) * 100) / 100;
					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA IS CORE: OH SETUP", OH_SETUP_PRICE);

					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA IS CORE: LR OH PRICE", "(( " + numCoresPerPanel + " x " + noOfPanels +" ) x ( "+runTime+" / 60 )) x " + LR_OH_PRICE);
				LR_OH_PRICE = ((numCoresPerPanel * noOfPanels) * (runTime / 60)) * LR_OH_PRICE;    //we multiply by numOfPanels. If using clientApp will equal 1, else will depend on native NetSuite COMPLETED QTY
					LR_OH_PRICE = Number(LR_OH_PRICE.toFixed(2));
					LR_OH_PRICE = Math.round((LR_OH_PRICE) * 100) / 100;
					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA IS CORE: LR OH", LR_OH_PRICE);

					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA IS CORE: LS LABOR SETUP", "( " + setupTime + " / 60 ) x " + LS_LABOR_SETUP_PRICE);
					LS_LABOR_SETUP_PRICE = (setupTime / 60) * LS_LABOR_SETUP_PRICE;
					LS_LABOR_SETUP_PRICE = Number(LS_LABOR_SETUP_PRICE.toFixed(2));
					LS_LABOR_SETUP_PRICE = Math.round((LS_LABOR_SETUP_PRICE) * 100) / 100;
					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA IS CORE: LS LABOR", LS_LABOR_SETUP_PRICE);

					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA IS CORE: LR LABOR RUN", "(( " + numCoresPerPanel + " x " + noOfPanels +" ) x ( "+runTime+" / 60 )) x " + LR_LABOR_RUN_PRICE);
				LR_LABOR_RUN_PRICE = ((numCoresPerPanel * noOfPanels) * (runTime / 60)) * LR_LABOR_RUN_PRICE;    //we multiply by numOfPanels. If using clientApp will equal 1, else will depend on native NetSuite COMPLETED QTY
					LR_LABOR_RUN_PRICE = Number(LR_LABOR_RUN_PRICE.toFixed(2));
					LR_LABOR_RUN_PRICE = Math.round((LR_LABOR_RUN_PRICE) * 100) / 100;
					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA IS CORE: LR LABOR RUN", LR_LABOR_RUN_PRICE);
				}else{
                    /**
					 * GET THE VALUES FROM THE COST OBJ FIELD IN WOC UNDER CUSTOM COSTS TAB
					 * FIELD ID = custbody_hidden_mfg_cost_temp
					 */
					
					OH_SETUP_PRICE = DIVISION_WIP_VARIABLES[classId].overhead ? DIVISION_WIP_VARIABLES[classId].overhead : 0;
					LR_OH_PRICE = DIVISION_WIP_VARIABLES[classId].overhead ? DIVISION_WIP_VARIABLES[classId].overhead : 0;
					LS_LABOR_SETUP_PRICE = DIVISION_WIP_VARIABLES[classId].labor ? DIVISION_WIP_VARIABLES[classId].labor : 0;
					LR_LABOR_RUN_PRICE = DIVISION_WIP_VARIABLES[classId].labor ? DIVISION_WIP_VARIABLES[classId].labor : 0;

					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA NOT CORE: OH SETUP", "(" + setupTime + "/60) x " + OH_SETUP_PRICE);
					OH_SETUP_PRICE = (setupTime / 60) * OH_SETUP_PRICE;
					OH_SETUP_PRICE = Number(OH_SETUP_PRICE.toFixed(2));
					OH_SETUP_PRICE = Math.round((OH_SETUP_PRICE) * 100) / 100;
					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA NOT CORE: OH SETUP", OH_SETUP_PRICE);

					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA NOT CORE: LR OH PRICE", "( " + numOfPanels + " x ( "+runTime+" / 60 )) x " + LR_OH_PRICE);
					LR_OH_PRICE = (numOfPanels * (runTime / 60)) * LR_OH_PRICE;
					LR_OH_PRICE = Number(LR_OH_PRICE.toFixed(2));
					LR_OH_PRICE = Math.round((LR_OH_PRICE) * 100) / 100;
					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA NOT CORE: LR OH", LR_OH_PRICE);

					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA NOT CORE: LS LABOR SETUP", "( " + setupTime + " / 60 ) x " + LS_LABOR_SETUP_PRICE);
					LS_LABOR_SETUP_PRICE = (setupTime / 60) * LS_LABOR_SETUP_PRICE;
					LS_LABOR_SETUP_PRICE = Number(LS_LABOR_SETUP_PRICE.toFixed(2));
					LS_LABOR_SETUP_PRICE = Math.round((LS_LABOR_SETUP_PRICE) * 100) / 100;
					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA NOT CORE: LS LABOR", LS_LABOR_SETUP_PRICE);

					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA NOT CORE: LR LABOR RUN", "( " + numOfPanels + " x ("+runTime+" / 60 )) x " + LR_LABOR_RUN_PRICE);
					LR_LABOR_RUN_PRICE = (numOfPanels * (runTime / 60)) * LR_LABOR_RUN_PRICE;
					LR_LABOR_RUN_PRICE = Number(LR_LABOR_RUN_PRICE.toFixed(2));
					LR_LABOR_RUN_PRICE = Math.round((LR_LABOR_RUN_PRICE) * 100) / 100;
					nlapiLogExecution("DEBUG","OPERATION: "+ operationName+ " FORMULA NOT CORE: LR LABOR RUN", LR_LABOR_RUN_PRICE);
				}
				
				
				var OH_TOTAL = OH_SETUP_PRICE+LR_OH_PRICE;
				var LABOR_TOTAL = LS_LABOR_SETUP_PRICE+LR_LABOR_RUN_PRICE;
				if(!newLinesObj.hasOwnProperty(operationSequence)){
					newLinesObj[operationSequence] = {};
				}
				newLinesObj[operationSequence] = {
					"accountDebitOH": DIVISION_WIP_VARIABLES[classId].account,
					"accountCreditOH": 647,
					"accountDebitLABOR": DIVISION_WIP_VARIABLES[classId].account,
					"accountCreditLABOR": 731,
					"LABOR_TOTAL": LABOR_TOTAL,
					"OH_TOTAL": OH_TOTAL,
					"isPM": false,
					"operationName": operationName,
					"isFinalOperation": isFinalOperation
				}
				
				nlapiLogExecution("DEBUG","TOTALS LABOR TOTAL / OH TOTAL", LABOR_TOTAL + "/" +OH_TOTAL);
            }

			//THICK OPERATIONS
			//if the OPERATION is AI or AJ
			if((operationName.indexOf('AI-') == 0 || operationName.indexOf('AJ-') == 0 || operationName.indexOf('HR-') == 0) && panelSize){
				
				
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
				nlapiLogExecution("DEBUG","fGold pnlsize sq in",fGold);
				fGold = fGold * (THICK_GOLD_PCT / 100) * THICK_GOLD_THICK;  //THICK OPERATION calculation!!!
				//fGold = fGold * (THICK_GOLD_PCT / 100) * (THICK_GOLD_THICK / 100);  //THICK OPERATION calculation!!!
				fGold = fGold / 97959;

				//fGold = (fGold * GOLD_COST) * (noOfPanels && noOfPanels != 0 ? noOfPanels : 1);  //customize this to use our customQuantity from library file!!!  Not of noOfPanels!
				nlapiLogExecution("DEBUG","fGold formula",fGold+"/"+GOLD_COST+"/"+(noOfPanels ? noOfPanels : 1));
				fGold = (fGold * GOLD_COST) * (noOfPanels ? noOfPanels : 1);
				//write to our line object for later processing in the scheduled script
				preciousMetalsLineCostObj.operationsequence = operationSequence;
				preciousMetalsLineCostObj.operationname = operationName;
				preciousMetalsLineCostObj.goldcost = Number(fGold).toFixed(2);
				if(!newLinesObj.hasOwnProperty(operationSequence)){
					newLinesObj[operationSequence] = {};
				}
				newLinesObj[operationSequence]["PM"] = [];

				newLinesObj[operationSequence]["PM"].push({
					"accountDebitPM": DIVISION_WIP_VARIABLES[classId].account,
					"accountCreditPM": 552,
					"PM_TOTAL": fGold,
					"operationName": operationName,
					"isPM": true,
					"isFinalOperation": isFinalOperation
				});
				
				nlapiLogExecution('DEBUG', 'fGold in AI, AJ or HR is:', fGold);
		}

		//THIN OPERATIONS
		//if the OPERATION is AV or AW or B2 or I8
		if((operationName.indexOf('AV-') == 0 || operationName.indexOf('AW-') == 0 || operationName.indexOf('B2-') == 0 || operationName.indexOf('I8-') == 0) && panelSize){
			
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
				
				fGold = fGold * (THIN_GOLD_PCT / 100) * THIN_GOLD_THICK;   //THIN OPERATION calculation!!!
				//fGold = fGold * (THIN_GOLD_PCT / 100) * (THIN_GOLD_THICK/100);   //THIN OPERATION calculation!!!
				fGold = fGold / 97959;
				fGold = (fGold * GOLD_COST) * (noOfPanels ? noOfPanels : 1);  //customize this to use our customQuantity from library file!!!  Not of noOfPanels!
				 
				//write to our line object for later processing in the scheduled script
				preciousMetalsLineCostObj.operationsequence = operationSequence;
				preciousMetalsLineCostObj.operationname = operationName;
				preciousMetalsLineCostObj.goldcost = Number(fGold).toFixed(2);

				nlapiLogExecution('DEBUG', 'fGold in AV or AW or B2 or I8 is:', fGold);
				if(!newLinesObj.hasOwnProperty(operationSequence)){
					newLinesObj[operationSequence] = {};
				}

				newLinesObj[operationSequence]["PM"] = [];

				newLinesObj[operationSequence]["PM"].push({
					"accountDebitPM": DIVISION_WIP_VARIABLES[classId].account,
					"accountCreditPM": 552,
					"PM_TOTAL": fGold,
					"operationName": operationName,
					"isPM": true,
					"isFinalOperation": isFinalOperation
				});
		}
		//if the OPERATION is I0 or ENEPIG or HZ
		if((operationName.indexOf('I0-') == 0 || operationName.indexOf('ENEPIG-') == 0 || operationName.indexOf('HZ-') == 0) && panelSize){
			
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
				nlapiLogExecution('DEBUG', 'pnlSqIn is:', pnlSqIn);
				nlapiLogExecution('DEBUG', 'ENEPIG_GOLD is:', ENEPIG_GOLD_COST);
				nlapiLogExecution('DEBUG', 'ENEPIG_PALLADIUM is:', ENEPIG_PALLADIUM_COST);

				fEnepigGold = pnlSqIn * (30 / 100) * 3;
				nlapiLogExecution('DEBUG', 'ENEPIG_GOLD FORMULA is:', pnlSqIn +" * (30 / 100) * 3");
				nlapiLogExecution('DEBUG', 'ENEPIG_GOLD step 1 is:', fEnepigGold);
				//fEnepigGold = fEnepigGold / 97959;
				nlapiLogExecution('DEBUG', 'ENEPIG_GOLD FORMULA is:', fEnepigGold +" * 97959");
				fEnepigGold = fEnepigGold / 97959; // 060322 changed from divide to multiply
				nlapiLogExecution('DEBUG', 'ENEPIG_GOLD step 2 is:', fEnepigGold);
				//fEnepigGold = (fEnepigGold * GOLD_COST) * (noOfPanels ? noOfPanels : 1); //customize this to use our customQuantity from library file!!!  Not of noOfPanels!
				nlapiLogExecution('DEBUG', 'ENEPIG_GOLD FORMULA is:', "("+fEnepigGold +"*"+ ENEPIG_GOLD_COST+")");
				nlapiLogExecution('DEBUG', 'ENEPIG_GOLD FORMULA is:', "("+fEnepigGold +"*" +"("+noOfPanels+")");
				
				fEnepigGold = (fEnepigGold * ENEPIG_GOLD_COST) * (noOfPanels ? noOfPanels : 1); // 060322 changed from GOLD_COST to ENEPIG_GOLD_COST
				nlapiLogExecution('DEBUG', 'ENEPIG_GOLD step 3 is:', fEnepigGold);

				fEnepigPalladium = pnlSqIn * ( 30 / 100) * 10;
				nlapiLogExecution('DEBUG', 'ENEPIG_PALLADIUM FORMULA is:', pnlSqIn +" * (30 / 100) * 3");
				nlapiLogExecution('DEBUG', 'ENEPIG_PALLADIUM step 1 is:', fEnepigPalladium);
				//fEnepigPalladium = fEnepigPalladium / 97959;
				nlapiLogExecution('DEBUG', 'ENEPIG_PALLADIUM FORMULA is:', fEnepigPalladium +" * 97959");
				fEnepigPalladium = fEnepigPalladium / 97959; // 060322 changed from divide to multiply
				nlapiLogExecution('DEBUG', 'ENEPIG_PALLADIUM step 2 is:', fEnepigPalladium);
				//fEnepigPalladium = (fEnepigPalladium * 1950) * (noOfPanels ? noOfPanels : 1); //customize this to use our customQuantity from library file!!!  Not of noOfPanels!
				nlapiLogExecution('DEBUG', 'ENEPIG_GOLD FORMULA is:', "("+fEnepigPalladium +"*"+ ENEPIG_PALLADIUM_COST+")");
				nlapiLogExecution('DEBUG', 'ENEPIG_GOLD FORMULA is:', "("+fEnepigPalladium +"*" +"("+noOfPanels+")");
				fEnepigPalladium = (fEnepigPalladium * ENEPIG_PALLADIUM_COST) * (noOfPanels ? noOfPanels : 1); // 060322 changed from 1950 to ENEPIG_PALLADIUM_COST
				nlapiLogExecution('DEBUG', 'ENEPIG_PALLADIUM step 3 is:', fEnepigPalladium);
				
				//write to our line object for later processing in the scheduled script
				preciousMetalsLineCostObj.operationsequence = operationSequence;
				preciousMetalsLineCostObj.operationname = operationName;
				preciousMetalsLineCostObj.enepiggold = Number(fEnepigGold).toFixed(2);
				preciousMetalsLineCostObj.enepigpalladium = Number(fEnepigPalladium).toFixed(2);
				
				//TOTAL_COSTS = Number(fEnepigGold) + Number(fEnepigPalladium);
				
				//nlapiLogExecution('DEBUG', 'TOTAL_COSTS in I0 or ENEPIG:', TOTAL_COSTS);
				// nlapiLogExecution('DEBUG', 'ENEPIG_GOLD_COST in I0 or ENEPIG:', ENEPIG_GOLD_COST);
				// nlapiLogExecution('DEBUG', 'ENEPIG_PALLADIUM_COST in I0 or ENEPIG:', ENEPIG_PALLADIUM_COST);

				if(!newLinesObj.hasOwnProperty(operationSequence)){
					newLinesObj[operationSequence] = {};
				}

				newLinesObj[operationSequence]["PM"] = [];

				newLinesObj[operationSequence]["PM"].push({
					"accountDebitPM": DIVISION_WIP_VARIABLES[classId].account,
					"accountCreditPM": 556,
					"PM_TOTAL": fEnepigGold,
					"operationName": operationName+"_EG",
					"isPM": true,
					"isFinalOperation": isFinalOperation
				});

				newLinesObj[operationSequence]["PM"].push({
					"accountDebitPM": DIVISION_WIP_VARIABLES[classId].account,
					"accountCreditPM": 556,
					"PM_TOTAL": fEnepigPalladium,
					"operationName": operationName+"_EP",
					"isPM": true,
					"isFinalOperation": isFinalOperation
				});
			}
			
			nlapiLogExecution('DEBUG', 'Finishing iteration:', i);

			
		}//end saved search results for loop

		// START - get the FG Account used in the GL line
		// this is only if our WOC contains the FG Account
		var assemblyItem = transactionRecord.getFieldValue("item");
		var fgAccount = "";
		var fgWIPaccount = "";
		
		if(assemblyItem){
			fgAccount = nlapiLookupField("assemblyitem",assemblyItem,"assetaccount");
			fgWIPaccount = nlapiLookupField("assemblyitem",assemblyItem,"wipacct");
		}
		nlapiLogExecution("DEBUG","withFINALoperation/fgaccount",withFinalOperation+"/"+fgAccount);
		// END
		
		/**
		 * REVERSE ALL STANDARD LINES 04042022
		 */
		/**
		 * REVERSE ALL STANDARD LINES 04042022
		 */
		 var fgCostToReverse = 0;
		 var reverseNextLine = 0;
		 var computeFGline = false;
		 for(var i = 0; i < lineCount; i++){
		 var currLine = standardLines.getLine(i);
		 //var currLineRecType = transactionRecord.getRecordType();
		 var accountId = currLine.getAccountId();
		 var debitAmt = currLine.getDebitAmount();
		 var creditAmt = currLine.getCreditAmount();
         var memo = currLine.getMemo();
		 //nlapiLogExecution("DEBUG","STANDARD LINE i "+i,accountId+ " Debit "+debitAmt+" Credit "+creditAmt);
 
		 // this conditions does not reverse the FG account and we assume NS will compute it correctly based on our custom WIPS
		 
		 if(fgAccount != accountId && reverseNextLine != i && memo != "Cost of Sales Adjustment"){
			 if(Number(debitAmt) > Number(0)){
				 /**
				  * REVERSE DEBIT
				  */
				 var newLine = customLines.addNewLine();
				 newLine.setCreditAmount(Number(debitAmt).toFixed(2));
				 newLine.setAccountId(accountId);
				 newLine.setMemo("Reversing Entry");
			 }else if(Number(creditAmt) > Number(0)){
				 /**
				  * REVERSE CREDIT
				  */
				//fgCostToReverse += Number(creditAmt);
				 var newLine = customLines.addNewLine();
				 newLine.setDebitAmount(Number(creditAmt).toFixed(2));
				 newLine.setAccountId(accountId);
				 newLine.setMemo("Reversing Entry");
			 }
		 }else{
			nlapiLogExecution("DEBUG","account to reverse "+computeFGline +" / "+debitAmt +" / "+creditAmt,fgAccount+"=="+accountId);
			 if(fgAccount == accountId && !computeFGline && debitAmt > 0 && memo != "Cost of Sales Adjustment"){
				fgCostToReverse += Number(debitAmt);
				 reverseNextLine = i+1;
				 computeFGline = true;
			 }

			//  if(!computeFGline && debitAmt == 0 && creditAmt == 0){
			// 	reverseNextLine = i+1;
			// 	computeFGline = true;
			//  }
			 //nlapiLogExecution("DEBUG","account to reverse",fgAccount+"=="+accountId);
		 }
	 }
	// if(computeFGline){
		// /**
		//  * Replicates NS computation of projected value by adding up the standard lines which are FG Asset Accounts from WOCs
		//  */
		// var deductAllFGcosts = 0;
		//  var getStandardGLtotalFG = nlapiSearchRecord("workordercompletion",null,
		//  [
		// 	 ["type","anyof","WOCompl"], 
		// 	 "AND", 
		// 	 ["customgl","is","F"], 
		// 	 "AND", 
		// 	 ["createdfrom","anyof",woId], 
		// 	 "AND", 
		// 	 ["memo","doesnotcontain","reversing"], 
		// 	 "AND", 
		// 	 ["debitamount","greaterthan","0.00"], 
		// 	 "AND", 
		// 	 ["account","anyof",fgAccount]
		// 	 ], 
		//  [
		// 	 new nlobjSearchColumn("debitamount",null,"SUM")
		//  ]
		//  );
		//  if(getStandardGLtotalFG){
		// 	deductAllFGcosts = getStandardGLtotalFG[0].getValue("debitamount",null,"SUM") ? Number(getStandardGLtotalFG[0].getValue("debitamount",null,"SUM")) : 0;
		//  }

		// /**
		//  * Replicates NS computation of projected value by adding up the standard lines which are not FG Asset Accounts from WOCs
		//  */
		// var getStandardGLtotal = nlapiSearchRecord("workordercompletion",null,
		// [
		// 	["type","anyof","WOCompl"], 
		// 	"AND", 
		// 	["customgl","is","F"], 
		// 	"AND", 
		// 	["createdfrom","anyof",woId], 
		// 	"AND", 
		// 	["memo","doesnotcontain","reversing"], 
		// 	"AND", 
		// 	["debitamount","greaterthan","0.00"], 
		// 	"AND", 
		// 	["account","noneof",fgAccount]
		// 	], 
		// [
		// 	new nlobjSearchColumn("debitamount",null,"SUM")
		// ]
		// );
		
		//var computeFGbol = false;
		//if(computeFGline){
			//builtScrap += completedQty;
		//}
		//nlapiLogExecution("DEBUG","builtscrap/woRecordqty",builtScrap+"/"+woRecordQuantity)
  /**
	 if(builtScrap >= woRecordQuantity){
		computeFGbol = true;
		/**
		 * Sum all native NS GL Lines with FG
		 
		 var nativeFGtotal = nlapiSearchRecord("workordercompletion",null,
		 [
			 ["type","anyof","WOCompl"], 
			 "AND", 
			 ["customgl","is","F"], 
			 "AND", 
			 ["createdfrom","anyof",woId], 
			 "AND", 
			 ["memo","doesnotcontain","reversing"], 
			 "AND", 
			 ["debitamount","greaterthan","0.00"], 
			 "AND", 
			 ["account","anyof",fgAccount]
			 ], 
		 [
			 new nlobjSearchColumn("debitamount",null,"SUM")
		 ]
		 );
		 var nativeFGtotal_cost = 0;
		 nlapiLogExecution('DEBUG','nativeFGtotal length',nativeFGtotal.length)
		 //if(nativeFGtotal){
			//nativeFGtotal_cost = Number(nativeFGtotal[0].getValue("debitamount",null,"SUM"));
			//nativeFGtotal_cost += fgCostToReverse; // add saved search from previous FG and current WOC FG
			//nlapiLogExecution("DEBUG","TOTAL NATIVE FG",nativeFGtotal_cost);
			//if(nativeFGtotal_cost > 0){
				//nlapiLogExecution("DEBUG","FG cost to reverse",fgWOCtotalCosts);
				//var newLine = customLines.addNewLine();
				//newLine.setCreditAmount(Number(nativeFGtotal_cost).toFixed(2));
				//newLine.setAccountId(Number(fgAccount));
				//newLine.setMemo("Reversing Entry - FG");
   
				//var newLine = customLines.addNewLine();
			   //newLine.setDebitAmount(Number(nativeFGtotal_cost).toFixed(2));
			   //newLine.setAccountId(Number(fgWIPaccount));
			   //newLine.setMemo("Reversing Entry - FG");
			//}
		 //}

		 /**
		  * Sum all custom GL Lines with WIP
		  *

		  var customWIPtotal = nlapiSearchRecord("workordercompletion",null,
		  [
			  ["type","anyof","WOCompl"], 
			  "AND", 
			  ["customgl","is","T"], 
			  "AND", 
			  ["createdfrom","anyof",woId], 
			  "AND", 
			  ["memo","doesnotcontain","reversing"], 
			  "AND", 
			  ["debitamount","greaterthan","0.00"], 
			  "AND", 
			  ["account","anyof",DIVISION_WIP_VARIABLES[classId].account]
			  ], 
		  [
			  new nlobjSearchColumn("debitamount",null,"SUM")
		  ]
		  );
		  var customWIPtotal_cost = 0;
		 if(customWIPtotal){
			customWIPtotal_cost = Number(customWIPtotal[0].getValue("debitamount",null,"SUM"));
			nlapiLogExecution("DEBUG","TOTAL WIP CUSTOM GL",customWIPtotal_cost);
			if(customWIPtotal_cost && customWIPtotal_cost > 0){
				//nlapiLogExecution("DEBUG","custom FG cost added",fgWOCtotalCosts);
			// 	var newLine = customLines.addNewLine();
			// 	newLine.setCreditAmount(Number(customWIPtotal_cost).toFixed(2));
			// 	newLine.setAccountId(Number(fgWIPaccount));
			// 	newLine.setMemo("FG");
   
			// 	var newLine = customLines.addNewLine();
			//    newLine.setDebitAmount(Number(customWIPtotal_cost).toFixed(2));
			//    newLine.setAccountId(Number(fgAccount));
			//    newLine.setMemo("FG");
			}
		 }
		}
  */
	// 	 var adjustmentFGcost = 0;
	// 	// updated logs to error
	// 	if(getStandardGLtotal){
	// 		nlapiLogExecution("ERROR","TOTAL WOC TO ADD TO FG REVERSAL",fgCostToReverse)
	// 		var fgWOCtotalCosts = getStandardGLtotal[0].getValue("debitamount",null,"SUM")? Number(getStandardGLtotal[0].getValue("debitamount",null,"SUM")) : 0;
	// 		nlapiLogExecution("ERROR","TOTAL WOC COST FROM SEARCH",fgWOCtotalCosts)
	// 		fgWOCtotalCosts += fgCostToReverse; // we get the total from the saved search for total WIP costs and add the current WOC costs
	// 		fgWOCtotalCosts -= deductAllFGcosts;
	// 		nlapiLogExecution("DEBUG","adjustment fg cost formula",nativeFGtotal_cost+"-"+customFGtotal_cost);
	// 		adjustmentFGcost = nativeFGtotal_cost - customFGtotal_cost;
	// 		nlapiLogExecution("DEBUG","ADJUSTMENT FG COST", adjustmentFGcost);
	// 		fgWOCtotalCosts += adjustmentFGcost;
	// 		/**
	// 		 * We reverse the standard FG Line in our WOC
	// 		 */
	// 	if(fgWOCtotalCosts > 0){
			
			// nlapiLogExecution("DEBUG","FG cost to reverse",fgWOCtotalCosts);
			//  var newLine = customLines.addNewLine();
			//  newLine.setCreditAmount(Number(fgWOCtotalCosts).toFixed(2));
			//  newLine.setAccountId(Number(fgAccount));
			//  newLine.setMemo("Reversing Entry");

			//  var newLine = customLines.addNewLine();
			// newLine.setDebitAmount(Number(fgWOCtotalCosts).toFixed(2));
			// newLine.setAccountId(Number(fgWIPaccount));
			// newLine.setMemo("Reversing Entry");
	// 	}
	// 	}
	// }
	var totalWipCost = 0;
	Object.keys(newLinesObj).forEach(function(seq){
		var seqObj = newLinesObj[seq];
		nlapiLogExecution("DEBUG","seqObj",JSON.stringify(seqObj));
		if(seqObj.hasOwnProperty("PM")){
			seqObj["PM"].forEach(function(PM_TYPE){
				if(PM_TYPE && PM_TYPE.isPM && PM_TYPE.PM_TOTAL > 0){
					//nlapiLogExecution("DEBUG","EXECUTE PRECIOUS METALS LINE");
					//create new Credit line
					var newLine = customLines.addNewLine();
					newLine.setDebitAmount(Number(PM_TYPE.PM_TOTAL).toFixed(2));
					newLine.setAccountId(PM_TYPE.accountDebitPM);
					newLine.setMemo(seq+" "+PM_TYPE.operationName);
					//create new Credit line
					var newLine = customLines.addNewLine();
					newLine.setCreditAmount(Number(PM_TYPE.PM_TOTAL).toFixed(2));
					newLine.setAccountId(PM_TYPE.accountCreditPM);
					newLine.setMemo(seq+" "+PM_TYPE.operationName);
	
					totalWipCost += Number(PM_TYPE.PM_TOTAL)
				}
			})
		}
		

			//nlapiLogExecution("DEBUG","EXECUTE DRILL/OTHER COSTS LINE");
			OH_TOTAL = seqObj.OH_TOTAL;
			LABOR_TOTAL = seqObj.LABOR_TOTAL;
			debitAccOH = seqObj.accountDebitOH;
			creditAccOH = seqObj.accountCreditOH;
			debitAccLabor = seqObj.accountDebitLABOR;
			creditAccLabor = seqObj.accountCreditLABOR;
			//nlapiLogExecution("DEBUG","ACCOUNTS OH LABOR DROH CROH DRLBR CRLBR",OH_TOTAL+"/"+LABOR_TOTAL+"/"+debitAccOH+"/"+creditAccOH+"/"+debitAccLabor+"/"+creditAccLabor);
			if(OH_TOTAL && OH_TOTAL > 0){
				/**
				 * SET DEBIT OH_SETUP_PRICE
				 */
				var newLine = customLines.addNewLine();
				newLine.setDebitAmount(Number(OH_TOTAL).toFixed(2));
				newLine.setAccountId(seqObj.accountDebitOH); // 04052022 for confirmation
				newLine.setMemo(seq+" "+seqObj.operationName);

				/**
				 * SET CREDIT OH_SETUP_PRICE
				 */
				var newLine = customLines.addNewLine();
				newLine.setCreditAmount(Number(OH_TOTAL).toFixed(2));
				newLine.setAccountId(seqObj.accountCreditOH);
				newLine.setMemo(seq+" "+seqObj.operationName);

				totalWipCost += Number(OH_TOTAL)
			}
			// if amount is greater than 0 create a debit and credit line
			if(LABOR_TOTAL && LABOR_TOTAL > 0){
				/**
				 * SET DEBIT LS_LABOR_SETUP_PRICE
				 */
				var newLine = customLines.addNewLine();
				newLine.setDebitAmount(Number(LABOR_TOTAL).toFixed(2));
				newLine.setAccountId(seqObj.accountDebitLABOR);
				newLine.setMemo(seq+" "+seqObj.operationName);
	
				/**
				 * SET CREDIT LS_LABOR_SETUP_PRICE
				 */
				var newLine = customLines.addNewLine();
				newLine.setCreditAmount(Number(LABOR_TOTAL).toFixed(2));
				newLine.setAccountId(seqObj.accountCreditLABOR);
				newLine.setMemo(seq+" "+seqObj.operationName);

				totalWipCost += Number(LABOR_TOTAL);
			}
		
	});
	// removed adding of custom gl FG - refer to new design where a JOURNAL ENTRY is created
	//if(computeFGbol){
		//customWIPtotal_cost += totalWipCost;

		//if(customWIPtotal_cost > 0){
			//var newLine = customLines.addNewLine();
			//newLine.setCreditAmount(Number(customWIPtotal_cost).toFixed(2));
			//newLine.setAccountId(Number(fgWIPaccount));
			//newLine.setMemo("Custom GL FG");

			//var newLine = customLines.addNewLine();
			//newLine.setDebitAmount(Number(customWIPtotal_cost).toFixed(2));
			//newLine.setAccountId(Number(fgAccount));
			//newLine.setMemo("Custom GL FG");
		//}
	//}
	//update
	//nlapiLogExecution("DEBUG","EXECUTE FG CUSTOM LINE",computeFGline+"/"+fgAccount+"/"+fgWIPaccount+"/"+totalWipCost);
	// if(computeFGline){
	// 	//nlapiLogExecution("DEBUG","obj mapping",JSON.stringify(wocGLcostObj));
	// 	Object.keys(wocGLcostObj).forEach(function(op){
	// 		//nlapiLogExecution("ERROR","OPERATION COST OBJ",JSON.stringify(wocGLcostObj[op]))
	// 		//nlapiLogExecution("ERROR","costPerQty",wocGLcostObj[op].costPerQty);

	// 		if(wocGLcostObj[op].completedQty){
	// 			wocGLcostObj[op].costPerQty = wocGLcostObj[op].totalCost / wocGLcostObj[op].completedQty;
	// 		}else{
	// 			wocGLcostObj[op].costPerQty = 0;
	// 		}
	// 		//nlapiLogExecution("ERROR","costPerQty",wocGLcostObj[op].costPerQty);
	// 		var opCost = wocGLcostObj[op].costPerQty * completedQty;
	// 		//nlapiLogExecution("ERROR","costPerCompleted",opCost);
	// 		totalWipCost += opCost;
	// 		//nlapiLogExecution("ERROR","totalWipCost +=",totalWipCost);
	// 	});
	// 	//nlapiLogExecution("DEBUG","TOTAL WIP COST",totalWipCost);
	// 	totalWipCost = (totalWipCost/2).toFixed(2); // we divide by two since half goes to debit and half goes to credit
	// 	//nlapiLogExecution("DEBUG","TOTAL WIP COST HALF",totalWipCost);
	// 	if(fgAccount && fgWIPaccount && totalWipCost > 0){
	// 		var newLine = customLines.addNewLine();
	// 		newLine.setDebitAmount(Number(totalWipCost).toFixed(2));
	// 		newLine.setAccountId(Number(fgAccount));
	// 		newLine.setMemo("FG");

	// 		var newLine = customLines.addNewLine();
	// 		newLine.setCreditAmount(Number(totalWipCost).toFixed(2));
	// 		newLine.setAccountId(Number(fgWIPaccount));
	// 		newLine.setMemo("FG");
			
	// 	}
	// }

    nlapiLogExecution('DEBUG', 'Finished script');

	}catch(e){
		nlapiLogExecution('ERROR', e.name, e.message);
	}
	nlapiLogExecution("DEBUG","END TIME",new Date().toString());


}