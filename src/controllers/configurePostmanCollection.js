import { generateIdentifier } from '../services/utils/utilityService.js';

const importPostmanCollection = async (req, res, next) => {
    try {
        const fileBuffer = req.file.buffer;
        const fileContent = fileBuffer.toString('utf8');
        let collection;
        let updatedCollection = [];
        try {
            collection = JSON.parse(fileContent);
        }
        catch (err) {
            console.log(err)
            return res.status(400).send('Invalid JSON format');
        }
        collection.item.map((collect) => {
            updatedCollection.push({
                id: generateIdentifier(12),
                ...collect,
            })
        })

        res.locals.responseData = { statusCode: 200, data : updatedCollection, message: 'Successfully update user' };
        next();
    } catch (err) {
        console.log("getall threads=>", err)
        return { success: false, message: err.message, from: "conroller" }
    }
};

export {
    importPostmanCollection
};