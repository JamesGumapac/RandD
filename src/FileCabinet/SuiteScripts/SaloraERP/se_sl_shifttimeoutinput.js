/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @NAuthor Jerome Morden
 */
define(['N/record', 'N/redirect', 'N/runtime', 'N/search', 'N/ui/serverWidget'],

	(record, redirect, runtime, search, ui) => {
	   
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
			if(request.method == 'POST')
				createRecord( params );

			var form = ui.createForm({
				title: 'Shift Time'
			});

			var fields = {};
			getFieldIds().forEach((fieldId, i)=>{
				var id = fieldId.replace(/custrecord_/gi,'custpage_');
				var label = (id.match(/first/gi)? 'First': id.match(/second/gi)? 'Second': 'Third') + ' Shift ' +
					(i%2 == 0? 'Start': 'End');
				var type = ui.FieldType.TIMEOFDAY;

				fields[id] = form.addField({ id, label, type });
			});

			Object.keys(fields).forEach((field, i)=>{
				fields[field].updateBreakType({
					//layoutType: ui.FieldLayoutType[i%2 == 0? 'STARTROW': 'ENDROW']
					breakType: ui.FieldBreakType.STARTCOL
				});
              
              fields[field].updateDisplaySize({
					height: 12,
                    width: 18
				});
              

				fields[field].isMandatory = true;
			});

			var sublist = form.addSublist({
				label: 'Shift Time List',
				id: 'custpage_sublist',
				type: ui.SublistType.LIST
			});
			var sublistFields = {};
			getFieldIds().forEach((fieldId, i)=>{

				if(!i)
					sublistFields['created'] = sublist.addField({
						id: 'created',
						label: 'Date Created',
						type: ui.FieldType.TEXT
					});

				var id = fieldId.replace(/custrecord_/gi,'custcol_');
				var label = (id.match(/first/gi)? 'First': id.match(/second/gi)? 'Second': 'Third') + ' Shift ' +
					(i%2 == 0? 'Start': 'End');
				var type = ui.FieldType.TEXT;

				sublistFields[id] = sublist.addField({ id, label, type });
			});

			var searchColumns = getFieldIds().map(id=>{return { name: id };});
			searchColumns.unshift({ name: 'created', sort: search.Sort.DESC });
			getAllSSResult( search.create({
				type: 'customrecord_shift_times',
				columns: searchColumns
			}).run() ).forEach((res, line)=>{
				res.columns.forEach(col=>{
					var id = col.name.replace(/custrecord_/gi,'custcol_');

					sublist.setSublistValue({
						id, line,
						value: res.getValue(col)
					});

					if(fields[col.name.replace(/custrecord_/gi,'custpage_')] && !line)
						fields[col.name.replace(/custrecord_/gi,'custpage_')].defaultValue = res.getValue(col);
				});
				
			});

			form.addSubmitButton();

			response.writePage(form);
		}

		const createRecord = params => {
			var shiftRecord = record.create({
				type: 'customrecord_shift_times',
				isDynamic: true
			});

			getFieldIds().forEach(fieldId=>{
				shiftRecord.setValue({
					fieldId, value: params[fieldId.replace(/custrecord_/gi,'custpage_')]
				});
			});

			shiftRecord.save();

			var script = runtime.getCurrentScript();
			redirect.toSuitelet({
				scriptId: script.id,
				deploymentId: script.deploymentId
			});

		}

		const getAllSSResult = searchResultSet => {
			var result = [];
			for(var x=0;x<=result.length;x+=1000)
				result = result.concat(searchResultSet.getRange(x,x+1000)||[]);
			return result;
		};

		const getFieldIds = () => {
			return [
				'custrecord_first_shift_start',
				'custrecord_first_shift_end',
				'custrecord_second_shift_start',
				'custrecord_second_shift_end',
				'custrecord_third_shift_start',
				'custrecord_third_shift_end'
			];
		}

		return {
			onRequest
		};
		
	});
