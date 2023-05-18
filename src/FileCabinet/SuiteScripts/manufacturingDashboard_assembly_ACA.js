/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/redirect', 'N/runtime', 'N/format', 'N/record'],
    function(serverWidget, search, redirect, runtime, format, record) {

        var DASHBOARD_SELECTED = 0;

        function onRequest(context) {


            DASHBOARD_OBJECT_ARRAY = [
			{
                name: 'DB-Shipping',
                search: 'customsearch_cdb_dbshipping_aca_v2'
            },
			// {
            //     name: 'Testing 12-13-22',
            //     search: 'customsearch_cdb_testing121322_aca'
            // }
			];

            if (context.request.method == 'GET') {

                var params = context.request.parameters;
                log.debug('params in GET is:', params);

                if(params?.custparam_db_selected){
                    DASHBOARD_SELECTED = params.custparam_db_selected;
                }
                //log governance remaining
                var scriptObj = runtime.getCurrentScript();
                log.debug("Remaining governance units in GET: ", scriptObj.getRemainingUsage());

                // Add sublist that will show results
                var form = serverWidget.createForm({
                    title: "Assembly " + DASHBOARD_OBJECT_ARRAY[DASHBOARD_SELECTED].name,
                    hideNavBar: true
                });
                form.clientScriptModulePath = 'SuiteScripts/manufacturingDashboard_CS2_ACA.js';

                var sublist = buildFormSublist(form, DASHBOARD_OBJECT_ARRAY, DASHBOARD_OBJECT_ARRAY[DASHBOARD_SELECTED].search);

                // Get subset of data to be shown on page
                //var addResults = fetchSearchResult(DASHBOARD_OBJECT_ARRAY[DASHBOARD_SELECTED].search);

                setSublistFunction(sublist, DASHBOARD_OBJECT_ARRAY[DASHBOARD_SELECTED].search);
                // Set data returned to columns

                context.response.writePage(form);
            } //end if GET
        }

        return {
            onRequest: onRequest
        };

        function buildFormSublist(form, dashboardarray, searchId) {

            //add DASHBOARD select dropdown
            var selectOptionsDashboard = form.addField({
                id: 'custpage_dashboard_select',
                type: serverWidget.FieldType.SELECT,
                label: 'Select Dashboard'
            });
            selectOptionsDashboard.layoutType = serverWidget.FieldLayoutType.NORMAL;
            //selectOptionsDashboard.breakType = serverWidget.FieldBreakType.STARTCOL;
            selectOptionsDashboard.isMandatory = true;

            for (var db = 0; db < dashboardarray.length; db++) {

                selectOptionsDashboard.addSelectOption({
                    value: db,
                    text: dashboardarray[db].name
                });
            }
            selectOptionsDashboard.defaultValue = DASHBOARD_SELECTED;

            var sublist = form.addSublist({
                id: 'custpage_table',
                type: serverWidget.SublistType.LIST,
                label: 'Manufacturing Operation Tasks'
            });

            sublist.addField({
                id: 'rownumber',
                label: 'Row Number',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            var search_obj = search.load({
                id: searchId
            });

            var search_cols = search_obj.columns;
            // Do not include the internal id to be rendered in the sublist.
            for (var i=0; i<search_cols.length; i++) {
                var col = search_cols[i];
                sublist.addField({
                    id: 'custpage_result_' + i,
                    label: col.label,
                    type: serverWidget.FieldType.TEXT
                });
            }

            return sublist;

        }

        function setSublistFunction(sublist, searchId) {
            var search_obj = search.load({
                id: searchId
            });
            var search_cols = search_obj.columns;
            var result = search_obj.run().getRange({
                start: 0,
                end: 25
            });

            var j = 0;
            result.forEach(function(result) {
                sublist.setSublistValue({
                    id: 'rownumber',
                    line: j,
                    value: j
                });
                for (var i=0; i<search_cols.length; i++) {
                    var col = search_cols[i];
                    var value = result.getText(col);
                    if (value == null || value == '') {
                        value = result.getValue(col);
                    }
                    value = value || '';

                    if (value != '') {
                        sublist.setSublistValue({
                            id: 'custpage_result_' + i,
                            line: j,
                            value: value
                        });
                    }
                }
                j++;
            });
        }
    });
