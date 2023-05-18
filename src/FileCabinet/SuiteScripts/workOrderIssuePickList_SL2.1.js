/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(['N/record', 'N/file', 'N/render'], (record, file, render) => {

    const onRequest = context => {
        let { request, response } = context;
        let params = request.parameters;

        let rec = record.load({
            type: 'workorderissue',
            id: params.custparam_woiid
        });
        let DOMFieldMapping = rec.getValue({
            fieldId: 'custbody_cntm_comp_line_fld_map'
        }) || '{}';
        DOMFieldMapping = JSON.parse(DOMFieldMapping);
        log.debug('DOMFieldMapping', DOMFieldMapping)
        let tranid = rec.getValue({
            fieldId: 'tranid'
        });
        let lineCount = rec.getLineCount({
            sublistId: 'component'
        });

        log.debug('Entry', { params, lineCount });
        
        let temp = file.load({
            id: './xml/workOrderIssuePickList.html'
        }).getContents();

        let tbody = '', renderedItems = 0, itemCount = 0;

        for (let i=0;i<lineCount;i++) {
            let item = rec.getSublistValue({
                sublistId: 'component',
                fieldId: 'compitemname',
                line: i
            });
            let custsupplied = ''
            let bagntag = ''
            let stacked = ''
            let specificpart = ''
            if (DOMFieldMapping[i]) {
                custsupplied = DOMFieldMapping[i].custsupplied ? 'Yes' : 'No'
                bagntag = DOMFieldMapping[i].bagntag ? 'Yes' : 'No'
                stacked = DOMFieldMapping[i].stacked ? 'Yes' : 'No'
                specificpart = DOMFieldMapping[i].specificpart ? 'Yes' : 'No'
            }
            let qty = parseFloat(rec.getSublistValue({
                sublistId: 'component',
                fieldId: 'quantity',
                line: i
            })) || 0;
            
            if (!qty) continue;

            renderedItems++;
            itemCount += qty;
            qty = addCommas(qty);

            let compInvDetReq = rec.getSublistValue({
                sublistId: 'component',
                fieldId: 'componentinventorydetailreq',
                line: i
            }) // Returns string not boolean)
            
            if (compInvDetReq == 'T') {
                let recSub = null;
                let recSubLineCount = 0;
                try {
                    recSub = rec.getSublistSubrecord({
                        sublistId: 'component',
                        fieldId: 'componentinventorydetail',
                        line: i
                    });
                    recSubLineCount = recSub.getLineCount({
                        sublistId: 'inventoryassignment'
                    });
                } catch(e) {
                    log.debug('Error', e.message); // Most probably Invalid number (must be positive) error which is super weird
                }
                if (recSub && recSubLineCount > 0) {
                    for (let j=0;j<recSubLineCount;j++) {
                        let invNum = recSub.getSublistText({
                            sublistId: 'inventoryassignment',
                            fieldId: 'issueinventorynumber',
                            line: j
                        });
                        let binNum = recSub.getSublistText({
                            sublistId: 'inventoryassignment',
                            fieldId: 'binnumber',
                            line: j
                        });
                        let binQty = parseFloat(recSub.getSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'quantity',
                            line: j
                        })) || 0;
                        binQty = addCommas(binQty)
                        if (j==0) {
                            tbody += `
                                <tr class="item-separator">
                                    <td><p align="left">${item}</p></td>
                                    <td><p align="left" padding-left="30px">${custsupplied}</p></td>
                                    <td><p align="left" padding-left="20px">${bagntag}</p></td>
                                    <td><p align="left" padding-left="20px">${stacked}</p></td>
                                    <td><p align="left" padding-left="20px">${specificpart}</p></td>
                                    <td><p align="right" padding-right="10px">${qty}</p></td>
                                    <td><p align="left" padding-left="10px">${invNum}</p></td>
                                    <td><p align="left" padding-left="10px">${binNum}</p></td>
                                    <td><p align="right">${binQty}</p></td>
                                </tr>
                            `
                        } else {
                            tbody += `
                                <tr>
                                    <td><p align="left"></p></td>
                                    <td><p align="left"></p></td>
                                    <td><p align="left"></p></td>
                                    <td><p align="left"></p></td>
                                    <td><p align="left"></p></td>
                                    <td><p align="right"></p></td>
                                    <td><p align="left" padding-left="10px">${invNum}</p></td>
                                    <td><p align="left" padding-left="10px">${binNum}</p></td>
                                    <td><p align="right">${binQty}</p></td>
                                </tr>
                            `
                        }
                    }
                } else {
                    tbody += `
                        <tr class="item-separator">
                            <td><p align="left">${item}</p></td>
                            <td><p align="left" padding-left="30px">${custsupplied}</p></td>
                            <td><p align="left" padding-left="20px">${bagntag}</p></td>
                            <td><p align="left" padding-left="20px">${stacked}</p></td>
                            <td><p align="left" padding-left="20px">${specificpart}</p></td>
                            <td><p align="right" padding-right="10px">${qty}</p></td>
                            <td><p align="left"></p></td>
                            <td><p align="right"></p></td>
                            <td><p align="left"></p></td>
                        </tr>
                    `
                }
            } else {
                tbody += `
                    <tr class="item-separator">
                        <td><p align="left">${item}</p></td>
                        <td><p align="left" padding-left="30px">${custsupplied}</p></td>
                        <td><p align="left" padding-left="20px">${bagntag}</p></td>
                        <td><p align="left" padding-left="20px">${stacked}</p></td>
                        <td><p align="left" padding-left="20px">${specificpart}</p></td>
                        <td><p align="right" padding-right="10px">${qty}</p></td>
                        <td><p align="left"></p></td>
                        <td><p align="right"></p></td>
                        <td><p align="left"></p></td>
                    </tr>
                `
            }
        }
        temp = temp.replace('{tbody}', tbody.replace(/&/g, '&amp;'))
            .replace('{renderedItems}', addCommas(renderedItems))
            .replace('{itemCount}', addCommas(itemCount))
            .replace(/null/g, '')
            .replace(/undefined/g, '');

        let renderer = render.create();
        renderer.templateContent = temp;
        renderer.addRecord('record', rec);

        var pdfFile = render.xmlToPdf({
            xmlString: renderer.renderAsString()
        });
        pdfFile.name = `${tranid}_PickingTicket.pdf`;

        response.writeFile({
            file: pdfFile,
            isInline: true
        });
    }

    const addCommas = n => {
        let split = n.toString().split('.')
        split[0] = split[0].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        return split.join('.')
    }

    return {
        onRequest
    };
});
