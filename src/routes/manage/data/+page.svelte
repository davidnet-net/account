<script lang="ts">
	import {
		appState,
		authState,
		Button,
		currentTheme,
		Dropdown,
		Flex,
		getCookie,
		getDateFormat,
		getFetch,
		getFirstDayOfWeek,
		getTimezone,
		LANGUAGE_CACHE_KEY,
		LinkButton,
		navigateBack,
		patchFetch,
		setDateFormat,
		setFirstDayOfWeek,
		setLanguage,
		setTheme,
		setTimezone,
		type themeNames,
		whenAuthReady
	} from "@davidnet-net/svelte-ui";

	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";

	import * as styles from "./page.css";
	import HorizontalCard from "$lib/components/HorizontalCard/HorizontalCard.svelte";
	import Card from "$lib/components/Card/Card.svelte";
	import { onMount } from "svelte";

	interface InternalAccessResult {
		userId: string;
		internalAccess: boolean;
		vpnAccess: boolean;
		dbsAccess: boolean;
		supportAccess: boolean;
		monitoringAccess: boolean;
		developerAccess: boolean;
	}
	let internalAccessResult: undefined | InternalAccessResult = $state(undefined);

	$effect(() => {
		(async () => {
			await whenAuthReady();
			if (!authState.isLoggedIn && !authState.loading) {
				goto(`/login?continue=${encodeURIComponent(page.url.href)}`);
			}

			loadData();
		})();
	});

	async function loadData() {
		const accessResult = await getFetch(
			PUBLIC_BACKEND_URL + "/auth/internal",
			undefined,
			undefined,
			true
		);

		if (accessResult.success) {
			internalAccessResult = accessResult.access;
		}
	}

	onMount(() => {
		appState.hideNavigation = false; // Dont remove!
		document.addEventListener("visibilitychange", async () => {
			if (document.visibilityState === "visible") {
				await loadData();
			}
		});
	});
</script>

<div class={styles.page}>
	<div class={styles.card}>
		<h1 class={styles.title}>Data & Privacy</h1>
		<p class={styles.subtitle}></p>

		<Flex gap="medium" marginTop="medium" width="100%" direction="column">
			{#if appState.isMobile}
				<HorizontalCard
					title="Policies"
					href="https://davidnet.net/legal"
					icon="privacy_tip"
					description="View the terms and service and other policies." />
				<HorizontalCard
					title="Data deletion"
					icon="delete_forever"
					href="/manage/data/delete"
					description="Delete your account and other data." />
				<HorizontalCard title="Download your data" icon="download" href="/manage/data/download" />
				{#if internalAccessResult?.internalAccess}
					<HorizontalCard
						title="Internal access"
						icon="smart_card_reader"
						href="/internal/access"
						description="Review your internal access." />
				{/if}
			{:else}
				<Flex gap="medium" marginTop="medium" width="100%">
					<Card
						title="Policies"
						icon="privacy_tip"
						href="https://davidnet.net/legal"
						description="View the terms and service and other policies." />
					<Card
						title="Data deletion"
						icon="delete_forever"
						href="/manage/data/delete"
						description="Delete your account and other data." />
				</Flex>
				<Flex gap="medium" marginTop="medium" width="100%">
					<Card title="Download your data" icon="download" href="/manage/data/download" />
					{#if internalAccessResult?.internalAccess}
						<Card
							title="Internal access"
							icon="smart_card_reader"
							href="/internal/access"
							description="Review your internal access." />
					{/if}
				</Flex>
			{/if}
		</Flex>

		<div class={styles.cardActions}>
			<LinkButton href="/">My account</LinkButton>
			<Button
				iconbefore="arrow_back"
				onclick={() => {
					navigateBack();
				}}>
				Back
			</Button>
		</div>
	</div>
</div>
