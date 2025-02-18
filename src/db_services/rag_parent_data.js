// const AlertingModel = require('../mongoModel/alertingModel');
import ragParentDataModel from '../mongoModel/rag_parent_data.js';


async function getAll(query){
 try {
    console.log("Query:", query);
    const result = await ragParentDataModel.find(query);
    console.log("Result:", result);
    return result;
 } catch (error) {
    return error
 }
 }

export default{
    getAll
}
