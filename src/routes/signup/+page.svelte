<script lang="ts">
	import { TextField, Button, toast, Space} from "@davidnet/svelte-ui";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { authapiurl } from "$lib/config";
	import Error from "$lib/components/Error.svelte";

	let email = "";
	let username = "";
	let password = "";
	let emailInvalid = false;
	let usernameInvalid = false;
	let passwordInvalid = false;
    let error = false;
	let errorMSG = "Catched Fetch";
    let correlationID = crypto.randomUUID();
	let SignUP_400 = "";
	let loading = false;

	function validate() {
		emailInvalid = !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
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
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, username, password }),
				credentials: "include" // Required else we dont accept set-cookie header
			});


			if (res.status === 400) {
				const data = await res.json()
				SignUP_400 = data?.error;
				loading = false;
				return
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
		} finally {
			//loading = false;
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
	<Error pageName="Sign Up" correlationID={correlationID} errorMSG={errorMSG}/>
{:else}
	{#if loading}
		<ProfileLoader width="5rem" height="5rem" />
	{:else}
		<div class="header">
			<h1>Sign Up</h1>
			To continue.
		</div>
		<Space height="var(--token-space-4)"/>
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
			<a href="/legal/terms_of_service">Terms of Service</a> and
			<a href="/legal/privacy_policy">Privacy Policy</a>.<br />
			We dont track or sell info.
		</div>
	{/if}
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
