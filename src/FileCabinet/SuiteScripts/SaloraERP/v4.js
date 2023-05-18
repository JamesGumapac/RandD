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
        try {
            var script = runtime.getCurrentScript();
            var searchId = script.getParameter('custscript_gwos_search_param_v4x');
            var editedFields = script.getParameter('custscript_gwos_editfields_param_v4x');
            log.debug('editedFields', editedFields);
            
            var {request} = context;
            var params = request.parameters;
            log.debug('params', params)
            
            var form = ui.createForm({
                title: 'GWOS Update only lot numbers in sequence'
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
                ['autosort', 'Auto Sort', ui.FieldType.CHECKBOX, null, 'custpage_filtergroup'],
                ['summary', ' - ', ui.FieldType.INLINEHTML, null, 'custpage_filtergroup']
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
            
            (['updated', 'page', 'duplicated', 'autosort']).forEach((key) => {
                fields[key].updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                });
            });
            
            fields.datefrom.updateBreakType({
                breakType: ui.FieldBreakType.STARTCOL
            })
            
            fields.datefrom.updateLayoutType({
                layoutType: ui.FieldLayoutType.STARTROW
            });
            fields.dateto.updateLayoutType({
                layoutType: ui.FieldLayoutType.ENDROW
            });
            
            fields.toolnumber.updateBreakType({
                breakType: ui.FieldBreakType.STARTCOL
            })
            
            fields.toolnumber.updateLayoutType({
                layoutType: ui.FieldLayoutType.STARTROW
            });
            
            fields.summary.updateDisplayType({
                displayType: ui.FieldDisplayType.INLINE
            });
            fields.summary.updateLayoutType({
                layoutType: ui.FieldLayoutType.OUTSIDEBELOW
            });
            
            // Add Company Name options
            fields['entity'].addSelectOption({value: '', text: ''});
            getAllSSResult(search.create({
                type: 'customer',
                filters: [['stage', 'anyof', 'CUSTOMER'], 'AND',
                ['isinactive', 'is', 'F']],
                columns: [{name: 'entityid'}]
            }).run()).forEach(res => {
                fields['entity'].addSelectOption({
                    value: res.id,
                    text: res.getValue(res.columns[0])
                });
            });
            /*
            // Add Tool Number options
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
            // Add Manufacturing Work Center Options
            /*         fields['manufacturingworkcenter'].addSelectOption({
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
            fields['operation'].addSelectOption({text: '', value: ''});
            getAllSSResult(search.create({
                type: 'customrecord_operation_line',
                columns: [{
                    name: 'custrecord_operation_line_opername',
                    summary: search.Summary.GROUP,
                    sort: search.Sort.ASC
                }]
            }).run()).forEach(res => {
                var text = res.getText(res.columns[0]);
                var value = res.getValue(res.columns[0]);
                
                if (value)
                fields['operation'].addSelectOption({text, value: text});
            });
            fields['operation'].defaultValue = params.custpage_operation;
            
            // Sticky department
            var userId = runtime.getCurrentUser().id;
            if (request.method == 'GET') {
                var divisionSelected = search.lookupFields({
                    type: 'employee',
                    id: userId,
                    columns: ['custentity_editworkordersl_division']
                }).custentity_editworkordersl_division;
                
                divisionSelected = divisionSelected.length ? divisionSelected[0].value : null;
                
                fields.department.defaultValue = divisionSelected;
                
                params.custpage_department = divisionSelected;
                
            } else {
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
            if (date >= case1 && date < case2) {
            } else if (date >= case3 && date < case1) {
            } else if (date >= case2 || date < case3) {
            }
            
            
            //			if(params.custpage_page || request.method == 'POST'){
            var woIds = [];
            var duplicateIds = [];
            var csvText = '';
            var toolNumbers = '';
            var lotNumbers = {};
            var woPriority1_2FormulaLabel = "WOPrio1 + WOPrio2"
            var searchResults = ((ssId, par) => {
                var ss = search.create({
                    type: 'customrecord_cntm_clientappsublist',
                    columns: [
                        {name: 'internalid', join: 'custrecord_cntm_work_order', summary: 'GROUP', sort: 'ASC'},
                        {name: 'custrecord_cntm_seq_no', summary: 'MIN', sort: 'ASC'},
                        //                         {name: 'internalid', summary: 'MIN'}
                    ]
                });
                
                ss.filters.push(search.createFilter({
                    name: 'mainline', join: 'custrecord_cntm_work_order', operator: 'is', values: 'T'
                }), search.createFilter({
                    name: 'status', join: 'custrecord_cntm_work_order', operator: 'noneof', values: 'WorkOrd:H'// exclude Closed Work Orders
                }), search.createFilter({
                    name: 'custrecord_cntm_cso_status', operator: 'anyof', values: ['1', '3']// Get only pending and in progress operation
                }),
                //  search.createFilter({// temporary - this is to exclude the specific work order causing an error due to duplicated operation sequence
                // 		name: 'internalid', join: 'custrecord_cntm_work_order', operator: 'noneof', values: '1776405'
                //  })
                );
                
                ([
                    'custrecord_cntm_work_order.entity', /*'workorder.internalid', */'custrecord_cntm_work_order.department'//, 'custrecord_operation_line_mwc'
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
                /*                 if (par.custpage_operation) {
                    ss.filters.push(search.createFilter({
                        name: 'custrecord_cntm_cso_operaton',
                        operator: search.Operator.CONTAINS,
                        values: par.custpage_operation
                    }));
                }*/
                if (par.custpage_workorder) {
                    var woTranId = par.custpage_workorder;
                    if (!woTranId.match(/wo/gi))
                    woTranId = `WO${woTranId}`;
                    
                    ss.filters.push(search.createFilter({
                        name: 'tranid',
                        join: 'custrecord_cntm_work_order',
                        operator: search.Operator.IS,
                        values: woTranId
                    }));
                }
                if (par.custpage_salesorder) {
                    var soTranId = par.custpage_salesorder;
                    if (!soTranId.match(/so/gi))
                    soTranId = `SO${soTranId}`;
                    
                    var soIds = [];
                    search.create({
                        type: 'salesorder',
                        filters: [['tranid', 'is', soTranId]],
                        columns: [{'name': 'internalid'}]
                    }).run().getRange(0, 1000).forEach(res => {
                        soIds.push(res.getValue(res.columns[0]));
                    });
                    if (soIds.length)
                    ss.filters.push(search.createFilter({
                        name: 'custbody_cnt_created_fm_so',
                        join: 'custrecord_cntm_work_order',
                        operator: search.Operator.ANYOF,
                        values: soIds
                    }));
                    else
                    ss.filters.push(search.createFilter({
                        name: 'custbody_cnt_created_fm_so',
                        join: 'custrecord_cntm_work_order',
                        operator: search.Operator.ANYOF,
                        values: ['1']
                    }));
                }
                //-->
                
                if (par.custpage_datefrom && par.custpage_dateto) {
                    ss.filters.push(search.createFilter({
                        name: 'custbody_rda_wo_sched_due_date',
                        join: 'custrecord_cntm_work_order',
                        operator: search.Operator.WITHIN,
                        values: [par.custpage_datefrom, par.custpage_dateto]
                    }));
                } else if (par.custpage_datefrom) {
                    ss.filters.push(search.createFilter({
                        name: 'custbody_rda_wo_sched_due_date',
                        join: 'custrecord_cntm_work_order',
                        operator: search.Operator.ONORAFTER,
                        values: par.custpage_datefrom
                    }));
                } else if (par.custpage_dateto) {
                    ss.filters.push(search.createFilter({
                        name: 'custbody_rda_wo_sched_due_date',
                        join: 'custrecord_cntm_work_order',
                        operator: search.Operator.ONORBEFORE,
                        values: par.custpage_dateto
                    }));
                }
                
                if (par.custpage_toolnumber) {
                    log.debug('in IF par.custpage_toolnumber', par.custpage_toolnumber)
                    
                    toolNumbers = par.custpage_toolnumber.split(/[^0-9a-zA-Z_\-]/gm).filter(a => a);
                    
                    var formula = '';
                    toolNumbers.forEach(name => {
                        formula += `WHEN '${name}' THEN 1 `;
                    });
                    if (formula) {
                        var toolNumberIds = getAllSSResult(search.create({
                            type: 'customrecord_cntm_job_id',
                            filters: [[`formulanumeric: CASE {name} ${formula}ELSE 0 END`, `equalto`, `1`]],
                        }).run()).map(res => {
                            return res.id;
                        });
                        log.debug('toolNumberIds', toolNumberIds)
                        
                        if (toolNumberIds.length) {
                            ss.filters.push(search.createFilter({
                                name: 'custbody_cntm_tool_number',
                                join: 'custrecord_cntm_work_order',
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
                /*
                file.create({
                    name: 'ss.columns.txt',
                    fileType: file.Type.PLAINTEXT,
                    contents: JSON.stringify(ss.columns),
                    folder: -15
                }).save()
                */
                log.debug('ss.filters', ss.filters);
                log.debug('ss.filterExpression', ss.filterExpression);
                
                // Get result limit
                var script = runtime.getCurrentScript();
                var limit = par.custpage_page == 'csv' ? '' : parseInt(script.getParameter('custscript_gwos_linelimit_param_v4x'));
                //                 log.debug('ss runPaged count:', ss.runPaged().count)
                
                var totalCount = ss.runPaged().count;
                var showing = limit && limit < totalCount? limit: totalCount;
                
                
                if(par.custpage_operation)
                limit = '';

                log.debug('LIMIT', limit)
                // Get all operation ids
                var sequence = getAllSSResult(ss.run(), limit).map(res => {
                    return { wo: res.getValue(res.columns[0]), sequence: res.getValue(res.columns[1]) };
                });
                
                if(!sequence.length){
                    fields.summary.defaultValue = `<script>jQuery('#custpage_summary_val').parent().parent().parent().attr('align','right').parent().parent().parent().attr('width','100%').parent().parent().parent().parent().attr('width','100%');</script><p>Showing ${showing} out of ${totalCount} work order(s).</p>`;
                    return [];
                }
                
                // Get lot numbers
                var getIdFilter = sequence.map(a=>`[["custrecord_cntm_work_order", "anyof", "${a.wo}"], "AND", ["custrecord_cntm_seq_no", "equalto", "${a.sequence}"]]`)
                .join('|OR|').split('|').map(a => a=='OR'? a: JSON.parse(a));
                getAllSSResult( search.create({
                    type: 'customrecord_cntm_clientappsublist',
                    filters: [
                        ['custrecord_cntm_work_order.mainline', 'is', 'T'], 'AND',
                        ['custrecord_cntm_cso_status', 'anyof', '1', '3'], 'AND',
                        getIdFilter
                    ],
                    columns: [
                        { name: 'custrecord_cntm_work_order' },
                        { name: 'custrecord_cntm_seq_no', sort: 'ASC' },
                        { name: 'custrecord_cntm_cso_pannellot' }
                    ]
                }).run() ).forEach(res=>{
                    var woId = res.getValue(res.columns[0]);
                    var seqNo = res.getValue(res.columns[1]);
                    var panelLot = res.getValue(res.columns[2]);
                    
                    if(!lotNumbers[woId])
                    lotNumbers[woId] = {};
                    
                    if(!lotNumbers[woId][seqNo])
                    lotNumbers[woId][seqNo] = [];
                    
                    var alreadyExist = 0;
                    for(var x in lotNumbers[woId]){
                        if(x == seqNo)
                        continue;
                        
                        if(lotNumbers[woId][x].indexOf(panelLot) >= 0)
                        alreadyExist = 1;
                    }
                    
                    if(!alreadyExist)
                    lotNumbers[woId][seqNo].push( panelLot );
                });
                
//                getIdFilter = sequence.map(a=>`[["custrecord_cntm_work_order", "anyof", "${a.wo}"], "AND", ["custrecord_cntm_seq_no", "equalto", "${a.sequence}"]]`)
				var lotFilter = {};
				sequence.forEach(a=>{
					if( lotNumbers[a.wo] && lotNumbers[a.wo][a.sequence] && lotNumbers[a.wo][a.sequence].length ){
						if(lotNumbers[a.wo][a.sequence].length == 1)
							lotFilter[`${a.wo}*${a.sequence}`] = `, "AND", ["custrecord_cntm_cso_pannellot", "is", "${lotNumbers[a.wo][a.sequence][0]}"]`;
						else{
							var xFtr = lotNumbers[a.wo][a.sequence].map(x => `["custrecord_cntm_cso_pannellot", "is", "${x}"]`).join('|OR|').split('|').map(a => a=='OR'? a: JSON.parse(a));
							lotFilter[`${a.wo}*${a.sequence}`] = `, "AND", ${JSON.stringify(xFtr)}`;
						}
					}
				});
				 getIdFilter = sequence.map(a=>`[["custrecord_cntm_work_order", "anyof", "${a.wo}"], "AND", ["custrecord_cntm_seq_no", "equalto", "${a.sequence}"]${lotFilter[a.wo+'*'+a.sequence] || ''}]`)
                .join('|OR|').split('|').map(a => a=='OR'? a: JSON.parse(a));
                var operationIds = getAllSSResult( search.create({
                    type: 'customrecord_cntm_clientappsublist',
                    filters: [
                        ['custrecord_cntm_cso_status', 'anyof', ['1', '3']], 'AND',
                        getIdFilter
                    ],
                    columns: [
                        { name: 'custrecord_cntm_cso_parentrec', summary: 'GROUP' },
                        { name: 'internalid', summary: 'MIN' }
                    ]
                }).run() ).map(res=> res.getValue(res.columns[1]) );
                log.debug('operationIds', operationIds);
                log.debug("operationIds slice", operationIds.slice(operationIds.length-64));
                
                // Get all other level pending operations
                //				if(!par.custpage_operation)
                operationIds = getOtherPendingOperation(sequence, operationIds, lotNumbers);
                
                var detailedSearch = search.load({id: ssId});
                if (operationIds && operationIds.length > 0) {
                    detailedSearch.filters.push(search.createFilter({
                        name: 'internalid', operator: 'ANYOF', values: operationIds
                    }));
                    if(par.custpage_operation){
                        detailedSearch.filters.push(search.createFilter({
                            name: 'custrecord_cntm_cso_operaton', operator: 'CONTAINS', values: par.custpage_operation
                        }));
                        showing = detailedSearch.runPaged().count;
                        totalCount = showing;
                    }
                    
                    fields.summary.defaultValue = `<script>jQuery('#custpage_summary_val').parent().parent().parent().attr('align','right').parent().parent().parent().attr('width','100%').parent().parent().parent().parent().attr('width','100%');</script><p>Showing ${showing} out of ${totalCount} work order(s).</p>`;
                    
                    log.debug('create filter', operationIds);
                    return getAllSSResult(detailedSearch.run());
                } else {
                    log.debug('no filter', operationIds);
                    return [];
                }
                
            })(searchId, params);
            
            log.emergency('searchResults1:' + searchResults.length, searchResults);
            log.debug('searchResults1:', searchResults);
            
            var sublistFields = {};
            
            var sublist = form.addSublist({
                id: 'custpage_sublist',
                label: `Results`,
                type: ui.SublistType.LIST
            });
            
            if (searchResults.length) {
                
                // *********** GET OPERATION QTY ******************
                var qtyFilterValues = [];
                searchResults.forEach(res => {
                    var woId = res.getValue(res.columns[0]);
                    var operationName = res.getValue({ name: 'custrecord_cntm_cso_operaton' });
                    
                    qtyFilterValues.push({woId, operationName});
                });
                
                var qtyFilters = [];
                qtyFilterValues.forEach((f, i) => {
                    if (i)
                    qtyFilters.push('OR');
                    qtyFilters.push([['custrecord_cntm_work_order', 'anyof', f.woId], 'AND',
                    ['custrecord_cntm_cso_operaton', 'is', f.operationName]]);
                });
                
                var woQty = {};
                var operationQty = {};
                getAllSSResult(search.create({
                    type: 'customrecord_cntm_clientappsublist',
                    filters: [
                        qtyFilters, 'AND',
                        ['custrecord_cntm_cso_status', 'anyof', ['1','3']], 'AND',
                        ['custrecord_cntm_work_order.mainline', 'is', 'T']
                    ],
                    columns: [
                        {name: 'internalid', join: 'custrecord_cntm_work_order', summary: 'GROUP'},
                        {name: 'custrecord_cntm_cso_operaton', summary: 'GROUP'},
                        {name: 'custrecord_cntm_cso_woc_quantity', summary: 'SUM'},
                        {name: 'custrecord_cntm_cso_scrap_quantity', summary: 'SUM'},
                        {
                            name: 'formulanumeric',
                            summary: 'SUM',
                            formula: 'TO_NUMBER({custrecord_cntm_cso_quantity_good})'
                        },
                        {name: 'custrecord_cntm_seq_no', summary: 'GROUP', sort: 'ASC'},
                    ]
                }).run()).forEach(res => {
                    var cols = res.columns;
                    var woId = res.getValue(cols[0])
                    var operationName = res.getValue(cols[1])
                    
                    operationQty[`${woId}*${operationName}`] = {
                        lotquantity: res.getValue(cols[2]),
                        scrapquantity: res.getValue(cols[3]),
                        goodquantity: res.getValue(cols[4]),
                        pendingquantity: ((parseInt(res.getValue( cols[4] )) * 100) - (woQty[woId] || 0))/100
                    }
                    
                    if(!woQty[woId])
                    woQty[woId] = 0;
                    
                    woQty[woId] += ((parseInt(res.getValue( cols[4] )) * 100) - woQty[woId]);
                });
                // *************** END **************************
                /*
                var sublistFields = {};
                
                var sublist = form.addSublist({
                    id: 'custpage_sublist',
                    label: `Results`,
                    type: ui.SublistType.LIST
                });
                */
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
                            var displayType = label.match(/display\[/gi)? label.match(/display\[.*?\]/gi)[0].replace(/display\[|\]/gi, ''): '';
                            
                            if (label != woPriority1_2FormulaLabel) { // Dont add the WOPrio1 + WOPrio2 to the UI cols
                                var id = label.match(/id\[/gi) ? label.match(/id\[.*?\]/gi)[0].replace(/id\[|\]/gi, '') :
                                col.name.replace(/custbody/gi, 'cb').replace(/custcol/gi, 'cc').replace(/custrecord/gi, 'cr');
                                label = label.match(/id\[|\]/gi) ? label.replace(/id\[.*?\]/gi, '').trim() : label;
                                var type = ui.FieldType.TEXT;
                                if (id.match(/cntm_priority|weekend_hours|cnt_board_thickness|cntm_boardpitch/gi))
                                type = ui.FieldType.FLOAT;
                                else if (id.match(/wo_sched_due_date/gi))
                                type = ui.FieldType.DATE;
                                else if (id.match(/cntm_qfactor/gi))
                                type = ui.FieldType.PERCENT;
                                else if (id.match(/comment/gi))
                                type = ui.FieldType.TEXTAREA;
                                
                                if(id == 'hiddenfield')
                                return;
                                
                                // ADD SUBLIST FIELDS
                                sublistFields[id] = sublist.addField({
                                    id: `custcol_${id}`,
                                    label,
                                    type
                                });
                                // Added by jeromemorden | 01/20/22
                                if (id.match(/wopriority|priorty|weekendhrs/gi))  //added priorty|
                                sublistFields[id].updateDisplaySize({
                                    height: 60,
                                    width: 4
                                });
                                if (id.match(/wo_scheddue/gi))
                                sublistFields[id].updateDisplaySize({
                                    height: 60,
                                    width: 8
                                });
                                // end
                                // Added by lcc 1/8/2022
                                if (id.match(/quantity|rda_qfactor|qtyoperation|no_of_panel|total_num_cores|boards_per_panel|qty_due/gi)) {
                                    sublistFields[id].updateDisplaySize({
                                        height: 60,
                                        width: 6
                                    });
                                    // sublistFields[id].maxLength = 15
                                    //log.debug('Width reduced', { id, label })
                                }
                                if (id.match(/comments/gi)) {
                                    sublistFields[id].updateDisplaySize({
                                        height: 2,
                                        width: 20
                                    });
                                    // log.debug('Height reduced', { id, label })
                                }
                                
                                // Added by jerome
                                if(displayType)
                                sublistFields[id].updateDisplayType({
                                    displayType: ui.FieldDisplayType[displayType]
                                });
                                
                                
                                // end
                                if (!id.match(/internalid/gi) && displayType != 'HIDDEN')
                                csvText += `"${label}",`;
                            }
                        });
                        //                log.debug('sublistFields', sublistFields)
                        
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
                            'internalid', 'operationid'//, 'cb_outsourced', 'cb_rda_sales_order_type', 'cc_rda_fab_outsource_house',
                            //'cb_wo_outsideservice', 'cb_wo_finishtype', 'cb_cntm_tool_number'
                        ]).forEach(id => {
                            if (sublistFields[id])
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
                        
                        if (allowEditing)
                        editedFields.split(',').forEach((fieldId) => {
                            fieldId = fieldId.replace(/custbody/gi, 'cb').replace(/custrecord/gi, 'cr');
                            if (sublistFields[fieldId])
                            sublistFields[fieldId].updateDisplayType({
                                displayType: ui.FieldDisplayType.ENTRY
                            });
                        });
                        
                        
                        // This block of code will sort the results based on the entered tool numbers filter - added by: jeromemorden | 03/25/2022
                        //                         log.debug('toolNumbers', toolNumbers)
                        if (toolNumbers && toolNumbers.length) {
                            var results = {};
                            var toolNumber = [];
                            toolNumbers.forEach(num => {
                                if (!results[num]) {
                                    results[num] = [];
                                    toolNumber.push(num);
                                }
                            });
                            //                             log.debug('results', results)
                            searchResults.forEach(res => {
                                var toolNum = res.getText({ name: 'custbody_cntm_tool_number', join: 'custrecord_cntm_work_order' });
                                for (col of res.columns)
                                if (col.name.match(/custbody_cntm_tool_number/g)) {
                                    toolNum = res.getText(col)
                                    break
                                }
                                if (results[toolNum])
                                results[toolNum].push(res);
                            });
                            
                            //                             log.debug('results2:', results);
                            searchResults = [];
                            toolNumber.forEach(x => {
                                searchResults = searchResults.concat(results[x]);
                            });
                        }
                        
                        // Gather item ids
                        //   				var itemIds = [];
                        soUrl = url.resolveRecord({
                            recordType: 'salesorder'
                        }) + '&id=';
                        
                        searchResults.forEach((res, line) => {
                            var {columns} = res;
                            //  if (line == 0) log.debug('COLUMNZ', columns)
                            var woId = res.getValue(columns[0]);
                            var operationName = res.getValue({ name: 'custrecord_cntm_cso_operaton' });
                            
                            if (woIds.indexOf(woId) < 0)
                            woIds.push(woId);
                            else if (duplicateIds.indexOf(woId) < 0)
                            duplicateIds.push(woId);
                            
                            /* commented by jeromemorden | 02/10/2022
                            // Get item id
                            var itemId = res.getValue( columns[5] );
                            itemIds.push(itemId);
                            */
                            
                            csvText += '\n';
                            
                            columns.forEach((col) => {
                                var label = col.label;
                                var displayType = label.match(/display\[/gi)? label.match(/display\[.*?\]/gi)[0].replace(/display\[|\]/gi, ''): '';
                                var id = 'custcol_' + (label.match(/id\[/gi) ? label.match(/id\[.*?\]/gi)[0].replace(/id\[|\]/gi, '') :
                                col.name.replace(/custbody/gi, 'cb').replace(/custcol/gi, 'cc').replace(/custrecord/gi, 'cr'));
                                
                                
                                let value = res.getText(col) || res.getValue(col) || null
                                //                                log.debug("id",id);
                                // jeromemorden | 20220920 - qtyoperation
                                if (id == 'custcol_qtyoperation'){
                                    if (operationQty[`${woId}*${operationName}`])
                                    value = operationQty[`${woId}*${operationName}`].pendingquantity;
                                    operationAtQty = value;
                                }else if(id == 'custcol_panels'){
                                    if(operationQty[`${woId}*${operationName}`]){
                                        var boardPerPanel = parseFloat(res.getValue({ name: 'custbody_rda_boards_per_panel', join: 'custrecord_cntm_work_order' })) || 1;
                                        value = (operationQty[`${woId}*${operationName}`].pendingquantity/boardPerPanel).toFixed(2);
                                        value = value.split('.')[1] == '00'? value.split('.')[0]: value;
                                    }
                                }else if(id == 'custcol_cr_cntm_cso_operaton' && value){
                                    value = value.split(' ');
                                    value.splice(0,1);
                                    value = value.join(' ');
                                }else if(id == 'custcol_lotnumbers'){
                                    var seqNo = res.getValue({ name: 'custrecord_cntm_seq_no'});
                                    if(lotNumbers[woId] && lotNumbers[woId][seqNo]){
                                        value = lotNumbers[woId][seqNo].join(', ');
                                    }
                                }
                                
                                
                                if (id == 'custcol_cr_cntm_work_order')
                                value = `<a href="/app/accounting/transactions/workord.nl?id=${res.getValue(col)}" target="_blank">${res.getText(col)}</a>`
                                
                                if (id.match(/fill_run_hrs|pth_run_hrs/gi))
                                value = value ? Math.round(parseFloat(value) * 100) / 100 : value;
                                
                                if (typeof value == 'string')
                                value = value.replace(/sales order #|work order #/gi, '');
                                
                                if (id.match(/cnt_created_fm_so/gi))
                                value = `<a href="${soUrl}${res.getValue(col)}">${value}</a>`;
                                //                        if(line <= 1000){ // commented by: jeromemorden | 20220404
                                if(value){
                                    sublist.setSublistValue({
                                        id,
                                        line,
                                        value
                                    });
                                }
                                if (id.indexOf("companyname") > 0) {
                                    id = id.replace("custcol_custcol_", "custcol_cc_");
                                    sublist.setSublistValue({
                                        id,
                                        line,
                                        value
                                    });
                                }
                                //                      }
                                if ( !id.match(/internalid/gi) && displayType != 'HIDDEN' ){
									if(value)
										value = (value).toString().replace(/"/gi, '');

									if(id.match(/cnt_created_fm_so|cntm_work_order/gi)){
										csvText += `"${(value||'').replace(/<.*?>/gi,'')}",`;
									}else{
										csvText += `"${value || ''}",`;
									}
                                }
                            });
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
                if (x.match(/toolnumber/g))
                paramsVal = paramsVal.replace(/[^0-9a-zA-Z_\-]/gm, ',');
                
                csvUrl += `&${x}=${paramsVal}`;
            }
            csvUrl += `&custpage_page=csv`;
            
            form.addButton({
                id: 'custpage_btnexportcsv',
                label: 'CSV',
                functionName: `exportToCSV("${csvUrl}")`
            });
            
            form.clientScriptModulePath = './cs_v4';
            
            if (params.custpage_page != 'csv')
            context.response.writePage(form);
            else {
                context.response.writeFile(file.create({
                    name: 'GeneralWOSchedule.CSV',
                    fileType: file.Type.CSV,
                    contents: csvText
                }));
            }
        } catch(e) {
            log.debug('Error', e);
        }
    }
    
    const getOtherPendingOperation = ( sequence, operationIds, lotNumbers ) => {
        var toReturnIds = operationIds;
        
        var type = 'customrecord_cntm_clientappsublist';
        
        while(sequence.length){
            
            // Get completed operations in the same sequence
            var filters = sequence.map(a => `[["custrecord_cntm_work_order", "anyof", "${a.wo}"], "AND", ["custrecord_cntm_seq_no", "equalto", "${a.sequence}"]]`)
            .join('|OR|').split('|').map(a => a=='OR'? a: JSON.parse(a));
            
            var completedOps = {};
            getAllSSResult( search.create({
                type,
                filters: [filters, 'AND', ['custrecord_cntm_cso_status', 'anyof', '4'], 'AND',
                ['custrecord_cntm_work_order.mainline', 'is', 'T']],
                columns: [
                    { name: 'custrecord_cntm_work_order' },
                    { name: 'custrecord_cntm_cso_pannellot'}
                ]
            }).run() ).forEach(res=>{
                var wo = res.getValue(res.columns[0]);
                
                if(!completedOps[wo])
                completedOps[wo] = [];
                
                completedOps[wo].push(res.getValue(res.columns[1]));
                
            });
            
            if(!Object.keys(completedOps).length)
            return toReturnIds;
            
            // Get another in progress sequence
            filters = [];
            for(var wo in completedOps){
                if(filters.length)
                filters.push('OR');
                
                var f = completedOps[wo].map(a=> `["custrecord_cntm_cso_pannellot", "is", "${a}"]`).join('|OR|').split('|')
                .map(a=> a=='OR'? a: JSON.parse(a));
                
                filters.push([['custrecord_cntm_work_order', 'is', wo], 'AND', f]);
            }
            
            sequence = getAllSSResult( search.create({
                type,
                filters: [filters, 'AND', ['custrecord_cntm_cso_status', 'anyof', ['1','3']], 'AND',
                ['custrecord_cntm_work_order.mainline', 'is', 'T']],
                columns: [
                    { name: 'internalid', join: 'custrecord_cntm_work_order', summary: 'GROUP', sort: 'ASC' },
                    { name: 'custrecord_cntm_seq_no', summary: 'MIN', sort: 'ASC' }
                ]
            }).run() ).map(res => {
                return { wo: res.getValue(res.columns[0]), sequence: res.getValue(res.columns[1]) };
            });
            
            if(!sequence.length)
            return toReturnIds;
            
            var getIdFilter = sequence.map(a=>`[["custrecord_cntm_work_order", "anyof", "${a.wo}"], "AND", ["custrecord_cntm_seq_no", "equalto", "${a.sequence}"]]`).join('|OR|').split('|').map(a => a=='OR'? a: JSON.parse(a));
            getAllSSResult( search.create({
                type: 'customrecord_cntm_clientappsublist',
                filters: [
                    ['custrecord_cntm_work_order.mainline', 'is', 'T'], 'AND',
                    ['custrecord_cntm_cso_status', 'anyof', '1', '3'], 'AND',
                    getIdFilter
                ],
                columns: [
                    { name: 'custrecord_cntm_work_order' },
                    { name: 'custrecord_cntm_seq_no' },
                    { name: 'custrecord_cntm_cso_pannellot' }
                ]
            }).run() ).forEach(res=>{
                var woId = res.getValue(res.columns[0]);
                var seqNo = res.getValue(res.columns[1]);
                var panelLot = res.getValue(res.columns[2]);
                
                if(!lotNumbers[woId])
                lotNumbers[woId] = {};
                
                if(!lotNumbers[woId][seqNo])
                lotNumbers[woId][seqNo] = [];
                
                var alreadyExist = 0;
                for(var x in lotNumbers[woId]){
                    if(x == seqNo)
                    continue;
                    
                    if(lotNumbers[woId][x].indexOf(panelLot) >= 0)
                    alreadyExist = 1;
                }
                
                if(!alreadyExist)
                lotNumbers[woId][seqNo].push( panelLot );
            });
            
            
            
//            getIdFilter = sequence.map(a=>`[["custrecord_cntm_work_order", "anyof", "${a.wo}"], "AND", ["custrecord_cntm_seq_no", "equalto", "${a.sequence}"], "AND", ["custrecord_cntm_cso_pannellot", "anyof", "${lotNumbers[a.wo][a.sequence]}"]]`).join('|OR|').split('|').map(a => a=='OR'? a: JSON.parse(a));
            var lotFilter = {};
            sequence.forEach(a=>{
              if( lotNumbers[a.wo] && lotNumbers[a.wo][a.sequence] && lotNumbers[a.wo][a.sequence].length ){
					if(lotNumbers[a.wo][a.sequence].length == 1)
					  lotFilter[`${a.wo}*${a.sequence}`] = `, "AND", ["custrecord_cntm_cso_pannellot", "is", "${lotNumbers[a.wo][a.sequence][0]}"]`;
					else{
						var xFtr = lotNumbers[a.wo][a.sequence].map(x => `["custrecord_cntm_cso_pannellot", "is", "${x}"]`).join('|OR|').split('|').map(a => a=='OR'? a: JSON.parse(a));
						lotFilter[`${a.wo}*${a.sequence}`] = `, "AND", ${JSON.stringify(xFtr)}`;
					}
            	}
            });
				 getIdFilter = sequence.map(a=>`[["custrecord_cntm_work_order", "anyof", "${a.wo}"], "AND", ["custrecord_cntm_seq_no", "equalto", "${a.sequence}"]${lotFilter[`${a.wo}*${a.sequence}`] || ''}]`)
				 	.join('|OR|').split('|').map(a => a=='OR'? a: JSON.parse(a));
            var newOperationWorkOrder = {};
            operationIds = getAllSSResult( search.create({
                type,
                filters: [
                    ['custrecord_cntm_cso_status', 'anyof', ['1', '3']], 'AND',
                    getIdFilter
                ],
                columns: [
                    { name: 'internalid', join: 'custrecord_cntm_work_order', summary: 'GROUP', sort: 'ASC' },
                    { name: 'internalid', summary: 'MIN' }
                ]
            }).run() ).map(res => {
                newOperationWorkOrder[res.getValue(res.columns[1])] = res.getValue(res.columns[0]);
                
                return res.getValue(res.columns[1]);
            });
            
            
            
            var duplicatedOperation = [];
            for(var x=operationIds.length-1;x>=0;x--){
                if(toReturnIds.indexOf( operationIds[x] ) >= 0){
                    var id = operationIds.splice(x,1)[0];
                    
                    duplicatedOperation.push( newOperationWorkOrder[id] );
                }
            }
            
            if(duplicatedOperation.length){
                
                var xSeq = duplicatedOperation.map(wo=>{
                    var x = 0;
                    var seq = '';
                    while(!seq && x < sequence.length){
                        if(wo == sequence[x].wo){
                            seq = sequence[x].sequence;
                            sequence.splice(x, 1);
                        }
                        
                        x++;
                    }
                    
                    return { wo, sequence: seq };
                });
                
                var dup = processDuplicatedOperation( duplicatedOperation, xSeq );
                
                
                sequence = sequence.concat( dup.sequence );
                operationIds = operationIds.concat( dup.operationIds );
            }
            
            if(operationIds.length)
            toReturnIds = toReturnIds.concat(operationIds);
            
        }
        
        return toReturnIds;
        
    }
    
    const processDuplicatedOperation = ( duplicatedOperation, sequence ) => {
        
        var operationIds = [];
        var type = 'customrecord_cntm_clientappsublist';
        
        var filters = sequence.map(a => `[["custrecord_cntm_work_order", "anyof", "${a.wo}"], "AND", ["custrecord_cntm_seq_no", "equalto", "${a.sequence}"]]`)
        .join('|OR|').split('|').map(a => a=='OR'? a: JSON.parse(a));
        
        var resultsDup = {};
        getAllSSResult( search.create({
            type,
            filters: [filters, 'AND', ['custrecord_cntm_work_order.mainline', 'is', 'T']],
            columns: [
                { name: 'custrecord_cntm_work_order' },
                { name: 'custrecord_cntm_cso_status' },
                { name: 'custrecord_cntm_cso_pannellot'}
            ]
        }).run() ).forEach(res=>{
            var wo = res.getValue(res.columns[0]);
            var stat = res.getValue(res.columns[1]);
            var panelLot = res.getValue(res.columns[2]);
            
            if(!resultsDup[wo])
            resultsDup[wo] = {
                completed: [], pending: []
            };
            
            resultsDup[wo][stat == '1' || stat == '3'? 'pending': 'completed'].push( panelLot );
            
        });
        
        var dupCompleted = {};
        for(var wo in resultsDup){
            dupCompleted[wo] = [];
            
            resultsDup[wo].completed.forEach(op=>{
                if( resultsDup[wo].pending.indexOf(op) < 0 )
                dupCompleted[wo].push( op );
            });
        }
        
        filters = [];
        for(var wo in dupCompleted){
            if(!dupCompleted[wo].length)
            continue;
            
            if(filters.length)
            filters.push('OR');
            
            var f = dupCompleted[wo].map(a=> `["custrecord_cntm_cso_pannellot", "is", "${a}"]`).join('|OR|').split('|')
            .map(a=> a=='OR'? a: JSON.parse(a));
            
            filters.push([['custrecord_cntm_work_order', 'is', wo], 'AND', f]);
        }
        
        if(!filters.length)
        return { sequence: [], operationIds };
        
        sequence = getAllSSResult( search.create({
            type,
            filters: [filters, 'AND', ['custrecord_cntm_cso_status', 'anyof', ['1','3']], 'AND',
            ['custrecord_cntm_work_order.mainline', 'is', 'T']],
            columns: [
                { name: 'internalid', join: 'custrecord_cntm_work_order', summary: 'GROUP', sort: 'ASC' },
                { name: 'custrecord_cntm_seq_no', summary: 'MIN', sort: 'ASC' }
            ]
        }).run() ).map(res => {
            return { wo: res.getValue(res.columns[0]), sequence: res.getValue(res.columns[1]) };
        });
        
        if(!sequence.length)
        return { sequence, operationIds };
        
        var getIdFilter = sequence.map(a=>`[["custrecord_cntm_work_order", "anyof", "${a.wo}"], "AND", ["custrecord_cntm_seq_no", "equalto", "${a.sequence}"]]`).join('|OR|').split('|').map(a => a=='OR'? a: JSON.parse(a));
        operationIds = getAllSSResult( search.create({
            type,
            filters: [
                ['custrecord_cntm_cso_status', 'anyof', ['1', '3']], 'AND',
                getIdFilter
            ],
            columns: [
                { name: 'internalid', join: 'custrecord_cntm_work_order', summary: 'GROUP', sort: 'ASC' },
                { name: 'internalid', summary: 'MIN' }
            ]
        }).run() ).map(res => {
            return res.getValue(res.columns[1]);
        });
        
        return { sequence, operationIds };
        
    };
    
    const secondPage = context => {
        log.debug('2nd page')
        var { request } = context;
        var params = request.parameters;
        var toUpdate = params.custpage_updated.split(',');
        
        var script = runtime.getCurrentScript();
        var editedFields = script.getParameter('custscript_gwos_editfields_param_v4x');
        
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
            var sequence = request.getSublistValue({
                group,
                name: 'custcol_cr_cntm_seq_no',
                line
            });
            
            var editedId = `${woId}*${sequence}`;
            var woIdIndex = toUpdate.indexOf(editedId);
            if (woIdIndex >= 0) {
                toUpdate.splice(woIdIndex, 1);

				var lotNumbers = request.getSublistValue({
					group,
					name: 'custcol_lotnumbers',
					line
				}) || '';

				editedId += `*${lotNumbers}`;
                
                dataToUpdate[editedId] = {};
                editedFields.split(',').forEach((id) => {
                    var name = 'custcol_' + id.replace(/custbody/gi, 'cb').replace(/custrecord/gi, 'cr');
                    var value = request.getSublistValue({ group, name, line });
                    log.debug('name', name);
                    if (id.match(/comments/g)) { // Concatenate comment fields for multiple line items WO
                        
                        if(value){
                            if (!dataToUpdate[editedId][id]) dataToUpdate[editedId][id] = ''
                            
                            dataToUpdate[editedId][id] += value + '\n'
                        }
                    } else {
                        if(value)
                        dataToUpdate[editedId][id] = value;
                    }
                });
                /*
                // Added by lcc 12/8/2021
                let weekendHrs = parseFloat(request.getSublistValue({ group, line, name: 'custcol_cr_cntm_weekend_hours' })) || 0
                if (line == 0) {
                    log.debug('weekendHrs', sublistdata[line].split('\u0001'))
                }
                if (weekendHrs) {
                    let latest_prjenddate = sublistdata[line].split('\u0001')[8]
                    if (latest_prjenddate) { // Deduct the weekendhrs to latestprojectedenddate
                        //dataToUpdate[woId].custbody_latest_proj_end_date = moment(latest_prjenddate).add('hours', -weekendHrs).format('MM/DD/YYYY hh:mm a')
                    }
                }
                */
            }
            
        }
        
        log.debug('dataToUpdate', dataToUpdate);
        
        for (var id in dataToUpdate){
            var woId = id.split('*')[0];
            var sequence = id.split('*')[1];
			var lotNumbers = (id.split('*')[2] || '').split(', ');

			var filters = [
				['custrecord_cntm_work_order', 'anyof', woId], 'AND',
				['custrecord_cntm_seq_no', 'equalto', sequence], 'AND',
				['custrecord_cntm_cso_status', 'anyof', ['1', '3']]
			];

			if(lotNumbers.length == 1)
				filters.push('AND', ['custrecord_cntm_cso_pannellot', 'is', lotNumbers[0]]);
			else if(lotNumbers.length){
				var xFtr = [];
				lotNumbers.forEach( (x,y)=> {
					if(y)
						xFtr.push('OR');

					xFtr.push(['custrecord_cntm_cso_pannellot', 'is', x]);
				});
				filters.push('AND', xFtr);
			}
log.debug('filters to update', filters);
            
            search.create({
                type: 'customrecord_cntm_clientappsublist',
                filters
            }).run().getRange(0,1000).forEach(res=>{
log.debug('res.id to update', res.id);
log.debug('values to update', dataToUpdate[id]);
                record.submitFields({
                    type: res.recordType,
                    id: res.id,
                    values: dataToUpdate[id]
                });
            });
            
        }
        
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
        //        log.debug('wosWithCustOperationLines WO ids', ids)
        
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
        //        log.debug('wosWithWOCompletions WO ids', ids)
        
        return ids
    }
    
    const getAllSSResult = (searchResultSet, limit) => {
        //log.debug('limit', limit);
        if(!limit)
        limit = 100000000;
        
        var inc = 0;
        //  log.debug("Limit parameter", limit);
        var result = [];
        
        for (var x = 0; x <= result.length && x < limit; x += 1000) {
            (inc + 1000) > limit ? inc = limit : inc += 1000;
            //    log.debug('range', x + ' - ' + inc);
            result = result.concat(searchResultSet.getRange(x, inc) || []);
        }
        
        //	log.debug('Line 785 result.length:', result.length)
        return result;
    };
    
    const parseFloatOrZero = n => { return parseFloat(n) || 0 }
    
    return {
        onRequest
    };
    
}
);
