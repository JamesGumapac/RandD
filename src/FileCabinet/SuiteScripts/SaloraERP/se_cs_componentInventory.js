/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @NAuthor Jerome Morden
 */
define(['N/currentRecord', 'N/search'],

	function(currRecord, search) {
		
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

			var fileName = currentRecord.getValue({ fieldId: 'custpage_filename' });
console.log(fileName);
			if(fileName){
				jQuery('#custpage_file_fs').hide().parent().append('<span style="cursor:pointer;"><a class="dottedlink" style="display:none;" id="custpage_cancelchangefile" onclick="jQuery(\'#custpage_changefile\').show();jQuery(\'#custpage_file_fs\').hide();jQuery(this).hide();" title="Cancel" style="display: none;">Cancel</a><a class="dottedlink" id="custpage_changefile" onclick="jQuery(this).hide();jQuery(\'#custpage_cancelchangefile\').show();jQuery(\'#custpage_file_fs\').show();" title="Change file" style="">'+fileName+'</a></span>');
			}

			var lineCount = currentRecord.getLineCount({ sublistId: 'custpage_sublist' });
			for(var line=0; line < lineCount; line++){
				var itemId = currentRecord.getSublistValue({
					sublistId: 'custpage_sublist',
					fieldId: 'custcol_item',
					line: line
				});
				var qtyAvailable = parseFloat(currentRecord.getSublistValue({
					sublistId: 'custpage_sublist',
					fieldId: 'custcol_qtyavailable',
					line: line
				})) || 0;
				var quantity = parseFloat(currentRecord.getSublistValue({
					sublistId: 'custpage_sublist',
					fieldId: 'custcol_quantity',
					line: line
				})) || 0;

				if(!itemId)
					jQuery('#custpage_sublistrow' + line).find('td.uir-list-row-cell').attr('style', 'background-color:#fd8c8c !important;');
				else if(qtyAvailable < quantity)
					jQuery('#custpage_sublistrow' + line).find('td.uir-list-row-cell').attr('style', 'background-color:#ff9900 !important;');
			}

			var onclickFunc = jQuery('#custpage_back').attr('onclick');
			jQuery('.showinventorydetail').each(function(a,b){
				var functionName = jQuery(b).attr('onclick');
				functionName = onclickFunc.replace(/back\(\);/gi,functionName);
				jQuery(b).attr('onclick', functionName);
			});
			jQuery('.deleteinventorydetail').each(function(a,b){
				var functionName = jQuery(b).attr('onclick');
				functionName = onclickFunc.replace(/back\(\);/gi,functionName);
				jQuery(b).attr('onclick', functionName);
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

console.log(sublistId, fieldId, lineNum);

			if( fieldId.match(/custpage_transferlocation/gi) ){
				flushInventoryDetails(currentRecord);
			}else if(fieldId.match(/custpage_location/gi)){
				var loc = currentRecord.getValue({ fieldId: 'custpage_location' });
				if(loc){
					jQuery('.invdetailbtn').show();

					var qtyAvailable = {};
					var itemIds = JSON.parse(currentRecord.getValue({ fieldId: 'custpage_itemids' }));
					search.create({
						type: 'item',
						filters: [
							['internalid', 'anyof', itemIds], 'AND',
							['inventorynumberbinonhand.location', 'anyof', loc], 'AND',
							['inventorynumberbinonhand.quantityavailable', 'notequalto', '0']
						],
						columns: [
							{ name: 'internalid', summary: search.Summary.GROUP },
							{ name: 'quantityavailable', join: 'inventoryNumberBinOnHand', summary: search.Summary.SUM }
						]
					}).run().getRange(0,1000).forEach(function(res, i){
						qtyAvailable[res.getValue(res.columns[0])] = res.getValue(res.columns[1]) || 0;
					});
					var qtyAvailable2 = {};
					var itemIds = JSON.parse(currentRecord.getValue({ fieldId: 'custpage_itemids' }));
					search.create({
						type: 'inventorydetail',
						filters: [
							['item', 'anyof', itemIds], 'AND',
							['location', 'anyof', loc], 'AND',
							['status', 'noneof', '@NONE@']
						],
						columns: [
							{ name: 'item', summary: search.Summary.GROUP },
							{ name: 'itemcount', summary: search.Summary.SUM }
						]
					}).run().getRange(0,1000).forEach(function(res, i){
						qtyAvailable2[res.getValue(res.columns[0])] = res.getValue(res.columns[1]) || 0;
					});
					var lineCount = currentRecord.getLineCount({
						sublistId: 'custpage_inventory'
					});
					for(var i=0;i<lineCount;i++){
						var itemId = currentRecord.getSublistValue({
							sublistId: 'custpage_inventory',
							fieldId: 'custcol_item',
							line: i
						});
						var isSerialized = currentRecord.getSublistValue({
							sublistId: 'custpage_inventory',
							fieldId: 'custcol_isserialitem',
							line: i
						});
						var isLotItem = currentRecord.getSublistValue({
							sublistId: 'custpage_inventory',
							fieldId: 'custcol_islotitem',
							line: i
						});
						var available = (isSerialized || isLotItem)? (qtyAvailable[itemId] || 0): (qtyAvailable2[itemId] || 0)
						jQuery('#custpage_inventoryrow' + i + ' td:eq(3)')
							.html(addCommas(parseFloat(available).toFixed(1)));
					}
				}else{
					jQuery('.invdetailbtn').hide();

					var lineCount = currentRecord.getLineCount({
						sublistId: 'custpage_inventory'
					});
					for(var i=0;i<lineCount;i++){
						jQuery('#custpage_inventoryrow' + i + ' td:eq(3)').html('&nbsp;');
					}
				}

				flushInventoryDetails(currentRecord);
			} else if(fieldId.match(/custcol_quantity/gi)) {
				var qty = currentRecord.getCurrentSublistValue({
					sublistId: sublistId,
					fieldId: fieldId
				});
				var invQty = currentRecord.getCurrentSublistValue({
					sublistId: sublistId,
					fieldId: 'custcol_inventorydetailqty'
				});

				if(parseFloat(invQty) && qty != invQty){
					alert('The total inventory detail quantity must be ' + qty + '.');
					nlapiSetLineItemValue('custpage_inventory', 'custcol_inventorydetailset', lineNum+1, 'F');
					jQuery('#inventorydetail_btn'+lineNum).removeClass('i_inventorydetailset').addClass('i_inventorydetailneeded');
				}
			}
		}

		function flushInventoryDetails(currentRecord){
			jQuery('.showinventorydetail').removeClass('i_inventorydetailset').addClass('i_inventorydetailneeded');
			var lineCount = currentRecord.getLineCount({
				sublistId: 'custpage_inventory'
			});
			for(var line=0; line < lineCount; line++){
				currentRecord.selectLine({ sublistId: 'custpage_inventory', line: line });
				currentRecord.setCurrentSublistValue({
					sublistId: 'custpage_inventory',
					fieldId: 'custcol_inventorydetail',
					value: ''
				});
				currentRecord.commitLine({ sublistId: 'custpage_inventory' });
			}
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

			if(fieldId.match(/custpage_location|custpage_transferlocation/gi)){
				var location = currentRecord.getValue({ fieldId: 'custpage_location' });
				var toLocation = currentRecord.getValue({ fieldId: 'custpage_transferlocation' });
				if(location && toLocation && location == toLocation){
					alert('You must transfer between different Locations.');
					return false;
				}

				if(hasInventoryDetailSetup(currentRecord)){
					if(!confirm('Inventory details that has been configured will be discarded.'))
						return false;
				}
			} else if(fieldId.match(/custcol_quantity/gi)) {
				var value = parseFloat(currentRecord.getCurrentSublistValue({
					sublistId: sublistId,
					fieldId: fieldId
				}));

				if(value < 1){
					alert('Invalid number (must be positive)');
					return false;
				}
			}
			return true;
		}

		function hasInventoryDetailSetup(currentRecord){
			var hasInvDetail = 0;
			var lineCount = currentRecord.getLineCount({
				sublistId: 'custpage_inventory'
			});
			for(var line=0; line < lineCount && !hasInvDetail; line++){
				var invDetail = currentRecord.getSublistValue({
					sublistId: 'custpage_inventory',
					fieldId: 'custcol_inventorydetail',
					line: line
				});

				if(invDetail)
					hasInvDetail = 1;
			}
			return hasInvDetail;
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

			var currentAction = currentRecord.getValue({
				fieldId: 'custpage_action'
			});
			if(currentAction.match(/previewPO|previewTI/gi) && !back.triggered){
				var reqEmpty = [];
				var reqFields = [
//					['custpage_entity', 'Vendor'], 
					['custpage_subsidiary', 'Subsidiary'],
					['custpage_trandate', 'Date'],
					['custpage_cb_original_requestor', 'Requestor']
				];

				if(currentAction == 'previewTI')
					reqFields = [
						['custpage_trandate', 'Date'],
						['custpage_location', 'From Location'],
					];

				reqFields.forEach(function(id){
					if(!currentRecord.getValue({
						fieldId: id[0]
					}))
						reqEmpty.push(id[1]);
				});

				if(reqEmpty.length){
					alert('Please enter value(s) for: ' + reqEmpty.join(', '));
					return false;
				}

				var checked = jQuery('.checkbox_ck').find('.checkbox');
				if(!checked.length){
					alert('Please select at least one item.');
					return false;
				}

				var hasZeroQty = 0;
				var hasNoInvDetail = 0;
				checked.each(function(i,a){
					if(hasZeroQty)
						return;

					var id = a.getAttribute('id');
					var lineNum = parseInt(id.replace(/[^0-9]/gi, '')) - 1;
					
					var qty = parseFloat(currentRecord.getSublistValue({
						sublistId: currentAction == 'previewTI'?'custpage_inventory': 'custpage_item',
						fieldId: 'custcol_quantity',
						line: lineNum
					}));
					if(!qty)
						hasZeroQty = 1;

					if(currentAction == 'previewTI'){
						var invDetailSet = currentRecord.getSublistValue({
							sublistId: 'custpage_inventory',
							fieldId: 'custcol_inventorydetailset',
							line: lineNum
						});

						if(!invDetailSet)
							hasNoInvDetail = 1;
					}
				});

				if(hasZeroQty){
					alert('Unable to proceed. There is/are selected item(s) with zero quantity.');
					return false;
				}

				if(hasNoInvDetail){
					alert('Please configure inventory detail to the selected line(s).');
					return false;
				}

				currentRecord.setValue({
					fieldId: 'custpage_action',
					value: currentAction == 'previewTI'? 'submitTI': 'submitPO'
				});
			}

			if(errorBack.triggered){
				errorBack.triggered = 0;

				if(currentAction == 'submitPO')
					currentRecord.setValue({
						fieldId: 'custpage_action',
						value: 'previewPO'
					});
			}

			if(exportCSV.triggered){
				exportCSV.triggered = 0;

				if(!currentRecord.getLineCount({ sublistId: 'custpage_sublist' })){
					alert('Nothing to export!');
					return false;
				}else{
					currentRecord.setValue({
						fieldId: 'custpage_action',
						value: 'exportcsv'
					});
				}
			}

			if(createPurchaseOrder.triggered || createTransferInventory.triggered){
				var isPO = createPurchaseOrder.triggered;
				createPurchaseOrder.triggered = 0;
				createTransferInventory.triggered = 0;

				var checked = jQuery('.checkbox_ck').find('.checkbox');
				if(!checked.length){
					alert('Please select at least one item.');
					return false;
				}else{
					var hasError = 0;
					var location = '';
					checked.each(function(i,a){
						if(hasError)
							return;

						var id = a.getAttribute('id');
						var lineNum = parseInt(id.replace(/[^0-9]/gi, '')) - 1;

						var itemId = currentRecord.getSublistValue({
							sublistId: 'custpage_sublist',
							fieldId: 'custcol_item',
							line: lineNum
						});
						var lineLocation = currentRecord.getSublistValue({
							sublistId: 'custpage_sublist',
							fieldId: 'custcol_location',
							line: lineNum
						});

						if(isPO){
							if(!itemId){
								alert('Unable to create Purchase Order. You have selected non-existing item in NetSuite.');
								hasError = 1;
	/*						}else if(location && location != lineLocation){
								alert('Unable to create Purchase Order. You have selected items with different location.');
								hasError = 1;
	*/						}
						}else{
							if(!itemId){
								alert('Unable to create Transfer Inventory. You have selected non-existing item in NetSuite.');
								hasError = 1;
							}else if(location && location != lineLocation){
								alert('Unable to create Transfer Inventory. You have selected items with different location.');
								hasError = 1;
							}
						}

						location = lineLocation;
					});

					if(hasError)
						return false;
				}

				currentRecord.setValue({
					fieldId: 'custpage_action',
					value: isPO? 'previewPO': 'previewTI'
				});
			}

			if(back.triggered){
				back.triggered = 0;
				currentRecord.setValue({
					fieldId: 'custpage_action',
					value: ''
				});
			}

			if(!currentRecord.getValue({ fieldId: 'custpage_file' }) &&
				!currentRecord.getLineCount({ sublistId: 'custpage_sublist' })){
				alert('Please enter value(s) for: CSV File');
				return false;
			}

			return true;
		}

		function exportCSV(){
			exportCSV.triggered = 1;
			
			jQuery('#submitter').click();
		}

		function createPurchaseOrder(){
			createPurchaseOrder.triggered = 1;
			
			jQuery('#submitter').click();
		}

		function createTransferInventory(){
			createTransferInventory.triggered = 1;
			
			jQuery('#submitter').click();
		}
		
		function back(a){
			if(confirm('All changes made will be discarded.')){
				back.triggered = 1;
				jQuery('#submitter').click();
			}
		}
		
		function errorBack(){
			errorBack.triggered = 1;
			jQuery('#main_form').submit();
		}

		function showInventoryDetail(link, line){
			var currentRecord = currRecord.get();

			var data = {
				location: currentRecord.getValue({ fieldId: 'custpage_location' }),
				tolocation: currentRecord.getValue({ fieldId: 'custpage_transferlocation' }),
				item: currentRecord.getSublistValue({
					sublistId: 'custpage_inventory',
					fieldId: 'custcol_item',
					line: line
				}),
				quantity: currentRecord.getSublistValue({
					sublistId: 'custpage_inventory',
					fieldId: 'custcol_quantity',
					line: line
				}),
				lotitem: currentRecord.getSublistValue({
					sublistId: 'custpage_inventory',
					fieldId: 'custcol_islotitem',
					line: line
				})? 'T': 'F',
				serialized: currentRecord.getSublistValue({
					sublistId: 'custpage_inventory',
					fieldId: 'custcol_isserialitem',
					line: line
				})? 'T': 'F',
				usebins: currentRecord.getSublistValue({
					sublistId: 'custpage_inventory',
					fieldId: 'custcol_usebins',
					line: line
				})? 'T': 'F',
				line: line
			};

			if(!parseFloat(data.quantity)){
				alert('Please enter value(s) for: Qty. To Transfer');
				return;
			}

			for(var x in data)
				link += '&' + x + '=' + data[x];

			nlExtOpenWindow(link,' ',700,700,'custpage_inventorydetail');
		}

		function deleteInventoryDetail( line ){
			var currentRecord = currRecord.get();

			currentRecord.selectLine({ sublistId: 'custpage_inventory', line: line });
			currentRecord.setCurrentSublistValue({
				sublistId: 'custpage_inventory',
				fieldId: 'custcol_inventorydetail',
				value: ''
			})
			currentRecord.commitLine({ sublistId: 'custpage_inventory' });
			jQuery('#inventorydetail_btn'+line).removeClass('i_inventorydetailset').addClass('i_inventorydetailneeded');
		}

		function addCommas(x){
			var parts = x.toString().split(".");
			parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			return parts.join(".");
		}

		custpage_sublistMarkAll = function(a){
			a? jQuery('#custpage_sublist_div').find('.checkbox_unck').click():
				jQuery('#custpage_sublist_div').find('.checkbox_ck').click();
		}

		custpage_inventoryMarkAll = function(a){
			a? jQuery('#custpage_inventory_div').find('.checkbox_unck').click():
				jQuery('#custpage_inventory_div').find('.checkbox_ck').click();
		}

		custpage_itemMarkAll = function(a){
			a? jQuery('#custpage_item_div').find('.checkbox_unck').click():
				jQuery('#custpage_item_div').find('.checkbox_ck').click();
		}

		return {
			pageInit: pageInit,
			fieldChanged: fieldChanged,
			validateField: validateField,
/*			postSourcing: postSourcing,
			sublistChanged: sublistChanged,
			lineInit: lineInit,
			validateLine: validateLine,
			validateInsert: validateInsert,
			validateDelete: validateDelete,
*/			saveRecord: saveRecord,
			exportCSV: exportCSV,
			createPurchaseOrder: createPurchaseOrder,
			back: back,
			errorBack: errorBack,
			createTransferInventory: createTransferInventory,
			showInventoryDetail: showInventoryDetail,
			deleteInventoryDetail: deleteInventoryDetail
		};
		
	}
);
