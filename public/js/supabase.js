// ============================================
// GENERA TECH HUB - SUPABASE CONNECTION
// ============================================
// Complete with: Auth, Products, Repairs, Reviews,
// Contact, Admin, Analytics, Activity, Image Upload
// ============================================

// ============================================
// 1. SUPABASE CONFIGURATION
// ============================================

var SUPABASE_URL = 'https://ofrvakghmlyidtelenib.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcnZha2dobWx5aWR0ZWxlbmliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTEwNTUsImV4cCI6MjEwNDA2NzA1NX0.r5ZgBb68YmKHlB0CnWfIP09YY5ehPt-A0-HWmxcWLvU';

var CEO_EMAIL = 'mudasirumukthar@gmail.com';
var WHATSAPP_NUMBER = '08081302228';

function getSitePath(path) {
    return `/src/pages/${String(path).replace(/^\//, '')}`;
}

function redirectToPage(path) {
    window.location.assign(getSitePath(path));
}

function getNormalisedWhatsAppNumber() {
    const digits = WHATSAPP_NUMBER.replace(/\D/g, '');
    return digits.startsWith('234') ? digits : `234${digits.replace(/^0/, '')}`;
}

function getAuthRedirectUrl() {
    return `${window.location.origin}/src/pages/login.html`;
}

function getSupabaseErrorMessage(error) {
    const message = String(error?.message || '').toLowerCase();
    if (message.includes('user already registered') || message.includes('already been registered')) {
        return 'This email is already registered. Use Login or reset your password.';
    }
    if (message.includes('password')) {
        return error.message;
    }
    if (message.includes('email provider') || message.includes('email confirmations')) {
        return 'Supabase email confirmation is not configured correctly. Check Authentication > Providers > Email.';
    }
    if (message.includes('rate limit') || message.includes('too many requests')) {
        return 'Supabase temporarily limited signup attempts. Wait a few minutes and try again.';
    }
    if (message.includes('database error') || message.includes('trigger')) {
        return 'Supabase could not save the new account. Check your Auth database triggers and profiles table.';
    }
    if (message.includes('fetch') || message.includes('network')) {
        return 'Supabase could not be reached. Check your internet connection and Supabase project status.';
    }
    return error?.message || 'Unable to create your account.';
}

// ============================================
// 2. INITIALIZE SUPABASE CLIENT
// ============================================

(function initializeSupabaseClient() {
    if (window.supabaseClient && typeof window.supabaseClient.auth === 'object') {
        console.log('ℹ️ Supabase client already initialized');
        return;
    }

    if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function') {
        console.error('❌ Supabase SDK not loaded. Add this BEFORE supabase.js:');
        console.error('   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
        return;
    }

    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    console.log('✅ Supabase client initialized');
    console.log('📍 Project:', SUPABASE_URL);
    console.log('👑 CEO Email:', CEO_EMAIL);
    console.log('💬 WhatsApp:', WHATSAPP_NUMBER);
    console.log('🔑 Auth ready:', typeof window.supabaseClient.auth === 'object');
})();

var supabaseClient = window.supabaseClient;

// ============================================
// 3. AUTHENTICATION FUNCTIONS
// ============================================

async function signUpUser(email, password, fullName, phone) {
    try {
        const normalizedEmail = email.trim().toLowerCase();
        const { data, error } = await supabaseClient.auth.signUp({
            email: normalizedEmail,
            password: password,
            options: {
                emailRedirectTo: getAuthRedirectUrl(),
                data: {
                    full_name: fullName,
                    phone: phone.trim(),
                    role: 'customer'
                }
            }
        });
        if (error) throw error;

        // Log signup activity
        await logActivity({
            activity_type: 'user_signup',
            activity_title: `New user: ${fullName}`,
            activity_description: `${normalizedEmail} just signed up`,
            user_email: normalizedEmail,
            user_name: fullName
        });

        return { success: true, data: data };
    } catch (error) {
        const message = getSupabaseErrorMessage(error);
        console.error('Sign up error:', error);
        return { success: false, error: message };
    }
}

async function signInUser(email, password) {
    try {
        const normalizedEmail = String(email || '').trim().toLowerCase();
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: normalizedEmail,
            password: password
        });
        if (error) throw error;
        return { success: true, data: data };
    } catch (error) {
        console.error('❌ Sign in error:', error.message);
        return { success: false, error: error.message };
    }
}

