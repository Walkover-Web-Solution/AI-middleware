import axios from 'axios';
import alertingDbservice from '../db_services/alertingDbservice.js';
import logger from '../logger.js';

export async function sendRagUpdates(orgId, data, event) {
    try{
        if(!data?.length) return;
        const alerts = await alertingDbservice.getByQuery({org_id: orgId, alertType: 'knowledge_base'});
        if(!alerts.length) return;
        const payload = {
            event,
            data
        }
        await Promise.all(alerts.map(async (alert) => {
            const {webhookConfiguration} = alert;
            const {url, headers} = webhookConfiguration;
            const options = {
                url, 
                method: 'POST',
                headers,
                data: payload
            }
            await axios(options);
        }))
    }catch(err){
        logger.error('Error sending rag updates', err);
    }
}