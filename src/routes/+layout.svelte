<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { ThemeProvider, Toaster, ConnectivityCheck, FlexWrapper, Avatar, IconButton, Modal, ThemeMenu } from "@davidnet/svelte-ui";
	import { onMount } from "svelte";

	let { children } = $props();
	let ShowGitModal = $state(false);

	let fontsLoaded = $state(false);

	// This will run only in the browser
	if (typeof window !== "undefined") {
		document.fonts.ready.then(() => {
			fontsLoaded = true;
		});
	}

	onMount(() => {
		const initloader = document.getElementById("initloader");
		if (initloader) initloader.remove();
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
		<div class="nav-left"><a href="/"><Avatar />My Account</a></div>
		<div class="nav-center"></div>
		<div class="nav-right">
			<ThemeMenu />
			<IconButton
				icon="https://design.davidnet.net/images/logos/external/github/github-mark-dark.svg"
				lighticon="https://design.davidnet.net/images/logos/external/github/github-mark-white.svg"
				alt="Github Repository"
				onClick={() => (ShowGitModal = true)}
			/>
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

{#if ShowGitModal}
	<Modal
		title="Select a repository to visit:"
		titleIcon="fork_right"
		hasCloseBtn={true}
		on:close={() => (ShowGitModal = false)}
		options={[
			{
				appearance: "primary",
				content: "Account website",
				onClick: () => (window.location.href = "https://github.com/davidnet-net/account")
			},
			{
				appearance: "primary",
				content: "Auth API",
				onClick: () => (window.location.href = "https://github.com/davidnet-net/auth-api")
			},
			{
				appearance: "subtle",
				content: "Davidnet Organisation",
				onClick: () => (window.location.href = "https://github.com/davidnet-net/")
			}
		]}
	/>
{/if}

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
