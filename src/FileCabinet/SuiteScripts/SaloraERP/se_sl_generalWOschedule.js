/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @NAuthor Jerome Morden
 */
define(['N/file', 'N/search', 'N/record', 'N/redirect', 'N/runtime', 'N/ui/serverWidget', 'N/url'],

	(file, search, record, redirect, runtime, ui, url) => {
	   
		/**
		 * Definition of the Suitelet script trigger point.
		 *
		 * @param {Object} context
		 * @param {ServerRequest} context.request - Encapsulation of the incoming request
		 * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
		 * @Since 2015.2
		 */
		const onRequest = context => {
			var {request} = context;
			var params = request.parameters;

			if(!params.custpage_page || params.custpage_page == 1 || params.custpage_page == 'csv'){
				firstPage( context );
			} else {
				secondPage( context );
			}
		}

		const firstPage = context => {
			var script = runtime.getCurrentScript();
			var searchId = script.getParameter('custscript_generalwosched_search');
			var editedFields = script.getParameter('custscript_generalwosched_editedfields');

			var {request} = context;
			var params = request.parameters;

			var form = ui.createForm({
				title: 'General WO Schedule'
			});

			var filterGroup = form.addFieldGroup({
				id: 'custpage_filtergroup',
				label: 'FILTERS'
			});
			var fields = {};
			var fieldsToCreate = [
				//['fieldId', 'label', 'fieldType', 'source', 'container']
				['entity', 'Company Name', ui.FieldType.SELECT, 'customer', 'custpage_filtergroup'],
				['internalid', 'Work Order', ui.FieldType.SELECT, 'workorder', 'custpage_filtergroup'],
				['datefrom', 'WO Scheduled Due Date', ui.FieldType.DATE, null, 'custpage_filtergroup'],
				['dateto', ' ', ui.FieldType.DATE, null, 'custpage_filtergroup'],
				['department', 'Division', ui.FieldType.SELECT, 'department', 'custpage_filtergroup'],
				['manufacturingworkcenter', 'Manufacturing Work Center', ui.FieldType.SELECT, null, 'custpage_filtergroup'],
				['toolnumber', 'Tool Number', ui.FieldType.SELECT, 'customrecord_cntm_job_id', 'custpage_filtergroup'],
				['page', 'Page', ui.FieldType.TEXT, null],
				['updated', 'Updated', ui.FieldType.LONGTEXT, null],
				['duplicated', 'Duplicated', ui.FieldType.LONGTEXT, null]
			];
			fieldsToCreate.forEach((fld)=>{
				fields[fld[0]] = form.addField({
					id: `custpage_${fld[0]}`,
					label: fld[1],
					type: fld[2],
					source: fld[3],
					container: fld[4]
				});
			});

			(['updated','page', 'duplicated']).forEach((key)=>{
				fields[key].updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN
				});
			});

			fields.datefrom.updateLayoutType({
				layoutType: ui.FieldLayoutType.STARTROW
			});
			fields.dateto.updateLayoutType({
				layoutType: ui.FieldLayoutType.ENDROW
			});

			// Add Manufacturing Work Center Options
			fields['manufacturingworkcenter'].addSelectOption({
				value: '',
				text: ''
			});
			getAllSSResult(search.create({
				type: 'entitygroup',
				filters: [['ismanufacturingworkcenter', 'is', 'T']],
				columns: {
					name: 'groupname',
					sort: search.Sort.ASC
				}
			}).run()).forEach(res => {
				fields['manufacturingworkcenter'].addSelectOption({
					value: res.id,
					text: res.getValue({name: 'groupname'})
				});
			});

			for(var x in fields){
				fields[x].defaultValue = params[`custpage_${x}`]
			}

			// Sticky department
			if(request.method == 'GET'){
				var userId = runtime.getCurrentUser().id;
				var divisionSelected = search.lookupFields({
					type: 'employee',
					id: userId,
					columns: ['custentity_editworkordersl_division']
				}).custentity_editworkordersl_division;

				divisionSelected = divisionSelected.length? divisionSelected[0].value: null;

				fields.department.defaultValue = divisionSelected;

			}else{
				var userId = runtime.getCurrentUser().id;
				record.submitFields({
					type: 'employee',
					id: userId,
					values: {
						custentity_editworkordersl_division: params.custpage_department || null
					}
				});
			}

			var date = new Date();
			var case1 = new Date();
			var case2 = new Date();
			var case3 = new Date();
			case1.setHours(14);
			case2.setHours(23);
			case3.setHours(6);
			case1.setMinutes(59);
			case2.setMinutes(59);
			case3.setMinutes(59);
			if(date >= case1 && date < case2){
			}else if(date >= case3 && date < case1){
			}else if(date >= case2 || date < case3){
			}


//			if(params.custpage_page || request.method == 'POST'){
				var woIds = [];
				var duplicateIds = [];
				var csvText = '';
				var searchResults = ((ssId, par)=>{
					var ss = search.load({ id: ssId });
					([
						'workorder.entity','workorder.internalid','workorder.department','manufacturingworkcenter'
					]).forEach((name)=>{
						var key = name.split(/[^a-z]/gi);
						var join = key.length > 1? key[0]: null;
						name = key[key.length-1];
						key = 'custpage_'+key[key.length-1];

		log.debug('par_key', key);

						if(par[key]){
		log.debug('par[key]', par[key]);
							ss.filters.push(search.createFilter({
								name, join,
								operator: search.Operator.ANYOF,
								values: par[key]
							}));
						}
					});

					if(par.custpage_datefrom && par.custpage_dateto){
						ss.filters.push(search.createFilter({
							name: 'custbody_rda_wo_sched_due_date',
							join: 'workorder',
							operator: search.Operator.WITHIN,
							values: [par.custpage_datefrom, par.custpage_dateto]
						}));
					}else if(par.custpage_datefrom){
						ss.filters.push(search.createFilter({
							name: 'custbody_rda_wo_sched_due_date',
							join: 'workorder',
							operator: search.Operator.ONORAFTER,
							values: par.custpage_datefrom
						}));
					}else if(par.custpage_dateto){
						ss.filters.push(search.createFilter({
							name: 'custbody_rda_wo_sched_due_date',
							join: 'workorder',
							operator: search.Operator.ONORBEFORE,
							values: par.custpage_dateto
						}));
					}

					if(par.custpage_toolnumber)
						ss.filters.push(search.createFilter({
							name: 'custbody_cntm_tool_number',
							join: 'workorder',
							operator: search.Operator.ANYOF,
							values: par.custpage_toolnumber
						}));
					
		log.debug('ss.filterExpression', ss.filters);

					return getAllSSResult(ss.run());
				})(searchId, params);

				var sublist = form.addSublist({
					id: 'custpage_sublist',
					label: 'Results',
					type: ui.SublistType.LIST
				});
				var sublistFields = {};

				if(searchResults.length){
					searchResults[0].columns.forEach((col, i)=>{
						
						var label = col.label;
						var id = label.match(/id\[/gi)? label.match(/id\[.*?\]/gi)[0].replace(/id\[|\]/gi, ''):
							col.name.replace(/custbody/gi,'cb');
						label = label.match(/id\[|\]/gi)? label.replace(/id\[.*?\]/gi, '').trim(): label;
						var type = ui.FieldType.TEXT;

						if(id.match(/wo_priorty|weekendhrs/gi))
							type = ui.FieldType.FLOAT;
						else if(id.match(/sched_due_date/gi))
							type = ui.FieldType.DATE;
						else if(id.match(/rda_qfactor/gi))
							type = ui.FieldType.PERCENT;

						// ADD SUBLIST FIELDS
						sublistFields[id] = sublist.addField({
							id: `custcol_${id}`,
							label, type
						});

						if(!id.match(/internalid/gi))
							csvText += `"${label}",`;
					});

					if(!sublistFields['internalid'])
						sublistFields['internalid'] = sublist.addField({
							id: 'custcol_internalid',
							label: 'Internal ID',
							type: ui.FieldType.TEXT
						});

					sublistFields['internalid'].updateDisplayType({
						displayType: ui.FieldDisplayType.HIDDEN
					});

					// Input fields
					editedFields.split(',').forEach((fieldId)=>{
						fieldId = fieldId.replace(/custbody/gi,'cb');

						if(sublistFields[fieldId])
							sublistFields[fieldId].updateDisplayType({
								displayType: ui.FieldDisplayType.ENTRY
							});
					});

					searchResults.forEach((res, line)=>{
						var {columns} = res;
						var woId = res.getValue(columns[0]);

						if(woIds.indexOf(woId) < 0)
							woIds.push(woId);
						else if(duplicateIds.indexOf(woId) < 0)
							duplicateIds.push(woId);

						csvText += '\n';

						columns.forEach((col)=>{
							var label = col.label;
							var id = 'custcol_' + (label.match(/id\[/gi)? label.match(/id\[.*?\]/gi)[0].replace(/id\[|\]/gi, ''):
								col.name.replace(/custbody/gi,'cb'));
							sublist.setSublistValue({
								id, line,
								value: res.getText(col) || res.getValue(col) || null
							});

							if(!id.match(/internalid/gi))
								csvText += `"${res.getText(col) || res.getValue(col) || ''}",`;
						});
					});
				}

				fields.duplicated.defaultValue = duplicateIds.join(',');
				fields.updated.defaultValue = '';
//			}

			form.addSubmitButton();
			form.addButton({
				id: 'custpage_btnrefresh',
				label: 'Refresh List',
				functionName: 'refreshList()'
			});
			form.addButton({
				id: 'custpage_btnautosort',
				label: 'Auto Sort',
				functionName: ''
			});

			var csvUrl = url.resolveScript({
				scriptId: script.id,
				deploymentId: script.deploymentId
			});
			for(var x in params){
				if(!x.match(/custpage_/gi) || !params[x] || x.match(/sublist|display|duplicated|updated|_page/gi))
					continue;

				csvUrl += `&${x}=${params[x]}`;
			}
			csvUrl += `&custpage_page=csv`;

			form.addButton({
				id: 'custpage_btnexportcsv',
				label: 'CSV',
				functionName: `exportToCSV("${csvUrl}")`
			});

			form.clientScriptModulePath = './se_cs_generalWOschedule.js';

			if(params.custpage_page != 'csv')
				context.response.writePage(form);
			else{
				context.response.writeFile(file.create({
					name: 'GeneralWOSchedule.CSV',
					fileType: file.Type.CSV,
					contents: csvText
				}));
			}
		}

		const secondPage = context => {
			var {request} = context;
			var params = request.parameters;
			var toUpdate = params.custpage_updated.split(',');

			var script = runtime.getCurrentScript();
			var editedFields = script.getParameter('custscript_generalwosched_editedfields');

			var dataToUpdate = {};
			var group = 'custpage_sublist';
			var lineCount = request.getLineCount({ group });
			for(var line = 0; line < lineCount; line++){
				var woId = request.getSublistValue({
					group,
					name: 'custcol_internalid',
					line
				});

				var woIdIndex = toUpdate.indexOf(woId);
				if(woIdIndex >= 0){
					toUpdate.splice(woIdIndex, 1);

					dataToUpdate[woId] = {};
					editedFields.split(',').forEach((id) => {
						var name = 'custcol_'+id.replace(/custbody/gi,'cb');

						dataToUpdate[woId][id] = request.getSublistValue({
							group, name, line
						});
					});
				}
			}

			log.debug('dataToUpdate', dataToUpdate);

			for(var id in dataToUpdate)
				record.submitFields({
					type: 'workorder',
					id,
					values: dataToUpdate[id]
				});

			for(var x in params)
				if(!x.match(/custpage_/gi) || !params[x] || x.match(/sublist|display|duplicated|updated/gi))
					delete params[x];
			delete params.custpage_sublist;
			params.custpage_page = 1;

			redirect.toSuitelet({
				scriptId: script.id,
				deploymentId: script.deploymentId,
				parameters: params
			});
		}
		
		const getAllSSResult = searchResultSet => {
			var result = [];
			for(var x=0;x<=result.length;x+=1000)
				result = result.concat(searchResultSet.getRange(x,x+1000)||[]);
			return result;
		};

		return {
			onRequest
		};
		
	}
);
