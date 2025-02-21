import { Storage } from '@google-cloud/storage';
import { generateIdentifier } from './utils/utilityService.js';

class BucketService {
    constructor() {
        // Initialize Google Cloud Storage
        this.storage = new Storage({
            credentials: JSON.parse(process.env.GCP_CREDENTIALS),
        });
        this.bucketName = 'resources.gtwy.ai';
        this.bucket = this.storage.bucket(this.bucketName);
        this.handleFileUpload = this.handleFileUpload.bind(this);
    }

    async uploadFileToGCS(file, filename) {
        return new Promise((resolve, reject) => {
            if (!file) return reject(new Error('No file provided'));

            const blob = this.bucket.file(filename);
            const blobStream = blob.createWriteStream({
                metadata: { contentType: file.mimetype },
            });

            blobStream.on('error', (err) => reject(err));
            blobStream.on('finish', () => resolve(true));

            blobStream.end(file.buffer);
        });
    }

    // Middleware function
    async handleFileUpload(req, res, next) {
            if (!req.file) {
                return next()
            }

            // Check file size (10 MB = 10 * 1024 * 1024 bytes)
            const maxSize = 10 * 1024 * 1024; // 10 MB
            if (req.file.size > maxSize) {
                throw new Error('File size exceeds 10 MB limit')
            }

            // Generate the unique filename
            const filename = `rag/resources/${generateIdentifier(5)}_${req.file.originalname.replace(/ /g, '')}`;
            const imageUrl = `https://resources.gtwy.ai/${filename}`;

            // Upload the file asynchronously
            await this.uploadFileToGCS(req.file, filename);

            req.body.url = imageUrl;
            return next()
    }
}

// Export an instance of the BucketService
const bucketService = new BucketService();
export default bucketService;