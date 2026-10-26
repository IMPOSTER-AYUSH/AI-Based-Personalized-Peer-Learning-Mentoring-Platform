const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');

// Helper to attempt Cloudinary upload
const uploadToCloudinary = (buffer, mimetype, originalname) => {
  return new Promise((resolve, reject) => {
    let folder = 'skillswap/uploads';
    let resourceType = 'auto';

    if (mimetype.startsWith('image/')) folder = 'skillswap/images';
    else if (mimetype.startsWith('audio/')) folder = 'skillswap/audio';
    else if (mimetype.startsWith('video/')) folder = 'skillswap/video';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // 1. Try uploading to Cloudinary if credentials are configured
    const hasCloudinary =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (hasCloudinary) {
      try {
        const result = await uploadToCloudinary(
          req.file.buffer,
          req.file.mimetype,
          req.file.originalname
        );
        if (result && result.secure_url) {
          return res.json({
            url: result.secure_url,
            filename: req.file.originalname,
            publicId: result.public_id,
          });
        }
      } catch (cloudErr) {
        console.warn(
          `⚠️ Cloudinary upload unavailable (${cloudErr.message || 'forbidden/error'}). Using local storage fallback.`
        );
      }
    }

    // 2. Primary / Fallback: Save file to local uploads directory
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Determine extension
    let ext = path.extname(req.file.originalname);
    if (!ext) {
      if (req.file.mimetype === 'image/jpeg') ext = '.jpg';
      else if (req.file.mimetype === 'image/png') ext = '.png';
      else if (req.file.mimetype === 'image/webp') ext = '.webp';
      else if (req.file.mimetype === 'image/gif') ext = '.gif';
      else ext = '.bin';
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeFilename = `${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadDir, safeFilename);

    await fs.promises.writeFile(filePath, req.file.buffer);

    const protocol = req.protocol;
    const host = req.get('host');
    const localUrl = `${protocol}://${host}/uploads/${safeFilename}`;

    return res.json({
      url: localUrl,
      filename: req.file.originalname,
      publicId: safeFilename,
    });
  } catch (error) {
    next(error);
  }
};
