// Konfigurasi
const TELEGRAM_BOT_TOKEN = '8089493197:AAG2QNzfIB7Cc8l6fiFmokUV9N5df-oJabg';
const TELEGRAM_CHAT_ID = '7878198899';
const API_URL = 'http://localhost:3000';

// Database lokal (simulasi)
let users = JSON.parse(localStorage.getItem('users')) || [
    { id: 1, name: 'Admin', email: 'admin@system.com', password: 'admin123', registeredAt: new Date().toISOString() }
];
let activities = JSON.parse(localStorage.getItem('activities')) || [
    { type: 'register', email: 'admin@system.com', time: new Date().toISOString() },
    { type: 'login', email: 'admin@system.com', time: new Date().toISOString() }
];

// Fungsi untuk menyimpan data ke localStorage
function saveData() {
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('activities', JSON.stringify(activities));
}

// Fungsi untuk menampilkan notifikasi
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    // Tambahkan ikon berdasarkan tipe
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    
    notification.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// Fungsi untuk mengirim notifikasi ke Telegram
async function sendTelegramNotification(message) {
    try {
        // Simulasi pengiriman ke Telegram
        console.log(`Mengirim notifikasi ke Telegram: ${message}`);
        
        // Simpan aktivitas notifikasi
        activities.push({
            type: 'telegram_notification',
            message: message,
            time: new Date().toISOString()
        });
        saveData();
        
        // Update statistik di dashboard jika halaman dashboard terbuka
        updateDashboardStats();
        
        return { success: true, message: 'Notifikasi berhasil dikirim ke Telegram' };
    } catch (error) {
        console.error('Error sending Telegram notification:', error);
        return { success: false, message: 'Gagal mengirim notifikasi ke Telegram' };
    }
}

// Fungsi untuk validasi email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Fungsi untuk validasi password
function validatePassword(password) {
    // Minimal 6 karakter
    return password.length >= 6;
}

// Fungsi untuk cek kekuatan password
function checkPasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    return strength;
}

// Fungsi untuk update tampilan kekuatan password
function updatePasswordStrength(password) {
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.getElementById('strengthText');
    
    if (!strengthBar || !strengthText) return;
    
    const strength = checkPasswordStrength(password);
    let width = '0%';
    let color = '#dc3545';
    let text = 'Sangat Lemah';
    
    if (strength === 1) {
        width = '25%';
        color = '#dc3545';
        text = 'Lemah';
    } else if (strength === 2) {
        width = '50%';
        color = '#ffc107';
        text = 'Cukup';
    } else if (strength === 3) {
        width = '75%';
        color = '#28a745';
        text = 'Kuat';
    } else if (strength >= 4) {
        width = '100%';
        color = '#28a745';
        text = 'Sangat Kuat';
    }
    
    strengthBar.style.width = width;
    strengthBar.style.backgroundColor = color;
    strengthText.textContent = text;
    strengthText.style.color = color;
}

// Fungsi untuk handle form login
function handleLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // Reset error messages
        document.getElementById('emailError').textContent = '';
        document.getElementById('passwordError').textContent = '';
        
        let isValid = true;
        
        // Validasi email
        if (!email) {
            document.getElementById('emailError').textContent = 'Email harus diisi';
            isValid = false;
        } else if (!validateEmail(email)) {
            document.getElementById('emailError').textContent = 'Format email tidak valid';
            isValid = false;
        }
        
        // Validasi password
        if (!password) {
            document.getElementById('passwordError').textContent = 'Password harus diisi';
            isValid = false;
        }
        
        if (!isValid) return;
        
        // Cek user di database
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Simpan user yang login di sessionStorage
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            
            // Tambahkan aktivitas login
            activities.push({
                type: 'login',
                email: email,
                time: new Date().toISOString()
            });
            saveData();
            
            // Kirim notifikasi ke Telegram
            const telegramMessage = `🔐 LOGIN BERHASIL\nEmail: ${email}\nWaktu: ${new Date().toLocaleString()}\nUser ID: ${user.id}`;
            await sendTelegramNotification(telegramMessage);
            
            showNotification('Login berhasil! Mengarahkan ke dashboard...', 'success');
            
            // Redirect ke dashboard setelah 2 detik
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            showNotification('Email atau password salah!', 'error');
            document.getElementById('passwordError').textContent = 'Email atau password salah';
        }
    });
}

