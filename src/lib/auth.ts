/**
 * Password management - stores password in memory only
 */

let storedPassword: string | null = null;

/**
 * Set the password (stored in memory only)
 */
export function setPassword(password: string): void {
  storedPassword = password;
}

/**
 * Get the stored password
 */
export function getPassword(): string | null {
  return storedPassword;
}

/**
 * Check if password is set
 */
export function hasPassword(): boolean {
  return storedPassword !== null;
}

/**
 * Clear the stored password
 */
export function clearPassword(): void {
  storedPassword = null;
}

/**
 * Get headers with authentication
 */
export function getAuthHeaders(): HeadersInit {
  const password = getPassword();
  if (!password) {
    return {};
  }
  return {
    'X-Auth': password,
  };
}

