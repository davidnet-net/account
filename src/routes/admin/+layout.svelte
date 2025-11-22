<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import Error from "$lib/components/Error.svelte";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import type { SessionInfo } from "$lib/types";
	import { onMount } from "svelte";
	import { refreshAccessToken, getSessionInfo, isAuthenticated, Button, FlexWrapper, LinkButton, Space } from "@davidnet/svelte-ui";

	let correlationID = crypto.randomUUID();
	let error = false;
	let Authenticated = false;

	onMount(async () => {
		try {
			const si: SessionInfo | null = await getSessionInfo(correlationID);

			if (!(await isAuthenticated(correlationID)) || !si || !si.admin) {
				goto("/login?redirect=" + encodeURIComponent(page.url.toString()));
				return;
			}

			if (!si || si.email_verified === 0) {
				goto("/verify/email/check/" + si?.email);
				return;
			}

			Authenticated = true;
			setInterval(
				() => {
					refreshAccessToken(correlationID, true, false);
				},
				12 * 60 * 1000
			);
		} catch (e) {
			console.error("Session error:", e);
			error = true;
		}
	});
</script>

<FlexWrapper width="100%" justifycontent="flex-end" direction="row">
	<Button
		onClick={() => {
			history.back();
		}}
		iconbefore="arrow_back">Back</Button
	>

	<LinkButton href="/logout" iconafter="logout">Log out</LinkButton>
</FlexWrapper>
<Space height="var(--token-space-4)" />
<FlexWrapper height="100%" width="100%">
	{#if error}
		<Error pageName="My Davidnet Account" errorMSG="Unknown" />
	{:else if Authenticated}
		<slot />
	{:else}
		<ProfileLoader />
	{/if}
</FlexWrapper>
