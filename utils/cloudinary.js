const cloudinary = require("../config/cloudinary");

const isVersionSegment = (segment) => /^v\d+$/i.test(segment);

const extractPublicIdFromUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  try {
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) return null;

    const pathAfterUpload = url.substring(uploadIndex + 8);
    const segments = pathAfterUpload.split("/").filter(Boolean);
    if (segments.length === 0) return null;

    if (segments.length > 1 && isVersionSegment(segments[0])) {
      segments.shift();
    }

    const joined = segments.join("/");
    const lastDotIndex = joined.lastIndexOf(".");
    const withoutExtension =
      lastDotIndex === -1 ? joined : joined.substring(0, lastDotIndex);
    return withoutExtension || null;
  } catch (error) {
    return null;
  }
};

const deleteCloudinaryImage = async (url) => {
  const publicId = extractPublicIdFromUrl(url);
  if (!publicId) {
    return false;
  }
  try {
    await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });
    return true;
  } catch (error) {
    console.error("Cloudinary deletion failed", { url, error });
    return false;
  }
};

const deleteCloudinaryImages = async (urls = []) => {
  if (!Array.isArray(urls) || urls.length === 0) return 0;
  const results = await Promise.all(
    urls.map((url) => deleteCloudinaryImage(url))
  );
  return results.filter(Boolean).length;
};

module.exports = {
  extractPublicIdFromUrl,
  deleteCloudinaryImage,
  deleteCloudinaryImages,
};
