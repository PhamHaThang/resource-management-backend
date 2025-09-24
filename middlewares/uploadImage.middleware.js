const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const AppError = require("../utils/AppError");
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "Resource_Management_Image",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          400,
          "Chỉ cho phép tải lên các tệp hình ảnh",
          "INVALID_FILE_TYPE"
        )
      );
    }
  },
});
const singleUpload = (fieldName) => (req, res, next) => {
  const uploadSingle = upload.single(fieldName);
  uploadSingle(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
        error: "INVALID_FILE_UPLOAD",
      });
    }
    next();
  });
};

const multipleUpload = (fieldName, maxCount) => (req, res, next) => {
  const uploadMany = upload.array(fieldName, maxCount);
  uploadMany(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
        error: "INVALID_FILE_UPLOAD",
      });
    }
    next();
  });
};
module.exports = {
  singleUpload,
  multipleUpload,
};
