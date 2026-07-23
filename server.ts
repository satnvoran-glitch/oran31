import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const app = express();

// إعدادات قراءة البيانات القادمة من التطبيق
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_here';

// ميدلوير (Middleware) لتسجيل كل طلب يدخل للسيرفر في سجلات Render بدقة
app.use((req: Request, res: Response, next) => {
  console.log("========================================");
  console.log(`[INCOMING REQUEST] TIME: ${new Date().toISOString()}`);
  console.log(`PATH: ${req.path}`);
  console.log(`METHOD: ${req.method}`);
  console.log(`QUERY PARAMS:`, req.query);
  console.log(`BODY:`, req.body);
  console.log("========================================");
  next();
});

// دالة معالجة الاستجابة الموحدة التي ترجع الـ JSON الكامل والمقبول من التطبيق
const handleLoginSuccess = (req: Request, res: Response) => {
  const activeCode = req.body.code || req.body.username || req.query.code || req.query.username || "12345";
  const activePassword = req.body.password || req.query.password || String(activeCode);

  const token = jwt.sign(
    { code: activeCode, device_id: req.body.device_id || 'unknown' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  const responseObject = {
    result: true,
    status: "success",
    success: true,
    message: "Login successful",
    token: token,
    jwt: token,
    access_token: token,
    user_info: {
      username: String(activeCode),
      password: String(activePassword),
      auth: 1,
      status: "Active",
      exp_date: "2027-01-01",
      active_connections: 1,
      max_connections: 2
    }
  };

  console.log("SENDING RESPONSE:", JSON.stringify(responseObject));
  return res.status(200).json(responseObject);
};

// تغطية كافة مسارات تسجيل الدخول والتفعيل المحتملة في تطبيقات الاستريمنغ (POST و GET)
const routes = [
  '/api/app/login',
  '/login.json',
  '/api/login',
  '/auth',
  '/player_api.php',
  '/login'
];

routes.forEach(route => {
  app.post(route, handleLoginSuccess);
  app.get(route, handleLoginSuccess);
});

// شبكة أمان عامة: أي مسار آخر يطلبه التطبيق سيتم التعامل معه وإرجاع النجاح مباشرة لمنع أي استجابة فارغة
app.all('*', (req: Request, res: Response) => {
  return handleLoginSuccess(req, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running successfully and listening on port ${PORT} 🚀`);
});
