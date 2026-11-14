/**
 * AFTERGLOW Authentication & Session State Management
 * Passwordless OTP, reactive state sync, role helpers.
 */

import { api, type ApiResponse } from './api';

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  role_id: number;
  is_verified?: boolean;
  no_hp?: string;
  created_at?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
}

export interface RequestOtpResponse {
  email: string;
  expires_in_seconds: number;
  otp?: string; // Provided by backend in DEV mode
}

export interface VerifyOtpResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

export const USER_ROLES = {
  USER: 1,
  ORGANIZER: 2,
  ADMIN: 3,
} as const;

export function getStoredUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('afterglow_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('afterglow_access_token');
}

export function getStoredRole(): number | null {
  const user = getStoredUser();
  return user?.role_id ?? null;
}

export function isOrganizer(): boolean {
  return getStoredRole() === USER_ROLES.ORGANIZER;
}

export function isAdmin(): boolean {
  return getStoredRole() === USER_ROLES.ADMIN;
}

export function hasOrganizerAccess(): boolean {
  const role = getStoredRole();
  return role === USER_ROLES.ORGANIZER || role === USER_ROLES.ADMIN;
}

export function canScanGate(): boolean {
  const user = getStoredUser();
  if (!user) return false;
  return (
    user.role_id === USER_ROLES.ADMIN ||
    user.role_id === USER_ROLES.ORGANIZER ||
    user.email.toLowerCase().includes('gatecrew')
  );
}

/**
 * Step 1: Request Passwordless OTP
 */
export async function requestOtp(email: string, username?: string): Promise<RequestOtpResponse> {
  const data = await api.post<RequestOtpResponse>('/auth/request-otp', {
    email: email.trim().toLowerCase(),
    ...(username?.trim() ? { username: username.trim() } : {}),
  });
  return data;
}

/**
 * Step 2: Verify 6-digit OTP and establish session
 */
export async function verifyOtp(email: string, otp: string, username?: string): Promise<VerifyOtpResponse> {
  const data = await api.post<VerifyOtpResponse>('/auth/verify-otp', {
    email: email.trim().toLowerCase(),
    otp: otp.trim(),
    ...(username?.trim() ? { username: username.trim() } : {}),
  });

  if (typeof window !== 'undefined' && data.tokens && data.user) {
    localStorage.setItem('afterglow_access_token', data.tokens.access_token);
    localStorage.setItem('afterglow_refresh_token', data.tokens.refresh_token);
    localStorage.setItem('afterglow_user', JSON.stringify(data.user));
    document.documentElement.setAttribute('data-auth', 'true');

    // Dispatch global event for reactive UI updates across all components
    window.dispatchEvent(
      new CustomEvent('afterglow-auth-changed', {
        detail: { user: data.user, isAuthenticated: true },
      })
    );
  }

  return data;
}

function hasUserChanged(prev: UserProfile | null, next: UserProfile): boolean {
  if (!prev) return true;
  return (
    prev.id !== next.id ||
    prev.email !== next.email ||
    prev.username !== next.username ||
    prev.role_id !== next.role_id ||
    Boolean(prev.is_verified) !== Boolean(next.is_verified) ||
    (prev.no_hp || '') !== (next.no_hp || '')
  );
}

/**
 * Fetch latest user profile from server.
 * Only broadcasts 'afterglow-auth-changed' if identity or profile fields actually changed,
 * preventing redundant double-fetch skeleton flickers across pages.
 */
export async function fetchCurrentUser(): Promise<UserProfile | null> {
  if (!isAuthenticated()) return null;
  try {
    const prev = getStoredUser();
    const profile = await api.get<UserProfile>('/users/me');
    if (typeof window !== 'undefined' && profile) {
      localStorage.setItem('afterglow_user', JSON.stringify(profile));
      document.documentElement.setAttribute('data-auth', 'true');
      if (hasUserChanged(prev, profile)) {
        window.dispatchEvent(
          new CustomEvent('afterglow-auth-changed', {
            detail: { user: profile, isAuthenticated: true },
          })
        );
      }
    }
    return profile;
  } catch {
    return null;
  }
}

/**
 * Terminate session & clear storage
 */
export async function logout(): Promise<void> {
  if (typeof window !== 'undefined') {
    const refreshToken = localStorage.getItem('afterglow_refresh_token');
    try {
      await api.post('/auth/logout', { refresh_token: refreshToken });
    } catch {
      // Ignore network error on logout
    }

    localStorage.removeItem('afterglow_access_token');
    localStorage.removeItem('afterglow_refresh_token');
    localStorage.removeItem('afterglow_user');
    document.documentElement.setAttribute('data-auth', 'false');

    window.dispatchEvent(
      new CustomEvent('afterglow-auth-changed', {
        detail: { user: null, isAuthenticated: false },
      })
    );
  }
}
