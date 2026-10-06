<script lang="ts">
	import {
		Anchor,
		appState,
		authState,
		Button,
		Flex,
		getFetch,
		LinkButton,
		Lozenge,
		navigateBack,
		Skeleton,
		whenAuthReady
	} from "@davidnet-net/svelte-ui";
	import { onMount } from "svelte";

	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";

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
			if (!internalAccessResult?.internalAccess) {
				goto("/");
			}
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
		<h1 class={styles.title}>{m.page_internal_access_title()}</h1>
		<span class={styles.subtitle}>
			<Anchor href="/manage/data">{m.page_internal_access_breadcrumb_data()}</Anchor>
			> {m.page_internal_access_breadcrumb_internal()}
		</span>

		{#if !internalAccessResult}
			<Flex direction="column" gap="medium" marginTop="medium" width="100%">
				<Skeleton width="80%" height="8rem" />
				<Skeleton width="80%" height="8rem" />
				<Skeleton width="80%" height="8rem" />
				<Skeleton width="80%" height="8rem" />
				<Skeleton width="80%" height="8rem" />
				<Skeleton width="80%" height="8rem" />
			</Flex>
		{:else}
			<Flex direction="column" gap="medium" marginTop="medium" width="100%">
				<div class={styles.accessCard}>
					<h2>{m.page_internal_access_card_internal_title()}</h2>
					{m.page_internal_access_card_internal_desc()}
					<br />
					<br />
					{#if internalAccessResult.internalAccess}
						<Lozenge appearance="success">{m.page_internal_access_granted()}</Lozenge>
					{:else}
						<Lozenge appearance="danger">{m.page_internal_access_none()}</Lozenge>
					{/if}
				</div>
				<div class={styles.accessCard}>
					<h2>{m.page_internal_access_card_vpn_title()}</h2>
					{m.page_internal_access_card_vpn_desc()}
					<br />
					<br />
					{#if internalAccessResult.vpnAccess}
						<Lozenge appearance="success">{m.page_internal_access_granted()}</Lozenge>
						<br />
						<br />
						<LinkButton href="/internal/vpn">{m.page_internal_access_learn_more()}</LinkButton>
					{:else}
						<Lozenge appearance="danger">{m.page_internal_access_none()}</Lozenge>
					{/if}
				</div>
				<div class={styles.accessCard}>
					<h2>{m.page_internal_access_card_support_title()}</h2>
					{m.page_internal_access_card_support_desc()}
					<br />
					<br />
					{#if internalAccessResult.supportAccess}
						<Lozenge appearance="success">{m.page_internal_access_granted()}</Lozenge>
					{:else}
						<Lozenge appearance="danger">{m.page_internal_access_none()}</Lozenge>
					{/if}
				</div>
				<div class={styles.accessCard}>
					<h2>{m.page_internal_access_card_dbs_title()}</h2>
					{m.page_internal_access_card_dbs_desc()}
					<br />
					<br />
					{#if internalAccessResult.dbsAccess}
						<Lozenge appearance="success">{m.page_internal_access_granted()}</Lozenge>
					{:else}
						<Lozenge appearance="danger">{m.page_internal_access_none()}</Lozenge>
					{/if}
				</div>
				<div class={styles.accessCard}>
					<h2>{m.page_internal_access_card_dev_title()}</h2>
					{m.page_internal_access_card_dev_desc()}
					<br />
					<br />
					{#if internalAccessResult.developerAccess}
						<Lozenge appearance="success">{m.page_internal_access_granted()}</Lozenge>
					{:else}
						<Lozenge appearance="danger">{m.page_internal_access_none()}</Lozenge>
					{/if}
				</div>
				<div class={styles.accessCard}>
					<h2>{m.page_internal_access_card_monitoring_title()}</h2>
					{m.page_internal_access_card_monitoring_desc()}
					<br />
					<br />
					{#if internalAccessResult.monitoringAccess}
						<Lozenge appearance="success">{m.page_internal_access_granted()}</Lozenge>
					{:else}
						<Lozenge appearance="danger">{m.page_internal_access_none()}</Lozenge>
					{/if}
				</div>
			</Flex>
		{/if}

		<div class={styles.cardActions}>
			<LinkButton href="/manage/data">{m.page_internal_access_data_link()}</LinkButton>
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
