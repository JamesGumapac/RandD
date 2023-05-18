/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define([ 'N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/redirect' ],
	/**
	 * @param {record}
	 *            record
	 * @param {runtime}
	 *            runtime
	 * @param {search}
	 *            search
	 * @param {serverWidget}
	 *            serverWidget
	 */
	function(record, runtime, search, serverWidget, redirect) {
		
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
		 */
		function beforeLoad(scriptContext) {
			var currentRec = scriptContext.newRecord;
			var form = scriptContext.form;
			log.debug('scriptContext.type', scriptContext.type);
			log.debug('currentRec.type', currentRec.type);
			if (currentRec.type == 'manufacturingrouting')
			{	
				var curInstructions=currentRec.getValue({
					fieldId : 'custrecord_routing_instructions'
				})
				var sublist = form.getSublist({
					id : 'routingstep'
				});	
				sublist.addField({
					id: 'custpage_fab_instructions',
					type: serverWidget.FieldType.TEXTAREA,
					label: 'Instructions'
				});
				
				// for operation list 
				sublist.addField({
					id: 'custpage_operationlist',
					type: serverWidget.FieldType.SELECT,
					label: 'Operation list',
					source:'customrecord_gate_times_and_operations_'
				});
				// end for operatin list 
				
				if((scriptContext.type=="view"||scriptContext.type=="edit"))
				{	
					try{
						log.debug('curInstructions', curInstructions);						
						if(!curInstructions)
						{
							curInstructions="{}"
						}
						var instObj=JSON.parse(curInstructions);						
						var rsLines = currentRec.getLineCount({
							sublistId: 'routingstep'
						});
						log.debug('rsLines', rsLines);
						for(var i=0;i<rsLines;i++)
						{	
							var opSequence = sublist.getSublistValue({
								id : 'operationsequence',
								line: i
							})
							if(instObj[opSequence])
							{
								log.debug('instObj[opSequence]=',instObj[opSequence]);
								sublist.setSublistValue({
									id: 'custpage_fab_instructions',
									line: i,
									value: instObj[opSequence]
								});
							}
							/* else
							{
								sublist.setSublistValue({
									id: 'custpage_fab_instructions',
									line: i,
									value: ""
								});
							} */
						}						
					}
					catch(e)
					{
						log.error("Error",e);
					}
				}
				
		
				/*
				var sublist = form.addSublist({
					id : 'custpage_fab_instructions',
					type : serverWidget.SublistType.INLINEEDITOR,
					label : 'Instructions'
				});
				 sublist.addField({
					id: 'custpage_fab_instructions12',
					type: ui.FieldType.TEXT,
					label: 'Text Field'
				}); */
			}		
		}
					
		return {
			beforeLoad : beforeLoad
		};

	});
