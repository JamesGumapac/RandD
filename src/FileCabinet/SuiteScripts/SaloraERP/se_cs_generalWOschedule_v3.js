/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @Author Jerome Morden
 */
 define(['N/format', '../lib/moment.min'],

 function(format, moment){

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
        try {
            nlapiSetFieldValue('custpage_autosort', 'F'); // always untick onpage load
            jQuery(document).ready(function() {
                // Float headers
                (function ($, undefined) {
                    $(function () {
                    const windowHeight = $(window).height();
                
                    $('.uir-machine-table-container')
                        .filter(function(index, elem) {
                            return $(elem).height() > windowHeight
                        })
                        .css('height', '70vh')
                        .bind('scroll', function(event)  {
                            const headerElem = $(event.target).find('.uir-machine-headerrow');
                            headerElem.css('transform', 'translate(0, '+event.target.scrollTop+'px)');
                        })
                        .bind('scroll', function(event) {
                            const headerElem = $(event.target).find('.uir-list-headerrow');
                            headerElem.css('transform', 'translate(0, '+event.target.scrollTop+'px)');
                        })
                    });
                })(jQuery);
                /////////////////////////////////////////////
        
                var currentRecord = scriptContext.currentRecord;
                var lineCount = currentRecord.getLineCount({ sublistId: 'custpage_sublist' });
                for(var line=0; line < lineCount; line++){
                    // added by jeromemorden | 01/20/22
                    jQuery('#custcol_cr_operation_line_wo_scheddue' + (line+1)).attr('size', '8');
       
                    var dueDate = currentRecord.getSublistText({
                        sublistId: 'custpage_sublist',
                        fieldId: 'custcol_cb_rda_wo_sched_due_date',
                        line: line
                    });
                    var latesProjEndDate = moment(currentRecord.getSublistValue({
                        sublistId: 'custpage_sublist',
                        fieldId: 'custcol_cb_latest_proj_end_date',
                        line: line
                    })).format('M/D/YYYY');
                    var today = moment().format('M/D/YYYY')
                    var woPriority = parseFloatOrZero(currentRecord.getSublistValue({
                        sublistId: 'custpage_sublist',
                        fieldId: 'custcol_cb_rda_wo_priorty',
                        line: line
                    }));
                    var outsourced = JSON.parse(currentRecord.getSublistValue({
                        sublistId: 'custpage_sublist',
                        fieldId: 'custcol_cb_outsourced',
                        line: line
                    }) || 'false')
                    var finishtype = currentRecord.getSublistValue({
                        sublistId: 'custpage_sublist',
                        fieldId: 'custcol_cb_wo_finishtype',
                        line: line
                    }) || '';
                    var outside_service = JSON.parse(currentRecord.getSublistValue({
                        sublistId: 'custpage_sublist',
                        fieldId: 'custcol_cb_wo_outsideservice',
                        line: line
                    }) || 'false')
                    var soType = currentRecord.getSublistValue({
                        sublistId: 'custpage_sublist',
                        fieldId: 'custcol_cb_rda_sales_order_type',
                        line: line
                    });
                    var style = '';

                    ///////////////////////// BG COLOR //////////////////////////////
                    // EXCEL ROW 9 - very light green
                    if (woPriority < 1) {
                        style += 'font-weight: bold;'
                        style += 'font-style: italic;'
                        style += 'background-color: #8EF99B !important;'
                    }
                    // ORIGINAL DESIGN BY JEROME - green
                    //else if(dueDate == today)
                        //style += 'background-color: #36d660 !important;'
                    // EXCEL ROW 10 - pink
                    else if (woPriority == 3)
                        style += 'background-color: #ff9999 !important;'
                    // EXCEL ROW 11 - yellow
                    else if (woPriority == 2)
                        style += 'background-color: #ffff00 !important;';
                    // EXCEL ROW 12 - purple
                    else if (woPriority == 1)
                        style += 'background-color: #cc99ff !important;';
                    // EXCEL ROW 15 - orange
                    else if (outsourced)
                        style += 'background-color: #f4b084 !important;';
                    // EXCEL ROW 16 - green
                    /* else if (finishtype.match(/enepig-after sm|enepig-full body plate|enig-after sm|enig-full body plate/gi) && !style.match(/background-color/g))
                        style += 'background-color: #a9d08e !important;'; */
                    // EXCEL ROW 17 - blue
                    else if (outside_service)
                        // style += 'background-color: #00b0f0 !important;';
                        jQuery('#custpage_sublistrow' + line + ' td:nth-child(9)').attr('style', 'background-color: #00b0f0 !important;');
                    ///////////////////////// END BG COLOR //////////////////////////////
                    ///////////////////////// TEXT COLOR //////////////////////////////
                    // EXCEL ROW 14 - orange gray if so type is R&D Test (6)
                    if (soType.match(/r&d test/gi)) {
                        jQuery('#custpage_sublistrow' + line).find('td.uir-list-row-cell:nth-child(8) a').attr('style', 'color: #c2c2c2 !important;') // Set the SO link color to gray
                        jQuery('#custpage_sublistrow' + line).find('td.uir-list-row-cell:nth-child(10) a').attr('style', 'color: #c2c2c2 !important;') // Set the WO link color to gray
                        style += 'color: #c2c2c2 !important;';
                    }
                    ///////////////////////// END TEXT COLOR //////////////////////////////
                    ///////////////////////// APPLY TR STYLE //////////////////////////////
                    if (style) 
                        jQuery('#custpage_sublistrow' + line).find('td.uir-list-row-cell').attr('style', style);
                    ///////////////////////// END APPLY TR STYLE //////////////////////////////
                    ///////////////////////// OVERRIDING CELL COLOR //////////////////////////////
                    // EXCEL ROW 13 -  After placing the row color, replace the lastprojectedenddate cell with bold and red color
                    if (dueDate && latesProjEndDate) {
                        if (new Date(dueDate) < new Date(latesProjEndDate)) {
                            style += 'font-weight: bold;';
                            style += 'color: #ff1616 !important;';
                            style = style.replace(/font-style: italic;/g,'')
                            jQuery('#custpage_sublistrow' + line).find('td.uir-list-row-cell:nth-child(7)').attr('style', style); // 7-Latest Projected End Date (RED TEXT BOLD)
                        }
                    }
                    // EXCEL ROW 16 - green 03172022 as per request - After placing the row color, replace the item cell with the finishtype green color
                    if (finishtype.match(/enepig-after sm|enepig-full body plate|enig-after sm|enig-full body plate/gi))
                        jQuery('#custpage_sublistrow' + line + ' td:nth-child(9)').attr('style', 'background-color: #a9d08e !important;');
                    ///////////////////////// END OVERRIDING CELL COLOR //////////////////////////////

                    ///////////////////////// LOG //////////////////////////////
                    /* console.log(line, finishtype, style.match(/background-color/g), finishtype.match(/enepig-after sm|enepig-full body plate|enig-after sm|enig-full body plate/gi))
                    if (line == 4)
                        console.log(style) */
                    ///////////////////////// END LOG //////////////////////////////
                }
            });
        } catch(e) {
            console.log('Error floating headers', e.message)
        }
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
             if (!fieldId.match(/autosort/gi))
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
        
        var found = hasNullQfactor(scriptContext.currentRecord)
        if(found >= 1){
            alert('Please input a valid Q-Factor value')
            return false
        }

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
         jQuery('#submitter').click().attr('disabled', true);
     }

     function exportToCSV(url){
         window.open(url,"_blank");
     }

     function autoSort() {
         nlapiSetFieldValue('custpage_autosort', 'T')
         refreshList()
         // document.querySelectorAll("span#custpage_sublistdir1")[0].click();
     }

     function hasNullQfactor(currentRecord) {
        var found = -1
        var lineCount = currentRecord.getLineCount('custpage_sublist')

        for(var i = 0; i < lineCount; i++) {
            var qFactorI = currentRecord.getSublistValue('custpage_sublist', 'custcol_cb_rda_qfactor', i)
            if(qFactorI == "") {
                found = i + 1
                break
            }
        }

        return found
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
