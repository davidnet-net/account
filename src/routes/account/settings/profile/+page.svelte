<script lang="ts">
	import Error from "$lib/components/Error.svelte";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { authapiurl } from "$lib/config";
	import { getSessionInfo, authFetch, refreshAccessToken } from "$lib/session";
	import type { SessionInfo, ProfileResponse } from "$lib/types";
	import { wait } from "$lib/utils/time";
	import { FlexWrapper, Space, LinkButton, Button, Loader, TextArea, TextField, Dropdown, toast } from "@davidnet/svelte-ui";
	import { onMount } from "svelte";

	let correlationID = crypto.randomUUID();
	let error = false;
	let loading = true;
	let sessionInfo: SessionInfo | null;
	let errorMSG = "Unknown";
	let data: ProfileResponse;
	let temp_Description: string = "";
	let temp_display_name: string = "";
	let temp_email_visible: string = "private";
	let temp_timezone_visible: string = "private"
	let saving = false;

	onMount(async () => {
		const si = await getSessionInfo(correlationID);
		sessionInfo = si;

		if (!si) {
			errorMSG = "Session Invalid";
			error = true;
			loading = false;
			return;
		}

		try {
			const res = await authFetch(`${authapiurl}profile/${encodeURIComponent(si.userId)}`, correlationID);

			if (!res.ok || res.status === 404) {
				errorMSG = "Could not load your profile!";
				error = true;
				return;
			}

			data = await res.json();
			console.log(data);
		} catch (e) {
			console.error(e);
			errorMSG = String(e);
			error = true;
		} finally {
			if (typeof data.profile.description === "string" && typeof data.profile.display_name === "string") {
				temp_display_name = data.profile.display_name;
				temp_Description = data.profile.description;
				temp_email_visible = data.profile.email_visible;
				temp_timezone_visible = data.profile.timezone_visible;
				loading = false;
			} else {
				errorMSG = "Profile Data Invalid";
				error = true;
			}
		}
	});

	async function saveSettings() {
		if (!sessionInfo) return;
		saving = true;

		try {
			const res = await authFetch(`${authapiurl}settings/profile/save`, correlationID, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					display_name: temp_display_name,
					description: temp_Description,
					email_visible: temp_email_visible,
					timezone_visible: temp_timezone_visible
				})
			});

			if (!res.ok) {
				const json = await res.json();
				("Failed to save profile");
				error = true;
				return;
			}

			// Update local data with new values
			data.profile.display_name = temp_display_name;
			data.profile.description = temp_Description;
			data.profile.email_visible = temp_email_visible;
			data.profile.timezone_visible = temp_timezone_visible;

			error = false;
			toast({
				title: "Profile saved!",
				desc: "Your profile has been updated.",
				icon: "identity_platform",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 5000
			});
		} catch (e) {
			console.error(e);
			errorMSG = String(e);
			error = true;
		} finally {
			refreshAccessToken(correlationID, false, true);
			await wait(200);
			saving = false;
		}
	}

	$: hasChanges = data?.profile && (
		temp_display_name !== data.profile.display_name ||
		temp_Description !== data.profile.description ||
		temp_timezone_visible !== data.profile.timezone_visible ||
		temp_email_visible !== data.profile.email_visible
	);


	async function undo() {
		if (data && typeof data.profile.display_name === "string" && typeof data.profile.description === "string") {
			temp_display_name = data.profile.display_name;
			temp_Description = data.profile.description;
			temp_email_visible = data.profile.email_visible;
			temp_timezone_visible = data.profile.timezone_visible;
		}
	}

</script>

{#if error}
	<Error pageName="Account Settings" {errorMSG} {correlationID} />
{:else if loading}
	<h1>Profile Settings</h1>
	<ProfileLoader />
{:else}
	<div class="root">
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
		<h1>Profile Settings</h1>
		<FlexWrapper justifycontent="flex-start" width="100%" height="fit-content">
			{#if data.profile.avatar_url}
				<img class="profile" src={data.profile.avatar_url} aria-hidden="true" alt="Profile Picture" height="100px" width="100px" />
			{:else}
				<Loader />
				<Space height="var(--token-space-4)" />
			{/if}
			{#if typeof data.profile.display_name === "string"}
				<TextField label="Display Name" type="text" placeholder={data.profile.display_name} bind:value={temp_display_name} />
			{/if}
		</FlexWrapper>
		<Space height="var(--token-space-6)" />
		<TextArea
			label="Profile description"
			bind:value={temp_Description}
			placeholder="Hello 👋, i am {temp_display_name}."
			autoGrow={true}
			maxLength={500}
		/>

		<Space height="var(--token-space-6)" />
		<span>Profile privacy</span>
		<Space height="var(--token-space-2)" />
		<FlexWrapper gap="var(--token-space-2)">
			<div class="option">
				<FlexWrapper direction="row" justifycontent="flex-start" height="100%" width="100%" gap="var(--token-space-1)">
					Who can see my email.
					<Dropdown
						actions={[
							{ label: "Only me", value: "private", iconbefore: "visibility_off" },
							{ label: "Connections", value: "connections", iconbefore: "groups" },
							{ label: "Everyone", value: "public", iconbefore: "public" }
						]}
						bind:value={temp_email_visible}
						appearance="subtle"
					>
						Make an choice!
					</Dropdown>
				</FlexWrapper>
			</div>
			<div class="option">
				<FlexWrapper direction="row" justifycontent="flex-start" height="100%" width="100%" gap="var(--token-space-1)">
					Who can see my timezone.
					<Dropdown
						actions={[
							{ label: "Only me", value: "private", iconbefore: "visibility_off" },
							{ label: "Connections", value: "connections", iconbefore: "groups" },
							{ label: "Everyone", value: "public", iconbefore: "public" }
						]}
						bind:value={temp_timezone_visible}
						appearance="subtle"
					>
						Make an choice!
					</Dropdown>
				</FlexWrapper>
			</div>
		</FlexWrapper>
		<Space height="var(--token-space-6)" />
		<FlexWrapper justifycontent="flex-end" width="100%" direction="row">
			<Button onClick={undo} disabled={!hasChanges} appearance="danger">Undo</Button>
			<Button onClick={saveSettings} appearance="primary" loading={saving} disabled={!hasChanges}>Save</Button>
		</FlexWrapper>
		<Space height="var(--token-space-3)" />
	</div>
{/if}

<style>
	.root {
		overflow-y: auto;
		max-height: 100%;
	}

	h1 {
		text-align: center;
		font-size: 1.85rem;
	}
	.profile {
		border-radius: 50%;
	}

	.option {
		width: calc(100% - 2rem);
		height: 2rem;
		border-radius: 1rem;
		background-color: var(--token-color-surface-raised-normal);
		padding: 1rem;
	}
</style>
