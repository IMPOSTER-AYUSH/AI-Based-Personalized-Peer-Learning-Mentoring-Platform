const router = require('express').Router();
const upload = require('../middleware/upload');
const { uploadFile } = require('../controllers/uploadController');
const { auth } = require('../middleware/auth');

router.post('/', auth, upload.single('file'), uploadFile);

module.exports = router;
