<script lang="ts">
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { authapiurl } from "$lib/config";
	import Error from "$lib/components/Error.svelte";
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { FlexWrapper, Icon, LinkButton } from "@davidnet/svelte-ui";
	import { _ } from "svelte-i18n";

	let loading = true;
	let error = false;
	let errorMSG = $_("account.verify_export.network_error");
	let correlationID = crypto.randomUUID();
	let expired = false;

	const token = page.params.token || "";

	onMount(async () => {
		if (!token || typeof token !== "string" || token.length !== 64) {
			errorMSG = $_("account.verify_export.invalid_token");
			error = true;
			loading = false;
			return;
		}

		try {
			const res = await fetch(authapiurl + "verify/export", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-correlation-id": correlationID
				},
				body: JSON.stringify({ token }),
				credentials: "include"
			});

			if (res.status === 200) {
				loading = false;

				const blob = await res.blob();
				const url = URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = url;
				link.download = `DN-Export-${token}.json`;
				document.body.appendChild(link);
				link.click();
				link.remove();
				URL.revokeObjectURL(url);
			} else {
				expired = true;
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
	<Error pageName={$_("account.verify_export.page_name")} {correlationID} {errorMSG} />
{:else if expired}
	<FlexWrapper height="100%" width="100%">
		<div class="center">
			<Icon icon="crisis_alert" size="100px" color="var(--token-color-text-warning)" />
			<h1>{$_("account.verify_export.expired")}</h1>
			<p>{$_("account.verify_export.expired_desc")}</p>
			<LinkButton href="/account/settings/data/account" appearance="primary">{$_("account.verify_export.btn.request_new")}</LinkButton>
			<LinkButton href="mailto:contact@davidnet.net">{$_("account.verify_export.btn.contact")}</LinkButton>
			<p class="boring">{$_("account.verify_export.boring")}</p>
		</div>
	</FlexWrapper>
{:else if loading}
	<ProfileLoader width="5rem" height="5rem" />
{:else}
	<FlexWrapper height="100%" width="100%">
		<div class="center">
			<Icon icon="file_save" size="100px" color="var(--token-color-text-success)" />
			<h1>{$_("account.verify_export.ready")}</h1>
			<p>{$_("account.verify_export.ready_desc")}</p>
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
