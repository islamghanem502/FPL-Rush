/**
 * isVerified Middleware
 *
 * Ensures the authenticated user has:
 *  1. Linked their FPL ID (accountStatus === 'fpl_linked')
 *  2. Been verified as a member of the FPL Rush private league (isVerified === true)
 *
 * Use this middleware on routes that require full access (challenges, PvP, etc.)
 * Must be used AFTER authMiddleware.
 */
module.exports = (req, res, next) => {
    const user = req.user;

    if (!user) {
        return res.status(401).json({ message: 'غير مصرح — يرجى تسجيل الدخول' });
    }

    if (user.accountStatus !== 'fpl_linked') {
        return res.status(403).json({
            message: 'يجب ربط حساب FPL الخاص بك أولاً للوصول إلى هذه الميزة',
            requiresFplLink: true,
            accountStatus: user.accountStatus
        });
    }

    if (!user.isVerified) {
        return res.status(403).json({
            message: 'يجب التحقق من عضويتك في دوري FPL Rush أولاً',
            isVerified: false
        });
    }

    next();
};