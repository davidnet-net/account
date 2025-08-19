<script lang="ts">
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { authapiurl } from "$lib/config";
	import Error from "$lib/components/Error.svelte";
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { FlexWrapper, Icon, LinkButton } from "@davidnet/svelte-ui";

	let loading = true;
	let error = false;
	let errorMSG = "Unknown";
	let correlationID = crypto.randomUUID();
	let expired = false;

	$: token = page.params.token || "";

	onMount(async () => {
		if (!token || typeof token !== "string" || token.length !== 64) {
			errorMSG = "Invalid or missing token.";
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
			errorMSG = "Network error.";
			console.error(err);
			error = true;
			loading = false;
			errorMSG = String(err);
		}
	});
</script>

{#if error}
	<Error pageName="Verify Export" {correlationID} {errorMSG} />\
{:else if expired}
	<FlexWrapper height="100%" width="100%">
		<div class="center">
			<Icon icon="crisis_alert" size="100px" color="var(--token-color-text-warning)" />
			<h1>Export Expired</h1>
			<p>Export must be downloaded within 24 hours for your safety.</p>
			<LinkButton href="/account/settings/data/account" appearance="primary">Request new one</LinkButton>
			<LinkButton href="mailto:contact@davidnet.net">Mail us.</LinkButton>
			<p class="boring">We could not find your Export. <br />So we assumed it got expired.</p>
		</div>
	</FlexWrapper>
{:else if loading}
	<ProfileLoader width="5rem" height="5rem" />
{:else}
	<FlexWrapper height="100%" width="100%">
		<div class="center">
			<Icon icon="file_save" size="100px" color="var(--token-color-text-success)" />
			<h1>Export Ready!</h1>
			<p>Your export is downloading.</p>
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
