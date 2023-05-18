/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
 define(["N/record", "N/runtime", "N/search", "N/task", "N/url", "N/https"], /**
 * @param {record}
 *            record
 * @param {runtime}
 *            runtime
 * @param {search}
 *            search
 */ function (record, runtime, search, task, url, https) {
  //For creating task for lot record creation

  /**
   * Definition of the Suitelet script trigger point.
   *
   * @param {Object}
   *            context
   * @param {ServerRequest}
   *            context.request - Encapsulation of the incoming request
   * @param {ServerResponse}
   *            context.response - Encapsulation of the Suitelet response
   * @Since 2015.2
   */
  function onRequest(context) {
    try {
      log.debug("IN SUITELET");
      var routing_id = context.request.parameters.routingId;
      log.debug("routing_id :", routing_id);

      var routingObjRecord = record.load({
        type: record.Type.MANUFACTURING_ROUTING,
        id: routing_id,
        isDynamic: true,
      });
      var routingLines = routingObjRecord.getLineCount({
        sublistId: "routingstep",
      });
      log.debug("routingLines :", routingLines);

      var boards_per_panel = routingObjRecord.getValue({
        fieldId: "custrecord_cntm_fab_boards_per_panel",
      });
      log.debug('boards_per_panel :',boards_per_panel);
      
      // if(boards_per_panel == )
    
      boards_per_panel =  validateData(boards_per_panel) == 'T' || validateData(boards_per_panel) == true ?  boards_per_panel :'1'

      log.debug('boards_per_panel after;',boards_per_panel);

      

      var remainLines = parseInt(context.request.parameters.rem);
      log.debug("remainLines :", remainLines);

      if (validateData(boards_per_panel)) {
        log.debug("CONDITON");

        var finalCount;
        if (routingLines - remainLines > 70) {
          finalCount = remainLines + 70;
        } else {
          finalCount = routingLines;
        }
        log.debug("finalCount ;", finalCount);

        for (var index = remainLines; index < finalCount; index++) {
          // log.debug("FOR ");

          routingObjRecord.selectLine({
            sublistId: "routingstep",
            line: index,
          });
          var operationName = routingObjRecord.getSublistValue({
            sublistId: "routingstep",
            fieldId: "operationname",
            line: index,
          });
          log.debug('operationName :',operationName);

          var set_up_time = getSetUpTimeForOperation(
            operationName,
            boards_per_panel
          );
          log.debug('SET_UP_TIME :',set_up_time);

          routingObjRecord.setCurrentSublistValue({
            sublistId: "routingstep",
            fieldId: "runrate",
            // line: index,
            value: set_up_time,
          });

          routingObjRecord.commitLine({
            sublistId: "routingstep",
          });
          log.debug("COMMIT", index);
        }
        routingObjRecord.save();
        log.debug("SAVED");
        remainLines = finalCount;

        if (routingLines > remainLines) {
          log.debug("SUITE CALLED");
          var output = url.resolveScript({
            scriptId: "customscript_cntm_sl_update_routing_time",
            deploymentId: "customdeploy_cntm_sl_ud_routing_time_dep",
            returnExternalUrl: true,
          });
          output = output + "&routingId=" + routing_id + "&rem=" + remainLines;
          var response = https.get({
            url: output,
          });
          // log.debug("resp", response);
        }
        // context.response.write("SUCCESS");
      }
      context.response.write("SUCCESS");
    } catch (e) {
      log.debug("error", e);
      // context.response.write(e.message);
      context.response.write("ERROR");
    }
  }

  function validateData(data) {
    if (data != undefined && data != null && data != "") {
      return true;
    } else {
      return false;
    }
  }

  function getSetUpTimeForOperation(operation, boards) {
    try {
   //   log.debug('Function getSetUpTimeForOperation');
     // log.debug('operation :',operation);
      //log.debug('boards :',boards);

      var wip_time;
      var calculatedTime;
      var customrecord_gate_times_and_operations_SearchObj = search.create({
        type: "customrecord_gate_times_and_operations_",
        filters: [["name", "haskeywords", operation]],
        columns: [
          search.createColumn({
            name: "name",
            sort: search.Sort.ASC,
            label: "Name",
          }),
          search.createColumn({
            name: "custrecord_wip_time_",
            label: "WIP Time",
          }),
        ],
      });
      var searchResultCount =
        customrecord_gate_times_and_operations_SearchObj.runPaged().count;
      //  log.debug("customrecord_gate_times_and_operations_SearchObj result count",searchResultCount);

      if (searchResultCount > 0) {
        customrecord_gate_times_and_operations_SearchObj
          .run()
          .each(function (result) {
            wip_time = result.getValue({
              name: "custrecord_wip_time_",
              label: "WIP Time",
            });
            log.debug('wip_time :',wip_time);

            if (validateData(wip_time)) {
              // log.debug('wip_time :',wip_time);
              calculatedTime = wip_time / boards;
            }
            return true;
          });

        return calculatedTime.toFixed(2);
      }
    } catch (error) {
      log.debug("getSetUpTimeForOperation :", error);
    }
  }

  return {
    onRequest: onRequest,
  };
});
