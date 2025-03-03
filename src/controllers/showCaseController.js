import showcaseService from '../db_services/showCaseDbservice.js';
import { Storage } from '@google-cloud/storage';

const storage = new Storage({ credentials: JSON.parse(process.env.GCP_CREDENTIALS) });
const bucketName = 'ai_middleware_testing';
const bucket = storage.bucket(bucketName);

export const addDataForShowCaseController = async (req, res, next) => {
    try {
        const { name, description, link } = req.body;
        const image = req.file; // Multer handles this
        
        // Ensure all required fields are present
        if (!name || !description || !link || !image) {
            return res.status(400).json({
                success: false,
                message: "All fields are required: name, description, link, image"
            });
        }

        // Generate file name & upload to GCS
        const filename = `showcase/${Date.now()}_${image.originalname}`;
        const blob = bucket.file(filename);
        const blobStream = blob.createWriteStream({ metadata: { contentType: image.mimetype } });

        // Handle stream completion
        await new Promise((resolve, reject) => {
            blobStream.on("finish", resolve);
            blobStream.on("error", reject);
            blobStream.end(image.buffer);
        });

        // Generate image URL
        const imgUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

        // Store details in the database
        const data = await showcaseService.create({ name, description, link, img_url: imgUrl });

        res.json({ success: true, data });
    } catch (error) {
        console.error("Error in addDataForShowCaseController:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getAllDataForShowCaseController = async (req, res, next) => {
    try {
        const data = await showcaseService.getAll();
        res.json({ success: true, data });
        return next();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateDataForShowCaseController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, link } = req.body;
        const image = req.file;

        const updateData = { name, description, link };

        if (image) {
            const filename = `showcase/${Date.now()}_${image.originalname}`;
            const blob = bucket.file(filename);
            const blobStream = blob.createWriteStream({ metadata: { contentType: image.mimetype } });
            blobStream.end(image.buffer);
            updateData.img_url = `https://storage.googleapis.com/${bucketName}/${filename}`;
        }

        const data = await showcaseService.update(id, updateData);
        if (!data) return res.status(404).json({ success: false, message: "Document not found or update failed." });

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
