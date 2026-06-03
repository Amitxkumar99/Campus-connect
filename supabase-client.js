// CampusConnect Supabase Configuration
// IMPORTANT: Replace these with your actual Supabase project URL and Anon Key
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Initialize the Supabase Client
// This relies on the Supabase SDK being loaded via CDN in the HTML files
let supabase;

try {
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase Client Initialized successfully.");
    } else {
        console.error("Supabase SDK not found. Make sure the CDN script is included before supabase-client.js");
    }
} catch (error) {
    console.error("Error initializing Supabase client:", error);
}

// Utility to check if user is authenticated
async function checkAuthSession() {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        console.error("Auth session error:", error);
        return null;
    }
    return data.session;
}

// Utility to enforce protected routes
async function requireAuth() {
    const session = await checkAuthSession();
    if (!session) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
    }
    return session;
}

// Export supabase object to window for global access
window.db = supabase;
window.checkAuthSession = checkAuthSession;
window.requireAuth = requireAuth;
