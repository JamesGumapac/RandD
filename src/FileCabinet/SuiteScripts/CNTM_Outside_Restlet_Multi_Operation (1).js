/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(
		[ 'N/file', 'N/http', 'N/https', 'N/record', 'N/runtime', 'N/search',
				'N/url', ],

		function(file, http, https, record, runtime, search, url) {

			/**
			 * Function called upon sending a GET request to the RESTlet.
			 * 
			 * @param {Object}
			 *            requestParams - Parameters from HTTP request URL;
			 *            parameters will be passed into function as an Object
			 *            (for all supported content types)
			 * @returns {string | Object} HTTP response body; return string when
			 *          request Content-Type is 'text/plain'; return Object when
			 *          request Content-Type is 'application/json'
			 * @since 2015.1
			 */
			function doPost(requestBody) {
				var finaldata = [];
				var wodetails = {};
				log.debug('requestParams', JSON.stringify(requestBody));
				var getworkorders = requestBody.getworkorders;
				//var isAsm = requestBody.isasm;
				var isAsm = requestBody.isAsm;
				if (getworkorders == 'true') {
					if (isAsm == 'true') {
					//	log.debug("in asm");
						var workorderSearchObj_asm = search.create({
							type : "workorder",
							filters : [
							           [ "type", "anyof", "WorkOrd" ],
							            "AND",
									[ "mainline", "is", "T" ],
									"AND",
									[ "custbody_cntm_is_asm_wo", "is", true ],
									"AND",
									  ["status","anyof","WorkOrd:D"], 

							],
							columns : [ search.createColumn({
								name : "tranid",
								label : "Document Number"
							}), search.createColumn({
								name : "internalid",
								label : "Internal ID"
							}), search.createColumn({
								name : "assembly",
								label : "Assembly Item"
							}) ]
						});
						var searchResultCount1 = workorderSearchObj_asm.runPaged().count;
						log.debug("workorderSearchObj_asm result count",
								searchResultCount1);

						var asmfinaldataset = [];
						workorderSearchObj_asm.run().each(
								function(result) {
									// .run().each has a limit of 4,000 results
									log.debug("in each");
									var jsondata = {};
									var workOrder = result.getValue(search
											.createColumn({
												name : "tranid",
												label : "Document Number"
											}));
									var workOrderid = result.getValue(search
											.createColumn({
												name : "internalid",
												label : "Internal ID"
											}));
									var item = result.getText(search
											.createColumn({
												name : "assembly",
												label : "Assembly Item"
											}));
									log.debug("workOrderid :"+workOrderid);
									jsondata.workOrderid = workOrderid;
									jsondata.workOrder = workOrder;

									asmfinaldataset.push(jsondata)

									return true;
								});

						return {
							"success" : "true",
							"datain" : asmfinaldataset
						};
					} else {
//log.debug("in PCB");
						var workorderSearchObj = search.create({
							type : "workorder",
							filters : [ [ "type", "anyof", "WorkOrd" ], "AND",
									[ "mainline", "is", "T" ],"AND",
									  [ ["custbody_pcb_rec_id","noneof","@NONE@"],"OR",["custbody_cntm_is_rework_wo","is",'T']],
									  "AND", ["status", "noneof", "WorkOrd:H"]

							],
							columns : [ search.createColumn({
								name : "tranid",
								label : "Document Number"
							}), search.createColumn({
								name : "internalid",
								label : "Internal ID"
							}), search.createColumn({
								name : "assembly",
								label : "Assembly Item"
							}) ]
						});
						var searchResultCount = workorderSearchObj.runPaged().count;
						log.debug("workorderSearchObj result count",
								searchResultCount);
						var finaldataset = [];

						workorderSearchObj.run().each(
								function(result) {
									// .run().each has a limit of 4,000 results
									var jsondata = {};
									var workOrder = result.getValue(search
											.createColumn({
												name : "tranid",
												label : "Document Number"
											}));
									var workOrderid = result.getValue(search
											.createColumn({
												name : "internalid",
												label : "Internal ID"
											}));
									var item = result.getText(search
											.createColumn({
												name : "assembly",
												label : "Assembly Item"
											}));
									jsondata.workOrderid = workOrderid;
									jsondata.workOrder = workOrder;

									finaldataset.push(jsondata);

									return true;
								});
						return {
							"success" : "true",
							"datain" : finaldataset
						};
					}

				}
				// var rec = requestParams["rec"];
				try {
					var id = requestBody.woid;
					if (id) {
						var outputUrl = url
								.resolveScript({
									scriptId : 'customscript_cntm_sl_clientapp_validatio',
									deploymentId : 'customdeploy_cntm_sl_clientapp_validatio',
									returnExternalUrl : true
								});
						log.debug("id", id);
						var responsefor = https.get({
							url : outputUrl + "&jobId=" + id
						})
						log.debug("responsefor", responsefor);
						if (responsefor.body == 'true') {
							var output = url
									.resolveScript({
										scriptId : 'customscript_backend_suitelet_testing',
										deploymentId : 'customdeploy_backend_suitelet_test_dep',
										returnExternalUrl : true
									});
							log.debug("id", id);
							var response = https.get({
								url : output + "&jobId=" + id
							})
							try {
								// debugger;
								var finalData = JSON.parse(response.body);
								log.debug("data", finalData);

								log.debug("data", finalData);
								return {
									"success" : "true",
									"datain" : finalData
								};
								;

							} catch (e) {

							}
						}
						return {
							"success" : "false",
							"datain" : 'A submission is already in progress. Please wait or try back later.'
						};
					}

				} catch (e) {
					log.debug("details", e);
				}

				try {
					var savesuitelet = requestBody.savesuitelet;
					if (savesuitelet) {
						var totalData = requestBody.finaldata;
						log.debug("totalData", totalData);

						var output = url
								.resolveScript({
									scriptId : 'customscript_backend_suitelet_testing',
									deploymentId : 'customdeploy_backend_suitelet_test_dep',
									returnExternalUrl : true
								});
						var response = https.post({
							url : output,
							body : JSON.stringify(totalData),
						});
						log.debug("resp", response);
					}
				} catch (e) {
					log.debug("savesuitelet details", e);
				}

				// var workorderSearchObj = search.create({
				// type: "workorder",
				// filters:
				// [
				// ["type","anyof","WorkOrd"],
				// "AND",
				// ["mainline","is","T"],
				// "AND",
				// ["numbertext","haskeywords",id]
				// ],
				// columns:
				// [
				// search.createColumn({name: "internalid", label: "Internal
				// ID"}),
				// search.createColumn({name: "tranid", label: "Document
				// Number"}),
				// search.createColumn({name: "entity", label: "Name"}),
				// search.createColumn({name: "account", label: "Account"}),
				// search.createColumn({name: "statusref", label: "Status"}),
				// search.createColumn({name: "amount", label: "Amount"}),
				// search.createColumn({name: "trandate", label: "Date"}),
				// search.createColumn({name: "location", label: "Location"}),
				// search.createColumn({name: "assembly", label: "Assembly"}),
				// search.createColumn({name: "quantity", label: "Quantity"}),
				// search.createColumn({name: "manufacturingrouting", label:
				// "Manufacturing Routing"}),
				// search.createColumn({name: "custcol_scm_customerpartnumber",
				// label: "Customer Part Number"})
				// ]
				// });
				// var searchResultCount = workorderSearchObj.runPaged().count;
				// log.debug("workorderSearchObj result
				// count",searchResultCount);
				// workorderSearchObj.run().each(function(result){
				// // .run().each has a limit of 4,000 results

				// var wodetails={};

				// var internalId=result.getValue(search.createColumn({name:
				// "internalid", label: "Internal ID"}));
				// log.debug("id added",internalId);
				// var docNo=result.getValue(search.createColumn({name:
				// "tranid", label: "Document Number"}));
				// var name=result.getText(search.createColumn({name: "entity",
				// label: "Name"}));
				// var account=result.getText(search.createColumn({name:
				// "account", label: "Account"}));
				// var status=result.getValue(search.createColumn({name:
				// "statusref", label: "Status"}));
				// var amount=result.getValue(search.createColumn({name:
				// "amount", label: "Amount"}));
				// var date=result.getValue(search.createColumn({name:
				// "trandate", label: "Date"}));
				// var location=result.getText(search.createColumn({name:
				// "location", label: "Location"}));
				// var assembly=result.getText(search.createColumn({name:
				// "assembly", label: "Assembly"}));
				// var
				// manufacturingrouting=result.getText(search.createColumn({name:
				// "manufacturingrouting", label: "Manufacturing Routing"}));
				// var quantity=result.getValue(search.createColumn({name:
				// "quantity", label: "Quantity"}));
				// var cuspartno=result.getValue(search.createColumn({name:
				// "custcol_scm_customerpartnumber", label: "Customer Part
				// Number"}));

				// log.debug("docNo added amount",amount);
				// wodetails.internalId=internalId;
				// wodetails.docNo=docNo;
				// wodetails.name=name;
				// wodetails.account=account;
				// wodetails.status=status;
				// wodetails.amount=Number(amount).toFixed(2);
				// wodetails.date=date;
				// wodetails.location=location;
				// wodetails.assembly=assembly;
				// wodetails.manufacturingrouting=manufacturingrouting;
				// wodetails.quantity=quantity;
				// wodetails.cuspartno=cuspartno;
				// finaldata.push(wodetails);
				// return true;
				// });

			}

			/**
			 * Function called upon sending a PUT request to the RESTlet.
			 * 
			 * @param {string |
			 *            Object} requestBody - The HTTP request body; request
			 *            body will be passed into function as a string when
			 *            request Content-Type is 'text/plain' or parsed into an
			 *            Object when request Content-Type is 'application/json'
			 *            (in which case the body must be a valid JSON)
			 * @returns {string | Object} HTTP response body; return string when
			 *          request Content-Type is 'text/plain'; return Object when
			 *          request Content-Type is 'application/json'
			 * @since 2015.2
			 */
			function doPut(requestBody) {

			}

			/**
			 * Function called upon sending a POST request to the RESTlet.
			 * 
			 * @param {string |
			 *            Object} requestBody - The HTTP request body; request
			 *            body will be passed into function as a string when
			 *            request Content-Type is 'text/plain' or parsed into an
			 *            Object when request Content-Type is 'application/json'
			 *            (in which case the body must be a valid JSON)
			 * @returns {string | Object} HTTP response body; return string when
			 *          request Content-Type is 'text/plain'; return Object when
			 *          request Content-Type is 'application/json'
			 * @since 2015.2
			 */
			function doGet(requestParams) {

			}

			/**
			 * Function called upon sending a DELETE request to the RESTlet.
			 * 
			 * @param {Object}
			 *            requestParams - Parameters from HTTP request URL;
			 *            parameters will be passed into function as an Object
			 *            (for all supported content types)
			 * @returns {string | Object} HTTP response body; return string when
			 *          request Content-Type is 'text/plain'; return Object when
			 *          request Content-Type is 'application/json'
			 * @since 2015.2
			 */
			function doDelete(requestParams) {

			}

			return {
				get : doGet,
				put : doPut,
				post : doPost,
				'delete' : doDelete
			};

		});