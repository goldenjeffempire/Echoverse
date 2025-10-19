/**
 * CRITICAL FIX #16: Address Encryption at Rest
 * Encrypts/decrypts shipping and billing addresses in orders
 */
import { encryptSensitiveField, decryptSensitiveField } from './encryption';
import { logger } from '../logger';
/**
 * Encrypt an address object for storage
 */
export function encryptAddress(address) {
    if (!address || Object.keys(address).length === 0) {
        return null;
    }
    try {
        const addressJson = JSON.stringify(address);
        const encrypted = encryptSensitiveField(addressJson);
        return {
            encryptedData: encrypted,
            _encrypted: true
        };
    }
    catch (error) {
        logger.error('Address encryption failed', error instanceof Error ? error : undefined);
        throw new Error('Failed to encrypt address');
    }
}
/**
 * Decrypt an encrypted address
 */
export function decryptAddress(encryptedAddress) {
    if (!encryptedAddress) {
        return null;
    }
    // Check if already decrypted (legacy or plaintext data)
    if (!('_encrypted' in encryptedAddress) || !encryptedAddress._encrypted) {
        return encryptedAddress;
    }
    try {
        const decrypted = decryptSensitiveField(encryptedAddress.encryptedData);
        return JSON.parse(decrypted);
    }
    catch (error) {
        logger.error('Address decryption failed', error instanceof Error ? error : undefined);
        // Return null rather than throwing to handle corrupted data gracefully
        return null;
    }
}
/**
 * Encrypt multiple addresses (shipping & billing)
 */
export function encryptAddresses(addresses) {
    return {
        shipping: encryptAddress(addresses.shipping),
        billing: encryptAddress(addresses.billing)
    };
}
/**
 * Decrypt multiple addresses (shipping & billing)
 */
export function decryptAddresses(addresses) {
    return {
        shipping: decryptAddress(addresses.shipping),
        billing: decryptAddress(addresses.billing)
    };
}
/**
 * Mask an address for logging (show only city and state)
 */
export function maskAddress(address) {
    if (!address)
        return null;
    return {
        city: address.city,
        state: address.state,
        country: address.country,
        // Hide street, postal code, and phone for privacy
    };
}
