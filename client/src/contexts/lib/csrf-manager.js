/**
 * CSRF Token Manager with Atomic Initialization
 *
 * Implements thread-safe CSRF token bootstrap with:
 * - Atomic initialization using promise-based lock
 * - Race condition prevention
 * - Exponential backoff retry logic
 * - Proper error recovery
 * - Token validation
 */
class CSRFTokenManager {
    constructor() {
        this.state = 'idle';
        this.initPromise = null;
        this.failureCount = 0;
        this.lastFailureTime = 0;
        this.MAX_RETRIES = 5;
        this.FAILURE_COOLDOWN_MS = 30000; // 30 seconds before allowing retry after total failure
    }
    /**
     * FIXED AUDIT #1: Enhanced CSRF token cookie retrieval with better fallback
     */
    getCsrfCookie() {
        try {
            // Try multiple methods for cross-browser compatibility
            const cookies = document.cookie.split(';');
            // Priority order: __Host- prefix (most secure), XSRF-TOKEN (standard), CSRF-TOKEN (fallback)
            const tokenNames = ['__Host-CSRF-TOKEN', 'XSRF-TOKEN', 'CSRF-TOKEN'];
            for (const tokenName of tokenNames) {
                for (const cookie of cookies) {
                    const [name, value] = cookie.trim().split('=');
                    if (name === tokenName && value) {
                        try {
                            return decodeURIComponent(value);
                        }
                        catch (e) {
                            // If decoding fails, try raw value
                            return value;
                        }
                    }
                }
            }
            return null;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Check if CSRF cookie exists
     */
    hasCsrfCookie() {
        return this.getCsrfCookie() !== null;
    }
    /**
     * Validate CSRF token with backend
     */
    async validateToken() {
        try {
            const response = await fetch('/api/csrf-token', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            if (!response.ok) {
                return false;
            }
            const data = await response.json();
            const hasToken = data.token && this.hasCsrfCookie();
            return hasToken;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Fetch CSRF token with retry logic and exponential backoff
     */
    async fetchTokenWithRetry(attempt = 1) {
        try {
            const isValid = await this.validateToken();
            if (isValid) {
                this.state = 'ready';
                this.failureCount = 0;
                return true;
            }
            // Max retries reached
            if (attempt >= this.MAX_RETRIES) {
                this.state = 'failed';
                this.failureCount++;
                this.lastFailureTime = Date.now();
                // Store failure state to inform API client
                sessionStorage.setItem('csrf_bootstrap_failed', 'true');
                sessionStorage.setItem('csrf_failure_time', String(this.lastFailureTime));
                return false;
            }
            // Calculate delay with exponential backoff and jitter
            const baseDelay = 100 * Math.pow(2, attempt - 1);
            const jitter = Math.random() * 100;
            const delay = Math.min(baseDelay + jitter, 3200);
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, delay));
            // Recursive retry
            return await this.fetchTokenWithRetry(attempt + 1);
        }
        catch (error) {
            // Max retries reached on error
            if (attempt >= this.MAX_RETRIES) {
                this.state = 'failed';
                this.failureCount++;
                this.lastFailureTime = Date.now();
                sessionStorage.setItem('csrf_bootstrap_failed', 'true');
                sessionStorage.setItem('csrf_failure_time', String(this.lastFailureTime));
                return false;
            }
            // Retry on error
            const baseDelay = 100 * Math.pow(2, attempt - 1);
            const jitter = Math.random() * 100;
            const delay = Math.min(baseDelay + jitter, 3200);
            await new Promise(resolve => setTimeout(resolve, delay));
            return await this.fetchTokenWithRetry(attempt + 1);
        }
    }
    /**
     * Initialize CSRF token with atomic lock
     * Prevents race conditions by ensuring only one initialization at a time
     */
    async initialize(options = {}) {
        // Check failure cooldown period
        if (!options.force && this.state === 'failed') {
            const timeSinceFailure = Date.now() - this.lastFailureTime;
            if (timeSinceFailure < this.FAILURE_COOLDOWN_MS) {
                console.warn(`[CSRF] In cooldown period (${Math.round((this.FAILURE_COOLDOWN_MS - timeSinceFailure) / 1000)}s remaining)`);
                return false;
            }
        }
        // If already initializing, wait for existing promise
        if (this.initPromise) {
            if (process.env.NODE_ENV === 'development') {
                console.log('[CSRF] Already initializing, waiting for existing promise...');
            }
            return await this.initPromise;
        }
        // If already ready and token exists, skip unless forced
        if (!options.force && this.state === 'ready' && this.hasCsrfCookie()) {
            // Validate existing token
            const isValid = await this.validateToken();
            if (isValid) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('[CSRF] Token already ready and valid');
                }
                return true;
            }
            // If validation fails, continue with initialization
        }
        // Create atomic initialization promise
        this.state = 'initializing';
        this.initPromise = this.fetchTokenWithRetry(1);
        try {
            const result = await this.initPromise;
            return result;
        }
        finally {
            // Clear promise when done to allow future initializations
            this.initPromise = null;
        }
    }
    /**
     * Get current CSRF state
     */
    getState() {
        return this.state;
    }
    /**
     * Check if CSRF is ready
     */
    isReady() {
        return this.state === 'ready' && this.hasCsrfCookie();
    }
    /**
     * Get CSRF token value
     */
    getToken() {
        return this.getCsrfCookie();
    }
    /**
     * Reset state (for testing or recovery)
     */
    reset() {
        this.state = 'idle';
        this.initPromise = null;
        this.failureCount = 0;
        this.lastFailureTime = 0;
        sessionStorage.removeItem('csrf_bootstrap_failed');
        sessionStorage.removeItem('csrf_failure_time');
    }
    /**
     * Force reinitialization
     */
    async reinitialize() {
        this.reset();
        return await this.initialize({ force: true });
    }
}
// Singleton instance
export const csrfManager = new CSRFTokenManager();
// Export for testing
export { CSRFTokenManager };
