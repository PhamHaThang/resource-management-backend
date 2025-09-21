const ResourceType = require("../models/resourceType.model");
const { getPaginationAndFilter } = require("../utils/pagination");
// [POST] /api/resource-types
exports.createResourceType = async (req, res) => {
  try {
    const { name, description } = req.body;
    const existing = await ResourceType.findOne({ name });
    if (existing)
      return res.status(400).json({
        success: false,
        message: "Loại tài nguyên đã tồn tại",
        error: "DUPLICATE",
      });
    const resourceType = new ResourceType({ name, description });
    await resourceType.save();
    return res.status(201).json({
      success: true,
      message: "Tạo loại tài nguyên thành công",
      data: resourceType,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};
// [GET] /api/resource-types
exports.getAllResourceTypes = async (req, res) => {
  try {
    const allowedFilters = ["name"];
    const { filter, page, limit, skip } = getPaginationAndFilter(
      req.query,
      allowedFilters
    );
    if (filter.name) {
      filter.name = { $regex: filter.name, $options: "i" };
    }
    const total = await ResourceType.countDocuments(filter);
    const resourceTypes = await ResourceType.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    return res.json({
      success: true,
      message: "Lấy danh sách loại tài nguyên thành công",
      data: {
        total,
        page,
        limit,
        resourceTypes,
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
// [PUT] /api/resource-types/:id
exports.updateResourceType = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const resourceType = await ResourceType.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!resourceType)
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy loại tài nguyên",
        error: "NOT_FOUND",
      });
    return res.json({
      success: true,
      message: "Cập nhật loại tài nguyên thành công",
      data: resourceType,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};
// [DELETE] /api/resource-types/:id
exports.deleteResourceType = async (req, res) => {
  try {
    const { id } = req.params;
    const resourceType = await ResourceType.findByIdAndDelete(id);
    if (!resourceType)
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy loại tài nguyên",
        error: "NOT_FOUND",
      });
    return res.json({
      success: true,
      message: "Xóa loại tài nguyên thành công",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};