async function signOutUser() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('❌ Sign out error:', error.message);
        return { success: false, error: error.message };
    }
}

async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error) throw error;
        return { success: true, user: user };
    } catch (error) {
        if (error?.message === 'Auth session missing!') {
            return { success: true, user: null };
        }
        console.error('❌ Get user error:', error.message);
        return { success: false, error: error.message };
    }
}

function isCeoEmail(email) {
    const normalized = String(email || '').trim().toLowerCase();
    const configured = String(CEO_EMAIL || '').trim().toLowerCase();
    return Boolean(configured) && normalized === configured;
}

async function isAdminUser() {
    const status = await getAdminAccessStatus();
    return status.isAdmin;
}

async function getAdminAccessStatus() {
    try {
        const { data: sessionData } = await supabaseClient.auth.getSession();
        if (!sessionData?.session) {
            return { isAdmin: false, user: null, role: null, reason: 'no-session' };
        }

        const { error: refreshError } = await supabaseClient.auth.refreshSession();
        const userResult = await getCurrentUser();
        if (!userResult.success || !userResult.user) {
            return { isAdmin: false, user: null, role: null, reason: 'user-unavailable', refreshError: refreshError?.message || null };
        }

        const user = userResult.user;
        const emailMatch = isCeoEmail(user.email);
        const appMetaRole = String(user.app_metadata?.role || '').trim().toLowerCase();
        const isAdmin = emailMatch || appMetaRole === 'admin';

        return {
            isAdmin,
            user,
            role: appMetaRole || null,
            configuredEmail: CEO_EMAIL,
            sessionEmail: user.email,
            emailMatch,
            reason: isAdmin ? 'admin' : 'not-admin',
            refreshError: refreshError?.message || null
        };
    } catch (error) {
        console.error('Admin status error:', error);
        return { isAdmin: false, user: null, role: null, reason: 'error', error: error.message };
    }
}

// ============================================
// 4. PRODUCT FUNCTIONS
// ============================================

async function getProducts(filters = {}) {
    try {
        let query = supabaseClient
            .from('products')
            .select('*')
            .eq('is_available', true)
            .order('created_at', { ascending: false });

        if (filters.category) query = query.eq('category', filters.category);
        if (filters.brand) query = query.eq('brand', filters.brand);
        if (filters.minPrice) query = query.gte('price', parseFloat(filters.minPrice));
        if (filters.maxPrice) query = query.lte('price', parseFloat(filters.maxPrice));
        if (filters.search) query = query.ilike('name', `%${filters.search}%`);

        const { data, error } = await query;
        if (error) throw error;
        return { success: true, products: data || [] };
    } catch (error) {
        console.error('❌ Get products error:', error.message);
        return { success: false, error: error.message, products: [] };
    }
}

async function getProductById(productId) {
    try {
        const { data, error } = await supabaseClient
            .from('products').select('*').eq('id', productId).single();
        if (error) throw error;
        return { success: true, product: data };
    } catch (error) {
        console.error('❌ Get product error:', error.message);
        return { success: false, error: error.message };
    }
}

async function getFeaturedProducts(limit = 4) {
    try {
        const { data, error } = await supabaseClient
            .from('products').select('*')
            .eq('is_featured', true).eq('is_available', true).limit(limit);
        if (error) throw error;
        return { success: true, products: data || [] };
    } catch (error) {
        console.error('❌ Get featured error:', error.message);
        return { success: false, error: error.message, products: [] };
    }
}

// ============================================
// 5. REPAIR FUNCTIONS
// ============================================

