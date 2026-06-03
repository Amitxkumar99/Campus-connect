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

                feedbackForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    alert('Thank you! Your feedback helps us build a better CampusConnect.');
                    feedbackForm.reset();
                    feedbackModal.classList.remove('open');
                });
            }

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

            const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";
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
                    return "Arre yaar, lagta hai network me thoda issue hai. API connect nahi ho rahi. Please try again! 🔌";
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

        });
