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
         var searchId = script.getParameter('custscript_generalwosched_search');
         var editedFields = script.getParameter('custscript_generalwosched_editedfields');
         log.debug('editedFields', editedFields);

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
         fieldsToCreate.forEach((fld) => {
             fields[fld[0]] = form.addField({
                 id: `custpage_${fld[0]}`,
                 label: fld[1],
                 type: fld[2],
                 source: fld[3],
                 container: fld[4]
             });
         });

         (['updated', 'page', 'duplicated']).forEach((key) => {
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

         // Sticky department
         if (request.method == 'GET') {
             var userId = runtime.getCurrentUser().id;
             var divisionSelected = search.lookupFields({
                 type: 'employee',
                 id: userId,
                 columns: ['custentity_editworkordersl_division']
             }).custentity_editworkordersl_division;

             divisionSelected = divisionSelected.length ? divisionSelected[0].value : null;

             fields.department.defaultValue = divisionSelected;

         } else {
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
         if (date >= case1 && date < case2) {} else if (date >= case3 && date < case1) {} else if (date >= case2 || date < case3) {}


         //			if(params.custpage_page || request.method == 'POST'){
         var woIds = [];
         var duplicateIds = [];
         var csvText = '';
         var searchResults = ((ssId, par) => {
             var ss = search.load({
                 id: ssId
             });
             ([
                 'workorder.entity', 'workorder.internalid', 'workorder.department', 'manufacturingworkcenter'
             ]).forEach((name) => {
                 var key = name.split(/[^a-z]/gi);
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

             if (par.custpage_datefrom && par.custpage_dateto) {
                 ss.filters.push(search.createFilter({
                     name: 'custbody_rda_wo_sched_due_date',
                     join: 'workorder',
                     operator: search.Operator.WITHIN,
                     values: [par.custpage_datefrom, par.custpage_dateto]
                 }));
             } else if (par.custpage_datefrom) {
                 ss.filters.push(search.createFilter({
                     name: 'custbody_rda_wo_sched_due_date',
                     join: 'workorder',
                     operator: search.Operator.ONORAFTER,
                     values: par.custpage_datefrom
                 }));
             } else if (par.custpage_dateto) {
                 ss.filters.push(search.createFilter({
                     name: 'custbody_rda_wo_sched_due_date',
                     join: 'workorder',
                     operator: search.Operator.ONORBEFORE,
                     values: par.custpage_dateto
                 }));
             }

             if (par.custpage_toolnumber)
                 ss.filters.push(search.createFilter({
                     name: 'custbody_cntm_tool_number',
                     join: 'workorder',
                     operator: search.Operator.ANYOF,
                     values: par.custpage_toolnumber
                 }));

             log.debug('ss.filterExpression', ss.filters);

             return getAllSSResult(ss.run());
         })(searchId, params);

         var sublistFields = {};

         var sublist = form.addSublist({
            id: 'custpage_sublist',
            label: `Results`,
            type: ui.SublistType.LIST
        });

        if (searchResults.length) {
            // Added by lcc 12/8/2021
            let wosWithCustOperations = wosWithCustOperationLines(searchResults.map(m => m.getValue(m.columns[0])))
            // let wosWithWOCs = wosWithWOCompletions(searchResults.map(m => m.getValue(m.columns[0])))
            // Exclude workorders with no custom operation lines
            searchResults = searchResults.filter(f => wosWithCustOperations.indexOf(f.getValue(f.columns[0])) > -1)
            // Exclude workorders with no WOCs
            // searchResults = searchResults.filter(f => wosWithWOCs.indexOf(f.getValue(f.columns[0])) > -1)
            // -------------------------
            if (searchResults.length) {
                searchResults[0].columns.forEach((col, i) => {
                    var label = col.label;
                    var id = label.match(/id\[/gi) ? label.match(/id\[.*?\]/gi)[0].replace(/id\[|\]/gi, '') :
                        col.name.replace(/custbody/gi, 'cb');
                    label = label.match(/id\[|\]/gi) ? label.replace(/id\[.*?\]/gi, '').trim() : label;
                    var type = ui.FieldType.TEXT;
                    if (id.match(/wo_priorty|weekendhrs/gi))
                       type = ui.FieldType.FLOAT;
                    else if (id.match(/sched_due_date/gi))
                        type = ui.FieldType.DATE;
                    else if (id.match(/rda_qfactor/gi)) 
                        type = ui.FieldType.PERCENT;
                    else if (id.match(/comment/gi)) 
                        type = ui.FieldType.TEXTAREA;
                    
                    // ADD SUBLIST FIELDS
                    sublistFields[id] = sublist.addField({
                        id: `custcol_${id}`,
                        label,
                        type
                    });
                    // Added by lcc 1/8/2022
                    if (id.match(/wo_priorty|weekendhrs|quantity|rda_qfactor|qtyoperation|no_of_panel|total_num_cores|boards_per_panel|qty_due/gi)) {
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
                    if (!id.match(/internalid/gi))
                        csvText += `"${label}",`;
                });
                log.debug('sublistFields', sublistFields)

                // file.create({
                //     name: 'sublistFields.txt',
                //     fileType: file.Type.PLAINTEXT,
                //     contents: JSON.stringify(sublistFields),
                //     folder: -15
                // }).save()
   
                if (!sublistFields['internalid'])
                    sublistFields['internalid'] = sublist.addField({
                        id: 'custcol_internalid',
                        label: 'Internal ID',
                        type: ui.FieldType.TEXT
                    });
   
                sublistFields['internalid'].updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                });
   
                // Input fields
                editedFields.split(',').forEach((fieldId) => {
                    fieldId = fieldId.replace(/custbody/gi, 'cb');
                    if (sublistFields[fieldId])
                        sublistFields[fieldId].updateDisplayType({
                            displayType: ui.FieldDisplayType.ENTRY
                        });
                });
   
                searchResults.forEach((res, line) => {
                    var { columns } = res;
                   //  if (line == 0) log.debug('COLUMNZ', columns)
                    var woId = res.getValue(columns[0]);
   
                    if (woIds.indexOf(woId) < 0)
                        woIds.push(woId);
                    else if (duplicateIds.indexOf(woId) < 0)
                        duplicateIds.push(woId);
   
                    csvText += '\n';
   
                    columns.forEach((col) => {
                        var label = col.label;
                        var id = 'custcol_' + (label.match(/id\[/gi) ? label.match(/id\[.*?\]/gi)[0].replace(/id\[|\]/gi, '') :
                            col.name.replace(/custbody/gi, 'cb'));
                       let value = res.getText(col) || res.getValue(col) || null
                       if (id == 'custcol_workorder') 
                           value = `<a href="/app/accounting/transactions/workord.nl?id=${res.getValue({ name: 'internalid', join: 'workOrder' })}" target="_blank">${res.getValue('workorder')}</a>`
                       
                        sublist.setSublistValue({
                            id,
                            line,
                            value
                        });
                        if (!id.match(/internalid/gi))
                            csvText += `"${res.getText(col) || res.getValue(col) || ''}",`;
                    });
                });
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
         form.addButton({
             id: 'custpage_btnautosort',
             label: 'Auto Sort',
             functionName: ''
         });

         var csvUrl = url.resolveScript({
             scriptId: script.id,
             deploymentId: script.deploymentId
         });
         for (var x in params) {
             if (!x.match(/custpage_/gi) || !params[x] || x.match(/sublist|display|duplicated|updated|_page/gi))
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
         var editedFields = script.getParameter('custscript_generalwosched_editedfields');

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
                    if (id.match(/comments/g)) { // Concatenate comment fields for multiple line items WO
                        if (!dataToUpdate[woId][id]) dataToUpdate[woId][id] = ''
                        dataToUpdate[woId][id] += request.getSublistValue({
                            group,
                            name,
                            line
                        }) + '\n'
                    } else {
                        dataToUpdate[woId][id] = request.getSublistValue({
                            group,
                            name,
                            line
                        });
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
                        dataToUpdate[woId].custbody_latest_proj_end_date = moment(latest_prjenddate).add('hours', -weekendHrs).format('MM/DD/YYYY hh:mm a')
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
