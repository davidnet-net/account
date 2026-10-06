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
	import { onMount } from "svelte";

	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	import Card from "$lib/components/Card/Card.svelte";
	import HorizontalCard from "$lib/components/HorizontalCard/HorizontalCard.svelte";

	import * as styles from "./page.css";
	import * as m from "$lib/paraglide/messages.js";

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
		<h1 class={styles.title}>{m.page_data_title()}</h1>
		<p class={styles.subtitle}></p>

		<Flex gap="medium" marginTop="medium" width="100%" direction="column">
			{#if appState.isMobile}
				<HorizontalCard
					title={m.page_data_card_policies_title()}
					href="https://davidnet.net/legal"
					icon="privacy_tip" />
				<HorizontalCard
					title={m.page_data_card_delete_title()}
					icon="delete_forever"
					href="/manage/data/delete" />
				<HorizontalCard
					title={m.page_data_card_download_title()}
					icon="download"
					href="/manage/data/download" />
				{#if internalAccessResult?.internalAccess}
					<HorizontalCard
						title={m.page_internal_access_card_internal_title()}
						icon="smart_card_reader"
						href="/internal/access"
						description={m.page_data_card_internal_desc()} />
				{/if}
			{:else}
				<Flex gap="medium" marginTop="medium" width="100%">
					<Card
						title={m.page_data_card_policies_title()}
						icon="privacy_tip"
						href="https://davidnet.net/legal"
						description={m.page_data_card_policies_desc()} />
					<Card
						title={m.page_data_card_delete_title()}
						icon="delete_forever"
						href="/manage/data/delete"
						description={m.page_data_card_delete_desc()} />
				</Flex>
				<Flex gap="medium" marginTop="medium" width="100%">
					<Card title={m.page_data_card_download_title()} icon="download" href="/manage/data/download" />
					{#if internalAccessResult?.internalAccess}
						<Card
							title={m.page_internal_access_card_internal_title()}
							icon="smart_card_reader"
							href="/internal/access"
							description={m.page_data_card_internal_desc()} />
					{/if}
				</Flex>
			{/if}
		</Flex>

		<div class={styles.cardActions}>
			<LinkButton href="/">{m.common_my_account()}</LinkButton>
			<Button
				iconbefore="arrow_back"
				onclick={() => {
					navigateBack();
				}}>
				{m.common_back()}
			</Button>
		</div>
	</div>
</div>
