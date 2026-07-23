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
		postFetch
	} from "@davidnet-net/svelte-ui";

	import * as styles from "./page.css";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { m } from "$lib/paraglide/messages";

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
			invalidOldPassword = "Invalid password.";
			loading = false;
			return;
		}
		if (result.code === "PASSWORD_CHANGED") {
			// TODO ADD SUCCESS TOAST
			invalidNewPassword = undefined;
			invalidOldPassword = undefined;
			loading = false;
		}
	}

	$effect(() => {
		(async () => {
			if (!authState.isLoggedIn && !authState.loading) {
				goto(`/login?continue=${encodeURIComponent(page.url.href)}`);
			}
		})();
	});
</script>

<div class={styles.page}>
	<div class={styles.card}>
		<h1 class={styles.title}>Security</h1>
		<Flex direction="column" gap="none" marginTop="medium" width="100%">
			<h2 class={styles.label}>Changing your password:</h2>
			<p class={styles.subtitle}>
				If you change your password you may get logged out of other sessions.
			</p>
			<Form id="change-password-form" onsubmit={changePassword}>
				<Field
					label="Current password:"
					name="current_password"
					required
					invalid={invalidOldPassword}>
					<TextField
						type="password"
						placeholder="Enter your old password here."
						bind:value={oldPassword} />
				</Field>
				<Field label="New password:" name="new_password" required invalid={invalidNewPassword}>
					<TextField
						type="password"
						placeholder="Enter your new password here."
						bind:value={newPassword} />
				</Field>
				<div>
					<Button appearance="primary" type="submit" {loading}>Change password</Button>
				</div>
			</Form>
		</Flex>
		<Flex direction="column" gap="none" marginTop="large" width="100%">
			<h2 class={styles.label}>Two step verification:</h2>
			<p class={styles.subtitle}>
				Improve the security of your account by adding a second login step.
			</p>
			<LinkButton href="#">Manage two step verification</LinkButton>
		</Flex>
		<Flex direction="column" gap="none" marginTop="large" width="100%">
			<h2 class={styles.label}>Current sessions:</h2>
			<p class={styles.subtitle}>
				If you lost one of your devices or you notice suspicious activity, then log out of all your
				devices and take steps to protect your account.
			</p>
			<LinkButton href="/manage/security/sessions">View current sessions</LinkButton>
		</Flex>
		<Flex direction="column" gap="medium" marginTop="medium" width="100%">
			<div class={styles.cardActions}>
				<LinkButton href="/">My account</LinkButton>
				<Button
					iconbefore="arrow_back"
					appearance="primary"
					onclick={() => {
						navigateBack();
					}}>
					Back
				</Button>
			</div>
		</Flex>
	</div>
</div>
