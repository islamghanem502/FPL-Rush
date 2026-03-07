const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

module.exports = async (req, res, next) => {
    try {
        let token;

        // 1️⃣ لو جاى من Authorization Header
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        // لو مفيش توكن
        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        // 2️⃣ Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3️⃣ Get user
        const user = await User.findById(decoded.id).select("-password");
        if (!user)
            return res.status(401).json({ message: "User no longer exists" });

        req.user = user;
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Not authorized",
            error: error.message
        });
    }
};
