// const AlertingModel = require('../mongoModel/alertingModel');
import AlertModel from '../mongoModel/alertingModel.js';


async function create(alertData){
  try {
    const data = await new AlertModel({
      ...alertData
    }).save();
    return {
      "success": true,
      "data": data
    };
  } catch (error) {
    console.error("error:", error);
    return {
      success: false,
      error: "something went wrong!!"
    };
  }
}

async function getAll(org_id){
 try {
    const alerts = await AlertModel.find({
      org_id
      });

    if (!alerts.length) {
      return {
        success: false,
        error: "No alerts found"
     };
    }
    return {
      success: true,
      data: alerts
    };
 } catch (error) {
    console.error("error:", error);
    return {
      success: false,
      error: "something went wrong!!"
    };
  }
 }
 async function getById(id){
  try {
     const data = await AlertModel.findById(id);
 
     if (!data) {
       return {
         success: false,
         error: "No alerts found"
      };
     }
     return {
       success: true,
       data: data
     };
  } catch (error) {
     console.error("error:", error);
     return {
       success: false,
       error: "something went wrong!!"
     };
   }
  }

async function deleteAlert(id){
  try {
    const deletedAlert = await AlertModel.findByIdAndDelete(id);
    if (!deletedAlert) {
      return {
        success: false,
        error: "No alert found for the given ID"
      };
    }
    return {
      success: true,
      message: deletedAlert
    };
  } catch (error) {
    console.error("error:", error);
    return {
      success: false,
      error: "something went wrong!!"
    };
  }
}

async function updateAlert(id, data){
  try {
    const updatedAlert = await AlertModel.findByIdAndUpdate(id, data, { new: true });
    if (!updatedAlert) {
      return {
        success: false,
        error: "No alert found for the given ID"
      };
    }
    return {
      success: true,
      data: updatedAlert
    };
  } catch (error) {
    console.error("error:", error);
    return {
      success: false,
      error: "something went wrong!!"
    };
  }
}

export default{
  create,
  getAll,
  getById,
  deleteAlert,
  updateAlert
}
