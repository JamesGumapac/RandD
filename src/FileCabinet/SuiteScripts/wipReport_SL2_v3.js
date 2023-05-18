/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @NAuthor Brian Brown
 * @NStartDate Mar 8, 2021
 */
define(['N', 'N/search', 'N/record', 'N/runtime', 'N/ui/serverWidget', 'N/url', 'N/format'],

    function (N, search, record, runtime, ui, url, format) {

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        const onRequest = context => {
            const { request, response } = context;
            try {
                var params = request.parameters;
                log.debug('request.parameters is:', request.parameters);
                const pageVar = params.custparam_page ? params.custparam_page : 1;
                var endDateInput = params.custparam_enddate ? new Date(params.custparam_enddate) : '';
                var endTimeInput = params.custparam_endtime ? new Date(params.custparam_endtime) : '';
                log.debug('endDateInput / endTimeInput is:', endDateInput + ' / ' + endTimeInput);

                var soFilterValue = params.custparam_sofilter ? params.custparam_sofilter.match("[0-9]+") : '';   //  .match("[0-9]+")
                var woFilterValue = params.custparam_wofilter ? params.custparam_wofilter.match("[0-9]+") : '';   //  .match("[0-9]+")
                var divisionFilterValue = params.custparam_divfilter ? params.custparam_divfilter : '';
                var mode = params.custparam_mode || '';
                log.error('soFilterValue / woFilterValue / divisionFilterValue is:', soFilterValue + ' / ' + woFilterValue + ' / ' + divisionFilterValue);

                if (params.csv == 'T') {
                    var exportParams = {
                        user: runtime.getCurrentUser().id,
                        endDate: params.custparam_enddate,
                        soFilterValue: soFilterValue,
                        woFilterValue: woFilterValue,
                        divisionFilterValue: divisionFilterValue,
                        mode: mode
                    };
                    N.task.create({
                        taskType: N.task.TaskType.MAP_REDUCE,
                        scriptId: 'customscript_wip_report_export_csv',
                        params: {
                            custscript_wip_report_export_csv_params: JSON.stringify(exportParams)
                        }
                    }).submit();

                    var form = ui.createForm({
                        title: 'Report will be emailed to you shortly. Thank you.'
                    });
                    response.writePage(form);
                    return true;

                }


                if (!params.custparam_page || params.custparam_page == 1) {

                    buildSuitelet(context, pageVar, endDateInput, endTimeInput, soFilterValue, woFilterValue, divisionFilterValue, mode);
                    log.debug('Executing Level 1');
                    var sublistTitle = 'Level 1';

                } else if (params.custparam_page == 2) {

                    buildSuitelet(context, pageVar, endDateInput, endTimeInput, soFilterValue, woFilterValue, divisionFilterValue, mode);
                    var sublistTitle = 'Level 2';

                } else if (params.custparam_page == 3) {

                    buildSuitelet(context, pageVar, endDateInput, endTimeInput, soFilterValue, woFilterValue, divisionFilterValue, mode);
                    var sublistTitle = 'Level 3';
                }
                else if (params.custparam_page == 4) {

                    buildSuitelet(context, pageVar, endDateInput, endTimeInput, soFilterValue, woFilterValue, divisionFilterValue, mode);
                    var sublistTitle = 'Level 4';
                }
            } catch (e) {
                log.error("ERROR", e);
            }
        }


        ///////////////BUILD SUITELET FUNCTION///////////////
        const buildSuitelet = (context, pagevar, enddateinput, endtimeinput, sofiltervalue, wofiltervalue, divfiltervalue, mode) => {

            var { request, response } = context;
            var script = runtime.getCurrentScript();
            var levelOneSearch = script.getParameter('custscript_level_one_search_v2'); // customsearch_wip_levelone
            var levelTwoSearch = script.getParameter('custscript_level_two_search_v2'); // customsearch_wip_leveltwo
            var levelThreeSearch = script.getParameter('custscript_level_three_search_v2'); // customsearch_wip_lvltwo_3_3_3
            var levelThreeMatCostSearch = script.getParameter('custscript_level_3_search_v2_mat_cost'); // customsearch_wip_lvltwo_2_3
            var levelFourItemCostSearch = script.getParameter('custscript_level_4_search_v2_itm_cost'); // customsearch_wip_item_cost_lvl4
            var levelFourSearch = script.getParameter('custscript_level_four_search_v2'); // customsearch_wip_levelfour_1

            var wipSearchId = script.getParameter('custscript_wip_master_search');
            var wipReportSearchId = script.getParameter('custscript_purchase_salesitemsearch');

            var params = request.parameters;
            var form = ui.createForm({
                title: 'Multi-Level WIP Report Level ' + pagevar
            });

            //Create header buttons
            form.addButton({
                id: 'custpage_levelone',
                label: 'Level 1',
                functionName: 'resetPageLevelOne()'
            });
            form.addButton({
                id: 'custpage_leveltwo',
                label: 'Level 2',
                functionName: 'resetPageLevelTwo()'
            });
            form.addButton({
                id: 'custpage_levelthird',
                label: 'Level 3',
                functionName: 'resetPageLevelThree()'
            });
            form.addButton({
                id: 'custpage_levelfour',
                label: 'Level 4',
                functionName: 'resetPageLevelFour()'
            });

            // Create sublist
            var sublist = form.addSublist({
                id: 'custpage_sublist',
                label: 'Level ' + pagevar,
                type: ui.SublistType.LIST
            });

            var sublistFields = createSublistFields(sublist, pagevar);


            // Check if first load or level one
            if (pagevar == 1) {
                var sos = []
                var levelOneSearch1 = 'customsearch_wip_report_lvlone_1' // [script] WIP REPORT LEVEL 1 main ** do not delete **
                var levelOneSearch2 = 'customsearch_wip_report_lvlone_2' // [script] WIP REPORT LEVEL 1 details ** do not delete **

                // Load Item Search
                var usedSearch = search.load({
                    id: levelOneSearch
                });

                // Mode filter
                if (mode == 'costing') {
                    log.debug('usedSearch-mode-l1', 'costing');
                    usedSearch.filters.push(search.createFilter({
                        name: 'status',
                        operator: search.Operator.ANYOF,
                        values: ['WorkOrd:H']
                    }));
                } else {
                    // WIP mode
                    log.debug('usedSearch-mode-l1', 'wip');
                    usedSearch.filters.push(search.createFilter({
                        name: 'status',
                        operator: search.Operator.NONEOF,
                        values: ['WorkOrd:H']
                    }));
                }

                var searchFilters = usedSearch.filters;
                //add date filter if necessary
                log.debug('enddateinput is:', enddateinput);
                if (enddateinput) {
                    //WORK ORDER TRANDATE or SALES ORDER TRANDATE??
                    var dateInputFormatted = format.format({ value: enddateinput, type: format.Type.DATE });
                    searchFilters.push(search.createFilter({ name: 'trandate', operator: 'onorbefore', values: dateInputFormatted }));
                }
                if (sofiltervalue && sofiltervalue != '' && sofiltervalue != 'undefined' && sofiltervalue != null) {
                    log.debug('Level 2: sofiltervalue is:', sofiltervalue);
                    searchFilters.push(search.createFilter({ name: 'number', join: 'custbody_cnt_created_fm_so', operator: search.Operator.EQUALTO, values: sofiltervalue }))
                }
                getAllSSResult(usedSearch.run()).forEach(function (res, line) {
                    // log.debug('res is:', res)
                    var cols = res.columns;
                    sos.push({
                        id: res.getValue({
                            name: "entity",
                            join: "CUSTBODY_CNT_CREATED_FM_SO",
                            summary: "GROUP"
                        }),
                        customer: res.getValue({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "{custbody_cnt_created_fm_so.entity}"
                        }),
                        sonumber: res.getValue(cols[1]),
                        sodate: res.getValue({
                            name: "trandate",
                            join: "CUSTBODY_CNT_CREATED_FM_SO",
                            summary: "GROUP"
                        }),
                        soamount: res.getValue({
                            name: "amount",
                            join: "CUSTBODY_CNT_CREATED_FM_SO",
                            summary: "MAX"
                        }),
                        totalwocosts: 0,
                        woids: []
                    })
                });
                var soids = [];
                // var soids = sos.map(m => m.id)
                // log.debug('soids', soids)

                // ============== [START SEARCH MAIN] ==============
                var usedSearch1 = search.load({
                    id: levelOneSearch1
                });

                // Mode filter
                if (mode == 'costing') {
                    log.debug('usedSearch1-mode-l1', 'costing');
                    usedSearch1.filters.push(search.createFilter({
                        name: 'status',
                        operator: search.Operator.ANYOF,
                        values: ['WorkOrd:H']
                    }));
                } else {
                    // WIP mode
                    log.debug('usedSearch1-mode-l1', 'wip');
                    usedSearch1.filters.push(search.createFilter({
                        name: 'status',
                        operator: search.Operator.NONEOF,
                        values: ['WorkOrd:H']
                    }));
                }

                var searchFilters = usedSearch1.filters;
                //add date filter if necessary
                log.debug('enddateinput is:', enddateinput);
                if (enddateinput) {
                    //WORK ORDER TRANDATE or SALES ORDER TRANDATE??
                    var dateInputFormatted = format.format({ value: enddateinput, type: format.Type.DATE });
                    searchFilters.push(search.createFilter({ name: 'trandate', operator: 'onorbefore', values: dateInputFormatted }));
                }
                if (sofiltervalue && sofiltervalue != '' && sofiltervalue != 'undefined' && sofiltervalue != null) {
                    log.debug('Level 2: sofiltervalue is:', sofiltervalue);
                    searchFilters.push(search.createFilter({ name: 'number', join: 'custbody_cnt_created_fm_so', operator: search.Operator.EQUALTO, values: sofiltervalue }))
                }

                var xFilters = usedSearch1.filterExpression
                xFilters.push('AND')
                xFilters.push(["custbody_cnt_created_fm_so", "anyof", soids])
                if (soids.length > 0) {
                    usedSearch1.filterExpression = xFilters
                }
                var woids = []
                var newsos = [];
                getFirstThreeThousandSSResult(usedSearch1.run()).forEach(function (res, line) {
                    var cols = res.columns;
                    let soid = res.getValue(cols[5])
                    let woid = res.getValue(cols[4])
                    let customer = res.getText(cols[0]);
                    let solink = res.getValue(cols[1]);
                    let sodate = res.getValue(cols[2]);
                    let soamt = res.getValue(cols[3]);
                    let totalwocosts = 0;
                    woids.push(woid);
                    // log.debug("woid ss1",soid);
                    let idx = newsos.findIndex(fi => fi.id == soid)
                    if (idx > -1) {
                        newsos[idx].woids.push(woid)
                    } else {
                        newsos.push({
                            id: soid,
                            customer: customer,
                            sonumber: solink,
                            sodate: sodate,
                            soamount: soamt,
                            totalwocosts: totalwocosts,
                            woids: [woid],
                        })
                    }

                });
                // log.debug("sos",JSON.stringify(sos));
                // for (so of sos) 
                //     woids = woids.concat(so.woids)

                // log.debug('test', sos.filter(f => f.id == 1396914))
                // ============== [END SEARCH MAIN] ==============

                // ============== [START SEARCH DETAILS] ==============
                var usedSearch2 = search.load({
                    id: levelOneSearch2
                });

                // Mode filter
                if (mode == 'costing') {
                    log.debug('usedSearch2-mode', 'costing');
                    usedSearch2.filters.push(search.createFilter({
                        name: 'status',
                        join: 'createdfrom',
                        operator: search.Operator.ANYOF,
                        values: ['WorkOrd:H']
                    }));
                } else {
                    // WIP mode
                    log.debug('usedSearch2-mode', 'wip');
                    usedSearch2.filters.push(search.createFilter({
                        name: 'status',
                        join: 'createdfrom',
                        operator: search.Operator.NONEOF,
                        values: ['WorkOrd:H']
                    }));
                }

                // log.debug("woids",woids.toString());
                if (woids.length > 0) {
                    usedSearch2.filters.push(search.createFilter({
                        name: 'createdfrom',
                        operator: 'anyof',
                        values: woids,
                    }))
                }

                getAllSSResult(usedSearch2.run()).forEach(function (res, line) {
                    var cols = res.columns;
                    let woid = res.getValue(cols[2])
                    let amountCredit = parseFloat(res.getValue({
                        name: "creditamount",
                        summary: "SUM"
                    })) || 0;
                    //log.debug("amountCredit",amountCredit)
                    let idx = newsos.findIndex(fi => fi.woids.indexOf(woid) > -1)
                    // log.debug("idx",idx);
                    if (idx > -1)
                        newsos[idx].totalwocosts += amountCredit
                    // log.debug("totalwocosts", newsos[idx].totalwocosts)
                    if (idx > -1 && newsos[idx].id == 1396914) {
                        log.debug('test12345', { obj: newsos[idx], amountCredit })
                    }
                });

                // ============== [END SEARCH DETAILS] ==============

                newsos.forEach(function (res, line) {
                    sublist.setSublistValue({
                        id: 'custcol_customer',
                        line: line,
                        value: res.customer
                    });
                    sublist.setSublistValue({
                        id: 'custcol_sonumber',
                        line: line,
                        value: res.sonumber
                    });
                    sublist.setSublistValue({
                        id: 'custcol_sodate',
                        line: line,
                        value: res.sodate
                    });
                    sublist.setSublistValue({
                        id: 'custcol_soamount',
                        line: line,
                        value: res.soamount ? '$' + addCommas(parseFloat(res.soamount).toFixed(2)) : '$0.00'
                    });
                    sublist.setSublistValue({
                        id: 'custcol_totalwocosts',
                        line: line,
                        value: res.totalwocosts ? '$' + addCommas(parseFloat(res.totalwocosts).toFixed(2)) : '$0.00'
                    });

                    //calculate GROSS MARGIN ---  (custcol_soamount - custcol_totalwocosts) / custcol_soamount * 100
                    // (REVENUE - COSTS)  / REVENUE * 100
                    var grossMargin = 0;
                    if (Number(res.soamount) > 0) {
                        grossMargin = ((Number(res.soamount) - Number(res.totalwocosts)) / Number(res.soamount)) * 100;
                    }
                    //var grossMargin = ((Number(res.soamount) - Number(res.totalwocosts)) / Number(res.soamount)) * 100;

                    sublist.setSublistValue({
                        id: 'custcol_grossmargin',
                        line: line,
                        value: grossMargin ? grossMargin.toFixed(2) + '%' : '100.00%'
                    });
                })
            }
            //LEVEL TWO
            // Updated by lc 04212022 as per request
            if (pagevar == 2) {
                var wos = []
                var levelTwoSearch1 = 'customsearch_wip_lvltwo_1' // [SCRIPT] WIP REPORT Level 2 MAIN LINE ** DO NOT DELETE**
                var levelTwoSearch2 = 'customsearch_wip_lvltwo_2' // [SCRIPT] WIP REPORT Level 2 - MATERIAL COST **DO NOT DELETE **
                var levelTwoSearch3 = 'customsearch_wip_lvltwo_3' // [SCRIPT] WIP REPORT Level 2 LABOR/OH/PM ** DO NOT DELETE **

                // ============== [START SEARCH 1] ==============
                var usedSearch1 = search.load({
                    id: levelTwoSearch1
                });

                // Mode filter
                if (mode == 'costing') {
                    log.debug('usedSearch1-mode-l2', 'costing');
                    usedSearch1.filters.push(search.createFilter({
                        name: 'status',
                        operator: search.Operator.ANYOF,
                        values: ['WorkOrd:H']
                    }));
                } else {
                    // WIP mode
                    log.debug('usedSearch1-mode-l2', 'wip');
                    usedSearch1.filters.push(search.createFilter({
                        name: 'status',
                        operator: search.Operator.NONEOF,
                        values: ['WorkOrd:H']
                    }));
                }

                var searchFilters = usedSearch1.filters;
                //add date filter if necessary

                if (enddateinput) {
                    //WORK ORDER TRANDATE or SALES ORDER TRANDATE??
                    log.debug('Level 2: enddateinput is:', enddateinput);
                    var dateInputFormatted = format.format({
                        value: enddateinput,
                        type: format.Type.DATE
                    });
                    searchFilters.push(search.createFilter({
                        name: 'trandate',
                        operator: 'onorbefore',
                        values: dateInputFormatted
                    }));
                }
                if (sofiltervalue && sofiltervalue != '' && sofiltervalue != 'undefined' && sofiltervalue != null) {
                    log.debug('Level 2: sofiltervalue is:', sofiltervalue);
                    searchFilters.push(search.createFilter({
                        name: 'number',
                        join: 'custbody_cnt_created_fm_so',
                        operator: search.Operator.EQUALTO,
                        values: sofiltervalue
                    }))
                }
                if (wofiltervalue && wofiltervalue != '' && wofiltervalue != 'undefined' && wofiltervalue != null) {
                    log.debug('Level 2: wofiltervalue is:', wofiltervalue);
                    searchFilters.push(search.createFilter({
                        name: 'number',
                        operator: search.Operator.EQUALTO,
                        values: wofiltervalue
                    }))
                }
                if (divfiltervalue && divfiltervalue != 0 && divfiltervalue != '' && divfiltervalue != 'undefined' && divfiltervalue != null) {
                    log.debug('Level 2: divfiltervalue is:', divfiltervalue);
                    searchFilters.push(search.createFilter({
                        name: 'department',
                        operator: search.Operator.ANYOF,
                        values: divfiltervalue
                    }))
                }

                wos = getFirstThreeThousandSSResult(usedSearch1.run()).map(m => ({
                    customer: { txt: m.getText(m.columns[0]) || ' ', id: m.getValue(m.columns[0]) || ' ' },
                    so: { txt: (m.getText(m.columns[1]) || ' ').replace(/sales order #/gi, ''), id: m.getValue(m.columns[1]) },
                    wo: { txt: m.getValue(m.columns[2]) || ' ', id: Number(m.id) },
                    outsource: m.getText(m.columns[3]) || m.getValue(m.columns[3]) || ' ',
                    division: { txt: m.getText(m.columns[4]) || ' ', id: m.getValue(m.columns[4]) },
                    wostatus: m.getText(m.columns[5]) || m.getValue(m.columns[5]) || ' ',
                    materialcost: 0,
                    laborcost: 0,
                    oh: 0,
                    goldcost: 0,
                    enepig_gold: 0,
                    enepig_palladium: 0,
                    extracost: 0,
                    totalcost: 0,
                }))
                // ============== [END SEARCH 1] ==============
                // ============== [START SEARCH 2] ==============
                // Search WO's WOCs
                let woIds = wos.map(m => m.wo.id)
                /* let woIdsWithWOCs = wosWithWOCompletions(woIds)
                // Exclude workorders with no WOCs
                wos = wos.filter(f => woIdsWithWOCs.indexOf(f.wo.id) > -1)
                woIds = woIdsWithWOCs */

                // log.debug('Start search 2', { woIds })

                var usedSearch2 = search.load({
                    id: levelTwoSearch2
                });

                // Mode filter
                if (mode == 'costing') {
                    log.debug('usedSearch2-mode-l2', 'costing');
                    usedSearch2.filters.push(search.createFilter({
                        name: 'status',
                        join: 'createdfrom',
                        operator: search.Operator.ANYOF,
                        values: ['WorkOrd:H']
                    }));
                } else {
                    // WIP mode
                    log.debug('usedSearch2-mode-l2', 'wip');
                    usedSearch2.filters.push(search.createFilter({
                        name: 'status',
                        join: 'createdfrom',
                        operator: search.Operator.NONEOF,
                        values: ['WorkOrd:H']
                    }));
                }

                if (woIds.length) {
                    usedSearch2.filters.push(search.createFilter({
                        name: 'createdfrom',
                        operator: search.Operator.ANYOF,
                        values: woIds
                    }));
                    getAllSSResult(usedSearch2.run()).forEach(res => {
                        let woId = res.getValue({ name: 'createdfrom', summary: 'GROUP' })
                        let idx = wos.findIndex(fi => fi.wo.id == woId)
                        if (idx > -1)
                            wos[idx].materialcost += parseFloat(res.getValue(res.columns[6]))
                    })
                }
                // ============== [END SEARCH 2] ==============
                // ============== [START SEARCH 3] ==============
                log.debug('Start search 3')
                var usedSearch3 = search.load({
                    id: levelTwoSearch3
                });

                // Mode filter
                if (mode == 'costing') {
                    log.debug('usedSearch3-mode-l2', 'costing');
                    usedSearch3.filters.push(search.createFilter({
                        name: 'status',
                        join: 'createdfrom',
                        operator: search.Operator.ANYOF,
                        values: ['WorkOrd:H']
                    }));
                } else {
                    // WIP mode
                    log.debug('usedSearch3-mode-l2', 'wip');
                    usedSearch3.filters.push(search.createFilter({
                        name: 'status',
                        join: 'createdfrom',
                        operator: search.Operator.NONEOF,
                        values: ['WorkOrd:H']
                    }));
                }

                if (woIds.length) {
                    usedSearch3.filters.push(search.createFilter({
                        name: 'createdfrom',
                        operator: search.Operator.ANYOF,
                        values: woIds
                    }));
                    getAllSSResult(usedSearch3.run()).forEach(res => {
                        let woId = res.getValue({ name: 'createdfrom', summary: 'GROUP' })
                        let idx = wos.findIndex(fi => fi.wo.id == woId)
                        if (idx > -1) {
                            wos[idx].laborcost += parseFloat(res.getValue(res.columns[6]))
                            wos[idx].oh += parseFloat(res.getValue(res.columns[7]))
                            wos[idx].goldcost += parseFloat(res.getValue(res.columns[8]))
                            wos[idx].enepig_gold += parseFloat(res.getValue(res.columns[9]))
                            wos[idx].enepig_palladium += parseFloat(res.getValue(res.columns[10]))
                            // wos[idx].extracost += parseFloat(res.getValue(res.columns[11]))
                        }
                    })
                }
                // Compute total cost
                wos = wos.map(m => {
                    m.totalcost = m.materialcost + m.laborcost + m.oh + m.goldcost + m.enepig_gold + m.enepig_palladium /* + m.extracost */
                    return m
                })
                // ============== [END SEARCH 3] ==============

                var _sublist = form.getSublist({
                    id: 'custpage_sublist'
                });
                _sublist.label += ` (${addCommas(wos.length)})`

                wos.forEach(function (res, line) {
                    var soLink = resolveRecordURL('salesorder', res.so.id)
                    var woLink = resolveRecordURL('workorder', res.wo.id)

                    //log.debug('cols is:', cols);
                    sublist.setSublistValue({
                        id: 'custcol_customer',
                        line: line,
                        value: res.customer.txt
                    });
                    sublist.setSublistValue({
                        id: 'custcol_sonumber',
                        line: line,
                        value: '<a href="' + soLink + '"target="_blank">' + res.so.txt + '</a>'
                    });
                    sublist.setSublistValue({
                        id: 'custcol_wonumber',
                        line: line,
                        value: '<a href="' + woLink + '"target="_blank">' + res.wo.txt + '</a>'
                    });
                    sublist.setSublistValue({
                        id: 'custcol_outsource',
                        line: line,
                        value: res.outsource == true ? 'Y' : 'N'
                    });
                    sublist.setSublistValue({
                        id: 'custcol_division',
                        line: line,
                        value: res.division.txt
                    });
                    // sublist.setSublistValue({
                    //     id: 'custcol_wostatus',
                    //     line: line,
                    //     value: res.wostatus.indexOf('A') > -1 ? 'Planned' : res.wostatus.indexOf('B') > -1 ? 'Released' : res.wostatus.indexOf('C') > -1 ? 'Cancelled' :res.wostatus.indexOf('D') > -1 ? 'In Process' : res.wostatus.indexOf('G') > -1 ? 'Built': res.wostatus.indexOf('H') > -1 ? 'Closed' : ' '
                    // });
                    sublist.setSublistValue({
                        id: 'custcol_wostatus',
                        line: line,
                        value: res.wostatus
                    });
                    sublist.setSublistValue({
                        id: 'custcol_materialcost',
                        line: line,
                        value: res.materialcost ? '$' + addCommas(res.materialcost.toFixed(2)) : '$0.00'
                    });
                    sublist.setSublistValue({
                        id: 'custcol_laborcost',
                        line: line,
                        value: res.laborcost ? '$' + addCommas(res.laborcost.toFixed(2)) : '$0.00'
                    });
                    sublist.setSublistValue({
                        id: 'custcol_overheadcost',
                        line: line,
                        value: res.oh ? '$' + addCommas(res.oh.toFixed(2)) : '$0.00'
                    });
                    sublist.setSublistValue({
                        id: 'custcol_goldcost',
                        line: line,
                        value: res.goldcost ? '$' + addCommas(res.goldcost.toFixed(2)) : '$0.00'
                    });
                    sublist.setSublistValue({
                        id: 'custcol_enepiggoldcost',
                        line: line,
                        value: res.enepig_gold ? '$' + addCommas(res.enepig_gold.toFixed(2)) : '$0.00'
                    })
                    sublist.setSublistValue({
                        id: 'custcol_enepigpalladiumcost',
                        line: line,
                        value: res.enepig_palladium ? '$' + addCommas(res.enepig_palladium.toFixed(2)) : '$0.00'
                    });
                    /* sublist.setSublistValue({
                        id: 'custcol_extracost',
                        line: line,
                        value: res.extracost ? '$' + addCommas(res.extracost) : '$0.00'
                    }); */
                    sublist.setSublistValue({
                        id: 'custcol_wototalcost',
                        line: line,
                        value: res.totalcost ? '$' + addCommas(res.totalcost.toFixed(2)) : '$0.00'
                    });
                });
            }
            //LEVEL THREE
            if (pagevar == 3) {
                var level3WOSO = 'customsearch_wip_report_level_3_wo_so';

                // Load Material Cost
                var materialCostSearch = search.load({
                    id: levelThreeMatCostSearch
                });

                // Mode filter
                if (mode == 'costing') {
                    log.debug('materialCostSearch-mode-l3', 'costing');
                    materialCostSearch.filters.push(search.createFilter({
                        name: 'status',
                        join: 'createdfrom',
                        operator: search.Operator.ANYOF,
                        values: ['WorkOrd:H']
                    }));
                } else {
                    // WIP mode
                    log.debug('materialCostSearch-mode-l3', 'wip');
                    materialCostSearch.filters.push(search.createFilter({
                        name: 'status',
                        join: 'createdfrom',
                        operator: search.Operator.NONEOF,
                        values: ['WorkOrd:H']
                    }));
                }

                var matCostArrayOfObjs = [];
                var w = 0;
                getAllSSResult(materialCostSearch.run()).forEach(function (res, line) {
                    var lineObj = {};
                    lineObj.createdFromSODocNum = res.getValue(res.columns[1]);
                    lineObj.createdFromSOId = res.getValue(res.columns[2]);
                    lineObj.division = res.getValue(res.columns[3]);
                    lineObj.woId = res.getValue(res.columns[4]);
                    lineObj.materialCost = res.getValue(res.columns[8]);
                    lineObj.firstOpName = res.getValue(res.columns[9]);

                    matCostArrayOfObjs.push(lineObj);
                    w++;
                });

                // Load WOSO values from saved search
                var level3WOSOSearch = search.load({
                    id: level3WOSO
                });

                // Mode filter
                if (mode == 'costing') {
                    log.debug('level3WOSOSearch-mode-l3', 'costing');
                    level3WOSOSearch.filters.push(search.createFilter({
                        name: 'status',
                        join: 'createdfrom',
                        operator: search.Operator.ANYOF,
                        values: ['WorkOrd:H']
                    }));
                } else {
                    // WIP mode
                    log.debug('level3WOSOSearch-mode-l3', 'wip');
                    level3WOSOSearch.filters.push(search.createFilter({
                        name: 'status',
                        join: 'createdfrom',
                        operator: search.Operator.NONEOF,
                        values: ['WorkOrd:H']
                    }));
                }

                var woSOArrayOfObjs = [];
                var a = 0;
                getAllSSResult(level3WOSOSearch.run()).forEach(function (res, line) {
                    var lineObj = {};
                    lineObj.woId = res.getValue(res.columns[0]);
                    lineObj.soId = res.getValue(res.columns[1]);

                    woSOArrayOfObjs.push(lineObj);
                    a++;
                });

                // Search Gate Times and Operations List
                var gateTimesOperations = search.create({
                    type: 'customrecord_gate_times_and_operations_',
                    filters: [],
                    columns: [
                        search.createColumn({ name: 'name', sort: search.Sort.ASC }),
                        search.createColumn({ name: 'custrecord_work_center_' }),
                        search.createColumn({ name: 'custrecord_wip_setup_' }),
                        search.createColumn({ name: 'custrecord_wip_time_' }),
                        search.createColumn({ name: 'custrecord_rda_is_core' }),
                    ]
                });

                var gateTimesOpsArrayOfObjs = [];
                var y = 0;
                getAllSSResult(gateTimesOperations.run()).forEach(function (res, line) {
                    var lineObj = {};
                    lineObj.id = res.id;
                    lineObj.name = res.getValue({ name: 'name' });
                    lineObj.gateGroup = res.getText({ name: 'custrecord_work_center_' });
                    lineObj.wipSetup = res.getValue({ name: 'custrecord_wip_setup_' });
                    lineObj.wipTime = res.getValue({ name: 'custrecord_wip_time_' });
                    lineObj.isCore = res.getValue({ name: 'custrecord_rda_is_core' });

                    gateTimesOpsArrayOfObjs.push(lineObj);
                    y++;
                });

                // Load Work Order Completion Search
                var usedSearch = search.load({
                    id: levelThreeSearch // customsearch_wip_lvltwo_3_3_3
                });

                // Mode filter
                if (mode == 'costing') {
                    log.debug('usedSearch-mode-l3', 'costing');
                    usedSearch.filters.push(search.createFilter({
                        name: 'status',
                        join: 'createdfrom',
                        operator: search.Operator.ANYOF,
                        values: ['WorkOrd:H']
                    }));
                } else {
                    // WIP mode
                    log.debug('usedSearch-mode-l3', 'wip');
                    usedSearch.filters.push(search.createFilter({
                        name: 'status',
                        join: 'createdfrom',
                        operator: search.Operator.NONEOF,
                        values: ['WorkOrd:H']
                    }));
                }

                var searchFilters = usedSearch.filters;

                //add date filter if necessary
                if (enddateinput) {
                    //WORK ORDER TRANDATE or SALES ORDER TRANDATE??
                    log.debug('Level 3: enddateinput is:', enddateinput);
                    var dateInputFormatted = format.format({ value: enddateinput, type: format.Type.DATE });
                    searchFilters.push(search.createFilter({ name: 'trandate', operator: 'onorbefore', values: dateInputFormatted }));
                }

                if (sofiltervalue && sofiltervalue != '' && sofiltervalue != 'undefined' && sofiltervalue != null) {
                    log.debug('Level 3: sofiltervalue is:', sofiltervalue);
                    var sofilterStr = 'Sales Order #SO' + sofiltervalue;
                    searchFilters.push(search.createFilter({ name: 'number', join: 'custbody_cnt_created_fm_so', operator: search.Operator.EQUALTO, values: sofiltervalue }))
                }

                if (wofiltervalue && wofiltervalue != '' && wofiltervalue != 'undefined' && wofiltervalue != null) {
                    log.debug('Level 2: wofiltervalue is:', wofiltervalue);
                    searchFilters.push(search.createFilter({ name: 'number', join: 'createdfrom', operator: search.Operator.EQUALTO, values: wofiltervalue }))
                }

                if (divfiltervalue && divfiltervalue != 0 && divfiltervalue != '' && divfiltervalue != 'undefined' && divfiltervalue != null) {
                    log.debug('Level 3: divfiltervalue is:', divfiltervalue);
                    searchFilters.push(search.createFilter({ name: 'department', operator: search.Operator.ANYOF, values: divfiltervalue }))
                }

                var woCompLinesArrayOfObjs = [];
                var woIdsLvlThree = []; // 06292022 fix for setup time
                var p = 0;
                getFirstThreeThousandSSResult(usedSearch.run()).forEach(function (res, line) {
                    var lineObj = {};
                    lineObj.createdFromSODocNum = res.getValue(res.columns[0]);
                    lineObj.createdFromWODocNum = res.getText(res.columns[1]);
                    lineObj.createdFromWOId = res.getValue(res.columns[1]);
                    // lineObj.operation = res.getValue(res.columns[1]);
                    lineObj.operationName = res.getValue(res.columns[2]);
                    lineObj.division = res.getText(res.columns[3]);
                    lineObj.laborCost = res.getValue(res.columns[4]);
                    lineObj.overHeadCost = res.getValue(res.columns[5]);
                    lineObj.goldCost = res.getValue(res.columns[6]);
                    lineObj.enepigGoldCost = res.getValue(res.columns[7]);
                    lineObj.enepigPalladiumCost = res.getValue(res.columns[8]);
                    // lineObj.extraCost = res.getValue(res.columns[11]);
                    lineObj.quantity = res.getValue(res.columns[10]);
                    lineObj.boardsPerPanel = res.getValue(res.columns[11]);
                    lineObj.panelsPerCore = res.getValue(res.columns[12]);
                    lineObj.totalNumCores = res.getValue(res.columns[13]);
                    woIdsLvlThree.push(lineObj.createdFromWOId);
                    woCompLinesArrayOfObjs.push(lineObj);
                    p++;
                });


                // insert here start
                if (woIdsLvlThree.length > 0) {
                    var setupTimeCompletedQtyObj = search.create({
                        type: "manufacturingoperationtask",
                        filters:
                            [
                                ["workorder", "anyof", woIdsLvlThree],
                                //    "AND", 
                                //    ["completedquantity","greaterthan","0"]
                            ],
                        columns:
                            [
                                "workorder",
                                "name",
                                "sequence",
                                "completedquantity",
                                search.createColumn({
                                    name: "internalid",
                                    join: "workOrder"
                                })
                            ]
                    });
                    //var setupTimeCompletedQtyObjCount = setupTimeCompletedQtyObj.runPaged().count;

                    var setupTimeCompletedQty = {};
                    var zz = 0;
                    getAllSSResult(setupTimeCompletedQtyObj.run()).forEach(function (res, line) {
                        var lineObj = {};
                        lineObj.woId = res.getValue({ name: 'internalid', join: "workOrder" });
                        lineObj.name = res.getValue({ name: 'name' });
                        lineObj.completedqty = Number(res.getValue({ name: 'completedquantity' })) || 1;

                        if (!setupTimeCompletedQty.hasOwnProperty(lineObj.woId)) {
                            setupTimeCompletedQty[lineObj.woId] = {};
                        }

                        setupTimeCompletedQty[lineObj.woId][lineObj.name] = lineObj.completedqty;
                        zz++;
                    });

                    //log.debug("setupTimeCompletedQty",JSON.stringify(setupTimeCompletedQty));
                    //log.debug("woIdsLvlthree",woIdsLvlThree.toString())
                    var wipLevelThreeSetup = search.create({
                        type: "workorder",
                        filters:
                            [
                                ["type", "anyof", "WorkOrd"],
                                "AND",
                                ["custbody_wip_operations", "isnotempty", ""],
                                "AND",
                                ["mainline", "is", "T"],
                                "AND",
                                ["internalid", "anyof", woIdsLvlThree],
                            ],
                        columns:
                            [
                                "custbody_wip_operations",
                                "internalid"
                            ]
                    });
                    var searchResultCount = wipLevelThreeSetup.runPaged().count;
                    log.debug("workorderSearchObj result count", searchResultCount);
                    var setupColumnWCO = {};
                    getAllSSResult(wipLevelThreeSetup.run()).forEach(function (res, line) {
                        var woIdSetup = res.id;
                        if (res.getValue({ name: 'custbody_wip_operations' })) {
                            setupColumnWCO[woIdSetup] = JSON.parse(res.getValue({ name: 'custbody_wip_operations' }));
                        }
                    });
                }

                /*
                workorderSearchObj.id="customsearch1657101358946";
                workorderSearchObj.title="[SCRIPT] WIP REPORT Level 3 SETUP WCO COUNT (copy)";
                var newSearchId = workorderSearchObj.save();
                */
                // insert here end


                log.debug("woCompLinesArrayOfObjs.length", woCompLinesArrayOfObjs.length)
                var subLine = 0;
                var lastSeqNum = 0;
                for (var a = 0; a < woCompLinesArrayOfObjs.length; a++) {
                    try {
                        var seqNum = '';
                        var operation = '';
                        var woComp = woCompLinesArrayOfObjs[a];
                        var woId = woComp.createdFromWOId;
                        var operationName = woComp.operationName;

                        // Search gate times and operations
                        var gateGroup = ' ';
                        var setup = 0;

                        //log.debug("setupTimeCompletedQty")
                        var compQty = 0;
                        //log.debug("compQty",compQty)
                        var timePerPanel = 0;

                        if (operationName) {
                            var memoStr = (operationName.trim()).split('-')[0].split(' ');
                            operation = memoStr[0];

                            if (memoStr.length > 1) {
                                seqNum = memoStr[0];
                                operation = memoStr[1];
                                operationName = (operationName.trim()).split(' ').slice(1).join(' ');
                            }

                            var gateTimesOpsObj = gateTimesOpsArrayOfObjs.find(ops => ops.name === operationName);

                            if (gateTimesOpsObj) {
                                gateGroup = gateTimesOpsObj.gateGroup ? gateTimesOpsObj.gateGroup : ' ';
                                setup = gateTimesOpsObj.wipSetup ? gateTimesOpsObj.wipSetup : 0;
                                var isCore = gateTimesOpsObj.isCore;
                                log.error("Start of computation  for SETUP MIN & TIME/PANEL", operationName + " isCore?: " + isCore);
                                log.debug("woId/operationName", woId + "/" + operationName);
                                completedQty = setupTimeCompletedQty[woId][operationName]; // TOTAL COMPLETED QUANTITY PER OPERATION

                                var wcoCountOp = 0;
                                if (setupColumnWCO.hasOwnProperty(woId)) {
                                    if (setupColumnWCO[woId].hasOwnProperty(seqNum)) {
                                        wcoCountOp = Number(setupColumnWCO[woId][seqNum])
                                    }
                                }

                                log.error("SETUP MIN FORMULA (wipSetup * WCO Count)", setup + " * " + wcoCountOp + " = " + setup * wcoCountOp)
                                setup *= wcoCountOp || 1;
                                var boardPerPanel = Number(woComp.boardsPerPanel) || 1;
                                var division = woComp.division;
                                var totalNumCores = Number(woComp.totalNumCores) || 1;

                                if (boardPerPanel && division.toUpperCase().indexOf("ASSEMBLY") < 0) {  //is not 'ASSEMBLY'
                                    var numOfPanels = Math.ceil(completedQty / boardPerPanel);
                                    log.error("DIVISION IS NOT ASSEMBLY");
                                    log.error("numOfPanels FORMULA Math.ceil(completedQty/boardPerPanel)", "Match.ceil(" + completedQty + "/" + boardPerPanel + ") = " + numOfPanels)
                                }

                                else {
                                    var numOfPanels = completedQty
                                    log.error("DIVISION IS ASSEMBLY");
                                    log.error("numOfPanels FORMULA = completedQty", completedQty);
                                }

                                timePerPanel = gateTimesOpsObj.wipTime ? Number(gateTimesOpsObj.wipTime) : 0;
                                var tempTimePanel = timePerPanel;
                                if (isCore) {

                                    timePerPanel = (totalNumCores * numOfPanels) * timePerPanel / numOfPanels;
                                    log.error("TIME/PANEL FORMULA IS CORE (numCoresPerPanel * numOfPanels) * wipRunTime / numOfPanels", "( " + totalNumCores + " * " + numOfPanels + " )" + " * " + tempTimePanel + " / " + numOfPanels + " = " + timePerPanel)
                                } else {
                                    timePerPanel = (numOfPanels * timePerPanel);
                                    log.error("TIME/PANEL FORMULA IS NOT CORE (numOfPanels * wipRunTime)", numOfPanels + " * " + tempTimePanel + " = " + timePerPanel)
                                }




                            }
                        }

                        // Search material cost
                        var matCostObj = matCostArrayOfObjs.find(cost => cost.woId == woId);
                        log.debug("matCostObj/woId " + woId, JSON.stringify(matCostObj))
                        // var createdFromSODocNum = matCostObj ? matCostObj.createdFromSODocNum : '';
                        // var createdFromSOId = matCostObj ? matCostObj.createdFromSOId : '';
                        // var division = matCostObj ? matCostObj.division : '';

                        var materialCost = 0;
                        //if (seqNum && seqNum == '10') {

                        if (seqNum == "10") {
                            materialCost = matCostObj ? Number(matCostObj.materialCost) : 0;
                        }

                        var laborCost = woComp.laborCost ? Number(woComp.laborCost) : 0;
                        var overHeadCost = woComp.overHeadCost ? Number(woComp.overHeadCost) : 0;
                        var goldCost = woComp.goldCost ? Number(woComp.goldCost) : 0;
                        var enepigGoldCost = woComp.enepigGoldCost ? Number(woComp.enepigGoldCost) : 0;
                        var enepigPalladiumCost = woComp.enepigPalladiumCost ? Number(woComp.enepigPalladiumCost) : 0;
                        // var extraCost = woComp.extraCost ? Number(woComp.extraCost) : 0;


                        var woLink = resolveRecordURL('workorder', woId);
                        var woDocNum = (woComp.createdFromWODocNum).split(' ').splice(-1)[0];

                        var woSOObj = woSOArrayOfObjs.find(m => m.woId == woId);

                        var soLink = woSOObj ? resolveRecordURL('salesorder', woSOObj.soId) : ' ';
                        var soDocNum = woComp.createdFromSODocNum ? (woComp.createdFromSODocNum).split(' ').splice(-1)[0] : '';
                        //log.error("seqNum/a/firstOpName",seqNum+"/"+a+"/"+matCostObj.firstOpName)
                        var firstOperationName = "- None -";
                        if (matCostObj) {
                            firstOperationName = matCostObj.firstOpName
                        }
                        // add operation seq 10 if with 0 cost
                        if (seqNum != "10" && a == 0 && firstOperationName != '- None -' || lastSeqNum > Number(seqNum) && Number(seqNum) > 10 && firstOperationName != '- None -') {
                            materialCost = matCostObj ? Number(matCostObj.materialCost) : 0;
                            var firstOperationGateValues = getGateValues(gateTimesOpsArrayOfObjs, firstOperationName, woComp, setupTimeCompletedQty, woId, setupColumnWCO);
                            sublist = addFirstOperation(sublist, firstOperationName, seqNum, subLine, soDocNum, soLink, soDocNum, woLink, woDocNum, woComp, firstOperationGateValues.setup, firstOperationGateValues.timeperpanel, firstOperationGateValues.gategroup, 0, 0, materialCost, 0, 0, 0, materialCost);
                            subLine++;
                            materialCost = 0;
                        }

                        var lineWIP = laborCost + overHeadCost + goldCost + enepigGoldCost + enepigPalladiumCost + materialCost;

                        sublist.setSublistValue({
                            id: 'custcol_sonumber',
                            line: subLine,
                            value: soDocNum ? '<a href="' + soLink + '"target="_blank">' + soDocNum + '</a>' : ' '
                        });
                        sublist.setSublistValue({
                            id: 'custcol_wonumber',
                            line: subLine,
                            value: '<a href="' + woLink + '"target="_blank">' + woDocNum + '</a>'
                        });
                        sublist.setSublistValue({
                            id: 'custcol_division',
                            line: subLine,
                            value: woComp.division ? woComp.division : ' '
                        });
                        sublist.setSublistValue({
                            id: 'custcol_operation',
                            line: subLine,
                            value: operation ? operation : ' '
                        });
                        sublist.setSublistValue({
                            id: 'custcol_operationname',
                            line: subLine,
                            value: operationName ? operationName : ' '
                        });
                        sublist.setSublistValue({
                            id: 'custcol_setuptime',
                            line: subLine,
                            value: setup
                        });
                        sublist.setSublistValue({
                            id: 'custcol_timeperpanel',
                            line: subLine,
                            value: timePerPanel
                        });
                        sublist.setSublistValue({
                            id: 'custcol_gategroup',
                            line: subLine,
                            value: gateGroup ? gateGroup : ' '
                        });
                        sublist.setSublistValue({
                            id: 'custcol_inputquantity',
                            line: subLine,
                            value: woComp.quantity ? woComp.quantity : 0
                        });
                        sublist.setSublistValue({
                            id: 'custcol_boardsperpanel',
                            line: subLine,
                            value: woComp.boardsPerPanel ? Number(woComp.boardsPerPanel).toFixed(0) : 0
                        });
                        sublist.setSublistValue({
                            id: 'custcol_panelspercore',
                            line: subLine,
                            value: woComp.panelsPerCore ? Number(woComp.panelsPerCore).toFixed(0) : 0
                        });
                        sublist.setSublistValue({
                            id: 'custcol_totalnumcores',
                            line: subLine,
                            value: woComp.totalNumCores && !isNaN(woComp.totalNumCores) ? Number(woComp.totalNumCores).toFixed(0) : 0
                        });
                        sublist.setSublistValue({
                            id: 'custcol_timemin',
                            line: subLine,
                            value: setup + timePerPanel,
                        });
                        sublist.setSublistValue({
                            id: 'custcol_laborcost',
                            line: subLine,
                            value: laborCost ? '$' + addCommas(laborCost.toFixed(2)) : '$0.00'
                        });
                        sublist.setSublistValue({
                            id: 'custcol_overheadcost',
                            line: subLine,
                            value: overHeadCost ? '$' + addCommas(overHeadCost.toFixed(2)) : '$0.00'
                        });
                        sublist.setSublistValue({
                            id: 'custcol_materialcost',
                            line: subLine,
                            value: materialCost ? '$' + addCommas(materialCost.toFixed(2)) : '$0.00'
                        });
                        sublist.setSublistValue({
                            id: 'custcol_goldcost',
                            line: subLine,
                            value: goldCost ? '$' + addCommas(goldCost.toFixed(2)) : '$0.00'
                        });
                        sublist.setSublistValue({
                            id: 'custcol_enepiggoldcost',
                            line: subLine,
                            value: enepigGoldCost ? '$' + addCommas(enepigGoldCost.toFixed(2)) : '$0.00'
                        });
                        sublist.setSublistValue({
                            id: 'custcol_enepigpalladiumcost',
                            line: subLine,
                            value: enepigPalladiumCost ? '$' + addCommas(enepigPalladiumCost.toFixed(2)) : '$0.00'
                        });
                        sublist.setSublistValue({
                            id: 'custcol_linewip',
                            line: subLine,
                            value: lineWIP ? '$' + addCommas(lineWIP.toFixed(2)) : '$0.00'
                        });
                        subLine++;
                        lastSeqNum = Number(seqNum);
                    } catch (e) {
                        log.error("ERROR", e.message);
                    }
                }
            }
            //LEVEL FOUR
            if (pagevar == 4) {
                const woIssueLinesArrayOfObjs = [];
                let formulaString = '';

                // Load Item Cost
                var itemCostSearch = search.load({
                    id: levelFourItemCostSearch
                });
                var itemCostArrayOfObjs = [];
                var w = 0;
                getAllSSResult(itemCostSearch.run()).forEach(function (res, line) {
                    var lineObj = {};
                    lineObj.itemId = res.id;
                    lineObj.itemName = res.getValue(res.columns[0]);
                    lineObj.itemCost = res.getValue(res.columns[1]);
                    lineObj.location = res.getText(res.columns[2]);

                    itemCostArrayOfObjs.push(lineObj);
                    w++;
                });

                // Load WO Issue search
                var usedSearch = search.load({
                    id: levelFourSearch  // customsearch_wip_levelfour_1
                });

                // Mode filter
                if (mode == 'costing') {
                    log.debug('usedSearch-mode', 'costing');
                    usedSearch.filters.push(search.createFilter({
                        name: 'status',
                        join: 'createdfrom',
                        operator: search.Operator.ANYOF,
                        values: ['WorkOrd:H']
                    }));
                } else {
                    // WIP mode
                    log.debug('usedSearch-mode', 'wip');
                    usedSearch.filters.push(search.createFilter({
                        name: 'status',
                        join: 'createdfrom',
                        operator: search.Operator.NONEOF,
                        values: ['WorkOrd:H']
                    }));
                }

                var searchFilters = usedSearch.filters;

                // Add date filter if necessary
                log.debug('enddateinput is:', enddateinput);

                if (enddateinput) {
                    // WORK ORDER TRANDATE
                    var dateInputFormatted = format.format({
                        value: enddateinput,
                        type: format.Type.DATE
                    });
                    searchFilters.push(search.createFilter({
                        name: 'trandate',
                        join: 'createdfrom',
                        operator: 'onorbefore',
                        values: dateInputFormatted
                    }));
                }

                if (sofiltervalue && sofiltervalue != '' && sofiltervalue != 'undefined' && sofiltervalue != null) {
                    log.debug('Level 4: sofiltervalue is:', sofiltervalue);
                    searchFilters.push(search.createFilter({
                        name: 'number',
                        join: 'custbody_cnt_created_fm_so',
                        operator: search.Operator.EQUALTO,
                        values: sofiltervalue
                    }));
                }
                log.debug("LEVEL 4:", wofiltervalue);
                if (wofiltervalue && wofiltervalue != '' && wofiltervalue != 'undefined' && wofiltervalue != null) {
                    log.debug('Level 4: wofiltervalue is:', wofiltervalue);
                    searchFilters.push(search.createFilter({ name: 'number', join: 'createdfrom', operator: search.Operator.EQUALTO, values: wofiltervalue }))
                }

                var b = 0;
                getFirstThreeThousandSSResult(usedSearch.run()).forEach(function (res, line) {
                    var lineObj = {};
                    lineObj.createdFromSOCustomer = res.getText({ name: 'entity', join: 'CUSTBODY_CNT_CREATED_FM_SO' });
                    lineObj.createdFromSODocNum = res.getValue({ name: 'tranid', join: 'CUSTBODY_CNT_CREATED_FM_SO' });
                    lineObj.createdFromWODocNum = res.getValue({ name: "tranid", join: 'createdFrom' });
                    lineObj.woiDate = res.getValue({ name: 'trandate' });
                    lineObj.woiItemId = res.getValue({ name: 'item' });
                    lineObj.woiItem = res.getText({ name: 'item' });
                    lineObj.woiItemInvNum = res.getText({ name: "inventorynumber", join: "inventoryDetail" });
                    lineObj.woiItemInvQty = res.getValue({ name: "quantity", join: "inventoryDetail" });
                    lineObj.woiLineUniqueKey = res.getValue({ name: 'lineuniquekey' });
                    lineObj.woiLineId = (res.getValue({ name: 'line' }) % 2 == 0) ? (res.getValue({ name: 'line' }) / 2) : Math.ceil(res.getValue({ name: 'line' }) / 2);
                    // lineObj.woiItemCost = res.getValue(res.columns[9]);
                    lineObj.woiLineCost = res.getValue(res.columns[9]);
                    lineObj.woiLocation = res.getText(res.columns[13]);

                    lineObj.createdFromSOId = res.getValue({ name: 'internalid', join: 'CUSTBODY_CNT_CREATED_FM_SO' });
                    lineObj.createdFromWOId = res.getValue({ name: 'internalid', join: 'createdFrom' });

                    woIssueLinesArrayOfObjs.push(lineObj);
                    b++;
                });

                // Now get total num of WOISSUES for each WO, package that in array of objects
                var sumsCountResultsArrayOfObjs = getTotalNumsOfWOIs();

                ////////////SET SUBLIST VALUES///////////////
                // Iterate through the second search result object to set the sublist values!
                // log.debug('Iterating through partNumberToLineTotalArrayOfObjs:', JSON.stringify(woIssueLinesArrayOfObjs));
                for (var z = 0; z < woIssueLinesArrayOfObjs.length; z++) {
                    var woDocNumberReturned = woIssueLinesArrayOfObjs[z].createdFromWODocNum;
                    var woiItemReturned = woIssueLinesArrayOfObjs[z].woiItem;
                    //  log.debug('woDocNumberReturned / woiItemReturned is:', woDocNumberReturned +' / '+ woiItemReturned);

                    var itemId = woIssueLinesArrayOfObjs[z].woiItemId;
                    var itemLocation = woIssueLinesArrayOfObjs[z].woiLocation;

                    // FindIndex of the total number of the WOISSUES property that's the same index as our WODOCNUMBER
                    var woiLuk = woIssueLinesArrayOfObjs[z].woiLineUniqueKey;
                    // log.debug('Searching for LUK:', woiLuk);
                    var createdFromSOCustomer = '';
                    var createdFromSO = '';
                    var elementPosition = woIssueLinesArrayOfObjs.map(function (x) { return x.woiLineUniqueKey; }).indexOf(woiLuk);
                    //log.debug('Line ' + z + ' LUK elementPosition found is:', elementPosition);

                    if (elementPosition != -1) {
                        createdFromSOCustomer = woIssueLinesArrayOfObjs[elementPosition].createdFromSOCustomer;
                        createdFromSO = woIssueLinesArrayOfObjs[elementPosition].createdFromSODocNum;
                        createdFromSOid = woIssueLinesArrayOfObjs[elementPosition].createdFromSOId;
                        workOrderId = woIssueLinesArrayOfObjs[elementPosition].createdFromWOId;
                        woDocNum = woIssueLinesArrayOfObjs[elementPosition].createdFromWODocNum;
                        // log.debug('Found createdFromSO / createdFromSOCustomer:', createdFromSO +' / '+ createdFromSOCustomer);
                    }

                    sublist.setSublistValue({
                        id: 'custcol_customer',
                        line: z,
                        value: createdFromSOCustomer ? createdFromSOCustomer : ' '
                    });

                    var soLink = resolveRecordURL('salesorder', createdFromSOid)
                    log.debug('soLink is:', soLink)

                    sublist.setSublistValue({
                        id: 'custcol_sonumber',
                        line: z,
                        value: '<a href="' + soLink + '"target="_blank">' + createdFromSO + '</a>'     //createdFromSO ? createdFromSO : ' '     
                    });
                    //'<a name="Edit" id="Edit"href="'||'https://5361187-sb1.app.netsuite.com/app/accounting/transactions/salesord.nl?id='||{custbody_cnt_created_fm_so.internalid}||'"target="_blank">' || {custbody_cnt_created_fm_so.number} || '</a>'

                    var woLink = resolveRecordURL('workorder', workOrderId)
                    log.debug('woLink is:', woLink)

                    sublist.setSublistValue({
                        id: 'custcol_wonumber',
                        line: z,
                        value: '<a href="' + woLink + '"target="_blank">' + woDocNum + '</a>'
                    });

                    // findIndex of the total number of the WOISSUES property that's the same index as our WODOCNUMBER
                    // log.debug('now looking for Sum of WOISSUES using wodocnum:', woDocNumberReturned);
                    var sumItems = '';
                    var sumWOIssues = '';
                    var elementPosition = sumsCountResultsArrayOfObjs.map(function (x) { return x.wodocnum; }).indexOf(woDocNumberReturned);

                    // log.debug('Line ' + z + ' sumWOIssues elementPosition found is:', elementPosition);
                    if (elementPosition != -1) {
                        //sumItems = sumsCountResultsArrayOfObjs[elementPosition].sumitems;
                        sumWOIssues = sumsCountResultsArrayOfObjs[elementPosition].sumwoissues;
                    }

                    // Search item cost
                    var itemCostObj = itemCostArrayOfObjs.find(cost => cost.itemId == itemId && cost.location == itemLocation);

                    sublist.setSublistValue({
                        id: 'custcol_itemcount',
                        line: z,
                        value: woIssueLinesArrayOfObjs[z]?.woiLineId ? woIssueLinesArrayOfObjs[z].woiLineId : ' '
                    });
                    sublist.setSublistValue({
                        id: 'custcol_woicount',
                        line: z,
                        value: sumWOIssues ? sumWOIssues : 0
                    });
                    sublist.setSublistValue({
                        id: 'custcol_partnumber',
                        line: z,
                        value: woIssueLinesArrayOfObjs[z]?.woiItem ? woIssueLinesArrayOfObjs[z].woiItem : ' '
                    });
                    sublist.setSublistValue({
                        id: 'custcol_lotnumber',
                        line: z,
                        value: woIssueLinesArrayOfObjs[z]?.woiItemInvNum ? woIssueLinesArrayOfObjs[z].woiItemInvNum : ' '
                    });
                    sublist.setSublistValue({
                        id: 'custcol_partquantity',
                        line: z,
                        value: woIssueLinesArrayOfObjs[z]?.woiItemInvQty ? woIssueLinesArrayOfObjs[z].woiItemInvQty : ' '
                    });
                    sublist.setSublistValue({
                        id: 'custcol_cost',
                        line: z,
                        value: itemCostObj ? '$' + addCommas(Number(itemCostObj.itemCost).toFixed(2)) : '$0.00'
                    });
                    sublist.setSublistValue({
                        id: 'custcol_linetotal',
                        line: z,
                        value: woIssueLinesArrayOfObjs[z]?.woiLineCost ? '$' + addCommas(Number(woIssueLinesArrayOfObjs[z].woiLineCost).toFixed(2)) : '$0.00'
                    });
                }//end for loop partNumberToLineTotalArrayOfObjs    
            }//end if PAGE 4


            //END DATE filter
            var endDateField = form.addField({
                id: 'custpage_enddate',
                type: ui.FieldType.DATE,
                label: 'End Date'
            });
            endDateField.updateLayoutType({ layoutType: ui.FieldLayoutType.STARTROW });
            endDateField.defaultValue = enddateinput;
            endDateField.updateDisplaySize({ height: 1, width: 15 });

            //END TIME filter
            var endTimeField = form.addField({
                id: 'custpage_endtime',
                type: ui.FieldType.TIMEOFDAY,
                label: 'End Time'
            });
            endTimeField.updateLayoutType({ layoutType: ui.FieldLayoutType.MIDROW });
            endTimeField.defaultValue = endtimeinput;
            endTimeField.updateDisplaySize({ height: 1, width: 15 });

            // Unfulfilled/Either
            var modeField = form.addField({
                id: 'custpage_mode',
                type: ui.FieldType.SELECT,
                label: 'Mode'
            });
            modeField.addSelectOption({ text: 'WIP', value: '' });
            modeField.addSelectOption({ text: 'COSTING', value: 'costing' });
            // modeField.addSelectOption({ text: 'JOB COST', value: 'jobcost'});
            modeField.updateLayoutType({ layoutType: ui.FieldLayoutType.STARTROW });
            modeField.defaultValue = mode;


            //SO FILTER FIELD
            var soFilter = form.addField({
                id: 'custpage_sofilter',
                type: ui.FieldType.TEXT,
                label: 'SO Filter'
            });
            soFilter.updateLayoutType({ layoutType: ui.FieldLayoutType.MIDROW });
            soFilter.defaultValue = sofiltervalue;
            soFilter.updateDisplaySize({ height: 1, width: 15 });

            // EXPORT CSV BUTTON
            form.addButton({
                id: 'custpage_exportcsv',
                label: 'Export CSV',
                functionName: 'exportCSV()'
            });
            // update 05032022
            if (pagevar != 1) {  //only show filters on LEVEL 2 and LEVEL 3


                //WO FILTER FIELD
                var woFilter = form.addField({
                    id: 'custpage_wofilter',
                    type: ui.FieldType.TEXT,
                    label: 'WO Filter'
                });
                woFilter.updateLayoutType({ layoutType: ui.FieldLayoutType.MIDROW });
                woFilter.defaultValue = wofiltervalue;
                woFilter.updateDisplaySize({ height: 1, width: 15 });
                if (pagevar != 4) {
                    //DIVISION FILTER FIELD
                    var divisionFilter = form.addField({
                        id: 'custpage_divfilter',
                        type: ui.FieldType.SELECT,
                        label: 'Division Filter'
                    });
                    divisionFilter.updateLayoutType({ layoutType: ui.FieldLayoutType.MIDROW });
                    divisionFilter.defaultValue = divfiltervalue;
                    //divisionFilter.updateDisplaySize({height: 1, width: 15});

                    //add all select options for all DIVISIONS
                    divisionFilter.addSelectOption({ value: '', text: '' });

                    var departmentSearchObj = search.create({
                        type: "department",
                        filters: [],
                        columns:
                            [
                                search.createColumn({ name: "internalid", label: "Internal ID" }),
                                search.createColumn({ name: "name", sort: search.Sort.ASC, label: "Name" })
                            ]
                    });
                    var searchResultCount = departmentSearchObj.runPaged().count;
                    departmentSearchObj.run().each(function (result) {
                        var val = result.getValue({ name: "internalid" })
                        var text = result.getValue({ name: "name" })

                        divisionFilter.addSelectOption({ value: val, text: text });

                        return true;
                    });
                }

            }//if pagevar !=   

            form.clientScriptModulePath = './wipReport_CS2_v3.js';
            /**         
                     form.addPageLink({
                         title: 'Export CSV',
                         type: ui.FormPageLinkType.BREADCRUMB,
                         url: 'http://google.com' //url.resolveScript
                     });
            **/
            response.writePage(form);
        }

        const createSublistFields = (sublist, page) => {
            var sublistFields = {};
            var columns = [];

            if (page == 1) {

                log.debug('Pushing level one sublist fields');
                //columns.push(['rownumber', 'Row', ui.FieldType.TEXT, 'customlist_rownumber']);
                columns.push(['customer', 'Customer', ui.FieldType.TEXT, 'customlist_customer']);
                columns.push(['sonumber', 'SO#', ui.FieldType.TEXT, 'customlist_sonumber']);
                columns.push(['sodate', 'SO Date', ui.FieldType.TEXT, 'customlist_sodate']);
                columns.push(['soamount', 'SO Amount', ui.FieldType.TEXT, 'customlist_soamount']);
                columns.push(['totalwocosts', 'Total Costs', ui.FieldType.TEXT, 'customlist_totalwocosts']);
                columns.push(['grossmargin', 'Gross Margin', ui.FieldType.TEXT, 'customlist_grossmargin']);

            } else if (page == 2) {

                //columns.push(['rownumber', 'Row', ui.FieldType.TEXT, 'customlist_rownumber']);
                columns.push(['customer', 'Customer', ui.FieldType.TEXT, 'customlist_customer']);
                columns.push(['sonumber', 'SO#', ui.FieldType.TEXT, 'customlist_sonumber']);
                columns.push(['wonumber', 'WO#', ui.FieldType.TEXT, 'customlist_wonumber']);
                columns.push(['outsource', 'Outsource?', ui.FieldType.TEXT, 'customlist_outsource']);
                columns.push(['division', 'Division', ui.FieldType.TEXT, 'customlist_division']);
                columns.push(['wostatus', 'WO Status', ui.FieldType.TEXT, 'customlist_wostatus']);
                columns.push(['materialcost', 'Material Cost', ui.FieldType.TEXT, 'customlist_materialcost']);
                columns.push(['laborcost', 'Labor Cost', ui.FieldType.TEXT, 'customlist_laborcost']);
                columns.push(['overheadcost', 'OH', ui.FieldType.TEXT, 'customlist_overheadcost']);
                columns.push(['goldcost', 'Gold', ui.FieldType.TEXT, 'customlist_goldcost']);
                columns.push(['enepiggoldcost', 'Enepig Gold', ui.FieldType.TEXT, 'customlist_enepiggoldcost']);
                columns.push(['enepigpalladiumcost', 'Enepig Palladium', ui.FieldType.TEXT, 'customlist_enepigpalladiumcost']);
                //  columns.push(['extracost', 'Extra $', ui.FieldType.TEXT, 'customlist_extracost']);
                columns.push(['wototalcost', 'Total Cost', ui.FieldType.TEXT, 'customlist_wototalcost']);

            } else if (page == 3) {

                //columns.push(['rownumber', 'Row', ui.FieldType.TEXT, 'customlist_rownumber']);
                columns.push(['sonumber', 'SO#', ui.FieldType.TEXT, 'customlist_sonumber']);
                columns.push(['wonumber', 'WO#', ui.FieldType.TEXT, 'customlist_wonumber']);
                columns.push(['division', 'Division', ui.FieldType.TEXT, 'customlist_division']);
                columns.push(['operation', 'Operation', ui.FieldType.TEXT, 'customlist_operation']);
                columns.push(['operationname', 'Operation Name', ui.FieldType.TEXT, 'customlist_operationname']);
                columns.push(['setuptime', 'Setup min', ui.FieldType.TEXT, 'customlist_setuptime']);
                columns.push(['timeperpanel', 'Time/Panel (hh:mm)', ui.FieldType.TEXT, 'customlist_timeperpanel']);
                columns.push(['gategroup', 'Gate Group', ui.FieldType.TEXT, 'customlist_gategroup']);
                columns.push(['inputquantity', 'Qty', ui.FieldType.TEXT, 'customlist_inputquantity']);
                columns.push(['boardsperpanel', 'Bds/Panel', ui.FieldType.TEXT, 'customlist_boardsperpanel']);
                columns.push(['panelspercore', '#Panels', ui.FieldType.TEXT, 'customlist_panelspercore']);
                columns.push(['totalnumcores', '# Cores', ui.FieldType.TEXT, 'customlist_totalnumcores']);
                columns.push(['timemin', 'Total Time (min)', ui.FieldType.TEXT, 'customlist_timemin']);
                columns.push(['laborcost', 'Labor', ui.FieldType.TEXT, 'customlist_laborcost']);
                columns.push(['overheadcost', 'OH', ui.FieldType.TEXT, 'customlist_overheadcost']);
                columns.push(['materialcost', 'Material', ui.FieldType.TEXT, 'customlist_materialcost']);
                columns.push(['goldcost', 'Gold', ui.FieldType.TEXT, 'customlist_goldcost']);
                columns.push(['enepiggoldcost', 'Enepig Gold', ui.FieldType.TEXT, 'customlist_enepiggoldcost']);
                columns.push(['enepigpalladiumcost', 'Enepig Palladium', ui.FieldType.TEXT, 'customlist_enepigpalladiumcost']);
                // columns.push(['extracost', 'Extra', ui.FieldType.TEXT, 'customlist_extracost']);
                columns.push(['linewip', 'Line WIP', ui.FieldType.TEXT, 'customlist_linewip']);


            } else if (page == 4) {

                //columns.push(['rownumber', 'Row', ui.FieldType.TEXT, 'customlist_rownumber']);
                columns.push(['customer', 'Customer', ui.FieldType.TEXT, 'customlist_customer']);
                columns.push(['sonumber', 'SO#', ui.FieldType.TEXT, 'customlist_sonumber']);
                columns.push(['wonumber', 'WO', ui.FieldType.TEXT, 'customlist_wonumber']);
                columns.push(['itemcount', 'Item #', ui.FieldType.TEXT, 'customlist_itemcount']);
                columns.push(['woicount', 'WOI', ui.FieldType.TEXT, 'customlist_woicount']);
                columns.push(['partnumber', 'Part Number', ui.FieldType.TEXT, 'customlist_partnumber']);
                columns.push(['lotnumber', 'Lot #', ui.FieldType.TEXT, 'customlist_lotnumber']);
                columns.push(['partquantity', 'Qty', ui.FieldType.TEXT, 'customlist_partquantity']);
                columns.push(['cost', 'Cost', ui.FieldType.TEXT, 'customlist_cost']);
                columns.push(['linetotal', 'Line Total', ui.FieldType.TEXT, 'customlist_linetotal']);

            }

            columns.forEach(function (fld) {
                sublistFields[fld[0]] = sublist.addField({
                    id: 'custcol_' + fld[0].toLowerCase(),
                    label: fld[1],
                    type: fld[2],
                    source: fld[3]
                });
            });


            // Set field display type
            for (var x in sublistFields)
                sublistFields[x].updateDisplayType({
                    displayType: ui.FieldDisplayType[(x == 'select' || x == 'quantity' ? 'ENTRY' :
                        x == 'origQty' ? 'HIDDEN' : 'INLINE')]
                });
            /**
                     // Set field size
                     sublistFields.quantity.updateDisplaySize({
                         height: 1,
                         width: 15
                     });
            **/
            return sublistFields;
        }

        const wosWithWOCompletions = woIds => {
            var transactionSearchObj = search.create({
                type: "transaction",
                filters:
                    [
                        ["type", "anyof", "WOCompl"],
                        "AND",
                        ["createdfrom", "anyof", woIds],
                        "AND",
                        ["mainline", "is", "T"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID", sort: search.Sort.ASC }),
                        search.createColumn({ name: "tranid", label: "Document Number" }),
                        search.createColumn({ name: "trandate", label: "Date" }),
                        search.createColumn({ name: "datecreated", label: "Date Created" }),
                        search.createColumn({ name: "createdfrom", label: "Created From" })
                    ]
            });
            let ids = getAllSSResult(transactionSearchObj.run()).map(m => Number(m.getValue({ name: 'createdfrom' })))
            ids = Array.from(new Set(ids)) // Remove dups
            log.debug('wosWithWOCompletions WO ids', ids)

            return ids
        }

        const getAllSSResult = searchResultSet => {
            var result = [];
            for (var x = 0; x <= result.length; x += 1000)
                result = result.concat(searchResultSet.getRange(x, x + 1000) || []);
            return result;
        };

        const getFirstOneThousandSSResult = searchResultSet => {
            var result = [];
            for (var x = 0; x <= result.length; x += 1000)
                result = result.concat(searchResultSet.getRange(x, 1000) || []);
            return result;
        };

        const getFirstThreeThousandSSResult = searchResultSet => {
            var result = [];

            for (var x = 0; x <= result.length && x < 3000; x += 1000)
                result = result.concat(searchResultSet.getRange(x, x + 1000) || []);

            return result;
        };

        const formatDate = (date, type) => {
            return !date ? '' :
                type == 's' ? N.format.format({
                    value: date,
                    type: N.format.Type.DATE
                }) : type == 'd' ? N.format.parse({
                    value: date,
                    type: N.format.Type.DATE
                }) : date;
        }

        const addCommas = (x) => {
            var parts = x.toString().split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            return parts.join(".");
        }

        function findOperationName(input, operationname) {
            return input == operationname;
        }

        function getTotalNumOfWOIssuesAndTotalNumItems(woid) {

            TOTAL_NUM_WOISSUES = Number(0);
            TOTAL_NUM_ITEMS = Number(0);
            RETURN_ARRAY = [];
            var workorderSearchObj = search.create({
                type: "workorder",
                filters:
                    [
                        ["type", "anyof", "WorkOrd"],
                        "AND",
                        ["custbody_cnt_created_fm_so", "noneof", "@NONE@"],
                        "AND",
                        ["custbody_cnt_created_fm_so.mainline", "is", "T"],
                        "AND",
                        ["custbody_cnt_created_fm_so.status", "anyof", "SalesOrd:B", "SalesOrd:E", "SalesOrd:F", "SalesOrd:A", "SalesOrd:D"],
                        "AND",
                        ["applyingtransaction.type", "anyof", "WOIssue"],
                        "AND",
                        ["internalid", "anyof", woid]
                    ],
                columns:
                    [
                        search.createColumn({ name: "tranid", summary: "GROUP", label: "Document Number" }),
                        search.createColumn({ name: "item", join: "applyingTransaction", summary: "COUNT", label: "Item" }),
                        search.createColumn({ name: "type", join: "applyingTransaction", summary: "COUNT", label: "Type" })
                    ]
            });
            var searchResultCount = workorderSearchObj.runPaged().count;
            log.debug("workorderSearchObj result count", searchResultCount);
            workorderSearchObj.run().each(function (result) {
                TOTAL_NUM_WOISSUES = result.getValue({ name: "type", join: "applyingTransaction", summary: "COUNT" });
                RETURN_ARRAY.push(TOTAL_NUM_WOISSUES);
                TOTAL_NUM_ITEMS = result.getValue({ name: "item", join: "applyingTransaction", summary: "COUNT" });
                RETURN_ARRAY.push(TOTAL_NUM_ITEMS);
                return true;
            });

            return RETURN_ARRAY;
        }


        function getTotalNumsOfWOIs() {

            /**                
                            if(enddateinput){
                                //WORK ORDER TRANDATE or SALES ORDER TRANDATE??
                                var dateInputFormatted = format.format({value: enddateinput, type: format.Type.DATE});
                                var searchFilters = usedSearch.filters;
                                searchFilters.push(search.createFilter({name: 'trandate', operator: 'onorbefore', values: dateInputFormatted}));
                            }
            **/
            var totalNumOfWOIssuesAgainstWOsGrouped = [];

            var workorderSearchObj = search.create({
                type: "workorder",
                filters:
                    [
                        ["type", "anyof", "WorkOrd"],
                        "AND",
                        ["custbody_cnt_created_fm_so", "noneof", "@NONE@"],
                        "AND",
                        ["custbody_cnt_created_fm_so.mainline", "is", "T"],
                        "AND",
                        ["custbody_cnt_created_fm_so.status", "anyof", "SalesOrd:B", "SalesOrd:E", "SalesOrd:F", "SalesOrd:A", "SalesOrd:D"],
                        "AND",
                        ["applyingtransaction.type", "anyof", "WOIssue"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "tranid", summary: "GROUP", label: "Document Number" }),
                        search.createColumn({ name: "internalid", join: "applyingTransaction", summary: "COUNT", label: "Internal ID" })
                    ]
            });
            var searchResultCount = workorderSearchObj.runPaged().count;
            log.debug("workorderSearchObj result count", searchResultCount);
            getAllSSResult(workorderSearchObj.run()).forEach(function (res, line) {
                var lineObj = {};
                //lineObj.customer = res.getValue({name: "entity", join: "CUSTBODY_CNT_CREATED_FM_SO", summary: "GROUP"});
                //lineObj.soid = res.getValue({name: "tranid", join: "CUSTBODY_CNT_CREATED_FM_SO", summary: "GROUP"});
                lineObj.wodocnum = res.getValue({ name: "tranid", summary: "GROUP" });
                //lineObj.sumitems = res.getValue({name: "item", join: "applyingTransaction", summary: "COUNT"});
                lineObj.sumwoissues = res.getValue({ name: "internalid", join: "applyingTransaction", summary: "COUNT" });

                totalNumOfWOIssuesAgainstWOsGrouped.push(lineObj);
            });

            log.debug('totalNumOfWOIssuesAgainstWOsGrouped is:', JSON.stringify(totalNumOfWOIssuesAgainstWOsGrouped));
            return totalNumOfWOIssuesAgainstWOsGrouped;
        }

        function addFirstOperation(sublist, operationName, seqNum, a, soDocNum, soLink, soDocNum, woLink, woDocNum, woComp, setup, timePerPanel, gateGroup, laborCost, overHeadCost, materialCost, goldCost, enepigGoldCost, enepigPalladiumCost, lineWIP) {
            log.error("add first line")
            var memoStr = (operationName.trim()).split('-')[0].split(' ');
            var operation = memoStr[0];

            if (memoStr.length > 1) {
                seqNum = memoStr[0];
                operation = memoStr[1];
                operationName = (operationName.trim()).split(' ').slice(1).join(' ');
            }

            sublist.setSublistValue({
                id: 'custcol_sonumber',
                line: a,
                value: soDocNum ? '<a href="' + soLink + '"target="_blank">' + soDocNum + '</a>' : ' '
            });
            sublist.setSublistValue({
                id: 'custcol_wonumber',
                line: a,
                value: '<a href="' + woLink + '"target="_blank">' + woDocNum + '</a>'
            });
            sublist.setSublistValue({
                id: 'custcol_division',
                line: a,
                value: woComp.division ? woComp.division : ' '
            });
            sublist.setSublistValue({
                id: 'custcol_operation',
                line: a,
                value: operation ? operation : ' '
            });
            sublist.setSublistValue({
                id: 'custcol_operationname',
                line: a,
                value: operationName ? operationName : ' '
            });
            sublist.setSublistValue({
                id: 'custcol_setuptime',
                line: a,
                value: setup
            });
            sublist.setSublistValue({
                id: 'custcol_timeperpanel',
                line: a,
                value: timePerPanel
            });
            sublist.setSublistValue({
                id: 'custcol_gategroup',
                line: a,
                value: gateGroup ? gateGroup : ' '
            });
            sublist.setSublistValue({
                id: 'custcol_inputquantity',
                line: a,
                value: woComp.quantity ? woComp.quantity : 0
            });
            sublist.setSublistValue({
                id: 'custcol_boardsperpanel',
                line: a,
                value: woComp.boardsPerPanel ? Number(woComp.boardsPerPanel).toFixed(0) : 0
            });
            sublist.setSublistValue({
                id: 'custcol_panelspercore',
                line: a,
                value: woComp.panelsPerCore ? Number(woComp.panelsPerCore).toFixed(0) : 0
            });
            sublist.setSublistValue({
                id: 'custcol_totalnumcores',
                line: a,
                value: woComp.totalNumCores && !isNaN(woComp.totalNumCores) ? Number(woComp.totalNumCores).toFixed(0) : 0
            });
            sublist.setSublistValue({
                id: 'custcol_timemin',
                line: a,
                value: setup + timePerPanel
            });
            sublist.setSublistValue({
                id: 'custcol_laborcost',
                line: a,
                value: laborCost ? '$' + addCommas(laborCost.toFixed(2)) : '$0.00'
            });
            sublist.setSublistValue({
                id: 'custcol_overheadcost',
                line: a,
                value: overHeadCost ? '$' + addCommas(overHeadCost.toFixed(2)) : '$0.00'
            });
            sublist.setSublistValue({
                id: 'custcol_materialcost',
                line: a,
                value: materialCost ? '$' + addCommas(materialCost.toFixed(2)) : '$0.00'
            });
            sublist.setSublistValue({
                id: 'custcol_goldcost',
                line: a,
                value: goldCost ? '$' + addCommas(goldCost.toFixed(2)) : '$0.00'
            });
            sublist.setSublistValue({
                id: 'custcol_enepiggoldcost',
                line: a,
                value: enepigGoldCost ? '$' + addCommas(enepigGoldCost.toFixed(2)) : '$0.00'
            });
            sublist.setSublistValue({
                id: 'custcol_enepigpalladiumcost',
                line: a,
                value: enepigPalladiumCost ? '$' + addCommas(enepigPalladiumCost.toFixed(2)) : '$0.00'
            });

            sublist.setSublistValue({
                id: 'custcol_linewip',
                line: a,
                value: lineWIP ? '$' + addCommas(lineWIP.toFixed(2)) : '$0.00'
            });

            return sublist;
        }

        function getGateValues(gateTimesOpsArrayOfObjs, operationName, woComp, setupTimeCompletedQty, woId, setupColumnWCO) {
            log.error("Adding first operation with zero cost")
            var gateTimesOpsObj = gateTimesOpsArrayOfObjs.find(ops => ops.name === operationName);
            var gateObjValues = {};
            var seqNum = 10;
            if (gateTimesOpsObj) {
                var gateGroup = gateTimesOpsObj.gateGroup ? gateTimesOpsObj.gateGroup : ' ';
                var setup = gateTimesOpsObj.wipSetup ? gateTimesOpsObj.wipSetup : 0;
                var isCore = gateTimesOpsObj.isCore;
                log.error("Start of computation  for SETUP MIN & TIME/PANEL", operationName + " isCore?: " + isCore);
                log.debug("woId/operationName", woId + "/" + operationName);
                var completedQty = setupTimeCompletedQty[woId][operationName]; // TOTAL COMPLETED QUANTITY PER OPERATION

                var wcoCountOp = 0;
                if (setupColumnWCO.hasOwnProperty(woId)) {
                    if (setupColumnWCO[woId].hasOwnProperty(seqNum)) {
                        wcoCountOp = Number(setupColumnWCO[woId][seqNum])
                    }
                }

                log.error("SETUP MIN FORMULA (wipSetup * WCO Count)", setup + " * " + wcoCountOp + " = " + setup * wcoCountOp)
                setup *= wcoCountOp || 1;
                var boardPerPanel = Number(woComp.boardsPerPanel) || 1;
                var division = woComp.division;
                var totalNumCores = Number(woComp.totalNumCores) || 1;

                if (boardPerPanel && division.toUpperCase().indexOf("ASSEMBLY") < 0) {  //is not 'ASSEMBLY'
                    var numOfPanels = Math.ceil(completedQty / boardPerPanel);
                    log.error("DIVISION IS NOT ASSEMBLY");
                    log.error("numOfPanels FORMULA Math.ceil(completedQty/boardPerPanel)", "Match.ceil(" + completedQty + "/" + boardPerPanel + ") = " + numOfPanels)
                }

                else {
                    var numOfPanels = completedQty
                    log.error("DIVISION IS ASSEMBLY");
                    log.error("numOfPanels FORMULA = completedQty", completedQty);
                }

                timePerPanel = gateTimesOpsObj.wipTime ? Number(gateTimesOpsObj.wipTime) : 0;
                var tempTimePanel = timePerPanel;
                if (isCore) {

                    timePerPanel = (totalNumCores * numOfPanels) * timePerPanel / numOfPanels;
                    log.error("TIME/PANEL FORMULA IS CORE (numCoresPerPanel * numOfPanels) * wipRunTime / numOfPanels", "( " + totalNumCores + " * " + numOfPanels + " )" + " * " + tempTimePanel + " / " + numOfPanels + " = " + timePerPanel)
                } else {
                    timePerPanel = (numOfPanels * timePerPanel);
                    log.error("TIME/PANEL FORMULA IS NOT CORE (numOfPanels * wipRunTime)", numOfPanels + " * " + tempTimePanel + " = " + timePerPanel)
                }
                gateObjValues['setup'] = setup;
                gateObjValues['timeperpanel'] = timePerPanel;
                gateObjValues['gategroup'] = gateGroup;


                return gateObjValues;
            }
        }


        function resolveRecordURL(recordtype, recordid) {

            var output = url.resolveRecord({
                recordType: recordtype,
                recordId: recordid,
                isEditMode: false
            });
            //  log.debug('resolveRecordURL returning:', output)
            return output
        }

        return {
            onRequest: onRequest
        };

    }
);
