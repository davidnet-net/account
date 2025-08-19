<script lang="ts">
	import Error from "$lib/components/Error.svelte";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { authapiurl } from "$lib/config";
	import { authFetch, getSessionInfo } from "$lib/session";
	import type { SessionInfo } from "$lib/types";
	import { FlexWrapper, Space, Icon, LinkButton, Button, Modal } from "@davidnet/svelte-ui";
	import { onMount } from "svelte";

	let correlationID = crypto.randomUUID();
	let error = false;
	let loading = true;
	let sessionInfo: SessionInfo | null;
	let showDeleteAccModal = false;
	let errorMSG = "Unknown";
	let deletedacc = false;

	onMount(async () => {
		const si = await getSessionInfo(correlationID);

		sessionInfo = si;

		loading = false;
	});

	async function DeleteAcc() {
		try {
			const res = await authFetch(`${authapiurl}settings/data/delete_account`, correlationID, {
				method: "POST",
				headers: { "Content-Type": "application/json" }
			});
			if (!res.ok) throw "something exploded";
			deletedacc = true;
		} catch (e) {
			console.error(e);
			errorMSG = String(e);
			error = true;
		} finally {
			loading = false;
			showDeleteAccModal = false;
		}
	}
</script>

{#if error}
	<Error pageName="Data" errorMSG="{errorMSG}" />
{:else if deletedacc}
	<FlexWrapper width="100%" height="100%">
		<Icon icon="delete_forever" size="10rem" color="var(--token-color-text-danger)"/>
		<h1>Account scheduled for deletion</h1>
		<p>View your email for more information.</p>
		<a href="https://davidnet.net/legal/info/delete_account/">Learn more</a>
	</FlexWrapper>
{:else if loading}
	<h1>Data</h1>
	<ProfileLoader />
{:else}
	<Space height="var(--token-space-4)" />
	<FlexWrapper width="100%" justifycontent="space-around" direction="row">
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
		<h1>Account Data</h1>
		<Space height="var(--token-space-4)" />
		<Button
			onClick={() => {
				showDeleteAccModal = true;
			}}
			appearance="danger">Delete my account</Button
		>
		<Space height="var(--token-space-4)" />
		<Button onClick={() => {}} appearance="discover">Request my data</Button>
		<Space height="var(--token-space-4)" />
	</FlexWrapper>
{/if}

{#if showDeleteAccModal}
	<Modal
		title="Delete your account?"
		titleIcon="delete_forever"
		desc="This cannot be undone?"
		hasCloseBtn
		on:close={() => (showDeleteAccModal = false)}
		options={[
			{
				appearance: "subtle",
				content: "Cancel",
				onClick: () => (showDeleteAccModal = false)
			},
			{ appearance: "danger", content: "Delete account", onClick: DeleteAcc }
		]}
	/>
{/if}

<style>
	h1 {
		text-align: center;
		font-size: 1.85rem;
	}
</style>
