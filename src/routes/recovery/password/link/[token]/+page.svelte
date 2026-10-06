<script lang="ts">
	import {
		Button,
		Field,
		Flex,
		Form,
		Link,
		postFetch,
		TextField,
		toast
	} from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	import { goto } from "$app/navigation";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	import DNLogo from "$lib/assets/DNLogo.png";
	import * as m from "$lib/paraglide/messages.js";

	import type { PageProps } from "../$types";
	import * as styles from "./page.css";

	let invalidPassword: string | undefined = $state(undefined);
	let password = $state("");
	let loading = $state(false);
	let { params }: PageProps = $props();

	$effect(() => {
		if (!params.token) {
			toast(m.page_recovery_link_invalid_title(), m.page_recovery_link_invalid_content(), "cancel", 4000, "subtle");
			goto("/recovery/password");
		}
	});

	async function sendLink() {
		loading = true;
		if (password.length < 8) {
			invalidPassword = m.common_errors_PASSWORD_LENGTH();
			loading = false;
			return;
		}

		if (!params.token) {
			toast(m.page_recovery_link_invalid_title(), m.page_recovery_link_invalid_content(), "cancel", 4000, "subtle");
			goto("/recovery/password");
			return;
		}

		const result = await postFetch(PUBLIC_BACKEND_URL + "/auth/recovery/reset-password", {
			newPassword: password,
			token: params.token
		});

		if (result.code === "PASSWORD_PWNED") {
			invalidPassword = m.common_errors_PASSWORD_PWNED();
			loading = false;
			return;
		}

		if (result.code === "INVALID_OR_EXPIRED_TOKEN") {
			toast(m.page_recovery_link_invalid_title(), m.page_recovery_link_invalid_content(), "cancel", 4000, "subtle");
			goto("/recovery/password");
			return;
		}

		if (result.code === "PASSWORD_SAME_AS_OLD") {
			invalidPassword = m.common_errors_FORCE_NEW_PASSWORD();
			loading = false;
			return;
		}

		if (result.success) {
			toast(
				m.page_recovery_link_changed_title(),
				m.page_recovery_link_changed_content(),
				"celebration",
				4000,
				"success"
			);
			goto("/login");
		}
		loading = false;
	}
</script>

<div class={styles.background}>
	<div class={styles.container}>
		<div class={styles.brand}>
			<a style="display: inline-flex;" href="https://davidnet.net">
				<img src={DNLogo} style="height: 3rem; width: auto;" aria-hidden="true" alt="" />
			</a>
			<span style="color: red;">David</span>
			<span style="color: blue;">net</span>
		</div>
		<Flex
			justifyContent="center"
			alignItems="center"
			height="fit-content"
			width="fit-content"
			text="center"
			marginBottom="large"
			direction="column">
			<h1>{m.page_recovery_password_heading()}</h1>
			<p style:color={token.theme.color.text.secondary}>{m.page_recovery_link_subheading()}</p>
			<Flex
				marginTop="medium"
				direction="column"
				text="left"
				height="100%"
				width="100%"
				alignItems="center"
				justifyContent="start">
				<Form id="password-reset-form" onsubmit={sendLink}>
					<Field required label={m.page_recovery_link_new_password_label()} name="password" invalid={invalidPassword}>
						<TextField
							placeholder={m.page_recovery_link_new_password_placeholder()}
							bind:value={password}
							type="password"
							oninput={() => (invalidPassword = undefined)}
							disabled={loading} />
					</Field>
					<Button form="password-reset-form" type="submit" appearance="primary" {loading}>
						{m.page_recovery_link_submit()}
					</Button>
				</Form>
			</Flex>
		</Flex>
		<Flex marginTop="large" width="100%" alignItems="center" direction="column" gap="small">
			<Link href="https://davidnet.net/help">{m.common_Help()}</Link>
			<Link href="/login ">{m.page_recovery_login_link()}</Link>
		</Flex>
	</div>
</div>
