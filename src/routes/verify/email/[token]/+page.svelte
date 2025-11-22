<script lang="ts">
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { authapiurl } from "$lib/config";
	import Error from "$lib/components/Error.svelte";
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { Button, FlexWrapper, Icon, LinkButton, Space } from "@davidnet/svelte-ui";
	import { _ } from "svelte-i18n";

	let loading = true;
	let error = false;
	let errorMSG = $_('account.verify_email.network_error');
	let correlationID = crypto.randomUUID();
	let expired = false;

	const token = page.params.token || "";

	onMount(async () => {
		if (!token || typeof token !== "string" || token.length !== 64) {
			errorMSG = $_('account.verify_email.invalid_token');
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
			console.error(err);
			errorMSG = String(err);
			error = true;
			loading = false;
		}
	});
</script>

{#if error}
	<Error pageName={$_('account.verify_email.page_name')} {correlationID} {errorMSG} />
{:else if expired}
	<FlexWrapper height="100%" width="100%">
		<div class="center">
			<Icon icon="crisis_alert" size="100px" color="var(--token-color-text-warning)" />
			<h1>{$_('account.verify_email.token_expired')}</h1>
			<p>{$_('account.verify_email.token_expired_desc')}</p>
			<LinkButton href="/signup" appearance="primary">{$_('account.verify_email.btn.signup')}</LinkButton>
			<LinkButton href="mailto:contact@davidnet.net">{$_('account.verify_email.btn.contact')}</LinkButton>
			<p class="boring">{$_('account.verify_email.boring')}</p>
		</div>
	</FlexWrapper>
{:else if loading}
	<ProfileLoader width="5rem" height="5rem" />
{:else}
	<FlexWrapper height="100%" width="100%">
		<div class="center">
			<Icon icon="mark_email_read" size="100px" color="var(--token-color-text-success)" />
			<h1>{$_('account.verify_email.verified')}</h1>
			<p>{$_('account.verify_email.verified_desc')}</p>
			<Space height="var(--token-space-4)" />
			<Button
				appearance="primary"
				onClick={() => {
					window.close();
				}}>{$_('account.verify_email.btn.close_tab')}</Button>
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