// Fungsi untuk handle form register
function handleRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;
    
    // Update kekuatan password saat mengetik
    const passwordInput = document.getElementById('regPassword');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value);
        });
    }
    
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Reset error messages
        document.getElementById('nameError').textContent = '';
        document.getElementById('regEmailError').textContent = '';
        document.getElementById('regPasswordError').textContent = '';
        document.getElementById('confirmPasswordError').textContent = '';
        
        let isValid = true;
        
        // Validasi nama
        if (!name) {
            document.getElementById('nameError').textContent = 'Nama harus diisi';
            isValid = false;
        }
        
        // Validasi email
        if (!email) {
            document.getElementById('regEmailError').textContent = 'Email harus diisi';
            isValid = false;
        } else if (!validateEmail(email)) {
            document.getElementById('regEmailError').textContent = 'Format email tidak valid';
            isValid = false;
        } else if (users.some(u => u.email === email)) {
            document.getElementById('regEmailError').textContent = 'Email sudah terdaftar';
            isValid = false;
        }
        
        // Validasi password
        if (!password) {
            document.getElementById('regPasswordError').textContent = 'Password harus diisi';
            isValid = false;
        } else if (!validatePassword(password)) {
            document.getElementById('regPasswordError').textContent = 'Password minimal 6 karakter';
            isValid = false;
        }
        
        // Validasi konfirmasi password
        if (!confirmPassword) {
            document.getElementById('confirmPasswordError').textContent = 'Konfirmasi password harus diisi';
            isValid = false;
        } else if (password !== confirmPassword) {
            document.getElementById('confirmPasswordError').textContent = 'Password tidak cocok';
            isValid = false;
        }
        
        // Validasi terms
        const terms = document.getElementById('terms');
        if (!terms.checked) {
            showNotification('Anda harus menyetujui syarat dan ketentuan', 'error');
            isValid = false;
        }
        
        if (!isValid) return;
        
        // Buat user baru
        const newUser = {
            id: users.length + 1,
            name: name,
            email: email,
            password: password,
            registeredAt: new Date().toISOString()
        };
        
        // Tambahkan user ke database
        users.push(newUser);
        
        // Tambahkan aktivitas register
        activities.push({
            type: 'register',
            email: email,
            name: name,
            time: new Date().toISOString()
        });
        
        saveData();
        
        // Simpan user yang baru register di sessionStorage
        sessionStorage.setItem('currentUser', JSON.stringify(newUser));
        
        // Kirim notifikasi ke Telegram
        const telegramMessage = `🆕 REGISTRASI BARU\nNama: ${name}\nEmail: ${email}\nWaktu: ${new Date().toLocaleString()}\nUser ID: ${newUser.id}`;
        await sendTelegramNotification(telegramMessage);
        
        showNotification('Registrasi berhasil! Mengarahkan ke dashboard...', 'success');
        
        // Redirect ke dashboard setelah 2 detik
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    });
}

// Fungsi untuk update dashboard stats
function updateDashboardStats() {
    // Update total users
    const totalUsersElem = document.getElementById('totalUsers');
    if (totalUsersElem) {
        totalUsersElem.textContent = users.length;
    }
    
    // Update total logins
    const totalLoginsElem = document.getElementById('totalLogins');
    if (totalLoginsElem) {
        const loginCount = activities.filter(a => a.type === 'login').length;
        totalLoginsElem.textContent = loginCount;
    }
    
    // Update total registers
    const totalRegistersElem = document.getElementById('totalRegisters');
    if (totalRegistersElem) {
        const registerCount = activities.filter(a => a.type === 'register').length;
        totalRegistersElem.textContent = registerCount;
    }
    
    // Update total notifications
    const totalNotificationsElem = document.getElementById('totalNotifications');
    if (totalNotificationsElem) {
        const notificationCount = activities.filter(a => a.type === 'telegram_notification').length;
        totalNotificationsElem.textContent = notificationCount;
    }
    
    // Update user info
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const userNameElem = document.getElementById('userName');
    const userEmailElem = document.getElementById('userEmail');
    
    if (userNameElem && currentUser) {
        userNameElem.textContent = currentUser.name;
    }
    
    if (userEmailElem && currentUser) {
        userEmailElem.textContent = currentUser.email;
    }
    
    // Update activity list
    const activityListElem = document.getElementById('activityList');
    if (activityListElem) {
        // Ambil 5 aktivitas terbaru
        const recentActivities = [...activities].reverse().slice(0, 5);
        
        activityListElem.innerHTML = '';
        
        recentActivities.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            let icon = 'info-circle';
            let text = '';
            let time = new Date(activity.time).toLocaleString();
            
            if (activity.type === 'register') {
                icon = 'user-plus';
                text = `<strong>Registrasi baru</strong> dari ${activity.email}`;
            } else if (activity.type === 'login') {
                icon = 'sign-in-alt';
                text = `<strong>Login berhasil</strong> oleh ${activity.email}`;
            } else if (activity.type === 'telegram_notification') {
                icon = 'paper-plane';
                text = `<strong>Notifikasi Telegram</strong> dikirim`;
            }
            
            activityItem.innerHTML = `
                <div class="activity-icon">
                    <i class="fas fa-${icon}"></i>
                </div>
                <div class="activity-details">
                    <p>${text}</p>
                    <span class="activity-time">${time}</span>
                </div>
            `;
            
            activityListElem.appendChild(activityItem);
        });
    }
    
    // Update users list in modal
    const usersListContainer = document.getElementById('usersListContainer');
    if (usersListContainer) {
        usersListContainer.innerHTML = '';
        
        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            
            const registeredDate = new Date(user.registeredAt).toLocaleDateString();
            
            userCard.innerHTML = `
                <h4>${user.name}</h4>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>ID:</strong> ${user.id}</p>
                <p><strong>Terdaftar:</strong> ${registeredDate}</p>
            `;
            
            usersListContainer.appendChild(userCard);
        });
    }
}

