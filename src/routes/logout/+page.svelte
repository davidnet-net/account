<script lang="ts">
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { authapiurl } from "$lib/config";
	import Error from "$lib/components/Error.svelte";
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { authFetch, getSessionInfo, refreshAccessToken, wait, toast } from "@davidnet/svelte-ui";
	import { _ } from "svelte-i18n";

	let loading = true;
	let error = false;
	let correlationID = crypto.randomUUID();

	let errorMSG = "";

	onMount(async () => {
		refreshAccessToken(correlationID, false, true);
		const si = await getSessionInfo(correlationID);

		if (!si) {
			errorMSG = $_("account.logout.error.session_invalid"); // Already logged out? Session Invalid.
			error = true;
			loading = false;
			return;
		}

		try {
			const res = await authFetch(`${authapiurl}logout`, correlationID, {
				method: "POST",
				headers: { "Content-Type": "application/json" }
			});
			if (!res.ok) throw $_("account.logout.error.failed"); // Logout failed
			toast({
				title: $_("account.logout.toast.success.title"), // Logout successfully!
				desc: $_("account.logout.toast.success.desc", { values: { username: si.username } }), // Bye {username} 👋.
				icon: "logout",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 7000
			});
			await wait(1500);
			goto("/");
		} catch (e) {
			console.error(e);
			errorMSG = String(e);
			error = true;
		}
		loading = false;
	});
</script>

{#if error}
	<Error pageName={$_("account.logout.title")} {correlationID} errorMSG={errorMSG} />
{:else if loading}
	<ProfileLoader width="5rem" height="5rem" />
{/if}
