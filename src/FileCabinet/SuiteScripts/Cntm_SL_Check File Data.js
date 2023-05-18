/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(
		[ 'N/file', 'N/record', 'N/runtime', 'N/search' ],
		/**
		 * @param {file}
		 *            file
		 * @param {record}
		 *            record
		 * @param {runtime}
		 *            runtime
		 * @param {search}
		 *            search
		 */
		function(file, record, runtime, search) {

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
					var fileId = context.request.parameters.fileId;
                  if(fileId){
					var fileObj = file.load({
						id : fileId
					});
					var confirmMasg = '';
					var type='';
					var matchedValue = [];
					var lineNum = 0;
					var returnVal = true;
					var iterator = fileObj.lines.iterator();
					iterator
							.each(function(line) {
								if (lineNum < 4) {
									var lineVal = line.value.split('=');
									switch (lineVal[0]) {
									case 'Customer':
										/*var customer = context.request.parameters.customer;
										if (customer != lineVal[1]) {
											confirmMasg = "Customer doesen't matche with the File value. Do you want to continue?";
											returnVal = false;
											type='Customer';
											
										}*/
										break;
									case 'PartNum':
										var custPart = context.request.parameters.custPart;
                                        log.debug(custPart+','+ lineVal[1],custPart != lineVal[1]);
										if (custPart != lineVal[1]) {
											matchedValue
													.push('Customer Part Number');
										}
										break;
									case 'Revision':
										var custRev = context.request.parameters.custRev;
                                        log.debug(custRev+','+ lineVal[1],custRev != lineVal[1]);
										if (custRev != lineVal[1]) {
											matchedValue
													.push('Customer Revision');
										}
										break;
									case 'DeviceName':
										var custDeviceNum = context.request.parameters.custDeviceNum;
                                        log.debug(custDeviceNum +','+ lineVal[1],custDeviceNum != lineVal[1]);
										if (custDeviceNum != lineVal[1]) {
											matchedValue
													.push('Customer Device Number');
										}
										break;
									/*
									 * default: return false;
									 */
									}
									lineNum++;
                                  return returnVal;
								} else
									return false;
							});
                    log.debug(returnVal,matchedValue);
					if (returnVal){
						if (matchedValue.length > 0) {
							confirmMasg = "Field values for "+matchedValue+" dosen't match. Press OK to copy values from file and Cancel to copy values from Record.";
							returnVal = false;
							type='Cust Fields';
						}
					}else{
						confirmMasg = "File Contains different value for Customer. Please provide correct file to import.";
						type='Customer';
					}
					// return returnVal;
					var obj = {};
					obj.returnVal = returnVal;
					obj.confirmMasg = confirmMasg;
					obj.type=type;
					//log.debug('obj',JSON.stringify(obj));
					//context.response.write(JSON.stringify(obj));
                  }else{
                    var obj = {};
                    obj.empty=true;
                  }
				} catch (e) {
					log.error('error', e.message);
                   var obj = {};
                    obj.error=e.message;
				}
              log.debug('obj',JSON.stringify(obj));
					context.response.write(JSON.stringify(obj));
			}

			return {
				onRequest : onRequest
			};

		});
