/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @Author Jerome Morden
 */
define(['N/format'],

	function(format){

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
			var lineCount = currentRecord.getLineCount({ sublistId: 'custpage_sublist' });
			for(var line=0; line < lineCount; line++){
				// added by jeromemorden | 01/20/22
				jQuery('#custcol_cb_rda_wo_sched_due_date' + (line+1)).attr('size', '8');

				var dueDate = currentRecord.getSublistValue({
					sublistId: 'custpage_sublist',
					fieldId: 'custcol_cb_rda_wo_sched_due_date',
					line: line
				});

				if(!dueDate)
					continue;

				var dueDate = format.format({
					type: format.Type.DATE,
					value: dueDate
				});

				var today = format.format({
					type: format.Type.DATE,
					value: new Date()
				});
//	console.log(dueDate, today);

				if(dueDate == today)
					jQuery('#custpage_sublistrow' + line).find('td.uir-list-row-cell').attr('style', 'background-color: #36d660 !important;');
			}
			nlapiSetFieldValue('custpage_autosort', 'F') // always untick onpage load
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
			var currentRecord = scriptContext.currentRecord,
			sublistId = scriptContext.sublistId,
			fieldId = scriptContext.fieldId,
			lineNum = scriptContext.lineNum;

//			console.log(sublistId, fieldId, lineNum);

			if(sublistId){
				if(!lineNum)
					lineNum = currentRecord.getCurrentSublistIndex({ sublistId: sublistId });
//			console.log(sublistId, fieldId, lineNum);
				var editedId = currentRecord.getSublistValue({
					sublistId: sublistId,
					line: lineNum,
					fieldId: 'custcol_internalid'
				});
				var duplicatedIds = (currentRecord.getValue({ fieldId: 'custpage_duplicated' }) || '').split(',');

				if(duplicatedIds.indexOf(editedId) >= 0)
					alert('This Work Order has duplicate on this list.  Only the most top line will be processed.');

				var updatedIds = currentRecord.getValue({ fieldId: 'custpage_updated' });
				updatedIds = updatedIds? updatedIds.split(','): [];
				if(updatedIds.indexOf(editedId) < 0)
					updatedIds.push(editedId);

				currentRecord.setValue({
					fieldId: 'custpage_updated',
					value: updatedIds.join(',')
				});
			}else if(fieldId.match(/custpage/gi))
				refreshList();
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
		function saveRecord(scriptContext){
			if(refreshList.triggered)
				return true;
			else if(exportToCSV.triggered){
				scriptContext.currentRecord.setValue({
					fieldId: 'custpage_page',
					value: 'csv'
				});
				return true;
			}

			var currentRecord = scriptContext.currentRecord;
			var updatedIds = currentRecord.getValue({ fieldId: 'custpage_updated' });
			if(!updatedIds){
				alert('Nothing to update.');
				return false;
			}

			scriptContext.currentRecord.setValue({
				fieldId: 'custpage_page',
				value: '2'
			});
			return true;
		}

		function refreshList(){
			refreshList.triggered = 1;
			jQuery('#submitter').click();
		}

		function exportToCSV(url){
			window.open(url,"_blank");
		}

		function autoSort() {
			nlapiSetFieldValue('custpage_autosort', 'T')
			refreshList()
			// document.querySelectorAll("span#custpage_sublistdir1")[0].click();
		}

		return {
			pageInit: pageInit,
			fieldChanged: fieldChanged,
			saveRecord: saveRecord,
			refreshList: refreshList,
			exportToCSV: exportToCSV,
			autoSort: autoSort
		};
		
	}
);
