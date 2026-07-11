function isAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Não autenticado. Faça login." });
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated() && req.user?.role === "admin") {
    return next();
  }
  res.status(403).json({ error: "Acesso restrito a administradores." });
}

module.exports = { isAuthenticated, isAdmin };
