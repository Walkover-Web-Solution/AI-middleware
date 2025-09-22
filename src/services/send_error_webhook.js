import { get_webhook_data } from '../db_services/webhook_alert_dbservice.js'
import {sendResponse} from './utils/alertUtils.js'

async function send_error_to_webhook(bridge_id, org_id, error_log, error_type) {
  try {
    // Fetch webhook data for the organization
    const result = await get_webhook_data(org_id);
    if (!result || !result.webhook_data) {
      throw new Error("Webhook data is missing in the response.");
    }

    let webhook_data = result.webhook_data;

    let details_payload;
    
    if (error_type !== "thumbsdown") {
        throw new Error("Invalid error type")
    }
    details_payload = thumbs_down_error(error_log);

    // Iterate through webhook configurations and send responses
    for (const entry of webhook_data) {
      const webhook_config = entry.webhookConfiguration;
      const bridges = entry.bridges || ["all"];

      if (entry.alertType.includes(error_type) && (bridges.includes(bridge_id) || bridges.includes("all"))) {
        const webhook_url = webhook_config.url;
        const headers = webhook_config.headers || {};

        // Prepare details for the webhook
        const payload = {
          details: details_payload,
          bridge_id,
          org_id,
        };

        // Send the response
        const response_format = create_response_format(webhook_url, headers);
        await sendResponse(response_format, { data: payload });
      }
    }
  } catch (error) {
    logger.error(`Error in send_error_to_webhook: ${error.message}`);
  }
}

function thumbs_down_error(details) {
  return {
    alert: "Thumbs down on response",
    Variables: details,
  };
}


function create_response_format(url, headers) {
    return {
        type: "webhook",
        cred: {
            url: url,
            headers: headers
        }
    };
}


export {
    send_error_to_webhook
}
