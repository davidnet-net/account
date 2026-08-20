<script lang="ts">
	import {
		Anchor,
		appState,
		authState,
		Button,
		Field,
		Flex,
		Form,
		getFetch,
		identityState,
		LinkButton,
		Modal,
		navigateBack,
		postFetch,
		putFetch,
		TextField,
		whenAuthReady
	} from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	import { m } from "$lib/paraglide/messages";

	import * as styles from "./page.css";

	let loading = $state(false);
	let authenticatorEnabled = $state(false);
	let errorMessage = $state<string | null>(null);

	async function reloadInfo() {
		const result = await getFetch(
			PUBLIC_BACKEND_URL + "/auth/security/2fa-status",
			undefined,
			undefined,
			true
		);
		if (!result.success) {
			return;
		}
		authenticatorEnabled = result.authenticatorEnabled;
	}

	$effect(() => {
		(async () => {
			await whenAuthReady();
			if (!authState.isLoggedIn && !authState.loading) {
				goto(`/login?continue=${encodeURIComponent(page.url.href)}`);
			}
			await reloadInfo();
		})();
	});

	let showDisableAuthenticatorModal = $state(false);
	async function disableAuthenticator() {
		loading = true;
		errorMessage = null;
		try {
			const result = await putFetch(
				PUBLIC_BACKEND_URL + "/auth/security/disable-authenticator",
				{},
				undefined,
				true
			);
			if (result.success) {
				showDisableAuthenticatorModal = false;
				await reloadInfo();
			} else {
				errorMessage = result.message || "Failed to disable authenticator.";
			}
		} catch (e) {
			errorMessage = "An unexpected error occurred.";
		} finally {
			loading = false;
		}
	}

	let showRecoveryCodesModal = $state(false);

	// Handles requesting and downloading the PDF containing new backup codes
	async function downloadNewRecoveryCodes() {
		loading = true;
		errorMessage = null;
		try {
			// Using standard fetch with your token manually injected to support binary blob streams
			const response = await fetch(PUBLIC_BACKEND_URL + "/auth/security/generate-recovery-codes", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-Tab-Session-ID": appState.tabID as string,
					Authorization: `Bearer ${identityState.token?.raw}`
				},
				credentials: "include",
				body: JSON.stringify({})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				errorMessage = errorData.message || "Failed to generate recovery codes PDF.";
				return;
			}

			const blob = await response.blob();
			const downloadUrl = window.URL.createObjectURL(blob);

			const link = document.createElement("a");
			link.href = downloadUrl;
			link.download = "davidnet-recovery-codes.pdf";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			window.URL.revokeObjectURL(downloadUrl);
			showRecoveryCodesModal = false;
		} catch (e) {
			errorMessage = "Could not download the file. Please check your connection.";
		} finally {
			loading = false;
		}
	}
</script>

<div class={styles.page}>
	<div class={styles.card}>
		<h1 class={styles.title}>Two-Step Verification</h1>
		<div>
			<span class={styles.subtitle}>
				<Anchor href="/manage/security">Security</Anchor>
				> Two-Step Verification
			</span>
			<p class={styles.subtitle}>Protect your account by adding an additional layer of security.</p>

			{#if errorMessage}
				<p style="color: var(--color-danger, #ef4444); margin-top: 10px; font-size: 13px;">
					{errorMessage}
				</p>
			{/if}

			<Flex direction="column" gap="medium" marginTop="medium" width="100%">
				<div>
					<h2 class={styles.label}>Authenticator App:</h2>
					{#if authenticatorEnabled}
						<Button
							onclick={() => {
								errorMessage = null;
								showDisableAuthenticatorModal = true;
							}}>
							Disable Authenticator
						</Button>
					{:else}
						<LinkButton {loading} href="/manage/security/2fa/authenticator">
							Set up Authenticator App
						</LinkButton>
					{/if}
				</div>
				<div>
					<h2 class={styles.label}>Emergency Recovery Codes:</h2>
					{#if authenticatorEnabled}
						<Button
							onclick={() => {
								errorMessage = null;
								showRecoveryCodesModal = true;
							}}>
							Download New Recovery Codes PDF
						</Button>
					{:else}
						<p
							style="font-size: {token.global.font.size.small}; color: {token.theme.color.text
								.secondary};">
							You must enable a 2FA method first before generating recovery codes.
						</p>
					{/if}
				</div>
			</Flex>
		</div>
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

{#if showDisableAuthenticatorModal}
	<Modal
		title="Disable Authenticator 2FA?"
		onclose={() => {
			showDisableAuthenticatorModal = false;
		}}>
		<p>Your account security will be significantly reduced without a second verification factor.</p>
		{#snippet actions()}
			<Button
				onclick={() => {
					showDisableAuthenticatorModal = false;
				}}>
				Cancel
			</Button>
			<Button appearance="danger" {loading} onclick={disableAuthenticator}>Yes, Disable</Button>
		{/snippet}
	</Modal>
{/if}

{#if showRecoveryCodesModal}
	<Modal
		title="Generate New Recovery Codes?"
		onclose={() => {
			showRecoveryCodesModal = false;
		}}>
		<p>
			<strong>Warning:</strong>
			Generating a new set of codes will immediately invalidate all previously saved backup codes. Make
			sure to safely store the newly downloaded PDF document.
		</p>
		{#snippet actions()}
			<Button
				onclick={() => {
					showRecoveryCodesModal = false;
				}}>
				Cancel
			</Button>
			<Button appearance="danger" {loading} onclick={downloadNewRecoveryCodes}>
				Generate & Download PDF
			</Button>
		{/snippet}
	</Modal>
{/if}
