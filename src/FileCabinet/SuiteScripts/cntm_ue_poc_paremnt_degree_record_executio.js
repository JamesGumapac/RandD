/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 @date          18/01/2022 
 *@description   Edit and save the child record sublist of client APP

 * Sr. No   	 Date           	  Author                  	Remarks
 * 1		  18 Jan 2022 		   Shweta Badagu    	 -   Edit and Save the child record		 
 */
define(['N/ui/serverWidget', 'N/runtime', 'N/record', 'N/currentRecord', 'N/url','N/task', 'N/https', 'N/redirect'],

    function (serverWidget, runtime, record, currentRecord, url,task, https, redirect) {

        function afterSubmit(scriptContext) {

            try {
                var wocmap = {};
                var arraywo = [];
                if (scriptContext.type == 'create' || scriptContext.type == 'edit') {
                    var currentRec = scriptContext.newRecord;
                    var oldcurrentRec = scriptContext.oldRecord;
                    var recId = currentRec.id;
                    var rectype = currentRec.type;
                    log.debug("recId=", recId);
                    var count = currentRec.getLineCount({
                        sublistId: 'recmachcustrecord_cntm_cso_parentrec'
                    });
                    log.debug("count=", count);
                    for (var i = 0; i < count; i++) {

                        var childlotnum = currentRec.getSublistValue({
                            sublistId: 'recmachcustrecord_cntm_cso_parentrec',
                            fieldId: 'custrecord_cntm_cso_pannellot',
                            line: i
                        });
                        var childseqnum = currentRec.getSublistValue({
                            sublistId: 'recmachcustrecord_cntm_cso_parentrec',
                            fieldId: 'custrecord_cntm_seq_no',
                            line: i
                        });
                        var childid = currentRec.getSublistValue({
                            sublistId: 'recmachcustrecord_cntm_cso_parentrec',
                            fieldId: 'id',
                            line: i
                        });

                        var childcheckbx = currentRec.getSublistValue({
                            sublistId: 'recmachcustrecord_cntm_cso_parentrec',
                            fieldId: 'custrecord_cntm_cso_createwo_completion',
                            line: i
                        });
                        var childstatus = currentRec.getSublistValue({
                            sublistId: 'recmachcustrecord_cntm_cso_parentrec',
                            fieldId: 'custrecord_cntm_cso_status',
                            line: i
                        });

                        if (childcheckbx == true) {//old record is false 

                            if (childstatus != 4) { //status is not completed

                                wocmap =
                                {
                                    'childid': childid,
                                    'childlotnum': childlotnum,
                                    'childseqnum': childseqnum,
                                    'childcheckbx': childcheckbx,
                                    'childstatus': childstatus,
                                }

                                arraywo.push(wocmap)
                                var changestat = 3
                                var id = record.submitFields({
                                    type: 'customrecord_cntm_clientappsublist',
                                    id: childid,
                                    values: {
                                        'custrecord_cntm_cso_status': changestat
                                    },
                                    options: {
                                        enableSourcing: false,
                                        ignoreMandatoryFields: true
                                    }
                                });
                                log.debug("id", id);
                            }
                        }

                    }

                    log.debug({ title: 'wocmap: before sorting', details: JSON.stringify(arraywo) });

                    //arraywo.sort(compareid);
                    arraywo.sort(compareseq);
                    arraywo.sort(comparelot);

                    log.debug({ title: 'wocmap: after sorting ', details: JSON.stringify(arraywo) });
                    log.debug({ title: 'arraywo array : 0 if empty or not', details: arraywo.length });

                    if (arraywo.length > 0) {
                        //   for (var i = 0; i < arraywo.length; i++) {
                        //      var childrecIds = (arraywo[i].childid);
                        //      log.debug("recIds=", childrecIds);

                        //          var suitletURL = url.resolveScript({
                        //              scriptId: 'customscript_cntm_sc_client_app_par_cntx',
                        //              deploymentId: 'customdeploy_cntm_sc_client_app_par_dply',
                        //              returnExternalUrl: true,
                        //              params:
                        //              {
                        //                  'childrecIds': childrecIds
                        //              }
                        //          });
                        //          log.debug("suitletURL=", suitletURL);
                        //          var response = https.get({
                        //              url: suitletURL,
                        //          });
                        //          log.debug('response DONE:',response);            
                        //   }
                        
                     // var childrecIds = (arraywo[i].childid);
                        var recid  = 500
                    var mrTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE
                        });
                        mrTask.scriptId = 'customscript_cntm_mr_client_app_par_cntx';
                        mrTask.deploymentId = 'customdeploy_cntm_mr_client_app_par_dply';
                        mrTask.params = {
                                'custscript_clientapp_parent_parameter' :arraywo
                        };
                    var mrTaskId = mrTask.submit();
                    log.debug('Map Reduce Script Called');
                
                    
                    }
                    else {
                        log.debug('NO DATA TO SAVE AND EDIT');
                    }
                }



            }

            catch (e) {
                log.debug("error:", e);
            }
        }

        return {
            afterSubmit: afterSubmit
        };

        function compareseq(a, b) {
            if (a.childseqnum < b.childseqnum) {
                return -1;
            }
            if (a.childseqnum > b.childseqnum) {
                return 1;
            }
            return 0;
        }

        function comparelot(a, b) {
            if (a.childlotnum < b.childlotnum) {
                return -1;
            }
            if (a.childlotnum > b.childlotnum) {
                return 1;
            }
            return 0;
        }

        function compareid(a, b) {
            if (a.childid < b.childid) {
                return -1;
            }
            if (a.childid > b.childid) {
                return 1;
            }
            return 0;
        }



    });