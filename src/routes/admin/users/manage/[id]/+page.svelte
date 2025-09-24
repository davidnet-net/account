<script lang="ts">
	import type { SessionInfo } from "$lib/types.ts";
	import { page } from "$app/state";
	import Error from "$lib/components/Error.svelte";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { authapiurl } from "$lib/config";
	import { accessToken, authFetch, getSessionInfo, refreshAccessToken } from "$lib/session";
	import type { ProfileResponse } from "$lib/types";
	import { FlexWrapper, Space, Loader, toast, ToolTip, LinkIconButton, Button, IconButton, Icon } from "@davidnet/svelte-ui";
	import { onMount } from "svelte";
	import { get } from "svelte/store";
	import { formatDate_PREFERREDTIME, wait } from "$lib/utils/time";

	let correlationID = crypto.randomUUID();

	let id = page.params.id || "";

	onMount(async () => {
		if (!id || typeof id !== "string") {
			return;
		}

		await refreshAccessToken(correlationID, true);
	});

	async function deleteacc() {
		const res = await authFetch(authapiurl + "moderate/delete_account", correlationID, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id })
		});
		if (res.ok) {
			toast({
				title: "User deleted",
				desc: "You are the best admin ever (:",
				icon: "check",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 5000
			});
			history.back();
		} else {
			toast({
				title: "User not deleted",
				desc: "ERROR",
				icon: "crisis_alert",
				appearance: "danger",
				position: "bottom-left",
				autoDismiss: 5000
			});
		}
	}
</script>

<FlexWrapper height="100%" width="100%" gap="var(--token-space-2);">
	<Icon icon="shield" size="10rem" />

	<Space height="var(--token-space-4);"/>
	<Button iconbefore="delete_forever" appearance="danger" onClick={deleteacc}>Delete user</Button>
	<Button
		appearance="subtle"
		onClick={() => {
			history.back();
		}}>Back</Button
	>
</FlexWrapper>
