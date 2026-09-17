// ============================================
// GENERA TECH HUB - MAIN JAVASCRIPT
// ============================================
// With CEO button, smart chatbot, product awareness,
// and auto-loaded analytics tracking
// ============================================

// ============================================
// 1. INITIALIZE
// ============================================

function initializeMain() {
    if (window.generaMainInitialized) return;
    window.generaMainInitialized = true;
    console.log('🚀 Genera Tech Hub: Initializing...');

    initNavigation();
    initAnimations();
    initWhatsAppButton();
    initCeoButton();  // 👑 CEO floating button
    initChatbot();
    loadUserStatusWhenReady();
    initScrollEffects();
    initFormHandlers();

    console.log('✅ Genera Tech Hub: Ready!');
}

function loadUserStatusWhenReady(attempt = 0) {
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons && typeof getCurrentUser !== 'undefined') {
        loadUserStatus();
        return;
    }
    if (attempt < 10) {
        window.setTimeout(() => loadUserStatusWhenReady(attempt + 1), 250);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMain, { once: true });
} else {
    initializeMain();
}

// ============================================
// 2. NAVIGATION
// ============================================

function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navPanel = document.querySelector('.nav-panel') || navLinks;

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function (e) {
            e.stopPropagation();
            navPanel.classList.toggle('active');
            this.classList.toggle('active');
            this.setAttribute('aria-expanded', navPanel.classList.contains('active') ? 'true' : 'false');
        });

        document.addEventListener('click', function (e) {
            if (!navPanel.contains(e.target) && !hamburger.contains(e.target)) {
                navPanel.classList.remove('active');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navPanel.classList.remove('active');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', function () {
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
            header.classList.toggle('scrolled', currentScroll > 50);
        }, { passive: true });
    }

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes(currentPage)) link.classList.add('active');
    });
}

// ============================================
// 3. ANIMATIONS
// ============================================

function initAnimations() {
    const fadeElements = document.querySelectorAll('.fade-in');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        fadeElements.forEach(el => observer.observe(el));
    } else {
        fadeElements.forEach(el => el.classList.add('visible'));
    }

    document.querySelectorAll('.counter').forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        if (target && target > 0) animateCounter(counter, target);
    });
}

function animateCounter(element, target) {
    const duration = 2000;
    const startTime = performance.now();
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * target);
        element.textContent = current + '+';
        if (progress < 1) requestAnimationFrame(updateCounter);
        else element.textContent = target + '+';
    }
    requestAnimationFrame(updateCounter);
}

// ============================================
// 4. WHATSAPP FLOATING BUTTON
// ============================================

function initWhatsAppButton() {
    if (document.querySelector('.whatsapp-float')) return;
    const phoneNumber = window.WHATSAPP_NUMBER || '08081302228';
    const button = document.createElement('a');
    button.className = 'whatsapp-float';
    const normalisedPhone = phoneNumber.replace(/\D/g, '').replace(/^0/, '234');
    button.href = `https://wa.me/${normalisedPhone}?text=Hi%20Genera%20Tech%20Hub!%20I%20need%20assistance.`;
    button.target = '_blank';
    button.innerHTML = '💬';
    button.setAttribute('aria-label', 'Chat on WhatsApp');
    button.setAttribute('rel', 'noopener noreferrer');
    document.body.appendChild(button);
}

// ============================================
// 5. 👑 CEO FLOATING BUTTON (Only for CEO)
// ============================================

