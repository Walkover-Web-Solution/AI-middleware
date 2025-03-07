import testcaseModel from "../mongoModel/testcaseModel.js";


async function getAllTestCases(bridge_id) {
    const testcases = await testcaseModel.find({ bridge_id }).lean();
    return testcases.map(tc => ({ ...tc, _id: tc._id.toString() }));
}

async function saveTestCase(testcaseData) {
    const newTestCase = new testcaseModel(testcaseData);
    const result = await newTestCase.save();
    return { id: result._id.toString(), ...testcaseData };
}

async function deleteTestCaseById(id) {
    const result = await testcaseModel.deleteOne({ _id: id });
    const success = result.deletedCount > 0;
    return {
        success,
        message: success ? "Deleted successfully" : "Deletion failed"
    };
}

async function updateTestCaseById(id, updateData) {
    const result = await testcaseModel.findOneAndUpdate(
        { _id: id },
        { $set: updateData },
        { returnDocument: 'after' }
    );
    return result ? { ...result.toObject(), _id: result._id.toString() } : null;
}

export default {
    getAllTestCases,
    saveTestCase,
    deleteTestCaseById,
    updateTestCaseById
}