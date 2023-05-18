/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @NAuthor Jerome Morden
 */
define(['N/config', 'N/file', 'N/record', 'N/render', 'N/runtime', 'N/search'],

	(config, file, record, render, runtime, search) => {
	   
		/**
		 * Definition of the Suitelet script trigger point.
		 *
		 * @param {Object} context
		 * @param {ServerRequest} context.request - Encapsulation of the incoming request
		 * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
		 * @Since 2015.2
		 */
		const onRequest = context => {
			var { request, response } = context;
			var params = request.parameters;
log.debug('WO ID', params.rid);

			if(!params.rid)
				throw('Invalid url.');

			// Load workorder record
			var woRecord = record.load({
				type: 'workorder',
				id: params.rid
			});

			// Load company information record
			var companyInformation = config.load({
				type: config.Type.COMPANY_INFORMATION
			});

			// Load work order issue search
			var script = runtime.getCurrentScript();
			var searchId = script.getParameter('custscript_printbompdf_search');
			var woIssueSearch = search.load({ id: searchId });
			woIssueSearch.filters.push(search.createFilter({
				name: 'createdfrom',
				operator: search.Operator.ANYOF,
				values: params.rid
			}));
			var lotNumbers = {};
			var invDetails = {};
			getAllSSResult(woIssueSearch.run()).forEach(res=>{
				var itemId = res.getValue(res.columns[1]);
				var lotNumber = res.getText(res.columns[2]);
				var binNumber = res.getText(res.columns[3]);

				if(!invDetails[itemId]){
					invDetails[itemId] = [];
					lotNumbers[itemId] = [];
				}

				invDetails[itemId].push( lotNumber || binNumber );

				if(lotNumber)
					lotNumbers[itemId].push(lotNumber);
			});

			// Load BOM revision record
			var revId = woRecord.getValue({ fieldId: 'billofmaterialsrevision' });
			var revRecord = record.load({
				type: 'bomrevision',
				id: revId
			});

			// Get work order quantity
			var woQty = parseFloat( woRecord.getValue({ fieldId: 'quantity' }) ) || 0;

			// Get all components
			var components = [];
			getAllSSResult( search.create({
				type: 'workorder',
				filters: [
					[ 'internalid', 'anyof', woRecord.id ], 'AND',
					[ 'mainline', 'is', 'F' ], 'AND',
					[ 'formulanumeric: CASE WHEN {name} IS NOT NULL THEN 1 ELSE 0 END', 'equalto', '1' ], 'AND',
					[ 'quantity', 'greaterthan', '0' ]
				],
				columns: [
					{ name: 'item' },
					{ name: 'salesdescription', join: 'item' },
					{ name: 'quantity' }
				]
			}).run() ).forEach( res=> {
				var item = res.getValue(res.columns[0]);
				components.push({
					internalid: item,
					item: res.getText(res.columns[0]),
					description: res.getValue(res.columns[1]),
					quantity: addCommas( res.getValue(res.columns[2]) ),
					inventorydetail: invDetails[item]? invDetails[item].join(lotNumbers[item].length?'<br/><br/><br/>': '<br/>'): '',
					lotnumber: lotNumbers[item]
				});
			});
/*
			var sublistId = 'component';
			var lineCount = revRecord.getLineCount({ sublistId });
			for(var line = 0; line < lineCount; line++){
				var item = revRecord.getSublistValue({ sublistId, line, fieldId: 'item' });
				components.push({
					internalid: item,
					item: revRecord.getSublistText({ sublistId, line, fieldId: 'item' }),
					description: revRecord.getSublistValue({ sublistId, line, fieldId: 'description' }),
					quantity: addCommas( parseFloat( revRecord.getSublistValue({
						sublistId, line, fieldId: 'bomquantity' }) ) * woQty ),
					inventorydetail: invDetails[item]? invDetails[item].join(lotNumbers[item].length?'<br/><br/><br/>': '<br/>'): '',
					lotnumber: lotNumbers[item]
				});
			}
*/

			// Build custom source json
			var custRecord = {};
			(['tranid', 'trandate', 'entity', 'assemblyitem', 'quantity', 'units']).forEach(fieldId=>{
				custRecord[fieldId] = woRecord.getText({ fieldId }) || woRecord.getValue({ fieldId });
			});
			custRecord.item = components;
			custRecord.logoUrl = file.load({ id: '4007' }).url.replace(/&/gi,'&amp;');

			// Load the pdf template
			var tempId = script.getParameter('custscript_printbompdf_fileid');
			var tempString = file.load({ id: tempId }).getContents();

			// Create renderer
			var renderer = render.create();
			renderer.templateContent = tempString;
			renderer.addRecord({
				templateName: 'companyInformation',
				record: companyInformation
			});
			renderer.addCustomDataSource({
				alias: 'record',
				format: render.DataSource.OBJECT,
				data: custRecord
			});
			var pdfFile = renderer.renderAsPdf();

			response.writeFile( pdfFile, true );

		}

		// Get all saved search results.
		const getAllSSResult = searchResultSet => {
			var result = [];
			for(var x=0;x<=result.length;x+=1000)
				result = result.concat(searchResultSet.getRange(x,x+1000)||[]);
			return result;
		}

		const addCommas = x => {
			var parts = x.toString().split(".");
			parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			return parts.join(".");
		}

		return {
			onRequest
		};
		
	});
