/* ===== VIConnect Dashboard - Consolidated Script ===== */

// --- Constants ---
const INACTIVITY_TIMEOUT = 5 * 60 * 1000;
const WARNING_TIMEOUT    = 4 * 60 * 1000;
let inactivityTimer;
let warningTimer;

// --- Global user refs (set on DOMContentLoaded) ---
let userEmail = '';
let username  = '';
let activityThrottleTimer = null;

// ===================================================================
//  INACTIVITY & ACTIVITY TRACKING
// ===================================================================

function updateLastActivity() {
    if (!userEmail) return;
    startInactivityTimer();
    // Throttle API calls to once per 30 seconds
    if (activityThrottleTimer) return;
    activityThrottleTimer = setTimeout(() => { activityThrottleTimer = null; }, 30000);
    fetch('/api/update-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
    }).catch(err => console.error('Activity update error:', err));
}

function startInactivityTimer() {
    clearTimeout(inactivityTimer);
    clearTimeout(warningTimer);

    warningTimer = setTimeout(() => {
        Swal.fire({
            title: 'Inactivity Warning',
            text: 'You will be logged out in 1 minute due to inactivity.',
            icon: 'warning',
            confirmButtonText: 'Keep me logged in',
            timer: 60000,
            timerProgressBar: true,
            allowOutsideClick: false
        }).then(result => { if (result.isConfirmed) updateLastActivity(); });
    }, WARNING_TIMEOUT);

    inactivityTimer = setTimeout(() => handleInactivityLogout(), INACTIVITY_TIMEOUT);
}

async function handleInactivityLogout() {
    if (!userEmail) return;
    try {
        await fetch('/api/update-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, isActive: false })
        });
    } catch (e) { /* best effort */ }

    localStorage.clear();
    Swal.fire({
        title: 'Session Expired',
        text: 'You have been logged out due to inactivity.',
        icon: 'info',
        confirmButtonText: 'OK'
    }).then(() => nav('/'));
}

function setupActivityTracking() {
    ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'].forEach(evt => {
        document.addEventListener(evt, updateLastActivity);
    });
}

// ===================================================================
//  LOGOUT
// ===================================================================

function confirmLogout(event) {
    event.preventDefault();
    Swal.fire({
        title: 'Confirm Logout',
        text: 'Are you sure you want to log out?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, log out',
        cancelButtonText: 'Cancel'
    }).then(result => {
        if (!result.isConfirmed) return;
        if (userEmail) {
            fetch('/api/update-activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, isActive: false })
            }).catch(() => {});
        }
        clearTimeout(inactivityTimer);
        clearTimeout(warningTimer);
        localStorage.clear();

        Swal.fire({
            title: 'Logged Out',
            text: 'Thank you for using the website!',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        }).then(() => nav('/'));
    });
}

// ===================================================================
//  NAVIGATION
// ===================================================================

function nav(url) {
    if (window.vitNavigate) window.vitNavigate(url);
    else window.location.href = url;
}

function openCgpaCalculator() { nav('CGPA/index.html'); }
function openChatbot()        { nav('ai-chat/public/index.html'); }
function openHostel()         { nav('Hostel/index.html'); }
function openmap()            { nav('Google map/index.html'); }
function playo()              { nav('Sports registration/index.html'); }
function openCommunity()      { nav('community/index.html'); }

function showSection(section) {
    const routes = {
        chatbot:   'ai-chat/public/index.html',
        community: 'community/index.html'
    };
    if (routes[section]) nav(routes[section]);
}

// ===================================================================
//  SETTINGS
// ===================================================================

