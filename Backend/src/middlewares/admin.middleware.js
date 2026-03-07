module.exports = (req, res, next) => {
    // الـ req.user بيجي من الـ auth.middleware اللي انت عامله أصلاً
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Access denied. Admins only." });
    }
};