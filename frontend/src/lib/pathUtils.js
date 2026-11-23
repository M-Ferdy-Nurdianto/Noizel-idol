/**
 * Utility to resolve asset paths correctly regardless of deployment environment.
 * Maps /images/ paths to Supabase Storage bucket ('members') so assets load directly from cloud storage.
 * Automatically normalizes local/docker IPs (127.0.0.1:54421) to the active Supabase URL and upgrades to HTTPS.
 * 
 * @param {string} path - The relative or absolute path
 * @returns {string} - The resolved absolute cloud storage or local asset URL
 */
export const getAssetPath = (path) => {
    if (!path) return '';

    const defaultCloudUrl = 'https://gyrzipnfnxvccakeejky.supabase.co';
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || defaultCloudUrl).replace(/\/$/, '');

    // Normalize any legacy local docker IP (127.0.0.1:54421 or localhost:54421)
    if (path.includes('127.0.0.1:54421') || path.includes('localhost:54421')) {
        path = path.replace(/http:\/\/(127\.0\.0\.1|localhost):54421/, supabaseUrl);
    }

    // If it's already an external URL or base64
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
        // Upgrade http to https in production or for cloud supabase
        if (path.startsWith('http://') && (import.meta.env.PROD || path.includes('supabase.co'))) {
            return path.replace('http://', 'https://');
        }
        return path;
    }

    // Route /images/ assets to Supabase Storage 'members' bucket
    if (path.startsWith('/images/')) {
        const subPath = path.replace(/^\/images\//, '');
        // Preserve local SVGs/icons if any, otherwise resolve from Supabase Storage
        if (!subPath.endsWith('.svg') && !subPath.startsWith('logos/')) {
            return `${supabaseUrl}/storage/v1/object/public/members/${subPath}`;
        }
    }

    const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}${cleanPath}`;
};
