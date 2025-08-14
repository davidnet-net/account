<script>
	import { TextField, Button, Space, toast, Icon, FlexWrapper } from "@davidnet/svelte-ui";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { authapiurl } from "$lib/config";
	import Error from "$lib/components/Error.svelte";
	import { page } from "$app/state";
	import { wait } from "$lib/utils/time";
	import { goto } from "$app/navigation";

	let identifier = "";
	let password = "";
	let identifierInvalid = false;
	let passwordInvalid = false;
	let loading = false;
	let error = false;
	let correlationID = crypto.randomUUID();
	let Login_400 = "";
	let errorMSG = "";

	function validate() {
		identifierInvalid = identifier.trim().length === 0;
		passwordInvalid = password.length < 6;
		return !(identifierInvalid || passwordInvalid);
	}

	$: redirectTo = page.url.searchParams.get("redirect") || "/";
	async function handleLogin() {
		if (!validate()) return;

		loading = true;
		try {
			const res = await fetch(authapiurl + "login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-correlation-id": correlationID
				},
				body: JSON.stringify({ identifier, password }),
				credentials: "include"
			});

			if (res.status === 400) {
				const data = await res.json();
				Login_400 = data?.error;
				loading = false;
				return;
			}

			if (!res.ok) {
				toast({
					title: "Login failed",
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

			await wait(1000);

			if (data.email_verified === 0 || false) {
				toast({
					title: "Verify your email!",
					desc: "We already had send you an request!",
					icon: "cancel_schedule_send",
					appearance: "info",
					position: "bottom-left",
					autoDismiss: 10000
				});
				identifier = password = "";
				goto("/verify/email/check/" + data.email);
				return;
			}
			toast({
				title: "Welcome back " + data.display_name,
				desc: "Login successfull!",
				icon: "celebration",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 5000
			});
			goto(redirectTo);
		} catch (err) {
			error = true;
			toast({
				title: "Login failed",
				desc: "Error: Unknown",
				icon: "crisis_alert",
				appearance: "danger",
				position: "bottom-left",
				autoDismiss: 5000
			});
			errorMSG = String(err);
			console.error(err);
		} finally {
			loading = false;
		}
	}
</script>

<div class="brand">
	<a href="https://davidnet.net">
		<img src="https://design.davidnet.net/images/logos/DNLogo.png" height="35px" aria-hidden="true" alt="" />
	</a>
	<h3 class="red"><span>David</span></h3>
	<h3 class="blue"><span>net</span></h3>
</div>

{#if error}
	<Error pageName="Login" {correlationID} {errorMSG} />
{:else if loading}
	<ProfileLoader width="5rem" height="5rem" />
{:else}
	<div class="header">
		<h1>Login</h1>
		To continue.
	</div>
	<Space height="var(--token-space-4)" />
	<form on:submit|preventDefault={handleLogin}>
		<TextField
			label="Username or Email"
			type="text"
			placeholder="Enter your username or email"
			bind:value={identifier}
			required
			invalid={identifierInvalid}
			invalidMessage="Please enter your username or email"
			onEnter={() => handleLogin()}
		/>

		<TextField
			label="Password"
			type="password"
			placeholder="Enter your password"
			bind:value={password}
			required
			invalid={passwordInvalid}
			invalidMessage="Invalid password"
			onEnter={() => handleLogin()}
		/>

		<Button appearance="primary" stretchwidth onClick={handleLogin} {loading}>Log In</Button>

		<p style="text-align: center; color: var(--token-color-text-danger)">{Login_400}</p>

		<a class="link" href="/signup">Don't have an account? Sign up.</a>
	</form>

{/if}

<style>
	/* Keep your existing styles */
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
</style>
