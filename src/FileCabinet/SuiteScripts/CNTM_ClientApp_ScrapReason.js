/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define([
  "N/file",
  "N/http",
  "N/https",
  "N/record",
  "N/runtime",
  "N/search",
  "N/url",
], function (file, http, https, record, runtime, search, url) {
  /**
   * Function called upon sending a GET request to the RESTlet.
   *
   * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
   * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
   * @since 2015.1
   */
  function doGet(requestParams) {}

  /**
   * Function called upon sending a PUT request to the RESTlet.
   *
   * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
   * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
   * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
   * @since 2015.2
   */
  function doPut(requestBody) {}

  /**
   * Function called upon sending a POST request to the RESTlet.
   *
   * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
   * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
   * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
   * @since 2015.2
   */
  function doPost(requestBody) {
    log.debug("requestParams", JSON.stringify(requestBody));
    var getscrreson = requestBody.getscrreson;
    if (getscrreson == "true") {
      return {
        success: "true",
        datain: getllresons(),
      };
    }
    if (getscrreson == "forsublist") {
      var subid = requestBody.subid;
      return {
        success: "true",
        datain: getreasons(subid),
      };
    }
    if (getscrreson == "savedata") {
      var itemdetails = requestBody.itemdetails;
      //var subid = requestBody.subid;
      return {
        success: "true",
        datain: saveDetails(itemdetails),
      };
    }
    function getllresons() {
      var customlist_cnt_scrap_reasonSearchObj = search.create({
        type: "customlist_cnt_scrap_reason",
        filters: [],
        columns: [
          search.createColumn({
            name: "name",
            sort: search.Sort.ASC,
          }),
          "internalid",
        ],
      });
      var searchResultCount =
        customlist_cnt_scrap_reasonSearchObj.runPaged().count;
      log.debug(
        "customlist_cnt_scrap_reasonSearchObj result count",
        searchResultCount
      );
      var finaldataset = [];
      customlist_cnt_scrap_reasonSearchObj.run().each(function (result) {
        // .run().each has a limit of 4,000 results

        var jsondata = {};
        var scrid = result.getValue(
          search.createColumn({ name: "internalid" })
        );
        var scrname = result.getValue(
          search.createColumn({
            name: "name",
            sort: search.Sort.ASC,
          })
        );

        jsondata.scrid = scrid;
        jsondata.scrname = scrname;
        finaldataset.push(jsondata);

        return true;
      });

      return finaldataset;
    }
    function getreasons(subId) {
      var customrecord_cntm_scrap_historySearchObj = search.create({
        type: "customrecord_cntm_scrap_history",
        filters: [["custrecord_cntm_parent", "anyof", subId]],
        columns: [
          search.createColumn({
            name: "custrecord_cntm_sh_scrap_qty",
            label: "Scrap Quantity ",
          }),
          search.createColumn({
            name: "custrecord_cntm_sh_scrap_reason",
            label: "Scrap Reason ",
          }),
          search.createColumn({ name: "internalid", label: "Internal ID" }),
        ],
      });
      var searchResultCount =
        customrecord_cntm_scrap_historySearchObj.runPaged().count;
      log.debug(
        "customrecord_cntm_scrap_historySearchObj result count",
        searchResultCount
      );
      var sublistcnt = 0;

      var finaldataset = [];
      customrecord_cntm_scrap_historySearchObj.run().each(function (result) {
        var scrqty = parseInt(
          result.getValue({
            name: "custrecord_cntm_sh_scrap_qty",
          })
            ? result.getValue({
                name: "custrecord_cntm_sh_scrap_qty",
              })
            : 0
        );
        var scrname = result.getValue({
          name: "custrecord_cntm_sh_scrap_reason",
        })
          ? result.getValue({
              name: "custrecord_cntm_sh_scrap_reason",
            })
          : "";

        var scrText = result.getText({
          name: "custrecord_cntm_sh_scrap_reason",
        })
          ? result.getText({
              name: "custrecord_cntm_sh_scrap_reason",
            })
          : "";
        var subid = result.getValue(
          search.createColumn({
            name: "custrecord_cntm_parent",
            label: "Parent",
          })
        );
        var internalId = result.getValue(
          search.createColumn({ name: "internalid", label: "Internal ID" })
        );
        var jsondata = {};
        jsondata.scrreason = scrname;
        jsondata.scrqty = scrqty;
        jsondata.scrreasontxt = scrText;
        jsondata.internalId = internalId;
        jsondata.seq = sublistcnt;
        jsondata.subid = subid;
        finaldataset.push(jsondata);
        sublistcnt++;
        return true;
      });
      return finaldataset;
    }

    function saveDetails(itemdetails) {
      log.debug("main details", itemdetails);

      if (itemdetails.length > 0) {
        for (var j = 0; j < itemdetails.length; j++) {
          log.debug(" sub details", itemdetails[j]);
          var tempDetails = itemdetails[j];
          try {
            if (tempDetails.length > 0) {
              for (var k = 0; k < tempDetails.length; k++) {
                var reason = tempDetails[k].scrreason;
                var subId = tempDetails[k].subid;
                var scrid = tempDetails[k].scrid;
                var scrqty = tempDetails[k].scrqty;
                var customrecord_cntm_scrap_historySearchObj = search.create({
                  type: "customrecord_cntm_scrap_history",
                  filters: [
                    ["custrecord_cntm_parent", "anyof", subId],
                    "AND",
                    ["custrecord_cntm_sh_scrap_reason", "anyof", reason],
                  ],
                  columns: [
                    search.createColumn({
                      name: "custrecord_cntm_sh_scrap_qty",
                      label: "Scrap Quantity ",
                    }),
                    search.createColumn({
                      name: "custrecord_cntm_sh_scrap_reason",
                      label: "Scrap Reason ",
                    }),
                  ],
                });
                var searchResultCount =
                  customrecord_cntm_scrap_historySearchObj.runPaged().count;
                log.debug(
                  "customrecord_cntm_scrap_historySearchObj result count",
                  searchResultCount
                );
                var rec;
                if (searchResultCount > 0) {
                  log.debug("--LOAD--");
                  customrecord_cntm_scrap_historySearchObj
                    .run()
                    .each(function (result) {
                      rec = record.load({
                        type: "customrecord_cntm_scrap_history",
                        id: result.id,
                      });
                      return true;
                    });
                } else {
                  log.debug("--CREATE--");
                  rec = record.create({
                    type: "customrecord_cntm_scrap_history",
                  });
                  rec.setValue({
                    fieldId: "custrecord_cntm_parent",
                    value: subId,
                  });

                  rec.setValue({
                    fieldId: "custrecord_cntm_sh_scrap_reason",
                    value: reason,
                  });
                }
                if (rec) {
                  // alert(qty);
                  rec.setValue({
                    fieldId: "custrecord_cntm_sh_scrap_qty",
                    value: scrqty,
                  });
                  var recId = rec.save();
                  log.debug("--SAVE--");
                  //editRecArr.push(recId);
                }
              }
              // return true; //Commented on 05-09-2022 because only one scrap record were created
            }
          } catch (e) {
            return JSON.stringify(e);
          }
        }
      }
    }
  }

  /**
   * Function called upon sending a DELETE request to the RESTlet.
   *
   * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
   * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
   * @since 2015.2
   */
  function doDelete(requestParams) {}

  return {
    get: doGet,
    put: doPut,
    post: doPost,
    delete: doDelete,
  };
});
