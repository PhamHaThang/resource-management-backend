function getPaginationAndFilter(query, allowedFilters = []) {
  const { page = 1, limit = 10, ...rest } = query;
  const pageNum = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
  const limitNum = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  Object.entries(rest).forEach(([key, value]) => {
    if (allowedFilters.includes(key)) {
      filter[key] = value;
    }
  });

  return {
    filter,
    page: pageNum,
    limit: limitNum,
    skip,
  };
}

module.exports = {
  getPaginationAndFilter,
};