async function submitRepairRequest(repairData) {
    try {
        const { data, error } = await supabaseClient
            .from('repair_requests')
            .insert([{
                device_type: repairData.deviceType,
                device_brand: repairData.deviceBrand,
                device_model: repairData.deviceModel,
                issue_description: repairData.issueDescription,
                urgency: repairData.urgency || 'standard',
                service_type: repairData.serviceType || 'walk-in',
                preferred_date: repairData.preferredDate || null,
                preferred_time: repairData.preferredTime || null,
                customer_name: repairData.customerName,
                customer_phone: repairData.customerPhone,
                customer_email: repairData.customerEmail || null,
                status: 'pending',
                user_id: repairData.userId || null
            }])
            .select();
        if (error) throw error;

        // Auto-log activity
        await logActivity({
            activity_type: 'repair_booked',
            activity_title: `Repair booked: ${repairData.deviceBrand || ''} ${repairData.deviceModel || ''}`.trim(),
            activity_description: `${repairData.customerName} booked a repair - ${repairData.issueDescription?.substring(0, 60) || ''}`,
            user_email: repairData.customerEmail || null,
            user_name: repairData.customerName,
            related_id: data?.[0]?.id,
            related_table: 'repair_requests'
        });

        return { success: true, data: data };
    } catch (error) {
        console.error('❌ Submit repair error:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================
// 6. REVIEW FUNCTIONS
// ============================================

async function submitReview(reviewData) {
    try {
        const { data, error } = await supabaseClient
            .from('reviews')
            .insert([{
                rating: reviewData.rating,
                review_text: reviewData.reviewText,
                device_service: reviewData.deviceService || null,
                customer_name: reviewData.customerName || 'Anonymous',
                is_approved: false,
                user_id: reviewData.userId || null
            }])
            .select();
        if (error) throw error;

        // Auto-log activity
        await logActivity({
            activity_type: 'review_submitted',
            activity_title: `New ${reviewData.rating}-star review`,
            activity_description: `${reviewData.customerName || 'Anonymous'}: "${reviewData.reviewText?.substring(0, 60) || ''}..."`,
            user_name: reviewData.customerName || 'Anonymous',
            related_id: data?.[0]?.id,
            related_table: 'reviews'
        });

        return { success: true, data: data };
    } catch (error) {
        console.error('❌ Submit review error:', error.message);
        return { success: false, error: error.message };
    }
}

async function getApprovedReviews(limit = 10) {
    try {
        const { data, error } = await supabaseClient
            .from('reviews').select('*')
            .eq('is_approved', true)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return { success: true, reviews: data || [] };
    } catch (error) {
        console.error('❌ Get reviews error:', error.message);
        return { success: false, error: error.message, reviews: [] };
    }
}

// ============================================
// 7. CONTACT FUNCTIONS
// ============================================

async function submitContactMessage(messageData) {
    try {
        const { data, error } = await supabaseClient
            .from('contact_messages')
            .insert([{
                name: messageData.name,
                phone: messageData.phone,
                email: messageData.email || null,
                subject: messageData.subject || 'General Inquiry',
                message: messageData.message,
                status: 'unread',
                user_id: messageData.userId || null
            }])
            .select();
        if (error) throw error;

        // Auto-log activity
        await logActivity({
            activity_type: 'contact_message',
            activity_title: `Contact: ${messageData.subject || 'New message'}`,
            activity_description: `${messageData.name} sent a message: "${messageData.message?.substring(0, 60) || ''}..."`,
            user_email: messageData.email || null,
            user_name: messageData.name,
            related_id: data?.[0]?.id,
            related_table: 'contact_messages'
        });

        return { success: true, data: data };
    } catch (error) {
        console.error('❌ Submit contact error:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================
// 8. ADMIN FUNCTIONS (CEO Only)
// ============================================

async function addProduct(productData) {
    try {
        const isAdmin = await isAdminUser();
        if (!isAdmin) return { success: false, error: 'Unauthorized - Admin access required' };

        const { data, error } = await supabaseClient
            .from('products')
            .insert([{
                name: productData.name,
                description: productData.description || '',
                price: parseFloat(productData.price),
                category: productData.category || 'Other',
                condition: productData.condition || 'New',
                brand: productData.brand || '',
                model: productData.model || '',
                storage: productData.storage || '',
                color: productData.color || '',
                stock_quantity: parseInt(productData.stockQuantity) || 0,
                is_featured: productData.isFeatured || false,
                is_available: productData.isAvailable !== false,
                image_urls: productData.imageUrls || []
            }])
            .select();
        if (error) throw error;

        await logActivity({
            activity_type: 'product_added',
            activity_title: `Product added: ${productData.name}`,
            activity_description: `CEO added a new product`,
            related_id: data?.[0]?.id,
            related_table: 'products'
        });

        return { success: true, data: data };
    } catch (error) {
        console.error('❌ Add product error:', error.message);
        return { success: false, error: error.message };
    }
}

async function updateProduct(productId, productData) {
    try {
        const isAdmin = await isAdminUser();
        if (!isAdmin) return { success: false, error: 'Unauthorized' };

        const { data, error } = await supabaseClient
            .from('products')
            .update({
                name: productData.name,
                description: productData.description,
                price: parseFloat(productData.price),
                category: productData.category,
                condition: productData.condition,
                brand: productData.brand,
                model: productData.model,
                storage: productData.storage,
                color: productData.color,
                stock_quantity: parseInt(productData.stockQuantity),
                is_featured: productData.isFeatured,
                is_available: productData.isAvailable,
                image_urls: productData.imageUrls,
                updated_at: new Date().toISOString()
            })
            .eq('id', productId)
            .select();
        if (error) throw error;
        return { success: true, data: data };
    } catch (error) {
        console.error('❌ Update product error:', error.message);
        return { success: false, error: error.message };
    }
}

async function deleteProduct(productId) {
    try {
        const isAdmin = await isAdminUser();
        if (!isAdmin) return { success: false, error: 'Unauthorized' };

        const { error } = await supabaseClient
            .from('products').delete().eq('id', productId);
        if (error) throw error;

        await logActivity({
            activity_type: 'product_deleted',
            activity_title: `Product deleted`,
            activity_description: `CEO removed a product`,
            related_id: productId,
            related_table: 'products'
        });

        return { success: true };
    } catch (error) {
        console.error('❌ Delete product error:', error.message);
        return { success: false, error: error.message };
    }
}

async function getRepairRequests() {
    try {
        const isAdmin = await isAdminUser();
        if (!isAdmin) return { success: false, error: 'Unauthorized', requests: [] };

        const { data, error } = await supabaseClient
            .from('repair_requests').select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return { success: true, requests: data || [] };
    } catch (error) {
        console.error('❌ Get repairs error:', error.message);
        return { success: false, error: error.message, requests: [] };
    }
}

async function getPendingReviews() {
    try {
        const isAdmin = await isAdminUser();
        if (!isAdmin) return { success: false, error: 'Unauthorized', reviews: [] };

        const { data, error } = await supabaseClient
            .from('reviews').select('*')
            .eq('is_approved', false)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return { success: true, reviews: data || [] };
    } catch (error) {
        console.error('❌ Get pending reviews error:', error.message);
        return { success: false, error: error.message, reviews: [] };
    }
}

async function approveReview(reviewId) {
    try {
        const isAdmin = await isAdminUser();
        if (!isAdmin) return { success: false, error: 'Unauthorized' };

        const { data, error } = await supabaseClient
            .from('reviews').update({ is_approved: true })
            .eq('id', reviewId).select();
        if (error) throw error;

        await logActivity({
            activity_type: 'review_approved',
            activity_title: `Review approved`,
            activity_description: `CEO approved a review`,
            related_id: reviewId,
            related_table: 'reviews'
        });

        return { success: true, data: data };
    } catch (error) {
        console.error('❌ Approve review error:', error.message);
        return { success: false, error: error.message };
    }
}

async function getContactMessages() {
    try {
        const isAdmin = await isAdminUser();
        if (!isAdmin) return { success: false, error: 'Unauthorized', messages: [] };

        const { data, error } = await supabaseClient
            .from('contact_messages').select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return { success: true, messages: data || [] };
    } catch (error) {
        console.error('❌ Get messages error:', error.message);
        return { success: false, error: error.message, messages: [] };
    }
}

async function markMessageRead(messageId) {
    try {
        const isAdmin = await isAdminUser();
        if (!isAdmin) return { success: false, error: 'Unauthorized' };

        const { data, error } = await supabaseClient
            .from('contact_messages').update({ status: 'read' })
            .eq('id', messageId).select();
        if (error) throw error;
        return { success: true, data: data };
    } catch (error) {
        console.error('❌ Mark message read error:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================
// 9. ANALYTICS & ACTIVITY TRACKING
// ============================================

// Get or create visitor ID
function getVisitorId() {
    let id = localStorage.getItem('gth_visitor_id');
    if (!id) {
        id = 'v_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now();
        localStorage.setItem('gth_visitor_id', id);
    }
    return id;
}

// Get or create session ID
function getSessionId() {
    let id = sessionStorage.getItem('gth_session_id');
    if (!id) {
        id = 's_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now();
        sessionStorage.setItem('gth_session_id', id);
    }
    return id;
}

// Detect device type
function getDeviceType() {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
    return 'desktop';
}

// Track page visit
async function trackVisit() {
    try {
        if (!supabaseClient || !supabaseClient.auth) return;

        // Skip tracking for admin page
        if (window.location.pathname.includes('/admin/')) return;

        const { error } = await supabaseClient.from('site_visits').insert([{
            visitor_id: getVisitorId(),
            session_id: getSessionId(),
            page_url: window.location.pathname,
            page_title: document.title,
            referrer: document.referrer || 'direct',
            user_agent: navigator.userAgent.substring(0, 500),
            device_type: getDeviceType()
        }]);

        if (error) console.warn('Visit tracking warning:', error.message);
        else console.log('📊 Visit tracked:', window.location.pathname);
    } catch (error) {
        console.warn('Analytics error:', error);
    }
}

// Track product view
async function trackProductView(productId, productName) {
    try {
        if (!supabaseClient || !supabaseClient.auth || !productId) return;

        await supabaseClient.from('product_views').insert([{
            product_id: productId,
            visitor_id: getVisitorId(),
            session_id: getSessionId()
        }]);

        await logActivity({
            activity_type: 'product_view',
            activity_title: `Viewed: ${productName || 'Product'}`,
            activity_description: `A visitor viewed ${productName || 'a product'}`,
            related_id: productId,
            related_table: 'products'
        });

        console.log('📦 Product view tracked:', productName);
    } catch (error) {
        console.warn('Product view tracking error:', error);
    }
}

// Universal activity logger
async function logActivity(data) {
    try {
        if (!supabaseClient || !supabaseClient.auth) return;

        const { error } = await supabaseClient.from('activity_logs').insert([{
            activity_type: data.activity_type,
            activity_title: data.activity_title,
            activity_description: data.activity_description || null,
            user_email: data.user_email || null,
            user_name: data.user_name || null,
            related_id: data.related_id || null,
            related_table: data.related_table || null,
            metadata: data.metadata || {}
        }]);

        if (error) console.warn('Activity log warning:', error.message);
        else console.log('📝 Activity logged:', data.activity_type);
    } catch (error) {
        console.warn('Activity log error:', error);
    }
}

// Get site visits (admin)
async function getSiteVisits(days = 7) {
    try {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);

        const { data, error } = await supabaseClient
            .from('site_visits')
            .select('*')
            .gte('created_at', fromDate.toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, visits: data || [] };
    } catch (error) {
        console.error('❌ Get visits error:', error.message);
        return { success: false, error: error.message, visits: [] };
    }
}

// Get activity logs (admin)
async function getActivityLogs(limit = 20) {
    try {
        const { data, error } = await supabaseClient
            .from('activity_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return { success: true, activities: data || [] };
    } catch (error) {
        console.error('❌ Get activity error:', error.message);
        return { success: false, error: error.message, activities: [] };
    }
}

// Get product views stats (admin)
async function getProductViewsStats() {
    try {
        const { data, error } = await supabaseClient
            .from('product_views')
            .select('product_id, products(name, image_urls)')
            .order('viewed_at', { ascending: false })
            .limit(200);

        if (error) throw error;

        const counts = {};
        (data || []).forEach(v => {
            if (!v.product_id) return;
            if (!counts[v.product_id]) {
                counts[v.product_id] = {
                    product_id: v.product_id,
                    product_name: v.products?.name || 'Unknown',
                    views: 0
                };
            }
            counts[v.product_id].views++;
        });

        const sorted = Object.values(counts).sort((a, b) => b.views - a.views);
        return { success: true, topProducts: sorted.slice(0, 5) };
    } catch (error) {
        console.error('❌ Product views error:', error.message);
        return { success: false, error: error.message, topProducts: [] };
    }
}

// Get dashboard stats (admin)
async function getDashboardStats() {
    try {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);

        const [todayCount, yesterdayCount, weekCount, monthCount, prodCount, repPending, msgUnread, revPending] = await Promise.all([
            supabaseClient.from('site_visits').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
            supabaseClient.from('site_visits').select('*', { count: 'exact', head: true }).gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString()),
            supabaseClient.from('site_visits').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
            supabaseClient.from('site_visits').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo.toISOString()),
            supabaseClient.from('products').select('*', { count: 'exact', head: true }),
            supabaseClient.from('repair_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabaseClient.from('contact_messages').select('*', { count: 'exact', head: true }).eq('status', 'unread'),
            supabaseClient.from('reviews').select('*', { count: 'exact', head: true }).eq('is_approved', false)
        ]);

        return {
            success: true,
            stats: {
                visitsToday: todayCount.count || 0,
                visitsYesterday: yesterdayCount.count || 0,
                visitsWeek: weekCount.count || 0,
                visitsMonth: monthCount.count || 0,
                totalProducts: prodCount.count || 0,
                pendingRepairs: repPending.count || 0,
                unreadMessages: msgUnread.count || 0,
                pendingReviews: revPending.count || 0
            }
        };
    } catch (error) {
        console.error('❌ Stats error:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================
// 10. IMAGE UPLOAD (Supabase Storage)
// ============================================

async function uploadProductImage(file) {
    try {
        if (!file) return { success: false, error: 'No file provided' };

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return { success: false, error: 'Invalid file type. Use JPG, PNG, WEBP, or GIF.' };
        }

        if (file.size > 5 * 1024 * 1024) {
            return { success: false, error: 'File too large. Maximum 5MB.' };
        }

        const ext = file.name.split('.').pop().toLowerCase();
        const fileName = `product_${Date.now()}_${Math.random().toString(36).substr(2, 8)}.${ext}`;

        const { data, error } = await supabaseClient.storage
            .from('product-images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        const { data: urlData } = supabaseClient.storage
            .from('product-images')
            .getPublicUrl(fileName);

        return {
            success: true,
            url: urlData.publicUrl,
            path: fileName
        };
    } catch (error) {
        console.error('❌ Upload error:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================
// 11. WHATSAPP FUNCTIONS
// ============================================

function getWhatsAppLink(message) {
    return `https://wa.me/${getNormalisedWhatsAppNumber()}?text=${encodeURIComponent(message)}`;
}

function openWhatsApp(message) {
    window.open(getWhatsAppLink(message), '_blank');
}

// ============================================
// 12. EXPOSE FUNCTIONS GLOBALLY
// ============================================

window.supabaseClient = supabaseClient;
window.signUpUser = signUpUser;
window.signInUser = signInUser;
window.signOutUser = signOutUser;
window.getCurrentUser = getCurrentUser;
window.isAdminUser = isAdminUser;
window.isCeoEmail = isCeoEmail;
window.getAdminAccessStatus = getAdminAccessStatus;
window.debugAdmin = async function () {
    const status = await getAdminAccessStatus();
    console.table({
        isAdmin: status.isAdmin,
        reason: status.reason,
        sessionEmail: status.sessionEmail || 'none',
        receivedRole: status.role || 'none',
        configuredEmail: status.configuredEmail || CEO_EMAIL
    });
    return status;
};
window.getProducts = getProducts;
window.getProductById = getProductById;
window.getFeaturedProducts = getFeaturedProducts;
window.submitRepairRequest = submitRepairRequest;
window.submitReview = submitReview;
window.getApprovedReviews = getApprovedReviews;
window.submitContactMessage = submitContactMessage;
window.addProduct = addProduct;
window.updateProduct = updateProduct;
window.deleteProduct = deleteProduct;
window.getRepairRequests = getRepairRequests;
window.getPendingReviews = getPendingReviews;
window.approveReview = approveReview;
window.getContactMessages = getContactMessages;
window.markMessageRead = markMessageRead;

// Analytics & Activity
window.trackVisit = trackVisit;
window.trackProductView = trackProductView;
window.logActivity = logActivity;
window.getSiteVisits = getSiteVisits;
window.getActivityLogs = getActivityLogs;
window.getProductViewsStats = getProductViewsStats;
window.getDashboardStats = getDashboardStats;

// Image upload
window.uploadProductImage = uploadProductImage;

// WhatsApp
window.getWhatsAppLink = getWhatsAppLink;
window.openWhatsApp = openWhatsApp;

// Helpers
window.getSitePath = getSitePath;
window.redirectToPage = redirectToPage;
window.getAuthRedirectUrl = getAuthRedirectUrl;
window.WHATSAPP_NUMBER = WHATSAPP_NUMBER;
window.CEO_EMAIL = CEO_EMAIL;

console.log('✅ Genera Tech Hub: All functions loaded!');
console.log('📦 Ready to build your tech empire!');
console.log('👑 CEO Email:', CEO_EMAIL);