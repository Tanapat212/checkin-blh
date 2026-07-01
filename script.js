// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD80WK9Mx-QjXp3lOwIDCIrfLoXoODlzlg",
    authDomain: "check-name-blh.firebaseapp.com",
    databaseURL: "https://check-name-blh-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "check-name-blh",
    storageBucket: "check-name-blh.firebasestorage.app",
    messagingSenderId: "420973526100",
    appId: "1:420973526100:web:b7a382f4784382e51281c1",
    measurementId: "G-86R88K64SC"
};

// Initialize Firebase
let app, db, auth, database;
let isFirebaseEnabled = false;

try {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    database = firebase.database();
    isFirebaseEnabled = true;
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization failed:', error);
    showNotification('ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 'error');
}

// Global Variables
let currentUser = null;
let currentUserData = null;
let activeTab = 'dashboard';
let attendanceData = {};

// Utility Functions
function hashPassword(password) {
    return CryptoJS.SHA256(password).toString();
}

function showNotification(message, type = 'success') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}</span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => { if (notification.parentNode) notification.remove(); }, 5000);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH');
}

function formatTime(timeString) {
    return timeString || '-';
}

// Database Functions
async function saveToDatabase(collection, docId, data) {
    if (!isFirebaseEnabled) return false;
    try {
        await db.collection(collection).doc(docId).set(data);
        return true;
    } catch (error) {
        showNotification('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
        return false;
    }
}

async function getFromDatabase(collection, docId = null) {
    if (!isFirebaseEnabled) return null;
    try {
        if (docId) {
            const doc = await db.collection(collection).doc(docId).get();
            return doc.exists ? doc.data() : null;
        } else {
            const snapshot = await db.collection(collection).get();
            const data = {};
            snapshot.forEach(doc => { data[doc.id] = doc.data(); });
            return data;
        }
    } catch (error) {
        return null;
    }
}

async function deleteFromDatabase(collection, docId) {
    if (!isFirebaseEnabled) return false;
    try {
        await db.collection(collection).doc(docId).delete();
        return true;
    } catch (error) {
        showNotification('เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
        return false;
    }
}

// Auth Functions
async function login(username, password, role) {
    try {
        const hashedPassword = hashPassword(password);
        const userData = await getFromDatabase('users', username);
        if (userData && userData.password === hashedPassword && userData.role === role) {
            currentUser = username;
            currentUserData = userData;
            return true;
        }
        return false;
    } catch (error) {
        showNotification('เกิดข้อผิดพลาดในการเข้าสู่ระบบ', 'error');
        return false;
    }
}

function logout() {
    currentUser = null;
    currentUserData = null;
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('dashboardSection').classList.remove('active');
    document.getElementById('loginForm').reset();
    showNotification('ออกจากระบบเรียบร้อยแล้ว', 'success');
}

async function initializeDefaultUsers() {
    if (!isFirebaseEnabled) return;
    try {
        const adminUser = await getFromDatabase('users', 'admin');
        if (!adminUser) {
            await saveToDatabase('users', 'admin', {
                username: 'admin',
                password: hashPassword('admin123'),
                name: 'ผู้ดูแลระบบ',
                email: 'admin@blh.ac.th',
                role: 'admin',
                createdAt: new Date().toISOString()
            });
        }
    } catch (error) {}
}

// UI Functions
function showTab(tabName) {
    activeTab = tabName;
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    const activeTabElement = document.querySelector(`[onclick="showTab('${tabName}')"]`);
    if (activeTabElement) activeTabElement.classList.add('active');
    loadTabContent(tabName);
}

function loadTabContent(tabName) {
    switch(tabName) {
        case 'dashboard': loadDashboard(); break;
        case 'attendance': loadAttendance(); break;
        case 'reports': loadReports(); break;
        case 'subjects': loadSubjects(); break;
        case 'users': loadUsers(); break;
        case 'settings': loadSettings(); break;
        case 'profile': loadProfile(); break;
    }
}

function generateTabs() {
    const tabsContainer = document.getElementById('navTabs');
    let tabs = '';
    if (currentUserData.role === 'admin') {
        tabs = `<button class="nav-tab active" onclick="showTab('dashboard')">🏠 แดชบอร์ด</button>
                <button class="nav-tab" onclick="showTab('attendance')">📋 การเข้าเรียน</button>
                <button class="nav-tab" onclick="showTab('reports')">📊 รายงาน</button>
                <button class="nav-tab" onclick="showTab('subjects')">📚 รายวิชา</button>
                <button class="nav-tab" onclick="showTab('users')">👥 ผู้ใช้งาน</button>
                <button class="nav-tab" onclick="showTab('settings')">⚙️ ตั้งค่า</button>
                <button class="nav-tab" onclick="showTab('profile')">👤 โปรไฟล์</button>`;
    } else if (currentUserData.role === 'teacher') {
        tabs = `<button class="nav-tab active" onclick="showTab('dashboard')">🏠 แดชบอร์ด</button>
                <button class="nav-tab" onclick="showTab('attendance')">📝 เช็คชื่อ</button>
                <button class="nav-tab" onclick="showTab('reports')">📊 รายงาน</button>
                <button class="nav-tab" onclick="showTab('subjects')">📚 วิชาที่สอน</button>
                <button class="nav-tab" onclick="showTab('profile')">👤 โปรไฟล์</button>`;
    } else {
        tabs = `<button class="nav-tab active" onclick="showTab('dashboard')">🏠 แดชบอร์ด</button>
                <button class="nav-tab" onclick="showTab('attendance')">📊 ประวัติเข้าเรียน</button>
                <button class="nav-tab" onclick="showTab('profile')">👤 โปรไฟล์</button>`;
    }
    tabsContainer.innerHTML = tabs;
}

// ---------------- DASHBOARD ----------------
async function loadDashboard() {
    const content = document.getElementById('tabContent');
    const stats = await getDashboardStats();
    let statsHTML = '';
    
    if (currentUserData.role === 'admin' || currentUserData.role === 'teacher') {
        statsHTML = `
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-value">${stats.totalStudents || 0}</div><div class="stat-label">นักเรียนทั้งหมด</div></div>
                <div class="stat-card"><div class="stat-value">${currentUserData.role === 'admin' ? (stats.totalTeachers || 0) : (stats.mySubjects || 0)}</div><div class="stat-label">${currentUserData.role === 'admin' ? 'ครูทั้งหมด' : 'วิชาที่สอน'}</div></div>
                <div class="stat-card"><div class="stat-value">${stats.presentToday || 0}</div><div class="stat-label">มาเรียนวันนี้</div></div>
                <div class="stat-card" style="background: linear-gradient(135deg, #E74C3C, #C0392B);"><div class="stat-value">${stats.absentToday || 0}</div><div class="stat-label">ขาดเรียนวันนี้</div></div>
            </div>`;
    } else {
        statsHTML = `
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-value">${stats.attendanceRate || 0}%</div><div class="stat-label">เปอร์เซ็นต์การเข้าเรียน</div></div>
                <div class="stat-card"><div class="stat-value">${stats.presentDays || 0}</div><div class="stat-label">เข้าเรียน (ครั้ง)</div></div>
                <div class="stat-card" style="background: linear-gradient(135deg, #E74C3C, #C0392B);"><div class="stat-value">${stats.absentDays || 0}</div><div class="stat-label">ขาดเรียน (ครั้ง)</div></div>
                <div class="stat-card" style="background: linear-gradient(135deg, #F39C12, #D68910);"><div class="stat-value">${stats.lateDays || 0}</div><div class="stat-label">มาสาย (ครั้ง)</div></div>
            </div>`;
    }

    content.innerHTML = `
        ${statsHTML}
        <div class="card">
            <div class="card-header"><h3 class="card-title">🔔 ข่าวสารล่าสุด</h3></div>
            <div style="padding: 20px 0;">
                <div style="border-left: 4px solid var(--secondary-green); padding-left: 15px; margin-bottom: 15px;">
                    <h4 style="margin: 0 0 5px 0; color: var(--text-dark);">ระบบอัปเดตใหม่</h4>
                    <p style="margin: 0; color: var(--text-light);">อัปเดตข้อมูลการเช็คชื่อแบบ Real-time</p>
                </div>
            </div>
        </div>`;
}

async function getDashboardStats() {
    try {
        const users = await getFromDatabase('users');
        const attendance = await getFromDatabase('attendance');
        const stats = { totalStudents: 0, totalTeachers: 0, mySubjects: 0, presentToday: 0, absentToday: 0 };
        
        if (users) {
            const userList = Object.values(users);
            stats.totalStudents = userList.filter(u => u.role === 'student').length;
            stats.totalTeachers = userList.filter(u => u.role === 'teacher').length;
            if (currentUserData.role === 'teacher') {
                stats.mySubjects = (currentUserData.subjects || []).length;
            }
        }

        const today = new Date().toISOString().split('T')[0];
        
        if (currentUserData.role === 'student') {
            let p=0, a=0, l=0;
            if (attendance) {
                Object.values(attendance).forEach(record => {
                    if (record.students && record.students[currentUser]) {
                        const status = record.students[currentUser].status;
                        if (status === 'present') p++;
                        if (status === 'absent') a++;
                        if (status === 'late') l++;
                    }
                });
            }
            const total = p + a + l;
            return {
                attendanceRate: total > 0 ? Math.round(((p+l)/total)*100) : 0,
                presentDays: p, absentDays: a, lateDays: l
            };
        } else {
            // Admin & Teacher
            if (attendance) {
                Object.values(attendance).forEach(record => {
                    if (record.date === today) {
                        if (currentUserData.role === 'admin' || (currentUserData.role === 'teacher' && record.teacher === currentUserData.name)) {
                            const students = record.students || {};
                            Object.values(students).forEach(s => {
                                if (s.status === 'present' || s.status === 'late') stats.presentToday++;
                                if (s.status === 'absent') stats.absentToday++;
                            });
                        }
                    }
                });
            }
            return stats;
        }
    } catch (error) { return {}; }
}

// ---------------- ATTENDANCE ----------------
async function loadAttendance() {
    const content = document.getElementById('tabContent');
    if (currentUserData.role === 'teacher') {
        content.innerHTML = `
            <div class="card">
                <div class="card-header"><h3 class="card-title">📝 เช็คชื่อรายวัน</h3></div>
                <div class="form-row">
                    <div class="form-group"><label>วันที่:</label><input type="date" id="attendanceDate" class="form-control" value="${new Date().toISOString().split('T')[0]}"></div>
                    <div class="form-group"><label>วิชา:</label><select id="attendanceSubject" class="form-control"><option value="">เลือกวิชา</option></select></div>
                    <div class="form-group">
                        <label>ชั้นเรียน:</label>
                        <select id="attendanceClass" class="form-control">
                            <option value="">เลือกชั้นเรียน</option>
                            <option value="ม.1/1">ม.1/1</option><option value="ม.1/2">ม.1/2</option><option value="ม.1/3">ม.1/3</option>
                            <option value="ม.2/1">ม.2/1</option><option value="ม.2/2">ม.2/2</option><option value="ม.2/3">ม.2/3</option>
                            <option value="ม.3/1">ม.3/1</option><option value="ม.3/2">ม.3/2</option><option value="ม.3/3">ม.3/3</option>
                        </select>
                    </div>
                    <div class="form-group"><label>&nbsp;</label><button class="btn btn-success" onclick="loadStudentList()">📋 โหลดรายชื่อ</button></div>
                </div>
                <div id="studentAttendanceList"><p style="text-align: center; color: var(--text-light); padding: 40px 0;">📋 เลือกวิชาและชั้นเรียน จากนั้นกดปุ่ม "โหลดรายชื่อ"</p></div>
            </div>`;
        await loadTeacherSubjects();
    } else if (currentUserData.role === 'student') {
        content.innerHTML = `<div class="card"><div class="card-header"><h3 class="card-title">📊 ประวัติการเข้าเรียนของฉัน</h3></div><div class="table-responsive"><table class="table"><thead><tr><th>วันที่</th><th>วิชา</th><th>สถานะ</th><th>เวลา</th></tr></thead><tbody id="studentAttendanceHistory"></tbody></table></div></div>`;
        loadStudentAttendanceHistory();
    } else {
        content.innerHTML = `<div class="card"><div class="card-header"><h3 class="card-title">📊 สรุปการเข้าเรียนทั้งหมด</h3></div><div class="table-responsive"><table class="table"><thead><tr><th>วันที่</th><th>วิชา</th><th>ครู</th><th>ชั้น</th><th>เข้าเรียน</th><th>ขาดเรียน</th><th>มาสาย</th></tr></thead><tbody id="allAttendanceHistory"></tbody></table></div></div>`;
        loadAllAttendanceHistory();
    }
}

async function loadTeacherSubjects() {
    try {
        const subjects = await getFromDatabase('subjects');
        const subjectSelect = document.getElementById('attendanceSubject');
        subjectSelect.innerHTML = '<option value="">เลือกวิชา</option>';
        if (subjects) {
            Object.entries(subjects).forEach(([id, subject]) => {
                if (subject.teacher === currentUserData.name) {
                    subjectSelect.innerHTML += `<option value="${subject.name}">${subject.name}</option>`;
                }
            });
        }
    } catch (error) {}
}

async function loadStudentList() {
    const subject = document.getElementById('attendanceSubject')?.value;
    const date = document.getElementById('attendanceDate')?.value;
    const classRoom = document.getElementById('attendanceClass')?.value;
    if (!subject || !date || !classRoom) return showNotification('กรุณาเลือกวิชา วันที่ และชั้นเรียน', 'error');

    try {
        const users = await getFromDatabase('users');
        const students = [];
        if (users) {
            Object.entries(users).forEach(([id, user]) => {
                if (user.role === 'student' && user.class === classRoom) students.push({ id, ...user });
            });
        }

        // ดึงข้อมูลการเช็คชื่อเดิมมาแสดง (ถ้ามี)
        const attendanceId = `${date}_${subject}_${classRoom}`.replace(/[^a-zA-Z0-9]/g, '_');
        const existingRecord = await getFromDatabase('attendance', attendanceId);
        attendanceData = (existingRecord && existingRecord.students) ? existingRecord.students : {};

        const listHtml = `
            <div style="margin-top: 20px;">
                <h4>รายชื่อนักเรียน - ${subject} (${formatDate(date)})</h4>
                <div style="margin: 20px 0;">
                    ${students.map(student => {
                        const isPresent = attendanceData[student.id]?.status === 'present';
                        const isLate = attendanceData[student.id]?.status === 'late';
                        const isAbsent = attendanceData[student.id]?.status === 'absent';
                        const markedClass = attendanceData[student.id] ? 'marked ' + attendanceData[student.id].status : '';
                        
                        return `
                        <div class="student-item ${markedClass}" id="student-${student.id}">
                            <div><strong>${student.name}</strong><span style="color: var(--text-light); margin-left: 10px;">(${student.studentId || student.id})</span></div>
                            <div style="display: flex; gap: 10px;">
                                <button class="btn btn-sm btn-success" style="${isPresent ? 'opacity:1; transform:scale(1.05);' : 'opacity:0.5;'}" onclick="markAttendance('${student.id}', 'present')">✅ เข้าเรียน</button>
                                <button class="btn btn-sm btn-warning" style="${isLate ? 'opacity:1; transform:scale(1.05);' : 'opacity:0.5;'}" onclick="markAttendance('${student.id}', 'late')">⏰ มาสาย</button>
                                <button class="btn btn-sm btn-danger" style="${isAbsent ? 'opacity:1; transform:scale(1.05);' : 'opacity:0.5;'}" onclick="markAttendance('${student.id}', 'absent')">❌ ขาดเรียน</button>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <button class="btn btn-success" onclick="saveAttendance()">💾 บันทึกการเข้าเรียน</button>
                    <button class="btn btn-warning" onclick="exportAttendance()">📤 Export Excel</button>
                </div>
            </div>`;
        document.getElementById('studentAttendanceList').innerHTML = listHtml;
    } catch (error) { showNotification('เกิดข้อผิดพลาดในการโหลดรายชื่อ', 'error'); }
}

function markAttendance(studentId, status) {
    const studentItem = document.getElementById(`student-${studentId}`);
    studentItem.querySelectorAll('.btn').forEach(btn => { btn.style.opacity = '0.5'; btn.style.transform = 'none'; });
    event.target.style.opacity = '1';
    event.target.style.transform = 'scale(1.05)';
    studentItem.classList.remove('marked', 'present', 'late', 'absent');
    studentItem.classList.add('marked', status);
    
    attendanceData[studentId] = { status: status, time: new Date().toLocaleTimeString('th-TH') };
}

async function saveAttendance() {
    if (!attendanceData || Object.keys(attendanceData).length === 0) return showNotification('กรุณาเช็คชื่อนักเรียนก่อน', 'error');
    const subject = document.getElementById('attendanceSubject').value;
    const date = document.getElementById('attendanceDate').value;
    const classRoom = document.getElementById('attendanceClass').value;
    
    try {
        const attendanceId = `${date}_${subject}_${classRoom}`.replace(/[^a-zA-Z0-9]/g, '_');
        const attendanceRecord = {
            subject: subject, date: date, class: classRoom, teacher: currentUserData.name,
            students: attendanceData, timestamp: new Date().toISOString()
        };
        if (await saveToDatabase('attendance', attendanceId, attendanceRecord)) {
            showNotification('บันทึกการเข้าเรียนเรียบร้อยแล้ว! 🎉', 'success');
        }
    } catch (error) { showNotification('เกิดข้อผิดพลาดในการบันทึก', 'error'); }
}

function exportAttendance() {
    if (!attendanceData || Object.keys(attendanceData).length === 0) return showNotification('ไม่มีข้อมูลให้ export', 'error');
    const subject = document.getElementById('attendanceSubject').value;
    const date = document.getElementById('attendanceDate').value;
    const exportData = [['รหัสนักเรียน', 'ชื่อ-นามสกุล', 'สถานะ', 'เวลา']];

    Object.entries(attendanceData).forEach(([studentId, data]) => {
        const studentName = document.getElementById(`student-${studentId}`).querySelector('strong').textContent;
        const statusText = data.status === 'present' ? 'เข้าเรียน' : data.status === 'late' ? 'มาสาย' : 'ขาดเรียน';
        exportData.push([studentId, studentName, statusText, data.time]);
    });

    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'การเข้าเรียน');
    XLSX.writeFile(wb, `การเข้าเรียน_${subject}_${date}.xlsx`);
    showNotification('Export Excel เรียบร้อยแล้ว! 📄', 'success');
}

async function loadStudentAttendanceHistory() {
    try {
        const attendance = await getFromDatabase('attendance');
        const tbody = document.getElementById('studentAttendanceHistory');
        let rows = '';
        if (attendance) {
            Object.values(attendance).forEach(record => {
                if (record.students && record.students[currentUser]) {
                    const studentData = record.students[currentUser];
                    const statusText = studentData.status === 'present' ? 'เข้าเรียน' : studentData.status === 'late' ? 'มาสาย' : 'ขาดเรียน';
                    const statusClass = studentData.status === 'present' ? 'status-present' : studentData.status === 'late' ? 'status-late' : 'status-absent';
                    rows += `<tr><td>${formatDate(record.date)}</td><td>${record.subject}</td><td><span class="status-badge ${statusClass}">${statusText}</span></td><td>${formatTime(studentData.time)}</td></tr>`;
                }
            });
        }
        tbody.innerHTML = rows || `<tr><td colspan="4" style="text-align: center;">ไม่พบประวัติการเข้าเรียน</td></tr>`;
    } catch (error) {}
}

async function loadAllAttendanceHistory() {
    try {
        const attendance = await getFromDatabase('attendance');
        const tbody = document.getElementById('allAttendanceHistory');
        let rows = '';
        if (attendance) {
            Object.values(attendance).forEach(record => {
                const students = record.students || {};
                const presentCount = Object.values(students).filter(s => s.status === 'present').length;
                const absentCount = Object.values(students).filter(s => s.status === 'absent').length;
                const lateCount = Object.values(students).filter(s => s.status === 'late').length;
                rows += `<tr><td>${formatDate(record.date)}</td><td>${record.subject}</td><td>${record.teacher}</td><td>${record.class}</td><td><span class="status-badge status-present">${presentCount}</span></td><td><span class="status-badge status-absent">${absentCount}</span></td><td><span class="status-badge status-late">${lateCount}</span></td></tr>`;
            });
        }
        tbody.innerHTML = rows || `<tr><td colspan="7" style="text-align: center;">ไม่พบข้อมูลการเข้าเรียน</td></tr>`;
    } catch (error) {}
}

// ---------------- REPORTS ----------------
function loadReports() {
    const content = document.getElementById('tabContent');
    content.innerHTML = `
        <div class="card">
            <div class="card-header"><h3 class="card-title">📈 รายงานการเข้าเรียน</h3></div>
            <div class="form-row">
                <div class="form-group"><label>วันที่เริ่มต้น:</label><input type="date" id="reportStartDate" class="form-control"></div>
                <div class="form-group"><label>วันที่สิ้นสุด:</label><input type="date" id="reportEndDate" class="form-control"></div>
                <div class="form-group">
                    <label>ประเภทรายงาน:</label>
                    <select id="reportType" class="form-control">
                        <option value="summary">สรุปภาพรวม</option>
                        <option value="detailed">รายละเอียด</option>
                        <option value="class">รายงานตามชั้นเรียน</option>
                    </select>
                </div>
            </div>
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="btn btn-success" onclick="generateReport()">📊 สร้างรายงาน</button>
            </div>
            <div id="reportResults">
                <div style="text-align: center; padding: 40px 0; color: var(--text-light);">📋 เลือกช่วงวันที่และประเภทรายงาน จากนั้นกด "สร้างรายงาน"</div>
            </div>
        </div>`;
}

async function generateReport() {
    const start = document.getElementById('reportStartDate').value;
    const end = document.getElementById('reportEndDate').value;
    const type = document.getElementById('reportType').value;
    if (!start || !end) return showNotification('กรุณาเลือกช่วงวันที่', 'error');

    try {
        const attendance = await getFromDatabase('attendance');
        if (!attendance) return;

        const filtered = Object.values(attendance).filter(record => {
            const date = new Date(record.date);
            return date >= new Date(start) && date <= new Date(end);
        });

        const reportResults = document.getElementById('reportResults');
        let html = '';

        if (type === 'summary' || type === 'detailed') {
            let rows = '';
            filtered.forEach(record => {
                const students = record.students || {};
                const p = Object.values(students).filter(s => s.status === 'present').length;
                const a = Object.values(students).filter(s => s.status === 'absent').length;
                const l = Object.values(students).filter(s => s.status === 'late').length;
                rows += `<tr><td>${formatDate(record.date)}</td><td>${record.subject}</td><td>${record.class}</td><td>${p}</td><td>${a}</td><td>${l}</td></tr>`;
            });
            html = `<h4>📋 ข้อมูลรายงาน (${formatDate(start)} - ${formatDate(end)})</h4>
                    <div class="table-responsive"><table class="table">
                    <thead><tr><th>วันที่</th><th>วิชา</th><th>ชั้น</th><th>เข้าเรียน</th><th>ขาด</th><th>สาย</th></tr></thead>
                    <tbody>${rows || '<tr><td colspan="6" style="text-align:center;">ไม่พบข้อมูล</td></tr>'}</tbody></table></div>`;
        } else if (type === 'class') {
            const classStats = {};
            filtered.forEach(record => {
                const cls = record.class;
                if (!classStats[cls]) classStats[cls] = { p: 0, a: 0, l: 0 };
                Object.values(record.students || {}).forEach(s => {
                    if (s.status === 'present') classStats[cls].p++;
                    if (s.status === 'absent') classStats[cls].a++;
                    if (s.status === 'late') classStats[cls].l++;
                });
            });
            let rows = '';
            Object.entries(classStats).forEach(([cls, stat]) => {
                const total = stat.p + stat.a + stat.l;
                const rate = total > 0 ? ((stat.p/total)*100).toFixed(1) : 0;
                rows += `<tr><td>${cls}</td><td>${stat.p}</td><td>${stat.a}</td><td>${stat.l}</td><td>${total}</td><td>${rate}%</td></tr>`;
            });
            html = `<h4>🏫 รายงานตามชั้นเรียน</h4>
                    <div class="table-responsive"><table class="table">
                    <thead><tr><th>ชั้น</th><th>เข้าเรียน</th><th>ขาด</th><th>สาย</th><th>รวม</th><th>เปอร์เซ็นต์</th></tr></thead>
                    <tbody>${rows || '<tr><td colspan="6" style="text-align:center;">ไม่พบข้อมูล</td></tr>'}</tbody></table></div>`;
        }
        reportResults.innerHTML = html;
    } catch (error) { showNotification('เกิดข้อผิดพลาดในการสร้างรายงาน', 'error'); }
}

// ---------------- SETTINGS ----------------
function loadSettings() {
    if (currentUserData.role !== 'admin') {
        document.getElementById('tabContent').innerHTML = `<div class="card"><h3 style="text-align: center;">🚫 คุณไม่มีสิทธิ์เข้าถึงหน้านี้</h3></div>`;
        return;
    }
    document.getElementById('tabContent').innerHTML = `
        <div class="card">
            <div class="card-header"><h3 class="card-title">⚙️ ตั้งค่าระบบ</h3></div>
            <form id="settingsForm">
                <div class="form-row">
                    <div class="form-group"><label>เวลาเริ่มเรียน:</label><input type="time" id="setStart" class="form-control" value="08:00"></div>
                    <div class="form-group"><label>เวลาเลิกเรียน:</label><input type="time" id="setEnd" class="form-control" value="15:30"></div>
                </div>
                <div class="form-group"><label>ชื่อโรงเรียน:</label><input type="text" id="setSchool" class="form-control" value="โรงเรียนบ้านโหล๊ะหาร"></div>
                <div style="text-align: center; margin-top: 20px;">
                    <button type="button" class="btn btn-success" onclick="saveSettings()">💾 บันทึกการตั้งค่า</button>
                    <button type="button" class="btn btn-warning" onclick="backupData()">💾 สำรองข้อมูล</button>
                </div>
            </form>
        </div>`;
    loadCurrentSettings();
}

async function loadCurrentSettings() {
    const settings = await getFromDatabase('settings', 'general');
    if (settings) {
        if(settings.schoolStartTime) document.getElementById('setStart').value = settings.schoolStartTime;
        if(settings.schoolEndTime) document.getElementById('setEnd').value = settings.schoolEndTime;
        if(settings.schoolName) document.getElementById('setSchool').value = settings.schoolName;
    }
}

async function saveSettings() {
    const settings = {
        schoolStartTime: document.getElementById('setStart').value,
        schoolEndTime: document.getElementById('setEnd').value,
        schoolName: document.getElementById('setSchool').value,
        updatedAt: new Date().toISOString()
    };
    if (await saveToDatabase('settings', 'general', settings)) {
        showNotification('บันทึกการตั้งค่าเรียบร้อยแล้ว!', 'success');
    }
}

async function backupData() {
    showNotification('กำลังสำรองข้อมูล...', 'warning');
    try {
        const data = {
            users: await getFromDatabase('users'),
            subjects: await getFromDatabase('subjects'),
            attendance: await getFromDatabase('attendance'),
            timestamp: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        showNotification('สำรองข้อมูลเรียบร้อยแล้ว! 💾', 'success');
    } catch (error) { showNotification('เกิดข้อผิดพลาดในการสำรองข้อมูล', 'error'); }
}

// ---------------- PROFILE ----------------
function loadProfile() {
    document.getElementById('tabContent').innerHTML = `
        <div class="card">
            <div class="card-header"><h3 class="card-title">👤 โปรไฟล์ของฉัน</h3></div>
            <div style="text-align: center; margin-bottom: 30px;">
                <div class="user-avatar" style="width: 100px; height: 100px; font-size: 2.5rem; margin: 0 auto 15px;">
                    ${currentUserData.role === 'admin' ? '👑' : currentUserData.role === 'teacher' ? '👨‍🏫' : '🎓'}
                </div>
                <h2>${currentUserData.name}</h2>
                <p style="color: var(--text-light);">${currentUserData.role === 'admin' ? 'ผู้ดูแลระบบ' : currentUserData.role === 'teacher' ? 'ครู' : 'นักเรียน'}</p>
            </div>
            
            <form id="profileForm">
                <div class="form-row">
                    <div class="form-group"><label>ชื่อ-นามสกุล:</label><input type="text" id="profName" class="form-control" value="${currentUserData.name}"></div>
                    <div class="form-group"><label>อีเมล:</label><input type="email" id="profEmail" class="form-control" value="${currentUserData.email || ''}"></div>
                </div>
                <hr style="margin: 30px 0;">
                <h4>🔐 เปลี่ยนรหัสผ่าน</h4>
                <div class="form-row">
                    <div class="form-group"><label>รหัสผ่านปัจจุบัน:</label><input type="password" id="currPass" class="form-control"></div>
                    <div class="form-group"><label>รหัสผ่านใหม่:</label><input type="password" id="newPass" class="form-control"></div>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <button type="button" class="btn btn-success" onclick="updateProfile()">💾 บันทึกข้อมูล</button>
                    <button type="button" class="btn btn-warning" onclick="changePassword()">🔐 เปลี่ยนรหัสผ่าน</button>
                </div>
            </form>
        </div>`;
}

async function updateProfile() {
    const name = document.getElementById('profName').value;
    const email = document.getElementById('profEmail').value;
    if (!name) return showNotification('กรุณากรอกชื่อ', 'error');

    currentUserData.name = name;
    currentUserData.email = email;
    if (await saveToDatabase('users', currentUser, currentUserData)) {
        document.getElementById('userName').textContent = name;
        showNotification('อัปเดตโปรไฟล์เรียบร้อย!', 'success');
    }
}

async function changePassword() {
    const currPass = document.getElementById('currPass').value;
    const newPass = document.getElementById('newPass').value;
    if (!currPass || !newPass) return showNotification('กรุณากรอกรหัสผ่านให้ครบ', 'error');
    if (hashPassword(currPass) !== currentUserData.password) return showNotification('รหัสผ่านปัจจุบันไม่ถูกต้อง', 'error');

    currentUserData.password = hashPassword(newPass);
    if (await saveToDatabase('users', currentUser, currentUserData)) {
        document.getElementById('currPass').value = '';
        document.getElementById('newPass').value = '';
        showNotification('เปลี่ยนรหัสผ่านเรียบร้อย! 🔐', 'success');
    }
}

// ---------------- USERS & SUBJECTS (RESTORED) ----------------
async function loadUsers() {
    if (currentUserData.role !== 'admin') {
        document.getElementById('tabContent').innerHTML = `<div class="card"><h3 style="text-align: center; color: var(--text-light);">🚫 คุณไม่มีสิทธิ์เข้าถึงหน้านี้</h3></div>`;
        return;
    }
    const content = document.getElementById('tabContent');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">👥 จัดการผู้ใช้งาน</h3>
                <button class="btn btn-success" onclick="showAddUserModal()">➕ เพิ่มผู้ใช้ใหม่</button>
            </div>
            <div class="nav-tabs" style="margin-bottom: 20px;">
                <button class="nav-tab active" onclick="filterUsers('all')">👥 ทั้งหมด</button>
                <button class="nav-tab" onclick="filterUsers('admin')">👑 ผู้ดูแลระบบ</button>
                <button class="nav-tab" onclick="filterUsers('teacher')">👨‍🏫 ครู</button>
                <button class="nav-tab" onclick="filterUsers('student')">🎓 นักเรียน</button>
            </div>
            <div id="usersList"><div style="text-align: center; padding: 40px 0;"><p>กำลังโหลดข้อมูล...</p></div></div>
        </div>
    `;
    await loadUsersList();
}

async function loadUsersList() {
    try {
        const users = await getFromDatabase('users');
        const usersList = document.getElementById('usersList');
        if (!users) { usersList.innerHTML = `<p style="text-align:center;">ไม่พบข้อมูลผู้ใช้</p>`; return; }
        
        const userCards = Object.entries(users).map(([id, user]) => {
            const roleIcon = user.role === 'admin' ? '👑' : user.role === 'teacher' ? '👨‍🏫' : '🎓';
            let subtitle = user.role === 'admin' ? 'ผู้ดูแลระบบ' : user.role === 'teacher' ? 'ครู' : 'นักเรียน';
            if (user.class) subtitle += ` | ชั้น: ${user.class}`;
            return `
                <div class="user-card" data-role="${user.role}">
                    <div class="user-info-card">
                        <div class="user-avatar">${roleIcon}</div>
                        <div class="user-details">
                            <h4>${user.name}</h4><p>${subtitle}</p><p style="font-size:0.85rem; color:var(--text-light);">${user.email || '-'}</p>
                        </div>
                    </div>
                    <div class="user-actions">
                        ${user.id !== 'admin' ? `<button class="btn btn-sm btn-danger" onclick="deleteUser('${id}')">🗑️ ลบ</button>` : ''}
                    </div>
                </div>`;
        }).join('');
        usersList.innerHTML = userCards;
    } catch(e) {}
}

function filterUsers(role) {
    document.querySelectorAll('#tabContent .nav-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    document.querySelectorAll('.user-card').forEach(card => {
        card.style.display = (role === 'all' || card.dataset.role === role) ? 'flex' : 'none';
    });
}

function showAddUserModal() {
    document.getElementById('userForm').reset();
    document.getElementById('newUsername').readOnly = false;
    document.getElementById('userModal').classList.add('active');
}

document.getElementById('userForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('newUsername').value;
    const name = document.getElementById('newName').value;
    const email = document.getElementById('newEmail').value;
    const role = document.getElementById('newRole').value;
    const password = document.getElementById('newPassword').value;
    
    if (!username || !name || !role || !password) return showNotification('กรอกข้อมูลให้ครบ', 'error');
    
    const userData = { username, name, email, role, password: hashPassword(password), createdAt: new Date().toISOString() };
    if (role === 'student') {
        userData.class = document.getElementById('newClass').value;
        userData.studentId = document.getElementById('newStudentId').value;
    }
    
    if (await saveToDatabase('users', username, userData)) {
        showNotification('เพิ่มผู้ใช้เรียบร้อย', 'success');
        document.getElementById('userModal').classList.remove('active');
        loadUsersList();
    }
});

function handleRoleChange() {
    const role = document.getElementById('newRole').value;
    document.getElementById('studentFields').classList.toggle('hidden', role !== 'student');
}

async function deleteUser(userId) {
    if (confirm('ลบผู้ใช้นี้ใช่ไหม?') && await deleteFromDatabase('users', userId)) {
        showNotification('ลบสำเร็จ', 'success');
        loadUsersList();
    }
}

async function loadSubjects() {
    const content = document.getElementById('tabContent');
    content.innerHTML = `
        <div class="card">
            <div class="card-header"><h3 class="card-title">📚 จัดการรายวิชา</h3>
            ${currentUserData.role === 'admin' ? `<button class="btn btn-success" onclick="document.getElementById('subjectModal').classList.add('active'); loadTeachersToSelect();">➕ เพิ่มวิชาใหม่</button>` : ''}
            </div>
            <div id="subjectsList"><div style="text-align: center; padding: 40px 0;"><p>กำลังโหลดข้อมูล...</p></div></div>
        </div>`;
    await loadSubjectsList();
}

async function loadSubjectsList() {
    const subjects = await getFromDatabase('subjects');
    const subjectsList = document.getElementById('subjectsList');
    if (!subjects) { subjectsList.innerHTML = `<p style="text-align:center;">ไม่พบข้อมูลวิชา</p>`; return; }
    
    let subjectCards = '';
    Object.entries(subjects).forEach(([id, subject]) => {
        if (currentUserData.role === 'admin' || (currentUserData.role === 'teacher' && subject.teacher === currentUserData.name)) {
            subjectCards += `
                <div class="user-card">
                    <div class="user-info-card">
                        <div class="user-avatar">📚</div>
                        <div class="user-details">
                            <h4>${subject.name}</h4><p>ครูผู้สอน: ${subject.teacher} | ชั้น: ${subject.class}</p>
                        </div>
                    </div>
                    <div class="user-actions">
                        ${currentUserData.role === 'admin' ? `<button class="btn btn-sm btn-danger" onclick="deleteSubject('${id}')">🗑️ ลบ</button>` : ''}
                    </div>
                </div>`;
        }
    });
    subjectsList.innerHTML = subjectCards || '<p style="text-align:center;">ไม่มีวิชาที่เกี่ยวข้อง</p>';
}

async function loadTeachersToSelect() {
    const users = await getFromDatabase('users');
    const teacherSelect = document.getElementById('subjectTeacher');
    teacherSelect.innerHTML = '<option value="">เลือกครูผู้สอน</option>';
    if (users) {
        Object.values(users).forEach(user => {
            if (user.role === 'teacher') teacherSelect.innerHTML += `<option value="${user.name}">${user.name}</option>`;
        });
    }
}

document.getElementById('subjectForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('subjectName').value;
    const teacher = document.getElementById('subjectTeacher').value;
    const cls = document.getElementById('subjectClass').value;
    if(!name || !teacher || !cls) return showNotification('กรอกข้อมูลให้ครบ', 'error');
    
    const id = generateId();
    if(await saveToDatabase('subjects', id, {name, teacher, class: cls})) {
        showNotification('เพิ่มวิชาสำเร็จ', 'success');
        document.getElementById('subjectModal').classList.remove('active');
        loadSubjectsList();
    }
});

