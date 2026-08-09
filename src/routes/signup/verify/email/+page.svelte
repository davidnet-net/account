<script lang="ts">
	import {
		Button,
		Field,
		Flex,
		Form,
		Icon,
		LinkButton,
		Modal,
		patchFetch,
		postFetch,
		Spinner,
		TextField,
		toast
	} from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";
	import { onMount } from "svelte";
	import Confetti from "svelte-confetti";

	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	import DNLogo from "$lib/assets/DNLogo.png";
	import { m } from "$lib/paraglide/messages";

	import * as styles from "./page.css";

	const signupToken = $derived(page.url.searchParams.get("signupToken"));
	let email = $derived(page.url.searchParams.get("email") ?? "");
	let loading = $state(false);
	let lastaction = 0;

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
	const providerInfo = $derived(getEmailProviderInfo(email));

	function validateEmail(email: string): string | undefined {
		const val = email.trim();

		if (!val) return m.common_errors_EMAIL_REQUIRED();

		const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailPattern.test(val)) {
			return m.common_errors_EMAIL_REGEX();
		}

		return undefined;
	}

	let submitNewEmailModalOpened = $state(false);
	let newemail = $state("");
	let invalidEmail: string | undefined = $state(undefined);
	async function submitNewEmail(event: SubmitEvent) {
		event.preventDefault();

		// Email check
		const validateEmailResult = validateEmail(newemail);
		if (validateEmailResult) {
			invalidEmail = validateEmailResult;
			console.log("Invalid email:", invalidEmail);
			loading = false;
			return;
		}

		if (!signupToken) {
			toast("We lost you!", "Please continue after you login.", "no_accounts", 4000, "subtle");
			goto("/login");
			console.log("?");
			loading = false;
			return;
		}

		interface fetchResult {
			success: boolean;
			code: string;
			email: undefined | string;
		}

		try {
			const fetchResult: fetchResult = await patchFetch(
				PUBLIC_BACKEND_URL + "/auth/signup/change-email",
				{
					email: newemail
				},
				{
					"X-SignupToken": signupToken
				}
			);

			if (!fetchResult.success) {
				if (!fetchResult.code) {
					toast("We lost you!", "Please continue after you login.", "no_accounts", 4000, "subtle");
					goto("/login");
					loading = false;
					return;
				}

				if (fetchResult.code === "EMAIL_BLACKLIST") {
					invalidEmail = m.common_errors_EMAIL_BLACKLIST();
				}

				if (fetchResult.code === "EMAIL_DNS") {
					invalidEmail = m.common_errors_EMAIL_DNS();
				}

				if (fetchResult.code === "EMAIL_TAKEN") {
					invalidEmail = m.common_errors_EMAIL_TAKEN();
				}

				loading = false;
				return;
			}

			if (fetchResult.email) {
				email = fetchResult.email;
			}

			lastaction = Date.now();
			submitNewEmailModalOpened = false;
		} catch {}
	}

	let resendEmailModalOpened = $state(false);
	async function resendEmail() {
		if (!signupToken) {
			toast("We lost you!", "Please continue after you login.", "no_accounts", 4000, "subtle");
			goto("/login");
			loading = false;
			resendEmailModalOpened = false;
			return;
		}

		try {
			interface FetchResult {
				success: boolean;
				code: string;
			}
			const fetchResult: FetchResult = await postFetch(
				PUBLIC_BACKEND_URL + "/auth/signup/resend-email",
				{},
				{
					"X-SignupToken": signupToken
				}
			);

			if (!fetchResult.success) {
				if (!fetchResult.code) {
					loading = false;
					resendEmailModalOpened = false;
					return;
				}

				loading = false;
				resendEmailModalOpened = false;
				return;
			}
		} catch {}

		lastaction = Date.now();
		resendEmailModalOpened = false;
		loading = false;
	}

	let verified = $state(false);
	let isPolling = $state(true);
	let pollingAttempt = 0;
	let pollingTimeout: ReturnType<typeof setTimeout>;

	async function checkVerificationStatus() {
		if (!isPolling || !signupToken) return;

		try {
			const response = await fetch(PUBLIC_BACKEND_URL + "/auth/signup/email-verified", {
				method: "GET",
				headers: {
					"X-SignupToken": signupToken,
					"Content-Type": "application/json"
				}
			});

			const data = await response.json();

			if (response.ok && data.success && data.code === "EMAIL_VERIFIED") {
				verified = true;
				isPolling = false;

				setTimeout(() => {
					const params = new URLSearchParams({
						signupToken: signupToken
					});

					goto(`/signup/preferences?${params.toString()}`);
				}, 3000);
				return;
			}

			if (data.code === "SIGNUPTOKEN_INVALID" || data.code === "USER_NOT_FOUND") {
				isPolling = false;
				toast(
					"We lost you!",
					"Please continue after you login or signup.",
					"no_accounts",
					4000,
					"subtle"
				);
				goto("/login");
				return;
			}
		} catch (error) {
			console.error("Failed to check verification status:", error);
			// We ignore network errors here so it just tries again on the next tick
		}

		if (isPolling) {
			pollingAttempt++;

			// Smart Backoff Logic:
			// - First 30 seconds (15 attempts): Poll every 2 seconds
			// - Next 2 minutes (12 attempts): Poll every 10 seconds
			// - After that: Poll every 30 seconds
			let delay = 2000;
			if (pollingAttempt > 15) delay = 10000;
			if (pollingAttempt > 27) delay = 30000;

			pollingTimeout = setTimeout(checkVerificationStatus, delay);
		}
	}

	onMount(() => {
		if (signupToken) {
			checkVerificationStatus();
		}

		return () => {
			isPolling = false;
			clearTimeout(pollingTimeout);
		};
	});
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
			<h1>{m.page_verify_email_Email_verification()}</h1>
		</Flex>

		{#if !verified}
			<Flex
				justifyContent="center"
				alignItems="center"
				height="fit-content"
				width="fit-content"
				text="center"
				marginBottom="large"
				direction="column">
				<Icon icon="mail_lock" size="giant" />
				<p style="font-size: {token.global.font.size.large}">
					{m.page_verify_email_check_your_email()}
				</p>
				<p style="color: {token.theme.color.text.secondary};">
					{m.page_verify_email_we_sent_an_email_to()}
					<br />
					<b>{email}.</b>
					<br />
					{m.page_verify_email_confirm_its_you()}
				</p>
			</Flex>

			{#if providerInfo}
				<LinkButton external appearance="primary" href={providerInfo.url}>
					{m.page_verify_email_open_provider({ name: providerInfo.name })}
				</LinkButton>
			{/if}

			<Button
				disabled={loading}
				onclick={() => {
					const currentTime = Date.now();
					const elapsedMs = currentTime - lastaction;
					const elapsedSeconds = Math.floor(elapsedMs / 1000);
					const targetSeconds = 30;
					if (elapsedSeconds < targetSeconds) {
						toast(
							"Not so fast!",
							`Wait ${targetSeconds - elapsedSeconds} seconds.`,
							"acute",
							4000,
							"warning"
						);
						toast("");
						const remainingSeconds = targetSeconds - elapsedSeconds;
						console.log(remainingSeconds);
						return;
					}
					resendEmailModalOpened = true;
				}}>
				{m.page_verify_email_resend_email()}
			</Button>
			<Button
				onclick={() => {
					const currentTime = Date.now();
					const elapsedMs = currentTime - lastaction;
					const elapsedSeconds = Math.floor(elapsedMs / 1000);
					const targetSeconds = 30;
					if (elapsedSeconds < targetSeconds) {
						toast(
							"Not so fast!",
							`Wait ${targetSeconds - elapsedSeconds} seconds.`,
							"acute",
							4000,
							"warning"
						);
						const remainingSeconds = targetSeconds - elapsedSeconds;
						console.log(remainingSeconds);
						return;
					}
					newemail = email;
					invalidEmail = undefined;
					submitNewEmailModalOpened = true;
				}}
				disabled={loading}>
				{m.page_verify_email_change_email()}
			</Button>

			<Flex
				justifyContent="center"
				alignItems="center"
				height="fit-content"
				width="fit-content"
				text="center"
				marginTop="large"
				direction="column">
				<p
					style="color: {token.theme.color.text.tertiary}; margin-top: {token.global.spacing
						.large}">
					{m.page_verify_email_verification_expires()}
				</p>
			</Flex>
		{:else}
			<Icon icon="mark_email_read" size="giant" color="success" />
			<p style="font-size: {token.global.font.size.large}">
				{m.page_verify_email_email_verified()}
			</p>
			<Spinner />
			<div
				style="position: fixed; top: -50px; left: 0; height: 100vh; width: 100vw; display: flex; justify-content: center; overflow: hidden; pointer-events: none;">
				<Confetti
					x={[-5, 5]}
					y={[0, 0.1]}
					delay={[500, 2000]}
					duration={2000}
					amount={200}
					fallDistance="100vh" />
			</div>
		{/if}
	</div>
</div>

{#if submitNewEmailModalOpened}
	<Modal title={m.page_verify_email_change_email()}>
		<Form id="change-email-form" onsubmit={submitNewEmail}>
			<Field
				label={m.page_verify_email_enter_your_changed_email()}
				name="newemail"
				required
				invalid={invalidEmail}>
				<TextField type="email" disabled={loading} bind:value={newemail} autofocus />
			</Field>
		</Form>

		{#snippet actions()}
			<Button
				disabled={loading}
				onclick={() => {
					submitNewEmailModalOpened = false;
				}}>
				{m.common_Cancel()}
			</Button>
			<Button
				form="change-email-form"
				type="submit"
				appearance="primary"
				{loading}
				disabled={email === newemail}>
				{m.page_verify_email_change_email()}
			</Button>
		{/snippet}
	</Modal>
{/if}

{#if resendEmailModalOpened}
	<Modal title={m.page_verify_email_resend_email()}>
		{m.page_verify_email_resend_modal()}
		{#snippet actions()}
			<Button
				disabled={loading}
				onclick={() => {
					resendEmailModalOpened = false;
				}}>
				{m.common_Cancel()}
			</Button>
			<Button onclick={resendEmail} appearance="primary" {loading}>
				{m.page_verify_email_resend_email()}
			</Button>
		{/snippet}
	</Modal>
{/if}
