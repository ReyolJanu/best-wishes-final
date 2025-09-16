const multer = require('multer');
const os = require('os');

const upload = multer({ 
  dest: os.tmpdir(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Export different upload configurations
module.exports = {
  uploadSingle: upload.single('image'),
  uploadMultiple: upload.array('images', 10),
  upload
}; 