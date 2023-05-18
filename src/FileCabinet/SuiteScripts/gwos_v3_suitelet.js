/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/log', 'N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'SuiteScripts/lib/moment.min', 'N/file', 'N/redirect', 'N/url'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{serverWidget} serverWidget
 */
    (log, record, runtime, search, ui, moment, file, redirect, url) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {

            var {request} = scriptContext;
            var params = request.parameters;

            if(!params.custpage_page || params.custpage_page == 1 || params.custpage_page == 'csv'){
                firstPage( scriptContext );
            } else {
                secondPage( scriptContext );
            }
        }

        const firstPage = (scriptContext) => {
            var script = runtime.getCurrentScript();
            var editedFields = script.getParameter('custscript_generalwosched_editedfields');
            log.debug('editedFields', editedFields);

            var paramSearch = {
                search1 : 'customsearch_gwos_v3_pending_operations',
                search2 : 'customsearch_gwos_v3_get_details'
            }

            var {request} = scriptContext;
            var params = request.parameters;

            var form = ui.createForm({
                title: "General WO Schedule V3"
            });

            var filterGroup = form.addFieldGroup({
                id: 'custpage_filtergroup',
                label: 'FILTERS'
            });

            var fields = {};
            var fieldsToCreate = [
                //['fieldId', 'label', 'fieldType', 'source', 'container']
                ['entity', 'Company Name', ui.FieldType.SELECT, null, 'custpage_filtergroup'],
                //['internalid', 'Work Order', ui.FieldType.SELECT, 'workorder', 'custpage_filtergroup'],
                ['workorder', 'Work Order', ui.FieldType.TEXT, null, 'custpage_filtergroup'],
                ['salesorder', 'Sales Order', ui.FieldType.TEXT, null, 'custpage_filtergroup'],
                ['datefrom', 'WO Scheduled Due Date', ui.FieldType.DATE, null, 'custpage_filtergroup'],
                ['dateto', ' ', ui.FieldType.DATE, null, 'custpage_filtergroup'],
                ['department', 'Division', ui.FieldType.SELECT, 'department', 'custpage_filtergroup'],
                ['manufacturingworkcenter', 'Manufacturing Work Center', ui.FieldType.SELECT, null, 'custpage_filtergroup'],
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

            (['updated', 'page', 'duplicated', 'autosort']).forEach((key) => {
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

            // Add Manufacturing Work Center Options
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

            for (var x in fields) {
                fields[x].defaultValue = params[`custpage_${x}`]
            }

            // Add Operation Options
            fields['operation'].addSelectOption({ text: '', value: '' });
            getAllSSResult(search.create({
                type: 'manufacturingoperationtask',
                columns: [{ name: 'name', summary: search.Summary.GROUP }]
            }).run()).forEach(res=>{
                var value = res.getValue( res.columns[0] );

                fields['operation'].addSelectOption({ text: value, value });
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

            var sublist = form.addSublist({
                id: 'custpage_sublist',
                label: `Results`,
                type: ui.SublistType.LIST
            });

            var sublistData = getLowestPendingOperationPerWorkOrder(paramSearch, sublist, params);
            
            sublist = sublistData.sublist;
            var sublistFields = sublistData.sublistfields;
            log.debug("sublistfields",JSON.stringify(sublistFields));

            ([
                'custcol_cc_internalid', 'custcol_cc_outsourced', 'custcol_cc_rda_sales_order_type', 'custcol_cc_formulanumeric',
                //'cb_wo_outsideservice', 'cb_wo_finishtype', 'cb_cntm_tool_number'
            ]).forEach(id=>{
                if(sublistFields[id])
                    sublistFields[id].updateDisplayType({
                        displayType: ui.FieldDisplayType.HIDDEN
                    });
            });

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
            
            var csvTxt = sublistData.csvtxt;

            form.clientScriptModulePath = 'SuiteScripts/se_cs_gwos_v3.js';

            if (params.custpage_page != 'csv')
                scriptContext.response.writePage(form);
            else {
                scriptContext.response.writeFile(file.create({
                    name: 'GeneralWOSchedule.CSV',
                    fileType: file.Type.CSV,
                    contents: csvTxt
                }));
            }
        }

        const createSublistColumns = (sublist, searchResults) => {
            var cols = searchResults[0].columns;
            var csvText = '';
            var sublistFields = {};
            var sublistCols = [];

            cols.forEach(function(col){
                
                var label = col.label;
                var property = col.name;

                if(property == 'custrecord_cntm_work_order'){
                    return;
                }

                //var id = property.replace(/custbody/gi, 'cb').replace(/custrecord/gi, 'cb').replace(/custcol/gi,'cc');
                var id = label.match(/id\[/gi) ? label.match(/id\[.*?\]/gi)[0].replace(/id\[|\]/gi, '') : property.replace(/custbody/gi, 'cc').replace(/CUSTRECORD_CNTM_WORK_ORDER./gi, 'cc_').replace(/custrecord./gi, 'cc_')//.replace(/custcol/gi,'cc');
                if(!id.match(/cc/gi, 'cc')){
                    id = "cc_"+id;
                }
                var type = ui.FieldType.TEXT;
                if (id.match(/wo_priorty|weekendhrs|cnt_board_thickness|cntm_boardpitch/gi))
                    type = ui.FieldType.FLOAT;
                else if (id.match(/sched_due_date/gi))
                    type = ui.FieldType.DATE;
                else if (id.match(/rda_qfactor/gi)) 
                    type = ui.FieldType.PERCENT;
                else if (id.match(/comment/gi)) 
                    type = ui.FieldType.TEXTAREA;

                if(id == 'hiddenfield')
                    return;

                // if(id == 'cc_formulanumeric'){
                //     id = "cc_"+label;
                // }

                log.debug("id", id)
                // ADD SUBLIST FIELDS
                sublistFields[`custcol_${id}`] = sublist.addField({
                    id: `custcol_${id}`,
                    label,
                    type
                });

                sublistCols.push(`custcol_${id}`);
                // Added by jeromemorden | 01/20/22
                if(id.match(/wo_priorty|weekendhrs/gi))
                sublistFields[`custcol_${id}`].updateDisplaySize({
                    height : 60,
                    width : 4
                });
                if(id.match(/wo_sched_due_date/gi))
                sublistFields[`custcol_${id}`].updateDisplaySize({
                    height : 60,
                    width : 8
                });
                // end
                // Added by lcc 1/8/2022
                if (id.match(/quantity|rda_qfactor|qtyoperation|no_of_panel|total_num_cores|boards_per_panel|qty_due/gi)) {
                    sublistFields[`custcol_${id}`].updateDisplaySize({
                        height : 60,
                        width : 6
                    });
                        // sublistFields[id].maxLength = 15
                        //log.debug('Width reduced', { id, label })
                }
                if (id.match(/comments/gi)) {
                    sublistFields[`custcol_${id}`].updateDisplaySize({
                        height : 2,
                        width : 20
                    });
                    // log.debug('Height reduced', { id, label })
                }
                // end
                if (!id.match(/internalid|cb_outsourced|cb_rda_sales_order_type|cc_rda_fab_outsource_house/gi))
                    csvText += `"${label}",`;
            });

            log.debug("sublist cols",sublistCols.toString())

            return {
                csvtxt : csvText,
                sublistfields : sublistFields,
                sublist: sublist
            };
        }

        /**
         * GETS THE FIRST PENDING OPERATION FOR EACH WORK ORDER
         * FROM THE CLIENT APP SUBLIST OPERATION RECORD
         */
        const getLowestPendingOperationPerWorkOrder = (searchParams, sublist, params) => {

            var gwosData = [];
            var operationInternalIds = [];
            var maxResults = 2000;
            var csvTxt = '';

            if(searchParams.hasOwnProperty('search1') && searchParams.hasOwnProperty('search2')){

                var pendingOperationsObj = search.load({
                    id: searchParams.search1//"customsearch_gwos_v3_pending_operations"
                });

                pendingOperationsResults = getAllSSResult(pendingOperationsObj.run(), maxResults);

                pendingOperationsResults.forEach(function(res){
                    var id = res.getValue({name: "internalid", summary: "min"});
                    operationInternalIds.push(id);
                });

                var gwosPendingOperationDetailsObj = search.load({
                    id: searchParams.search2//"customsearch_gwos_v3_get_details"
                });

                if(operationInternalIds && operationInternalIds.length > 0){
                    var filters = gwosPendingOperationDetailsObj.filterExpression;
                    filters.push('and');
                    filters.push(['internalid','anyof',operationInternalIds]);
                    gwosPendingOperationDetailsObj.filterExpression = filters;

                    var gwosPendingOperationDetailsResults = getAllSSResult(gwosPendingOperationDetailsObj.run(), maxResults);

                    var sublistCsvDataObj = createSublistColumns(sublist, gwosPendingOperationDetailsResults);
                    sublist = sublistCsvDataObj.sublist;
                    sublistData = sublistCsvDataObj.sublistfields;
                    //log.debug("sublistData",JSON.stringify(sublistData));
                    csvTxt = sublistCsvDataObj.csvtxt

                    if(gwosPendingOperationDetailsResults && gwosPendingOperationDetailsResults.length > 0){
                        var lineNo = 0;
                        gwosPendingOperationDetailsResults.forEach(function(res){
                            var allValues = res.getAllValues();
                            var woId = '';
                            var obj = {};
                            csvTxt += '\n';
                            Object.keys(allValues).forEach(function(property){
                                woId = allValues['custrecord_cntm_work_order'][0].value
                                if(property == 'custrecord_cntm_work_order'){
                                    return;
                                }
                                var formatPropertyName = property.replace(/CUSTRECORD_CNTM_WORK_ORDER.custbody/gi, 'custcol_cc').replace(/CUSTRECORD_CNTM_WORK_ORDER./gi, 'custcol_cc_').replace(/custrecord./gi, 'custcol_cc_')//.replace(/custcol/gi,'cc');
                                var value = '';

                                try{
                                    if(typeof allValues[property] == ('string' || 'boolean') && allValues[property]){
                                        if(params.custapge_page != 'csv'){
                                            value = allValues[property]
                                        }else{
                                            if(allValues[property]){
                                                value = 'Yes'
                                            }else{
                                                value ='No'
                                            }
                                        }
                                    }else if(typeof allValues[property] == 'object' && allValues[property]){
                                        if(allValues[property] != ''){
                                            value = allValues[property][0].text || allValues[property][0].value
                                        }
                                    }else{
                                        value = allValues[property]
                                    }

                                    obj[formatPropertyName] = value;
                                    
                                    if(value){
                                        if (formatPropertyName == 'custcol_cc_tranid'){
                                            if(params.custpage_page != 'csv'){
                                                value = `<a href="/app/accounting/transactions/workord.nl?id=${woId}" target="_blank">${value}</a>`
                                            }
                                        }
                                            
                                        if(formatPropertyName.match(/fill_run_hrs|pth_run_hrs/gi))
                                            value = value? Math.round(parseFloat(value) * 100)/100 : value;

                                        if (typeof value == 'string')
                                            value = value.replace(/sales order #|work order #/gi, '');

                                        if(formatPropertyName.match(/cnt_created_fm_so/gi)){
                                            if(params.custpage_page != 'csv'){
                                                value = `<a href="/app/accounting/transactions/salesord.nl?id=${allValues[property][0].value}" target="_blank">${value}</a>`
                                            }
                                        }
                                        //log.debug("id "+lineNo,formatPropertyName)

                                        sublist.setSublistValue({
                                            id: formatPropertyName,
                                            line: lineNo,
                                            value: value
                                        });
                                    }else{
                                        value = " ";
                                    }

                                    if (!formatPropertyName.match(/internalid|_outsourced|_rda_sales_order_type|_rda_fab_outsource_house|woprio1|woprio2/gi)){
                                        csvTxt += `"${value || ''}",`
                                    }
                                        

                                }catch(error){
                                    log.debug("ERROR GETTING DATA FROM SAVED SEARCH "+typeof allValues[property] + " -"+allValues[property]+"-" ,"WO ID: " + allValues['CUSTRECORD_CNTM_WORK_ORDER.tranid'] + " / OPERATION: "+ allValues['custrecord_cntm_cso_operaton'] +" / FIELD ID: "+ property)
                                }
                            }) // end for each iterate each column from each result object
                            lineNo++;
                            gwosData.push(obj);
                        })// end for each iterate each result object
                    }// end if check gwosPendingOperationDetailResults > 0
                } // end if operationInternalIds.length > 0 get all details
            } // end if params search 1 and search 2

            //log.debug("gwosData",JSON.stringify(gwosData));
            return {
                sublistdata: sublist, // sublist obj contains columns created and values
                gwosdataobj: gwosData, // for debugging purposes
                csvtxt: csvTxt,
                sublistfields: sublistData
            }
        }

        const getAllSSResult = (searchResultSet, limit) => {
            //log.debug('limit', limit);
            if(!limit)
                limit = 100000000;
        
            var inc = 0;
            //log.debug("Limit parameter", limit);
            var result = [];
            for(var x=0;x<=result.length && x < limit;x+=1000){
                (inc+1000)>limit? inc = limit: inc += 1000;
                //log.debug('range', x + ' - ' + inc);
                result = result.concat(searchResultSet.getRange(x,inc)||[]);
            }
            //log.debug('Line getAllResults.length:', result.length)
            return result;
        };

        return {onRequest}

    });
