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
			var Level1 = script.getParameter('custscript_wipreportexcel_lvl1search');
			var Level2 = script.getParameter('custscript_wipreportexcel_lvl2search');
			var Level3 = script.getParameter('custscript_wipreportexcel_lvl3search');
			var Level4 = script.getParameter('custscript_wipreportexcel_lvl4search');

			var params = script.getParameter('custscript_wipreportexport_params');

log.debug('params', params);

			return { Level1, Level2, Level3, Level4 };
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
			try{
				var script = runtime.getCurrentScript();
				var params = JSON.parse(script.getParameter('custscript_wipreportexport_params') || '{}');

				var excelCols = [];
				switch(context.key){
					case 'Level1': 
						excelCols = [
							{ name: 'Customer', type: 'String' },
							{ name: 'SO#', type: 'String' },
							{ name: 'SO Date', type: 'String' },
							{ name: 'SO Amount', type: 'Number'},
							{ name: 'Total Costs', type: 'Number'},
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
							{ name: 'Extra', type: 'Number' },
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
							{ name: 'Setup (HH:MM)', type: 'String' },
							{ name: 'Time/Panel (HH:MM)', type: 'String' },
							{ name: 'Gate Group', type: 'String' },
							{ name: 'Qty', type: 'Number' },
							{ name: 'BDS/Panel', type: 'Number' },
							{ name: '#Panels', type: 'Number' },
							{ name: '#Cores', type: 'Number' },
							{ name: 'Time (Min)', type: 'Number' },
							{ name: 'Labor', type: 'Number' },
							{ name: 'OH', type: 'Number' },
							{ name: 'Material', type: 'Number' },
							{ name: 'Gold', type: 'Number' },
							{ name: 'Enepig Gold', type: 'Number' },
							{ name: 'Enepig Palladium', type: 'Number' },
							{ name: 'Extra', type: 'Number' },
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

log.debug('csvHeader', csvHeader);

				var xdate = params.endDate? format.parse({
					type: format.Type.DATE,
					value: params.endDate
				}): new Date();
				xdate = ((date)=>{
					var mm = (date.getMonth()+1).toString();
					var dd = date.getDate().toString();
					var yyyy = date.getFullYear().toString();

					mm = mm.length>1? mm: `0${mm}`;
					dd = dd.length>1? dd: `0${dd}`;

					return `${mm}-${dd}-${yyyy}`;
				})(xdate);

				var csvFileName = `WIP-Report-${context.key}_${params.user}_${xdate}.CSV`;
				var csvFile = file.create({
					name: csvFileName,
					fileType: file.Type.CSV,
					contents: csvHeader + '\n',
					folder: '3555',
					isOnline: true
				});

				// Load saved search and parsed all values to excel data
				var lvl4ReportData = {
					woIssueIds: []
				};
				var searchReport = search.load({
					id: context.values[0]
				});

				if(params.wipMode){
					searchReport.filters.pop();

					searchReport.filters.push(search.createFilter({
						name: 'status',
						join: 'custbody_cnt_created_fm_so',
						operator: search.Operator.ANYOF,
						values: ['SalesOrd:G']
					}));

					if(params.wipMode == 'costing')
						searchReport.filters(search.createFilter({
							name: 'status',
							operator: search.Operator.ANYOF,
							values: ['WordOrd:H']
						}));
				}

				if(params.endDate)
					searchReport.filters.push(search.createFilter({
						name: 'trandate',
						operator: search.Operator.ONORBEFORE,
						values: params.endDate
					}));
				if(params.soFilterValue)
					searchReport.filters.push(search.createFilter({
						name: 'number',
						join: 'custbody_cnt_created_fm_so',
						operator: search.Operator.EQUALTO,
						values: params.soFilterValue
					}));

				if(context.key.match(/level2|level3/gi)){

					if(params.woFilterValue)
						searchReport.filters.push(search.createFilter({
							name: 'number',
							operator: search.Operator.EQUALTO,
							values: params.woFilterValue
						}));

					if(params.divisionFilterValue)
						searchReport.filters.push(search.createFilter({
							name: 'department',
							operator: search.Operator.ANYOF,
							values: params.divisionFilterValue
						}));
				}

				getAllSSResult( searchReport.run() ).forEach( (res) => {
					var csvText = '';
					var cols = res.columns;

					var columnCount = cols.length < excelCols.length? cols.length : excelCols.length;

					var otherData = {};
					if(context.key == 'Level3'){ // ********* LEVEL 3 ADDITIONAL DATA **********//
						var opName = res.getValue(cols[3]);// Operation Name

						otherData = res.getValue(cols[13]) || '';

						var regEx = new RegExp('({.*?(' + opName + '.*?}))','gi');

						otherData = JSON.parse(`[${otherData.replace(/[\\]/gi,'').match(regEx)}]`);
						otherData = otherData[0] || {};

						var otherData2 = res.getValue(cols[14]) || '';
						otherData2 = JSON.parse(`[${otherData2.replace(/[\\]/gi,'').match(regEx)}]`);

						if(otherData2[0])
							for(var x in otherData2[0])
								otherData[x] = otherData2[0][x];

						var otherData3 = res.getValue(cols[15]) || '';
						otherData3 = JSON.parse(`[${otherData3.replace(/[\\]/gi,'').match(regEx)}]`);

						if(otherData3[0])
							for(var x in otherData3[0])
								otherData[x] = otherData3[0][x];


					} else if( context.key == 'Level4') { // ********* LEVEL 3 ADDITIONAL DATA **********//

						lvl4ReportData.woIssueIds.push(res.getValue(cols[3]));

						var xdata = {};
						cols.forEach((col)=>{
							xdata[(col.join? col.join.toLowerCase() + '*':'') + col.name] = res.getText(col) || res.getValue(col);
						});


						var key = xdata['applyingtransaction*internalid'] + '*' + xdata['applyingtransaction*lineuniquekey'];

						lvl4ReportData[key] = xdata;

						return true;
					}

					cols.forEach((col, ind) => {
						if(ind >= columnCount)
							return true;

						if(context.key == 'Level1' && ind == 5)
							return true;

						if(context.key == 'Level3' && ind == 11){
							(
								['laborcost','overheadcost','materialcost','goldcost','enepiggoldcost','enepigpalladiumcost','lineextracost','linetotal']
							).forEach((id) => {
								csvText += `"${otherData[id] || 0}",`;
							});
							return true;
						}else if(context.key == 'Level3' && ind > 11)
							return true;

						var value = res.getText(col) || res.getValue(col) || (excelCols[ind].type == 'String'? '': '0');
						value = value === true? 'Yes': value === false? 'No': value;

						if(value.match(/(href="https:\/\/)/gi)){
							value = (value.match(/(\>.*?\<)/gi) || [''])[0].replace(/[\<\>]/gi,'');
						}

						csvText += `"${value}",`;

						if(context.key == 'Level1' && ind == 4){
							var grossMargin = ((Number(res.getValue(cols[3])) - Number(res.getValue(cols[4]))) / Number(res.getValue(cols[3]))) * 100;
							csvText += `"${grossMargin}",`
						}
					});

					csvFile.appendLine({
						value: csvText
					});
				});

				// ************ LEVEL 4 SECOND SEARCH ********************
				if(context.key == 'Level4'){
					var workOrderIssuesCount = getTotalNumsOfWOIs();

					var formulaStringFull = `formulanumeric: CASE {internalid} WHEN ${lvl4ReportData.woIssueIds.join(' THEN 1 WHEN ')} THEN 1 ELSE 0 END`;
					var filtersArray = [];
					filtersArray.push(["type","anyof","WOIssue"]);
					filtersArray.push("AND");
					filtersArray.push(["mainline","is","F"]);
					filtersArray.push("AND");
					filtersArray.push(["cogs","is","F"]);
					filtersArray.push("AND");
					filtersArray.push(["taxline","is","F"]);
					filtersArray.push("AND");
					filtersArray.push(["shipping","is","F"]);
					filtersArray.push("AND");
					filtersArray.push(["quantity","greaterthan","0"]);
					filtersArray.push("AND");
					filtersArray.push(["appliedtotransaction.number","isnotempty",""]);
					filtersArray.push("AND");
					filtersArray.push([formulaStringFull,"equalto","1"]);

					getAllSSResult(search.create({
						type: "workorderissue",
						filters: filtersArray,
						columns: [
							search.createColumn({name: "internalid", label: "Internal ID"}),
							search.createColumn({name: "trandate", sort: search.Sort.DESC, label: "Date"}),
							search.createColumn({name: "type", label: "Type"}),
							search.createColumn({name: "tranid", label: "Document Number"}), //WORK ORDER ISSUE doc num
							search.createColumn({name: "tranid", join: "appliedToTransaction", label: "Document Number"}), //WORK ORDER doc num
							search.createColumn({name: "item", label: "Item"}),
							search.createColumn({name: "inventorynumber", join: "inventoryDetail", label: " Number"}),
							search.createColumn({name: "quantity", join: "inventoryDetail", label: "Quantity"}),
							search.createColumn({name: "cost", join: "item", label: "Purchase Price"}),
							search.createColumn({name: "lineuniquekey", label: "Line Unique Key"}),
							search.createColumn({name: "line", label: "Line ID"}),
							search.createColumn({name: "cost", join: "item", label: "Purchase Price"}),
							search.createColumn({name: "lastpurchaseprice", join: "item", label: "Last Purchase Price"}),
							search.createColumn({name: "formulacurrency",	formula: "CASE WHEN {item.cost} IS NOT NULL THEN ({item.cost} * {inventorydetail.quantity}) WHEN {item.lastpurchaseprice} IS NOT NULL THEN ({item.lastpurchaseprice} * {inventorydetail.quantity}) ELSE 0.00 END", label: "Inventory Detail Line Cost"
							})
						]
					}).run()).forEach((res,line)=>{
						var cols = res.columns;
						var xdata = {};
						cols.forEach((col)=>{
							xdata[(col.join? col.join.toLowerCase() + '*':'') + col.name] = res.getText(col) || res.getValue(col);
						});

						var key = xdata.internalid + '*' + xdata.lineuniquekey;

						var csvText = `"${lvl4ReportData[key]['custbody_cnt_created_fm_so*entity']}","${lvl4ReportData[key]['custbody_cnt_created_fm_so*tranid']}","${lvl4ReportData[key].tranid}","${xdata.line}","${workOrderIssuesCount[lvl4ReportData[key].tranid] || 0}","${xdata.item}","${xdata['inventorydetail*inventorynumber']}","${xdata['inventorydetail*quantity']}","${xdata['item*cost'] || xdata['item*lastpurchaseprice']}","${xdata.formulacurrency}"`;

						csvFile.appendLine({
							value: csvText
						});
					})
				}

				var fileId = csvFile.save();

				context.write({
					key: context.key,
					value: file.load({
						id: fileId
					}).url
				});
			}catch(e){
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
			try{
				var script = runtime.getCurrentScript();
				var params = JSON.parse(script.getParameter('custscript_wipreportexport_params') || '{}');
				
				var domain = url.resolveDomain({
					hostType: url.HostType.APPLICATION
				});
				var fileURL = ``;
				summary.output.iterator().each( (key, value) => {
					fileURL += `<p>${key}: <a href="https://${domain}${value}">Click me!</a></p>`;
					return true;
				});

/*
				var xlsFile = file.create({
					name: 'WIP Report.xls',
					fileType: 'EXCEL',
					contents: base64ExcelString
				});
				xlsFile.folder = 3046;
				xlsFile.save();
*/
				var msg = `<p>Greetings,</p>
					<p>Please click attached URL's to download the CSV file of WIP Report you've requested.</p>
					${fileURL}
					<br/><p>Thanks!</p>
					<p>NS Team</p>`;

				email.send({
					author: params.user,//-5
					recipients: params.recipients || [params.user],
					subject: 'WIP Report Export',
					body: msg
				});


				search.create({
					type: 'file',
					filters: [['folder', 'anyof', '3555'], 'AND',
						['created', 'before', 'lastweektodate']],
					columns: [{ name: 'internalid' }]
				}).run().getRange(0,1000).forEach(res=>{
					file.delete({ id: res.id });
				});
			}catch(e){
				log.error('SUMMARIZE ERROR', e);
			}
		}

		const getAllSSResult = searchResultSet => {
			var result = [];
			for(var x=0;x<=result.length;x+=1000)
				result = result.concat(searchResultSet.getRange(x,x+1000)||[]);
			return result;
		};

		const addCommas = (x) => {
			var parts = x.toString().split(".");
			parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			return parts.join(".");
		}

		function getTotalNumsOfWOIs(){
			
	/**				
					if(enddateinput){
						//WORK ORDER TRANDATE or SALES ORDER TRANDATE??
						var dateInputFormatted = format.format({value: enddateinput, type: format.Type.DATE});
						var searchFilters = usedSearch.filters;
						searchFilters.push(search.createFilter({name: 'trandate', operator: 'onorbefore', values: dateInputFormatted}));
					}
	**/		
			var totalNumOfWOIssuesAgainstWOsGrouped = {};
			
			var workorderSearchObj = search.create({
			   type: "workorder",
			   filters:
			   [
				  ["type","anyof","WorkOrd"], 
				  "AND", 
				  ["custbody_cnt_created_fm_so","noneof","@NONE@"], 
				  "AND", 
				  ["custbody_cnt_created_fm_so.mainline","is","T"], 
				  "AND", 
				  ["custbody_cnt_created_fm_so.status","anyof","SalesOrd:B","SalesOrd:E","SalesOrd:F","SalesOrd:A","SalesOrd:D"], 
				  "AND", 
				  ["applyingtransaction.type","anyof","WOIssue"]
			   ],
			   columns:
			   [
				  search.createColumn({name: "tranid", summary: "GROUP", label: "Document Number"}),
				  search.createColumn({name: "internalid", join: "applyingTransaction", summary: "COUNT", label: "Internal ID"})
			   ]
			});
			var searchResultCount = workorderSearchObj.runPaged().count;
			getAllSSResult(workorderSearchObj.run()).forEach(function(res, line){
			   var lineObj = {};
			   //lineObj.customer = res.getValue({name: "entity", join: "CUSTBODY_CNT_CREATED_FM_SO", summary: "GROUP"});
			   //lineObj.soid = res.getValue({name: "tranid", join: "CUSTBODY_CNT_CREATED_FM_SO", summary: "GROUP"});
			   lineObj.wodocnum = res.getValue({name: "tranid", summary: "GROUP"});
			   //lineObj.sumitems = res.getValue({name: "item", join: "applyingTransaction", summary: "COUNT"});
			   lineObj.sumwoissues = res.getValue({name: "internalid", join: "applyingTransaction", summary: "COUNT"});
 
			   totalNumOfWOIssuesAgainstWOsGrouped[lineObj.wodocnum] = lineObj.sumwoissues;
			});
			
			return totalNumOfWOIssuesAgainstWOsGrouped;
		}

		return {
			getInputData: getInputData,
			map: map,
			reduce: reduce,
			summarize: summarize
		};
		
	}
);
