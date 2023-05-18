/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * 
 * script id = 1498
 */
 define(["N/file", "N/record", "N/runtime", "N/search", "N/task"], /**
 * @param {file}
 *            file
 * @param {record}
 *            record
 * @param {runtime}
 *            runtime
 * @param {search}
 *            search
 */ function (file, record, runtime, search, task) {
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
            var recType = runtime.getCurrentScript().getParameter({
                name: "custscript_cntm_fab_rectype",
            });
            log.debug("recType :", recType);

            var recId = runtime.getCurrentScript().getParameter({
                name: "custscript_cntm_fab_recid",
            });
            log.debug("recId :", recId);
            try {
                var isRepJob = runtime.getCurrentScript().getParameter({
                    name: "custscript_cntm_is_rep_job",
                });
                log.debug("isRepJob", isRepJob);
                var boardsPerPanel = runtime.getCurrentScript().getParameter({
                    name: "custscript_cntm_boards_per_panel",
                });
                boardsPerPanel = boardsPerPanel ? boardsPerPanel : 1;
                log.debug("boardsPerPanel", boardsPerPanel);
                var tool_num = runtime.getCurrentScript().getParameter({
                    name: "custscript_cntm_fab_toolnum_id",
                });
                log.debug("tool_num", tool_num);
                var isInterco = runtime.getCurrentScript().getParameter({
                    name: "custscript_cntm_is_interco_tran",
                });
                log.debug("isInterco", isInterco);

                var isCon = runtime.getCurrentScript().getParameter({
                    name: "custscript_cntm_is_con_item",
                });
                log.debug("isCon", isCon);

                var item = runtime.getCurrentScript().getParameter({
                    name: "custscript_cntm_fab_asmblyitem",
                });
                log.debug("item", item);

                var itemFieldLookUp = search.lookupFields({
                    type: "item",
                    id: item,
                    columns: ["itemid"],
                });
                log.debug("itemFieldLookUp :", itemFieldLookUp);

                var itemName = itemFieldLookUp.itemid;
                log.debug("_itemName", itemName);
                var final_obj = new Object();
                if (isRepJob == true || isRepJob == "true") {
                    var bomSearchObj = search.create({
                        type: "bom",
                        filters: [
                            ["custrecord_cntm_tool_number", "anyof", tool_num],
                            "AND",
                            ["custrecord_cntm_fab_rec", "noneof", "@NONE@"]
                            /*
                             * , "AND", [
                             * "custrecord_cntm_boards_per_panel",
                             * "equalto",
                             * boardsPerPanel ]
                             */
                        ],
                        columns: [
                            search.createColumn({
                                name: "name",
                                label: "Name",
                            }),
                            search.createColumn({
                                name: "internalid",
                                sort: search.Sort.DESC,
                                label: "Internal ID",
                            }),
                            search.createColumn({
                                name: "custrecord_cntm_boards_per_panel",
                                label: "Boards Per Panel",
                            }),
                            search.createColumn({
                                name: "restricttoassemblies",
                                label: "Restrict To Assemblies",
                            }),
                            search.createColumn({
                                name: "name",
                                label: "Name",
                            }),
                        ],
                    });
                    var searchResultCount = bomSearchObj.runPaged().count;
                    log.debug("bomSearchObj result count", searchResultCount);

                    // bomSearchObj.run().each(function (result) {
                    //   // .run().each has a limit of 4,000 results
                    //   var obj = {};
                    //   obj.bomName = result.getValue({
                    //     name: "name",
                    //   });
                    //   obj.item = result.getValue({
                    //     name: "restricttoassemblies",
                    //   });
                    //   log.debug("obj.item", obj.item);
                    //   obj.isFA = false;
                    //   if (obj.item == itemName) obj.isFA = true;
                    //   final_obj[obj.item] = obj;
                    //   return true;
                    // });
                    var parentItem, parentBOM;
                    var isParentItemFound = false;
                    if (searchResultCount > 0) {
                        bomSearchObj.run().each(function (result) {
                            // .run().each has a limit of 4,000 results
                            var obj = {};
                            obj.bomName = result.getValue({
                                name: "name",
                            });
                            obj.item = result.getValue({
                                name: "restricttoassemblies",
                            });
                            log.debug("obj.item", obj.item);
                            obj.isFA = false;
                            if (obj.item == itemName) obj.isFA = true;

                            if (parentBOM && isParentItemFound == false) {
                                log.debug('parentItem :', parentItem);
                                log.debug('parentItem :', typeof (parentItem));

                                var parentSubAssembly = parentItem ? parentItem.split("-")[1].split("_")[0] : '';
                                var childSubAssembly = obj.item.split("-")[1].split("_")[0];
                                //** */
                                /*var isMloItem = false;
                                if (parentItem) {
                                  var parentId = getLotNumberItem(parentItem);
                                  if (parentId) {
                                    var itemFieldLookUp2 = search.lookupFields({
                                      type: "item",
                                      id: parentId,
                                      columns: ["custitem_rda_mlo"],
                                    });
                                    log.debug("itemFieldLookUp2 :", itemFieldLookUp2);
                
                                    isMloItem = itemFieldLookUp2.custitem_rda_mlo;
                                  }
                                }*/
                                // if ((isMloItem == true || parentSubAssembly == "SM") && childSubAssembly != "SM") {
                                if ((parentSubAssembly == "SM") && childSubAssembly != "SM" ) { //Added on 27-12-2022
                                    obj.parentItem = parentItem;
                                    isParentItemFound = true;
                                }

                            }
                            parentItem = obj.item;
                            parentBOM = obj.bomName;
                            final_obj[obj.item] = obj;
                            return true;
                        });
                    }
                    //Adding following code because in repeat job status is not reflecting 24-05-2022
                    record.submitFields({
                        type: recType,
                        id: recId,
                        values: {
                            custrecord_cntm_status_fab_wo_crtn: 7,  //custrecord_cntm_status_fab_wo_crtn
                            custrecord_cntm_error_fab: "",  //custrecord_cntm_error_fab
                        },
                    });

                } else {
                    // record.submitFields({
                    //   type: recType,
                    //   id: recId,
                    //   values: {
                    //     custrecord_cntm_status_asmwocreation: 7,  //custrecord_cntm_status_fab_wo_crtn
                    //     custrecord_cntm_error_amswocreation: "",  //custrecord_cntm_error_fab
                    //   },
                    // });

                    // Prevoiusly asm were setted now fab
                    record.submitFields({
                        type: recType,
                        id: recId,
                        values: {
                            custrecord_cntm_status_fab_wo_crtn: 7,  //custrecord_cntm_status_fab_wo_crtn
                            custrecord_cntm_error_fab: "",  //custrecord_cntm_error_fab
                        },
                    });

                    var bom_assembly = new Array();
                    var unique_assembly = new Array();
                    /*
                     * var bom_file =
                     * runtime.getCurrentScript().getParameter({ name :
                     * 'custscript_cntm_bom_file' });
                     */
                    var dependancy_file = runtime.getCurrentScript().getParameter({
                        name: "custscript_cntm_fab_depend_file",
                    });
                    /*
                     * var routingFile =
                     * runtime.getCurrentScript().getParameter({ name :
                     * 'custscript_cntm_routing_file' });
                     */
                    var fabRecordId = runtime.getCurrentScript().getParameter({
                        name: "custscript_cntm_fab_recid",
                    });

                    var fabFieldLookUp = search.lookupFields({
                        type: "customrecord_cntm_wo_bom_import_fab",
                        id: fabRecordId,
                        columns: [
                            "custrecord_cntm_cust_rev_fab",
                            "custrecord_cntm_bom_dependecy_file_fab",
                            "custrecord_bom_raw_file_fab",
                            "custrecord_cntm_mfg_routing_filr_fab",
                        ],
                    });
                    log.debug("fabFieldLookUp", fabFieldLookUp);
                    if (fabFieldLookUp.custrecord_cntm_bom_dependecy_file_fab[0])
                        dependancy_file =
                            fabFieldLookUp.custrecord_cntm_bom_dependecy_file_fab[0].value;
                    var fabRevision = fabFieldLookUp.custrecord_cntm_cust_rev_fab;
                    var isValidate = true;
                    var isFA = false;
                    /*
                     * var fabStatus =
                     * runtime.getCurrentScript().getParameter({ name :
                     * 'custscript_cntm_fab_status' });
                     * log.debug('bom_file', bom_file);
                     */
                    log.debug("dependancy_file", dependancy_file);
                    // log.debug('routingFile', routingFile);
                    log.debug("fabRecordId", fabRecordId);
                    var depenData = {};
                    var uniqueASM = [];
                    var asmObjArr = [];

                    var depen_fileObj = file.load({
                        id: parseInt(dependancy_file),
                    });

                    var toolName = runtime.getCurrentScript().getParameter({
                        name: "custscript_cntm_fab_toolnum",
                    });
                    var parentItem;
                    var childAssemblyToCheck;

                    var depen_iterator = depen_fileObj.lines.iterator();

                    depen_iterator.each(function (line) {
                        var body = line.value;
                        var bodyArray = body.split("|");

                        var subAssembly = getsubassembly(bodyArray[0]);

                        if (subAssembly) {
                            var isFA2 = false;
                            var assemblyTypeArr = subAssembly.split("_");
                            var assemblyType = assemblyTypeArr[0];
                            if (assemblyType == "FA" || assemblyType == "FM") {
                                isFA2 = true;
                            }
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
                            log.debug('bodyArray :', bodyArray);

                            for (var i = 1; i < bodyArray.length; i++) {
                                if (bodyArray[i]) {
                                    var subItemName = getsubassembly(bodyArray[i]);
                                    log.debug('subItemName :', subItemName);

                                    asmObj.SubAssembies.push(subItemName);
                                    var parentSubAssembly = subAssembly.split("_")[0];
                                    var childSubAssembly = subItemName.split("_")[0];
                                    var parentItemName = '';

                                    //** */
                                    var isMloParentItem = false;
                                    // if (subAssembly) {
                                    if (isFA2 == true || isFA2 == "true") {
                                        parentItemName = "RD-" + toolName;
                                        if (isCon == true || isCon == "true") parentItemName += "-CON";
                                        else parentItemName += "-PCB";
                                    } else parentItemName = toolName + "-" + subAssembly;
                                    log.debug('parentItemName', parentItemName);
                                    /*var parentId = getLotNumberItem(parentItemName);
                                    if (parentId) {
                                      var itemFieldLookUp3 = search.lookupFields({
                                        type: "item",
                                        id: parentId,
                                        columns: ["custitem_rda_mlo"],
                                      });
                                      log.debug("itemFieldLookUp3 :", itemFieldLookUp3);
                  
                                      isMloParentItem = itemFieldLookUp3.custitem_rda_mlo;
                                    }
                                     }*/
                                    //if ((((isFA2 == true || isFA2 == "true")&&isMloParentItem == true) || parentSubAssembly == "SM") && childSubAssembly && childSubAssembly != "SM") {
                                    if ((parentSubAssembly == "SM") && childSubAssembly && childSubAssembly != "SM") {
                                        log.debug("Inside Parent and Child");
                                        childAssemblyToCheck = subItemName;
                                        // if (parentId)
                                        parentItem = parentItemName;
                                    }
                                }
                            } //for end
                        } //Subassembly end
                        for (var item in bodyArray) {
                            bom_assembly.push(bodyArray[item]);
                        }
                        if (bodyArray[0]) {
                            var subassembly_1 = getsubassembly(bodyArray[0]);
                            var subassembly_2 = getsubassembly(bodyArray[1]);
                            if (subassembly_1) {
                                if (typeof depenData[subassembly_1] === "undefined") {
                                    depenData[subassembly_1] = {};
                                }
                                depenData[subassembly_1] = subassembly_2;
                            }
                        }
                        return true;
                    });
                    // log.debug("depenData", depenData);

                    // log.debug("bom_assembly", JSON.stringify(bom_assembly));

                    unique_assembly = bom_assembly.filter(function (item, pos) {
                        return bom_assembly.indexOf(item) == pos;
                    });
                    // log.debug("unique_assembly", JSON.stringify(unique_assembly));

                    log.debug("asmObjArr :", asmObjArr);
                    for (var i = Number(uniqueASM.length) - 1; i >= 0; i--) {
                        var file_obj = {};
                        var str = uniqueASM[i];
                        var res = uniqueASM[i].indexOf("-");
                        var subassembly = str.slice(res + 1, str.length); // SP_1/18
                        log.debug("subassembly", subassembly);
                        var itemId;
                        //if (subassembly) {

                        if (subassembly) {
                            var assemblyTypeArr = subassembly.split("_");
                            var assemblyType = assemblyTypeArr[0];
                            if (assemblyType == "FA" || assemblyType == "FM") {
                                isFA = true;
                            }
                            if (isFA == true || isFA == "true") {
                                itemId = "RD-" + toolName;
                                if (isCon == true || isCon == "true") itemId += "-CON";
                                else itemId += "-PCB";
                            } else itemId = toolName + "-" + subassembly;
                            //}
                            log.debug("_itemId", itemId);
                            var obj = new Object();
                            obj.isFA = isFA;
                            obj.item = itemId;
                            log.debug('parentItem: ' + parentItem, 'childAssemblyToCheck: ', childAssemblyToCheck);
                            if (parentItem == itemId) {
                                obj.mloChild = childAssemblyToCheck;
                            }
                            if (subassembly == childAssemblyToCheck) {
                                obj.parentItem = parentItem;
                            }

                            log.debug("in boardsPerPanel", boardsPerPanel);
                            var bomName =
                                toolName +
                                "-" +
                                subassembly +
                                "-" +
                                fabRevision +
                                "-" +
                                boardsPerPanel;
                            if (isFA) {
                                bomName = toolName;
                                if (isCon == true || isCon == "true") bomName += "-CON-";
                                else bomName += "-PCB-";
                                bomName += fabRevision + "-" + boardsPerPanel;
                            }
                            log.debug("bomName", bomName);
                            obj.bomName = bomName;
                            obj.subassembly = subassembly;
                            obj["SubAssembies"] = asmObjArr[i].SubAssembies;

                            final_obj[bomName] = obj;
                        }
                        isFA = false;
                    }
                }
                log.debug("final_obj", final_obj);
                return final_obj;
            } catch (e) {
                log.error("ERROR IN GETINPUT STAGE", e);
                record.submitFields({
                    type: recType,
                    id: recId,
                    values: {
                        custrecord_cntm_status_asmwocreation: 13,
                        custrecord_cntm_error_amswocreation: e.message,
                    },
                });
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
            log.debug("-------MAP------");
            var mapContextObj = JSON.parse(mapContext.value);

            var bomName = mapContextObj.bomName;
            log.debug("-bomName", bomName);
            var obj = new Object();

            try {
                var toolnumber = runtime.getCurrentScript().getParameter({
                    name: "custscript_cntm_fab_toolnum_id",
                });
                var toolName = runtime.getCurrentScript().getParameter({
                    name: "custscript_cntm_fab_toolnum",
                });
                var isInterco = runtime.getCurrentScript().getParameter({
                    name: "custscript_cntm_is_interco_tran",
                });
                var bomInternalId;
                var newbomInternalId;
                var subassembly = mapContextObj.subassembly;
                var itemName = mapContextObj.item;
                var isFA = mapContextObj.isFA;
                var isMLOChild = mapContextObj.mloChild;
                var isMLOChildName;
                if (isMLOChild)
                    isMLOChildName = toolName + "-" + isMLOChild;
                log.debug("isMLOChild " + isMLOChild, "isMLOChildName-" + isMLOChildName);
                log.debug("itemName", itemName);
                if (!itemName) {
                    itemName = toolName + "-" + subassembly;
                    if (isFA == true || isFA == "true") {
                        itemName = "RD-" + toolName;
                        if (isInterco == true || isInterco == "true") itemName += "-CON";
                        else itemName += "-PCB";
                    }
                }
                log.debug("toolName" + toolName, "itemName" + itemName);
                var item = getLotNumberItem(itemName);

                log.debug("item", item);

                var isNewBom = false;

                //   var fabLocation = runtime.getCurrentScript().getParameter({
                //     name: "custscript_cntm_fab_location",
                //   });
                //   log.debug('fabLocation :',fabLocation)

                var fabLocation = "";
                //Changes Instead of taking location from subassembly ....because of repeate of we are taking it from item
                var itemFieldLookUp = search.lookupFields({
                    type: "item",
                    id: item,
                    columns: ["custitem_rda_mlo"],
                });
                log.debug("itemFieldLookUp :", itemFieldLookUp);

                var isMloItem = itemFieldLookUp.custitem_rda_mlo;

                var isChildMLO = (isFA == true || isFA == "true") && (isMLOChild ? isMLOChild.split("_")[0] == 'SM' : false);
                log.debug("isFA: " + isFA, "isChildMLO: " + isChildMLO);
                log.debug(isFA == true || isFA == "true", isMLOChild ? isMLOChild.split("_")[0] == 'SM' : false);
                if (isMloItem || isChildMLO) {
                    fabLocation = itemConfigLocation("MLO");
                } else {
                    fabLocation = itemConfigLocation("FAB");
                }


                /*
                  var assemblyTypeArr = itemName.split("-")[1].split("_");//subassembly.split("_");
                log.debug('assemblyTypeArr',assemblyTypeArr);
                var assemblyType = assemblyTypeArr[0];
                if (assemblyType == "SM" || assemblyType == "FM") {
                  fabLocation = itemConfigLocation("MLO");
                  log.debug("MLO :", fabLocation);
                } else {
                  fabLocation = itemConfigLocation("FAB");
                  log.debug("FAB :", fabLocation);
                }
                */

                var boardsPerPanel = runtime.getCurrentScript().getParameter({
                    name: "custscript_cntm_boards_per_panel",
                });
                boardsPerPanel = boardsPerPanel ? boardsPerPanel : 1;
                log.debug("-boardsPerPanel", boardsPerPanel);
                var bomSearchObj = search.create({
                    type: "bom",
                    filters: [
                        ["restricttoassemblies", "anyof", item],
                        "AND",
                        ["custrecord_cntm_tool_number", "anyof", toolnumber],
                        "AND",
                        ["custrecord_cntm_boards_per_panel", "equalto", boardsPerPanel],
                    ],
                    columns: [
                        search.createColumn({
                            name: "name",
                            label: "Name",
                        }),
                        search.createColumn({
                            name: "internalid",
                            sort: search.Sort.DESC,
                            label: "Internal ID",
                        }),
                    ],
                });
                var bomCount = bomSearchObj.runPaged().count;
                log.debug("bomCount", bomCount);
                if (bomCount > 0) {
                    bomSearchObj.run().each(function (result) {
                        // .run().each has a limit of 4,000 results
                        bomInternalId = result.id;
                        return false;
                    });
                    bomDefaultLocation(item, toolnumber, fabLocation);
                    if (bomInternalId) {
                        var loadRce = record.load({
                            type: record.Type.BOM,
                            id: bomInternalId,
                            isDynamic: true,
                        });
                        var count = loadRce.getLineCount({
                            sublistId: "assembly",
                        });
                        for (var i = 0; i < count; i++) {
                            var assembly = loadRce.getSublistValue({
                                sublistId: "assembly",
                                fieldId: "assembly",
                                line: i,
                            });
                            if (assembly == item) {
                                loadRce.selectLine({
                                    sublistId: "assembly",
                                    line: i,
                                });
                                loadRce.setCurrentSublistValue({
                                    sublistId: "assembly",
                                    fieldId: "defaultforlocation",
                                    value: fabLocation,
                                });
                                loadRce.commitLine({
                                    sublistId: "assembly",
                                });
                            }
                        }

                        loadRce.save({
                            ignoreMandatoryFields: true,
                            enableSourcing: false,
                        });
                    }
                } else {
                    var bomSearchObj = search.create({
                        type: "bom",
                        filters: [
                            ["restricttoassemblies", "anyof", item],
                            "AND",
                            ["custrecord_cntm_tool_number", "anyof", toolnumber],
                            /*
                             * , "AND", [
                             * "name",
                             * "startswith",
                             * bomName ]
                             */
                        ],
                        columns: [
                            search.createColumn({
                                name: "name",
                                label: "Name",
                            }),
                            search.createColumn({
                                name: "internalid",
                                sort: search.Sort.DESC,
                                label: "Internal ID",
                            }),
                            search.createColumn({
                                name: "custrecord_cntm_boards_per_panel",
                                label: "Boards Per Panel",
                            }),
                        ],
                    });
                    var bomCount = bomSearchObj.runPaged().count;
                    log.debug("--bomCount", bomCount);
                    var oldBoardsPerPanel;
                    bomSearchObj.run().each(function (result) {
                        // .run().each has a limit of 4,000 results
                        bomInternalId = result.id;
                        bomName = result.getValue({
                            name: "name",
                        });
                        oldBoardsPerPanel = result.getValue({
                            name: "custrecord_cntm_boards_per_panel",
                        });
                        return false;
                    });
                    log.debug("oldBoardsPerPanel", oldBoardsPerPanel);
                    if (bomInternalId) {
                        var newBomName = bomName.split("-");
                        newBomName[newBomName.length - 1] = boardsPerPanel;
                        newBomName = newBomName.join("-");
                        log.audit("newBomName", newBomName);
                        bomDefaultLocation(item, toolnumber, fabLocation);
                        var bom_obj = record.copy({
                            type: "bom",
                            id: bomInternalId,
                            isDynamic: true,
                        });
                        bom_obj.setValue({
                            fieldId: "name",
                            value: newBomName,
                        });
                        bom_obj.setValue({
                            fieldId: "custrecord_cntm_boards_per_panel",
                            value: boardsPerPanel,
                        });
                        newbomInternalId = bom_obj.save({
                            ignoreMandatoryFields: true,
                            enableSourcing: true,
                        });

                        var loadRce = record.load({
                            type: record.Type.BOM,
                            id: newbomInternalId,
                            isDynamic: true,
                        });
                        loadRce.selectNewLine({
                            sublistId: "assembly",
                        });
                        loadRce.setCurrentSublistValue({
                            sublistId: "assembly",
                            fieldId: "assembly",
                            value: item,
                        });
                        // --------------------------------------------Master
                        // Default-------------------//
                        // loadRce.setCurrentSublistValue({sublistId:
                        // "assembly", fieldId: "masterdefault",
                        // value: true});
                        // -----------------------------------------------------------------------------//
                        loadRce.setCurrentSublistValue({
                            sublistId: "assembly",
                            fieldId: "defaultforlocation",
                            value: fabLocation,
                        });
                        loadRce.commitLine({
                            sublistId: "assembly",
                        });
                        loadRce.save({
                            ignoreMandatoryFields: true,
                            enableSourcing: false,
                        });
                        isNewBom = true;
                        var bomrevisionSearchObj = search.create({
                            type: "bomrevision",
                            filters: [["billofmaterials", "anyof", newbomInternalId]],
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
                        log.debug("searchResult_", searchResult);
                        if (searchResult > 0) {
                            bomrevisionSearchObj.run().each(function (result) {
                                var loadRevRec = record.load({
                                    type: "bomrevision",
                                    id: result.id,
                                    isDynamic: true,
                                });
                                loadRevRec.setValue({
                                    fieldId: "name",
                                    value: "Rev 1",
                                });
                                var compLines = loadRevRec.getLineCount({
                                    sublistId: "component",
                                });
                                for (var line = 0; line < compLines; line++) {
                                    var itemsource = loadRevRec.getSublistValue({
                                        sublistId: "component",
                                        fieldId: "itemsource",
                                        line: line,
                                    });
                                    var componentName = loadRevRec.getSublistText({
                                        sublistId: "component",
                                        fieldId: "item",
                                        line: line,
                                    });
                                    log.audit("isMLOChildName-" + isMLOChildName, 'componentName-' + componentName);
                                    if (itemsource != "WORK_ORDER" && isMLOChildName != componentName) {
                                        var bomquantity = loadRevRec.getSublistValue({
                                            sublistId: "component",
                                            fieldId: "bomquantity",
                                            line: line,
                                        });
                                        log.debug("bomquantity", bomquantity);
                                        bomquantity =
                                            (bomquantity * oldBoardsPerPanel) / boardsPerPanel;
                                        loadRevRec.selectLine({
                                            sublistId: "component",
                                            line: line,
                                        });
                                        loadRevRec.setCurrentSublistValue({
                                            sublistId: "component",
                                            fieldId: "bomquantity",
                                            value: bomquantity,
                                        });
                                        loadRevRec.commitLine({
                                            sublistId: "component",
                                        });
                                    } else if (isMLOChildName == componentName) {
                                        loadRevRec.selectLine({
                                            sublistId: "component",
                                            line: line,
                                        });
                                        loadRevRec.setCurrentSublistValue({
                                            sublistId: "component",
                                            fieldId: "bomquantity",
                                            value: 1,
                                        });
                                        loadRevRec.commitLine({
                                            sublistId: "component",
                                        });
                                    }

                                }

                                loadRevRec.save({
                                    ignoreMandatoryFields: true,
                                    enableSourcing: false,
                                });
                            });
                        }
                    }
                }
                log.debug(
                    "newbomInternalId" + newbomInternalId,
                    "bomInternalId" + bomInternalId
                );
                // var bomId=bomInternalId;
                if (isNewBom == false) {
                    newbomInternalId = bomInternalId;
                    newBomName = bomName;
                }
                var mfg;
                var oldMfgBoardsPerPanel;
                var manufacturingroutingSearchObj = search.create({
                    type: "manufacturingrouting",
                    filters: [
                        ["billofmaterials", "anyof", newbomInternalId],
                        "AND",
                        ["isdefault", "is", "T"],
                        "AND",
                        ["custrecord_cntm_fab_boards_per_panel", "equalto", boardsPerPanel],
                    ],
                    columns: [
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.DESC,
                            label: "Name",
                        }),
                        search.createColumn({
                            name: "billofmaterials",
                            label: "Bill of Materials",
                        }),
                        search.createColumn({
                            name: "location",
                            label: "Location",
                        }),
                        search.createColumn({
                            name: "custrecord_cntm_fab_boards_per_panel",
                            label: "Boards Per Panel",
                        }),
                    ],
                });
                var searchResultCount = manufacturingroutingSearchObj.runPaged().count;
                log.debug(
                    "manufacturingroutingSearchObj result count",
                    searchResultCount
                );
                if (searchResultCount > 0) {
                    manufacturingroutingSearchObj.run().each(function (result) {
                        mfg = result.id;
                        oldMfgBoardsPerPanel = result.getValue({
                            name: "custrecord_cntm_fab_boards_per_panel",
                        });
                        return false;
                    });
                } else {
                    var routingName = "";
                    // newbomInternalId=bomInternalId?bomInternalId:newbomInternalId;//////////////////////
                    var manufacturingroutingSearchObj = search.create({
                        type: "manufacturingrouting",
                        filters: [
                            ["billofmaterials", "anyof", bomInternalId],
                            /*
                             * , "AND", [ "name",
                             * "startswith", bomName ]
                             */
                        ],
                        columns: [
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC,
                                label: "Name",
                            }),
                            search.createColumn({
                                name: "billofmaterials",
                                label: "Bill of Materials",
                            }),
                            search.createColumn({
                                name: "location",
                                label: "Location",
                            }),
                            search.createColumn({
                                name: "custrecord_cntm_fab_boards_per_panel",
                                label: "Boards Per Panel",
                            }),
                        ],
                    });
                    var searchResultCount2 = manufacturingroutingSearchObj.runPaged().count;
                    log.debug(
                        "manufacturingroutingSearchObj result count--2",
                        searchResultCount2
                    );
                    if (searchResultCount2 > 0) {
                        routingName = /* bomName */ newBomName + " " + searchResultCount2;
                        manufacturingroutingSearchObj.run().each(function (result) {
                            mfg = result.id;
                            oldMfgBoardsPerPanel = result.getValue({
                                name: "custrecord_cntm_fab_boards_per_panel",
                            });
                            return false;
                        });
                    } else {
                        var bomSearchObj = search.create({
                            type: "bom",
                            filters: [
                                ["restricttoassemblies", "anyof", item],
                                "AND",
                                ["custrecord_cntm_tool_number", "anyof", toolnumber],
                                /*
                                 * ,
                                 * "AND", [
                                 * "name",
                                 * "startswith",
                                 * bomName ]
                                 */
                            ],
                            columns: [
                                search.createColumn({
                                    name: "name",
                                    label: "Name",
                                }),
                                search.createColumn({
                                    name: "internalid",
                                    sort: search.Sort.DESC,
                                    label: "Internal ID",
                                }),
                            ],
                        });
                        var bomCount = bomSearchObj.runPaged().count;
                        log.debug("---bomCount", bomCount);
                        var count = 0;
                        var bomForMfg = [];
                        var bomNameForMfg = [];
                        bomSearchObj.run().each(function (result) {
                            // .run().each has a limit of 4,000 results
                            if (count == 0) {
                                count++;
                                if (bomCount == count) {
                                    bomForMfg.push(result.id);
                                    bomNameForMfg.push(
                                        result.getValue({
                                            name: "name",
                                        })
                                    );
                                }
                            } else {
                                bomForMfg.push(result.id);
                                bomNameForMfg.push(
                                    result.getValue({
                                        name: "name",
                                    })
                                );
                            }
                            return true;
                        });
                        log.debug("bomNameForMfg", bomNameForMfg);
                        var manufacturingroutingSearchObj = search.create({
                            type: "manufacturingrouting",
                            filters: [
                                ["billofmaterials", "anyof", bomForMfg],
                                /*
                                 * ,
                                 * "AND", [
                                 * "name",
                                 * "startswith",
                                 * bomName ]
                                 */
                            ],
                            columns: [
                                search.createColumn({
                                    name: "name",
                                    // sort : search.Sort.ASC,
                                    label: "Name",
                                }),
                                search.createColumn({
                                    name: "internalid",
                                    sort: search.Sort.DESC,
                                    label: "InternalId",
                                }),
                                search.createColumn({
                                    name: "billofmaterials",
                                    label: "Bill of Materials",
                                }),
                                search.createColumn({
                                    name: "location",
                                    label: "Location",
                                }),
                                search.createColumn({
                                    name: "custrecord_cntm_fab_boards_per_panel",
                                    label: "Boards Per Panel",
                                }),
                            ],
                        });
                        var searchResultCount3 =
                            manufacturingroutingSearchObj.runPaged().count;
                        log.debug(
                            "manufacturingroutingSearchObj result count--3",
                            searchResultCount3
                        );
                        // routingName = bomName + ' ' + 1;
                        // routingName = bomNameForMfg;
                        if (searchResultCount3 > 0) {
                            routingName = bomNameForMfg + " " + searchResultCount3;
                            manufacturingroutingSearchObj.run().each(function (result) {
                                mfg = result.id;
                                oldMfgBoardsPerPanel = result.getValue({
                                    name: "custrecord_cntm_fab_boards_per_panel",
                                });
                                return false;
                            });
                        }
                    }
                    var bomId = bomInternalId;
                    if (isNewBom == true) {
                        bomId = newbomInternalId;
                        routingName = newBomName;
                    } else {
                        if (!routingName) {
                            routingName = newBomName.split("-");
                            routingName[routingName.length - 1] = boardsPerPanel;
                            routingName = routingName.join("-");
                        }
                    }
                    defaultRouting(bomId);
                    var copyrec = record.copy({
                        type: "manufacturingrouting",
                        id: mfg,
                        isDynamic: true,
                    });

                    copyrec.setValue({
                        fieldId: "name",
                        value: routingName,
                    });
                    copyrec.setValue({
                        fieldId: "custrecord_cntm_fab_boards_per_panel",
                        value: boardsPerPanel,
                    });

                    copyrec.setValue({
                        fieldId: "billofmaterials",
                        value: bomId,
                    });
                    copyrec.setValue({
                        fieldId: "isdefault",
                        value: true,
                    });
                    var lines = copyrec.getLineCount({
                        sublistId: "routingstep",
                    });
                    if (lines > 0) {
                        for (var i = 0; i < lines; i++) {
                            var runTime = copyrec.getSublistValue({
                                sublistId: "routingstep",
                                fieldId: "runrate",
                                line: i,
                            });
                            var WIPTime = runTime * oldMfgBoardsPerPanel;
                            // log.debug('runTime: ' + runTime, 'WIPTime: '+
                            // WIPTime);
                            runTime = WIPTime / boardsPerPanel; // runTime=runTime*(boardsPerPanel/boardsPerPanelLine)
                            copyrec.selectLine({
                                sublistId: "routingstep",
                                line: i,
                            });
                            copyrec.setCurrentSublistValue({
                                sublistId: "routingstep",
                                fieldId: "runrate",
                                value: runTime,
                            });
                            copyrec.commitLine({
                                sublistId: "routingstep",
                            });
                        }
                    }
                    var loadRec = record.load({
                        type: "manufacturingrouting",
                        id: mfg,
                        isDynamic: true,
                    });
                    var compLines = copyrec.getLineCount({
                        sublistId: "routingcomponent",
                    });
                    if (compLines > 0) {
                        for (var i = 0; i < compLines; i++) {
                            var opSeq = loadRec.getSublistValue({
                                sublistId: "routingcomponent",
                                fieldId: "operationsequencenumber",
                                line: i,
                            });
                            copyrec.selectLine({
                                sublistId: "routingcomponent",
                                line: i,
                            });
                            copyrec.setCurrentSublistValue({
                                sublistId: "routingcomponent",
                                fieldId: "operationsequencenumber",
                                value: opSeq,
                            });
                            copyrec.commitLine({
                                sublistId: "routingcomponent",
                            });
                        }
                    }
                    mfg = copyrec.save({
                        ignoreMandatoryFields: true,
                        enableSourcing: true,
                    });

                    // else
                    // mapContext.write({key:'Error',value:responseObj});
                }
                obj.mfg = mfg;
                obj.isFA = mapContextObj.isFA;
                obj.bomName = newBomName;
                obj.parentItem = mapContextObj.parentItem;
                if (isNewBom == true) bomInternalId = newbomInternalId;
                obj.fabLocation = fabLocation;
                obj.bomInternalId = bomInternalId;
                obj.item = item;
                log.debug("map-obj", JSON.stringify(obj));
                mapContext.write({
                    key: newBomName,
                    value: obj,
                });
            } catch (e) {
                log.error("ERROR:Map", e);

                obj.error = e.message;
                obj.rec = "BOM";
                log.debug("map-obj", JSON.stringify(obj));
                mapContext.write({
                    key: bomName,
                    value: obj,
                });
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
        function bomDefaultLocation(item, toolNum, location) {
            var bomId;
            var bomSearchObj = search.create({
                type: "bom",
                filters: [
                    ["restricttoassemblies", "anyof", item],
                    "AND",
                    ["custrecord_cntm_tool_number", "anyof", toolNum],
                    "AND",
                    ["assemblyitem.locations", "anyof", location],
                ],
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
            bomSearchObj.run().each(function (result) {
                // .run().each has a limit of 4,000 results
                bomId = result.id;
                return true;
            });
            if (bomId) {
                var loadRce = record.load({
                    type: record.Type.BOM,
                    id: bomId,
                    isDynamic: true,
                });
                var count = loadRce.getLineCount({
                    sublistId: "assembly",
                });
                for (var i = 0; i < count; i++) {
                    var assembly = loadRce.getSublistValue({
                        sublistId: "assembly",
                        fieldId: "assembly",
                        line: i,
                    });
                    if (assembly == item) {
                        loadRce.selectLine({
                            sublistId: "assembly",
                            line: i,
                        });
                        loadRce.setCurrentSublistValue({
                            sublistId: "assembly",
                            fieldId: "defaultforlocation",
                            value: "",
                        });
                        loadRce.commitLine({
                            sublistId: "assembly",
                        });
                    }
                }

                loadRce.save({
                    ignoreMandatoryFields: true,
                    enableSourcing: false,
                });
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
        function reduce(reduceContext) { }

        /**
         * Executes when the summarize entry point is triggered and applies
         * to the result set.
         *
         * @param {Summary}
         *            summary - Holds statistics regarding the execution of
         *            a map/reduce script
         * @since 2015.1
         */
        function summarize(summaryContext) {
            var recType = runtime.getCurrentScript().getParameter({
                name: "custscript_cntm_fab_rectype",
            });
            var recId = runtime.getCurrentScript().getParameter({
                name: "custscript_cntm_fab_recid",
            });
            try {
                var isRepJob = runtime.getCurrentScript().getParameter({
                    name: "custscript_cntm_is_rep_job",
                });
                var isInterco = runtime.getCurrentScript().getParameter({
                    name: "custscript_cntm_is_interco_tran",
                });
                var isCon = runtime.getCurrentScript().getParameter({
                    name: "custscript_cntm_is_con_item",
                });
                var errRec;
                var errorArr = [];
                var bom;
                var routing;
                var assemblyItem;

                var sendWoId;
                var arry_details = [];
                summaryContext.output.iterator().each(function (key, value) {
                    log.debug("value", value);

                    if (value && value != "null" && value != "undefined") {
                        var values = JSON.parse(value);
                        if ("error" in values) {
                            var err = "";
                            var bomName = key;
                            err = bomName + ",";
                            /*
                             * if ('rec' in values) { errRec =
                             * values.rec; err += 'Error in ' +
                             * errRec; }
                             */
                            log.audit("errRec", errRec);

                            if ("error" in values) {
                                err += values.error;
                            }
                            errorArr.push(err);
                            // errorObj[status].push(err);
                        } else {
                            if (values.isFA == true || values.isFA == "true") {
                                values["sendWoId"] = true;
                                arry_details.push(values);
                            }
                            if (values.hasOwnProperty("parentItem")) {
                                if (
                                    values.parentItem != "" ||
                                    values.parentItem != null ||
                                    values.parentItem != undefined
                                ) {
                                    //Need to check here
                                    values["sendWoId"] = false;
                                    arry_details.push(values);
                                }
                            }
                        }
                    }
                    return true;
                });

                if (errorArr.length > 0) {
                    log.error("error", errorArr);
                    var errStatus = 13;
                    if (
                        (isRepJob == true || isRepJob == "true") &&
                        (fabStatus == "" || fabStatus == 12)
                    ) {
                        errStatus = 12;
                    }
                    record.submitFields({
                        type: recType,
                        id: recId,
                        values: {
                            custrecord_cntm_status_fab_wo_crtn: errStatus,
                            custrecord_cntm_error_fab: errorArr,
                        },
                    });
                } else {
                    var fabDetails = {};
                    var fabRec = record.load({
                        type: recType,
                        id: recId,
                        isDynamic: true,
                    });
                    var fabStatus = fabRec.getValue({
                        fieldId: "custrecord_cntm_status_fab_wo_crtn",
                    });
                    // fabDetails['fabStatus']= fabStatus;

                    var so = fabRec.getValue({
                        fieldId: "custrecord_cntm_sales_order_fab",
                    });
                    // fabDetails['so']= so;

                    //LOOOK UP ON SO for class to set on WO
                    var soFieldLookUp = search.lookupFields({
                        type: 'salesorder',
                        id: so,
                        columns: ['class']
                    });
                    var classToSet = soFieldLookUp.class[0].value;
                    log.debug('soFieldLookUp :', soFieldLookUp)

                    log.debug('Class to set :', classToSet);

                    var soSubsidiary = fabRec.getValue({
                        fieldId: "custrecord_cntm_so_subsidiary_fab_wo",
                    });
                    // fabDetails['soSubsidiary']= soSubsidiary;

                    var soLocation = fabRec.getValue({
                        fieldId: "custrecord_cntm_so_location_fab",
                    });
                    // fabDetails['soLocation']= soLocation;

                    var soCustomer = fabRec.getValue({
                        fieldId: "custrecord_cntm_so_customer_fabwo",
                    });
                    // fabDetails['soCustomer']= soCustomer;

                    var toolNum = fabRec.getValue({
                        fieldId: "custrecord_cntm_toolnum_fab",
                    });
                    // fabDetails['toolNum']= toolNum;
                    // fabDetails['isRepJob'] = isRepJob;

                    if ((isRepJob == true || isRepJob == "true") && fabStatus == "") {
                        fabRec.setValue({
                            fieldId: "custrecord_cntm_status_fab_wo_crtn",
                            value: 6,
                        });
                        fabRec.setValue({
                            fieldId: "custrecord_cntm_bom_fab",
                            value: bom,
                        });
                        fabRec.setValue({
                            fieldId: "custrecord_cntm_mfg_routing_fab",
                            value: routing,
                        }); //doubt
                    }
                    var lineCount = fabRec.getLineCount({
                        sublistId: "recmachcustrecord_cntm_fab_wo_creation",
                    });
                    log.debug("lineCount", lineCount);
                    if (lineCount > 0) {
                        var errorWhileRev = '';
                        var errors = '';
                        for (var line = 0; line < lineCount; line++) {
                            var woNo = fabRec.getSublistValue({
                                sublistId: "recmachcustrecord_cntm_fab_wo_creation",
                                fieldId: "custrecord_cntm_wo_number_fabwo_crtn",
                                line: line,
                            });
                            log.debug("woNo :", woNo);
                            var createWo = fabRec.getSublistValue({
                                sublistId: "recmachcustrecord_cntm_fab_wo_creation",
                                fieldId: "custrecord_cntm_create_wo",
                                line: line,
                            });
                            log.debug("createWo :", createWo);

                            var id = fabRec.getSublistValue({
                                sublistId: "recmachcustrecord_cntm_fab_wo_creation",
                                fieldId: "id",
                                line: line,
                            });
                            log.debug("id :", id);

                            var WODetailLookUp = search.lookupFields({
                                type: "customrecord_cntm_wo_details_fab_wo_crtn",
                                id: id,
                                columns: ["custrecord_cntm_is_wo_created"],
                            });

                            var isWOCreated = WODetailLookUp.custrecord_cntm_is_wo_created;

                            log.audit("isWOCreated", isWOCreated);
                            if (
                                !woNo &&
                                isWOCreated == false &&
                                (createWo == true || createWo == "T")
                            ) {
                                var woQty = fabRec.getSublistValue({
                                    sublistId: "recmachcustrecord_cntm_fab_wo_creation",
                                    fieldId: "custrecord_cntm_wo_qty_fab_wo",
                                    line: line,
                                });
                                var noOfPanels = fabRec.getSublistValue({
                                    sublistId: "recmachcustrecord_cntm_fab_wo_creation",
                                    fieldId: "custrecord_cntm_num_of_panels_fabwo_crtn",
                                    line: line,
                                });
                                var relsType = fabRec.getSublistValue({
                                    sublistId: "recmachcustrecord_cntm_fab_wo_creation",
                                    fieldId: "custrecord_cntm_release_type",
                                    line: line,
                                });
                                var releasedDate = fabRec.getSublistValue({
                                    sublistId: "recmachcustrecord_cntm_fab_wo_creation",
                                    fieldId: "custrecord_cntm_wo_releasedt_fab_wo",
                                    line: line,
                                });
                                releasedDate = releasedDate ? releasedDate : new Date();
                                var scheduledDate = fabRec.getSublistValue({
                                    sublistId: "recmachcustrecord_cntm_fab_wo_creation",
                                    fieldId: "custrecord_cntm_schd_dt_fab_wo",
                                    line: line,
                                });
                                scheduledDate = scheduledDate ? scheduledDate : new Date();
                                if (releasedDate) {
                                    releasedDate = convertDate(releasedDate);
                                }
                                if (scheduledDate) {
                                    scheduledDate = convertDate(scheduledDate);
                                }
                                var endCustomer = fabRec.getValue({
                                    fieldId: "custrecord_cntm_end_customer",
                                });

                                var job = fabRec.getValue({
                                    fieldId: "custrecord_cntm_project_fabwo",
                                });
                                var custPartNo = fabRec.getValue({
                                    fieldId: "custrecord_cntm_fab_cust_part_no",
                                });
                                log.debug("job: " + job, "custPartNo: " + custPartNo);

                                var expShipDt = fabRec.getSublistValue({
                                    sublistId: "recmachcustrecord_cntm_fab_wo_creation",
                                    fieldId: "custrecord_cntm_exp_ship_date",
                                    line: line,
                                });
                                var boardsPerPanel = fabRec.getSublistValue({
                                    sublistId: "recmachcustrecord_cntm_fab_wo_creation",
                                    fieldId: "custrecord_cntm_boardsperpanel_fabwo_crt",
                                    line: line,
                                });

                                var mlo = fabRec.getValue({
                                    fieldId: "custrecord_cntm_mlo",
                                });

                                var uniqueKey = fabRec.getValue({
                                    fieldId: "custrecord_cntm_so_line_unique_key",
                                });
                                //TODO: CREATE WO Function
                                fabDetails["soSubsidiary"] = soSubsidiary;
                                fabDetails["endCustomer"] = endCustomer;
                                fabDetails["isInterco"] = isInterco;
                                fabDetails["soCustomer"] = soCustomer;
                                fabDetails["endCustomer"] = endCustomer;
                                fabDetails["soLocation"] = soLocation;
                                fabDetails["scheduledDate"] = scheduledDate;
                                fabDetails["woQty"] = woQty;
                                fabDetails["job"] = job;
                                fabDetails["custPartNo"] = custPartNo;
                                fabDetails["noOfPanels"] = noOfPanels;
                                fabDetails["releasedDate"] = releasedDate;
                                fabDetails["expShipDt"] = expShipDt;
                                fabDetails["recId"] = recId;
                                fabDetails["toolNum"] = toolNum;
                                fabDetails["boardsPerPanel"] = boardsPerPanel;
                                fabDetails["relsType"] = relsType;
                                fabDetails["mlo"] = mlo;
                                fabDetails["uniqueKey"] = uniqueKey;
                                fabDetails["so"] = so;
                                fabDetails["classToSet"] = classToSet;

                                var woId = {};
                                log.debug("arry_details :", arry_details);
                                var isFinalWOCreated = false;
                                var subWoIndex;
                                var isSubWORemning = false;
                                if (arry_details.length > 0) {
                                    for (var ind = 0; ind < arry_details.length; ind++) {
                                        if (arry_details[ind].sendWoId) {
                                            woId = createwo(fabDetails, arry_details[ind]);
                                            log.debug("WO ID 1 NOW MAP:", woId);
                                            isFinalWOCreated = true;
                                            if (woId.errorRev) {
                                                if (errorWhileRev) errorWhileRev += ",";
                                                errorWhileRev += woId.errorRev;
                                            }
                                        } else {
                                            if (isFinalWOCreated == true)
                                                if (woId.errorRev) { }
                                                else {
                                                    log.debug("WO ID 1 else :", woId);
                                                    createwo(fabDetails, arry_details[ind], woId.woIdCreated);
                                                }
                                            else {
                                                subWoIndex = ind;
                                                isSubWORemning = true;
                                            }
                                        }
                                    }
                                }
                                if (isSubWORemning == true) {
                                    if (woId.errorRev) { }
                                    else {
                                        log.debug("WO ID 1 else :", woId);
                                        createwo(fabDetails, arry_details[subWoIndex], woId.woIdCreated);
                                    }
                                }
                                log.debug("WO ID OUTSIDE", woId);

                                /*
                                 var mapToReturn = {}
                        mapToReturn['mapToReturn'] = errorRev;
                        mapToReturn['woIdCreated'] = woIdCreated;  
                                */
                                errorWhileRev = woId.errorRev;
                                log.debug("errorWhileRev ;", errorWhileRev);
                                if (errorWhileRev)
                                    continue;
                                if (woId.errors) {
                                    if (errors) errors += "\n";
                                    errors += woId.errors;

                                }
                                else if (validateData(woId.woIdCreated)) {
                                    var routErrorFile = fabRec.getValue({
                                        fieldId: "custrecord_cntm_routing_err_file",
                                    });
                                    if (!routErrorFile) {
                                        var contents = "WO,Error\n";

                                        var newFile = file.create({
                                            name: "Error File_" + recId,
                                            fileType: file.Type.CSV,
                                            contents: contents,
                                            folder: 967//1676,
                                        });
                                        routErrorFile = newFile.save();
                                        fabRec.setValue({
                                            fieldId: "custrecord_cntm_routing_err_file",
                                            value: routErrorFile,
                                        });
                                    }
                                    var scriptTask = task.create({
                                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    });
                                    scriptTask.scriptId = "customscript_cntm_ss_pcb_lot_num";
                                    // scriptTask.deploymentId =
                                    // 'customdeploy_cntm_ss_pcb_lot_num';
                                    scriptTask.params = {
                                        custscript_cntm_woid: woId.woIdCreated,
                                        custscript_cntm_panels: noOfPanels,
                                        custscript_cntm_fab_item: assemblyItem,
                                        custscript_cntm_is_issue: false,
                                        custscript_cntm_pcb_rec: routErrorFile,
                                    };

                                    var scriptTaskId = scriptTask.submit();
                                    var status = task.checkStatus(scriptTaskId).status;
                                    log.debug(scriptTaskId);
                                    log.audit('Call 1 :',scriptTaskId );
                                    var scriptTask1 = task.create({
                                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    });
                                    scriptTask1.scriptId = "customscript_cntm_ss_pcb_lot_num";
                                    // scriptTask.deploymentId =
                                    // 'customdeploy_cntm_ss_pcb_lot_num';
                                    scriptTask1.params = {
                                        custscript_cntm_woid: woId.woIdCreated,
                                        custscript_cntm_panels: noOfPanels,
                                        custscript_cntm_fab_item: assemblyItem,
                                        custscript_cntm_is_issue: 'T',
                                        custscript_cntm_is_rework: 'F',
                                        custscript_cntm_wo_bom: woId.bom,
                                        custscript_cntm_fab_item: woId.assemblyItem,
                                        custscript_cntm_pcb_rec: routErrorFile,
                                    };
                                    var scriptTaskId1 = scriptTask1.submit();
                                    var status = task.checkStatus(scriptTaskId1).status;
                                    log.debug(scriptTaskId1);
                                    log.audit('Call 2 :',scriptTaskId);
                                    fabRec.selectLine({
                                        sublistId: "recmachcustrecord_cntm_fab_wo_creation",
                                        line: line,
                                    });
                                    fabRec.setCurrentSublistValue({
                                        sublistId: "recmachcustrecord_cntm_fab_wo_creation",
                                        fieldId: "custrecord_cntm_wo_number_fabwo_crtn",
                                        value: woId.woIdCreated,
                                    });
                                    fabRec.setCurrentSublistValue({
                                        sublistId: "recmachcustrecord_cntm_fab_wo_creation",
                                        fieldId: "custrecord_cntm_is_wo_created",
                                        value: true,
                                    });
                                    fabRec.setCurrentSublistValue({
                                        sublistId: "recmachcustrecord_cntm_fab_wo_creation",
                                        fieldId: "custrecord_cntm_routing_fab_wo_crtn",
                                        value: arry_details[0].mfg, // routing,
                                    });
                                    log.debug("ROUTING :", routing);

                                    fabRec.commitLine({
                                        sublistId: "recmachcustrecord_cntm_fab_wo_creation",
                                    });
                                    log.debug("commit");
                                }
                            }
                        }
                        if (errorWhileRev) {
                            fabRec.setValue({
                                fieldId: "custrecord_cntm_status_fab_wo_crtn",
                                value: 13,
                            });
                            fabRec.setValue({
                                fieldId: "custrecord_cntm_error_fab",
                                value:
                                    "Work Order could not be processed as RDA Revision falling on provided Scheduled Date(s) " +
                                    errorWhileRev +
                                    " could not be found",
                            });
                        } else if (errors) {
                            fabRec.setValue({
                                fieldId: "custrecord_cntm_status_fab_wo_crtn",
                                value: 13,
                            });
                            fabRec.setValue({
                                fieldId: "custrecord_cntm_error_fab",
                                value: errors
                            });
                        } else {
                            fabRec.setValue({
                                fieldId: "custrecord_cntm_status_fab_wo_crtn",
                                value: 8,
                            });
                            fabRec.setValue({
                                fieldId: "custrecord_cntm_error_fab",
                                value: "",
                            });
                        }
                        fabRec.save({
                            ignoreMandatoryFields: true,
                        });
                    } else {
                        log.error("error:", "Please provide at least one line for WO");
                        if (isRepJob == false || isRepJob == "false")
                            record.submitFields({
                                type: recType,
                                id: recId,
                                values: {
                                    custrecord_cntm_status_fab_wo_crtn: 13,
                                    custrecord_cntm_error_fab:
                                        "Please provide at least one line for WO",
                                },
                            });
                    }
                    if ((isRepJob == true || isRepJob == "true") && fabStatus == "") {
                        record.submitFields({
                            type: recType,
                            id: recId,
                            values: {
                                custrecord_cntm_status_fab_wo_crtn: 6,
                                custrecord_cntm_bom_fab: bom,
                                custrecord_cntm_mfg_routing_fab: routing,
                            },
                        });
                    }
                }
            } catch (e) {
                log.error("error summary", e.message);
                var errStatus = 13;
                if (
                    (isRepJob == true || isRepJob == "true") &&
                    (fabStatus == "" || fabStatus == 12)
                )
                    errStatus = 12;
                record.submitFields({
                    type: recType,
                    id: recId,
                    values: {
                        custrecord_cntm_status_fab_wo_crtn: errStatus,
                        custrecord_cntm_error_fab: e.message,
                    },
                });
            }
        }
        function getsubassembly(subassembly) {
            // log.debug("getsubassembly",subassembly)
            var str = subassembly;
            if (subassembly) {
                var res = subassembly.indexOf("-");
                return str.slice(res + 1, str.length);
            }
        }
        function validateData(data) {
            if (data != undefined && data != null && data != "") {
                return true;
            } else {
                return false;
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
                    operator: "contains",
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
            log.debug("itemname", itemname);
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
                    sort: search.Sort.ASC,
                })
            );
            var itemSearchObj = search.create({
                type: "lotnumberedassemblyitem",
                filters: filter,
                columns: column,
            });
            var searchResultCount = itemSearchObj.runPaged().count;
            itemSearchObj.run().each(function (result) {
                itemid = result.id;
                // .run().each has a limit of 4,000 results
            });
            return itemid;
        }

        function getRevisionCount(bomId) {
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
                })
            );

            var bomRevSearchObj = search.create({
                type: "bomrevision",
                filters: filter,
                columns: column,
            });
            lineCount = bomRevSearchObj.runPaged().count;
            /*
             * bomRevSearchObj.run().each(function (result) { itemid =
             * result.getValue({name: 'internalid'}); // .run().each has a
             * limit of 4,000 results });
             */
            return lineCount;
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
        function createwo(fabDetails, values, woid) {
            try {
                var errorRev = "";
                //var errors=""
                var mapToReturn = {};
                log.debug("----START-----");
                log.debug("woid in function  :", woid);
                var bom = values.bomInternalId;
                var routing = values.mfg;
                var assemblyItem = values.item;
                var soLocation = values.fabLocation;
                var parentItem = values.parentItem;
                log.debug("fabDetails :", fabDetails);

                log.debug("values :", values);

                var woRec = record.create({
                    type: record.Type.WORK_ORDER,
                    isDynamic: true,
                });
                log.debug("soSubsidiary", fabDetails.soSubsidiary);
                woRec.setValue({
                    fieldId: "subsidiary",
                    value: fabDetails.soSubsidiary,
                });
                //log.debug('isInterco', isInterco);
                /* if (fabDetails.classToSet) {
                   log.debug('fabDetails.classToSet :', fabDetails.classToSet);
                   woRec.setValue({
                     fieldId: "class",
                     value: fabDetails.classToSet
                   })
         
                   log.debug('Class setted')
                 }*/


                if (fabDetails.isInterco == false || fabDetails.isInterco == "false")
                    woRec.setValue({
                        fieldId: "entity",
                        value: fabDetails.soCustomer,
                    });
                log.debug("soCustomer :", fabDetails.soCustomer);
                /*if (isInterco == true
                                                  || isInterco == 'true')*/
                if (fabDetails.endCustomer)
                    woRec.setValue({
                        fieldId: "custbody_rda_transbody_end_customer",
                        value: fabDetails.endCustomer,
                    });

                log.debug("assemblyItem", assemblyItem);
                woRec.setValue({
                    fieldId: "assemblyitem",
                    value: assemblyItem, //NED TO LOOK HERE
                });
                if (fabDetails.classToSet) {
                    log.debug('fabDetails.classToSet :', fabDetails.classToSet);
                    woRec.setValue({
                        fieldId: "class",
                        value: fabDetails.classToSet
                    })

                    log.debug('Class setted')
                }
                woRec.setValue({
                    fieldId: "location",
                    value: soLocation,
                });
                woRec.setValue({
                    fieldId: "iswip",
                    value: true,
                });
                woRec.setValue({
                    fieldId: "billofmaterials",
                    value: bom, //NEED TO LOOK HERE
                });

                var bomrevisionSearchObj = search.create({
                    type: "bomrevision",
                    filters: [
                        [
                            [
                                ["effectivestartdate", "onorbefore", fabDetails.scheduledDate],
                                "AND",
                                ["effectiveenddate", "onorafter", fabDetails.scheduledDate],
                            ],
                            "OR",
                            [
                                ["effectiveenddate", "isempty", ""],
                                "AND",
                                ["effectivestartdate", "onorbefore", fabDetails.scheduledDate],
                            ],
                        ],
                        "AND",
                        ["billofmaterials", "anyof", bom], //NEED TO LOOK HERE
                    ],
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
                        search.createColumn({
                            name: "internalid",
                            sort: search.Sort.ASC,
                            label: "Internal ID",
                        }),
                    ],
                });
                var searchResultCount = bomrevisionSearchObj.runPaged().count;
                log.debug("bomrevisionSearchObj result count", searchResultCount);
                if (searchResultCount > 0)
                    bomrevisionSearchObj.run().each(function (result) {
                        // .run().each has a
                        // limit
                        // of 4,000 results
                        woRec.setValue({
                            fieldId: "billofmaterialsrevision",
                            value: result.id,
                        });
                        return false;
                    });
                else {

                    mapToReturn["errorRev"] = fabDetails.scheduledDate;
                    return mapToReturn;
                }

                log.debug("routing", routing); // //NEED TO LOOK HERE

                /*woRec.setValue({
                  fieldId:
                    "manufacturingrouting", value: routing
                });*/
                /*
                 * woRec.setValue({ fieldId :
                 * "billofmaterialsrevision", value :
                 * BomRevisionRecordId });
                 */
                woRec.setValue({
                    fieldId: "quantity",
                    value: fabDetails.woQty,
                });
                woRec.setValue({
                    fieldId: "custbody_cnt_created_fm_so",
                    value: fabDetails.so,
                });



                woRec.setValue({
                    fieldId: "job", // "custbody_cnt_job_number",
                    value: fabDetails.job,
                });
                woRec.setValue({
                    fieldId: "custbody_cntm_project",
                    value: fabDetails.job,
                });
                woRec.setValue({
                    fieldId: "custbody_cntm_cust_part_no",
                    value: fabDetails.custPartNo,
                });
                woRec.setValue({
                    fieldId: "custbody_cntm_no_of_panel",
                    value: fabDetails.noOfPanels,
                });

                if (fabDetails.releasedDate) {
                    woRec.setValue({
                        fieldId: "trandate",
                        value: new Date(fabDetails.releasedDate),
                    });
                }

                if (fabDetails.expShipDt) {
                    woRec.setValue({
                        fieldId: "custbody_rda_wo_sched_due_date",
                        value: new Date(fabDetails.expShipDt),
                    });
                }

                log.debug("recId", fabDetails.recId);
                if (fabDetails.toolNum)
                    woRec.setValue({
                        fieldId: "custbody_cntm_tool_number",
                        value: fabDetails.toolNum,
                    });
                woRec.setValue({
                    fieldId: "custbody_pcb_rec_id",
                    value: fabDetails.recId,
                });

                woRec.setValue({
                    fieldId: "custbody_rda_boards_per_panel",
                    value: fabDetails.boardsPerPanel,
                });
                if (fabDetails.relsType)
                    woRec.setValue({
                        fieldId: "custbody_cnt_release_type",
                        value: fabDetails.relsType,
                    });

                if (fabDetails.mlo)
                    woRec.setValue({
                        fieldId: "custbody_cntm_mlo",
                        value: fabDetails.mlo,
                    });
                woRec.setValue({
                    fieldId: "custbody_cntm_so_line_unique_key",
                    value: fabDetails.uniqueKey,
                });
                var woIdCreated = woRec.save();
                log.debug("WORK ORDER :", woIdCreated + "sendWoId :" + values.sendWoId);

                //custbody_cntm_wo_ref_for_to

                mapToReturn["woIdCreated"] = woIdCreated;
                mapToReturn["assemblyItem"] = assemblyItem;
                mapToReturn["bom"] = bom;

                log.debug("mapToReturn after Map :", mapToReturn);

                if (values.sendWoId) {
                    log.debug("mapToReturn :", mapToReturn);
                    return mapToReturn;
                }

                if (values.sendWoId == false) {
                    log.debug("parentItem :", parentItem);
                    var itemidTopass = convertNameIntoId(parentItem); //Get internal id of item
                    log.debug("itemidTopass :", itemidTopass);
                    var nxtWoId = findLastWO(woid, fabDetails.so, itemidTopass);
                    log.debug("nxtWoId :", nxtWoId);

                    log.debug("submit fields");
                    //Setting WO id of 901 location on 3601 location
                    record.submitFields({
                        type: record.Type.WORK_ORDER,
                        id: woIdCreated,
                        values: {
                            custbody_cntm_check_create_to: true,
                            custbody_cntm_wo_ref_for_to: parentItem,
                            custbody_cntm_last_wo_id: nxtWoId,
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true,
                        },
                    });

                    //Setting WO id of 3601 location on 901 location
                    record.submitFields({
                        type: record.Type.WORK_ORDER,
                        id: nxtWoId,
                        values: {
                            custbody_cntm_first_wo_id: woIdCreated,
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true,
                        },
                    });
                }
            } catch (error) {
                log.error("ERROR IN create wo", error);
                mapToReturn["errors"] = error.message ? error.message : error.name;
                log.debug("mapToReturn :", JSON.stringify(mapToReturn));

                return mapToReturn;
            }
        }
        function convertNameIntoId(itemName) {
            // Item Search to get item internal ID
            var itemId;

            var assemblyitemSearchObj = search.create({
                type: "assemblyitem",
                filters: [["type", "anyof", "Assembly"], "AND", ["name", "is", itemName]],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        label: "Internal ID",
                    }),
                    search.createColumn({
                        name: "displayname",
                        label: "Display Name",
                    }),
                ],
            });
            var searchResultCount = assemblyitemSearchObj.runPaged().count;
            log.debug("assemblyitemSearchObj result count", searchResultCount);
            assemblyitemSearchObj.run().each(function (result) {
                // .run().each has a limit of 4,000 results
                itemId = result.getValue({
                    name: "internalid",
                    label: "Internal ID",
                });
                return false;
            });
            return itemId;
        }
        function findLastWO(id, so, item) {
            log.debug("----INSIDE FUNCTION----");
            log.debug("id :", id);
            log.debug("so :", so);
            log.debug("item :", item);

            var workorderSearchObj = search.create({
                type: "workorder",
                filters: [
                    ["type", "anyof", "WorkOrd"],
                    "AND",
                    ["custbody_cnt_created_fm_so", "anyof", so],
                    "AND",
                    ["mainline", "is", "T"],
                    "AND",
                    ["createdfrom", "anyof", id],
                ],
                columns: ["internalid", "item"],
            });
            var searchResultCount = workorderSearchObj.runPaged().count;
            log.debug("workorderSearchObj result count", searchResultCount);
            var ids = [];
            var WOID;
            if (searchResultCount > 0) {
                workorderSearchObj.run().each(function (result) {
                    // .run().each has a limit of 4,000 results
                    log.debug("result item :", result.getValue({ name: "item" }));
                    if (result.getValue({ name: "item" }) == item) {
                        WOID = result.id;
                        log.debug("WOID FALSE :", WOID);
                        return false;
                    }
                    ids.push(result.id);
                    log.debug(" ids :", ids);
                    return true;
                });
                if (!WOID) {
                    WOID = findLastWO(ids, so, item);
                    log.debug("CALLED FUNCTION INSIDE", WOID);
                }

                log.debug("OUTSIDE", WOID);
                return WOID;
            }
        }
        function itemConfigLocation(itemType) {
            var probeLoc;
            log.debug("==IN FUNCTION:", itemType);

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
            log.debug("itemConfigCount2", itemConfigCount2);

            itemConfigSearch2.run().each(function (result) {
                probeLoc = result.getValue({
                    name: "custrecord_cntm_location",
                    label: "Location",
                });
                log.debug("probeLoc :", probeLoc);
                return false;
            });

            return probeLoc;
        }
        return {
            getInputData: getInputData,
            map: map,
            // reduce : reduce,
            summarize: summarize,
        };
    });
