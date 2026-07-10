function checkAdminSecret(req, res) {
  const provided = req.headers["x-admin-secret"];
  const expected = process.env.ADMIN_SECRET;
  if (!expected || provided !== expected) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

module.exports = { checkAdminSecret };
