import showcaseService from '../db_services/showCaseDbservice.js';
import { Storage } from '@google-cloud/storage';

const storage = new Storage({ credentials: JSON.parse(process.env.GCP_CREDENTIALS) });
const bucketName = 'resources.gtwy.ai';
const bucket = storage.bucket(bucketName);

export const addDataForShowCaseController = async (req, res, next) => {
    const { name, description, link } = req.body;
    const image = req.file;

    if (!name || !description || !link || !image) {
        throw new Error("All fields are required: name, description, link, image");
    }

    const filename = `showcase/${Date.now()}_${image.originalname}`;
    const blob = bucket.file(filename);
    const blobStream = blob.createWriteStream({ metadata: { contentType: image.mimetype } });

    await new Promise((resolve, reject) => {
        blobStream.on("finish", resolve);
        blobStream.on("error", reject);
        blobStream.end(image.buffer);
    });

    const imgUrl = `https://resources.gtwy.ai/${filename}`;
    const data = await showcaseService.create({ name, description, link, img_url: imgUrl });

    res.locals = {
        success: true,
        message: "Showcase data added successfully",
        data
    };
    req.statusCode = 201;
    return next();
};

export const getAllDataForShowCaseController = async (req, res, next) => {
    const data = await showcaseService.getAll();
    res.locals = {
        success: true,
        message: "Showcase data fetched successfully",
        data
    };
    req.statusCode = 200;
    return next();
};

export const updateDataForShowCaseController = async (req, res, next) => {
    const { id } = req.params;
    const { name, description, link } = req.body;
    const image = req.file;
    
    const updateData = { name, description, link };
    
    if (image) {
        const existingData = await showcaseService.getById(id);
        if (existingData?.img_url) {
            const oldImagePath = existingData.img_url.split(`https://resources.gtwy.ai/`)[1];
            if (oldImagePath) {
                await bucket.file(oldImagePath).delete().catch(() => {});
            }
        }

        const filename = `showcase/${Date.now()}_${image.originalname}`;
        const blob = bucket.file(filename);
        const blobStream = blob.createWriteStream({ metadata: { contentType: image.mimetype } });
        blobStream.end(image.buffer);
        updateData.img_url = `https://resources.gtwy.ai/${filename}`;
    }

    const data = await showcaseService.update(id, updateData);
    if (!data) throw new Error("Document not found or update failed.");

    res.locals = {
        success: true,
        message: "Showcase data updated successfully",
        data
    };
    req.statusCode = 200;
    return next();
};
