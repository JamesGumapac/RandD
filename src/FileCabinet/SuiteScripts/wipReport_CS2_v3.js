/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord', 'N/format'], function (url, currentRecord, format) {

  function pageInit(context) {
	window.onbeforeunload = null;
    // rec=context.currentRecord;
    // //var status = rec.getValue({fieldId:'msgstatus'});

    // return true;
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
	})
  }


  function fieldChanged(context){
//    window.alert(JSON.stringify(context));
//    return true;

    return true;
  }

  function resetPageLevelOne(){
	  

		var endDate = currentRecord.get().getValue({fieldId: 'custpage_enddate'});
		endDate = endDate? format.format({ value: endDate, type: format.Type.DATE}): '';
		// added by jeromemorden | 02/03/22
		var soFilterValue = currentRecord.get().getValue({fieldId: 'custpage_sofilter'})
		var wipMode = currentRecord.get().getValue({fieldId: 'custpage_mode'}) || '';

		var URL = url.resolveScript({scriptId: 'customscript_wip_report_v2', deploymentId: 'customdeploy_wip_report_v2', returnExternalUrl: false});
		URL += '&custparam_page=1&custparam_enddate=' + endDate;
		URL += '&custparam_sofilter=' + soFilterValue;
		URL += '&custparam_mode=' + wipMode;
			
		window.open(URL, '_self', false);


  }
  
  function resetPageLevelTwo(){

		var endDate = currentRecord.get().getValue({fieldId: 'custpage_enddate'})
		var endTime = ''
		var soFilterValue = currentRecord.get().getValue({fieldId: 'custpage_sofilter'})
		var woFilterValue = currentRecord.get().getValue({fieldId: 'custpage_wofilter'})
		var divFilterValue = currentRecord.get().getValue({fieldId: 'custpage_divfilter'})
		var wipMode = currentRecord.get().getValue({fieldId: 'custpage_mode'}) || ''
		endDate = endDate? format.format({ value: endDate, type: format.Type.DATE}): '';
		var URL = url.resolveScript({scriptId: 'customscript_wip_report_v2', deploymentId: 'customdeploy_wip_report_v2', returnExternalUrl: false});
		URL += '&custparam_page=2';
		URL += '&custparam_enddate=' + endDate;
		
		URL += '&custparam_sofilter=' + soFilterValue;
		URL += '&custparam_wofilter=' + woFilterValue;
		URL += '&custparam_divfilter=' + divFilterValue;
		URL += '&custparam_mode=' + wipMode;
			
		window.open(URL, '_self', false);


  }
  
  function resetPageLevelThree(){
		var endDate = currentRecord.get().getValue({fieldId: 'custpage_enddate'})
		var endTime = ''
		var soFilterValue = currentRecord.get().getValue({fieldId: 'custpage_sofilter'})
		var woFilterValue = currentRecord.get().getValue({fieldId: 'custpage_wofilter'})
		var divFilterValue = currentRecord.get().getValue({fieldId: 'custpage_divfilter'})
		var wipMode = currentRecord.get().getValue({fieldId: 'custpage_mode'}) || ''
		endDate = endDate? format.format({ value: endDate, type: format.Type.DATE}): '';
		var URL = url.resolveScript({scriptId: 'customscript_wip_report_v2', deploymentId: 'customdeploy_wip_report_v2', returnExternalUrl: false});
		URL += '&custparam_page=3';
		URL += '&custparam_enddate=' + endDate;
		
		URL += '&custparam_sofilter=' + soFilterValue;
		URL += '&custparam_wofilter=' + woFilterValue;
		URL += '&custparam_divfilter=' + divFilterValue;
		URL += '&custparam_mode=' + wipMode;
			
		window.open(URL, '_self', false);


  }
  
  function resetPageLevelFour(){
		var endDate = currentRecord.get().getValue({fieldId: 'custpage_enddate'})
		endDate = endDate? format.format({ value: endDate, type: format.Type.DATE}): '';
		// added by jeromemorden | 02/03/22
		var soFilterValue = currentRecord.get().getValue({fieldId: 'custpage_sofilter'});
        var woFilterValue = currentRecord.get().getValue({fieldId: 'custpage_wofilter'});
		var wipMode = currentRecord.get().getValue({fieldId: 'custpage_mode'}) || ''

		var URL = url.resolveScript({scriptId: 'customscript_wip_report_v2', deploymentId: 'customdeploy_wip_report_v2', returnExternalUrl: false});
		URL += '&custparam_page=4&custparam_enddate=' + endDate;
		URL += '&custparam_sofilter=' + soFilterValue;
        URL += '&custparam_wofilter=' + woFilterValue;
		URL += '&custparam_mode=' + wipMode;
			
		window.open(URL, '_self', false);


  }
  
  
  function exportCSV(){
		var endDate = currentRecord.get().getValue({fieldId: 'custpage_enddate'});
    
		var soFilterValue = currentRecord.get().getValue({fieldId: 'custpage_sofilter'}) || '';
		var woFilterValue = currentRecord.get().getValue({fieldId: 'custpage_wofilter'}) || '';
		var divFilterValue = currentRecord.get().getValue({fieldId: 'custpage_divfilter'}) || '';
		var wipMode = currentRecord.get().getValue({fieldId: 'custpage_mode'}) || '';
        
		endDate = endDate? format.format({ value: endDate, type: format.Type.DATE}): '';
		var URL = url.resolveScript({scriptId: 'customscript_wip_report_v2', deploymentId: 'customdeploy_wip_report_v2', returnExternalUrl: false});
		URL += '&csv=T&custparam_enddate=' + endDate;
		
		URL += '&custparam_sofilter=' + soFilterValue;
		URL += '&custparam_wofilter=' + woFilterValue;
		URL += '&custparam_divfilter=' + divFilterValue;
		URL += '&custparam_mode=' + wipMode;
			
		window.open(URL, '_self', false);
  }



  return {
    fieldChanged: fieldChanged,
    pageInit: pageInit,
	resetPageLevelOne: resetPageLevelOne,
	resetPageLevelTwo: resetPageLevelTwo,
	resetPageLevelThree: resetPageLevelThree,
	resetPageLevelFour: resetPageLevelFour,
	exportCSV: exportCSV

  };
});
