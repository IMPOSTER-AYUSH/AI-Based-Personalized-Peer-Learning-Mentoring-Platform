const multer = require('multer');

// Store file in memory buffer so controller can attempt Cloudinary upload
// and reliably fallback to local storage if Cloudinary fails or credentials lack create permissions
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    // Accept images, audio, video, documents
    const allowedPrefixes = ['image/', 'audio/', 'video/'];
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (
      allowedPrefixes.some((prefix) => file.mimetype.startsWith(prefix)) ||
      allowedTypes.includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not supported`), false);
    }
  },
});

module.exports = upload;
