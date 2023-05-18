/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(
		[ 'N/record', 'N/runtime', 'N/search' ],
		/**
		 * @param {record}
		 *            record
		 * @param {runtime}
		 *            runtime
		 * @param {search}
		 *            search
		 */
		function(record, runtime, search) {

			/**
			 * Definition of the Suitelet script trigger point.
			 * 
			 * @param {Object}
			 *            context
			 * @param {ServerRequest}
			 *            context.request - Encapsulation of the incoming
			 *            request
			 * @param {ServerResponse}
			 *            context.response - Encapsulation of the Suitelet
			 *            response
			 * @Since 2015.2
			 */
			function onRequest(context) {

				try {
					if (context.request.method === 'GET') {
						var jobId = context.request.parameters.jobId;
						var customrecord_cntm_clientapp_headerSearchObj = search
								.create({
									type : "customrecord_cntm_clientapp_header",
									filters : [
											[ "custrecord_cntm_cah_jobnumber",
													"anyof", jobId ],
											"AND",
											[
													"custrecord_cntm_cso_parentrec.custrecord_cntm_cso_status",
													"noneof", "1", "5", "4" ] ],
									columns : [ search.createColumn({
										name : "internalid",
										label : "Internal ID"
									}) ]
								});
						var searchResultCount = customrecord_cntm_clientapp_headerSearchObj
								.runPaged().count;
						log
								.debug(
										"customrecord_cntm_clientapp_headerSearchObj result count",
										searchResultCount);
						var customrecord_cntm_clientappsublistSearchObj = search.create({
                            type: "customrecord_cntm_clientappsublist",
                            filters: [
                                [
                                    "custrecord_cntm_cso_status",
                                    "anyof", "4"
                                ],
                                "AND", [
                                    "custrecord_cntm_last_operation",
                                    "is", "T"
                                ],
                                "AND", [[
                                    "custrecord_cntm_work_order.createdfrom",
                                    "anyof",
                                    jobId
                                ],"OR",[
                                                "custrecord_cntm_work_order.custbody_cntm_last_wo_id",
                                                "anyof",
                                                jobId
                                            ]],
                                "AND", [
                                    "custrecord_cntm_cso_quantity_good",
                                    "isnot", "0.0"
                                ],
                                "AND", [
                                    "custrecord_cntm_cso_quantity_good",
                                    "isnot", "0"
                                ], 
                                "AND",
                                 ["custrecord_cntm_issue_in_process","is","T"], 
                                 "AND", 
                                  ["custrecord_cntm_issue_created","is","F"]
                            ],
                            columns: [
                                "custrecord_cntm_cso_pannellot",
                                "custrecord_cntm_cso_quantity_good",
                                "custrecord_cntm_lot_record",
                                "custrecord_cntm_cso_parentrec",
                                search.createColumn({
                                    name: "item",
                                    join: "CUSTRECORD_CNTM_WORK_ORDER"
                                }),
                                search.createColumn({
                                    name: "createdfrom",
                                    join: "CUSTRECORD_CNTM_WORK_ORDER"
                                }),
                                search.createColumn({ name: "custrecord_cntm_issue_in_process", label: "Issue In Process" }),
                                search.createColumn({ name: "custrecord_cntm_issue_created", label: "WO Issue Created" }),
                                search.createColumn({
                                    name: "custrecord_cntm_prev_lot_rec",
                                    join: "CUSTRECORD_CNTM_LOT_RECORD",
                                    label: "Previous Lot Rec"
                                 })
                            ]
                        });
                 //   var searchResultCount = customrecord_cntm_clientappsublistSearchObj.runPaged().count;
                  //  log.debug("customrecord_cntm_clientappsublistSearchObj result count", searchResultCount);

                    var flagforprogress = false;
                   
                 
                        customrecord_cntm_clientappsublistSearchObj.run().each(function(result) {
           

                            var inProcess = result.getValue({ name: "custrecord_cntm_issue_in_process", label: "Issue In Process" });
                           if(inProcess==true)
                        	   flagforprogress=inProcess;
                         
                            return true;
                        });
						// log.debug('finalarray', JSON.stringify(finalarray));

                        log.debug('searchResultCount', searchResultCount);
                        log.debug('flagforprogress', flagforprogress);
                        if (searchResultCount == 0 && flagforprogress==false)
							context.response.write('true');
						else
							context.response.write('false');

					} else if (context.request.method === 'POST') {
					}
				} catch (e) {
					log.debug("eroorcalllog", e);
				}

			}

			return {
				onRequest : onRequest
			};

		});
