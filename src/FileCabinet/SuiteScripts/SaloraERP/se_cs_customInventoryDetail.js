/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @NAuthor Jerome Morden
 */
define(['N/format'],

	function(format) {
		
		/**
		 * Function to be executed after page is initialized.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.currentRecord - Current form record
		 * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
		 *
		 * @since 2015.2
		 */
		function pageInit(scriptContext) {
			var currentRecord = scriptContext.currentRecord;

			var parentLine = parseInt(currentRecord.getValue({ fieldId: 'custpage_line' }));
			var invDetail = parent.nlapiGetLineItemValue('custpage_inventory', 'custcol_inventorydetail', parentLine + 1);

			if(!invDetail)
				return;

			invDetail = JSON.parse(invDetail);
			var invDetailOptions = JSON.parse(currentRecord.getValue({ fieldId: 'custpage_inventorydata' }));

			var sublistId = 'inventoryassignment';
			invDetail.forEach(function(line){
				currentRecord.selectNewLine({ sublistId: sublistId });
				for(var id in line){
					var value = line[id];

					if(value)
						currentRecord.setCurrentSublistValue({
							sublistId: sublistId,
							fieldId: 'custcol_' + id,
							value: value,
//							ignoreFieldChange: true
						});
				}
				currentRecord.commitLine({ sublistId: sublistId });
			});
		}

		/**
		 * Function to be executed when field is changed.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.currentRecord - Current form record
		 * @param {string} scriptContext.sublistId - Sublist name
		 * @param {string} scriptContext.fieldId - Field name
		 * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
		 * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
		 *
		 * @since 2015.2
		 */
		function fieldChanged(scriptContext) {
			var currentRecord = scriptContext.currentRecord;
			var sublistId = scriptContext.sublistId;
			var fieldId = scriptContext.fieldId;
			var lineNum = scriptContext.lineNum;
			if(!lineNum && sublistId)
				lineNum = currentRecord.getCurrentSublistIndex({ sublistId: sublistId });

			if(fieldId.match(/issueinventorynumber/gi)){ // LOT NUMBER CHANGED
				var invData = JSON.parse(currentRecord.getValue({ fieldId: 'custpage_inventorydata' }));

				var fields = {};
				(['binnumber', 'inventorystatus']).forEach(function(id){
					fields[id] = nlapiGetLineItemField(sublistId, 'custcol_' + id);
					deleteAllSelectOptions(fields[id].uifield, window);
				});

				var lotNumber = currentRecord.getCurrentSublistValue({
					sublistId: sublistId,
					fieldId: fieldId
				});
				var binData = {};
				if(!invData[lotNumber]){
					currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custcol_expirationdate',
						value: null, ignoreFieldChange: true });
					currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custcol_available',
						value: '', ignoreFieldChange: true });
					currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custcol_quantity',
						value: '', ignoreFieldChange: true });

					var fields = [];
					(['binnumber', 'inventorystatus']).forEach(function(id){
						fields[id] = nlapiGetLineItemField(sublistId, 'custcol_' + id);
						deleteAllSelectOptions(fields[id].uifield, window);
					});

					JSON.parse(currentRecord.getValue({ fieldId: 'custpage_binoptions' })).forEach(function(opt){
						addSelectOption(document, fields.binnumber.uifield, opt.text, opt.value, false);
					});
					JSON.parse(currentRecord.getValue({ fieldId: 'custpage_invstatusopt' })).forEach(function(opt){
						addSelectOption(document, fields.inventorystatus.uifield, opt.text, opt.value, false);
					});
					return true;
				}else{
					var invStatus = {};
					invData[lotNumber].forEach(function(bin, i){
						binData[bin.binnumber] = {
							status: bin.status,
							statusText: bin.statusText,
							expirationdate: bin.expirationdate,
							quantityavailable: parseFloat(bin.quantityavailable) || 0
						}

						addSelectOption(document, fields.binnumber.uifield, (bin.binnumberText || ''), bin.binnumber, false);

						invStatus[bin.status] = bin.statusText;
					});

					for(var s in invStatus)
						addSelectOption(document, fields.inventorystatus.uifield, invStatus[s], s, false);
				}

				currentRecord.setCurrentSublistValue({
					sublistId: sublistId,
					fieldId: 'custcol_bindetail',
					value: JSON.stringify(binData),
					ignoreFieldChange: true
				});

				binChanged(currentRecord, sublistId, 'custcol_binnumber', lineNum);
			}else if(fieldId.match(/custcol_binnumber/gi)){ // BIN NUMBER CHANGED
				binChanged(currentRecord, sublistId, fieldId, lineNum);
			}
		}

		function binChanged(currentRecord, sublistId, fieldId, lineNum){
			var binData = currentRecord.getCurrentSublistValue({
				sublistId: sublistId,
				fieldId: 'custcol_bindetail'
			}) || currentRecord.getValue({ fieldId: 'custpage_bindata' });

			if(!binData)
				return false;

			binData = JSON.parse(binData);

			var binNumber = currentRecord.getCurrentSublistValue({
				sublistId: sublistId,
				fieldId: fieldId
			});

			if(!binData[binNumber]){
				currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custcol_expirationdate',
					value: null, ignoreFieldChange: true });
				currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custcol_available',
					value: '', ignoreFieldChange: true });
				currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custcol_quantity',
					value: '', ignoreFieldChange: true });

				var fields = [];
				(['inventorystatus']).forEach(function(id){
					fields[id] = nlapiGetLineItemField(sublistId, 'custcol_' + id);
					deleteAllSelectOptions(fields[id].uifield, window);
				});

				JSON.parse(currentRecord.getValue({ fieldId: 'custpage_invstatusopt' })).forEach(function(opt){
					addSelectOption(document, fields.inventorystatus.uifield, opt.text, opt.value, false);
				});
				return true;
			}

			var fields = {};
			(['inventorystatus']).forEach(function(id){
				fields[id] = nlapiGetLineItemField(sublistId, 'custcol_' + id);
				deleteAllSelectOptions(fields[id].uifield, window);
			});

			addSelectOption(document, fields.inventorystatus.uifield,
				binData[binNumber].statusText, binData[binNumber].status, false);
			currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custcol_toinventorystatus',
				value: binData[binNumber].status, ignoreFieldChange: true });


			if(binData[binNumber].expirationdate)
				currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custcol_expirationdate',
					value: format.parse({
						type: format.Type.DATE,
						value: binData[binNumber].expirationdate
					}), ignoreFieldChange: true });
			currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custcol_available',
				value: binData[binNumber].quantityavailable, ignoreFieldChange: true });
			currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custcol_quantity',
				value: '', ignoreFieldChange: true });

			var qtyEntered = getQtyEntered(currentRecord, lineNum);
			var quantity = parseFloat(currentRecord.getValue({ fieldId: 'custpage_quantity' })) - qtyEntered;
			var value = parseFloat(binData[binNumber].quantityavailable) < quantity? binData[binNumber].quantityavailable: quantity;
			if(parseFloat(value))
				currentRecord.setCurrentSublistValue({ sublistId: sublistId,
					fieldId: 'custcol_quantity',
					value: value,
					ignoreFieldChange: true
				});
		}

		function getQtyEntered(currentRecord, lineNum, invDetail, binNumber){
//	console.log(lineNum, invDetail, binNumber);
			var qty = 0;

			var sublistId = 'inventoryassignment';
			var lineCount = currentRecord.getLineCount({ sublistId: sublistId });
			for(var line=0;line < lineCount; line++){
				if(line == lineNum)
					continue;

				var invDetailId = currentRecord.getSublistValue({
					sublistId: sublistId,
					fieldId: 'custcol_issueinventorynumber',
					line: line
				});
				var binNumberId = currentRecord.getSublistValue({
					sublistId: sublistId,
					fieldId: 'custcol_binnumber',
					line: line
				});
//	console.log(line, invDetailId, binNumberId);

				var lineQty = parseFloat(currentRecord.getSublistValue({
						sublistId: sublistId,
						fieldId: 'custcol_quantity',
						line: line
					})) || 0;

				if( invDetail && invDetailId == invDetail && binNumber == binNumberId )
					qty += lineQty;
				else if( !invDetail && binNumber && binNumberId == binNumber )
					qty += lineQty;
				else if( !invDetail && !binNumber ){
					qty += lineQty;
				}
			}
//console.log('qty', qty);

			return qty;
		}

		/**
		 * Function to be executed when field is slaved.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.currentRecord - Current form record
		 * @param {string} scriptContext.sublistId - Sublist name
		 * @param {string} scriptContext.fieldId - Field name
		 *
		 * @since 2015.2
		 */
		function postSourcing(scriptContext) {

		}

		/**
		 * Function to be executed after sublist is inserted, removed, or edited.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.currentRecord - Current form record
		 * @param {string} scriptContext.sublistId - Sublist name
		 *
		 * @since 2015.2
		 */
		function sublistChanged(scriptContext) {
			var currentRecord = scriptContext.currentRecord;
			var sublistId = scriptContext.sublistId;
			if(sublistId.match(/inventoryassignment/gi)){
				var binData = currentRecord.getValue({ fieldId: 'custpage_bindata' });

				if(!binData){
					var fields = [];
					(['binnumber', 'inventorystatus']).forEach(function(id){
						fields[id] = nlapiGetLineItemField(sublistId, 'custcol_' + id);
						deleteAllSelectOptions(fields[id].uifield, window);
					});

					JSON.parse(currentRecord.getValue({ fieldId: 'custpage_binoptions' })).forEach(function(opt){
						addSelectOption(document, fields.binnumber.uifield, opt.text, opt.value, false);
					});
					JSON.parse(currentRecord.getValue({ fieldId: 'custpage_invstatusopt' })).forEach(function(opt){
						addSelectOption(document, fields.inventorystatus.uifield, opt.text, opt.value, false);
					});
				}
			}
		}

		/**
		 * Function to be executed after line is selected.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.currentRecord - Current form record
		 * @param {string} scriptContext.sublistId - Sublist name
		 *
		 * @since 2015.2
		 */
		function lineInit(scriptContext) {
			var currentRecord = scriptContext.currentRecord;
			var sublistId = scriptContext.sublistId;
			var lineNum = currentRecord.getCurrentSublistIndex({ sublistId: sublistId });

			if(sublistId.match(/inventoryassignment/gi)){
				var lineCount = currentRecord.getLineCount({ sublistId: sublistId });
//console.log(lineCount-1, lineNum, (lineCount - 1) < lineNum);
				if((lineCount - 1) < lineNum)
					return true;

				var binData = currentRecord.getSublistValue({
					sublistId: sublistId,
					fieldId: 'custcol_bindetail',
					line: lineNum
				});

				if(!binData)
					return true;

				var invData = JSON.parse(currentRecord.getValue({ fieldId: 'custpage_inventorydata' }));
				var fields = {};
				(['binnumber', 'inventorystatus']).forEach(function(id){
					fields[id] = nlapiGetLineItemField(sublistId, 'custcol_' + id);
					deleteAllSelectOptions(fields[id].uifield, window);
				});

				var invStatus = {};
				var lotNumber = currentRecord.getSublistValue({ sublistId: sublistId, fieldId: 'custcol_issueinventorynumber',
					line: lineNum });
				invData[lotNumber].forEach(function(bin, i){
					addSelectOption(document, fields.binnumber.uifield, bin.binnumberText, bin.binnumber, false);

					invStatus[bin.status] = bin.statusText;
				});

				for(var s in invStatus)
					addSelectOption(document, fields.inventorystatus.uifield, invStatus[s], s, false);
			}
		}

		/**
		 * Validation function to be executed when field is changed.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.currentRecord - Current form record
		 * @param {string} scriptContext.sublistId - Sublist name
		 * @param {string} scriptContext.fieldId - Field name
		 * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
		 * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
		 *
		 * @returns {boolean} Return true if field is valid
		 *
		 * @since 2015.2
		 */
		function validateField(scriptContext) {
			var currentRecord = scriptContext.currentRecord;
			var sublistId = scriptContext.sublistId;
			var fieldId = scriptContext.fieldId;
			var lineNum = scriptContext.lineNum;
			if(!lineNum && sublistId)
				lineNum = currentRecord.getCurrentSublistIndex({ sublistId: sublistId });

			if(fieldId.match(/custcol_binnumber/gi)){
				var binNumber = currentRecord.getCurrentSublistValue({
					sublistId: sublistId,
					fieldId: fieldId
				});
				var lotNumber = currentRecord.getCurrentSublistValue({
					sublistId: sublistId,
					fieldId: 'custcol_issueinventorynumber'
				});
				var binData = JSON.parse(currentRecord.getCurrentSublistValue({
					sublistId: sublistId,
					fieldId: 'custcol_bindetail'
				}) || '{}');

				if(lotNumber && !binData[binNumber])
					return false;
			}
			
			return true;
		}

		/**
		 * Validation function to be executed when sublist line is committed.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.currentRecord - Current form record
		 * @param {string} scriptContext.sublistId - Sublist name
		 *
		 * @returns {boolean} Return true if sublist line is valid
		 *
		 * @since 2015.2
		 */
		function validateLine(scriptContext) {
			var currentRecord = scriptContext.currentRecord;
			var sublistId = scriptContext.sublistId;

			var lineNum = currentRecord.getCurrentSublistIndex({ sublistId: sublistId });

			if(sublistId.match(/inventoryassignment/gi)){
				var quantityAvailable = parseFloat(currentRecord.getCurrentSublistValue({
					sublistId: sublistId,
					fieldId: 'custcol_available'
				})) || 0;
				var quantity = currentRecord.getCurrentSublistValue({
					sublistId: sublistId,
					fieldId: 'custcol_quantity'
				});
				var invDetail = currentRecord.getCurrentSublistValue({
					sublistId: sublistId,
					fieldId: 'custcol_issueinventorynumber'
				});
				var binNumber = currentRecord.getCurrentSublistValue({
					sublistId: sublistId,
					fieldId: 'custcol_binnumber'
				});

				if(parseFloat(quantity) < 1){
					alert('Invalid number (must be positive)');
					return false;
				}

				quantity += getQtyEntered(currentRecord, lineNum, invDetail, binNumber);

				if(quantityAvailable < quantity){
					alert('You only have ' + quantityAvailable + ' available. Please enter a different quantity');
					return false;
				}
			}

			return true;
		}

		/**
		 * Validation function to be executed when sublist line is inserted.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.currentRecord - Current form record
		 * @param {string} scriptContext.sublistId - Sublist name
		 *
		 * @returns {boolean} Return true if sublist line is valid
		 *
		 * @since 2015.2
		 */
		function validateInsert(scriptContext) {

		}

		/**
		 * Validation function to be executed when record is deleted.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.currentRecord - Current form record
		 * @param {string} scriptContext.sublistId - Sublist name
		 *
		 * @returns {boolean} Return true if sublist line is valid
		 *
		 * @since 2015.2
		 */
		function validateDelete(scriptContext) {

		}

		/**
		 * Validation function to be executed when record is saved.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.currentRecord - Current form record
		 * @returns {boolean} Return true if record is valid
		 *
		 * @since 2015.2
		 */
		function saveRecord(scriptContext) {
			var currentRecord = scriptContext.currentRecord;

			var qtyEntered = getQtyEntered(currentRecord);
			var quantity = currentRecord.getValue({ fieldId: 'custpage_quantity' });

			if(qtyEntered != quantity){
				alert('The total inventory detail quantity must be ' + quantity + '.');
				return false;
			}

			var inventoryDetail = [];
			var sublistId = 'inventoryassignment';
			var lineCount = currentRecord.getLineCount({ sublistId: sublistId });
			for(var line=0;line < lineCount; line++){
				var invDetail = {};
				([
					'issueinventorynumber', 'binnumber', 'tobinnumber', 'inventorystatus', 'toinventorystatus', 'quantity'
				]).forEach(function(id){
					var value = currentRecord.getSublistValue({
						sublistId: sublistId,
						fieldId: 'custcol_' + id,
						line: line
					});

					if(id == 'expirationdate' && value)
						value = format.format({ type: format.Type.DATE, value: value });

					if(value)
						invDetail[id] = value;
				});
				inventoryDetail.push(invDetail);
			}

			var line = parseInt(currentRecord.getValue({ fieldId: 'custpage_line' }));
			parent.nlapiSetLineItemValue('custpage_inventory', 'custcol_inventorydetail', line+1, JSON.stringify(inventoryDetail));
			parent.nlapiSetLineItemValue('custpage_inventory', 'custcol_inventorydetailqty', line+1, qtyEntered);
			parent.nlapiSetLineItemValue('custpage_inventory', 'custcol_inventorydetailset', line+1, 'T');
			parent.jQuery('#inventorydetail_btn'+line).removeClass('i_inventorydetailneeded').addClass('i_inventorydetailset');

			close();
		}

		function close() {
			parent.jQuery('.x-tool-close').click();
		}

		return {
			pageInit: pageInit,
			fieldChanged: fieldChanged,
			validateLine: validateLine,
			saveRecord: saveRecord,
			sublistChanged: sublistChanged,
			validateField: validateField,
//			postSourcing: postSourcing,
			lineInit: lineInit,
//			validateInsert: validateInsert,
//			validateDelete: validateDelete,
			close: close
		};
		
	}
);
