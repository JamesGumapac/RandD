/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
var PAGE_SIZE = 50;
define(["N/ui/serverWidget", "N/record", "N/search"], function (
  serverWidget,
  record,
  search
) {
  /**
   * Definition of the Suitelet script trigger point.
   *
   * @param {Object} context
   * @param {ServerRequest} context.request - Encapsulation of the incoming request
   * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
   * @Since 2015.2
   */
  function onRequest(context) {
    if (context.request.method === "GET")
    try {
      var vendor =  context.request.parameters.vendor;
      log.debug('vendor :',vendor);
      log.debug('vendor of :',typeof vendor);
     
     
        var form = serverWidget.createForm({
          title: "Vendor Records",
        });
        // form.clientScriptModulePath = './VR client.js';

        form.clientScriptModulePath = "./clentscript.js";

        var formField = form.addField({
          id: "custpage_vendor",
          type: serverWidget.FieldType.SELECT,
          label: "Vendors",
        //   source: "vendor",
         
        });

        formField.addSelectOption({
            value : '',
            text : ''
        });
       
        var vendorSearchObj = search.create({
          type: "vendor",
          filters: [],
          columns: [
            search.createColumn({
              name: "entityid",
              sort: search.Sort.ASC,
              label: "Name",
            }),
            search.createColumn({ name: "internalid", label: "Internal ID" }),
          ],
        });
        var searchResultCount = vendorSearchObj.runPaged().count;
        log.debug("vendorSearchObj result count", searchResultCount);
        vendorSearchObj.run().each(function (result) {
          var VendorSrc = result.getValue({ name: "entityid" });
          var VendorId = result.getValue({ name: "internalid" });

          formField.addSelectOption({
            value: VendorId,
            text: VendorSrc,
          });
          return true;
        });

        if (validateData(vendor)) {
          formField.defaultValue = vendor;
        }
     
       
        var sublist = form.addSublist({
          id: "custpage_sublist",
          type: serverWidget.SublistType.LIST,
          label: "Vendor Transaction List",
          tab: "custpage_subtab"
        });
 
        sublist.addField({
          id: "custpage_trandate",
          type: serverWidget.FieldType.DATE,
          label: "Date",
        });
        sublist.addField({
          id: "custpage_internalid",
          type: serverWidget.FieldType.TEXT,
          label: "Internal Id",
        });
       sublist.addField({
          id: "custpage_vendor",
          type: serverWidget.FieldType.TEXT,
          label: "vendor",
        });
        sublist.addField({
          id: "custpage_type",
          type: serverWidget.FieldType.TEXT,
          label: "Type",
        });
        sublist.addField({
          id: "custpage_status",
          type: serverWidget.FieldType.TEXT,
          label: "Status",
        });
        sublist.addField({
          id: "custpage_docnum",
          type: serverWidget.FieldType.TEXT,
          label: "Doc Num",
        });
        sublist.addField({
          id: "custpage_amount",
          type: serverWidget.FieldType.TEXT,
          label: "Amount",
        });
        sublist.addField({
          id: "custpage_hypl",
          type: serverWidget.FieldType.TEXT,
          label: "Hyper Link",
        });
     

        var filter = []
        var  mainMap = []

        filter.push(["mainline", "is", "T"])
        filter.push( "AND", ["type","anyof","VendBill","VendPymt","PurchOrd","CustPymt","VendAuth"])

        // if(vendor != null && vendor != ''){
            if (validateData(vendor)) {
            filter.push("AND", ["vendor.internalid","anyof",vendor])
           }

        //    else{
        //     filter.push("AND", [["vendor.internalid","anyof","@NONE@"],"AND",["customer.internalidnumber","equalto","0"]])
        //   }

            var transactionSearchObj = search.create({
              type: "transaction",
              filters:filter,
              columns: [
                search.createColumn({ name: "trandate", label: "Date" }),
                search.createColumn({ name: "postingperiod", label: "Period" }),
                search.createColumn({ name: "type", label: "Type" }),
                search.createColumn({ name: "internalid", label: "Internal ID" }),
                search.createColumn({ name: "tranid", label: "Document Number" }),
                search.createColumn({ name: "entity", label: "Name" }),
                search.createColumn({ name: "account", label: "Account" }),
                search.createColumn({ name: "memo", label: "Memo" }),
                search.createColumn({ name: "amount", label: "Amount" }),
                search.createColumn({ name: "statusref", label: "Status" }),
                search.createColumn({
             name: "formulatext",
             formula: "   CASE       WHEN {type} IN ('Payment') THEN  '<a href=\"https://tstdrv2656955.app.netsuite.com/app/accounting/transactions/custpymt.nl?id='||{internalid}||'&whence=\"><span style=\"color:red\">'||'Payment'||'</a>'WHEN {type} IN ('Purchase Order') THEN  '<a href=\"https://tstdrv2656955.app.netsuite.com/app/accounting/transactions/purchord.nl?id='||{internalid}||'&whence=\"><span style=\"color:blue\">'||'Purchase Order'||'</a>'WHEN {type} IN ('Bill') THEN  '<a href=\"https://tstdrv2656955.app.netsuite.com/app/accounting/transactions/vendbill.nl?id='||{internalid}||'&whence=\"><span style=\"color:brown\">'||'Bill'||'</a>'WHEN {type} IN ('Bill Payment') THEN  '<a href=\"https://tstdrv2656955.app.netsuite.com/app/accounting/transactions/vendpymt.nl?id='||{internalid}||'&whence=\"><span style=\"color:orange\">'||'Bill Payment'||'</a>'WHEN {type} IN ('Vendor Return Authorization') THEN '<a href=\"https://tstdrv2656955.app.netsuite.com/app/accounting/transactions/vendauth.nl?id='||{internalid}||'&whence=\"><span style=\"color:purple\">'||'Vendor Return Authorization'||'</a>'END  ",
             label: "Hyper link"
          }),
              ],
            });
    
        var searchResultCount = transactionSearchObj.runPaged().count;
        log.debug("transactionSearchObj result count", searchResultCount);

        var resultSet = transactionSearchObj.run();

        var currentRange = resultSet.getRange({
            start: 0,
            end: 1000,
          });
          var i = 0; // iterator for all search results
          var j = 0; // iterator for current result range 0..999
         
        //   var result = currentRange[0];
          while (j < currentRange.length) {
            var innermap = {};
            //   arrrrr.push( currentRange[j].getValue({ name: "internalid", label: "Internal ID" }))
            

            // var trandate = currentRange[j].getValue({ name: "trandate", label: "Date" });
            // var internalid = currentRange[j].getValue({ name: "internalid", label: "Internal ID" });
            // var entity = currentRange[j].getText({ name: "entity", label: "Name" });
            // var type = currentRange[j].getValue({ name: "type", label: "Type" });
            // var statusref = currentRange[j].getValue({ name: "statusref", label: "Status" });
            // var tranid = currentRange[j].getValue({ name: "tranid", label: "Document Number" });
            // var amount = currentRange[j].getValue({ name: "amount", label: "Amount" });
            // var link = currentRange[j].getValue({name: "formulatext",formula: "   CASE       WHEN {type} IN ('Payment') THEN  '<a href=\"https://tstdrv2656955.app.netsuite.com/app/accounting/transactions/custpymt.nl?id='||{internalid}||'&whence=\"><span style=\"color:red\">'||'Payment'||'</a>'WHEN {type} IN ('Purchase Order') THEN  '<a href=\"https://tstdrv2656955.app.netsuite.com/app/accounting/transactions/purchord.nl?id='||{internalid}||'&whence=\"><span style=\"color:blue\">'||'Purchase Order'||'</a>'WHEN {type} IN ('Bill') THEN  '<a href=\"https://tstdrv2656955.app.netsuite.com/app/accounting/transactions/vendbill.nl?id='||{internalid}||'&whence=\"><span style=\"color:brown\">'||'Bill'||'</a>'WHEN {type} IN ('Bill Payment') THEN  '<a href=\"https://tstdrv2656955.app.netsuite.com/app/accounting/transactions/vendpymt.nl?id='||{internalid}||'&whence=\"><span style=\"color:orange\">'||'Bill Payment'||'</a>'WHEN {type} IN ('Vendor Return Authorization') THEN '<a href=\"https://tstdrv2656955.app.netsuite.com/app/accounting/transactions/vendauth.nl?id='||{internalid}||'&whence=\"><span style=\"color:purple\">'||'Vendor Return Authorization'||'</a>'END  ",label: "Hyper link"});

             innermap['trandate'] = currentRange[j].getValue({ name: "trandate", label: "Date" });
             innermap['internalid'] = currentRange[j].getValue({ name: "internalid", label: "Internal ID" });
             innermap['entity'] = currentRange[j].getText({ name: "entity", label: "Name" });
             innermap['type'] = currentRange[j].getValue({ name: "type", label: "Type" });
             innermap['statusref'] = currentRange[j].getValue({ name: "statusref", label: "Status" });
             innermap['tranid'] = currentRange[j].getValue({ name: "tranid", label: "Document Number" });
             innermap['amount'] = currentRange[j].getValue({ name: "amount", label: "Amount" });
             innermap['link'] = currentRange[j].getValue({name: "formulatext",formula: "   CASE       WHEN {type} IN ('Payment') THEN  '<a href=\"https://tstdrv2656955.app.netsuite.com/app/accounting/transactions/custpymt.nl?id='||{internalid}||'&whence=\"><span style=\"color:red\">'||'Payment'||'</a>'WHEN {type} IN ('Purchase Order') THEN  '<a href=\"https://tstdrv2656955.app.netsuite.com/app/accounting/transactions/purchord.nl?id='||{internalid}||'&whence=\"><span style=\"color:blue\">'||'Purchase Order'||'</a>'WHEN {type} IN ('Bill') THEN  '<a href=\"https://tstdrv2656955.app.netsuite.com/app/accounting/transactions/vendbill.nl?id='||{internalid}||'&whence=\"><span style=\"color:brown\">'||'Bill'||'</a>'WHEN {type} IN ('Bill Payment') THEN  '<a href=\"https://tstdrv2656955.app.netsuite.com/app/accounting/transactions/vendpymt.nl?id='||{internalid}||'&whence=\"><span style=\"color:orange\">'||'Bill Payment'||'</a>'WHEN {type} IN ('Vendor Return Authorization') THEN '<a href=\"https://tstdrv2656955.app.netsuite.com/app/accounting/transactions/vendauth.nl?id='||{internalid}||'&whence=\"><span style=\"color:purple\">'||'Vendor Return Authorization'||'</a>'END  ",label: "Hyper link"});
             mainMap.push(innermap);
                    //  if (validateData(trandate)) {sublist.setSublistValue({id: "custpage_trandate",line: j,value: trandate,})}
                    //  if (validateData(internalid)) {sublist.setSublistValue({id: "custpage_internalid",line: j,value: internalid,})}
                    //  if (validateData(entity)) {sublist.setSublistValue({id: "custpage_vendor",line: j,value: entity,})}
                    //  if (validateData(type)) {sublist.setSublistValue({id: "custpage_type",line: j,value: type,})}
                    //  if (validateData(statusref)) {sublist.setSublistValue({id: "custpage_status",line: j,value: statusref,})}
                    //  if (validateData(tranid)) {sublist.setSublistValue({id: "custpage_docnum",line: j,value: tranid,})}
                    //  if (validateData(amount)) {sublist.setSublistValue({id: "custpage_amount",line: j,value: amount,})}
                    //  if (validateData(link)) {sublist.setSublistValue({id: "custpage_hypl",line: j,value: link,})}

            i++;
            j++;
            if (j == 1000) {
              // check if it reaches 1000
              j = 0; // reset j an reload the next portion
              currentRange = resultSet.getRange({
                start: i,
                end: i + 1000,
              });
            }
          }

          log.audit("arrrrr :",mainMap)
          
          if (Array.isArray(mainMap) && mainMap.length > 0) {
            for (var itr = 0; itr < mainMap.length; itr++) {
              var map = {};
              map = mainMap[itr];
              var serialNumber = itr + 1
              // log.debug('serialNumber :' ,typeof serialNumber);
            
                if (map.hasOwnProperty("trandate") &&validateData(map.trandate)) {sublist.setSublistValue({id: "custpage_trandate",value: map.trandate,line: itr,});}
                if (map.hasOwnProperty("internalid") &&validateData(map.internalid)) {sublist.setSublistValue({id: "custpage_internalid",value: map.internalid,line: itr,});}
                if (map.hasOwnProperty("entity") &&validateData(map.entity)) {sublist.setSublistValue({id: "custpage_vendor",value: map.entity,line: itr,});}
                if (map.hasOwnProperty("type") &&validateData(map.type)) {sublist.setSublistValue({id: "custpage_type",value: map.type,line: itr,});}
                if (map.hasOwnProperty("statusref") &&validateData(map.statusref)) {sublist.setSublistValue({id: "custpage_status",value: map.statusref,line: itr,});}
                if (map.hasOwnProperty("tranid") &&validateData(map.tranid)) {sublist.setSublistValue({id: "custpage_docnum",value: map.tranid,line: itr,});}
                if (map.hasOwnProperty("amount") &&validateData(map.amount)) {sublist.setSublistValue({id: "custpage_amount",value: map.amount,line: itr,});}
                if (map.hasOwnProperty("link") &&validateData(map.link)) {sublist.setSublistValue({id: "custpage_hypl",value: map.link,line: itr,});}
               
                           }
          }

        
       
   
        context.response.writePage(form);
    } catch (error) {
        context.response.writePage(form);
      log.error({
        title: 'Error in get :',
        details: error
      })
    }
  }

  function validateData(data) {
    if (data != undefined && data != null && data != '') {
        return true;
    } else {
        return false;
    }
}


  return {
    onRequest: onRequest,
  };
});