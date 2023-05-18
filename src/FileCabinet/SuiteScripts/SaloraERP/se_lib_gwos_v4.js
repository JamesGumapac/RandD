/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(['N/search'],
	(search) => {
		const module = {};
		module.getCASDetailsToDisplay = (pcbSsId, mainSsId, displayLImit) => {
			try {
				var searchId = mainSsId;

				var pcbSearch = search.load({id: pcbSsId});
				pcbSearch.columns = [
					search.createColumn({
						name: "formulatext",
						summary: "GROUP",
						formula: "SUBSTR( {custrecord_cntm_cso_operaton}, INSTR({custrecord_cntm_cso_operaton}, ' ')+1, 3 )"
					})
				]

				var arrOperation = getAllSSResult(pcbSearch.run()).map(res => {
						return res.getValue(res.columns[0])
					});

				var strFormula = "";
				if(arrOperation && arrOperation.length){
					strFormula += "CASE WHEN (";
					strFormula += "INSTR({custrecord_cntm_cso_operaton}, '" + arrOperation[0] + "') != 0";
					for(var i = 1; i < arrOperation.length; i++){
						strFormula += " OR INSTR({custrecord_cntm_cso_operaton}, '" + arrOperation[i] + "') != 0";
					}
					strFormula += ") THEN 1 ELSE 0 END"
				}



				var searchResults = ((ssId, par, strF) => {
					var ss = search.create({
						type: 'customrecord_cntm_clientappsublist',
						columns: [{
							name: 'internalid',
							join: 'custrecord_cntm_work_order',
							summary: 'GROUP',
							sort: 'ASC'
						},
							{
								name: 'custrecord_cntm_seq_no',
								summary: 'MIN',
								sort: 'ASC'
							},
							//                         {name: 'internalid', summary: 'MIN'}
						]
					});

					// ss.filterExpression = pcbSearch.filterExpression;
					//
					// ss.filterExpression = ss.filterExpression.concat([
					// 	"AND",["custrecord_cntm_work_order.mainline","is","T"],
					// 	"AND",["custrecord_cntm_work_order.status","noneof","WorkOrd:H"],
					// 	"AND",["custrecord_cntm_cso_status","anyof","1","3"],
					// 	"AND",["custrecord_cntm_work_order.internalid","noneof","1776405"]]);
					// 	["AND",["custrecord_cntm_work_order.mainline","is","T"],
					// 	"AND",["custrecord_cntm_work_order.status","noneof","WorkOrd:H"],
					// 	"AND",["custrecord_cntm_cso_status","anyof","1","3"],
					// 	"AND",["custrecord_cntm_work_order.internalid","noneof","1776405"]]
					// )

					ss.filters.push(search.createFilter({
							name: 'mainline',
							join: 'custrecord_cntm_work_order',
							operator: 'is',
							values: 'T'
						}), search.createFilter({
							name: 'status',
							join: 'custrecord_cntm_work_order',
							operator: 'noneof',
							values: 'WorkOrd:H' // exclude Closed Work Orders
						}), search.createFilter({
							name: 'custrecord_cntm_cso_status',
							operator: 'anyof',
							values: ['1', '3'] // Get only pending and in progress operation
						}),
						search.createFilter({ // temporary - this is to exclude the specific work order causing an error due to duplicated operation sequence
							name: 'internalid',
							join: 'custrecord_cntm_work_order',
							operator: 'noneof',
							values: '1776405'
						})
					);

					([
						'custrecord_cntm_work_order.entity', /*'workorder.internalid', */ 'custrecord_cntm_work_order.department' //, 'custrecord_operation_line_mwc'
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

					log.debug('ss.filters', ss.filters);
					log.debug('ss.filterExpression', ss.filterExpression);

					// Get result limit
					var limit = '';

					// Get all operation ids
					var sequence = getAllSSResult(ss.run(), limit).map(res => {
						return {
							wo: res.getValue(res.columns[0]),
							sequence: res.getValue(res.columns[1])
						};
					});

					var getIdFilter = sequence.map(a => `[["custrecord_cntm_work_order", "anyof", "${a.wo}"], "AND", ["custrecord_cntm_seq_no", "equalto", "${a.sequence}"]]`)
						.join('|OR|').split('|').map(a => a == 'OR' ? a : JSON.parse(a));
					var operationIds = getAllSSResult(search.create({
						type: 'customrecord_cntm_clientappsublist',
						filters: [
							['custrecord_cntm_cso_status', 'anyof', ['1', '3']], 'AND',
							getIdFilter
						],
						columns: [{
							name: 'custrecord_cntm_cso_parentrec',
							summary: 'GROUP'
						},
							{
								name: 'internalid',
								summary: 'MIN'
							}
						]
					}).run()).map(res => res.getValue(res.columns[1]));
					log.debug('operationIds', operationIds);

					// Get all other level pending operations
					operationIds = getOtherPendingOperation(sequence, operationIds);

					var detailedSearch = search.load({
						id: ssId
					});
					if (operationIds && operationIds.length > 0) {
						detailedSearch.filters.push(search.createFilter({
							name: 'internalid',
							operator: 'ANYOF',
							values: operationIds
						}));

						// if (par.custpage_operation) {
						// 	detailedSearch.filters.push(search.createFilter({
						// 		name: 'custrecord_cntm_cso_operaton',
						// 		operator: 'CONTAINS',
						// 		values: par.custpage_operation
						// 	}));
						// 	showing = detailedSearch.runPaged().count;
						// 	totalCount = showing;
						// }

						if(strFormula){
							detailedSearch.filters.push(
								search.createFilter({
									"name":"formulanumeric",
									"operator":"equalto",
									"values":[
										"1"
									],
									"formula": strF
								})
							);
						}

						log.debug('create filter', operationIds);
						return getAllSSResult(detailedSearch.run());
					} else {
						log.debug('no filter', operationIds);
						return [];
					}

				})(searchId, {custpage_operation: '5Z'}, strFormula);
				log.emergency('searchResults: ' + searchResults.length, searchResults);

				var arrCasIds = [];
				for(var i = 0; i < searchResults.length && i < displayLImit ; i++){
					arrCasIds.push(searchResults[i].id);
				}
				return arrCasIds;
			} catch (e) {
				log.debug('Error', e);
			}
		}

		const processDuplicatedOperation = (duplicatedOperation, sequence) => {

			var operationIds = [];
			var type = 'customrecord_cntm_clientappsublist';

			var filters = sequence.map(a => `[["custrecord_cntm_work_order", "anyof", "${a.wo}"], "AND", ["custrecord_cntm_seq_no", "equalto", "${a.sequence}"]]`)
				.join('|OR|').split('|').map(a => a == 'OR' ? a : JSON.parse(a));

			var resultsDup = {};
			getAllSSResult(search.create({
				type,
				filters: [filters, 'AND', ['custrecord_cntm_work_order.mainline', 'is', 'T']],
				columns: [{
					name: 'custrecord_cntm_work_order'
				},
					{
						name: 'custrecord_cntm_cso_status'
					},
					{
						name: 'custrecord_cntm_cso_pannellot'
					}
				]
			}).run()).forEach(res => {
				var wo = res.getValue(res.columns[0]);
				var stat = res.getValue(res.columns[1]);
				var panelLot = res.getValue(res.columns[2]);

				if (!resultsDup[wo])
					resultsDup[wo] = {
						completed: [],
						pending: []
					};

				resultsDup[wo][stat == '1' || stat == '3' ? 'pending' : 'completed'].push(panelLot);

			});

			var dupCompleted = {};
			for (var wo in resultsDup) {
				dupCompleted[wo] = [];

				resultsDup[wo].completed.forEach(op => {
					if (resultsDup[wo].pending.indexOf(op) < 0)
						dupCompleted[wo].push(op);
				});
			}

			filters = [];
			for (var wo in dupCompleted) {
				if (!dupCompleted[wo].length)
					continue;

				if (filters.length)
					filters.push('OR');

				var f = dupCompleted[wo].map(a => `["custrecord_cntm_cso_pannellot", "is", "${a}"]`).join('|OR|').split('|')
					.map(a => a == 'OR' ? a : JSON.parse(a));

				filters.push([
					['custrecord_cntm_work_order', 'is', wo], 'AND', f
				]);
			}

			if (!filters.length)
				return {
					sequence: [],
					operationIds
				};

			sequence = getAllSSResult(search.create({
				type,
				filters: [filters, 'AND', ['custrecord_cntm_cso_status', 'anyof', ['1', '3']], 'AND',
					['custrecord_cntm_work_order.mainline', 'is', 'T']
				],
				columns: [{
					name: 'internalid',
					join: 'custrecord_cntm_work_order',
					summary: 'GROUP',
					sort: 'ASC'
				},
					{
						name: 'custrecord_cntm_seq_no',
						summary: 'MIN',
						sort: 'ASC'
					}
				]
			}).run()).map(res => {
				return {
					wo: res.getValue(res.columns[0]),
					sequence: res.getValue(res.columns[1])
				};
			});

			if (!sequence.length)
				return {
					sequence,
					operationIds
				};

			var getIdFilter = sequence.map(a => `[["custrecord_cntm_work_order", "anyof", "${a.wo}"], "AND", ["custrecord_cntm_seq_no", "equalto", "${a.sequence}"]]`).join('|OR|').split('|').map(a => a == 'OR' ? a : JSON.parse(a));
			operationIds = getAllSSResult(search.create({
				type,
				filters: [
					['custrecord_cntm_cso_status', 'anyof', ['1', '3']], 'AND',
					getIdFilter
				],
				columns: [{
					name: 'internalid',
					join: 'custrecord_cntm_work_order',
					summary: 'GROUP',
					sort: 'ASC'
				},
					{
						name: 'internalid',
						summary: 'MIN'
					}
				]
			}).run()).map(res => {
				return res.getValue(res.columns[1]);
			});

			return {
				sequence,
				operationIds
			};

		};

		const getOtherPendingOperation = (sequence, operationIds) => {
			var toReturnIds = operationIds;

			var type = 'customrecord_cntm_clientappsublist';

			while (sequence.length) {

				// Get completed operations in the same sequence
				var filters = sequence.map(a => `[["custrecord_cntm_work_order", "anyof", "${a.wo}"], "AND", ["custrecord_cntm_seq_no", "equalto", "${a.sequence}"]]`)
					.join('|OR|').split('|').map(a => a == 'OR' ? a : JSON.parse(a));

				var completedOps = {};
				getAllSSResult(search.create({
					type,
					filters: [filters, 'AND', ['custrecord_cntm_cso_status', 'anyof', '4'], 'AND',
						['custrecord_cntm_work_order.mainline', 'is', 'T']
					],
					columns: [{
						name: 'custrecord_cntm_work_order'
					},
						{
							name: 'custrecord_cntm_cso_pannellot'
						}
					]
				}).run()).forEach(res => {
					var wo = res.getValue(res.columns[0]);

					if (!completedOps[wo])
						completedOps[wo] = [];

					completedOps[wo].push(res.getValue(res.columns[1]));

				});

				if (!Object.keys(completedOps).length)
					return toReturnIds;

				// Get another in progress sequence
				filters = [];
				for (var wo in completedOps) {
					if (filters.length)
						filters.push('OR');

					var f = completedOps[wo].map(a => `["custrecord_cntm_cso_pannellot", "is", "${a}"]`).join('|OR|').split('|')
						.map(a => a == 'OR' ? a : JSON.parse(a));

					filters.push([
						['custrecord_cntm_work_order', 'is', wo], 'AND', f
					]);
				}

				sequence = getAllSSResult(search.create({
					type,
					filters: [filters, 'AND', ['custrecord_cntm_cso_status', 'anyof', ['1', '3']], 'AND',
						['custrecord_cntm_work_order.mainline', 'is', 'T']
					],
					columns: [{
						name: 'internalid',
						join: 'custrecord_cntm_work_order',
						summary: 'GROUP',
						sort: 'ASC'
					},
						{
							name: 'custrecord_cntm_seq_no',
							summary: 'MIN',
							sort: 'ASC'
						}
					]
				}).run()).map(res => {
					return {
						wo: res.getValue(res.columns[0]),
						sequence: res.getValue(res.columns[1])
					};
				});

				if (!sequence.length)
					return toReturnIds;

				var getIdFilter = sequence.map(a => `[["custrecord_cntm_work_order", "anyof", "${a.wo}"], "AND", ["custrecord_cntm_seq_no", "equalto", "${a.sequence}"]]`).join('|OR|').split('|').map(a => a == 'OR' ? a : JSON.parse(a));
				var newOperationWorkOrder = {};
				operationIds = getAllSSResult(search.create({
					type,
					filters: [
						['custrecord_cntm_cso_status', 'anyof', ['1', '3']], 'AND',
						getIdFilter
					],
					columns: [{
						name: 'internalid',
						join: 'custrecord_cntm_work_order',
						summary: 'GROUP',
						sort: 'ASC'
					},
						{
							name: 'internalid',
							summary: 'MIN'
						}
					]
				}).run()).map(res => {
					newOperationWorkOrder[res.getValue(res.columns[1])] = res.getValue(res.columns[0]);

					return res.getValue(res.columns[1]);
				});
				var duplicatedOperation = [];
				for (var x = operationIds.length - 1; x >= 0; x--) {
					if (toReturnIds.indexOf(operationIds[x]) >= 0) {
						var id = operationIds.splice(x, 1)[0];

						duplicatedOperation.push(newOperationWorkOrder[id]);
					}
				}

				if (duplicatedOperation.length) {

					var xSeq = duplicatedOperation.map(wo => {
						var x = 0;
						var seq = '';
						while (!seq && x < sequence.length) {
							if (wo == sequence[x].wo) {
								seq = sequence[x].sequence;
								sequence.splice(x, 1);
							}

							x++;
						}

						return {
							wo,
							sequence: seq
						};
					});

					var dup = processDuplicatedOperation(duplicatedOperation, xSeq);


					sequence = sequence.concat(dup.sequence);
					operationIds = operationIds.concat(dup.operationIds);
				}

				if (operationIds.length)
					toReturnIds = toReturnIds.concat(operationIds);

			}

			return toReturnIds;

		};

		const getAllSSResult = (searchResultSet, limit) => {
			//log.debug('limit', limit);
			if (!limit)
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

		return module;
	}
);
