import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_here';

// صفحة الترحيب الرئيسية
app.get('/', (req: Request, res: Response) => {
  res.send('IU Panel Backend is Running Successfully! 🚀');
});

// دالة موحدة للرد بنجاح وتغطية كل صيغ الاستجابة
const handleLoginSuccess = (req: Request, res: Response) => {
  console.log("----------------------------------------");
  console.log("PATH REQUESTED:", req.path);
  console.log("METHOD:", req.method);
  console.log("BODY RECEIVED:", req.body);
  console.log("QUERY RECEIVED:", req.query);
  
  const activeCode = req.body.code || req.body.username || req.query.code || "12345";
  
  const token = jwt.sign(
    { code: activeCode, device_id: 'unknown' },
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
      password: String(req.body.password || activeCode),
      auth: 1,
      status: "Active",
      exp_date: "2027-01-01",
      active_connections: 1,
      max_connections: 2
    }
  };

  console.log("SENDING RESPONSE:", JSON.stringify(responseObject));
  console.log("----------------------------------------");

  return res.status(200).json(responseObject);
};

// تغطية كل المسارات المحتملة التي قد يطلبها تطبيق RedStream
app.post('/api/app/login', handleLoginSuccess);
app.post('/login.json', handleLoginSuccess);
app.post('/api/login', handleLoginSuccess);
app.post('/auth', handleLoginSuccess);

// دعم طلبات الـ GET أيضاً في حال كان التطبيق يرسل البيانات عبر الـ Query Parameters
app.get('/api/app/login', handleLoginSuccess);
app.get('/login.json', handleLoginSuccess);
app.get('/api/login', handleLoginSuccess);
app.get('/auth', handleLoginSuccess);

app.all('*', (req: Request, res: Response, next) => {
  return handleLoginSuccess(req, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
