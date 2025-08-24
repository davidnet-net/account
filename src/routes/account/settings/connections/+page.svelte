<script lang="ts">
	import { onMount } from "svelte";
	import { get } from "svelte/store";
	import { page } from "$app/state";
	import { authapiurl } from "$lib/config";
	import { accessToken, authFetch, getSessionInfo, refreshAccessToken } from "$lib/session";
	import type { SessionInfo } from "$lib/types";
	import { FlexWrapper, Space, Button, IconButton, toast, Loader, LinkButton } from "@davidnet/svelte-ui";
	import Error from "$lib/components/Error.svelte";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";

	let correlationID = crypto.randomUUID();
	let loading = true;
	let error = false;
	let errorMSG = "Unknown";
	let sessionInfo: SessionInfo | null = null;

	let connections: Array<any> = [];
	let incomingRequests: Array<any> = [];
	let outgoingRequests: Array<any> = [];

	async function loadConnections() {
		try {
			await refreshAccessToken(correlationID, true);
			sessionInfo = await getSessionInfo(correlationID, false);
			const token = get(accessToken);
			if (!token) {
				error = true;
				errorMSG = "Not authenticated.";
				return;
			}

			// Accepted connections
			const resAccepted = await authFetch(authapiurl + "connections/", correlationID);
			if (!resAccepted.ok) {
				throw resAccepted.statusText;
			}
			const acceptedData = await resAccepted.json();
			connections = acceptedData.connections || [];

			// Pending requests (incoming & outgoing)
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

	// Actions
	async function removeConnection(id: number) {
		try {
			const res = await authFetch(authapiurl + "connections/remove", correlationID, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id })
			});
			if (!res.ok) {
				throw res.statusText;
			}
			toast({
				title: "Connection removed",
				desc: "You are no longer connected with this user.",
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
				title: "Error",
				desc: "Could not remove connection.",
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
			if (!res.ok) {
				throw res.statusText;
			}
			toast({
				title: "Request accepted",
				desc: "You are now connected with this user.",
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
				title: "Error",
				desc: "Could not accept request.",
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
			if (!res.ok) {
				throw res.statusText;
			}
			toast({
				title: "Request cancelled",
				desc: "The connection request has been cancelled.",
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
				title: "Error",
				desc: "Could not cancel request.",
				icon: "group_remove",
				appearance: "danger",
				position: "bottom-left",
				autoDismiss: 5000
			});
		}
	}
</script>

{#if error}
	<Error {errorMSG} {correlationID} pageName="My Connections" />
{:else if loading}
	<h1>Connections</h1>
	<ProfileLoader />
{:else}
	<Space height="var(--token-space-4)" />
	<FlexWrapper width="100%" justifycontent="space-around" direction="row">
		<Button onClick={() => history.back()} iconbefore="arrow_back">Back</Button>
		<LinkButton href="/logout" iconafter="logout">Log out</LinkButton>
	</FlexWrapper>
	<Space height="var(--token-space-4)" />
	<h2>My Connections</h2>
	{#if connections.length === 0}
		<FlexWrapper width="100%">
			<p>No connections yet.</p>
		</FlexWrapper>
	{:else}
		<FlexWrapper direction="column" gap="var(--token-space-2)" width="100%">
			{#each connections as user}
				<div class="user">
                    <img src={user.avatar_url} alt="profile picture" aria-hidden="true" />
					<span>{user.display_name} (@{user.username})</span>
					<IconButton icon="group_remove" alt="Remove connection" onClick={() => removeConnection(user.id)} appearance="danger" />
				</div>
			{/each}
		</FlexWrapper>
	{/if}

	<Space height="var(--token-space-6)" />
	<h2>Incoming Requests</h2>
	{#if incomingRequests.length === 0}
		<FlexWrapper width="100%">
			<p>No incoming requests.</p>
		</FlexWrapper>
	{:else}
		<FlexWrapper direction="column" gap="var(--token-space-2)" width="100%">
			{#each incomingRequests as user}
				<div class="user">
					<img src={user.avatar_url} alt="profile picture" aria-hidden="true" />
					<span>{user.display_name} (@{user.username})</span>
					<IconButton icon="group_add" alt="Accept request" onClick={() => acceptRequest(user.id)} appearance="primary" />
				</div>
			{/each}
		</FlexWrapper>
	{/if}

	<Space height="var(--token-space-6)" />
	<h2>Outgoing Requests</h2>
	{#if outgoingRequests.length === 0}
		<FlexWrapper width="100%">
			<p>No pending requests.</p>
		</FlexWrapper>
	{:else}
		<FlexWrapper direction="column" gap="var(--token-space-2)" width="100%">
			{#each outgoingRequests as user}
				<div class="user">
                    <img src={user.avatar_url} alt="profile picture" aria-hidden="true" />
					<span>{user.display_name} (@{user.username})</span>
					<IconButton icon="group_remove" alt="Cancel request" onClick={() => cancelRequest(user.id)} appearance="warning" />
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
