/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @NAuthor Jerome Morden
 */
define(['N/runtime', 'N/url'],

	(runtime, url) => {
	   
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
			var { type, form, newRecord } = scriptContext;

			if(!type.match(/view/gi))
				return;

			var script = runtime.getCurrentScript();
			var slScript = script.getParameter('custscript_printbompdf_slscript');
			var slDeployment = script.getParameter('custscript_printbompdf_sldeployment');
			var slUrl = url.resolveScript({
				scriptId: slScript,
				deploymentId: slDeployment,
				params: {
					rid: newRecord.id
				}
			});

			form.addButton({
				label: 'Print BOM PDF',
				id: 'custpage_printbompdf',
				functionName: `window.open('${slUrl}', '_blank')`
			});
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

		}

		return {
			beforeLoad,
//			beforeSubmit,
//			afterSubmit
		};
		
	});
