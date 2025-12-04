import showCaseModel from "../mongoModel/ShowCase.model.js";

async function getAll() {
    const data = await showCaseModel.find().lean();
    return data.map(d => ({ ...d, _id: d._id.toString() }));
}


async function create(data) {
    const result = await showCaseModel.insertOne(data);
    return { id: result.insertedId, ...data };
}

async function update(id, data) {
    const result = await showCaseModel.findOneAndUpdate(
        { _id: id },
        { $set: data },
        { returnDocument: 'after' }
    );
    return result ? { ...result, _id: result._id.toString() } : null;
}

export default {
    getAll,
    create,
    update
};
