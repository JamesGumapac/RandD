/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(["N/record", "N/runtime", "N/search"], /**
 * @param {record}
 *            record
 * @param {runtime}
 *            runtime
 * @param {search}
 *            search
 */ function (record, runtime, search) {
  /**
   * Marks the beginning of the Map/Reduce process and generates input
   * data.
   *
   * @typedef {Object} ObjectRef
   * @property {number} id - Internal ID of the record instance
   * @property {string} type - Record type id
   *
   * @return {Array|Object|Search|RecordRef} inputSummary
   * @since 2015.1
   */
  function getInputData() {
    try {
      // [
      //     {
      //        wo: "1037863",
      //        lot: "93125"
      //     },
      // {
        //        wo: "1037863",
        //        lot: "93125"
        //     }

      //  ]
      var final_Array = [];
      var data = JSON.parse(
        runtime.getCurrentScript().getParameter({
          name: "custscript_lot_wo_map_array",
        })
      );
      log.debug("data :", data);

  

      // data.length
      for (var index = 0; index < data.length; index++) {
        var temp_array = [];

        // data[index].wo
        // data[index].lot
        var customrecord_cntm_clientappsublistSearchObj = search.create({
          type: "customrecord_cntm_clientappsublist",
          filters: [
            ["custrecord_cntm_lot_record", "anyof", data[index].lot],
            "AND",
            ["custrecord_cntm_work_order", "anyof", data[index].wo],
            "AND",
            ["custrecord_cntm_previously_scrapepd", "is", "F"],
          ],
          columns: [
            search.createColumn({ name: "internalid", label: "Internal ID" }),
            search.createColumn({
              name: "custrecord_cntm_work_order",
              label: "WO",
            }),
            search.createColumn({
              name: "custrecord_cntm_lot_record",
              label: "Lot Rec",
            }),
          ],
        });
        var searchResultCount = customrecord_cntm_clientappsublistSearchObj.runPaged()
          .count;
        log.debug(
          "customrecord_cntm_clientappsublistSearchObj result count",
          searchResultCount
        );
        customrecord_cntm_clientappsublistSearchObj
          .run()
          .each(function (result) {
            temp_array.push(result.id);
            return true;
          });
        final_Array.push(temp_array);

        record.submitFields({
          // type: "customrecord_cntm_clientappsublist",
          type: "customrecord_cntm_lot_creation",
          id: data[index].lot,
          values: {
            custrecord_cntm_scraped_panel: true,
          },
        });
        log.debug('value setted')
      }


      return final_Array;
    } catch (error) {
      log.error("Error in getinput :", error);
    }
  }

  /**
   * Executes when the map entry point is triggered and applies to
   * each key/value pair.
   *
   * @param {MapSummary}
   *            context - Data collection containing the key/value
   *            pairs to process through the map stage
   * @since 2015.1
   */
  function map(context) {
    try {
      log.debug("-------MAP------");
      var array = JSON.parse(context.value);
      log.debug("array :", array);

      for (var index = 0; index < array.length; index++) {
        record.submitFields({
          type: "customrecord_cntm_clientappsublist",
          id: array[index],
          values: {
            custrecord_cntm_previously_scrapepd: true,
          },
        });
      }
      var scriptObj = runtime.getCurrentScript();
       log.debug('Remaining governance units input: ' + scriptObj.getRemainingUsage());
    } catch (error) {
      log.error("Error in map :", error);
    }
  }
  /**
   * Executes when the reduce entry point is triggered and applies to
   * each group.
   *
   * @param {ReduceSummary}
   *            context - Data collection containing the groups to
   *            process through the reduce stage
   * @since 2015.1
   */
  function reduce(context) {}

  /**
   * Executes when the summarize entry point is triggered and applies
   * to the result set.
   *
   * @param {Summary}
   *            summary - Holds statistics regarding the execution of
   *            a map/reduce script
   * @since 2015.1
   */
  function summarize(summary) {}

  return {
    getInputData: getInputData,
    map: map,
    // reduce : reduce,
    summarize: summarize,
  };
});
