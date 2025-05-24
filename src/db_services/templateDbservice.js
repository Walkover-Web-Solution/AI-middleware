import templateModel from '../mongoModel/template.js';
async function getAll(){
    return await templateModel.find({ visible: { $ne: false } });
 }
 export default{
    getAll
}
