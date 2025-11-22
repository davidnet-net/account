<script lang="ts">
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { authapiurl } from "$lib/config";
	import Error from "$lib/components/Error.svelte";
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { Button, FlexWrapper, Icon, LinkButton, Space } from "@davidnet/svelte-ui";

	let loading = true;
	let error = false;
	let errorMSG = "Unknown";
	let correlationID = crypto.randomUUID();
	let expired = false;

	const token = page.params.token || "";

	onMount(async () => {
		if (!token || typeof token !== "string" || token.length !== 64) {
			errorMSG = "Invalid or missing token.";
			error = true;
			loading = false;
			return;
		}

		try {
			const res = await fetch(authapiurl + "verify/email", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-correlation-id": correlationID
				},
				body: JSON.stringify({ token }),
				credentials: "include"
			});

			if (res.status === 204) {
				loading = false;
			} else if (res.status === 400) {
				expired = true;
				loading = false;
				return;
			} else {
				errorMSG = res.status + " " + res.statusText;
				error = true;
				loading = false;
				return;
			}
		} catch (err) {
			errorMSG = "Network error.";
			console.error(err);
			error = true;
			loading = false;
			errorMSG = String(err);
		}
	});
</script>

{#if error}
	<Error pageName="Verify Email" {correlationID} {errorMSG} />\
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
{:else if loading}
	<ProfileLoader width="5rem" height="5rem" />
{:else}
	<FlexWrapper height="100%" width="100%">
		<div class="center">
			<Icon icon="mark_email_read" size="100px" color="var(--token-color-text-success)" />
			<h1>Email verified!</h1>
			<p>You can now close this tab.</p>
			<Space height="var(--token-space-4)" />
			<Button
				appearance="primary"
				onClick={() => {
					window.close();
				}}>Close Tab</Button
			>
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
