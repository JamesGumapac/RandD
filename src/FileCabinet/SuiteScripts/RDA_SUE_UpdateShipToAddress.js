function beforeSubmit(type) {
    try {
        var lineCount = nlapiGetLineItemCount("item");
        var itemType, isClosed, shipTo, lineDept, lineLocation;
        var shipToIds = [];
        var addrRecs, idWiseAddress = {}, shipToData, addId;

        for (var i = 1; i <= lineCount; i++) {
            itemType = nlapiGetLineItemValue("item", "itemtype", i);
            isClosed = nlapiGetLineItemValue("item", "isclosed", i);
            shipTo = nlapiGetLineItemValue("item", "shipaddress", i);
            nlapiLogExecution("debug", "shipTo", shipTo);
          
          	lineDept = nlapiGetLineItemText("item", "department", i);
            lineLocation = nlapiGetLineItemText("item", "location", i);
            nlapiLogExecution("debug", "lineDept | lineLocation:", lineDept +" | "+ lineLocation);
          
          if(lineDept.toLowerCase() == 'assembly' && lineLocation.indexOf('PA-1660') != -1){
            
            nlapiSetFieldValue("custbody_contains_assembly_line", "T");
          }

            if (isClosed == "T" || itemType.indexOf('Group') > -1 || itemType.indexOf('EndGroup') > -1 || itemType.indexOf('Discount') > -1) continue;

            nlapiSelectLineItem("item", i);
            var addrSubRec = nlapiViewCurrentLineItemSubrecord('item', 'shippingaddress');
            if (!!addrSubRec) {
                var addr = addrSubRec.getFieldValue("addrtext");
                nlapiLogExecution("debug", "addr " + i, addr);
                nlapiSetCurrentLineItemValue("item", "custcol_sra_shiptoadd", addr);
                nlapiCommitLineItem("item");
            }
        }
    } catch (ex) {
        nlapiLogExecution("error", "error when setting ship to address line field", ex.toString());
    }
}