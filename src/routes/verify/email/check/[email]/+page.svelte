<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import Error from "$lib/components/Error.svelte";
	import { authapiurl } from "$lib/config";
	import { Button, FlexWrapper, Icon, LinkButton, Loader, wait } from "@davidnet/svelte-ui";
	import { _ } from "svelte-i18n";

	let waiting = true;
	let error = false;
	let errorMSG = $_('account.verify_email_check.network_error');
	let correlationID = crypto.randomUUID();
	let expired = false;
	let resendcodedone = false;
	let resendcodeloading = false;

	const email = page.params.email || "";

	async function checkVerification() {
		if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) || email.length > 254) {
			errorMSG = $_('account.verify_email_check.invalid_email');
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
						goto("/");
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
	<Error pageName={$_('account.verify_email_check.page_name')} {correlationID} {errorMSG} />
{:else if waiting}
	<FlexWrapper height="100%" width="100%">
		<div class="center">
			<Icon icon="forward_to_inbox" size="100px" color="var(--token-color-text-information)" />
			<h1>{$_('account.verify_email_check.verify_email')}</h1>
			<p>{$_('account.verify_email_check.verify_email_desc')}</p>
			{#if !resendcodedone}
				<Button onClick={ResendVerificationEmail} appearance="subtle" loading={resendcodeloading}>{$_('account.verify_email_check.btn.resend')}</Button>
			{:else}
				<Button onClick={() => {}} disabled iconbefore="notification_multiple">{$_('account.verify_email_check.btn.resend_done')}</Button>
			{/if}
		</div>
	</FlexWrapper>
{:else if expired}
	<FlexWrapper height="100%" width="100%">
		<div class="center">
			<Icon icon="crisis_alert" size="100px" color="var(--token-color-text-warning)" />
			<h1>{$_('account.verify_email_check.token_expired')}</h1>
			<p>{$_('account.verify_email_check.token_expired_desc')}</p>
			<LinkButton href="/signup" appearance="primary">{$_('account.verify_email_check.btn.signup')}</LinkButton>
			<LinkButton href="mailto:contact@davidnet.net">{$_('account.verify_email_check.btn.contact')}</LinkButton>
			<p class="boring">{$_('account.verify_email_check.boring')}</p>
		</div>
	</FlexWrapper>
{:else}
	<FlexWrapper height="100%" width="100%">
		<div class="center">
			<Icon icon="mark_email_read" size="100px" color="var(--token-color-text-success)" />
			<h1>{$_('account.verify_email_check.verified')}</h1>
			<Loader />
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