function openSettings() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    Swal.fire({
        title: 'Settings',
        html: `
            <div class="settings-form">
                <div class="form-group">
                    <h3>Profile Settings</h3>
                    <label>Current Email: ${userEmail}</label>
                    <label>Current Username: ${username || userEmail}</label>
                    <input type="text" id="newUsername" class="swal2-input" placeholder="New Username">
                </div>
                <div class="form-group">
                    <h3>Password Settings</h3>
                    <input type="password" id="currentPassword" class="swal2-input" placeholder="Current Password">
                    <input type="password" id="newPassword" class="swal2-input" placeholder="New Password">
                    <input type="password" id="confirmPassword" class="swal2-input" placeholder="Confirm New Password">
                </div>
                <div class="form-group">
                    <h3>Theme Settings</h3>
                    <label class="theme-toggle">
                        <input type="checkbox" id="darkMode" ${isDarkMode ? 'checked' : ''}>
                        Dark Mode
                    </label>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Save Changes',
        confirmButtonColor: '#6200ea',
        cancelButtonText: 'Cancel',
        preConfirm: async () => {
            try {
                const newUser = document.getElementById('newUsername').value;
                const curPwd  = document.getElementById('currentPassword').value;
                const newPwd  = document.getElementById('newPassword').value;
                const cfmPwd  = document.getElementById('confirmPassword').value;
                const dark    = document.getElementById('darkMode').checked;

                if (curPwd || newPwd || cfmPwd) {
                    if (!curPwd || !newPwd || !cfmPwd) { Swal.showValidationMessage('All password fields are required'); return false; }
                    if (newPwd !== cfmPwd)             { Swal.showValidationMessage('New passwords do not match');        return false; }
                    const r = await fetch('/api/change-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: userEmail, currentPassword: curPwd, newPassword: newPwd })
                    });
                    const d = await r.json();
                    if (!d.success) throw new Error(d.message);
                }

                if (newUser) {
                    const r = await fetch('/api/update-username', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: userEmail, newUsername: newUser })
                    });
                    const d = await r.json();
                    if (!d.success) throw new Error(d.message);
                    localStorage.setItem('username', newUser);
                }

                localStorage.setItem('darkMode', dark);
                return { passwordChanged: Boolean(curPwd && newPwd), usernameChanged: Boolean(newUser), darkMode: dark };
            } catch (err) {
                Swal.showValidationMessage('Failed: ' + err.message);
                return false;
            }
        }
    }).then(result => {
        if (!result.isConfirmed) return;
        setTheme(result.value.darkMode);

        if (result.value.passwordChanged) {
            Swal.fire({ icon: 'success', title: 'Settings Updated', text: 'Please log in again with your new password.', confirmButtonColor: '#6200ea' })
                .then(() => { localStorage.clear(); nav('/'); });
        } else {
            Swal.fire({ icon: 'success', title: 'Settings Updated', text: 'Your changes have been saved.', confirmButtonColor: '#6200ea' })
                .then(() => { if (result.value.usernameChanged) location.reload(); });
        }
    });
}

// ===================================================================
//  THEME
// ===================================================================

function toggleTheme(event) {
    event.preventDefault();
    setTheme(localStorage.getItem('darkMode') !== 'true');
}

function setTheme(isDark) {
    localStorage.setItem('darkMode', isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    const darkIcon  = document.querySelector('.dark-icon');
    const lightIcon = document.querySelector('.light-icon');
    if (darkIcon && lightIcon) {
        darkIcon.style.display  = isDark ? 'none' : 'inline-block';
        lightIcon.style.display = isDark ? 'inline-block' : 'none';
    }
}

// ===================================================================
//  PANEL TOGGLE
// ===================================================================

function togglePanel() {
    const panel = document.getElementById('sidePanel');
    const main  = document.querySelector('.main-content');
    panel.classList.toggle('collapsed');
    main.classList.toggle('shifted');
    localStorage.setItem('panelCollapsed', panel.classList.contains('collapsed'));
}

// ===================================================================
//  AVATAR GENERATOR
// ===================================================================

function generateInitialsAvatar(name) {
    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d');
    canvas.width = canvas.height = 200;

    const colors = ['#1abc9c','#2ecc71','#3498db','#9b59b6','#34495e','#16a085','#27ae60','#2980b9','#8e44ad','#2c3e50'];
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.fillRect(0, 0, 200, 200);

    const initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    ctx.font = 'bold 80px Inter, Arial';
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, 100, 100);
    return canvas.toDataURL('image/png');
}

// ===================================================================
//  GREETING & DATE
// ===================================================================

function updateGreeting() {
    const greetEl = document.getElementById('greetingText');
    const subEl   = document.getElementById('welcomeSubtext');
    const dateEl  = document.getElementById('currentDate');
    if (!greetEl) return;

    const hour = new Date().getHours();
    const name = localStorage.getItem('username') || 'Student';
    let greeting = 'Good Evening', emoji = '\uD83C\uDF19';
    if (hour < 12)      { greeting = 'Good Morning';   emoji = '\u2600\uFE0F'; }
    else if (hour < 17) { greeting = 'Good Afternoon';  emoji = '\uD83C\uDF24\uFE0F'; }

    greetEl.textContent = greeting + ', ' + name + '! ' + emoji;
    if (subEl) subEl.textContent = "Welcome back! Here's your campus overview.";
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// ===================================================================
//  SINGLE DOMContentLoaded
// ===================================================================

document.addEventListener('DOMContentLoaded', async function () {
    // -- Globals --
    userEmail = localStorage.getItem('userEmail') || '';
    username  = localStorage.getItem('username')  || '';

    // -- Theme --
    if (localStorage.getItem('darkMode') === null) localStorage.setItem('darkMode', 'false');
    setTheme(localStorage.getItem('darkMode') === 'true');

    // -- Greeting --
    updateGreeting();

    // -- Panel state --
    if (localStorage.getItem('panelCollapsed') === 'true') {
        document.getElementById('sidePanel').classList.add('collapsed');
        document.querySelector('.main-content').classList.add('shifted');
    }

    // -- Nav tooltips --
    document.querySelectorAll('.nav-item').forEach(item => {
        var span = item.querySelector('span');
        if (span) item.setAttribute('title', span.textContent);
    });

    // -- Profile --
    var profilePic    = document.getElementById('profilePic');
    var userNameEl    = document.getElementById('userEmail');
    var profileUpload = document.getElementById('profileUpload');

    if (userNameEl) userNameEl.textContent = username || userEmail || 'User';

    try {
        var res  = await fetch('/api/user-profile?email=' + encodeURIComponent(userEmail));
        var data = await res.json();
        if (data.success && data.profilePic) {
            profilePic.src = data.profilePic;
        } else {
            profilePic.src = generateInitialsAvatar(username || userEmail);
        }
    } catch (e) {
        profilePic.src = generateInitialsAvatar(username || userEmail);
    }

    // -- Profile upload --
    if (profileUpload) {
        profileUpload.addEventListener('change', async function (e) {
            var file = e.target.files[0];
            if (!file) return;
            if (file.size > 5000000) {
                Swal.fire({ icon: 'error', title: 'File Too Large', text: 'Please choose an image under 5 MB', confirmButtonColor: '#6200ea' });
                return;
            }
            var reader = new FileReader();
            reader.onload = async function (ev) {
                try {
                    var imgData = ev.target.result;
                    var r = await fetch('/api/update-profile-pic', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: userEmail, profilePic: imgData })
                    });
                    var d = await r.json();
                    if (d.success) {
                        profilePic.src = imgData;
                        localStorage.setItem('profilePic', imgData);
                        Swal.fire({ icon: 'success', title: 'Profile Updated!', confirmButtonColor: '#6200ea' });
                    } else { throw new Error(d.message); }
                } catch (err) {
                    Swal.fire({ icon: 'error', title: 'Update Failed', text: 'Please try again.', confirmButtonColor: '#6200ea' });
                }
            };
            reader.readAsDataURL(file);
        });
    }

    // -- Activity tracking --
    if (userEmail) {
        setupActivityTracking();
        startInactivityTimer();
        updateLastActivity();
    }
});
