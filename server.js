const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const patientSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  telephone: { type: String, required: true, unique: true, trim: true },
  age:       { type: String, default: '' },
  password:  { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', patientSchema);

const appointmentSchema = new mongoose.Schema({
  telephone:   { type: String, required: true },
  patientName: { type: String, required: true },
  category:    { type: String, required: true },
  description: { type: String, required: true },
  date:        { type: String, required: true }
});
const Complaint = mongoose.model('Complaint', appointmentSchema);

mongoose.connect('mongodb://127.0.0.1:27017/dentalClinicDB')
  .then(() => console.log('✅ اتصلنا بـ MongoDB بنجاح'))
  .catch(err => console.log('❌ خطأ في الاتصال:', err));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/signup', async (req, res) => {
  const { name, telephone, age, password } = req.body;
  if (!name || !telephone || !password)
    return res.json({ success: false, message: 'جميع الحقول مطلوبة' });
  try {
    const existing = await User.findOne({ telephone });
    if (existing)
      return res.json({ success: false, message: 'رقم الهاتف هذا مسجل بالفعل' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, telephone, age, password: hashedPassword });
    await newUser.save();
    res.json({ success: true, message: 'تم إنشاء الحساب بنجاح' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'حدث خطأ أثناء التسجيل' });
  }
});

app.post('/login', async (req, res) => {
  const { telephone, password } = req.body;
  if (!telephone || !password)
    return res.json({ success: false, message: 'جميع الحقول مطلوبة' });
  try {
    const user = await User.findOne({ telephone });
    if (!user)
      return res.json({ success: false, message: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.json({ success: false, message: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
    res.json({ success: true, user: { name: user.name, telephone: user.telephone, age: user.age } });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'حدث خطأ أثناء تسجيل الدخول' });
  }
});

app.post('/complaint', async (req, res) => {
  const { telephone, patientName, category, description, date } = req.body;
  if (!telephone || !category || !date)
    return res.json({ success: false, message: 'البيانات غير مكتملة' });
  try {
    const newAppointment = new Complaint({ telephone, patientName, category, description, date });
    await newAppointment.save();
    res.json({ success: true, message: 'تم حجز الموعد بنجاح' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'حدث خطأ أثناء حجز الموعد' });
  }
});

app.get('/complaints/:telephone', async (req, res) => {
  try {
    const appointments = await Complaint.find({ telephone: req.params.telephone }).sort({ _id: -1 });
    res.json({ success: true, complaints: appointments });
  } catch (err) {
    console.error(err);
    res.json({ success: false, complaints: [] });
  }
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/api/users', async (req, res) => {
  try {
    const patients = await User.find({}).sort({ createdAt: -1 }).select('-password');
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ' });
  }
});

app.get('/api/complaints', async (req, res) => {
  try {
    const appointments = await Complaint.find({}).sort({ _id: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 عيادة الابتسامة - السيرفر شغال على http://localhost:${PORT}`);
  console.log(`🔧 لوحة الإدارة: http://localhost:${PORT}/admin`);
});