async function initCeoButton() {
    // Skip on admin page itself
    if (window.location.pathname.includes('/admin/')) return;

    // Wait for auth to be ready
    let tries = 0;
    while (typeof getCurrentUser === 'undefined' && tries < 20) {
        await new Promise(r => setTimeout(r, 200));
        tries++;
    }

    try {
        if (typeof getCurrentUser === 'undefined') return;

        const result = await getCurrentUser();
        if (!result.success || !result.user) return;

        const userEmail = String(result.user.email || '').toLowerCase();
        const ceoEmail = 'mudasirumukthar@gmail.com';

        // Only show button if user is the CEO
        if (userEmail !== ceoEmail) {
            console.log('👤 Regular user - CEO button hidden');
            return;
        }

        // Remove existing button
        document.querySelector('.ceo-float-btn')?.remove();

        // Create CEO floating button
        const ceoBtn = document.createElement('a');
        ceoBtn.className = 'ceo-float-btn';
        ceoBtn.href = '/src/pages/admin/index.html';
        ceoBtn.innerHTML = '👑';
        ceoBtn.setAttribute('title', 'Access CEO Dashboard');
        ceoBtn.setAttribute('aria-label', 'CEO Dashboard');
        ceoBtn.style.cssText = `
            position: fixed;
            bottom: 170px;
            right: 30px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #FFD700 0%, #F4C430 100%);
            color: #0A1628;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            text-decoration: none;
            box-shadow: 0 4px 20px rgba(255, 215, 0, 0.5);
            z-index: 9997;
            transition: 0.3s ease;
            animation: ceo-pulse 2s infinite;
            border: 2px solid rgba(10, 22, 40, 0.3);
        `;

        ceoBtn.addEventListener('mouseenter', () => {
            ceoBtn.style.transform = 'scale(1.15)';
        });
        ceoBtn.addEventListener('mouseleave', () => {
            ceoBtn.style.transform = 'scale(1)';
        });

        // Add pulse animation
        if (!document.querySelector('#ceo-pulse-style')) {
            const style = document.createElement('style');
            style.id = 'ceo-pulse-style';
            style.textContent = `
                @keyframes ceo-pulse {
                    0%, 100% { box-shadow: 0 4px 20px rgba(255, 215, 0, 0.5); }
                    50% { box-shadow: 0 4px 30px rgba(255, 215, 0, 0.9); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(ceoBtn);
        console.log('👑 CEO floating button added');

    } catch (error) {
        console.warn('CEO button error:', error);
    }
}

// ============================================
// 6. AI CHATBOT
// ============================================

// Chatbot product cache
let chatbotProducts = [];

async function loadChatbotProducts() {
    try {
        if (typeof getProducts === 'undefined') return;
        const result = await getProducts();
        if (result.success) {
            chatbotProducts = result.products || [];
            console.log(`🤖 Chatbot loaded ${chatbotProducts.length} products`);
        }
    } catch (error) {
        console.warn('Chatbot product load failed:', error);
    }
}

function initChatbot() {
    if (document.querySelector('.chatbot-toggle')) return;
    createChatbot();
    // Load products for chatbot
    setTimeout(loadChatbotProducts, 2000);
}

function createChatbot() {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'chatbot-toggle';
    toggleBtn.innerHTML = '🤖';
    toggleBtn.setAttribute('aria-label', 'AI Assistant');
    document.body.appendChild(toggleBtn);

    const chatWindow = document.createElement('div');
    chatWindow.className = 'chatbot-window';
    chatWindow.innerHTML = `
        <div class="chatbot-header">
            <span>🤖 Genera AI Assistant</span>
            <button class="chatbot-close" aria-label="Close chat">✕</button>
        </div>
        <div class="chatbot-messages" id="chatMessages">
            <div class="chatbot-message ai">Hi! 👋 I'm Genera AI — your personal tech assistant at Genera Tech Hub.

💡 I can help you with:
• Product prices & availability
• Device repairs
• Trade-ins & swaps
• Our location & hours

What can I help you with today?</div>
        </div>
        <div class="chatbot-prompts" aria-label="Suggested questions">
            <button type="button" data-question="Show me your products">Products</button>
            <button type="button" data-question="How much is a laptop?">Prices</button>
            <button type="button" data-question="I want to repair my phone">Repair</button>
            <button type="button" data-question="Do you do trade-ins?">Trade-in</button>
        </div>
        <div class="chatbot-input-area">
            <input type="text" id="chatInput" placeholder="Ask me anything..." maxlength="200">
            <button id="chatSend">Send</button>
        </div>
    `;
    document.body.appendChild(chatWindow);

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        chatWindow.classList.toggle('active');
        if (chatWindow.classList.contains('active')) {
            document.getElementById('chatInput')?.focus();
            if (chatbotProducts.length === 0) loadChatbotProducts();
        }
    });

    chatWindow.querySelector('.chatbot-close').addEventListener('click', () => {
        chatWindow.classList.remove('active');
    });

    document.addEventListener('click', function (e) {
        if (chatWindow.classList.contains('active') &&
            !chatWindow.contains(e.target) &&
            !toggleBtn.contains(e.target)) {
            chatWindow.classList.remove('active');
        }
    });

    const chatInput = chatWindow.querySelector('#chatInput');
    const chatSend = chatWindow.querySelector('#chatSend');
    const chatMessages = chatWindow.querySelector('#chatMessages');

    chatWindow.querySelectorAll('.chatbot-prompts button').forEach(prompt => {
        prompt.addEventListener('click', () => {
            chatInput.value = prompt.dataset.question || '';
            chatInput.focus();
        });
    });

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        chatMessages.innerHTML += `<div class="chatbot-message user">${escapeHtml(message)}</div>`;
        chatInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'chatbot-message ai';
        typingIndicator.textContent = 'Typing...';
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Try Python backend first, then local
        let response = null;
        try {
            const apiUrl = window.GENERA_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${apiUrl}/ai/hardware`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            if (res.ok) {
                const payload = await res.json();
                if (payload.success && payload.answer) response = payload.answer;
            }
        } catch (_) {}

        if (!response) response = getAIResponse(message);

        typingIndicator.remove();

        const responseEl = document.createElement('div');
        responseEl.className = 'chatbot-message ai';
        responseEl.innerHTML = response;
        chatMessages.appendChild(responseEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

// ============================================
// 7. AI RESPONSE SYSTEM (Smart + Product-aware)
// ============================================

function getAIResponse(question) {
    const q = question.toLowerCase().trim();

    // ========================================
    // 🔥 SMART PRODUCT SEARCH (uses live data)
    // ========================================
    if (chatbotProducts.length > 0) {
        const productMatch = chatbotProducts.find(p => {
            const name = String(p.name || '').toLowerCase();
            const brand = String(p.brand || '').toLowerCase();
            const model = String(p.model || '').toLowerCase();
            return (name && q.includes(name)) ||
                (brand && q.includes(brand)) ||
                (model && q.includes(model));
        });

        if (productMatch) {
            const price = new Intl.NumberFormat('en-NG', {
                style: 'currency',
                currency: 'NGN',
                minimumFractionDigits: 0
            }).format(productMatch.price);

            const stock = productMatch.stock_quantity > 0
                ? `✅ In Stock (${productMatch.stock_quantity} available)`
                : '❌ Out of Stock';

            const whatsappMsg = encodeURIComponent(
                `Hi Genera Tech Hub! I'm interested in ${productMatch.name} - ${price}. Is it available?`
            );

            return `📱 <strong>${productMatch.name}</strong><br><br>
💰 Price: <strong style="color: #FFD700;">${price}</strong><br>
${stock}<br>
🏷️ Condition: ${productMatch.condition || 'New'}<br>
${productMatch.storage ? `💾 Storage: ${productMatch.storage}<br>` : ''}
${productMatch.color ? `🎨 Color: ${productMatch.color}<br>` : ''}
<br>
🎯 <strong>Why Genera Tech Hub?</strong><br>
• ✅ 100% genuine products<br>
• ✅ 6-month warranty included<br>
• ✅ Free delivery available<br>
• ✅ Best price guarantee<br>
<br>
<a href="https://wa.me/2348081302228?text=${whatsappMsg}" target="_blank" style="display:inline-block;padding:0.6rem 1.2rem;background:#25D366;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin-top:0.5rem;">💬 Order on WhatsApp</a>`;
        }
    }

    // ========================================
    // PRODUCT LISTING
    // ========================================
    if (q.includes('product') || q.includes('what do you sell') || q.includes('show me') || q.includes('catalog')) {
        if (chatbotProducts.length === 0) {
            return `🛍️ We sell premium phones, laptops, tablets, and accessories!

Visit our Products page to see everything we have in stock. 💎

Every product comes with:
• ✅ 6-month warranty
• ✅ 100% genuine quality
• ✅ Best prices in the market`;
        }

        const total = chatbotProducts.length;
        const phones = chatbotProducts.filter(p => p.category === 'Phones').length;
        const laptops = chatbotProducts.filter(p => p.category === 'Laptops').length;

        return `🛍️ <strong>Our Products (${total} total)</strong><br><br>
📱 Phones: ${phones}<br>
💻 Laptops: ${laptops}<br>
🎧 Accessories available<br><br>
<a href="/src/pages/product.html" style="color: #FFD700;">👉 Browse all products</a><br><br>
💡 Ask me about any specific product for price and availability!`;
    }

    // ========================================
    // BRAND TRUST
    // ========================================
    if (q.includes('why choose') || q.includes('why should i') || q.includes('trust') || q.includes('genuine') || q.includes('original')) {
        return `🏆 <strong>Why Choose Genera Tech Hub?</strong><br><br>
✅ <strong>Technology You Can Trust</strong><br>
We've built our reputation on reliability, quality, and customer satisfaction.<br><br>
💎 <strong>Unique Prices</strong><br>
Our prices are carefully curated to give you the best value. We compare with the market — you won't find a better deal for the quality.<br><br>
⭐ <strong>Quality Guaranteed</strong><br>
Every product is tested and verified. We only sell what we would use ourselves.<br><br>
🛡️ <strong>6-Month Warranty</strong><br>
We stand behind every product we sell.<br><br>
👑 <strong>Trusted by Hundreds</strong><br>
Join our growing family of satisfied customers across Nigeria.<br><br>
📍 <strong>Genera Tech Hub — Technology You Can Trust.</strong>`;
    }

    // ========================================
    // PRICE
    // ========================================
    if (q.includes('price') || q.includes('cost') || q.includes('how much')) {
        if (chatbotProducts.length > 0) {
            const minPrice = Math.min(...chatbotProducts.map(p => p.price || 0).filter(p => p > 0));
            const maxPrice = Math.max(...chatbotProducts.map(p => p.price || 0));

            return `💰 <strong>Our Price Range</strong><br><br>
From <strong style="color:#FFD700;">₦${minPrice.toLocaleString()}</strong> to <strong style="color:#FFD700;">₦${maxPrice.toLocaleString()}</strong><br><br>
🎯 <strong>Our Promise:</strong><br>
Our prices are competitively unique — we offer the best value for premium quality devices.<br><br>
💬 For specific pricing on any device, ask me or chat on WhatsApp!`;
        }

        return `💰 Our phones range from ₦50,000 to ₦1,500,000.<br>
💻 Laptops from ₦200,000 to ₦2,500,000.<br><br>
🎯 <strong>Unique prices</strong> — Best value in the market!<br><br>
Ask me about any specific product for exact pricing!`;
    }

    // ========================================
    // IPHONE
    // ========================================
    if (q.includes('iphone') || q.includes('apple phone') || q.includes('ios')) {
        if (chatbotProducts.length > 0) {
            const iphones = chatbotProducts.filter(p =>
                String(p.brand || '').toLowerCase() === 'apple' &&
                String(p.category || '').toLowerCase() === 'phones'
            );
            if (iphones.length > 0) {
                return `📱 <strong>iPhones Available (${iphones.length})</strong><br><br>
${iphones.slice(0, 3).map(p => `• <strong>${p.name}</strong> — ₦${p.price.toLocaleString()}`).join('<br>')}
${iphones.length > 3 ? '<br>...and more!' : ''}<br><br>
✅ 6-month warranty<br>
✅ All colors available<br><br>
Ask me about any specific iPhone model!`;
            }
        }
        return `📱 We stock all iPhone models from iPhone 11 to iPhone 15 Pro Max!<br><br>
✅ 6-month warranty<br>
✅ 100% genuine<br>
✅ Best prices guaranteed<br><br>
Chat on WhatsApp for current availability! 🍎`;
    }

    // ========================================
    // SAMSUNG
    // ========================================
    if (q.includes('samsung') || q.includes('galaxy')) {
        if (chatbotProducts.length > 0) {
            const samsung = chatbotProducts.filter(p =>
                String(p.brand || '').toLowerCase() === 'samsung'
            );
            if (samsung.length > 0) {
                return `📱 <strong>Samsung Available (${samsung.length})</strong><br><br>
${samsung.slice(0, 3).map(p => `• <strong>${p.name}</strong> — ₦${p.price.toLocaleString()}`).join('<br>')}<br><br>
✅ All series available<br>
✅ 6-month warranty<br><br>
Ask about any specific model!`;
            }
        }
        return `📱 We have all Samsung Galaxy models — A series, S series, and Z foldables!<br><br>
✅ 6-month warranty<br>
✅ Best prices<br><br>
WhatsApp us for current stock! ✨`;
    }

    // ========================================
    // LAPTOPS
    // ========================================
    if (q.includes('laptop') || q.includes('macbook') || q.includes('computer')) {
        if (chatbotProducts.length > 0) {
            const laptops = chatbotProducts.filter(p =>
                String(p.category || '').toLowerCase() === 'laptops'
            );
            if (laptops.length > 0) {
                return `💻 <strong>Laptops Available (${laptops.length})</strong><br><br>
${laptops.slice(0, 3).map(p => `• <strong>${p.name}</strong> — ₦${p.price.toLocaleString()}`).join('<br>')}<br><br>
✅ 6-month warranty<br>
✅ Perfect for work & school<br><br>
Ask about any specific laptop!`;
            }
        }
        return `💻 We sell Apple MacBook, Dell, HP, Lenovo, and more!<br><br>
✅ 6-month warranty<br>
✅ Great for students & professionals<br><br>
WhatsApp us to find your perfect laptop! ✨`;
    }

    // ========================================
    // REPAIRS
    // ========================================
    if (q.includes('repair') || q.includes('fix') || q.includes('broken')) {
        return `🔧 <strong>Professional Repair Services</strong><br><br>
✅ Screen repairs<br>
✅ Battery replacement<br>
✅ Water damage<br>
✅ Software issues<br>
✅ And much more!<br><br>
🎯 <strong>Why trust us?</strong><br>
• Expert technicians<br>
• 30-day repair warranty<br>
• Genuine parts<br>
• Fast turnaround<br><br>
<a href="/src/pages/repair.html" style="color:#FFD700;">👉 Book a repair</a> or chat on WhatsApp!`;
    }

    // ========================================
    // TRADE-IN
    // ========================================
    if (q.includes('trade') || q.includes('swap') || q.includes('sell') || q.includes('exchange')) {
        return `🔄 <strong>Trade-in & Swap Program</strong><br><br>
Turn your old device into cash or upgrade to something new!<br><br>
✅ Best value for your device<br>
✅ Instant quote<br>
✅ Hassle-free process<br>
✅ Same-day upgrade available<br><br>
<a href="/src/pages/swap.html" style="color:#FFD700;">👉 Get a quote</a> or chat on WhatsApp!`;
    }

    // ========================================
    // WARRANTY
    // ========================================
    if (q.includes('warranty') || q.includes('guarantee')) {
        return `🛡️ <strong>Our Warranty Promise</strong><br><br>
✅ <strong>6-month warranty</strong> on all devices<br>
✅ <strong>30-day warranty</strong> on repairs<br>
✅ Genuine parts<br>
✅ Full customer support<br><br>
🏆 <strong>Genera Tech Hub — Technology You Can Trust</strong>`;
    }

    // ========================================
    // ACCESSORIES
    // ========================================
    if (q.includes('accessor') || q.includes('case') || q.includes('charger') || q.includes('earphone') || q.includes('headphone')) {
        return `🎧 <strong>Premium Accessories</strong><br><br>
✅ Phone cases<br>
✅ Screen protectors<br>
✅ Chargers & cables<br>
✅ Power banks<br>
✅ Earphones & headphones<br>
✅ Smart watches<br><br>
Visit our store or chat on WhatsApp! ✨`;
    }

    // ========================================
    // LOCATION
    // ========================================
    if (q.includes('location') || q.includes('address') || q.includes('where')) {
        return `📍 <strong>Find Us</strong><br><br>
We're located in Nigeria.<br><br>
🎯 <strong>We also offer:</strong><br>
• 🚗 Free pickup<br>
• 📦 Free delivery<br>
• 💬 Virtual support<br><br>
Chat on WhatsApp for exact directions!`;
    }

    // ========================================
    // HOURS
    // ========================================
    if (q.includes('hour') || q.includes('time') || q.includes('open') || q.includes('close')) {
        return `🕐 <strong>Our Business Hours</strong><br><br>
📅 Monday - Saturday: 8:00 AM - 8:00 PM<br>
📅 Sunday: By appointment<br><br>
💬 Available on WhatsApp 24/7 for inquiries!`;
    }

    // ========================================
    // DELIVERY
    // ========================================
    if (q.includes('deliver') || q.includes('shipping') || q.includes('send')) {
        return `🚗 <strong>Delivery & Pickup</strong><br><br>
✅ Free delivery within Lagos<br>
✅ Affordable nationwide delivery<br>
✅ Free pickup for repairs<br>
✅ Same-day delivery available<br><br>
Chat on WhatsApp to arrange delivery!`;
    }

    // ========================================
    // CONTACT
    // ========================================
    if (q.includes('contact') || q.includes('reach') || q.includes('call') || q.includes('phone')) {
        return `📞 <strong>Reach Us</strong><br><br>
💬 <strong>WhatsApp:</strong> 08081302228 (fastest!)<br>
📱 <strong>Phone:</strong> 08081302228<br>
✉️ <strong>Email:</strong> info@generatechub.com<br><br>
🎯 We reply within minutes!`;
    }

    // ========================================
    // ABOUT
    // ========================================
    if (q.includes('about') || q.includes('who are you') || q.includes('company')) {
        return `🏢 <strong>Genera Tech Hub</strong><br><br>
<em>Technology You Can Trust</em><br><br>
We're a full-service technology hub offering:<br>
• 📱 Quality phones & laptops<br>
• 🔧 Expert repair services<br>
• 🔄 Trade-in & swap program<br>
• 🎧 Premium accessories<br><br>
👑 Founded by <strong>Mudasiru Mukthar</strong><br>
🎯 Trusted by hundreds of customers<br><br>
📖 <a href="/src/pages/about.html" style="color:#FFD700;">Learn more</a>`;
    }

    // ========================================
    // GREETING
    // ========================================
    if (q.match(/^(hi|hello|hey|good (morning|afternoon|evening)|how are you)/)) {
        return `Hello! 👋 Welcome to <strong>Genera Tech Hub</strong>!<br><br>
🎯 <em>Technology You Can Trust</em><br><br>
How can I help you today?<br>
• 🛍️ Browse products<br>
• 🔧 Book a repair<br>
• 🔄 Trade-in a device<br>
• 💬 Chat with us`;
    }

    // ========================================
    // THANKS
    // ========================================
    if (q.includes('thank') || q.includes('thanks')) {
        return `You're welcome! 😊<br><br>
<strong>Genera Tech Hub — Technology You Can Trust</strong><br><br>
Is there anything else I can help you with? 💬`;
    }

    // ========================================
    // DEFAULT
    // ========================================
    return `Great question! 🤔<br><br>
For the best assistance, please chat with us on WhatsApp — our team will respond within minutes!<br><br>
<a href="https://wa.me/2348081302228" target="_blank" style="display:inline-block;padding:0.6rem 1.2rem;background:#25D366;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin-top:0.5rem;">💬 Chat on WhatsApp</a><br><br>
<em>Genera Tech Hub — Technology You Can Trust</em>`;
}

// ============================================
// 8. USER STATUS
// ============================================

async function loadUserStatus() {
    try {
        const authButtons = document.querySelector('.auth-buttons');
        if (!authButtons) return;
        if (typeof getCurrentUser === 'undefined') return;

        const user = await getCurrentUser();

        if (user.success && user.user) {
            const name = user.user.user_metadata?.full_name || user.user.email;
            const isCeo = String(user.user.email || '').toLowerCase() === 'mudasirumukthar@gmail.com';

            authButtons.innerHTML = `
                <span style="color: var(--gold); font-weight: 500; font-size: 0.9rem;">👋 ${name}</span>
                ${isCeo ? '<a href="/src/pages/admin/index.html" class="btn btn-primary" style="padding: 0.4rem 1rem; font-size: 0.85rem;">👑 Dashboard</a>' : ''}
                <a href="#" onclick="handleLogout(event)" class="btn btn-secondary" style="padding: 0.4rem 1rem; font-size: 0.85rem;">Logout</a>
            `;
        } else {
            authButtons.innerHTML = `
                <a href="/src/pages/login.html" class="btn btn-secondary" style="padding: 0.4rem 1rem; font-size: 0.85rem;">Login</a>
                <a href="/src/pages/login.html#signup" class="btn btn-primary" style="padding: 0.4rem 1rem; font-size: 0.85rem;">Sign Up</a>
            `;
        }
    } catch (error) {
        console.error('❌ Load user status error:', error);
    }
}

async function handleLogout(event) {
    event.preventDefault();
    if (typeof signOutUser === 'undefined') {
        alert('Logout function not available. Please refresh the page.');
        return;
    }
    const result = await signOutUser();
    if (result.success) {
        showToast('👋 Logged out successfully!', 'success');
        setTimeout(() => window.location.reload(), 500);
    } else {
        showToast('❌ Logout failed. Please try again.', 'error');
    }
}

// ============================================
// 9. FORM HANDLERS
// ============================================

function initFormHandlers() {
    const repairForm = document.getElementById('repairForm');
    if (repairForm) repairForm.addEventListener('submit', handleRepairForm);

    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) reviewForm.addEventListener('submit', handleReviewForm);

    const contactForm = document.getElementById('contactForm');
    if (contactForm) contactForm.addEventListener('submit', handleContactForm);

    const swapForm = document.getElementById('swapForm');
    if (swapForm) swapForm.addEventListener('submit', handleSwapForm);
}

// ============================================
// 10. REPAIR FORM HANDLER
// ============================================

async function handleRepairForm(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Sending...';

    try {
        const formData = new FormData(form);

        const data = {
            deviceType: formData.get('deviceType'),
            deviceBrand: formData.get('deviceBrand'),
            deviceModel: formData.get('deviceModel'),
            issueDescription: formData.get('issueDescription'),
            collectionMethod: formData.get('collectionMethod') || 'walk-in',
            preferredDate: formData.get('preferredDate') || null,
            preferredTime: formData.get('preferredTime') || null,
            pickupAddress: formData.get('pickupAddress') || null,
            pickupLandmark: formData.get('pickupLandmark') || null,
            deliveryMethod: formData.get('deliveryMethod') || 'pickup-in-person',
            deliveryAddress: formData.get('deliveryAddress') || null,
            customerName: formData.get('customerName'),
            customerPhone: formData.get('customerPhone'),
            customerEmail: formData.get('customerEmail') || null,
            customerWhatsApp: formData.get('customerWhatsApp') || formData.get('customerPhone')
        };

        let dbResult = { success: true };
        if (typeof submitRepairRequest !== 'undefined') {
            dbResult = await submitRepairRequest(data);
        }

        const collectionLabels = {
            'walk-in': '🏢 Walk-in to our store',
            'pickup': '🚗 We pick it up from you',
            'dropoff-courier': '📦 I will send it via courier'
        };

        const deliveryLabels = {
            'pickup-in-person': '🏢 I will pick it up in person',
            'delivered-to-me': '🚚 Deliver to my address',
            'dispatched': '📦 Dispatch via courier'
        };

        const message = `
🔧 *NEW REPAIR BOOKING — GENERA TECH HUB*
_Technology You Can Trust_

━━━━━━━━━━━━━━━━━━━
📱 *DEVICE DETAILS*
━━━━━━━━━━━━━━━━━━━
• Type: ${data.deviceType || 'N/A'}
• Brand: ${data.deviceBrand || 'N/A'}
• Model: ${data.deviceModel || 'N/A'}

🔧 *Issue:*
${data.issueDescription || 'Not specified'}

━━━━━━━━━━━━━━━━━━━
🚗 *HOW I'LL GET IT TO YOU*
━━━━━━━━━━━━━━━━━━━
${collectionLabels[data.collectionMethod] || data.collectionMethod}

📅 Preferred Date: ${data.preferredDate || 'Flexible'}
🕐 Preferred Time: ${data.preferredTime || 'Flexible'}

${data.collectionMethod === 'pickup' ? `
📍 *Pickup Address:*
${data.pickupAddress || 'Not provided'}

🏠 Landmark: ${data.pickupLandmark || 'N/A'}
` : ''}

━━━━━━━━━━━━━━━━━━━
📦 *HOW I WANT IT BACK*
━━━━━━━━━━━━━━━━━━━
${deliveryLabels[data.deliveryMethod] || data.deliveryMethod}

${data.deliveryMethod === 'delivered-to-me' ? `
📍 *Delivery Address:*
${data.deliveryAddress || 'Not provided'}
` : ''}

━━━━━━━━━━━━━━━━━━━
👤 *MY INFORMATION*
━━━━━━━━━━━━━━━━━━━
• Name: ${data.customerName}
• Phone: ${data.customerPhone}
• Email: ${data.customerEmail || 'Not provided'}
• WhatsApp: ${data.customerWhatsApp}

━━━━━━━━━━━━━━━━━━━
📋 *RECORD*
━━━━━━━━━━━━━━━━━━━
📅 Submitted: ${new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
🕐 Time: ${new Date().toLocaleTimeString('en-NG')}
🆔 Ref: GTH-${Date.now().toString().slice(-6)}

━━━━━━━━━━━━━━━━━━━
✅ Please confirm the pickup/collection time and the total cost.
📲 Reply to this message to confirm.

_Genera Tech Hub — Technology You Can Trust_ 👑
        `;

        if (typeof openWhatsApp !== 'undefined') {
            openWhatsApp(message);
        } else {
            const phone = window.WHATSAPP_NUMBER || '08081302228';
            const normPhone = phone.replace(/\D/g, '').replace(/^0/, '234');
            window.open(`https://wa.me/${normPhone}?text=${encodeURIComponent(message)}`, '_blank');
        }

        showToast('✅ Repair request sent! We\'ll contact you shortly.', 'success');
        form.reset();

    } catch (error) {
        console.error('❌ Repair form error:', error);
        showToast('❌ Something went wrong. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ============================================
// 11. REVIEW FORM HANDLER
// ============================================

async function handleReviewForm(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Sending...';

    try {
        const formData = new FormData(form);
        const data = {
            rating: parseInt(formData.get('rating')) || 5,
            reviewText: formData.get('reviewText'),
            deviceService: formData.get('deviceService') || null,
            customerName: formData.get('customerName') || 'Anonymous'
        };

        if (typeof submitReview !== 'undefined') await submitReview(data);

        const message = `
⭐ *NEW REVIEW — GENERA TECH HUB*

${'⭐'.repeat(data.rating)} (${data.rating}/5)

💬 "${data.reviewText}"

👤 ${data.customerName}
📱 ${data.deviceService || 'Not specified'}

📅 ${new Date().toLocaleDateString('en-NG')}

_Genera Tech Hub — Technology You Can Trust_ 👑
        `;

        if (typeof openWhatsApp !== 'undefined') openWhatsApp(message);
        else window.open(`https://wa.me/2348081302228?text=${encodeURIComponent(message)}`, '_blank');

        showToast('✅ Thank you for your review!', 'success');
        form.reset();
    } catch (error) {
        console.error('❌ Review form error:', error);
        showToast('❌ Something went wrong.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ============================================
// 12. CONTACT FORM HANDLER
// ============================================

async function handleContactForm(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Sending...';

    try {
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email') || null,
            subject: formData.get('subject') || 'General Inquiry',
            message: formData.get('message')
        };

        if (typeof submitContactMessage !== 'undefined') await submitContactMessage(data);

        const message = `
📞 *CONTACT — GENERA TECH HUB*

👤 *Name:* ${data.name}
📞 *Phone:* ${data.phone}
✉️ *Email:* ${data.email || 'Not provided'}
📋 *Subject:* ${data.subject}

💬 *Message:*
${data.message}

📅 ${new Date().toLocaleDateString('en-NG')}

_Genera Tech Hub — Technology You Can Trust_ 👑
        `;

        if (typeof openWhatsApp !== 'undefined') openWhatsApp(message);
        else window.open(`https://wa.me/2348081302228?text=${encodeURIComponent(message)}`, '_blank');

        showToast('✅ Message sent!', 'success');
        form.reset();
    } catch (error) {
        console.error('❌ Contact form error:', error);
        showToast('❌ Something went wrong.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ============================================
// 13. SWAP FORM HANDLER
// ============================================

async function handleSwapForm(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Sending...';

    try {
        const formData = new FormData(form);
        const data = {
            deviceBrand: formData.get('deviceBrand'),
            deviceModel: formData.get('deviceModel'),
            deviceCondition: formData.get('deviceCondition'),
            deviceStorage: formData.get('deviceStorage') || null,
            targetDevice: formData.get('targetDevice') || null,
            customerName: formData.get('customerName'),
            customerPhone: formData.get('customerPhone'),
            customerEmail: formData.get('customerEmail') || null
        };

        const message = `
🔄 *TRADE-IN REQUEST — GENERA TECH HUB*

📱 *My Device:*
• Brand: ${data.deviceBrand}
• Model: ${data.deviceModel}
• Condition: ${data.deviceCondition}
• Storage: ${data.deviceStorage || 'N/A'}

🎯 *Want to Upgrade To:*
${data.targetDevice || 'Not specified'}

👤 *My Details:*
• Name: ${data.customerName}
• Phone: ${data.customerPhone}
• Email: ${data.customerEmail || 'Not provided'}

📅 ${new Date().toLocaleDateString('en-NG')}

_Genera Tech Hub — Technology You Can Trust_ 👑
        `;

        if (typeof openWhatsApp !== 'undefined') openWhatsApp(message);
        else window.open(`https://wa.me/2348081302228?text=${encodeURIComponent(message)}`, '_blank');

        showToast('✅ Trade-in request sent!', 'success');
        form.reset();
    } catch (error) {
        console.error('❌ Swap form error:', error);
        showToast('❌ Something went wrong.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ============================================
// 14. SCROLL EFFECTS
// ============================================

function initScrollEffects() {
    const heroBg = document.querySelector('.hero-background');
    if (heroBg) {
        window.addEventListener('scroll', function () {
            const scrolled = window.pageYOffset;
            heroBg.style.transform = `translateY(${scrolled * 0.4}px)`;
        }, { passive: true });
    }
}

// ============================================
// 15. UTILITIES
// ============================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) result[key] = value;
    return result;
}

function showToast(message, type = 'success') {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.5s ease forwards';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

function showLoading(element) {
    if (element) element.innerHTML = '<div class="loading"></div>';
}

function hideLoading(element, content) {
    if (element) element.innerHTML = content;
}

// ============================================
// 16. EXPOSE GLOBALLY
// ============================================

window.showToast = showToast;
window.formatCurrency = formatCurrency;
window.getUrlParams = getUrlParams;
window.escapeHtml = escapeHtml;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.handleLogout = handleLogout;

// ============================================
// 17. AUTO-LOAD ANALYTICS TRACKER
// ============================================
// Automatically tracks every page visit
// Runs once, silent, non-blocking
// ============================================

(function autoLoadAnalytics() {
    // Skip on admin page
    if (window.location.pathname.includes('/admin/')) {
        console.log('📊 Analytics skipped on admin page');
        return;
    }

    // Only run once
    if (window.generaAnalyticsLoaded) return;
    window.generaAnalyticsLoaded = true;

    // Auto-track visit after main.js loads
    setTimeout(function () {
        if (typeof trackVisit === 'function') {
            trackVisit().catch(err => console.warn('Analytics silent error:', err));
        } else {
            console.warn('⚠️ trackVisit not available yet');
        }
    }, 1500);

    console.log('📊 Analytics automation ready');
})();

console.log('✅ Genera Tech Hub: Main.js loaded successfully!');
console.log('📦 All systems ready for action!');