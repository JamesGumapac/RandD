/**
* @NApiVersion 2.1
* @NScriptType ClientScript
* @NModuleScope SameAccount
*/
define(['N/runtime', 'N/search', 'N/ui/dialog', 'N/ui/message', 'N/url', 'N/https', 'N/format'],
/**
* @param{runtime} runtime
* @param{search} search
* @param{dialog} dialog
* @param{message} message
* @param{url} url
* @param{https} https
* @param{format} format
*/
(runtime, search, dialog, message, url, https, format) => {
    
    let suiteletURL = "", msg = ""
    /**
    * Function to be executed after page is initialized.
    *
    * @param {Object} scriptContext
    * @param {Record} scriptContext.currentRecord - Current form record
    * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
    *
    * @since 2015.2
    */
    function pageInit(scriptContext) {
        window.onbeforeunload = null
        jQuery('table#details_splits tr#detailsheader td').css("pointer-events","none")
        
        suiteletURL = url.resolveScript({
            deploymentId: 1,
            scriptId: "customscript_wo_movement_sl"
        })
        
        msg = message.create({
            type: message.Type.INFORMATION,
            title: "Loading Sublist ...",
            message: " "
        })
    }
    
    /**
    * Validation function to be executed when record is saved.
    *
    * @param {Object} scriptContext
    * @param {Record} scriptContext.currentRecord - Current form record
    * @returns {boolean} Return true if record is valid
    *
    * @since 2015.2
    */
    function saveRecord(scriptContext) {
        let rec = scriptContext.currentRecord

        let woNumber = rec.getValue({ fieldId: "wonumber" })
        if (!woNumber) {
            alert("Please enter value(s) for: WO#")
            return
        }

        jQuery("table#details_splits tr.custrow").remove()
        jQuery('input#submitter').prop('disabled', true)
        jQuery('input#secondarysubmitter').prop('disabled', true)
        jQuery('#detailstxt').text(`Sublist (0)`)

        msg.show()
        
        https.request.promise({
            url: `${suiteletURL}&request_type=getWoNumbers&woNumber=${woNumber}`,
            method: https.Method.GET
        })
        .then(result => {
            let wos = JSON.parse(result.body)
            console.log("wos", wos)
            let woIds = wos.map(m => m.id)
            console.log("woIds", woIds)

            searchEachWOs(woIds)
        })
        
        return false
    }
    
    function searchEachWOs(woIds) {
        let counter = 0
        let rows = []
        
        function looper() {
            setTimeout(function (j) {
                fetch(
                    `${suiteletURL}&request_type=getWoNumbersResult&woId=${woIds[j]}`,
                    {
                        method: https.Method.GET,
                        headers: { "Content-Type": 'application/json'}
                    })
                    .then(response => response.json())
                    .then(result => {
                        rows = rows.concat(result)

                        let str = ""
                        result.forEach((x, i) => {
                            let j = (i % 2) == 0 ? "even" : "odd"
                            str += `
                                <tr class="custrow uir-list-row-tr uir-list-row-${j}">
                                    <td class="uir-list-row-cell listtext">${x.custrecord_cntm_work_order_tranid}</td>
                                    <td class="uir-list-row-cell listtext">${x.custrecord_cntm_seq_no}</td>
                                    <td class="uir-list-row-cell listtext">${x.custrecord_cntm_cso_operaton}</td>
                                    <td class="uir-list-row-cell listtext">${x.custrecord_cntm_cso_pannellot}</td>
                                    <td class="uir-list-row-cell listtext">${x.custrecord_cntm_cso_woc_quantity}</td>
                                    <td class="uir-list-row-cell listtext">${x.custrecord_cntm_cso_quantity_good}</td>
                                    <td class="uir-list-row-cell listtext">${x.custrecord_cntm_operator}</td>
                                    <td class="uir-list-row-cell listtext">${x.lastmodified}</td>
                                    <td class="uir-list-row-cell listtext">${x.custrecord_cntm_cso_status}</td>
                                    <td class="uir-list-row-cell listtext">${x.custrecord_cntm_cso_scrap_quantity}</td>
                                    <td class="uir-list-row-cell listtext">${x.custrecord_cntm_cso_scarp_cumulative}</td>
                                    <td class="uir-list-row-cell listtext">${x.custrecord_cntm_cso_wocnumber_tranid}</td>
                                    <td class="uir-list-row-cell listtext">${x.custrecord_cntm_cso_wocnumber_datecreated}</td>
                                </tr>
                            `
                        });
                        
                        jQuery('table#details_splits').append(str)
                        jQuery('#detailstxt').text(`Sublist (${addCommas(rows.length)})`)
                        floatHeaders()
                        
                        if (j == woIds.length - 1) {
                            msg.hide()
                            jQuery('input#submitter').prop('disabled', false)
                            jQuery('input#secondarysubmitter').prop('disabled', false)
                        }
                        else 
                            looper()
                        
                    })
                    .catch(function (error) {
                        if (j < woIds.length - 1) {
                            looper()
                        } else {
                            dialog.alert({ 
                                title: 'ERROR', 
                                message: error.message 
                            })
                            .then(function () { 
                                msg.hide()
                                jQuery('input#submitter').prop('disabled', false)
                                jQuery('input#secondarysubmitter').prop('disabled', false)
                            })
                        }
                    })
                }, counter * 100, counter)
                counter++
            }
            
            if (woIds.length) {
                jQuery('table#details_splits > tbody tr:nth-child(2)').hide()
                looper() 
            }
            else {
                msg.hide()
                jQuery('input#submitter').prop('disabled', false)
                jQuery('input#secondarysubmitter').prop('disabled', false)
            }
        }

        const addCommas = n => format.format({ value: n, type: format.Type.FLOAT })

        const floatHeaders = () => {
            // Apply floating headers
            jQuery(document).ready(function() {
                (function ($, undefined) {
                    $(function () {
                    const windowHeight = $(window).height();
                
                    $('.uir-machine-table-container')
                        .filter(function(index, elem) {
                            return $(elem).height() > windowHeight
                        })
                        .css('height', '70vh')
                        .bind('scroll', function(event)  {
                            const headerElem = $(event.target).find('.uir-machine-headerrow');
                            headerElem.css('transform', 'translate(0, '+event.target.scrollTop+'px)');
                        })
                        .bind('scroll', function(event) {
                            const headerElem = $(event.target).find('.uir-list-headerrow');
                            headerElem.css('transform', 'translate(0, '+event.target.scrollTop+'px)');
                        })
                    });
                })(jQuery);
            })
        }
        
        return {
            pageInit,
            saveRecord
        };
        
    });
    