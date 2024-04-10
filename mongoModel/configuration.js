const mongoose=require("mongoose");
const configuration=new mongoose.Schema({
    org_id:{type:String,default:""},
    bridge_id:{type:String,default:""},
    service:{type:String,default:""},
    name:{type:String,default:""},
    configuration:{type:Object,default:{}},
    apikey:{type:String,default:""},
    created_at:{type:Date,default:Date.now}
})

const configurationModel= mongoose.model("configuration",configuration);
module.exports={configurationModel};