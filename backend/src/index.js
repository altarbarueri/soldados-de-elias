require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const { findByEmail, findById } = require("./models/user");

const authRoutes = require("./routes/auth");
const messagesRoutes = require("./routes/messages");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "soldados-elias-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = findByEmail(email);
        if (!user) return done(null, false, { message: "Email não encontrado" });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return done(null, false, { message: "Senha inválida" });
        return done(null, { id: user.id, name: user.name, email: user.email, role: user.role });
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const user = findById(id);
  done(null, user || null);
});

app.use("/auth", authRoutes);
app.use("/api/mensagens", messagesRoutes);

const path = require("path");
const frontendDist = path.join(__dirname, "../../frontend/dist");
if (require("fs").existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/auth") || req.path.startsWith("/api")) return next();
    res.sendFile(path.join(frontendDist, "index.html"));
  });
  console.log(`[STATIC] Servindo frontend de: ${frontendDist}`);
} else {
  console.log("[STATIC] Frontend build não encontrado. Rode 'npm run build' no frontend.");
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
