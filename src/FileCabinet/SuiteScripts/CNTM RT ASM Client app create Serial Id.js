/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/file', 'N/http', 'N/https', 'N/record', 'N/runtime', 'N/search','N/url','N/cache'], function(file, http, https, record, runtime, search, url,cache) {

    function _get(context) {
        
    }

    function _post(context) {
        var assemblyitem = '';
        try {
            log.debug('_post Init')
            log.debug('requestParams', JSON.stringify(context));
            // var getwodetails = context.getwodetails;
            var woId = context.wo;
            var serialIdArray = context.serialNums;
            log.debug("serialIdArray",serialIdArray)
            // var serialIdArray = JSON.parse(context.serialNums);
            var flag =0;
            var aarrayForSerial = [];
            var tempArr=["initial"];
            var myCache = cache.getCache({
                name: 'temporaryCache',
                scope: cache.Scope.PRIVATE
            });
            log.debug("myCache",myCache)
            var arrayForSerial = myCache.get({
                key:'arrayForSerial',
                ttl: 300
            });

            log.debug("arrayForSerial",arrayForSerial)
           if(arrayForSerial!=null)
           {
            var a=arrayForSerial.split(",").length
           for(var i=0;i<a;i++)
           {
            if(arrayForSerial.split(",")[i] !='initial')
            tempArr.push(arrayForSerial.split(",")[i])
           }
            }

           

            if(!arrayForSerial){
              

                myCache.put({
                    key:'arrayForSerial',
                    value:'initial',
                    ttl: 300
                });
            }
           var existingid ;
            for(var i=0;i<serialIdArray.length;i++){
             
                  try{

                  if(tempArr.includes(serialIdArray[i]))
                  {
                    existingid=serialIdArray[i];
                    flag++;
                    // log.debug("serial id "+serialIdArray[i]+ "already exists")
                    // return {
                    //                 "success" : "false",
                    //                 "datain" : "Serial id " +serialIdArray[i]+ " already exists"
                    //             };
                  }
                  else
                  {
                    aarrayForSerial.push(serialIdArray[i])
                   

                  
                  }
                }
                  catch(error){log.debug("error in if else",error)}
                  
    
                  }
                 
                 
                  if(flag>0)
                  {
                    return {
                                        "success" : "false",
                                        "datain" : "Serial id " +existingid+ " already exists"
                                    };

                  }
                  else{
                    var cachekey = myCache.put({
                        key:'arrayForSerial',
                        value: tempArr+","+aarrayForSerial,
                        ttl: 300
                    });
                  }
                  log.debug("aarrayForSerial",aarrayForSerial)

                  serialIdArray=aarrayForSerial;
                  log.debug("finalized array to pass",serialIdArray)

        
                    log.debug('woId',woId)
                    var woRec = record.load({
                        type: record.Type.WORK_ORDER,
                        id: woId,
                        isDynamic: false,
                        // defaultValues: Object
                    })
                    assemblyitem = woRec.getValue({
                        fieldId: 'assemblyitem'
                    })
                    log.debug('serialIdArray'+ typeof serialIdArray,serialIdArray[0])
                    // return;
                    var data = getSerialId(woId,serialIdArray,assemblyitem,woRec)
                    log.debug("data",data)
                    if (data.length == serialIdArray.length) {
                        craeteSerialId(woId,serialIdArray,assemblyitem,woRec)
                        return {
                            "success" : "true",
                            "datain" : 'Serial IDd created successfully'
                        };
                    }else{
                        return {
                            "success" : "true",
                            "datain" : data
                        };
                    }

            
         }
        
                  

         catch (error) {
            log.error('_post',error)
        }
    }

    function getSerialId(woId,serialIdArray,assemblyitem,woRec) {
        var existingSerial = [];
        try {
            log.debug('getSerialId Init');
            // var woLookup = search.lookupFields({
            //     type : 'workorder',
            //     id : woId,
            //     columns : [ 'assemblyitem' ],
            // });
            // var assemblyitem = woLookup.assemblyitem[0].value;
            // log.debug(assemblyitem)

           
            serialIdArray.forEach(serialId => {
                var customrecord_cntm_client_app_asm_oper_sSearchObj = search.create({
                    type: "customrecord_cntm_client_app_asm_oper_s",
                    filters:
                    [
                       ["custrecord_cntm_client_asm_serial_no","startswith",serialId], 
                       "AND", 
                       ["custrecord_cntm_client_asm_asm_item","anyof",assemblyitem]
                    ],
                    columns:
                    [
                       search.createColumn({name: "custrecord_cntm_client_asm_serial_no", label: "Serial ID"})
                    ]
                 });
                 var searchResultCount = customrecord_cntm_client_app_asm_oper_sSearchObj.runPaged().count;
                 log.debug("customrecord_cntm_client_app_asm_oper_sSearchObj result count",searchResultCount);
                
                 if (searchResultCount > 0){
                    existingSerial.push(serialId)
                 }else {
                    craeteSerialId(woId,serialIdArray,assemblyitem,woRec)
                 }
            });
            
            
        } catch (error) {
            log.error('getSerialId',error)
            existingSerial = null
        }
        return existingSerial;
    }

    function craeteSerialId(woId,serialIdArray,assemblyitem,woRec) {
        try {
            // var woLookup = search.lookupFields({
            //     type : 'workorder',
            //     id : woId,
            //     columns : [ 'assemblyitem' ],
            // });
            // var assemblyitem = woLookup.assemblyitem[0].value;
            // log.debug(assemblyitem)
            log.debug('POST',serialIdArray)
           for (let serialId = 0; serialId < serialIdArray.length; serialId++) {
                log.debug(serialIdArray[serialId])
                var recData = fetchData(woId,serialIdArray[serialId],assemblyitem,woRec);
                createRecord(recData);    
            }
            
        } catch (error) {
            log.error('Error craeteSerialId',error)
        }
    }

    function fetchData(woId,serialId,assemblyitem,woRec) {
        var RoutingSeqlist = []
        var recordData = {
            assemblyitem : assemblyitem,
            serialId : serialId,
            woId: woId,
            priority : '',
            runTime:'',
            setuptime: '',
            lastop : '',
            lastopSeq : ''
        }
        try {
            
            // var woLookup = search.lookupFields({
            //     type : 'workorder',
            //     id : woId,
            //     columns : [ 'manufacturingrouting','custbody_rda_wo_priorty' ],
            // });
            // var manufacturingrouting = woLookup.manufacturingrouting[0].value;
            // recordData.priority = woLookup.custbody_rda_wo_priorty[0].value;
            
            // log.debug(manufacturingrouting)

            var manufacturingrouting = woRec.getValue({
                fieldId: 'manufacturingrouting'
            })
            recordData.priority = woRec.getValue({
                fieldId: 'custbody_rda_wo_priorty'
            })

            var manufacturingroutingSearchObj = search.create({
                type: "manufacturingrouting",
                filters:
                [
                ["internalid","anyof",manufacturingrouting]
                ],
                columns:
                [
                search.createColumn({name: "sequence",sort: search.Sort.ASC,label: "Operation Sequence"}),
                search.createColumn({name: "operationname", label: "Operation Name"}),
                search.createColumn({name: "setuptime", label: "Setup Time"}),
                search.createColumn({name: "runrate", label: "Run Rate"})
                ]
            });
            var searchResultCount = manufacturingroutingSearchObj.runPaged().count;
            log.debug("manufacturingroutingSearchObj result count",searchResultCount);
            manufacturingroutingSearchObj.run().each(function(result,i){
                
                var temp = {
                    sequence : result.getValue(search.createColumn({name: "sequence",sort: search.Sort.ASC,label: "Operation Sequence"})),
                    operationname : result.getValue(search.createColumn({name: "operationname", label: "Operation Name"})),
                    setuptime : result.getValue(search.createColumn({name: "setuptime", label: "Setup Time"})),
                    runrate : result.getValue(search.createColumn({name: "runrate", label: "Run Rate"})),
                    // lastop : false
                }
                // if(searchResultCount-1 == i){
                //     temp.lastop = true
                // }
                RoutingSeqlist.push(temp);

                return true;
            });

            recordData.lastopSeq = RoutingSeqlist[0].sequence;
            recordData.lastop = `${RoutingSeqlist[0].sequence} ${RoutingSeqlist[0].operationname}`;
            recordData.runTime = RoutingSeqlist[0].runrate;
            recordData.setuptime = RoutingSeqlist[0].setuptime;
            recordData.lastoperation = `${RoutingSeqlist[searchResultCount-1].sequence} ${RoutingSeqlist[searchResultCount-1].operationname}`;

        } catch (error) {
            log.error({
                title: 'fetchData',
                details: error
            })
            recordData = null;
        }

        return recordData;
    }
    function createRecord(recordData) {
        // var recordData = {
        //     assemblyitem : assemblyitem,
        //     serialId : serialId,
        //     woId: woId,
        //     priority : '',
        //     runTime:'',
        //     setuptime: '',
        //     lastop : '',
        //     lastopSeq : ''
        // }
        if (recordData) {
            
            var operationRecord = record.create({
                type: 'customrecord_cntm_client_app_asm_oper_s',
                isDynamic: true,
            });


            operationRecord.setValue({
                fieldId: 'name',
                value : recordData.serialId
            });
            operationRecord.setValue({
                fieldId: 'custrecord_cntm_client_asm_serial_no',
                value : recordData.serialId
            });
            operationRecord.setValue({
                fieldId: 'custrecordcntm_client_asm_priority',
                value : recordData.priority
            });
            operationRecord.setValue({
                fieldId: 'custrecordcntm_client_asm_wo_ref',
                value : recordData.woId
            });
            operationRecord.setValue({
                fieldId: 'custrecordcntm_client_asm_laborsetuptime',
                value : recordData.setuptime
            });
            operationRecord.setValue({
                fieldId: 'custrecord_cnmt_asm_laborruntime',
                value : recordData.runTime
            });
            operationRecord.setValue({
                fieldId: 'custrecordcntm_client_asm_last_comp_op',
                value : recordData.lastop
            });
            operationRecord.setValue({
                fieldId: 'custrecord_cntm_client_asm_nextop',
                value : recordData.lastop
            });
            operationRecord.setValue({
                fieldId: 'custrecord_cntm_client_asm_sequence',
                value : recordData.lastopSeq
            });
            operationRecord.setValue({
                fieldId: 'custrecord_cntm_client_asm_asm_item',
                value : recordData.assemblyitem
            });
            operationRecord.setValue({
                fieldId: 'custrecordcntm_client_asm_last_op',
                value : recordData.lastoperation
            });
            var operationRecordid = operationRecord.save();
            log.debug('operationRecord',operationRecordid)
        }else{

        }
    }
    function _put(context) {
        
    }

    function _delete(context) {
        
    }
    function formatNumber(params) {
        return parseFloat(params.replace(/[,]/g,''));
    }
    return {
        get: _get,
        post: _post,
        put: _put,
        delete: _delete
    }
});













// log.debug("checkkey",checkkey)
// log.debug("Value to put",serialIdArray[i])

// if(!checkkey){
//     arrayForSerial.push(serialIdArray[i])
//              }