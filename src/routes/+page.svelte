<script lang="ts">
	import { goto } from "$app/navigation";
	import Error from "$lib/components/Error.svelte";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import type { SessionInfo } from "$lib/types";
	import { FlexWrapper, Space, Icon, Loader, LinkButton, Button, getSessionInfo, isAuthenticated, refreshAccessToken } from "@davidnet/svelte-ui";
	import { onMount } from "svelte";
	import { fly } from "svelte/transition";
	import { _ } from "svelte-i18n";

	let correlationID = crypto.randomUUID();
	let error = false;
	let Authenticated = false;
	let sessionInfo: SessionInfo | null;

	function getGreeting(name: string | undefined) {
		if (!name) return "";
		const hour = new Date().getHours();
		if (hour < 6) return `${$_("account.index.greeting.night", { values: { name } })}`;
		if (hour < 12) return `${$_("account.index.greeting.morning", { values: { name } })}`;
		if (hour < 18) return `${$_("account.index.greeting.afternoon", { values: { name } })}`;
		return `${$_("account.index.greeting.evening", { values: { name } })}`;
	}

	onMount(async () => {
		await refreshAccessToken(correlationID, true, true);

		const si = await getSessionInfo(correlationID);
		if (!(await isAuthenticated(correlationID)) || !si) {
			goto("/login");
			return;
		}

		if (!si || si.email_verified === 0 || false) {
			goto("/verify/email/check/" + si?.email);
			return;
		}

		sessionInfo = si;
		Authenticated = true;
	});

	$: greeting = getGreeting(sessionInfo?.display_name);
</script>

{#if error}
	<Error pageName={$_("account.index.error.title")} errorMSG={$_("account.index.error.unknown")} />
{:else if Authenticated}
	<Space height="var(--token-space-4)" />
	<FlexWrapper width="100%" justifycontent="flex-end" direction="row">
		<Button
			onClick={() => {
				history.back();
			}}
			iconbefore="arrow_back">{$_("account.index.btn.back")}</Button
		>

		<LinkButton href="/logout" iconafter="logout">{$_("account.index.btn.logout")}</LinkButton>
	</FlexWrapper>
	<FlexWrapper height="100%" width="100%">
		{#if sessionInfo && sessionInfo.profilePicture}
			<img
				class="profile"
				src={sessionInfo.profilePicture}
				crossorigin="anonymous"
				aria-hidden="true"
				alt={$_("account.index.profile.alt")}
				height="100px"
				width="100px"
			/>
		{:else}
			<Loader />
			<Space height="var(--token-space-4)" />
		{/if}
		<Space height="var(--token-space-2)" />
		<h2 in:fly={{ y: 15, duration: 2000 }}>{greeting}</h2>
		<Space height="var(--token-space-6)" />
		<FlexWrapper direction="row" gap="var(--token-space-6)">
			<a href="https://home.davidnet.net" class="option">
				<FlexWrapper height="100%" width="100%">
					<Icon icon="home" size="3rem" />
					<p class="option-text">{$_("account.index.option.home")}</p>
				</FlexWrapper>
			</a>
			<a href="/account/settings" class="option">
				<FlexWrapper height="100%" width="100%">
					<Icon icon="settings_account_box" size="3rem" />
					<p class="option-text">{$_("account.index.option.manage")}</p>
				</FlexWrapper>
			</a>
			<a href="/profile/{sessionInfo?.userId}" class="option">
				<FlexWrapper height="100%" width="100%">
					<Icon icon="identity_platform" size="3rem" />
					<p class="option-text">{$_("account.index.option.profile")}</p>
				</FlexWrapper>
			</a>
		</FlexWrapper>
	</FlexWrapper>
{:else}
	<h1>{$_("account.index.title")}</h1>
	<ProfileLoader />
{/if}

<style>
	.profile {
		border-radius: 50%;
	}

	h1 {
		text-align: center;
		font-size: 1.85rem;
	}

	h2 {
		text-align: center;
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
