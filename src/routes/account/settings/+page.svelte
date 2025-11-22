<script lang="ts">
	import Error from "$lib/components/Error.svelte";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { FlexWrapper, Space, Icon, LinkButton, Button } from "@davidnet/svelte-ui";
	import { onMount } from "svelte";
	import { _ } from 'svelte-i18n';

	let error = false;
	let loading = true;

	onMount(async () => {
		loading = false;
	});
</script>

{#if error}
	<Error pageName={$_('account.settings.title')} errorMSG={$_('account.settings.error.unknown')} />
{:else if loading}
	<h1>{$_('account.settings.title')}</h1>
	<ProfileLoader />
{:else}
	<Space height="var(--token-space-4)" />
	<FlexWrapper width="100%" justifycontent="space-around" direction="row">
		<Button
			onClick={() => {
				history.back();
			}}
			iconbefore="arrow_back">{$_('account.settings.btn.back')}</Button>

		<LinkButton href="/logout" iconafter="logout">{$_('account.settings.btn.logout')}</LinkButton>
	</FlexWrapper>
	<Space height="var(--token-space-4)" />
	<FlexWrapper height="100%" width="100%">
		<h1>{$_('account.settings.management.title')}</h1>
		<Space height="var(--token-space-4)" />
		<FlexWrapper direction="row" gap="var(--token-space-6)">
			<a href="settings/preferences" class="option">
				<FlexWrapper height="100%" width="100%">
					<Icon icon="tune" size="3rem" />
					<p class="option-text">{$_('account.settings.option.preferences')}</p>
				</FlexWrapper>
			</a>
			<a href="settings/security" class="option">
				<FlexWrapper height="100%" width="100%">
					<Icon icon="security" size="3rem" />
					<p class="option-text">{$_('account.settings.option.security')}</p>
				</FlexWrapper>
			</a>
			<a href="settings/profile" class="option">
				<FlexWrapper height="100%" width="100%">
					<Icon icon="identity_platform" size="3rem" />
					<p class="option-text">{$_('account.settings.option.profile')}</p>
				</FlexWrapper>
			</a>
		</FlexWrapper>
		<Space height="var(--token-space-4)" />
		<FlexWrapper direction="row" gap="var(--token-space-6)">
			<a href="settings/connections" class="option">
				<FlexWrapper height="100%" width="100%">
					<Icon icon="groups" size="3rem" />
					<p class="option-text">{$_('account.settings.option.connections')}</p>
				</FlexWrapper>
			</a>
			<a href="settings/data" class="option">
				<FlexWrapper height="100%" width="100%">
					<Icon icon="data_usage" size="3rem" />
					<p class="option-text">{$_('account.settings.option.data')}</p>
				</FlexWrapper>
			</a>
			<a href="https://davidnet.net/legal/" class="option">
				<FlexWrapper height="100%" width="100%">
					<Icon icon="policy" size="3rem" />
					<p class="option-text">{$_('account.settings.option.policies')}</p>
				</FlexWrapper>
			</a>
		</FlexWrapper>
		<Space height="var(--token-space-4)" />
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
		transition:
			transform 0.4s ease,
			box-shadow 0.4s ease;
		height: 8rem;
		width: 4rem;
	}

	.option:hover {
		background-color: var(--token-color-surface-raised-hover);
		transform: scale(1.05);
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
	}

	.option:active,
	.option:focus {
		background-color: var(--token-color-surface-raised-pressed);
	}

	.option:focus {
		outline: 2px solid var(--token-color-focusring);
	}

	.option-text {
		line-height: 1.2;
	}
</style>
