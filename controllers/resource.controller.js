const Resource = require("../models/resource.model");
const QRCode = require("qrcode");
// [POST] /api/resources
exports.createResource = async (req, res) => {
  const {
    name,
    type,
    description,
    images,
    usageRules,
    capacity,
    location,
    status,
  } = req.body;
  try {
    const newResource = new Resource({
      name,
      type,
      description,
      images,
      usageRules,
      location,
      capacity,
      status: status || "available",
    });
    await newResource.save();
    const qrCodeDataURL = await QRCode.toDataURL(`resource:${newResource._id}`);
    newResource.qrcode = qrCodeDataURL;
    await newResource.save();
    return res.status(201).json({
      success: true,
      message: "Tạo tài nguyên thành công",
      data: newResource,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi tạo tài nguyên",
      error: error.message,
    });
  }
};
// [GET] /api/resources
exports.getAllResources = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", type, status } = req.query;
    const query = { deleted: false };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (type) {
      query.type = type;
    }
    if (status) {
      query.status = status;
    }
    const total = await Resource.countDocuments(query);

    const resources = await Resource.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách tạo tài nguyên thành công",
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        resources,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi lấy danh sách tạo tài nguyên",
      error: error.message,
    });
  }
};
// [GET] /api/resources/:id
exports.getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findOne({
      _id: req.params.id,
      deleted: false,
    });
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài nguyên",
        error: "NOT_FOUND",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Lấy chi tiêt tài nguyên thành công",
      data: resource,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi truy vấn",
      error: error.message,
    });
  }
};
// [PUT] /api/resources/:id
exports.updateResource = async (req, res) => {
  try {
    const updateData = req.body;
    const updatedResource = await Resource.findOneAndUpdate(
      { _id: req.params.id, deleted: false },
      updateData,
      { new: true }
    );
    if (!updatedResource) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài nguyên",
        error: "NOT_FOUND",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Cập nhật tài nguyên thành công",
      data: updatedResource,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi cập nhật tài nguyên",
      error: error.message,
    });
  }
};
// [DELETE] /api/resources/:id
exports.deleteResource = async (req, res) => {
  try {
    const deletedResource = await Resource.findOneAndUpdate(
      { _id: req.params.id, deleted: false },
      { deleted: true },
      { new: true }
    );
    if (!deletedResource) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài nguyên",
        error: "NOT_FOUND",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Xóa tài nguyên thành công",
      data: deletedResource,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi xóa tài nguyên",
      error: error.message,
    });
  }
};
