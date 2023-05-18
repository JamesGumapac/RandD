/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @NAuthor Jerome Morden
 */
define(['N/search'],
	(search) => {
		
		const getPendingOperations = (filters, limit, hasOperationFilter) => {

			var sequence = getAllSSResult( search.create({
				type: 'customrecord_cntm_clientappsublist',
				filters, columns: [
					{ name: 'internalid', join: 'custrecord_cntm_work_order', summary: 'GROUP', sort: 'ASC' },
					{ name: 'custrecord_cntm_seq_no', summary: 'MIN', sort: 'ASC' }
				]
			}).run(), limit ).map(res=>{
				return { wo: res.getValue(res.columns[0]), sequence: res.getValue(res.columns[1]) };
			});

			if(!sequence.length)
				return [];

			var getIdFilter = sequence.map(a=>`[["custrecord_cntm_work_order", "anyof", "${a.wo}"], "AND", ["custrecord_cntm_seq_no", "equalto", "${a.sequence}"]]`)
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

			if(!hasOperationFilter)
				operationIds = getOtherPendingOperation(sequence, operationIds);

			return operationIds;
		}

		const getOtherPendingOperation = ( sequence, operationIds ) => {
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

		// Handler for some cases where operation is duplicated in a operation
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

		// Get all saved search results.
		const getAllSSResult = (searchResultSet, limit) => {
			if(!limit)
				limit = 100000000;

			var inc = 0;
			var result = [];

			for (var x = 0; x <= result.length && x < limit; x += 1000) {
				(inc + 1000) > limit ? inc = limit : inc += 1000;
				result = result.concat(searchResultSet.getRange(x, inc) || []);
			}

			return result;
		};

		return {
			getPendingOperations,
			getAllSSResult
		};
	}
);
