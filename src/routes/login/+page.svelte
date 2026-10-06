<script lang="ts">
	import {
		authBeat,
		Button,
		Field,
		Flex,
		Form,
		Link,
		postFetch,
		TextField
	} from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	import DNLogo from "$lib/assets/DNLogo.png";
	import * as m from "$lib/paraglide/messages.js";

	import * as styles from "./page.css";

	let identifier = $state("");
	let password = $state("");
	let invalidIdentifier: undefined | string = $state(undefined);
	let invalidPassword: undefined | string = $state(undefined);
	let loading = $state(false);
	const continueParam = decodeURIComponent(page.url.searchParams.get("continue") || "");

	function validateIdentifier(input: string): string | undefined {
		if (!input) {
			return m.page_login_err_identifier_required();
		}

		const forbidden = /[\s\(\)\[\]{},;:<>\\\/"]/;
		if (forbidden.test(input)) {
			return m.page_login_err_invalid_chars();
		}

		if (input.includes("@")) {
			// Assume user means email
			const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailPattern.test(input)) {
				return m.page_login_err_invalid_email();
			}
		} else {
			// Assume username
			// Rules: Alphanumeric, underscores, hyphens only.
			const usernamePattern = /^[a-zA-Z0-9_-]+$/;
			if (!usernamePattern.test(input)) {
				return m.page_login_err_username_pattern();
			}

			if (input.length < 3) {
				return m.page_login_err_username_short();
			}
		}

		return undefined;
	}

	function getSafeRedirectUrl(targetUrl: string) {
		if (!targetUrl) return "/";

		try {
			const parsed = new URL(targetUrl, window.location.origin);
			const hostname = parsed.hostname;

			if (hostname === "localhost" || hostname === "127.0.0.1") {
				return import.meta.env.DEV ? parsed.href : "/";
			}

			const allowedDomains = ["davidnet.net", "davidnet.internal"];
			const isAllowedDomain = allowedDomains.some(
				(domain) => hostname === domain || hostname.endsWith(`.${domain}`)
			);

			if (isAllowedDomain) {
				return parsed.href;
			}
		} catch {
			return "/";
		}

		return "/";
	}

	async function login() {
		loading = true;
		identifier = identifier.trim();

		// Identifier check
		const validateIdentifierResult = validateIdentifier(identifier);
		if (validateIdentifierResult) {
			invalidIdentifier = validateIdentifierResult;
			loading = false;
			return;
		}

		// Password check
		if (password.length < 8) {
			invalidPassword = m.common_errors_PASSWORD_LENGTH();
			loading = false;
			return;
		}

		const result = await postFetch(PUBLIC_BACKEND_URL + "/auth/login", {
			identifier,
			password
		});

		if (result.code === "INVALID_CREDENTIALS") {
			invalidPassword = m.page_login_err_invalid_credentials();
			invalidIdentifier = m.page_login_err_invalid_credentials();
			loading = false;
			return;
		}

		if (result.code === "ONBOARDING_INCOMPLETE") {
			const signupToken = result.details.signupToken;
			if (!result.details.emailVerified) {
				const params = new URLSearchParams({
					signupToken: signupToken,
					email: result.details.email
				});

				goto(`/signup/verify/email?${params.toString()}`);
				return;
			}

			if (!result.details.preferencesStepCompleted) {
				const params = new URLSearchParams({
					signupToken: signupToken
				});

				goto(`/signup/preferences?${params.toString()}`);
				return;
			}
		}

		if (result.code === "MFA_REQUIRED") {
			const params = new URLSearchParams({
				mfaToken: result.mfaToken
			});

			goto(`/login/2fa?${params.toString()}`);
			return;
		}

		if (!result.success) {
			loading = false;
			return;
		}

		try {
			await authBeat();
		} catch {
			console.warn("Explosion");
		}

		console.log(continueParam);
		const continueURL = getSafeRedirectUrl(continueParam);
		console.log(continueURL);
		try {
			const parsedUrl = new URL(continueURL, window.location.href);

			if (parsedUrl.origin !== window.location.origin) {
				window.location.href = continueURL;
			} else {
				goto(continueURL);
			}
		} catch (e) {
			goto(continueURL);
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
			<h1>{m.page_login_heading()}</h1>
			<p style:color={token.theme.color.text.secondary}>{m.common_to_continue()}</p>
		</Flex>
		<Form id="login-form" onsubmit={login}>
			<Field required label={m.page_login_identifier_label()} name="identifier" invalid={invalidIdentifier}>
				<TextField
					placeholder={m.page_login_identifier_placeholder()}
					bind:value={identifier}
					oninput={() => (invalidIdentifier = undefined)}
					disabled={loading} />
			</Field>
			<Field required label={m.page_login_password_label()} name="password" invalid={invalidPassword}>
				<TextField
					placeholder={m.page_login_password_placeholder()}
					type="password"
					oninput={() => (invalidPassword = undefined)}
					bind:value={password}
					disabled={loading} />
			</Field>
			<Button form="login-form" type="submit" appearance="primary" {loading}>{m.common_Login()}</Button>
		</Form>
		<Flex marginTop="large" width="100%" alignItems="center" direction="column" gap="small">
			<Link disabled={loading} href="https://davidnet.net/help">{m.common_Help()}</Link>
			<Link disabled={loading} href="/signup">{m.common_Sign_up()}</Link>
			<Link disabled={loading} href="/recovery">{m.page_login_account_recovery_link()}</Link>
		</Flex>
	</div>
</div>
