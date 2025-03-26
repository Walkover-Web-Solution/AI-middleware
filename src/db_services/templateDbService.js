import showCaseTemplateModel from "../mongoModel/showCaseTemplateModel.js";

// Function to get all 
async function getAll() {
    const data = await showCaseTemplateModel.find().lean();
    return data.map(d => ({ ...d, _id: d._id.toString() }));
}

// Function to create 
async function create(data) {
   
    const existingTemplate = await showCaseTemplateModel.findOne({ title: data.title });

    if (existingTemplate) {
        throw new Error('A ShowCaseTemplate with this title already exists');
    }


    const result = await showCaseTemplateModel.create(data);
    return { id: result._id.toString(), ...data };
}

// Function to update 
async function update(id, data) {
   
    if (data.title) {
        const existingTemplate = await showCaseTemplateModel.findOne({ title: data.title, _id: { $ne: id } });

        if (existingTemplate) {
            throw new Error('A ShowCaseTemplate with this title already exists');
        }
    }

   
    const result = await showCaseTemplateModel.findOneAndUpdate(
        { _id: id },
        { $set: data },
        { returnDocument: 'after' } // Return the updated document
    );
    return result ? { ...result.toObject(), _id: result._id.toString() } : null;
}

export default {
    getAll,
    create,
    update
};
