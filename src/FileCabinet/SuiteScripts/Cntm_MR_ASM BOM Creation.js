/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
var apnNotInNS = [];
var vpnNotInNS = [];
define(["N/file", "N/record", "N/runtime", "N/search", "N/format"], /**
 * @param {file}
 *            file
 * @param {record}
 *            record
 * @param {runtime}
 *            runtime
 * @param {search}
 *            search
 */
function (file, record, runtime, search, format) {
  record.Type.itemACCOUNT;

  /**
   * Marks the beginning of the Map/Reduce process and generates input
   * data.
   *
   * @typedef {Object} ObjectRef
   * @property {number} id - Internal ID of the record instance
   * @property {string} type - Record type id
   *
   * @return {Array|Object|Search|RecordRef} inputSummary
   * @since 2015.1
   */
  function getInputData() {
    try {
      log.audit("---GET INPUT DATA---");
      //	var errorarr=[];
      var recId = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_curr_rec_id",
      });
      var recType = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_curr_rec_type",
      });
      var bomrevinfo = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_bomrev_info",
      });
      //log.audit("bomrevinfo :", bomrevinfo);
      /*	var id = runtime.getCurrentScript().getParameter({
					 name : 'custscript_cntm_fileid'
				 });*/
      var status = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_asm_wo_status",
      });
      var item = runtime.getCurrentScript().getParameter({
        name: "custrecord_cntm_asm_item",
      });
      var folderId = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_asm_err_folder_id",
      });
      var bomrevArr = [];
      var flagRes = true;
      var parsed_json = JSON.parse(bomrevinfo);
      log.debug("parsed_json :", parsed_json);
      for (var i = 0; i < parsed_json.length; i++) {
        var bomRevMap = {};
        var bominfo = parsed_json[i];
        log.audit("bominfo :" + bominfo);
        var id = bominfo["file"];
        var bom = bominfo["bom"];
        var index = bominfo["index"];
        var reimport = bominfo["reimport"];
        var bomrev = bominfo["bomrev"];
        log.audit(
          "id :" + id,
          "bom :" + bom + "bomrev :" + bomrev + "index :" + index
        );
        var fileObj = file.load({
          id: id,
        });
        if (fileObj.fileType != "CSV") {
          var asmRec = record.load({
            type: recType,
            id: recId,
            isDynamic: true,
          });

          asmRec.selectLine({
            sublistId: "recmachcustrecord_cntm_asmwoqty",
            line: index,
          });

          asmRec.setCurrentSublistValue({
            sublistId: "recmachcustrecord_cntm_asmwoqty",
            fieldId: "custrecord_cntm_err_asm_child",

            value: "Invalid File Type. File Must be of CSV type.",
          });
          asmRec.setCurrentSublistValue({
            sublistId: "recmachcustrecord_cntm_asmwoqty",
            fieldId: "custrecord_cntm_status_asm_child",

            value: 10,
          });
          asmRec.commitLine({ sublistId: "recmachcustrecord_cntm_asmwoqty" });
          asmRec.save();
        } else {
          var asmRec = record.load({
            type: recType,
            id: recId,
            isDynamic: true,
          });
          var header;
          var headerArr = [];
          var lineValues = [];
          var mpnNotInNS = [];
          var iterator = fileObj.lines.iterator();
          iterator.each(function (line) {
            // log.debug('line1', JSON.stringify(line));
            header = line.value.split(",");
            // for (var k = 0; k < header.length; k++) {
            // 	headerArr.push(header[k]);
            // }
            return false;
          });
          bomRevMap.header = header; //headerArr;
          bomRevMap.bom = bom;
          //	if (status != 11) {

          var bomrevision_obj = record.create({
            type: "bomrevision",
            isDynamic: true,
          });

          bomrevision_obj.setValue({
            fieldId: "billofmaterials",
            value: bom,
          });
          bomrevision_obj.setValue({
            fieldId: "effectivestartdate",
            value: new Date(),
          });
          bomrevision_obj.setValue({
            fieldId: "custrecord_cntm_rev_import_file",
            value: id,
          });
          //	}

          //************************************************************************************************

          //Vishal Added code 05-09-2022 - for spaces in csv
          var rowwsArray = fileObj.getContents().split("\r");
          for (var j = 1; j < rowwsArray.length - 1; j++) {
            try {
              log.audit("flag in iterator :" + flagRes);
              if (flagRes) {
                var line = CSVToArray(rowwsArray[j].toString(), ",");
                lineValues.push(line);

                var obj = {};
                obj.line = line;

                if (status != 11) {
                  var itemName = line[0]; // escapeCSV(line[0]);
                  log.audit("line[0]", itemName);
                  if (itemName) {
                    var itemSearch = search.create({
                      type: "item",
                      filters: [["name", "is", itemName.trim()]],
                      columns: [
                        search.createColumn({
                          name: "internalid",
                        }),
                      ],
                    });
                    var itemCount = itemSearch.runPaged().count;
                    log.debug("itemCount :", itemCount);
                    if (itemCount == 0) {
                      log.debug("IF");
                      mpnNotInNS.push(itemName);
                    } else {
                      log.debug("ELSE");

                      itemSearch.run().each(function (result) {
                        // .run().each has a limit of 4,000 results
                        id = result.getValue({
                          name: "internalid",
                        });
                        return false;
                      });

                      log.debug("SELECT LINE");
                      bomrevision_obj.selectNewLine({
                        sublistId: "component",
                      });
                      bomrevision_obj.setCurrentSublistValue({
                        sublistId: "component",
                        fieldId: "item",
                        value: id,
                      });

                      bomrevision_obj.setCurrentSublistValue({
                        sublistId: "component",
                        fieldId: "bomquantity",
                        value: line[3],
                      });
                      bomrevision_obj.setCurrentSublistValue({
                        sublistId: "component",
                        fieldId: "custrecord_cntm_mfg_id",
                        value: line[2],
                      });
                      bomrevision_obj.setCurrentSublistValue({
                        sublistId: "component",
                        fieldId: "custrecord_cntm_spec_part",
                        value: line[9],
                      });
                      //if(line[12]=='Y')
                      bomrevision_obj.setCurrentSublistValue({
                        sublistId: "component",
                        fieldId: "custrecord_cntm_bag_n_tag_rev",
                        value: line[12] == "Y" ? "Y" : "N",
                      });
                      //if(line[35]=='Y')
                      bomrevision_obj.setCurrentSublistValue({
                        sublistId: "component",
                        fieldId: "custrecord_cntm_stacked_rev",
                        value: line[35] == "Y" ? "Y" : "N",
                      });
                      bomrevision_obj.setCurrentSublistValue({
                        sublistId: "component",
                        fieldId: "custrecord_cntm_customer_supplied",
                        value: line[36] == "Y" ? "Y" : "N",
                      });
                      bomrevision_obj.commitLine({
                        sublistId: "component",
                      });
                      log.debug("COMMIT LINE");
                    }
                  }
                }
              }
            } catch (e) {
              log.error("error in iteration,", e.message);

              var customError = e.message;

              try {
                var strCheck =
                  "You have entered an Invalid Field Value " +
                  id +
                  " for the following field: item";
                if (customError === strCheck) {
                  var recTypeLookup = search.lookupFields({
                    type: "item",
                    id: id,
                    columns: ["recordtype"],
                  });
                  var type = recTypeLookup.recordtype;
                  var inventoryItemLookup = search.lookupFields({
                    type: type,
                    id: id,
                    columns: ["itemid"],
                  });
                  var itemName = inventoryItemLookup.itemid;
                  customError =
                    itemName +
                    " Inventory item is not shared with any sub-subsidiaries";
                  log.error(
                    "Iteration Compare Error",
                    customError +
                      " - Item NAME : " +
                      itemName +
                      " - TYPE " +
                      type
                  );
                }
              } catch (error) {
                log.error("Iteration Compare Error", error.message);
              }
              flagRes = false;
              asmRec.selectLine({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                line: index,
              });
              asmRec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_status_asm_child",

                value: 10,
              });
              asmRec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_err_asm_child",

                value: customError,
              });
              asmRec.commitLine({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
              });
              asmRec.save();

              var bomrevMap = {};
              lineValues = [];
              lineValues.push({
                error: e.message,
              });
              record.submitFields({
                type: recType,
                id: recId,
                values: {
                  custrecord_cntm_status_asmwocreation: 10,
                  custrecord_cntm_error_amswocreation: e.message,
                },
              });
              bomrevMap["lineValues"] = lineValues;
              bomrevArr.push(bomrevMap);
              return bomrevArr;
            }
          }
          /******CODE END */

          //ORIGINAL CODE
          //  iterator.each(function (line) {
          // 	 var id;
          // 	 try {
          // 		 log.audit("flag in iterator :" + flagRes)
          // 		 if (flagRes) {
          //             // log.debug('line.value :',line.value);
          // 			//  var line = CSVToArray(line.value, ',');
          // 			//  log.debug('line', line);
          // 			 var obj = {};
          // 			 obj.line = line;

          // 			//  lineValues.push(line);
          // 			 //try{

          // 			 if (status != 11) {
          // 				 var itemName = line[0];// escapeCSV(line[0]);
          // 				 log.audit('line[0]', itemName);
          // 				 if (itemName) {

          // 					 var itemSearch = search.create({
          // 						 type: 'item',
          // 						 filters: [["name", "is", itemName.trim()]],
          // 						 columns: [search.createColumn({
          // 							 name: "internalid"
          // 						 })]
          // 					 });
          // 					 var itemCount = itemSearch.runPaged().count;
          // 					 log.debug("itemCount :" , itemCount);
          // 					 if (itemCount == 0) {
          //                         log.debug('IF')
          // 						 mpnNotInNS.push(itemName);
          // 					 } else {
          //                         log.debug('ELSE')

          // 						 itemSearch.run().each(function (result) {
          // 							 // .run().each has a limit of 4,000 results
          // 							 id = result.getValue({
          // 								 name: 'internalid'
          // 							 });
          // 							 return false;
          // 						 });

          //                          log.debug('SELECT LINE')
          // 						 bomrevision_obj.selectNewLine({
          // 							 sublistId: "component"
          // 						 });
          // 						 bomrevision_obj.setCurrentSublistValue({
          // 							 sublistId: "component",
          // 							 fieldId: "item",
          // 							 value: id
          // 						 });

          // 						 bomrevision_obj.setCurrentSublistValue({
          // 							 sublistId: "component",
          // 							 fieldId: "bomquantity",
          // 							 value: line[3]
          // 						 });
          // 						 bomrevision_obj.setCurrentSublistValue({
          // 							 sublistId: "component",
          // 							 fieldId: "custrecord_cntm_mfg_id",
          // 							 value: line[2]
          // 						 });
          // 						 bomrevision_obj.setCurrentSublistValue({
          // 							 sublistId: "component",
          // 							 fieldId: "custrecord_cntm_spec_part",
          // 							 value: line[9]
          // 						 });
          // 						 //if(line[12]=='Y')
          // 						 bomrevision_obj.setCurrentSublistValue({
          // 							 sublistId: "component",
          // 							 fieldId: "custrecord_cntm_bag_n_tag_rev",
          // 							 value: line[12] == 'Y' ? 'Y' : 'N'
          // 						 });
          // 						 //if(line[35]=='Y')
          // 						 bomrevision_obj.setCurrentSublistValue({
          // 							 sublistId: "component",
          // 							 fieldId: "custrecord_cntm_stacked_rev",
          // 							 value: line[35] == 'Y' ? 'Y' : 'N'
          // 						 });
          // 						 bomrevision_obj.setCurrentSublistValue({
          // 							 sublistId: "component",
          // 							 fieldId: "custrecord_cntm_customer_supplied",
          // 							 value: line[36] == 'Y' ? 'Y' : 'N'
          // 						 });
          // 						 bomrevision_obj.commitLine({
          // 							 sublistId: "component"
          // 						 });
          //                          log.debug('COMMIT LINE')
          // 					 }
          // 				 }
          // 			 }
          // 			 /*}catch(e){
          // 				 var errorMap={};
          // 				 errorMap["index"]=index;
          // 				 errorMap["msg"]=e.message;
          // 				 errorarr.push(errorMap);
          // 			 }*/
          // 			 // lineValues.push(lines.join(','));
          // 			 return true;
          // 		 }
          // 	 } catch (e) {
          // 		 log.error("error in iteration,", e.message);

          // 		 var customError = e.message;

          // 		 try {
          // 			 var strCheck = "You have entered an Invalid Field Value " + id + " for the following field: item"
          // 			 if (customError === strCheck) {

          // 				 var recTypeLookup = search.lookupFields({
          // 					 type: "item",
          // 					 id: id,
          // 					 columns: ['recordtype']
          // 				 });
          // 				 var type = recTypeLookup.recordtype;
          // 				 var inventoryItemLookup = search.lookupFields({
          // 					 type: type,
          // 					 id: id,
          // 					 columns: ['itemid']
          // 				 });
          // 				 var itemName = inventoryItemLookup.itemid;
          // 				 customError = itemName + " Inventory item is not shared with any sub-subsidiaries";
          // 				 log.error("Iteration Compare Error", customError + " - Item NAME : " + itemName + " - TYPE " + type);
          // 			 }
          // 		 } catch (error) {
          // 			 log.error("Iteration Compare Error", error.message);
          // 		 }
          // 		 flagRes = false;
          // 		 asmRec.selectLine({
          // 			 sublistId: 'recmachcustrecord_cntm_asmwoqty',
          // 			 line: index
          // 		 });
          // 		 asmRec.setCurrentSublistValue({
          // 			 sublistId: 'recmachcustrecord_cntm_asmwoqty',
          // 			 fieldId: 'custrecord_cntm_status_asm_child',

          // 			 value: 10
          // 		 });
          // 		 asmRec.setCurrentSublistValue({
          // 			 sublistId: 'recmachcustrecord_cntm_asmwoqty',
          // 			 fieldId: 'custrecord_cntm_err_asm_child',

          // 			 value: customError
          // 		 });
          // 		 asmRec.commitLine({ sublistId: 'recmachcustrecord_cntm_asmwoqty' });
          // 		 asmRec.save();

          // 		 var bomrevMap = {};
          // 		 lineValues = [];
          // 		 lineValues.push({
          // 			 'error': e.message
          // 		 });
          // 		 record.submitFields({
          // 			 type: recType,
          // 			 id: recId,
          // 			 values: {
          // 				 custrecord_cntm_status_asmwocreation: 10,
          // 				 custrecord_cntm_error_amswocreation: e.message
          // 			 }
          // 		 });
          // 		 bomrevMap["lineValues"] = lineValues;
          // 		 bomrevArr.push(bomrevMap);
          // 		 return bomrevArr;

          // 	 }
          //  });
          //  log.audit('ITERRATOR END')

          //****************************************************************************************************
          if (flagRes) {
            if (mpnNotInNS.length > 0) {
              lineValues = [];

              log.audit("in status 11 :" + JSON.stringify(mpnNotInNS));
              /*	lineValues
									 .push({
										 'error' : 'Item(s) provided in import file are missing in NetSuite. Please create them and try again.'
									 });*/
              //bomRevMap.lineValues=lineValues;
              var error =
                "Item(s) provided in import file are missing in NetSuite. Please create them and try again.\n Items :" +
                mpnNotInNS;
              var asmRec = record.load({
                type: recType,
                id: recId,
                isDynamic: true,
              });
              var bomLookup = search.lookupFields({
                type: "bom",
                id: bom,
                columns: ["name"],
              });
              var bomName = bomLookup.name;
              var lines = [];
              var fileContent =
                "Item and/or Vendor details for APN record are missing in Netsuite. \n Items :" +
                mpnNotInNS;
              //error_map["itemNS"]=apnNotInNS;

              var fileObj = file.create({
                name: bomName + "_" + index + ".txt",
                fileType: file.Type.PLAINTEXT,
                contents: fileContent,
                // description: 'This is a plain text file.',
                // encoding: file.Encoding.UTF8,
                // folder: 30,
                //  isOnline: true
              });
              fileObj.folder = folderId;
              var fileId = fileObj.save();
              asmRec.setValue({
                fieldId: "custrecord_cntm_error_amswocreation",
                value:
                  "Item(s) provided in import file are missing in NetSuite. Please create them and try again.",
                ignoreFieldChange: true,
                forceSyncSourcing: true,
              });
              asmRec.setValue({
                fieldId: "custrecord_cntm_item_not_in_ns",
                value: mpnNotInNS,
                ignoreFieldChange: true,
                forceSyncSourcing: true,
              });
              asmRec.selectLine({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                line: index,
              });

              /*	asmRec.setCurrentSublistValue({
										 sublistId: 'recmachcustrecord_cntm_asmwoqty',
										 fieldId: 'custrecord_cntm_err_asm_child',
	 
										 value: 'Item(s) provided in import file are missing in NetSuite. Please create them and try again.'+mpnNotInNS
									 });*/
              asmRec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_status_asm_child",

                value: 10,
              });
              asmRec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_asm_err_file",

                value: fileId,
              });
              asmRec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_err_asm_child",

                value: "",
              });
              asmRec.commitLine({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
              });
              asmRec.save();
              bomRevMap.mpnNotInNS = mpnNotInNS;
              bomRevMap.lineValues;
              bomrevArr.push(bomRevMap);
              //	return lineValues;
            } else {
              var asmRec = record.load({
                type: recType,
                id: recId,
                isDynamic: true,
              });

              asmRec.selectLine({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                line: index,
              });

              var wo = asmRec.getCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_wonumb_asm_wocrtn",
              });

              asmRec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_asm_err_file",
                value: "",
              });

              if (bomrev) {
                //checkAndUpdateOverlapingDates(new Date(),new Date(), bom);
                if (reimport == true || reimport == "T") {
                  //********removing reference of previous cust rev from apn and WO ******************************************************************************
                  /*asmRec.setCurrentSublistValue({
											 sublistId: 'recmachcustrecord_cntm_asmwoqty',
											 fieldId: 'custrecord_cntm_bom_rev_asm',
  
											 value: ''
										 });
 */
                  /*asmRec.commitLine({sublistId: 'recmachcustrecord_cntm_asmwoqty'});
										 asmRec.save();*/
                  if (wo) {
                    checkAndUpdateOverlapingDates(new Date(), new Date(), bom);
                    var namerev = "Rev";
                    var revSearch = search.create({
                      type: "bomrevision",
                      filters: [
                        ["name", "startswith", namerev],
                        "AND",
                        ["billofmaterials", "anyof", bom],
                      ],
                      columns: [
                        search.createColumn({
                          name: "internalid",
                          sort: search.Sort.DESC,
                        }),
                        search.createColumn({
                          name: "name",
                        }),
                      ],
                    });
                    var revCount = revSearch.runPaged().count;
                    log.audit("revCount", revCount);
                    var count = 0;
                    if (revCount > 0) {
                      revSearch.run().each(function (result) {
                        var rec = result;
                        var name = result.getValue("name");
                        var nameArr = name.split(" ");
                        var cnt = nameArr[1];
                        log.debug("cnt :" + cnt);
                        count = cnt;
                        return false;
                      });
                    } else {
                      count = 0;
                    }
                    log.audit("count", count);

                    // if (revCount > 0)
                    namerev = namerev + " " + (parseInt(count) + 1);
                    bomrevision_obj.setValue({
                      fieldId: "name",
                      value: namerev,
                    });

                    var revRecId = bomrevision_obj.save({
                      ignoreMandatoryFields: true,
                      enableSourcing: true,
                    });
                    bomRevMap.bomrev = revRecId;
                    asmRec.setCurrentSublistValue({
                      sublistId: "recmachcustrecord_cntm_asmwoqty",
                      fieldId: "custrecord_cntm_bom_rev_asm",
                      value: revRecId,
                    });
                    asmRec.setCurrentSublistValue({
                      sublistId: "recmachcustrecord_cntm_asmwoqty",
                      fieldId: "custrecord_cntm_status_asm_child",
                      value: 3,
                    });
                    asmRec.setCurrentSublistValue({
                      sublistId: "recmachcustrecord_cntm_asmwoqty",
                      fieldId: "custrecord_cntm_err_asm_child",
                      value: "",
                    });
                    asmRec.commitLine({
                      sublistId: "recmachcustrecord_cntm_asmwoqty",
                    });
                    asmRec.save();
                    removerReferenceWO(bomrev, wo, revRecId);
                  } else {
                    checkAndUpdateOverlapingDates(new Date(), new Date(), bom);
                    var namerev = "Rev";
                    var revNew = "Rev";
                    var revSearch = search.create({
                      type: "bomrevision",
                      filters: [
                        ["name", "startswith", namerev],
                        "AND",
                        ["billofmaterials", "anyof", bom],
                      ],
                      columns: [
                        search.createColumn({
                          name: "internalid",
                          sort: search.Sort.DESC,
                        }),
                        search.createColumn({
                          name: "name",
                        }),
                      ],
                    });
                    var revCount = revSearch.runPaged().count;
                    namerev = namerev + " " + (revCount + 1);
                    log.audit("revCount :" + revCount, "namerev :" + namerev);
                    bomrevision_obj.setValue({
                      fieldId: "name",
                      value: namerev,
                    });

                    var revRecId = bomrevision_obj.save({
                      ignoreMandatoryFields: true,
                      enableSourcing: true,
                    });
                    bomRevMap.bomrev = revRecId;
                    asmRec.setCurrentSublistValue({
                      sublistId: "recmachcustrecord_cntm_asmwoqty",
                      fieldId: "custrecord_cntm_bom_rev_asm",

                      value: revRecId,
                    });

                    asmRec.setCurrentSublistValue({
                      sublistId: "recmachcustrecord_cntm_asmwoqty",
                      fieldId: "custrecord_cntm_status_asm_child",

                      value: 3,
                    });
                    asmRec.setCurrentSublistValue({
                      sublistId: "recmachcustrecord_cntm_asmwoqty",
                      fieldId: "custrecord_cntm_err_asm_child",

                      value: "",
                    });
                    asmRec.commitLine({
                      sublistId: "recmachcustrecord_cntm_asmwoqty",
                    });
                    asmRec.save();
                    removerReferenceRev(bomrev);
                    var revSearch = search.create({
                      type: "bomrevision",
                      filters: [
                        ["name", "startswith", revNew],
                        "AND",
                        ["billofmaterials", "anyof", bom],
                      ],
                      columns: [
                        search.createColumn({
                          name: "internalid",
                          sort: search.Sort.DESC,
                        }),
                        search.createColumn({
                          name: "name",
                        }),
                      ],
                    });
                    var revCount1 = revSearch.runPaged().count;

                    revNew = revNew + " " + revCount1;
                    log.debug("revCount1 :" + revCount1, "revNew :" + revNew);
                    var id = record.submitFields({
                      type: "bomrevision",
                      id: revRecId,
                      values: {
                        name: revNew,
                      },
                      options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true,
                      },
                    });
                  }
                } else {
                  bomRevMap.bomrev = bomrev;
                }
              } else {
                checkAndUpdateOverlapingDates(new Date(), new Date(), bom);
                var namerev = "Rev";

                var revSearch = search.create({
                  type: "bomrevision",
                  filters: [
                    ["name", "startswith", namerev],
                    "AND",
                    ["billofmaterials", "anyof", bom],
                  ],
                  columns: [
                    search.createColumn({
                      name: "internalid",
                      sort: search.Sort.DESC,
                    }),
                    search.createColumn({
                      name: "name",
                    }),
                  ],
                });
                var revCount = revSearch.runPaged().count;
                namerev = namerev + " " + (revCount + 1);
                log.audit("revCount", revCount);
                bomrevision_obj.setValue({
                  fieldId: "name",
                  value: namerev,
                });

                var revRecId = bomrevision_obj.save({
                  ignoreMandatoryFields: true,
                  enableSourcing: true,
                });
                bomRevMap.bomrev = revRecId;
                asmRec.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_bom_rev_asm",

                  value: revRecId,
                });
                asmRec.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_status_asm_child",

                  value: 3,
                });
                asmRec.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_err_asm_child",

                  value: "",
                });
                asmRec.commitLine({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                });
                asmRec.save();
              }

              if (mpnNotInNS.length > 0)
                lineValues.push({
                  mpnNotInNS: mpnNotInNS,
                });
              bomRevMap.mpnNotInNS = mpnNotInNS;
              bomRevMap.lineValues = lineValues;
              bomRevMap.index = index;
              bomRevMap.reimport = reimport;

              log.debug("bomRevMap :", JSON.stringify(bomRevMap));
              bomrevArr.push(bomRevMap);
            }
          }
          //}
        }
      }
      log.debug("bomrevArr :", JSON.stringify(bomrevArr));
      return bomrevArr;
    } catch (e) {
      log.error("error_inptData", e.message);

      var bomrevMap = {};
      lineValues = [];
      lineValues.push({
        error: e.message,
      });
      record.submitFields({
        type: recType,
        id: recId,
        values: {
          custrecord_cntm_status_asmwocreation: 10,
          custrecord_cntm_error_amswocreation: e.message,
        },
      });
      bomrevMap["lineValues"] = lineValues;
      bomrevArr.push(bomrevMap);
      return bomrevArr;
    }
  }

  function checkAndUpdateOverlapingDates(endDate, startDate, bom) {
    // var date = convertDate(date);
    /*var mySearch = search.load({
				 id : 'customsearch_cntm_bom_rev_search'
			 });*/
    var filters = new Array();
    if (endDate && startDate) {
      filters.push([
        ["effectiveenddate", "on", convertDate(endDate)],
        "OR",
        ["effectivestartdate", "on", convertDate(startDate)],
      ]);
      filters.push("AND");
    } else if (endDate) {
      filters.push(["effectiveenddate", "on", convertDate(endDate)]);
      filters.push("AND");
    } else if (startDate) {
      filters.push(["effectiveenddate", "on", convertDate(startDate)]);
      filters.push("AND");
    }
    filters.push(["billofmaterials", "anyof", bom]);
    var bomrevisionSearchObj = search.create({
      type: "bomrevision",
      filters: filters,
      columns: [
        search.createColumn({
          name: "billofmaterials",
          label: "Bill of Materials",
        }),
        search.createColumn({ name: "name", label: "Name" }),
        search.createColumn({
          name: "effectiveenddate",
          label: "Effective End Date",
        }),
        search.createColumn({
          name: "effectivestartdate",
          label: "Effective Start Date",
        }),
      ],
    });

    var searchResult = bomrevisionSearchObj.runPaged().count;
    log.debug("searchResult_", searchResult);
    if (searchResult > 0) {
      bomrevisionSearchObj.run().each(function (result) {
        var revId = result.id;

        var revLookUp = search.lookupFields({
          type: "bomrevision",
          id: revId,
          columns: ["effectiveenddate", "effectivestartdate"],
        });

        if (revLookUp.effectiveenddate)
          var endDate = new Date(revLookUp.effectiveenddate);
        if (revLookUp.effectivestartdate)
          var startDate = new Date(revLookUp.effectivestartdate);
        log.audit(
          "before endDate: " + endDate,
          "before startDate: " + startDate
        );
        if (!startDate) startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);

        if (!endDate) endDate = new Date();

        endDate.setDate(endDate.getDate() - 1);
        log.audit("after endDate: " + endDate, "after startDate: " + startDate);
        checkAndUpdateOverlapingDates(endDate, startDate, bom);

        log.debug(
          format.format({
            value: endDate,
            type: format.Type.DATE,
          }),
          format.format({
            value: startDate,
            type: format.Type.DATE,
          })
        );
        var bomRevRec = record.load({
          type: "bomrevision",
          id: revId,
          isDynamic: true,
        });
        bomRevRec.setValue({
          fieldId: "effectiveenddate",
          value: endDate,
        });
        bomRevRec.setValue({
          fieldId: "effectivestartdate",
          value: startDate,
        });
        bomRevRec.save();

        return true;
      });
    }
  }

  function convertDate(date1) {
    var date = new Date();
    date = date1;
    var dd = date.getDate();
    var mm = date.getMonth() + 1;
    var yyyy = date.getFullYear();
    date = mm + "/" + dd + "/" + yyyy; // change the format
    // depending on the date
    // format preferences set on
    // your account
    // log.audit('date', dd + mm + yyyy)
    return date;
  }
  function escapeCSV(val) {
    if (!val) return "";
    if (!/[",\s]/.test(val)) return val;
    val = val.replace(/"/g, '""');
    return '"' + val + '"';
  }
  function CSVToArray(strData, strDelimiter) {
    try {
      // log.debug(' FUNCTION START')
      strDelimiter = strDelimiter || ",";
      var objPattern = new RegExp(
        "(\\" +
          strDelimiter +
          "|\\r?\\n|\\r|^)" +
          '(?:"([^"]*(?:""[^"]*)*)"|' +
          '([^"\\' +
          strDelimiter +
          "\\r\\n]*))",
        "gi"
      );
      var arrData = [];
      var arrMatches = null;
      while ((arrMatches = objPattern.exec(strData))) {
        var strMatchedDelimiter = arrMatches[1];
        if (
          strMatchedDelimiter.length &&
          strMatchedDelimiter !== strDelimiter
        ) {
          // arrData.push([]);
        }
        var strMatchedValue;
        if (arrMatches[2]) {
          strMatchedValue = arrMatches[2]
            .replace(new RegExp('""', "g"), '"')
            .trim();
        } else {
          strMatchedValue = arrMatches[3];
        }
        arrData.push(strMatchedValue);
        //  log.debug('strMatchedValue :',strMatchedValue)
      }
      //   log.debug(' FUNCTION END')
      //  log.audit('arrData :',arrData)
    } catch (e) {
      log.error("error:" + e.name, e.message);
    }
    return arrData;
  }

  function removerReferenceWO(bomrev, wo, revRecId) {
    log.debug("removerReferenceWO bomrev :" + bomrev, "wo :" + wo);
    try {
      /*	log.debug("removerReferenceRev bomrev :"+bomrev,"wo :"+wo);
					 var bomRevRec = record.load({
						 type : 'bomrevision',
						 id : bomrev,
						 isDynamic : true
					 });
				 
					 var apn=bomRevRec.getValue("custrecord_cntm_alt_part_no_rec");
					 log.debug("apn :"+apn);
					 if(apn){
					 var id = record.submitFields({
						 type: "customrecord_cntm_assmebly_item_apn",
						 id: apn,
						 values: {
							 'custrecord_cntm_bomrevision': ''
						 },
						 options: {
							 enableSourcing: false,
							 ignoreMandatoryFields : true
						 }
					 });
					 log.debug("removed bom rev from apn");
					 bomRevRec.setValue({
						 fieldId : "custrecord_cntm_alt_part_no_rec",
						 value : ''
					 });
					 bomRevRec.save();
					 
					 log.debug("removed apn from bom rev");
					 }
					 */

      if (wo) {
        var woApnSearch = search.create({
          type: "customrecord_cntm_wo_apn_ref",
          filters: ["custrecord_cntm_wo_ref", "is", wo],
          columns: [
            search.createColumn({
              name: "internalid",
            }),
            search.createColumn({
              name: "custrecord_cntm_wo_ref",
            }),
          ],
        });
        var woApnSearchCount = woApnSearch.runPaged().count;
        log.debug("woApnSearchCount : " + woApnSearchCount);
        if (woApnSearchCount > 0) {
          woApnSearch.run().each(function (result) {
            var woapnrecid = result.getValue("internalid");
            record.submitFields({
              type: "customrecord_cntm_wo_apn_ref",
              id: woapnrecid,
              values: {
                custrecord_cntm_wo_ref: "",
              },
              options: {
                enableSourcing: false,
                ignoreMandatoryFields: true,
              },
            });
            return true;
          });
        }
        var woRec = record.load({
          type: record.Type.WORK_ORDER,
          id: wo,
        });
        woRec.setValue({
          fieldId: "billofmaterialsrevision",
          value: revRecId,
        });
        woRec.setValue({
          fieldId: "custbody_cntm_wo_apn_ref",
          value: "",
        });
        woRec.save();
      }
    } catch (e) {
      log.error("error ", e.message);
    }
  }
  function removerReferenceRev(bomrev, asmRec) {
    try {
      log.debug("removerReferenceRev bomrev :" + bomrev);
      var bomRevRec = record.load({
        type: "bomrevision",
        id: bomrev,
        isDynamic: true,
      });

      var apn = bomRevRec.getValue("custrecord_cntm_alt_part_no_rec");
      log.debug("apn :" + apn);
      if (apn) {
        var id = record.submitFields({
          type: "customrecord_cntm_assmebly_item_apn",
          id: apn,
          values: {
            custrecord_cntm_bomrevision: "",
          },
          options: {
            enableSourcing: false,
            ignoreMandatoryFields: true,
          },
        });
        log.debug("removed bom rev from apn");
        bomRevRec.setValue({
          fieldId: "custrecord_cntm_alt_part_no_rec",
          value: "",
        });
        bomRevRec.save();

        log.debug("removed apn from bom rev");
      }

      record.delete({
        type: "bomrevision",
        id: bomrev,
      });
    } catch (e) {
      log.error("error in deleting bom rev", e.message);
    }
  }
  /**
   * Executes when the map entry point is triggered and applies to
   * each key/value pair.
   *
   * @param {MapSummary}
   *            context - Data collection containing the key/value
   *            pairs to process through the map stage
   * @since 2015.1
   */
  function map(context) {}

  function apnSearch(apn) {
    var apnSearch = search.create({
      type: "item",
      filters: [["name", "is", apn]],
      columns: [
        search.createColumn({
          name: "internalid",
        }),
      ],
    });
    var itemCount = apnSearch.runPaged().count;
    log.debug("apnCount", itemCount);
    if (itemCount > 0) {
      log.debug("present item", apn);
      return true;
    } else return false;
  }
  function createWoApnRec(woID, apnID) {
    log.debug("createWoApnRec :woID :" + woID, "apnID :" + apnID);
    if (woID) {
      if (apnID) {
        var customrecord_cntm_mpn_apn_infoSearchObj = search.create({
          type: "customrecord_cntm_mpn_apn_info",
          filters: [
            ["custrecord_cntm_parent_rec.internalid", "anyof", apnID],
            "AND",
            ["custrecord_cntm_apn.inventorylocation", "anyof", "4"],
          ],
          columns: [
            search.createColumn({
              name: "custrecord_cntm_mpn",
              label: "Item Name",
            }),
            search.createColumn({
              name: "custrecord_cntm_apn",
              label: "Alternative Part Number",
            }),
            search.createColumn({
              name: "custrecord_cntm_vpn",
              label: "Vendor",
            }),
            search.createColumn({
              name: "custrecord_cntm_apn_approve",
              label: "APN Approve",
            }),
            search.createColumn({
              name: "custrecord_cntm_apn_sequence",
              label: "APN Sequence",
            }),
            search.createColumn({
              name: "custrecord_cntm_apn_stacked",
              label: "Stacked",
            }),
            search.createColumn({
              name: "locationquantityonhand",
              join: "CUSTRECORD_CNTM_APN",
              label: "Location On Hand",
            }),
          ],
        });
        var searchResultCount =
          customrecord_cntm_mpn_apn_infoSearchObj.runPaged().count;
        log.debug(
          "customrecord_cntm_mpn_apn_infoSearchObj result count",
          searchResultCount
        );
        var index = 0;
        customrecord_cntm_mpn_apn_infoSearchObj.run().each(function (result) {
          var item = result.getValue({
            name: "custrecord_cntm_mpn",
            label: "Item Name",
          });
          var apn_item = result.getValue({
            name: "custrecord_cntm_apn",
            label: "Alternative Part Number",
          });
          var vendor = result.getValue({
            name: "custrecord_cntm_vpn",
            label: "Vendor",
          });
          var apn_approve = result.getValue({
            name: "custrecord_cntm_apn_approve",
            label: "APN Approve",
          });

          var apn_seq = result.getValue({
            name: "custrecord_cntm_apn_sequence",
            label: "APN Sequence",
          });
          var stacked = result.getValue({
            name: "custrecord_cntm_apn_stacked",
            label: "Stacked",
          });
          var quan = result.getValue({
            name: "locationquantityonhand",
            join: "CUSTRECORD_CNTM_APN",
            label: "Location On Hand",
          });
          var apnWORec = record.create({
            type: "customrecord_cntm_wo_apn_ref",
            // defaultValues : defaultValues,
            isDynamic: true,
          });
          apnWORec.setValue({
            fieldId: "custrecord_cntm_wo_ref",
            value: woID,
          });
          apnWORec.setValue({
            fieldId: "custrecord_cntm_wo_apn_ref_item",
            value: item,
          });
          apnWORec.setValue({
            fieldId: "custrecord_cntm_apn_item",
            value: apn_item,
          });
          apnWORec.setValue({
            fieldId: "custrecord_cntm_apn_vendor",
            value: vendor,
          });
          if (apn_approve == "N" || apn_approve == false) {
            apnWORec.setValue({
              fieldId: "custrecord_cntm_wo_apn_approve",
              value: false,
            });
          } else if (apn_approve == "Y" || apn_approve == true) {
            apnWORec.setValue({
              fieldId: "custrecord_cntm_wo_apn_approve",
              value: true,
            });
          }

          apnWORec.setValue({
            fieldId: "custrecord_cntm_wo_apn_seq",
            value: apn_seq,
          });
          if (stacked == "N" || stacked == false) {
            apnWORec.setValue({
              fieldId: "custrecord_cntm_wo_apn_stacked",
              value: false,
            });
          } else if (stacked == "Y" || stacked == true) {
            apnWORec.setValue({
              fieldId: "custrecord_cntm_wo_apn_stacked",
              value: true,
            });
          }

          apnWORec.setValue({
            fieldId: "custrecord_cntm_wo_apn_quan",
            value: quan,
          });
          apnWORec.save();
          return true;
        });
      }
    }
  }
  /**
   * Executes when the reduce entry point is triggered and applies to
   * each group.
   *
   * @param {ReduceSummary}
   *            context - Data collection containing the groups to
   *            process through the reduce stage
   * @since 2015.1
   */
  function reduce(context) {
    log.audit("---REDUCE----");

    try {
      //log.audit("context in reduce :",JSON.stringify(context));
      var lineMap = context.values;
      //	log.debug('lineMap in reduce'  , lineMap);
      //log.debug('context.key', context.key);
      var recId = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_curr_rec_id",
      });
      var recType = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_curr_rec_type",
      });
      var folderId = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_asm_err_folder_id",
      });

      if (lineMap) {
        var lines = JSON.parse(JSON.stringify(context.values));
        log.audit("lines :", lines);
        var line = JSON.parse(lines);
        var lineValues = line.lineValues;
        var mpnNotInNS = line.mpnNotInNS;
        if (lineValues.length > 0) {
          var bomrev = line.bomrev;
          var ind = line.index;
          var reimport = line.reimport;
          log.debug("bomrev :" + bomrev, "ind :" + ind);
          var bom = line.bom;
          var bomLookup = search.lookupFields({
            type: "bom",
            id: bom,
            columns: ["name"],
          });
          var bomName = bomLookup.name;
          var lines = [];
          var apnNotInNS = [];
          var vpnNotInNS = [];
          for (var i = 0; i < lineValues.length; i++) {
            var lineVal = lineValues[i];
            log.debug("lineVal :", lineVal);
            var mpn = lineVal[0];
            log.debug("mpn", mpn);
            //var mpn = line[0];
            //var apnNotInNS = [];
            // if (apnSearch(mpn) == true) {

            // /////////////////////////////////////////////////use
            // slice///////////////////////
            //	log.audit("stacked :"+line[35]);
            var stacked = lineVal[35];
            var stack = "N";
            if (stacked == "Y") {
              stack = "Y";
            } else {
              stack = "N";
            }
            var bagNtagVal = lineVal[12];
            var bagNtag = "N";
            if (bagNtagVal == "Y") {
              bagNtag = "Y";
            }
            var specPartVal = lineVal[9];
            var specPart = "N";
            if (specPartVal == "Y") {
              specPart = "Y";
            }
            var custSupplied = lineVal[36];
            if (lineVal[17]) {
              if (apnSearch(lineVal[17]) == true) {
                var map = {};
                map.mpn = lineVal[0];
                map.apn = lineVal[17];
                map.vpn = lineVal[18];
                map.approve = lineVal[19];
                map.stacked = stack;
                map.bagNtag = bagNtag;
                map.specPart = specPart;
                map.custSupplied = custSupplied;
                map.seqNo = 1;
                lines.push(map);
              } else apnNotInNS.push(lineVal[17]);
            }
            if (lineVal[20]) {
              if (apnSearch(lineVal[20]) == true) {
                var map = {};
                map.mpn = lineVal[0];
                map.apn = lineVal[20];
                map.vpn = lineVal[21];
                map.approve = lineVal[22];
                map.stacked = stack;
                map.bagNtag = bagNtag;
                map.specPart = specPart;
                map.custSupplied = custSupplied;
                map.seqNo = 2;
                lines.push(map);
              } else apnNotInNS.push(lineVal[20]);
            }
            if (lineVal[23]) {
              if (apnSearch(lineVal[23]) == true) {
                var map = {};
                map.mpn = lineVal[0];
                map.apn = lineVal[23];
                map.vpn = lineVal[24];
                map.approve = lineVal[25];
                map.stacked = stack;
                map.bagNtag = bagNtag;
                map.specPart = specPart;
                map.custSupplied = custSupplied;
                map.seqNo = 3;
                lines.push(map);
              } else apnNotInNS.push(lineVal[23]);
            }
            if (lineVal[26]) {
              if (apnSearch(lineVal[26]) == true) {
                var map = {};
                map.mpn = lineVal[0];
                map.apn = lineVal[26];
                map.vpn = lineVal[27];
                map.approve = lineVal[28];
                map.stacked = stack;
                map.bagNtag = bagNtag;
                map.specPart = specPart;
                map.custSupplied = custSupplied;
                map.seqNo = 4;
                lines.push(map);
              } else apnNotInNS.push(lineVal[26]);
            }
            if (lineVal[29]) {
              if (apnSearch(lineVal[29]) == true) {
                var map = {};
                map.mpn = lineVal[0];
                map.apn = lineVal[29];
                map.vpn = lineVal[30];
                map.approve = lineVal[31];
                map.stacked = stack;
                map.bagNtag = bagNtag;
                map.specPart = specPart;
                map.custSupplied = custSupplied;
                map.seqNo = 5;
                lines.push(map);
              } else apnNotInNS.push(lineVal[29]);
            }
            if (lineVal[32]) {
              if (apnSearch(lineVal[32]) == true) {
                var map = {};
                map.mpn = lineVal[0];
                map.apn = lineVal[32];
                map.vpn = lineVal[33];
                map.approve = lineVal[34];
                map.stacked = stack;
                map.bagNtag = bagNtag;
                map.specPart = specPart;
                map.custSupplied = custSupplied;
                map.seqNo = 6;
                lines.push(map);
              } else apnNotInNS.push(lineVal[32]);
            }
            //log.debug('lines_map', lines);
            var apnLines = {};
            apnLines.lines = lines;
            /*if (apnNotInNS.length > 0)
								 apnLines.apnNotInNS = apnNotInNS.join();*/
            /*if (lines.length > 0)
								 context.write({
									 key : mpn,
									 value : apnLines
								 });*/
          }
          log.debug("lines :" + lines, "apnNotInNS :" + apnNotInNS);
          //*********************creating APN record****************************************
          /*var bom = runtime.getCurrentScript().getParameter({
								 name : 'custscript_cntm_bom'
							 });*/
          var item = runtime.getCurrentScript().getParameter({
            name: "custscript_cntm_item",
          });
          var apnRec = record.create({
            type: "customrecord_cntm_assmebly_item_apn",
            // defaultValues : defaultValues,
            isDynamic: true,
          });
          var bomRev;
          // log.debug('apnRec');
          apnRec.setValue({
            fieldId: "custrecord_cntm_assembly_item",
            value: item,
          });
          apnRec.setValue({
            fieldId: "custrecord_cntm_bom",
            value: bom,
          });

          //	var mpnNotInNS = [];
          //var apnNotInNS = [];
          //var vpnNotInNS = [];
          var missingValuesForMPN = {};
          var error;

          if (lines.length > 0) {
            for (var index = 0; index < lines.length; index++) {
              var apnMap = lines[index];

              var mpnMap = lines[index];
              apnRec.selectNewLine({
                sublistId: "recmachcustrecord_cntm_parent_rec",
              });
              apnRec.setCurrentSublistText({
                sublistId: "recmachcustrecord_cntm_parent_rec",
                fieldId: "custrecord_cntm_mpn",
                text: apnMap.mpn,
              });
              apnRec.setCurrentSublistText({
                sublistId: "recmachcustrecord_cntm_parent_rec",
                fieldId: "custrecord_cntm_apn",
                text: apnMap.apn,
              });
              if (apnMap.vpn) {
                var vpnSearch = search.create({
                  type: "vendor",
                  filters: [["entityid", "is", apnMap.vpn]],
                  columns: [
                    search.createColumn({
                      name: "internalid",
                    }),
                  ],
                });
                var vpnCount = vpnSearch.runPaged().count;
                //log.debug('vpnCount', vpnCount);
                if (vpnCount > 0) {
                  vpnSearch.run().each(function (result) {
                    // .run().each
                    // has a
                    // limit
                    // of
                    // 4,000
                    // results
                    var vpn = result.getValue({
                      name: "internalid",
                    });
                    apnRec.setCurrentSublistValue({
                      sublistId: "recmachcustrecord_cntm_parent_rec",
                      fieldId: "custrecord_cntm_vpn",
                      value: vpn,
                    });
                    return false;
                  });
                  //log.debug('vpnCount--',
                  //	vpnCount);
                } else {
                  //										missingVpn.push(apnMap.vpn);
                  vpnNotInNS.push(apnMap.vpn);
                  /*log.debug('vpnNotInNS',
													 vpnNotInNS);*/
                }
              }
              if (apnMap.approve == "Y")
                apnRec.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_parent_rec",
                  fieldId: "custrecord_cntm_apn_approve",
                  value: true,
                });
              apnRec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_parent_rec",
                fieldId: "custrecord_cntm_apn_sequence",
                value: apnMap.seqNo,
              });
              //								log.audit("stacked in summary :"+apnMap.stacked);
              if (apnMap.stacked == "Y") {
                //									log.audit("in if");
                apnRec.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_parent_rec",
                  fieldId: "custrecord_cntm_apn_stacked",
                  value: apnMap.stacked,
                });
              } else {
                //									log.audit("in else");
                apnRec.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_parent_rec",
                  fieldId: "custrecord_cntm_apn_stacked",
                  value: "N",
                });
              }
              if (apnMap.bagNtag == "Y") {
                //									log.audit("in if");
                apnRec.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_parent_rec",
                  fieldId: "custrecord_cntm_bag_n_tag",
                  value: true,
                });
              }
              if (apnMap.specPart == "Y") {
                // log.audit("in if");
                apnRec.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_parent_rec",
                  fieldId: "custrecord_cntm_apn_spec_part",
                  value: true,
                });
              }
              if (apnMap.custSupplied == "Y") {
                // log.audit("in if");
                apnRec.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_parent_rec",
                  fieldId: "custrecord_cntm_customer_supplied_apn",
                  value: true,
                });
              }
              apnRec.commitLine({
                sublistId: "recmachcustrecord_cntm_parent_rec",
              });
              log.debug("commit");
            }
          }
          var error_map = {};
          log.debug(apnNotInNS.length, vpnNotInNS.length);
          var asmRec = record.load({
            type: recType,
            id: recId,
            isDynamic: true,
          });
          if (apnNotInNS.length > 0 || vpnNotInNS.length > 0) {
            if (apnNotInNS.length > 0) {
              log.audit(" in apnNotInNS : " + apnNotInNS + "ind :" + ind);
              var fileContent =
                "Item and/or Vendor details for APN record are missing in Netsuite. \n Items :" +
                apnNotInNS;
              error_map["itemNS"] = apnNotInNS;

              var fileObj = file.create({
                name: bomName + "_" + ind + "_" + recId + ".txt",
                fileType: file.Type.PLAINTEXT,
                contents: fileContent,
                // description: 'This is a plain text file.',
                // encoding: file.Encoding.UTF8,
                // folder: 30,
                //  isOnline: true
              });
              fileObj.folder = folderId;
              var fileId = fileObj.save();

              log.debug("fileId :" + fileId);
              asmRec.selectLine({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                line: ind,
              });
              asmRec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_status_asm_child",

                value: 10,
              });
              asmRec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_asm_err_file",

                value: fileId,
              });
              asmRec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_err_asm_child",

                value: "",
              });
              asmRec.commitLine({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
              });

              asmRec.save();
            } else if (vpnNotInNS.length > 0) {
              error_map["vendorNS"] = vpnNotInNS;
              var fileContent =
                "Item and/or Vendor details for APN record are missing in Netsuite. \n Vendors :" +
                vpnNotInNS;
              var fileObj = file.create({
                name: bomName + "_" + ind + "_" + recId + ".txt",
                fileType: file.Type.PLAINTEXT,
                contents: fileContent,
                // description: 'This is a plain text file.',
                // encoding: file.Encoding.UTF8,
                // folder: 30,
                //  isOnline: true
              });
              fileObj.folder = folderId;
              var fileId = fileObj.save();
              var asmRec = record.load({
                type: recType,
                id: recId,
                isDynamic: true,
              });
              asmRec.selectLine({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                line: ind,
              });
              asmRec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_status_asm_child",

                value: 10,
              });
              asmRec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_asm_err_file",

                value: fileId,
              });
              asmRec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_err_asm_child",

                value: "",
              });
              asmRec.commitLine({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
              });

              asmRec.save();
            }
          } else if (apnNotInNS.length > 0 && vpnNotInNS.length > 0) {
            error_map["itemNS"] = apnNotInNS;
            error_map["vendorNS"] = vpnNotInNS;
            var fileContent =
              "Item and/or Vendor details for APN record are missing in Netsuite. \n Items :" +
              apnNotInNS +
              "\n Vendors :" +
              vpnNotInNS;
            var fileObj = file.create({
              name: bomName + "_" + ind + "_" + recId + ".txt",
              fileType: file.Type.PLAINTEXT,
              contents: fileContent,
              // description: 'This is a plain text file.',
              // encoding: file.Encoding.UTF8,
              // folder: 30,
              //  isOnline: true
            });
            fileObj.folder = folderId;
            var fileId = fileObj.save();
            var asmRec = record.load({
              type: recType,
              id: recId,
              isDynamic: true,
            });
            asmRec.selectLine({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              line: ind,
            });
            asmRec.setCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_status_asm_child",

              value: 10,
            });
            asmRec.setCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_asm_err_file",

              value: fileId,
            });
            asmRec.setCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_err_asm_child",

              value: "",
            });
            asmRec.commitLine({ sublistId: "recmachcustrecord_cntm_asmwoqty" });

            asmRec.save();
          }
          if (apnNotInNS.length == 0 && vpnNotInNS.length == 0) {
            try {
              var apnRecId = apnRec.save({
                ignoreMandatoryFields: true,
                enableSourcing: true,
              });
            } catch (e) {
              log.error("apnRec", e.message);
            }
          }
          log.debug("apnRecId", apnRecId);

          if (apnRecId) {
            /*	var mapForAPN={};
								 mapForAPN["apn"]=apnRecId;
								 mapForAPN["bomrev"]=bomrev;
								 mapForAPN["asm"]=recId;
								 mapForAPN["ind"]=ind;
								 context.write({
									 key: "asm",
									 value: JSON.parse(mapForAPN)
								 });*/
            var bomRevRec = record.load({
              type: "bomrevision",
              id: bomrev,
              isDynamic: true,
            });
            bomRevRec.setValue({
              fieldId: "custrecord_cntm_alt_part_no_rec",
              value: apnRecId,
            });
            bomRevRec.save();

            var asmRec = record.load({
              type: recType,
              id: recId,
              isDynamic: true,
            });
            log.debug("asmRec index :" + ind);
            asmRec.selectLine({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              line: ind,
            });
            var routingID = asmRec.getCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_manufacturing_templ",
            });
            var wo = asmRec.getCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_wonumb_asm_wocrtn",
            });
            if (routingID) {
              if (wo) {
                asmRec.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_status_asm_child",

                  value: 8,
                });
                //updating WO with new Rev and routing
                var woRec = record.load({
                  type: record.Type.WORK_ORDER,
                  id: wo,
                });

                woRec.setValue({
                  fieldId: "manufacturingrouting",
                  value: routingID,
                  ignoreFieldChange: true,
                });
                woRec.setValue({
                  fieldId: "billofmaterialsrevision",
                  value: bomrev,
                  ignoreFieldChange: true,
                });
                woRec.setValue({
                  fieldId: "custbody_cntm_wo_apn_ref",
                  value: apnRecId,
                  ignoreFieldChange: true,
                });

                var woID = woRec.save();
                createWoApnRec(woID, apnRecId);
              } else {
                asmRec.setCurrentSublistValue({
                  sublistId: "recmachcustrecord_cntm_asmwoqty",
                  fieldId: "custrecord_cntm_status_asm_child",

                  value: 6,
                });
              }
            } else {
              asmRec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_status_asm_child",

                value: 4,
              });
            }

            if (reimport == true || reimport == "T") {
              asmRec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_cntm_asmwoqty",
                fieldId: "custrecord_cntm_bomrev_reimport",

                value: false,
              });
            }
            asmRec.setCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_err_asm_child",

              value: "",
            });
            asmRec.setCurrentSublistValue({
              sublistId: "recmachcustrecord_cntm_asmwoqty",
              fieldId: "custrecord_cntm_asm_err_file",

              value: "",
            });

            asmRec.commitLine({ sublistId: "recmachcustrecord_cntm_asmwoqty" });
            asmRec.save();
          }

          //}

          //******************************************************************************

          //	}
          // }
        } else if (mpnNotInNS.length > 0) {
        }
      }
    } catch (e) {
      log.error("error_map", e.message);

      var asmRec = record.load({
        type: recType,
        id: recId,
        isDynamic: true,
      });
      asmRec.selectLine({
        sublistId: "recmachcustrecord_cntm_asmwoqty",
        line: ind,
      });
      asmRec.setCurrentSublistValue({
        sublistId: "recmachcustrecord_cntm_asmwoqty",
        fieldId: "custrecord_cntm_status_asm_child",

        value: 10,
      });

      asmRec.setCurrentSublistValue({
        sublistId: "recmachcustrecord_cntm_asmwoqty",
        fieldId: "custrecord_cntm_err_asm_child",

        value: e.message,
      });
      asmRec.commitLine({ sublistId: "recmachcustrecord_cntm_asmwoqty" });

      asmRec.save();

      context.write({
        key: "error",
        value: line.error,
      });
    }
  }

  /**
   * Executes when the summarize entry point is triggered and applies
   * to the result set.
   *
   * @param {Summary}
   *            summary - Holds statistics regarding the execution of
   *            a map/reduce script
   * @since 2015.1
   */
  function summarize(summary) {}

  return {
    getInputData: getInputData,
    //	map : map,
    reduce: reduce,
    summarize: summarize,
  };
});
