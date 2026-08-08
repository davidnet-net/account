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
			return "Please enter your username or email.";
		}

		const forbidden = /[\s\(\)\[\]{},;:<>\\\/"]/;
		if (forbidden.test(input)) {
			return "Contains invalid characters or spaces.";
		}

		if (input.includes("@")) {
			// Assume user means email
			const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailPattern.test(input)) {
				return "Please enter a valid email address.";
			}
		} else {
			// Assume username
			// Rules: Alphanumeric, underscores, hyphens only.
			const usernamePattern = /^[a-zA-Z0-9_-]+$/;
			if (!usernamePattern.test(input)) {
				return "Usernames can only contain letters, numbers, and _ -";
			}

			if (input.length < 3) {
				return "Username is too short.";
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
			invalidPassword = "Password must be at least 8 characters.";
			loading = false;
			return;
		}

		const result = await postFetch(PUBLIC_BACKEND_URL + "/auth/login", {
			identifier,
			password
		});

		if (result.code === "INVALID_CREDENTIALS") {
			invalidPassword = "Username, email or password may be wrong.";
			invalidIdentifier = "Username, email or password may be wrong.";
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

		if (!result.success) {
			// TODO UNKNOWN ERROR TOAST
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
			<h1>Login</h1>
			<p style:color={token.theme.color.text.secondary}>{m.common_to_continue()}</p>
		</Flex>
		<Form id="login-form" onsubmit={login}>
			<Field required label="Username or email:" name="identifier" invalid={invalidIdentifier}>
				<TextField
					placeholder="Enter your username or email"
					bind:value={identifier}
					oninput={() => (invalidIdentifier = undefined)}
					disabled={loading} />
			</Field>
			<Field required label="Password:" name="password" invalid={invalidPassword}>
				<TextField
					placeholder="Enter your password"
					type="password"
					oninput={() => (invalidPassword = undefined)}
					bind:value={password}
					disabled={loading} />
			</Field>
			<Button form="login-form" type="submit" appearance="primary" {loading}>Log in</Button>
		</Form>
		<Flex marginTop="large" width="100%" alignItems="center" direction="column" gap="small">
			<Link disabled={loading} href="#">Help</Link>
			<Link disabled={loading} href="/signup">Sign up</Link>
			<Link disabled={loading} href="/recovery">Account recovery</Link>
		</Flex>
	</div>
</div>
