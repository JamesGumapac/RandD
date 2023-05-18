/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([ 'N/record', 'N/search', 'N/runtime', 'N/https', 'N/currentRecord',
		'N/url' ],
/**
 * @param {record}
 *            record
 * @param {search}
 *            search
 */
function(record, search, runtime, https, currentRecord, url) {

	/**
	 * Function to be executed after page is initialized.
	 * 
	 * @param {Object}
	 *            scriptContext
	 * @param {Record}
	 *            scriptContext.currentRecord - Current form record
	 * @param {string}
	 *            scriptContext.mode - The mode in which the record is being
	 *            accessed (create, copy, or edit)
	 * 
	 * @since 2015.2
	 */
	function pageInit(scriptContext) {

		var rec = scriptContext.currentRecord;
		if (rec.type == 'estimate') {
			log.debug('param pageinit ', scriptContext);
			/*
			 * var params = scriptContext.request.parameters; if
			 * (scriptContext.mode == 'create') { if (params.cust)
			 * rec.setValue({ fieldId : 'entity', value : prams.cust }); if
			 * (params.job) rec.setValue({ fieldId : 'entity', value : prams.job
			 * }); }
			 */
			if (scriptContext.mode == 'create') {
				var cust = rec.getValue({
					fieldId : 'entity'
				});
				var job = rec.getValue({
					fieldId : 'job'
				});
              //var endCust=rec.getValue({fieldId:'custbody_rda_transbody_end_customer'});
				var toolNum=rec.getValue({fieldId:'custbody_cntm_tool_number'});
              var custPart=rec.getValue({fieldId:'custbody_cntm_cust_part_no'});
              var revision=rec.getValue({fieldId:'custbody_cntm_cust_rev'});
              var deviceNo=rec.getValue({fieldId:'custbody_cntm_cust_device_no'});
				/*var item=rec.getSublistValue({
					sublistId:'item',
					fieldId : 'item',
					line:0
				});*/
				rec.setValue({
					fieldId : 'entity',
					value : cust
				});
				rec.setValue({
					fieldId : 'job',
					value : job
				});
                 //rec.setValue({fieldId:'custbody_rda_transbody_end_customer',value:endCust});
              rec.setValue({fieldId:'custbody_cntm_tool_number',value:toolNum});
              rec.setValue({fieldId:'custbody_cntm_cust_part_no',value:custPart});
              rec.setValue({fieldId:'custbody_cntm_cust_rev',value:revision});
              rec.setValue({fieldId:'custbody_cntm_cust_device_no',value:deviceNo});
				if(cust){
				rec
				.selectNewLine({
					sublistId : 'item'
				});
				/*if(runtime.getCurrentUser().id==816){
              alert(rec.getValue({fieldId:'custbody_cntm_tool_number'}));
            }*/
                 rec.setCurrentSublistValue({sublistId:'item',fieldId:'item',value:runtime.getCurrentScript().getParameter({name: 'custscript_cntm_dummy_item_for_quotes'})});
				//rec.setCurrentSublistValue({sublistId:'item',fieldId:'amount',value:5.0});
				rec.commitLine({
					sublistId : 'item'
				});
                
              /*rec
				.selectNewLine({
					sublistId : 'item'
				});*/
				}
			//log.debug('tool',rec.getValue({fieldId:'custbody_cntm_tool_number'}));
			/*if(runtime.getCurrentUser().id==816){
              alert('final '+rec.getValue({fieldId:'custbody_cntm_tool_number'}));
            }*/
			}
          if(scriptContext.mode == 'edit'){
				var status=rec.getValue({
					fieldId : 'custbody_cntm_import_status'
				});
				rec.setValue({
					fieldId : 'custbody_cntm_import_status',
					value : status
				});
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
	 *            scriptContext.lineNum - Line number. Will be undefined if not
	 *            a sublist or matrix field
	 * @param {number}
	 *            scriptContext.columnNum - Line number. Will be undefined if
	 *            not a matrix field
	 * 
	 * @since 2015.2
	 */
	function fieldChanged(scriptContext) {
		/*
		 * var curRec = scriptContext.currentRecord; if (scriptContext.fieldId ==
		 * 'custbody_cntm_qoteimport_file') { var status = curRec.getValue({
		 * fieldId : 'custbody_cntm_import_status' }); if (status) { confirm('') } }
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
	 * Function to be executed after sublist is inserted, removed, or edited.
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
	 *            scriptContext.lineNum - Line number. Will be undefined if not
	 *            a sublist or matrix field
	 * @param {number}
	 *            scriptContext.columnNum - Line number. Will be undefined if
	 *            not a matrix field
	 * 
	 * @returns {boolean} Return true if field is valid
	 * 
	 * @since 2015.2
	 */
	function validateField(scriptContext) {

	}

	/**
	 * Validation function to be executed when sublist line is committed.
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
		if (scriptContext.currentRecord.type == 'estimate') {
			if (!scriptContext.currentRecord.getValue({
				fieldId : 'custbody_cntm_import_status'
			})) {
				var fileId = scriptContext.currentRecord.getValue({
					fieldId : 'custbody_cntm_qoteimport_file'
				});
				if(fileId){
				var customer = scriptContext.currentRecord.getText({
					fieldId : 'entity'
				});
				var custPart = scriptContext.currentRecord.getValue({
					fieldId : 'custbody_cntm_cust_part_no'
				});
				var custRev = scriptContext.currentRecord.getValue({
					fieldId : 'custbody_cntm_cust_rev'
				});
				var custDeviceNum = scriptContext.currentRecord.getValue({
					fieldId : 'custbody_cntm_cust_device_no'
				});
				var callSuitelet = url.resolveScript({
					scriptId : 'customscript_cntm_compare_file_fields',
					deploymentId : 'customdeploy_cntm_compare_file_fields',
					params : {
						fileId : fileId,
						customer : customer,
						custPart : custPart,
						custRev : custRev,
						custDeviceNum : custDeviceNum
					},
					returnExternalUrl : true
				});
				var response = https.get({
					url : callSuitelet
				});
				log.debug('response', response.body);
				// alert(response.body);
				var obj = JSON.parse(response.body);
              if ('returnVal' in obj)
				if (obj.returnVal == false) {
					if (obj.type == 'Customer') {
						alert(obj.confirmMasg);
						return false;
					} else {

						if (confirm(obj.confirmMasg))
							scriptContext.currentRecord.setValue({
								fieldId : 'custbody_cntm_copy_from_file',
								value : true
							});
						else {
							scriptContext.currentRecord.setValue({
								fieldId : 'custbody_cntm_copy_from_file',
								value : false
							});
							// return false;
						}
						return true;
					}
				}
                }
			}
		}
		return true;
	}

  function updateToolNumber(){
    debugger;
    console.log('updateToolNumber');
		var curRec = currentRecord.get();
		var toolNum;
		var toolNumSearch = search.create({
			type : 'customrecord_cntm_job_id',
			filters:[['custrecord_cntm_initial_job','anyof',curRec.id]],
			columns : [ search.createColumn({
				name : "internalid"
			}) ]
		});
		var searchResultCount = toolNumSearch.runPaged().count;
		log.debug("subsidiarysearch result count", searchResultCount);
		if(searchResultCount>0){
          console.log('IF')
		toolNumSearch.run().each(function(result) {
			// .run().each has a limit of 4,000 results
			toolNum = result.getValue({
				name : 'internalid'
			});
			console.log('IF'+toolNum)
			return false;
		});
          var id = record.submitFields({
			type : curRec.type,
			id : curRec.id,
			values : {
				custentity_cntm_tool_number : toolNum,
			
			}
		});
		}else{
          console.log('else')
			var ssScriptTask = task.create({
				taskType : task.TaskType.SCHEDULED_SCRIPT
			});
			ssScriptTask.scriptId = 'customscript_cntm_tool_number_creation';
			ssScriptTask.deploymentId = 'customdeploy_cntm_tool_number_creation';
			ssScriptTask.params = {
				//custscript_cntm_initial_toolnum : initialToolNum,
				custscript_cntm_job_recid : curRec.id,
				custscript_cntm_job_rectype : curRec.type
			};
			var scriptTaskId = ssScriptTask.submit();
			var status = task.checkStatus(scriptTaskId).status;
			log.debug(scriptTaskId);
		}
    window.location.reload();
	}
  
	function updateQuote() {
		var curRec = currentRecord.get();
		var redirectUrl = url.resolveRecord({
			recordType : curRec.type,
			recordId : curRec.id,
			isEditMode : true,
			params : {
				'enableFile' : 'T'
			}
		});
		if (redirectUrl)
			window.open(redirectUrl, '_self');
	}

	function createQuote() {
		// alert('hi');
		var curRec = currentRecord.get();
		// alert(JSON.stringify(curRec));
		// alert(curRec.type);
		try {
			var job, customer;
			var rec;
			var redirectUrl;
			if (curRec.type == 'job') {
				job = curRec.id
				// alert(job);
				customer = curRec.getValue({
					fieldId : 'customer'
				});
				var subsidiary = curRec.getValue({
					fieldId : 'subsidiary'
				});

				redirectUrl = url.resolveRecord({
					recordType : 'estimate',
					isEditMode : true,
					params : {
						'cust' : customer,
						'job' : job
					}
				});
			} else if (curRec.type == 'estimate') {
				var quoteRec = record.load({
					id : curRec.id,
					type : curRec.type,
					isDynamic : true
				});
				/*var qtFieldLookUp = search.lookupFields({
					type : curRec.type,
					id : curRec.id,
					columns : [ 'job', 'entity' ]
				});*/
				job =quoteRec.getValue({
					fieldId : 'job'
				});
				
				customer =quoteRec.getValue({
					fieldId : 'entity'
				});
            //   alert(job+'-'+customer);
				var subsidiary = curRec.getValue({
					fieldId : 'subsidiary'
				});

				redirectUrl = url.resolveRecord({
					recordType : 'estimate',
					isEditMode : true,
					params : {
						'cust' : customer,
						'job' : job
					}
				});

				/*
				 * rec = record.copy({ type : curRec.type, id : curRec.id,
				 * isDynamic : true, }); rec.setValue({ fieldId :
				 * 'custbody_cntm_qoteimport_file', value : '' });
				 * rec.setValue({ fieldId : 'custbody_cntm_import_status', value : ''
				 * }); // alert(JSON.stringify(rec.url)); var recId = rec.save({
				 * enableSourcing : true, ignoreMandatoryFields : true });
				 * redirectUrl = url.resolveRecord({ recordType : 'estimate',
				 * recordId : recId, isEditMode : true });
				 */
			} else if (curRec.type == 'supportcase') {
				customer = curRec.getValue({
					fieldId : 'company'
				});
				redirectUrl = url.resolveRecord({
					recordType : 'estimate',
					isEditMode : true,
					params : {
						'cust' : customer
					/* , 'job' : job */}

				});
			}

			// alert(recId);
			/*
			 * log.debug("rec", JSON.stringify(rec)); var sessionObj =
			 * runtime.getCurrentSession(); sessionObj.set({ name : "myKey",
			 * value : "myValue" }); log.debug("Session object myKey value: " +
			 * sessionObj.get({ name : "myKey" }));
			 */
			/*
			 * var url =
			 * 'https://5361187-sb1.app.netsuite.com/app/accounting/transactions/estimate.nl?id=' +
			 * recId + '&e=T&whence=';
			 */
			// 'https://5361187-sb1.app.netsuite.com/app/accounting/transactions/estimate.nl?whence=&job='+job+'&cust='+customer+'&sub='+subsidiary;
			/*
			 * redirect.redirect({ url:url })
			 */
			/*
			 * https.get({ url : url });
			 */

			if (redirectUrl)
				window.open(redirectUrl);
			// window.open(url, '_self');
		} catch (e) {
			alert(e);
		}
	}
	function getParameterFromURL(param) {
		var query = window.location.search.substring(1);
		var vars = query.split("&");
		for (var i = 0; i < vars.length; i++) {
			var pair = vars[i].split("=");
			// alert(pair);
			if (pair[0] == param) {
				return decodeURIComponent(pair[1]);
			}
		}
		return (false);
	}
	return {
		pageInit : pageInit,
		createQuote : createQuote,
		updateQuote : updateQuote,
      updateToolNumber:updateToolNumber,
		saveRecord : saveRecord
	/*
	 * , fieldChanged: fieldChanged, postSourcing: postSourcing, sublistChanged:
	 * sublistChanged, lineInit: lineInit, validateField: validateField,
	 * validateLine: validateLine, validateInsert: validateInsert,
	 * validateDelete: validateDelete,
	 */
	};

});
