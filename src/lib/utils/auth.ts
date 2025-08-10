import { accessToken } from "$lib/stores/auth";

export async function refreshToken() {
	const res = await fetch("/refresh", {
		method: "POST",
		credentials: "include"
	});

	if (res.ok) {
		const data = await res.json();
		accessToken.set(data.accessToken);
		return data.accessToken;
	} else {
		accessToken.set(null);
		throw new Error("Refresh token expired");
	}
}
