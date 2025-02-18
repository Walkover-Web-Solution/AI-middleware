// const AlertingModel = require('../mongoModel/alertingModel');
import ragParentDataModel from '../mongoModel/rag_parent_data.js';


async function getAll(query){
    return await ragParentDataModel.find(query);
 }

export default{
    getAll
}
