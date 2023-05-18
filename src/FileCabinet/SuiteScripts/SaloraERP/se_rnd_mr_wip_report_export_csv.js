/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @NAuthor Jerome Morden
 */
define(['N/search', 'N/encode', 'N/file', 'N/runtime', 'N/email', 'N/url', 'N/format'],
  (search, encode, file, runtime, email, url, format) => {

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
    const getInputData = () => {
      var script = runtime.getCurrentScript();
      var Level1 = script.getParameter('custscript_wip_report_export_csv_1');
      var Level2 = script.getParameter('custscript_wip_report_export_csv_2');
      var Level3 = script.getParameter('custscript_wip_report_export_csv_3');
      var Level4 = script.getParameter('custscript_wip_report_export_csv_4');

      return {
        Level1,
        Level2,
        Level3,
        Level4
      };
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    const map = context => {
      context.write({
        key: context.key,
        value: context.value
      });
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    const reduce = context => {
      try {
        var excelCols = [];
        var script = runtime.getCurrentScript();
        var params = JSON.parse(script.getParameter('custscript_wip_report_export_csv_params') || '{}');

        switch (context.key) {
          case 'Level1':
            excelCols = [
              { name: 'Customer', type: 'String' },
              { name: 'SO#', type: 'String' },
              { name: 'SO Date', type: 'String' },
              { name: 'SO Amount', type: 'Number' },
              { name: 'Total Costs', type: 'Number' },
              { name: 'Gross Margin', type: 'Number' }
            ];

            break;
          case 'Level2':
            excelCols = [
              { name: 'Customer', type: 'String' },
              { name: 'SO#', type: 'String' },
              { name: 'WO#', type: 'String' },
              { name: 'Outsource?', type: 'String' },
              { name: 'Division', type: 'String' },
              { name: 'WO Status', type: 'String' },
              { name: 'Material Cost', type: 'Number' },
              { name: 'Labor Cost', type: 'Number' },
              { name: 'OH', type: 'Number' },
              { name: 'Gold', type: 'Number' },
              { name: 'Enepig Gold', type: 'Number' },
              { name: 'Enepig Palladium', type: 'Number' },
              { name: 'Total Cost', type: 'Number' }
            ];
            break;
          case 'Level3':
            excelCols = [
              { name: 'SO#', type: 'String' },
              { name: 'WO#', type: 'String' },
              { name: 'Division', type: 'String' },
              { name: 'Operation', type: 'String' },
              { name: 'Operation Name', type: 'String' },
              { name: 'Setup min', type: 'String' },
              { name: 'Time/Panel (HH:MM)', type: 'String' },
              { name: 'Gate Group', type: 'String' },
              { name: 'Qty', type: 'Number' },
              { name: 'BDS/Panel', type: 'Number' },
              { name: '#Panels', type: 'Number' },
              { name: '#Cores', type: 'Number' },
              { name: 'Total Time (Min)', type: 'Number' },
              { name: 'Labor', type: 'Number' },
              { name: 'OH', type: 'Number' },
              { name: 'Material', type: 'Number' },
              { name: 'Gold', type: 'Number' },
              { name: 'Enepig Gold', type: 'Number' },
              { name: 'Enepig Palladium', type: 'Number' },
              { name: 'Line WIP', type: 'Number' }
            ];
            break;
          case 'Level4':
            excelCols = [
              { name: 'Customer', type: 'String' },
              { name: 'SO#', type: 'String' },
              { name: 'WO#', type: 'String' },
              { name: 'Item #', type: 'Number' },
              { name: 'WOI', type: 'Number' },
              { name: 'Part Number', type: 'String' },
              { name: 'Lot #', type: 'String' },
              { name: 'Qty', type: 'Number' },
              { name: 'Cost', type: 'Number' },
              { name: 'Line Total', type: 'Number' }
            ];
            break;
        }

        // Add sheet column headers
        var csvHeader = ``;
        excelCols.forEach((col) => {
          csvHeader += `"${col.name}",`;
        });

        var xdate = params.endDate ? format.parse({
          type: format.Type.DATE,
          value: params.endDate
        }) : new Date();
        xdate = ((date) => {
          var mm = (date.getMonth() + 1).toString();
          var dd = date.getDate().toString();
          var yyyy = date.getFullYear().toString();

          mm = mm.length > 1 ? mm : `0${mm}`;
          dd = dd.length > 1 ? dd : `0${dd}`;

          return `${mm}-${dd}-${yyyy}`;
        })(xdate);

        var csvFileName = `WIP-Report-${context.key}_${params.user}_${xdate}.CSV`;
        var csvFile = file.create({
          name: csvFileName,
          fileType: file.Type.CSV,
          contents: csvHeader + '\n',
          folder: '981',
          isOnline: true
        });

        // Load saved search and parsed all values to excel data
        var searchReport = search.load({
          id: context.values[0]
        });

        //  if (params.wipMode) {
        //      log.debug('wipMode', 'wipMode')
        //      searchReport.filters.pop();

        //      searchReport.filters.push(search.createFilter({
        //          name: 'status',
        //          join: 'custbody_cnt_created_fm_so',
        //          operator: search.Operator.ANYOF,
        //          values: ['SalesOrd:G']
        //      }));
        //  }

        if (params.endDate)
          searchReport.filters.push(search.createFilter({
            name: 'trandate',
            operator: search.Operator.ONORBEFORE,
            values: params.endDate
          }));

        if (params.soFilterValue)
          searchReport.filters.push(search.createFilter({
            name: 'number',
            join: 'custbody_cnt_created_fm_so',
            operator: search.Operator.EQUALTO,
            values: params.soFilterValue
          }));

        // WO filter on level 2 only
        if (context.key == 'Level2') {
          if (params.woFilterValue)
            searchReport.filters.push(search.createFilter({
              name: 'number',
              operator: search.Operator.EQUALTO,
              values: params.woFilterValue
            }));
        }

        // WO filter on level 3 and 4 only
        if (context.key == 'Level3' || context.key == 'Level4') {
          if (params.woFilterValue)
            searchReport.filters.push(search.createFilter({
              name: 'number',
              join: 'createdfrom',
              operator: search.Operator.EQUALTO,
              values: params.woFilterValue
            }));
        }

        // Division filter on level 2 and 3 only
        if (context.key == 'Level2' || context.key == 'Level3') {
          if (params.divisionFilterValue)
            searchReport.filters.push(search.createFilter({
              name: 'department',
              operator: search.Operator.ANYOF,
              values: params.divisionFilterValue
            }));
        }

        // Level 1
        if (context.key == 'Level1') {
          var levelOne = [];
          var Level1Main = script.getParameter('custscript_wip_report_export_csv_1_1');
          var Level1Details = script.getParameter('custscript_wip_report_export_csv_1_2');

          // Mode filter
          if (params.mode == 'costing') {
            log.debug('searchReport-mode-l1', 'costing');
            searchReport.filters.push(search.createFilter({
              name: 'status',
              operator: search.Operator.ANYOF,
              values: ['WorkOrd:H']
            }));
          } else {
            // WIP mode
            log.debug('searchReport-mode-l1', 'wip');
            searchReport.filters.push(search.createFilter({
              name: 'status',
              operator: search.Operator.NONEOF,
              values: ['WorkOrd:H']
            }));
          }

          getAllSSResult(searchReport.run()).forEach(function (res, line) {
            var cols = res.columns;
            levelOne.push({
              id: res.getValue(cols[10]),
              customer: res.getText(cols[0]),
              soNumber: res.getValue(cols[1]),
              soDate: res.getValue(cols[2]),
              soAmount: res.getValue(cols[3]),
              totalWOCosts: 0,
              woIds: []
            })
          });

          var soIds = levelOne.map(m => m.id);

          var mainSearch = search.load({
            id: Level1Main
          });

          // Mode filter
          if (params.mode == 'costing') {
            log.debug('mainSearch-mode-l1', 'costing');
            mainSearch.filters.push(search.createFilter({
              name: 'status',
              operator: search.Operator.ANYOF,
              values: ['WorkOrd:H']
            }));
          } else {
            // WIP mode
            log.debug('mainSearch-mode-l1', 'wip');
            mainSearch.filters.push(search.createFilter({
              name: 'status',
              operator: search.Operator.NONEOF,
              values: ['WorkOrd:H']
            }));
          }

          log.debug("soids", soIds);

          if (soIds.length > 0) {
            var mainFilters = mainSearch.filterExpression;
            mainFilters.push('AND');

            mainFilters.push(['custbody_cnt_created_fm_so', 'anyof', soIds]);
            mainSearch.filterExpression = mainFilters;
          }

          getAllSSResult(mainSearch.run()).forEach(function (res, line) {
            var cols = res.columns;
            let soId = res.getValue(cols[5]);
            let woId = res.getValue(cols[4]);
            let idx = levelOne.findIndex(fi => fi.id == soId);

            if (idx > -1)
              levelOne[idx].woIds.push(woId);
          });

          var woIds = [];

          for (wo of levelOne)
            woIds = woIds.concat(wo.woIds);

          var detailSearch = search.load({
            id: Level1Details
          });

          // Mode filter
          if (params.mode == 'costing') {
            log.debug('detailSearch-mode-l1', 'costing');
            detailSearch.filters.push(search.createFilter({
              name: 'status',
              join: 'createdfrom',
              operator: search.Operator.ANYOF,
              values: ['WorkOrd:H']
            }));
          } else {
            // WIP mode
            log.debug('detailSearch-mode-l1', 'wip');
            detailSearch.filters.push(search.createFilter({
              name: 'status',
              join: 'createdfrom',
              operator: search.Operator.NONEOF,
              values: ['WorkOrd:H']
            }));
          }

          if (woIds.length > 0) {
            detailSearch.filters.push(search.createFilter({
              name: 'createdfrom',
              operator: 'anyof',
              values: woIds,
            }));
          }

          getAllSSResult(detailSearch.run()).forEach(function (res, line) {
            var cols = res.columns;
            let woId = res.getValue(cols[2]);
            let amountCredit = parseFloat(res.getValue(cols[1])) || 0;
            let idx = levelOne.findIndex(fi => fi.woIds.indexOf(woId) > -1);

            if (idx > -1)
              levelOne[idx].totalWOCosts += amountCredit;
          });

          levelOne.forEach(function (res, line) {
            var csvText = '';
            var soAmount = res.soAmount ? parseFloat(res.soAmount).toFixed(2) : 0;
            var totalWOCosts = res.totalWOCosts ? parseFloat(res.totalWOCosts).toFixed(2) : 0;
            var grossMargin = ((Number(res.soAmount) - Number(res.totalWOCosts)) / Number(res.soAmount)) * 100;
            grossMargin = grossMargin ? grossMargin.toFixed(2) : '100';

            if ((res.soNumber).match(/(href="https:\/\/)/gi)) {
              res.soNumber = ((res.soNumber).match(/(\>.*?\<)/gi) || [''])[0].replace(/[\<\>]/gi, '');
            }

            csvText += `"${res.customer}",`;
            csvText += `"${res.soNumber}",`;
            csvText += `"${JSON.stringify(res.soDate)}",`;
            csvText += `"${soAmount}",`;
            csvText += `"${totalWOCosts}",`;
            csvText += `"${grossMargin}"`;

            csvFile.appendLine({
              value: csvText
            });
          });
        } // end level 1

        // Level 2
        if (context.key == 'Level2') {
          var levelTwo = [];
          var Level2Material = script.getParameter('custscript_wip_report_export_csv_2_1');
          var Level2Labor = script.getParameter('custscript_wip_report_export_csv_2_2');

          // Mode filter
          if (params.mode == 'costing') {
            log.debug('searchReport-mode-l2', 'costing');
            searchReport.filters.push(search.createFilter({
              name: 'status',
              operator: search.Operator.ANYOF,
              values: ['WorkOrd:H']
            }));
          } else {
            // WIP mode
            log.debug('searchReport-mode-l2', 'wip');
            searchReport.filters.push(search.createFilter({
              name: 'status',
              operator: search.Operator.NONEOF,
              values: ['WorkOrd:H']
            }));
          }

          levelTwo = getAllSSResult(searchReport.run()).map(m => ({
            customer: { txt: m.getText(m.columns[0]) || ' ', id: m.getValue(m.columns[0]) || ' ' },
            so: { txt: (m.getText(m.columns[1]) || ' ').replace(/sales order #/gi, ''), id: m.getValue(m.columns[1]) },
            wo: { txt: m.getValue(m.columns[2]) || ' ', id: Number(m.id) },
            outsource: m.getText(m.columns[3]) || m.getValue(m.columns[3]) || ' ',
            division: { txt: m.getText(m.columns[4]) || ' ', id: m.getValue(m.columns[4]) },
            wostatus: m.getText(m.columns[5]) || m.getValue(m.columns[5]) || ' ',
            materialCost: 0,
            laborCost: 0,
            oh: 0,
            goldCost: 0,
            enepigGold: 0,
            enepigPalladium: 0,
            totalCost: 0,
          }));

          let woIds = levelTwo.map(m => m.wo.id)

          var matSearch = search.load({
            id: Level2Material
          });

          // Mode filter
          if (params.mode == 'costing') {
            log.debug('matSearch-mode-l2', 'costing');
            matSearch.filters.push(search.createFilter({
              name: 'status',
              join: 'createdfrom',
              operator: search.Operator.ANYOF,
              values: ['WorkOrd:H']
            }));
          } else {
            // WIP mode
            log.debug('matSearch-mode-l2', 'wip');
            matSearch.filters.push(search.createFilter({
              name: 'status',
              join: 'createdfrom',
              operator: search.Operator.NONEOF,
              values: ['WorkOrd:H']
            }));
          }

          if (woIds.length) {
            matSearch.filters.push(search.createFilter({
              name: 'createdfrom',
              operator: search.Operator.ANYOF,
              values: woIds
            }));

            getAllSSResult(matSearch.run()).forEach(res => {
              let woId = res.getValue({ name: 'createdfrom', summary: 'GROUP' })
              let idx = levelTwo.findIndex(fi => fi.wo.id == woId)

              if (idx > -1)
                levelTwo[idx].materialCost += parseFloat(res.getValue(res.columns[6]))
            });
          }

          var laborSearch = search.load({
            id: Level2Labor
          });

          // Mode filter
          if (params.mode == 'costing') {
            log.debug('laborSearch-mode-l2', 'costing');
            laborSearch.filters.push(search.createFilter({
              name: 'status',
              join: 'createdfrom',
              operator: search.Operator.ANYOF,
              values: ['WorkOrd:H']
            }));
          } else {
            // WIP mode
            log.debug('laborSearch-mode-l2', 'wip');
            laborSearch.filters.push(search.createFilter({
              name: 'status',
              join: 'createdfrom',
              operator: search.Operator.NONEOF,
              values: ['WorkOrd:H']
            }));
          }

          if (woIds.length) {
            laborSearch.filters.push(search.createFilter({
              name: 'createdfrom',
              operator: search.Operator.ANYOF,
              values: woIds
            }));

            getAllSSResult(laborSearch.run()).forEach(res => {
              let woId = res.getValue({ name: 'createdfrom', summary: 'GROUP' })
              let idx = levelTwo.findIndex(fi => fi.wo.id == woId)

              if (idx > -1) {
                levelTwo[idx].laborCost += parseFloat(res.getValue(res.columns[6]));
                levelTwo[idx].oh += parseFloat(res.getValue(res.columns[7]));
                levelTwo[idx].goldCost += parseFloat(res.getValue(res.columns[8]));
                levelTwo[idx].enepigGold += parseFloat(res.getValue(res.columns[9]));
                levelTwo[idx].enepigPalladium += parseFloat(res.getValue(res.columns[10]));
              }
            });
          }

          // Compute total cost
          levelTwo = levelTwo.map(m => {
            m.totalCost = m.materialCost + m.laborCost + m.oh + m.goldCost + m.enepigGold + m.enepigPalladium;
            return m;
          });

          levelTwo.forEach(function (res, line) {
            var csvText = '';
            var outsource = res.outsource == true ? 'Y' : 'N';
            var materialCost = res.materialCost ? res.materialCost.toFixed(2) : 0;
            var laborCost = res.laborCost ? res.laborCost.toFixed(2) : 0;
            var oh = res.oh ? res.oh.toFixed(2) : 0;
            var goldCost = res.goldCost ? res.goldCost.toFixed(2) : 0;
            var enepigGold = res.enepigGold ? res.enepigGold.toFixed(2) : 0;
            var enepigPalladium = res.enepigPalladium ? res.enepigPalladium.toFixed(2) : 0;
            var totalCost = res.totalCost ? res.totalCost.toFixed(2) : 0;

            csvText += `"${res.customer.txt}",`;
            csvText += `"${res.so.txt}",`;
            csvText += `"${res.wo.txt}",`;
            csvText += `"${outsource}",`;
            csvText += `"${res.division.txt}",`;
            csvText += `"${res.wostatus}",`;
            csvText += `"${materialCost}",`;
            csvText += `"${laborCost}",`;
            csvText += `"${oh}",`;
            csvText += `"${goldCost}",`;
            csvText += `"${enepigGold}",`;
            csvText += `"${enepigPalladium}",`;
            csvText += `"${totalCost}",`;

            csvFile.appendLine({
              value: csvText
            });
          });
        } // end level 2

        // Level 3
        if (context.key == 'Level3') {
          var Level3MatCost = script.getParameter('custscript_wip_report_export_csv_3_1');

          // Load Material Cost
          var materialCostSearch = search.load({
            id: Level3MatCost
          });

          // Mode filter
          if (params.mode == 'costing') {
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

            matCostArrayOfObjs.push(lineObj);
            w++;
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

            gateTimesOpsArrayOfObjs.push(lineObj);
            y++;
          });

          var woCompLinesArrayOfObjs = [];
          var woIdsLvlThree = []; // 06292022 fix for setup time
          var p = 0;

          // Mode filter
          if (params.mode == 'costing') {
            log.debug('searchReport-mode-l3', 'costing');
            searchReport.filters.push(search.createFilter({
              name: 'status',
              join: 'createdfrom',
              operator: search.Operator.ANYOF,
              values: ['WorkOrd:H']
            }));
          } else {
            // WIP mode
            log.debug('searchReport-mode-l3', 'wip');
            searchReport.filters.push(search.createFilter({
              name: 'status',
              join: 'createdfrom',
              operator: search.Operator.NONEOF,
              values: ['WorkOrd:H']
            }));
          }

          getAllSSResult(searchReport.run()).forEach(function (res, line) {
            var lineObj = {};
            lineObj.createdFromSODocNum = res.getValue(res.columns[0]);
            lineObj.createdFromWODocNum = res.getText(res.columns[1]);
            lineObj.createdFromWOId = res.getValue(res.columns[1]);
            lineObj.operationName = res.getValue(res.columns[2]);
            lineObj.division = res.getText(res.columns[3]);
            lineObj.laborCost = res.getValue(res.columns[4]);
            lineObj.overHeadCost = res.getValue(res.columns[5]);
            lineObj.goldCost = res.getValue(res.columns[6]);
            lineObj.enepigGoldCost = res.getValue(res.columns[7]);
            lineObj.enepigPalladiumCost = res.getValue(res.columns[8]);
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
            var setupTimeCompletedQtyObjCount = setupTimeCompletedQtyObj.runPaged().count;

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
            log.debug("setupTimeCompletedQty", JSON.stringify(setupTimeCompletedQty));
          }
          // insert here end

          for (var a = 0; a < woCompLinesArrayOfObjs.length; a++) {
            var csvText = '';
            var seqNum = '';
            var operation = '';

            var woComp = woCompLinesArrayOfObjs[a];
            var woId = woComp.createdFromWOId;
            var operationName = woComp.operationName;

            // Search gate times and operations
            var gateGroup = ' ';
            var setup = 0;
            var compQty = 0;
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
                compQty = setupTimeCompletedQty[woId][operationName];
                setup *= compQty || 0;
                timePerPanel = gateTimesOpsObj.wipTime ? Number(gateTimesOpsObj.wipTime) : 0;
              }
            }

            // Search material cost
            var matCostObj = matCostArrayOfObjs.find(cost => cost.woId == woId);
            var materialCost = 0;

            if (seqNum && seqNum == '10') {
              materialCost = matCostObj ? Number(matCostObj.materialCost).toFixed(2) : 0;
            }

            var laborCost = woComp.laborCost ? Number(woComp.laborCost).toFixed(2) : 0;
            var overHeadCost = woComp.overHeadCost ? Number(woComp.overHeadCost).toFixed(2) : 0;
            var goldCost = woComp.goldCost ? Number(woComp.goldCost).toFixed(2) : 0;
            var enepigGoldCost = woComp.enepigGoldCost ? Number(woComp.enepigGoldCost).toFixed(2) : 0;
            var enepigPalladiumCost = woComp.enepigPalladiumCost ? Number(woComp.enepigPalladiumCost).toFixed(2) : 0;
            var lineWIP = (Number(laborCost) + Number(overHeadCost) + Number(goldCost) + Number(enepigGoldCost)
              + Number(enepigPalladiumCost) + Number(materialCost)).toFixed(2);
            var woDocNum = (woComp.createdFromWODocNum).split(' ').splice(-1)[0];
            var soDocNum = woComp.createdFromSODocNum ? (woComp.createdFromSODocNum).split(' ').splice(-1)[0] : '';
            var division = woComp.division ? woComp.division : ' ';
            var quantity = woComp.quantity ? woComp.quantity : 0;
            var boardsPerPanel = woComp.boardsPerPanel ? Number(woComp.boardsPerPanel).toFixed(0) : 0;
            var panelsPerCore = woComp.panelsPerCore ? Number(woComp.panelsPerCore).toFixed(0) : 0;
            var totalNumCores = woComp.totalNumCores && !isNaN(woComp.totalNumCores) ? Number(woComp.totalNumCores).toFixed(0) : 0;

            csvText += `"${soDocNum}",`;
            csvText += `"${woDocNum}",`;
            csvText += `"${division}",`;
            csvText += `"${operation}",`;
            csvText += `"${operationName}",`;
            csvText += `"${setup}",`;
            csvText += `"${timePerPanel}",`;
            csvText += `"${gateGroup}",`;
            csvText += `"${quantity}",`;
            csvText += `"${boardsPerPanel}",`;
            csvText += `"${panelsPerCore}",`;
            csvText += `"${totalNumCores}",`;
            csvText += `"${setup + timePerPanel}",`;
            csvText += `"${laborCost}",`;
            csvText += `"${overHeadCost}",`;
            csvText += `"${materialCost}",`;
            csvText += `"${goldCost}",`;
            csvText += `"${enepigGoldCost}",`;
            csvText += `"${enepigPalladiumCost}",`;
            csvText += `"${lineWIP}",`;

            csvFile.appendLine({
              value: csvText
            });
          }
        } // end level 3

        // Level 4
        if (context.key == 'Level4') {
          var Level4ItemCost = script.getParameter('custscript_wip_report_export_csv_4_1');

          // Load Item Cost
          var itemCostSearch = search.load({
            id: Level4ItemCost
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

          var woIssueLinesArrayOfObjs = [];
          var b = 0;

          // Mode filter
          if (params.mode == 'costing') {
            log.debug('searchReport-mode-l4', 'costing');
            searchReport.filters.push(search.createFilter({
              name: 'status',
              join: 'createdfrom',
              operator: search.Operator.ANYOF,
              values: ['WorkOrd:H']
            }));
          } else {
            // WIP mode
            log.debug('searchReport-mode-l4', 'wip');
            searchReport.filters.push(search.createFilter({
              name: 'status',
              join: 'createdfrom',
              operator: search.Operator.NONEOF,
              values: ['WorkOrd:H']
            }));
          }

          getAllSSResult(searchReport.run()).forEach(function (res, line) {
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
            lineObj.woiLineCost = res.getValue(res.columns[9]);
            lineObj.woiLocation = res.getText(res.columns[13]);

            lineObj.createdFromSOId = res.getValue({ name: 'internalid', join: 'CUSTBODY_CNT_CREATED_FM_SO' });
            lineObj.createdFromWOId = res.getValue({ name: 'internalid', join: 'createdFrom' });

            woIssueLinesArrayOfObjs.push(lineObj);
            b++;
          });

          var sumsCountResultsArrayOfObjs = getTotalNumsOfWOIs();

          for (var z = 0; z < woIssueLinesArrayOfObjs.length; z++) {
            var csvText = '';
            var woDocNumberReturned = woIssueLinesArrayOfObjs[z].createdFromWODocNum;
            var woiItemReturned = woIssueLinesArrayOfObjs[z].woiItem;
            // log.debug('woDocNumberReturned / woiItemReturned is:', woDocNumberReturned +' / '+ woiItemReturned);

            var itemId = woIssueLinesArrayOfObjs[z].woiItemId;
            var itemLocation = woIssueLinesArrayOfObjs[z].woiLocation;

            // FindIndex of the total number of the WOISSUES property that's the same index as our WODOCNUMBER
            var woiLuk = woIssueLinesArrayOfObjs[z].woiLineUniqueKey;
            //log.debug('Searching for LUK:', woiLuk);
            var createdFromSOCustomer = '';
            var createdFromSO = '';
            var elementPosition = woIssueLinesArrayOfObjs.map(function (x) { return x.woiLineUniqueKey; }).indexOf(woiLuk);

            if (elementPosition != -1) {
              createdFromSOCustomer = woIssueLinesArrayOfObjs[elementPosition].createdFromSOCustomer;
              createdFromSO = woIssueLinesArrayOfObjs[elementPosition].createdFromSODocNum;
              createdFromSOid = woIssueLinesArrayOfObjs[elementPosition].createdFromSOId;
              workOrderId = woIssueLinesArrayOfObjs[elementPosition].createdFromWOId;
              woDocNum = woIssueLinesArrayOfObjs[elementPosition].createdFromWODocNum;
              //log.debug('Found createdFromSO / createdFromSOCustomer:', createdFromSO +' / '+ createdFromSOCustomer);
            }

            var sumItems = '';
            var sumWOIssues = '';
            var elementPosition = sumsCountResultsArrayOfObjs.map(function (x) { return x.wodocnum; }).indexOf(woDocNumberReturned);

            if (elementPosition != -1) {
              sumWOIssues = sumsCountResultsArrayOfObjs[elementPosition].sumwoissues;
            }

            // Search item cost
            var itemCostObj = itemCostArrayOfObjs.find(cost => cost.itemId == itemId && cost.location == itemLocation);
            var woiItemCount = woIssueLinesArrayOfObjs[z].woiLineId ? woIssueLinesArrayOfObjs[z].woiLineId : ' ';
            var woiIssueCount = sumWOIssues ? sumWOIssues : 0;
            var partNum = woIssueLinesArrayOfObjs[z].woiItem ? woIssueLinesArrayOfObjs[z].woiItem : ' ';
            var lotNum = woIssueLinesArrayOfObjs[z].woiItemInvNum ? woIssueLinesArrayOfObjs[z].woiItemInvNum : ' ';
            var partQty = woIssueLinesArrayOfObjs[z].woiItemInvQty ? woIssueLinesArrayOfObjs[z].woiItemInvQty : ' ';
            var cost = itemCostObj ? Number(itemCostObj.itemCost).toFixed(2) : 0;
            var lineTotal = woIssueLinesArrayOfObjs[z].woiLineCost ? Number(woIssueLinesArrayOfObjs[z].woiLineCost).toFixed(2) : 0;

            csvText += `"${createdFromSOCustomer}",`;
            csvText += `"${createdFromSO}",`;
            csvText += `"${woDocNum}",`;
            csvText += `"${woiItemCount}",`;
            csvText += `"${woiIssueCount}",`;
            csvText += `"${partNum}",`;
            csvText += `"${lotNum}",`;
            csvText += `"${partQty}",`;
            csvText += `"${cost}",`;
            csvText += `"${lineTotal}"`;

            csvFile.appendLine({
              value: csvText
            });
          }
        }

        var fileId = csvFile.save();
        log.debug('fileId', fileId);

        context.write({
          key: context.key,
          value: file.load({
            id: fileId
          }).url
        });
      } catch (e) {
        log.error('REDUCE ERROR', e);
      }
    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
      try {
        var script = runtime.getCurrentScript();
        var params = JSON.parse(script.getParameter('custscript_wip_report_export_csv_params') || '{}');
        var defaultSender = script.getParameter('custscript_wip_report_export_sender');
        var defaultRecipient = script.getParameter('custscript_wip_report_export_recipient');

        var domain = url.resolveDomain({
          hostType: url.HostType.APPLICATION
        });
        var fileURL = ``;
        summary.output.iterator().each((key, value) => {
          fileURL += `<p>${key}: <a href="https://${domain}${value}">Click me!</a></p>`;
          return true;
        });

        var msg = `<p>Greetings,</p>
             <p>Please click attached URL's to download the CSV file of WIP Report you've requested.</p>
             ${fileURL}
             <br/><p>Thanks!</p>
             <p>NS Team</p>`;

        log.debug({
          title: 'before send',
          details: 'here'
        })

        log.debug({
          title: 'params',
          details: params + Object.keys(params).length
        })

        email.send({
          author: (Object.keys(params).length != 0) ? params.user : defaultSender,//-5
          recipients: (Object.keys(params).length != 0) ? (params.recipients || [params.user]) : defaultRecipient,
          subject: 'WIP Report Export',
          body: msg
        });


        log.debug({
          title: 'after send',
          details: 'here'
        })

        search.create({
          type: 'file',
          filters: [['folder', 'anyof', '981'], 'AND',
          ['created', 'before', 'lastweektodate']],
          columns: [{ name: 'internalid' }]
        }).run().getRange(0, 1000).forEach(res => {
          file.delete({ id: res.id });
        });
      } catch (e) {
        log.error('SUMMARIZE ERROR', e);
      }
    }

    const getAllSSResult = searchResultSet => {
      var result = [];
      for (var x = 0; x <= result.length; x += 1000)
        result = result.concat(searchResultSet.getRange(x, x + 1000) || []);
      return result;
    };

    const addCommas = (x) => {
      var parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
    }

    function getTotalNumsOfWOIs() {
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
      // log.debug("workorderSearchObj result count",searchResultCount);

      getAllSSResult(workorderSearchObj.run()).forEach(function (res, line) {
        var lineObj = {};
        lineObj.wodocnum = res.getValue({ name: "tranid", summary: "GROUP" });
        lineObj.sumwoissues = res.getValue({ name: "internalid", join: "applyingTransaction", summary: "COUNT" });

        totalNumOfWOIssuesAgainstWOsGrouped.push(lineObj);
      });

      // log.debug('totalNumOfWOIssuesAgainstWOsGrouped is:', JSON.stringify(totalNumOfWOIssuesAgainstWOsGrouped));
      return totalNumOfWOIssuesAgainstWOsGrouped;
    }

    return {
      getInputData: getInputData,
      map: map,
      reduce: reduce,
      summarize: summarize
    };
  });
