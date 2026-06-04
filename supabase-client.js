// CampusConnect Supabase Configuration
const SUPABASE_URL = 'https://uckazbtmrdaqrixcqysk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yp20AUaWSUoz0ZpgfZg3qw_uwMqKfxJ';

// Initialize the Supabase Client
// This relies on the Supabase SDK being loaded via CDN in the HTML files
let supabaseClient;

try {
    if (typeof window.supabase !== 'undefined') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase Client Initialized successfully.");
    } else {
        console.error("Supabase SDK not found. Make sure the CDN script is included before supabase-client.js");
    }
} catch (error) {
    console.error("Error initializing Supabase client:", error);
}

// Utility to check if user is authenticated
async function checkAuthSession() {
    if (!supabaseClient) return null;
    const { data, error } = await supabaseClient.auth.getSession();
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
window.db = supabaseClient;
window.checkAuthSession = checkAuthSession;
window.requireAuth = requireAuth;
