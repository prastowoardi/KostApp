/**
 * Utility functions for formatting currencies, dates, text, and asset URLs.
 */
import { BASE_URL, FILES_URL, IS_PROD, STORAGE_URL } from './api.js';

/**
 * Format a number to Indonesian Rupiah currency string.
 * Example: 1500000 -> "Rp 1.500.000"
 */
export const formatRupiah = (value) => {
    if (value === null || value === undefined || isNaN(Number(value))) {
        return 'Rp 0';
    }
    const num = Math.round(Number(value));
    return `Rp ${num.toLocaleString('id-ID')}`;
};

/**
 * Format raw date string into standard Indonesian date format.
 * Example: "2026-10-30" -> "30 Okt 2026"
 */
export const formatDate = (dateString, withTime = false) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        
        const options = {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
        };
        return date.toLocaleDateString('id-ID', options);
    } catch {
        return '-';
    }
};

/**
 * Format date string into Month Year format.
 * Example: "2026-10-01" -> "Oktober 2026"
 */
export const formatMonthYear = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    } catch {
        return '-';
    }
};

/**
 * Extract 1-2 letters initial from a user or tenant name.
 */
export const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '?';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
};

/**
 * Get the proper entity ID for API calls (prioritize UUID over integer ID).
 */
export const getEntityId = (entity) => {
    if (!entity) return '';
    return entity.uuid || entity.id || '';
};

/**
 * Resolve full storage URL for uploaded files/receipts.
 * Correctly handles:
 * - Production Cloudflare R2 / S3 URLs (mapping serrata.xyz/storage to files.serrata.xyz)
 * - Already absolute files.serrata.xyz URLs
 * - Relative paths with/without 'storage/' prefix
 * - Localhost/127.0.0.1 normalization to active BASE_URL
 */
export const getStorageUrl = (path) => {
    if (!path) return null;
    if (typeof path === 'object') {
        if (path.uri) return getStorageUrl(path.uri);
        if (path.url) return getStorageUrl(path.url);
        return null;
    }
    const cleanPath = String(path).trim();
    if (!cleanPath || cleanPath === '[object Object]' || cleanPath === 'undefined' || cleanPath === 'null') {
        return null;
    }

    // If pointing to serrata.xyz/storage/ (in prod, files are hosted on files.serrata.xyz without /storage)
    if (cleanPath.includes('serrata.xyz/storage/')) {
        const parts = cleanPath.split('/storage/');
        const relative = parts[parts.length - 1].replace(/^\/+/, '');
        return `${FILES_URL}/${relative}`;
    }

    // Already full URL on files.serrata.xyz
    if (cleanPath.startsWith('https://files.serrata.xyz') || cleanPath.startsWith('http://files.serrata.xyz')) {
        return cleanPath;
    }

    // If it contains /storage/ on another host (e.g. localhost or dev server)
    if (cleanPath.includes('/storage/')) {
        const parts = cleanPath.split('/storage/');
        const relative = parts[parts.length - 1].replace(/^\/+/, '');
        if (IS_PROD) {
            return `${FILES_URL}/${relative}`;
        }
        return `${STORAGE_URL}/${relative}`;
    }

    // If it's an absolute URL with localhost or 127.0.0.1
    if (
        cleanPath.startsWith('http://localhost') ||
        cleanPath.startsWith('http://127.0.0.1') ||
        cleanPath.startsWith('https://localhost') ||
        cleanPath.startsWith('https://127.0.0.1')
    ) {
        if (IS_PROD) {
            const stripped = cleanPath.replace(/^https?:\/\/[^/]+\/?(storage\/)?/, '');
            return `${FILES_URL}/${stripped}`;
        }
        return cleanPath.replace(/^https?:\/\/[^/]+/, BASE_URL);
    }

    // 5. If it's any other full HTTP/HTTPS URL
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
        return cleanPath;
    }

    // 6. Relative path (e.g. "receipts/xxx.jpg" or "proofs/xxx.jpg")
    const stripped = cleanPath.replace(/^\/?storage\/?/, '').replace(/^\/+/, '');
    if (IS_PROD) {
        return `${FILES_URL}/${stripped}`;
    }
    return `${STORAGE_URL}/${stripped}`;
};

