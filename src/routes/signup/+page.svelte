<script lang="ts">
	import { TextField, Button, toast, Space, wait } from "@davidnet/svelte-ui";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { authapiurl } from "$lib/config";
	import Error from "$lib/components/Error.svelte";
	import { goto } from "$app/navigation";
	import { _ } from "svelte-i18n";

	let email = "";
	let username = "";
	let password = "";
	let emailInvalid = false;
	let usernameInvalid = false;
	let passwordInvalid = false;
	let error = false;
	let errorMSG = $_('signup.network_error');
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
				credentials: "include"
			});

			if (res.status === 400) {
				const data = await res.json();
				SignUP_400 = data?.error;
				loading = false;
				return;
			}

			if (!res.ok) {
				toast({
					title: $_('signup.failed_title'),
					desc: $_('signup.failed_desc') + ": " + res.status + " | " + res.statusText,
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

			await wait(500);

			toast({
				title: $_('signup.success_title'),
				desc: $_('signup.success_desc'),
				icon: "celebration",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 5000
			});

			goto("/verify/email/check/" + email);
			email = username = password = "";
		} catch (err) {
			toast({
				title: $_('signup.failed_title'),
				desc: $_('signup.failed_unknown'),
				icon: "crisis_alert",
				appearance: "danger",
				position: "bottom-left",
				autoDismiss: 5000
			});
			error = true;
			console.error(err);
			errorMSG = String(err);
		} finally {
			loading = false;
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
	<Error pageName={$_('signup.page_name')} {correlationID} {errorMSG} />
{:else if loading}
	<ProfileLoader width="5rem" height="5rem" />
{:else}
	<div class="header">
		<h1>{$_('signup.page_name')}</h1>
		{$_('signup.subtitle')}
	</div>
	<Space height="var(--token-space-4)" />
	<form on:submit|preventDefault={handleSignup}>
		<TextField
			label={$_('signup.input.email.label')}
			type="email"
			placeholder={$_('signup.input.email.placeholder')}
			bind:value={email}
			required
			invalid={emailInvalid}
			invalidMessage={$_('signup.input.email.invalid')}
			onEnter={() => handleSignup()}
		/>

		<TextField
			label={$_('signup.input.username.label')}
			type="text"
			placeholder={$_('signup.input.username.placeholder')}
			bind:value={username}
			required
			invalid={usernameInvalid}
			invalidMessage={$_('signup.input.username.invalid')}
			onEnter={() => handleSignup()}
		/>

		<TextField
			label={$_('signup.input.password.label')}
			type="password"
			placeholder={$_('signup.input.password.placeholder')}
			bind:value={password}
			required
			invalid={passwordInvalid}
			invalidMessage={$_('signup.input.password.invalid')}
			onEnter={() => handleSignup()}
		/>

		<Button appearance="primary" stretchwidth onClick={handleSignup} {loading}>
			{$_('signup.btn.signup')}
		</Button>

		<p style="text-align: center; color: var(--token-color-text-danger)">{SignUP_400}</p>

		<a class="link" href="/login">{$_('signup.link.login')}</a>
	</form>
	<div class="seperator"></div>
	<div class="legal">
		{$_('signup.legal.text_before_links')}<br />
		<a href="https://davidnet.net/legal/terms_of_service/">{$_('signup.legal.tos')}</a>,
		<a href="https://davidnet.net/legal/privacy_policy/">{$_('signup.legal.privacy')}</a> {$_('signup.legal.and')}<br />
		<a href="https://davidnet.net/legal/">{$_('signup.legal.other')}</a>.<br />
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
