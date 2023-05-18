/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@NModuleScope SameAccount
 */
define(['N/error', 'N/currentRecord', 'N/url', 'N/format', 'N/http'],
  function (error, currentRecord, url, format) {

    function pageInit(context) {
      console.log('starting pageInit');
    }

    function displayStatus() {
      var record = currentRecord.get();
      if (record.id) {
        showAlertBox('div__waiting__avt', 'Creating Work Order Issue Pick List', 'Now creating Work Order Issue Pick List. You will be redirected once complete.', 0, '100%');
      }
    }

    function callRenderPickList() {

      var record = currentRecord.get();

      var recId = record.id;
      console.log('recId is: ' + recId);

      var suiteletURL = url.resolveScript({
        scriptId: 'customscript_woissue_picklist_sl',
        deploymentId: 'customdeploy_woissue_picklist_sl',
        params: {
          custparam_woiid: recId
        }
      });

      // document.location=suiteletURL;
      window.open(suiteletURL);
    }


    return {
      pageInit: pageInit,
      displayStatus: displayStatus,
      callRenderPickList: callRenderPickList

    };
  });