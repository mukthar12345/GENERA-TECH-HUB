// ============================================
// GENERA TECH HUB - ANALYTICS & ACTIVITY TRACKING
// ============================================
// Automatically tracks visitors, page views, and product views
// ============================================

(function() {
    'use strict';

    // Get or create visitor ID (persists across sessions)
    function getVisitorId() {
        let id = localStorage.getItem('gth_visitor_id');
        if (!id) {
            id = 'v_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now();
            localStorage.setItem('gth_visitor_id', id);
        }
        return id;
    }

    // Get or create session ID (new per browser session)
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

    // Track a page visit
    async function trackVisit() {
        try {
            const client = window.supabaseClient;
            if (!client || !client.auth) return;

            const { error } = await client.from('site_visits').insert([{
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
    window.trackProductView = async function(productId, productName) {
        try {
            const client = window.supabaseClient;
            if (!client || !client.auth || !productId) return;

            await client.from('product_views').insert([{
                product_id: productId,
                visitor_id: getVisitorId(),
                session_id: getSessionId()
            }]);

            // Also log to activity
            await window.logActivity({
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
    };

    // Universal activity logger
    window.logActivity = async function(data) {
        try {
            const client = window.supabaseClient;
            if (!client || !client.auth) return;

            const { error } = await client.from('activity_logs').insert([{
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
    };

    // Track on page load
    if (document.readyState === 'complete') {
        setTimeout(trackVisit, 1000);
    } else {
        window.addEventListener('load', () => setTimeout(trackVisit, 1000));
    }

    console.log('✅ Analytics system ready');
})();