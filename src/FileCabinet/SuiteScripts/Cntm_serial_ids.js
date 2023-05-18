/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(
		[ 'N/record', 'N/currentRecord', 'N/search', 'N/url', 'N/ui/dialog' ],
		/**
		 * @param {record}
		 *            record
		 * @param {search}
		 *            search
		 */
		function(record, currentRecord, search, url, dialog) {

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
			var invdetail = {};
			function pageInit(scriptContext) {

				try {
					var startingOperation = scriptContext.currentRecord
							.getText({
								fieldId : 'startoperation'
							});
					var endingOperation = scriptContext.currentRecord.getText({
						fieldId : 'endoperation'
					});

					var lines = scriptContext.currentRecord.getLineCount({
						sublistId : 'operation'
					});
					var subopstart = scriptContext.currentRecord
							.getSublistValue({
								sublistId : 'operation',
								fieldId : 'operationsequence',
								line : 0
							});

					var subopend = scriptContext.currentRecord
							.getSublistValue({
								sublistId : 'operation',
								fieldId : 'operationsequence',
								line : lines - 1
							});
					// debugger;
					mangaeview(startingOperation, subopstart, endingOperation,
							subopend);
				} catch (e) {
					console.log(e);
				}
			}

			function mangaeview(startingOperation, subopstart, endingOperation,
					subopend) {

				if (startingOperation != "") {
					if (startingOperation == subopstart) {
						jQuery('#custbody_cntm_serial_ids_fs_inp').closest(
								'.uir-field-wrapper')[0].style.visibility = '';
					} else {
						jQuery('#custbody_cntm_serial_ids_fs_inp').closest(
								'.uir-field-wrapper')[0].style.visibility = 'hidden';
					}
				}
				if (endingOperation != "") {
					if (subopend == endingOperation) {
						jQuery('#custbody_cntm_inventory_detail_fs_inp')
								.closest('.uir-field-wrapper')[0].style.visibility = '';
					} else {
						jQuery('#custbody_cntm_inventory_detail_fs_inp')
								.closest('.uir-field-wrapper')[0].style.visibility = 'hidden';
					}
				}
			}
			/**
			 * Function to be executed when field is changed.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * @param {string}
			 *            scriptContext.fieldId - Field name
			 * @param {number}
			 *            scriptContext.lineNum - Line number. Will be undefined
			 *            if not a sublist or matrix field
			 * @param {number}
			 *            scriptContext.columnNum - Line number. Will be
			 *            undefined if not a matrix field
			 * 
			 * @since 2015.2
			 */
			function fieldChanged(scriptContext) {

				if (scriptContext.fieldId == 'custbody_cntm_serial_ids') {
					if (scriptContext.currentRecord.getValue({
						fieldId : 'custbody_cntm_serial_ids'
					}) == true || scriptContext.currentRecord.getValue({
						fieldId : 'custbody_cntm_serial_ids'
					}) == 'T') {
						var qty = scriptContext.currentRecord.getValue({
							fieldId : 'completedquantity'
						});
						if (qty) {
							var wo = scriptContext.currentRecord.getValue({
								fieldId : 'createdfrom'
							});
							var asmItem = scriptContext.currentRecord
									.getValue({
										fieldId : 'item'
									});
							/*
							 * var woRecord = record.load({ type : "workorder",
							 * id : wo }); var woQty =woRecord.getValue({
							 * fieldId : 'quantity' });
							 */
							debugger;
							var output = url.resolveScript({
								scriptId : 'customscript_cntm_serial_id',
								deploymentId : 'customdeploy_cntm_serial_id',
								returnExternalUrl : false
							});
							output = output + "&wo=" + wo + "&qty=" + qty/* woQty */
									+ "&item=" + asmItem;

							window.open(output, "_blank", "top=1,left=1")
									.resizeTo(1380, 730);
						} else {
							alert('Please enter Completed Quantity first.');
							scriptContext.currentRecord.setValue({
								fieldId : 'custbody_cntm_serial_ids',
								value : false
							});
						}
					}
				}
				if (scriptContext.sublistId == 'custpage_ids'
						&& scriptContext.fieldId == 'custpage_serial_id') {
					var sId = scriptContext.currentRecord
							.getCurrentSublistValue({
								sublistId : 'custpage_ids',
								fieldId : 'custpage_serial_id'
							});
					if (sId) {
						/*var lineNumber = scriptContext.currentRecord
								.findSublistLineWithValue({
									sublistId : 'custpage_ids',
									fieldId : 'custpage_serial_id',
									value : sId
								});*/
						var lineCount=scriptContext.currentRecord
						.getLineCount({sublistId : 'custpage_ids'});
						var currIndex = scriptContext.currentRecord.getCurrentSublistIndex({
							sublistId: 'item'
							});
						for(var i=0;i<lineCount;i++){
							if(i!=currIndex){
								var sId2 = scriptContext.currentRecord
								.getSublistValue({
									sublistId : 'custpage_ids',
									fieldId : 'custpage_serial_id',
									line:i
								});
								
								if(sId==sId2){
									alert('You cannot use same Serial Id. Please enter different Serial Id and try again.');
									scriptContext.currentRecord
											.setCurrentSublistValue({
												sublistId : 'custpage_ids',
												fieldId : 'custpage_serial_id',
												value : ''
											});
								}
							}
						}
						/*if (lineNumber) {
							alert('Same id is already used');
							scriptContext.currentRecord
									.setCurrentSublistValue({
										sublistId : 'custpage_ids',
										fieldId : 'custpage_serial_id',
										value : ''
									});
						}*/
					}
				}
				if (scriptContext.fieldId == 'custbody_cntm_inventory_detail') {
					if (scriptContext.currentRecord.getValue({
						fieldId : 'custbody_cntm_inventory_detail'
					}) == true || scriptContext.currentRecord.getValue({
						fieldId : 'custbody_cntm_inventory_detail'
					}) == 'T') {
						var wo = scriptContext.currentRecord.getValue({
							fieldId : 'createdfrom'
						});
						var qty = scriptContext.currentRecord.getValue({
							fieldId : 'completedquantity'
						});
						var output = url.resolveScript({
							scriptId : 'customscript_cntm_ss_woc_inv',
							deploymentId : 'customdeploy_cntm_ss_woc_inv',
							returnExternalUrl : false
						});
						output = output + "&wo=" + wo + "&qty=" + qty;

						window.open(output, "_blank", "top=1,left=1").resizeTo(
								1380, 730);
					}
				}
				if (scriptContext.fieldId == 'custbody_cntm_release_serial_ids') {
					if (scriptContext.currentRecord.getValue({
						fieldId : 'custbody_cntm_release_serial_ids'
					}) == true || scriptContext.currentRecord.getValue({
						fieldId : 'custbody_cntm_release_serial_ids'
					}) == 'T') {
						var wo = scriptContext.currentRecord.getValue({
							fieldId : 'createdfrom'
						});
						var output = url
								.resolveScript({
									scriptId : 'customscript_cntm_release_serial_ids',
									deploymentId : 'customdeploy_cntm_release_serial_ids',
									returnExternalUrl : false
								});
						output = output + "&wo=" + wo;

						window.open(output, "_blank", "top=1,left=1").resizeTo(
								1380, 730);
					}
				}
				if (scriptContext.fieldId == 'startoperation'
						|| scriptContext.fieldId == 'endoperation') {
					try {
						var startingOperation = scriptContext.currentRecord
								.getText({
									fieldId : 'startoperation'
								});
						var endingOperation = scriptContext.currentRecord
								.getText({
									fieldId : 'endoperation'
								});

						var lines = scriptContext.currentRecord.getLineCount({
							sublistId : 'operation'
						});
						var subopstart = scriptContext.currentRecord
								.getSublistValue({
									sublistId : 'operation',
									fieldId : 'operationsequence',
									line : 0
								});

						var subopend = scriptContext.currentRecord
								.getSublistValue({
									sublistId : 'operation',
									fieldId : 'operationsequence',
									line : lines - 1
								});
						// debugger;
						mangaeview(startingOperation, subopstart,
								endingOperation, subopend);
					} catch (e) {
						console.log(e);
					}
				}
				// if(scriptContext.fieldId == 'custpage_mark_copy')
				// {
				// debugger;
				// scriptContext.currentRecord.getValue({
				// fieldId : 'custpage_lotnumberitem'
				// })
				//			
				// var lines = scriptContext.currentRecord.getLineCount({
				// sublistId : 'custpage_lotnumberitem'
				// });
				// var tempNo=0;
				// for (var i = 0; i < lines; i++) {
				// var checkPoint=scriptContext.currentRecord.getSublistValue({
				// sublistId : 'custpage_lotnumberitem',
				// fieldId : 'custpage_mark_copy',
				// line : i
				// });
				// console.log(tempNo,checkPoint);
				// if(checkPoint){
				// tempNo++
				// }
				// }
				// var actualQty=scriptContext.currentRecord.getValue({
				// fieldId : 'custpage_selectedqty'
				// })
				// if(actualQty<tempNo)
				// {
				// scriptContext.currentRecord.setCurrentSublistValue({
				// sublistId : 'custpage_lotnumberitem',
				// fieldId : 'custpage_mark_copy',
				// value : false
				// });
				// dialog.alert({
				// title : 'Alert',
				// message : 'Not allowed more than GOOD Quantity'
				// });
				// }
				// }
				// if (scriptContext.fieldId == 'custbody_cntm_inv_map'){
				// debugger;
				// var tempvalue=scriptContext.currentRecord.getValue({
				// fieldId : 'custbody_cntm_inv_map'
				// });
				// tempvalue=JSON.parse(tempvalue);
				// invdetail = scriptContext.currentRecord.getSubrecord({
				// fieldId: 'inventorydetail'
				// });
				// if(invdetail){
				//				
				// for(var i=0;i<tempvalue.length;i++)
				// {
				// //totallinecount++;
				// invdetail.selectLine({
				// sublistId: 'inventoryassignment',
				// line: i
				// });
				// invdetail.setCurrentSublistValue({
				// sublistId: 'inventoryassignment',
				// fieldId: 'receiptinventorynumber',
				// value: tempvalue[i].lot
				// });
				// invdetail.setCurrentSublistValue({
				// sublistId: 'inventoryassignment',
				// fieldId: 'receiptinventorynumber',
				// value: 1
				// });
				// sinvdetail.commitLine({
				// sublistId: 'inventoryassignment'
				// });
				// }
				// // invdetail.save({
				// // enableSourcing: true,
				// // ignoreMandatoryFields: true
				// // });
				// }
				// //.save();
				// }

				/*
				 * if (scriptContext.fieldId == 'custbody_cntm_inv_map') { var
				 * wocRec=currentRecord.get(); var map =
				 * JSON.parse(scriptContext.currentRecord.getValue({ fieldId :
				 * 'custbody_cntm_inv_map' })); var subRec =
				 * wocRec.getSubrecord({ fieldId : 'inventorydetail' });
				 * alert(subRec); var i = 0; for ( var key in map) {
				 * subRec.selectLine({ sublistId : 'inventoryassignment', line :
				 * i }); subRec.setCurrentSublistValue({ sublistId :
				 * 'inventoryassignment', fieldId : 'receiptinventorynumber',
				 * value : map[key].lot, line:i }); subRec.commitLine({
				 * sublistId : 'inventoryassignment' }); i++; } }
				 */
			}

			/**
			 * Function to be executed when field is slaved.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * @param {string}
			 *            scriptContext.fieldId - Field name
			 * 
			 * @since 2015.2
			 */
			function postSourcing(scriptContext) {

			}

			/**
			 * Function to be executed after sublist is inserted, removed, or
			 * edited.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * 
			 * @since 2015.2
			 */
			function sublistChanged(scriptContext) {

			}

			/**
			 * Function to be executed after line is selected.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * 
			 * @since 2015.2
			 */
			function lineInit(scriptContext) {

			}

			/**
			 * Validation function to be executed when field is changed.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * @param {string}
			 *            scriptContext.fieldId - Field name
			 * @param {number}
			 *            scriptContext.lineNum - Line number. Will be undefined
			 *            if not a sublist or matrix field
			 * @param {number}
			 *            scriptContext.columnNum - Line number. Will be
			 *            undefined if not a matrix field
			 * 
			 * @returns {boolean} Return true if field is valid
			 * 
			 * @since 2015.2
			 */
			function validateField(scriptContext) {

			}

			/**
			 * Validation function to be executed when sublist line is
			 * committed.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * 
			 * @returns {boolean} Return true if sublist line is valid
			 * 
			 * @since 2015.2
			 */
			function validateLine(scriptContext) {

			}

			/**
			 * Validation function to be executed when sublist line is inserted.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * 
			 * @returns {boolean} Return true if sublist line is valid
			 * 
			 * @since 2015.2
			 */
			function validateInsert(scriptContext) {

			}

			/**
			 * Validation function to be executed when record is deleted.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * 
			 * @returns {boolean} Return true if sublist line is valid
			 * 
			 * @since 2015.2
			 */
			function validateDelete(scriptContext) {

			}

			/**
			 * Validation function to be executed when record is saved.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @returns {boolean} Return true if record is valid
			 * 
			 * @since 2015.2
			 */
			function saveRecord(scriptContext) {
				var chkFld = scriptContext.currentRecord.getValue({
					fieldId : 'custpage_hdn_inv_chk'
				});
				var isReleaseSerialId = scriptContext.currentRecord.getValue({
					fieldId : 'custpage_hdn_is_release'
				});
				var serialIdForm = scriptContext.currentRecord.getValue({
					fieldId : 'custpage_chk'
				});
				if (chkFld) {
					// alert('1');
					var lines = scriptContext.currentRecord.getLineCount({
						sublistId : 'custpage_lotnumberitem'
					});
					if (lines > 0) {
						var omap = {};
						var setNames = [];
						var lotNames = [];
						var checkmarked = 0;
						var actualQty = scriptContext.currentRecord.getValue({
							fieldId : 'custpage_selectedqty'
						})
						var checkArray = [];
						for (var k = 0; k < lines; k++) {
							var checkPoint = scriptContext.currentRecord
									.getSublistValue({
										sublistId : 'custpage_lotnumberitem',
										fieldId : 'custpage_mark_copy',
										line : k
									});
							if (checkPoint) {
								checkmarked++;
							}

						}
						if (actualQty < checkmarked) {
							dialog
									.alert({
										title : 'Alert',
										message : 'The total inventory detail quantity must be '
												+ actualQty
									});
							return false;
						}
						for (var i = 0; i < lines; i++) {
							var map = {};
							var checkPoint = scriptContext.currentRecord
									.getSublistValue({
										sublistId : 'custpage_lotnumberitem',
										fieldId : 'custpage_mark_copy',
										line : i
									});
							console.log(checkPoint)
							if (checkPoint) {

								var serialId = scriptContext.currentRecord
										.getSublistText({
											sublistId : 'custpage_lotnumberitem',
											fieldId : 'custpage_inventorynumber',
											line : i
										});
								var serialIdValue = scriptContext.currentRecord
										.getSublistValue({
											sublistId : 'custpage_lotnumberitem',
											fieldId : 'custpage_inventorynumber',
											line : i
										});
								var customAsmR = record.load({
									type : "customrecord_cntm_asm_serial_ids",
									id : serialIdValue
								});
								customAsmR.setValue({
									fieldId : 'custrecord_cntm_is_process',
									value : true
								});
								customAsmR.save();
								map.lot = serialId;
								omap[i] = map;
								lotNames.push(serialId);
								setNames.push(serialIdValue)
							}

						}
						if (window.onbeforeunload) {
							window.onbeforeunload = function() {
								null;
							};
						}

						window.opener.require(
								[ '/SuiteScripts/Cntm_serial_ids' ], function(
										myModule) {

									myModule.test(JSON.stringify(lotNames),
											JSON.stringify(setNames));

								})
						// window.opener.nlapiSetFieldValue('custbody_cntm_inv_map',
						// JSON
						// .stringify(omap));
						// setSubrecord(omap);
						// alert('closing...');
						window.close();

					}
				} else if (isReleaseSerialId) {

					// alert('1');
					var lines = scriptContext.currentRecord.getLineCount({
						sublistId : 'custpage_lotnumberitem'
					});
					if (lines > 0) {

						var serialIds = [];

						for (var i = 0; i < lines; i++) {
							var map = {};
							var checkPoint = scriptContext.currentRecord
									.getSublistValue({
										sublistId : 'custpage_lotnumberitem',
										fieldId : 'custpage_mark_release',
										line : i
									});
							console.log(checkPoint)
							if (checkPoint) {

								var serialId = scriptContext.currentRecord
										.getSublistText({
											sublistId : 'custpage_lotnumberitem',
											fieldId : 'custpage_inventorynumber',
											line : i
										});
								var serialIdValue = scriptContext.currentRecord
										.getSublistValue({
											sublistId : 'custpage_lotnumberitem',
											fieldId : 'custpage_inventorynumber',
											line : i
										});
								record.submitFields({
									type : "customrecord_cntm_asm_serial_ids",
									id : serialIdValue,
									values : {
										custrecord_cntm_is_process : false
									}
								});
								// serialIds.push(serialIdValue);
							}
						}
						if (window.onbeforeunload) {
							window.onbeforeunload = function() {
								null;
							};
						}

						window.opener.require(
								[ '/SuiteScripts/Cntm_serial_ids' ], function(
										myModule) {

									myModule.setReleasedIds(JSON
											.stringify(serialIds));

								})
						// window.opener.nlapiSetFieldValue('custbody_cntm_inv_map',
						// JSON
						// .stringify(omap));
						// setSubrecord(omap);
						// alert('closing...');
						window.close();

					}

				} else if (serialIdForm) {

					try {
						// debugger;
						var custpage_wo = scriptContext.currentRecord
								.getValue({
									fieldId : 'custpage_wo'
								});
						var custpage_wo_item = scriptContext.currentRecord
								.getValue({
									fieldId : 'custpage_wo_item'
								});
						var custpage_wo_qty = scriptContext.currentRecord
								.getValue({
									fieldId : 'custpage_wo_qty'
								});
						var lines = scriptContext.currentRecord.getLineCount({
							sublistId : 'custpage_ids'
						});
						// var wo = context.request.parameters.custpage_wo;
						// var lineCount = context.request.getLineCount({
						// group : 'custpage_ids'
						// });

						if (lines != custpage_wo_qty) {
							dialog
									.alert({
										title : 'Alert',
										message : 'Serial Id should be equal to Completed Quantity'
									});
							return false;
						}
						function checkPresent(serialid, custpage_wo_item) {
							var customrecord_cntm_asm_serial_idsSearchObj = search
									.create({
										type : "customrecord_cntm_asm_serial_ids",
										filters : [
												[
														"custrecord_cntm_item_serial_id",
														"anyof",
														custpage_wo_item ],
												"AND",
												[ "name", "is", serialid ] ],
										columns : [ search.createColumn({
											name : "name",
											sort : search.Sort.ASC,
											label : "Name"
										}) ]
									});
							var searchResultCount = customrecord_cntm_asm_serial_idsSearchObj
									.runPaged().count;
							if (searchResultCount > 0)
								return true;
							else
								return false;
							// return searchResultCount
						}
						var duplicate = [];
						for (var int = 0; int < lines; int++) {

							var serialId = scriptContext.currentRecord
									.getSublistValue({
										sublistId : 'custpage_ids',
										fieldId : 'custpage_serial_id',
										line : int
									});

							serialId = serialId.replace(/ /g, "_");
							if (checkPresent(serialId, custpage_wo_item)) {
								duplicate.push(serialId)
							}

						}
						if (duplicate.length > 0) {
							dialog.alert({
								title : 'Alert',
								message : 'Ducpliate Serial ID Not Allowed :- '
										+ duplicate.toString()
							});
							return false;
						} else {
							for (var int = 0; int < lines; int++) {
								var serialId = scriptContext.currentRecord
										.getSublistValue({
											sublistId : 'custpage_ids',
											fieldId : 'custpage_serial_id',
											line : int
										})
								serialId = serialId.replace(/ /g, "_");

								var serialIdRec = record.create({
									type : 'customrecord_cntm_asm_serial_ids',
									isDynamic : true
								});
								serialIdRec.setValue({
									fieldId : 'name',
									value : serialId
								});
								serialIdRec.setValue({
									fieldId : 'custrecord10',
									value : custpage_wo
								});
								serialIdRec.setValue({
									fieldId : 'custrecord_cntm_item_serial_id',
									value : custpage_wo_item
								});
								serialIdRec.save();
							}
						}
						// alert('closing...')
						if (window.onbeforeunload) {
							window.onbeforeunload = function() {
								null;
							};
						}
						window.close();
						return true;

					} catch (e) {

					}

				} else {/*
						 * 
						 * var map =
						 * JSON.parse(scriptContext.currentRecord.getValue({
						 * fieldId : 'custbody_cntm_inv_map' })); if (map) { var
						 * subRec = scriptContext.currentRecord.getSubrecord({
						 * fieldId : 'inventorydetail' }); alert(subRec); var i =
						 * 0; for ( var key in map) { subRec.selectLine({
						 * sublistId : 'inventoryassignment', line : i });
						 * subRec.setCurrentSublistValue({ sublistId :
						 * 'inventoryassignment', fieldId :
						 * 'receiptinventorynumber', value : map[key].lot, line :
						 * i }); subRec.commitLine({ sublistId :
						 * 'inventoryassignment' }); i++; } }
						 */
					/*
					 * try{ var arr = scriptContext.currentRecord.getValue({
					 * fieldId : 'custbody_cntm_released_id_map' }); if (arr) {
					 * var releasdIdMap = JSON.parse(arr);
					 * log.debug('releasdIdMap',releasdIdMap);
					 * log.debug('releasdIdMap.length',releasdIdMap.length);
					 * console.log(releasdIdMap); if (releasdIdMap.length > 0) {
					 * for (var i = 0; i < releasdIdMap; i++) {
					 * log.debug('releasdIdMap[i]',releasdIdMap[i]);
					 * record.submitFields({ type :
					 * "customrecord_cntm_asm_serial_ids", id : releasdIdMap[i],
					 * values : { custrecord_cntm_is_process : false } }); } }
					 * scriptContext.currentRecord.setValue({ fieldId :
					 * 'custbody_cntm_released_id_map', value:'' });
					 * scriptContext.currentRecord.setValue({ fieldId :
					 * 'custbody_cntm_release_serial_ids', value:false }); }
					 * }catch(e){ log.error('error',e.message);
					 * console.log(e.message); }
					 */
				}

				return true;
			}
			function test(test1, serNames) {
				debugger;
				console.log(test1);
				test1.replace(/ /g, "_");
				var tempData = JSON.parse(test1);
				var serNameswoc = JSON.parse(serNames);

				// if(tempData)
				// copyToClipboard(tempData.toString());

				var objRecord = currentRecord.get();
				objRecord.setValue({
					fieldId : 'custbody_cntm_inv_map',
					value : tempData.toString()
				});
				objRecord.setValue({
					fieldId : 'custbody_cntm_map_serialid_woc',
					value : serNameswoc.toString()
				});
				document.getElementById('custbody_cntm_inv_map').select()
				document.execCommand("copy");

			}
			function setReleasedIds(arr) {
				var objRecord = currentRecord.get();
				/*
				 * objRecord.setValue({ fieldId :
				 * 'custbody_cntm_released_id_map', value : arr });
				 */
				objRecord.setValue({
					fieldId : 'custbody_cntm_release_serial_ids',
					value : false
				});
			}
			function copyToClipboard(text) {
				var dummyCNTM = document.createElement("textarea");

				document.body.appendChild(dummyCNTM);

				dummyCNTM.value = text;
				dummyCNTM.select();
				document.execCommand("copy");
				document.body.removeChild(dummyCNTM);
			}
			function setSubrecord(map) {
				var woSubrecord1 = window.opener
						.nlapiCreateSubrecord('inventorydetail');
				if (woSubrecord1) {
					alert(woSubrecord1);
					var linecount = woSubrecord1
							.getLineItemCount('inventoryassignment');
					alert(linecount);
					for (var i = linecount; i >= 1; --i) {
						woSubrecord1.removeLineItem('inventoryassignment', i);
					}
					var line = 0
					for ( var key in map) {
						// alert(key);
						try {
							line++;
							alert(line);
							// woSubrecord1.selectNewLineItem('inventoryassignment');
							// nlapiLogExecution('DEBUG', '4', '4');
							woSubrecord1.setLineItemValue(
									'inventoryassignment',
									'receiptinventorynumber', line,
									map[key].lot);
							/*
							 * woSubrecord1.setCurrentLineItemValue('inventoryassignment',
							 * 'quantity', parseFloat(maparray[2]));
							 * woSubrecord1.setCurrentLineItemValue('inventoryassignment',
							 * 'binnumber', maparray[0]);
							 * woSubrecord1.setCurrentLineItemValue('inventoryassignment',
							 * 'expirationdate', maparray[10]);
							 * 
							 * woSubrecord1.setCurrentLineItemValue('inventoryassignment',
							 * 'inventorystatus', maparray[1]);
							 * 
							 * nlapiLogExecution('DEBUG', '5', '5');
							 */
							// woSubrecord1.commitLineItem('inventoryassignment');
							alert('linecommited');
						} catch (e) {
							alert(e.message);
							nlapiLogExecution('ERROR', 'e.message', e.message);
						}
					}
					alert('commiting...');
					woSubrecord1.commit();
					alert('commited');
				}

			}
			return {
				pageInit : pageInit,
				fieldChanged : fieldChanged,
				/*
				 * postSourcing : postSourcing, sublistChanged : sublistChanged,
				 * lineInit : lineInit, validateField : validateField,
				 * validateLine : validateLine, validateInsert : validateInsert,
				 * validateDelete : validateDelete,
				 * 
				 */
				saveRecord : saveRecord,
				test : test,
				setReleasedIds : setReleasedIds,
				mangaeview : mangaeview,
				copyToClipboard : copyToClipboard,
				setSubrecord : setSubrecord,

			};

		});
