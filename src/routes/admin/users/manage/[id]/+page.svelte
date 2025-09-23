<script lang="ts">
	import type { SessionInfo } from "$lib/types.ts";
	import { page } from "$app/state";
	import Error from "$lib/components/Error.svelte";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { authapiurl } from "$lib/config";
	import { accessToken, authFetch, getSessionInfo, refreshAccessToken } from "$lib/session";
	import type { ProfileResponse } from "$lib/types";
	import { FlexWrapper, Space, Loader, toast, ToolTip, LinkIconButton, Button, IconButton } from "@davidnet/svelte-ui";
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
		const res = await fetch(authapiurl + "moderate/delete_account", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-correlation-id": correlationID
			},
			body: JSON.stringify({ id }),
			credentials: "include"
		});

        if (res.ok) {
            history.back();
        }
	}
</script>

<Button appearance="subtle" onClick={()=>{history.back()}}>Back</Button>
<Button appearance="danger" onClick={deleteacc}>Delete USER</Button>