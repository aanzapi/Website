const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.'));

// Data in-memory (simulasi database)
let users = [];
let activities = [];

// Konfigurasi Telegram
const TELEGRAM_BOT_TOKEN = '8089493197:AAG2QNzfIB7Cc8l6fiFmokUV9N5df-oJabg';
const TELEGRAM_CHAT_ID = '7878198899';

// Fungsi untuk mengirim notifikasi ke Telegram
async function sendTelegramNotification(message) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await axios.post(url, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        });
        
        console.log('Telegram notification sent:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error sending Telegram notification:', error.message);
        return { success: false, error: error.message };
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// API untuk mendapatkan semua pengguna
app.get('/api/users', (req, res) => {
    res.json({ success: true, data: users });
});

// API untuk registrasi
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Validasi input
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Semua field harus diisi' 
            });
        }
        
        // Cek apakah email sudah terdaftar
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email sudah terdaftar' 
            });
        }
        
        // Buat user baru
        const newUser = {
            id: users.length + 1,
            name,
            email,
            password, // Dalam aplikasi nyata, password harus di-hash
            registeredAt: new Date().toISOString()
        };
        
        // Simpan user
        users.push(newUser);
        
        // Tambahkan aktivitas
        activities.push({
            type: 'register',
            email,
            name,
            time: new Date().toISOString()
        });
        
        // Kirim notifikasi ke Telegram
        const telegramMessage = `🆕 REGISTRASI BARU\nNama: ${name}\nEmail: ${email}\nWaktu: ${new Date().toLocaleString()}\nUser ID: ${newUser.id}`;
        await sendTelegramNotification(telegramMessage);
        
        res.json({ 
            success: true, 
            message: 'Registrasi berhasil',
            data: { id: newUser.id, name: newUser.name, email: newUser.email }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan server' 
        });
    }
});

// API untuk login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validasi input
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email dan password harus diisi' 
            });
        }
        
        // Cari user
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email atau password salah' 
            });
        }
        
        // Tambahkan aktivitas
        activities.push({
            type: 'login',
            email,
            time: new Date().toISOString()
        });
        
        // Kirim notifikasi ke Telegram
        const telegramMessage = `🔐 LOGIN BERHASIL\nEmail: ${email}\nWaktu: ${new Date().toLocaleString()}\nUser ID: ${user.id}`;
        await sendTelegramNotification(telegramMessage);
        
        res.json({ 
            success: true, 
            message: 'Login berhasil',
            data: { id: user.id, name: user.name, email: user.email }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan server' 
        });
    }
});

// API untuk mendapatkan aktivitas
app.get('/api/activities', (req, res) => {
    res.json({ 
        success: true, 
        data: activities.slice(-10).reverse() // 10 aktivitas terbaru
    });
});

// API untuk mendapatkan statistik
app.get('/api/stats', (req, res) => {
    const totalUsers = users.length;
    const totalLogins = activities.filter(a => a.type === 'login').length;
    const totalRegisters = activities.filter(a => a.type === 'register').length;
    
    res.json({
        success: true,
        data: {
            totalUsers,
            totalLogins,
            totalRegisters
        }
    });
});

// API untuk test notifikasi Telegram
app.post('/api/test-notification', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Pesan harus diisi' 
            });
        }
        
        const telegramMessage = `🧪 TEST NOTIFIKASI\nPesan: ${message}\nWaktu: ${new Date().toLocaleString()}`;
        const result = await sendTelegramNotification(telegramMessage);
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Notifikasi test berhasil dikirim' 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Gagal mengirim notifikasi test' 
            });
        }
        
    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan server' 
        });
    }
});

// Jalankan server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log(`Telegram Bot Token: ${TELEGRAM_BOT_TOKEN}`);
    console.log(`Telegram Chat ID: ${TELEGRAM_CHAT_ID}`);
});