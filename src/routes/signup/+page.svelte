<script lang="ts">
	import { TextField, Button, toast, Space } from "@davidnet/svelte-ui";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { authapiurl } from "$lib/config";
	import Error from "$lib/components/Error.svelte";
	import { parseJwt } from "$lib/utils/jwt";
	import { formatDateWithUTCOffset, wait } from "$lib/utils/time";
	import { goto } from "$app/navigation";

	let email = "";
	let username = "";
	let password = "";
	let emailInvalid = false;
	let usernameInvalid = false;
	let passwordInvalid = false;
	let error = false;
	let errorMSG = "Network error.";
	let correlationID = crypto.randomUUID();
	let SignUP_400 = "";
	let loading = false;

	function validate() {
		emailInvalid = !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) && email.length > 254;
		usernameInvalid = username.trim().length < 3;
		passwordInvalid = password.length < 6;

		return !(emailInvalid || usernameInvalid || passwordInvalid);
	}

	async function handleSignup() {
		if (!validate()) return;

		loading = true;
		try {
			const res = await fetch(authapiurl + "signup", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-correlation-id": correlationID
				},
				body: JSON.stringify({ email, username, password }),
				credentials: "include" // Required else we dont accept set-cookie header
			});

			if (res.status === 400) {
				const data = await res.json();
				SignUP_400 = data?.error;
				loading = false;
				return;
			}

			if (!res.ok) {
				toast({
					title: "Signup failed",
					desc: "Error: " + res.status + " | " + res.statusText,
					icon: "crisis_alert",
					appearance: "danger",
					position: "bottom-left",
					autoDismiss: 5000
				});
				errorMSG = res.status + "_" + res.statusText;
				error = true;
				console.warn(res);
				return;
			}

			const data = await res.json();
			const accessToken = data.access_token;

			const payload = parseJwt(accessToken);
			if (payload.exp) {
				const expiryDate = new Date(payload.exp * 1000);
				console.log(formatDateWithUTCOffset(expiryDate));
			} else {
				toast({
					title: "Session Invalid",
					desc: "Error: Couldn't parse JWT.",
					icon: "crisis_alert",
					appearance: "danger",
					position: "bottom-left",
					autoDismiss: 5000
				});
				errorMSG = "Couldn't parse JWT.";
				error = true;
				console.warn("Couldn't parse JWT.");
				return;
			}

			await wait(1000);

			toast({
				title: "Signup sucessfull (:",
				desc: "Now verify your email!",
				icon: "celebration",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 5000
			});

			goto("/verify/email/check/" + email);
			email = username = password = "";
		} catch (err) {
			toast({
				title: "Signup failed",
				desc: "Error: Unknown",
				icon: "crisis_alert",
				appearance: "danger",
				position: "bottom-left",
				autoDismiss: 5000
			});
			error = true;
			console.error(err);
		}
	}
</script>

<div class="brand">
	<a href="https://davidnet.net">
		<img src="https://design.davidnet.net/images/logos/DNLogo.png" height="35px" aria-hidden="true" alt="" />
	</a>
	<h3 class="red">
		<span>David</span>
	</h3>
	<h3 class="blue">
		<span>net</span>
	</h3>
</div>

{#if error}
	<Error pageName="Sign Up" {correlationID} {errorMSG} />
{:else if loading}
	<ProfileLoader width="5rem" height="5rem" />
{:else}
	<div class="header">
		<h1>Sign Up</h1>
		To continue.
	</div>
	<Space height="var(--token-space-4)" />
	<form on:submit|preventDefault={handleSignup}>
		<TextField
			label="Email"
			type="email"
			placeholder="you@example.com"
			bind:value={email}
			required
			invalid={emailInvalid}
			invalidMessage="Please enter a valid email"
			onEnter={() => handleSignup()}
		/>

		<TextField
			label="Username"
			type="text"
			placeholder="Choose a username"
			bind:value={username}
			required
			invalid={usernameInvalid}
			invalidMessage="Username must be at least 3 characters"
			onEnter={() => handleSignup()}
		/>

		<TextField
			label="Password"
			type="password"
			placeholder="Enter a password"
			bind:value={password}
			required
			invalid={passwordInvalid}
			invalidMessage="Password must be at least 6 characters"
			onEnter={() => handleSignup()}
		/>

		<Button appearance="primary" stretchwidth onClick={handleSignup} {loading}>Sign Up</Button>

		<p style="text-align: center; color: var(--token-color-text-danger)">{SignUP_400}</p>

		<a class="link" href="/login">Already have an Davidnet account? Login.</a>
	</form>
	<div class="seperator"></div>
	<div class="legal">
		By continuing, you agree to our<br />
		<a href="https://davidnet.net/legal/terms_of_service/">Terms of Service</a>,
		<a href="https://davidnet.net/legal/privacy_policy/">Privacy Policy</a> and <br />
		<a href="https://davidnet.net/legal/acceptable_use_policy/">Acceptable Use Policy</a>.<br />
	</div>
{/if}

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 400px;
	}

	.red {
		color: #d52129;
	}

	.blue {
		color: #2985cd;
	}

	.brand {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		font-size: 2rem;
		vertical-align: center;
	}

	.brand h3 {
		margin-bottom: 0px;
	}

	.brand img {
		height: 3rem;
		width: 3rem;
		margin-top: 2.3rem;
	}

	.header {
		margin-bottom: 20px;
		text-align: center;
	}

	.header h1 {
		margin-bottom: 5px;
	}

	.link {
		font-size: 0.9rem;
		text-align: center;
		color: rgb(39, 134, 165);
	}

	.seperator {
		margin: 15px 0px;
		width: 100%;
		height: 1px;
	}

	.legal {
		color: var(--token-color-text-default-tertiary);
		text-align: center;
		line-height: 1.1;
	}

	.legal a {
		color: var(--token-color-text-default-tertiary);
		text-decoration: none;
	}

	.legal a:hover {
		color: var(--token-color-text-default-secondary);
	}
</style>
