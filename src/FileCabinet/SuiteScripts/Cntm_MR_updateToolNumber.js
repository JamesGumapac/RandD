/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @filename      Cntm_MR_updateToolNumber.js
 * @scriptid   customscript_cntm_mr_updatetoolnumber
 * @author        Vishal Naphade
 * @email         vishal.naphade@gmail.com
 * @date         22 August 2022 
 * @description   For Duplicate tool number and associate record 
 
 * Copyright 2020, Centium Consulting its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 * Module Description
 * 
 * Sr. No   	 Date           	  Author                  	Remarks
 * 1	 		22-08-2022           Vishal Naphade          - 
 * 
 */
 
 define(["N/record", "N/runtime", "N/search","N/file"], /**
 * @param {record}
 *            record
 * @param {runtime}
 *            runtime
 * @param {search}
 *            search
 */
function (record, runtime, search,file) {
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
      var idArray = getIdsArray();
      // log.debug('idArray :',idArray);

      var map_final = getAllInternalId(idArray);
      // log.debug("map_final :", map_final);
    

      return map_final;
    } catch (error) {
      log.error("error in  get input :", error);
    }
  }

  function getIdsArray() {
    try {
      var array = [];
      var customrecord_cntm_job_idSearchObj = search.create({
        type: "customrecord_cntm_job_id",
        filters:
        [
         //   ["name","is","1061610"], 
         //   "AND", 
           ["count(internalid)","greaterthan","1"]
        ],
        columns: [
          search.createColumn({
            name: "name",
            summary: "GROUP",
            sort: search.Sort.ASC,
            label: "Name",
          }),
          search.createColumn({
            name: "internalid",
            summary: "MIN",
            label: "Internal ID",
          }),
          search.createColumn({
            name: "created",
            summary: "MIN",
            label: "Date Created",
          }),
        ],
      });
      var searchResultCount =
        customrecord_cntm_job_idSearchObj.runPaged().count;
      // log.debug("customrecord_cntm_job_idSearchObj result count",searchResultCount);
      customrecord_cntm_job_idSearchObj.run().each(function (result) {
        // .run().each has a limit of 4,000 results
        var name = result.getValue({
          name: "name",
          summary: "GROUP",
          sort: search.Sort.ASC,
          label: "Name",
        });

        var id = result.getValue({
          name: "internalid",
          summary: "MIN",
          label: "Internal ID",
        });
        var map = {};
        map["name"] = name;
        map["id"] = id;
        array.push(map);
        return true;
      });

      return array;
    } catch (error) {
      log.error("error in getIdsArray :", error);
    }
  }

  function getAllInternalId(array) {
    try {
      var internalidArray = [];

      // log.debug("length : ", array.length);
      for (var index = 0; index < array.length; index++) {
        // var internalidArrayTemp = [];
        var internalidMap = {};

        var customrecord_cntm_job_idSearchObj = search.create({
          type: "customrecord_cntm_job_id",
          filters: [["name", "is", array[index].name]],
          columns: [
            search.createColumn({
              name: "name",
              sort: search.Sort.ASC,
              label: "Name",
            }),
            search.createColumn({ name: "internalid", label: "Internal ID" }),
          ],
        });
        var searchResultCount =
          customrecord_cntm_job_idSearchObj.runPaged().count;
        // log.debug("result count -- ",searchResultCount);
        var tempArr = [];
        customrecord_cntm_job_idSearchObj.run().each(function (result) {
          // .run().each has a limit of 4,000 results

          var name_1 = result.getValue({
            name: "name",
            sort: search.Sort.ASC,
            label: "Name",
          });

          var inId = result.getValue({
            name: "internalid",
            label: "Internal ID",
          });

          if (array[index].id != inId) {
            tempArr.push(inId);
          }

          return true;
        });
        // log.debug("tempArr :",tempArr);

        internalidMap["originalName"] = array[index].name;
        internalidMap["originalId"] = array[index].id;
        internalidMap["internalIds"] = tempArr;

        // log.debug('internalidMap :',internalidMap);

        internalidArray.push(internalidMap);
      } //for end

      // log.debug('internalidArray :',internalidArray);
      return internalidArray;
    } catch (error) {
      log.error("Error in get All internal id :", error);
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

  function map(mapContext) {
    try {
      // log.debug('----MAP-----')

      var mainArray = { }
      var map_final = JSON.parse(mapContext.value);
      // log.audit("map_final :", map_final);

      mainArray["originalName"] = map_final.originalName;
      mainArray["originalId"] = map_final.originalId;
      mainArray["exceptInternalId"] = map_final.internalIds;


      var exceptInternalIds = [];
      exceptInternalIds = map_final.internalIds;
    //   exceptInternalIds= [
    //     "16907",
    //     "7673"
    //  ]

      var project =  getProjectDetails(exceptInternalIds);
      var transaction = getTransactionDetails(exceptInternalIds);
      var bom = getBomDetails(exceptInternalIds);
      var fabwoCreation = getFabWoCreationDetails(exceptInternalIds)
      var asmwoCreation = getAsmWoCreationDetails(exceptInternalIds)
      var supportCase = getSupportCaseDetails(exceptInternalIds)
      //Item 
      // var item = getItemDetails()

      mainArray["project"] = project;
      mainArray["transaction"] = transaction;
      mainArray["bom"] = bom;
      mainArray["fabwoCreation"] = fabwoCreation;
      mainArray["asmwoCreation"] = asmwoCreation;
      mainArray["supportCase"] = supportCase;
      log.audit('---MAIN ARRAY---',mainArray);

      var fileObj = file.load({
        // id: 113628
        id:113712
    });
     fileObj.appendLine({
      value: JSON.stringify(mainArray)
    });

    var fileId = fileObj.save();
    log.audit('fileId :',fileId);


      mapContext.write({
        key: mapContext.key,
        value: mainArray,
      });

    } catch (error) {
      log.error("Error in map :", error);
    }
  }

  function validateData(data) {
    if (data != undefined && data != null && data != "") {
      return true;
    } else {
      return false;
    }
  }
  function getSupportCaseDetails(exceptInternalIds){
    var supportArray = [];
    var supportcaseSearchObj = search.create({
      type: "supportcase",
      filters:
      [
         ["stage","anyof","OPEN","ESCALATED"], 
         "AND", 
         ["custevent_rda_toolnumber.internalid","anyof",exceptInternalIds]
      ],
      columns:
      [
         search.createColumn({name: "internalid", label: "Internal ID"})
      ]
   });
   var searchResultCount = supportcaseSearchObj.runPaged().count;
  //  log.debug("supportcaseSearchObj result count",searchResultCount);
  
   if(searchResultCount > 0 ){
    supportcaseSearchObj.run().each(function(result){
      var tempArr = {};

      var inId = result.getValue({
        name: "internalid",
        sort: search.Sort.ASC,
        label: "Internal ID"
     });
     if (validateData(inId)){
      tempArr['supportCaseId'] = inId;
     }
     
     supportArray.push(tempArr);
     
      return true;
   });

   return supportArray;
   }
 

  }
  function getAsmWoCreationDetails(exceptInternalIds){ 

    var projectArray = [];

    var customrecord_cntm_wo_bom_import_fabSearchObj = search.create({
      type: "customrecord_cntm_asm_wocreation",
      filters:
      [
         ["custrecord_cntm_toolnumber_asmwo.internalid","anyof",exceptInternalIds]
      ],
      columns:
      [
         search.createColumn({name: "internalid", label: "Internal ID"})
      ]
   });
   var searchResultCount = customrecord_cntm_wo_bom_import_fabSearchObj.runPaged().count;
  //  log.debug("customrecord_cntm_wo_bom_import_fabSearchObj result count",searchResultCount);

   if(searchResultCount > 0 ){
    customrecord_cntm_wo_bom_import_fabSearchObj.run().each(function(result){
      var tempArr = {};
      var inId = result.getValue({
        name: "internalid",
        sort: search.Sort.ASC,
        label: "Internal ID"
     });
     if (validateData(inId)){
      tempArr['asmwoCreationSuitelet'] = inId;
     }
     
     projectArray.push(tempArr);
      return true;
   });
   }

   return projectArray;
  
  
  }
  
  function getFabWoCreationDetails(exceptInternalIds){
    var projectArray = [];

    var customrecord_cntm_wo_bom_import_fabSearchObj = search.create({
      type: "customrecord_cntm_wo_bom_import_fab",
      filters:
      [
         ["custrecord_cntm_toolnum_fab.internalid","anyof",exceptInternalIds]
      ],
      columns:
      [
         search.createColumn({name: "internalid", label: "Internal ID"})
      ]
   });
   var searchResultCount = customrecord_cntm_wo_bom_import_fabSearchObj.runPaged().count;
  //  log.debug("customrecord_cntm_wo_bom_import_fabSearchObj result count",searchResultCount);

   if(searchResultCount > 0 ){
    customrecord_cntm_wo_bom_import_fabSearchObj.run().each(function(result){
      var tempArr = {};
      var inId = result.getValue({
        name: "internalid",
        sort: search.Sort.ASC,
        label: "Internal ID"
     });
     if (validateData(inId)){
      tempArr['fabwoCreationSuitelet'] = inId;
     }
     
     projectArray.push(tempArr);
      return true;
   });
   }

   return projectArray;
  
  }

  function getProjectDetails(objectArray) {
   try {
    var arr = [];
    // log.debug('objectArray :',objectArray)

    var jobSearchObj = search.create({
      type: "job",
      filters: [
        ["custentity_cntm_tool_number.internalid", "anyof", objectArray],
      ],
      columns:    [
        // search.createColumn({name: "altname", label: "Name"}),
        search.createColumn({
           name: "internalid",
           sort: search.Sort.ASC,
           label: "Internal ID"
        }),

     ]
    });
    var searchResultCount = jobSearchObj.runPaged().count;

    
    if (searchResultCount > 0) {
      // log.debug("jobSearchObj result count", searchResultCount);

      jobSearchObj.run().each(function (result) {
        var tempArr = {};
        var inId = result.getValue({
          name: "internalid",
          sort: search.Sort.ASC,
          label: "Internal ID"
       });
       if (validateData(inId)){
        tempArr['ProjectId'] = inId;
       }
       
        arr.push(tempArr);
        return true;
      });
    }
    return arr;
   } catch (error) {
    log.error('Error in get project details :',error)
   }

  }

  function getBomDetails(objectArray){
    var bomArray = [];

    var bomSearchObj = search.create({
      type: "bom",
      filters:
      [
         ["custrecord_cntm_tool_number.internalid","anyof",objectArray]
      ],
      columns:
      [
         search.createColumn({name: "name", label: "Name"}),
         search.createColumn({name: "revisionname", label: "Revision : Name"}),
         search.createColumn({name: "custrecord_cntm_asm_bom_rev_soline", label: "ASM BOM (CUST REV)"}),
         search.createColumn({
            name: "internalid",
            sort: search.Sort.ASC,
            label: "Internal ID"
         })
      ]
   });
   var searchResultCount = bomSearchObj.runPaged().count;

   if(searchResultCount > 0 ){

    // log.debug("bomSearchObj result count",searchResultCount);
    bomSearchObj.run().each(function(result){
      var tempArr = {};
       // .run().each has a limit of 4,000 results
       var bomInternalId = result.getValue({
        name: "internalid",
        sort: search.Sort.ASC,
        label: "Internal ID"
     });
     if (validateData(bomInternalId)){
      tempArr['BomInternalId'] = bomInternalId;
     }
     
     bomArray.push(tempArr);

       return true;
    });
   }

   return bomArray;

  }

  function getTransactionDetails(objectArray){
    try {
      var transactionArray = []

      var transactionSearchObj = search.create({
        type: "transaction",
        filters: [
          ["mainline", "is", "T"],
          "AND",
          ["custbody_cntm_tool_number", "noneof", "@NONE@"],
          "AND", 
         ["custbody_cntm_tool_number.internalid","anyof",objectArray]
        ],

        columns: [
          search.createColumn({ name: "tranid", label: "Document Number" }),
          search.createColumn({ name: "internalid", label: "Internal ID" }),
          search.createColumn({ name: "recordtype", label: "Record Type" }),
        ],
      });
      var searchResultCount = transactionSearchObj.runPaged().count;

       if (searchResultCount > 0) {
       
        // log.debug("---count", searchResultCount +" map_final name :" +map_final.originalName);
       transactionSearchObj.run().each(function (result) {
        var tempMap = {}
         var documentNumber = result.getValue({
           name: "tranid",
           label: "Document Number",
         });
         var recordtype = result.getValue({
           name: "recordtype",
           label: "Record Type",
         });
         var recordInternalId = result.getValue({
           name: "internalid",
           label: "Internal ID",
         });

         if(validateData(documentNumber)){
          tempMap["documentNumber"] = documentNumber;
          tempMap["recordtype"] =recordtype
          tempMap["recordInternalId"] = recordInternalId;
          transactionArray.push(tempMap);
         }
         return true;
       });



      return transactionArray ;
     }

      
    } catch (error) {
      log.error('Error in get transaction :',error)
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
  function reduce(reduceContext) {
    try {
      log.debug("----REDUCE-----");
      var mapForProcess = JSON.parse(reduceContext.values[0]);
      log.debug("mapForProcess", mapForProcess);

      //FOR PROCESSING BOM
      try {
        if (mapForProcess.hasOwnProperty("bom")) {
          log.debug("---INSIDE  bom FIELDS---");

          for (var k = 0; k < mapForProcess.bom.length; k++) {
            var rec_obj = record.load({
              type: record.Type.BOM,
              id: mapForProcess.bom[k].BomInternalId,
              isDynamic: true,
            });
            log.audit("load :", rec_obj);

            rec_obj.setValue({
              fieldId: "custrecord_cntm_tool_number",
              value: mapForProcess.originalId,
            });
            log.audit("setvalue :", mapForProcess.originalId);

            var recId = rec_obj.save({
              enableSourcing: true,
              ignoreMandatoryFields: true,
            });

            log.audit("recId  :", recId);
          }
        }
      } catch (error) {
        log.error("FOR PROCESSING BOM :", error);
      }

      //     FOR PROCESSING PROJECT
      try {
        if (mapForProcess.hasOwnProperty("project")) {
          for (var i = 0; i < mapForProcess.project.length; i++) {
            var tn_project = record.submitFields({
              type: record.Type.JOB,
              id: mapForProcess.project[i].ProjectId,
              values: { custentity_cntm_tool_number: mapForProcess.originalId },
            });
          }
        }
      } catch (error) {
        log.error("FOR PROCESSING PROJECT :", error);
      }

      //FOR PROCESSING TRANSACTION
      try {
        if (mapForProcess.hasOwnProperty("transaction")) {
          log.audit("---INSIDE TRASNACTION ----");

          for (var j = 0; j < mapForProcess.transaction.length; j++) {
            var t_type = mapForProcess.transaction[j].recordtype;
            var t_id = mapForProcess.transaction[j].recordInternalId;

          //   var rec_obj = record.load({
          //     type: t_type,
          //     id: t_id,
          //     isDynamic: true
          //   });
          //   rec_obj.setValue({ fieldId : "custbody_cntm_tool_number", value :  mapForProcess.originalId})

          //  var recId =   rec_obj.save({
          //   enableSourcing: true,
          //   ignoreMandatoryFields: true,
          // });
            var tn_tran = record.submitFields({
              type: t_type,
              id: t_id,
              values: { custbody_cntm_tool_number: mapForProcess.originalId },
            });

            log.audit("tn_tran :", tn_tran);
          }
        }
      } catch (error) {
        log.error("FOR PROCESSING TRANSACTION :", error);
      }

      //FAB WO CREATION
      try {
        if (mapForProcess.hasOwnProperty("fabwoCreation")) {
          log.audit("---INSIDE fabwoCreation ----");
          for (var x = 0; x < mapForProcess.fabwoCreation.length; x++) {
            var tn_tran = record.submitFields({
              type: "customrecord_cntm_wo_bom_import_fab", //customrecord_cntm_asm_wocreation
              id: mapForProcess.fabwoCreation[x].fabwoCreationSuitelet,
              values: {
                custrecord_cntm_toolnum_fab: mapForProcess.originalId,
              },
            });
          }
        }
      } catch (error) {
        log.error("FAB WO CREATION :", error);
      }

      //ASM WO CREATION
      try {
        if (mapForProcess.hasOwnProperty("asmwoCreation")) {
          log.audit("---INSIDE asmwoCreation ----");
          for (var y = 0; y < mapForProcess.asmwoCreation.length; y++) {
            var tn_tran = record.submitFields({
              type: "customrecord_cntm_asm_wocreation", //
              id: mapForProcess.asmwoCreation[y].asmwoCreationSuitelet,
              values: {
                custrecord_cntm_toolnumber_asmwo: mapForProcess.originalId,
              },
            });
          }
        }
      } catch (error) {
        log.error("ASM WO CREATION :", error);
      }

      //SUPPORT CASE
      try {
        if (mapForProcess.hasOwnProperty("supportCase")) {
          for (var x = 0; x < mapForProcess.supportCase.length; x++) {
            var tn_tran = record.submitFields({
              type: "supportcase", //customrecord_cntm_asm_wocreation
              id: mapForProcess.supportCase[x].supportCaseId,
              values: {
                custevent_rda_toolnumber: mapForProcess.originalId,
              },
            });
          }
        }
      } catch (error) {
        log.error("SUPPORT CASE :", error);
      }

      // FOR DELETION ON TOOL NUMBER
      // if(mapForProcess.hasOwnProperty('exceptInternalId')){
      // for(var l = 0 ; l < mapForProcess.exceptInternalId.length ; l++){

      //   var deletedId = record.delete({
      // 		type:'customrecord_cntm_job_id',
      // 		id: mapForProcess.exceptInternalId[l],
      // 	});
      // }
      // log.audit('delete')

      // }

      log.debug("----REDUCE END-----");
    } catch (error) {
      log.error("Error in reduce :", error);
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
  function summarize(summary) {
    try {
      log.debug("---IN SUMMARIZE---");
    } catch (error) {
      log.debug("error" + error.message);
    }
  }

  return {
    getInputData: getInputData,
      map : map,
      reduce : reduce,
    summarize: summarize,
  };
});
