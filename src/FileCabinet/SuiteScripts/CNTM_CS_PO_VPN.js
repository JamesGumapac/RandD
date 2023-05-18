/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(
		[ 'N/currentRecord', 'N/url', 'N/search', 'N/runtime', 'N/record',
				'N/https', 'N/ui/message', 'N/ui/dialog' ],

		function(currentRecord, url, search, runtime, record, https, message,
				dialog) {

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
			function pageInit(scriptContext) {
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
				var vpnForm=scriptContext.currentRecord.getValue({
					fieldId : 'customform'
				});
				if(vpnForm==217)
					{
				if (scriptContext.fieldId == 'custcol_cnt_vendor_pn') {
					//debugger;
					var vendorPN = scriptContext.currentRecord
							.getCurrentSublistText({
								sublistId : 'item',
								fieldId : 'custcol_cnt_vendor_pn'
							});
					if (vendorPN != '' && vendorPN != undefined) {
						var customrecord_cnt_vendor_pnsSearchObj = search
								.create({
									type : "customrecord_cnt_vendor_pns",
									filters : [ [ "name",
											"is", vendorPN.trim() ] ],
									columns : [ search.createColumn({
										name : "custrecord_cnt_pk_price",
										label : "Package Price"
									}), search.createColumn({
										name : "custrecord_cnt_pack_qty",
										label : "Package Qty"
									}) ]
								});
						var searchResultCount = customrecord_cnt_vendor_pnsSearchObj
								.runPaged().count;
						log
								.debug(
										"customrecord_cnt_vendor_pnsSearchObj result count",
										searchResultCount);
						var packagePrice = '';
						var packageQty = '';
						customrecord_cnt_vendor_pnsSearchObj
								.run()
								.each(
										function(result) {
											// .run().each has a limit of 4,000
											// results
										//	debugger;
											packagePrice = result
													.getValue(search
															.createColumn({
																name : "custrecord_cnt_pk_price",
																label : "Package Price"
															}));
											packageQty = result
													.getValue(search
															.createColumn({
																name : "custrecord_cnt_pack_qty",
																label : "Package Qty"
															}));
											return true;
										});
						// quantity
						console.log(packagePrice, packageQty)
					//	debugger;

						scriptContext.currentRecord.setCurrentSublistValue({
							sublistId : 'item',
							fieldId : 'units',
							value : packageQty,
							ignoreFieldChange : true
						});
						scriptContext.currentRecord.setCurrentSublistValue({
							sublistId : 'item',
							fieldId : 'rate',
							value : packagePrice,
							ignoreFieldChange : false,
							forceSyncSourcing : true
						});
					}
					// else
					// {
					// scriptContext.currentRecord.setCurrentSublistValue({
					// sublistId: 'item',
					// fieldId: 'units',
					// value: '',
					// ignoreFieldChange:true
					// });
					// scriptContext.currentRecord.setCurrentSublistValue({
					// sublistId: 'item',
					// fieldId: 'rate',
					// value: '',
					// ignoreFieldChange:true
					// });
					//    			
					// }
				}
				if (scriptContext.fieldId == 'custpage_package_qty') {
					// alert('-');
					var pkgQty = scriptContext.currentRecord.getValue({
						fieldId : 'custpage_package_qty'
					});
					// alert(pkgQty);
					scriptContext.currentRecord.setValue({
						fieldId : 'custrecord_cnt_pack_qty',
						value : pkgQty,
						ignoreFieldChange: false,
						fireSlavingSync: true
					});
				}
				if (scriptContext.fieldId == 'custrecord_cnt_unit') {

					var fld = scriptContext.currentRecord.getField({
						fieldId : 'custpage_package_qty'
					});
					var unitType = scriptContext.currentRecord.getValue({
						fieldId : 'custrecord_cnt_unit'
					});
					if (unitType) {
						var unitTypesRec = record.load({
							type : 'unitstype',
							id : unitType
						})
						var lines = unitTypesRec.getLineCount({
							sublistId : 'uom'
						});
						
						for (var line = 0; line < lines; line++) {
							fld.insertSelectOption({
								value : unitTypesRec.getSublistValue({
									sublistId : 'uom',
									fieldId : 'internalid',
									line : line
								}),
								text : unitTypesRec.getSublistValue({
									sublistId : 'uom',
									fieldId : 'unitname',
									line : line
								})
							});
						}
					}

				}
				if (scriptContext.fieldId == 'custrecord_cnt_pack_qty') {
					var unitType = scriptContext.currentRecord.getValue({
						fieldId : 'custrecord_cnt_unit'
					});
					var pkgQty = scriptContext.currentRecord.getValue({
						fieldId : 'custrecord_cnt_pack_qty'
					});
					if (unitType) {
						var unitTypesRec = record.load({
							type : 'unitstype',
							id : unitType
						})
						var lines = unitTypesRec.getLineCount({
							sublistId : 'uom'
						});

						for (var line = 0; line < lines; line++) {

							var uid=unitTypesRec.getSublistValue({
								sublistId : 'uom',
								fieldId : 'internalid',
								line : line
							})
							if(uid==pkgQty)
							{
								var conRate=unitTypesRec.getSublistValue({
									sublistId : 'uom',
									fieldId : 'conversionrate',
									line : line
								});
								
								scriptContext.currentRecord.setValue({
									fieldId : 'custrecord_cnt_unit_conversion',
									value : conRate,
									ignoreFieldChange: false,
									fireSlavingSync: true
								});
							}
						}
					}

				}
			}
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
				var vpnForm=scriptContext.currentRecord.getValue({
					fieldId : 'customform'
				});
				if(vpnForm==217){
				if (scriptContext.fieldId == 'item') {
				//	debugger;
					var item = scriptContext.currentRecord
							.getCurrentSublistValue({
								sublistId : 'item',
								fieldId : 'item'
							});
					if (item) {
						var customrecord_cnt_vendor_pnsSearchObj = search
								.create({
									type : "customrecord_cnt_vendor_pns",
									filters : [ [ "custrecord_cnt_item",
											"anyof", item ] ],
									columns : [  search.createColumn({name: "name", label: "Name"}) ]
								});
						var searchResultCount = customrecord_cnt_vendor_pnsSearchObj
								.runPaged().count;
					
				// quantity
						if (searchResultCount == 0) {
							dialog
									.alert({
										title : 'Vendor Alert',
										message : 'No Vendor PNs record exist for this Item and Vendor. Units selected do not obey any specific Vendor Package Qty., standard Multiple UOMs functionality configured in the account will be used.'
									});
						}

					}
				}
				}
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
				var vpnForm=scriptContext.currentRecord.getValue({
					fieldId : 'customform'
				});
				if(vpnForm==217)
					{
				if (scriptContext.sublistId == 'item'
						&& scriptContext.fieldId == 'units') {
					var vpn = scriptContext.currentRecord
							.getCurrentSublistValue({
								sublistId : 'item',
								fieldId : 'custcol_cnt_vendor_pn'
							});
					if (vpn) {
						alert('You cannot change Unit.');
						return false;
					}
				}
				
					}
				return true;
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

			}

			return {
				// pageInit: pageInit,
				fieldChanged : fieldChanged,
				postSourcing : postSourcing,
				// sublistChanged: sublistChanged,
				// lineInit: lineInit,
				validateField : validateField,
			// validateLine: validateLine,
			// validateInsert: validateInsert,
			// validateDelete: validateDelete,
			// saveRecord: saveRecord
			};

		});
