/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @NAuthor Jerome Morden
 */
define(['N', 'N/search', 'N/record', 'N/ui/serverWidget', 'N/encode', 'N/file'],

	(N, search, record, ui, encode, file) => {
	   
		const createManualCostRecord = params => {
			var manualCostRecord = record.create({
				type: `customrecord_manual_costs_input`
			});

			for(var x in params)
				if(x.match(/custpage_/g))
					manualCostRecord.setValue({
						fieldId: x.replace(/custpage_/g,'custrecord_'),
						value: params[x]
					});

			manualCostRecord.save();

			N.redirect.toSuitelet({
				scriptId: 'customscript_se_rda_sl_manualcostinput',
				deploymentId: 'customdeploy1'
			});
		}
		
		const getAllSSResult = searchResultSet => {
			var result = [];
			for(var x=0;x<=result.length;x+=1000)
				result = result.concat(searchResultSet.getRange(x,x+1000)||[]);
			return result;
		};

		/**
		 * Definition of the Suitelet script trigger point.
		 *
		 * @param {Object} context
		 * @param {ServerRequest} context.request - Encapsulation of the incoming request
		 * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
		 * @Since 2015.2
		 */
		return {
			onRequest: context => {
				var { request, response } = context;

				var params = request.parameters;
				if(params.custpage_labor) // Check if the fields are not empty then create record
					createManualCostRecord(params);

				// CREATE FORM
				var form = ui.createForm({
					title: 'Manual Cost Input'
				});

				([
					//['id', 'label'],
					['labor', 'Labor'],
					['overhead', 'Overhead'],
					['preciousmetal', 'Precious Metal'],
					['drilling', 'Miscellaneous']
				]).forEach(fldgrp=>{
					form.addFieldGroup({
						id: `custpage_fldgrp_${fldgrp[0]}`,
						label: fldgrp[1]
					});
				});

				var manualCostInputFields = [
					//['fieldId', 'label', 'fieldType']
					['labor', 'FAB Labor', ui.FieldType.CURRENCY, 'custpage_fldgrp_labor'],
					['assembly_labor', 'Assembly Labor', ui.FieldType.CURRENCY, 'custpage_fldgrp_labor'],
					['mlo_labor', 'MLO Labor', ui.FieldType.CURRENCY, 'custpage_fldgrp_labor'],
					['rdis_labor', 'RDIS Labor', ui.FieldType.CURRENCY, 'custpage_fldgrp_labor'],
					
					['overhead', 'FAB Overhead', ui.FieldType.CURRENCY, 'custpage_fldgrp_overhead'],
					['assembly_overhead', 'Assembly Overhead', ui.FieldType.CURRENCY, 'custpage_fldgrp_overhead'],
					['mlo_overhead', 'MLO Overhead', ui.FieldType.CURRENCY, 'custpage_fldgrp_overhead'],
					['rdis_overhead', 'RDIS Overhead', ui.FieldType.CURRENCY, 'custpage_fldgrp_overhead'],
					
					['gold', 'Gold', ui.FieldType.CURRENCY, 'custpage_fldgrp_preciousmetal'],
					['enepig_gold', 'Enepig Gold', ui.FieldType.CURRENCY, 'custpage_fldgrp_preciousmetal'],
					['enepig_palladium', 'Enepig Palladium', ui.FieldType.CURRENCY, 'custpage_fldgrp_preciousmetal'],
					['thin_gold', 'Thin Gold', ui.FieldType.CURRENCY, 'custpage_fldgrp_preciousmetal'],
					['thin_gold_thickness', 'Thin Gold Thickness', ui.FieldType.CURRENCY, 'custpage_fldgrp_preciousmetal'],
					['thick_gold', 'Thick Gold', ui.FieldType.CURRENCY, 'custpage_fldgrp_preciousmetal'],
					['thick_gold_thickness', 'Thick Gold Thickness', ui.FieldType.CURRENCY, 'custpage_fldgrp_preciousmetal'],

					['drillhitsperhour', 'Drill Hits Per Minute', ui.FieldType.CURRENCY, 'custpage_fldgrp_drilling'],
					['qfactor', 'Q-Factor WIP %', ui.FieldType.INTEGER, 'custpage_fldgrp_drilling'],
					['qfactor_production', 'Q-Factor Production %', ui.FieldType.INTEGER, 'custpage_fldgrp_drilling']
				];

				// Create form fields
				var fields = {};
				manualCostInputFields.forEach(function(fld){
					fields[fld[0]] = form.addField({
						id: `custpage_${fld[0].toLowerCase()}`,
						label: fld[1],
						type: fld[2],
						container: fld[3]
					});
				});

				// Set fields to mandatory
				for(var x in fields)
					fields[x].isMandatory = true;


				// Create form sublist
				var sublist = form.addSublist({
					id: 'custpage_sublist',
					label: 'Manual Cost List',
					type: ui.SublistType.LIST
				});

				// Add sublist fields
				var sublistFields = {};
				manualCostInputFields.unshift(['created', 'Date Entered', ui.FieldType.TEXT]);
				manualCostInputFields.forEach((fld)=>{
					sublistFields[fld[0]] = sublist.addField({
						id: `custcol_${fld[0].toLowerCase()}`,
						label: fld[1],
						type: fld[2]
					});
				});

				getAllSSResult(search.create({
					type: 'customrecord_manual_costs_input',
					columns: ((ids) => {
						return ids.map((id, i)=>{
							return i ? {
								name: `custrecord_${id}`
							}: {
								name: id,
								sort: search.Sort.DESC
							};
						});
					})(Object.keys(sublistFields))
				}).run()).forEach((res, line) => {
					var cols = res.columns;

					Object.keys(sublistFields).forEach((id, i) => {
						sublist.setSublistValue({
							id: `custcol_${id.toLowerCase()}`,
							line: line,
							value: res.getValue(cols[i]) || null
						});

						if(!line && fields[id])
							fields[id].defaultValue = res.getValue(cols[i]) || null;
					});
				});

				form.addSubmitButton();
				form.addButton({
					id: 'custpage_btnreset',
					label: 'Reset',
					functionName: `(function(){if(confirm('Reset this page?')){
						window.onbeforeunload = '';
						window.location.reload();
					}})()`
				});

				response.writePage(form);
			}
		};
	}
);
