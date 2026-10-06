<script lang="ts">
	import {
		Anchor,
		appState,
		authState,
		Button,
		CodeSnippet,
		Flex,
		getFetch,
		Link,
		LinkButton,
		Lozenge,
		navigateBack,
		Skeleton,
		toast,
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
				//goto("/");
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

	async function downloadCA() {
		try {
			// 1. Fetch the certificate from the static root
			const response = await fetch("/davidnet.pem");
			if (!response.ok) throw new Error("Failed to fetch certificate");

			// 2. Convert response to a Blob
			const blob = await response.blob();

			// 3. Create a temporary object URL
			const url = window.URL.createObjectURL(blob);

			// 4. Create an anchor element to trigger the download prompt
			const link = document.createElement("a");
			link.href = url;
			link.download = "davidnet.pem"; // File name given to the user
			document.body.appendChild(link);

			link.click();

			// 5. Clean up DOM and memory
			link.remove();
			window.URL.revokeObjectURL(url);
		} catch (error) {
			toast(m.page_vpn_download_failed());
			console.error("Download failed:", error);
		}
	}
</script>

<div class={styles.page}>
	<div class={styles.card}>
		<h1 class={styles.title}>{m.page_internal_access_card_vpn_title()}</h1>
		<Flex direction="column" gap="medium" marginTop="medium" width="100%">
			<div class={styles.accessCard}>
				<h2>{m.page_internal_access_card_vpn_title()}</h2>
				{m.page_internal_access_card_vpn_desc()}
				<br />
				<br />
				{#if internalAccessResult?.vpnAccess}
					<Lozenge appearance="success">{m.page_internal_access_granted()}</Lozenge>
				{:else}
					<Lozenge appearance="danger">{m.page_internal_access_none()}</Lozenge>
				{/if}

				<br />
				<br />

				<Flex direction="column" height="fit-content" gap="medium">
					<p>
						{m.page_vpn_headscale_note()}
					</p>
					<LinkButton href="https://tailscale.com/download" opennewtab external>
						{m.page_vpn_download_client()}
					</LinkButton>

					<p>{m.page_vpn_run_this()}</p>
					<CodeSnippet
						language="terminal"
						code="tailscale up --login-server=https://headscale.davidnet.net --accept-routes --accept-dns --force-reauth" />

					<p>{m.page_vpn_trust_ca()}</p>
					<Button onclick={downloadCA}>{m.page_vpn_download()}</Button>

					<p>
						{m.page_vpn_ready_prefix()}<Anchor href="https://test-connection.davidnet.internal">
							test-connection.davidnet.internal
						</Anchor>
					</p>
				</Flex>
			</div>
		</Flex>
		<div class={styles.cardActions}>
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
