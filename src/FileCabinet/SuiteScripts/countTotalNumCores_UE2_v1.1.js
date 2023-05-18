/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
 define(['N/record', 'N/search', 'N/format', './lib/rdaSaloraCustomLibrary_lib.js', './createCustomOperationLineRecords_CM2.1.js'],
 function(record, search, format, rdaSaloraCustomLibrary_lib, custLib) {

     /**
      * Function definition to be triggered before record is loaded.
      *
      * @param {Object} context
      * @param {Record} context.newRecord - New record
      * @param {string} context.type - Trigger type
      * @param {Form} context.form - Current form
      * @Since 2015.2
      */
     function afterSubmit(context) {
         
         
     try{	
         
         var rec = context.newRecord
         var oldRecord = context.oldRecord
         var recId = rec.id
		 log.debug('Firing on recId / context.type:', recId +' / '+ context.type)
            ///updateWOCustomCostFields(rec)
         // || context.type == 'edit')
         if(rec.type == 'workorder' && (context.type == 'create' || context.type == 'edit')){
			
			 var recObjLoaded = record.load({type: record.Type.WORK_ORDER, id: recId, isDynamic: false})
			 var createdFromId = 0
			 if(recObjLoaded.getText({fieldId: 'createdfrom'}).toLowerCase().indexOf('sales') > -1) createdFromId = recObjLoaded.getValue({fieldId: 'createdfrom'})
			 var createdFromSoId = recObjLoaded.getValue({fieldId: 'custbody_cnt_created_fm_so'}) || createdFromId
			 var assemblyItemId = recObjLoaded.getValue({fieldId: 'assemblyitem'}) || recObjLoaded.getValue({fieldId: 'item'})
			 log.debug('assemblyItemId is:', assemblyItemId)
			 
             var lineUniqueKeyToUse = 0
             var shipDate = 0
             var qtyDue = 0
             var numHitsPth = 0
			 var numHitsFill = 0
			 var delDays = 0
			 var drillFillCustomValue = 0
			 var pthCustomValue = 0
			 var shipTo = 0
		     var materialType = 0
			 var finishType = 0
			 var isOutsourced = false
			 var salesOrderType = 0
             var boardPitch = 0
             var boardThickness = 0
             var qfactorProd = 0;

             qfactorProd = getQfactorProd();
			 
			 var noOfPanels = rec.getValue({fieldId: 'custbody_cntm_no_of_panel'})
             
             //set TOTAL NUM OF CORES body field, counting the 'Cores' by looking at components
             var totalNumberOfCores = returnTotalNumberOfCores(recId);  //get total number of Cores.  This is designated by custitem field INVENTORY ITEM TYPE when it's equal to CORE
             var totalNumberOfCoresValue = totalNumberOfCores ? totalNumberOfCores : 0
             
			var lineUniqueKeyArray = []
             lineUniqueKey = rec.getValue({fieldId: 'custbody_cntm_so_line_unique_key'})  //may be a comma separated list
			 if(!lineUniqueKey) log.debug('No SO LINE UNIQUE KEY present on WO:', recObjLoaded.getValue({fieldId: 'tranid'}))

			 if(lineUniqueKey.indexOf(',') > -1){
				 
				 lineUniqueKeyArray = lineUniqueKey.split(',') 
				 
			 }
			 else{
				 
				 lineUniqueKeyToUse = lineUniqueKey
				 
			 }
             


				
				 

				 
				 
				 if(lineUniqueKeyArray.length){
					 
						lineUniqueKeyToUse = lineUniqueKeyArray[0]
						
				 }
				  
				 
				 
					 log.debug('lineUniqueKey / lineUniqueKeyToUse is:', lineUniqueKey +' / '+ lineUniqueKeyToUse)
			         //search the created from SO whether the WO has or does not have without LUK
					 var returnObject = returnSalesOrderLineData(lineUniqueKeyToUse, createdFromSoId, assemblyItemId)
					 log.debug('returnObject is:', JSON.stringify(returnObject))
				
                   
                 shipDate = returnObject.shipdate
                 
                 qtyDue = returnObject.qtydue
				 
				 delDays = returnObject.deliverydays
				 
				 shipTo = returnObject.shipto
				 
				 isOutsourced = returnObject.isoutsourced
				 
				 salesOrderType = returnObject.salesordertype
/**				 
				 if(shipTo && shipTo != null && shipTo.indexOf('1660 East Race') == -1){  //if not '1660 East Race' then show 'Cust'

					 shipTo = 'Cust'
					 
				 }
				 else if(shipTo && shipTo != null){
					
					 shipTo = 'ASM'					
					 
				 }
**/				 	 

             
             
             //whether LINE UNIQUE KEY value is present on the WORK ORDER or not, we can still lookup the DRILLHITSPTH custom field on the ASSEMBLY ITEM
             var itemReturnObject = returnCustomAssemblyItemFields(assemblyItemId)	
			 numHitsPth = itemReturnObject?.numhitspth	
			 numHitsFill = itemReturnObject?.numhitsfill
			 materialType = itemReturnObject?.materialtype
			 finishType = itemReturnObject?.finishtype
			 numOfLaminations = itemReturnObject?.numoflaminations
             boardPitch = itemReturnObject?.boardPitch
             boardThickness = itemReturnObject?.boardThickness
			
	//Return WIP variables in order to do custom calculations using custom formulas
	var wipVariablesSearchResults = rdaSaloraCustomLibrary_lib.returnWipVariablesSearchResults()
	if(wipVariablesSearchResults[0].getValue({name: 'custrecord_drillhitsperhour'})){   

		var drillHitsPerMinute = wipVariablesSearchResults[0].getValue({name: 'custrecord_drillhitsperhour'})  //now considered a per minute value even though scriptid still named 'hour'
		log.debug('drillHitsPerMinute is:', drillHitsPerMinute)
	
		if(numHitsFill && drillHitsPerMinute){
			
			
			//tempvar1 = NUMBER OF HITS * NUMBER OF PANELS
			//tempvar1 = tempvar1 / NUM HITS PER MIN
		
			//altogether as one formula:
			// (NUMBER OF HITS * NUMBER OF PANELS) / NUM HITS PER MIN
			var drillFillCustomValue = ((Number(numHitsFill) * Number(noOfPanels)) / Number(drillHitsPerMinute)) / 60
			
		}
		if(numHitsPth && drillHitsPerMinute){
			
			//tempvar1 = NUMBER OF HITS PTH * NUMBER OF PANELS
			//tempvar1 = tempvar1 / NUM HITS PER MIN
		
			//altogether as one formula:
			// (NUMBER OF HITS PTH * NUMBER OF PANELS) / NUM HITS PER MIN
			var pthCustomValue = ((Number(numHitsPth) * Number(noOfPanels)) / Number(drillHitsPerMinute)) / 60
			
				
		}


	}		

             log.debug('shipDate / qtyDue / numHitsPth / numHitsFill / delDays / shipTo / materialType / finishType is:', shipDate +' / '+ qtyDue +' / '+ numHitsPth +' / '+ numHitsFill +' / '+ delDays +' / '+ shipTo +' / '+ materialType +' / '+ finishType)
			 log.debug('drillFillCustomValue / pthCustomValue:', drillFillCustomValue +' / '+ pthCustomValue)
             
             //if we determined either a SHIPDATE or a TOTALNUMBEROFCORES successfully, then lets load and write to the WO
             //if(shipDate != 0 || qtyDue != 0 || numHitsPth != 0 || numHitsFill != 0 || delDays != 0 || drillFillCustomValue != 0 || pthCustomValue != 0 || shipTo != 0 || materialType != 0 || finishType != 0){
                 
                 
                 
                 
                     if(shipDate != 0){
                         
                         recObjLoaded.setValue({fieldId: 'custbody_wo_ship_date', value: shipDate})
                         
                     }else{
                        shipDate = '';
                        recObjLoaded.setValue({fieldId: 'custbody_wo_ship_date', value: shipDate})
                     }

                     if(qtyDue != 0){
                         
                         recObjLoaded.setValue({fieldId: 'custbody_qty_due', value: qtyDue})
                         
                     }else{
                        qtyDue = '';
                        recObjLoaded.setValue({fieldId: 'custbody_qty_due', value: qtyDue})
                     }
                     
					 
					 if(numHitsPth != 0){
                         
                         recObjLoaded.setValue({fieldId: 'custbody_rda_num_hits_pth', value: numHitsPth})
                         
                     }
					 
					 if(numHitsFill != 0){
                         
                         recObjLoaded.setValue({fieldId: 'custbody_num_hits_fill', value: numHitsFill})
                         
                     }
					 
					 if(delDays != 0){
						 
						 recObjLoaded.setValue({fieldId: 'custbody_delivery_days', value: delDays})
						 
					 }else{
                        delDays = '';
                        recObjLoaded.setValue({fieldId: 'custbody_delivery_days', value: delDays})
                     }
					 
					 if(drillFillCustomValue != 0){
						 
						 recObjLoaded.setValue({fieldId: 'custbody_fill_run_mins', value: parseFloat(drillFillCustomValue).toFixed(2)})
						 
					 }
					 
					 if(pthCustomValue != 0){
						 
						 recObjLoaded.setValue({fieldId: 'custbody_pth_run_mins', value: parseFloat(pthCustomValue).toFixed(2)})
						 
					 }
					 
					 if(shipTo != 0){
						 
						 recObjLoaded.setValue({fieldId: 'custbody_ship_to', value: shipTo})
						 
					 }else{
                        shipTo = '';
                        recObjLoaded.setValue({fieldId: 'custbody_ship_to', value: shipTo})
                     }
					 
					 if(materialType != 0){
						 
						 recObjLoaded.setValue({fieldId: 'custbody_material_type', value: materialType})
						 
					 }
					 
					 if(isOutsourced == true){
						 
						 recObjLoaded.setValue({fieldId: 'custbody_outsourced', value: true})
						 
					 }
					 
					 if(finishType && finishType != null && finishType != 0){
						 
						 log.debug('finishType is:', finishType)
						 recObjLoaded.setValue({fieldId: 'custbody_wo_finishtype', value: finishType})
						 
					 }
					 
					 if(salesOrderType != 0){
						 
		//				 recObjLoaded.setValue({fieldId: 'custbody_cnt_release_type', value: salesOrderType})   //
						 
					 }
					 
					 if(numOfLaminations != 0){
						 
						 recObjLoaded.setValue({fieldId: 'custbody_wo_no_laminations', value: numOfLaminations})
						 
					 }

                     if(boardPitch != 0){

                        recObjLoaded.setValue({fieldId: 'custbody_cntm_boardpitch', value: Number(boardPitch)})
                     }else{
                       recObjLoaded.setValue({fieldId: 'custbody_cntm_boardpitch', value: 0})
                     }
                     
                     if(boardThickness != 0){

                        recObjLoaded.setValue({fieldId: 'custbody_cnt_board_thickness', value: Number(boardThickness)})
                     }else{
                       recObjLoaded.setValue({fieldId: 'custbody_cnt_board_thickness', value: 0})
                     }
                     
           if(rec.type == 'workorder' && (context.type == 'create')){
                     recObjLoaded.setValue({ fieldId: 'custbody_rda_qfactor', value: qfactorProd})
           }
					 
					 //if no totalNumberOfCoresValue value it has defaulted to 0, we will write 0
					 recObjLoaded.setValue({fieldId: 'custbody_total_num_cores', value: totalNumberOfCoresValue})
					 
					 //mark WO as 
					let custOperations = custLib.searchCustomOperations([recId])
					let outsideServices = custOperations.filter(f => f.name.match(/h5-outside electroless 1|h6-outside electroless 2|70-outside enepig|6z-outside enig|hu-outside et|6y-outside hasl|h8-outside service prep|6x-outside services|71-outside sodium etch/gi))
					recObjLoaded.setValue({fieldId: 'custbody_wo_outsideservice', value: (outsideServices.length > 0)})
 
                         
                 //recObjLoaded.save({enableSourcing: false, ignoreMandatoryFields: true})
                 log.debug('Set totalNumberOfCores / shipDate:',  totalNumberOfCores +' / '+ shipDate)	
             //}

             if(rec.type == 'workorder' && (context.type == 'edit')){
			 
                //var recObjLoaded = record.load({type: record.Type.WORK_ORDER, id: recId, isDynamic: false})
                
                var totalNumberOfCores = returnTotalNumberOfCores(recId);  //get total number of Cores.  This is designated by custitem field INVENTORY ITEM TYPE when it's equal to CORE
                var totalNumberOfCoresValue = totalNumberOfCores ? totalNumberOfCores : 0
                //if no totalNumberOfCoresValue value it has defaulted to 0, we will write 0
                recObjLoaded.setValue({fieldId: 'custbody_total_num_cores', value: totalNumberOfCoresValue})
               
                
            }

            log.debug("setting field values:", 
            `shipDate: ${shipDate} /
            qtyDue: ${qtyDue} /
            delDays: ${delDays} /
            shipTo: ${shipTo} /
            noOfCores: ${totalNumberOfCoresValue} /
            boardPitch: ${boardPitch} /
            boardThickness: ${boardThickness} /
            materialType: ${materialType} /
            finishType: ${finishType} /
            noOfLamination: ${numOfLaminations} /
            noOfPanels: ${noOfPanels} /
            salesOrderType: ${salesOrderType} /
            drillFillCustom: ${drillFillCustomValue} /
            numHitsPth: ${numHitsPth} /
            numHitsFill: ${numHitsFill} /
            pthCustomValue: ${pthCustomValue} /
            qfactorProd: ${qfactorProd} /
            `)

            var savedWoID = recObjLoaded.save({enableSourcing: false, ignoreMandatoryFields: true})

            log.debug("saved work order!", savedWoID)
         
         
         }//end if WO create
		 
		 
		 
		 
		 
		 


         
     }catch(e){

         log.debug(e.name, e.message);
     }			

     }//end afterSubmit function
     



 
 function returnTotalNumberOfCores(woid){
     
     NUMBER = Number(0)
     TOTAL_NUM_CORES = Number(0)
     
     var workorderSearchObj = search.create({
        type: "workorder",
        filters:
        [
           ["type","anyof","WorkOrd"], 
           "AND", 
           ["internalid","anyof", woid], 
           "AND", 
           ["formulanumeric: CASE WHEN {name} IS NOT NULL THEN 1 ELSE 0 END","equalto","1"], 
           "AND", 
           ["mainline","is","F"], 
           "AND", 
           ["quantity","greaterthan","0"],
           "AND", 
           ["item.custitem_rda_item_type","anyof","11"]  //INVENTORY ITEM TYPE (UPDATED)   //CORE
        ],
        columns:
        [
           search.createColumn({name: "quantity", summary: "SUM", label: "Quantity"})
        ]
     });
     var searchResultCount = workorderSearchObj.runPaged().count;
     log.debug("workorderSearchObj result count",searchResultCount);
     workorderSearchObj.run().each(function(result){
        
        NUMBER = result.getValue({name: "quantity", summary: "SUM"})
        
        return true;
     });
             
     TOTAL_NUM_CORES = NUMBER ? NUMBER : 0
     
     log.debug('returnTotalNumberOfCores returning:', TOTAL_NUM_CORES)
     return TOTAL_NUM_CORES
     
 }
    // Added 03092022 by lc as per request
/**
    function updateWOCustomCostFields (rec) {
        try {
            let vars = {}
            let woId, soId, itemId;

            if (rec.type == 'workorder') {
                woId = rec.id
                soId = rec.getValue({ fieldId: 'custbody_cnt_created_fm_so' })
                itemId = rec.getValue({ fieldId: 'assemblyitem' })
            } else if (rec.type == 'manufacturingoperationtask') {
                woId = rec.getValue({ fieldId: 'workorder' })
                if (woId) {
                    let wo = search.lookupFields({
                        type: 'workorder',
                        id: woId,
                        columns: ['custbody_cnt_created_fm_so', 'item']
                    })
                    soId = wo.custbody_cnt_created_fm_so.length?wo.custbody_cnt_created_fm_so[0].value:''
                    itemId = wo.item.length?wo.item[0].value:''
                }
            }
            
            if (soId) {
                let so = search.lookupFields({
                    type: 'salesorder',
                    id: soId,
                    columns: 'custbody_rda_sales_order_type'
                })
                vars['custbody_rda_sales_order_type'] = so.custbody_rda_sales_order_type.length?so.custbody_rda_sales_order_type[0].value:''
                log.debug('SO', { so })
            }
            if (itemId) {
                let item = search.lookupFields({
                    type: 'item',
                    id: itemId,
                    columns: ['custitem_finishtype', 'custitem_cnt_numlams']
                })
                vars['custbody_wo_finishtype'] = item.custitem_finishtype.length?item.custitem_finishtype[0].value:''
                vars['custbody_wo_no_laminations'] = item.custitem_cnt_numlams || ''
                log.debug('Assembly item', { item })
            }

            let custOperations = custLib.searchCustomOperations([woId])
            let outsideServices = custOperations.filter(f => f.name.match(/h5-outside electroless 1|h6-outside electroless 2|70-outside enepig|6z-outside enig|hu-outside et|6y-outside hasl|h8-outside service prep|6x-outside services|71-outside sodium etch/gi))
            vars['custbody_wo_outsideservice'] = outsideServices.length > 0

            log.debug('VARS', vars)

            if (Object.keys(vars).length) {
                record.submitFields({
                    type: 'workorder',
                    id: woId,
                    values: vars,
                    options: {
                        ignoreMandatoryFields: true,
                    }
                })
            }
        } catch(e) {
            log.debug('updateWOCustomCostFields error', e.message)
        }
    }
 **/

function getQfactorProd(){
    var qfactorProd = 0;
    var customrecord_manual_costs_inputSearchObj = search.create({
        type: "customrecord_manual_costs_input",
        filters:
        [
        ],
        columns:
        [
           "custrecord_qfactor_production",
           search.createColumn({
            name: "created",
            sort: search.Sort.DESC
         })
        ]
     });
     var searchResultCount = customrecord_manual_costs_inputSearchObj.runPaged().count;
     log.debug("customrecord_manual_costs_inputSearchObj result count",searchResultCount);
     if(searchResultCount > 0){
        customrecord_manual_costs_inputSearchObj.run().getRange({start: 0, end: 1}).forEach(function(result){
            qfactorProd = result.getValue({name: "custrecord_qfactor_production"});
        })
     }
     log.debug("qfactorprod",qfactorProd);
     return qfactorProd;
}
 
 
 function returnSalesOrderLineData(luk, createdfromsoid, assemblyitemid){
     log.debug("returnSalesOrderLineData params", luk +' / '+ createdfromsoid +' / '+ assemblyitemid)
	 var returnObject = {};
	 
	 if(luk){
		 
		var filtersArray =  [
           ["type","anyof","SalesOrd"], 
           "AND", 
           ["mainline","is","F"], 
           "AND", 
           ["taxline","is","F"], 
           "AND", 
           ["cogs","is","F"], 
           "AND", 
           ["shipping","is","F"], 
           "AND", 
           ["lineuniquekey","equalto", luk]
        ];
		
	 }
     
    //  else if(createdfromsoid){
		 
	// 	 var filtersArray =  [
    //        ["type","anyof","SalesOrd"],
	// 	   "AND", 
    //        ["internalid","anyof",createdfromsoid], 		   
    //        "AND", 
    //        ["mainline","is","F"], 
    //        "AND", 
    //        ["taxline","is","F"], 
    //        "AND", 
    //        ["cogs","is","F"], 
    //        "AND", 
    //        ["shipping","is","F"],
	// 	   "AND", 
	// 	   ["item","anyof", assemblyitemid]
    //     ];
		 
		 
		 
	//  }
	 else{
		 
		return returnObject 
		 
	 }
		
		
	 
   
     var salesorderLineSearchObj = search.create({
        type: "salesorder",
        filters: filtersArray
       ,
        columns:
        [
           search.createColumn({name: "trandate", label: "Date"}),
           search.createColumn({name: "tranid", label: "Document Number"}),
           search.createColumn({name: "entity", label: "Name"}),
           search.createColumn({name: "item", label: "Item"}),
           search.createColumn({name: "quantity", label: "Quantity"}),
           search.createColumn({name: "amount", label: "Amount"}),
           search.createColumn({name: "shipdate", label: "Ship Date"}),
           search.createColumn({name: "formulanumeric", formula: "NVL({quantity} - {quantityshiprecv}, 0)", label: "Formula (Numeric)"}),
		   search.createColumn({name: "custcol_cntm_deliverydays", label: "Del Delivery"}),
		   search.createColumn({name: "shipto", label: "Ship To"}),
		   search.createColumn({name: "shipaddress", label: "Ship Address"}),
		   search.createColumn({name: "custcol_rda_fab_outsource_house", label: "Fab House Outsource"}),
		   search.createColumn({name: "custcol_rdda_asm_outsource_vendor", label: "Assy House Outsource"}),
		   search.createColumn({name: "custbody_rda_sales_order_type", label: "Order Type"}),
		   search.createColumn({name: "shipname", label: "Ship Name"}),
		   search.createColumn({name: "custcol_kms_fab_ship_to", label: "Line Item Ship To"}),
        ]
     });
     var searchResultCount = salesorderLineSearchObj.runPaged().count;
     log.debug("salesorderLineSearchObj result count",searchResultCount);
     salesorderLineSearchObj.run().each(function(result){
         
		 returnObject.shipdate = result.getValue({name: "shipdate"}) || '';
         returnObject.qtydue = result.getValue({name: "formulanumeric", formula: "NVL({quantity} - {quantityshiprecv}, 0)"})
         returnObject.deliverydays = result.getValue({name: "custcol_cntm_deliverydays"})
		 //returnObject.shipto = result.getValue({name: "shipname"})
		 returnObject.shipto = result.getText({name: "custcol_kms_fab_ship_to"})
		 returnObject.salesordertype = result.getValue({name: "custbody_rda_sales_order_type"})
		 
		 if(!result.getValue({name: "custcol_rda_fab_outsource_house"}) && !result.getValue({name: "custcol_rdda_asm_outsource_vendor"})){
			 
			returnObject.isoutsourced =  false 
			
		 }
		 else{
			 
			 returnObject.isoutsourced =  true 
			 
		 }

         return true;
     });

     log.debug('returnSalesOrderLineData returning:', JSON.stringify(returnObject))
     return returnObject
 }
 
 
 function returnCustomAssemblyItemFields(assemblyitemid){
     
	 log.debug('returnCustomAssemblyItemFields, assemblyitemid is:', assemblyitemid)
     var returnObject = {}
     
	 if(assemblyitemid){
		 
			 var itemSearchLookupObj = search.lookupFields({type: search.Type.ITEM, id: assemblyitemid, columns: ['custitem_rda_num_hits_pth', 'custitem_cntm_numhits', 'custitem_materialtype', 'custitem_finishtype', 'custitem_cnt_numlams', 'custitem_cnt_boardpitch','custitem_boardthickness']})
			 
			 if(Object.keys(itemSearchLookupObj).length > 0){
					  
				 returnObject.numhitspth = itemSearchLookupObj?.custitem_rda_num_hits_pth
				 returnObject.numhitsfill = itemSearchLookupObj?.custitem_cntm_numhits
				 returnObject.materialtype = itemSearchLookupObj?.custitem_materialtype
				 returnObject.finishtype = itemSearchLookupObj?.custitem_finishtype[0]?.value
				 returnObject.numoflaminations = itemSearchLookupObj?.custitem_cnt_numlams
                 returnObject.boardPitch = itemSearchLookupObj?.custitem_cnt_boardpitch
                 returnObject.boardThickness = itemSearchLookupObj?.custitem_boardthickness
			 }
			 else{
				 
				 log.debug('Nothing found in returnCustomAssemblyItemFields searchLookupFields')
				 
			 }
     
	 }
	 
     return returnObject
 }
 

     return {
             afterSubmit: afterSubmit

     };
     
 });