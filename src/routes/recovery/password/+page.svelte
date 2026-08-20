<script lang="ts">
	import {
		Button,
		Field,
		Flex,
		Form,
		Icon,
		Link,
		LinkButton,
		postFetch,
		TextField
	} from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	import DNLogo from "$lib/assets/DNLogo.png";
	import * as m from "$lib/paraglide/messages.js";

	import * as styles from "./page.css";

	function validateEmail(email: string): string | undefined {
		const val = email.trim();

		if (!val) return m.common_errors_EMAIL_REQUIRED();

		const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailPattern.test(val)) {
			return m.common_errors_EMAIL_REGEX();
		}

		return undefined;
	}

	function getEmailProviderInfo(emailAddress: string) {
		if (!emailAddress || !emailAddress.includes("@")) return null;

		const domain = emailAddress.split("@")[1].toLowerCase();

		const providers: Record<string, { url: string; name: string }> = {
			"gmail.com": { url: "https://mail.google.com", name: "Gmail" },
			"outlook.com": { url: "https://outlook.live.com/mail/", name: "Outlook" },
			"hotmail.com": { url: "https://outlook.live.com/mail/", name: "Outlook" },
			"live.com": { url: "https://outlook.live.com/mail/", name: "Outlook" },
			"msn.com": { url: "https://outlook.live.com/mail/", name: "Outlook" },
			"proton.me": { url: "https://mail.proton.me", name: "Proton" },
			"protonmail.com": { url: "https://mail.proton.me", name: "Proton" },
			"icloud.com": { url: "https://www.icloud.com/mail", name: "iCloud Mail" }
		};

		return providers[domain];
	}

	let invalidEmail: string | undefined = $state(undefined);
	let email = $state("");
	let loading = $state(false);
	let success = $state(false);
	const providerInfo = $derived(getEmailProviderInfo(email));
	async function sendLink() {
		loading = true;
		const validation = validateEmail(email);
		if (validation) {
			invalidEmail = validation;
			loading = false;
			return;
		}

		const result = await postFetch(
			PUBLIC_BACKEND_URL + "/auth/recovery/send-recovery-email",
			{
				email: email
			},
			undefined,
			false
		);

		if (result.code === "EMAIL_BLACKLIST") {
			invalidEmail = m.common_errors_EMAIL_BLACKLIST();
			loading = false;
			return;
		}

		if (result.code === "EMAIL_DNS") {
			invalidEmail = m.common_errors_EMAIL_DNS();
			loading = false;
			return;
		}

		if (result.code === "EMAIL_TAKEN") {
			invalidEmail = m.common_errors_EMAIL_TAKEN();
			loading = false;
			return;
		}

		if (result.success) {
			loading = true;
			success = true;
			return;
		}
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
			<h1>Password recovery</h1>
			<p style:color={token.theme.color.text.secondary}>Lets send a password reset link.</p>
			<Flex
				marginTop="medium"
				direction="column"
				text="left"
				height="100%"
				width="100%"
				alignItems="center"
				justifyContent="start">
				{#if !success}
					<Form id="password-reset-form" onsubmit={sendLink}>
						<Field required label="Email:" name="email" invalid={invalidEmail}>
							<TextField
								placeholder="Enter your email"
								bind:value={email}
								oninput={() => (invalidEmail = undefined)}
								disabled={loading} />
						</Field>
						<Button form="password-reset-form" type="submit" appearance="primary" {loading}>
							Send password reset link
						</Button>
					</Form>
				{:else}
					<Flex direction="column" alignItems="center" gap="medium">
						<Flex direction="column" alignItems="center" gap="xsmall">
							<Icon icon="outgoing_mail" size="giant" color="success" />
							<p
								style="font-size: {token.global.font.size.large}; font-weight: {token.global.font
									.weight.bold}">
								Check your inbox
							</p>
							<p style="text-align: center">
								If a user is linked to this email. <br />
								Then we will have send a password reset link.
							</p>
						</Flex>
						{#if providerInfo?.url}
							<LinkButton external appearance="primary" href={providerInfo.url}>
								{m.page_verify_email_open_provider({ name: providerInfo.name })}
							</LinkButton>
						{/if}
					</Flex>
				{/if}
			</Flex>
		</Flex>
		<Flex marginTop="large" width="100%" alignItems="center" direction="column" gap="small">
			<Link href="https://davidnet.net/help">Help</Link>
			<Link href="/login ">Login</Link>
		</Flex>
	</div>
</div>
