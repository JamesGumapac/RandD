/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @author Kimaya Surse
 */
define(["N/error", "N/file", "N/record", "N/search", "N/runtime", "N/task"], /**
 * @param{error} error
 * @param{file} file
 * @param{record} record
 * @param{search} search
 */ function (error, file, record, search, runtime, task) {
  /**
   * Defines the function that is executed at the beginning of the
   * map/reduce process and generates the input data.
   *
   * @param {Object}
   *            inputContext
   * @param {boolean}
   *            inputContext.isRestarted - Indicates whether the
   *            current invocation of this function is the first
   *            invocation (if true, the current invocation is not the
   *            first invocation and this function has been restarted)
   * @param {Object}
   *            inputContext.ObjectRef - Object that references the
   *            input data
   * @typedef {Object} ObjectRef
   * @property {string|number} ObjectRef.id - Internal ID of the
   *           record instance that contains the input data
   * @property {string} ObjectRef.type - Type of the record instance
   *           that contains the input data
   * @returns {Array|Object|Search|ObjectRef|File|Query} The input
   *          data to use in the map/reduce process
   * @since 2015.2
   */
  /*
  * Sr. No   	 Date           	  Author                  	Remarks
  *   1          01-10-2022        Vishal Naphade          CHANGES creating BOM and routing...According to location
  *   2          09-11-2022        Vishal Naphade          Changes for BOM file
  */

  function getInputData(inputContext) {
    try {
      log.audit("---GET INPUT---");
      var final_obj = new Array();
      var bom_assembly = new Array();
      var unique_assembly = new Array();
      var bom_file = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_bom_file",
      });

      var dependancy_file = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_dependancy_file",
      });
      log.audit("dependancy_file old :", dependancy_file);

      var routingFile = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_routing_file",
      });

      var fabRecordId = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_curr_record_id",
      });

      var isValidate = true;
      var fabStatus = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_fab_status",
      });

      var isNewRouting = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_new_routing",
      });
      log.audit("isNewRouting", isNewRouting);

      var tool_num = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_tool_number",
      });
      log.debug("tool_num", tool_num); //142451

      log.debug("fabStatus :", fabStatus);
      var arrOprtnForBSTAGEorFOIL = runtime
        .getCurrentScript()
        .getParameter({ name: "custscript_cntm_oprtn_type_bstage_foil" });
      log.debug("arrOprtnForBSTAGEorFOIL :", arrOprtnForBSTAGEorFOIL);

      var crrctStatusMap = {
        9: 2,
        10: 3,
        12: 5,
      };
      if (fabStatus == 9 || fabStatus == 10 || fabStatus == 12) {
        record.submitFields({
          type: "customrecord_cntm_wo_bom_import_fab",
          id: fabRecordId,
          values: {
            custrecord_cntm_status_fab_wo_crtn: crrctStatusMap[fabStatus],
            custrecord_cntm_error_fab: "",
            custrecord_cntm_err_file: "",
          },
        });
      }
      log.debug("bom_file", bom_file); //40567
      log.debug("dependancy_file", dependancy_file); //40568
      log.debug("routingFile", routingFile); // 40558
      log.debug("fabRecordId", fabRecordId); // 811
      var depenData = {};
      var uniqueASM = [];
      var asmObjArr = [];

      var fabFieldLookUp = search.lookupFields({
        type: "customrecord_cntm_wo_bom_import_fab",
        id: fabRecordId,
        columns: [
          "custrecord_cntm_cust_rev_fab",
          "custrecord_cntm_sales_order_fab",
          "custrecord_cntm_status_fab_wo_crtn",
          "custrecord_cntm_new_job_fab",
          "custrecord_cntm_repeat_job_fab",
          "custrecord_cntm_bom_fab",
          "custrecord_cntm_so_subsidiary_fab_wo",
          "custrecord_cntm_so_location_fab",
        ],
      });
      var fabBomId = fabFieldLookUp.custrecord_cntm_bom_fab;

      //Vishal Added code on 27-08-2022
      if (isNewRouting == true || isNewRouting == "true") {
        var newFiles = getFilesForNewRouting(fabRecordId, fabBomId, tool_num);
        // log.audit('newFiles map :',newFiles);

        dependancy_file = newFiles.dependancyFile;
        // bom_file = newFiles.bomRawFile;

        log.audit("dependancy_file new :", dependancy_file);
        // log.audit('bom file  new :', bom_file);
      }
      if (!dependancy_file) {
        var params = {};
        params.custrecord_cntm_status_fab_wo_crtn = "9";
        params.custrecord_cntm_error_fab =
          "Please provide Dependency file to proceed further";
        record.submitFields({
          type: "customrecord_cntm_wo_bom_import_fab",
          id: fabRecordId,
          values: params,
          options: {
            enableSourcing: false,
            ignoreMandatoryFields: true,
          },
        });
        return;
      }

      var depen_fileObj = file.load({
        id: parseInt(dependancy_file),
      });
      var depen_iterator = depen_fileObj.lines.iterator();
      depen_iterator.each(function (line) {
        var body = line.value;
        var bodyArray = body.split("|");

        var subAssembly = getsubassembly(bodyArray[0]);
        // log.debug("--subAssembly", subAssembly);
        if (subAssembly) {
          var asmObj = {};
          var index = uniqueASM.indexOf(bodyArray[0]);
          if (index == -1) {
            uniqueASM.push(bodyArray[0]);
            asmObj.AssemblyName = bodyArray[0];
            asmObj.SubAssembly = subAssembly;
            asmObj.SubAssembies = [];
            asmObjArr.push(asmObj);
          } else {
            asmObj = asmObjArr[index];
          }
          for (var i = 1; i < bodyArray.length; i++) {
            if (bodyArray[i]) {
              var subItemName = getsubassembly(bodyArray[i]);
              // log.debug("subItemName :", subItemName);
              asmObj.SubAssembies.push(subItemName);
            }
          }
        }

        for (var item in bodyArray) {
          // if(bodyArray[item]=="F100477-SP_1/18"||bodyArray[item]=="F100477-SP_20/45")
          bom_assembly.push(bodyArray[item]);
        }
        if (bodyArray[0]) {
          var subassembly_1 = getsubassembly(bodyArray[0]);
          var subassembly_2 = getsubassembly(bodyArray[1]);
          if (subassembly_1) {
            if (typeof depenData[subassembly_1] === "undefined") {
              depenData[subassembly_1] = []; // {};
            }
            if (subassembly_2) depenData[subassembly_1].push(subassembly_2);
            // depenData[subassembly_1] =
            // subassembly_2;
          }
        }

        return true;
      });
      unique_assembly = bom_assembly.filter(function (item, pos) {
        return bom_assembly.indexOf(item) == pos;
      });
      var tool_num = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_tool_number",
      });
      // log.debug("tool_num", tool_num); //142451

      var toolName = "",
        toolSequenceNo = "",
        toolrevision = "";
      if (tool_num != "" && tool_num != null) {
        var loadTool = record.load({
          type: "customrecord_cntm_job_id",
          id: tool_num,
          isDynamic: true,
        });
        var toolNumberFieldLookUp = search.lookupFields({
          type: "customrecord_cntm_job_id",
          id: tool_num,
          columns: ["name", "custrecord5", "custrecord6"],
        });
        // log.debug("toolNumberFieldLookUp", toolNumberFieldLookUp);

        // {
        // 	name: "2020731",
        // 	custrecord5: "1020732",
        // 	"custrecord6": []
        //  }

        toolName = toolNumberFieldLookUp.name;
        toolSequenceNo = toolNumberFieldLookUp.custrecord5;
        toolrevision = toolNumberFieldLookUp.custrecord6;
        // log.debug("toolName", toolName); //2020731
      }
      if (!fabRecordId) {
        log.error("Error:Parameters", "FAB record is required.");
        // return;
        isValidate = false;
      }

      // log.debug("fabFieldLookUp", fabFieldLookUp);
      //   {
      // 	custrecord_cntm_cust_rev_fab: "A",
      // 	custrecord_cntm_sales_order_fab: [
      // 	   {
      // 		  value: "1310592",
      // 		  text: "Sales Order #SO2124"
      // 	   }
      // 	],
      // 	"custrecord_cntm_status_fab_wo_crtn": [],
      // 	custrecord_cntm_new_job_fab: true,
      // 	custrecord_cntm_repeat_job_fab: false,
      // 	custrecord_cntm_bom_fab: [
      // 	   {
      // 		  value: "3629",
      // 		  text: "2020731-PCB-A-3"
      // 	   }
      // 	],
      // 	custrecord_cntm_so_subsidiary_fab_wo: [
      // 	   {
      // 		  value: "3",
      // 		  text: "Parent Company : R&D Circuits"
      // 	   }
      // 	],
      // 	custrecord_cntm_so_location_fab: [
      // 	   {
      // 		  value: "9",
      // 		  text: "NJ-3601"
      // 	   }
      // 	]
      //  }

      var fabSoRecordId = "";
      if (fabFieldLookUp.custrecord_cntm_sales_order_fab.length > 0)
        fabSoRecordId = fabFieldLookUp.custrecord_cntm_sales_order_fab[0].value;

      var fabRevision = fabFieldLookUp.custrecord_cntm_cust_rev_fab;

      var fabSubsidiary = "";

      if (fabFieldLookUp.custrecord_cntm_so_subsidiary_fab_wo.length > 0)
        fabSubsidiary =
          fabFieldLookUp.custrecord_cntm_so_subsidiary_fab_wo[0].value;

      var soSubsidiary = "",
        soLocation = "",
        soRevision = "",
        soCustomer = "",
        soProject = "";
      // ;
      // log.debug("fabSoRecordId", fabSoRecordId);
      if (fabSoRecordId) {
        var soRecord = record.load({
          type: record.Type.SALES_ORDER,
          id: fabSoRecordId,
          isDynamic: true,
        });
        soSubsidiary = soRecord.getValue({
          fieldId: "subsidiary",
        });
        soLocation = soRecord.getValue({
          fieldId: "location",
        });
        soProject = soRecord.getValue({
          fieldId: "job",
        });
        soRevision = soRecord.getValue({
          fieldId: "custbody_cntm_cust_rev",
        });
        soCustomer = soRecord.getValue({
          fieldId: "entity",
        });
      } else {
        log.error(
          "fabRecordId = " + fabRecordId,
          "Sales order Id not existed in the FAB record"
        );
      }
      /*
       * var fabStatus = ""; if
       * (fabFieldLookUp.custrecord_cntm_status_fab_wo_crtn.length >
       * 0) fabStatus =
       * fabFieldLookUp.custrecord_cntm_status_fab_wo_crtn[0].value;
       */

      /*
       * if (fabStatus == 4 || fabStatus == 5 || fabStatus == 12) {
       * if (!routingFile) { record .submitFields({ type :
       * 'customrecord_cntm_wo_bom_import_fab', id : fabRecordId,
       * values : { "custrecord_cntm_error_fab" : "Routing File Id
       * is not found " }, options : { enableSourcing : false,
       * ignoreMandatoryFields : true } }); isValidate = false; } }
       */

      var fabNewJob = fabFieldLookUp.custrecord_cntm_new_job_fab;
      var fabRepeatJob = fabFieldLookUp.custrecord_cntm_repeat_job_fab;
      log.debug("fabRepeatJob :", fabRepeatJob);

      if (fabRepeatJob) {
        if (!fabBomId) {
          record.submitFields({
            type: "customrecord_cntm_wo_bom_import_fab",
            id: fabRecordId,
            values: {
              custrecord_cntm_error_fab:
                "BOM Record is required for repeat job",
            },
            options: {
              enableSourcing: false,
              ignoreMandatoryFields: true,
            },
          });
          isValidate = false;
        }
      }

      if (!fabRevision) {
        fabRevision = soRevision;
      }

      for (var i = Number(uniqueASM.length) - 1; i >= 0; i--) {
        var file_obj = {};
        var str = uniqueASM[i];
        var res = uniqueASM[i].indexOf("-");
        var subassembly = str.slice(res + 1, str.length); // SP_1/18
        // log.debug("subassembly", subassembly);
        if (subassembly) {
          file_obj["subassembly"] = subassembly;
          file_obj["assembly"] = uniqueASM[i];
          file_obj["routing"] = routingFile;
          file_obj["bomFile"] = bom_file;
          file_obj["toolName"] = toolName;
          file_obj["toolnumber"] = tool_num;
          file_obj["toolrevision"] = toolrevision;
          file_obj["revision"] = fabRevision;
          file_obj["subsidiary"] = soSubsidiary;
          file_obj["location"] = soLocation;
          file_obj["fabSubsidiary"] = fabSubsidiary;
          file_obj["item"] = depenData[subassembly];
          file_obj["SubAssembies"] = asmObjArr[i].SubAssembies;
          /*
           * if
           * (fabFieldLookUp.custrecord_cntm_status_fab_wo_crtn.length >
           * 0) file_obj['FabStatus'] =
           * fabFieldLookUp.custrecord_cntm_status_fab_wo_crtn[0].value;
           * else file_obj['FabStatus'] = "";
           */
          file_obj["FabStatus"] = fabStatus;
          if (fabRepeatJob && !fabNewJob) file_obj["job"] = "repeat";
          else file_obj["job"] = "new";

          file_obj["fabRecordId"] = fabRecordId;
          file_obj["fabItem"] = runtime.getCurrentScript().getParameter({
            name: "custscript_cntm_item_fab",
          });
          final_obj.push(file_obj);
        }
        // }
        // }
      }
      log.debug("final_obj", final_obj);
      log.audit("---GET INPUT END---");

      return final_obj;
    } catch (e) {
      log.error("ERROR IN GETINPUT STAGE", e);
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

  function getFilesForNewRouting(fabRecordId, fabBomId, tool_num) {
    var customrecord_cntm_wo_bom_import_fabSearchObj = search.create({
      type: "customrecord_cntm_wo_bom_import_fab",
      filters: [
        ["custrecord_cntm_toolnum_fab", "anyof", tool_num],
        "AND",
        ["custrecord_cntm_bom_fab", "anyof", fabBomId[0].value],
        "AND",
        ["internalid", "noneof", fabRecordId],
        "AND",
        [
          "formulatext: TO_CHAR({custrecord_cntm_bom_dependecy_file_fab})",
          "isnotempty",
          "",
        ],
        "AND",
        [
          "formulatext: TO_CHAR({custrecord_bom_raw_file_fab})",
          "isnotempty",
          "",
        ],
      ],
      columns: [
        search.createColumn({
          name: "created",
          summary: "MIN",
          label: "Date Created",
        }),
        search.createColumn({
          name: "custrecord_cntm_toolnum_fab",
          summary: "COUNT",
          label: "Tool Number",
        }),
        search.createColumn({
          name: "custrecord_cntm_toolnum_fab",
          summary: "GROUP",
          label: "Tool Number",
        }),
        search.createColumn({
          name: "custrecord_cntm_bom_dependecy_file_fab",
          summary: "GROUP",
          label: "BOM Dependency File",
        }),
        search.createColumn({
          name: "custrecord_bom_raw_file_fab",
          summary: "GROUP",
          label: "BOM Raw File",
        }),
      ],
    });
    var searchResultCount = customrecord_cntm_wo_bom_import_fabSearchObj.runPaged()
      .count;
    log.debug(
      "customrecord_cntm_wo_bom_import_fabSearchObj result count",
      searchResultCount
    );
    customrecord_cntm_wo_bom_import_fabSearchObj.run().each(function (result) {
      // .run().each has a limit of 4,000 results
      map["dependancyFile"] = result.getValue({
        name: "custrecord_cntm_bom_dependecy_file_fab",
        summary: "GROUP",
        label: "BOM Dependency File",
      });
      map["bomRawFile"] = result.getValue({
        name: "custrecord_bom_raw_file_fab",
        summary: "GROUP",
        label: "BOM Raw File",
      });
      return false;
    });

    return map;
  }
  /**
   * Defines the function that is executed when the map entry point is
   * triggered. This entry point is triggered automatically when the
   * associated getInputData stage is complete. This function is
   * applied to each key-value pair in the provided context.
   *
   * @param {Object}
   *            mapContext - Data collection containing the key-value
   *            pairs to process in the map stage. This parameter is
   *            provided automatically based on the results of the
   *            getInputData stage.
   * @param {Iterator}
   *            mapContext.errors - Serialized errors that were thrown
   *            during previous attempts to execute the map function
   *            on the current key-value pair
   * @param {number}
   *            mapContext.executionNo - Number of times the map
   *            function has been executed on the current key-value
   *            pair
   * @param {boolean}
   *            mapContext.isRestarted - Indicates whether the current
   *            invocation of this function is the first invocation
   *            (if true, the current invocation is not the first
   *            invocation and this function has been restarted)
   * @param {string}
   *            mapContext.key - Key to be processed during the map
   *            stage
   * @param {string}
   *            mapContext.value - Value to be processed during the
   *            map stage
   * @since 2015.2
   */

  function map(mapContext) {
    try {
      log.audit("----------MAP---------");
      var dataObj = JSON.parse(mapContext.value);
      log.debug("dataObj in map", mapContext.value);

      var fabStatus = dataObj.FabStatus;
      fabStatus = fabStatus == "null" ? null : fabStatus;
      var bom_file = dataObj.bomFile;
      var toolName = dataObj.toolName;
      var toolnumber = dataObj.toolnumber;
      var toolrevision = dataObj.toolrevision;
      var fabRevision = dataObj.revision;
      var soSubsidiary = dataObj.subsidiary;
      var soLocation = dataObj.location;
      var fabJob = dataObj.job;
      var fabRecordId = dataObj.fabRecordId;
      var fabSubsidiary = dataObj.fabSubsidiary;
      var fabItem = dataObj.fabItem;
      var unique_assembly = dataObj.assembly;
      var subassembly = dataObj.subassembly;
      var routingFileId = dataObj.routing;
      // var itemValue=dataObj.item;
      var bomParentItems = dataObj.SubAssembies;
      var bomChildSubAssemblies = dataObj.item;
      var bomInternalId = "";
      var isInterco = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_is_interco_trans",
      });
      var isCon = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_is_con",
      });
      var isFA = false;
      if (subassembly) {
        var assemblyTypeArr = subassembly.split("_");
        var assemblyType = assemblyTypeArr[0];
        if (assemblyType == "FA" || assemblyType == "FM") {
          isFA = true;
        }
      }
      log.debug("isFA " + isFA, "isInterco " + isInterco); //isFA = false , inInterco = false
      bomInternalId = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_existing_bom",
      });
      log.debug("---bomInternalId", bomInternalId); //3629
      /*
       * var isRoutingProcess = runtime.getCurrentScript()
       * .getParameter({ name : 'custscript_cntm_is_routing' });
       * log.debug('isRoutingProcess', isRoutingProcess);
       */
      var boardsPerPanel = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_boardsperpanel",
      });
      // log.debug("---boardsPerPanel", boardsPerPanel); //3

      boardsPerPanel = boardsPerPanel ? boardsPerPanel : 1;

      var bomName = toolName + "-";
      if (isCon == true || isCon == "true") bomName += "CON-";
      bomName += subassembly + "-" + fabRevision + "-" + boardsPerPanel;
      if (isFA) {
        bomName = toolName;
        if (isCon == true || isCon == "true") bomName += "-CON-";
        else bomName += "-PCB-";
        bomName += fabRevision + "-" + boardsPerPanel;
        /*
         * if (isRoutingProcess == false || isRoutingProcess ==
         * 'false')
         */
        if (bomInternalId && bomInternalId != "null") {
          var fabFieldLookUp = search.lookupFields({
            type: "bom",
            id: parseInt(bomInternalId),
            columns: ["name"],
          });
          bomName = fabFieldLookUp.name;
        }
      }
      log.debug("bomName", bomName); //2020731-IL_21-44-A-3
      // if(!bom){
      var bomAssemblyItem;
      if (
        fabStatus == "" ||
        fabStatus == null ||
        parseInt(fabStatus) == 9 ||
        parseInt(fabStatus) == 10 ||
        parseInt(fabStatus) == 12
      ) {
        // var bom_fileObj = file.load({
        //   id: parseInt(bom_file),
        // });

        var childBOMsExisted = true;
        for (var k = 0; k < bomChildSubAssemblies.length; k++) {
          var childBomName = toolName + "-";
          if (isCon == true || isCon == "true") childBomName += "CON-";
          childBomName += bomChildSubAssemblies[k] + "-" + fabRevision;
          var filter2 = new Array();
          filter2.push(
            search.createFilter({
              name: "name",
              operator: "is",
              values: childBomName,
            })
          );
          var column2 = new Array();
          column2.push(
            search.createColumn({
              name: "internalid",
            })
          );
          var bomSearchObj = search.create({
            type: "bom",
            filters: filter2,
            columns: column2,
          });
          var searchResultCount2 = bomSearchObj.runPaged().count;
          // log.debug('childBomName=' +
          // childBomName,'searchResultCount2=' +
          // searchResultCount2);
          if (searchResultCount2 == 0) {
            childBOMsExisted == false;
          }
        }
        if (childBOMsExisted && subassembly != "" && subassembly != null) {
          var lotItemName = toolName + "-";
          if (isCon == true || isCon == "true") lotItemName += "CON-";
          lotItemName += subassembly;
          if (isFA) {
            lotItemName = "RD-" + toolName;
            if (isCon == true || isCon == "true") lotItemName += "-CON";
            else lotItemName += "-PCB";
          }
          // log.debug("lotItemName", lotItemName); //2020731-IL_21-44
          bomAssemblyItem = getLotNumberItem(lotItemName);
          // log.debug('bomAssemblyItem :',bomAssemblyItem);
          // log.debug("fabItem", fabItem); //350681

          //SM check - Changes By  Vishal
          //custitem_rda_mlo - MLO check box

          var itemFieldLookUp_mlo = search.lookupFields({
            type: "item",
            id: fabItem,
            columns: ["custitem_rda_mlo"],
          });

          // log.debug("itemFieldLookUp_mlo :", itemFieldLookUp_mlo);
          var mlo_on_item = itemFieldLookUp_mlo.custitem_rda_mlo;
          log.debug("mlo_on_item :", mlo_on_item);

          //Changes - Vishal - MLO account
          var assemblyTypeArr = subassembly.split("_");
          var assemblyType = assemblyTypeArr[0];

          // log.debug("assemblyTypeArr VISHAL :", mlo_on_item);
          // log.debug("assemblyType VISHAL :", assemblyType);

          var fabLocation = "";
          // var falLocationForBOM = [];
          //Below need to look for setting Location on BOM
          if (assemblyType == "SM" || assemblyType == "FM") {
            fabLocation = itemConfigLocation("MLO");
            // falLocationForBOM.push(fabLocation);
            // falLocationForBOM.push("9");
            log.debug("my IF ", fabLocation);
          } else {
            fabLocation = itemConfigLocation("FAB");
            // falLocationForBOM.push(fabLocation);
            log.debug("my ELSE ", fabLocation);
          }
          if (!bomAssemblyItem) {
            log.debug("COPY");
            var lotItemRecord = record.copy({
              type: record.Type.LOT_NUMBERED_ASSEMBLY_ITEM,
              id: fabItem,
              isDynamic: true,
            });

            lotItemRecord.setValue({
              fieldId: "itemid",
              value: lotItemName,
            });

            //Changes to set Taxscheduled because we didnt get value of taxscheduled in copy record
            var itemFieldLookUp = search.lookupFields({
              type: record.Type.LOT_NUMBERED_ASSEMBLY_ITEM,
              id: fabItem,
              columns: ["taxschedule"],
            });
            log.debug(
              "itemFieldLookUp :",
              itemFieldLookUp.taxschedule[0].value
            );
            //setting tax scheduled to taxable
            lotItemRecord.setValue({
              fieldId: "taxschedule",
              value: itemFieldLookUp.taxschedule[0].value,
            });

            //Updating Location
            if (assemblyType == "SM" && mlo_on_item == false) {
              log.debug("1");
              lotItemRecord = itemConfigValues("MLO", lotItemRecord);
            } else if (mlo_on_item == true && assemblyType != "SM") {
              lotItemRecord = itemConfigValues("FAB", lotItemRecord);
              log.debug("2");
            }
            log.debug("3");

            // var locationCount = lotItemRecord.getLineCount({
            //   sublistId: "locations",
            // });
            // log.debug("locationCount :", locationCount);

            // for (
            //   var locationLine = 0;
            //   locationLine < locationCount;
            //   locationLine++
            // ) {
            //   var itemLocation = lotItemRecord.getSublistValue({
            //     sublistId: "locations",
            //     fieldId: "location",
            //     line: locationLine,
            //   });
            //   log.debug("itemLocation vishal:", itemLocation);
            //   //fablocation
            //   if (fabLocation == itemLocation) {
            //     lotItemRecord.selectLine({
            //       sublistId: "locations",
            //       line: locationLine,
            //     });
            //     lotItemRecord.setCurrentSublistValue({
            //       sublistId: "locations",
            //       fieldId: "iswip",
            //       value: true,
            //     });
            //     lotItemRecord.commitLine({
            //       sublistId: "locations",
            //     });
            //     break;
            //   }
            // }
            if (
              isInterco == true ||
              isInterco == "true" ||
              isCon == true ||
              isCon == true
            ) {
              var vendorCount = lotItemRecord.getLineCount({
                sublistId: "itemvendor",
              });
              if (vendorCount > 0) {
                for (var line = 0; line < vendorCount; line++) {
                  lotItemRecord.selectLine({
                    sublistId: "itemvendor",
                    line: line,
                  });
                  lotItemRecord.setCurrentSublistValue({
                    sublistId: "itemvendor",
                    fieldId: "vendorcode",
                    value: lotItemName,
                  });
                  lotItemRecord.commitLine({
                    sublistId: "itemvendor",
                  });
                }
              }
            }
            var subLineCount = lotItemRecord.getLineCount({
              sublistId: "billofmaterials",
            });
            log.debug("subLineCount", subLineCount);
            for (var j = subLineCount - 1; j >= 0; j--) {
              lotItemRecord.removeLine({
                sublistId: "billofmaterials",
                line: j,
                ignoreRecalc: true,
              });
            }
            bomAssemblyItem = lotItemRecord.save({
              enableSourcing: true,
              ignoreMandatoryFields: true,
            });
            log.audit("---ASSEMBLY ITEM SAVE---");
            var objRecord1 = record.load({
              type: record.Type.LOT_NUMBERED_ASSEMBLY_ITEM,
              id: bomAssemblyItem,
              // defaultValues : defaultValues,
              isDynamic: true,
            });
            var lineNumber = objRecord1.findSublistLineWithValue({
              sublistId: "locations",
              fieldId: "location",
              value: fabLocation,
            });
            log.debug("lineNumber---", lineNumber);
            if (lineNumber > -1) {
              objRecord1.selectLine({
                sublistId: "locations",
                line: lineNumber,
              });
              objRecord1.setCurrentSublistValue({
                sublistId: "locations",
                fieldId: "iswip",
                value: true,
              });
              objRecord1.commitLine({
                sublistId: "locations",
              });
              var itemId1 = objRecord1.save({
                enableSourcing: false,
                ignoreMandatoryFields: true,
              });
            }
          }
          log.debug("bomAssemblyItem", bomAssemblyItem);

          //Creating BOM HERE - Record.create
          try {
            var bomSearchObj = search.create({
              type: "bom",
              filters: [["name", "is", bomName]],
              columns: [
                search.createColumn({
                  name: "name",
                  label: "Name",
                }),
                search.createColumn({
                  name: "revisionname",
                  label: "Revision : Name",
                }),
              ],
            });
            var searchResultCount = bomSearchObj.runPaged().count;
            log.debug("bomSearchObj result count", searchResultCount);
            if (searchResultCount > 0)
              bomSearchObj.run().each(function (result) {
                // .run().each
                // has a limit
                // of 4,000
                // results
                bomInternalId = result.id;
                return false;
              });
            else {
              log.debug("Create bom else");
              var bom_obj = record.create({
                type: record.Type.BOM,
                isDynamic: true,
              });
              bom_obj.setValue({
                fieldId: "name",
                value: bomName,
              });
              bom_obj.setValue({
                fieldId: "availableforallassemblies",
                value: false,
              });
              bom_obj.setValue({
                fieldId: "availableforalllocations",
                value: false,
              });

              bom_obj.setValue({
                fieldId: "subsidiary",
                value: fabSubsidiary,
              });

              bom_obj.setValue({
                fieldId: "restricttolocations",
                value: fabLocation, //falLocationForBOM, //Location for NJ-901
              });
              // log.debug('RESTRICT LOCATION SETTED ',falLocationForBOM);

              log.debug("OVER :", fabLocation);
              bom_obj.setValue({
                fieldId: "restricttoassemblies",
                value: bomAssemblyItem,
              });
              bom_obj.setValue({
                fieldId: "custrecord_cntm_tool_number",
                value: toolnumber,
              });
              bom_obj.setValue({
                fieldId: "custrecord_cntm_boards_per_panel",
                value: boardsPerPanel,
              });
              bom_obj.setValue({
                fieldId: "custrecord_cntm_fab_rec",
                value: fabRecordId,
              });
              bom_obj.setValue({
                fieldId: "usecomponentyield",
                value: true,
              });
              var newbomInternalId = bom_obj.save({
                ignoreMandatoryFields: true,
                enableSourcing: true,
              });
              log.audit("---BOM SAVE---");
              log.debug("newbomInternalId", newbomInternalId);
              if (newbomInternalId) {
                bomInternalId = newbomInternalId;
                if (isFA) {
                  var params1 = {};
                  params1.custrecord_cntm_status_fab_wo_crtn = "3";
                  params1.custrecord_cntm_error_fab = "";
                  params1.custrecord_cntm_bom_fab = bomInternalId;
                  record.submitFields({
                    type: "customrecord_cntm_wo_bom_import_fab",
                    id: fabRecordId,
                    values: params1,
                    options: {
                      enableSourcing: false,
                      ignoreMandatoryFields: true,
                    },
                  });
                }
                var loadRce = record.load({
                  type: record.Type.BOM,
                  id: bomInternalId,
                  isDynamic: true,
                });
                loadRce.selectNewLine({
                  sublistId: "assembly",
                });
                loadRce.setCurrentSublistValue({
                  sublistId: "assembly",
                  fieldId: "assembly",
                  value: bomAssemblyItem,
                });
                loadRce.setCurrentSublistValue({
                  sublistId: "assembly",
                  fieldId: "defaultforlocation",
                  value: fabLocation, //ARRAY FOR SETTING LOCATION
                });
                loadRce.commitLine({
                  sublistId: "assembly",
                });
                loadRce.save({
                  ignoreMandatoryFields: true,
                  enableSourcing: false,
                });
                log.audit("---LOAD BOM SAVE---");
              }
            }
          } catch (e) {
            // log.error("ERROR WHILE CREATION BOM
            // RECORD",e);
            log.error("BOM CREATION Error", e);
            log.error({
              title: "BOM CREATION Error:" + e.name,
              details: e.message,
            });
            var obj = { Error: e.message };
            mapContext.write({
              key: bomName,
              value: obj,
            });
            var ErrorMessage =
              "BOM Name : " + bomName + ", Error : " + e.message;
            if (ErrorMessage.length > 300)
              ErrorMessage = ErrorMessage.slice(0, 300);
            var params = {};
            params.custrecord_cntm_status_fab_wo_crtn = "9";
            params.custrecord_cntm_error_fab = ErrorMessage;
            record.submitFields({
              type: "customrecord_cntm_wo_bom_import_fab",
              id: fabRecordId,
              values: params,
              options: {
                enableSourcing: false,
                ignoreMandatoryFields: true,
              },
            });
          }
        }
      }
      /*
       * if (fabStatus == '' || fabStatus == null ||
       * parseInt(fabStatus) == 10 || parseInt(fabStatus) == 12) {
       * if (!isFA) { var bomSearchObj = search.create({ type :
       * "bom", filters : [ [ "name", "is", bomName ] ], columns : [
       * search.createColumn({ name : "name", label : "Name" }),
       * search.createColumn({ name : "revisionname", label :
       * "Revision : Name" }) ] }); var searchResultCount =
       * bomSearchObj.runPaged().count; log.debug("bomSearchObj
       * result count", searchResultCount); if (searchResultCount >
       * 0) bomSearchObj.run().each(function(result) { //
       * .run().each has a limit of 4,000 results bomInternalId =
       * result.id; return false; }); else bomInternalId = null; } }
       */
      var responseObj = {};
      responseObj.bomInternalId = bomInternalId;
      responseObj.routing = routingFileId;
      responseObj.bomName = bomName;
      responseObj.FabStatus = fabStatus;
      responseObj.fabJob = fabJob;
      responseObj.fabRevision = fabRevision;
      responseObj.toolName = toolName;
      responseObj.SubAssembies = bomChildSubAssemblies;
      responseObj.fabRecordId = fabRecordId;
      responseObj.bomFile = bom_file;
      responseObj.soSubsidiary = soSubsidiary;
      responseObj.soLocation = soLocation;
      responseObj.fabSubsidiary = fabSubsidiary;
      responseObj.subassembly = subassembly;
      responseObj.fabLocation = fabLocation; //fab location from custom record
      log.debug("responseObj", JSON.stringify(responseObj));

      log.debug("bomInternalId", bomInternalId); //3624
      // if(bomInternalId)
      mapContext.write({
        key: mapContext.key,
        value: responseObj,
      });

      log.audit("----------MAP END---------");
    } catch (e) {
      log.error("ERROR:Map", e);
      mapContext.write({
        key: "Error",
        value: e.message,
      });
      var ErrorMessage = e.message;
      if (ErrorMessage.length > 300) ErrorMessage = ErrorMessage.slice(0, 300);
      var params = {};
      params.custrecord_cntm_status_fab_wo_crtn = "9";
      params.custrecord_cntm_error_fab = ErrorMessage;
      record.submitFields({
        type: "customrecord_cntm_wo_bom_import_fab",
        id: fabRecordId,
        values: params,
        options: {
          enableSourcing: false,
          ignoreMandatoryFields: true,
        },
      });
    }
  }
  /**
   * Defines the function that is executed when the reduce entry point
   * is triggered. This entry point is triggered automatically when
   * the associated map stage is complete. This function is applied to
   * each group in the provided context.
   *
   * @param {Object}
   *            reduceContext - Data collection containing the groups
   *            to process in the reduce stage. This parameter is
   *            provided automatically based on the results of the map
   *            stage.
   * @param {Iterator}
   *            reduceContext.errors - Serialized errors that were
   *            thrown during previous attempts to execute the reduce
   *            function on the current group
   * @param {number}
   *            reduceContext.executionNo - Number of times the reduce
   *            function has been executed on the current group
   * @param {boolean}
   *            reduceContext.isRestarted - Indicates whether the
   *            current invocation of this function is the first
   *            invocation (if true, the current invocation is not the
   *            first invocation and this function has been restarted)
   * @param {string}
   *            reduceContext.key - Key to be processed during the
   *            reduce stage
   * @param {List
   *            <String>} reduceContext.values - All values associated
   *            with a unique key that was passed to the reduce stage
   *            for processing
   * @since 2015.2
   */

  function reduce(reduceContext) {
    log.audit("--------REDUCE--------");
    var isMloAssembly = false;
    log.debug("dataObj", reduceContext.values[0]);

    var dataObj = JSON.parse(reduceContext.values[0]);

    //check if assembly is MLO or fab
    /*  {
          bomInternalId: "3964",
          routing: "66214",
          bomName: "2020810-SP_3/8-A-3",
          FabStatus: null,
          fabJob: "new",
          fabRevision: "A",
          toolName: "2020810",
          SubAssembies: [
             "IL_4-7"
          ],
          fabRecordId: "867",
          bomFile: "66212",
          soSubsidiary: "3",
          soLocation: "9",
          fabSubsidiary: "3",
          subassembly: "SP_3/8"
       } */
    var bomName = dataObj.bomName;
    var fabLocation = dataObj.fabLocation;
    log.debug("fablocation :", fabLocation);
    var isRoutingProcess = runtime.getCurrentScript().getParameter({
      name: "custscript_cntm_is_routing",
    });
    var isReprocess = runtime.getCurrentScript().getParameter({
      name: "custscript_cntm_is_reprocess",
    });

    var isInterco = runtime.getCurrentScript().getParameter({
      name: "custscript_cntm_is_interco_trans",
    });
    var isCon = runtime.getCurrentScript().getParameter({
      name: "custscript_cntm_is_con",
    });
    var isNewRouting = runtime.getCurrentScript().getParameter({
      name: "custscript_cntm_new_routing",
    });
    log.audit("isNewRouting", isNewRouting);

    log.debug(
      "isReprocess " + isReprocess,
      "isRoutingProcess " + isRoutingProcess
    );
    try {
      if (reduceContext.key == "Error") {
        log.error("Error:Key", reduceContext.values);
        reduceContext.write({
          key: "Error",
          value: reduceContext.values,
        });
        // return;
      } else if ("Error" in dataObj) {
        reduceContext.write({
          key: reduceContext.key,
          value: reduceContext.values,
        });
      }
      // log.debug('reduceContext',JSON.stringify(reduceContext));
      // var dataObj = JSON.parse(reduceContext.values[0]);
      var fabRecordId = dataObj.fabRecordId;
      var fabStatus = dataObj.FabStatus;
      fabStatus = fabStatus == "null" ? null : fabStatus;
      var toolName = dataObj.toolName;
      var soSubsidiary = dataObj.soSubsidiary;
      var soLocation = dataObj.soLocation;
      var fabSubsidiary = dataObj.fabSubsidiary;

      var bom_file = dataObj.bomFile;

      var bomInternalId = dataObj.bomInternalId;
      bomInternalId = bomInternalId == "null" ? null : bomInternalId;
      log.debug("bomID", bomInternalId);

      if (bomInternalId) {
        var fabJob = dataObj.fabJob;
        var bomParentItems = dataObj.SubAssembies;
        var routingFileId = dataObj.routing;
        var subassembly = dataObj.subassembly; // reduceContext.key;
        var fabRevision = dataObj.fabRevision;
        // var bomName = dataObj.bomName// toolName
        // +"-"+subassembly+"-"+fabRevision;
        var isFA = false;
        if (subassembly) {
          var assemblyTypeArr = subassembly.split("_");
          var assemblyType = assemblyTypeArr[0];
          if (assemblyType == "FA" || assemblyType == "FM") {
            isFA = true;
          }
        }

        //Changes
        // var childAssembly = dataObj.SubAssembies[0].split('_')[0]; //
        // var parentAssembly =dataObj.subassembly.split('_')[0]; //SM
        // if((parentAssembly == 'SM' || parentAssembly == 'FM') && (childAssembly !='SM' && childAssembly != 'FM')){
        //  isMloAssembly = true;
        // }else{
        //  isMloAssembly = false;
        // }

        var childAssembly = "";
        if (dataObj.SubAssembies.length != 0) {
          childAssembly = dataObj.SubAssembies[0].split("_")[0]; //
        }
        var parentAssembly = dataObj.subassembly.split("_")[0]; //SM
        if (
          (parentAssembly == "SM" || parentAssembly == "FM") &&
          childAssembly != "SM" &&
          childAssembly != "FM"
        ) {
          isMloAssembly = true;
        } else {
          isMloAssembly = false;
        }

        /*
         * if(isFA) { bomName =toolName +"-PCB-"+fabRevision; }
         */
        log.debug("bomName", bomName); //2020808-IL_4-7-R0A-4

        var bom = runtime.getCurrentScript().getParameter({
          name: "custscript_cntm_existing_bom",
        });
        log.debug("---bom", bom);

        var boardsPerPanel = runtime.getCurrentScript().getParameter({
          name: "custscript_cntm_boardsperpanel",
        });
        boardsPerPanel = boardsPerPanel ? boardsPerPanel : 1;
        log.debug("---boardsPerPanel", boardsPerPanel);

        var oData = {};
        if (isNewRouting == false || isNewRouting == "false") {
          var bom_fileObj = file.load({
            id: parseInt(bom_file),
          });
          var bom_iterator = bom_fileObj.lines.iterator();
          bom_iterator.each(function (line) {
            var body = line.value;
            // log.debug('body :',body);
            // body=body.replace(/"/g, "");

            var fileData = CSVToArray(line.value, ","); // body.split(',');
            // log.debug('fileData :',fileData);

            oData = getDec(fileData, oData, 10, 34);
            oData = getDec(fileData, oData, 11, 35);
            oData = getDec(fileData, oData, 12, 36);
            oData = getDec(fileData, oData, 13, 37);

            return true;
          });
        }

        log.audit(":oData", JSON.stringify(oData));
        var errFile = runtime.getCurrentScript().getParameter({
          name: "custscript_cntm_err_file",
        });
        // /BOM
        // Revision
        // Creation
        // Process
        if (isRoutingProcess == false || isRoutingProcess == "false") {
          //
          if (
            fabStatus == "" ||
            fabStatus == null ||
            parseInt(fabStatus) == 10 ||
            parseInt(fabStatus) == 9
          ) {
            // 3
            // BOM
            // Revision Creation
            // In Progress
            var processRev = true;

            var errored = false;
            if (parseInt(fabStatus) == 10) {
              processRev = reprocessErr(errFile, bomName);
            }
            if (processRev == true) {
              if (subassembly != "" && subassembly != null) {
                try {
                  var bomrevision_obj;
                  if (isReprocess == true || isReprocess == "true") {
                    var rev = getRevisionCount(bomInternalId, "rev");
                    log.debug("rev", rev);
                    if (rev) {
                      /*
                       * // if(isFA==true){
                       * bomrevision_obj = record
                       * .load({ type :
                       * 'bomrevision', id : rev,
                       * isDynamic : true }); var
                       * lines = bomrevision_obj
                       * .getLineCount({ sublistId :
                       * 'component' });
                       * log.debug('lines',
                       * lines); for (var j =
                       * lines - 1; j >= 0; j--) {
                       * log.debug('j', j); //
                       * if(j!=lines-1)
                       * bomrevision_obj
                       * .removeLine({ sublistId :
                       * 'component', line : j,
                       * ignoreRecalc : true });
                       * log.debug('j', j); }
                       *
                       * }else{
                       */
                      var deletedId = record.delete({
                        type: "bomrevision",
                        id: rev,
                      });
                      log.audit("deletedId", deletedId);
                      // }
                    }
                  } // else {
                  if (!bomrevision_obj) {
                    var startDate = new Date();
                    startDate.setDate(startDate.getDate() - 1);
                    var endDate = new Date();
                    endDate.setDate(endDate.getDate() - 1);
                    var bomrevision_obj = record.create({
                      type: "bomrevision",
                      isDynamic: true,
                    });
                    var revCount1 = getRevisionCount(bomInternalId, "count");

                    revCount1 = Number(revCount1) + 1;
                    bomrevision_obj.setValue({
                      fieldId: "name",
                      value: "Rev " + revCount1,
                    });
                    bomrevision_obj.setValue({
                      fieldId: "billofmaterials",
                      value: bomInternalId,
                    });
                    bomrevision_obj.setValue({
                      fieldId: "effectivestartdate",
                      value: startDate,
                    });
                  }
                  // }
                  log.debug("oData[" + subassembly + "]", oData[subassembly]);
                  log.audit("bomParentItems", bomParentItems);

                  var missingComponents = [];
                  for (var t = 0; t < bomParentItems.length; t++) {
                    var lotItemName = toolName + "-";
                    if (isCon == true || isCon == "true") lotItemName += "CON-";
                    lotItemName += bomParentItems[t];
                    if (bomParentItems[t]) {
                      var assemblyTypeArr1 = bomParentItems[t].split("_");
                      var assemblyType1 = assemblyTypeArr1[0];
                      if (assemblyType1 == "FA") {
                        lotItemName = "RD-" + toolName;
                        if (isCon == true || isCon == "true")
                          lotItemName += "-CON";
                        else lotItemName += "-PCB";
                      }
                    }
                    log.debug("lotItemName", lotItemName);
                    var parentAssemblyId = getLotNumberItem(lotItemName);
                    log.debug("parentAssemblyId", parentAssemblyId);
                    if (parentAssemblyId) {
                      bomrevision_obj.selectNewLine({
                        sublistId: "component",
                      });
                      bomrevision_obj.setCurrentSublistValue({
                        sublistId: "component",
                        fieldId: "item",
                        value: parentAssemblyId,
                      });
                      bomrevision_obj.setCurrentSublistValue({
                        sublistId: "component",
                        fieldId: "bomquantity",
                        value: 1,
                      });
                      //added a condtion to set STOCK or WO according to Assembly item
                      if (isMloAssembly) {
                        log.debug("IF CONDITION");
                        bomrevision_obj.setCurrentSublistText({
                          sublistId: "component",
                          fieldId: "itemsource",
                          text: "Stock",
                        });
                      } else {
                        log.debug("ELSE CONDITION");
                        bomrevision_obj.setCurrentSublistText({
                          //NEED TO LOOK HERE
                          sublistId: "component",
                          fieldId: "itemsource",
                          text: "Work Order",
                        });
                      }

                      bomrevision_obj.commitLine({
                        sublistId: "component",
                      });
                    } else {
                      missingComponents.push(lotItemName);
                      // log.error("Parent Item",
                      // "Item not found");
                    }
                  }
                  // log.debug('map:oData
                  // subassembly='+subassembly,JSON.stringify(oData)); F1056380.txt  download  Edit
                  if (oData[subassembly] != "" && oData[subassembly] != null) {
                    for (var component in oData[subassembly]) {
                      // log.debug(
                      //   "itemQty-boardsPerPanel",
                      //   oData[subassembly][component]["qty"] +
                      //   ", " +
                      //   boardsPerPanel
                      // );
                      var itemQty =
                        Math.trunc(
                          10000 *
                            (oData[subassembly][component]["qty"] /
                              boardsPerPanel)
                        ) / 10000;
                      // .toFixed(4);
                      // log.debug("itemQty", itemQty);
                      if (itemQty == 0) itemQty = 1;
                      try {
                        if (
                          component != "" &&
                          component != null &&
                          component != "F"
                        ) {
                          var compItem = getitem(component);
                          if (compItem) {
                            // log.debug("compItem", compItem);
                            bomrevision_obj.selectNewLine({
                              sublistId: "component",
                            });
                            bomrevision_obj.setCurrentSublistValue({
                              sublistId: "component",
                              fieldId: "item",
                              value: compItem,
                            });
                            bomrevision_obj.setCurrentSublistValue({
                              sublistId: "component",
                              fieldId: "bomquantity",
                              value: itemQty,
                            });
                            bomrevision_obj.setCurrentSublistText({
                              sublistId: "component",
                              fieldId: "itemsource",
                              text: "Stock",
                            });
                            bomrevision_obj.commitLine({
                              sublistId: "component",
                            });
                          } else {
                            missingComponents.push(component);

                            log.error("Missing Comp", component);
                          }
                        } else if (component != "F") {
                          missingComponents.push(component);
                          log.error("oData comp missing", component);
                        }
                      } catch (e) {
                        log.error("ERROR :bomrevision component", e);
                        var obj = {
                          Error: e.message,
                          status: 10,
                        };
                        var params1 = {};
                        params1.custrecord_cntm_status_fab_wo_crtn = 10;

                        record.submitFields({
                          type: "customrecord_cntm_wo_bom_import_fab",
                          id: fabRecordId,
                          values: params1,
                          options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true,
                          },
                        });
                        reduceContext.write({
                          key: bomName,
                          value: obj,
                        });
                      }
                    }
                  } else if (isFA == false && bomParentItems.length == 0) {
                    // else
                    // if
                    // (isFA
                    // ==
                    // false)
                    // {
                    errored = true;
                    log.error(
                      "Error",
                      "BOM file and Dependency file doesent match" + subassembly
                    );
                    var obj = {
                      Error:
                        "BOM file and Dependency file doesent match for " +
                        subassembly,
                      status: 10,
                    };
                    reduceContext.write({
                      key: bomName,
                      value: obj,
                    });
                  }
                  if (missingComponents.length > 0) {
                    var obj = {
                      Error: "Components are not in NS to create Revision",
                      missingComponents: missingComponents,
                      status: 10,
                    };
                    log.error(
                      "error",
                      "Components are not in NS to create Revision"
                    );
                    // err['10'] = obj;
                    /*
                     * 'Components Missing:
                     * '+missingComponents.join();
                     */
                    /*
                     * var params1 = {};
                     * params1.custrecord_cntm_status_fab_wo_crtn =
                     * 10;
                     *
                     * record .submitFields({ type :
                     * 'customrecord_cntm_wo_bom_import_fab',
                     * id : fabRecordId, values :
                     * params1, options : {
                     * enableSourcing : false,
                     * ignoreMandatoryFields : true }
                     * });
                     */
                    reduceContext.write({
                      key: bomName,
                      value: obj,
                    });
                    /*
                     * var params = {};
                     * params.custrecord_cntm_status_fab_wo_crtn =
                     * '10';
                     * params.custrecord_cntm_error_fab =
                     * 'Components Missing:
                     * '+missingComponents.join();
                     * record .submitFields({ type :
                     * 'customrecord_cntm_wo_bom_import_fab',
                     * id : fabRecordId, values :
                     * params, options : {
                     * enableSourcing : false,
                     * ignoreMandatoryFields : true }
                     * });
                     */
                  } else {
                    if (errored == false) {
                      checkAndUpdateOverlapingDates(
                        endDate,
                        startDate,
                        bomInternalId
                      );
                      var bomRevisionInternalId = bomrevision_obj.save({
                        ignoreMandatoryFields: true,
                        enableSourcing: true,
                      });

                      log.audit("---BOM REVISION SAVE---");

                      /*
                       * if (isFA &&
                       * bomRevisionInternalId) {
                       * var params1 = {}; //
                       * params1.custrecord_cntm_status_fab_wo_crtn // =
                       * 4; //
                       * params1.custrecord_cntm_error_fab // =
                       * "";
                       * params1.custrecord_bom_revision_id =
                       * bomRevisionInternalId;
                       *
                       * record .submitFields({
                       * type :
                       * 'customrecord_cntm_wo_bom_import_fab',
                       * id : fabRecordId, values :
                       * params1, options : {
                       * enableSourcing : false,
                       * ignoreMandatoryFields :
                       * true } }); }
                       */
                      var obj = {
                        Success: "BOM Rev",
                        status: fabStatus,
                      };
                      reduceContext.write({
                        key: bomName,
                        value: obj,
                      });
                    }
                  }
                } catch (e) {
                  // log.error("ERROR WHILE CREATION
                  // BOM
                  // REVISION
                  // RECORD",e);
                  log.error({
                    title: " BOM_REVISION CREATION Error : " + bomName,
                    details: e.message,
                  });
                  var obj = {
                    Error: e.message,
                    status: 10,
                  };
                  reduceContext.write({
                    key: bomName,
                    value: obj,
                  });
                  /*
                   * var ErrorMessage = "BOM Name : " +
                   * bomName + ", Error : " +
                   * e.message; if
                   * (ErrorMessage.length > 300)
                   * ErrorMessage = ErrorMessage
                   * .slice(0, 300); var params = {};
                   * params.custrecord_cntm_status_fab_wo_crtn =
                   * 10;
                   * params.custrecord_cntm_error_fab =
                   * ErrorMessage; record
                   * .submitFields({ type :
                   * 'customrecord_cntm_wo_bom_import_fab',
                   * id : fabRecordId, values :
                   * params, options : {
                   * enableSourcing : false,
                   * ignoreMandatoryFields : true }
                   * });
                   */
                }
              }
            } else {
              var obj = {
                Success: "BOM Rev",
                status: fabStatus,
              };
              reduceContext.write({
                key: bomName,
                value: obj,
              });
            }
          }
        } else {
          log.debug("fabStatus", fabStatus);
          /*
           * if (fabStatus == '' || fabStatus == null ||
           * fabStatus == 12 || fabStatus == 10 || fabStatus ==
           * 9)
           */ {
            // /Routing Creation Process

            var routingName = bomName;
            if (!bomInternalId || bomInternalId == "null") {
              var filter = new Array();
              var column = new Array();
              var itemid = "";
              filter.push(
                search.createFilter({
                  name: "name",
                  operator: "is",
                  values: bomName,
                })
              );
              column.push(
                search.createColumn({
                  name: "internalid",
                })
              );
              var itemSearchObj = search.create({
                type: "bom",
                filters: filter,
                columns: column,
              });
              var searchResultCount = itemSearchObj.runPaged().count;
              itemSearchObj.run().each(function (result) {
                bomInternalId = result.getValue({
                  name: "internalid",
                });
                // .run().each has a limit of 4,000
                // results
              });
            }
            var manufacturingroutingSearchObj = search.create({
              type: "manufacturingrouting",
              filters: [
                ["billofmaterials", "anyof", bomInternalId],
                "AND",
                ["name", "startswith", routingName],
              ],
              columns: [
                search.createColumn({
                  name: "name",
                  // sort : search.Sort.ASC,
                  label: "Name",
                }),
                search.createColumn({
                  name: "billofmaterials",
                  label: "Bill of Materials",
                }),
                search.createColumn({
                  name: "internalid",
                  sort: search.Sort.DESC,
                  label: "Internal Id",
                }),
                search.createColumn({
                  name: "location",
                  label: "Location",
                }),
              ],
            });
            var searchResultCount = manufacturingroutingSearchObj.runPaged()
              .count;
            log.debug(
              "manufacturingroutingSearchObj result count",
              searchResultCount
            );
            // var reprocessRoutingName = routingName;

            if (searchResultCount > 0) {
              if (isReprocess == true || isReprocess == "true")
                routingName = routingName + " " + (searchResultCount - 1);
              else routingName = routingName + " " + searchResultCount;
              /*
               * reprocessRoutingName = routingName + ' ' +
               * (searchResultCount - 1);
               */
            }

            var arrOprtnForCORE = runtime.getCurrentScript().getParameter({
              name: "custscript_cntm_oprtn_type_core",
            });

            arrOprtnForCORE = arrOprtnForCORE ? arrOprtnForCORE.split(",") : [];
            log.debug("arrOprtnForCORE :", arrOprtnForCORE);

            var arrOprtnForBSTAGEorFOIL = runtime
              .getCurrentScript()
              .getParameter({ name: "custscript_cntm_oprtn_type_bstage_foil" });
            arrOprtnForBSTAGEorFOIL = arrOprtnForBSTAGEorFOIL
              ? arrOprtnForBSTAGEorFOIL.split(",")
              : [];
            var arrOprtnForASMorNoType = runtime
              .getCurrentScript()
              .getParameter({ name: "custscript_cntm_oprtn_type_asm_no_type" });
            arrOprtnForASMorNoType = arrOprtnForASMorNoType
              ? arrOprtnForASMorNoType.split(",")
              : [];
            var oprtnForCORE;
            var oprtnForBSTAGEorFOIL;
            var oprtnForASMorNoType;
            var oprtnForCORESeq;
            var oprtnForBSTAGEorFOILSeq;
            var oprtnForASMorNoTypeSeq;
            if (routingFileId) {
              try {
                // if (fabStatus == 4) {
                var processRev = true;
                if (parseInt(fabStatus) == 12) {
                  processRev = reprocessErr(
                    errFile,
                    routingName
                    /* reprocessRoutingName */
                  );
                }
                if (processRev == true) {
                  record.submitFields({
                    type: "customrecord_cntm_wo_bom_import_fab",
                    id: fabRecordId,
                    values: {
                      custrecord_cntm_status_fab_wo_crtn: 5,
                      custrecord_cntm_error_fab: "",
                    },
                    options: {
                      enableSourcing: false,
                      ignoreMandatoryFields: true,
                    },
                  });
                  // }
                  var instructions = ""; // Instructions
                  var oprationNames = new Array();
                  var opration_Instructions = {};
                  // var oData = {};
                  var routing_fileObj = file.load({
                    id: parseInt(routingFileId),
                  });
                  var routing_iterator = routing_fileObj.lines.iterator();
                  defaultRouting(bomInternalId);
                  var routing_obj;
                  if (isReprocess == true || isReprocess == "true") {
                    var manufacturingroutingSearchObj = search.create({
                      type: "manufacturingrouting",
                      filters: [
                        ["billofmaterials", "anyof", bomInternalId],
                        "AND",
                        ["name", "startswith", bomName],
                      ],
                      columns: [
                        search.createColumn({
                          name: "name",
                          // sort
                          // :
                          // search.Sort.ASC,
                          label: "Name",
                        }),
                        search.createColumn({
                          name: "billofmaterials",
                          label: "Bill of Materials",
                        }),
                        search.createColumn({
                          name: "internalid",
                          sort: search.Sort.DESC,
                          label: "Internal Id",
                        }),
                        search.createColumn({
                          name: "location",
                          label: "Location",
                        }),
                      ],
                    });
                    var searchResultCount = manufacturingroutingSearchObj.runPaged()
                      .count;
                    log.debug(
                      "manufacturingroutingSearchObj result count",
                      searchResultCount
                    );
                    // var reprocessRoutingName =
                    // routingName;
                    var oldMfg;
                    if (searchResultCount > 0) {
                      manufacturingroutingSearchObj
                        .run()
                        .each(function (result) {
                          oldMfg = result.getValue({
                            name: "internalid",
                          });
                          return false;
                        });
                    }
                    // var rev =
                    // getRevisionCount(bomInternalId,'rev');
                    if (oldMfg) {
                      var routLookup = search.lookupFields({
                        type: "manufacturingrouting",
                        id: oldMfg,
                        columns: ["name"],
                      });
                      routingName = routLookup.name;
                      var deletedId = record.delete({
                        type: record.Type.MANUFACTURING_ROUTING,
                        id: oldMfg,
                      });

                      log.debug("mfg deletedId", deletedId);
                      // }
                    }
                  }

                  //Creating ROUTING here
                  if (!routing_obj) {
                    routing_obj = record.create({
                      type: record.Type.MANUFACTURING_ROUTING,
                      isDynamic: true,
                    });
                    routing_obj.setValue({
                      fieldId: "name",
                      value: routingName,
                    });
                    routing_obj.setValue({
                      fieldId: "subsidiary",
                      value: 2,
                      // value: 3,
                    });
                    routing_obj.setValue({
                      //here to set location as per req.
                      fieldId: "location",
                      value: fabLocation,
                      // value: 9,
                    }); // 4
                    routing_obj.setValue({
                      fieldId: "billofmaterials",
                      value: bomInternalId,
                    });
                    routing_obj.setValue({
                      fieldId: "isdefault",
                      value: true,
                    });
                    routing_obj.setValue({
                      fieldId: "custrecord_cntm_fab_boards_per_panel",
                      value: boardsPerPanel,
                    });
                    routing_obj.setValue({
                      fieldId: "custrecord_cntm_fabrec_id",
                      value: fabRecordId,
                    });
                  }
                  var column = new Array();
                  column.push(
                    search.createColumn({
                      name: "custrecord_work_center_",
                      label: "Work Center",
                    })
                  );
                  column.push(
                    search.createColumn({
                      name: "custrecord8",
                      label: "Cost Template",
                    })
                  );
                  column.push(
                    search.createColumn({
                      name: "custrecord_wip_setup_",
                      label: "WIP SetUp",
                    })
                  );
                  column.push(
                    search.createColumn({
                      name: "custrecord_wip_time_",
                      label: "WIP Time",
                    })
                  );
                  column.push(
                    search.createColumn({
                      name: "custrecord_cntm_no_use_rout_operation",
                      // label : "WIP Time"
                    })
                  );
                  var opSequence = 10;
                  var errorObjArr = new Array();
                  var instObj = {};
                  var opSequenceArr = [];
                  opSequenceArr.push(opSequence);
                  routing_iterator.each(function (line) {
                    var body = line.value;
                    var bodyArray = body.split("|");
                    var item = bodyArray[1];
                    if (item == subassembly) {
                      var OPERATION_SEQUENCE = bodyArray[2];
                      var GATE_ID = bodyArray[5];
                      var GATE_DESCRIPTION = bodyArray[6]
                        ? bodyArray[6].replace(/,/g, " ")
                        : " ";
                      GATE_DESCRIPTION = GATE_DESCRIPTION.trim();
                      // var
                      // GATE_DESCRIPTION=bodyArray[6];
                      // log.debug('oprationNames',oprationNames);
                      oprationNames.push(GATE_ID + "-" + GATE_DESCRIPTION);
                      opration_Instructions[opSequence] = [];
                      var GATE_Instructions = "";
                      var lastOp = opSequenceArr[opSequenceArr.length - 2];
                      if (bodyArray.length > 7) {
                        var lastArrIndex = Number(oprationNames.length) - 1;
                        var lastOPName = oprationNames[lastArrIndex];

                        GATE_Instructions = bodyArray[7]
                          ? bodyArray[7].replace(/,/g, " ")
                          : bodyArray[7];
                        GATE_Instructions = GATE_Instructions.trim();

                        opration_Instructions[lastOp].push(GATE_Instructions);
                      }

                      if (GATE_ID) {
                        // log.debug('OPERATION_SEQUENCE',OPERATION_SEQUENCE);
                        var operation_name = GATE_ID + "-" + GATE_DESCRIPTION;
                        var gateDescription = GATE_DESCRIPTION;
                        // var
                        // operation_sequnce
                        // =
                        // OPERATION_SEQUENCE;
                        // log.debug('operation_name='+operation_name,"operation_sequnce="+operation_sequnce);

                        if (arrOprtnForCORE.indexOf(operation_name) > -1) {
                          if (
                            !oprtnForCORE ||
                            arrOprtnForCORE.indexOf(oprtnForCORE) >
                              arrOprtnForCORE.indexOf(operation_name)
                          ) {
                            oprtnForCORE = operation_name;
                            oprtnForCORESeq = opSequence;
                          }
                        }
                        if (
                          arrOprtnForBSTAGEorFOIL.indexOf(operation_name) > -1
                        ) {
                          if (
                            !oprtnForBSTAGEorFOIL ||
                            arrOprtnForBSTAGEorFOIL.indexOf(
                              oprtnForBSTAGEorFOIL
                            ) > arrOprtnForBSTAGEorFOIL.indexOf(operation_name)
                          ) {
                            oprtnForBSTAGEorFOIL = operation_name;
                            oprtnForBSTAGEorFOILSeq = opSequence;
                          }
                        }
                        if (
                          arrOprtnForASMorNoType.indexOf(operation_name) > -1
                        ) {
                          if (
                            !oprtnForASMorNoType ||
                            arrOprtnForASMorNoType.indexOf(
                              oprtnForASMorNoType
                            ) > arrOprtnForASMorNoType.indexOf(operation_name)
                          ) {
                            oprtnForASMorNoType = operation_name;
                            oprtnForASMorNoTypeSeq = opSequence;
                          }
                        }

                        var filter = new Array();
                        filter.push(
                          search.createFilter({
                            name: "custrecord_gate_",
                            operator: "contains",
                            values: GATE_ID,
                          })
                        );
                        filter.push(
                          search.createFilter({
                            name: "custrecord_name_",
                            operator: "is",
                            values: gateDescription,
                          })
                        );
                        /*
                         * filter
                         * .push(search
                         * .createFilter({
                         * name
                         * :"custrecord_cntm_no_use_rout_operation",
                         * operator
                         * :"is", values
                         * :"F" }));
                         */
                        var operations_SearchObj = search.create({
                          type: "customrecord_gate_times_and_operations_",
                          filters: filter,
                          columns: column,
                        });
                        var searchResultCount = operations_SearchObj.runPaged()
                          .count;
                        // log.debug('gateId='+
                        // GATE_ID,'searchResultCount='+
                        // searchResultCount);
                        if (searchResultCount > 0) {
                          operations_SearchObj.run().each(function (result) {
                            var doNotUse = result.getValue(result.columns[4]);
                            //log.audit('doNotUse',doNotUse);
                            if (doNotUse == false || doNotUse == "F") {
                              var workcenter = result.getValue(
                                result.columns[0]
                              );
                              var costtemplate = result.getValue(
                                result.columns[1]
                              );
                              var setuptime = result.getValue(
                                result.columns[2]
                              );
                              var runrate = result.getValue(result.columns[3]);
                              runrate = runrate / boardsPerPanel;
                              // log.debug('runrate',runrate);
                              // log.debug('workcenter'+
                              // workcenter+
                              // "costtemplate"+
                              // costtemplate,'setuptime'+
                              // setuptime+
                              // 'runrate'+
                              // runrate);
                              if (
                                workcenter &&
                                costtemplate &&
                                (setuptime || setuptime == 0) &&
                                (runrate || runrate == 0)
                              ) {
                                try {
                                  routing_obj.selectNewLine({
                                    sublistId: "routingstep",
                                  });
                                  routing_obj.setCurrentSublistValue({
                                    sublistId: "routingstep",
                                    fieldId: "operationsequence",
                                    value: opSequence,
                                  }); // operation_sequnce
                                  routing_obj.setCurrentSublistValue({
                                    sublistId: "routingstep",
                                    fieldId: "operationname",
                                    value: operation_name,
                                  });
                                  routing_obj.setCurrentSublistValue({
                                    sublistId: "routingstep",
                                    fieldId: "manufacturingworkcenter",
                                    value: workcenter,
                                  });
                                  routing_obj.setCurrentSublistValue({
                                    sublistId: "routingstep",
                                    fieldId: "manufacturingcosttemplate",
                                    value: costtemplate,
                                  });
                                  routing_obj.setCurrentSublistValue({
                                    sublistId: "routingstep",
                                    fieldId: "runrate",
                                    value: runrate,
                                  });
                                  routing_obj.setCurrentSublistValue({
                                    sublistId: "routingstep",
                                    fieldId: "setuptime",
                                    value: setuptime,
                                  });
                                  routing_obj.commitLine({
                                    sublistId: "routingstep",
                                  });
                                } catch (e) {
                                  log.error(
                                    "workcenter=" +
                                      workcenter +
                                      "  costtemplate=" +
                                      costtemplate,
                                    "setuptime=" +
                                      setuptime +
                                      "  runrate=" +
                                      runrate
                                  );
                                  log.error({
                                    title: "Routing Line Error:" + e.name,
                                    details: e.message,
                                  });
                                  var params = {};
                                  params.custrecord_cntm_status_fab_wo_crtn = 12;
                                  params.custrecord_cntm_error_fab = e.message;
                                  record.submitFields({
                                    type: "customrecord_cntm_wo_bom_import_fab",
                                    id: fabRecordId,
                                    values: params,
                                    options: {
                                      enableSourcing: false,
                                      ignoreMandatoryFields: true,
                                    },
                                  });
                                  var obj1 = {};
                                  obj1.routingName = routingName;
                                  obj1.gateId = GATE_ID;
                                  obj1.opSequence = opSequence;
                                  obj1.Error = e.message;
                                  obj1.status = 12;
                                  log.debug("errorObjArr", errorObjArr);
                                  errorObjArr.push(e.message);
                                }

                                opSequence = Number(opSequence) + 10;
                                opSequenceArr.push(opSequence);
                                // log.debug('opSequence',opSequence);
                              } else {
                                log.error("error", "Missing Gate Time Details");
                                var obj1 = {};
                                obj1.routingName = routingName;
                                obj1.gateId = GATE_ID;
                                obj1.opSequence = opSequence;
                                obj1.Error = "Missing Gate Time Details";
                                obj1.status = 12;
                                log.debug("errorObjArr", errorObjArr);
                                errorObjArr.push(
                                  "Missing Gate Time Details for Gate Id: " +
                                    GATE_ID
                                );
                              }
                            }
                          });
                        } else {
                          log.error("error", "Missing Gate Time Record");
                          errorObjArr.push(
                            "Record for Gate ID and Gate Description could not be found in NetSuite for" +
                              GATE_ID
                          );
                        }
                      } else {
                        if (GATE_Instructions) {
                          if (!instObj[lastOp]) instObj[lastOp] = "";
                          instObj[lastOp] =
                            "" + opration_Instructions[lastOp].join("\n");
                          // log.debug(
                          // 'operation_name
                          // = '
                          // + GATE_ID
                          // + '-'
                          // +
                          // GATE_DESCRIPTION,
                          // "Instructions
                          // = "
                          // +
                          // opration_Instructions[lastOp]);
                        }
                      }
                    }
                    return true;
                  });
                  log.debug("reduce:oData", JSON.stringify(oData));
                  if (instObj) {
                    var instructionsStr = JSON.stringify(instObj);
                    // log.debug("instObj", instructionsStr);
                    routing_obj.setValue({
                      fieldId: "custrecord_routing_instructions",
                      value: instructionsStr,
                    });
                  }
                  // log.error('errorObjArr.length',errorObjArr.length);
                  if (errorObjArr.length == 0) {
                    var lineCount = routing_obj.getLineCount({
                      sublistId: "routingcomponent",
                    });
                    if (lineCount > 0) {
                      for (var compLine = 0; compLine < lineCount; compLine++) {
                        var compItem = routing_obj.getSublistValue({
                          sublistId: "routingcomponent",
                          fieldId: "itemname",
                          line: compLine,
                        });
                        if (subassembly in oData) {
                          if (compItem in oData[subassembly]) {
                            var type = oData[subassembly][compItem].type;
                            // log.debug(
                            // 'type',
                            // type);
                            routing_obj.selectLine({
                              sublistId: "routingcomponent",
                              line: compLine,
                            });
                            switch (true) {
                              case type == "CORE":
                                if (!oprtnForCORESeq) oprtnForCORESeq = 10;
                                routing_obj.setCurrentSublistValue({
                                  sublistId: "routingcomponent",
                                  fieldId: "operationsequencenumber",
                                  value: oprtnForCORESeq,
                                });
                                break;
                              case type == "B-STAGE" || type == "FOIL":
                                if (!oprtnForBSTAGEorFOILSeq)
                                  oprtnForBSTAGEorFOILSeq = 10;
                                routing_obj.setCurrentSublistValue({
                                  sublistId: "routingcomponent",
                                  fieldId: "operationsequencenumber",
                                  value: oprtnForBSTAGEorFOILSeq,
                                });
                                break;
                              case !type:
                                if (!oprtnForASMorNoTypeSeq)
                                  oprtnForASMorNoTypeSeq = 10;
                                routing_obj.setCurrentSublistValue({
                                  sublistId: "routingcomponent",
                                  fieldId: "operationsequencenumber",
                                  value: oprtnForASMorNoTypeSeq,
                                });
                                break;
                            }
                            routing_obj.commitLine({
                              sublistId: "routingcomponent",
                            });
                          } else {
                            routing_obj.selectLine({
                              sublistId: "routingcomponent",
                              line: compLine,
                            });
                            if (!oprtnForASMorNoTypeSeq)
                              oprtnForASMorNoTypeSeq = 10;
                            routing_obj.setCurrentSublistValue({
                              sublistId: "routingcomponent",
                              fieldId: "operationsequencenumber",
                              value: oprtnForASMorNoTypeSeq,
                            });
                            routing_obj.commitLine({
                              sublistId: "routingcomponent",
                            });
                          }
                        } else {
                          routing_obj.selectLine({
                            sublistId: "routingcomponent",
                            line: compLine,
                          });
                          if (!oprtnForASMorNoTypeSeq)
                            oprtnForASMorNoTypeSeq = 10;
                          routing_obj.setCurrentSublistValue({
                            sublistId: "routingcomponent",
                            fieldId: "operationsequencenumber",
                            value: oprtnForASMorNoTypeSeq,
                          });
                          routing_obj.commitLine({
                            sublistId: "routingcomponent",
                          });
                        }
                      }
                    }
                  }
                  if (errorObjArr.length > 0) {
                    var obj = {
                      Error: "Error while operation lines",

                      errorObjArr: errorObjArr,
                      status: 12,
                    };
                    reduceContext.write({
                      key: routingName,
                      value: obj,
                    });
                  } else {
                    var routingId = routing_obj.save({
                      ignoreMandatoryFields: true,
                      enableSourcing: true,
                    });
                    log.audit("---ROUTING  SAVE---", routingId);

                    if (routingId && isFA) {
                      record.submitFields({
                        type: "customrecord_cntm_wo_bom_import_fab",
                        id: fabRecordId,
                        values: {
                          // "custrecord_cntm_status_fab_wo_crtn"
                          // : 6,
                          // "custrecord_cntm_error_fab"
                          // : "",
                          custrecord_cntm_mfg_routing_fab: routingId,
                        },
                        options: {
                          enableSourcing: false,
                          ignoreMandatoryFields: true,
                        },
                      });
                    }

                    var obj = {
                      Success: "Routing",
                      status: fabStatus,
                    };
                    reduceContext.write({
                      key: routingName,
                      value: obj,
                    });
                  }
                } else {
                  var obj = {
                    Success: "Routing",
                    status: fabStatus,
                  };
                  reduceContext.write({
                    key: routingName,
                    value: obj,
                  });
                }
              } catch (e) {
                // log.error("ERROR WHILE CREATION
                // Manufacturing
                // Routing RECORD",e);
                log.error({
                  title: "CREATION Manufacturing Routing Error:" + e.name,
                  details: e.message,
                });
                var obj = {
                  Error: e.message,
                  status: 12,
                };
                reduceContext.write({
                  key: routingName,
                  value: obj,
                });
                /*
                 * var ErrorMessage = "BOM Name : " +
                 * bomName + ", Error : " + e.message;
                 * if (ErrorMessage.length > 300)
                 * ErrorMessage = ErrorMessage.slice( 0,
                 * 300); var params = {};
                 * params.custrecord_cntm_status_fab_wo_crtn =
                 * '12';
                 * params.custrecord_cntm_error_fab =
                 * ErrorMessage; record .submitFields({
                 * type :
                 * 'customrecord_cntm_wo_bom_import_fab',
                 * id : fabRecordId, values : params,
                 * options : { enableSourcing : false,
                 * ignoreMandatoryFields : true } });
                 */
              }
            } else {
              record.submitFields({
                type: "customrecord_cntm_wo_bom_import_fab",
                id: fabRecordId,
                values: {
                  custrecord_cntm_error_fab: "Routing File Id is not found ",
                },
                options: {
                  enableSourcing: false,
                  ignoreMandatoryFields: true,
                },
              });
            }
          }
        }
      }
      log.debug("----REDUCE END-----");
    } catch (e) {
      log.error("ERROR IS reduce stage", e);
      var obj = {};
      if (isRoutingProcess == true) {
        obj.status = 12;
      } else obj.status = 10;
      obj.Error = e.message;
      reduceContext.write({
        key: bomName,
        value: obj,
      });
    }
    log.audit("---REDUCE END---");
  }
  //function for multiple columnn in excel file 09-11-2022
  function getDec(fileData, oData, qtyIndex, compIndex) {
    if (!validateDataCSV(fileData[compIndex])) {
      return oData;
    }

    var item_qty = isNaN(parseInt(fileData[qtyIndex]))
      ? parseInt(0)
      : parseInt(fileData[qtyIndex]);
    // log.audit(fileData[0], fileData[1] + ' '+
    // fileData[34]);
    var item = fileData[0];
    item = item ? item.replace(/"/g, "") : "";
    var subitem = fileData[1];
    subitem = subitem ? subitem.replace(/"/g, "") : "";
    // log.debug("fileData[33]", fileData[33]);
    var component = fileData[compIndex]; // JSON.parse
    var type = fileData[3];
    // log.debug("--component", component);
    component = component ? component.replace(/"/g, "") : "";
    /*
     * log.audit('item' + item, "subitem" +
     * subitem + "----" + "component" +
     * component + '----' + "qty" + qty +
     * "------" + item_qty);
     */

    var qty = item_qty;
    if (qty == "" || qty == null || qty == NaN || qty == 0 || qty == "NaN") {
      qty = parseInt(1);
    }

    if (item) {
      if (typeof oData[subitem] === "undefined") {
        oData[subitem] = {};
      }
      if (typeof oData[subitem][component] === "undefined") {
        oData[subitem][component] = {
          qty: 0,
        };
      }
      /*
       * if(!type in oData[subitem]){
       * oData[subitem][type]=[]; }
       */
      // oData[subitem][type].push(component);
      oData[subitem][component]["type"] = type;
      oData[subitem][component]["item"] = item + "-" + subitem;
      oData[subitem][component]["qty"] += parseInt(qty);
    }
    return oData;
  }
  function reprocessErr(errFile, bomName) {
    var processRev = true;
    var errdBom = [];
    var error_fileObj = file.load({
      id: parseInt(errFile),
    });
    var error_fileObj = error_fileObj.lines.iterator();
    error_fileObj.each(function (line) {
      return false;
    });
    error_fileObj.each(function (line) {
      var lineData = line.value.split(",");
      errdBom.push(lineData[0]);
      return true;
    });
    if (errdBom.indexOf(bomName) <= -1) {
      processRev = false;
    }
    return processRev;
  }
  function checkAndUpdateOverlapingDates(endDate, startDate, bom) {
    // var date = convertDate(date);
    /*
     * var mySearch = search.load({ id :
     * 'customsearch_cntm_bom_rev_search' });
     */
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
        search.createColumn({
          name: "name",
          label: "Name",
        }),
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
    // log.debug('searchResult_', searchResult);
    if (searchResult > 0) {
      bomrevisionSearchObj.run().each(function (result) {
        // .run().each has a limit of
        // 4,000
        // results
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
        // log.audit('before endDate: ' +
        // endDate,'before startDate: ' + startDate);
        if (!startDate) {
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 1);
        }
        startDate.setDate(startDate.getDate() - 1);

        if (!endDate) {
          endDate = new Date();
          endDate.setDate(endDate.getDate() - 1);
        }
        endDate.setDate(endDate.getDate() - 1);
        // log.audit('after endDate: ' + endDate,'after
        // startDate: ' + startDate);
        checkAndUpdateOverlapingDates(endDate, startDate, bom);

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
        log.audit("---BOM REVISION 2 SAVE---");
        /*
         * record .submitFields({ type : 'bomrevision',
         * id : revId, values : { effectiveenddate :
         * convertDate(endDate), effectivestartdate :
         * convertDate(startDate) } });
         */

        return true;
      });
    }
  }
  /**
   * Defines the function that is executed when the summarize entry
   * point is triggered. This entry point is triggered automatically
   * when the associated reduce stage is complete. This function is
   * applied to the entire result set.
   *
   * @param {Object}
   *            summaryContext - Statistics about the execution of a
   *            map/reduce script
   * @param {number}
   *            summaryContext.concurrency - Maximum concurrency
   *            number when executing parallel tasks for the
   *            map/reduce script
   * @param {Date}
   *            summaryContext.dateCreated - The date and time when
   *            the map/reduce script began running
   * @param {boolean}
   *            summaryContext.isRestarted - Indicates whether the
   *            current invocation of this function is the first
   *            invocation (if true, the current invocation is not the
   *            first invocation and this function has been restarted)
   * @param {Iterator}
   *            summaryContext.output - Serialized keys and values
   *            that were saved as output during the reduce stage
   * @param {number}
   *            summaryContext.seconds - Total seconds elapsed when
   *            running the map/reduce script
   * @param {number}
   *            summaryContext.usage - Total number of governance
   *            usage units consumed when running the map/reduce
   *            script
   * @param {number}
   *            summaryContext.yields - Total number of yields when
   *            running the map/reduce script
   * @param {Object}
   *            summaryContext.inputSummary - Statistics about the
   *            input stage
   * @param {Object}
   *            summaryContext.mapSummary - Statistics about the map
   *            stage
   * @param {Object}
   *            summaryContext.reduceSummary - Statistics about the
   *            reduce stage
   * @since 2015.2
   */
  function summarize(summaryContext) {
    try {
      log.audit("---SUMMARIZE----");
      var errorObj = {};
      var errorArr = [];
      var ifBomErr = false;
      var errStatus;
      var status;
      var succRec = "";
      // var succRecName = '';
      summaryContext.output.iterator().each(function (key, value) {
        var values = JSON.parse(value);
        if (key == "Error") {
          ifBomErr = true;
        } else if ("Error" in values) {
          var err = "";
          var bomName = key;
          err = bomName + ",";
          // var status;
          log.debug("values.status", values.status);
          if ("status" in values) {
            errStatus = values.status;
          }

          if ("missingComponents" in values) {
            err +=
              "Components are not in NS to create Revision," +
              values.missingComponents.join();
            // +bomName
          } else if ("errorObjArr" in values) {
            err +=
              "Error while updating Operations," + values.errorObjArr.join();
          } else if ("Error" in values) {
            err += values.Error;
          }
          if (!errStatus in errorObj) errorObj[errStatus] = [];
          errorArr.push(err);
          // errorObj[status].push(err);
        } else if ("Success" in values) {
          succRec = values.Success;
          // succRecName = key;
          if ("status" in values) {
            status = values.status;
          }
        }
        return true;
      });
      var recId = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_curr_record_id",
      });
      log.debug("recId :", recId);

      var isInterco = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_is_interco_trans",
      });
      log.debug("isInterco :", isInterco);

      var isCon = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_is_con",
      });
      log.debug("isCon :", isCon);

      if (ifBomErr == false) {
        if (errorArr.length > 0) {
          var contents = "Name,Error\n" + errorArr.join("\n");

          var newFile = file.create({
            name: "Error File " + recId,
            fileType: file.Type.CSV,
            contents: contents,
            folder: 1676,
          });
          var id = newFile.save();
          log.debug("errStatus", errStatus);
          var params = {};
          params.custrecord_cntm_status_fab_wo_crtn = errStatus;
          params.custrecord_cntm_error_fab =
            "Please see attached file for Errors";
          params.custrecord_cntm_err_file = id;
          record.submitFields({
            type: "customrecord_cntm_wo_bom_import_fab",
            id: recId,
            values: params,
            options: {
              enableSourcing: false,
              ignoreMandatoryFields: true,
            },
          });
        } else {
          if (succRec == "BOM Rev") {
            record.submitFields({
              type: "customrecord_cntm_wo_bom_import_fab",
              id: recId,
              values: {
                custrecord_cntm_status_fab_wo_crtn: 4,
                custrecord_cntm_error_fab: "",
                "params.custrecord_cntm_err_file": "",
              },
              options: {
                enableSourcing: false,
                ignoreMandatoryFields: true,
              },
            });
            var routingFile = runtime.getCurrentScript().getParameter({
              name: "custscript_cntm_routing_file",
            });
            if (routingFile) {
              var scriptTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
              });
              scriptTask.scriptId = "customscript_mr_cntm_bom_creation";
              // scriptTask.deploymentId =
              // 'customdeploy_cntm_mr_qt_item_import';
              log.debug(
                "isReprocess to mfg",
                runtime.getCurrentScript().getParameter({
                  name: "custscript_cntm_is_reprocess",
                })
              );
              scriptTask.params = {
                custscript_cntm_bom_file: runtime
                  .getCurrentScript()
                  .getParameter({ name: "custscript_cntm_bom_file" }),
                custscript_cntm_dependancy_file: runtime
                  .getCurrentScript()
                  .getParameter({ name: "custscript_cntm_dependancy_file" }),
                custscript_cntm_routing_file: routingFile,
                custscript_cntm_tool_number: runtime
                  .getCurrentScript()
                  .getParameter({ name: "custscript_cntm_tool_number" }),
                custscript_cntm_curr_record_id: runtime
                  .getCurrentScript()
                  .getParameter({ name: "custscript_cntm_curr_record_id" }),
                custscript_cntm_existing_bom: runtime
                  .getCurrentScript()
                  .getParameter({ name: "custscript_cntm_existing_bom" }),
                custscript_cntm_is_routing: true,
                custscript_cntm_fab_status: runtime
                  .getCurrentScript()
                  .getParameter({ name: "custscript_cntm_fab_status" }),
                custscript_cntm_err_file: runtime
                  .getCurrentScript()
                  .getParameter({ name: "custscript_cntm_err_file" }),
                custscript_cntm_boardsperpanel: runtime
                  .getCurrentScript()
                  .getParameter({ name: "custscript_cntm_boardsperpanel" }),
                custscript_cntm_item_fab: runtime
                  .getCurrentScript()
                  .getParameter({
                    name: "custscript_cntm_item_fab",
                  }),
                custscript_cntm_is_reprocess: runtime
                  .getCurrentScript()
                  .getParameter({
                    name: "custscript_cntm_is_reprocess",
                  }),
                custscript_cntm_is_interco_trans: runtime
                  .getCurrentScript()
                  .getParameter({
                    name: "custscript_cntm_is_interco_trans",
                  }),
                custscript_cntm_is_con: runtime
                  .getCurrentScript()
                  .getParameter({
                    name: "custscript_cntm_is_con",
                  }),
              };

              var scriptTaskId = scriptTask.submit();
              log.audit("---MR CALLED---");
              var status = task.checkStatus(scriptTaskId).status;
              log.debug(scriptTaskId);
            } else {
              /*---chnge for routing set when no file
                                                                                                                                                                     /*
                    * var manufacturingroutingSearchObj =
                    * search .create({ type :
                    * "manufacturingrouting", filters : [ [
                    * "name", "startswith", succRecName ] ],
                    * columns : [ search .createColumn({ name :
                    * "name", sort : search.Sort.DESC, label :
                    * "Name" }), search .createColumn({ name :
                    * "billofmaterials", label : "Bill of
                    * Materials" }), search.createColumn({ name :
                    * "location", label : "Location" }) ] });
                    * var searchResultCount =
                    * manufacturingroutingSearchObj
                    * .runPaged().count; log .debug(
                    * "manufacturingroutingSearchObj result
                    * count", searchResultCount); // var
                    * reprocessRoutingName = routingName; var
                    * routingId; if (searchResultCount > 0) {
                    * bomrevisionSearchObj.run().each(
                    * function(result) { routingId = result.id;
                    * return false; }); }
                    */
              var params = {};
              params.custrecord_cntm_status_fab_wo_crtn = 6;
              params.custrecord_cntm_error_fab = "";
              params.custrecord_cntm_err_file = "";
              /*
               * if(routingId)
               * params.custrecord_cntm_mfg_routing_fab =
               * routingId;
               */
              record.submitFields({
                type: "customrecord_cntm_wo_bom_import_fab",
                id: recId,
                values: params,
                options: {
                  enableSourcing: false,
                  ignoreMandatoryFields: true,
                },
              });
            }
          }
          if (succRec == "Routing") {
            var params = {};
            params.custrecord_cntm_status_fab_wo_crtn = 6;
            params.custrecord_cntm_error_fab = "";
            params.custrecord_cntm_err_file = "";
            var isReprocess = runtime.getCurrentScript().getParameter({
              name: "custscript_cntm_is_reprocess",
            });
            log.audit("last isReprocess", isReprocess);
            if (isReprocess == true || isReprocess == "true")
              params.custscript_cntm_is_reprocess = false;
            record.submitFields({
              type: "customrecord_cntm_wo_bom_import_fab",
              id: recId,
              values: params,
              options: {
                enableSourcing: false,
                ignoreMandatoryFields: true,
              },
            });
          }
        }
      }
      log.audit("---SUMMARIZE END----");
    } catch (e) {
      log.error("error summary", e.message);
    }
  }
  function defaultRouting(bom) {
    var manufacturingroutingSearchObj = search.create({
      type: "manufacturingrouting",
      filters: [
        ["isdefault", "is", "T"],
        "AND",
        ["billofmaterials", "anyof", bom],
      ],
      columns: [
        search.createColumn({
          name: "name",
          sort: search.Sort.ASC,
          label: "Name",
        }),
      ],
    });
    var searchResultCount = manufacturingroutingSearchObj.runPaged().count;
    log.debug("manufacturingroutingSearchObj result count", searchResultCount);
    manufacturingroutingSearchObj.run().each(function (result) {
      // .run().each has a limit of 4,000 results
      record.submitFields({
        type: "manufacturingrouting",
        id: result.id,
        values: {
          isdefault: false,
        },
      });
      return true;
    });
  }
  function CSVToArray(strData, strDelimiter) {
    try {
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
          strMatchedValue = arrMatches[2].replace(new RegExp('""', "g"), '"');
        } else {
          strMatchedValue = arrMatches[3];
        }
        arrData.push(strMatchedValue);
      }
    } catch (e) {
      log.error("error:" + e.name, e.message);
    }
    return arrData;
  }
  return {
    getInputData: getInputData,
    map: map,
    reduce: reduce,
    summarize: summarize,
  };
  // get the
  function getsubassembly(subassembly) {
    // log.debug("getsubassembly",subassembly)
    var str = subassembly;
    if (subassembly) {
      var res = subassembly.indexOf("-");
      return str.slice(res + 1, str.length);
    }
  }
  // getting thr item internal id
  function getitem(itemname) {
    var filter = new Array();
    var column = new Array();
    var itemid = "";
    filter.push(
      search.createFilter({
        name: "name",
        operator: "is",
        values: itemname,
      })
    );
    column.push(
      search.createColumn({
        name: "internalid",
      })
    );
    var itemSearchObj = search.create({
      type: "item",
      filters: filter,
      columns: column,
    });
    var searchResultCount = itemSearchObj.runPaged().count;
    itemSearchObj.run().each(function (result) {
      itemid = result.getValue({
        name: "internalid",
      });
      // .run().each has a limit of 4,000 results
    });
    return itemid;
  }

  function getLotNumberItem(itemname) {
    var filter = new Array();
    var column = new Array();
    var itemid = "";
    filter.push(
      search.createFilter({
        name: "name",
        operator: "is",
        values: itemname,
      })
    );
    column.push(
      search.createColumn({
        name: "internalid",
      })
    );
    var itemSearchObj = search.create({
      type: "lotnumberedassemblyitem",
      filters: filter,
      columns: column,
    });
    var searchResultCount = itemSearchObj.runPaged().count;
    itemSearchObj.run().each(function (result) {
      itemid = result.getValue({
        name: "internalid",
      });
      // .run().each has a limit of 4,000 results
    });
    return itemid;
  }

  function getRevisionCount(bomId, rtrnVal) {
    var lineCount = 0;
    var filter = new Array();
    filter.push(
      search.createFilter({
        name: "name",
        operator: "startswith",
        values: "Rev",
      })
    );
    if (bomId) {
      filter.push(
        search.createFilter({
          name: "billofmaterials",
          operator: "anyof",
          values: bomId,
        })
      );
    } else {
      filter.push(
        search.createFilter({
          name: "name",
          join: "billofmaterials",
          operator: "contains",
          values: "PCB",
        })
      );
    }
    var column = new Array();
    column.push(
      search.createColumn({
        name: "internalid",
        sort: search.Sort.DESC,
      })
    );

    var bomRevSearchObj = search.create({
      type: "bomrevision",
      filters: filter,
      columns: column,
    });
    lineCount = bomRevSearchObj.runPaged().count;
    if (rtrnVal == "count") return lineCount;
    else {
      var rev;
      bomRevSearchObj.run().each(function (result) {
        rev = result.getValue({
          name: "internalid",
        });
        return false;
      });
      return rev;
    }
  }

  function itemConfigValues(itemType, lotItemRecord) {
    // try {
    log.debug("INSIDE itemConfigValues");
    log.debug("itemType IN FUNCTION:", itemType);
    log.debug("lotItemRecord IN FUNCTION", lotItemRecord);
    var itemConfigSearch = search.create({
      type: "customrecord_cntm_item_config",
      filters: [["name", "is", itemType]],
      columns: [
        search.createColumn({
          name: "custrecord_cntm_itemname_prefix",
          label: "Item Prefix from",
        }),
        search.createColumn({
          name: "custrecord_cntm_item_midval",
          label: "Item Middle Value From",
        }),
        search.createColumn({
          name: "custrecord_cntm_item_suffix",
          label: "Item Suffix from File",
        }),
        search.createColumn({
          name: "custrecord_cntm_dec_val",
          label: "Text For Description",
        }),
        search.createColumn({
          name: "custrecord_cntm_desc_suffix",
          label: "Description Suffix",
        }),
        search.createColumn({
          name: "custrecord_cntm_location",
          label: "Location",
        }),
        search.createColumn({
          name: "custrecord_cntm_rdis_location",
          label: "RDIS Location",
        }),
        search.createColumn({
          name: "custrecord_cntm_department",
          label: "Department",
        }),
        search.createColumn({
          name: "custrecord_cntm_income_acct",
        }),
        search.createColumn({
          name: "custrecord_cntm_cogs_acct",
        }),
        search.createColumn({
          name: "custrecord_cntm_asset_acct",
        }),
        search.createColumn({
          name: "custrecord_cntm_wip_acct",
        }),
        search.createColumn({
          name: "custrecord_cntm_wip_cost_var_acct",
        }),
        search.createColumn({
          name: "custrecord_cntm_scrap_acct",
        }),
        search.createColumn({
          name: "custrecord_cntm_pref_bin",
        }),
        search.createColumn({
          name: "custrecord_cntm_rdis_prefrd_bin_rdis",
        }),
      ],
    });
    var itemConfigCount = itemConfigSearch.runPaged().count;
    log.debug("itemConfigCount", itemConfigCount);

    itemConfigSearch.run().each(function (result) {
      // .run().each has a limit of 4,000
      // results

      //Setting MLO check box is true
      if (itemType == "MLO") {
        log.debug("Setting MLO check box");
        lotItemRecord.setValue({
          fieldId: "custitem_rda_mlo",
          value: true,
        });
      } else {
        lotItemRecord.setValue({
          fieldId: "custitem_rda_mlo",
          value: false,
        });
      }

      var department = result.getValue({
        name: "custrecord_cntm_department",
      });
      lotItemRecord.setValue({
        fieldId: "department",
        value: department,
      });

      var cogsAcct = result.getValue({
        name: "custrecord_cntm_cogs_acct",
      });
      lotItemRecord.setValue({
        fieldId: "cogsaccount",
        value: cogsAcct,
      });

      var assetAcct = result.getValue({
        name: "custrecord_cntm_asset_acct",
      });
      lotItemRecord.setValue({
        fieldId: "assetaccount",
        value: assetAcct,
      });

      var incomeAcct = result.getValue({
        name: "custrecord_cntm_income_acct",
      });
      lotItemRecord.setValue({
        fieldId: "incomeaccount",
        value: incomeAcct,
      });

      var wipAcct = result.getValue({
        name: "custrecord_cntm_wip_acct",
      });
      lotItemRecord.setValue({
        fieldId: "wipacct",
        value: wipAcct,
      });

      var wipCost = result.getValue({
        name: "custrecord_cntm_wip_cost_var_acct",
      });
      lotItemRecord.setValue({
        fieldId: "wipvarianceacct",
        value: wipCost,
      });

      var scrpAcct = result.getValue({
        name: "custrecord_cntm_scrap_acct",
      });
      lotItemRecord.setValue({
        fieldId: "scrapacct",
        value: scrpAcct,
      });

      //setting prefBin and other

      var rdLocation = result.getValue({
        name: "custrecord_cntm_location",
      });

      // var rdisLocation = result.getValue({
      //   name: "custrecord_cntm_rdis_location",
      // });

      // var prefBinRdis = result.getValue({
      //   name: "custrecord_cntm_rdis_prefrd_bin_rdis",
      // });

      var prefBinRd = result.getValue({
        name: "custrecord_cntm_pref_bin",
      });

      if (prefBinRd) {
        lotItemRecord.selectNewLine({
          sublistId: "binnumber",
        });
        lotItemRecord.setCurrentSublistValue({
          sublistId: "binnumber",
          fieldId: "location",
          value: rdLocation,
        });
        lotItemRecord.setCurrentSublistValue({
          sublistId: "binnumber",
          fieldId: "binnumber",
          value: prefBinRd,
        });
        lotItemRecord.setCurrentSublistValue({
          sublistId: "binnumber",
          fieldId: "preferredbin",
          value: true,
        });
        lotItemRecord.commitLine({
          sublistId: "binnumber",
        });
      }
      return false;
    });

    return lotItemRecord;
  }
  function itemConfigLocation(itemType) {
    var probeLoc;
    // log.debug("==IN FUNCTION:", itemType);

    var itemConfigSearch2 = search.create({
      type: "customrecord_cntm_item_config",
      filters: [["name", "is", itemType]],
      columns: [
        search.createColumn({
          name: "custrecord_cntm_location",
          label: "Location",
        }),
      ],
    });
    var itemConfigCount2 = itemConfigSearch2.runPaged().count;
    // log.debug("itemConfigCount2", itemConfigCount2);

    itemConfigSearch2.run().each(function (result) {
      probeLoc = result.getValue({
        name: "custrecord_cntm_location",
        label: "Location",
      });
      // log.debug("probeLoc :", probeLoc);
      return false;
    });

    return probeLoc;
  }

  function validateDataCSV(data) {
    if (data == "" ||data == undefined ||data == null ||typeof data == undefined) {
      return false;
    } else {
      return true;
    }
  }
});
