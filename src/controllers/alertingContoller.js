import alertingDbservices from "../db_services/alertingDbservice.js";
import validateFunctions from "../validation/joi_validation/alerting.js"

async function createAlert(req,res, next) {
  const org_id = req.profile?.org?.id;
  const {webhookConfiguration, name, bridges, alertType, limit } = req.body;
  await validateFunctions.createAlertSchema.validateAsync({
    org_id,
    webhookConfiguration,
    name,
    bridges,
    alertType,
    limit
  });
  res.locals= await alertingDbservices.create({
    org_id,
    webhookConfiguration,
    name,
    bridges,
    alertType,
    limit
  });
  req.statusCode = 201;
  return next();
}

async function getAllAlerts(req, res) {
  try {
    const org_id = req.profile?.org?.id;
    try {
      await validateFunctions.getAlertSchema.validateAsync({org_id});
    } catch (error) {
      return res.status(422).json({
        success: false,
        error: error.details
      });
    }
    const alerts  = await alertingDbservices.getAll(org_id);
    if(alerts.success)
    {
      return res.status(200).json({
        success: true,
        data: alerts.data
      });
    }
    else{
      return res.status(404).json({
        success: false,
        error: alerts.error
      });
    }
  } catch (error) {
    console.error('Error in getAllAlerts:', error);
    return res.status(500).json({
      success: false,
      error: "Something went wrong!"
    });
  }
}

async function deleteAlert(req, res) {
  try {
    const id = req.body.id;
    try {
      await validateFunctions.deleteAlertSchema.validateAsync({id});
    } catch (error) {
      return res.status(422).json({
        success: false,
        error: error.details
      });
    }
    const result = await alertingDbservices.deleteAlert(id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: "No alerts found for the given org_id"
      });
    }
    return res.status(200).json({
      success: true,
      message: "alert successfully deleted"
    });
  } catch (error) {
    console.error('Error in deleteAllAlerts:', error);
    return res.status(500).json({
      success: false,
      error: error
    });
  }
}

async function updateAlert(req, res){
  try {
    const id = req.params.id;
    const { webhookConfiguration, bridges, name, alertType } = req.body;
    try {
      await validateFunctions.updateAlertSchema.validateAsync({
        id,
        webhookConfiguration,
        bridges,
        name,
        alertType
      });
    } catch (error) {
      return res.status(422).json({
        "success": false,
        "error": error.details
      });
    }
    const alertData =  await alertingDbservices.getById(id);
    if (!alertData.success) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    let alert = alertData.data
    if(name){
      alert.name = name;
    }
    if (webhookConfiguration) {
      const { url, headers } = webhookConfiguration;
      if (url) {
        alert.webhookConfiguration.url = url;
      }
      if (headers) {
        alert.webhookConfiguration.headers = headers;
      }
    }
    if (bridges) {
      alert.bridges = bridges
    }
    if(alertType){
      alert.alertType = alertType;
    }
    const updatedAlert = await alertingDbservices.updateAlert(id, alert);
    if(updatedAlert.success) {
      return res.status(200).json(updatedAlert);
    }
  } catch (error) {
    console.error('Error in deleteAllAlerts:', error);
    return res.status(500).json({
      success: false,
      error: error
    });
  }
}

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
      name: "default alert",
      webhookConfiguration: {
        url: "https://flow.sokt.io/func/scriSmH2QaBH",
        headers: {}
      },
      alertType: ["Error", "Variable", "retry_mechanism"],
      bridges: ["all"]
    });

    // Generate the appropriate payload based on the error type
    
    let details_payload;
    if (error_type === 'Variable') { 
      details_payload = create_missing_vars(error_log);
    } else if (error_type === 'metrix_limit_reached') {
      details_payload = metrix_limit_reached(error_log);
    } else if (error_type === 'retry_mechanism') {
      details_payload = create_retry_mechanism_payload(error_log);
    } else {
      details_payload = create_error_payload(error_log);
    }
    

    // Iterate through webhook configurations and send responses
    for (const entry of webhook_data) {
      const webhook_config = entry.webhookConfiguration;
      const bridges = entry.bridges || ["all"];

      if (entry.alertType.includes(error_type) && (bridges.includes(bridge_id) || bridges.includes("all"))) {
        if(error_type === 'metrix_limit_reached' && entry.limit === error_log) { 
          continue;
        }
        const webhook_url = webhook_config.url;
        const headers = webhook_config.headers || {};

        // Prepare details for the webhook
        const payload = {
          details: details_payload, // Use details_payload directly to avoid nesting
          bridge_id,
          org_id,
        };

        // Send the response
        const response_format = create_response_format(webhook_url, headers);
        await sendResponse(response_format, payload);

      }
    }

  } catch (error) {
    console.error(`Error in send_error_to_webhook: ${error}`);
  }
}

function create_missing_vars(details) {
  return {
    alert: "variables missing",
    Variables: details
  };
}



export default{
  createAlert,
  getAllAlerts,
  deleteAlert,
  updateAlert,
  send_error_to_webhook
}