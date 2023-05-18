/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @scriptname    Cntm_ST_CustomRecordCreation_backend
 * @ScriptId     customscript_cntm_st_customrcreate_back
 * @deploymentId  customdeploy_cntm_st_customrcreate_dep
 * @author        Vishal Naphade
 * @email         vishal.naphade@centium.net
 * @date          18/05/2022
 * @description   
 * @script_id     1831
 				 
 
 * Copyright 2020, Centium Consulting its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 * Module Description
 * 
 * Sr. No   	 Date           	  Author                  	Remarks
 * 1		 	18 May 2022	       Vishal Naphade    	         -  
 * 2			17 Jan 2023        Vishal Naphade              - added code to handle deployement not found issue.	
 * 
 */
define(["N/record", "N/runtime", "N/search", "N/task", "N/format"],
    function(record, runtime, search, task, format) {
        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object}
         *            context
         * @param {ServerRequest}
         *            context.request - Encapsulation of the incoming request
         * @param {ServerResponse}
         *            context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {
            log.debug('SUITELET', context.type);

            try {

              



                var WO = context.request.parameters.woId;
                var scriptTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                });
                scriptTask.scriptId = "customscript_cntm_mr_create_custom_rec";
                scriptTask.params = {
                    custscript_cntm_woid_cust_rec: WO
                };

                var scriptTaskId = scriptTask.submit();
                var status = task.checkStatus(scriptTaskId).status;
              
                log.debug(scriptTaskId);


                // var completion = task.checkStatus(scriptTaskId).getPendingOutputCount()
                // log.audit('Percentage Completed: ' + completion);
                var obj={};
                obj["status"]="SUCCESS";
                obj["mrtaskid"]=scriptTaskId;
                context.response.write(JSON.stringify(obj));
               // context.response.write("SUCCESS");
            } catch (error) {
                var previous_percent_completed;
                var scheduledscriptinstanceSearchObj = search.create({
                    type: "scheduledscriptinstance",
                    filters:
                    [
                       ["script.name","is","Cntm_MR_create_custom_record"], 
                       "AND", 
                       ["datecreated","on","today"], 
                       "AND", 
                       ["status","anyof","PROCESSING"]
                    ],
                    columns:
                    [
                       search.createColumn({
                          name: "name",
                          join: "script",
                          label: "Name"
                       }),
                       search.createColumn({
                          name: "scriptid",
                          join: "scriptDeployment",
                          label: "Custom ID"
                       }),
                       search.createColumn({name: "timestampcreated", label: "Date Created"}),
                       search.createColumn({name: "mapreducestage", label: "Map/Reduce Stage"}),
                       search.createColumn({name: "status", label: "Status"}),
                       search.createColumn({
                          name: "percentcomplete",
                          sort: search.Sort.DESC,
                          label: "Percent Complete"
                       }),
                       search.createColumn({name: "prioritytimestamp", label: "Priority Timestamp"})
                    ]
                 });
                 var searchResultCount = scheduledscriptinstanceSearchObj.runPaged().count;
                 log.debug("scheduledscriptinstanceSearchObj result count",searchResultCount);
                 scheduledscriptinstanceSearchObj.run().each(function(result){
               previous_percent_completed = result.getValue(  search.createColumn({
                name: "percentcomplete",
                sort: search.Sort.DESC,
                label: "Percent Complete"
             }));
                    return false;
                 });
                 
                 log.debug(" previous_percent_completed", previous_percent_completed)
                
                log.error('ERROR IN SUITELET', error);

                var temp_obj={};
                temp_obj["status"]='ERROR';
                temp_obj["remaining_percent"]=previous_percent_completed;
                // context.response.write(temp_obj);
               
                context.response.write(JSON.stringify(temp_obj));
            }

        }

        return {
            onRequest: onRequest,
        };
    });