/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define([], () => {

    const beforeLoad = context => {
        let { form, newRecord } = context;
        try {
            let DOMFieldMapping = newRecord.getValue({
                fieldId: 'custbody_custcol_field_mapper'
            }) || '{}';
            DOMFieldMapping = JSON.parse(DOMFieldMapping);
            log.debug('DOMFieldMapping', DOMFieldMapping);
            
            form.addField({
                id: 'custpage_domhandler',
                label: 'DOM Handler',
                type: 'inlinehtml'
            }).defaultValue = `
                <script>
                    var CUSTSUPP_COL_LABEL = 'CUSTOMER SUPPLIED PART';
                    var BAGNTAG_COL_LABEL  = 'BAG AND TAG';
                    var STACKED_COL_LABEL  = 'STACKED';
                    var SPECPART_COL_LABEL = 'SPECIFIC PART';
                    var DOMFieldMapping = ${JSON.stringify(DOMFieldMapping)};
                    console.log(typeof DOMFieldMapping, DOMFieldMapping);
                    $ = jQuery;
                    $(document).ready(function() {
                        $('#component_splits').find('tr[id*="componentheader"]').each(function(i){
                            $(this).find('td').eq(0).after('<td height="100%" style="" class="listheadertd listheadertextb uir-column-large" data-label="'+SPECPART_COL_LABEL+'"><div class="listheader">'+SPECPART_COL_LABEL+'</div></td>');
                            $(this).find('td').eq(0).after('<td height="100%" style="" class="listheadertd listheadertextb uir-column-large" data-label="'+STACKED_COL_LABEL+'"><div class="listheader">'+STACKED_COL_LABEL+'</div></td>');
                            $(this).find('td').eq(0).after('<td height="100%" style="" class="listheadertd listheadertextb uir-column-large" data-label="'+BAGNTAG_COL_LABEL+'"><div class="listheader">'+BAGNTAG_COL_LABEL+'</div></td>');
                            $(this).find('td').eq(0).after('<td height="100%" style="" class="listheadertd listheadertextb uir-column-large" data-label="'+CUSTSUPP_COL_LABEL+'"><div class="listheader">'+CUSTSUPP_COL_LABEL+'</div></td>');
                        });
                        $('#component_splits').find('tr[id*="componentrow"]').each(function (i) {
                            var cs_val = 'No';
                            var bt_val = 'No';
                            var st_val = 'No';
                            var sp_val = 'No';
                            if (DOMFieldMapping[i]) {
                                if (DOMFieldMapping[i].custsupplied) 
                                    cs_val = 'Yes';
                                if (DOMFieldMapping[i].bagntag) 
                                    bt_val = 'Yes';
                                if (DOMFieldMapping[i].stacked) 
                                    st_val = 'Yes';
                                if (DOMFieldMapping[i].specificpart) 
                                    sp_val = 'Yes';
                            }
                            $(this).find('td').eq(0).after('<td>'+sp_val+'</td>');
                            $(this).find('td').eq(0).after('<td>'+st_val+'</td>');
                            $(this).find('td').eq(0).after('<td>'+bt_val+'</td>');
                            $(this).find('td').eq(0).after('<td>'+cs_val+'</td>');
                        });
                    });
                </script>
            `
        } catch(e) {
            log.debug('Error workOrderIssueDOMHandler_CS2.js', e.message)
        }
    }

    return {
        beforeLoad
    };
});
