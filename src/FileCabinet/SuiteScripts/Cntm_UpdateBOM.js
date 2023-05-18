/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define([ 'N/record', 'N/runtime', 'N/search' ],
/**
 * @param {record}
 *            record
 * @param {runtime}
 *            runtime
 * @param {search}
 *            search
 */
function(record, runtime, search) {

	/**
	 * Marks the beginning of the Map/Reduce process and generates input data.
	 * 
	 * @typedef {Object} ObjectRef
	 * @property {number} id - Internal ID of the record instance
	 * @property {string} type - Record type id
	 * 
	 * @return {Array|Object|Search|RecordRef} inputSummary
	 * @since 2015.1
	 */
	function getInputData() {
		var fabRecordId = runtime.getCurrentScript().getParameter({
			name : 'custscript_cntm_fab_id'
		});
		var woArr = runtime.getCurrentScript().getParameter({
			name : 'custscript_cntm_wo_arr'
		});
		if (woArr)
			woArr = JSON.parse(woArr);
		var woMap = {};
		if (woArr && woArr.length > 0) {
			for (var wo = 0; wo < woArr.length; wo++) {
				var woSubMap = findSubWo(woArr[wo], woMap, 0);
				log.debug('woSubMap', woSubMap);
              var count=0;
              if(woSubMap){
				woMap = woSubMap.map;
				count = woSubMap.count;
              }
				if (!woMap[count])
					woMap[count] = [];
				woMap[count].push(woArr[wo]);
			}
		}
		return woMap;
	}
	function findSubWo(woId, map, count) {
		var workorderSearchObj = search.create({
			type : "workorder",
			filters : [ [ "type", "anyof", "WorkOrd" ], "AND",
					[ "mainline", "is", "T" ], "AND",
					[ "createdfrom", "anyof", woId ] ],
			columns : [ search.createColumn({
				name : "item",
				label : "Item"
			}), search.createColumn({
				name : "name",
				join : "bom",
				label : "Name"
			}), search.createColumn({
				name : "internalid",
				join : "bom",
				label : "Internal ID"
			}) ]
		});
		var searchResultCount = workorderSearchObj.runPaged().count;
		log.debug("workorderSearchObj result count", searchResultCount);
		if (searchResultCount > 0) {
			workorderSearchObj.run().each(function(result) {
				// .run().each has a limit of 4,000 results
				var woSubMap = findSubWo(result.id, map, count);
				if (woSubMap) {
					map = woSubMap.map;
					count = woSubMap.count;
				}
				if (!map[count])
					map[count] = [];
				log.debug('map', JSON.stringify(map));
				map[count].push(result.id);
				count++;
				log.debug('subWOId: ', result.id);
				return true;
			});
			var finalMap = {};
			finalMap.map = map;
			finalMap.count = count;
			return finalMap;
		}
	}
	/**
	 * Executes when the map entry point is triggered and applies to each
	 * key/value pair.
	 * 
	 * @param {MapSummary}
	 *            context - Data collection containing the key/value pairs to
	 *            process through the map stage
	 * @since 2015.1
	 */
	function map(context) {
		try{
		log.debug('context.value', context.value);
		var woArr=JSON.parse(context.value);
		var subAssemblies=[];
		var subAsm;
		for(var i=0;i<woArr.length;i++){
			var woRec=record.load({type:'workorder',id:woArr[i]});
			/*var woFieldLookUp = search
			.lookupFields({
				type : 'workorder',
				id : woArr[i],
				columns : [
						'assemblyitem',
						'billofmaterials',
						'manufacturingrouting' ]
			});*/
			subAsm=woRec.getValue({fieldId:'assemblyitem'});//woFieldLookUp.assemblyitem;
			subAssemblies.push(subAsm);
			var customrecord_cntm_pcb_wo_suitelet_dataSearchObj = search.create({
				   type: "customrecord_cntm_pcb_wo_suitelet_data",
				   filters:
				   [
				      ["custrecord_cntm_wo","anyof",woArr[i]]
				   ],
				   columns:
				   [
				      search.createColumn({
				         name: "scriptid",
				         sort: search.Sort.ASC
				      }),
				      "custrecord_cntm_wo",
				      "custrecord_cntm_crtd_frm",
				      "custrecord_cntm_crtd_frm_so",
				      "custrecord_cntm_item",
				      "custrecord_cntm_wo_status",
				      "custrecord_cntm_wo_qty"
				   ]
				});
				var searchResultCount = customrecord_cntm_pcb_wo_suitelet_dataSearchObj.runPaged().count;
				log.debug("customrecord_cntm_pcb_wo_suitelet_dataSearchObj result count",searchResultCount);
				customrecord_cntm_pcb_wo_suitelet_dataSearchObj.run().each(function(result){
				   // .run().each has a limit of 4,000 results
					record.delete({
						type:'customrecord_cntm_pcb_wo_suitelet_data', id:
							result.id });

				   return true;
				});
				record.delete({
					type:'workorder', id:
						woArr[i] });

		}
		log.debug('map-subAsm',subAsm);
		context.write({
			key : context.key,
			value : subAsm
		});
		}catch(e){
			log.error('map-error',e.message);
			//var obj={err:e.message,assembly:assembly};
			context.write({
				key : 'Failed',
				value : e.message
			});
		}
	}

	/**
	 * Executes when the reduce entry point is triggered and applies to each
	 * group.
	 * 
	 * @param {ReduceSummary}
	 *            context - Data collection containing the groups to process
	 *            through the reduce stage
	 * @since 2015.1
	 */
	function reduce(context) {
		var assembly=context.values[0];
		try{
log.debug('context.values',context.values);

if(context.key=='Failed'){
//	var obj={err:e.message,assembly:assembly};
	context.write({
		key : 'Failed',
		value : assembly
	});
	}
else{
	var fabRecordId = runtime.getCurrentScript().getParameter({
		name : 'custscript_cntm_fab_id'
	});
	var woFieldLookUp = search
	.lookupFields({
		type : 'customrecord_cntm_wo_bom_import_fab',
		id : fabRecordId,
		columns : [
		           
		           
				'custrecord_cntm_fab_item' ]
	});
	var fabASM=woFieldLookUp.custrecord_cntm_fab_item[0].value;
var bomSearchObj = search.create({
	   type: "bom",
	   filters:
	   [
	      ["assemblyitem.assembly","anyof",assembly]
	   ],
	   columns:
	   [
	      "name",
	      "revisionname",
	      "custrecord_cntm_asm_bom_rev_soline"
	   ]
	});
	var searchResultCount = bomSearchObj.runPaged().count;
	log.debug("bomSearchObj result count",searchResultCount);
	bomSearchObj.run().each(function(result){
	   // .run().each has a limit of 4,000 results
		
		if(fabASM == assembly){
			record .submitFields({ type :
				  'customrecord_cntm_wo_bom_import_fab', id : fabRecordId,
				  values : { "custrecord_cntm_bom_fab" : '','custrecord_cntm_mfg_routing_fab':''}, options : { enableSourcing : false,
				  ignoreMandatoryFields : true } });
			var customrecord_cntm_wo_details_fab_wo_crtnSearchObj = search.create({
				   type: "customrecord_cntm_wo_details_fab_wo_crtn",
				   filters:
				   [
				      ["custrecord_cntm_fab_wo_creation","anyof",fabRecordId]
				   ],
				   columns:
				   [
				      search.createColumn({
				         name: "scriptid",
				         sort: search.Sort.ASC
				      }),
				      "custrecord_cntm_fab_wo_creation",
				      "custrecord_cntm_boardsperpanel_fabwo_crt",
				      "custrecord_cntm_num_of_panels_fabwo_crtn"
				   ]
				});
				var searchResultCount = customrecord_cntm_wo_details_fab_wo_crtnSearchObj.runPaged().count;
				log.debug("customrecord_cntm_wo_details_fab_wo_crtnSearchObj result count",searchResultCount);
				customrecord_cntm_wo_details_fab_wo_crtnSearchObj.run().each(function(result){
				   // .run().each has a limit of 4,000 results
					record.delete({
						type:'customrecord_cntm_wo_details_fab_wo_crtn', id:result.id});
				   return true;
				});
		}//else{
		var bomrevisionSearchObj = search.create({
			   type: "bomrevision",
			   filters:
			   [
			      ["billofmaterials","anyof",result.id]
			   ],
			   columns:
			   [
			      "billofmaterials",
			      "name"
			   ]
			});
			var searchResultCount = bomrevisionSearchObj.runPaged().count;
			log.debug("bomrevisionSearchObj result count",searchResultCount);
			bomrevisionSearchObj.run().each(function(result2){
			   // .run().each has a limit of 4,000 results
				var revId=record.delete({
					type:'bomrevision', id:
						result2.id });
				log.debug('Rev Deleted: ',revId);
			   return true;
			});
		var manufacturingroutingSearchObj = search.create({
			   type: "manufacturingrouting",
			   filters:
			   [
			      ["billofmaterials","anyof",result.id]
			   ],
			   columns:
			   [
			      search.createColumn({
			         name: "name",
			         sort: search.Sort.ASC
			      }),
			      "billofmaterials",
			      "location",
			      "location"
			   ]
			});
			var searchResultCount = manufacturingroutingSearchObj.runPaged().count;
			log.debug("manufacturingroutingSearchObj result count",searchResultCount);
			manufacturingroutingSearchObj.run().each(function(result1){
			   // .run().each has a limit of 4,000 results
				var route=record.load({type:'manufacturingrouting',id:result1.id,isDynamic:true});
				route.setValue({fieldId:'custrecord_cntm_fabrec_id',value:''});
				route.save();
				/*record.submitFields({ type :
					  'manufacturingrouting', id : result1.id,
					  values : { "custrecord_cntm_fabrec_id" : ''}, options : { enableSourcing : false,
					  ignoreMandatoryFields : true } });*/
				var routId=record.delete({
					type:'manufacturingrouting', id:
						result1.id });
				log.debug('Routing Deleted: ',routId);
			   return true;
			});
		var bomRec=record.load({type:'bom',id:result.id,isDynamic:true});
		var subLineCount = bomRec.getLineCount({
			sublistId : 'assembly'
		});
		log.debug('subLineCount', subLineCount);
		for (var j = subLineCount - 1; j >= 0; j--) {
			bomRec.removeLine({
				sublistId : 'assembly',
				line : j,
				ignoreRecalc : true
			});
		}
		bomRec.save();
		var bomId=record.delete({
			type:'bom', id:
				result.id });
		log.debug('BOM Deleted: ',bomId);
		//}
	   return true;
	});
	
	if(fabASM != assembly){
	/*var asm=record.delete({
		type:'lotnumberedassemblyitem', id:assembly});
	log.debug('Assembly Deleted: ',asm);*/
		context.write({
			key : context.key,
			value : assembly
		});
	}
	
}
		}catch(e){
			log.error('reduce-err',e.message);
			var obj={err:e.message,assembly:assembly};
			context.write({
				key : 'Failed',
				value : obj
			});
		}
	}

	/**
	 * Executes when the summarize entry point is triggered and applies to the
	 * result set.
	 * 
	 * @param {Summary}
	 *            summary - Holds statistics regarding the execution of a
	 *            map/reduce script
	 * @since 2015.1
	 */
	function summarize(summary) {
try{
	var errorArr=[];
	summary.output.iterator().each(
			function(key, value) {
				log.debug('key: '+key,'value: '+value);
if(key=='Failed'){
	var values = JSON.parse(value);
	errorArr.push(values.err)
}else{
	var asm=record.delete({
		type:'lotnumberedassemblyitem', id:value});
	log.debug('Assembly Deleted: ',asm);
}
				
				return true;
			});
	if(errorArr.length>0){
		
	}else{
		var fabRecordId = runtime.getCurrentScript().getParameter({
			name : 'custscript_cntm_fab_id'
		});
		
		/*var woFieldLookUp = search
		.lookupFields({
			type : 'customrecord_cntm_wo_bom_import_fab',
			id : fabRecordId,
			columns : [
			           
			           
					'custrecord_cntm_bom_fab' ]
		});
		if(woFieldLookUp.custrecord_cntm_bom_fab[0]){
		var bom=woFieldLookUp.custrecord_cntm_bom_fab[0].value;
		record .submitFields({ type :
			  'customrecord_cntm_wo_bom_import_fab', id : fabRecordId,
			  values : { "custrecord_cntm_bom_fab" : '','custrecord_cntm_mfg_routing_fab':''}, options : { enableSourcing : false,
			  ignoreMandatoryFields : true } });
		var bomrevisionSearchObj = search.create({
			   type: "bomrevision",
			   filters:
			   [
			      ["billofmaterials","anyof",bom]
			   ],
			   columns:
			   [
			      "billofmaterials",
			      "name"
			   ]
			});
			var searchResultCount = bomrevisionSearchObj.runPaged().count;
			log.debug("bomrevisionSearchObj result count",searchResultCount);
			bomrevisionSearchObj.run().each(function(result){
			   // .run().each has a limit of 4,000 results
				var revId=record.delete({
					type:'bomrevision', id:
						result.id });
				log.debug('Rev Deleted: ',revId);
			   return true;
			});
		var manufacturingroutingSearchObj = search.create({
			   type: "manufacturingrouting",
			   filters:
			   [
			      ["billofmaterials","anyof",bom]
			   ],
			   columns:
			   [
			      search.createColumn({
			         name: "name",
			         sort: search.Sort.ASC
			      }),
			      "billofmaterials",
			      "location",
			      "location"
			   ]
			});
			var searchResultCount = manufacturingroutingSearchObj.runPaged().count;
			log.debug("manufacturingroutingSearchObj result count",searchResultCount);
			manufacturingroutingSearchObj.run().each(function(result1){
			   // .run().each has a limit of 4,000 results
				var routId=record.delete({
					type:'manufacturingrouting', id:
						result1.id });
				log.debug('FAB Rout Deleted: ',routId);
			   return true;
			});
		var bomRec=record.load({type:'bom',id:bom,isDynamic:true});
		var subLineCount = bomRec.getLineCount({
			sublistId : 'assembly'
		});
		log.debug('subLineCount', subLineCount);
		for (var j = subLineCount - 1; j >= 0; j--) {
			bomRec.removeLine({
				sublistId : 'assembly',
				line : j,
				ignoreRecalc : true
			});
		}
		bomRec.save();
		var bomId=record.delete({
			type:'bom', id:
				bom });
		log.debug('FAB BOM Deleted: ',bomId);
		}*/
			var fabRec=record.load({type:'customrecord_cntm_wo_bom_import_fab',id:fabRecordId,isDynamic:true});
		fabRec.setValue({fieldId:'custrecord_cntm_delete_n_update_bom',value:false});
		fabRec.setValue({fieldId:'custrecord_cntm_status_fab_wo_crtn',value:''});
		fabRec.setValue({fieldId:'custrecord_bom_raw_file_fab',value:''});
		fabRec.setValue({fieldId:'custrecord_cntm_bom_dependecy_file_fab',value:''});
		fabRec.setValue({fieldId:'custrecord_cntm_mfg_routing_filr_fab',value:''});
		fabRec.save();
		/*record .submitFields({ type :
				  'customrecord_cntm_wo_bom_import_fab', id : fabRecordId,
				  values : { "custrecord_cntm_delete_n_update_bom" : true||'T' }, options : { enableSourcing : false,
				  ignoreMandatoryFields : true } });*/
		/*record.delete({
			type:'customrecord_cntm_wo_bom_import_fab', id:fabRecordId});*/
	}
}catch(e){
	log.error('summary-error',e.message);
}
	}

	return {
		getInputData : getInputData,
		map : map,
		reduce : reduce,
		summarize : summarize
	};

});