// Fungsi untuk handle dashboard functionality
function handleDashboard() {
    // Cek apakah user sudah login
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser && window.location.pathname.includes('dashboard.html')) {
        showNotification('Silakan login terlebih dahulu!', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    // Update dashboard stats
    updateDashboardStats();
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            sessionStorage.removeItem('currentUser');
            showNotification('Logout berhasil!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        });
    }
    
    // Test Telegram button
    const testTelegramBtn = document.getElementById('testTelegramBtn');
    if (testTelegramBtn) {
        testTelegramBtn.addEventListener('click', async function() {
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            const message = `🧪 TEST NOTIFIKASI\nDari: ${currentUser ? currentUser.name : 'Dashboard'}\nWaktu: ${new Date().toLocaleString()}\nIni adalah notifikasi test dari sistem.`;
            
            const result = await sendTelegramNotification(message);
            if (result.success) {
                showNotification('Notifikasi test berhasil dikirim ke Telegram!', 'success');
            } else {
                showNotification('Gagal mengirim notifikasi test', 'error');
            }
        });
    }
    
    // Send test message from input
    const sendTestBtn = document.getElementById('sendTestBtn');
    if (sendTestBtn) {
        sendTestBtn.addEventListener('click', async function() {
            const testMessageInput = document.getElementById('testMessage');
            const message = testMessageInput.value.trim();
            
            if (!message) {
                showNotification('Masukkan pesan terlebih dahulu!', 'error');
                return;
            }
            
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            const fullMessage = `💬 PESAN TEST\nDari: ${currentUser ? currentUser.name : 'Dashboard'}\nPesan: ${message}\nWaktu: ${new Date().toLocaleString()}`;
            
            const result = await sendTelegramNotification(fullMessage);
            if (result.success) {
                showNotification('Pesan test berhasil dikirim ke Telegram!', 'success');
                testMessageInput.value = '';
            } else {
                showNotification('Gagal mengirim pesan test', 'error');
            }
        });
    }
    
    // View users button
    const viewUsersBtn = document.getElementById('viewUsersBtn');
    if (viewUsersBtn) {
        viewUsersBtn.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('usersModal').style.display = 'flex';
        });
    }
    
    // View logs button
    const viewLogsBtn = document.getElementById('viewLogsBtn');
    if (viewLogsBtn) {
        viewLogsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('Fitur log aktivitas akan segera tersedia!', 'info');
        });
    }
    
    // Close modal
    const modalCloseBtn = document.querySelector('.modal-close');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', function() {
            document.getElementById('usersModal').style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('usersModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    }
    
    // Menu toggle untuk mobile
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('active');
        });
    }
}

// Fungsi untuk toggle password visibility
function setupPasswordToggle() {
    // Toggle untuk login page
    const togglePasswordBtn = document.getElementById('togglePassword');
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                passwordInput.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    }
    
    // Toggle untuk register page (password)
    const toggleRegPasswordBtn = document.getElementById('toggleRegPassword');
    if (toggleRegPasswordBtn) {
        toggleRegPasswordBtn.addEventListener('click', function() {
            const passwordInput = document.getElementById('regPassword');
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                passwordInput.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    }
    
    // Toggle untuk register page (confirm password)
    const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
    if (toggleConfirmPasswordBtn) {
        toggleConfirmPasswordBtn.addEventListener('click', function() {
            const passwordInput = document.getElementById('confirmPassword');
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                passwordInput.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    }
}

// Fungsi untuk inisialisasi
function init() {
    // Setup password toggle
    setupPasswordToggle();
    
    // Handle forms berdasarkan halaman
    if (document.getElementById('loginForm')) {
        handleLoginForm();
    }
    
    if (document.getElementById('registerForm')) {
        handleRegisterForm();
    }
    
    // Handle dashboard jika di halaman dashboard
    if (window.location.pathname.includes('dashboard.html')) {
        handleDashboard();
    }
    
    // Tambahkan event listener untuk Enter key pada form
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            // Cek jika di form login
            if (document.getElementById('loginForm') && e.target.closest('#loginForm')) {
                document.getElementById('loginForm').dispatchEvent(new Event('submit'));
            }
            
            // Cek jika di form register
            if (document.getElementById('registerForm') && e.target.closest('#registerForm')) {
                document.getElementById('registerForm').dispatchEvent(new Event('submit'));
            }
            
            // Cek jika di form test message di dashboard
            if (document.getElementById('testMessage') && e.target.id === 'testMessage') {
                document.getElementById('sendTestBtn').click();
            }
        }
    });
    
    // Inisialisasi data jika belum ada
    if (!localStorage.getItem('users')) {
        saveData();
    }
    
    // Tampilkan notifikasi jika ada di sessionStorage
    const notification = sessionStorage.getItem('notification');
    if (notification) {
        const { message, type } = JSON.parse(notification);
        showNotification(message, type);
        sessionStorage.removeItem('notification');
    }
}

// Jalankan inisialisasi ketika DOM siap
document.addEventListener('DOMContentLoaded', init);