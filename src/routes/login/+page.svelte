<script lang="ts">
	import { Button, Field, Flex, Form, Link, sleep, TextField } from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	import DNLogo from "$lib/assets/DNLogo.png";
	import * as m from "$lib/paraglide/messages.js";

	import * as styles from "./page.css";

	let identifier = $state("");
	let password = $state("");
	let invalidIdentifier: undefined | string = $state(undefined);
	let invalidPassword: undefined | string = $state(undefined);
	let loading = $state(false);

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

		await sleep(3000);
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
