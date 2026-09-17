// ============================================
// GENERA TECH HUB - AUTHENTICATION SYSTEM
// ============================================
// Handles Login, Signup, Password Reset, and Session Management
// ============================================

// ============================================
// 1. DOCUMENT READY
// ============================================

function initializeAuth() {
    if (window.generaAuthInitialized) return;
    window.generaAuthInitialized = true;
    console.log('🔐 Auth system initializing...');
    
    // Check which page we're on
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const resetForm = document.getElementById('resetForm');
    
    // Initialize forms
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    if (resetForm) {
        resetForm.addEventListener('submit', handlePasswordReset);
    }
    
    // Tab switching (Login/Signup tabs)
    initTabSwitching();
    
    // Check if user is already logged in
    checkAuthStatus();
    
    // Social login buttons (if available)
    initSocialLogin();
    
    // Password visibility toggle
    initPasswordToggle();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuth, { once: true });
} else {
    initializeAuth();
}

// ============================================
// 2. TAB SWITCHING (Login / Signup)
// ============================================

function initTabSwitching() {
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (!loginTab || !signupTab) return;
    
    // Check URL hash for signup
    if (window.location.hash === '#signup') {
        switchTab('signup');
    }
    
    loginTab.addEventListener('click', function(e) {
        e.preventDefault();
        switchTab('login');
    });
    
    signupTab.addEventListener('click', function(e) {
        e.preventDefault();
        switchTab('signup');
    });
}

function switchTab(tab) {
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginContainer = document.querySelector('.login-container');
    const signupContainer = document.querySelector('.signup-container');
    
    if (tab === 'login') {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        if (loginContainer) loginContainer.style.display = 'block';
        if (signupContainer) signupContainer.style.display = 'none';
        window.location.hash = '';
    } else {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.style.display = 'block';
        loginForm.style.display = 'none';
        if (signupContainer) signupContainer.style.display = 'block';
        if (loginContainer) loginContainer.style.display = 'none';
        window.location.hash = 'signup';
    }
}

// ============================================
// 3. LOGIN HANDLER
// ============================================

