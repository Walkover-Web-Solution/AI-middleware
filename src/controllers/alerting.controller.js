import alertingDbservices from "../db_services/alerting.service.js";
import validateFunctions from "../validation/joi_validation/alerting.validation.js";

async function createAlert(req, res, next) {
  const org_id = req.profile?.org?.id;
  const { webhookConfiguration, name, bridges, alertType, limit } = req.body;
  
  // Validate request body
  const { error, value } = validateFunctions.createAlertSchema.validate({
    org_id,
    webhookConfiguration,
    name,
    bridges,
    alertType,
    limit
  });
  
  if (error) {
    res.locals = {
      success: false,
      message: error.details[0].message
    };
    req.statusCode = 400;
    return next();
  }

  res.locals = await alertingDbservices.create({
    org_id: value.org_id,
    webhookConfiguration: value.webhookConfiguration,
    name: value.name,
    bridges: value.bridges,
    alertType: value.alertType,
    limit: value.limit
  });
  req.statusCode = 201;
  return next();
}

async function getAllAlerts(req, res, next) {
  const org_id = req.profile?.org?.id;
  
  // Validate org_id
  const { error } = validateFunctions.getAlertSchema.validate({ org_id });
  if (error) {
    res.locals = {
      success: false,
      message: error.details[0].message
    };
    req.statusCode = 400;
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
  } else {
    res.locals = {
      success: false,
      message: alerts.error || "No alerts found"
    };
    req.statusCode = 404;
    return next();
  }
}

async function deleteAlert(req, res, next) {
  const id = req.body.id;
  
  // Validate request body
  const { error, value } = validateFunctions.deleteAlertSchema.validate({ id });
  if (error) {
    res.locals = {
      success: false,
      message: error.details[0].message
    };
    req.statusCode = 400;
    return next();
  }

  const result = await alertingDbservices.deleteAlert(value.id);

  if (!result.success) {
    res.locals = {
      success: false,
      message: result.error || "Alert not found"
    };
    req.statusCode = 404;
    return next();
  }
  
  res.locals = {
    success: true,
    message: "Alert successfully deleted"
  };
  req.statusCode = 200;
  return next();
}

async function updateAlert(req, res, next) {
  // Validate params
  const { error: paramsError, value: paramsValue } = validateFunctions.updateAlertParamSchema.validate(req.params);
  if (paramsError) {
    res.locals = {
      success: false,
      message: paramsError.details[0].message
    };
    req.statusCode = 400;
    return next();
  }
  const id = paramsValue.id;

  // Validate request body
  const { error: bodyError, value: bodyValue } = validateFunctions.updateAlertSchema.validate({
    id,
    ...req.body
  });
  if (bodyError) {
    res.locals = {
      success: false,
      message: bodyError.details[0].message
    };
    req.statusCode = 400;
    return next();
  }

  const { webhookConfiguration, bridges, name, alertType } = bodyValue;
  
  const alertData = await alertingDbservices.getById(id);
  if (!alertData.success) {
    res.locals = {
      success: false,
      message: 'Alert not found'
    };
    req.statusCode = 404;
    return next();
  }

  let alert = alertData.data;
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
    alert.bridges = bridges;
  }
  if (alertType) {
    alert.alertType = alertType;
  }

  const updatedAlert = await alertingDbservices.updateAlert(id, alert);
  if (updatedAlert.success) {
    res.locals = updatedAlert;
    req.statusCode = 200;
    return next();
  } else {
    res.locals = {
      success: false,
      message: updatedAlert.error || "Failed to update alert"
    };
    req.statusCode = 400;
    return next();
  }
}


export default {
  createAlert,
  getAllAlerts,
  deleteAlert,
  updateAlert
}