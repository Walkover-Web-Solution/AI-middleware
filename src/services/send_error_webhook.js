import { get_webhook_data } from '../db_services/webhook_alert_dbservice.js'

async function send_error_to_webhook(bridge_id, org_id, error_log, error_type) {
  try {
    // Fetch webhook data for the organization
    const result = await get_webhook_data(org_id);
    if (!result || !result.webhook_data) {
      throw new Error("Webhook data is missing in the response.");
    }

    let webhook_data = result.webhook_data;

    // Add default alert configuration if necessary
    webhook_data.push({
      org_id,
      name: "thumbs down alert",
      webhookConfiguration: {
        url: "https://flow.sokt.io/func/scriSmH2QaBH",
        headers: {},
      },
      alertType: ["Error", "thumbs_down"],
      bridges: ["all"],
    });
    
    let details_payload;
    
    if (error_type !== "thumbs_down") {
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

async function sendResponse(response_format, data, success = false, variables = {}) {
  const data_to_send = {
    [success ? 'response' : 'error']: data,
    'success': success
  };
  
  switch (response_format.type) {
    case 'RTLayer':
      return await sendMessage({ cred: response_format.cred, data: data_to_send });
    case 'webhook':
      data_to_send.variables = variables;
      return await sendRequest(
        response_format.cred.url,
        data_to_send,
        'POST',
        response_format.cred.headers || { 'Content-Type': 'application/json' }
      );
  }
}


async function sendMessage(cred, data) {
  //send message to rtlayer
  try {
    const response = await fetch(`https://api.rtlayer.com/message?apiKey=${cred.apikey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...cred,
        message: JSON.stringify(data)
      })
    });
    return response;
  } catch (error) {
    throw new Error(`send message error=>, ${error.toString()}`);
  }
}

async function sendRequest(url, data, method, headers) {
  //send message to webhook
  try {
    const response = await fetch(url, {
      method: method,
      headers: headers,
      body: JSON.stringify(data)
    });
    return response.json();
  } catch (error) {
    throw new Error(`Unexpected error: ${url}, ${error.toString()}`);
    return { error: 'Unexpected error', details: error.toString() };
  }
}


export {
    send_error_to_webhook
}
