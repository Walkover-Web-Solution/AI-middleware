import showcaseService from '../db_services/showCaseDbservice.js';
import { Storage } from '@google-cloud/storage';

const storage = new Storage({ credentials: JSON.parse(process.env.GCP_CREDENTIALS) });
const bucketName = 'resources.gtwy.ai';
const bucket = storage.bucket(bucketName);

export const addDataForShowCaseController = async (req, res, next) => {
    const { name, description, link } = req.body;
    const image = req.file; // Multer handles this

    if (!name || !description || !link || !image) {
        return res.status(400).json({
            success: false,
            message: "All fields are required: name, description, link, image"
        });
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

    res.json({ success: true, data });
};

export const getAllDataForShowCaseController = async (req, res, next) => {
    const data = await showcaseService.getAll();
    res.json({ success: true, data });
    return next();
};

export const updateDataForShowCaseController = async (req, res, next) => {
    const { id } = req.params;
    const { name, description, link } = req.body;
    const image = req.file;

    const updateData = { name, description, link };

    if (image) {
        // Fetch existing record to get the old image URL
        const existingData = await showcaseService.getById(id);
        if (existingData && existingData.img_url) {
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
    if (!data) return res.status(404).json({ success: false, message: "Document not found or update failed." });

    res.json({ success: true, data });
};