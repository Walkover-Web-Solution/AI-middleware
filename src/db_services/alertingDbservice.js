const AlertingModel = require('../mongoModel/alertingModel');

class AlertingDbService {
  async createAlert(alertData) {
    try {
      const newAlert = new AlertingModel(alertData);
      return await newAlert.save();
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  async getAlertById(alertId) {
    try {
      return await AlertingModel.findById(alertId);
    } catch (error) {
      console.error('Error getting alert by ID:', error);
      throw error;
    }
  }

  async updateAlert(alertId, updateData) {
    try {
      return await AlertingModel.findByIdAndUpdate(alertId, updateData, { new: true });
    } catch (error) {
      console.error('Error updating alert:', error);
      throw error;
    }
  }

  async deleteAlert(alertId) {
    try {
      return await AlertingModel.findByIdAndDelete(alertId);
    } catch (error) {
      console.error('Error deleting alert:', error);
      throw error;
    }
  }

  async getAllAlerts() {
    try {
      return await AlertingModel.find();
    } catch (error) {
      console.error('Error getting all alerts:', error);
      throw error;
    }
  }

  async getAlertsByType(alertTypes) {
    try {
      return await AlertingModel.find({ alertType: { $in: alertTypes } });
    } catch (error) {
      console.error('Error getting alerts by type:', error);
      throw error;
    }
  }

  async getAlertsByBridge(bridges) {
    try {
      return await AlertingModel.find({ bridges: { $in: bridges } });
    } catch (error) {
      console.error('Error getting alerts by bridge:', error);
      throw error;
    }
  }
}

module.exports = new AlertingDbService();
