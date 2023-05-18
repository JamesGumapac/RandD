/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @filename      cntm_sc_vn_assignment_one.js
 * @scriptname    cntm_sc_vn_assignment_one
 * @ScriptId      customscript_cntm_sc_vn_assignment_one
 * @author        Vishal Naphade
 * @email         vishal.naphade@gmail.com
 * @date          27/07/2021 
 * @description   Create a simple suitelet with all types of fields (text,checkbox,select ,multi select,radio     button etc). Arrange these fields in proper manner using the field groups and layout types)
					On Save of show a form in read -only format
					On save create a custom record.

 
 * Copyright 2020, Centium Consulting its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 * Module Description
 * 
 * Sr. No   	 Date           	  Author                  	Remarks
 * 1		27 July 2021  		  Vishal Naphade    	 -  All field type added
 * 2			 
 * 
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

//https://tstdrv2324196.app.netsuite.com/app/common/scripting/script.nl?id=2108
define(['N/ui/serverWidget','N/record','N/redirect'],

function(serverWidget,record,redirect) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	var request = context.request; 
    	var response = context.response;
    	
    	if(context.request.method=='GET'){
    		var form = serverWidget.createForm({
                title: 'Fields Form'
            });

            var usergroup = form.addFieldGroup({
                id: 'information',
                label: 'User Information'
            });
            
            var usergroup = form.addFieldGroup({
                id: 'dates',
                label: 'Dates'
            });
            
            var usergroup = form.addFieldGroup({
                id: 'text',
                label: 'Text'
            });
            
            var checkBox = form.addField({
           	 id: 'cntm_custpage_checkbox',
           	 type: serverWidget.FieldType.CHECKBOX,
           	 label: 'Check Box',
           	 container: 'information',
           	 }).setHelpText({
                    help: 'Check Box '
                });
            
            var currency=form.addField({
                id: 'currency',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Currency',
                container: 'information'
            }).setHelpText({
                help: 'CURRENCY '
            });
            
            var datetimetz = form.addField({
                id: 'custom_datetimetz',
                type: serverWidget.FieldType.DATETIMETZ,
                label: 'DATETIMETZ',
                container: 'dates'
            }).setHelpText({
                help: 'DATETIMETZ '
            });
            
            var date = form.addField({
                id: 'custom_date',
                type: serverWidget.FieldType.DATE,
                label: 'Date',
                container: 'dates'
            }).setHelpText({
                help: 'DATE '
            });
            

            var email=form.addField({
                id: 'emailfield',
                type: serverWidget.FieldType.EMAIL,
                label: 'Email',
                container: 'text'
            }).setHelpText({
                help: 'EMAIL '
            });
                        
            var float=form.addField({
                id: 'float',
                label: "Float",
                type: serverWidget.FieldType.FLOAT,
                container: 'text'
            }).setHelpText({
                help: 'FLOAT  '
            });
            
            var integer=form.addField({
                id: 'integer',
                type: serverWidget.FieldType.INTEGER,
                label: 'INTEGER',
                container: 'text'
            }).setHelpText({
                help: 'INTEGER  '
            });
            
            var image=form.addField({
                id: 'image',
                type: serverWidget.FieldType.IMAGE,
                label: 'IMAGE',
                container: 'information'
            }).setHelpText({
                help: 'IMAGE  '
            });
            
            var lable=form.addField({
                id: 'lable',
                type: serverWidget.FieldType.LABEL,
                label: 'LABEL',
                container: 'text'
            }).setHelpText({
                help: 'LABEL  '
            });

            var longText = form.addField({
                id: 'longtext',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'LONGTEXT',
                container: 'text'
            }).setHelpText({
                help: 'LONGTEXT  '
            });
            longText.isMandatory = true;
           
            
            var password = form.addField({
                id: 'password',
                type: serverWidget.FieldType.PASSWORD,
                label: 'PASSWORD',
                container: 'text'
            }).setHelpText({
                help: 'PASSWORD  '
            });
            
            var percent = form.addField({
                id: 'percent',
                type: serverWidget.FieldType.PERCENT,
                label: 'PERCENT',
                container: 'text'
            }).setHelpText({
                help: 'PERCENT  '
            });
            
            var phone = form.addField({
                id: 'phonefield',
                type: serverWidget.FieldType.PHONE,
                label: 'Phone Number',
                container: 'text'
            }).setHelpText({
                help: 'PHONE  '
            });
            
            var select = form.addField({
                id: 'selectfield',
                type: serverWidget.FieldType.SELECT,
                label: 'Select',
                container: 'information'
            }).setHelpText({
                help: 'SELECT  '
            });
            select.addSelectOption({
                value: 'One',
                text: 'One'
            });
            select.addSelectOption({
                value: 'Two',
                text: 'Two'
            });
            select.addSelectOption({
                value: 'Three',
                text: 'Three'
            });

            var radio1 = form.addField({
                id: 'radio1',
                name: 'retail_customer',
                type: serverWidget.FieldType.RADIO,
                label: 'RADIO 1',
                source:'retail',
                container: 'information'
             })
             var radio2 = form.addField({
                 id: 'radio1',
                 name: 'corporate_customer',
                 type: serverWidget.FieldType.RADIO,
                 label: 'RADIO 2',
                 source:'retail',
                 container: 'information'
             })

             var richText = form.addField({
                 id: 'richtext',
                 type: serverWidget.FieldType.RICHTEXT,
                 label: 'RICHTEXT',
                 container: 'text'
             }).setHelpText({
                 help: 'RICHTEXT  '
             });
             
            var text = form.addField({
                id: 'fnamefield',
                type: serverWidget.FieldType.TEXT,
                label: 'First Name',
                container: 'text'
            }).setHelpText({
                help: 'TEXT  '
            });
            
           
            var textArea = form.addField({
                id: 'textarea',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'TEXTAREA',
                container: 'text'
            }).setHelpText({
                help: 'TEXTAREA  '
            });
            
            var timeofDay = form.addField({
                id: 'time_of_day',
                type: serverWidget.FieldType.TIMEOFDAY,
                label: 'TIMEOFDAY',
                container: 'dates'
            }).setHelpText({
                help: 'TIMEOFDAY  '
            });

            var url=form.addField({
                id: 'urlfield',
                type: serverWidget.FieldType.URL,
                label: 'Website',
                container:'information'
            }).setHelpText({
                help: 'URL  '
            });
            
            var tab = form.addTab({
            	id:'tabid',
            	label:'item'
            });
            var tab2 = form.addTab({
            	id:'tabid2',
            	label:'payment'
            });
            
            var file=form.addField({
                id: 'file',
                label: "File",
                type: serverWidget.FieldType.FILE,
            }).setHelpText({
                help: 'FILE  '
            });
            
         // add a sublist to the form
            var sublist = form.addSublist({
                id: 'item',
                type: serverWidget.SublistType.INLINEEDITOR,
                label: 'Item',
                tab: 'tabid'
            });
            
            // add fields to the sublist (Item 1)
            sublist.addField({
                id: 'srno',
                type: serverWidget.FieldType.INTEGER,
                label: 'Sr No.'
            });
            var add = sublist.addField({
                id: 'item',
                type: serverWidget.FieldType.SELECT,
                label: 'Item'
            });
            add.addSelectOption({
                value: '',
                text: ''
            });
            add.addSelectOption({
                value: 'One',
                text: 'One'
            });
            add.addSelectOption({
                value: 'two',
                text: 'two'
            });
            add.addSelectOption({
                value: 'three',
                text: 'three'
            });
            sublist.addField({
                id: 'description',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'Description'
            });
            
            
            // add a sublist to the form
            var sublist = form.addSublist({
                id: 'item1',
                type: serverWidget.SublistType.INLINEEDITOR,
                label: 'Payment',
                tab: 'tabid2'
            });
            
            // add fields to the sublist (Item 2)
            sublist.addField({
                id: 'date',
                type: serverWidget.FieldType.DATE,
                label: 'Date'
            });
            sublist.addField({
                id: 'amount',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Amount'
            });
            sublist.addField({
                id: 'total',
                type: serverWidget.FieldType.CURRENCY,
                label: 'total'
            });

            sublist.addField({
                id: 'status',
                type: serverWidget.FieldType.TEXT,
                label: 'Status'
            });

            
            var submitButton = form.addSubmitButton({
    			label:'Submit'
    		});
            
            context.response.writePage(form); 
    	}
    	// else{
		// 	var currency = context.request.parameters.currency;
		// 	var date = context.request.parameters.date;
		// 	var email = context.request.parameters.email;
		// 	var float = context.request.parameters.float;
		// 	var integer = context.request.parameters.integer;
		// 	var image = context.request.parameters.image;
		// 	var longText = context.request.parameters.longText;
		// 	var password = context.request.parameters.password;
		// 	var percent = context.request.parameters.percent;
		// 	var phone = context.request.parameters.phone;
		// 	var richText = context.request.parameters.richText;
		// 	var text = context.request.parameters.text;
		// 	var textArea = context.request.parameters.textArea;
		// 	var timeofDay = context.request.parameters.timeofDay;
		// 	var url = context.request.parameters.url;
		// 	var file = context.request.parameters.file;
    		
		// 	//Creating custom record object
		// 	var customRecObj = record.create({
		// 		type:'customrecord_assignment_one',
		// 		isDynamic:true
		// 	});
			
		// 	var id = customRecObj.save();
		// 	log.debug('Id=',id);
			
		// 	//Loading custom record
		// 	var customRecObj = record.load({
		// 		type : 'customrecord_assignment_one',
        //  		id : id,
        //  		isDynamic : true,
		// 	});
			
		// 	customRecObj.setValue('	custrecord_currency_new',currency);
		// 	customRecObj.setValue('custrecord_date_new',date);
		// 	customRecObj.setValue('custrecord_email_new_2',email);
		// 	customRecObj.setValue('custrecord_float',float);
		// 	customRecObj.setValue('custrecord_integer',integer);
		// 	customRecObj.setValue('custrecord_image',image);
		// 	customRecObj.setValue('custrecord_longtext',longText);
		// 	customRecObj.setValue('custrecord_password',password);
		// 	customRecObj.setValue('custrecord_percent',percent);
		// 	customRecObj.setValue('custrecord_phone_new',phone);
		// 	customRecObj.setValue('custrecord_richtext',richText);
		// 	customRecObj.setValue('custrecord_text',text);		
		// 	customRecObj.setValue('custrecord_text_area',textArea);
		// 	customRecObj.setValue('custrecord_time_of_day',timeofDay);
		// 	customRecObj.setValue('custrecord_url',url);
		// 	customRecObj.setValue('custrecord_file',file);
			
		// 	var formID = customRecObj.save();
      		
		// 	//Redirect to custom record
      	// 	redirect.toRecord ({
     	//        type :'customrecord_assignment_one',
     	//        id   : formID,
     	//        isEditMode : false
     	//       });
      	// 	log.debug("Doneee....");
	
			
    	// }
    	

    }

    return {
        onRequest: onRequest
    };
    
});
