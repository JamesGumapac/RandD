/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([], function() {

    var $ = null;
    var DOMFieldMapping = {};

    function pageInit(context) {
        window.onbeforeunload = null;

        var CUSTSUPP_COL_LABEL = 'CUSTOMER SUPPLIED PART';
        var BAGNTAG_COL_LABEL  = 'BAG AND TAG';
        var STACKED_COL_LABEL  = 'STACKED';
        var SPECPART_COL_LABEL = 'SPECIFIC PART';
        var rec = context.currentRecord;
        DOMFieldMapping = rec.getValue({
            fieldId: 'custbody_custcol_field_mapper'
        }) || '{}';
        DOMFieldMapping = JSON.parse(DOMFieldMapping);
        
        console.log('mode:'+context.mode, 'DOMFieldMapping', DOMFieldMapping);

        $ = jQuery;
        $(document).ready(function() {
            $('#component_splits').find('tr[id*="componentheader"]').each(function(i){
                $(this).find('td').eq(0).after('<td height="100%" style="" class="listheadertd listheadertextb uir-column-large" data-label="'+SPECPART_COL_LABEL+'"><div class="listheader">'+SPECPART_COL_LABEL+'</div></td>');
                $(this).find('td').eq(0).after('<td height="100%" style="" class="listheadertd listheadertextb uir-column-large" data-label="'+STACKED_COL_LABEL+'"><div class="listheader">'+STACKED_COL_LABEL+'</div></td>');
                $(this).find('td').eq(0).after('<td height="100%" style="" class="listheadertd listheadertextb uir-column-large" data-label="'+BAGNTAG_COL_LABEL+'"><div class="listheader">'+BAGNTAG_COL_LABEL+'</div></td>');
                $(this).find('td').eq(0).after('<td height="100%" style="" class="listheadertd listheadertextb uir-column-large" data-label="'+CUSTSUPP_COL_LABEL+'"><div class="listheader">'+CUSTSUPP_COL_LABEL+'</div></td>');
            });
            $('#component_splits').find('tr[id*="componentrow"]').each(function (i) {
                var cs_val = '!checked';
                var bt_val = '!checked';
                var st_val = '!checked';
                var sp_val = '!checked';
                if (DOMFieldMapping[i]) {
                    if (DOMFieldMapping[i].custsupplied) 
                        cs_val = 'checked';
                    if (DOMFieldMapping[i].bagntag) 
                        bt_val = 'checked';
                    if (DOMFieldMapping[i].stacked) 
                        st_val = 'checked';
                    if (DOMFieldMapping[i].specificpart) 
                        sp_val = 'checked';
                }
                $(this).find('td').eq(0).after('<td><input type="checkbox" id="specificpart" '+sp_val+'></input></td>');
                $(this).find('td').eq(0).after('<td><input type="checkbox" id="stacked" '+st_val+'></input></td>');
                $(this).find('td').eq(0).after('<td><input type="checkbox" id="bagntag" '+bt_val+'></input></td>');
                $(this).find('td').eq(0).after('<td><input type="checkbox" id="custsupplied" '+cs_val+'></input></td>');
            });
            fieldChangedHandler(rec);
        })
    }

    function fieldChangedHandler(rec) {
        // Customer Supplier Part on tick
        $('#component_splits').on('change', 'input[id*="custsupplied"]', function () {
            var i = $(this).closest('tr').index();
            console.log(i, i in DOMFieldMapping);
            if (DOMFieldMapping[i]) {
                DOMFieldMapping[i].custsupplied = !DOMFieldMapping[i].custsupplied
                console.log('UPDATED', DOMFieldMapping[i])
            }
            window.onbeforeunload = null;
        })
        // Bag and Tag on tick
        $('#component_splits').on('change', 'input[id*="bagntag"]', function () {
            var i = $(this).closest('tr').index();
            console.log(i, i in DOMFieldMapping);
            if (DOMFieldMapping[i]) {
                DOMFieldMapping[i].bagntag = !DOMFieldMapping[i].bagntag
                console.log('UPDATED', DOMFieldMapping[i])
            }
        })
        // Stacked on tick
        $('#component_splits').on('change', 'input[id*="stacked"]', function () {
            var i = $(this).closest('tr').index();
            console.log(i, i in DOMFieldMapping);
            if (DOMFieldMapping[i]) {
                DOMFieldMapping[i].stacked = !DOMFieldMapping[i].stacked
                console.log('UPDATED', DOMFieldMapping[i])
            }
        })
        // Specific part on tick
        $('#component_splits').on('change', 'input[id*="specificpart"]', function () {
            var i = $(this).closest('tr').index();
            console.log(i, i in DOMFieldMapping);
            if (DOMFieldMapping[i]) {
                DOMFieldMapping[i].specificpart = !DOMFieldMapping[i].specificpart
                console.log('UPDATED', DOMFieldMapping[i])
            }
        })
    }

    function saveRecord(context) {
        var rec = context.currentRecord;
        $('#component_splits').find('tr[id*="componentrow"]').each(function (i) {
            DOMFieldMapping[i] = {}
            DOMFieldMapping[i].item = rec.getSublistValue({
                sublistId: 'component',
                fieldId: 'item',
                line: i
            });;
            DOMFieldMapping[i].custsupplied = $(this).find('input#custsupplied')[0].checked;
            DOMFieldMapping[i].bagntag      = $(this).find('input#bagntag')[0].checked;
            DOMFieldMapping[i].stacked      = $(this).find('input#stacked')[0].checked;
            DOMFieldMapping[i].specificpart      = $(this).find('input#specificpart')[0].checked;
        });
        context.currentRecord.setValue({
            fieldId: 'custbody_cntm_comp_line_fld_map',
            value: JSON.stringify(DOMFieldMapping)
        });
        return true;
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
    }
});