/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 */
/*
 * @Author: bb 
 * @Date: 12-13-2021
 */
define(['N'], function (N) {


	function returnQuantity(quantity, goodnumofpanels, totalnumofcores, coreboolean){
		//CUSTOM QUANTITY LOGIC, CREATE LIBRARY FILE FROM THIS//////////
        //if no value present in these two fields we just use the default QUANTITY value on the WO
        var totalNumberOfCores = totalnumofcores ? totalnumofcores : quantity;
        var goodNumberOfPanels = goodnumofpanels ? goodnumofpanels : quantity;
        //if CORE operation indicated on GATE TIME record we use TOTAL NUM OF CORES value, else we use GOOD NUMBER OF PANELSvalue
        var quantityToUse = coreboolean == true ? totalNumberOfCores : goodNumberOfPanels;
		
		return quantityToUse;
    }

    
});