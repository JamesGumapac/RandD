/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @NAuthor Jerome Morden
 */
define(['N/search', 'N/ui/serverWidget'],

	(search, ui) => {
	   
		/**
		 * Definition of the Suitelet script trigger point.
		 *
		 * @param {Object} context
		 * @param {ServerRequest} context.request - Encapsulation of the incoming request
		 * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
		 * @Since 2015.2
		 */
		const onRequest = context => {
			var {request, response} = context;
			var params = request.parameters;
			
			var form = ui.createForm({ title: ' ', hideNavBar: true });

			var fields = {};
			([
				['item', 'Item', ui.FieldType.SELECT, 'item'],
				['salesdescription', 'Description', ui.FieldType.TEXT, null],
				['quantity', 'Quantity', ui.FieldType.FLOAT, null],
				['stockunit', 'Units', ui.FieldType.TEXT, null],
				['line', 'Line', ui.FieldType.TEXT, null],
				['inventorydata', 'Inventory Data', ui.FieldType.LONGTEXT, null],
				['bindata', 'Bin Data', ui.FieldType.LONGTEXT, null],
				['binoptions', 'Bin Options', ui.FieldType.LONGTEXT, null],
				['bins', 'Bins', ui.FieldType.LONGTEXT, null],
				['invstatusopt', 'Inv. Status', ui.FieldType.LONGTEXT, null]
			]).forEach(fld=>{
				fields[fld[0]] = form.addField({
					id: `custpage_${fld[0]}`,
					label: fld[1],
					type: fld[2],
					source: fld[3]
				});
			});

			// Set field display type
			for(var id in fields)
				fields[id].updateDisplayType({
					displayType: ui.FieldDisplayType[
						id.match(/inventorydata|bindata|line|binoptions|bins|invstatusopt/gi)? 'HIDDEN': 'INLINE'
					]
				});

			// Set field values
			fields.item.defaultValue = params.item;
			fields.line.defaultValue = params.line;
			fields.quantity.defaultValue = params.quantity;

			// Get Item Description and Stock Unit
			var itemAddDetails = search.lookupFields({
				type: 'item',
				id: params.item,
				columns: ['salesdescription', 'stockunit']
			});
			fields.salesdescription.defaultValue = itemAddDetails.salesdescription || '';
			if(itemAddDetails.stockunit.length)
				fields.stockunit.defaultValue = itemAddDetails.stockunit[0].text;

			// Add sublist
			var sublist = form.addSublist({
				id: 'inventoryassignment',
				label: 'Inventory Detail',
				type: ui.SublistType.INLINEEDITOR
			});

			var sublistFields = {};
			([
				['issueinventorynumber', 'Serial/Lot Number', ui.FieldType.SELECT, null],
				['binnumber', 'From Bins', ui.FieldType.SELECT, null],
				['tobinnumber', 'To Bins', ui.FieldType.SELECT, null],
				['inventorystatus', 'From Status', ui.FieldType.SELECT, null],
				['toinventorystatus', 'To Status', ui.FieldType.SELECT, null],
				['expirationdate', 'Expiration Date', ui.FieldType.DATE, null],
				['available', 'Lot Qty Available Across Bins', ui.FieldType.FLOAT, null],
				['quantity', 'Quantity', ui.FieldType.FLOAT, null],
				['bindetail', 'Bin Details', ui.FieldType.TEXTAREA, null],
			]).forEach(fld=>{
				sublistFields[fld[0]] = sublist.addField({
					id: `custcol_${fld[0]}`,
					label: fld[1],
					type: fld[2],
					source: fld[3]
				});
			});

			// Set columns display type
			for(var id in sublistFields){
				sublistFields[id].updateDisplayType({
					displayType: ui.FieldDisplayType[id.match(/bindetail/gi)? 'HIDDEN':
						id.match(/available|expirationdate/gi)? 'DISABLED': 'ENTRY']
				});

				if(!id.match(/expirationdate|available|tobinnumber/gi))
					sublistFields[id].isMandatory = true;
			}

			// ************************************* Get Inventory Detail *********************************
			var inventoryDetail = {};
			if(params.lotitem == 'F' && params.serialized == 'F'){
				sublistFields[ 'issueinventorynumber' ].updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN
				});

				var binData = {};
				inventoryDetail[''] = [];
				sublistFields.binnumber.addSelectOption({ text: '', value: '' });
				search.create({
					type: 'inventorydetail',
					filters: [['item', 'anyof', params.item], 'AND',
						['location', 'anyof', params.location]],
					columns: [
						{ name: 'binnumber', summary: search.Summary.GROUP },
						{ name: 'status', summary: search.Summary.GROUP },
						{ name: 'itemcount', summary: search.Summary.SUM },
						{ name: 'expirationdate', summary: search.Summary.GROUP },
					]
				}).run().getRange(0, 1000).forEach(res=>{
					var binNumber = res.getValue(res.columns[0]);
					var itemCount = parseFloat(res.getValue(res.columns[2]));
					if(!binNumber || !itemCount)
						return;

					var data = {};
					res.columns.forEach(col=>{
						var name = col.name;
						if(name == 'itemcount')
							name = 'quantityavailable';

						data[name] = res.getValue(col);
						if( res.getValue(col) && res.getText(col))
							data[`${name}Text`] = res.getText(col);
					});

					inventoryDetail[''].push(data);
					binData[data.binnumber] = {
						status: data.status,
						statusText: data.statusText,
						expirationdate: data.expirationdate,
						quantityavailable: parseFloat(data.quantityavailable) || 0
					}
	log.debug('data', data);

					sublistFields.binnumber.addSelectOption({ text: data.binnumberText, value: data.binnumber });
				});
log.debug('data', binData);
				fields.bindata.defaultValue = JSON.stringify(binData);

			}else{
				var invOtherDetails = {};
				search.create({
					type: 'inventorydetail',
					filters: [
						['item', 'anyof', params.item], 'AND',
						['location', 'anyof', params.location], 'AND',
						['status', 'noneof', '@NONE@']
					],
					columns: [
						{ name: 'inventorynumber', summary: search.Summary.GROUP, sort: search.Sort.ASC },
						{ name: 'binnumber', summary: search.Summary.GROUP },
						{ name: 'status', summary: search.Summary.GROUP },
						{ name: 'expirationdate', summary: search.Summary.GROUP },
					]
				}).run().getRange(0,1000).forEach((res, i)=>{
					var lotNumber = res.getValue(res.columns[0]);
					var binNumber = res.getValue(res.columns[1]);

					var data = {};
					res.columns.forEach(col=>{
						data[col.name] = res.getValue(col);
						if(res.getValue(col) && res.getText(col))
							data[`${col.name}Text`] = res.getText(col);
					});

					invOtherDetails[`${lotNumber}*${binNumber}`] = data;
				});
				search.create({
					type: 'item',
					filters: [
						['internalid', 'anyof', params.item], 'AND',
						['inventorynumberbinonhand.location', 'anyof', params.location], 'AND',
						['inventorynumberbinonhand.quantityavailable', 'notequalto', '0']
					],
					columns: [
						{ name: 'inventorynumber', join: 'inventoryNumberBinOnHand', sort: search.Sort.ASC },
						{ name: 'binnumber', join: 'inventoryNumberBinOnHand' },
						{ name: 'quantityavailable', join: 'inventoryNumberBinOnHand' },
					]
				}).run().getRange(0,1000).forEach((res, i)=>{
					
					var lotNumber = res.getValue(res.columns[0]);
					if(!inventoryDetail[lotNumber])
						inventoryDetail[lotNumber] = [];

					var binNumber = res.getValue(res.columns[1]);

					var data = invOtherDetails[`${lotNumber}*${binNumber}`];
					data['quantityavailable'] = res.getValue(res.columns[2]);

					inventoryDetail[lotNumber].push(data);

				});
log.debug('inventoryDetail', inventoryDetail);

				sublistFields.issueinventorynumber.addSelectOption({ text: '', value: '' });
				for(var lot in inventoryDetail)
					sublistFields.issueinventorynumber.addSelectOption({
						value: lot,
						text: inventoryDetail[lot][0].inventorynumberText 
					});
			}

			// Add TO BIN select options
			var binNumberOptions = [{ text: '', value: '' }];
			
			if(params.lotitem == 'T' || params.serialized == 'T')
				sublistFields.binnumber.addSelectOption({ text: '', value: '' });
			sublistFields.tobinnumber.addSelectOption({ text: '', value: '' });
			getAllSSResult(search.create({
				type: 'bin',
				filters: [
					['location', 'anyof', [params.location, params.tolocation]]//, 'AND',
					//['type', 'anyof', 'STORAGE'] // - commented by jeromemorden | 20220603 - due to missing to bins issue
				],
				columns: [{ name: 'binnumber', sort: search.Sort.ASC }, { name: 'location' }]
			}).run()).forEach(res=>{
				var fldId = res.getValue(res.columns[1]) == params.location? 'binnumber': 'tobinnumber';
				var option = {
					value: res.id, text: res.getValue(res.columns[0])
				};
				if((params.lotitem == 'T' || params.serialized == 'T' || params.usebins == 'T')){
					if(fldId == 'binnumber' && (params.lotitem == 'T' || params.serialized == 'T')){
						binNumberOptions.push(option);
						sublistFields[fldId].addSelectOption(option);
					}else if(fldId == 'tobinnumber')
						sublistFields[fldId].addSelectOption(option);
				}
			});

			// Add status select options
			var invStatus = [{ text: '', value: '' }];
			sublistFields.inventorystatus.addSelectOption({ text: '', value: '' });
//			sublistFields.toinventorystatus.addSelectOption({ text: '', value: '' });
			search.create({
				type: 'inventorystatus',
				columns: [{ name: 'name' }]
			}).run().getRange(0,100).forEach(res=>{
				var opt = { text: res.getValue( res.columns[0] ), value: res.id };
				invStatus.push(opt);
				sublistFields.inventorystatus.addSelectOption(opt);
				sublistFields.toinventorystatus.addSelectOption({
					text: res.getValue( res.columns[0] ), value: res.id,
					isSelected: res.id == 1? true: false
				});
			})

			fields.invstatusopt.defaultValue = JSON.stringify(invStatus);
			fields.inventorydata.defaultValue = JSON.stringify(inventoryDetail);
			fields.binoptions.defaultValue = JSON.stringify(binNumberOptions);

			// Add buttons
			form.addSubmitButton({
				label: 'OK'
			});
			form.addButton({
				id: 'custpage_btnclose',
				label: 'Close',
				functionName: `close();`
			});

			form.clientScriptModulePath = './se_cs_customInventoryDetail';

			response.writePage(form);
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
		
	}
);
