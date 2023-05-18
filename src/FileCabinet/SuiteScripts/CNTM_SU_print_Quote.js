/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/render', 'N/file', 'N/record','N/runtime', 'N/https','N/search'],

function(render, file, record, runtime,https,search) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	 var toClientApp="";
    		 var id=context.request.parameters.recId;
    		 try{
    		 var toClientApp=context.request.parameters.clientapp;
    		 }
    		 catch(e)
    		 {
    			 toClientApp="";
    		 }

    		var woRecord= record.load({
    		    type: 'estimate',
    		    id: id
    		    });
    		
    		var LotNumberArray = [];
                

    		var poNotes = woRecord.getValue({
    		    fieldId: 'custbody_rda_internal_quote_comments'
    		});
			try{
				poNotes=poNotes.replace(/(<([^>]+)>)/ig,'');
			}
			catch(e)
			{
				poNotes="";
			}

			woRecord.setValue({
				fieldId: 'custbody_rda_quote_special_instruction',
				value: poNotes
			});

    		
//    		var renderer = render.create();
//    		renderer.setTemplateByScriptId({
//    		    scriptId: "STDTMPLPRICELIST"
//    		    });
//    		var xml = renderer.renderAsString();
    		//var xmlTmplFile = file.load('Templates/PDF Templates/invoicePDFTemplate.xml');
    		var myFile = render.create();
    		//myFile.templateContent = xmlTplFile.getContents();
    		myFile.setTemplateByScriptId({
    		    scriptId: 'CUSTTMPL_110_5361187_SB1_798'
    		    });
    	//	log.debug("inside1");
    		//myFile.addRecord('intruString', instructions);
    		myFile.addRecord('record', woRecord);
    		
    		var invoicePdf = myFile.renderAsPdf();
    		
    			context.response.writeFile(invoicePdf, true);
             
    }

    return {
        onRequest: onRequest
    };
    
});
