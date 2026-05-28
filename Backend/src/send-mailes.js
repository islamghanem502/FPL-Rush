const nodemailer = require('nodemailer');
const { MongoClient } = require('mongodb');

async function sendChallengeEmail() {
  const uri = "mongodb+srv://admin:ISLAm1234-x@fpl-rush-v2.co0xwqf.mongodb.net/?appName=fpl-rush-V2";
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
    // يمكنك تعديل اسم الداتابيز لو كانت مختلفة عن 'test'
    const database = client.db('test');
    const users = database.collection('users');

    // سحب كل المستخدمين اللي ضايفين ايميل من الداتابيز
    const emailUsers = await users.find({
      email: { $exists: true, $ne: null, $ne: "" }
    }).toArray();

    if (emailUsers.length === 0) {
      console.log("No users with email found! ❌");
      return;
    }

    console.log(`🚀 Starting to send to ${emailUsers.length} managers...`);

    for (let user of emailUsers) {
      const mailOptions = {
        from: '"FPL Rush ⚽" <fplrush.official@gmail.com>',
        to: user.email,
        subject: 'تحدي جديد متاح الآن! انضم واكسب جوائز 🎁',
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border-radius: 16px; overflow: hidden; direction: rtl; text-align: right; background-color: #ffffff; border: 1px solid #eee;">
            
            <div style="background-color: #37003c; padding: 30px 20px; text-align: center;">
              <h1 style="color: #00ff87; margin: 0; font-size: 32px; text-transform: uppercase; font-weight: 900;">FPL RUSH</h1>
              <p style="color: #ffffff; margin-top: 5px; font-size: 18px;">العب مجاناً.. واكسب بجد!</p>
            </div>
            
            <div style="padding: 30px;">
              <h2 style="color: #37003c; font-size: 22px; margin-top: 0;">أهلاً يا كوتش ${user.managerName || 'Manager'} 👋</h2>
              
              <p style="font-size: 17px; line-height: 1.6; color: #333;">
                في <b>تحدي جديد</b> بدأ دلوقتي على <b>FPL Rush</b>! جهز فريقك وشارك عشان تنافس على الجوائز.
              </p>

              <div style="text-align: center; margin: 35px 0;">
                <a href="https://fplrush.app/#/challenge/69e9c4bea060fa23dd3572fe" style="background-color: #00ff87; color: #000000; padding: 22px 50px; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 22px; display: inline-block; box-shadow: 0 4px 15px rgba(0,255,135,0.4);">شارك في التحدي الآن 🚀</a>
              </div>

              <div style="background-color: #f8f9fa; border-radius: 15px; padding: 25px; border: 2px solid #37003c;">
                <p style="margin: 0 0 15px 0; font-weight: bold; color: #37003c; font-size: 18px; text-align: center;">لو واجهت أي مشكلة، كلمنا فوراً:</p>
                
                <a href="https://wa.me/201094474067" style="display: block; background-color: #25d366; color: #ffffff; padding: 18px; text-decoration: none; border-radius: 10px; font-size: 22px; font-weight: bold; text-align: center; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(37,211,102,0.3);">
                   واتساب: 01094474067 📱
                </a>

                <a href="https://www.facebook.com/profile.php?id=61584963545932" style="display: block; background-color: #1877f2; color: #ffffff; padding: 15px; text-decoration: none; border-radius: 10px; font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 10px;">
                   تابعنا على فيسبوك 🔵
                </a>
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
  } catch (err) {
    console.error("General Error:", err);
  } finally {
    await client.close();
    console.log('--- All Mails Sent Successfully ---');
  }
}

sendChallengeEmail();