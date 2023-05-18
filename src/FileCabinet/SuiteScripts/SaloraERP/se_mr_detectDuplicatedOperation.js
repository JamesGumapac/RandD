/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @NAuthor Jerome Morden
 */
define(['N/email', 'N/record', 'N/render', 'N/runtime', 'N/search'],

	(email, record, render, runtime, search) => {
	   
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
			return search.create({
				type: 'customrecord_cntm_clientappsublist',
				filters: [
					['custrecord_cntm_work_order.status', 'noneof', 'WorkOrd:C', 'WorkOrd:H'], 'AND',
					['custrecord_cntm_work_order.custbody_hasduplicateoperation', 'is', 'F'], 'AND',
					['custrecord_cntm_work_order.mainline', 'is', 'T'], 'AND',
					['count(internalid)', 'greaterthan', '1']
				],
				columns: [
					{ name: 'internalid', join: 'custrecord_cntm_work_order', summary: 'GROUP' },
					{ name: 'custrecord_cntm_cso_pannellot', summary: 'GROUP' },
					{ name: 'custrecord_cntm_seq_no', summary: 'GROUP' },
					{ name: 'internalid', summary: 'COUNT' }
				]
			});
		}

		/**
		 * Executes when the map entry point is triggered and applies to each key/value pair.
		 *
		 * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
		 * @since 2015.1
		 */
		const map = context => {
			log.debug('context.value', context.value);

			var res = JSON.parse( context.value ).values;

			var wo = res['GROUP(internalid.custrecord_cntm_work_order)'].value;
			var panelLot = res['GROUP(custrecord_cntm_cso_pannellot)'];
			var sequence = res['GROUP(custrecord_cntm_seq_no)'];
			var internalId = res['COUNT(internalid)'];

			context.write({
				key: wo,
				value: { wo, panelLot, sequence, internalId }
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
				// Work Order ID
				var woId = context.key;
				var script = runtime.getCurrentScript();

				// Get script parameters
				var author = script.getParameter('custscript_ddwoopp_author');
				var recipients = script.getParameter('custscript_ddwoopp_recipients'); recipients = recipients.split(',');
				var cc = script.getParameter('custscript_ddwoopp_cc'); cc = cc? cc.split(','): null;
				var searchId = script.getParameter('custscript_ddwoopp_search');
				var emailTempId = script.getParameter('custscript_ddwoopp_template');

				// Load template record
				var emailTemplate = record.load({
					type: 'emailtemplate',
					id: emailTempId
				});

				// Get template
				var emailTempSub = emailTemplate.getValue({ fieldId: 'subject' });
				var emailTempBody = emailTemplate.getValue({ fieldId: 'content' });
				var isUsesMedia = emailTemplate.getValue({ fieldId: 'usesmedia' });
				if( isUsesMedia == 'T' || isUsesMedia === true )
					body = file.load({
						id: emailTemplate.getValue({ fieldId: 'mediaitem' })
					}).getContents();

				// Load work order record
				var woRecord = record.load({
					type: 'workorder',
					id: woId
				});

				// Load duplicated operations
				var operationFilter = context.values.map(op=>{
					op = JSON.parse( op );
					return `[["custrecord_cntm_cso_pannellot","is","${op.panelLot}"], "AND", ["custrecord_cntm_seq_no","equalto","${op.sequence}"]]`;
				}).join('|OR|').split('|').map(a => a=='OR'? a: JSON.parse(a));

				var filters = [['custrecord_cntm_work_order.mainline', 'is', 'T'], 'AND', 
					['custrecord_cntm_work_order.internalid', 'anyof', woId], 'AND', operationFilter];
	log.debug('filters', filters);
				var ss = search.load({ id: searchId });
				ss.filterExpression = filters;
				ssRes = ss.run().getRange(0,1000);

				emailTempBody = emailTempBody.replace(/\{operationtable\}/gi, operationTemplate(ssRes) );

				// Render email subject template
				var subjectRenderer = render.create();
				subjectRenderer.addRecord({
					templateName: 'transaction',
					record: woRecord
				});
				subjectRenderer.templateContent = emailTempSub;
				var subject = subjectRenderer.renderAsString();


				// Render email body template
				var bodyRenderer = render.create();
				bodyRenderer.addRecord({
					templateName: 'transaction',
					record: woRecord
				});
				bodyRenderer.templateContent = emailTempBody;
				var body = bodyRenderer.renderAsString();

log.debug('body', body);

				email.send({
					author, recipients, cc,
					subject, body,
					relatedRecords: {
						transactionId: woId
					}
				});

				record.submitFields({
					type: woRecord.type,
					id: woRecord.id,
					values: {
						custbody_hasduplicateoperation: true
					}
				});

			}catch(e){
				log.debug('- REDUCE ERROR -', e);
			}
		}

		const operationTemplate = (result) => {
			var table = `<table>
				<tbody>
					<tr>
						<td>Work Order</td>
						<td>Sequence</td>
						<td>Operation</td>
						<td>Lot Quantity</td>
					</tr>`;

			result.forEach(res=>{
				table += '<tr>';
				res.columns.forEach(col=>{
					table += `<td>${res.getText(col) || res.getValue(col)}</td>`;
				});
				table += '</tr>';
			});

			return `${table}</tbody></table>`;
		}


		/**
		 * Executes when the summarize entry point is triggered and applies to the result set.
		 *
		 * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
		 * @since 2015.1
		 */
		const summarize = summary => {

		}

		return {
			getInputData,
			map,
			reduce,
			summarize
		};
		
	});
