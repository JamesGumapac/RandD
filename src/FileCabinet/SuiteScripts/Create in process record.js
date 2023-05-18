/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */

define(['N/search','N/record'],

		function(search, record) {

	/**
	 * Definition of the Scheduled script trigger point.
//	 *
	 * @param {Object} scriptContext
	 * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
	 * @Since 2015.2
	 */

var globalArr=[];

            function execute(scriptContext) {
                try {
                    var myarr = [];
                    var myobj = {};

                    var customrecord_cntm_client_app_asm_operSearchObj = search.create({
                        type: "customrecord_cntm_client_app_asm_oper",
                        filters:
                            [
                                ["custrecord_cntm_remaining_qty", "greaterthan", "0"],
                                "AND",
                                ["custrecord_cntm_asm_wo_ref", "anyof", "1008635"]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "custrecord_cntm_remaining_qty", label: "remaining Qty" }),
                                search.createColumn({ name: "custrecord_cntm_asm_wo_ref", label: "WO reference" }),
                                search.createColumn({ name: "custrecord_cntm_next_op_next", label: "Next Operation Text" }),
                                search.createColumn({ name: "custrecord_cntm_asm_op_text", label: "Operation num and Text" })
                            ]
                    });
                    var mysearchResultCount = customrecord_cntm_client_app_asm_operSearchObj.runPaged().count;
                   // log.debug("customrecord_cntm_client_app_asm_operSearchObj result count", searchResultCount);
                    customrecord_cntm_client_app_asm_operSearchObj.run().each(function (result) {
                        var myobj = {};
                        var op = result.getValue(search.createColumn({ name: "custrecord_cntm_asm_op_text", label: "Operation num and Text" }));
                        myobj["op"] = op;
                        var opnext = result.getValue(search.createColumn({ name: "custrecord_cntm_next_op_next", label: "Next Operation Text" }));
                        myobj["opnext"] = opnext;
                        myarr.push(myobj);
                        return true;
                    });
                    log.debug("myarr", myarr)




                    var customrecord_cntm_asm_serial_idsSearchObj = search.create({
                        type: "customrecord_cntm_asm_serial_ids",
                        filters:
                            [
                                ["custrecord10.status", "anyof", "WorkOrd:D"],
                                "AND",
                                ["custrecord10.mainline", "is", "T"],
                                "AND",
                                ["custrecord10", "anyof", "1008635"]
                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "name",
                                    sort: search.Sort.ASC,
                                    label: "Name"
                                }),
                                search.createColumn({ name: "custrecord_cntm_is_scrap", label: "Is Scrap" }),
                                search.createColumn({ name: "custrecord_cntm_asm_scrap_rsn", label: "Scrap Reason" }),
                                search.createColumn({ name: "custrecord_cntm_is_process", label: "Is Processed" }),
                                search.createColumn({ name: "custrecord10", label: "WO" }),
                                search.createColumn({ name: "custrecord_cntm_item_serial_id", label: "ASM Item" }),
                                search.createColumn({
                                    name: "manufacturingrouting",
                                    join: "CUSTRECORD10",
                                    label: "Manufacturing Routing"
                                }),
                                search.createColumn({
                                    name: "custbody_rda_wo_priorty",
                                    join: "CUSTRECORD10",
                                    label: "WO Priorty"
                                })
                            ]
                    });
                    var searchResultCount = customrecord_cntm_asm_serial_idsSearchObj.runPaged().count;
                  //  log.debug("customrecord_cntm_asm_serial_idsSearchObj result count", searchResultCount);
                    customrecord_cntm_asm_serial_idsSearchObj.run().each(function (result) {
                        var operationrouting = result.getValue(search.createColumn({
                            name: "manufacturingrouting",
                            join: "CUSTRECORD10",
                            label: "Manufacturing Routing"
                        }));
                        getRoutingTime(operationrouting);
                        log.debug("globalarray", globalArr)
                    });
                    customrecord_cntm_asm_serial_idsSearchObj.run().each(function (result) {

                        log.debug("record create initialize")
                        var operationRecord = record.create({
                            type: 'customrecord_cntm_client_app_asm_oper_s',
                            isDynamic: true,
                        });



                        var operationrouting = result.getValue(search.createColumn({
                            name: "manufacturingrouting",
                            join: "CUSTRECORD10",
                            label: "Manufacturing Routing"
                        }));


                        operationRecord.setValue({
                            fieldId: 'custrecordcntm_client_asm_priority',
                            value: result.getValue(search.createColumn({
                                name: "custbody_rda_wo_priorty",
                                join: "CUSTRECORD10",
                                label: "WO Priorty"
                            }))
                        });





                        operationRecord.setValue({
                            fieldId: 'name',
                            value: result.getValue(search.createColumn({ name: "name", sort: search.Sort.ASC, label: "Name" }))
                        });
                        operationRecord.setValue({
                            fieldId: 'custrecord_cntm_client_asm_serial_no',
                            value: result.getValue(search.createColumn({ name: "name", sort: search.Sort.ASC, label: "Name" }))
                        });

                        operationRecord.setValue({
                            fieldId: 'custrecordcntm_client_asm_is_scrapped',
                            value: result.getValue(search.createColumn({ name: "custrecord_cntm_is_scrap", label: "Is Scrap" }))
                        });

                        operationRecord.setValue({
                            fieldId: 'custrecord_cntm_client_asm_is_comp',
                            value: result.getValue(search.createColumn({ name: "custrecord_cntm_is_process", label: "Is Processed" }))
                        });
                        operationRecord.setValue({
                            fieldId: 'custrecordcntm_client_asm_wo_ref',
                            value: result.getValue(search.createColumn({ name: "custrecord10", label: "WO" }))
                        });

                        operationRecord.setValue({
                            fieldId: 'custrecord_cntm_client_asm_asm_item',
                            value: result.getValue(search.createColumn({ name: "custrecord_cntm_item_serial_id", label: "ASM Item" }))
                        });




                        var scrap = result.getValue(search.createColumn({ name: "custrecord_cntm_is_scrap", label: "Is Scrap" }));
                        var process = result.getValue(search.createColumn({ name: "custrecord_cntm_is_process", label: "Is Processed" }));
                       // log.debug("scrap", scrap)
                       // log.debug("process", process)

                        if (scrap == true || process == true) {
                            if (process == true) {

                                operationRecord.setValue({
                                    fieldId: 'custrecordcntm_client_asm_last_op',
                                    value: getlastoperation(operationrouting)
                                });

                                operationRecord.setValue({
                                    fieldId: 'custrecord_cntm_client_asm_nextop',
                                    value: getlastoperation(operationrouting)
                                });

                            }
                            else {
                                operationRecord.setValue({
                                    fieldId: 'custrecordcntm_client_asm_last_op',
                                    value: getstartoperation(operationrouting)
                                });
                                operationRecord.setValue({
                                    fieldId: 'custrecord_cntm_client_asm_nextop',
                                    value: getstartoperation(operationrouting)
                                });

                            }


                            operationRecord.setValue({
                                fieldId: 'custrecordcntm_client_asm_last_comp_op',
                                value: getstartoperation(operationrouting)
                            });

                            globalArr.forEach(element => {
                                if (getstartoperation(operationrouting) == element.operation) {
                                    operationRecord.setValue({
                                        fieldId: 'custrecordcntm_client_asm_laborsetuptime',
                                        value: element.setup
                                    });

                                    operationRecord.setValue({
                                        fieldId: 'custrecord_cnmt_asm_laborruntime',
                                        value: element.run
                                    });
                                }

                            });



                            var lastcompsequence = getstartoperation(operationrouting);
                            operationRecord.setValue({
                                fieldId: 'custrecord_cntm_client_asm_sequence',
                                value: lastcompsequence.split(" ")[0]
                            });
                        }
                        else {

                            if (mysearchResultCount > 0) {
                                operationRecord.setValue({
                                    fieldId: 'custrecord_cntm_client_asm_nextop',
                                    value: myarr[mysearchResultCount - 1].opnext
                                });

                                if (!myarr[mysearchResultCount - 1].opnext) {
                                    log.debug("next operation found empty", getlastoperation(operationrouting))
                                    operationRecord.setValue({
                                        fieldId: 'custrecord_cntm_client_asm_nextop',
                                        value: getlastoperation(operationrouting)
                                    });
                                }


                                globalArr.forEach(element => {
                                    if (myarr[mysearchResultCount - 1].op == element.operation) {
                                        operationRecord.setValue({
                                            fieldId: 'custrecordcntm_client_asm_laborsetuptime',
                                            value: element.setup
                                        });

                                        operationRecord.setValue({
                                            fieldId: 'custrecord_cnmt_asm_laborruntime',
                                            value: element.run
                                        });
                                    }

                                });

                                operationRecord.setValue({
                                    fieldId:'custrecordcntm_client_asm_status',
                                    value:1
                                });

                                operationRecord.setValue({
                                    fieldId: 'custrecordcntm_client_asm_last_comp_op',
                                    value: myarr[mysearchResultCount - 1].op
                                });

                                operationRecord.setValue({
                                    fieldId: 'custrecord_cntm_client_asm_sequence',
                                    value: (myarr[mysearchResultCount - 1].op).split(" ")[0]
                                });

                                mysearchResultCount--;
                            }
                            else {
                                operationRecord.setValue({
                                    fieldId: 'custrecordcntm_client_asm_last_op',
                                    value: getstartoperation(operationrouting)
                                });

                                operationRecord.setValue({
                                    fieldId: 'custrecordcntm_client_asm_last_comp_op',
                                    value: getstartoperation(operationrouting)
                                });

                                operationRecord.setValue({
                                    fieldId: 'custrecord_cntm_client_asm_nextop',
                                    value: getstartoperation(operationrouting)
                                });

                                globalArr.forEach(element => {
                                    if (getstartoperation(operationrouting) == element.operation) {
                                        operationRecord.setValue({
                                            fieldId: 'custrecordcntm_client_asm_laborsetuptime',
                                            value: element.setup
                                        });

                                        operationRecord.setValue({
                                            fieldId: 'custrecord_cnmt_asm_laborruntime',
                                            value: element.run
                                        });
                                    }

                                });

                                var lastcompsequence = getstartoperation(operationrouting);
                                operationRecord.setValue({
                                    fieldId: 'custrecord_cntm_client_asm_sequence',
                                    value: lastcompsequence.split(" ")[0]
                                });
                            }

                        }

                        var operationRecordid = operationRecord.save();
                        log.debug('operationRecord', operationRecordid)

                        var scrapreason = result.getValue(search.createColumn({ name: "custrecord_cntm_asm_scrap_rsn", label: "Scrap Reason" }));
                       // log.debug("scrap reason", scrapreason)
                        if (scrapreason) {
                            try {
                                var sublistRecord = record.create({
                                    type: 'customrecord_cntm_asm_client_app_s',
                                    isDynamic: true,
                                });

                                sublistRecord.setValue({
                                    fieldId: 'custrecord_cntm_sublst_scrapinfo',
                                    value: scrapreason
                                });

                                sublistRecord.setValue({
                                    fieldId: 'custrecord_cntm_sublst_wo_ref',
                                    value: result.getValue(search.createColumn({ name: "custrecord10", label: "WO" }))
                                });


                                sublistRecord.setValue({
                                    fieldId: 'custrecord_cntm_sublst_parentop',
                                    value: operationRecordid,
                                });
                                var sublistrec = sublistRecord.save();
                                log.debug('sublistrec', sublistrec)


                            }

                            catch (error) {
                                log.error("error in creating scrap record", error)
                            }



                        }


                        return true;
                    });

                }
		catch(error)
		{
			log.error('error.message'+error.message, JSON.stringify(error));
		}
	}

    
    function getRoutingTime(operationrouting)
    {
        try {

            var manufacturingroutingsrch = search.create({
                type: "manufacturingrouting",
                filters:
                    [
                        ["internalid", "anyof", operationrouting]
                    ],
                columns:
                    [
                        search.createColumn({ name: "sequence", sort: search.Sort.ASC, label: "Operation Sequence" }),
                        search.createColumn({ name: "operationname", label: "Operation Name" }),
                        search.createColumn({ name: "setuptime", label: "Setup Time" }),
                        search.createColumn({ name: "runrate", label: "Run Rate" })
                    ]
            });
            var searchResultCount = manufacturingroutingsrch.runPaged().count;
           // log.debug("manufacturingroutingsrch result count", searchResultCount);


            manufacturingroutingsrch.run().each(function (result) {
                var obj = {};
                var endingOp = result.getValue({ name: "operationname", label: "Operation Name" });
                var opSeq = result.getValue({ name: "sequence", sort: search.Sort.ASC, label: "Operation Sequence" });
                var endingOperation = opSeq + " " + endingOp;

                obj['operation'] = endingOperation;
                obj['setup'] = result.getValue(search.createColumn({ name: "setuptime", label: "Setup Time" }));
                obj['run'] = result.getValue(search.createColumn({ name: "runrate", label: "Run Rate" }));
                globalArr.push(obj);

                return true;



            });
        }
        catch (error) {
            log.debug("Error occurred", error)
        }
       
    }

    function getlastoperation(operationrouting)
    {
        var endingOperation;

        var manufacturingroutingSearchObj = search.create({
            type: "manufacturingrouting",
            filters:
                [
                    ["internalid", "anyof", operationrouting]
                ],
            columns:
                [
                    search.createColumn({ name: "sequence", sort: search.Sort.DESC, label: "Operation Sequence" }),
                    search.createColumn({ name: "operationname", label: "Operation Name" }),
                    search.createColumn({ name: "setuptime", label: "Setup Time" }),
                    search.createColumn({ name: "runrate", label: "Run Rate" })
                ]
        });
        var searchResultCount = manufacturingroutingSearchObj.runPaged().count;
      //  log.debug("manufacturingroutingSearchObj result count", searchResultCount);


        manufacturingroutingSearchObj.run().each(function (result) {


            var endingOp = result.getValue({ name: "operationname", label: "Operation Name" })
            var opSeq = result.getValue({ name: "sequence", sort: search.Sort.DESC, label: "Operation Sequence" })
            endingOperation = opSeq + " " + endingOp;



            return false;



        });
        return endingOperation;

    }

    function getstartoperation(operationrouting)
    {
        var endingOperation;

        var manufacturingroutingSearchObj = search.create({
            type: "manufacturingrouting",
            filters:
                [
                    ["internalid", "anyof", operationrouting]
                ],
            columns:
                [
                    search.createColumn({ name: "sequence", sort: search.Sort.ASC, label: "Operation Sequence" }),
                    search.createColumn({ name: "operationname", label: "Operation Name" }),
                    search.createColumn({ name: "setuptime", label: "Setup Time" }),
                    search.createColumn({ name: "runrate", label: "Run Rate" })
                ]
        });
        var searchResultCount = manufacturingroutingSearchObj.runPaged().count;
      //  log.debug("manufacturingroutingSearchObj result count", searchResultCount);


        manufacturingroutingSearchObj.run().each(function (result) {


            var endingOp = result.getValue({ name: "operationname", label: "Operation Name" })
            var opSeq = result.getValue({ name: "sequence", sort: search.Sort.ASC, label: "Operation Sequence" })
            endingOperation = opSeq + " " + endingOp;



            return false;



        });
        return endingOperation;

    }

	return {
		execute: execute
	};

});





