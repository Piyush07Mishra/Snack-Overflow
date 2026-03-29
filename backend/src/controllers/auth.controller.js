import User from "../models/user.model.js";
import Company from "../models/company.model.js";
import bcrypt from "bcrypt";
import axios from "axios";
import jwt from "jsonwebtoken";

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const FULL_NAME_REGEX = /^[A-Za-z][A-Za-z .'-]*$/;

const clean = (value) => (typeof value === "string" ? value.trim() : "");

const signToken = (user) =>
  jwt.sign(
    { userId: user.id, role: user.role, companyId: user.company_id || user.companyId },
    process.env.JWT_SECRET || process.env.SESSION_SECRET,
    { expiresIn: "7d" },
  );

// Fetch currency for a country from restcountries API
const getCurrencyForCountry = async (countryName) => {
  try {
    const res = await axios.get(
      "https://restcountries.com/v3.1/all?fields=name,currencies",
    );
    const match = res.data.find(
      (c) =>
        c.name?.common?.toLowerCase() === countryName.toLowerCase() ||
        c.name?.official?.toLowerCase() === countryName.toLowerCase(),
    );
    if (match?.currencies) {
      return Object.keys(match.currencies)[0];
    }
  } catch (_) {}
  return "USD";
};

export const signUp = async (req, res) => {
  const fullName = clean(req.body.fullName);
  const email = clean(req.body.email).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const confirmPassword =
    typeof req.body.confirmPassword === "string" ? req.body.confirmPassword : "";
  const country = clean(req.body.country);
  const companyName = clean(req.body.companyName);

  if (!fullName || !email || !password || !confirmPassword || !country) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: "Enter a valid email address" });
  }
  if (fullName.length < 2) {
    return res.status(400).json({ message: "Name must be at least 2 characters" });
  }
  if (!FULL_NAME_REGEX.test(fullName)) {
    return res
      .status(400)
      .json({ message: "Name can contain only letters and spaces" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  try {
    const existing = await User.findByEmail(email);
    if (existing)
      return res.status(400).json({ message: "Email already registered" });

    const baseCurrency = await getCurrencyForCountry(country);
    const company = await Company.create({
      name: companyName || `${fullName}'s Company`,
      country,
      baseCurrency,
    });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      companyId: company.id,
      role: "admin",
      mustChangePassword: false,
    });
    const token = signToken({
      id: newUser.id,
      role: newUser.role,
      companyId: company.id,
    });

    res.status(201).json({
      message: "Account created successfully",
      token,
      user: {
        id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        companyId: company.id,
        companyName: company.name,
        baseCurrency: company.base_currency,
      },
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({ message: "Registration error" });
  }
};

export const logIn = async (req, res) => {
  const email = clean(req.body.email).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: "Enter a valid email address" });
  }
  try {
    const user = await User.findByEmail(email);
    if (!user)
      return res
        .status(400)
        .json({ message: "Email or password is incorrect" });

    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched)
      return res
        .status(400)
        .json({ message: "Email or password is incorrect" });
    const fullUser = await User.findById(user.id);
    const token = signToken({
      id: fullUser.id,
      role: fullUser.role,
      company_id: fullUser.company_id,
    });

    res.status(200).json({
      message: "Logged in successfully",
      token,
      user: {
        id: fullUser.id,
        fullName: fullUser.full_name,
        email: fullUser.email,
        role: fullUser.role,
        companyId: fullUser.company_id,
        companyName: fullUser.company_name,
        baseCurrency: fullUser.company_currency,
        managerId: fullUser.manager_id,
        isManagerApprover: fullUser.is_manager_approver,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Login error" });
  }
};

export const logOut = (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
};

export const getMe = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Not authenticated" });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        companyId: user.company_id,
        companyName: user.company_name,
        baseCurrency: user.company_currency,
        managerId: user.manager_id,
        isManagerApprover: user.is_manager_approver,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
