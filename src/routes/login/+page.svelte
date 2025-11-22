<script lang="ts">
	import { onMount } from "svelte";
	import { TextField, Button, Space, toast, wait, BlockNote, FlexWrapper, refreshAccessToken, getSessionInfo } from "@davidnet/svelte-ui";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import Error from "$lib/components/Error.svelte";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { authapiurl } from "$lib/config";
	import { _ } from "svelte-i18n";

	let identifier = "";
	let password = "";
	let identifierInvalid = false;
	let passwordInvalid = false;
	let loading = false;
	let error = false;
	let correlationID = crypto.randomUUID();
	let Login_400 = "";
	let errorMSG = "";

	let alreadySignedIn = false;
	let signedInUsername: string | null = null;

	onMount(async () => {
		const refreshed = await refreshAccessToken(correlationID, true, false); // silent refresh
		if (refreshed) {
			const session = await getSessionInfo(correlationID, false);
			if (session) {
				alreadySignedIn = true;
				signedInUsername = session.username;
				toast({
					title: $_("account.login.toast.already_signed_in.title"), // "Already signed in"
					desc: $_("account.login.toast.already_signed_in.desc", { values: { username: session.username } }), // "Welcome back, {username}!"
					icon: "check_circle",
					appearance: "success",
					position: "bottom-left",
					autoDismiss: 5000
				});
			}
		}
	});

	function validate() {
		identifierInvalid = identifier.trim().length === 0;
		passwordInvalid = password.length < 6;
		return !(identifierInvalid || passwordInvalid);
	}

	function safeRedirect(raw: string | null): string {
		if (!raw) return "/";
		try {
			const decoded = decodeURIComponent(raw);
			if (decoded.startsWith("/")) return decoded;
			const url = new URL(decoded, window.location.origin);
			if (url.hostname === "localhost" || url.hostname.endsWith(".davidnet.net")) {
				return url.href;
			}
			return "/";
		} catch {
			return "/";
		}
	}

	const redirectTo = safeRedirect(page.url.searchParams.get("redirect"));

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
					title: $_("account.login.toast.failed.title"), // "Login failed"
					desc: $_("account.login.toast.failed.desc", { values: { status: res.status, statusText: res.statusText } }), // "Error: {status} | {statusText}"
					icon: "crisis_alert",
					appearance: "danger",
					position: "bottom-left",
					autoDismiss: 5000
				});
				errorMSG = res.status + "_" + res.statusText;
				error = true;
				return;
			}

			const data = await res.json();
			await wait(500);

			if (data.email_verified === 0 || false) {
				toast({
					title: $_("account.login.toast.verify_email.title"), // "Verify your email!"
					desc: $_("account.login.toast.verify_email.desc"), // "We already had send you an request!"
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
				title: $_("account.login.toast.welcome.title", { values: { display_name: data.display_name } }), // "Welcome back {display_name}"
				desc: $_("account.login.toast.welcome.desc"), // "Login successfull!"
				icon: "celebration",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 5000
			});

			if (redirectTo.length < 2) goto("/");
			else if (redirectTo.startsWith("http")) window.location.href = redirectTo;
			else goto(redirectTo);
		} catch (err) {
			error = true;
			toast({
				title: $_("account.login.toast.failed.title"), // "Login failed"
				desc: $_("account.login.toast.failed.unknown"), // "Error: Unknown"
				icon: "crisis_alert",
				appearance: "danger",
				position: "bottom-left",
				autoDismiss: 5000
			});
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
	<h3 class="red"><span>David</span></h3>
	<h3 class="blue"><span>net</span></h3>
</div>

{#if error}
	<Error pageName={$_("account.login.title")} {correlationID} {errorMSG} />
{:else if loading}
	<ProfileLoader width="5rem" height="5rem" />
{:else}
	<div class="header">
		<h1>{$_("account.login.title")}</h1>
		<!-- "Login" -->
		{$_("account.login.subtitle")}
		<!-- "To continue." -->
	</div>
	<Space height="var(--token-space-4)" />
	<form on:submit|preventDefault={handleLogin}>
		<TextField
			label={$_("account.login.input.username_email.label")}
			type="text"
			placeholder={$_("account.login.input.username_email.placeholder")}
			bind:value={identifier}
			required
			invalid={identifierInvalid}
			invalidMessage={$_("account.login.input.username_email.invalid")}
			onEnter={() => handleLogin()}
		/>

		<TextField
			label={$_("account.login.input.password.label")}
			type="password"
			placeholder={$_("account.login.input.password.placeholder")}
			bind:value={password}
			required
			invalid={passwordInvalid}
			invalidMessage={$_("account.login.input.password.invalid")}
			onEnter={() => handleLogin()}
		/>

		<Button appearance="primary" stretchwidth onClick={handleLogin} {loading}>{$_("account.login.btn.login")}</Button>
		<!-- "Log In" -->

		<p style="text-align: center; color: var(--token-color-text-danger)">{Login_400}</p>

		<a class="link" href="/signup">{$_("account.login.link.signup")}</a>
		<!-- "Don't have an account? Sign up." -->
		<a class="link" href="/recovery">{$_("account.login.link.recover")}</a>
		<!-- "Recover account." -->
		<a class="link" href="mailto:contact@davidnet.net">{$_("account.login.link.help")}</a>
		<!-- "Get help." -->

		{#if alreadySignedIn}
			<FlexWrapper width="100%">
				<Space height="var(--token-space-4)" />
				<BlockNote
					appearance="success"
					title={$_("account.login.blocknote.already_signed_in.title")}
					stretchwidth
					actions={[{ content: $_("account.login.blocknote.my_account"), appearance: "link", href: "/", onClick: () => {} }]}
					>{signedInUsername}</BlockNote
				>
			</FlexWrapper>
		{/if}
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
