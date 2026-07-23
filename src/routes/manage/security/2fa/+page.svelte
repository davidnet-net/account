<script lang="ts">
	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	import {
		Button,
		Flex,
		navigateBack,
		LinkButton,
		authState,
		Form,
		Field,
		TextField,
		postFetch,
		Anchor,
		getFetch,
		whenAuthReady,
		Modal,
		putFetch
	} from "@davidnet-net/svelte-ui";

	import * as styles from "./page.css";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { m } from "$lib/paraglide/messages";

	let loading = $state(false);
	let authenticatorEnabled = $state(false);

	async function reloadInfo() {
		const result = await getFetch(
			PUBLIC_BACKEND_URL + "/auth/security/2fa-status",
			undefined,
			undefined,
			true
		);
		if (!result.success) {
			// TODO
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
		const result = await putFetch(
			PUBLIC_BACKEND_URL + "/auth/security/disable-authenticator",
			{},
			undefined,
			true
		);
		if (result.code === "AUTHENTICATOR_DISABLED" || result.code === "AUTHENTICATOR_NOT_ENABLED") {
			// Show success
		} else {
			// TODO
		}
		loading = false;
		await reloadInfo();
		showDisableAuthenticatorModal = false;
	}
</script>

<div class={styles.page}>
	<div class={styles.card}>
		<h1 class={styles.title}>Two step verification</h1>
		<div>
			<span class={styles.subtitle}>
				<Anchor href="/manage/security">Security</Anchor>
				> Two step verification
			</span>
			<p class={styles.subtitle}>Protect your account by creating a second security layer.</p>
			<Flex direction="column" gap="none" marginTop="medium" width="100%">
				<h2 class={styles.label}>Authenticator:</h2>
				{#if authenticatorEnabled}
					<Button
						onclick={() => {
							showDisableAuthenticatorModal = true;
						}}>
						Disable authenticator
					</Button>
				{:else}
					<LinkButton {loading} href="/manage/security/2fa/authenticator">
						Setup your authenticator
					</LinkButton>
				{/if}
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
		title="Are you sure you want to disable your authenticator 2FA method?"
		onclose={() => {
			showDisableAuthenticatorModal = false;
		}}>
		Your account will become less secure without a second security layer.
		{#snippet actions()}
			<Button
				onclick={() => {
					showDisableAuthenticatorModal = false;
				}}>
				Cancel
			</Button>
			<Button appearance="danger" {loading} onclick={disableAuthenticator}>
				Disable authenticator
			</Button>
		{/snippet}
	</Modal>
{/if}
