const {createEmbeddings}=require("./runModel");
const embeddings=async (configuration, apikey)=>{
    try {
        console.log(configuration, apikey)
        const {success,response,error}=await createEmbeddings(configuration,apikey);
        if(!success){
            return {success:false,error:error}
        }
        return {success:true,modelResponse:response}
    } catch (error) {
        console.log("common error=>", error);
        return
    }
}

module.exports={embeddings}