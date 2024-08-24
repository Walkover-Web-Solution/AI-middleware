import { createAlert as _createAlert, getAlertById, updateAlert as _updateAlert, deleteAlert as _deleteAlert, getAllAlerts as _getAllAlerts, getAlertsByType as _getAlertsByType, getAlertsByBridge as _getAlertsByBridge } from '../db_services/alertingDbservice';
import { validateAlert, validateUpdateAlert, validateAlertId, validateQueryParam } from '../validation/alertValidation';

class AlertingController {
  async createAlert(req, res) {
    try {
      const { error, value } = validateAlert(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      value.orgId = req.user.orgId;
      const newAlert = await _createAlert(value);
      res.status(201).json(newAlert);
    } catch (error) {
      console.error('Error in createAlert:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getAlert(req, res) {
    try {
      const { alertId } = req.params;
      if (!validateAlertId(alertId)) {
        return res.status(400).json({ message: 'Invalid alert ID' });
      }

      const orgId = req.user.orgId;
      const alert = await getAlertById(alertId, orgId);
      if (!alert) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      res.json(alert);
    } catch (error) {
      console.error('Error in getAlert:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async updateAlert(req, res) {
    try {
      const { alertId } = req.params;
      if (!validateAlertId(alertId)) {
        return res.status(400).json({ message: 'Invalid alert ID' });
      }

      const { error, value } = validateUpdateAlert(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const orgId = req.user.orgId;
      const updatedAlert = await _updateAlert(alertId, orgId, value);
      if (!updatedAlert) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      res.json(updatedAlert);
    } catch (error) {
      console.error('Error in updateAlert:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async deleteAlert(req, res) {
    try {
      const { alertId } = req.params;
      if (!validateAlertId(alertId)) {
        return res.status(400).json({ message: 'Invalid alert ID' });
      }

      const orgId = req.user.orgId;
      const deletedAlert = await _deleteAlert(alertId, orgId);
      if (!deletedAlert) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      res.json({ message: 'Alert deleted successfully' });
    } catch (error) {
      console.error('Error in deleteAlert:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getAllAlerts(req, res) {
    try {
      const orgId = req.user.orgId;
      const alerts = await _getAllAlerts(orgId);
      res.json(alerts);
    } catch (error) {
      console.error('Error in getAllAlerts:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getAlertsByType(req, res) {
    try {
      const orgId = req.user.orgId;
      const { types } = req.query;
      if (!validateQueryParam(types)) {
        return res.status(400).json({ message: 'Invalid types parameter' });
      }
      const alertTypes = types.split(',');
      const alerts = await _getAlertsByType(orgId, alertTypes);
      res.json(alerts);
    } catch (error) {
      console.error('Error in getAlertsByType:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getAlertsByBridge(req, res) {
    try {
      const orgId = req.user.orgId;
      const { bridges } = req.query;
      if (!validateQueryParam(bridges)) {
        return res.status(400).json({ message: 'Invalid bridges parameter' });
      }
      const bridgeList = bridges.split(',');
      const alerts = await _getAlertsByBridge(orgId, bridgeList);
      res.json(alerts);
    } catch (error) {
      console.error('Error in getAlertsByBridge:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default new AlertingController();