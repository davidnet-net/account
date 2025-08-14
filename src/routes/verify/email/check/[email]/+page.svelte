<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import Error from "$lib/components/Error.svelte";
	import { authapiurl } from "$lib/config";
	import { Button, FlexWrapper, Icon, LinkButton, Loader } from "@davidnet/svelte-ui";
	import { wait } from "$lib/utils/time";

	let waiting = true;
	let error = false;
	let errorMSG = "Unknown";
	let correlationID = crypto.randomUUID();
	let expired = false;
	let email = "";
	let resendcodedone = false;
	let resendcodeloading = false; // Give fake feel of its actually doing stuff

	$: email = page.params.email || "";

	async function checkVerification() {
		if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) || email.length > 254) {
			errorMSG = "Invalid or missing email.";
			error = true;
			waiting = false;
			return;
		}

		try {
			while (true) {
				const res = await fetch(authapiurl + "verify/email/check", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"x-correlation-id": correlationID
					},
					body: JSON.stringify({ email }),
					credentials: "include"
				});

				if (res.status === 200) {
					const data = await res.json();
					if (data.email_verified) {
						waiting = false;
						error = false;
						expired = false;

						await wait(2000);
						goto("/")
						return;
					}
					await new Promise((r) => setTimeout(r, 5000));
				} else if (res.status === 400) {
					expired = true;
					waiting = false;
					return;
				} else {
					errorMSG = res.status + " " + res.statusText;
					error = true;
					waiting = false;
					return;
				}
			}
		} catch (err) {
			errorMSG = "Network error.";
			console.error(err);
			errorMSG = String(err);
			error = true;
			waiting = false;
		}
	}

	async function ResendVerificationEmail() {
		resendcodeloading = true;
		const res = await fetch(authapiurl + "verify/email/resend", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-correlation-id": correlationID
			},
			body: JSON.stringify({ email }),
			credentials: "include"
		});

		if (res.status === 200) {
			await wait(333);
			resendcodedone = true;
		} else if (res.status === 400) {
			expired = true;
			waiting = false;
			return;
		} else {
			errorMSG = res.status + " " + res.statusText;
			error = true;
			waiting = false;
			return;
		}
	}

	onMount(() => {
		checkVerification();
	});
</script>

{#if error}
	<Error pageName="Verify Email" {correlationID} {errorMSG} />
{:else if waiting}
	<FlexWrapper height="100%" width="100%">
		<div class="center">
			<Icon icon="forward_to_inbox" size="100px" color="var(--token-color-text-information)" />
			<h1>Verify your email!</h1>
			<p>An email has been sent to you. Please click the verify button in the email.</p>
			{#if !resendcodedone}
				<Button
					onClick={ResendVerificationEmail}
					appearance="subtle"
					loading={resendcodeloading}>
					Resend Email
				</Button>
			{:else}
				<Button onClick={() => {}} disabled iconbefore="notification_multiple">Sended Email</Button>
			{/if}
		</div>
	</FlexWrapper>
{:else if expired}
	<FlexWrapper height="100%" width="100%">
		<div class="center">
			<Icon icon="crisis_alert" size="100px" color="var(--token-color-text-warning)" />
			<h1>Token Expired</h1>
			<p>Accounts must be verified within 24 hours of signup. This account was not verified in time and has been deleted.</p>
			<LinkButton href="/signup" appearance="primary">Sign Up</LinkButton>
			<LinkButton href="mailto:contact@davidnet.net">Mail us.</LinkButton>
			<p class="boring">We could not find your account. <br />So we assumed it got expired.</p>
		</div>
	</FlexWrapper>
{:else}
	<FlexWrapper height="100%" width="100%">
		<div class="center">
			<Icon icon="mark_email_read" size="100px" color="var(--token-color-text-success)" />
			<h1>Email verified!</h1>
			<Loader/>
		</div>
	</FlexWrapper>
{/if}

<style>
	.center {
		text-align: center;
		line-height: 1.2;
	}

	.boring {
		color: var(--token-color-text-inverse-tertiary);
		font-size: 0.7rem;
	}
</style>
