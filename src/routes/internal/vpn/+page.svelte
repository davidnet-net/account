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
			toast("Download failed");
			console.error("Download failed:", error);
		}
	}
</script>

<div class={styles.page}>
	<div class={styles.card}>
		<h1 class={styles.title}>VPN access</h1>
		<Flex direction="column" gap="medium" marginTop="medium" width="100%">
			<div class={styles.accessCard}>
				<h2>VPN access</h2>
				Connect to the internal network from external locations.
				<br />
				<br />
				{#if internalAccessResult?.vpnAccess}
					<Lozenge appearance="success">Granted access</Lozenge>
				{:else}
					<Lozenge appearance="danger">No access</Lozenge>
				{/if}

				<br />
				<br />

				<Flex direction="column" height="fit-content" gap="medium">
					<p>
						We use a selfhosted instance of tailscale server called headscale. However you will
						still need to install the tailscale client.
					</p>
					<LinkButton href="https://tailscale.com/download" opennewtab external>
						Download tailscale client
					</LinkButton>

					<p>After installation run this in a terminal:</p>
					<CodeSnippet
						language="terminal"
						code="tailscale up --login-server=https://headscale.davidnet.net --accept-routes --accept-dns --force-reauth" />

					<p>Trust this CA for HTTPS & SSL security:</p>
					<Button onclick={downloadCA}>Download</Button>

					<p>
						You are ready! Try visiting <Anchor href="https://test-connection.davidnet.internal">
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
				Back
			</Button>
		</div>
	</div>
</div>
