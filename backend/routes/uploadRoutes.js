const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/uploadMiddleware');
const { uploadImage } = require('../controllers/uploadController');

router.post('/single', upload.single('file'), uploadImage);

module.exports = router; 