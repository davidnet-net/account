<script lang="ts">
	import {
		authState,
		Button,
		Field,
		Flex,
		Form,
		LinkButton,
		navigateBack,
		postFetch,
		TextField,
		toast,
		whenAuthReady
	} from "@davidnet-net/svelte-ui";

	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	import { m } from "$lib/paraglide/messages";

	import * as styles from "./page.css";

	let invalidNewPassword: undefined | string = $state(undefined);
	let invalidOldPassword: undefined | string = $state(undefined);
	let newPassword: string = $state("");
	let oldPassword: string = $state("");
	let loading = $state(false);

	async function changePassword() {
		loading = true;
		if (newPassword.length < 8) {
			invalidNewPassword = m.common_errors_PASSWORD_LENGTH();
			loading = false;
			return;
		}

		const result = await postFetch(
			PUBLIC_BACKEND_URL + "/auth/security/change-password",
			{
				newPassword,
				oldPassword
			},
			undefined,
			true
		);
		if (result.code === "PASSWORD_PWNED") {
			invalidNewPassword = m.common_errors_PASSWORD_PWNED();
			loading = false;
			return;
		}
		if (result.code === "SAME_PASSWORD") {
			invalidNewPassword = m.common_errors_SAME_PASSWORD();
			loading = false;
			return;
		}
		if (result.code === "INVALID_CREDENTIALS") {
			invalidOldPassword = m.page_security_err_invalid_password();
			loading = false;
			return;
		}
		if (result.code === "PASSWORD_CHANGED") {
			toast(
				m.page_recovery_link_changed_title(),
				m.page_security_toast_changed_content(),
				"celebration",
				4000,
				"success"
			);
			invalidNewPassword = undefined;
			invalidOldPassword = undefined;
			loading = false;
		}
	}

	$effect(() => {
		(async () => {
			await whenAuthReady();
			if (!authState.isLoggedIn && !authState.loading) {
				goto(`/login?continue=${encodeURIComponent(page.url.href)}`);
			}
		})();
	});
</script>

<div class={styles.page}>
	<div class={styles.card}>
		<h1 class={styles.title}>{m.page_security_heading()}</h1>
		<Flex direction="column" gap="none" marginTop="medium" width="100%">
			<h2 class={styles.label}>{m.page_security_password_heading()}</h2>
			<p class={styles.subtitle}>
				{m.page_security_password_note()}
			</p>
			<Form id="change-password-form" onsubmit={changePassword}>
				<Field
					label={m.page_security_current_password_label()}
					name="current_password"
					required
					invalid={invalidOldPassword}>
					<TextField
						type="password"
						placeholder={m.page_security_current_password_placeholder()}
						bind:value={oldPassword} />
				</Field>
				<Field label={m.page_recovery_link_new_password_label()} name="new_password" required invalid={invalidNewPassword}>
					<TextField
						type="password"
						placeholder={m.page_security_new_password_placeholder()}
						bind:value={newPassword} />
				</Field>
				<div>
					<Button appearance="primary" type="submit" {loading}>{m.page_recovery_link_submit()}</Button>
				</div>
			</Form>
		</Flex>
		<Flex direction="column" gap="none" marginTop="large" width="100%">
			<h2 class={styles.label}>{m.page_security_2fa_heading()}</h2>
			<p class={styles.subtitle}>
				{m.page_security_2fa_note()}
			</p>
			<LinkButton href="/manage/security/2fa">{m.page_security_2fa_manage_link()}</LinkButton>
		</Flex>
		<Flex direction="column" gap="none" marginTop="large" width="100%">
			<h2 class={styles.label}>{m.page_security_sessions_heading()}</h2>
			<p class={styles.subtitle}>
				{m.page_sessions_warning()}
			</p>
			<LinkButton href="/manage/security/sessions">{m.page_security_sessions_view_link()}</LinkButton>
		</Flex>
		<Flex direction="column" gap="none" marginTop="large" width="100%">
			<h2 class={styles.label}>{m.page_security_audit_heading()}</h2>
			<p class={styles.subtitle}>{m.page_security_audit_note()}</p>
			<LinkButton href="/manage/security/audit">{m.page_security_audit_view_link()}</LinkButton>
		</Flex>
		<Flex direction="column" gap="medium" marginTop="medium" width="100%">
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
		</Flex>
	</div>
</div>
