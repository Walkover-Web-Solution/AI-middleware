const ModelsConfig = require("../../configs/modelConfiguration");
const { runModel } = require("./runModel");
const { services, messageRoles } = require("../../../config/models");
const completion = async (configuration, apikey) => {
    try {
        console.log(configuration, apikey)
        const {success,response,error} = await runModel(configuration,false, apikey);
        if(!success){
            return {success:false,error:error}
        }
        return {success:true,modelResponse:response}
    } catch (error) {
        console.log("common error=>", error);
        return {success:false,error:error.message}
    }
}


// const a=async ()=>{
//     const response=await common({model:"gpt-4",prompt:"you are joke generator in user language and topic",user:"generate a joke on human in hindi"},"");
//     console.log("response=>",JSON.stringify(response));
// }
// a()
module.exports = { completion }