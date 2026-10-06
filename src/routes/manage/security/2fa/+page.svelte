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
				errorMessage = result.message || m.page_2fa_err_disable_failed();
			}
		} catch (e) {
			errorMessage = m.page_2fa_err_unexpected();
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
				errorMessage = errorData.message || m.page_2fa_err_generate_pdf_failed();
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
			errorMessage = m.page_2fa_err_download_failed();
		} finally {
			loading = false;
		}
	}
</script>

<div class={styles.page}>
	<div class={styles.card}>
		<h1 class={styles.title}>{m.page_2fa_manage_heading()}</h1>
		<div>
			<span class={styles.subtitle}>
				<Anchor href="/manage/security">{m.page_security_heading()}</Anchor>
				> {m.page_2fa_manage_heading()}
			</span>
			<p class={styles.subtitle}>{m.page_2fa_manage_note()}</p>

			{#if errorMessage}
				<p style="color: var(--color-danger, #ef4444); margin-top: 10px; font-size: 13px;">
					{errorMessage}
				</p>
			{/if}

			<Flex direction="column" gap="medium" marginTop="medium" width="100%">
				<div>
					<h2 class={styles.label}>{m.page_2fa_manage_authenticator_heading()}</h2>
					{#if authenticatorEnabled}
						<Button
							onclick={() => {
								errorMessage = null;
								showDisableAuthenticatorModal = true;
							}}>
							{m.page_2fa_disable_button()}
						</Button>
					{:else}
						<LinkButton {loading} href="/manage/security/2fa/authenticator">
							{m.page_2fa_setup_button()}
						</LinkButton>
					{/if}
				</div>
				<div>
					<h2 class={styles.label}>{m.page_2fa_recovery_codes_heading()}</h2>
					{#if authenticatorEnabled}
						<Button
							onclick={() => {
								errorMessage = null;
								showRecoveryCodesModal = true;
							}}>
							{m.page_2fa_download_codes_button()}
						</Button>
					{:else}
						<p
							style="font-size: {token.global.font.size.small}; color: {token.theme.color.text
								.secondary};">
							{m.page_2fa_enable_first_note()}
						</p>
					{/if}
				</div>
			</Flex>
		</div>
		<Flex direction="column" gap="medium" marginTop="medium" width="100%">
			<div class={styles.cardActions}>
				<LinkButton href="/manage/security">{m.page_security_heading()}</LinkButton>
				<Button
					iconbefore="arrow_back"
					onclick={() => {
						navigateBack();
					}}>
					{m.common_back()}
				</Button>
			</div>
		</Flex>
	</div>
</div>

{#if showDisableAuthenticatorModal}
	<Modal
		title={m.page_2fa_disable_modal_title()}
		onclose={() => {
			showDisableAuthenticatorModal = false;
		}}>
		<p>{m.page_2fa_disable_modal_body()}</p>
		{#snippet actions()}
			<Button
				onclick={() => {
					showDisableAuthenticatorModal = false;
				}}>
				{m.common_Cancel()}
			</Button>
			<Button appearance="danger" {loading} onclick={disableAuthenticator}
				>{m.page_2fa_yes_disable_button()}</Button>
		{/snippet}
	</Modal>
{/if}

{#if showRecoveryCodesModal}
	<Modal
		title={m.page_2fa_generate_modal_title()}
		onclose={() => {
			showRecoveryCodesModal = false;
		}}>
		<p>
			<strong>{m.page_2fa_warning_label()}</strong>
			{m.page_2fa_generate_modal_body()}
		</p>
		{#snippet actions()}
			<Button
				onclick={() => {
					showRecoveryCodesModal = false;
				}}>
				{m.common_Cancel()}
			</Button>
			<Button appearance="danger" {loading} onclick={downloadNewRecoveryCodes}>
				{m.page_2fa_generate_download_button()}
			</Button>
		{/snippet}
	</Modal>
{/if}
