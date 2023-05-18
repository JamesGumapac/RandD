/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(["N/file", "N/record", "N/search", "N/runtime"], /**
 * @param {file}
 *            file
 * @param {record}
 *            record
 * @param {search}
 *            search
 */
  function (file, record, search, runtime) {
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
      log.debug('-------INPUT-------')

      var id = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_file_id",
      });
      //log.debug("id :", id);

      var fileObj = file.load({
        id: id,
      });
      /*
       * var searcId = runtime.getCurrentScript().getParameter({ name :
       * 'custscript_cntm_csv_file_id' });
       */
      var searchLoaded = loadSearch(); //Field mapping custom record

      var subsidiary = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_subsidiary",
      });
      //log.debug("subsidiary", subsidiary);  //3

      var toolNumber = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_toolnumber",
      });
      //log.debug("substoolNumberidiary", toolNumber); //141348

      var iterator = fileObj.lines.iterator();

      var map = process(iterator, searchLoaded, subsidiary, toolNumber);
      /**
       * iterator = Number of lines in file ,
       *  searchLoaded = custom record search, 
       * subsidiary = 3,
       *  toolNumber =141348
       */

      /*
       * var map = { 'fab' : { 'test' : 1 }, 'asm' : { 'test' : 2 },
       * 'part' : { 'test' : 3 } }
       */
      log.debug("map", JSON.stringify(map));
      return map;
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
    function map(context) {
      log.debug('------MAP------');
      // log.debug('context', context);
      var key = context.key;
      // log.debug("typeof context.value", typeof context.value);
      var itemLine = context.value;
      // if(typeof context.value== 'Object')

      try {
        log.debug('key: ' + key, 'itemLine: ' + itemLine);

        var QrecId = runtime.getCurrentScript().getParameter({
          name: "custscript_cntm_recid",
        });
        //log.debug("QrecId :", QrecId);//1299258

        var QrecType = runtime.getCurrentScript().getParameter({
          name: "custscript_cntm_rectype",
        });
        //log.debug("QrecType :", QrecType); //estimate

        if (key == "quoteFlds") {
          itemLine = JSON.parse(context.value);
        } else if (key == "error") {
        } else {
          itemLine = JSON.parse(context.value);
          var itemType = key.split("-")[1]; //FAB
          var itemFlds = itemLine.itemFlds; // JSON
          var subsidiary = itemLine.subsidiary; //3
          // var mloFlag = 
          //log.debug("subsidiary_before", subsidiary); //3
          if (!subsidiary)
            subsidiary = runtime.getCurrentScript().getParameter({
              name: "custscript_cntm_subsidiary",
            });
          //log.debug('subsidiary_after',subsidiary);//3
          var toolNumber = itemLine.toolNumber;
          delete itemLine["itemFlds"];
          // itemLine.delete('lineMap');
          delete itemLine["subsidiary"];
          delete itemLine["toolNumber"];


          log.debug('itemType Old :', itemType);
          if (itemLine.mloPresent == true) {
            var itemConfigObj = itemConfigValues("MLO", subsidiary);
            log.debug("itemConfigObj", JSON.stringify(itemConfigObj));

            if (!itemConfigObj)
              itemConfigObj = itemConfigValues("MLO", subsidiary);
          } else {
            var itemConfigObj = itemConfigValues(itemType, subsidiary);
            log.debug("itemConfigObj", JSON.stringify(itemConfigObj));

            if (!itemConfigObj)
              itemConfigObj = itemConfigValues(itemType, subsidiary);
          }

          if (itemType == "PARTS" || itemType == "INT") { //for quote import 3 -itemType = FAB
            delete itemLine[itemConfigObj.itemSuffixFileLabel];
            var itemId;
            if (itemType == "PARTS") {
              itemId = runtime.getCurrentScript().getParameter({
                name: "custscript_cntm_parts_item",
              });
            } else if (itemType == "INT") {
              itemId = runtime.getCurrentScript().getParameter({
                name: "custscript_cntm_int_item",
              });
            }
            if (itemId) {
              var itemFieldLookUp = search.lookupFields({
                type: "item",
                id: itemId,
                columns: ["itemid"],
              });
              itemLine.itemName = itemFieldLookUp.itemid;
            }
          } else {
            var qtFieldLookUp = search.lookupFields({
              type: QrecType,
              id: QrecId,
              columns: [
              /*itemConfigObj.itemPrefixId,*/ itemConfigObj.itemMidValId, //custbody_cntm_tool_number
                itemConfigObj.descSuffixId, //custbody_cntm_cust_part_no
              ],
            });
            //var itemPrefix;
            var itemMidVal = "",
              itemSuffix = "",
              descSuffix = "";
            //log.debug('qtFieldLookUp', JSON.stringify(qtFieldLookUp));
            if (qtFieldLookUp) {
              if (qtFieldLookUp[itemConfigObj.itemMidValId][0])
                if (qtFieldLookUp[itemConfigObj.itemMidValId][0].text)
                  itemMidVal = qtFieldLookUp[itemConfigObj.itemMidValId][0].text;
              if ("cpn" in itemFlds) descSuffix = itemFlds.cpn;
              else {
                if (qtFieldLookUp[itemConfigObj.descSuffixId])
                  descSuffix = qtFieldLookUp[itemConfigObj.descSuffixId];
              }
            }
            log.debug('lookupfieldsVal', itemPrefix + ' ' + itemMidVal + ' ' + descSuffix);

            var itemPrefix = itemConfigObj.itemPrefixId; //RD
            itemSuffix = itemLine[itemConfigObj.itemSuffixFileLabel];
            if (!itemSuffix) itemSuffix = itemType;
            delete itemLine[itemConfigObj.itemSuffixFileLabel];
            var itemDescription = itemConfigObj.descText + " " + descSuffix;

            var itemName = itemPrefix + "-" + itemMidVal + "-" + itemSuffix.toUpperCase();
            itemLine.itemName = itemName;
            itemLine.location = itemConfigObj.location;

            var itemSearch = search.create({
              type: "item",
              filters: [["name", "is", itemName]],
              columns: [
                search.createColumn({
                  name: "internalid",
                }),
              ],
            });
            var itemCount = itemSearch.runPaged().count;

            // log.debug('itemCount', itemCount); //1
            // log.debug('itemName', itemName); //RD-2020720-PCB

            var recType,
              defaultValues,
              salesDesc = false;
            // log.debug('itemType IN switch case :',itemType);
            switch (itemType) {
              case "FAB":
                recType = record.Type.LOT_NUMBERED_ASSEMBLY_ITEM;
                defaultValues = null;
                break;
              case "ASM":
                recType = record.Type.SERIALIZED_ASSEMBLY_ITEM;
                defaultValues = null;
                break;
              case "RDIS":
                recType = record.Type.SERIALIZED_ASSEMBLY_ITEM; //SERIALIZED_INVENTORY_ITEM;//Chnage dated 4/14/21
                defaultValues = null;
                break;
              case "MECH1":
                recType = record.Type.OTHER_CHARGE_ITEM;//record.Type.ASSEMBLY_ITEM;  //change 10/6
                defaultValues = null;
                break;
              case "MECH2":
                recType = record.Type.OTHER_CHARGE_ITEM;//record.Type.ASSEMBLY_ITEM;  //change 10/6
                defaultValues = null;
                break;
              case "MECH3":
                recType = record.Type.OTHER_CHARGE_ITEM;//record.Type.ASSEMBLY_ITEM;  //change 10/6
                defaultValues = null;
                break;
              case "STIFF":
                recType = record.Type.OTHER_CHARGE_ITEM;  //Added 10/6
                defaultValues = null;
                break;
              /*
               * case 'PARTS': recType =
               * record.Type.OTHER_CHARGE_ITEM; defaultValues = {
               * 'subtype' : 'sale' }; salesDesc = true; break;
               * case 'INT': recType = record.Type.SERVICE_ITEM;
               * defaultValues = { 'subtype' : 'sale' }; salesDesc =
               * true; break;
               */
              default:
                recType = record.Type.INVENTORY_ITEM;
                defaultValues = null;
                salesDesc = true;
            }
            //log.debug('here',recType);



            var objRecord;
            var RDISrec;
            var vendorRD = runtime.getCurrentScript().getParameter({
              name: "custscript_cntm_rdis_prefrd_vendor",
            });

            // if (subsidiary == 4)
            var vendorRDIS = runtime.getCurrentScript().getParameter({
              name: "custscript_cntm_rdis_prefrd_vendor_rdis",
            });
            //log.debug("vendorRDIS", vendorRDIS);


            //Below creating item record
            if (itemCount == 0) {
              log.debug("here in create", recType); //Look here
              objRecord = record.create({
                type: recType,
                defaultValues: defaultValues,
                isDynamic: true,
              });
              objRecord.setValue({
                fieldId: "itemid",
                value: itemName,
              });

              objRecord.setValue({
                fieldId: "subsidiary",
                value: 1,
              });
              objRecord.setValue({
                fieldId: "includechildren",
                value: true,
              });
              objRecord.setText({
                fieldId: "unitstype",
                text: "EACH",
              });
              objRecord.setText({
                fieldId: "custitem_cntm_subtype",
                text: itemType,
              });

              // log.debug("itemConfigObj 1", JSON.stringify(itemConfigObj));

              if (itemConfigObj.cogsAcct)
                objRecord.setValue({
                  fieldId: "cogsaccount",
                  value: itemConfigObj.cogsAcct,
                });
              if (itemConfigObj.assetAcct)
                objRecord.setValue({
                  fieldId: "assetaccount",
                  value: itemConfigObj.assetAcct,
                });
              if (itemConfigObj.wipAcct)
                objRecord.setValue({
                  fieldId: "wipacct",
                  value: itemConfigObj.wipAcct,
                });
              if (itemConfigObj.incomeAcct)
                objRecord.setValue({
                  fieldId: "incomeaccount",
                  value: itemConfigObj.incomeAcct,
                });
              if (itemConfigObj.wipCost)
                objRecord.setValue({
                  fieldId: "wipvarianceacct",
                  value: itemConfigObj.wipCost,
                });
              if (itemConfigObj.scrpAcct)
                objRecord.setValue({
                  fieldId: "scrapacct",
                  value: itemConfigObj.scrpAcct,
                });

              //CHeck box check karaycha ahe
              if (itemLine.mloPresent == true) {
                objRecord.setValue({
                  fieldId: "custitem_rda_mlo",
                  value: true,
                });
              } else {
                objRecord.setValue({
                  fieldId: "custitem_rda_mlo",
                  value: false,
                });

              }


              objRecord.setValue({
                fieldId: "taxschedule",
                value: 2,
              });
              objRecord.setValue({
                fieldId: "autopreferredstocklevel",
                value: false,
              });
              objRecord.setValue({
                fieldId: "autoreorderpoint",
                value: false,
              });
              objRecord.setValue({
                fieldId: "department",
                value: itemConfigObj.department,
              });
              objRecord.setValue({
                fieldId: "description",
                value: itemDescription,
              });

              var rdisPCBRec;
              if (itemType == "RDIS" || ((itemType == "FAB" || itemType == "ASM") && subsidiary == 4)) {
                if (itemType == "RDIS") {
                  objRecord.setValue({
                    fieldId: "cost",
                    value: 100000,
                  });
                  /*
                   * itemName = 'RDIS' + '-' + itemMidVal +
                   * '-' + itemSuffix.toUpperCase();
                   */
                  if ("rdisPCB" in itemFlds) {
                    itemLine.rdisPCB = true;
                    var _itemConfigObj = itemConfigValues("FAB", subsidiary);
                    //log.debug("_itemConfigObj", JSON.stringify(_itemConfigObj));


                    if (!_itemConfigObj)
                      _itemConfigObj = itemConfigValues("FAB", subsidiary);
                    var _qtFieldLookUp = search.lookupFields({
                      type: QrecType,
                      id: QrecId,
                      columns: [
                        /*_itemConfigObj.itemPrefixId,*/
                        _itemConfigObj.itemMidValId,
                        _itemConfigObj.descSuffixId,
                      ],
                    });

                    //log.debug("_qtFieldLookUp", JSON.stringify(_qtFieldLookUp));

                    //var _itemPrefix;
                    var _itemMidVal = "",
                      _itemSuffix = "",
                      _descSuffix = "";
                    // //log.debug('qtFieldLookUp', JSON
                    // .stringify(qtFieldLookUp));
                    if (_qtFieldLookUp) {
                      /*if (_qtFieldLookUp[_itemConfigObj.itemPrefixId][0].value)
                            _itemPrefix = _qtFieldLookUp[_itemConfigObj.itemPrefixId][0].value;
                          var _itemPrifixSearch = search
                              .create({
                                type : "customrecord_cntm_item_prefix_sub",
                                filters : [ [
                                    "custrecord_cntm_subsidiary",
                                    "anyof",
                                    _itemPrefix ] ],
                                columns : [
                                    search
                                        .createColumn({
                                          name : "custrecord_cntm_item_name_prefix",
                                          label : "Item Prefix from"
                                        }), ]
                              });
                          var _itemPrifixSearchCount = _itemPrifixSearch
                              .runPaged().count;
                          _itemPrifixSearch
                              .run()
                              .each(
                                  function(result) {
                                    // .run().each
                                    // has a
                                    // limit
                                    // of 4,000
                                    // results
                                    _itemPrefix = result
                                        .getValue({
                                          name : 'custrecord_cntm_item_name_prefix'
                                        });
                                    return false;
                                  });*/
                      if (_qtFieldLookUp[_itemConfigObj.itemMidValId][0].text)
                        _itemMidVal = _qtFieldLookUp[_itemConfigObj.itemMidValId][0].text;
                      if ("cpn" in itemFlds) _descSuffix = itemFlds.cpn;
                      else {
                        if (_qtFieldLookUp[_itemConfigObj.descSuffixId])
                          _descSuffix = _qtFieldLookUp[_itemConfigObj.descSuffixId];
                      }
                    }

                    /*
                     * _itemSuffix =
                     * itemLine[_itemConfigObj.itemSuffixFileLabel];
                     * if (!_itemSuffix) _itemSuffix =
                     * 'CON'; delete
                     * itemLine[_itemConfigObj.itemSuffixFileLabel];
                     */
                    var _itemPrefix = _itemConfigObj.itemPrefixId;
                    var _itemDescription = _itemConfigObj.descText + " " + _descSuffix;

                    var conItemName = _itemPrefix + "-" + _itemMidVal + "-" + "CON";
                    var itemSearch = search.create({
                      type: "item",
                      filters: [["name", "is", conItemName]],
                      columns: [
                        search.createColumn({
                          name: "internalid",
                        }),
                      ],
                    });
                    var _itemCount = itemSearch.runPaged().count;
                    if (_itemCount == 0) {
                      rdisPCBRec = record.create({
                        type: record.Type.LOT_NUMBERED_ASSEMBLY_ITEM,
                        // defaultValues :
                        // defaultValues,
                        isDynamic: true,
                      });
                      rdisPCBRec.setValue({
                        fieldId: "itemid",
                        value: conItemName,
                      });
                      // RDIS change dated 4/14/21

                      rdisPCBRec.setValue({
                        fieldId: "subsidiary",
                        value: 1,
                      });
                      rdisPCBRec.setValue({
                        fieldId: "includechildren",
                        value: true,
                      });

                      // if (itemType != 'PARTS') {
                      rdisPCBRec.setText({
                        fieldId: "unitstype",
                        text: "EACH",
                      });
                      // log.audit('in PARTS');
                      // }
                      rdisPCBRec.setText({
                        fieldId: "custitem_cntm_subtype",
                        text: "FAB",
                      });
                      if (_itemConfigObj.cogsAcct)
                        rdisPCBRec.setValue({
                          fieldId: "cogsaccount",
                          value: _itemConfigObj.cogsAcct,
                        });
                      if (_itemConfigObj.assetAcct)
                        rdisPCBRec.setValue({
                          fieldId: "assetaccount",
                          value: _itemConfigObj.assetAcct,
                        });
                      if (_itemConfigObj.wipAcct)
                        rdisPCBRec.setValue({
                          fieldId: "wipacct",
                          value: _itemConfigObj.wipAcct,
                        });
                      if (_itemConfigObj.incomeAcct)
                        rdisPCBRec.setValue({
                          fieldId: "incomeaccount",
                          value: _itemConfigObj.incomeAcct,
                        });
                      if (_itemConfigObj.wipCost)
                        rdisPCBRec.setValue({
                          fieldId: "wipvarianceacct",
                          value: _itemConfigObj.wipCost,
                        });
                      if (_itemConfigObj.scrpAcct)
                        rdisPCBRec.setValue({
                          fieldId: "scrapacct",
                          value: _itemConfigObj.scrpAcct,
                        });
                      rdisPCBRec.setValue({
                        fieldId: "taxschedule",
                        value: 1,
                      });
                      rdisPCBRec.setValue({
                        fieldId: "autopreferredstocklevel",
                        value: false,
                      });
                      rdisPCBRec.setValue({
                        fieldId: "autoreorderpoint",
                        value: false,
                      });
                      rdisPCBRec.setValue({
                        fieldId: "department",
                        value: _itemConfigObj.department,
                      });
                      rdisPCBRec.setValue({
                        fieldId: "description",
                        value: _itemDescription,
                      });

                      if (_itemConfigObj.prefBinRd) {
                        rdisPCBRec.selectNewLine({
                          sublistId: "binnumber",
                        });
                        rdisPCBRec.setCurrentSublistValue({
                          sublistId: "binnumber",
                          fieldId: "location",
                          value: _itemConfigObj.rdLocation,
                        });
                        rdisPCBRec.setCurrentSublistValue({
                          sublistId: "binnumber",
                          fieldId: "binnumber",
                          value: _itemConfigObj.prefBinRd,
                        });
                        rdisPCBRec.setCurrentSublistValue({
                          sublistId: "binnumber",
                          fieldId: "preferredbin",
                          value: true,
                        });
                        rdisPCBRec.commitLine({
                          sublistId: "binnumber",
                        });
                      }
                      if (_itemConfigObj.prefBinRdis) {
                        rdisPCBRec.selectNewLine({
                          sublistId: "binnumber",
                        });
                        rdisPCBRec.setCurrentSublistValue({
                          sublistId: "binnumber",
                          fieldId: "location",
                          value: _itemConfigObj.rdisLocation,
                        });
                        rdisPCBRec.setCurrentSublistValue({
                          sublistId: "binnumber",
                          fieldId: "binnumber",
                          value: _itemConfigObj.prefBinRdis,
                        });
                        rdisPCBRec.setCurrentSublistValue({
                          sublistId: "binnumber",
                          fieldId: "preferredbin",
                          value: true,
                        });
                        rdisPCBRec.commitLine({
                          sublistId: "binnumber",
                        });
                      }

                      if (vendorRD) {
                        rdisPCBRec.selectNewLine({
                          sublistId: "itemvendor",
                        });
                        rdisPCBRec.setCurrentSublistValue({
                          sublistId: "itemvendor",
                          fieldId: "vendor",
                          value: vendorRD,
                        });
                        rdisPCBRec.setCurrentSublistValue({
                          sublistId: "itemvendor",
                          fieldId: "vendorcode",
                          value: conItemName,
                        });
                        rdisPCBRec.setCurrentSublistValue({
                          sublistId: "itemvendor",
                          fieldId: "preferredvendor",
                          value: true,
                        });
                        rdisPCBRec.commitLine({
                          sublistId: "itemvendor",
                        });
                      }
                      if (vendorRDIS) {
                        rdisPCBRec.selectNewLine({
                          sublistId: "itemvendor",
                        });
                        rdisPCBRec.setCurrentSublistValue({
                          sublistId: "itemvendor",
                          fieldId: "vendor",
                          value: vendorRDIS,
                        });
                        rdisPCBRec.setCurrentSublistValue({
                          sublistId: "itemvendor",
                          fieldId: "vendorcode",
                          value: conItemName,
                        });
                        rdisPCBRec.setCurrentSublistValue({
                          sublistId: "itemvendor",
                          fieldId: "preferredvendor",
                          value: true,
                        });
                        rdisPCBRec.commitLine({
                          sublistId: "itemvendor",
                        });
                      }
                    }
                  }
                }
                if (subsidiary == 4) vendorRD = vendorRDIS;
                if (vendorRD) {
                  objRecord.selectNewLine({
                    sublistId: "itemvendor",
                  });
                  objRecord.setCurrentSublistValue({
                    sublistId: "itemvendor",
                    fieldId: "vendor",
                    value: vendorRD,
                  });
                  objRecord.setCurrentSublistValue({
                    sublistId: "itemvendor",
                    fieldId: "vendorcode",
                    value: itemName,
                  });
                  objRecord.setCurrentSublistValue({
                    sublistId: "itemvendor",
                    fieldId: "preferredvendor",
                    value: true,
                  });
                  objRecord.commitLine({
                    sublistId: "itemvendor",
                  });
                }

                /*
                 * objRecord.setValue({ fieldId :
                 * 'isspecialorderitem', value : true });
                 * RDISrec = record .create({ type :
                 * record.Type.SERIALIZED_ASSEMBLY_ITEM,
                 * defaultValues : defaultValues, isDynamic :
                 * true });
                 *
                 * RDISrec.setValue({ fieldId : 'itemid',
                 * value : itemName });
                 *
                 * RDISrec.setValue({ fieldId :
                 * 'subsidiary', value : 2 }); // if
                 * (itemType != 'PARTS') { RDISrec.setText({
                 * fieldId : 'unitstype', text : 'EACH' }); //
                 * log.audit('in PARTS'); // }
                 * RDISrec.setText({ fieldId :
                 * 'custitem_cntm_subtype', text : itemType
                 * }); RDISrec.setValue({ fieldId :
                 * 'cogsaccount', value : 1158 });
                 * RDISrec.setValue({ fieldId :
                 * 'assetaccount', value : 347 });
                 * RDISrec.setValue({ fieldId :
                 * 'taxschedule', value : 1 });
                 * RDISrec.setValue({ fieldId :
                 * 'autopreferredstocklevel', value : false
                 * }); RDISrec.setValue({ fieldId :
                 * 'autoreorderpoint', value : false });
                 * RDISrec.setValue({ fieldId :
                 * 'department', value : department });
                 * RDISrec.setValue({ fieldId :
                 * 'description', value : itemDescription
                 * });
                 */ // Comented for change Dated 4/14/21
              }
              
              if (itemType == "FAB" || itemType == "ASM" || itemType == "RDIS") {
                if (itemConfigObj.prefBinRd) {
                  objRecord.selectNewLine({
                    sublistId: "binnumber",
                  });
                  objRecord.setCurrentSublistValue({
                    sublistId: "binnumber",
                    fieldId: "location",
                    value: itemConfigObj.rdLocation,
                  });
                  objRecord.setCurrentSublistValue({
                    sublistId: "binnumber",
                    fieldId: "binnumber",
                    value: itemConfigObj.prefBinRd,
                  });
                  objRecord.setCurrentSublistValue({
                    sublistId: "binnumber",
                    fieldId: "preferredbin",
                    value: true,
                  });
                  objRecord.commitLine({
                    sublistId: "binnumber",
                  });
                }
                if (itemConfigObj.prefBinRdis) {
                  objRecord.selectNewLine({
                    sublistId: "binnumber",
                  });
                  objRecord.setCurrentSublistValue({
                    sublistId: "binnumber",
                    fieldId: "location",
                    value: itemConfigObj.rdisLocation,
                  });
                  objRecord.setCurrentSublistValue({
                    sublistId: "binnumber",
                    fieldId: "binnumber",
                    value: itemConfigObj.prefBinRdis,
                  });
                  objRecord.setCurrentSublistValue({
                    sublistId: "binnumber",
                    fieldId: "preferredbin",
                    value: true,
                  });
                  objRecord.commitLine({
                    sublistId: "binnumber",
                  });
                }
              }
              for (var i in itemFlds) {
                setFldVal(objRecord, i, itemFlds[i]);
                if (rdisPCBRec) setFldVal(rdisPCBRec, i, itemFlds[i]);
                /*
                 * if (RDISrec) { setFldVal(RDISrec, i,
                 * itemFlds[i]); }
                 */ // Comented for change Dated 4/14/21
              }
            } else {
              // //log.debug('here.');
              var internalId;
              itemSearch.run().each(function (result) {
                // .run().each has a limit of 4,000 results
                internalId = result.getValue({
                  name: "internalid",
                });
                return false;
              });
              //log.debug("internalId", internalId);

              objRecord = record.load({
                type: recType,
                id: internalId,
                // defaultValues : defaultValues,
                isDynamic: true,
              });
            }


            objRecord.setText({
              fieldId: "custitem_cntm_subtype",
              text: itemType,
            });

            //Setting up division Department - While updating
            log.debug('itemConfigObj.department :', itemConfigObj.department);
            if (itemConfigObj.department) {
              objRecord.setValue({
                fieldId: "department",
                value: itemConfigObj.department,
              });
            }

            if (itemLine.mloPresent == true) {
              objRecord.setValue({
                fieldId: "custitem_rda_mlo",
                value: true,
              });
            } else {
              objRecord.setValue({
                fieldId: "custitem_rda_mlo",
                value: false,
              });

            }





            // //log.debug('after setting text+id');
            if (salesDesc == true)
              objRecord.setValue({
                fieldId: "salesdescription",
                value: itemDescription,
              });
            // //log.debug('after setting description');


            var itemId = objRecord.save({
              enableSourcing: false,
              ignoreMandatoryFields: true,
            });
            if (itemType == "FAB" && itemConfigObj.rdLocation) {
              var objRecord1 = record.load({
                type: recType,
                id: itemId,
                // defaultValues : defaultValues,
                isDynamic: true,
              });
              var lineNumber = objRecord1
                .findSublistLineWithValue({
                  sublistId: "locations",
                  fieldId: "location",
                  value: itemConfigObj.rdLocation,
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
            if (rdisPCBRec)
              var rdisPCBRecId = rdisPCBRec.save({
                enableSourcing: false,
                ignoreMandatoryFields: true,
              });
            /*
             * if (RDISrec) var RDISrecId = RDISrec.save({
             * enableSourcing : false, ignoreMandatoryFields :
             * true });
             */ // Comented for change Dated 4/14/21
            log.debug("itemId", itemId);
          }
        }
        context.write({
          key: key,
          value: itemLine,
        });
      } catch (e) {
        log.error("error_map", e.message);
        itemLine.error = e.message;
        context.write({
          key: key,
          value: itemLine,
        });
      }
    }
    function isNotEmpty(obj) {
      return obj && JSON.stringify(obj) != "{}";
    }

    function setFldVal(objRecord, id, val) {
      var fld = objRecord.getField({
        fieldId: id,
      });
      // log.audit('fld',fld)
      if (isNotEmpty(fld)) {
        var fldType = fld.type;
        // log.audit('fldType',fldType);
        /*
         * switch (fldType) { case 'select': objRecord.setText({
         * fieldId : id, text : val }); break; case 'integer':
         * objRecord.setValue({ fieldId : id, value : Number(val)
         * }); break; case 'float': objRecord.setValue({ fieldId :
         * id, value : Number(val) }); break; default:
         * objRecord.setValue({ fieldId : id, value : val }); }
         */
        if (fldType == "select") {
          objRecord.setText({
            fieldId: id,
            text: val,
          });
        } else
          objRecord.setValue({
            fieldId: id,
            value: val,
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
    /*
     * function reduce(context) { }
     */

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
      log.debug('------SUMMARIZE------');
      // log.debug("summary", summary);
      var recId = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_recid",
      });
      //log.debug("recId", recId);

      var recType = runtime.getCurrentScript().getParameter({
        name: "custscript_cntm_rectype",
      });
      //log.debug("recType", recType);

      var inputSummary = summary.inputSummary;
      var mapSummary = summary.mapSummary;
      var statusId;
      var errMap = {};
      var errVal = "";
      var noOfLines = 0;
      var designItem;
      var siENGItem;
      var partsItem;
      var intItem;
      var piENGItem;
      var vnaItem;
      var bagTagItem;
      try {
        //log.debug("mapSummary.errors", JSON.stringify(mapSummary.errors));
        if (isNotEmpty(inputSummary.errors) || isNotEmpty(mapSummary.errors)) {
          var id = record.submitFields({
            type: recType,
            id: recId,
            values: {
              custbody_cntm_import_status: 3,
              custbody_cntm_error_field: "Error while Item creation",
            },
          });
        } else {
          var mapValue = {};

          summary.mapSummary.errors.iterator().each(function (key, value) {
            // log.debug(key, "ERROR String: " + value);

            return true;
          });

          var quoteRec = record.load({
            id: recId,
            type: recType,
            isDynamic: true,
          });
          var quoteFlds;
          var error;
          var lineCount = quoteRec.getLineCount({
            sublistId: "item",
          });
          // log.debug("lineCount", lineCount);
          if (lineCount > 0) {
            for (var line = lineCount - 1; line >= 0; line--) {
              // //log.debug(line);
              // try {
              quoteRec.removeLine({
                sublistId: "item",
                line: line,
                // ignoreRecalc:true
              });
              /*
               * } catch (e) { quoteRec.removeLine({ sublistId :
               * 'item', line : line }); }
               */
            }
          }
          /*
           * var afterLineCount = quoteRec.getLineCount({
           * sublistId : 'item' }); //log.debug('afterLineCount',
           * afterLineCount);
           */

          summary.output.iterator().each(function (key, value) {
            // var key = key;
            log.debug("key: " + key, "value: " + value);

            if (key == "error") {
              var id = record.submitFields({
                type: recType,
                id: recId,
                values: {
                  custbody_cntm_import_status: 3,
                  custbody_cntm_error_field: value,
                },
              });
              errVal = value;
              return false;
            } else if (key == "quoteFlds") {
              var lineValues = JSON.parse(value);
              quoteFlds = lineValues;
            } else {
              var lineValues = JSON.parse(value);
              var itemType = key.split("-")[1];
              var itemName = lineValues.itemName;
              if ("error" in lineValues) {
                errVal = lineValues.error;
                /*
                 * if(!lineValues.error in
                 * errMap){
                 * errMap[lineValues.error].error=lineValues.error
                 * errMap[lineValues.error].items=[]; }
                 * errMap
                 * [lineValues.error].items.push(itemName);
                 */
              } else {
                var location = lineValues.location;
                var memo = lineValues[itemType + "NOTES"];
                var nreItems = lineValues.nreItems;
                var rdisPcb = lineValues.rdisPCB;
                var mloCheckBoxValue = lineValues.mloPresent;

                // log.audit("rdisPcb", rdisPcb);
                delete lineValues["itemName"];
                delete lineValues["location"];
                delete lineValues[itemType + "NOTES"];
                delete lineValues["nreItems"];
                delete lineValues["rdisPCB"];
                delete lineValues["mloPresent"];

                log.debug("lineValues", lineValues);
                for (var j in lineValues) {
                  var innerMap = lineValues[j];
                  //log.debug("innerMap", innerMap);
                  /*
                   * if (typeof innerMap ==
                   * 'Object' &&
                   * isNotEmpty(innerMap)) {
                   */
                  quoteRec.selectNewLine({
                    sublistId: "item",
                  });
                  quoteRec.setCurrentSublistText({
                    sublistId: "item",
                    fieldId: "item",
                    text: itemName,
                  });
                  quoteRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "location",
                    value: location,
                  });
                  quoteRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_cntm_memo",
                    value: memo,
                  });
                  //mloCheckBoxValue
                  if (mloCheckBoxValue) {
                    quoteRec.setCurrentSublistValue({
                      sublistId: "item",
                      fieldId: "custcol_rda_mlo_checkbox",
                      value: mloCheckBoxValue,
                    });
                  }



                  if (itemType == "RDIS" && (rdisPcb == true || rdisPcb == "true")) {
                    quoteRec.setCurrentSublistValue({
                      sublistId: "item",
                      fieldId: "custcol_rda_pcb_required",
                      value: true,
                    });
                  }
                  var noOfinnerLines = 0;
                  for (var k in innerMap) {
                    noOfLines++;
                    noOfinnerLines++;

                    //log.debug(j, k + " " + innerMap[k]);  //quantity 8
                    quoteRec.setCurrentSublistValue({
                      sublistId: "item",
                      fieldId: k,
                      value: Number(innerMap[k]),
                    });
                    // }
                  }
                  //log.debug("noOfinnerLines", noOfinnerLines);
                  if (noOfinnerLines > 0)
                    quoteRec.commitLine({ sublistId: "item", });
                }
                if (nreItems)
                  if (nreItems.length > 0)
                    for (var i = 0; i < nreItems.length; i++) {
                      var innerMap = nreItems[i];
                      var nreItem = runtime.getCurrentScript().getParameter({
                        name: "custscript_cntm_nre_item",
                      });
                      //log.debug("innerMap--", innerMap);

                      /*
                       * delete
                       * innerMap['itemName'];
                       *
                       */
                      for (var k in innerMap) {
                        var nreItemSearch = search.create({
                          type: "item",
                          filters: [["name", "is", k]],
                          columns: [
                            search.createColumn({
                              name: "internalid",
                            }),
                          ],
                        });
                        var nreItemCount = nreItemSearch.runPaged().count;
                        //log.debug("nreItemCount", nreItemCount);
                        if (nreItemCount > 0) {
                          quoteRec.selectNewLine({
                            sublistId: "item",
                          });
                          quoteRec.setCurrentSublistText({
                            sublistId: "item",
                            fieldId: "item",
                            text: k,
                          });
                          quoteRec.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "quantity",
                            value: 1,
                          });
                          quoteRec.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "rate",
                            value: innerMap[k],
                          });

                          // return
                          // false;
                          // }
                          quoteRec.commitLine({
                            sublistId: "item",
                          });
                        }
                      }
                    }
                //log.debug("lineValues", lineValues);
              }
            }
            // mapValue[key] = lineValues;
            return true;
          });
          // //log.debug('mapValue', JSON.stringify(mapValue));
          if (errVal) {
            // if (noOfLines == 0) {
            var id = record.submitFields({
              type: recType,
              id: recId,
              values: {
                custbody_cntm_import_status: 3,
                custbody_cntm_error_field: errVal,
                // 'Please provide atleast one line item'
              },
            });
            /*
             * } else { quoteRec.setValue({ fieldId :
             * 'custbody_cntm_import_status', value : 3 });
             * quoteRec.setValue({ fieldId :
             * 'custbody_cntm_error_field', value : errVal });
             * var id = quoteRec.save(); }
             */
            //log.debug("id", id);
          } else {
            if (quoteFlds) {
              designItem = quoteFlds["DESIGN"] ? quoteFlds["DESIGN"] : "";
              siENGItem = quoteFlds["SI_ENG"] ? quoteFlds["SI_ENG"] : "";
              partsItem = quoteFlds["PARTS"] ? quoteFlds["PARTS"] : "";
              intItem = quoteFlds["INT"] ? quoteFlds["INT"] : "";
              piENGItem = quoteFlds["PI_ENG"] ? quoteFlds["PI_ENG"] : "";
              vnaItem = quoteFlds["VNA Testing"] ? quoteFlds["VNA Testing"] : "";
              bagTagItem = quoteFlds["Bag and Tag"] ? quoteFlds["Bag and Tag"] : "";
              delete quoteFlds["DESIGN"];
              delete quoteFlds["SI_ENG"];
              delete quoteFlds["PARTS"];
              delete quoteFlds["INT"];
              delete quoteFlds["PI_ENG"];
              delete quoteFlds["VNA Testing"];
              delete quoteFlds["Bag and Tag"];
              for (var i in quoteFlds) {
                // var value = quoteFlds[i];
                setFldVal(quoteRec, i, quoteFlds[i]);
                /*
                 * // var str = j.split('Q')[1]; // //
                 * //log.debug('str',str); var result = true;
                 * if (value) { var patt1 = /[a-zA-Z]/g;
                 * result = patt1.test(value); } if (result ==
                 * false) { value = Number(value); } else { }
                 */
                /*
                 * quoteRec.setValue({ fieldId : i, value :
                 * value });
                 */
              }
            }
            quoteRec.setValue({
              fieldId: "custbody_cntm_import_status",
              value: 2,
            });
            quoteRec.setValue({
              fieldId: "custbody_cntm_error_field",
              value: "",
            });
            if (noOfLines > 0) {
              if (designItem) {
                var item = designItem.name;
                var rate = designItem.rate;
                var itemFieldLookUp = search.lookupFields({
                  type: "item",
                  id: item,
                  columns: ["itemid"],
                });
                var itemName = itemFieldLookUp.itemid;
                quoteRec.selectNewLine({
                  sublistId: "item",
                });
                quoteRec.setCurrentSublistText({
                  sublistId: "item",
                  fieldId: "item",
                  text: itemName,
                });

                quoteRec.setCurrentSublistValue({
                  sublistId: "item",
                  fieldId: "rate",
                  value: rate,
                });
                quoteRec.commitLine({
                  sublistId: "item",
                });
              }
              if (siENGItem) {
                var item = siENGItem.name;
                var rate = siENGItem.rate;
                var itemFieldLookUp = search.lookupFields({
                  type: "item",
                  id: item,
                  columns: ["itemid"],
                });
                var itemName = itemFieldLookUp.itemid;
                quoteRec.selectNewLine({
                  sublistId: "item",
                });
                quoteRec.setCurrentSublistText({
                  sublistId: "item",
                  fieldId: "item",
                  text: itemName,
                });

                quoteRec.setCurrentSublistValue({
                  sublistId: "item",
                  fieldId: "rate",
                  value: rate,
                });
                quoteRec.commitLine({
                  sublistId: "item",
                });
              }
              if (partsItem) {
                var item = partsItem.name;
                var rate = partsItem.rate;
                quoteRec.selectNewLine({
                  sublistId: "item",
                });
                quoteRec.setCurrentSublistText({
                  sublistId: "item",
                  fieldId: "item",
                  text: "PARTS",
                });

                quoteRec.setCurrentSublistValue({
                  sublistId: "item",
                  fieldId: "rate",
                  value: rate,
                });
                quoteRec.commitLine({
                  sublistId: "item",
                });
              }
              if (intItem) {
                var item = intItem.name;
                var rate = intItem.rate;
                quoteRec.selectNewLine({
                  sublistId: "item",
                });
                quoteRec.setCurrentSublistText({
                  sublistId: "item",
                  fieldId: "item",
                  text: "INT",
                });

                quoteRec.setCurrentSublistValue({
                  sublistId: "item",
                  fieldId: "rate",
                  value: rate,
                });
                quoteRec.commitLine({
                  sublistId: "item",
                });
              }
              if (piENGItem) {
                var item = piENGItem.name;
                var rate = piENGItem.rate;
                var itemFieldLookUp = search.lookupFields({
                  type: "item",
                  id: item,
                  columns: ["itemid"],
                });
                var itemName = itemFieldLookUp.itemid;
                quoteRec.selectNewLine({
                  sublistId: "item",
                });
                quoteRec.setCurrentSublistText({
                  sublistId: "item",
                  fieldId: "item",
                  text: itemName,
                });

                quoteRec.setCurrentSublistValue({
                  sublistId: "item",
                  fieldId: "rate",
                  value: rate,
                });
                quoteRec.commitLine({
                  sublistId: "item",
                });
              }
              if (vnaItem) {
                var item = vnaItem.name;
                var rate = vnaItem.rate;
                var itemFieldLookUp = search.lookupFields({
                  type: "item",
                  id: item,
                  columns: ["itemid"],
                });
                var itemName = itemFieldLookUp.itemid;
                quoteRec.selectNewLine({
                  sublistId: "item",
                });
                quoteRec.setCurrentSublistText({
                  sublistId: "item",
                  fieldId: "item",
                  text: itemName,
                });

                quoteRec.setCurrentSublistValue({
                  sublistId: "item",
                  fieldId: "rate",
                  value: rate,
                });
                quoteRec.commitLine({
                  sublistId: "item",
                });
              }
              if (bagTagItem) {
                var item = bagTagItem.name;
                var rate = bagTagItem.rate;
                var itemFieldLookUp = search.lookupFields({
                  type: "item",
                  id: item,
                  columns: ["itemid"],
                });
                var itemName = itemFieldLookUp.itemid;
                quoteRec.selectNewLine({
                  sublistId: "item",
                });
                quoteRec.setCurrentSublistText({
                  sublistId: "item",
                  fieldId: "item",
                  text: itemName,
                  //value : item
                });

                quoteRec.setCurrentSublistValue({
                  sublistId: "item",
                  fieldId: "rate",
                  value: rate,
                });
                quoteRec.commitLine({
                  sublistId: "item",
                });
              }
            }

            var id = quoteRec.save();
            //log.debug("id", id);
          }
        }
      } catch (e) {
        log.error("error", e.message);
        var id = record.submitFields({
          type: recType,
          id: recId,
          values: {
            custbody_cntm_import_status: 3,
            custbody_cntm_error_field: e.message,
          },
        });
      }
    }
    function itemConfigValues(itemType, subsidiary) {
      // try {
      //log.debug("INSIDE itemConfigValues");
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
            name: "custrecord_cntm_income_acct", // ,
            // label : "Department"
          }),
          search.createColumn({
            name: "custrecord_cntm_cogs_acct", // ,
            // label : "Department"
          }),
          search.createColumn({
            name: "custrecord_cntm_asset_acct", // ,
            // label : "Department"
          }),
          search.createColumn({
            name: "custrecord_cntm_wip_acct", // ,
            // label : "Department"
          }),
          search.createColumn({
            name: "custrecord_cntm_wip_cost_var_acct", // ,
            // label : "Department"
          }),
          search.createColumn({
            name: "custrecord_cntm_scrap_acct", // ,
            // label : "Department"
          }),
          search.createColumn({
            name: "custrecord_cntm_pref_bin", // ,
            // label : "Department"
          }),
          search.createColumn({
            name: "custrecord_cntm_rdis_prefrd_bin_rdis",
          }),
        ],
      });
      var itemConfigCount = itemConfigSearch.runPaged().count;
      // //log.debug('itemConfigCount',itemConfigCount);
      var configObj = {};
      configObj.itemPrefixId = "";
      configObj.itemMidValId = "";
      configObj.itemSuffixFileLabel = "";
      configObj.descText = "";
      configObj.descSuffixId = "";
      // var location;
      // var rdisLocation;
      // var department;
      // var cogsAcct, assetAcct, incomeAcct, wipAcct, wipCost,
      // scrpAcct, prefBin;
      itemConfigSearch.run().each(function (result) {
        // .run().each has a limit of 4,000
        // results
        configObj.itemPrefixId = result.getValue({
          name: "custrecord_cntm_itemname_prefix",
        });
        configObj.itemMidValId = result.getValue({
          name: "custrecord_cntm_item_midval",
        });
        configObj.itemSuffixFileLabel = result.getValue({
          name: "custrecord_cntm_item_suffix",
        });
        configObj.descText = result.getValue({
          name: "custrecord_cntm_dec_val",
        });
        configObj.descSuffixId = result.getValue({
          name: "custrecord_cntm_desc_suffix",
        });
        configObj.rdLocation = result.getValue({
          name: "custrecord_cntm_location",
        });
        configObj.rdisLocation = result.getValue({
          name: "custrecord_cntm_rdis_location",
        });
        configObj.prefBinRd = result.getValue({
          name: "custrecord_cntm_pref_bin",
        });
        configObj.prefBinRdis = result.getValue({
          name: "custrecord_cntm_rdis_prefrd_bin_rdis",
        });
        if (subsidiary == 4) {
          configObj.location = configObj.rdisLocation;
          configObj.prefBin = configObj.prefBinRdis;
        } else {
          configObj.location = configObj.rdLocation;
          configObj.prefBin = configObj.prefBinRd;
        }

        configObj.department = result.getValue({
          name: "custrecord_cntm_department",
        });
        // log.audit('department',
        // department);
        configObj.cogsAcct = result.getValue({
          name: "custrecord_cntm_cogs_acct",
        });
        configObj.assetAcct = result.getValue({
          name: "custrecord_cntm_asset_acct",
        });
        configObj.incomeAcct = result.getValue({
          name: "custrecord_cntm_income_acct",
        });
        configObj.wipAcct = result.getValue({
          name: "custrecord_cntm_wip_acct",
        });
        configObj.wipCost = result.getValue({
          name: "custrecord_cntm_wip_cost_var_acct",
        });
        configObj.scrpAcct = result.getValue({
          name: "custrecord_cntm_scrap_acct",
        });

        return false;
      });
      //log.debug("itemConfigCount", itemConfigCount);
      /*
       * } catch (e) { log.error('error in config', e.message); }
       */
      return configObj;
    }


    function process(iterator, mapSearch, subsidiary, toolNumber) {
      var flag = "";
      var mapping = searchMapping(mapSearch);
      // log.audit('mapping', JSON.stringify(mapping));
      // var mappingQuote =
      var mappedFlds = {};
      var quoteFlds = {};
      var itemFlds = {};
      var quoteLines = {};
      var blankLines = {};
      var lineCount = 0;
      var cpn = "";
      var itemNumber = 0;
      var missingItem = [];
      var designItem, siEnggItem;
      var rdisPCB = false;
      var mloPresent = false;

      iterator.each(function (line) {
        var lineVal = line.value.split("=");
        // log.debug('lineVal', lineVal);



        //Check IF MLO present of not 1.0
        // if((lineVal[0].indexOf('MLO')!==-1) ||  mloPresent == true){
        //   mloPresent = true;
        // }else{
        //   mloPresent = false;
        // }



        //Check IF MLO present of not 1.1
        if ((lineVal[0] == "MLO Boards Per Panel") || mloPresent == true) {
          if ((parseInt(lineVal[1] * 1)) === NaN) {
          } else if ((parseInt(lineVal[1] * 1)) != "" && (parseInt(lineVal[1] * 1)) != null && !((parseInt(lineVal[1] * 1)) <= 0)) {
            // log.debug("INSIDEEEE.....");
            mloPresent = true;
          }
        } else {
          mloPresent = false;
          // log.debug("NOT INSIDEEEE.....");
        }

        /* FOR CONSOLE
        var line = "MLO Boards Per Panel=sd";
        var lineVal = line.split("=");
        console.log("lineVal", lineVal);
  
        var second = parseInt(lineVal[1] * 1);
        console.log("sec", typeof second);
  
        if (lineVal[0] == "MLO Boards Per Panel") {
          if (second === NaN) {
          } else if (second != "" && second != null && !(second <= 0)) {
            console.log("Inside", second);
          }
        }
        */








        if (lineVal[0] == "START") {
          itemNumber++;
          flag = itemNumber + "-" + lineVal[1];

          quoteLines[flag] = {};
          // itemLines++;
          // } else if (flag && lineVal[0] == flag +
          // 'NOTES') {
          // flag = '';
        } else {
          if (flag == "") {
            if (lineVal[0] in mapping.quote) {
              // log.debug("--lineVal[0]", lineVal[0]); //File madl nav
              var quoteMap = mapping.quote;
              if (lineCount < 4) {
                var copyFromFile = runtime.getCurrentScript().getParameter({
                  name: "custscript_cntm_copyfromfile",
                });
                // log.debug('copyFromFile',copyFromFile);
                if (copyFromFile == true || copyFromFile == "true") {
                  quoteFlds[quoteMap[lineVal[0]]] = lineVal[1];
                  if (lineVal[0] == "PartNum") cpn = lineVal[1];
                }
              } else {

                // log.debug("quoteMap[lineVal[0]]", quoteMap[lineVal[0]]); //file madhlya nav cha intermal id
                quoteFlds[quoteMap[lineVal[0]]] = lineVal[1];
              }
            }
            if (lineVal[0] in mapping.item) {
              var itemMap = mapping.item;
              itemFlds[itemMap[lineVal[0]]] = lineVal[1];
            }
          } else {
            // log.debug("flag", flag); //1-FAB

            var Qlines = lineVal[0].split("_");
            // log.debug('Qlines',Qlines);

            var result = true;
            if (Qlines[0]) {
              var str = Qlines[0].split("Q")[1];
              // log.debug('str',str);

              if (str) {
                var patt1 = /[a-zA-Z]/g;
                result = patt1.test(str);
              }
            }
            if (result == false) {
              // log.debug('Qlines[1].split(flag)[1]',Qlines[1].split(flag)[1]);
              // log.debug('fldVal', fldVal);

              var itemType = flag.split("-")[1];
              var fldVal = mapping.lines[Qlines[1].split(itemType)[1]];
              // log.debug('Qlines[0]:'+Qlines[0],'fldVal: '+fldVal);

              if (fldVal) {
                if (blankLines[flag] && blankLines[flag].indexOf(Qlines[0]) > -1) {
                } else {
                  if (fldVal == "quantity" && (!lineVal[1] || lineVal[1] == 0)) {
                    if (quoteLines[flag][Qlines[0]])
                      delete quoteLines[flag][Qlines[0]];
                    if (!blankLines[flag]) blankLines[flag] = [];
                    if (blankLines[flag].indexOf(Qlines[0]) <= -1)
                      blankLines[flag].push(Qlines[0]);
                  } else {
                    var val = {};
                    val[fldVal] = lineVal[1];
                    if (!flag in quoteLines) quoteLines[flag] = {};
                    if (!Qlines[0] in quoteLines[flag])
                      quoteLines[flag][Qlines[0]] = {};
                    // log.debug('quoteLines[flag]',JSON.stringify(quoteLines[flag])); 
                    //   {
                    //     FAB_Label: "PCB"
                    //  } //Map creating here
                    if (quoteLines[flag].FAB_Label == 'PCB') {
                      // log.debug('WANTED')
                      quoteLines[flag]["mloPresent"] = mloPresent;
                    }


                    // log.debug('quoteLines[flag][Qlines[0]]',JSON.stringify(quoteLines[flag][Qlines[0]]));
                    // log.debug('quoteLines[flag][Qlines[0]]',JSON.stringify(quoteLines[flag]));

                    if (!quoteLines[flag][Qlines[0]]) {
                      quoteLines[flag][Qlines[0]] = val;
                    } else quoteLines[flag][Qlines[0]][fldVal] = lineVal[1];
                    quoteLines[flag].subsidiary = subsidiary;
                    quoteLines[flag].toolNumber = toolNumber;
                  }
                }
              }
            } else {
              if (lineVal[0] == "DESIGN") {
                if (lineVal[1] && lineVal[1] != 0) {
                  var desgnItem = runtime.getCurrentScript().getParameter({
                    name: "custscript_cntm_design_item",
                  });
                  var map = {};
                  map.name = desgnItem;
                  map.rate = lineVal[1];
                  quoteFlds["DESIGN"] = map;
                }
              } else if (lineVal[0] == "SI_ENG") {
                if (lineVal[1] && lineVal[1] != 0) {
                  var siEngItem = runtime.getCurrentScript().getParameter({
                    name: "custscript_cntm_si_eng_item",
                  });
                  var map = {};
                  map.name = siEngItem;
                  map.rate = lineVal[1];
                  quoteFlds["SI_ENG"] = map;
                }
              } else if (lineVal[0] == "Bag and Tag") {
                if (
                  lineVal[1] &&
                  (lineVal[1] == 1 || lineVal[1] == "True" || lineVal[1] == "Yes")
                ) {
                  var bagTagItem = runtime.getCurrentScript().getParameter({
                    name: "custscript_cntm_bag_n_tag_item",
                  });
                  var map = {};
                  map.name = bagTagItem;
                  map.rate = 0;
                  quoteFlds["Bag and Tag"] = map;
                }
              }
            /*
             * else if (lineVal[0] == 'PARTS') {
             * if (lineVal[1] && lineVal[1] !=
             * 0) { var partsItem = runtime
             * .getCurrentScript()
             * .getParameter( { name :
             * 'custscript_cntm_parts_item' });
             * var map = {}; map.name =
             * partsItem; map.rate = lineVal[1];
             * quoteFlds['PARTS'] = map; } }
             * else if (lineVal[0] == 'INT') {
             * if (lineVal[1] && lineVal[1] !=
             * 0) { var intItem = runtime
             * .getCurrentScript()
             * .getParameter( { name :
             * 'custscript_cntm_int_item' });
             * var map = {}; map.name = intItem;
             * map.rate = lineVal[1];
             * quoteFlds['INT'] = map; } }
             */ else if (lineVal[0] == "PI_ENG") {
                if (lineVal[1] && lineVal[1] != 0) {
                  var piEngItem = runtime.getCurrentScript().getParameter({
                    name: "custscript_cntm_pi_eng",
                  });
                  var map = {};
                  map.name = piEngItem;
                  map.rate = lineVal[1];
                  quoteFlds["PI_ENG"] = map;
                }
              } else if (lineVal[0] == "VNA Testing") {
                if (lineVal[1] && lineVal[1] != 0) {
                  var vnaItem = runtime.getCurrentScript().getParameter({
                    name: "custscript_cntm_vna_item",
                  });
                  var map = {};
                  map.name = vnaItem;
                  map.rate = lineVal[1];
                  quoteFlds["VNA Testing"] = map;
                }
              } else if (lineVal[0] == "RDIS PCB") {
                if (lineVal[1] && lineVal[1] == "T") {
                  rdisPCB = true;
                  // quoteFlds['rdisPCB'] =
                  // lineVal[1];
                }
              } else if (lineVal[0].indexOf("_") > -1) {
                var nreStrArr = lineVal[0].split("_");
                var nreStrLength = nreStrArr.length;
                var nreStr = nreStrArr[nreStrLength - 1];
                // //log.debug('nreStr: ' +
                // nreStr,'nreStrArr[0]: '+
                // nreStrArr[0]+ ' flag: ' +
                // flag);
                if (nreStr == "NRE"
                  /*
                   * &&
                   * nreStrArr[0] ==
                   * flag.split('-')[1]
                   */
                ) {
                  var nreMap = {};
                  // var nreVal =
                  // lineVal[0].replace(nreStrArr[0]+
                  // '_', '');
                  if (lineVal[1] && lineVal[1] != 0) {
                    nreMap[lineVal[0]] = lineVal[1];
                    if (!quoteLines[flag].nreItems) {
                      quoteLines[flag].nreItems = [];
                    }
                    quoteLines[flag]["nreItems"].push(nreMap);
                    log.debug(
                      "quoteLines[flag].nreItems",
                      quoteLines[flag].nreItems
                    );
                  }
                } else quoteLines[flag][lineVal[0]] = lineVal[1];
              } else if (lineVal[0].split(flag.split("-")[1])[1] == "NOTES") {
                quoteLines[flag][lineVal[0]] = lineVal[1];
                var notes = lineVal[1].split(":");
                if (mapping.item[notes[0]])
                  itemFlds[mapping.item[notes[0]]] = notes[1];
              } else {
                // quoteLines[flag][lineVal[0]] =
                // lineVal[1];
                if (lineVal[0]) missingItem.push(lineVal[0]);
              }
              // log.audit(
              //   "lineVal[0].split(" + flag.split("-")[1] + ")",
              //   lineVal[0].split(flag.split("-")[1])
              // );
              /*
               * if (flag && lineVal[0] == flag
               * +'NOTES') flag = '';
               */
            }
          }
        }
        lineCount++;
        return true;
      });
      var errObj = {};
      if (itemNumber == 0) {
        errObj.error = "File doesen't contain Item line details or File is not in proper format.";
        return errObj;
      } else if (missingItem.length > 0) {
        errObj.error = "Item/s not found in Netsuite :" + missingItem.join("\n");
        return errObj;
      } else {
        // quoteFlds.blankLines=blankLines;
        // log.audit("quoteFlds", quoteFlds);
        if (cpn) itemFlds.cpn = cpn;
        if (rdisPCB) itemFlds.rdisPCB = rdisPCB;
        for (var k in quoteLines) {
          quoteLines[k]["itemFlds"] = itemFlds;
        }

        quoteLines["quoteFlds"] = quoteFlds;

        // log.audit('quoteLines', JSON.stringify(quoteLines));
        return quoteLines;
      }
    }

    function searchMapping(searchObj) {
      // can be handled by providing
      // filters
      var map = {};
      var quoteMap = {};
      var itemMap = {};
      var lineMap = {};
      var count = searchObj.runPaged().count;

      if (searchObj && count > 0) {
        searchObj.run().each(function (result) {
          var type = result.getText({
            name: "custrecord7",
          });
          var nsFld = result.getText({
            name: "custrecord2",
          });
          var fileFld = result.getText({
            name: "custrecord3",
          });

          if (type.indexOf("Quote") > -1) quoteMap[fileFld] = nsFld;
          if (type.indexOf("Item") > -1) itemMap[fileFld] = nsFld;
          if (type.indexOf("Quote Line") > -1) lineMap[fileFld] = nsFld;

          return true;
        });
      }
      map.quote = quoteMap;
      map.item = itemMap;
      map.lines = lineMap;
      return map;
    }

    function loadSearch() {
      // //log.debug("INSIDE loadSearch");
      var mapSearch = search.create({
        type: "customrecord489",
        // filters : [ [ "custrecord7", "is", type ] ],
        columns: [
          search.createColumn({
            name: "custrecord7",
          }),
          search.createColumn({
            name: "custrecord3",
          }),
          search.createColumn({
            name: "custrecord2",
          }),
          search.createColumn({
            name: "custrecord_cntm_fld_type",
          }),
        ],
      });
      // var itemCount = mapSearch.runPaged().count;
      // //log.debug("mapSearch :", mapSearch);
      return mapSearch;
    }

    return {
      getInputData: getInputData,
      map: map,
      // reduce : reduce,
      summarize: summarize,
    };
  });