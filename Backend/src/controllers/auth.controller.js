const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/user.model');
const fplService = require('../services/fpl.service');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { sendPasswordResetEmail } = require('../services/mail.service');

// ── Helpers ───────────────────────────────────────────────────────────────────

const generateToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '60d' });


// ── REGISTER ──────────────────────────────────────────────────────────────────
// POST /auth/register
// Body: { email, password }
// → No email verification step. JWT returned immediately.
exports.register = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
        }

        const existing = await User.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            return res.status(400).json({ message: 'هذا البريد الإلكتروني مسجّل بالفعل' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = new User({
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            authProvider: 'local',
            accountStatus: 'registered'
        });

        await user.save();

        const token = generateToken(user._id);

        return res.status(201).json({
            message: 'تم إنشاء الحساب بنجاح ✅',
            token,
            user: {
                id: user._id,
                email: user.email,
                accountStatus: user.accountStatus,
                fpl_id: user.fpl_id,
                isVerified: user.isVerified,
                role: user.role
            }
        });

    } catch (error) {
        console.error('[register]', error);
        res.status(500).json({ message: 'خطأ أثناء إنشاء الحساب', error: error.message });
    }
};


// ── LOGIN ─────────────────────────────────────────────────────────────────────
// POST /auth/login
// Body: { email, password }
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user || user.authProvider !== 'local') {
            return res.status(400).json({ message: 'بيانات الدخول غير صحيحة' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'بيانات الدخول غير صحيحة' });
        }

        const token = generateToken(user._id);

        return res.status(200).json({
            message: 'تم تسجيل الدخول بنجاح ✅',
            token,
            user: {
                id: user._id,
                email: user.email,
                accountStatus: user.accountStatus,
                fpl_id: user.fpl_id,
                teamName: user.teamName,
                managerName: user.managerName,
                isVerified: user.isVerified,
                role: user.role
            }
        });

    } catch (error) {
        console.error('[login]', error);
        res.status(500).json({ message: 'خطأ أثناء تسجيل الدخول', error: error.message });
    }
};


// ── GOOGLE AUTH ───────────────────────────────────────────────────────────────
// POST /auth/google
// Body: { credential }
exports.googleAuth = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ message: 'رمز Google ID Token مطلوب' });
        }

        let payload;
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID || undefined
            });
            payload = ticket.getPayload();
        } catch (err) {
            const jwt = require('jsonwebtoken');
            payload = jwt.decode(credential);
            if (!payload || !payload.email) {
                return res.status(400).json({ message: 'رمز Google غير صالح' });
            }
        }

        const email = payload.email.toLowerCase().trim();
        const googleId = payload.sub;

        let user = await User.findOne({
            $or: [{ email }, { googleId }]
        });

        if (!user) {
            user = new User({
                email,
                googleId,
                authProvider: 'google',
                accountStatus: 'registered',
                isVerified: false
            });
            await user.save();
        } else {
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        }

        const token = generateToken(user._id);

        return res.status(200).json({
            message: 'تم تسجيل الدخول بواسطة Google بنجاح ✅',
            token,
            user: {
                id: user._id,
                email: user.email,
                accountStatus: user.accountStatus,
                fpl_id: user.fpl_id,
                teamName: user.teamName,
                managerName: user.managerName,
                totalPoints: user.totalPoints,
                overallRank: user.overallRank,
                isVerified: user.isVerified,
                role: user.role
            }
        });

    } catch (error) {
        console.error('[googleAuth]', error);
        res.status(500).json({ message: 'خطأ أثناء تسجيل الدخول بواسطة Google', error: error.message });
    }
};


// ── FORGOT PASSWORD ───────────────────────────────────────────────────────────
// POST /auth/forgot-password
// Body: { email }
// → Sends 6-digit code via Resend email
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'البريد الإلكتروني مطلوب' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        // Security: same response whether user exists or not
        if (!user || user.authProvider !== 'local') {
            return res.status(200).json({
                message: 'إذا كان البريد مسجّلاً، ستصلك رسالة تحتوي على كود التجميع لتعيين كلمة المرور'
            });
        }

        // Generate 6-digit numeric OTP code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.passwordResetToken = resetCode;
        user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await user.save();

        // Send email (non-blocking)
        sendPasswordResetEmail(user.email, resetCode).catch(err =>
            console.error('[forgotPassword] email error:', err)
        );

        return res.status(200).json({
            message: 'تم إرسال كود التحقق مكون من 6 أرقام إلى بريدك الإلكتروني 📩'
        });

    } catch (error) {
        console.error('[forgotPassword]', error);
        res.status(500).json({ message: 'خطأ أثناء معالجة الطلب', error: error.message });
    }
};


// ── VERIFY RESET CODE ────────────────────────────────────────────────────────
// POST /auth/verify-reset-code
// Body: { email, code }
exports.verifyResetCode = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ message: 'البريد الإلكتروني وكود التحقق مطلوبون' });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim(),
            passwordResetToken: code.trim(),
            passwordResetExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ message: 'كود التحقق غير صحيح أو منتهي الصلاحية' });
        }

        return res.status(200).json({
            success: true,
            message: 'كود التحقق صحيح ✅ أدخل كلمة المرور الجديدة'
        });

    } catch (error) {
        console.error('[verifyResetCode]', error);
        res.status(500).json({ message: 'خطأ أثناء التحقق من الكود', error: error.message });
    }
};


