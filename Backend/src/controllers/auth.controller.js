const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fplService = require('../services/fpl.service');

// ── Helpers ───────────────────────────────────────────────────────────────────

const generateToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '60d' });

const PIN_REGEX = /^\d{4}$/;

// ── STEP 1: Check FPL ID → tells frontend which screen to show ───────────────
// POST /auth/check-id
// Body: { fpl_id: Number }
// Response: { exists: Boolean, is_migrated: Boolean, fpl_id: Number }
exports.checkId = async (req, res) => {
    try {
        const { fpl_id } = req.body;

        if (!fpl_id) {
            return res.status(400).json({ message: 'fpl_id مطلوب' });
        }

        const fplIdNum = Number(fpl_id);
        if (isNaN(fplIdNum) || fplIdNum <= 0) {
            return res.status(400).json({ message: 'fpl_id غير صالح' });
        }

        const user = await User.findOne({ 
            $or: [{ fpl_id: fplIdNum }, { teamId: fplIdNum }] 
        });

        if (!user || !user.is_migrated) {
            // New user OR legacy user who hasn't set a PIN yet → show "Setup PIN"
            return res.status(200).json({
                exists: !!user,
                is_migrated: false,
                fpl_id: fplIdNum,
                message: 'show_setup'
            });
        }

        // Existing migrated user → show "Enter PIN"
        return res.status(200).json({
            exists: true,
            is_migrated: true,
            fpl_id: fplIdNum,
            message: 'show_login'
        });

    } catch (error) {
        res.status(500).json({ message: 'خطأ في التحقق من الـ ID', error: error.message });
    }
};


// ── STEP 2A: Setup PIN (new user / migration) ─────────────────────────────────
// POST /auth/setup-pin
// Body: { fpl_id: Number, pin_code: String (4 digits) }
exports.setupPin = async (req, res) => {
    try {
        const { fpl_id, pin_code } = req.body;

        if (!fpl_id || !pin_code) {
            return res.status(400).json({ message: 'fpl_id و pin_code مطلوبان' });
        }

        if (!PIN_REGEX.test(pin_code)) {
            return res.status(400).json({ message: 'الـ PIN يجب أن يكون 4 أرقام' });
        }

        const fplIdNum = Number(fpl_id);

        // Validate with FPL API (preserved as-is per your note)
        const fplData = await fplService.validateTeamId(fplIdNum);
        if (!fplData) {
            return res.status(400).json({ message: 'رقم مُعرف الفريق (FPL ID) غير صحيح' });
        }

        let user = await User.findOne({ 
            $or: [{ fpl_id: fplIdNum }, { teamId: fplIdNum }] 
        });

        if (user) {
            // Legacy user migration: update PIN, mark as migrated, and ensure fpl_id is populated
            user.fpl_id = fplIdNum;
            user.pin_code = pin_code;
            user.is_migrated = true;
            // Refresh FPL data while we're here
            if (fplData.teamName) user.teamName = fplData.teamName;
            if (fplData.managerName) user.managerName = fplData.managerName;
            await user.save();
        } else {
            // Brand new user
            user = new User({
                fpl_id: fplIdNum,
                pin_code: pin_code,
                is_migrated: true,
                isVerified: false,
                ...fplData,
            });
            await user.save();
        }

        const token = generateToken(user._id);

        return res.status(201).json({
            message: 'تم إعداد الـ PIN بنجاح ✅',
            token,
            fpl_id: user.fpl_id,
            user: {
                id: user._id,
                fpl_id: user.fpl_id,
                teamName: user.teamName,
                managerName: user.managerName,
                isVerified: user.isVerified,
                role: user.role,
                email: user.email,
                phone: user.phone
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'خطأ أثناء إعداد الـ PIN', error: error.message });
    }
};


// ── STEP 2B: Login with PIN ───────────────────────────────────────────────────
// POST /auth/login
// Body: { fpl_id: Number, pin_code: String }
exports.login = async (req, res) => {
    try {
        const { fpl_id, pin_code } = req.body;

        if (!fpl_id || !pin_code) {
            return res.status(400).json({ message: 'fpl_id و pin_code مطلوبان' });
        }

        const fplIdNum = Number(fpl_id);
        const user = await User.findOne({ 
            $or: [{ fpl_id: fplIdNum }, { teamId: fplIdNum }] 
        });

        if (!user || !user.is_migrated) {
            return res.status(400).json({ message: 'بيانات الدخول غير صحيحة' });
        }

        const isMatch = pin_code === user.pin_code;
        if (!isMatch) {
            return res.status(400).json({ message: 'الـ PIN غير صحيح' });
        }

        const token = generateToken(user._id);

        return res.status(200).json({
            message: 'تم تسجيل الدخول بنجاح ✅',
            token,
            fpl_id: user.fpl_id,
            user: {
                id: user._id,
                fpl_id: user.fpl_id,
                teamName: user.teamName,
                managerName: user.managerName,
                isVerified: user.isVerified,
                role: user.role,
                email: user.email,
                phone: user.phone
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'خطأ أثناء تسجيل الدخول', error: error.message });
    }
};


// ── STEP 3 (Optional): Save contact info after login ─────────────────────────
// POST /auth/save-contact
// Body: { email?: String, phone?: String }
// Requires: Auth token
exports.saveContact = async (req, res) => {
    try {
        const { email, phone } = req.body;

        if (!email && !phone) {
            return res.status(400).json({ message: 'يجب إدخال بريد إلكتروني أو رقم هاتف' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

        if (email) {
            const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
            if (emailExists) {
                return res.status(400).json({ message: 'هذا البريد الإلكتروني مستخدم بالفعل' });
            }
            user.email = email.toLowerCase().trim();
        }

        if (phone) {
            user.phone = phone.trim();
        }

        await user.save();

        return res.status(200).json({
            message: 'تم حفظ بيانات التواصل ✅',
            user: {
                id: user._id,
                fpl_id: user.fpl_id,
                email: user.email,
                phone: user.phone,
                isVerified: user.isVerified
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'خطأ أثناء حفظ البيانات', error: error.message });
    }
};


// ── League Verification (unchanged logic) ─────────────────────────────────────
// POST /auth/verify-league
// Requires: Auth token
exports.verifyUserLeague = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
        if (user.isVerified) return res.json({ message: 'أنت موثق بالفعل ✅' });

        const MY_LEAGUE_ID = 2926375;

        // Make sure to pass the correct ID to the FPL service (either fpl_id or fallback to teamId)
        const teamIdToCheck = user.fpl_id || user.teamId;
        const verification = await fplService.checkLeagueMembership(teamIdToCheck, MY_LEAGUE_ID);

        if (verification.isMember) {
            user.isVerified = true;
            user.teamName = verification.playerInfo.teamName;
            user.managerName = verification.playerInfo.managerName;
            await user.save();

            return res.json({
                success: true,
                message: 'تم التحقق بنجاح! أهلاً بك في ملعب FPL RUSH 🚀',
                user: {
                    id: user._id,
                    isVerified: user.isVerified,
                    teamName: user.teamName
                }
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'لم نجد فريقك في الدوري الخاص بنا. تأكد من الانضمام للكود الصحيح ثم اضغط تحقق.'
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'خطأ أثناء عملية التحقق', error: error.message });
    }
};


// ── Get Current Authenticated User ───────────────────────────────────────────
// GET /auth/me
// Requires: Auth token
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-pin_code');

        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في جلب بيانات المستخدم', error: error.message });
    }
};