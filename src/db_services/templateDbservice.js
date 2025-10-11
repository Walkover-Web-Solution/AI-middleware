import templateModel from '../mongoModel/template.js';
async function getAll(){
    return await templateModel.find({ visible: { $ne: false } });
 }
 async function saveTemplate(template){
    return await templateModel.create(template);
 }
 export default{
    getAll,
    saveTemplate
}
