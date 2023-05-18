//reverse impact of any posting to 4010, and instead post that to 4022
//Deployed on Credit Memo


function customizeGlImpact(transactionRecord, standardLines, customLines, book)
{
    nlapiLogExecution("DEBUG","START TIME",new Date().toString());
    try{
        var lineCount = standardLines.getCount();
        nlapiLogExecution('DEBUG', 'GL lineCount is:', lineCount);
        if (lineCount == 0) {
                nlapiLogExecution('DEBUG', '0 GL lines, returning:');
            return;  // no need to add WIP costs if no existing GL impact
        }
        var createdFrom = transactionRecord.getFieldValue("createdfrom");
        var classId = transactionRecord.getFieldText("department");

        var DIVISION_WIP_VARIABLES = {
            "PROBE" : {
                account: 336
            },
            "RDIS" : {
                account: 337
            },
            "BOARDS" : {
                account: 333
            },
            "ASSEMBLY" : {
                account: 334
            }
        }
        
        Object.keys(DIVISION_WIP_VARIABLES).forEach(function(classTxt){
            nlapiLogExecution("DEBUG","DIVISION INDEXOF "+classText+"/"+classTxt,classText.toUpperCase().indexOf(classTxt.toUpperCase()));
            if(classId.toUpperCase().indexOf(classTxt.toUpperCase()) >= 0){
                classId = classTxt;
            }
        });

        if(!DIVISION_WIP_VARIABLES.hasOwnProperty(classId)){
            classId = "BOARDS";
        }

        nlapiLogExecution("DEBUG","DIVISION",classId)

        var customGLobj = {};
        /**
		 * REVERSE ALL STANDARD LINES 04042022
		 */
		for(var i = 0; i < lineCount; i++){
			var currLine = standardLines.getLine(i);
				var accountId = currLine.getAccountId();
				var debitAmt = currLine.getDebitAmount();
				var creditAmt = currLine.getCreditAmount();
				nlapiLogExecution("DEBUG","STANDARD LINE i "+i,accountId+ " Debit "+debitAmt+" Credit "+creditAmt);
                if(accountId){
                    if(debitAmt > 0){
                        /**
                         * REVERSE DEBIT
                         */
                        var newLine = customLines.addNewLine();
                        newLine.setCreditAmount(Number(debitAmt).toFixed(2));
                        newLine.setAccountId(accountId);
                        newLine.setMemo("Reversing Entry");
                    }else if(creditAmt > 0){
                        /**
                         * REVERSE CREDIT
                         */
                        var newLine = customLines.addNewLine();
                        newLine.setDebitAmount(Number(creditAmt).toFixed(2));
                        newLine.setAccountId(accountId);
                        newLine.setMemo("Reversing Entry");
                    }
                }
		}

        var transactionSearch = nlapiSearchRecord("transaction",null,
        [
        [["type","anyof","WOCompl","WOIssue"],
        "AND",["customgl","is","T"],
        "AND",["createdfrom","anyof",createdFrom],
        "AND",["account","anyof",DIVISION_WIP_VARIABLES[classId].account]], 
        "AND", 
        ["debitamount","greaterthan","0.00"]
        ], 
        [
        new nlobjSearchColumn("account",null,"GROUP"), 
        new nlobjSearchColumn("debitamount",null,"SUM")
        ]
        );
        var GL_AMOUNT = 0;
        var GL_ACCOUNT = DIVISION_WIP_VARIABLES[classId].account;
        if(transactionSearch && transactionSearch.length > 0){
            GL_AMOUNT = Number(transactionSearch[0].getValue("debitamount",null,"SUM"))
            GL_ACCOUNT = Number(transactionSearch[0].getValue("account",null,"GROUP"))
        }

        if(GL_AMOUNT && GL_AMOUNT > 0 && GL_ACCOUNT){
            var newLine = customLines.addNewLine();
            newLine.setDebitAmount(Number(GL_AMOUNT).toFixed(2));
            newLine.setAccountId(GL_ACCOUNT);
            newLine.setMemo("Custom GL");

            var newLine = customLines.addNewLine();
            newLine.setCreditAmount(Number(GL_AMOUNT).toFixed(2));
            newLine.setAccountId(GL_ACCOUNT);
            newLine.setMemo("Custom GL");
        }

        // /**
        //  * INITIALIZE ARRAY TO USE AS FILTERS TO GET ITEM ASSEMBLY ITEM
        //  */
        //  var assemblyItem = transactionRecord.getFieldValue("item");
        //  //nlapiLogExecution('DEBUG','LINE COUNT',componentCount);
        //  var filter = [
        //     ["internalid","anyof",assemblyItem]
        // ];

        // var column = [
        //     new nlobjSearchColumn("type"), 
        //     new nlobjSearchColumn("itemid").setSort(false), 
        //     new nlobjSearchColumn("wipacct"), 
        //     new nlobjSearchColumn("assetaccount"),
        //     new nlobjSearchColumn("lastpurchaseprice"), 
        //     new nlobjSearchColumn("cost"), 
        //     new nlobjSearchColumn("averagecost")
        // ]

        // var itemSearch = nlapiSearchRecord("item",null,filter,column);
        // var fgAccount = "";
        // if(itemSearch.length > 0){
        //     fgAccount = itemSearch[0].getValue("assetaccount");
        // }

        //  var reverseNextLine = 0;
        //  var fgReversed = true;
        // for(var i = 0; i < lineCount; i++){
		// 	var currLine = standardLines.getLine(i);
        //     var accountId = currLine.getAccountId();
        //     var debitAmt = currLine.getDebitAmount();
        //     var creditAmt = currLine.getCreditAmount();
        //     nlapiLogExecution("DEBUG","STANDARD LINE i "+i,accountId+"/"+fgAccount+ " Debit "+debitAmt+" Credit "+creditAmt);
        //     if(accountId){
        //         if(fgAccount != accountId && i != reverseNextLine){
        //             if(debitAmt > 0){
        //                 var newLine = customLines.addNewLine();
        //                 newLine.setDebitAmount(Number(debitAmt).toFixed(2));
        //                 newLine.setAccountId(accountId);
        //                 newLine.setMemo("Custom GL");
        //             }else if(creditAmt > 0){
        //                 var newLine = customLines.addNewLine();
        //                 newLine.setCreditAmount(Number(creditAmt).toFixed(2));
        //                 newLine.setAccountId(accountId);
        //                 newLine.setMemo("Custom GL");
        //             }
        //         }else{
        //             if(!fgReversed){
        //                 reverseNextLine = i+1;
        //                 fgReversed = true;
        //             }
        //         }
        //     }
		// }

        
        //var qtyMapping = {};

        /**
         * GET ALL COMPONENTS WITH QTY > 1
         */
        // var componentCount = transactionRecord.getLineItemCount('component');
        
        // for(var i =0; i < componentCount; i++){
        //     var componentIssueQty = transactionRecord.getLineItemValue("component", "quantity", i);
        //     var componentId = transactionRecord.getLineItemValue("component", "item", i);
        //     if(componentIssueQty > 0){
        //         itemIds.push(componentId);
        //         qtyMapping[componentId] = {"quantity": componentIssueQty};
        //         //qtyMapping[componentId]["quantity"] = componentIssueQty;
        //     }
        // }

        // nlapiLogExecution("DEBUG","ITEM IDS",JSON.stringify(itemIds))
        // nlapiLogExecution("DEBUG","qty mapping",JSON.stringify(qtyMapping))

        // var filter = [
        //     ["internalid","anyof",itemIds]
        // ];

        // var column = [
        //     new nlobjSearchColumn("type"), 
        //     new nlobjSearchColumn("itemid").setSort(false), 
        //     new nlobjSearchColumn("wipacct"), 
        //     new nlobjSearchColumn("assetaccount"),
        //     new nlobjSearchColumn("lastpurchaseprice"), 
        //     new nlobjSearchColumn("cost"), 
        //     new nlobjSearchColumn("averagecost")
        // ]

        // var itemSearch = nlapiSearchRecord("item",null,filter,column);
        // var debitAccount = "";
        // if(itemSearch.length > 0){
        //     itemSearch.forEach(function(result){
        //         var lastPurchasePrice = Number(result.getValue("lastpurchaseprice"));
        //         var purchasePrice = Number(result.getValue("cost"));
        //         var averageCost = Number(result.getValue("averagecost"));
        //         var itemType = result.getValue("type");
        //         if(itemType.toLowerCase() == "assembly"){
        //             debitAccount = Number(result.getValue("wipacct"));
        //         }
        //         var creditAccount = Number(result.getValue("assetaccount"));
        //         var itemId = result.id;
                
        //         if(itemType.toLowerCase() != "assembly"){
        //             var issueQty = Number(qtyMapping[itemId]["quantity"]);
        //             var formulaCost = purchasePrice || lastPurchasePrice || averageCost;
        //             var glAmount = issueQty * formulaCost;
        //             nlapiLogExecution("DEBUG","GL AMOUNT", glAmount);
        //             nlapiLogExecution("DEBUG","GL ACCOUNTS","DEBIT: "+debitAccount+" CREDIT: "+creditAccount);
        //           if(glAmount > 0){
        //             var newLine = customLines.addNewLine();
        //             newLine.setDebitAmount(Number(glAmount).toFixed(2)); // based on wip account of assembly item
        //             newLine.setAccountId(debitAccount);
                    
        //             var newLine = customLines.addNewLine();
        //             newLine.setCreditAmount(Number(glAmount).toFixed(2)); // asset account of component
        //             newLine.setAccountId(creditAccount);
        //           }
                    
        //         }
        //     });
        // }

	}catch(e){
		nlapiLogExecution('ERROR', e.name, e.message);
	}
	nlapiLogExecution("DEBUG","END TIME",new Date().toString());


}