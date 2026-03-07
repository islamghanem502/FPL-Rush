const User = require('../models/user.model');
const crypto = require('crypto');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Resend } = require("resend");
const fplService = require('../services/fpl.service');


const resend = new Resend(process.env.RESEND_API_KEY);

// ===== Send Email =====
const sendMail = async (to, subject, text) => {
    try {
        await resend.emails.send({
            from: process.env.EMAIL_FROM || "Fantasy App <onboarding@resend.dev>",
            to,
            subject,
            text
        });
        return true;
    } catch (error) {
        console.error("Email sending error:", error);
        return false;
    }
};

// ===== Helpers =====
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const hashOTP = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

// ================= REGISTER =================
exports.register = async (req, res) => {
    try {
        const { teamId, email, password } = req.body;

        if (!teamId || !email || !password) {
            return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
        }


        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ message: 'هذا البريد الإلكتروني مسجل بالفعل' });
        }


        const fplData = await fplService.validateTeamId(teamId);
        if (!fplData) {
            return res.status(400).json({ message: 'رقم مُعرف الفريق (Team ID) غير صحيح' });
        }


        const teamExists = await User.findOne({ teamId: fplData.teamId });
        if (teamExists) {
            return res.status(400).json({ message: 'هذا الفريق مسجل بالفعل لمستخدم آخر' });
        }


        const hashedPassword = await bcrypt.hash(password, 10);


        const user = new User({
            email,
            password: hashedPassword,
            ...fplData,
            isVerified: false 
        });

        await user.save();


        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

        res.status(201).json({
            message: "تم إنشاء الحساب بنجاح ✅",
            token,
            user: {
                id: user._id,
                email: user.email,
                teamId: user.teamId,
                isVerified: user.isVerified 
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'خطأ أثناء التسجيل', error: error.message });
    }
};

// ================= verify User (Joined to FPL RUSH league) =================
exports.verifyUserLeague = async (req, res) => {
    try {
        const userId = req.user.id; 
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
        if (user.isVerified) return res.json({ message: "أنت موثق بالفعل ✅" });


        const MY_LEAGUE_ID = 2926375; 


        const verification = await fplService.checkLeagueMembership(user.teamId, MY_LEAGUE_ID);

        if (verification.isMember) {
            user.isVerified = true;
            user.teamName = verification.playerInfo.teamName;
            user.managerName = verification.playerInfo.managerName;
            await user.save();

            return res.json({
                success: true,
                message: "تم التحقق بنجاح! أهلاً بك في ملعب FPL RUSH 🚀",
                user: {
                    id: user._id,
                    isVerified: user.isVerified,
                    teamName: user.teamName
                }
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "لم نجد فريقك في الدوري الخاص بنا. تأكد من الانضمام للكود الصحيح ثم اضغط تحقق."
            });
        }
    } catch (error) {
        res.status(500).json({ message: "خطأ أثناء عملية التحقق", error: error.message });
    }
};


// ================= LOGIN =================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ message: "البريد الإلكتروني وكلمة المرور مطلوبان" });

        // البحث عن المستخدم
        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).json({ message: "بيانات الدخول غير صحيحة" });

        // مقارنة كلمة المرور
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ message: "بيانات الدخول غير صحيحة" });

        // توليد التوكن
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );

        res.status(200).json({
            message: "تم تسجيل الدخول بنجاح ✅",
            token,
            user: {
                id: user._id,
                email: user.email,
                teamId: user.teamId,
                isVerified: user.isVerified // هامة جداً للتحويل (Redirection) في الفرونت إند
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'خطأ أثناء تسجيل الدخول', error: error.message });
    }
};

// ================= FORGOT PASSWORD (SEND OTP) =================
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email)
            return res.status(400).json({ message: "Email required" });

        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).json({ message: "User not found" });

        const otp = generateOTP();
        user.otp = hashOTP(otp);
        user.otpExpiry = Date.now() + 20 * 60 * 1000;
        await user.save();

        await sendMail(
            email,
            "Password Reset OTP",
            `Your OTP is ${otp}. It expires in 20 minutes.`
        );

        res.status(200).json({ message: "OTP sent to email" });

    } catch (error) {
        res.status(500).json({ message: 'Forgot password error', error: error.message });
    }
};


// ================= VERIFY OTP (ONLY VERIFICATION) =================
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp)
            return res.status(400).json({ message: "Email and OTP required" });

        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).json({ message: "User not found" });

        if (Date.now() > user.otpExpiry)
            return res.status(400).json({ message: "OTP expired" });

        const hashed = hashOTP(otp);
        if (hashed !== user.otp)
            return res.status(400).json({ message: "Invalid OTP" });

      

        res.status(200).json({ 
            message: "OTP verified successfully"
        });

    } catch (error) {
        res.status(500).json({ message: 'OTP verification error', error: error.message });
    }
};

// ================= UPDATE RESET PASSWORD =================
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword)
            return res.status(400).json({ message: "All fields required" });

        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).json({ message: "User not found" });

        if (Date.now() > user.otpExpiry)
            return res.status(400).json({ message: "OTP expired" });

        const hashed = hashOTP(otp);
        if (hashed !== user.otp)
            return res.status(400).json({ message: "Invalid OTP" });

        // Hash new password before saving
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        user.password = hashedPassword;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.status(200).json({ message: "Password reset successfully ✅" });

    } catch (error) {
        res.status(500).json({ message: 'Reset password error', error: error.message });
    }
};
// ================= RESEND OTP =================
exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email)
            return res.status(400).json({ message: "Email required" });

        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).json({ message: "User not found" });

        const otp = generateOTP();
        user.otp = hashOTP(otp);
        user.otpExpiry = Date.now() + 20 * 60 * 1000;
        await user.save();

        await sendMail(
            email,
            "New Password Reset OTP",
            `Your new OTP is ${otp}. It expires in 20 minutes.`
        );

        res.status(200).json({ message: "New OTP sent to email" });

    } catch (error) {
        res.status(500).json({ message: 'Resend OTP error', error: error.message });
    }
};

// ================= GET CURRENT USER =================
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password -otp -otpExpiry");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user", error: error.message });
    }
};