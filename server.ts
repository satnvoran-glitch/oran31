import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_here';

// صفحة الترحيب الرئيسية باش ما يطلعلكش Cannot GET / في المتصفح
app.get('/', (req: Request, res: Response) => {
  res.send('IU Panel Backend is Running Successfully! 🚀');
});

// مسار تسجيل الدخول وتفعيل الكود (متوافق مع أندرويد)
app.post('/api/app/login', async (req: Request, res: Response) => {
  try {
    const { code, username, password, device_id } = req.body;
    const activeCode = code || username; 

    if (!activeCode) {
      return res.status(400).json({
        success: false,
        message: "رمز التفعيل مطلوب"
      });
    }

    // توليد الـ JWT Token
    const token = jwt.sign(
      { code: activeCode, device_id: device_id || 'unknown' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // إرسال الاستجابة المطابقة لملف XtreamModels.kt في التطبيق
    return res.status(200).json({
      success: true,
      status: "Active",
      token: token,
      jwt: token,
      access_token: token,
      user_info: {
        username: String(activeCode),
        password: String(password || activeCode),
        auth: 1,
        status: "Active",
        exp_date: "2027-01-01",
        active_connections: 1,
        max_connections: 2
      },
      message: "Login successful"
    });

  } catch (error: any) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في السيرفر الداخلي",
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
