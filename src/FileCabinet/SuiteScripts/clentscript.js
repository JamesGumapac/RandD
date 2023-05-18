/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
  "N/search",
  "N/currentRecord",
  "N/url",
  "N/https",
  "N/ui/dialog",
], function (search, currentRecord, url, https, dialog) {
  var record = currentRecord.get();

  function pageInit(context) {}
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


    if (scriptContext.fieldId == "custpage_vendor") {
    //   debugger;
      var vendor = record.getValue({ fieldId: "custpage_vendor" });
      console.log('vendor :',vendor);
      console.log('vendor :',typeof vendor);

      var slurl = url.resolveScript({
                scriptId: getParameterFromURL("script"),
                deploymentId: getParameterFromURL("deploy"),
                params: {
                  vendor: vendor,
                },
              });
              window.onbeforeunload = null;
              location.href = slurl;

    //   if (validateData(vendor)) {
    //     var transactionSearchObj = search.create({
    //       type: "transaction",
    //       filters: [
    //         ["mainline", "is", "T"],
    //         "AND",
    //         [
    //           "type",
    //           "anyof",
    //           "VendBill",
    //           "VendPymt",
    //           "PurchOrd",
    //           "CustPymt",
    //           "VendAuth",
    //         ],
    //         //"AND",
    //         //["vendor.internalid","anyof",vendor]
    //       ],
    //       columns: [search.createColumn({ name: "trandate", label: "Date" })],
    //     });
    //     var searchResultCount = transactionSearchObj.runPaged().count;
    //     log.debug("transactionSearchObj result count", searchResultCount);

    //     if (searchResultCount > 0) {
    //       var slurl = url.resolveScript({
    //         scriptId: getParameterFromURL("script"),
    //         deploymentId: getParameterFromURL("deploy"),
    //         params: {
    //           vendor: vendor,
    //         },
    //       });
    //       window.onbeforeunload = null;
    //       location.href = slurl;
    //     } /*else{
    //                  //alert('No data is present for this vendor ')
    //              }*/
    //   } 

    }
  }

  function validateData(data) {
    if (data != undefined && data != null && data != "") {
      return true;
    } else {
      return false;
    }
  }
  function getParameterFromURL(param) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      // alert(pair);
      if (pair[0] == param) {
        return decodeURIComponent(pair[1]);
      }
    }
    return false;
  }


  function resetPopup() {
    try {
      console.log("resetPopup");
      var url = window.location.href;
      var obj = new URL(url);
      var value = obj.searchParams.get("vendor");
      var q = "&vendor=" + value;
      var replaceValue = "&vendor=" + "";
      url = url.replace(q, replaceValue);

      window.onbeforeunload = null;
      window.location.assign(url);
    } catch (e) {
      alert("Error in resetPopup\n" + e);
    }
  }
  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged,
    // getSuiteletPage: getSuiteletPage,
    resetPopup: resetPopup,
  };
});
