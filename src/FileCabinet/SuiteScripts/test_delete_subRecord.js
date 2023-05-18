/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
/**
 * Date				Version		Author		Remarks
 *
 *
 * */
define(["N/record", "N/runtime", "N/search"], function (
  record,
  runtime,
  search
) {
  /** 1275
   * https://tstdrv2061170.app.netsuite.com/app/common/search/search.nl?cu=T&e=T&id=1099
   * Marks the beginning of the Map/Reduce process and generates input data.
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
      log.debug("MR Called");
      var recordIdArray = [];

      var searchLoad = runtime.getCurrentScript().getParameter({
      	name: 'custscript1'
      });
      var searchChildRecValue = search.load({
        id: searchLoad
      });
      var searchResultCount = searchChildRecValue.runPaged().count;
      log.debug('searchResultCount :',searchResultCount);

      
      var resultSet = searchChildRecValue.run();
      var currentRange = resultSet.getRange({
          start: 0,
          end: 1000
      });
      var i = 0; // iterator for all search results
      var j = 0; // iterator for current result range 0..999
    
      var result = currentRange[0];

      while (j < currentRange.length) {
        var result = currentRange[j];
            recordIdArray.push(result.id);
        
        // finally:
        i++;
        j++;
        if (j == 1000) { // check if it reaches 1000
            j = 0; // reset j an reload the next portion
            currentRange = resultSet.getRange({
                start: i,
                end: i + 1000
            });
        }
    }
      return recordIdArray;
    } catch (e) {
      log.error("Error in getInputData" + e);
    }
  }

  /**
   * Executes when the map entry point is triggered and applies to each key/value pair.
   *
   * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
   * @since 2015.1
   */
  function map(mapContext) {
    try {
      log.debug("-----MAP-----");

      var key = mapContext.key;
      // log.debug("key", key);
      var recordValue = JSON.parse(mapContext.value);
     
      var featureRecord = record.delete({
        type: 'lotnumberedassemblyitem',
        id: recordValue,
       });
       log.debug('delete :',recordValue)
    } catch (error) {
      log.error("Error in map : ", error);
    }
  }

  /**
   * Executes when the reduce entry point is triggered and applies to each group.
   *
   * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
   * @since 2015.1
   */
  function reduce(context) {}

  /**
   * Executes when the summarize entry point is triggered and applies to the result set.
   *
   * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
   * @since 2015.1
   */
  function summarize(summary) {

  }
  return {
    getInputData: getInputData,
    map: map,
    // reduce: reduce,
    // summarize: summarize
  };
});
