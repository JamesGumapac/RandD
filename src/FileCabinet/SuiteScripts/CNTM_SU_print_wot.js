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
    		    type: "workorder",
    		    id: id
    		    });
    		
    		var LotNumberArray = [];
                try {
                    var customrecord_cntm_lot_creationSearchObj = search.create({
                        type: "customrecord_cntm_lot_creation",
                        filters:
                        [
                           ["custrecord_cntm_lot_wonum","anyof",id]
                        ],
                        columns:
                        [
                           search.createColumn({name: "custrecord_cntm_lot_assembly_item", label: "Assembly Item "}),
                           search.createColumn({
                              name: "custrecord_cntm_lot_lotnumber",
                              sort: search.Sort.ASC,
                              label: "LOT#"
                           }),
                           search.createColumn({name: "custrecord_cntm_brds_per_panel", label: "Boards Per Panel"}),
                           search.createColumn({name: "custrecord_cntm_cumulative_scrap_qty", label: "Cumulative Scrap Qty"})
                        ]
                     });
                     var searchResultCount = customrecord_cntm_lot_creationSearchObj.runPaged().count;
                     log.debug("customrecord_cntm_lot_creationSearchObj result count",searchResultCount);
                     customrecord_cntm_lot_creationSearchObj.run().each(function(result){
                     

                        var lotNumber = result.getValue(search.createColumn({
                            name: "custrecord_cntm_lot_lotnumber",
                            sort: search.Sort.ASC,
                            label: "LOT#"
                         }));
                         if(LotNumberArray.length < 8){
                            LotNumberArray.push(lotNumber);
                         }
                         log.debug('lotNumber', lotNumber);
                        return true;
                     });

                     woRecord.setValue({
                         fieldId: 'custbody_cntm_lot_print_wot',
                         value: LotNumberArray.toString()
                     });

                 } catch (error) {
                    log.debug('search ERROR',error);
                 }


    		var soNum = woRecord.getValue({
    		    fieldId: 'custbody_cnt_created_fm_so'
    		});
    		if(soNum)
    			{
    			var salesOrder= record.load({
        		    type: "salesorder",
        		    id: soNum
        		    });
    			var soNotes = salesOrder.getValue({
        		    fieldId: 'custbody_rda_so_notes'
        		});
    			try{
    			soNotes=soNotes.replace(/(<([^>]+)>)/ig,'');
    			}
    			catch(e)
    			{
    				soNotes="";
    			}
    			var soNotesCopy = salesOrder.setValue({   		  
        		    fieldId: 'custbody_cntm_so_notes_copy',
        		    value: soNotes
        		});
    			}
    		var manufacturingrouting = woRecord.getValue({
    		    fieldId: 'manufacturingrouting'
    		});
    		log.debug(manufacturingrouting);

    		var manufacturingroutingrecord= record.load({
    		    type: "manufacturingrouting",
    		    id: manufacturingrouting
    		    });
    		try{
    		var instructions = manufacturingroutingrecord.getValue({
    		    fieldId: 'custrecord_routing_instructions'
    		});
    		log.debug('instru',instructions);

    		instructions=JSON.parse(instructions);
    		for(var key  in instructions)
    			{
    			log.debug(key);
    			log.debug(instructions[key]);
    			var value=instructions[key];
    			value=value.replace(/(?:\r\n|\r|\n)/g, '_cntmspace_');
    			instructions[key]=value;
    			log.debug(instructions[key]);
//    			var k=key;
//    			var value=instructions[key];
//    			log.debug(k,value);
    			}
    		var instructions = manufacturingroutingrecord.setValue({   		  
    		    fieldId: 'custrecord_cntm_route_inst_print',
    		    value: JSON.stringify(instructions)
    		});
    		}
    		catch(e)
    		{
    			log.debug(e);
    		}
    			try {
				var userId = runtime.getCurrentUser().id;
				

				woRecord.setValue({
					fieldId: 'custbody_cntm_getuser_wot',
					value: userId
				});

			} catch (error) {
				log.debug('Setting User Issue',error)
			}
			
//    		var renderer = render.create();
//    		renderer.setTemplateByScriptId({
//    		    scriptId: "STDTMPLPRICELIST"
//    		    });
//    		var xml = renderer.renderAsString();
    		//var xmlTmplFile = file.load('Templates/PDF Templates/invoicePDFTemplate.xml');
    		var myFile = render.create();
    		//myFile.templateContent = xmlTplFile.getContents();
    		myFile.setTemplateByScriptId({
    		    scriptId: 'CUSTTMPL_111_5361187_SB1_537'
    		    });
    	//	log.debug("inside1");
    		//myFile.addRecord('intruString', instructions);
    		myFile.addRecord('record', woRecord);
    		myFile.addRecord('mrecord', manufacturingroutingrecord);
    		if(salesOrder)
    		 {
    			myFile.addRecord('sorecord', salesOrder);
    		 }
    		var invoicePdf = myFile.renderAsPdf();
    		invoicePdf.name = 'WOT_Test_'+id+'.pdf'; 
    		invoicePdf.isOnline=true;
    		invoicePdf.folder = 980;//988//3914;
    		var fileId = invoicePdf.save();
    		
    		var wotfiledetails = file.load({
    	        id: fileId
    	    });
    		log.debug("fileUrl",wotfiledetails);
    		var accId = runtime.accountId;
    		var reqURL = https.get({
    			url: 'https://rest.netsuite.com/rest/datacenterurls?account=' + accId + '&c=' + accId
    		});

    		var parsedResp = JSON.parse(reqURL.body);

    		var url = parsedResp.systemDomain;

    		var fileUrl = url + wotfiledetails.url;

    		log.debug({
    			title: 'URL',
    			details: fileUrl
    		});
    		var detailsforfile={"url" : fileUrl}
    		//TemplateRenderer.setTemplateById(options)

    		//TemplateRenderer.setTemplateByScriptId(options)
    		
//    		 log.debug("wo Id:-",id);
//    		 id=Number(id);
//             var transactionFile = render.transaction({
//             entityId: id,
//             printMode: render.PrintMode.PDF,
//             formId:155
//             });
         
          //   var newfile = renderer.renderAsPdf();
    		log.debug("wo Id:-",id);
    		if(toClientApp=="Yes")
    			{
    			context.response.write(JSON.stringify(detailsforfile));
    			}
    		else
    			{
    			context.response.writeFile(invoicePdf, true);
    			}
             
    }

    return {
        onRequest: onRequest
    };
    
});
