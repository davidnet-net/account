<script lang="ts">
	import type { SessionInfo } from "$lib/types.ts";
	import { page } from "$app/state";
	import Error from "$lib/components/Error.svelte";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { authapiurl } from "$lib/config";
	import type { ProfileResponse } from "$lib/types";
	import {
		FlexWrapper,
		Space,
		Loader,
		toast,
		ToolTip,
		LinkIconButton,
		Button,
		IconButton,
		formatDate_PREFERREDTIME,
		wait,
		accessToken,
		authFetch,
		getSessionInfo,
		refreshAccessToken
	} from "@davidnet/svelte-ui";
	import { onMount } from "svelte";
	import { get } from "svelte/store";
	import { _ } from "svelte-i18n";

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
	let loadingfriend = false;

	let id = page.params.id || "";
	let created_on = $_("profile.loading_date");

	onMount(async () => {
		try {
			if (!id || typeof id !== "string") {
				errorMSG = $_("profile.invalid_id");
				error = true;
				loading = false;
				return;
			}

			await refreshAccessToken(correlationID, true);
			const si = await getSessionInfo(correlationID, false);
			if (si) sessionInfo = si;

			let token = get(accessToken);
			if (!token) {
				toast({
					title: $_("profile.not_authenticated_title"),
					desc: $_("profile.not_authenticated_desc"),
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

			if (res.status === 404) {
				error = true;
				errorMSG = $_("profile.not_found");
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

	async function addfriend() {
		if (!isauthencated) return;
		try {
			loadingfriend = true;
			const res = await authFetch(`${authapiurl}connections/request`, correlationID, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: Number(id) })
			});
			if (!res.ok) {
				const json = await res.json().catch(() => ({}));
				toast({
					title: $_("profile.connection_request_failed_title"),
					desc: json.error || $_("profile.connection_request_failed_desc"),
					icon: "group_add",
					appearance: "danger",
					position: "bottom-left",
					autoDismiss: 7500
				});
				return;
			}
			toast({
				title: $_("profile.connection_request_sent_title"),
				desc: $_("profile.connection_request_sent_desc"),
				icon: "group_add",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 7500
			});
			data.isFriend = false;
			data.isPending = true;
			await wait(300);
			loadingfriend = false;
		} catch (e) {
			console.error(e);
			toast({
				title: $_("profile.error"),
				desc: $_("profile.connection_request_error"),
				icon: "group_add",
				appearance: "danger",
				position: "bottom-left",
				autoDismiss: 7500
			});
		}
	}

	async function removefriend() {
		if (!isauthencated) return;
		try {
			loadingfriend = true;
			const res = await authFetch(`${authapiurl}connections/remove`, correlationID, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: Number(id) })
			});
			if (!res.ok) {
				const json = await res.json().catch(() => ({}));
				toast({
					title: $_("profile.remove_connection_failed_title"),
					desc: json.error || $_("profile.remove_connection_failed_desc"),
					icon: "group_remove",
					appearance: "danger",
					position: "bottom-left",
					autoDismiss: 7500
				});
				return;
			}
			toast({
				title: $_("profile.connection_removed_title"),
				desc: $_("profile.connection_removed_desc"),
				icon: "group_remove",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 7500
			});
			data.isFriend = false;
			data.isPending = false;
			await wait(300);
			loadingfriend = false;
		} catch (e) {
			console.error(e);
			toast({
				title: $_("profile.error"),
				desc: $_("profile.remove_connection_error"),
				icon: "group_remove",
				appearance: "danger",
				position: "bottom-left",
				autoDismiss: 7500
			});
		}
	}

	async function cancelfriendreq() {
		if (!isauthencated) return;
		try {
			loadingfriend = true;
			const res = await authFetch(`${authapiurl}connections/cancel`, correlationID, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: Number(id) })
			});
			if (!res.ok) {
				const json = await res.json().catch(() => ({}));
				toast({
					title: $_("profile.cancel_request_failed_title"),
					desc: json.error || $_("profile.cancel_request_failed_desc"),
					icon: "group_remove",
					appearance: "danger",
					position: "bottom-left",
					autoDismiss: 7500
				});
				return;
			}
			toast({
				title: $_("profile.request_cancelled_title"),
				desc: $_("profile.request_cancelled_desc"),
				icon: "group_remove",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 5000
			});
			data.isPending = false;
			data.isFriend = false;
			await wait(300);
			loadingfriend = false;
		} catch (e) {
			console.error(e);
			toast({
				title: $_("profile.error"),
				desc: $_("profile.cancel_request_error"),
				icon: "group_remove",
				appearance: "danger",
				position: "bottom-left",
				autoDismiss: 7500
			});
		}
	}
