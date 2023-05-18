/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @NAuthor Jerome Morden
 */
var CSVLib = '';
const parseCSV = csvText => {
	return CSVLib.parse(csvText);
}

define(['N', 'N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/file', 'N/format', './se_lib_csv'],

	(N, record, runtime, search, ui, file, format, csvlib) => {
	   
		/**
		 * Definition of the Suitelet script trigger point.
		 *
		 * @param {Object} context
		 * @param {ServerRequest} context.request - Encapsulation of the incoming request
		 * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
		 * @Since 2015.2
		 */
		const onRequest = context => {
			CSVLib = csvlib;

			var {request} = context;
			var params = request.parameters;
			var csvFile = request.files.custpage_file;

			if(params.custpage_action == 'exportcsv'){
				exportCSV( context );
				return;
			}else if(params.custpage_action == 'submitPO'){
				createPurchaseOrder(context);
				return;
			}else if(params.custpage_action == 'submitTI'){
				createTransferInventory(context);
				return;
			}else if(params.custpage_action == 'submitTI'){
				return;
			}else if(params.custpage_action == 'createTransferInventory'){
				createTransferInventory(context);
				return;
			}

			var csvFilename = params.custpage_filename;
			var csvContent = '';
			if(csvFile){
				csvContent = csvFile.getContents() || '';
				csvFilename = csvFile.name || '';
			}else if(params.custpage_inputboards){
				csvContent = sublistToCSV( request );
			}

			var title = 'Component Inventory';
			if(params.custpage_action == 'previewPO')
				title = 'Purchase Requisition Preview';
			else if(params.custpage_action == 'previewTI')
				title = 'Transfer Inventory Preview';
			var form = ui.createForm({
				title: title
			});
			var fields = {};
			var fieldsToCreate = [
				['inputboards', 'Input # Boards', ui.FieldType.FLOAT, null],
				['locationfilter', 'Location', ui.FieldType.SELECT, null],
				['action', 'Action', ui.FieldType.TEXT, null],
				['filename', 'Filename', ui.FieldType.LONGTEXT, null]
			];
			if(!params.custpage_action)
				fieldsToCreate.unshift(['file', 'CSV File', ui.FieldType.FILE, null],
					['label', ' ', ui.FieldType.RICHTEXT, null]);

			fieldsToCreate.forEach((fld)=>{
				fields[fld[0]] = form.addField({
					id: `custpage_${fld[0]}`,
					label: fld[1],
					type: fld[2],
					source: fld[3]
				});
			});

			fields.filename.updateDisplayType({
				displayType: ui.FieldDisplayType.HIDDEN
			});
			fields.filename.defaultValue = csvFilename || '';

			search.create({
				type: 'location',
				filters: [['isinactive', 'is', 'F']],
				columns: [{ name: 'name'}]
			}).run().getRange(0,1000).forEach(res=>{
				fields.locationfilter.addSelectOption({
					text: res.getValue(res.columns[0]),
					value: res.id
				});
			});

			if(request.method == 'GET'){
				var userId = runtime.getCurrentUser().id;
				var locationSelected = search.lookupFields({
					type: 'employee',
					id: userId,
					columns: ['custentity_compinv_location']
				}).custentity_compinv_location;

				locationSelected = locationSelected.length? locationSelected[0].value: null;

				fields.locationfilter.defaultValue = locationSelected;

			}else{
				fields.locationfilter.defaultValue = params.custpage_locationfilter || null;
//log.debug('params.custpage_locationfilter', params.custpage_locationfilter);
				var userId = runtime.getCurrentUser().id;
//log.debug('userId', userId);
				var empRecord = record.load({ type: 'employee', id: userId });
				empRecord.setValue({
					fieldId: 'custentity_compinv_location',
					value: params.custpage_locationfilter || null
				});
				empRecord.save();
			}

			fields.inputboards.defaultValue = params.custpage_inputboards || 1;
			fields.action.defaultValue = params.custpage_action || null;

			fields.inputboards.isMandatory = true;
			fields.action.updateDisplayType({
				displayType: ui.FieldDisplayType.HIDDEN
			});
			if(fields.file){
				fields.label.updateDisplayType({
					displayType: ui.FieldDisplayType.INLINE
				});
				fields.file.updateLayoutType({
					layoutType: ui.FieldLayoutType.STARTROW
				});
				fields.label.updateLayoutType({
					layoutType: ui.FieldLayoutType.ENDROW
				});
			}

			if(params.custpage_action)// HIDE 1st PAGE WHEN ACTION IS NOT EMPTY
				([
					'inputboards', 'locationfilter'
				]).forEach(id => {
					fields[id].updateDisplayType({
						displayType: ui.FieldDisplayType.HIDDEN
					})
				});

			var locations = params.custpage_locationfilter? [params.custpage_locationfilter]:
				search.create({
					type: 'location'
				}).run().getRange(0,1000).map(res=>{
					return res.id
				});

			var sublist = form.addSublist({
				id: 'custpage_sublist',
				label: 'Result',
				type: ui.SublistType.LIST
			});
			sublist.addMarkAllButtons();

			if(params.custpage_action)// HIDE ITEM SUBLIST WHEN ACTION IS NOT EMPTY
				sublist.displayType = ui.SublistDisplayType.HIDDEN;

			if(csvContent.match(/\[Content_Types\]\.xml/gi))
				fields.label.defaultValue = '<p style="color:#ff0000;"><b>Not a valid CSV file.</b></p>';
			else if(csvContent){
				var itemNames = [];
				csvContent = parseCSV(csvContent);
				var value = csvContent[0][0]? csvContent[0][0].toString().toLowerCase().replace(/[^a-z]/gi,'_'): '';
				csvContent.forEach((item, ind)=>{
					if(!ind && value == 'manufacturer_p_n_')
						return true;

					// ************************* ADDING SUBLIST COLUMNS ***********************
					if(ind == 1){
						var sublistFields = {};
						([
							['select', 'Select', ui.FieldType.CHECKBOX, null],
							['item', 'Item ID', ui.FieldType.TEXT, null],
							['itemname', 'Item', ui.FieldType.TEXT, null],
							['description', 'Description', ui.FieldType.TEXT, null],
//							['location', 'Location', ui.FieldType.SELECT, 'location'],
							['quantity', 'Quantity BOM', ui.FieldType.FLOAT, null],
							['qtyavailable', 'Quantity Available', ui.FieldType.FLOAT, null],
							['qtyonhand', 'Quantity On Hand', ui.FieldType.FLOAT, null],
							['qtycommitted', 'Quantity Committed', ui.FieldType.FLOAT, null],
							['qtybackordered', 'Back Ordered', ui.FieldType.FLOAT, null],
							['qtyonorder', 'Quantity On Order', ui.FieldType.FLOAT, null],
							['qtyreorderpoint', 'Reorder Point', ui.FieldType.FLOAT, null],
							['qtyprefstocklevel', 'Preferred Stock Level', ui.FieldType.FLOAT, null],
							['csvquantity', 'CSV Quantity', ui.FieldType.FLOAT, null],
							['islotitem', 'Is Lot Numbered Item', ui.FieldType.CHECKBOX, null],
							['isserialitem', 'Is Serialized Item', ui.FieldType.CHECKBOX, null],
							['usebins', 'Use Bins', ui.FieldType.CHECKBOX, null]
						]).forEach((fld)=>{
							sublistFields[fld[0]] = sublist.addField({
								id: `custcol_${fld[0]}`,
								label: fld[1],
								type: fld[2],
								source: fld[3]
							});
						});

						for(var x in sublistFields){
							if(x.match(/select/gi))
								continue;

							sublistFields[x].updateDisplayType({
								displayType: ui.FieldDisplayType[
									x == 'item' || x.match(/csvquantity|islotitem|isserialitem|usebins/gi)?'HIDDEN':'INLINE'//
								]
							});
						}
/*
						sublistFields.item.updateDisplayType({
							displayType: ui.FieldDisplayType.HIDDEN
						});
						sublistFields.csvquantity.updateDisplayType({
							displayType: ui.FieldDisplayType.HIDDEN
						});*/
					}
					if( value == 'manufacturer_p_n_' ){
						if(itemNames.indexOf(item[0]) < 0)
							itemNames.push(item[0]);
					}else{
						if(item[34] && itemNames.indexOf(item[34]) < 0)
							itemNames.push(item[34]);
						if(item[35] && itemNames.indexOf(item[35]) < 0)
							itemNames.push(item[35]);
						if(item[36] && itemNames.indexOf(item[36]) < 0)
							itemNames.push(item[36]);
						if(item[37] && itemNames.indexOf(item[37]) < 0)
							itemNames.push(item[37]);
					}
				});

				// LOAD SEARCH TO CHECK IF THE ITEM EXIST.
				var items = [];
				var itemIds = {};
				search.create({
					type: 'item',
					filters: [search.createFilter({
						name: `formulanumeric`,
						formula: `CASE {name} WHEN '${itemNames.join("' THEN 1 WHEN '")}' THEN 1 ELSE 0 END`,
						operator: search.Operator.EQUALTO,
						values: 1
					})],
					columns: [{
						name: 'name'
					}, {
						name: 'description'
					}, {
						name: 'location'
					}, {
						name: 'islotitem'
					}, {
						name: 'isserialitem'
					}, {
						name: 'usebins'
					}]
				}).run().getRange(0,1000).forEach(res=>{
					items.push(res.id);
					itemIds[res.getValue({ name: 'name'} )] = {
						id: res.id,
						name: res.getValue({ name: 'name'} ),
						description: res.getValue({name: 'description'}),
						location: res.getValue({name: 'location'}),
						islotitem: res.getValue({ name: 'islotitem' }),
						isserialitem: res.getValue({ name: 'isserialitem' }),
						usebins: res.getValue({ name: 'usebins' })
					};
				});

				// LOAD INVENTORY TO GET AVAILABLE QTY AND ON ORDER
				var onOrder = {};
				var inventory = {};
				if(items.length){
					search.create({
						type: 'item',
						filters: ((loc)=>{
							var filters = [
//								['locationquantityavailable', 'greaterthan', '0'], 'AND',
								['internalid', 'anyof', items]
							];
							if(loc)
								filters.push('AND', ['inventorylocation', 'anyof', loc]);

							return filters;
						})(params.custpage_locationfilter),
						columns: [
							{
								name: 'internalid',
							}, {
								name: 'inventorylocation',
							}, {
								name: 'locationquantityavailable',
							}, {
								name: 'locationquantityonhand',
							}, {
								name: 'locationquantitycommitted',
							}, {
								name: 'locationquantitybackordered',
							}, {
								name: 'locationreorderpoint',
							}, {
								name: 'locationpreferredstocklevel',
							}
						]
					}).run().getRange(0, 1000).forEach(res=>{
						var cols = res.columns;
						var item = res.getValue(cols[0]);
						var location = res.getValue(cols[1]);
						var qtyAvailable = parseFloat(res.getValue(cols[2]));
						var qtyOnHand = parseFloat(res.getValue(cols[3]));
						var qtyCommitted = parseFloat(res.getValue(cols[4]));
						var qtyBackOrdered = parseFloat(res.getValue(cols[5]));
						var qtyReorderPoint = parseFloat(res.getValue(cols[6]));
						var qtyPrefStockLevel = parseFloat(res.getValue(cols[7]));
						if(!inventory[item])
							inventory[item] = {};

						inventory[item][location] = {
							available: qtyAvailable,
							onhand: qtyOnHand,
							committed: qtyCommitted,
							backordered: qtyBackOrdered,
							reorderpoint: qtyReorderPoint,
							prefstocklevel: qtyPrefStockLevel
						}
					});

					search.create({
						type: 'transaction',
						filters: ((loc)=>{
							var filters = [
								['type', 'anyof', ['PurchOrd']], 'AND',
								['status', 'anyof', ['PurchOrd:D', 'PurchOrd:E', 'PurchOrd:B']], 'AND',
								['mainline', 'is', 'F'], 'AND',
								['formulanumeric: {quantity}-{quantityshiprecv}', 'greaterthan', '0'], 'AND',
								['item', 'anyof', items]
							];

							if(loc)
								filters.push('AND', ['location', 'anyof', loc]);

							return filters
						})(params.custpage_locationfilter),
						columns: [
							{ name: 'item', summary: 'GROUP' },
							{ name: 'location', summary: 'GROUP' },
							{ name: 'formulanumeric', formula: '{quantity}-{quantityshiprecv}', summary: 'SUM' }
						]
					}).run().getRange(0,1000).forEach(res=>{
						var cols = res.columns;
						var item = res.getValue(cols[0]);
						var location = res.getValue(cols[1]);
						var toReceive = parseFloat(res.getValue(cols[2]));

						if(!onOrder[item])
							onOrder[item] = {};

						onOrder[item][location] = {
							toreceive: toReceive
						};
					});
				}
//log.debug('itemIds', itemIds);
//log.debug('inventory', inventory);
//log.debug('onOrder', onOrder);
//log.debug('locations', locations);

				var line = 0;
				var quantityInd = '';
				var value = csvContent[0][0].toString().toLowerCase().replace(/[^a-z]/gi,'_');
				if(value != 'manufacturer_p_n_'){ // this block of code is for the 2nd type of BOM
					quantityInd = 1;

					var csvItems = {};
					csvContent.forEach(item => {
						if(!csvItems[ item[34] ] && item[34])// AI
							csvItems[ item[34] ] = 0;
						if(!csvItems[ item[35] ] && item[35])// AJ
							csvItems[ item[35] ] = 0;
						if(!csvItems[ item[36] ] && item[36])// AK
							csvItems[ item[36] ] = 0;
						if(!csvItems[ item[37] ] && item[37])// AL
							csvItems[ item[37] ] = 0;

//log.debug('item', item);

						if(item[34])
							csvItems[ item[34] ] += item[10].toString().length? item[10]: 1;
						if(item[35])
							csvItems[ item[35] ] += item[11].toString().length? item[11]: 1;
						if(item[36])
							csvItems[ item[36] ] += item[12].toString().length? item[12]: 1;
						if(item[37])
							csvItems[ item[37] ] += item[13].toString().length? item[12]: 1;
					});

					csvContent = [];
					for(var item in csvItems)
						csvContent.push([ item, csvItems[item] ]);
				}
				csvContent.forEach((item, ind)=>{
					if(!ind && value == 'manufacturer_p_n_'){
						item = item.map((a)=>{ return a.replace(/[^0-9a-zA-Z ]/gi,'').trim().toLowerCase(); });
						quantityInd = item.indexOf('quantity') < 0? 3: item.indexOf('quantity');
						if(item.indexOf('manufacturer pn') != 0)
							quantityInd = '';
						return;
					}

					if(!item[0] || !quantityInd)
						return;

					var itemData = itemIds[item[0]] || {};
					var csvqty = parseFloat(item[quantityInd].toString().match(/[^0-9\.]/gi)? 0: (item[quantityInd] || 0));

					var qty = (csvqty || 1) * parseFloat(params.custpage_inputboards);

					if(!itemData.id){
						addSublistValue(sublist, line, item, itemData, csvqty, qty);
						line++;
					}else{
						locations.forEach(loc=>{
							addSublistValue(sublist, line, item, itemData, csvqty, qty, loc,
								(inventory[itemData.id]? (inventory[itemData.id][loc] || {}): {}),
								(onOrder[itemData.id]? (onOrder[itemData.id][loc] || {}): {}));
							line++;
						});
					}
				});

				if(!quantityInd){
					fields.label.defaultValue = '<p style="color:#ff0000;"><b>Not a valid CSV file.</b></p>';
				}
			}

			form.addSubmitButton({
				label: 'Submit'
			});

			if(!params.custpage_action){
				form.addButton({
					id: 'custpage_exportcsv',
					label: 'Export CSV',
					functionName: 'exportCSV();'
				});

				form.addButton({
					id: 'custpage_createpo',
					label: 'Create Purchase Requisition',
					functionName: 'createPurchaseOrder();'
				});

				form.addButton({
					id: 'custpage_createti',
					label: 'Create Transfer Inventory',
					functionName: 'createTransferInventory();'
				});
			}

			if(params.custpage_action == 'previewPO')
				previewPurchaseOrder( context, form );
			else if(params.custpage_action == 'previewTI')
				previewTransferInventory(context, form);

			form.clientScriptModulePath = './se_cs_componentInventory';

			context.response.writePage(form);
		}
		
		const addSublistValue = (sublist, line, item, itemData, csvqty, qty, loc, inventory = {}, onorder = {}) => {

			sublist.setSublistValue({
				id: 'custcol_select',
				value: itemData.id && qty > parseFloat(inventory.available || 0)? 'T': 'F',
				line
			});
			sublist.setSublistValue({
				id: 'custcol_item',
				value: itemData.id || null,
				line
			});
			sublist.setSublistValue({
				id: 'custcol_itemname',
				value: itemData.id? (itemData.name || null) : item[0],
				line
			});
			sublist.setSublistValue({
				id: 'custcol_description',
				value: (itemData.id? (itemData.description || null): 'No ITEM found!'),
				line
			});
			sublist.setSublistValue({
				id: 'custcol_location',
				value: loc || null,
				line
			});
			sublist.setSublistValue({
				id: 'custcol_qtyavailable',
				value: inventory.available || 0,
				line
			});
			sublist.setSublistValue({
				id: 'custcol_qtyonhand',
				value: inventory.onhand || 0,
				line
			});
			sublist.setSublistValue({
				id: 'custcol_qtycommitted',
				value: inventory.committed || 0,
				line
			});
			sublist.setSublistValue({
				id: 'custcol_qtybackordered',
				value: inventory.backordered || 0,
				line
			});
			sublist.setSublistValue({
				id: 'custcol_qtyreorderpoint',
				value: inventory.reorderpoint || 0,
				line
			});
			sublist.setSublistValue({
				id: 'custcol_qtyprefstocklevel',
				value: inventory.prefstocklevel || 0,
				line
			});
			sublist.setSublistValue({
				id: 'custcol_qtyonorder',
				value: onorder.toreceive || 0,
				line
			});
			sublist.setSublistValue({
				id: 'custcol_quantity',
				value: qty || 1,
				line
			});
			sublist.setSublistValue({
				id: 'custcol_csvquantity',
				value: csvqty || 0,
				line
			});
			sublist.setSublistValue({
				id: 'custcol_islotitem',
				value: itemData.islotitem? 'T': 'F',
				line
			});
			sublist.setSublistValue({
				id: 'custcol_isserialitem',
				value: itemData.isserialitem? 'T': 'F',
				line
			});
			sublist.setSublistValue({
				id: 'custcol_usebins',
				value: itemData.usebins? 'T': 'F',
				line
			});
		}

		const sublistToCSV = currentRecord => {
			var group = 'custpage_sublist';
			var lineCount = currentRecord.getLineCount({ group });
			if(!lineCount)
				return '';

			var added = {};
			var csvText = 'Manufacturer P/N:,Item #:,MFG ID:,Quantity:';
			for(var line = 0; line < lineCount; line++){
				var item = currentRecord.getSublistValue({
					group,
					name: 'custcol_itemname',
					line
				});
				var qty = currentRecord.getSublistValue({
					group,
					name: 'custcol_csvquantity',
					line
				});

				if(added[item + '___' + qty])
					continue;

				added[item + '___' + qty] = 1;

				csvText += `\n"${item}","","","${qty}"`;
			}

			return csvText;
		}

		const exportCSV = context => {

			var locations = {};
			search.create({
				type: 'location',
				columns: [{name: 'name'}]
			}).run().getRange(0,1000).forEach(res=>{
				locations[res.id] = res.getValue('name');
			});
	
			var currentRecord = context.request;
			var group = 'custpage_sublist';

			var lineCount = currentRecord.getLineCount({ group });
			
			var csvText = '"Item","Description","Location","Quantity Available","Quantity On Hand"' +
				',"Quantity Committed","Quantity On Order","Quantity BOM"';

//log.debug('csvText', csvText);
			for( var line = 0; line < lineCount; line++ ){
				csvText += '\n';
				([
					'itemname', 'description', 'location', 'qtyavailable', 'qtyonhand', 'qtycommitted', 'qtyonorder', 'quantity'
				]).forEach(id=>{
					var value = currentRecord.getSublistValue({ group, name: 'custcol_' + id, line });
					value = id.match(/location/gi)? (locations[value] || ''): value == null? '': value;
					csvText += `"${value}",`;
				})
			}
//log.debug('csvText2', csvText);

			csvFile = file.create({
				name: 'ComponentInventory.CSV',
				fileType: file.Type.CSV,
				contents: csvText
			});

			context.response.writeFile(csvFile);
		};

		const previewPurchaseOrder = (context, form) => {
			var {request} = context;
			var params = request.parameters;

			// Fields to add
			var fields = {};
			([
//				['entity', 'Vendor', ui.FieldType.SELECT, null],
				['cb_original_requestor', 'Requestor', ui.FieldType.SELECT, null],
				['trandate', 'Date', ui.FieldType.DATE, null],
				['location', 'Location', ui.FieldType.SELECT, 'location'],
				['subsidiary', 'Subsidiary', ui.FieldType.SELECT, 'subsidiary'],
				['memo', 'Memo', ui.FieldType.LONGTEXT, null]
			]).forEach(fld => {
				fields[fld[0]] = form.addField({
					id: `custpage_${fld[0]}`,
					label: fld[1],
					type: fld[2],
					source: fld[3]
				});
			});
			fields.location.updateDisplayType({
				displayType: ui.FieldDisplayType.HIDDEN
			});

			// Get default subsidiary
			var script = runtime.getCurrentScript();
			var defSubs = script.getParameter('custscript_showcompinv_subsidiary');
			fields.subsidiary.defaultValue = defSubs || 1;

/*
			fields.entity.addSelectOption({ text: '', value: '' })
			getAllSSResult(search.create({
				type: 'vendor',
				filters: [['isinactive', search.Operator.IS, 'F']],
				columns: [{name: 'entityid'}]
			}).run()).forEach(res=>{
				fields.entity.addSelectOption({
					text: res.getValue( res.columns[0] ),
					value: res.id
				});
			});
*/

			fields.cb_original_requestor.addSelectOption({ text: '', value: '' })
			getAllSSResult(search.create({
				type: 'employee',
				filters: [['isinactive', search.Operator.IS, 'F']],
				columns: [{name: 'entityid'}]
			}).run()).forEach(res=>{
				fields.cb_original_requestor.addSelectOption({
					text: res.getValue( res.columns[0] ),
					value: res.id
				});
			});

			fields.trandate.defaultValue = format.format({
				type: format.Type.DATE,
				value: new Date()
			});

			// Add item sublist
			var sublist = form.addSublist({
				id: 'custpage_item',
				label: 'Items',
				type: ui.SublistType.LIST
			});
			sublist.addMarkAllButtons();
			// Add sublist fields
			var sublistFields = {};
			([
				['select', 'Select', ui.FieldType.CHECKBOX, null],
				['item', 'Item', ui.FieldType.SELECT, 'item'],
				['description', 'Description', ui.FieldType.TEXT, null],
				['quantity', 'Qty To Order', ui.FieldType.FLOAT, null],
				['qtyonhand', 'On Hand', ui.FieldType.FLOAT, null],
				['qtyavailable', 'Available', ui.FieldType.FLOAT, null],
			]).forEach(fld=>{
				sublistFields[fld[0]] = sublist.addField({
					id: `custcol_${fld[0]}`,
					label: fld[1],
					type: fld[2],
					source: fld[3]
				});
			});

			([ // ENTRY
				'select', 'quantity'
			]).forEach(id=>{
				sublistFields[id].updateDisplayType({
					displayType: ui.FieldDisplayType.ENTRY
				});
			});
			([ // INLINE
				'item', 'qtyonhand', 'qtyavailable'
			]).forEach(id=>{
				sublistFields[id].updateDisplayType({
					displayType: ui.FieldDisplayType.INLINE
				});
			});

			var location = params.cuspage_locationfilter;
			var itemLineCount = 0;
			var group = 'custpage_sublist';
			var lineCount = request.getLineCount({ group });
			for(var line = 0; line < lineCount; line++){
				var isSelected = request.getSublistValue({
					group,
					name: 'custcol_select',
					line
				});

				if(isSelected != 'T' && isSelected !== true)
					continue;

				if(!location)
					location = request.getSublistValue({
						group, name: 'custcol_location', line
					});

				for(var id in sublistFields)
					sublist.setSublistValue({
						id: `custcol_${id}`,
						line: itemLineCount,
						value: request.getSublistValue({
							group,
							name: `custcol_${id}`,
							line
						})
					});

				itemLineCount ++;
			}

			// Set Location value
			fields.location.defaultValue = location || null;
			
			form.addButton({
				id: 'custpage_back',
				label: 'Back',
				functionName: 'back();'
			});
		}

		const createPurchaseOrder = context => {
			try{
				var {request} = context;
				var params = request.parameters;

				// Create Purchase Order record.
				var type = record.Type.PURCHASE_REQUISITION;
				var poRecord = record.create({
					type, isDynamic: true
				});

				// Set main fields value
				params.custpage_trandate = format.parse({
					type: format.Type.DATE,
					value: params.custpage_trandate
				});
				([
					'trandate', 'subsidiary', 'cb_original_requestor', 'memo'
				]).forEach(fieldId=>{
					var value = params[`custpage_${fieldId}`] || null;
					fieldId = fieldId.replace(/(cb_)/gi, 'custbody');

					poRecord.setValue({ fieldId, value });
				});

				// Set line items
				var sublistId = 'item';
				var group = 'custpage_item';
				var lineCount = request.getLineCount({ group });
				for(var line = 0; line < lineCount; line ++){
					var isSelected = request.getSublistValue({
						group,
						name: 'custcol_select',
						line
					});

					if(isSelected != 'T' && isSelected !== true)
						continue;

					poRecord.selectNewLine({ sublistId });
					([
						'item', 'quantity'
					]).forEach(fieldId=>{
						poRecord.setCurrentSublistValue({
							sublistId, fieldId,
							value: request.getSublistValue({
								group, line,
								name: `custcol_${fieldId}`
							})
						});
					});
					poRecord.commitLine({ sublistId });
				}

				var id = poRecord.save();

				N.redirect.toRecord({ type, id });
			}catch(e){
				var form = ui.createForm({
					title: 'Error on creating Purchase Requisition.',
				});

				var errorField = form.addField({
					id: 'custpage_error',
					label: ' ',
					type: ui.FieldType.RICHTEXT
				});
				errorField.defaultValue = `<p style="color:#ff0000">${e.toString()}</p>`;
				errorField.updateDisplayType({
					displayType: ui.FieldDisplayType.INLINE
				});

				form.addButton({
					id: 'custpage_cancel',
					label: 'Cancel',
					functionName: 'errorBack();'
				});

				form.clientScriptModulePath = './se_cs_componentInventory';

				context.response.writePage(form);
			}
		}

		const previewTransferInventory = (context, form) => {
			var script = runtime.getCurrentScript();
			var invDetailScriptId = script.getParameter('custscript_showcompinv_invdetailsuitelet');
			var invDetailDeploymentId = script.getParameter('custscript_showcompinv_invdetaildeploy');

			var invDetailURL = N.url.resolveScript({
				scriptId: invDetailScriptId,
				deploymentId: invDetailDeploymentId
			});

			var {request} = context;
			var params = request.parameters;
			log.debug('params is:', JSON.stringify(params));
			log.debug('form is:', JSON.stringify(form));

			// Fields to add
			var fields = {};
			([
				['trandate', 'Date', ui.FieldType.DATE, null],
				['memo', 'Memo', ui.FieldType.LONGTEXT, null],
				['subsidiary', 'Subsidiary', ui.FieldType.SELECT, 'subsidiary'],
				['location', 'From Location', ui.FieldType.SELECT, null],
				['transferlocation', 'To Location', ui.FieldType.SELECT, null],
				['itemids', 'Item IDs', ui.FieldType.TEXTAREA, null]
			]).forEach(fld => {
				fields[fld[0]] = form.addField({
					id: `custpage_${fld[0]}`,
					label: fld[1],
					type: fld[2],
					source: fld[3]
				});
			});
			fields.itemids.updateDisplayType({
				displayType: ui.FieldDisplayType.HIDDEN
			});
			(['subsidiary'/*, 'transferlocation'*/]).forEach(id=>{
				fields[id].updateDisplayType({
					displayType: ui.FieldDisplayType.INLINE
				});
			});

			fields.trandate.defaultValue = format.format({
				type: format.Type.DATE,
				value: new Date()
			});

			// Add item sublist
			var sublist = form.addSublist({
				id: 'custpage_inventory',
				label: 'Items',
				type: ui.SublistType.LIST
			});
			sublist.addMarkAllButtons();

			// Add sublist fields
			var sublistFields = {};
			([
				['select', 'Select', ui.FieldType.CHECKBOX, null],
				['item', 'Item', ui.FieldType.SELECT, 'item'],
				['description', 'Description', ui.FieldType.TEXT, null],
				['fromqtyavailable', 'Qty. Avail To Transfer', ui.FieldType.FLOAT, null],
				['quantity', 'Qty. Needed To Transfer', ui.FieldType.FLOAT, null],
				['enterinvdetail', 'Inventory Detail', ui.FieldType.TEXTAREA, null],
				['inventorydetail', 'Inventory Detail Data', ui.FieldType.TEXTAREA, null],
				['inventorydetailset', 'Inventory Detail Set', ui.FieldType.CHECKBOX, null],
				['inventorydetailqty', 'Inventory Detail Qty', ui.FieldType.FLOAT, null],
				['islotitem', 'Is Lot Numbered Item', ui.FieldType.CHECKBOX, null],
				['isserialitem', 'Is Serialized Item', ui.FieldType.CHECKBOX, null],
				['usebins', 'Use Bins', ui.FieldType.CHECKBOX, null]
			]).forEach(fld=>{
				sublistFields[fld[0]] = sublist.addField({
					id: `custcol_${fld[0]}`,
					label: fld[1],
					type: fld[2],
					source: fld[3]
				});
			});

			// Set columns display type
			for(var id in sublistFields)
				sublistFields[id].updateDisplayType({
					displayType: ui.FieldDisplayType[
						id.match(/select|quantity/gi)? 'ENTRY':
						id.match(/inventorydetail|islotitem|isserialitem|usebins/gi)? 'HIDDEN'://
							'INLINE'
					]
				});

			var itemIds = [];
			var location = '';
			var itemLineCount = 0;
			var group = 'custpage_sublist';
			var lineCount = request.getLineCount({ group });
			for(var line = 0; line < lineCount; line++){
				var isSelected = request.getSublistValue({
					group,
					name: 'custcol_select',
					line
				});

				if(isSelected != 'T' && isSelected !== true)
					continue;
/* commented 12-22-22

				if(!location)
					location = request.getSublistValue({
						group, name: 'custcol_location', line
					});
*/
				if(!location){
					location = params.custpage_locationfilter;
				}
//added above if block after commenting out above on 12-22-22

				for(var id in sublistFields){
					if(id.match(/enterinvdetail|inventorydetail/gi))
						continue;

					sublist.setSublistValue({
						id: `custcol_${id}`,
						line: itemLineCount,
						value: request.getSublistValue({ group, line, name: `custcol_${id}`
						})
					});
				}

				itemIds.push( request.getSublistValue({
					group, name: 'custcol_item', line
				}) );

				var isLotItem = request.getSublistValue({ group, line, name: 'custcol_islotitem' });
				var isSerialItem = request.getSublistValue({ group, line, name: 'custcol_isserialitem' });
				var useBins = request.getSublistValue({ group, line, name: 'custcol_usebins' });
 
 				if(isLotItem == 'T' || isSerialItem == 'T' || useBins == 'T')
					sublist.setSublistValue({
						id: `custcol_enterinvdetail`,
						line: itemLineCount,
						value: inventoryDetailButtons( invDetailURL, itemLineCount )
					});

				itemLineCount ++;
			}

			// Set Location value
			log.debug('location is:', location);
			fields.transferlocation.defaultValue = location || null;

			// Load location record
			var locationRecord = record.load({
				type: 'location',
				id: location
			});

			var subsidiary = locationRecord.getValue({ fieldId: 'subsidiary' });
			// Set subsidiary value
			fields.subsidiary.defaultValue = subsidiary;

			// Add from location options
			fields.location.addSelectOption({ text: '', value: '' });
			search.create({
				type: 'location',
				filters: [['subsidiary', 'anyof', subsidiary], 'AND', ['isinactive', 'is', 'F']],
				columns: [{ name: 'name'}]
			}).run().getRange(0,1000).forEach(res=>{
				fields.location.addSelectOption({
					text: res.getValue(res.columns[0]),
					value: res.id
				});
				fields.transferlocation.addSelectOption({
					text: res.getValue(res.columns[0]),
					value: res.id
				});
			});

			fields.itemids.defaultValue = JSON.stringify( itemIds );

			form.addButton({
				id: 'custpage_back',
				label: 'Back',
				functionName: 'back();'
			});
		}

		const createTransferInventory = context => {
			try{
				var {request} = context;
				var params = request.parameters;

				// Create Purchase Order record.
				var type = record.Type.INVENTORY_TRANSFER;
				var invTransferRecord = record.create({
					type, isDynamic: true
				});

				// Set main field values
				params.custpage_trandate = format.parse({
					type: format.Type.DATE,
					value: params.custpage_trandate
				});
				([
					'trandate', 'subsidiary', 'location', 'transferlocation', 'memo'
				]).forEach(fieldId=>{
					var value = params[`custpage_${fieldId}`] || null;
					invTransferRecord.setValue({ fieldId, value });
				});


				// Get selected items and the location
				var sublistId = 'inventory';
				var group = 'custpage_inventory';
				var lineCount = request.getLineCount({ group });
				for(var line = 0; line < lineCount; line++){
					var isSelected = request.getSublistValue({
						group,
						name: 'custcol_select',
						line
					});

					if(isSelected != 'T' && isSelected !== true)
						continue;

					invTransferRecord.selectNewLine({ sublistId });
					([
						'item', 'adjustqtyby'
					]).forEach(fieldId=>{
						invTransferRecord.setCurrentSublistValue({
							sublistId, fieldId,
							value: request.getSublistValue({
								group, line,
								name: `custcol_${fieldId.match(/adjustqtyby/gi)? 'quantity': fieldId}`
							})
						});
					});

					// Configure inventory detail
					var invDetail = JSON.parse(request.getSublistValue({
						group, line,
						name: 'custcol_inventorydetail'
					}) || '[]');
					var subRecord = invTransferRecord.getCurrentSublistSubrecord({
						sublistId, fieldId: 'inventorydetail'
					});
					invDetail.forEach(inv=>{
						var sublistId = 'inventoryassignment';
						subRecord.selectNewLine({ sublistId });
						for(var fieldId in inv){
							var value = inv[fieldId];

							if(value)
								subRecord.setCurrentSublistValue({ sublistId, fieldId, value });
						}
						subRecord.commitLine({ sublistId });
					});

					invTransferRecord.commitLine({ sublistId });
				}

				var id = invTransferRecord.save();

				// Redirect the page to created record.
				N.redirect.toRecord({ type, id });
			}catch(e){
				var form = ui.createForm({
					title: 'Error on creating Transfer Inventory record.',
				});

				var errorField = form.addField({
					id: 'custpage_error',
					label: ' ',
					type: ui.FieldType.RICHTEXT
				});
				errorField.defaultValue = `<p style="color:#ff0000">${e.toString()}</p>`;
				errorField.updateDisplayType({
					displayType: ui.FieldDisplayType.INLINE
				});

				form.addButton({
					id: 'custpage_cancel',
					label: 'Cancel',
					functionName: 'errorBack();'
				});

				form.clientScriptModulePath = './se_cs_componentInventory';

				context.response.writePage(form);
			}
		}

		const inventoryDetailButtons = (url, line) => {
			return `<span class="invdetailbtn always-visible field_widget_boxpos uir-summary-field-helper" style="left: 0px;display: none;"><a id="inventorydetail_btn${line}" data-helperbuttontype="" class="smalltextul showinventorydetail i_inventorydetailneeded" title="Set" href="#" style="visibility: inherit;" onclick="showInventoryDetail('${url}',${line});" aria-label="Set" role="button" onkeypress=""></a></span><span class="invdetailbtn" style="display: none;"><a id="deleteinvdetail_btn${line}" data-helperbuttontype="" class="smalltextul deleteinventorydetail" title="Delete" href="#" style="" onclick="deleteInventoryDetail(${line})" aria-label="Delete" role="button" onkeypress=""><img src="/images/forms/icon_remove_row_default.png" alt="Delete" border="0" style="margin-left: 5px; position: relative; top:2px;"></a></span>`;
		}

		const getAllSSResult = searchResultSet => {
			var result = [];
			for(var x=0;x<=result.length;x+=1000)
				result = result.concat(searchResultSet.getRange(x,x+1000)||[]);
			return result;
		};

		return {
			onRequest
		};
		
	});