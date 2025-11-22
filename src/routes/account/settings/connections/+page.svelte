<script lang="ts">
	import { onMount } from "svelte";
	import { get } from "svelte/store";
	import { authapiurl } from "$lib/config";
	import { FlexWrapper, Space, Button, IconButton, toast, LinkButton, accessToken, authFetch, refreshAccessToken } from "@davidnet/svelte-ui";
	import Error from "$lib/components/Error.svelte";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { _ } from "svelte-i18n";

	let correlationID = crypto.randomUUID();
	let loading = true;
	let error = false;
	let errorMSG = $_("account.settings.connections.error.unknown");

	/* eslint-disable @typescript-eslint/no-explicit-any */
	let connections: Array<any> = [];
	let incomingRequests: Array<any> = [];
	let outgoingRequests: Array<any> = [];
	/* eslint-enable @typescript-eslint/no-explicit-any */

	async function loadConnections() {
		try {
			await refreshAccessToken(correlationID, true);
			const token = get(accessToken);
			if (!token) {
				error = true;
				errorMSG = $_("account.settings.connections.error.not_authenticated");
				return;
			}

			const resAccepted = await authFetch(authapiurl + "connections/", correlationID);
			if (!resAccepted.ok) {
				throw resAccepted.statusText;
			}
			const acceptedData = await resAccepted.json();
			connections = acceptedData.connections || [];

			const resPending = await authFetch(authapiurl + "connections/pending", correlationID);
			if (!resPending.ok) {
				throw resPending.statusText;
			}
			const pendingData = await resPending.json();
			incomingRequests = pendingData.incoming || [];
			outgoingRequests = pendingData.outgoing || [];

			loading = false;
		} catch (e) {
			console.error(e);
			errorMSG = String(e);
			error = true;
		}
	}

	onMount(() => {
		loadConnections();
	});

	async function removeConnection(id: number) {
		try {
			const res = await authFetch(authapiurl + "connections/remove", correlationID, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id })
			});
			if (!res.ok) throw res.statusText;
			toast({
				title: $_("account.settings.connections.toast.connection_removed.title"),
				desc: $_("account.settings.connections.toast.connection_removed.desc"),
				icon: "group_remove",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 5000
			});
			await loadConnections();
		} catch (e) {
			console.error(e);
			error = true;
			toast({
				title: $_("account.settings.connections.toast.error.remove_connection.title"),
				desc: $_("account.settings.connections.toast.error.remove_connection.desc"),
				icon: "group_remove",
				appearance: "danger",
				position: "bottom-left",
				autoDismiss: 5000
			});
		}
	}

	async function acceptRequest(id: number) {
		try {
			const res = await authFetch(authapiurl + "connections/accept", correlationID, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id })
			});
			if (!res.ok) throw res.statusText;
			toast({
				title: $_("account.settings.connections.toast.request_accepted.title"),
				desc: $_("account.settings.connections.toast.request_accepted.desc"),
				icon: "group_add",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 5000
			});
			await loadConnections();
		} catch (e) {
			console.error(e);
			error = true;
			toast({
				title: $_("account.settings.connections.toast.error.accept_request.title"),
				desc: $_("account.settings.connections.toast.error.accept_request.desc"),
				icon: "group_add",
				appearance: "danger",
				position: "bottom-left",
				autoDismiss: 5000
			});
		}
	}

	async function cancelRequest(id: number) {
		try {
			const res = await authFetch(authapiurl + "connections/cancel", correlationID, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id })
			});
			if (!res.ok) throw res.statusText;
			toast({
				title: $_("account.settings.connections.toast.request_cancelled.title"),
				desc: $_("account.settings.connections.toast.request_cancelled.desc"),
				icon: "group_remove",
				appearance: "warning",
				position: "bottom-left",
				autoDismiss: 5000
			});
			await loadConnections();
		} catch (e) {
			console.error(e);
			error = true;
			toast({
				title: $_("account.settings.connections.toast.error.cancel_request.title"),
				desc: $_("account.settings.connections.toast.error.cancel_request.desc"),
				icon: "group_remove",
				appearance: "danger",
				position: "bottom-left",
				autoDismiss: 5000
			});
		}
	}