</script>

{#if error}
	<Error pageName={$_("profile.page_name")} {errorMSG} {correlationID} />
{:else if loading}
	<h1>{$_("profile.page_name")}</h1>
	<ProfileLoader />
{:else}
	<Space height="var(--token-space-6)" />
	<FlexWrapper width="100%" justifycontent="space-around" direction="row">
		<Button onClick={() => history.back()} iconbefore="arrow_back">{$_("profile.btn.back")}</Button>

		{#if data.isFriend}
			<IconButton
				onClick={removefriend}
				icon="group_remove"
				alt={$_("profile.alt.remove_connection")}
				appearance="primary"
				loading={loadingfriend}
			/>
		{/if}

		{#if !data.isFriend && sessionInfo && !data.isSelf && !data.isPending}
			<IconButton onClick={addfriend} icon="group_add" alt={$_("profile.alt.send_request")} appearance="primary" loading={loadingfriend} />
		{/if}

		{#if !data.isFriend && sessionInfo && !data.isSelf && data.isPending}
			<IconButton
				onClick={cancelfriendreq}
				icon="group_remove"
				alt={$_("profile.alt.cancel_request")}
				appearance="warning"
				loading={loadingfriend}
			/>
		{/if}

		{#if data.isSelf}
			<LinkIconButton appearance="primary" href="/account/settings/profile" icon="edit" alt={$_("profile.alt.edit_profile")} />
			<LinkIconButton appearance="subtle" href="/account/settings/connections" icon="groups" alt={$_("profile.alt.manage_connections")} />
		{/if}

		{#if sessionInfo && sessionInfo.admin}
			<LinkIconButton icon="admin_panel_settings" appearance="danger" alt={$_("profile.alt.admin_manage")} href="/admin/users/manage/{id}" />
		{/if}
	</FlexWrapper>

	<Space height="var(--token-space-6)" />
	<FlexWrapper justifycontent="flex-start" height="100%" width="100%">
		{#if data.profile.avatar_url}
			<img
				class="profile"
				src={data.profile.avatar_url}
				crossorigin="anonymous"
				aria-hidden="true"
				alt={$_("profile.alt.profile_picture")}
				height="100px"
				width="100px"
			/>
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
					{$_("profile.tag.you")}
					{#if hoveredYOU}<ToolTip text={$_("profile.tag.you_tooltip")} />{/if}
				</div>
			{/if}
			{#if data.profile.admin}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="tag admintag" on:mouseenter={() => (hoveredADMIN = true)} on:mouseleave={() => (hoveredADMIN = false)}>
					<span class="material-symbols-outlined">admin_panel_settings</span>
					{$_("profile.tag.admin")}
					{#if hoveredADMIN}<ToolTip text={$_("profile.tag.admin_tooltip")} />{/if}
				</div>
			{/if}
			{#if data.profile.internal}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="tag internaltag" on:mouseenter={() => (hoveredINTERNAL = true)} on:mouseleave={() => (hoveredINTERNAL = false)}>
					<span class="material-symbols-outlined">domain</span>
					{$_("profile.tag.internal")}
					{#if hoveredINTERNAL}<ToolTip text={$_("profile.tag.internal_tooltip")} />{/if}
				</div>
			{/if}
			{#if data.isFriend}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="tag connectiontag" on:mouseenter={() => (hoveredCONNECTION = true)} on:mouseleave={() => (hoveredCONNECTION = false)}>
					<span class="material-symbols-outlined">group</span>
					{$_("profile.tag.connection")}
					{#if hoveredCONNECTION}<ToolTip text={$_("profile.tag.connection_tooltip")} />{/if}
				</div>
			{/if}
		</FlexWrapper>

		<Space height="var(--token-space-1)" />
		<p class="center-text" style="line-height: 1.2;"><b>{$_("profile.created_on")}:</b> <br />{created_on}</p>

		{#if data.profile.email}
			<p class="center-text">
				{$_("profile.email")}:
				<a class="mail" href="mailto:{data.profile.email}">{data.profile.email}</a>
			</p>
		{:else}
			<p class="center-text">{$_("profile.email_private")}</p>
		{/if}

		{#if data.profile.timezone}
			<p class="center-text">{$_("profile.timezone")}: {data.profile.timezone}</p>
		{:else}
			<p class="center-text">{$_("profile.timezone_private")}</p>
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
		word-break: break-all;
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
		background-color: var(--token-color-background-success-normal);
		color: var(--token-color-text-light-normal);
		width: 6.5rem;
	}

	.mail {
		color: var(--token-color-text-normal);
	}
</style>
