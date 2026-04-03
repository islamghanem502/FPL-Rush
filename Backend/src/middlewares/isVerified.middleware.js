

module.exports = (req, res, next) => {

    if (req.user && req.user.isVerified) {
        next();
    } else {
        return res.status(403).json({
            message: "Access denied. Please verify your league membership first.",
            isVerified: false
        });
    }
};