// ── RESET PASSWORD ────────────────────────────────────────────────────────────
// POST /auth/reset-password
// Body: { email, code, newPassword }
exports.resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json({ message: 'البريد الإلكتروني وكود التحقق وكلمة المرور الجديدة مطلوبون' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim(),
            passwordResetToken: code.trim(),
            passwordResetExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ message: 'كود التحقق غير صحيح أو منتهي الصلاحية' });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();

        return res.status(200).json({
            message: 'تم إعادة تعيين كلمة المرور بنجاح ✅ يمكنك تسجيل الدخول الآن'
        });

    } catch (error) {
        console.error('[resetPassword]', error);
        res.status(500).json({ message: 'خطأ أثناء إعادة تعيين كلمة المرور', error: error.message });
    }
};


// ── LINK FPL ID ───────────────────────────────────────────────────────────────
// POST /auth/link-fpl
// Body: { fpl_id: Number }
// Requires: Auth token
exports.linkFplId = async (req, res) => {
    try {
        const userId = req.user._id;
        const { fpl_id } = req.body;

        if (!fpl_id) {
            return res.status(400).json({ message: 'رقم الـ FPL ID مطلوب' });
        }

        const fplIdNum = Number(fpl_id);
        if (isNaN(fplIdNum) || fplIdNum <= 0) {
            return res.status(400).json({ message: 'رقم الـ FPL ID غير صالح' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

        // If user is already verified and tries to link a different FPL ID, block it
        if (user.fpl_id && user.fpl_id !== fplIdNum && user.isVerified) {
            return res.status(400).json({
                message: 'حسابك موثق بالفعل بـ FPL ID آخر. تواصل مع الدعم للتغيير.'
            });
        }

        // Check if this FPL ID is used by another account
        const fplIdTaken = await User.findOne({ fpl_id: fplIdNum, _id: { $ne: userId } });
        if (fplIdTaken) {
            return res.status(400).json({ message: 'هذا الـ FPL ID مرتبط بحساب آخر' });
        }

        // Validate with FPL API — verify team exists
        const fplData = await fplService.validateTeamId(fplIdNum);
        if (!fplData) {
            return res.status(400).json({ message: 'رقم مُعرف الفريق (FPL ID) غير صحيح أو غير موجود' });
        }

        user.fpl_id = fplIdNum;
        user.fpl_linked_at = new Date();
        user.accountStatus = 'fpl_linked';
        // DO NOT save teamName/managerName or stats until full league verification!
        user.isVerified = false;
        user.teamName = undefined;
        user.managerName = undefined;
        user.startedEvent = undefined;
        user.currentEvent = undefined;
        user.totalPoints = 0;
        user.overallRank = 0;
        user.lastGwPoints = 0;

        await user.save();

        return res.status(200).json({
            message: 'تم حفظ الـ FPL ID بنجاح ✅ يمكنك الآن التوثيق بالدوري',
            user: {
                id: user._id,
                email: user.email,
                accountStatus: user.accountStatus,
                fpl_id: user.fpl_id,
                isVerified: false
            }
        });

    } catch (error) {
        console.error('[linkFplId]', error);
        res.status(500).json({ message: 'خطأ أثناء ربط الـ FPL ID', error: error.message });
    }
};


// ── VERIFY LEAGUE ─────────────────────────────────────────────────────────────
// POST /auth/verify-league
// Requires: Auth token + fpl_linked
exports.verifyUserLeague = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

        if (user.accountStatus !== 'fpl_linked' || !user.fpl_id) {
            return res.status(403).json({
                message: 'يجب ربط حساب FPL الخاص بك أولاً',
                requiresFplLink: true
            });
        }

        if (user.isVerified) {
            return res.json({ message: 'أنت موثق بالفعل ✅', user });
        }

        const MY_LEAGUE_ID = 559676;
        const verification = await fplService.checkLeagueMembership(user.fpl_id, MY_LEAGUE_ID);

        if (verification.isMember) {
            user.isVerified = true;

            // Fetch and set team details ONLY AFTER verification is successful
            const fplData = await fplService.validateTeamId(user.fpl_id);
            if (fplData) {
                if (fplData.teamName)    user.teamName    = fplData.teamName;
                if (fplData.managerName) user.managerName = fplData.managerName;
                if (fplData.startedEvent  !== undefined) user.startedEvent  = fplData.startedEvent;
                if (fplData.currentEvent  !== undefined) user.currentEvent  = fplData.currentEvent;
                if (fplData.totalPoints   !== undefined) user.totalPoints   = fplData.totalPoints;
                if (fplData.overallRank   !== undefined) user.overallRank   = fplData.overallRank;
                if (fplData.lastGwPoints  !== undefined) user.lastGwPoints  = fplData.lastGwPoints;
            }

            await user.save();

            return res.json({
                success: true,
                message: 'تم التحقق بنجاح! أهلاً بك في ملعب FPL RUSH 🚀',
                user: {
                    id: user._id,
                    email: user.email,
                    accountStatus: user.accountStatus,
                    fpl_id: user.fpl_id,
                    teamName: user.teamName,
                    managerName: user.managerName,
                    totalPoints: user.totalPoints,
                    overallRank: user.overallRank,
                    lastGwPoints: user.lastGwPoints,
                    currentEvent: user.currentEvent,
                    startedEvent: user.startedEvent,
                    isVerified: true
                }
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'لم نجد فريقك في الدوري الخاص بنا. تأكد من الانضمام للكود الصحيح ثم اضغط تحقق.'
            });
        }

    } catch (error) {
        console.error('[verifyUserLeague]', error);
        res.status(500).json({ message: 'خطأ أثناء عملية التحقق', error: error.message });
    }
};


// ── GET CURRENT USER ──────────────────────────────────────────────────────────
// GET /auth/me
// Requires: Auth token
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }

        res.status(200).json({ success: true, user });

    } catch (error) {
        console.error('[getCurrentUser]', error);
        res.status(500).json({ message: 'خطأ في جلب بيانات المستخدم', error: error.message });
    }
};