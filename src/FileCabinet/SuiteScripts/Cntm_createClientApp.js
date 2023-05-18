/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define([ 'N/record', 'N/runtime', 'N/search', 'N/task','N/url','N/https' ],
/**
 * @param {record}
 *            record
 * @param {runtime}
 *            runtime
 * @param {search}
 *            search
 * @param {task}
 *            task
 */
function(record, runtime, search, task, url,https) {

	/**
	 * Definition of the Suitelet script trigger point.
	 * 
	 * @param {Object}
	 *            context
	 * @param {ServerRequest}
	 *            context.request - Encapsulation of the incoming request
	 * @param {ServerResponse}
	 *            context.response - Encapsulation of the Suitelet response
	 * @Since 2015.2
	 */
	function onRequest(context) {
		var routing = context.request.parameters.routing;
		var routingRec = record.load({
			type : 'manufacturingrouting',
			id : routing,
			isDynamic : true
		});
		var routingLines = routingRec.getLineCount({
			sublistId : 'routingstep'
		});
		var WO = context.request.parameters.wo;
		var headerRec = context.request.parameters.header;
		var oprationArr = context.request.parameters.oprationArr;
		oprationArr = oprationArr ? JSON.parse(oprationArr) : {};
		var lot = context.request.parameters.lot;
      log.debug('lot',lot);
		var lotRec = context.request.parameters.lotRec;
		var lotQty = context.request.parameters.lotQty;
		var remainLines = parseInt(context.request.parameters.rem);
		//added on 2 nov 2022
		// var scrapped = context.req
		// var scrapped = context.request.parameters.scrapped;
		var finalCount;
		if (routingLines - remainLines > 70)
			finalCount = remainLines + 70;
		else
			finalCount = routingLines;

		log.debug('routingLines', routingLines);
		for (var i = remainLines; i < finalCount; i++) {

			var mcnRunTime = routingRec.getSublistValue({
				sublistId : 'routingstep',
				fieldId : 'runrate',
				line : i
			});
			var mcnSetupTime = routingRec.getSublistValue({
				sublistId : 'routingstep',
				fieldId : 'setuptime',
				line : i
			});
			var laborRunTime = routingRec.getSublistValue({
				sublistId : 'routingstep',
				fieldId : 'runrate',
				line : i
			});
			var laborSetupTime = routingRec.getSublistValue({
				sublistId : 'routingstep',
				fieldId : 'setuptime',
				line : i
			});
			var opSeq = routingRec.getSublistValue({
				sublistId : 'routingstep',
				fieldId : 'operationsequence',
				line : i
			}).toString();
			var opName = routingRec.getSublistValue({
				sublistId : 'routingstep',
				fieldId : 'operationname',
				line : i
			})
			var clientAppSublistRec = record.create({
				type : 'customrecord_cntm_clientappsublist',
				isDynamic : true
			});
			//added on 2 nov 2022
			// if(scrapped){
			// 	clientAppSublistRec.setValue({
			// 		fieldId: "custrecord_cntm_previously_scrapepd",
			// 		value: true,
			// 	});

			// }

			// log.audit('value setted :',scrapped)

			clientAppSublistRec.setValue({
				fieldId : 'custrecord_cntm_cso_parentrec',
				value : headerRec
			});
			clientAppSublistRec.setValue({
				fieldId : 'custrecord_cntm_cso_pannellot',
				value : lot.toString()
			});
			clientAppSublistRec.setValue({
				fieldId : 'custrecord_cntm_cso_woc_quantity',
				value : lotQty
			});
			clientAppSublistRec.setValue({
				fieldId : 'custrecord_cntm_cso_quantity_good',
				value : lotQty
			});
			clientAppSublistRec.setValue({
				fieldId : 'custrecord_cntm_cso_operaton',
				value : opSeq + ' ' + opName
			});
			clientAppSublistRec.setValue({
				fieldId : 'custrecord_cntm_cso_machinesetuptime',
				value : mcnSetupTime
			});
			clientAppSublistRec.setValue({
				fieldId : 'custrecord_cntm_cso_machinerunetime',
				value : mcnRunTime
			});
			clientAppSublistRec.setValue({
				fieldId : 'custrecord_cntm_cso_laborsetuptime',
				value : Number(laborSetupTime).toFixed(6)
			});
			clientAppSublistRec.setValue({
				fieldId : 'custrecord_cntm_cso_laborruntime',
				value : Number(laborRunTime).toFixed(6)
			});
			clientAppSublistRec.setValue({
				fieldId : 'custrecord_cntm_lot_record',
				value : lotRec
			});
			clientAppSublistRec.setValue({
				fieldId : 'custrecord_cntm_seq_no',
				value : (i + 1)
			});
			clientAppSublistRec.setValue({
				fieldId : 'custrecord_cntm_work_order',
				value : WO
			});
			if (i == (routingLines - 1))
				clientAppSublistRec.setValue({
					fieldId : 'custrecord_cntm_last_operation',
					value : true
				});

			if (opSeq in oprationArr) {
				clientAppSublistRec.setValue({
					fieldId : 'custrecord_cntm_is_create_issue',
					value : true
				});
				clientAppSublistRec.setValue({
					fieldId : 'custrecord_cntm_items_to_issue',
					value : oprationArr[opSeq]
				});
			}
			clientAppSublistRec.save();
		}
		remainLines = finalCount;
		if (routingLines > remainLines) {
			var output = url.resolveScript({
				scriptId : 'customscript_cntm_sl_create_cah',
				deploymentId : 'customdeploy_cntm_sl_create_cah',
				returnExternalUrl : true
			});
			output = output + '&wo=' + WO + '&routing=' + routing + '&header='
					+ headerRec + '&rem=' + remainLines + '&oprationArr='
					+ JSON.stringify(oprationArr) + '&lot=' + lot + '&lotRec='
					+ lotRec + '&lotQty=' + lotQty;
			// output = output + '&wo=' + WO + '&routing=' + routing + '&header='
			// 		+ headerRec + '&rem=' + remainLines + '&oprationArr='
			// 		+ JSON.stringify(oprationArr) + '&lot=' + lot + '&lotRec='
			// 		+ lotRec + '&lotQty=' + lotQty +  "&scrapped="+ scrapped;
			var response = https.get({
				url : output
			});
			log.debug("resp", response);
		}
		context.response.write('true');
	}

	return {
		onRequest : onRequest
	};

});
