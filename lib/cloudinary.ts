import { v2 as cloudinary } from 'cloudinary';

// Configure once — Cloudinary reads these env vars automatically,
// but we set them explicitly to be safe.
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

/**
 * Uploads a file buffer to Cloudinary.
 *
 * @param buffer   - Raw file bytes
 * @param fileName - Original file name (used to derive format)
 * @param folder   - Cloudinary folder path, e.g. "scholar/documents/userId"
 * @returns The secure HTTPS URL of the uploaded file
 */
export async function uploadToCloudinary(
    buffer: Buffer,
    fileName: string,
    folder: string
): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'auto',          // handles PDF, images, etc.
                use_filename: true,
                unique_filename: true,
                overwrite: false,
            },
            (error, result) => {
                if (error || !result) {
                    reject(error ?? new Error('Cloudinary upload returned no result'));
                } else {
                    resolve({ url: result.secure_url, publicId: result.public_id });
                }
            }
        );

        uploadStream.end(buffer);
    });
}

export { cloudinary };
