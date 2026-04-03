const nodemailer = require('nodemailer');
const { MongoClient } = require('mongodb');

async function sendFinalEmail() {
  const uri = "mongodb+srv://islamghanem502_db_user:ISLAm1234-x@fpl-rush.ivhiroy.mongodb.net/?appName=fpl-rush"; 
  const client = new MongoClient(uri);

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'fplrush.official@gmail.com',
      pass: 'zioj ptha jcsn cogn' 
    }
  });

  try {
    await client.connect();
    const database = client.db('fpl-rush');
    const users = database.collection('users');
    
    // سحب كل المستخدمين غير الموثقين من الداتابيز
    const unverifiedUsers = await users.find({ isVerified: false }).toArray();

    if (unverifiedUsers.length === 0) {
      console.log("No unverified users found! Everyone is verified. ✅");
      return;
    }

    console.log(`🚀 Starting to send to ${unverifiedUsers.length} managers...`);

    for (let user of unverifiedUsers) {
      const mailOptions = {
        from: '"FPL Rush ⚽" <fplrush.official@gmail.com>',
        to: user.email,
        subject: 'وثق حسابك الآن.. واكسب تيشرتات وقسائم شراء مجاناً! 🎁',
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border-radius: 16px; overflow: hidden; direction: rtl; text-align: right; background-color: #ffffff; border: 1px solid #eee;">
            
            <div style="background-color: #37003c; padding: 30px 20px; text-align: center;">
              <h1 style="color: #00ff87; margin: 0; font-size: 32px; text-transform: uppercase; font-weight: 900;">FPL RUSH</h1>
              <p style="color: #ffffff; margin-top: 5px; font-size: 18px;">العب مجاناً.. واكسب بجد!</p>
            </div>
            
            <div style="padding: 30px;">
              <h2 style="color: #37003c; font-size: 22px; margin-top: 0;">أهلاً يا كوتش ${user.managerName || 'Manager'} 👋</h2>
              
              <p style="font-size: 17px; line-height: 1.6; color: #333;">
                فاضل خطوة واحدة عشان تبدأ تجمع نقط وتنافس على جوائزنا (<b>تيشرتات أصلية، قسائم شراء، وبوسترات</b>). لازم تعمل <b>"توثيق للحساب"</b> عشان تدخل التحديات.
              </p>

              <div style="text-align: center; margin: 35px 0;">
                <a href="https://fplrush.app" style="background-color: #00ff87; color: #000000; padding: 22px 50px; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 22px; display: inline-block; box-shadow: 0 4px 15px rgba(0,255,135,0.4);">وثق حسابك الآن 🚀</a>
              </div>

              <div style="background-color: #f8f9fa; border-radius: 15px; padding: 25px; border: 2px solid #37003c;">
                <p style="margin: 0 0 15px 0; font-weight: bold; color: #37003c; font-size: 18px; text-align: center;">لو واجهت أي مشكلة في التوثيق أو دخول التحديات، كلمنا فوراً:</p>
                
                <a href="https://wa.me/201094474067" style="display: block; background-color: #25d366; color: #ffffff; padding: 18px; text-decoration: none; border-radius: 10px; font-size: 22px; font-weight: bold; text-align: center; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(37,211,102,0.3);">
                   واتساب: 01094474067 📱
                </a>

                <a href="https://www.facebook.com/profile.php?id=61584963545932" style="display: block; background-color: #1877f2; color: #ffffff; padding: 15px; text-decoration: none; border-radius: 10px; font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 10px;">
                   تابعنا على فيسبوك 🔵
                </a>
                
                <p style="font-size: 15px; color: #666; text-align: center; margin-top: 15px;">
                  أو ببساطة رد على الإيميل ده وفريقنا هيحللك المشكلة فوراً!
                </p>
              </div>
            </div>

            <div style="background-color: #37003c; color: #00ff87; padding: 15px; text-align: center; font-size: 14px; font-weight: bold;">
               كل جولة زي أول جولة! | FPL Rush 2026
            </div>
          </div>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Sent to: ${user.email}`);
        // تأخير عشان جوجل ميعتبرناش Spam
        await new Promise(r => setTimeout(r, 2000)); 
      } catch (err) {
        console.log(`❌ Error sending to ${user.email}:`, err.message);
      }
    }
  } finally {
    await client.close();
    console.log('--- All Mails Sent Successfully ---');
  }
}

sendFinalEmail();