<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { getSessionInfo } from "$lib/session";
	import type { SessionInfo } from "$lib/types";
	import { ThemeProvider, Toaster, ConnectivityCheck, FlexWrapper, Avatar, ThemeMenu, LinkIconButton } from "@davidnet/svelte-ui";
	import { onMount } from "svelte";
	let correlationID = crypto.randomUUID();

	let { children } = $props();

	let fontsLoaded = $state(false);
	let si: SessionInfo | null = $state(null);

	// This will run only in the browser
	if (typeof window !== "undefined") {
		document.fonts.ready.then(() => {
			fontsLoaded = true;
		});
	}

	onMount(async () => {
		const initloader = document.getElementById("initloader");
		if (initloader) initloader.remove();

		si = await getSessionInfo(correlationID, true);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ThemeProvider />
<Toaster />
<ConnectivityCheck />

{#if fontsLoaded}
	<nav id="main-nav">
		<div class="nav-left">
			<LinkIconButton icon="apps" alt="Davidnet Home" href="https://home.davidnet.net" appearance="subtle" /><a href="/">My Account</a>
		</div>
		<div class="nav-center">Davidnet</div>
		<div class="nav-right">
			<ThemeMenu />
			<Avatar id={String(si?.userId)} owner name={si?.display_name} presence="online" src={si?.profilePicture} />
		</div>
	</nav>
{/if}

<FlexWrapper direction="column" height="calc(100vh - 48px);" width="100%;" justifycontent="center" alignitems="center">
	<div id="background">
		{#if fontsLoaded}
			{@render children?.()}
		{:else}
			<ProfileLoader width="5rem" height="5rem" />
		{/if}
	</div>
</FlexWrapper>

<style>
	#main-nav {
		height: 48px;
		width: calc(100% - 3rem);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 1.5rem;
		background-color: var(--token-color-surface-raised-normal);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
		user-select: none;
		font-weight: 600;
		font-size: 0.9rem;
	}

	#main-nav > div {
		flex: 1;
		display: flex;
		align-items: center;
	}

	.nav-left a {
		text-decoration: none;
		color: var(--token-color-text-default-normal);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.nav-center {
		justify-content: center;
	}

	.nav-right {
		justify-content: flex-end;
	}

	#background {
		background-color: var(--token-color-surface-sunken-normal);
		padding: 4rem 5rem;
		padding-top: 0rem;
		border-radius: 1rem;
		width: 300px;
		height: 680px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
	}
</style>
