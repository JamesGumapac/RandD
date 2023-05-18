/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(["N/search"], function (search) {
  function onRequest(context) {
    var headersObj = {
      name: "Content-Type",
      value: "application/json",
    };



    // log.debug({
    //   title: "Body",
    //   details: context.request.body,
    // });
    try {
      var appName = JSON.parse(context.request.body).name;

      if(appName == "ASM"){
        appName = 1;}
      else if(appName == "ASMV2"){
        appName = 102;
      }else{appName = 2;}
      log.debug({
        title: "AppName",
        details: appName
      });
    } catch (error) {
      log.debug({
        title: "AppName ERROR",
        details: error
      });
    }
    var recordData = [];
    var customrecord = search.create({
      type: "customrecord_cntm_multi_server",
      filters: [["custrecord_cntm_app_name","anyof",""+appName]],
      columns: [
        search.createColumn({
          name: "name",
          sort: search.Sort.ASC,
          label: "Name",
        }),
        search.createColumn({ name: "internalid", label: "ID" }),
        search.createColumn({ name: "custrecord_cntm_url", label: "URL" }),
        search.createColumn({
          name: "custrecord_cntm_ms_priority",
          label: "Priority",
        }),
        search.createColumn({
          name: "custrecord_cntm_app_name",
          label: "Client App",
        }),
        search.createColumn({
          name: "custrecord_cntm_ms_location",
          label: "Location",
        }),
      ],
    });

    customrecord.run().each(function (result) {
      var temp = {};
      var id = result.getText("internalid");
      var custrecord_url = result.getValue("custrecord_cntm_url");
      var custrecord_name = result.getText("custrecord_cntm_ms_location");
      var custrecord_priority = result.getValue("custrecord_cntm_ms_priority");
      var custrecord_cntm_app_name = result.getText("custrecord_cntm_app_name");
      var name = result.getValue("name");
      
      temp.id = id;
      temp.custrecord_url = custrecord_url;
      temp.custrecord_name = custrecord_name;
      temp.custrecord_priority = custrecord_priority;
      temp.name = name;
      recordData.push(temp);
      return true;
    });
    log.debug({
      title: "result",
      details: recordData,
    });

    var data = {
      workingUrl: recordData,
    };

    context.response.addHeader({
      name: "Access-Control-Allow-Origin",
      value: "*",
    });
    context.response.addHeader({
      name: "Access-Control-Allow-Methods",
      value: "GET,PUT,POST,DELETE",
    });
    context.response.addHeader({
      name: "Access-Control-Allow-Headers",
      value: "Content-Type",
    });
    context.response.addHeader({
      name: "mode",
      value: "cors",
    });
    context.response.write(JSON.stringify(data));
  }
  return {
    onRequest: onRequest,
  };
});
