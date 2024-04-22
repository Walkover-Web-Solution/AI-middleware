const {configurationModel}=require("../../mongoModel/configuration");
const mongoose=require("mongoose");
const {apiCallModel} = require("../../mongoModel/apiCall");
const createBridges = async (configuration) => {
    try {
        const result=await new configurationModel({...configuration}).save();
        return {success:true,bridge:result}
    } catch (error) {
        console.log("error:",error)
        return {success:false,error:"something went wrong!!"}
    }
}
const getAllBridges=async (org_id)=>{
try {
    const bridges = await configurationModel.find({org_id:org_id},{ bridge_id: 1, _id: 1,name:1,service:1,org_id:1 });
    return { success: true, bridges: bridges }
} catch (error) {
    console.log("error:",error)
    return {success:false,error:"something went wrong!!"}
}
}
const updateBridges=async(bridge_id,configuration,org_id,apikey)=>{
    try {
        const bridges = await configurationModel.findOneAndUpdate({_id:bridge_id,org_id:org_id},{configuration:configuration,name:configuration?.name,service:configuration?.service,apikey:apikey}, {new : true});
        return { success: true,bridges : bridges, message:"bridge updated successfully" }
    } catch (error) {
        console.log("error:",error)
        return {success:false,error:"something went wrong!!"}
    }
}
const getBridges= async (bridge_id)=>{
    try {
        const bridges = await configurationModel.findOne({_id:bridge_id});
        return { success: true, bridges: bridges };
    }catch (error) {
        console.log("error:",error)
        return {success:false,error:"something went wrong!!"};
    }
}

const getBridgesWithSelectedData= async (bridge_id)=>{
    try {
        const bridges = await configurationModel.findOne({_id:bridge_id},{ "is_api_call": 0, "created_at": 0, "api_endpoints": 0, "__v": 0, "bridge_id":0 }).lean();
        return { success: true, bridges: bridges };
    }catch (error) {
        console.log("error:",error)
        return {success:false,error:"something went wrong!!"};
    }
}

const getBridgesByName= async (name,org_id)=>{
    try {
        const bridges = await configurationModel.findOne({name:name,org_id:org_id});
        return { success: true, bridges: bridges };
    }catch (error) {
        console.log("error:",error)
        return {success:false,error:"something went wrong!!"};
    }
}

const deleteBridge=async (bridge_id,org_id)=>{
    try {
        const bridges = await configurationModel.findOneAndDelete({_id:bridge_id,org_id:org_id});
        return { success: true, bridges: bridges };
    }catch (error) {
        console.log("error:",error)
        return {success:false,error:"something went wrong!!"};
    }
}

const updateToolsCalls=async (bridge_id,org_id,configuration,api_endpoints,api_call)=>{
    try {
        const bridges = await configurationModel.findOneAndUpdate({_id:bridge_id,org_id:org_id},{configuration:configuration,api_endpoints:api_endpoints,api_call:api_call,is_api_call:true});
        return { success: true, message:"bridge updated successfully" }
        
    } catch (error) {
        console.log("error:",error)
        return {success:false,error:"something went wrong!!"};
    }
    
}

const getApiCallById=async (apiId)=>{
    try {
        const apiCall = await apiCallModel.findById(apiId);
        return { success: true, apiCall: apiCall };
    } catch (error) {
        console.log("error:",error);
        return {success:false,error:"something went wrong!!"}
    }
    
}

module.exports={createBridges,getAllBridges,getBridges,updateBridges,getBridgesByName,deleteBridge,updateToolsCalls,getApiCallById,getBridgesWithSelectedData}