<script lang="ts">
	import { goto } from "$app/navigation";
	import Error from "$lib/components/Error.svelte";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { getSessionInfo, isAuthenticated } from "$lib/session";
	import type { SessionInfo } from "$lib/session";
	import { onMount } from "svelte";

	let correlationID = crypto.randomUUID();
	let error = false;
	let Authenticated = false;

	onMount(async () => {
		const si = await getSessionInfo(correlationID);

		if (!(await isAuthenticated(correlationID)) || !si) {
			goto("/login");
			return;
		}

		if (!si || si.email_verified === 0 || false) {
			goto("/verify/email/check/" + si?.email);
			return;
		}

		Authenticated = true;
	});

</script>

{#if error}
	<Error pageName="My Davidnet Account" errorMSG="Unknown" />
{:else if Authenticated}
    <slot/>
{:else}
    <ProfileLoader/>
{/if}