async function handleLogin(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Get form data
    const email = document.getElementById('loginEmail')?.value?.trim();
    const password = document.getElementById('loginPassword')?.value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    
    // Validate
    if (!email || !password) {
        showToast('⚠️ Please fill in all fields.', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showToast('⚠️ Please enter a valid email address.', 'error');
        return;
    }
    
    // Show loading
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Logging in...';
    
    try {
        // Check if Supabase auth is available
        if (typeof signInUser === 'undefined') {
            throw new Error('Authentication system not loaded. Please refresh the page.');
        }
        
        // Attempt login
        const result = await signInUser(email, password);
        
        if (result.success) {
            showToast('✅ Welcome back! Redirecting...', 'success');
            
            // Store session preference
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            } else {
                localStorage.removeItem('rememberMe');
            }
            
            // Redirect based on user role
            setTimeout(() => {
                const user = result.data?.user;
                if (user?.app_metadata?.role === 'admin' || user?.email === window.CEO_EMAIL) {
                    // CEO goes to admin panel
                    window.location.href = '/src/pages/admin/index.html';
                } else {
                    // Regular user goes to home
                    window.location.href = '/src/pages/index.html';
                }
            }, 1500);
            
        } else {
            showToast(`❌ ${result.error || 'Login failed. Please try again.'}`, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
        
    } catch (error) {
        console.error('❌ Login error:', error);
        showToast('❌ Something went wrong. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ============================================
// 4. SIGNUP HANDLER
// ============================================

async function handleSignup(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Get form data
    const fullName = document.getElementById('signupName')?.value?.trim();
    const email = document.getElementById('signupEmail')?.value?.trim();
    const phone = document.getElementById('signupPhone')?.value?.trim();
    const password = document.getElementById('signupPassword')?.value;
    const confirmPassword = document.getElementById('signupConfirmPassword')?.value;
    const termsChecked = document.getElementById('termsCheck')?.checked || false;
    
    // Validate
    if (!fullName || !email || !phone || !password || !confirmPassword) {
        showToast('⚠️ Please fill in all fields.', 'error');
        return;
    }
    
    if (fullName.length < 2) {
        showToast('⚠️ Please enter your full name.', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showToast('⚠️ Please enter a valid email address.', 'error');
        return;
    }
    
    if (!isValidPhone(phone)) {
        showToast('⚠️ Please enter a valid phone number.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('⚠️ Password must be at least 6 characters.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('⚠️ Passwords do not match.', 'error');
        return;
    }
    
    if (!termsChecked) {
        showToast('⚠️ Please accept the Terms & Conditions.', 'error');
        return;
    }
    
    // Show loading
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Creating account...';
    
    try {
        if (typeof signUpUser === 'undefined') {
            throw new Error('Authentication system not loaded. Please refresh the page.');
        }
        
        // Attempt signup
        const result = await signUpUser(email, password, fullName, phone);
        
        if (result.success) {
            showToast('✅ Account created successfully! Please check your email for verification.', 'success');
            
            // Send welcome WhatsApp message (optional)
            sendWelcomeWhatsApp(fullName, phone);
            
            // Reset form
            form.reset();
            
            // Switch to login tab after 2 seconds
            setTimeout(() => {
                switchTab('login');
                // Pre-fill email
                document.getElementById('loginEmail').value = email;
                showToast('✅ Please login with your credentials.', 'info');
            }, 2000);
            
        } else {
            showToast(`❌ ${result.error || 'Signup failed. Please try again.'}`, 'error');
        }
        
    } catch (error) {
        console.error('❌ Signup error:', error);
        showToast('❌ Something went wrong. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ============================================
// 5. PASSWORD RESET
// ============================================

async function handlePasswordReset(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    const email = document.getElementById('resetEmail')?.value?.trim();
    
    if (!email || !isValidEmail(email)) {
        showToast('⚠️ Please enter a valid email address.', 'error');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Sending...';
    
    try {
        if (typeof supabase === 'undefined') {
            throw new Error('System not ready. Please refresh.');
        }
        
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/src/pages/reset-password.html'
        });
        
        if (error) throw error;
        
        showToast('✅ Password reset link sent to your email!', 'success');
        form.reset();
        
    } catch (error) {
        console.error('❌ Reset password error:', error);
        showToast(`❌ ${error.message || 'Something went wrong. Please try again.'}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ============================================
// 6. CHECK AUTH STATUS
// ============================================

async function checkAuthStatus() {
    try {
        if (typeof getCurrentUser === 'undefined') return;
        
        const result = await getCurrentUser();
        
        if (result.success && result.user) {
            // User is logged in
            const user = result.user;
            const name = user.user_metadata?.full_name || user.email;
            
            // Update UI for logged-in user
            updateUIForLoggedInUser(name);
            
            // Check if on login page, redirect if needed
            const currentPage = window.location.pathname;
            if (currentPage.includes('login.html') || currentPage.includes('signup.html')) {
                // Don't redirect if on login page
                // We'll let the user decide to logout
            }
            
            // Check if admin
            const isAdmin = user.app_metadata?.role === 'admin' ||
                String(user.email || '').trim().toLowerCase() === String(window.CEO_EMAIL || '').trim().toLowerCase();
            if (isAdmin) {
                document.body.classList.add('ceo-logged-in');
                // Show admin link in nav if not on admin page
                const navLinks = document.querySelector('.nav-links');
                if (navLinks && !window.location.pathname.includes('admin')) {
                    const adminLink = document.createElement('a');
                    adminLink.href = '/src/pages/admin/index.html';
                    adminLink.textContent = '👑 Admin';
                    adminLink.className = 'cta-nav';
                    navLinks.appendChild(adminLink);
                }
            }
            
            console.log('✅ User logged in:', user.email);
            
        } else {
            // User is not logged in
            updateUIForLoggedOutUser();
            console.log('👤 User not logged in');
        }
    } catch (error) {
        console.error('❌ Auth status check error:', error);
    }
}

// ============================================
// 7. UI UPDATES
// ============================================

function updateUIForLoggedInUser(name) {
    // Update auth buttons
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
        authButtons.innerHTML = `
            <span style="color: var(--gold); font-weight: 500; font-size: 0.9rem;">👋 ${name}</span>
            <a href="#" onclick="handleLogout(event)" class="btn btn-secondary" style="padding: 0.4rem 1rem; font-size: 0.85rem;">Logout</a>
        `;
    }
    
    // Hide login/signup links in nav
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.textContent.includes('Login') || link.textContent.includes('Sign Up')) {
            link.style.display = 'none';
        }
    });
}

function updateUIForLoggedOutUser() {
    // Auth buttons should already show login/signup
    // This is handled by main.js
}

// ============================================
// 8. SOCIAL LOGIN (Optional)
// ============================================

function initSocialLogin() {
    const googleBtn = document.getElementById('googleLogin');
    const githubBtn = document.getElementById('githubLogin');
    
    if (googleBtn) {
        googleBtn.addEventListener('click', function() {
            handleSocialLogin('google');
        });
    }
    
    if (githubBtn) {
        githubBtn.addEventListener('click', function() {
            handleSocialLogin('github');
        });
    }
}

async function handleSocialLogin(provider) {
    try {
        if (typeof supabase === 'undefined') {
            showToast('⚠️ System not ready. Please refresh.', 'error');
            return;
        }
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: window.location.origin + '/src/pages/index.html'
            }
        });
        
        if (error) throw error;
        
        showToast(`✅ Redirecting to ${provider}...`, 'success');
        
    } catch (error) {
        console.error('❌ Social login error:', error);
        showToast(`❌ ${error.message || 'Social login failed. Please try again.'}`, 'error');
    }
}

// ============================================
// 9. PASSWORD VISIBILITY TOGGLE
// ============================================

function initPasswordToggle() {
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            if (input) {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                this.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
            }
        });
    });
}

// ============================================
// 10. VALIDATION HELPERS
// ============================================

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
    // Nigerian phone numbers: 080, 081, 070, 090, etc.
    return /^(0|\+234)?[789][01]\d{8}$/.test(phone.replace(/\s/g, ''));
}

// ============================================
// 11. WHATSAPP WELCOME MESSAGE
// ============================================

function sendWelcomeWhatsApp(name, phone) {
    const message = `
👋 WELCOME TO GENERA TECH HUB!

Thank you for creating an account, ${name}!

🎉 Here's what you can do:
- 🛍️ Browse and purchase devices
- 🔧 Book repair services
- 🔄 Trade-in your old devices
- ⭐ Leave reviews

We're excited to have you as part of our community!

💬 Chat with us anytime for assistance.
📞 Phone: ${phone}

---
🔗 From: generatechhub.com/signup
📅 ${new Date().toLocaleDateString('en-NG')}
    `;
    
    // Send to WhatsApp (CEO gets notified of new signup)
    setTimeout(() => {
        if (typeof openWhatsApp !== 'undefined') {
            openWhatsApp(message);
        }
    }, 3000);
}

// ============================================
// 12. LOGOUT FUNCTION
// ============================================

async function handleLogout(event) {
    if (event) event.preventDefault();
    
    if (typeof signOutUser === 'undefined') {
        showToast('⚠️ Logout function not available. Please refresh.', 'error');
        return;
    }
    
    try {
        const result = await signOutUser();
        
        if (result.success) {
            showToast('👋 Logged out successfully!', 'success');
            
            // Clear local storage
            localStorage.removeItem('rememberMe');
            
            // Redirect to home after delay
            setTimeout(() => {
                window.location.href = '/src/pages/index.html';
            }, 1000);
            
        } else {
            showToast(`❌ ${result.error || 'Logout failed. Please try again.'}`, 'error');
        }
    } catch (error) {
        console.error('❌ Logout error:', error);
        showToast('❌ Something went wrong. Please try again.', 'error');
    }
}

// ============================================
// 13. SESSION MANAGEMENT
// ============================================

// Auto-refresh session
function refreshSession() {
    // Supabase handles this automatically
    // But we can check periodically if needed
}

// Check if user is admin
async function checkAdminAccess() {
    try {
        if (typeof isAdminUser === 'undefined') return false;
        return await isAdminUser();
    } catch (error) {
        console.error('❌ Admin check error:', error);
        return false;
    }
}

// ============================================
// 14. EXPOSE FUNCTIONS GLOBALLY
// ============================================

window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handlePasswordReset = handlePasswordReset;
window.handleLogout = handleLogout;
window.switchTab = switchTab;
window.checkAuthStatus = checkAuthStatus;
window.checkAdminAccess = checkAdminAccess;
window.sendWelcomeWhatsApp = sendWelcomeWhatsApp;

console.log('✅ Genera Tech Hub: Auth.js loaded successfully!');
console.log('🔐 Authentication system ready!');