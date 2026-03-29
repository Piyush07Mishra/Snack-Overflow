import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { pool, initDB } from "./src/lib/db.js";
import authRouter from "./src/routes/auth.route.js";
import userRouter from "./src/routes/user.route.js";
import expenseRouter from "./src/routes/expense.route.js";
import approvalRuleRouter from "./src/routes/approvalRule.route.js";
import managerRouter from "./src/routes/manager.route.js";

dotenv.config();
initDB();

const app = express();
const PgSession = connectPgSimple(session);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  session({
    store: new PgSession({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 3, httpOnly: true },
  }),
);

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/expenses", expenseRouter);
app.use("/api/rules", approvalRuleRouter);
app.use("/api/manager", managerRouter);

const port = process.env.PORT || 5001;
app.listen(port, () => console.log(`Server running on port ${port}`));
