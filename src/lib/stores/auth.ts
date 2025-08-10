import { writable, get, derived } from "svelte/store";
export const accessToken = writable<string | null>(null);

// Simple helper to check if user is logged in
export const isLoggedIn = derived(accessToken, (accessToken) => !!accessToken);
