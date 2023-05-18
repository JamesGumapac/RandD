/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @NAuthor Jerome Morden
 */
 define(['N/file', 'N/search', 'N/record', 'N/redirect', 'N/runtime', 'N/ui/serverWidget', 'N/url', '../lib/moment.min'],

 (file, search, record, redirect, runtime, ui, url, moment) => {
    
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
         log.debug('1st page')
         var script = runtime.getCurrentScript();
         var searchId = script.getParameter('custscript_gwos_asm_savedsearch');
         var editedFields = script.getParameter('custscript_gwos_asm_editedfields');
         log.debug('editedFields', editedFields);

         var {request} = context;
         var params = request.parameters;
         log.debug('params', params)

         var form = ui.createForm({
             title: 'General WO Schedule - ASM'
         });

         var filterGroup = form.addFieldGroup({
             id: 'custpage_filtergroup',
             label: 'FILTERS'
         });
         var fields = {};
         var fieldsToCreate = [
             //['fieldId', 'label', 'fieldType', 'source', 'container']
             ['entity', 'Company Name', ui.FieldType.SELECT, null, 'custpage_filtergroup'],
//             ['internalid', 'Work Order', ui.FieldType.SELECT, 'workorder', 'custpage_filtergroup'],
           	['workorder', 'Work Order', ui.FieldType.TEXT, null, 'custpage_filtergroup'],
           	['salesorder', 'Sales Order', ui.FieldType.TEXT, null, 'custpage_filtergroup'],
             ['datefrom', 'WO Scheduled Due Date', ui.FieldType.DATE, null, 'custpage_filtergroup'],
             ['dateto', ' ', ui.FieldType.DATE, null, 'custpage_filtergroup'],
             ['department', 'Division', ui.FieldType.SELECT, 'department', 'custpage_filtergroup'],
//             ['manufacturingworkcenter', 'Manufacturing Work Center', ui.FieldType.SELECT, null, 'custpage_filtergroup'],
             ['toolnumber', 'Tool Number', ui.FieldType.LONGTEXT, null, 'custpage_filtergroup'],
             ['operation', 'Operation', ui.FieldType.SELECT, null, 'custpage_filtergroup'],
             ['page', 'Page', ui.FieldType.TEXT, null],
             ['updated', 'Updated', ui.FieldType.LONGTEXT, null],
             ['duplicated', 'Duplicated', ui.FieldType.LONGTEXT, null],
             ['autosort', 'Auto Sort', ui.FieldType.CHECKBOX, null, 'custpage_filtergroup']
         ];
         fieldsToCreate.forEach((fld) => {
             fields[fld[0]] = form.addField({
                 id: `custpage_${fld[0]}`,
                 label: fld[1],
                 type: fld[2],
                 source: fld[3],
                 container: fld[4]
             });
         });

         (['updated', 'page', 'duplicated', 'autosort','department']).forEach((key) => {
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

		 // Add Company Name options
		 fields['entity'].addSelectOption({ value: '', text: '' });
		 getAllSSResult(search.create({
			type: 'customer',
			filters: [['stage', 'anyof', 'CUSTOMER'], 'AND',
				['isinactive', 'is', 'F']],
			columns: [{ name: 'entityid' }]
		 }).run()).forEach(res=>{
			fields['entity'].addSelectOption({
				value: res.id,
				text: res.getValue(res.columns[0])
			});
		 });

/*		// Add Tool Number options
		 fields['toolnumber'].addSelectOption({ value: '', text: '' });
		 getAllSSResult(search.create({
			type: 'customrecord_cntm_job_id',
			filters: [['isinactive', 'is', 'F']],
			columns: [{ name: 'name' }]
		 }).run()).forEach(res=>{
			fields['toolnumber'].addSelectOption({
				value: res.id,
				text: res.getValue(res.columns[0])
			});
		 });
*/
/*         // Add Manufacturing Work Center Options
         fields['manufacturingworkcenter'].addSelectOption({
             value: '',
             text: ''
         });
         getAllSSResult(search.create({
             type: 'entitygroup',
             filters: [
                 ['ismanufacturingworkcenter', 'is', 'T']
             ],
             columns: {
                 name: 'groupname',
                 sort: search.Sort.ASC
             }
         }).run()).forEach(res => {
             fields['manufacturingworkcenter'].addSelectOption({
                 value: res.id,
                 text: res.getValue({
                     name: 'groupname'
                 })
             });
         });
*/
         for (var x in fields) {
             fields[x].defaultValue = params[`custpage_${x}`]
         }

		// Add Operation Options
		fields['operation'].addSelectOption({ text: '', value: '' });
		getAllSSResult(search.create({
			type: 'customrecord_cntm_client_app_asm_oper',
			columns: [{ name: 'custrecord_cntm_asm_op_text', summary: search.Summary.GROUP }]
		}).run()).forEach(res=>{
			var value = res.getValue( res.columns[0] );
            /* fix for operation text in filter start */
            var valueText = value;
            valueText = valueText.substr(value.indexOf(" ") + 1);
            valueText = valueText.split("-").pop();
            /* fix for operation text in filter end */

			fields['operation'].addSelectOption({ text: valueText, value });
		});
		fields['operation'].defaultValue = params.custpage_operation;

         // Sticky department
         var userId = runtime.getCurrentUser().id;
        //  if (request.method == 'GET') {
        //      var divisionSelected = search.lookupFields({
        //          type: 'employee',
        //          id: userId,
        //          columns: ['custentity_editworkordersl_division']
        //      }).custentity_editworkordersl_division;

        //      divisionSelected = divisionSelected.length ? divisionSelected[0].value : null;

        //      fields.department.defaultValue = divisionSelected;

		// 	 params.custpage_department = divisionSelected;

        //  } else {
        //      record.submitFields({
        //          type: 'employee',
        //          id: userId,
        //          values: {
        //              custentity_editworkordersl_division: params.custpage_department || null
        //          }
        //      });
        //  }

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
         if (date >= case1 && date < case2) {} else if (date >= case3 && date < case1) {} else if (date >= case2 || date < case3) {}


         //			if(params.custpage_page || request.method == 'POST'){
         var woIds = [];
         var duplicateIds = [];
         var csvText = '';
		var toolNumbers = '';
        var woPriority1_2FormulaLabel = "WOPrio1 + WOPrio2"
         var searchResults = ((ssId, par) => {
             var ss = search.load({
                 id: ssId
             });

                 ss.filters.push(search.createFilter({
                     name: 'mainline', join: 'custrecord_cntm_asm_wo_ref', operator: 'is', values: 'T'
                 }), search.createFilter({
                     name: 'custrecord_cntm_remaining_qty', operator: 'greaterthan', values: '0'
                 })
				 );
             ([
                 'custrecord_cntm_asm_wo_ref.entity', /*'workorder.internalid', */  /* 'custrecord_cntm_asm_wo_ref.department' */ //, 'manufacturingworkcenter'
             ]).forEach((name) => {
                 var key = name.split(/\./gi);
                 var join = key.length > 1 ? key[0] : null;
                 name = key[key.length - 1];
                 key = 'custpage_' + key[key.length - 1];

                //  log.debug('par_key', key);

                 if (par[key]) {
                     log.debug('par[key]', par[key]);
                     ss.filters.push(search.createFilter({
                         name,
                         join,
                         operator: search.Operator.ANYOF,
                         values: par[key]
                     }));
                 }
             });

			// added by jeromemorden | 01/20/22
			 if(par.custpage_operation){
				ss.filters.push(search.createFilter({
					name: 'custrecord_cntm_asm_op_text',
					operator: search.Operator.IS,
					values: par.custpage_operation
				}));
			 }
			 if(par.custpage_workorder){
			 	var woTranId = par.custpage_workorder;
				if(!woTranId.match(/wo/gi))
					woTranId = `WO${woTranId}`;

				ss.filters.push(search.createFilter({
					name: 'tranid',
					join: 'custrecord_cntm_asm_wo_ref',
					operator: search.Operator.IS,
					values: woTranId
				}));
			 }
			 if(par.custpage_salesorder){
				var soTranId = par.custpage_salesorder;
				if(!soTranId.match(/so/gi))
					soTranId = `SO${soTranId}`;

			 	var soIds = [];
				search.create({
					type: 'salesorder',
					filters: [['tranid', 'is', soTranId]],
					columns: [{ 'name': 'internalid' }]
				}).run().getRange(0,1000).forEach(res=>{
					soIds.push(res.getValue(res.columns[0]));
				});
				if(soIds.length)
					ss.filters.push(search.createFilter({
						name: 'custbody_cnt_created_fm_so',
						join: 'custrecord_cntm_asm_wo_ref',
						operator: search.Operator.ANYOF,
						values: soIds
					}));
				else
					ss.filters.push(search.createFilter({
						name: 'custbody_cnt_created_fm_so',
						join: 'custrecord_cntm_asm_wo_ref',
						operator: search.Operator.ANYOF,
						values: ['1']
					}));
			 }
			 //-->

             if (par.custpage_datefrom && par.custpage_dateto) {
                 ss.filters.push(search.createFilter({
                     name: 'custbody_rda_wo_sched_due_date',
                     join: 'custrecord_cntm_asm_wo_ref',
                     operator: search.Operator.WITHIN,
                     values: [par.custpage_datefrom, par.custpage_dateto]
                 }));
             } else if (par.custpage_datefrom) {
                 ss.filters.push(search.createFilter({
                     name: 'custbody_rda_wo_sched_due_date',
                     join: 'custrecord_cntm_asm_wo_ref',
                     operator: search.Operator.ONORAFTER,
                     values: par.custpage_datefrom
                 }));
             } else if (par.custpage_dateto) {
                 ss.filters.push(search.createFilter({
                     name: 'custbody_rda_wo_sched_due_date',
                     join: 'custrecord_cntm_asm_wo_ref',
                     operator: search.Operator.ONORBEFORE,
                     values: par.custpage_dateto
                 }));
             }

             if (par.custpage_toolnumber){
				log.debug('in IF par.custpage_toolnumber', par.custpage_toolnumber)

			 	toolNumbers = par.custpage_toolnumber.split(/[^0-9a-zA-Z_\-]/gm).filter( a => a);

				var formula = '';
				toolNumbers.forEach(name => {
					formula += `WHEN '${name}' THEN 1 `;
				});
                if(formula){
                    var toolNumberIds = getAllSSResult( search.create({
                        type: 'customrecord_cntm_job_id',
                        filters: [[ `formulanumeric: CASE {name} ${formula}ELSE 0 END`, `equalto`, `1` ]],
                    }).run() ).map(res=>{
                        return res.id;
                    });
                    log.debug('toolNumberIds', toolNumberIds)

                    if (toolNumberIds.length) {
                        ss.filters.push(search.createFilter({
                            name: 'custbody_cntm_tool_number',
                            join: 'custrecord_cntm_asm_wo_ref',
                            operator: search.Operator.ANYOF,
                            values: toolNumberIds
                        }));
                    }
                }

                // Added by lcc 10/04/2022
                for (col of ss.columns) 
                    if (col.label == woPriority1_2FormulaLabel) 
                        col.sort = "NONE"

			} else { // Added by lcc 05/04/2022. Sort by WOPrio1 + WOPrio2 ASC when no toolnumber as per request
                // for (col of ss.columns) 
                //     if (col.label == woPriority1_2FormulaLabel) 
                //         col.sort = search.Sort.ASC
            }


            log.debug('ss.filters', ss.filters);
			log.debug('ss.filterExpression', ss.filterExpression);

			// Get result limit
			var script = runtime.getCurrentScript();
			var limit = par.custpage_page == 'csv'? '': parseFloat(script.getParameter('custscript_gwos_asm_linelimit'));
			log.debug('ss runPaged count:', ss.runPaged().count)
             return getAllSSResult(ss.run(), limit);
         })(searchId, params);

         var sublistFields = {};

         var sublist = form.addSublist({
            id: 'custpage_sublist',
            label: `Results`,
            type: ui.SublistType.LIST
        });

		

        if (searchResults.length) {
            // Added by lcc 12/8/2021
            //let wosWithCustOperations = wosWithCustOperationLines(searchResults.map(m => m.getValue(m.columns[0])))
            // let wosWithWOCs = wosWithWOCompletions(searchResults.map(m => m.getValue(m.columns[0])))
            // Exclude workorders with no custom operation lines
 //           searchResults = searchResults.filter(f => wosWithCustOperations.indexOf(f.getValue(f.columns[0])) > -1)    //commented out Brian 3-30-22
            // Exclude workorders with no WOCs
            // searchResults = searchResults.filter(f => wosWithWOCs.indexOf(f.getValue(f.columns[0])) > -1)
            // -------------------------
            if (searchResults.length) {
                // log.debug('searchResults', searchResults.slice(0, 2))
                
                if (params.custpage_autosort == 'T') {
                    // Will change to WO1 + WO2 ASC sorting as per request
                    //  // Sort by left most wo priority (ASC)
                    // searchResults = searchResults
                    //     .sort((a,b) => (parseFloatOrZero(a.getValue({ name: 'custbody_rda_wo_priorty', join: 'workOrder' })) > parseFloatOrZero(b.getValue({ name: 'custbody_rda_wo_priorty', join: 'workOrder' }))) ? 1 
                    //         : ((parseFloatOrZero(b.getValue({ name: 'custbody_rda_wo_priorty', join: 'workOrder' })) > parseFloatOrZero(a.getValue({ name: 'custbody_rda_wo_priorty', join: 'workOrder' }))) ? -1 : 0))
                    //  // Sort by left most wo priority 2 (ASC)  
                    // searchResults = searchResults
                    //     .sort((a,b) => (parseFloatOrZero(a.getValue({ name: 'custbody_rda_wo_priorty_2', join: 'workOrder' })) > parseFloatOrZero(b.getValue({ name: 'custbody_rda_wo_priorty_2', join: 'workOrder' }))) ? 1 
                    //         : ((parseFloatOrZero(b.getValue({ name: 'custbody_rda_wo_priorty_2', join: 'workOrder' })) > parseFloatOrZero(a.getValue({ name: 'custbody_rda_wo_priorty_2', join: 'workOrder' }))) ? -1 : 0))
                    //  // Sort by WO Schedulede Due Date (ASC)  
                    // searchResults = searchResults.sort((a,b) => {
                    //     let date1 = a.getValue({ name: 'custbody_rda_wo_sched_due_date', join: 'workOrder' }) || '1/1/1999'
                    //     let date2 = b.getValue({ name: 'custbody_rda_wo_sched_due_date', join: 'workOrder' }) || '1/1/1999'
                    //     // if (!date1 || !date2) 
                    //     //     return 0
                    //     return (new Date(date1) > new Date(date2)) ? 1 
                    //         : ((new Date(date2) > new Date(date1)) ? -1 : 0)
                    // })
                }
                log.debug("search results 364", searchResults.length);
                searchResults[0].columns.forEach((col, i) => {
                    var label = col.label;
                    if (label != woPriority1_2FormulaLabel) { // Dont add the WOPrio1 + WOPrio2 to the UI cols
                        var id = label.match(/id\[/gi) ? label.match(/id\[.*?\]/gi)[0].replace(/id\[|\]/gi, '') :
                        col.name.replace(/custbody/gi, 'cb').replace(/custcol/gi,'cc');
                        label = label.match(/id\[|\]/gi) ? label.replace(/id\[.*?\]/gi, '').trim() : label;
                        var type = ui.FieldType.TEXT;
                        if (id.match(/wo_priorty|weekendhrs|cnt_board_thickness|cntm_boardpitch/gi))
                        type = ui.FieldType.FLOAT;
                        else if (id.match(/sched_due_date/gi))
                            type = ui.FieldType.DATE;
                        else if (id.match(/rda_qfactor/gi)) 
                            type = ui.FieldType.PERCENT;
                        else if (id.match(/comment/gi)) 
                            type = ui.FieldType.TEXTAREA;

						// To prevent adding hidden columns
						if(id == 'hiddenfield')
							return;

                        // ADD SUBLIST FIELDS
                        sublistFields[id] = sublist.addField({
                            id: `custcol_${id}`,
                            label,
                            type
                        });
                        // Added by jeromemorden | 01/20/22
                        if(id.match(/wo_priorty|weekendhrs/gi))
                        sublistFields[id].updateDisplaySize({
                            height : 60,
                            width : 4
                        });
                        if(id.match(/wo_sched_due_date/gi))
                        sublistFields[id].updateDisplaySize({
                            height : 60,
                            width : 8
                        });
                        // end
                        // Added by lcc 1/8/2022
                        if (id.match(/quantity|rda_qfactor|qtyoperation|no_of_panel|total_num_cores|boards_per_panel|qty_due/gi)) {
                            sublistFields[id].updateDisplaySize({
                                height : 60,
                                width : 6
                            });
                                // sublistFields[id].maxLength = 15
                                //log.debug('Width reduced', { id, label })
                        }
                        if (id.match(/comments/gi)) {
                            sublistFields[id].updateDisplaySize({
                                height : 2,
                                width : 20
                            });
                            // log.debug('Height reduced', { id, label })
                        }
                        // end
                        if (!id.match(/internalid|cb_outsourced|cb_rda_sales_order_type|cc_rda_fab_outsource_house/gi))
							csvText += `"${label}",`;
                    }
                });
                log.debug('sublistFields', sublistFields)

                file.create({
                    name: 'sublistFields.txt',
                    fileType: file.Type.PLAINTEXT,
                    contents: JSON.stringify(sublistFields),
                    folder: -15
                }).save()
   
                if (!sublistFields['internalid'])
                    sublistFields['internalid'] = sublist.addField({
                        id: 'custcol_internalid',
                        label: 'Internal ID',
                        type: ui.FieldType.TEXT
                    });
   

				([
					'internalid', 'cb_outsourced', 'cb_rda_sales_order_type', 'cc_rda_fab_outsource_house',
					//'cb_wo_outsideservice', 'cb_wo_finishtype', 'cb_cntm_tool_number'
				]).forEach(id=>{
					if(sublistFields[id])
						sublistFields[id].updateDisplayType({
							displayType: ui.FieldDisplayType.HIDDEN
						});
				});


				// added by jeromemorden | 02/08/2022
				// Add additional item details *** commented by jeromemorden | 02/10/2022
/*				[
					["ci_materialtype","Material Type", 'TEXT'],
					["ci_cntm_panelsize","Panel Size", 'TEXT'],
					["ci_boardthickness","Board Thickness", 'FLOAT'],
					["ci_cnt_boardpitch","Board Pitch", 'FLOAT']
				].forEach(fld=>{
					sublistFields[fld[0]] = sublist.addField({
						id: `custpage_${fld[0]}`,
						label: fld[1],
						type: ui.FieldType[fld[2]]
					});
				});
  */ 
                // Input fields
				var allowEditing = search.lookupFields({
					type: 'employee',
					id: userId,
					columns: ['custentity_allow_editing_wo_sched']
				}).custentity_allow_editing_wo_sched;

				if(allowEditing)
					editedFields.split(',').forEach((fieldId) => {
						fieldId = fieldId.replace(/custbody/gi, 'cb');
						if (sublistFields[fieldId])
							sublistFields[fieldId].updateDisplayType({
								displayType: ui.FieldDisplayType.ENTRY
							});
					});


				// This block of code will sort the results based on the entered tool numbers filter - added by: jeromemorden | 03/25/2022
                log.debug('toolNumbers', toolNumbers)
  				if(toolNumbers && toolNumbers.length){
					var results = {};
					var toolNumber = [];
					toolNumbers.forEach(num => {
						if(!results[num]){
							results[num] = [];
							toolNumber.push(num);
						}
					});
                    log.debug('results', results)
					searchResults.forEach(res=>{
						var toolNum = ''//res.getText( res.columns[41] );
                        for (col of res.columns) 
                            if (col.name.match(/custbody_cntm_tool_number/g)) {
                                toolNum = res.getText(col)
                                break
                            }
                        if (results[toolNum])
						    results[toolNum].push(res);
					});
					searchResults = [];
					toolNumber.forEach(x=>{
						searchResults = searchResults.concat( results[x] );
					});
				}

   				// Gather item ids
//   				var itemIds = [];
				soUrl = url.resolveRecord({
					recordType: 'salesorder'
				}) + '&id=';

                woUrl = url.resolveRecord({
					recordType: 'workorder'
				}) + '&id=';

				// Gather all Work Order Ids - Jerome Morden
				var workOrderIds = [];
				searchResults.forEach(res=>{
					var workOrderId = res.getValue({ name: 'internalid', join: 'workorder' });

					if(workOrderIds.indexOf(workOrderId) < 0)
						workOrderIds.push(workOrderId);
				});
	log.debug('workOrderIds', workOrderIds);
		
				// Get WCO Good Panel for filtering lines
/*				var wcoGoodPanels = {};
				getAllSSResult(search.create({
					type: 'customrecord_operation_line',
					filters: [[ 'custrecord_operation_line_wo', 'anyof', workOrderIds ]],
					columns: [{ name: 'custrecord_operation_line_wo' }, { name: 'custrecord_operation_line_opername' }, { name: 'custrecord_operation_line_wco_goodpanel' }]
				}).run()).forEach(res=>{
					wcoGoodPanels[ res.getValue(res.columns[0]) + '*' + res.getText(res.columns[1]) ] = parseFloat(res.getValue(res.columns[2])) || 0;
				});
*/
/*
				// Get Scraps
				var woScrap = {};
				getAllSSResult(search.create({
					type: 'customrecord_cntm_scrap_history',
					filters: [[ 'custrecord_cntm_sh_woref.internalid', 'anyof', workOrderIds ], 'AND', ['custrecord_cntm_sh_woref.mainline', 'is', 'T']],
					columns: [
						{
							name: 'internalid',
							join: 'custrecord_cntm_sh_woref',
							summary: 'GROUP'
						},
						{
							name: 'custrecord_cntm_cso_operaton',
							join: 'custrecord_cntm_parent',
							summary: 'GROUP'
						},
						{
							name: 'custrecord_cntm_sh_scrap_qty',
							summary: 'SUM'
						}
					]
				}).run()).forEach(res=>{
					woScrap[ res.getValue(res.columns[0]) + '*' + res.getValue(res.columns[1]) ] = parseFloat(res.getValue(res.columns[2])) || 0;
				});
*/
				var line = 0;
                searchResults.forEach(res => {
                    var { columns } = res;
                   //  if (line == 0) log.debug('COLUMNZ', columns)
                    var woId = res.getValue(columns[0]);
   
                    if (woIds.indexOf(woId) < 0)
                        woIds.push(woId);
                    else if (duplicateIds.indexOf(woId) < 0)
                        duplicateIds.push(woId);


					// For WCO Good Panel changes - jeromemorden | 20220905
					var sequence = res.getValue({ name: 'sequence' });
					var operationName = res.getValue({ name: 'name' });
/*	log.debug('wcoGoodPanels[woId + '*' + operationName]', wcoGoodPanels[woId + '*' + operationName]);
					if(!wcoGoodPanels[woId + '*' + operationName] && sequence != '10')
						return true;
*/
/*
					var qtyOperation = res.getValue(res.columns[15]);
//	log.debug('qtyOperation - ' + woId + '-' + sequence, qtyOperation);
					if(woScrap[ woId + '*' + sequence + ' ' + operationName ]){
//	log.debug(`woScrap[ woId + '*' + sequence + ' ' + operationName ]`, woScrap[ woId + '*' + sequence + ' ' + operationName ]);
						var scrapQty = woScrap[ woId + '*' + sequence + ' ' + operationName ];
						qtyOperation -= scrapQty;
//	log.debug('qtyOperation1', qtyOperation);

						if(qtyOperation < 1)
							return true;
					}
*/
/* commented by jeromemorden | 02/10/2022
					// Get item id
					var itemId = res.getValue( columns[5] );
					itemIds.push(itemId);
*/					
   
                    csvText += '\n';
   
                    columns.forEach((col, i) => {
                        var label = col.label;
                        var id = 'custcol_' + (label.match(/id\[/gi) ? label.match(/id\[.*?\]/gi)[0].replace(/id\[|\]/gi, '') :
                            col.name.replace(/custbody/gi, 'cb').replace(/custcol/gi,'cc'));
                       let value = res.getText(col) || res.getValue(col) || null
                    //    if (id == 'custcol_workorder') 
                    //        value = `<a href="/app/accounting/transactions/workord.nl?id=${res.getValue({ name: 'internalid', join: 'workOrder' })}" target="_blank">${res.getValue('workorder')}</a>`
						
						if(id.match(/fill_run_hrs|pth_run_hrs/gi))
							value = value? Math.round(parseFloat(value) * 100)/100 : value;

                        if (typeof value == 'string') 
                            value = value.replace(/sales order #|work order #/gi, '');

                        if(id.match(/cntm_asm_op_text/gi)){
                            value = value.substr(value.indexOf(" ") + 1);
                            value = value.substr(value.indexOf("-") + 1);
                        }

						if(id.match(/cnt_created_fm_so/gi))
							value = `<a href="${soUrl}${res.getValue(col)}" target="_blank">${value}</a>`;
//                        if(line <= 1000){ // commented by: jeromemorden | 20220404
//
                        if(id.match(/cntm_asm_wo_ref/gi))
                            value = `<a href="${woUrl}${res.getValue(col)}" target="_blank">${value}</a>`;

						if(i == 15)
							value = qtyOperation;

                            sublist.setSublistValue({
                                id,
                                line,
                                value
                            });
                            if(id.indexOf("companyname") > 0){
                                id = id.replace("custcol_custcol_","custcol_cc_");
                                sublist.setSublistValue({
                                    id,
                                    line,
                                    value
                                });
                            }
  //                      }
                        
                        if (!id.match(/internalid|cb_outsourced|cb_rda_sales_order_type|cc_rda_fab_outsource_house/gi) && 
							!label.match(/woprio1|woprio2/gi))
                            if(id.match(/fill_run_hrs|pth_run_hrs/gi)){
							    value = value? Math.round(parseFloat(value) * 100)/100 : value;
                            }

                            if(id.match(/cnt_created_fm_so|cntm_asm_wo_ref/gi)){
                                value = res.getText(col) || res.getValue(col) || null
                            }
                            

                            if (typeof value == 'string'){
                                value = value.replace(/sales order #|work order #/gi, '');
                            }

                            if(i > 0){
                                csvText += `"${value || ''}",`;
                            }
                    });
					line++;
                });

/* commented by jeromemorden | 02/10/2022
				// Get additional item details
				var itemAddDetails = {};
				getAllSSResult(search.create({
					type: 'item',
					filters: [['internalid', 'anyof', itemIds.filter((a,b)=>{ return itemIds.indexOf(a) == b; })]],
					columns: [
						{
							name: 'custitem_materialtype'
						}, {
							name: 'custitem_cntm_panelsize'
						}, {
							name: 'custitem_boardthickness'
						}, {
							name: 'custitem_cnt_boardpitch'
						}
					]
				}).run()).forEach(res=>{
					var {columns} = res;
					itemAddDetails[res.id] = {};

					columns.forEach(col=>{
						itemAddDetails[res.id][col.name.replace(/custitem_/gi,'ci_')] = res.getValue(col) || '';
					});
				});
log.debug('itemAddDetails', itemAddDetails);
				itemIds.forEach((itemId, line)=>{
					var item = itemAddDetails[itemId];
					if(item)
						for(var x in item){
							if(item[x])
								sublist.setSublistValue({
									id: `custpage_${x}`,
									line, value: item[x]
								});
						}
				});
*/
            }
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
         let as = form.addButton({
             id: 'custpage_btnautosort',
             label: 'Auto Sort',
             functionName: 'autoSort()'
         });

         if (params.custpage_toolnumber) 
            as.isDisabled = true

         var csvUrl = url.resolveScript({
             scriptId: script.id,
             deploymentId: script.deploymentId
         });
         for (var x in params) {
             if (!x.match(/custpage_/gi) || !params[x] || x.match(/sublist|display|duplicated|updated|_page/gi))
                 continue;

			var paramsVal = params[x];
			if(x.match(/toolnumber/g))
				paramsVal = paramsVal.replace(/[^0-9a-zA-Z_\-]/gm,',');

             csvUrl += `&${x}=${paramsVal}`;
         }
         csvUrl += `&custpage_page=csv`;

         form.addButton({
             id: 'custpage_btnexportcsv',
             label: 'CSV',
             functionName: `exportToCSV("${csvUrl}")`
         });

         form.clientScriptModulePath = './se_cs_generalWOschedule_v1.5.js';

         if (params.custpage_page != 'csv')
             context.response.writePage(form);
         else {
             context.response.writeFile(file.create({
                 name: 'GeneralWOSchedule.CSV',
                 fileType: file.Type.CSV,
                 contents: csvText
             }));
         }
     }

     const secondPage = context => {
         log.debug('2nd page')
         var { request } = context;
         var params = request.parameters;
         var toUpdate = params.custpage_updated.split(',');

         var script = runtime.getCurrentScript();
         var editedFields = script.getParameter('custscript_gwos_asm_editedfields');

         var dataToUpdate = {};
         var group = 'custpage_sublist';
         var lineCount = request.getLineCount({
             group
         });
         var sublistdata = params.custpage_sublistdata.split('\u0002')

         for (var line = 0; line < lineCount; line++) {
             var woId = request.getSublistValue({
                 group,
                 name: 'custcol_internalid',
                 line
             });

             var woIdIndex = toUpdate.indexOf(woId);
             if (woIdIndex >= 0) {
                 toUpdate.splice(woIdIndex, 1);

                 dataToUpdate[woId] = {};
                 editedFields.split(',').forEach((id) => {
                     var name = 'custcol_' + id.replace(/custbody/gi, 'cb');
					 var value = request.getSublistValue({ group, name, line });
                    if (id.match(/comments/g)) { // Concatenate comment fields for multiple line items WO

						if(value){
							if (!dataToUpdate[woId][id]) dataToUpdate[woId][id] = ''

							dataToUpdate[woId][id] += value + '\n'
						}
                    } else {
                        dataToUpdate[woId][id] = value;
                    }
                 });
                 // Added by lcc 12/8/2021
                let weekendHrs = parseFloat(sublistdata[line].split('\u0001')[1]) || 0
                if (line == 0) {
                    log.debug('weekendHrs', sublistdata[line].split('\u0001'))
                }
                if (weekendHrs) {
                    let latest_prjenddate = sublistdata[line].split('\u0001')[8]
                    if (latest_prjenddate) { // Deduct the weekendhrs to latestprojectedenddate
                        //dataToUpdate[woId].custbody_latest_proj_end_date = moment(latest_prjenddate).add('hours', -weekendHrs).format('MM/DD/YYYY hh:mm a')
                    }
                }
            }

         }

         log.debug('dataToUpdate', dataToUpdate);

         for (var id in dataToUpdate)
             record.submitFields({
                 type: 'workorder',
                 id,
                 values: dataToUpdate[id]
             });

         for (var x in params)
             if (!x.match(/custpage_/gi) || !params[x] || x.match(/sublist|display|duplicated|updated/gi))
                 delete params[x];
         delete params.custpage_sublist;
         params.custpage_page = 1;

         redirect.toSuitelet({
             scriptId: script.id,
             deploymentId: script.deploymentId,
             parameters: params
         });
     }
    
    const wosWithCustOperationLines = woIds => {
        var customrecord_operation_lineSearchObj = search.create({
            type: "customrecord_operation_line",
            filters:
            [
               ["custrecord_operation_line_wo", "anyof", woIds]
            ],
            columns:
            [
               search.createColumn({name: "custrecord_operation_line_oper", label: "Operator"}),
               search.createColumn({name: "custrecord_operation_line_operseq", label: "Operation Sequence"}),
               search.createColumn({name: "custrecord_operation_line_opername", label: "Operation Name"}),
               search.createColumn({name: "custrecord_operation_line_mwc", label: "Manufacturing Work Center"}),
               search.createColumn({name: "custrecord_operation_line_predecessor", label: "Predecessor"}),
               search.createColumn({name: "custrecord_operation_line_startdate", label: "Start Date"}),
               search.createColumn({name: "custrecord_operation_line_enddate", label: "End Date"}),
               search.createColumn({name: "custrecord_operation_line_wo", label: "Work Order"}),
               search.createColumn({name: "custrecord_operation_line_timetaken", label: "Time Taken"}),
               search.createColumn({name: "custrecord_operation_line_inputqty", label: "Input Quantity"}),
               search.createColumn({name: "custrecord_operation_line_projectedendda", label: "Projected End Date"}),
               search.createColumn({name: "custrecord_operation_line_completedqty", label: "Completed Quantity"}),
               search.createColumn({name: "custrecord_operation_line_setuptime", label: "Production Setup Time (Min)"}),
               search.createColumn({name: "custrecord_operation_line_each", label: "Each"})
            ]
         });
         let ids = getAllSSResult(customrecord_operation_lineSearchObj.run()).map(m => m.getValue({ name: 'custrecord_operation_line_wo' }))
        log.debug('wosWithCustOperationLines WO ids', ids)

        return ids
    }

    const wosWithWOCompletions = woIds => {
        var transactionSearchObj = search.create({
            type: "transaction",
            filters:
            [
               ["type","anyof","WOCompl"], 
               "AND", 
               ["createdfrom","anyof",woIds],
               "AND", 
               ["mainline","is","T"]
            ],
            columns:
            [
            search.createColumn({name: "internalid", label: "Internal ID", sort: search.Sort.ASC}),
               search.createColumn({name: "tranid", label: "Document Number"}),
               search.createColumn({name: "trandate", label: "Date"}),
               search.createColumn({name: "datecreated", label: "Date Created"}),
               search.createColumn({name: "createdfrom", label: "Created From"})
            ]
         });
         let ids = getAllSSResult(transactionSearchObj.run()).map(m => m.getValue({ name: 'createdfrom' }))
        log.debug('wosWithWOCompletions WO ids', ids)

        return ids
    }
     
const getAllSSResult = (searchResultSet, limit) => {
log.debug('limit', limit);
	if(!limit)
		limit = 100000000;

	var inc = 0;
    log.debug("Limit parameter", limit);
	var result = [];
	for(var x=0;x<=result.length && x < limit;x+=1000){
		(inc+1000)>limit? inc = limit: inc += 1000;
log.debug('range', x + ' - ' + inc);
		result = result.concat(searchResultSet.getRange(x,inc)||[]);
	}
	log.debug('Line 785 result.length:', result.length)
	return result;
};

     const parseFloatOrZero = n => { return parseFloat(n) || 0 }

     return {
         onRequest
     };
     
 }
);
