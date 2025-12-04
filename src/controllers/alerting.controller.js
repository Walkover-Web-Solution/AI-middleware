import alertingDbservices from "../db_services/alerting.service.js";
import validateFunctions from "../validation/joi_validation/alerting.js"

async function createAlert(req, res, next) {
  const org_id = req.profile?.org?.id;
  const { webhookConfiguration, name, bridges, alertType, limit } = req.body;
  await validateFunctions.createAlertSchema.validateAsync({
    org_id,
    webhookConfiguration,
    name,
    bridges,
    alertType,
    limit
  });
  res.locals = await alertingDbservices.create({
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

async function getAllAlerts(req, res, next) {
  const org_id = req.profile?.org?.id;
  try {
    await validateFunctions.getAlertSchema.validateAsync({ org_id });
  } catch (error) {
    res.locals = {
      success: false,
      error: error.details
    };
    req.statusCode = 422;
    return next();
  }
  const alerts = await alertingDbservices.getAll(org_id);
  if (alerts.success) {
    res.locals = {
      success: true,
      data: alerts.data
    };
    req.statusCode = 200;
    return next();
  }
  else {
    res.locals = {
      success: false,
      error: alerts.error
    };
    req.statusCode = 404;
    return next();
  }
}

async function deleteAlert(req, res, next) {
  const id = req.body.id;
  try {
    await validateFunctions.deleteAlertSchema.validateAsync({ id });
  } catch (error) {
    res.locals = {
      success: false,
      error: error.details
    };
    req.statusCode = 422;
    return next();
  }
  const result = await alertingDbservices.deleteAlert(id);

  if (!result.success) {
    res.locals = {
      success: false,
      error: "No alerts found for the given org_id"
    };
    req.statusCode = 404;
    return next();
  }
  res.locals = {
    success: true,
    message: "alert successfully deleted"
  };
  req.statusCode = 200;
  return next();
}

async function updateAlert(req, res, next) {
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
    res.locals = {
      "success": false,
      "error": error.details
    };
    req.statusCode = 422;
    return next();
  }
  const alertData = await alertingDbservices.getById(id);
  if (!alertData.success) {
    res.locals = { message: 'Alert not found' };
    req.statusCode = 404;
    return next();
  }
  let alert = alertData.data
  if (name) {
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
  if (alertType) {
    alert.alertType = alertType;
  }
  const updatedAlert = await alertingDbservices.updateAlert(id, alert);
  if (updatedAlert.success) {
    res.locals = updatedAlert;
    req.statusCode = 200;
    return next();
  }
}


export default {
  createAlert,
  getAllAlerts,
  deleteAlert,
  updateAlert
}