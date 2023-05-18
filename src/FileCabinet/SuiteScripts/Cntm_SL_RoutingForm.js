/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search','N/ui/serverWidget'],
/**
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 */
function(record, runtime, search,serverWidget) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {

    	var form = serverWidget.createForm({
			title : 'Manufacturing Routing'
		});
    	var primaryFieldGroup = form.addFieldGroup({
			id : 'custpage_primaryfieldgroup',
			label : 'Primary Information'
		});
    	var subsidiaryField = form.addField({
			id : 'custpage_subsidiary',
			type : serverWidget.FieldType.SELECT,
			label : 'Subsidiary',
			source : 'subsidiary',
			container : 'custpage_primaryfieldgroup'
		}).updateLayoutType({
			layoutType : serverWidget.FieldLayoutType.STARTROW
		});
    	var bomField = form.addField({
			id : 'custpage_bom',
			type : serverWidget.FieldType.SELECT,
			label : 'Bill of Materials',
			source : 'bom',
			container : 'custpage_primaryfieldgroup'
		}).updateLayoutType({
			layoutType : serverWidget.FieldLayoutType.STARTROW
		});
    	var locationField = form.addField({
			id : 'custpage_location',
			type : serverWidget.FieldType.MULTISELECT,
			label : 'Location',
			source : 'location',
			container : 'custpage_primaryfieldgroup'
		}).updateLayoutType({
			layoutType : serverWidget.FieldLayoutType.STARTROW
		});
    	var nameField = form.addField({
			id : 'custpage_name',
			type : serverWidget.FieldType.TEXT,
			label : 'Name',
			//source : 'subsidiary',
			container : 'custpage_primaryfieldgroup'
		}).updateLayoutType({
			layoutType : serverWidget.FieldLayoutType.STARTROW
		});
    	var memoField = form.addField({
			id : 'custpage_memo',
			type : serverWidget.FieldType.TEXTAREA,
			label : 'Memo',
			//source : 'subsidiary',
			container : 'custpage_primaryfieldgroup'
		}).updateLayoutType({
			layoutType : serverWidget.FieldLayoutType.STARTROW
		});
    	
    	var routingTab = form.addTab({
			id : 'custpage_routing_steps',
			label : 'Routing Steps'
		});
    	var componentTab = form.addTab({
			id : 'custpage_component',
			label : 'Component Per Operation'
		});
    	
    	var routingSublist = form.addSublist({
			id : 'custpage_ruoting_operation',
			type : serverWidget.SublistType.INLINEEDITOR,
			label : 'Routing Steps',
			tab : 'custpage_routing_steps'
		});
    	routingSublist.addField({
			id : 'custpage_operation_seq',
			label : 'Operation Sequence',
			type : serverWidget.FieldType.TEXT
		});
    	routingSublist.addField({
			id : 'custpage_operation_seq5',
			label : 'Operation Sequence',
			type : serverWidget.FieldType.TEXT
		});
    	
    	context.response.writePage(form);
    }

    return {
        onRequest: onRequest
    };
    
});
