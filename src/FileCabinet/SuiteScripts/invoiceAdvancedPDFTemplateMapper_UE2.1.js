/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search'], function(search) {

    const RND_CIRCUITS_SUBS                 = 2 // R&D Circuits
    const RND_INTERCONNECT_SOLUTIONS_SUBS   = 4 // R&D Interconnect Solutions
    const RND_ORIGINAL_IMG                  = 4007 // RDAltanova.jpg
    const RND_INTERCONNECT_SOLUTIONS_IMG    = 4008 // RDIS.jpg

    function beforeLoad(context) {
        let { form, newRecord } = context
        if (!newRecord.id) return
        
        let soID = newRecord.getValue({ fieldId: 'createdfrom' })
        if (soID) {
            let trackingNumbers = []
            search.create({
                type: search.Type.ITEM_FULFILLMENT,
                filters: [
                    ['createdfrom', search.Operator.IS, soID]
                ],
                columns: ['trackingnumbers']
            })
            .run()
            .each(each => {
                trackingNumbers.push(each.getValue('trackingnumbers'))
                return true
            })
    
            log.debug('trackingnumbers', trackingNumbers)
    
            form.addField({
                id: 'custpage_trackingnumbers',
                label: 'TN',
                type: 'richtext'
            }).defaultValue = trackingNumbers.length ? trackingNumbers.join(',') : ''
        }

        //////////////// SUBS LOGOS
        let imgId = ''
        let subsidiary = newRecord.getValue({ fieldId: 'subsidiary' })
        imgId = (subsidiary == RND_INTERCONNECT_SOLUTIONS_SUBS) ? RND_INTERCONNECT_SOLUTIONS_IMG : RND_ORIGINAL_IMG
        log.debug("IMG ID", imgId)

        if (imgId) {
            form.addField({
                id: 'custpage_subslogo',
                label: 'TN',
                type: 'image'
            }).defaultValue = imgId
        }
    }

    return {
        beforeLoad
    }
});
