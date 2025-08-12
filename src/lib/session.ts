import { writable, get } from 'svelte/store';
import { toast } from "@davidnet/svelte-ui"
import { authapiurl } from './config';


export const accessToken = writable<string | null>(null); // Store

// Variables
let refreshingPromise: Promise<boolean> | null = null;

/**
 * Gets an new access token!
 * @returns boolean if refresh is succesfull
 */

export async function refreshAccessToken(correlationID: string): Promise<boolean> {
    if (refreshingPromise) {
        // Another refresh is in progress wait for it to finish
        return refreshingPromise;
    }

    refreshingPromise = (async () => {
        try {
            const res = await fetch(authapiurl + "refresh", {
                method: 'POST',
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                    "x-correlation-id": correlationID
                },
            });

            if (!res.ok) {
                accessToken.set(null);
                return false;
            }

            const data = await res.json();

            if (data.accessToken) {
                accessToken.set(data.accessToken);
                return true;
            } else {
                toast({
                    title: "Authentication Failed",
                    desc: "Session expired",
                    icon: "crisis_alert",
                    appearance: "danger",
                    position: "bottom-left"
                });
                accessToken.set(null);
                return false;
            }
        } catch (error) {
            toast({
                title: "Authentication Failed",
                desc: "Error: Couldn't connect to authentication servers.",
                icon: "crisis_alert",
                appearance: "danger",
                position: "bottom-left"
            });
            accessToken.set(null);
            return false;
        } finally {
            refreshingPromise = null; // Clear that lock
        }
    })();

    return refreshingPromise;
}

export interface SessionInfo {
    userId: number;
    username: string;
    type: "access";
    exp: number;
    jti: string;
}

/**
 * @returns SessionInfo | Returns null if unauthencated.
 */
export function GetSessionInfo(): SessionInfo | null {
    const token = get(accessToken);
    if (!token) {
        return null;
    }

    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        atob(base64)
            .split('')
            .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
            .join('')
    );

    return JSON.parse(jsonPayload) as SessionInfo;
}

/**
 * A wrapper around fetch that automatically adds Authorization and correlation ID headers,
 * and attempts to refresh the access token and retry the request on a 401 Unauthorized response.
 *
 * @param input - The resource that you wish to fetch. Can be a URL string or a Request object.
 * @param correlationID - A unique identifier for tracing the request, added as "x-correlation-id" header.
 * @param init - Optional fetch init options (method, headers, body, etc.).
 *
 * @returns The fetch Response object, either from the initial request or after a successful token refresh retry.
 *
 * @example
 * const res = await authFetch('/api/data', 'uuid v4 here', {
 *   method: 'GET'
 * });
 *
 * if (res.ok) {
 *   const data = await res.json();
 *   console.log(data);
 * } else {
 *   console.error('Request failed with status', res.status);
 * }
 */
export async function authFetch(input: RequestInfo, correlationID: string, init?: RequestInit) {
    const token = get(accessToken);
    const headers = new Headers(init?.headers);

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('x-correlation-id', correlationID);

    let res = await fetch(input, {
        ...init,
        headers,
        credentials: 'include',
    });

    if (res.status === 401) {
        const refreshed = await refreshAccessToken(correlationID);

        if (refreshed) {
            const newToken = get(accessToken);
            if (newToken) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            headers.set('x-correlation-id', correlationID);

            res = await fetch(input, {
                ...init,
                headers,
                credentials: 'include',
            });
        }
    }

    return res;
}

export function isAuthenticated(): boolean {
  const session = GetSessionInfo();
  if (!session) return false;

  const now = Math.floor(Date.now() / 1000);
  return session.exp > now;
}

export function getUserId(): number | null {
  const session = GetSessionInfo();
  return session ? session.userId : null;
}

export function getUsername(): string | null {
  const session = GetSessionInfo();
  return session ? session.username : null;
}

export function logout() {
  accessToken.set(null);
  //TODO invalidate session on the server!
}