async function deleteSubject(id) {
    if (confirm('ลบวิชานี้ใช่ไหม?') && await deleteFromDatabase('subjects', id)) {
        showNotification('ลบสำเร็จ', 'success');
        loadSubjectsList();
    }
}

// ---------------- LOGIN & INIT ----------------
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    
    const loginBtn = document.getElementById('loginButton');
    loginBtn.disabled = true; document.getElementById('loginText').classList.add('hidden'); document.getElementById('loginSpinner').classList.remove('hidden');

    try {
        if (await login(username, password, role)) {
            showNotification('เข้าสู่ระบบสำเร็จ! 🎉', 'success');
            document.getElementById('userName').textContent = currentUserData.name;
            document.getElementById('userRole').textContent = currentUserData.role === 'admin' ? 'ผู้ดูแลระบบ' : currentUserData.role === 'teacher' ? 'ครู' : 'นักเรียน';
            generateTabs();
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('dashboardSection').classList.add('active');
            loadDashboard();
        } else {
            showNotification('ชื่อผู้ใช้ รหัสผ่าน หรือบทบาทไม่ถูกต้อง', 'error');
        }
    } finally {
        loginBtn.disabled = false; document.getElementById('loginText').classList.remove('hidden'); document.getElementById('loginSpinner').classList.add('hidden');
    }
});

document.addEventListener('click', e => { if (e.target.classList.contains('modal')) e.target.classList.remove('active'); });
document.addEventListener('DOMContentLoaded', initializeDefaultUsers);