/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */

define(['N/search','N/record'],

		function(search, record) {

	/**
	 * Definition of the Scheduled script trigger point.
//	 *
	 * @param {Object} scriptContext
	 * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
	 * @Since 2015.2
	 */


	function execute(scriptContext) {
		try
		{
			var estimateSearchObj = search.create({
                type: "estimate",
                filters:
                [
                   ["type","anyof","Estimate"], 
                   "AND", 
                   ["mainline","is","T"], 
                 //  "AND", 
                 //  ["number","equalto","600013"]
                ],
                columns:
                [
                   search.createColumn({name: "internalid", label: "Internal ID"}),
                   search.createColumn({name: "tranid", label: "Document Number"}),
                   search.createColumn({name: "custbody_rda_internal_quote_comments", label: "Internal Quote Comments"}),
                   search.createColumn({name: "custbody_rda_quote_special_instruction", label: "Quote Special Instructions"})
                ]
             });
             var searchResultCount = estimateSearchObj.runPaged().count;
           //  log.debug("estimateSearchObj result count",searchResultCount);
             getAllResults(estimateSearchObj);
            //  estimateSearchObj.run().each(function(result){
              
            //     return true;
            //  });
             
             /*
             estimateSearchObj.id="customsearch1672133112170";
             estimateSearchObj.title="Transaction Search for quote (copy)";
             var newSearchId = estimateSearchObj.save();
             */
		}
		catch(error)
		{
			log.error('error.message'+error.message, JSON.stringify(error));
		}
	}

    function getAllResults(s) {
        var results = s.run();
        var searchResults = [];
        var searchid = 0;
        do {
            var resultslice = results.getRange({start:searchid,end:searchid+1000});
            resultslice.forEach(function(slice) {
                var id = slice.getValue({
                                name: 'internalid'
                            });
          //     log.debug('id',id)
                var internal_comments = slice.getValue({
                    name: "custbody_rda_internal_quote_comments"
                });
             //   log.debug('internal_comments',internal_comments)
                var special_instruction = slice.getValue({
                    name: "custbody_rda_quote_special_instruction"
                });
             //   log.debug('special_instruction',special_instruction)

                if(!special_instruction && internal_comments )
                {
                    var append_quote = record.submitFields({
                        type: record.Type.ESTIMATE,
                        id: id,
                        values: {
                            custbody_rda_quote_special_instruction: internal_comments
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields : true
                        }
                    });
                    log.debug("quote"+ id + "changed successfully")
                    
                    
                }
                // else
                // {
                //     var append_quote = record.submitFields({
                //         type: record.Type.ESTIMATE,
                //         id: id,
                //         values: {
                //             custbody_rda_quote_special_instruction: internal_comments+ special_instruction
                //         },
                //         options: {
                //             enableSourcing: false,
                //             ignoreMandatoryFields : true
                //         }
                //     });
                //     log.debug("quote"+ id + "changed successfully")
                // }





                searchid++;
          
                }
            );
        } while (resultslice.length >=1000);


    }
    

	return {
		execute: execute
	};

});