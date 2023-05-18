/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @filename      Cntm_UE_BT_hideFields
 * @scriptname    cntm_ue_vn_assignment_six
 * @ScriptId      customscript_cntm_ue_bt_hidefields
 * @author        Vishal Naphade
 * @email         vishal.naphade@gmail.com
 * @date          07/02/2022 
 * @description   Hide fields on Bin transfer in RDA 
 
 * Copyright 2020, Centium Consulting its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 * Module Description
 * 
 * Sr. No   	 Date           	  Author                  	Remarks
 * 1		07/02/2022 		  Vishal Naphade    	  - Fields hide
 * 2			 
 * 
 */
define(['N/search', 'N/record', 'N/currentRecord', 'N/url', 'N/ui/serverWidget'],

    function(search, record, currentRecord, url, serverWidget) {

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */
        function beforeLoad(scriptContext) {
            try {

                log.debug("CONNECT")
                var form = scriptContext.form;

                var toolNumber = form.getField({ id: 'custbody_cntm_tool_number' });
                toolNumber.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                var projectMangPref = form.getField({ id: 'custbodycust_project_manager_ref' });
                projectMangPref.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                var quoteType = form.getField({ id: 'custbody_rda_quote_type' });
                quoteType.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                var woPriority = form.getField({ id: 'custbody_rda_wo_priorty' });
                woPriority.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                var panelSize = form.getField({ id: 'custbody_cntm_panelsize' });
                panelSize.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                var beconNumber = form.getField({ id: 'custbody_rda_bacon_ref_number' });
                beconNumber.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                var salesOrderType = form.getField({ id: 'custbody_rda_sales_order_type' });
                salesOrderType.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                var quoteRevision = form.getField({ id: 'custbody_rda_quote_revision' });
                quoteRevision.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                var awsRework = form.getField({ id: 'custbody_rda_asm_rework_reason' });
                awsRework.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                var quoteSpecialInst = form.getField({ id: 'custbody_rda_quote_special_instruction' });
                quoteSpecialInst.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });


                var customrecord_cntm_lot_creationSearchObj = search.create({
                    type: "customrecord_cntm_lot_creation",
                    filters:
                    [
                       ["custrecord_cntm_lot_wonum","anyof","860876"]
                    ],
                    columns:
                    [
                       search.createColumn({name: "custrecord_cntm_lot_wonum", label: "WO#"}),
                       search.createColumn({name: "custrecord_cntm_lot_wo_completion", label: "WO Completion "}),
                       search.createColumn({name: "custrecord_cntm_lot_assembly_item", label: "Assembly Item "}),
                       search.createColumn({name: "custrecord_cntm_lot_lotnumber", label: "LOT#"}),
                       search.createColumn({name: "custrecord_cntm_wo_details_fab", label: "Parent"}),
                       search.createColumn({name: "custrecord_cntm_isprocess_lot", label: "Is Process"}),
                       search.createColumn({name: "custrecord_cntm_issue_complete", label: "Issue completed"}),
                    //    search.createColumn({
                    //       name: "quantity",
                    //       join: "CUSTRECORD_CNTM_LOT_WONUM",
                    //       label: "Quantity"
                    //    }),
                       search.createColumn({name: "custrecord_cntm_num_of_panels", label: "Number of Panels"})
                    ]
                 });
                 var searchResultCount = customrecord_cntm_lot_creationSearchObj.runPaged().count;
                 log.debug("customrecord_cntm_lot_creationSearchObj result count",searchResultCount);
                 customrecord_cntm_lot_creationSearchObj.run().each(function(result){
                    // .run().each has a limit of 4,000 results
                    return true;
                 });


            } catch (err) {
                log.error("Error in BeforLoad", JSON.stringify(err));

            } //end of catch
        } //end of function


        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {

        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function afterSubmit(scriptContext) {

        }

        return {
            beforeLoad: beforeLoad,
            // beforeSubmit: beforeSubmit,
            // afterSubmit: afterSubmit
        };

    });