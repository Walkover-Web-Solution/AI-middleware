import apiCallModel from "../mongoModel/apiCall.js";


async function getAllScriptsByFunctionName(function_names) {
    return await apiCallModel.find({
        function_name: { $in: function_names }
    }).select({ org_id: 1, function_name: 1, _id: 1 });
}

export default {
    getAllScriptsByFunctionName
}
