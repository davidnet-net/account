<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import Error from "$lib/components/Error.svelte";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { getSessionInfo, isAuthenticated, refreshAccessToken } from "$lib/session";
	import type { SessionInfo } from "$lib/types";
	import { onMount } from "svelte";

	let correlationID = crypto.randomUUID();
	let error = false;
	let Authenticated = false;

	onMount(async () => {
		try {
			const si: SessionInfo | null = await getSessionInfo(correlationID);

			if (!(await isAuthenticated(correlationID)) || !si) {
				goto("/login?redirect=" + encodeURIComponent(page.url.toString()));
				return;
			}

			if (!si || si.email_verified === 0) {
				goto("/verify/email/check/" + si?.email);
				return;
			}

			Authenticated = true;
			setInterval(()=>{refreshAccessToken(correlationID, true, false)}, 12 * 60 * 1000);
		} catch (e) {
			console.error("Session error:", e);
			error = true;
		}
	});
</script>

{#if error}
	<Error pageName="My Davidnet Account" errorMSG="Unknown" />
{:else if Authenticated}
	<slot/>
{:else}
	<ProfileLoader/>
{/if}
