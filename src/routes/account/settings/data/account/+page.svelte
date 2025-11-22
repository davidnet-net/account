<script lang="ts">
	import Error from "$lib/components/Error.svelte";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { authapiurl } from "$lib/config";
	import { FlexWrapper, Space, Icon, LinkButton, Button, Modal, toast, formatDate_PREFERREDTIME, authFetch } from "@davidnet/svelte-ui";
	import { onMount } from "svelte";
	import { _ } from "svelte-i18n";

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
					title: $_("account.settings.data.account.toast.export_success.title"),
					desc: $_("account.settings.data.account.toast.export_success.desc"),
					icon: "celebration",
					appearance: "success",
					position: "bottom-left"
				});
			} else {
				const body = await res.json();

				if (res.status === 429) {
					const retryTime = await formatDate_PREFERREDTIME(body.retry_at, correlationID);
					toast({
						title: $_("account.settings.data.account.toast.export_limit.title"),
						desc: $_("account.settings.data.account.toast.export_limit.desc", { values: { retry_at: retryTime } }),
						icon: "timer",
						appearance: "danger",
						position: "bottom-left",
						autoDismiss: 10000
					});
					return;
				}

				toast({
					title: $_("account.settings.data.account.toast.export_failed.title"),
					desc: body?.error || $_("account.settings.data.account.toast.export_failed.desc"),
					icon: "timer",
					appearance: "danger",
					position: "bottom-left",
					autoDismiss: 10000
				});

				throw new Error(body?.error || $_("account.settings.data.account.toast.export_failed.desc"));
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
	<Error pageName={$_("account.settings.data.account.title")} {errorMSG} />
{:else if deletedacc}
	<FlexWrapper width="100%" height="100%">
		<Icon icon="delete_forever" size="10rem" color="var(--token-color-text-danger)" />
		<h1>{$_("account.settings.data.account.deleted.title")}</h1>
		<p>{$_("account.settings.data.account.deleted.desc")}</p>
		<a href="https://davidnet.net/legal/info/delete_account/">{$_("account.settings.data.account.deleted.learn_more")}</a>
	</FlexWrapper>
{:else if loading}
	<h1>{$_("account.settings.data.account.title")}</h1>
	<ProfileLoader />
{:else}
	<Space height="var(--token-space-4)" />
	<FlexWrapper width="100%" justifycontent="space-around" direction="row">
		<Button
			onClick={() => history.back()}
			iconbefore="arrow_back">{$_("account.settings.data.account.btn.back")}</Button>
		<LinkButton href="/logout" iconafter="logout">{$_("account.settings.data.account.btn.logout")}</LinkButton>
	</FlexWrapper>
	<Space height="var(--token-space-4)" />
	<FlexWrapper height="100%" width="100%">
		<h1>{$_("account.settings.data.account.title")}</h1>
		<Space height="var(--token-space-4)" />
		<Button
			onClick={() => { showDeleteAccModal = true; }}
			appearance="danger">{$_("account.settings.data.account.btn.delete_account")}</Button>
		<Space height="var(--token-space-4)" />
		<Button onClick={reqdata} appearance="discover">{$_("account.settings.data.account.btn.request_data")}</Button>
		<Space height="var(--token-space-4)" />
	</FlexWrapper>
{/if}

{#if showDeleteAccModal}
	<Modal
		title={$_("account.settings.data.account.modal.delete.title")}
		titleIcon="delete_forever"
		desc={$_("account.settings.data.account.modal.delete.desc")}
		hasCloseBtn
		on:close={() => (showDeleteAccModal = false)}
		options={[
			{
				appearance: "subtle",
				content: $_("account.settings.data.account.modal.delete.cancel"),
				onClick: () => (showDeleteAccModal = false)
			},
			{
				appearance: "danger",
				content: $_("account.settings.data.account.modal.delete.confirm"),
				onClick: DeleteAcc
			}
		]}
	/>
{/if}

<style>
	h1 {
		text-align: center;
		font-size: 1.85rem;
	}
</style>