</script>

{#if error}
	<Error {errorMSG} {correlationID} pageName={$_("account.settings.connections.title")} />
{:else if loading}
	<h1>{$_("account.settings.connections.title")}</h1>
	<ProfileLoader />
{:else}
	<Space height="var(--token-space-4)" />
	<FlexWrapper width="100%" justifycontent="space-around" direction="row">
		<Button onClick={() => history.back()} iconbefore="arrow_back">{$_("account.settings.connections.btn.back")}</Button>
		<LinkButton href="/logout" iconafter="logout">{$_("account.settings.connections.btn.logout")}</LinkButton>
	</FlexWrapper>
	<Space height="var(--token-space-4)" />
	<h2>{$_("account.settings.connections.sections.my_connections")}</h2>
	{#if connections.length === 0}
		<FlexWrapper width="100%">
			<p>{$_("account.settings.connections.empty.connections")}</p>
		</FlexWrapper>
	{:else}
		<FlexWrapper direction="column" gap="var(--token-space-2)" width="100%">
			{#each connections as user (user.id)}
				<div class="user">
					<img
						src={user.avatar_url}
						crossorigin="anonymous"
						alt={$_("account.settings.connections.alt.profile_picture")}
						aria-hidden="true"
					/>
					<span>{user.display_name} (@{user.username})</span>
					<IconButton
						icon="group_remove"
						alt={$_("account.settings.connections.alt.remove_connection")}
						onClick={() => removeConnection(user.id)}
						appearance="danger"
					/>
				</div>
			{/each}
		</FlexWrapper>
	{/if}

	<Space height="var(--token-space-6)" />
	<h2>{$_("account.settings.connections.sections.incoming_requests")}</h2>
	{#if incomingRequests.length === 0}
		<FlexWrapper width="100%">
			<p>{$_("account.settings.connections.empty.incoming_requests")}</p>
		</FlexWrapper>
	{:else}
		<FlexWrapper direction="column" gap="var(--token-space-2)" width="100%">
			{#each incomingRequests as user (user.id)}
				<div class="user">
					<img
						crossorigin="anonymous"
						src={user.avatar_url}
						alt={$_("account.settings.connections.alt.profile_picture")}
						aria-hidden="true"
					/>
					<span>{user.display_name} (@{user.username})</span>
					<IconButton
						icon="group_add"
						alt={$_("account.settings.connections.alt.accept_request")}
						onClick={() => acceptRequest(user.id)}
						appearance="primary"
					/>
				</div>
			{/each}
		</FlexWrapper>
	{/if}

	<Space height="var(--token-space-6)" />
	<h2>{$_("account.settings.connections.sections.outgoing_requests")}</h2>
	{#if outgoingRequests.length === 0}
		<FlexWrapper width="100%">
			<p>{$_("account.settings.connections.empty.outgoing_requests")}</p>
		</FlexWrapper>
	{:else}
		<FlexWrapper direction="column" gap="var(--token-space-2)" width="100%">
			{#each outgoingRequests as user (user.id)}
				<div class="user">
					<img
						crossorigin="anonymous"
						src={user.avatar_url}
						alt={$_("account.settings.connections.alt.profile_picture")}
						aria-hidden="true"
					/>
					<span>{user.display_name} (@{user.username})</span>
					<IconButton
						icon="group_remove"
						alt={$_("account.settings.connections.alt.cancel_request")}
						onClick={() => cancelRequest(user.id)}
						appearance="warning"
					/>
				</div>
			{/each}
		</FlexWrapper>
	{/if}
{/if}

<style>
	h2 {
		text-align: center;
	}

	.user {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-around;
		width: 100%;
		vertical-align: middle;
		height: 30px;
		background-color: var(--token-color-surface-raised-normal);
		padding: var(--token-space-3) 0px;
		border-radius: 2rem;
		transition:
			transform 0.4s ease,
			box-shadow 0.4s ease;
	}

	.user:hover,
	.user:focus {
		background-color: var(--token-color-surface-raised-hover);
		transform: scale(1.02);
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
	}

	.user > img {
		height: 100%;
		aspect-ratio: 1 / 1;
		border-radius: 50%;
	}
</style>