/**
 * Format 'YYYY-MM' period string to Indonesian Month and Year.
 * Safe from UTC timezone shift.
 * Example: "2026-10" -> "Oktober 2026"
 */
export const formatPeriodIndo = (periodStr) => {
    if (!periodStr) return '-';
    const parts = String(periodStr).split('-');
    if (parts.length >= 2) {
        const year = parseInt(parts[0], 10);
        const monthIndex = parseInt(parts[1], 10) - 1;
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
        ];
        if (monthIndex >= 0 && monthIndex < 12 && !isNaN(year)) {
            return `${months[monthIndex]} ${year}`;
        }
    }
    return String(periodStr);
};

/**
 * Add or subtract months from a 'YYYY-MM' string.
 * Example: addMonthsToPeriod("2026-10", 1) -> "2026-11"
 * Example: addMonthsToPeriod("2026-12", 1) -> "2027-01"
 */
export const addMonthsToPeriod = (periodStr, n = 1) => {
    if (!periodStr) return '';
    const parts = String(periodStr).split('-');
    if (parts.length < 2) return periodStr;
    let year = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);
    if (isNaN(year) || isNaN(month)) return periodStr;
    month += n;
    while (month > 12) {
        month -= 12;
        year += 1;
    }
    while (month < 1) {
        month += 12;
        year -= 1;
    }
    return `${year}-${String(month).padStart(2, '0')}`;
};

/**
 * Return current local date as 'YYYY-MM-DD' without UTC offset drift.
 */
export const getLocalDateString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Return current local time as 'HH:mm'.
 */
export const getLocalTimeString = (d = new Date()) => {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

/**
 * Return current local period as 'YYYY-MM'.
 */
export const getLocalPeriodString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

/**
 * Format payment date & time for receipt, modals, and WhatsApp.
 * Handles both plain objects, ISO UTC timestamps, and YYYY-MM-DD strings.
 * Example result: "31 Oktober 2026 jam 23:15 WIB"
 */
export const formatPaymentDateTime = (receiptOrDate, fallbackTime = null) => {
    if (!receiptOrDate) return '-';

    // If receipt object passed
    if (typeof receiptOrDate === 'object') {
        if (receiptOrDate.formatted_payment_date) {
            return receiptOrDate.formatted_payment_date;
        }
        if (receiptOrDate.payment_datetime) {
            return receiptOrDate.payment_datetime;
        }
        return formatPaymentDateTime(
            receiptOrDate.payment_date || receiptOrDate.created_at,
            receiptOrDate.payment_time
        );
    }

    const str = String(receiptOrDate).trim();
    if (!str) return '-';

    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];

    // If ISO UTC string (contains 'T' or 'Z'), convert to local Date
    if (str.includes('T') || str.endsWith('Z')) {
        const d = new Date(str);
        if (!isNaN(d.getTime())) {
            const day = d.getDate();
            const monthName = months[d.getMonth()];
            const year = d.getFullYear();
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const timePart = fallbackTime || `${hours}:${minutes}`;
            return `${day} ${monthName} ${year} jam ${timePart} WIB`;
        }
    }

    // If YYYY-MM-DD or YYYY-MM-DD HH:mm:ss
    const parts = str.split(' ')[0].split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (monthIndex >= 0 && monthIndex < 12 && !isNaN(day) && !isNaN(year)) {
            const timePart = fallbackTime || (str.split(' ')[1] ? str.split(' ')[1].slice(0, 5) : getLocalTimeString());
            return `${day} ${months[monthIndex]} ${year} jam ${timePart} WIB`;
        }
    }

    return str;
};


