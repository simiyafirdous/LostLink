const jwt = require("jsonwebtoken");
const User = require("../models/User");

const createToken = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET || "development-secret-change-me", { expiresIn: "7d" });
const userResponse = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive });

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email, and password are required." });
    if (await User.exists({ email: email.toLowerCase() })) return res.status(400).json({ message: "An account with this email already exists." });
    const user = await User.create({ name, email, password });
    res.status(201).json({ token: createToken(user), user: userResponse(user) });
  } catch (error) { next(error); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !user.isActive || !(await user.comparePassword(password))) return res.status(401).json({ message: "Invalid email or password." });
    res.json({ token: createToken(user), user: userResponse(user) });
  } catch (error) { next(error); }
};

const getMe = (req, res) => res.json({ user: userResponse(req.user) });
module.exports = { register, login, getMe };
