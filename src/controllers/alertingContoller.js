import alertingDbservices from "../db_services/alertingDbservice.js";
import validateFunctions from "../validation/joi_validation/alerting.js"

async function createAlert(req,res) {
  try {
        const org_id = req.profile?.org?.id;
        const {webhookConfiguration, name, bridges } = req.body;
        try {
          await validateFunctions.createAlertSchema.validateAsync({
            org_id,
            webhookConfiguration,
            name,
            bridges,
          });
        } catch (error) {
          return res.status(422).json({
            success: false,
            error: error.details
          });
        }
        const newAlert = await alertingDbservices.create({
          org_id,
          webhookConfiguration,
          name,
          bridges
        });
        if (newAlert.success) {
          return res.status(201).json({
            "success": true,
            "data": newAlert.data
          });
        } else {
          return res.status(500).json({
            "success": false,
            "error": newAlert.error
          });
        }
  }
  catch(error){
    console.error('Error in createAlert:', error);
    res.status(400).json({
      success: false,
      error: error
    });
  }
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
    const { webhookConfiguration, bridges, name } = req.body;
    try {
      await validateFunctions.updateAlertSchema.validateAsync({
        id,
        webhookConfiguration,
        bridges,
        name
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


export default{
  createAlert,
  getAllAlerts,
  deleteAlert,
  updateAlert
}