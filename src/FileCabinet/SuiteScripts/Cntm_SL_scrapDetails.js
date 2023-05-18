/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define([ 'N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget' ],
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
function(record, runtime, search, serverWidget) {

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
		if (context.request.method === 'GET') {
			var form = serverWidget.createForm({
				title : 'Scrap Reason'
			});
			var reasons = context.request.parameters.reasons;
			log.debug('reasons',reasons);
			reasons=reasons?JSON.parse(reasons):'';
          var line = context.request.parameters.line;
			var qty = context.request.parameters.qty;
			var subId = context.request.parameters.sublistId;
			var isEdit = context.request.parameters.isedit;
			var hidden = form.addField({
				id : 'custpage_hidden',
				type : serverWidget.FieldType.TEXT,
				label : 'hiddn check'
			});
			hidden.defaultValue = 1;
			hidden.updateDisplayType({
				displayType : serverWidget.FieldDisplayType.HIDDEN
			});
			if (isEdit) {
				var isEditFld = form.addField({
					id : 'custpage_isedit',
					type : serverWidget.FieldType.TEXT,
					label : 'Is Edit'
				});
				isEditFld.defaultValue = isEdit;
				isEditFld.updateDisplayType({
					displayType : serverWidget.FieldDisplayType.HIDDEN
				});
			}
			form.addSubmitButton({
				label : 'Submit'
			});
			form.addButton({
				label : 'Close',
				id : 'custpage_close',
				functionName : 'close'
			});
			var scrapqty = form.addField({
				id : 'custpage_tot_scrap_qty',
				type : serverWidget.FieldType.TEXT,
				label : 'Scrap Quantity'
			}).updateDisplayType({
				displayType : serverWidget.FieldDisplayType.HIDDEN
			});
			var sublistId = form.addField({
				id : "custpage_scrap_subid",
				type : serverWidget.FieldType.TEXT,
				label : "SUBID"
			}).updateDisplayType({
				displayType : serverWidget.FieldDisplayType.HIDDEN
			});
			sublistId.defaultValue = subId;
          var parentLine = form.addField({
				id : "custpage_scrap_orig_line",
				type : serverWidget.FieldType.TEXT,
				label : "Line"
			}).updateDisplayType({
				displayType : serverWidget.FieldDisplayType.HIDDEN
			});
			parentLine.defaultValue = line;
			/*
			 * var scrapReason = form.addField({ id : 'custpage_scrap_reason',
			 * source : 'customlist_cnt_scrap_reason', type :
			 * serverWidget.FieldType.MULTISELECT, label : 'Scrap Reason' });
			 * if(reasons) scrapReason.defaultValue=reasons.split(',');
			 */
			var subList = form.addSublist({
				id : "custpage_scrap_reasons",
				type : serverWidget.SublistType.INLINEEDITOR,
				label : "Scrap Reasons"
			});
			var scrpRsn = subList.addField({
				id : "custpage_scrap_reason",
				source : 'customlist_cnt_scrap_reason',
				type : serverWidget.FieldType.SELECT,
				label : "Scrap Reason"
			});
			var scrpQty = subList.addField({
				id : "custpage_scrap_qty",
				type : serverWidget.FieldType.TEXT,
				label : "Scrap Quantity"
			});
			scrpQty.isMandatory = true;
			if (qty)
				scrapqty.defaultValue = qty;
			/*
			 * var scrpLocation = subList.addField({ id :
			 * "custpage_scrap_location", source : 'location', type :
			 * serverWidget.FieldType.SELECT, label : "Location"
			 * }).updateDisplayType({ displayType :
			 * serverWidget.FieldDisplayType.DISABLED });
			 */
			/*var customrecord_cntm_scrap_historySearchObj = search.create({
				type : "customrecord_cntm_scrap_history",
				filters : [ [ "custrecord_cntm_parent", "anyof", subId ] ],
				columns : [ search.createColumn({
					name : "custrecord_cntm_sh_scrap_qty",
					label : "Scrap Quantity "
				}), search.createColumn({
					name : "custrecord_cntm_sh_scrap_reason",
					label : "Scrap Reason "
				}) ]
			});
			var searchResultCount = customrecord_cntm_scrap_historySearchObj
					.runPaged().count;
			log.debug("customrecord_cntm_scrap_historySearchObj result count",
					searchResultCount);
			var sublistcnt = 0;
			if (searchResultCount > 0)
				customrecord_cntm_scrap_historySearchObj.run().each(
						function(result) {
							// .run().each has a
							// limit of 4,000
							// results
							log.debug(parseInt(result.getValue({
								name : 'custrecord_cntm_sh_scrap_qty'
							}) ? result.getValue({
								name : 'custrecord_cntm_sh_scrap_qty'
							}) : 0));
							subList.setSublistValue({
								id : 'custpage_scrap_qty',
								line : sublistcnt,
								value : parseInt(result.getValue({
									name : 'custrecord_cntm_sh_scrap_qty'
								}) ? result.getValue({
									name : 'custrecord_cntm_sh_scrap_qty'
								}) : 0)
							});
							subList.setSublistValue({
								id : 'custpage_scrap_reason',
								line : sublistcnt,
								value : result.getValue({
									name : 'custrecord_cntm_sh_scrap_reason'
								}) ? result.getValue({
									name : 'custrecord_cntm_sh_scrap_reason'
								}) : ''
							});
							sublistcnt++;
							return true;
						});*/
			if(reasons && reasons.length>0){
				for(var rsn=0;rsn<reasons.length;rsn++){
					subList.setSublistValue({
						id : 'custpage_scrap_qty',
						line : rsn,
						value : parseInt(reasons[rsn].qty)
					});
					subList.setSublistValue({
						id : 'custpage_scrap_reason',
						line : rsn,
						value : reasons[rsn].reason
					});
				}
			}
			form.clientScriptModulePath = './CNTM_CS_ClientAppWOC.js';
			//form.clientScriptFileId = 16154;
			context.response.writePage(form);
		} else {/*
				 * var lineCount = context.request.getLineCount({ group :
				 * 'custpage_scrap_reasons' }); var totalData=[]; for (var int =
				 * 0; int < lineCount; int++){ var setSublist = {}; var
				 * scrapReason = context.request.getSublistValue({ group :
				 * 'custpage_scrap_reasons', name : 'custpage_scrap_reason',
				 * line : int }); setSublist.scrapReason=scrapReason; var qty =
				 * context.request.getSublistValue({ group :
				 * 'custpage_scrap_reasons', name : 'custpage_scrap_qty', line :
				 * int }); setSublist.qty = qty; var subId =
				 * context.request.getSublistValue({ group :
				 * 'custpage_scrap_reasons', name : 'custpage_scrap_subid', line :
				 * int }); setSublist.subId = subId; totalData.push(setSublist); }
				 */
		}
	}

	return {
		onRequest : onRequest
	};

});
