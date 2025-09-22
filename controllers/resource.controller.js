const Resource = require("../models/resource.model");
const ResourceType = require("../models/resourceType.model");
const QRCode = require("qrcode");
const { getPaginationAndFilter } = require("../utils/pagination");
// [POST] /api/resources
exports.createResource = async (req, res) => {
  try {
    const { name, type, description, usageRules, capacity, location, status } =
      req.body;
    const typeExists = await ResourceType.findById(type);
    if (!typeExists) {
      return res.status(404).json({
        success: false,
        message: "Loại tài nguyên không tồn tại",
        error: "NOT_FOUND",
      });
    }
    const images = req.files ? req.files.map((file) => file.path) : [];
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
    const allowedFilters = ["name", "type", "status"];

    const { filter, page, limit, skip } = getPaginationAndFilter(
      req.query,
      allowedFilters
    );
    if (filter.name) {
      filter.name = { $regex: filter.name, $options: "i" };
    }

    filter.deleted = false;
    const total = await Resource.countDocuments(filter);

    const resources = await Resource.find(filter)
      .populate("type", "name -_id")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    return res.json({
      success: true,
      message: "Lấy danh sách tài nguyên thành công",
      data: {
        total,
        page,
        limit,
        resources,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
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
    }).populate("type", "name -_id");
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài nguyên",
        error: "NOT_FOUND",
      });
    }
    return res.json({
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
    if (updateData.type) {
      const typeExists = await ResourceType.findById(updateData.type);
      if (!typeExists) {
        return res.status(404).json({
          success: false,
          message: "Loại tài nguyên không tồn tại",
          error: "NOT_FOUND",
        });
      }
    }
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map((file) => file.path);
    }
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
    return res.json({
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
    return res.json({
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
