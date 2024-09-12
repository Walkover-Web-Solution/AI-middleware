import axios from "axios"

export const callDBdash = async ()=>{
    try {
        const response = await axios({method:"get",url:"https://table-api.viasocket.com/668fc4fc2f52b3623991065b/tblsdwfla", headers: {'auth-key' : process.env.DBDASH_AUTH_KEY}})
        const config = {};
        const rows =  response.data.data.rows;
        for(let row of rows){
            config[row['bridge_id']] = row['args'];
        }
        return config;
    } catch (error) {
        console.log("error dbdas",error)
        return {}
    }
}