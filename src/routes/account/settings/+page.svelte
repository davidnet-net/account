<script lang="ts">
	import Error from "$lib/components/Error.svelte";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { getSessionInfo } from "$lib/session";
	import type { SessionInfo } from "$lib/session";
	import { FlexWrapper, Space, Icon, LinkButton, Button } from "@davidnet/svelte-ui";
	import { onMount } from "svelte";

	let correlationID = crypto.randomUUID();
	let error = false;
	let loading = true;
	let sessionInfo: SessionInfo | null;

    onMount(async () => {
		const si = await getSessionInfo(correlationID);

		sessionInfo = si;

		loading = false;
	});
</script>

{#if error}
	<Error pageName="Account Settings" errorMSG="Unknown" />
{:else if loading}
	<h1>Account Settings</h1>
	<ProfileLoader />
{:else}
	<Space height="var(--token-space-4)" />
	<FlexWrapper width="100%" justifycontent="space-around" direction="row">
        <Button onClick={() => {history.back();}} iconbefore="arrow_back">Back</Button>
        <LinkButton href="/logout" iconafter="logout">Log out</LinkButton>
    </FlexWrapper>
    <Space height="var(--token-space-4)" />
	<FlexWrapper height="100%" width="100%"> 
        <h1>Account management</h1>
		<Space height="var(--token-space-4)" />
		<FlexWrapper direction="row" gap="var(--token-space-6)">
			<a href="settings/preferences" class="option">
				<FlexWrapper height="100%" width="100%">
					<Icon icon="tune" size="3rem" />
					<p class="option-text">Preferences</p>
				</FlexWrapper>
			</a>
			<a href="settings/security" class="option">
				<FlexWrapper height="100%" width="100%">
					<Icon icon="security" size="3rem" />
					<p class="option-text">Security</p>
				</FlexWrapper>
			</a>
			<a href="settings/profile" class="option">
				<FlexWrapper height="100%" width="100%">
					<Icon icon="identity_platform" size="3rem" />
					<p class="option-text">Profile</p>
				</FlexWrapper>
			</a>
		</FlexWrapper>
        <Space height="var(--token-space-4)" />
        <FlexWrapper direction="row" gap="var(--token-space-6)">
			<a href="settings/connections" class="option">
				<FlexWrapper height="100%" width="100%">
					<Icon icon="groups" size="3rem" />
					<p class="option-text">Connections</p>
				</FlexWrapper>
			</a>
			<a href="settings/data" class="option">
				<FlexWrapper height="100%" width="100%">
					<Icon icon="data_usage" size="3rem" />
					<p class="option-text">Data</p>
				</FlexWrapper>
			</a>
			<a href="https://davidnet.net/legal/" class="option">
				<FlexWrapper height="100%" width="100%">
					<Icon icon="policy" size="3rem" />
					<p class="option-text">Policies</p>
				</FlexWrapper>
			</a>
		</FlexWrapper>
        <Space height="var(--token-space-4)" />
        <Button onClick={() => {history.back();}} iconbefore="arrow_back">Back</Button>
	</FlexWrapper>
{/if}

<style>
	h1 {
		text-align: center;
		font-size: 1.85rem;
	}

	.option {
		text-decoration: none;
		color: var(--token-color-text-default-normal);
		text-align: center;
		border-radius: 2rem;
		background-color: var(--token-color-surface-raised-normal);
		padding: 1rem;
		transition: transform 0.4s ease, box-shadow 0.4s ease;
        height: 8rem;
        width: 4rem;
	}

	.option:hover {
		background-color: var(--token-color-surface-raised-hover);
		transform: scale(1.05);
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
	}

	.option:active, .option:focus {
		background-color: var(--token-color-surface-raised-pressed);
	}

    .option:focus {
        outline: 2px solid var(--token-color-focusring);
    }

	.option-text {
		line-height: 1.2;
	}
</style>
