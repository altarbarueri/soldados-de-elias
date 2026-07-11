const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const { createUser, findByEmail, findById } = require("../models/user");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nome, email e senha são obrigatórios" });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: "Senha deve ter no mínimo 4 caracteres" });
    }

    const existing = findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Email já cadastrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = createUser(name, email, hashedPassword);

    res.status(201).json({ usuario: user });
  } catch (err) {
    res.status(500).json({ error: `Erro ao cadastrar: ${err.message}` });
  }
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || "Email ou senha inválidos" });

    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.json({
        autenticado: true,
        usuario: {
          id: user.id,
          nome: user.name,
          email: user.email,
          role: user.role,
        },
      });
    });
  })(req, res, next);
});

router.get("/user", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.json({ autenticado: false });
  }
  res.json({
    autenticado: true,
    usuario: {
      id: req.user.id,
      nome: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

router.get("/logout", (req, res) => {
  req.logout(() => {
    res.json({ sucesso: true });
  });
});

module.exports = router;
