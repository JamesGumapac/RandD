/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(
	['N/error', 'N/file', 'N/record', 'N/search', 'N/task', 'N/runtime',
		'N/ui/serverWidget'],
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
	function (error, file, record, search, task, runtime, serverWidget) {

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
		function beforeLoad(scriptContext) {
			var currentRec = scriptContext.newRecord;
			var form = scriptContext.form;
			log.debug('scriptContext', scriptContext);

			if (scriptContext.type == 'view') {
				form.clientScriptModulePath = 'SuiteScripts/Cntm_CS_Create Quote.js';// clientScriptFileId

				// =
				// 1461;
				// log.debug('currentRec.type', scriptContext);
				// var prams = scriptContext.request.parameters;
				if (currentRec.type == 'estimate') {

					var button = form.addButton({
						id: 'custpage_create_quote',
						label: 'Create New Quote',
						functionName: 'createQuote'
					});
					var status = currentRec.getValue({ fieldId: 'status' });
					log.debug('status', status);
					if (status != 'Processed')
						var updateButton = form.addButton({
							id: 'custpage_update_quote',
							label: 'Update Quote',
							functionName: 'updateQuote'
						});
				} else if (currentRec.type == 'job') {
					var toolNum = currentRec.getValue({
						fieldId: 'custentity_cntm_tool_number'
					});
					/*var err = currentRec.getValue({
						fieldId : 'custentity_cntm_err_while_updtin_toolnum'
					});*/
					if (toolNum)
						var button = form.addButton({
							id: 'custpage_create_quote',
							label: 'Create Quote',
							functionName: 'createQuote'
						});
					else /*if(err)*/
						var retryButton = form.addButton({
							id: 'custpage_update_tool_number',
							label: 'Update Tool Number',
							functionName: 'updateToolNumber'
						});

				} else if (currentRec.type == 'supportcase') {
					var button = form.addButton({
						id: 'custpage_create_quote',
						label: 'Create Quote',
						functionName: 'createQuote'
					});
				}
			}
			if (scriptContext.type == 'edit') {
				if (runtime.executionContext === runtime.ContextType.USER_INTERFACE) {
					if (currentRec.type == 'estimate') {

						var params = scriptContext.request.parameters;
						var fileFld = form.getField({
							id: 'custbody_cntm_qoteimport_file'
						});
						if (params.enableFile == 'T') {

							if (isNotEmpty(fileFld))
								fileFld
									.updateDisplayType({
										displayType: serverWidget.FieldDisplayType.ENTRY
									});
							currentRec.setText({
								fieldId: 'custbody_cntm_import_status',
								value: ''
							});
						} else {
							var status = currentRec.getValue({
								fieldId: 'custbody_cntm_import_status'
							});
							var file = currentRec.getValue({
								fieldId: 'custbody_cntm_qoteimport_file'
							});
							if (file && status) {
								if (isNotEmpty(fileFld))
									fileFld
										.updateDisplayType({
											displayType: serverWidget.FieldDisplayType.INLINE
										});
							}
						}

					} else if (currentRec.type == 'job') {
						var toolNumFld = form.getField({
							id: 'custentity_cntm_tool_number'
						});
						if (isNotEmpty(toolNumFld))
							toolNumFld
								.updateDisplayType({
									displayType: serverWidget.FieldDisplayType.INLINE
								});
					}
				}
			}
			if (scriptContext.type == 'create') {
				if (currentRec.type == 'estimate') {
					var params = scriptContext.request.parameters;
					if (isNotEmpty(params)) {
						if (params.cust)
							currentRec.setValue({
								fieldId: 'entity',
								value: params.cust
							});
						if (params.job)
							currentRec.setValue({
								fieldId: 'job',
								value: params.job
							});
						/*var dummyItem = scriptContext.newRecord.getValue({
							fieldId : 'custscript_cntm_dummy_item_for_quote'
						});
						currentRec
						.selectNewLine({
							sublistId : 'item'
						});
						currentRec.setCurrentSublistValue({sublistId:'item',fieldId:'item',value:dummyItem});
						currentRec.setCurrentSublistValue({sublistId:'item',fieldId:'rate',value:5});
						currentRec.commitLine({
							sublistId : 'item'
						});*/
					}
				}
			}
		}
		function isNotEmpty(obj) {
			return obj && JSON.stringify(obj) != '{}'
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
			var rec = scriptContext.newRecord;
			log.audit('scriptContext', scriptContext);
			log.audit('runtime.executionContext', runtime.executionContext);
			if (scriptContext.newRecord.type == 'estimate') {
				if (runtime.executionContext === runtime.ContextType.USER_INTERFACE) {
					if (!scriptContext.newRecord.getValue({
						fieldId: 'custbody_cntm_import_status'
					})) {
						var fileId = rec.getValue({
							fieldId: 'custbody_cntm_qoteimport_file'
						});

						if (fileId) {
							var subsidiary = rec.getValue({
								fieldId: 'subsidiary'
							});
							var toolNumber = rec.getValue({
								fieldId: 'custbody_cntm_tool_number'
							});
							var copyFromFile = rec.getValue({
								fieldId: 'custbody_cntm_copy_from_file'
							});
							var id = record.submitFields({
								type: rec.type,
								id: rec.id,
								values: {
									custbody_cntm_import_status: 1,
									custbody_cntm_error_field: ''
								}
							});
							var scriptTask = task.create({
								taskType: task.TaskType.MAP_REDUCE
							});
							scriptTask.scriptId = 'customscript_cntm_mr_qt_item_import';
							//	scriptTask.deploymentId = 'customdeploy_cntm_mr_qt_item_import';
							scriptTask.params = {
								custscript_cntm_file_id: fileId,
								custscript_cntm_subsidiary: subsidiary,
								custscript_cntm_toolnumber: toolNumber,
								custscript_cntm_recid: rec.id,
								custscript_cntm_rectype: rec.type,
								custscript_cntm_copyfromfile: copyFromFile
							};

							var scriptTaskId = scriptTask.submit();
							var status = task.checkStatus(scriptTaskId).status;
							log.debug(scriptTaskId);
						}
					}
				}
             /* var userId = runtime.getCurrentUser().id;
				rec.setValue({
					fieldId: 'custbody_cntm_user_details',
					value: userId
				});*/
			} else if (scriptContext.newRecord.type == 'job') {
				
				if (scriptContext.type != 'xedit') {
					if (runtime.executionContext === runtime.ContextType.USER_INTERFACE) {
						var toolNum = scriptContext.newRecord.getValue({
							fieldId: 'custentity_cntm_tool_number'
						});
						if (!toolNum) {
							var squence, num;
							//var initialToolNum = runtime
							//		.getCurrentScript()
							//		.getParameter(
							//				{
							//				name : 'custscript_cntm_initial_tool_number'
							//		});

							var ssScriptTask = task.create({
								taskType: task.TaskType.SCHEDULED_SCRIPT
							});
							ssScriptTask.scriptId = 'customscript_cntm_tool_number_creation';
							//ssScriptTask.deploymentId = 'customdeploy_cntm_tool_number_creation';
							ssScriptTask.params = {
								//		custscript_cntm_initial_toolnum : initialToolNum,
								custscript_cntm_job_recid: rec.id,
								custscript_cntm_job_rectype: rec.type
							};

							var scriptTaskId = ssScriptTask.submit();
							var status = task.checkStatus(scriptTaskId).status;
							log.debug(scriptTaskId);
						}
					}
				}
			}
		}

		return {
			beforeLoad: beforeLoad,
			/* beforeSubmit : beforeSubmit, */
			afterSubmit: afterSubmit
		};

	});
