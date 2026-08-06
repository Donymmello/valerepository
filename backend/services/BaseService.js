class BaseService {
  static tenant(req) {
    return req.tenant.id;
  }

  static tenantWhere(req, where = {}) {
    return {
      empresaId: req.tenant.id,
      ...where,
    };
  }
}

module.exports = BaseService;