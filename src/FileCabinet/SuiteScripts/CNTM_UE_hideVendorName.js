/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(
		[ 'N/error', 'N/file', 'N/record', 'N/search', 'N/task', 'N/runtime',
				'N/ui/serverWidget' ],
		/**
		 * @param {error}
		 *            error
		 * @param {file}
		 *            file
		 * @param {record}
		 *            record
		 * @param {search}
		 *            search
		 * @param {task}
		 *            task
		 */
		function(error, file, record, search, task, runtime, serverWidget) {

			/**
			 * Function definition to be triggered before record is loaded.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.newRecord - New record
			 * @param {string}
			 *            scriptContext.type - Trigger type
			 * @param {Form}
			 *            scriptContext.form - Current form
			 * @Since 2015.2
			 */
			function beforeLoad(scriptContext) 
			{
				var currentRec = scriptContext.newRecord;
				var fromId = runtime.getCurrentScript().getParameter({name: 'custscript_cntm_form_id'});
				var form = scriptContext.form;
				var fromIDSet=scriptContext.newRecord.getValue({
					fieldId : 'customform'
				});
				log.debug('scriptContext', scriptContext);
				log.debug('from', form);
				log.debug('fromid', fromIDSet);
				if(fromId==fromIDSet)
				{log.debug('con', "true");
					form.getSublist({id: 'item'}).getField({id: 'vendorname'}).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN}); //hides Vendor Name field
					form.getSublist({id: 'item'}).getField({id: 'amount'}).updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED}); //hides Vendor Name field
				}
			}
			
			/**
			 * Function definition to be triggered before record is loaded.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.newRecord - New record
			 * @param {Record}
			 *            scriptContext.oldRecord - Old record
			 * @param {string}
			 *            scriptContext.type - Trigger type
			 * @Since 2015.2
			 */
			function beforeSubmit(scriptContext) {

			}

			/**
			 * Function definition to be triggered before record is loaded.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.newRecord - New record
			 * @param {Record}
			 *            scriptContext.oldRecord - Old record
			 * @param {string}
			 *            scriptContext.type - Trigger type
			 * @Since 2015.2
			 */
			function afterSubmit(scriptContext) {
			}

			return {
				beforeLoad : beforeLoad,
				
			};

		});
