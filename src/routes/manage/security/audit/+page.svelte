<script lang="ts">
	import {
		authState,
		Button,
		Field,
		Flex,
		Form,
		formatUnixMsToPreferred,
		getFetch,
		LinkButton,
		navigateBack,
		postFetch,
		Skeleton,
		TextField,
		toast,
		whenAuthReady
	} from "@davidnet-net/svelte-ui";

	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	import { m } from "$lib/paraglide/messages";

	import * as styles from "./page.css";
	import { onMount } from "svelte";

	let loading = $state(true);
	interface AuditLogItem {
		id: string;
		createdAt: string; // Serialized from the backend date/timestamp
		message: string;
	}

	let auditLogs: undefined | AuditLogItem[] = $state(undefined);

	async function loadAuditLogs() {
		const result = await getFetch(
			PUBLIC_BACKEND_URL + "/auth/security/audit-logs",
			undefined,
			undefined,
			true
		);
		if (result.success) {
			auditLogs = result.logs;
			loading = false;
		}
	}

	onMount(() => {
		document.addEventListener("visibilitychange", async () => {
			if (document.visibilityState === "visible") {
				await loadAuditLogs();
			}
		});
	});

	$effect(() => {
		(async () => {
			await whenAuthReady();
			if (!authState.isLoggedIn && !authState.loading) {
				goto(`/login?continue=${encodeURIComponent(page.url.href)}`);
			}
			loadAuditLogs();
		})();
	});
</script>

<div class={styles.page}>
	<div class={styles.card}>
		<h1 class={styles.title}>Account audit logs</h1>
		<Flex
			direction="column"
			gap="medium"
			marginTop="medium"
			width="100%"
			overflowY="scroll"
			height="50dvh">
			{#if loading}
				<Skeleton width="90%" height="5rem" />
				<Skeleton width="90%" height="5rem" />
				<Skeleton width="90%" height="5rem" />
				<Skeleton width="90%" height="5rem" />
			{:else}
				{#each auditLogs as auditLog (auditLog.id)}
					<div class={styles.auditCard}>
						<p>
							{#each auditLog.message.split(".") as sentence, index (index)}
								{sentence}
								{#if index < auditLog.message.split(".").length - 1}
									<br />
								{/if}
							{/each}
						</p>

						<br />
						<p>{formatUnixMsToPreferred(new Date(auditLog.createdAt).getTime(), true)}</p>
					</div>
				{/each}
			{/if}
		</Flex>
		<Flex direction="column" gap="medium" marginTop="medium" width="100%">
			<div class={styles.cardActions}>
				<LinkButton href="/manage/security">Security</LinkButton>
				<Button
					iconbefore="arrow_back"
					onclick={() => {
						navigateBack();
					}}>
					Back
				</Button>
			</div>
		</Flex>
	</div>
</div>
