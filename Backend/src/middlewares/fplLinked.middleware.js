module.exports = (req, res, next) => {
    const user = req.user;

    if (!user) {
        return res.status(401).json({ message: 'غير مصرح — يرجى تسجيل الدخول' });
    }

    // Admins can manage public challenges before linking an FPL account.
    if (user.role === 'admin') return next();

    if (user.accountStatus !== 'fpl_linked' || !user.fpl_id) {
        return res.status(403).json({
            message: 'يجب ربط حساب FPL الخاص بك أولاً لاستخدام التحديات',
            requiresFplLink: true,
            accountStatus: user.accountStatus
        });
    }

    next();
};
