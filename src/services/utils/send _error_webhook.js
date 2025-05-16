import alertingDbservice  from "../../db_services/alertingDbservice.js";

async function send_error_to_webhook(bridge_id, org_id, error_log, error_type) {
    try {
        // Fetch webhook data for the organization 
        const result = await alertingDbservice.getById(org_id);
        if (!result || !result.webhook_data) {
            throw new Error("Webhook data is missing in the response.");
        }

        let webhook_data = result.webhook_data;

        // Add default alert configuration if necessary
        webhook_data.push({
            "org_id": org_id,
            "name": "default alert",
            "webhookConfiguration": {
                "url": "https://flow.sokt.io/func/scriSmH2QaBH",
                "headers": {}
            },
            "alertType": ["Error", "Variable", "retry_mechanism","thumbs_down"],
            "bridges": ["all"]
        });

        // Generate the appropriate payload based on the error type
        let details_payload;
        if (error_type === 'Variable') {
            details_payload = create_missing_vars(error_log);
        } else if (error_type === 'metrix_limit_reached') {
            details_payload = metrix_limit_reached(error_log);
        } else if (error_type === 'retry_mechanism') {
            details_payload = create_retry_mechanism_payload(error_log);
        } 
        else if(error_type === 'thumbs_down') {
            details_payload = create_thumbs_down_payload(error_log);
        }
        else {
            details_payload = create_error_payload(error_log);
        }

        // Iterate through webhook configurations and send responses
        for (const entry of webhook_data) {
            const webhook_config = entry.webhookConfiguration || {};
            const bridges = entry.bridges || [];
            const alertTypes = entry.alertType || [];

            if (alertTypes.includes(error_type) && (bridges.includes(bridge_id) || bridges.includes('all'))) {
                if (error_type === 'metrix_limit_reached' && entry.limit === error_log) {
                    continue;
                }
                const webhook_url = webhook_config.url;
                const headers = webhook_config.headers || {};

                // Prepare details for the webhook
                const payload = {
                    "details": details_payload,
                    "bridge_id": bridge_id,
                    "org_id": org_id,
                };

                // Send the response
                const response_format = create_response_format(webhook_url, headers);
                await sendResponse(response_format, payload);
            }
        }
    } catch (error) {
        logger.error(`Error in send_error_to_webhook: ${error.message}`);
    }
}

function create_missing_vars(details) {
    return {
        "alert": "variables missing",
        "Variables": details
    };
}

function metrix_limit_reached(details) {
    return {
        "alert": "limit_reached",
        "Limit Size": details
    };
}

function create_error_payload(details) {
    return {
        "alert": "Unexpected Error",
        "error_message": details.error_message
    };
}

function create_retry_mechanism_payload(details) {
    return {
        "alert": "Retry Mechanism Started due to error.",
        "error_message": details
    };
}

function create_thumbs_down_payload(details) {
    return {
        "alert": "user dislike the response.",
        "error_message": details
    };
}

function create_response_format(url, headers) {
    return {
        "type": "webhook",
        "cred": {
            "url": url,
            "headers": headers
        }
    };
}

async function send_request(url, data, method, headers) {
    try {
        return await fetch(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(data)
        });
    } catch (e) {
        logger.error(`Unexpected error: ${url}, ${e.message}`);
        return { error: 'Unexpected error', details: e.message };
    }
}

async function send_message(cred, data) {
    try {
        const response = await fetch(
            `https://api.rtlayer.com/message?apiKey=${cred.apikey}`,
            {
                method: "POST",
                body: JSON.stringify({
                    ...cred,
                    message: JSON.stringify(data)
                })
            }
        );
        return response;
    } catch (error) {
        if (error.name === 'RequestError') {
            logger.error(`send message error=> ${error.message}`);
        } else {
            logger.error(`Unexpected send message error=> ${error.message}`);
        }
    }
}

async function sendResponse(response_format, data, success = false, variables = {}) {
    const data_to_send = {
        [success ? 'response' : 'error']: data,
        success: success
    };

    switch (response_format.type) {
        case 'RTLayer':
            return await send_message(cred = response_format.cred, data = data_to_send);
        case 'webhook':
            data_to_send.variables = variables;
            return await send_request(
                url = response_format.cred.url,
                data = data_to_send,
                method = 'POST',
                headers = response_format.cred.headers || {}
            );
        default:
            throw new Error(`Unknown response format type: ${response_format.type}`);
    }
}

export {
  send_error_to_webhook
};