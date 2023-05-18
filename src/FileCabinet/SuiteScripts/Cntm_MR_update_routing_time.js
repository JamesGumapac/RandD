/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @filename      cntm_mr_vn_assignment_one.js
 * @scriptname    cntm_mr_vn_assignment_one
 * @ScriptId      customscript_cntm_mr_vn_assignment_one
 * @author        Vishal Naphade
 * @email         vishal.naphade@gmail.com
 * @date          04/08/2021 
 * @description   Create a custom field(line-level) on SO which store the Item Amount with a 2% discount.
 
 * Copyright 2020, Centium Consulting its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 * Module Description
 * 
 * Sr. No   	 Date           	  Author                  	Remarks
 * 1		04 August 2021  		  Vishal Naphade    	 -  Done
 * 2			 
 * 
 */
define(['N/search','N/record'],

function(search,record) {
   
    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
    function getInputData() {
    	//Saved Search
    	var salesorderSearchObj = search.create({
    		   type: "salesorder",
    		   filters:
    		   [
    		      ["type","anyof","SalesOrd"], 
    		      "AND", 
    		      ["mainline","is","T"],
    		      "AND",
    		      ["internalid","anyof","7778"]
    		   ],
    		   columns:
    		   [
    		      search.createColumn({name: "tranid", label: "Document Number"}),
    		      search.createColumn({name: "internalid", label: "Internal ID"}),
    		      search.createColumn({name: "entity", label: "Name"}),
    		      search.createColumn({name: "total", label: "Amount (Transaction Total)"})
    		   ]
    		});
    		var searchResultCount = salesorderSearchObj.runPaged().count;
    		log.debug("salesorderSearchObj result count",searchResultCount);
    		 return salesorderSearchObj;

    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
    	var result = JSON.parse(context.value);
    	log.debug('result',result);
    	var internalId = result.id;
    	log.debug('Internal Id',internalId);
    	var total= Number(result['values']['total']);
    	log.debug('total',total);
    	//calculating discount
    	var discount = total-(total*0.02);
    	log.debug('Discount',discount);
    	
    	//Loading sales order
    	var records=record.load({
          type: record.Type.SALES_ORDER,
          id: internalId,
          isDynamic : true
      });
    	//setting discount vaule in field
		records.setCurrentSublistValue({
			fieldId:'custcol_mr_discount',
			value: discount,
			ignoreFieldChange: true
		});
		records.save();
		log.debug('Value seted');

    	

    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {

    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {

    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
