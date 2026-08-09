<script lang="ts">
	import {
		Button,
		Checkbox,
		Field,
		Flex,
		Form,
		generateUUIDv7,
		Link,
		postFetch,
		TextField,
		toast,
		VisuallyHidden
	} from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	import { goto } from "$app/navigation";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	import DNLogo from "$lib/assets/DNLogo.png";
	import * as m from "$lib/paraglide/messages";

	import * as styles from "./page.css";

	let email = $state("");
	let username = $state("");
	let legalAccepted = $state(false);
	let password = $state("");
	let invalidEmail: undefined | string = $state(undefined);
	let invalidUsername: undefined | string = $state(undefined);
	let invalidPassword: undefined | string = $state(undefined);
	let invalidLegal: undefined | string = $state(undefined);
	const legalFieldID: string = generateUUIDv7();
	let loading = $state(false);

	function validateUsername(username: string): string | undefined {
		const val = username.trim();

		if (!val) return m.common_errors_USERNAME_REQUIRED();

		if (val.length < 3) return m.common_errors_USERNAME_LENGTH();

		// Rule: Letters, Numbers, _, - only
		const usernamePattern = /^[a-zA-Z0-9_-]+$/;
		if (!usernamePattern.test(val)) {
			return m.common_errors_USERNAME_REGEX();
		}

		return undefined;
	}

	function validateEmail(email: string): string | undefined {
		const val = email.trim();

		if (!val) return m.common_errors_EMAIL_REQUIRED();

		const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailPattern.test(val)) {
			return m.common_errors_EMAIL_REGEX();
		}

		return undefined;
	}

	async function signup(event: any) {
		event.preventDefault();
		loading = true;
		username = username.trim();
		email = email.trim();

		// Username check
		const validateUsernameResult = validateUsername(username);
		if (validateUsernameResult) {
			invalidUsername = validateUsernameResult;
			loading = false;
			return;
		}

		// Email check
		const validateEmailResult = validateEmail(email);
		if (validateEmailResult) {
			invalidEmail = validateEmailResult;
			loading = false;
			return;
		}

		// Password check
		if (password.length < 8) {
			invalidPassword = m.common_errors_PASSWORD_LENGTH();
			loading = false;
			return;
		}

		// Legal check
		if (!legalAccepted) {
			invalidLegal = m.page_signup_errors_LEGAL_NOT_ACCEPTED();
			loading = false;
			return;
		}

		try {
			interface FetchResult {
				success: boolean;
				code: string;
				signupToken: undefined | string;
				email: undefined | string;
			}
			const fetchResult: FetchResult = await postFetch(PUBLIC_BACKEND_URL + "/auth/signup", {
				email,
				username,
				password,
				legalAccepted
			});

			if (!fetchResult.success) {
				if (!fetchResult.code) {
					loading = false;
					return;
				}

				if (fetchResult.code === "PASSWORD_PWNED") {
					invalidPassword = m.common_errors_PASSWORD_PWNED();
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

				if (fetchResult.code === "USERNAME_TAKEN") {
					invalidUsername = m.common_errors_USERNAME_TAKEN();
				}

				loading = false;
				return;
			}

			if (!fetchResult.signupToken || !fetchResult.email) {
				toast("We lost you!", "Please continue after you login.", "no_accounts", 4000, "subtle");
				goto("/login");
				return;
			}

			const params = new URLSearchParams({
				signupToken: fetchResult.signupToken,
				email: email
			});

			goto(`/signup/verify/email?${params.toString()}`);
		} catch {
			loading = false;
		}
	}

	$effect(() => {
		if (legalAccepted) {
			invalidLegal = undefined;
		}
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
			<h1>{m.common_Sign_up()}</h1>
			<p style:color={token.theme.color.text.secondary}>{m.common_to_continue()}</p>
		</Flex>
		<Form id="signup-form" onsubmit={signup}>
			<Field required label={m.common_Email() + ":"} name="email" invalid={invalidEmail}>
				<TextField
					placeholder={m.page_signup_enter_your_email()}
					type="email"
					bind:value={email}
					oninput={() => (invalidEmail = undefined)}
					disabled={loading} />
			</Field>
			<Field required label={m.common_Username() + ":"} name="username" invalid={invalidUsername}>
				<TextField
					placeholder={m.page_signup_enter_your_username()}
					bind:value={username}
					oninput={() => (invalidUsername = undefined)}
					disabled={loading} />
			</Field>
			<Field required label={m.common_Password() + ":"} name="password" invalid={invalidPassword}>
				<TextField
					placeholder={m.page_signup_enter_your_password()}
					type="password"
					oninput={() => (invalidPassword = undefined)}
					bind:value={password}
					disabled={loading} />
			</Field>
			<Field
				required
				label=""
				overidelabel
				fieldID={legalFieldID}
				name="legal_accept"
				invalid={invalidLegal}>
				<Flex gap="small" verticalAlign="middle" alignItems="center">
					<Checkbox bind:checked={legalAccepted} />
					<label for={legalFieldID}>
						{m.page_signup_legal_prefix()}
						<Link opennewtab href="https://davidnet.net/legal/terms_of_service">
							{m.page_signup_legal_tos()}
							<VisuallyHidden>{m.page_signup_legal_tos_hidden()}</VisuallyHidden>
						</Link>
						{m.page_signup_legal_and()}
						<Link opennewtab href="https://davidnet.net/legal/privacy_policy">
							{m.page_signup_legal_privacy()}
						</Link>
						<span class={styles.requiredMark}>*</span>
					</label>
				</Flex>
			</Field>
			<Button form="signup-form" type="submit" appearance="primary" {loading}>
				{m.common_Sign_up()}
			</Button>
		</Form>
		<Flex marginTop="large" width="100%" alignItems="center" direction="column" gap="small">
			<Link disabled={loading} href="#">{m.common_Help()}</Link>
			<Link disabled={loading} href="/login">{m.common_Login()}</Link>
		</Flex>
	</div>
</div>
