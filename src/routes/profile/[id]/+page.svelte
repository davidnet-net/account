<script lang="ts">
	import type { SessionInfo } from "$lib/types.ts";
	import { page } from "$app/state";
	import Error from "$lib/components/Error.svelte";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { authapiurl } from "$lib/config";
	import { accessToken, getSessionInfo, refreshAccessToken } from "$lib/session";
	import type { ProfileResponse } from "$lib/types";
	import { FlexWrapper, Space, Loader, toast, ToolTip, LinkIconButton, Button, IconButton } from "@davidnet/svelte-ui";
	import { onMount } from "svelte";
	import { get } from "svelte/store";
	import { formatDate_PREFERREDTIME } from "$lib/utils/time";

	let correlationID = crypto.randomUUID();
	let error = false;
	let loading = true;
	let errorMSG = "Unknown";
	let data: ProfileResponse;
	let isauthencated = false;
	let hoveredYOU = false;
	let hoveredADMIN = false;
	let hoveredINTERNAL = false;
	let hoveredCONNECTION = false;
	let sessionInfo: SessionInfo;

	let id = page.params.id || "";
	let created_on = "Loading...";

	onMount(async () => {
		try {
			if (!id || typeof id !== "string") {
				errorMSG = "Invalid or missing Profile ID.";
				error = true;
				loading = false;
				return;
			}

			await refreshAccessToken(correlationID, true);
			const si = await getSessionInfo(correlationID, false);
			if (si) {
				sessionInfo = si;
			}
			let token = get(accessToken);
			if (!token) {
				toast({
					title: "Not Authenticated",
					desc: "See more when you are logged in!",
					icon: "groups",
					appearance: "info",
					position: "bottom-left",
					autoDismiss: 7000
				});
			} else {
				isauthencated = true;
			}
			const res = await fetch(authapiurl + "profile/" + id, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					"x-correlation-id": correlationID,
					Authorization: "Bearer " + token
				},
				credentials: "include"
			});

			console.log(res.status);
			if (res.status === 404) {
				error = true;
				errorMSG = "Profile does not exist.";
				return;
			}

			data = await res.json();
			loading = false;
			created_on = await formatDate_PREFERREDTIME(data.profile.created_at, correlationID);
		} catch (err) {
			error = true;
			errorMSG = String(err);
		}
	});

	async function removefriend() {}
	async function addfriend() {}
</script>

{#if error}
	<Error pageName="Account Settings" {errorMSG} {correlationID} />
{:else if loading}
	<h1>Account Settings</h1>
	<ProfileLoader />
{:else}
	<Space height="var(--token-space-6)" />
	<FlexWrapper width="100%" justifycontent="space-around" direction="row">
		<Button
			onClick={() => {
				history.back();
			}}
			iconbefore="arrow_back">Back</Button
		>

		{#if data.isFriend}
			<IconButton onClick={removefriend} icon="group_remove" alt="Remove connection." appearance="primary" />
		{/if}

		{#if !data.isFriend && sessionInfo && !data.isSelf}
			<IconButton onClick={addfriend} icon="group_add" alt="Send connection request." appearance="primary" />
		{/if}

		{#if data.isSelf}
			<LinkIconButton appearance="primary" href="/account/settings/profile" icon="edit" alt="Edit profile" />
		{/if}

		{#if sessionInfo && sessionInfo.admin}
			<LinkIconButton icon="admin_panel_settings" appearance="danger" alt="Manage user as admin." href="/admin/manageuser/{id}" />
		{/if}
	</FlexWrapper>
	<Space height="var(--token-space-6)" />
	<FlexWrapper justifycontent="flex-start" height="100%" width="100%">
		{#if data.profile.avatar_url}
			<img class="profile" src={data.profile.avatar_url} aria-hidden="true" alt="Profile Picture" height="100px" width="100px" />
		{:else}
			<Loader />
			<Space height="var(--token-space-4)" />
		{/if}
		<div class="center-text">
			<h1>{data.profile.display_name}</h1>
			<span>@{data.profile.username}</span>
		</div>
		<Space height="var(--token-space-5)" />
		<FlexWrapper direction="row" gap="var(--token-space-2)">
			{#if data.isSelf}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="tag youtag" on:mouseenter={() => (hoveredYOU = true)} on:mouseleave={() => (hoveredYOU = false)}>
					<span class="material-symbols-outlined">family_star</span>
					You
					{#if hoveredYOU}
						<ToolTip text="This is your profile." />
					{/if}
				</div>
			{/if}
			{#if data.profile.admin}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="tag admintag" on:mouseenter={() => (hoveredADMIN = true)} on:mouseleave={() => (hoveredADMIN = false)}>
					<span class="material-symbols-outlined">admin_panel_settings</span>
					Admin
					{#if hoveredADMIN}
						<ToolTip text="Account has special access." />
					{/if}
				</div>
			{/if}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			{#if data.profile.internal}
				<div class="tag internaltag" on:mouseenter={() => (hoveredINTERNAL = true)} on:mouseleave={() => (hoveredINTERNAL = false)}>
					<span class="material-symbols-outlined">domain</span>
					Internal
					{#if hoveredINTERNAL}
						<ToolTip text="Account has access to Internal services." />
					{/if}
				</div>
			{/if}
			{#if data.isFriend}
				<div class="tag connectiontag" on:mouseenter={() => (hoveredCONNECTION = true)} on:mouseleave={() => (hoveredCONNECTION = false)}>
					<span class="material-symbols-outlined">group</span>
					Connection
					{#if hoveredCONNECTION}
						<ToolTip text="You have an connection with this account." />
					{/if}
				</div>
			{/if}
		</FlexWrapper>
		<Space height="var(--token-space-1)" />
		<p class="center-text" style="line-height: 1.2;"><b>Profile created on:</b> <br />{created_on}</p>

		{#if data.profile.email}
			<p class="center-text">Email: <a class="mail" href="mailto:{data.profile.email}">{data.profile.email}</a>.</p>
		{:else}
			<p class="center-text">Email is private.</p>
		{/if}
		<Space height="var(--token-space-5)" />
		<div class="desc">{data.profile.description}</div>
	</FlexWrapper>
{/if}

<style>
	h1 {
		text-align: center;
		font-size: 1.85rem;
	}
	.profile {
		border-radius: 50%;
	}

	.center-text {
		text-align: center;
	}

	.desc {
		width: 100%;
	}

	.tag {
		position: relative;
		height: 1rem;
		width: 5rem;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		vertical-align: center;
		padding: 0.3rem;
		border-radius: 0.5rem;
	}

	.youtag {
		background-color: var(--token-color-background-success-normal);
		color: var(--token-color-text-light-normal);
	}

	.admintag {
		background-color: var(--token-color-background-warning-normal);
		color: var(--token-color-text-light-normal);
	}

	.internaltag {
		background-color: var(--token-color-background-information-normal);
		color: var(--token-color-text-light-normal);
	}

	.connectiontag {
		background-color: var(--token-color-background-danger-normal);
		color: var(--token-color-text-default);
		width: 6.5rem;
	}

	.mail {
		color: var(--token-color-text-normal);
	}
</style>
