import { toast } from "@davidnet/svelte-ui";
import { get } from "svelte/store";
import { accessToken } from "$lib/stores/auth";
import { refreshToken } from "$lib/utils/auth";

export async function fetchdata<T>(url: string, options: RequestInit = {}): Promise<T> {
	const res = await fetch(url, options);

	if (!res.ok) {
		toast({
			title: "Fetch Error",
			desc: "Error: " + res.status + " | " + res.statusText,
			icon: "crisis_alert",
			appearance: "danger",
			position: "bottom-left"
		});
		throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
	}

	return res.json() as Promise<T>;
}

export async function fetchAuthenticated(input: RequestInfo, init: RequestInit = {}) {
	let token = get(accessToken);

	// Add auth header if token exists
	if (token) {
		init.headers = {
			...(init.headers || {}),
			Authorization: `Bearer ${token}`
		};
	}

	// Ensure cookies are sent for refresh endpoint and others if needed
	init.credentials = "include";

	let res = await fetch(input, init);

	// If unauthorized, try refresh token flow once
	if (res.status === 401) {
		try {
			token = await refreshToken();

			// Retry original request with new token
			init.headers = {
				...(init.headers || {}),
				Authorization: `Bearer ${token}`
			};
			res = await fetch(input, init);
		} catch {
			// Or unauthencated
			toast({
				title: "Authentication Error",
				desc: "Error: " + res.status + " | " + res.statusText,
				icon: "crisis_alert",
				appearance: "danger",
				position: "bottom-left"
			});
			accessToken.set(null);
		}
	}

	return res;
}
