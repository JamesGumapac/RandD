/**
* @NApiVersion 2.1
* @NScriptType MapReduceScript
*/
define(['N/runtime', 'N/search', 'N/record', 'N/task'],
/**
* @param{runtime} runtime
* @param{search} search
* @param{record} record
* @param{task} task
*/
(runtime, search, record, task) => {
    /**
    * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
    * @param {Object} inputContext
    * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
    *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
    * @param {Object} inputContext.ObjectRef - Object that references the input data
    * @typedef {Object} ObjectRef
    * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
    * @property {string} ObjectRef.type - Type of the record instance that contains the input data
    * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
    * @since 2015.2
    */

    var SPARAM__DIGITS_TO_PROCESS = 'custscript_digits';
    var SPARAM__MAX_RECORDS_TO_PROCESS = 'custscript_max_record_count';
    var SPARAM__ERROR_INTERNALIDS = 'custscript_error_internalids'

    const getInputData = (inputContext) => {
        log.debug("-------- [START] --------", inputContext)
        const script = runtime.getCurrentScript();
        let errorIds = JSON.parse(script.getParameter(SPARAM__ERROR_INTERNALIDS) || '[]')
        let digits = script.getParameter(SPARAM__DIGITS_TO_PROCESS) || '';
        digits = digits.trim();
        let max_records = script.getParameter(SPARAM__MAX_RECORDS_TO_PROCESS) || 20;
        max_records = parseInt(max_records);

        let search_filters = []

        if (!errorIds.length) {
            search_filters = [
                ["type","anyof","WorkOrd"],
                "AND",
                ["custbody_cntm_custom_rec_ref_hide","is","T"],
                "AND",
                ["mainline","is","T"],
                "AND",
                ["status","noneof","WorkOrd:H"],
                "AND",
                ["custbody_update_wo_csv","is","F"]
            ];
            if (digits) {
                digits = digits.split(',');
                let digit_filters = [];
                for (let i=0; i<digits.length; i++) {
                    if (i != 0) digit_filters.push("OR");
                    let digit = digits[i];
                    digit_filters.push(
                        ["formulanumeric: CASE WHEN (REGEXP_INSTR(substr(to_number(regexp_substr({internalid},'\\d+$')), -1), '"+ digit +"', 1)) > 0 THEN 1 ELSE 0 END","equalto","1"]
                    );
                }
                search_filters.push("AND");
                search_filters.push(digit_filters);
            }
        } else {
            log.debug("ERROR INTERNALIDS", errorIds)

            search_filters = [
                ["type","anyof","WorkOrd"],
                "AND",
                ["internalid","anyof",errorIds],
                "AND",
                ["mainline","is","T"]
            ];

            log.debug('search_filters', search_filters)
        }

        var workorderSearchObj = search.create({
            type: "workorder",
            filters: search_filters,
            columns:
            [
                search.createColumn({name: "tranid", label: "Document Number"})
            ]
        });
        workorderSearchObj = expandSearch(workorderSearchObj, max_records);

        log.debug('>>>>', workorderSearchObj.length)

        let wos = {}
        workorderSearchObj.map(m => wos[m.id] = m.getValue({ name: "tranid" }))

        log.debug("wos", wos)

        return wos
    }

    const expandSearch = (set, max_records) => {
        let results = set.run(), index = 0, range = max_records || 1000, resultSet = 0, sets = [];
        resultSet = results.getRange(index, index + range)
        sets = sets.concat(resultSet)
        return sets
    }

    /**
    * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
    * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
    * context.
    * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
    *     is provided automatically based on the results of the getInputData stage.
    * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
    *     function on the current key-value pair
    * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
    *     pair
    * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
    *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
    * @param {string} mapContext.key - Key to be processed during the map stage
    * @param {string} mapContext.value - Value to be processed during the map stage
    * @since 2015.2
    */

    const map = (mapContext) => {
        record.load({
            type: 'workorder',
            id: mapContext.key
        }).setValue({
            fieldId: 'custbody_update_wo_csv',
            value: true
        }).save({
            ignoreMandatoryFields: true
        })
        log.debug('Updated succesfully', mapContext.value)
        mapContext.write({
            key: mapContext.key,
            value: mapContext.value
        })
    }

    /**
    * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
    * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
    * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
    * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
    *     script
    * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
    * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
    *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
    * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
    * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
    * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
    *     script
    * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
    * @param {Object} summaryContext.inputSummary - Statistics about the input stage
    * @param {Object} summaryContext.mapSummary - Statistics about the map stage
    * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
    * @since 2015.2
    */
    const summarize = (summaryContext) => {
        let unexpectedErrorsIds = []//errorStack.filter(f => f.match(/unexpected_suite|unexpected error|unexpected_error/gi))

        summaryContext.mapSummary.errors.iterator().each((key, message) => {
            log.debug(`Map Error | WO Internal ID : ${key}`, message)
            if (message.match(/unexpected_suite|unexpected error|unexpected_error/gi))
                unexpectedErrorsIds.push(key)
            return true
        })

        let result = []
        summaryContext.output.iterator().each( (key, value) => {
            result.push(key)
            return true
        })

        if (unexpectedErrorsIds.length) {
            let params = {}
            params[SPARAM__ERROR_INTERNALIDS] = JSON.stringify(unexpectedErrorsIds)

            task.create({
                taskType: task.TaskType.MAP_REDUCE,
                params,
                scriptId: runtime.getCurrentScript().id
            }).submit()
        }

        log.audit({ title: '-------- [END] --------', details: `Usage: ${summaryContext.usage}; Concurrency: ${summaryContext.concurrency}; Number of yields: ${summaryContext.yields}; Total items processed: ${result.length}` })
    }

    return {getInputData, map, summarize}

});
