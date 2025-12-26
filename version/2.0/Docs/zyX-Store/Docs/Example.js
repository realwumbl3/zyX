import { Cookies } from '../../zyX-Store.js';

// Example 1: Basic Cookie Operations
console.log('\n=== Basic Cookie Operations ===');
Cookies.set('testCookie', 'Hello World');
console.log('Cookie value:', Cookies.get('testCookie'));
Cookies.delete('testCookie');
console.log('Cookie after deletion:', Cookies.get('testCookie'));

// Example 2: Cookie with Expiration
console.log('\n=== Cookie with Expiration ===');
Cookies.set('expiringCookie', 'This will expire in 1 day', 1);
console.log('Expiring cookie value:', Cookies.get('expiringCookie'));

// Example 3: Default Values
console.log('\n=== Default Values ===');
console.log('Non-existent cookie with default:', Cookies.get('nonExistent', 'Default Value'));

// Example 4: Boolean Values
console.log('\n=== Boolean Values ===');
Cookies.set('isLoggedIn', true);
console.log('Boolean cookie value:', Cookies.get('isLoggedIn'));

// Example 5: Complex Objects
console.log('\n=== Complex Objects ===');
const userPreferences = {
    theme: 'dark',
    language: 'en',
    notifications: true
};
Cookies.set('userPreferences', userPreferences);
const retrieved = Cookies.get('userPreferences');
console.log('Retrieved preferences:', retrieved);

// Clean up
console.log('\n=== Cleanup ===');
Cookies.delete('expiringCookie');
Cookies.delete('isLoggedIn');
Cookies.delete('userPreferences'); 