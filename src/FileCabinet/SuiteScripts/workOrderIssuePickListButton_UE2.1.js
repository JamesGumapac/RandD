/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define([], () => {

    const beforeLoad = context => {
        let { form, newRecord } = context;
        try {
            form.clientScriptModulePath = './workOrderIssuePickListButton_CS2.js';
            form.addButton({
                id : 'custpage_printpdf',
                label : 'Print Picking Ticket',
                functionName: 'callRenderPickList'
            });
        } catch(e) {
            log.debug('Error add button', e.message)
        }
    }

    return {
        beforeLoad
    };
});
