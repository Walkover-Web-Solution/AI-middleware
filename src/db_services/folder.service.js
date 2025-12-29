import Folder from "../mongoModel/GtwyEmbed.model.js";


async function getFolderData(folder_id) {
    try {
        const folder = await Folder.findById(folder_id).lean();
        return folder;
    } catch (error) {
        console.error("Error fetching folder data:", error);
        return null;
    }
}

export default {
    getFolderData
};
