<script lang="ts">
	import Error from "$lib/components/Error.svelte";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { authapiurl } from "$lib/config";
	import { authFetch } from "$lib/session";
	import { formatDate_PREFERREDTIME } from "$lib/utils/time";
	import { FlexWrapper, Space, Icon, LinkButton, Button, Modal, toast } from "@davidnet/svelte-ui";
	import { onMount } from "svelte";

	let correlationID = crypto.randomUUID();
	let error = false;
	let loading = true;
	let showDeleteAccModal = false;
	let errorMSG = "Unknown";
	let deletedacc = false;

	onMount(async () => {
		loading = false;
	});

	async function DeleteAcc() {
		try {
			const res = await authFetch(`${authapiurl}settings/data/delete_account`, correlationID, {
				method: "POST",
				headers: { "Content-Type": "application/json" }
			});
			if (!res.ok) throw "something exploded";
			deletedacc = true;
		} catch (e) {
			console.error(e);
			errorMSG = String(e);
			error = true;
		} finally {
			loading = false;
			showDeleteAccModal = false;
		}
	}

	async function reqdata() {
		loading = true;
		error = false;

		try {
			const res = await authFetch(`${authapiurl}settings/data/request_data`, correlationID, {
				method: "POST",
				headers: { "Content-Type": "application/json" }
			});

			if (res.status === 204) {
				toast({
					title: "Data Export Successful!",
					desc: "Check your email!",
					icon: "celebration",
					appearance: "success",
					position: "bottom-left"
				});
			} else {
				const body = await res.json();

				if (res.status === 429) {
					toast({
						title: "Data Export Failed: LIMIT reached.",
						desc: "Try again at " + (await formatDate_PREFERREDTIME(body.retry_at, correlationID)) + "!",
						icon: "timer",
						appearance: "danger",
						position: "bottom-left",
						autoDismiss: 10000
					});
					return;
				}

				toast({
					title: "Data Export Failed",
					desc: body?.error || "Unknown error",
					icon: "timer",
					appearance: "danger",
					position: "bottom-left",
					autoDismiss: 10000
				});

				throw new Error(body?.error || "Unknown error");
			}
		} catch (err) {
			console.error(err);
			errorMSG = String(err);
			error = true;
		} finally {
			loading = false;
		}
	}
</script>

{#if error}
	<Error pageName="Data" {errorMSG} />
{:else if deletedacc}
	<FlexWrapper width="100%" height="100%">
		<Icon icon="delete_forever" size="10rem" color="var(--token-color-text-danger)" />
		<h1>Account scheduled for deletion</h1>
		<p>View your email for more information.</p>
		<a href="https://davidnet.net/legal/info/delete_account/">Learn more</a>
	</FlexWrapper>
{:else if loading}
	<h1>Data</h1>
	<ProfileLoader />
{:else}
	<Space height="var(--token-space-4)" />
	<FlexWrapper width="100%" justifycontent="space-around" direction="row">
		<Button
			onClick={() => {
				history.back();
			}}
			iconbefore="arrow_back">Back</Button
		>
		<LinkButton href="/logout" iconafter="logout">Log out</LinkButton>
	</FlexWrapper>
	<Space height="var(--token-space-4)" />
	<FlexWrapper height="100%" width="100%">
		<h1>Account Data</h1>
		<Space height="var(--token-space-4)" />
		<Button
			onClick={() => {
				showDeleteAccModal = true;
			}}
			appearance="danger">Delete my account</Button
		>
		<Space height="var(--token-space-4)" />
		<Button onClick={reqdata} appearance="discover">Request my data</Button>
		<Space height="var(--token-space-4)" />
	</FlexWrapper>
{/if}

{#if showDeleteAccModal}
	<Modal
		title="Delete your account?"
		titleIcon="delete_forever"
		desc="This cannot be undone?"
		hasCloseBtn
		on:close={() => (showDeleteAccModal = false)}
		options={[
			{
				appearance: "subtle",
				content: "Cancel",
				onClick: () => (showDeleteAccModal = false)
			},
			{ appearance: "danger", content: "Delete account", onClick: DeleteAcc }
		]}
	/>
{/if}

<style>
	h1 {
		text-align: center;
		font-size: 1.85rem;
	}
</style>
