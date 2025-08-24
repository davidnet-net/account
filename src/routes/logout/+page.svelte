<script>
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { authapiurl } from "$lib/config";
	import Error from "$lib/components/Error.svelte";
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { authFetch, getSessionInfo, refreshAccessToken } from "$lib/session";
	import { toast } from "@davidnet/svelte-ui";

	let loading = false;
	let error = false;
	let correlationID = crypto.randomUUID();

	let errorMSG = "";

	onMount(async () => {
		refreshAccessToken(correlationID, false, true);
		const si = await getSessionInfo(correlationID);

		if (!si) {
			errorMSG = "Already logged out? Session Invalid.";
			error = true;
			loading = false;
			return;
		}

		try {
			const res = await authFetch(`${authapiurl}logout`, correlationID, {
				method: "POST",
				headers: { "Content-Type": "application/json" }
			});
			if (!res.ok) throw "Logout failed";
			toast({
				title: "Logout successfully!",
				desc: "Bye " + si.username + "👋.",
				icon: "logout",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 7000
			});
            goto("/")
		} catch (e) {
			console.error(e);
			errorMSG = String(e);
			error = true;
		}

		loading = false;
	});
</script>

{#if error}
	<Error pageName="Logout" {correlationID} {errorMSG} />
{:else if loading}
	<ProfileLoader width="5rem" height="5rem" />
{/if}
