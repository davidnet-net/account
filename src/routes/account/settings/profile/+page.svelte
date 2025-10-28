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
	let temp_email_visible: "public" | "connections" | "private" = "private";
	let temp_timezone_visible: "public" | "connections" | "private" = "private";
	let saving = false;

	// Avatar handling
	let temp_avatar_file: File | null = null;
	let temp_avatar_preview: string | null = null;

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

	function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const validTypes = [
			"image/jpeg",
			"image/pjpeg",
			"image/jfif",
			"image/jiff",
			"image/png",
			"image/webp",
			"image/gif"
		];
		if (!validTypes.includes(file.type.toLowerCase())) {
			toast({
				title: "Invalid file",
				desc: "Only JPEG, PNG, WEBP, GIF, JFIF, or JIFF images are allowed.",
				appearance: "danger",
				icon: "warning",
				position: "bottom-left",
				autoDismiss: 7500
			});
			return;
		}

		temp_avatar_file = file;
		temp_avatar_preview = URL.createObjectURL(file);
	}

	async function saveSettings() {
		if (!sessionInfo) return;
		saving = true;

		try {
			// 1️⃣ If a new avatar was selected, upload it first
			if (temp_avatar_file) {
				const formData = new FormData();
				formData.append("file", temp_avatar_file);

				const uploadRes = await authFetch(`${authapiurl}profile-picture`, correlationID, {
					method: "POST",
					body: formData
				});

				if (!uploadRes.ok) {
					const err = await uploadRes.json();
					throw new Error(err.error || "Failed to upload profile picture");
				}

				const { avatar_url } = await uploadRes.json();
				data.profile.avatar_url = avatar_url;
				temp_avatar_file = null;
				temp_avatar_preview = null;
			}

			// 2️⃣ Then update profile info
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
				throw new Error(json.error || "Failed to save profile");
			}

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
		temp_email_visible !== data.profile.email_visible ||
		temp_avatar_file !== null
	);

	async function undo() {
		if (data && typeof data.profile.display_name === "string" && typeof data.profile.description === "string") {
			temp_display_name = data.profile.display_name;
			temp_Description = data.profile.description;
			temp_email_visible = data.profile.email_visible;
			temp_timezone_visible = data.profile.timezone_visible;
			temp_avatar_file = null;
			temp_avatar_preview = null;
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
			<div class="avatar-wrapper" on:click={() => document.getElementById('avatarInput')?.click()}>
				{#if temp_avatar_preview}
					<img class="profile" src={temp_avatar_preview} alt="New profile preview" height="100" width="100" />
				{:else if data.profile.avatar_url}
					<img class="profile" src={data.profile.avatar_url} alt="Profile picture" height="100" width="100" />
				{:else}
					<Loader />
				{/if}
				<div class="change-overlay">Change</div>
			</div>
			<input id="avatarInput" type="file" accept="image/*" style="display:none" on:change={handleFileChange} />

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
						Make a choice!
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
						Make a choice!
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
		object-fit: cover;
	}

	.avatar-wrapper {
		position: relative;
		cursor: pointer;
		display: inline-block;
	}
	.avatar-wrapper:hover .change-overlay {
		opacity: 1;
	}
	.change-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		text-align: center;
		background: rgba(0, 0, 0, 0.5);
		color: white;
		font-size: 0.8rem;
		padding: 0.2rem;
		border-radius: 0 0 50% 50%;
		opacity: 0;
		transition: opacity 0.2s ease-in-out;
	}

	.option {
		width: calc(100% - 2rem);
		height: 2rem;
		border-radius: 1rem;
		background-color: var(--token-color-surface-raised-normal);
		padding: 1rem;
	}
</style>
