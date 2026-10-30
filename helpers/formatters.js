/**
 * Utility functions for formatting currencies, dates, text, and asset URLs.
 */
import { STORAGE_URL } from './api';

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
 * Correctly handles relative paths, paths with/without 'storage/' prefix,
 * and already absolute URLs.
 */
export const getStorageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    const cleanPath = path.replace(/^\/?storage\/?/, '').replace(/^\/+/, '');
    return `${STORAGE_URL}/${cleanPath}`;
};
