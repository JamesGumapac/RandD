/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @NAuthor Jerome Morden
 */
define(['N/record', 'N/search'],

	(record, search) => {
	   
		/**
		 * Function definition to be triggered before record is loaded.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.newRecord - New record
		 * @param {string} scriptContext.type - Trigger type
		 * @param {Form} scriptContext.form - Current form
		 * @Since 2015.2
		 */
		const beforeLoad = scriptContext => {

		}

		/**
		 * Function definition to be triggered before record is loaded.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.newRecord - New record
		 * @param {Record} scriptContext.oldRecord - Old record
		 * @param {string} scriptContext.type - Trigger type
		 * @Since 2015.2
		 */
		const beforeSubmit = scriptContext => {

		}

		/**
		 * Function definition to be triggered before record is loaded.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.newRecord - New record
		 * @param {Record} scriptContext.oldRecord - Old record
		 * @param {string} scriptContext.type - Trigger type
		 * @Since 2015.2
		 */
		const afterSubmit = scriptContext => {
			var { type, newRecord } = scriptContext;

			if( !type.match(/edit/gi) )
				return;
			var recordLookUp = search.lookupFields({
				type: newRecord.type,
				id: newRecord.id,
				columns: [
					'custrecord_cntm_cso_status',
					'custrecord_cntm_work_order',
					'custrecord_cntm_seq_no',
					'custrecord_cntm_cso_pannellot'
				]
			});
			//newRecord = record.load({ type: newRecord.type, id: newRecord.id });
			//var recStatus = newRecord.getValue({ fieldId: 'custrecord_cntm_cso_status' });
			
			var recStatus = recordLookUp.custrecord_cntm_cso_status[0].value;

			if(recStatus != '4') // Completed
				return;

//			var workOrder = newRecord.getValue({ fieldId: 'custrecord_cntm_work_order' });
//			var sequence = newRecord.getValue({ fieldId: 'custrecord_cntm_seq_no' });
//			var panelLot = newRecord.getValue({ fieldId: 'custrecord_cntm_cso_pannellot' });

			var workOrder = recordLookUp.custrecord_cntm_work_order[0].value;
			var sequence = recordLookUp.custrecord_cntm_seq_no;
			var panelLot = recordLookUp.custrecord_cntm_cso_pannellot;

			if(!workOrder || !sequence || !panelLot)
				return;

			var completedLot = search.create({
				type: newRecord.type,
				filters: [
					['custrecord_cntm_work_order', 'anyof', workOrder], 'AND',
					['custrecord_cntm_seq_no', 'equalto', sequence], 'AND',
					['custrecord_cntm_cso_status', 'anyof', '4']// Pending, In-progress
				],
				columns: [{ name: 'custrecord_cntm_cso_pannellot' }]
			}).run().getRange(0,1000).map(res=>{
				return res.getValue(res.columns[0]);
			});

			var filter = null;
			var lotFilter = '';
			if(completedLot.length > 1){
				lotFilter = completedLot.map(a => `["custrecord_cntm_cso_pannellot", "is", "${a}"]` ).join('|OR|').split('|')
					.map(a => a=='OR'? a: JSON.parse(a));
			}else if(completedLot.length)
				lotFilter = ['custrecord_cntm_cso_pannellot', 'is', completedLot[0]];
log.debug('lotFilter', lotFilter);

			var nextSequence = '';
			search.create({
				type: newRecord.type,
				filters: [
					['custrecord_cntm_work_order', 'anyof', workOrder], 'AND',
					['custrecord_cntm_seq_no', 'greaterthan', sequence], 'AND',
					['custrecord_cntm_cso_pannellot', 'is', panelLot], 'AND',
					['custrecord_cntm_cso_status', 'anyof', '1', '3']// Pending, In-progress
				],
				columns: [
					{ name: 'custrecord_cntm_seq_no', summary: 'MIN' }
				]
			}).run().getRange(0,1).forEach(res=>{
				nextSequence = res.getValue( res.columns[0] );
			});

			if(!nextSequence)
				return;

			filters = [
				['custrecord_cntm_work_order', 'anyof', workOrder], 'AND',
				['custrecord_cntm_seq_no', 'equalto', nextSequence], 'AND',
				['custrecord_cntm_cso_status', 'anyof', '1', '3']// Pending, In-progress
			];
			if(lotFilter)
				filters.push('AND', lotFilter);

			var values = {};
			search.create({
				type: newRecord.type,
				filters,
				columns: (function(){
					return ([
						'custrecord_cntm_priority1',
						'custrecord_cntm_priority2',
						'custrecord_cntm_qfactor',
						'custrecord_cntm_comments_for_prod',
						'custrecord_cntm_comments_for_dash',
						'custrecord_cntm_comments_for_planning',
						'custrecord_cntm_weekend_hours',
						'custrecord_cntm_wo_sched_due_date',
					]).map(name=>{
						return { name, summary: 'MIN' };
					})
				})()
			}).run().getRange(0,1).forEach(res=>{
				res.columns.forEach(col=>{
					var { name } = col;

					var value = res.getValue(col);

					if(value)
						values[name] = value;
				});
			});

			// Get MAX percent completed
			var percentCompleted = 0;
			filters = [
				['custrecord_cntm_work_order', 'anyof', workOrder], 'AND',
				['custrecord_cntm_seq_no', 'equalto', nextSequence], 'AND',
				['custrecord_cntm_percent_complete', 'greaterthan', '0'], 'AND',
				['custrecord_cntm_cso_status', 'anyof', '1', '3']// Pending, In-progress
			];
			if(lotFilter)
				filters.push('AND', lotFilter);

			search.create({
				type: newRecord.type,
				filters,
				columns: [{ name: 'custrecord_cntm_percent_complete', summary: 'MAX' }]
			}).run().getRange(0,1).forEach(res=>{
				percentCompleted = res.getValue(res.columns[0]);
			});

			if(percentCompleted)
				values['custrecord_cntm_percent_complete'] = percentCompleted;

log.debug('values', values);
			filters = [
				['custrecord_cntm_work_order', 'anyof', workOrder], 'AND',
				['custrecord_cntm_seq_no', 'equalto', nextSequence], 'AND',
				['custrecord_cntm_cso_status', 'anyof', '1', '3']// Pending, In-progress
			];
			if(lotFilter)
				filters.push('AND', lotFilter);

			search.create({
				type: newRecord.type,
				filters
			}).run().getRange(0,1000).forEach(res=>{
log.debug('res.id', res.id);
				record.submitFields({
					type: res.recordType,
					id: res.id,
					values
				});
			});
		}

		return {
//			beforeLoad,
//			beforeSubmit,
			afterSubmit
		};
		
	});
