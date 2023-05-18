/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @Author Christian Gumera
 */
define([
    'N/record',
    'N/search',
    './createCustomOperationLineRecords_CM2.1'
], (record, search, custLib) => {

    function getInputData(context) {
        const type = 'workorder'
        const filters = [
            //['custbody_mr_percent_completed', 'is', 'F'],
            //'AND',
            ['mainline', 'is', 'T'],
            'AND',
            ['internalid','anyof', "279354"]//[893302,893301,893300]]

        ]
        const columns = []

        return search.create({ type, filters, columns })
    }


    function map(context) {
        log.audit('MAP CONTEXT', context)
        const { id } = JSON.parse(context.value)

        const custOperations = custLib.searchCustomOperations(id)

        context.write({
            key: id,
            value: custOperations
        })
    }

    function reduce(context) {
        try {
            log.audit('REDUCE CONTEXT', context)
            const custOperations = JSON.parse(context.values[0])
            let noOfOperations = custOperations.length 
    
            let completedSumQty = custOperations.filter(f => f.completedqty > 0).length
    
            let woPercentCompleted = (completedSumQty/noOfOperations) * 100
            log.debug('WORK ORDER COMPLETION', woPercentCompleted)
    
            if(woPercentCompleted){
                updateWorkOrderCompletion(context.key, woPercentCompleted)
            }
            
            markAsDoneProcessing(context.key)
            
            context.write({
                key: context.key,
                value: 'success'
            })            
        } catch (error) {
            log.error(error.name, error)
        }

    }

    function updateWorkOrderCompletion(workOrderId, completion) {
        log.audit('UPDATING WORK ORDER COMPLETION FIELD', {workOrderId, completion})
        record.submitFields({
            type: "workorder",
            id: workOrderId,
            values: {
                custbody_wo_percent_completed: completion.toFixed(2),
            },
            options: {
                ignoreMandatoryFields: true,
            }
        });       
    }

    function markAsDoneProcessing(workOrderId) {
        log.audit('MARKING WORK ORDER AS COMPLETED', {workOrderId})
        record.submitFields({
            type: "workorder",
            id: workOrderId,
            values: {
                custbody_mr_percent_completed: true, //true means the work order has undergone this process
            },
            options: {
                ignoreMandatoryFields: true,
            }
        });  
    }

    function summarize(context) {
        log.audit('SUMMARY MAP', context.mapSummary)
        log.audit('SUMMARY REDUCE', context.reduceSummary)
        log.audit('SUMMARY MAP ERRORS', context.mapSummary.errors)
        log.audit('SUMMARY REDUCE ERRORS', context.reduceSummary.errors)
    }

    return {
        getInputData,
        map,
        reduce,
        summarize
    }
})