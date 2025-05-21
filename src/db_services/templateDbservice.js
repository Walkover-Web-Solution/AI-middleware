import templateModel from '../mongoModel/template.js';
async function getAll(){
    return await templateModel.find();


 }
 export default{
    getAll
}
