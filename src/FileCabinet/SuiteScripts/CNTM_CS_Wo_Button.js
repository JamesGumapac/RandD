/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
/**
 * Module Description
 * 
 * Script Name: CNTM CS WOT PDF Script ID: customscript_cntm_cs_wot_pdf
 * 
 * Version Date Author Remarks 1.0 18-01-2021 Sharang Kapsikar Client Script for
 * Button Operation on WO. 2.0 22-01-2021 Vinayak Dethe - Added functionality to
 * update Operations on WO.
 * 
 */
define(
		[ 'N/currentRecord', 'N/url', 'N/search', 'N/runtime', 'N/record' ],
		function(currentRecord, url, search, runtime, record) {

			/**
			 * Function to be executed after page is initialized.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.mode - The mode in which the record is
			 *            being accessed (create, copy, or edit)
			 * 
			 * @since 2015.2
			 */

			function printFinal(recordId) {
				if (recordId) {

					var output = url.resolveScript({
						scriptId : 'customscript_cntm_print_wot',
						deploymentId : 'customdeploy_cntm_print_wot',
						returnExternalUrl : false
					});
					window.open(output + '&recId=' + recordId);
				}
			}
			function printPoFinal(recordId) {
				if (recordId) {

					var output = url.resolveScript({
						scriptId : 'customscript_cntm_sl_print_quote',
						deploymentId : 'customdeploy_cntm_sl_print_quote',
						returnExternalUrl : false
					});
					window.open(output + '&recId=' + recordId);
				}
			}

			function showPopup(recordId) {
				if (document.getElementById('cntm_lib') == null
						|| document.getElementById('cntm_lib') == undefined) {
					jQuery('head')
							.append(
									'<script id="cntm_lib" src="https://cdn.jsdelivr.net/npm/sweetalert2@10"><script>');
					jQuery('head')
							.append(
									'<script src="https://code.highcharts.com/highcharts.js"></script>');
					jQuery('head')
							.append(
									'<script src="https://code.highcharts.com/modules/sankey.js"></script>');
					jQuery('head')
							.append(
									'<script src="https://code.highcharts.com/modules/organization.js"></script>');
					jQuery('head')
							.append(
									'<script src="https://code.highcharts.com/modules/exporting.js"></script>');
					jQuery('head')
							.append(
									'<script src="https://code.highcharts.com/modules/accessibility.js"></script>');
					jQuery('head')
							.append(
									'<style>.highcharts-figure, .highcharts-data-table table {\n'
											+ '    min-width: 360px; \n'
											+ '    max-width: 800px;\n'
											+ '    margin: 1em auto;\n'
											+ '}\n'
											+ '\n'
											+ '.highcharts-data-table table {\n'
											+ '	font-family: Verdana, sans-serif;\n'
											+ '	border-collapse: collapse;\n'
											+ '	border: 1px solid #EBEBEB;\n'
											+ '	margin: 10px auto;\n'
											+ '	text-align: center;\n'
											+ '	width: 100%;\n'
											+ '	max-width: 500px;\n'
											+ '}\n'
											+ '.highcharts-data-table caption {\n'
											+ '    padding: 1em 0;\n'
											+ '    font-size: 1.2em;\n'
											+ '    color: #555;\n'
											+ '}\n'
											+ '.highcharts-data-table th {\n'
											+ '	font-weight: 600;\n'
											+ '    padding: 0.5em;\n'
											+ '}\n'
											+ '.highcharts-data-table td, .highcharts-data-table th, .highcharts-data-table caption {\n'
											+ '    padding: 0.5em;\n'
											+ '}\n'
											+ '.highcharts-data-table thead tr, .highcharts-data-table tr:nth-child(even) {\n'
											+ '    background: #f8f8f8;\n'
											+ '}\n'
											+ '.highcharts-data-table tr:hover {\n'
											+ '    background: #f1f7ff;\n'
											+ '}\n'
											+ '\n'
											+ '#container h4 {\n'
											+ '    text-transform: none;\n'
											+ '    font-size: 14px;\n'
											+ '    font-weight: normal;\n'
											+ '}\n'
											+ '#container p {\n'
											+ '    font-size: 13px;\n'
											+ '    line-height: 16px;\n'
											+ '}\n'
											+ '\n'
											+ '@media screen and (max-width: 600px) {\n'
											+ '    #container h4 {\n'
											+ '        font-size: 2.3vw;\n'
											+ '        line-height: 3vw;\n'
											+ '    }\n'
											+ '    #container p {\n'
											+ '        font-size: 2.3vw;\n'
											+ '        line-height: 3vw;\n'
											+ '    }\n'
											+ '}\n .swal2-modal{width:1000px !important;}'
											+ '</style>');
				}
				if (recordId) {
					setTimeout(
							function() {

								Swal
										.fire({
											title : "<i>Hierarchy Work Order</i>",
											html : '<figure class="highcharts-figure">\<div id="container"></div></figure>',
											confirmButtonText : "<u>Close</u>",
										});

								Highcharts
										.chart(
												'container',
												{
													chart : {
														height : 600,
														inverted : false
													},

													title : {
														text : 'Hierarchy Work Order'
													},

													accessibility : {
														point : {
															descriptionFormatter : function(
																	point) {
																var nodeName = point.toNode.name, nodeId = point.toNode.id, nodeDesc = nodeName === nodeId ? nodeName
																		: nodeName
																				+ ', '
																				+ nodeId, parentDesc = point.fromNode.id;
																return point.index
																		+ '. '
																		+ nodeDesc
																		+ ', reports to '
																		+ parentDesc
																		+ '.';
															}
														}
													},

													series : [ {
														type : 'organization',
														name : 'Highsoft',
														keys : [ 'from', 'to' ],
														data : [
																[ 'Test',
																		'Board' ],
																[ 'Board',
																		'CEO' ],
																[ 'CEO', 'CTO' ],
																[ 'CEO', 'CPO' ],
																[ 'CEO', 'CSO' ],
																[ 'CEO', 'CMO' ],
																[ 'CEO', 'HR' ],
																[ 'CTO',
																		'Product' ],
																[ 'CTO', 'Web' ],
																[ 'CSO',
																		'Sales' ],
																[ 'CMO',
																		'Market' ] ],
														levels : [ {
															level : 0,
															color : 'silver',
															dataLabels : {
																color : 'black'
															},
															height : 25
														}, {
															level : 1,
															color : 'silver',
															dataLabels : {
																color : 'black'
															},
															height : 25
														}, {
															level : 2,
															color : '#980104'
														}, {
															level : 4,
															color : '#359154'
														} ],
														nodes : [
																{
																	id : 'Shareholders'
																},
																{
																	id : 'Board'
																},
																{
																	id : 'CEO',
																	title : '',
																	name : 'Work Order 1'
																},
																{
																	id : 'HR',
																	title : '',
																	name : 'Work Order 2',
																	color : '#007ad0',
																	column : 3,
																	offset : '75%'
																},
																{
																	id : 'CTO',
																	title : '',
																	name : 'Work Order 3',
																	column : 4,

																	layout : 'hanging'
																},
																{
																	id : 'CPO',
																	title : '',
																	name : 'Work Order 4',
																	column : 4,

																},
																{
																	id : 'CSO',
																	title : '',
																	name : 'Work Order 5',
																	column : 4,

																	layout : 'hanging'
																},
																{
																	id : 'CMO',
																	title : '',
																	name : 'Work Order 6',
																	column : 4,

																	layout : 'hanging'
																},
																{
																	id : 'Product',
																	name : 'Work Order 7'
																},
																{
																	id : 'Web',
																	name : 'Work Order 8'
																},
																{
																	id : 'Sales',
																	name : 'Work Order 9'
																},
																{
																	id : 'Market',
																	name : 'Work Order 10'
																} ],
														colorByPoint : false,
														color : '#007ad0',
														dataLabels : {
															color : 'white'
														},
														borderColor : 'white',
														nodeWidth : 65
													} ],
													tooltip : {
														outside : true
													},
													exporting : {
														allowHTML : true,
														sourceWidth : 800,
														sourceHeight : 600
													}

												});
							}, 5000);

				}
			}

			/*
			 * Call from UE on clicking UPDATE OPERATIONS
			 * 
			 * This will uncheck the WIP checkbox on WO.
			 * 
			 */

			function updateandrefresh(recordId) {
				try {
					debugger;
					// jQuery('body').append('<div id="loadingIndicator" style="
					// position: fixed; top: 0; left: 0; height: 100%; width:
					// 100%; z-index: 9999; background-color:rgba(255, 255, 255,
					// 0.85);"><img class="global-loading-indicator"
					// src="data:image/gif;base64,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"
					// style="position: fixed; top: 50%; left: 50%; transform:
					// translate(-50%, -50%)"></div>');
					// setTimeout(function() {

					if (recordId) {
						debugger;

						var objRecord = record.load({
							type : record.Type.WORK_ORDER,
							id : recordId,
							isDynamic : true,
						});

						var routingvalue = objRecord.getValue({
							fieldId : 'manufacturingrouting'
						});

						var bomvalue = objRecord.getValue({
							fieldId : 'billofmaterials'
						});

						var bomrevval = objRecord.getValue({
							fieldId : 'billofmaterialsrevision'
						});

						// var checkvalue = objRecord.getValue({
						// fieldId : 'iswip'
						// });

						debugger;
						//				
						if (checkIfEmpty(bomvalue)) {
							objRecord.setValue({
								fieldId : 'billofmaterials',
								value : "",
								ignorefieldChanged : false
							});

							setTimeout(function() {
								debugger;
								objRecord.setValue({
									fieldId : 'billofmaterials',
									value : bomvalue,
									ignorefieldChanged : false
								})

								// objRecord.setValue({
								// 	fieldId : 'custbody_cntm_routing_check',
								// 	value : false,
								// 	ignorefieldChanged : false
								// })

								objRecord.save();
							}, 500);

						}

						debugger;
						var temp = record.submitFields({
							type : record.Type.WORK_ORDER,
							id : recordId,
							values : {
								iswip : false,
							},
							options : {
								enableSourcing : false,
								ignoreMandatoryFields : true
							}
						});

						var temp2 = record.submitFields({
							type : record.Type.WORK_ORDER,
							id : recordId,
							values : {

								billofmaterialsrevision : bomrevval,
								iswip : true,
								manufacturingrouting : routingvalue,
								custbody_cntm_routing_check : false
							},
							options : {
								enableSourcing : false,
								ignoreMandatoryFields : true
							}
						});

						debugger;

						//
						refresh();
					}
					// jQuery('#loadingIndicator').hide();
					// }, 5000);

				} catch (e) {
					log.debug("error occurred in updateandrefresh", e);
					alert(e);
				}

			}

			function checkIfEmpty(data) {
				if (data != "" && data != undefined && data != "") {
					return true;
				}
				return false;
			}

			function refresh() {
				window.location.reload();
			}

			function pageInit(scriptContext) {

				log.debug("Context Mode:-" + scriptContext.mode);
			}
			return {
				refresh : refresh,
				updateandrefresh : updateandrefresh,
				// setrouting:setrouting,
				printFinal : printFinal,
				printPoFinal : printPoFinal,
				pageInit : pageInit,
				showPopup : showPopup

			};

		});