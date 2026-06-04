document.addEventListener('DOMContentLoaded', () => {
            
            /* Auth Modal logic removed - Auth now handled via separate signup.html and login.html */

            /* Theme Toggle logic removed - Platform is dark by default as per PRD */

            /* --- Sticky Navbar --- */
            const navbar = document.getElementById('navbar');
            if (navbar) {
                window.addEventListener('scroll', () => {
                    if (window.scrollY > 50) {
                        navbar.classList.add('scrolled');
                    } else {
                        navbar.classList.remove('scrolled');
                    }
                });
            }

            /* --- Mobile Menu --- */
            const menuToggle = document.getElementById('menu-toggle');
            const mobileMenu = document.getElementById('mobile-menu');
            
            if (menuToggle && mobileMenu) {
                menuToggle.addEventListener('click', () => {
                    mobileMenu.classList.toggle('open');
                    menuToggle.textContent = mobileMenu.classList.contains('open') ? '✕' : '☰';
                });

                // Close mobile menu on link click
                document.querySelectorAll('.mobile-links a').forEach(link => {
                    link.addEventListener('click', () => {
                        mobileMenu.classList.remove('open');
                        menuToggle.textContent = '☰';
                    });
                });
            }

            /* --- Scroll Animations (Intersection Observer) --- */
            const fadeElements = document.querySelectorAll('.fade-up');
            
            const fadeObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        fadeObserver.unobserve(entry.target);
                    }
                });
            }, {
                root: null,
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            fadeElements.forEach(el => fadeObserver.observe(el));

            /* --- Stats Counter Animation (Removed for static features) --- */

            /* --- Feedback Modal --- */
            const feedbackModal = document.getElementById('feedback-modal');
            const openFeedbackBtn = document.getElementById('open-feedback-btn');
            const closeFeedbackBtn = document.getElementById('close-feedback-btn');
            const feedbackForm = document.getElementById('feedback-form');

            if (openFeedbackBtn && feedbackModal && closeFeedbackBtn) {
                openFeedbackBtn.addEventListener('click', () => {
                    feedbackModal.classList.add('open');
                });

                closeFeedbackBtn.addEventListener('click', () => {
                    feedbackModal.classList.remove('open');
                });

                feedbackModal.addEventListener('click', (e) => {
                    if (e.target === feedbackModal) {
                        feedbackModal.classList.remove('open');
                    }
                });

                // Star rating interaction
                const stars = document.querySelectorAll('.star-btn');
                const ratingInput = document.getElementById('fb-rating');
                
                if (stars.length && ratingInput) {
                    const updateStars = (rating) => {
                        stars.forEach(star => {
                            const val = parseInt(star.getAttribute('data-value'));
                            if (val <= rating) {
                                star.style.color = '#F59E0B'; // Amber yellow
                            } else {
                                star.style.color = 'var(--text-secondary)'; // Default grey
                            }
                        });
                    };

                    // Initialize 5 stars active
                    updateStars(5);

                    stars.forEach(star => {
                        star.addEventListener('click', () => {
                            const val = parseInt(star.getAttribute('data-value'));
                            ratingInput.value = val;
                            updateStars(val);
                        });
                    });
                }

                feedbackForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    if (!window.db) {
                        alert("Supabase client not initialized. Please configure credentials in supabase-client.js");
                        return;
                    }

                    const name = document.getElementById('fb-name').value.trim();
                    const course = document.getElementById('fb-course').value.trim();
                    const branch = document.getElementById('fb-branch').value.trim();
                    const semester = document.getElementById('fb-sem').value.trim();
                    const category = document.getElementById('feedback-type').value;
                    const details = document.getElementById('feedback-text').value.trim();
                    const rating = parseInt(document.getElementById('fb-rating').value) || 5;

                    const submitBtn = feedbackForm.querySelector('button[type="submit"]');
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Submitting...';

                    try {
                        const { error } = await window.db
                            .from('feedback')
                            .insert({
                                name,
                                course,
                                branch,
                                semester,
                                category,
                                details,
                                rating
                            });

                        if (error) throw error;

                        alert('Thank you! Your feedback has been saved in Supabase.');
                        feedbackForm.reset();
                        // Reset stars back to 5
                        if (ratingInput) {
                            ratingInput.value = 5;
                            stars.forEach(s => s.style.color = '#F59E0B');
                        }
                        feedbackModal.classList.remove('open');
                        
                        // Reload testimonials dynamically
                        loadTestimonials();

                    } catch (err) {
                        alert('Error submitting feedback: ' + err.message);
                    } finally {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Submit Feedback';
                    }
                });
            }

            // Load dynamic feedbacks in testimonials grid
            async function loadTestimonials() {
                const grid = document.querySelector('.testimonials-grid');
                if (!grid || !window.db) return;
                
                try {
                    const { data: feedbacks, error } = await window.db
                        .from('feedback')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(6);
                        
                    if (error) throw error;
                    
                    if (feedbacks && feedbacks.length > 0) {
                        // Clear existing static testimonials
                        grid.innerHTML = '';
                        
                        feedbacks.forEach((fb, idx) => {
                            const card = document.createElement('div');
                            card.className = `testimonial-card fade-up delay-${(idx + 1) * 100} visible`;
                            
                            const starsHtml = '★'.repeat(fb.rating || 5) + '☆'.repeat(5 - (fb.rating || 5));
                            const initials = fb.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
                            
                            const colors = [
                                'linear-gradient(135deg, #ec4899, #8b5cf6)',
                                'linear-gradient(135deg, #3b82f6, #14b8a6)',
                                'linear-gradient(135deg, #f59e0b, #ea580c)',
                                'linear-gradient(135deg, #10b981, #059669)',
                                'linear-gradient(135deg, #8b5cf6, #6366f1)'
                            ];
                            const bg = colors[idx % colors.length];
                            
                            card.innerHTML = `
                                <div class="stars" style="color: #F59E0B; margin-bottom: 12px; font-size: 1.1rem;">${starsHtml}</div>
                                <p class="quote">"${fb.details}"</p>
                                <div class="author">
                                    <div class="avatar" style="background: ${bg};">${initials}</div>
                                    <div class="user-details">
                                        <h5>${fb.name}</h5>
                                        <p>${fb.course || ''} ${fb.branch || ''}${fb.semester ? ', ' + fb.semester + ' Sem' : ''}</p>
                                    </div>
                                </div>
                            `;
                            grid.appendChild(card);
                        });
                    }
                } catch (err) {
                    console.error("Error loading testimonials:", err);
                }
            }

            // Trigger load testimonials after a small delay to let Supabase client load
            setTimeout(loadTestimonials, 500);

            /* --- Active Nav Highlight --- */
            const sections = document.querySelectorAll('section');
            const navLinks = document.querySelectorAll('.nav-links a');

            window.addEventListener('scroll', () => {
                let current = '';
                sections.forEach(section => {
                    const sectionTop = section.offsetTop;
                    const sectionHeight = section.clientHeight;
                    if (scrollY >= (sectionTop - 200)) {
                        current = section.getAttribute('id');
                    }
                });

                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href').includes(current)) {
                        link.classList.add('active');
                    }
                });
            });

            /* --- Chat Widget Logic --- */
            const chatToggle = document.getElementById('chat-toggle');
            const chatWidget = document.getElementById('chat-widget');
            const closeChat = document.getElementById('close-chat');
            const chatBody = document.getElementById('chat-body');
            const chatInput = document.getElementById('chat-input');
            const chatSend = document.getElementById('chat-send');
            const chatChips = document.getElementById('chat-chips');
            const chipBtns = document.querySelectorAll('.chat-chip');
            
            if (!chatToggle || !chatWidget) return; // Exit chat setup if not on a page with chat
            
            let isFirstMessage = true;
            let chatOpen = false;

            let GEMINI_API_KEY = localStorage.getItem('GEMINI_API_KEY') || "YOUR_GEMINI_API_KEY_HERE";
            let chatHistory = [];

            const botIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>`;
            const userIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;

            function appendMessage(text, isBot) {
                const msgDiv = document.createElement('div');
                msgDiv.className = `chat-message ${isBot ? 'bot' : 'user'}`;
                msgDiv.innerHTML = `
                    <div class="message-icon">${isBot ? botIcon : userIcon}</div>
                    <div class="message-bubble">${text}</div>
                `;
                chatBody.appendChild(msgDiv);
                chatBody.scrollTop = chatBody.scrollHeight;
            }

            function appendTyping() {
                const msgDiv = document.createElement('div');
                msgDiv.className = 'chat-message bot typing-msg';
                msgDiv.innerHTML = `
                    <div class="message-icon">${botIcon}</div>
                    <div class="message-bubble">
                        <div class="typing-indicator">
                            <span class="typing-dot"></span>
                            <span class="typing-dot"></span>
                            <span class="typing-dot"></span>
                        </div>
                    </div>
                `;
                chatBody.appendChild(msgDiv);
                chatBody.scrollTop = chatBody.scrollHeight;
                return msgDiv;
            }

            async function fetchGeminiReply(userText) {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
                
                chatHistory.push({
                    role: "user",
                    parts: [{ text: userText }]
                });

                const payload = {
                    system_instruction: {
                        parts: [{
                            text: "You are the CampusConnect assistant. You help students with finding teammates, internships, signing up, and discovering campus events. IMPORTANT RULES: 1) You must ALWAYS use very simple words and short, easy-to-understand sentences. 2) If the user hasn't provided their name and preferred language, you must politely ask for them first. 3) Once they tell you their language, you MUST respond in that specific language using very simple words. 4) Keep answers concise. 5) At the end of EVERY single answer, you MUST append EXACTLY 2 or 3 related suggested topics formatted perfectly using HTML like this: <br><br>💡 You can also ask me about: <b>Topic 1</b> or <b>Topic 2</b>. Use HTML formatting for bolding and line breaks."
                        }]
                    },
                    contents: chatHistory
                };

                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    
                    const data = await response.json();
                    
                    if (data.candidates && data.candidates[0].content) {
                        let botReply = data.candidates[0].content.parts[0].text;
                        chatHistory.push({
                            role: "model",
                            parts: [{ text: botReply }]
                        });
                        return botReply.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
                    } else {
                        throw new Error("Invalid response");
                    }
                } catch (error) {
                    console.error("Gemini API Error:", error);
                    chatHistory.pop();
                    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
                        return "Arre yaar, Gemini API key configured nahi hai. Chat settings (⚙️ icon upper right) use karke valid API key enter karein! 🔑";
                    }
                    return "Arre yaar, lagta hai network me thoda issue hai ya API key invalid hai. Please check your Gemini API key inside settings! 🔌";
                }
            }

            async function handleSend(text) {
                if(!text.trim()) return;
                
                appendMessage(text, false);
                chatInput.value = '';
                chatSend.classList.remove('active');
                
                if(isFirstMessage) {
                    chatChips.style.display = 'none';
                    isFirstMessage = false;
                }

                const typingIndicator = appendTyping();
                
                const botReplyText = await fetchGeminiReply(text);
                
                typingIndicator.remove();
                appendMessage(botReplyText, true);
            }

            chatInput.addEventListener('input', () => {
                if(chatInput.value.trim()) chatSend.classList.add('active');
                else chatSend.classList.remove('active');
            });

            chatInput.addEventListener('keypress', (e) => {
                if(e.key === 'Enter') handleSend(chatInput.value);
            });

            chatSend.addEventListener('click', () => {
                handleSend(chatInput.value);
            });

            chipBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    handleSend(btn.textContent);
                });
            });

            chatToggle.addEventListener('click', () => {
                chatWidget.classList.toggle('open');
                chatToggle.style.transform = chatWidget.classList.contains('open') ? 'scale(0)' : 'scale(1)';
                if(!chatOpen) {
                    chatOpen = true;
                    setTimeout(() => {
                        appendMessage("Hey there! 👋 I am the CampusConnect assistant. Before we start, what is your first name and which language do you prefer to chat in? (e.g., English, Hindi, Hinglish, etc.)", true);
                    }, 300);
                }
            });

            closeChat.addEventListener('click', () => {
                chatWidget.classList.remove('open');
                chatToggle.style.transform = 'scale(1)';
            });

            // Chat Settings Panel Event Listeners
            const settingsBtn = document.getElementById('chat-settings-btn');
            const settingsPanel = document.getElementById('chat-settings-panel');
            const apiKeyInput = document.getElementById('chat-api-key-input');
            const saveApiKeyBtn = document.getElementById('save-api-key-btn');

            if (settingsBtn && settingsPanel && apiKeyInput && saveApiKeyBtn) {
                // Prefill input if key is already saved
                const savedKey = localStorage.getItem('GEMINI_API_KEY');
                if (savedKey) {
                    apiKeyInput.value = savedKey;
                }

                settingsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isOpen = settingsPanel.style.display === 'block';
                    settingsPanel.style.display = isOpen ? 'none' : 'block';
                });

                saveApiKeyBtn.addEventListener('click', () => {
                    const key = apiKeyInput.value.trim();
                    if (key) {
                        localStorage.setItem('GEMINI_API_KEY', key);
                        GEMINI_API_KEY = key;
                        alert('Gemini API key saved successfully!');
                        settingsPanel.style.display = 'none';
                    } else {
                        localStorage.removeItem('GEMINI_API_KEY');
                        GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";
                        alert('API key cleared.');
                    }
                });
            }

        });
