<script>
	import { TextField, Button, Space, toast, Icon, FlexWrapper } from "@davidnet/svelte-ui";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { authapiurl } from "$lib/config";
	import Error from "$lib/components/Error.svelte";

	let identifier = "";
	let password = "";
	let identifierInvalid = false;
	let passwordInvalid = false;
	let loading = false;
    let error = false;
    let correlationID = crypto.randomUUID();

	function validate() {
		identifierInvalid = identifier.trim().length === 0;
		passwordInvalid = password.length < 6;
		return !(identifierInvalid || passwordInvalid);
	}

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

			if (!res.ok) {
				toast({
					title: "Login failed",
					desc: "Error: " + res.status + " | " + res.statusText,
					icon: "crisis_alert",
					appearance: "danger",
					position: "bottom-left",
                    autoDismiss: 5000
				});
                error = true;
                console.warn(res);
			} else {
				// Success
				identifier = "";
				password = "";
			}
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
	<Error pageName="Login" correlationID={correlationID}/>
{:else}
    {#if loading}
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

            <a class="link" href="/signup">Don't have an account? Sign up.</a>
        </form>

        <div class="seperator"></div>

        <div class="legal">
            By continuing, you agree to our<br />
            <a href="/legal/terms_of_service">Terms of Service</a> and
            <a href="/legal/privacy_policy">Privacy Policy</a>.<br />
            We don't track or sell info.
        </div>
    {/if}
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

	.seperator {
		margin: 30px 0px;
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
