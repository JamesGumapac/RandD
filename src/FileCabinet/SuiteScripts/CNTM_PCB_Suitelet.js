/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(
		[ 'N/ui/serverWidget', 'N/record', 'N/search', 'N/transaction',
				'N/ui/serverWidget', 'N/xml', 'N/runtime', 'N/task',
				'N/render', 'N/https', 'N/url', 'N/redirect', 'N/file' ],

		function(ui, record, search, transaction, serverWidget, xml, runtime,
				task, render, https, url, redirect, file) {

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

				if (context.request.method === 'GET') {

					// var jobId=context.request.parameters.itemNo;
					var salesOrder = context.request.parameters.so;
					var bomdetails = context.request.parameters.bom
					var fabdetails = context.request.parameters.fabRec
					var form = ui.createForm({
						title : 'Update Routings'
					});

					form.addSubmitButton({
						label : 'Submit'
					});
					form.addButton({
						id : 'cancel_button',
						label : 'Cancel',
						functionName : "cancelButton"
					});

					var inline_html = form.addField({
						id : 'custpage_loader',
						label : 'HTMLFIELD',
						type : ui.FieldType.INLINEHTML
					});

					inline_html.defaultValue = '<script type="text/javascript">function preloadFunc(){jQuery("head").append("<script id=cntm_lib_loader src=https://cdn.jsdelivr.net/npm/gasparesganga-jquery-loading-overlay@2.1.5/dist/loadingoverlay.min.js><script>");setTimeout(function(){jQuery.LoadingOverlay("show");},100)}window.onpaint = preloadFunc();</script>';
					var salesOrderDetails = form.addField({
						id : 'custpage_sales_order',
						source : 'salesorder',
						type : ui.FieldType.SELECT,
						label : 'Sales Order'
					});

					salesOrderDetails.defaultValue = salesOrder;
					salesOrderDetails.updateDisplayType({
						displayType : ui.FieldDisplayType.HIDDEN
					});
					var billofmaterials = form.addField({
						id : 'custpage_billofmaterials',
						source : 'bom',
						type : ui.FieldType.SELECT,
						label : 'BOM'
					});
					bomdetails.defaultValue = bomdetails;
					billofmaterials.updateDisplayType({
						displayType : ui.FieldDisplayType.HIDDEN
					});
					var fabrec = form.addField({
						id : 'custpage_fabrec',
						source : 'customrecord_cntm_wo_bom_import_fab',
						type : ui.FieldType.SELECT,
						label : 'FAB RECORD'
					});
					fabrec.defaultValue = fabdetails;
					fabrec.updateDisplayType({
						displayType : ui.FieldDisplayType.HIDDEN
					});
					var itemNumber = form.addField({
						id : 'custpage_item_details',
						source : 'item',
						type : ui.FieldType.SELECT,
						label : 'ITEM'
					});

					var uploadRouting = form.addField({
						id : 'custpage_upload_files',
						type : ui.FieldType.FILE,
						label : 'UPLOAD ROUTING FILE'
					});
					var errorFile = form.addField({
						id : 'custpage_error_file',
						type : ui.FieldType.URL,
						label : 'Error File'
					});
					var errorFileId = context.request.parameters.errfile;
					if (!errorFileId) {
						var fabLookUp = search.lookupFields({
							type : 'customrecord_cntm_wo_bom_import_fab',
							id : fabdetails,
							columns : [ 'custrecord_cntm_routing_err_file' ]
						});
						errorFileId = fabLookUp.custrecord_cntm_routing_err_file[0].value;
					}
					if (errorFileId) {
						var fileObj = file.load({
							id : errorFileId
						});
						errorFile.defaultValue = fileObj.url;
						errorFile.linkText = 'Error File'
						errorFile.updateDisplayType({
							displayType : ui.FieldDisplayType.INLINE
						});
					}
					// var uploadRouting = form.addField({
					// id: 'custpage_upload_files_display',
					// type: ui.FieldType.SELECT,
					// label: 'UPLOAD ROUTING FILE Display',
					// source :'files'
					// });

					var itemSublist = form.addSublist({
						id : 'custpage_item_sublist',
						type : ui.SublistType.INLINEEDITOR,
						label : 'PCB Item Sublist',
						container : 'custpage_pcb_items_grp'
					});

					// var createWoc = itemSublist.addField({
					// id : 'custpage_createwoc',
					// label : 'Create WOC',
					// type : ui.FieldType.CHECKBOX
					// });
					var itemCol = itemSublist.addField({
						id : "custpage_item_sub",
						type : serverWidget.FieldType.SELECT,
						label : "Item",
						source : "item"
					});
					itemCol.isMandatory = true;
					itemCol.updateDisplayType({
						displayType : ui.FieldDisplayType.DISABLED
					});
					var workOrderCol = itemSublist.addField({
						id : "custpage_workorder",
						type : serverWidget.FieldType.SELECT,
						label : "WO#",
						source : "workorder"
					});
					workOrderCol.updateDisplayType({
						displayType : ui.FieldDisplayType.DISABLED
					});
					var workOrderCreatedFromCol = itemSublist.addField({
						id : "custpage_workorder_cf",
						type : serverWidget.FieldType.SELECT,
						label : "Created From",
						source : "workorder"
					});
					workOrderCreatedFromCol.updateDisplayType({
						displayType : ui.FieldDisplayType.DISABLED
					});
					var wo_qty = itemSublist.addField({
						id : "custpage_quantity",
						type : serverWidget.FieldType.FLOAT,
						label : "WO Qty"
					});
					wo_qty.updateDisplayType({
						displayType : ui.FieldDisplayType.DISABLED
					});
					var wo_status = itemSublist.addField({
						id : "custpage_wo_status",
						type : serverWidget.FieldType.TEXT,
						label : "WO Status",
						source : 'status'
					});
					wo_status.updateDisplayType({
						displayType : ui.FieldDisplayType.DISABLED
					});
					var newRoute = itemSublist.addField({
						id : 'custpage_new_rout',
						type : serverWidget.FieldType.CHECKBOX,
						label : 'New Routing'
					});
					var newlot = itemSublist.addField({
						id : 'custpage_lot_rec',
						type : serverWidget.FieldType.CHECKBOX,
						label : 'Create LOT Record'
					});
					newlot.updateDisplayType({
						displayType : ui.FieldDisplayType.HIDDEN
					});
					var routeStatus = itemSublist.addField({
						id : "custpage_routing_status",
						type : serverWidget.FieldType.SELECT,
						label : "ROUTING STATUS",
						source : "customlist_cntm_rout_crtn_status"
					});
					routeStatus.updateDisplayType({
						displayType : ui.FieldDisplayType.DISABLED
					});
					var crStatus = itemSublist.addField({
						id : "custpage_cr_status",
						type : serverWidget.FieldType.SELECT,
						label : "CR Status",
						source : "customlist_cntm_cr_status"
					});
					crStatus.updateDisplayType({
						displayType : ui.FieldDisplayType.HIDDEN
					});
					var errorDetails = itemSublist.addField({
						id : "custpage_error_details",
						type : serverWidget.FieldType.TEXT,
						label : "Error"

					});
					var errorFile = itemSublist.addField({
						id : "custpage_error_details_file",
						type : serverWidget.FieldType.URL,
						label : " "
					});
					errorFile.linkText = 'Error File'
					errorDetails.updateDisplayType({
						displayType : ui.FieldDisplayType.DISABLED
					});
					errorFile.updateDisplayType({
						displayType : ui.FieldDisplayType.ENTRY
					});
					errorFile.updateDisplayType({
						displayType : ui.FieldDisplayType.INLINE
					});
					crStatus.updateDisplayType({
						displayType : ui.FieldDisplayType.DISABLED
					});
					var sublistId = itemSublist.addField({
						id : 'custpage_sublistinternalid',
						label : 'SublistId',
						type : ui.FieldType.INTEGER
					});
					sublistId.updateDisplayType({
						displayType : ui.FieldDisplayType.HIDDEN
					});
					form.clientScriptModulePath = './CNTM_PCB_Suitelt_CS.js';
					// form.clientScriptFileId = 36912;
					context.response.writePage(form);
				} else {

					log.debug("in Post");
					log.debug("Parameters:-", context.request.parameters);
					// log.debug("sublist:-",context.request.parameters.custpage_item_sublistdata);
					var lineCount = context.request.getLineCount({
						group : 'custpage_item_sublist'
					});
					log.debug('Total Lines ' + lineCount);
					// var custId=context.request.parameters.custpage_hidden_id;
					// var
					// jobID=context.request.parameters.custpage_jobnumber_text;
					var totalData = [];
					var routeFile = context.request.files.custpage_upload_files;
					var sovalue = context.request.parameters.custpage_sales_order;
					var bomValue = context.request.parameters.custpage_billofmaterials;
					var fabvalue = context.request.parameters.custpage_fabrec;
					var routeFileId = "";
					if (routeFile) {
						routeFile.folder = 20189;
						routeFileId = routeFile.save();
					}
					// var routeFile = context.request.getValue({
					// fieldId : ''
					// });
					log.debug("file:-", routeFile);
					var flagForRoute = false;
					for (var int = 0; int < lineCount; int++) {
						var mainjson = {};
						var itemDetails = context.request.getSublistValue({
							group : 'custpage_item_sublist',
							name : 'custpage_item_sub',
							line : int
						});

						var workOrder = context.request.getSublistValue({
							group : 'custpage_item_sublist',
							name : 'custpage_workorder',
							line : int
						});
						var woQty = context.request.getSublistValue({
							group : 'custpage_item_sublist',
							name : 'custpage_workorder_cf',
							line : int
						});
						var woStatus = context.request.getSublistValue({
							group : 'custpage_item_sublist',
							name : 'custpage_wo_status',
							line : int
						});
						var newRoute = context.request.getSublistValue({
							group : 'custpage_item_sublist',
							name : 'custpage_new_rout',
							line : int
						});
						var lotRec = context.request.getSublistValue({
							group : 'custpage_item_sublist',
							name : 'custpage_lot_rec',
							line : int
						});
						var internalId = context.request.getSublistValue({
							group : 'custpage_item_sublist',
							name : 'custpage_sublistinternalid',
							line : int
						});

						mainjson.workOrder = workOrder;
						mainjson.woStatus = woStatus;
						mainjson.routeFileId = routeFileId;
						mainjson.itemDetails = itemDetails;
						mainjson.woQty = woQty;
						// mainjson.routeFile=routeFile;
						if (newRoute == "T") {
							mainjson.newRoute = true;
							flagForRoute = true;
						} else
							mainjson.newRoute = false;

						if (lotRec == "T")
							mainjson.lotRec = true;
						else
							mainjson.lotRec = false;

						mainjson.internalId = internalId;
						totalData.push(mainjson);
					}
					var mainjsonroute = {};
					mainjsonroute['RouteArray'] = totalData;
					mainjsonroute['flagForRoute'] = flagForRoute;
					mainjsonroute['bomvalue'] = bomValue;
					mainjsonroute['fabrec'] = fabvalue;
					log.debug("in Post", JSON.stringify(mainjsonroute));

					var headerObj = {
						name : 'Accept-Language',
						value : 'en-us'
					};

					var output = url.resolveScript({
						scriptId : 'customscript_cntm_pcb_backend_su',
						deploymentId : 'customdeploy_cntm_pcb_backen',
						returnExternalUrl : true
					});

					var response = https.post({
						url : output,
						body : JSON.stringify(mainjsonroute),
					});
					log.debug("resp", response);
					redirect.toSuitelet({
						scriptId : 'customscript_cntm_pcb_sutielet',
						deploymentId : 'customdeploy_cntm_pcb_suitlet',
						parameters : {
							'msgShow' : 'true',
							"so" : sovalue,
							"bom" : bomValue,
							"fabRec" : fabvalue
						}
					});

					// redirect.toSuitelet({
					// scriptId: 'customscript_cntm_client_su' ,
					// deploymentId: 'customdeploy_cntm_client_su',
					// parameters: {'msgShow':'true'}
					// });
				}
			}

			return {
				onRequest : onRequest
			};

		});
