<script lang="ts">
	import {
		Anchor,
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

	import { goto } from "$app/navigation";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";

	import * as styles from "./page.css";
	import { page } from "$app/state";
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
			if (!internalAccessResult?.internalAccess) {
				goto("/");
			}
		} else {
			//TODO Show toast
		}
	}

	onMount(() => {
		document.addEventListener("visibilitychange", async () => {
			if (document.visibilityState === "visible") {
				await loadData();
			}
		});
	});
</script>

<div class={styles.page}>
	<div class={styles.card}>
		<h1 class={styles.title}>Internal data</h1>
		<span class={styles.subtitle}>
			<Anchor href="/manage/data">Data</Anchor>
			> Internal data
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
					<h2>Internal access</h2>
					Get the basic access.
					<br />
					<br />
					{#if internalAccessResult.internalAccess}
						<Lozenge appearance="success">Granted access</Lozenge>
					{:else}
						<Lozenge appearance="danger">No access</Lozenge>
					{/if}
				</div>
				<div class={styles.accessCard}>
					<h2>VPN access</h2>
					Connect to the internal network from external locations.
					<br />
					<br />
					{#if internalAccessResult.vpnAccess}
						<Lozenge appearance="success">Granted access</Lozenge>
					{:else}
						<Lozenge appearance="danger">No access</Lozenge>
					{/if}
				</div>
				<div class={styles.accessCard}>
					<h2>Support access</h2>
					Manage tickets & feedback Also moderate.
					<br />
					<br />
					{#if internalAccessResult.supportAccess}
						<Lozenge appearance="success">Granted access</Lozenge>
					{:else}
						<Lozenge appearance="danger">No access</Lozenge>
					{/if}
				</div>
				<div class={styles.accessCard}>
					<h2>Databases access</h2>
					Get access to the databases.
					<br />
					<br />
					{#if internalAccessResult.dbsAccess}
						<Lozenge appearance="success">Granted access</Lozenge>
					{:else}
						<Lozenge appearance="danger">No access</Lozenge>
					{/if}
				</div>
				<div class={styles.accessCard}>
					<h2>Developer access</h2>
					View CI/CD and more.
					<br />
					<br />
					{#if internalAccessResult.developerAccess}
						<Lozenge appearance="success">Granted access</Lozenge>
					{:else}
						<Lozenge appearance="danger">No access</Lozenge>
					{/if}
				</div>
				<div class={styles.accessCard}>
					<h2>Monitoring access</h2>
					View metrics.
					<br />
					<br />
					{#if internalAccessResult.monitoringAccess}
						<Lozenge appearance="success">Granted access</Lozenge>
					{:else}
						<Lozenge appearance="danger">No access</Lozenge>
					{/if}
				</div>
			</Flex>
		{/if}

		<div class={styles.cardActions}>
			<LinkButton href="/manage/Data">Data</LinkButton>
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
