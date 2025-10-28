<script lang="ts">
	import { page } from "$app/state";
	import { authapiurl } from "$lib/config";
	import { authFetch, refreshAccessToken } from "$lib/session";
	import { FlexWrapper, Space, toast, Button, Icon, Modal } from "@davidnet/svelte-ui";
	import { onMount } from "svelte";

	let correlationID = crypto.randomUUID();

	let id = page.params.id || "";

	onMount(async () => {
		if (!id || typeof id !== "string") {
			return;
		}

		await refreshAccessToken(correlationID, true);
	});

	async function deleteacc() {
		const res = await authFetch(authapiurl + "moderate/delete_account", correlationID, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id })
		});
		if (res.ok) {
			toast({
				title: "User deleted",
				desc: "You are the best admin ever (:",
				icon: "check",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 5000
			});
			history.back();
		} else {
			toast({
				title: "User not deleted",
				desc: "ERROR",
				icon: "crisis_alert",
				appearance: "danger",
				position: "bottom-left",
				autoDismiss: 5000
			});
		}
	}

	async function deleteprofilepicture() {
		const res = await authFetch(authapiurl + "moderate/reset_profile_picture", correlationID, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id })
		});
		if (res.ok) {
			toast({
				title: "Profile picture deleted",
				desc: "You are the best admin ever (:",
				icon: "check",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 5000
			});
			history.back();
		} else {
			toast({
				title: "Profile picture not deleted",
				desc: "ERROR",
				icon: "crisis_alert",
				appearance: "danger",
				position: "bottom-left",
				autoDismiss: 5000
			});
		}
	}

	let showDeleteAccModal = $state(false);
	let showDeleteProfilePictureModal = $state(false);
</script>

<FlexWrapper height="100%" width="100%" gap="var(--token-space-2);">
	<Icon icon="shield" size="10rem" />

	<Space height="var(--token-space-4);" />
	<Button
		iconbefore="delete_forever"
		appearance="danger"
		onClick={() => {
			showDeleteAccModal = true;
		}}>Delete user</Button
	>
	<Button
		iconbefore="delete_forever"
		appearance="danger"
		onClick={() => {
			showDeleteProfilePictureModal = true;
		}}>Delete profile picture</Button
	>
	<Button
		appearance="subtle"
		onClick={() => {
			history.back();
		}}>Back</Button
	>
</FlexWrapper>

{#if showDeleteProfilePictureModal}
	<Modal
		title="Delete this profile picture?"
		titleIcon="delete_forever"
		desc="This cannot be undone?"
		hasCloseBtn
		on:close={() => (showDeleteProfilePictureModal = false)}
		options={[
			{
				appearance: "subtle",
				content: "Cancel",
				onClick: () => (showDeleteProfilePictureModal = false)
			},
			{ appearance: "danger", content: "Delete profile picture", onClick: deleteprofilepicture }
		]}
	/>
{/if}

{#if showDeleteAccModal}
	<Modal
		title="Delete this account?"
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
			{ appearance: "danger", content: "Delete account", onClick: deleteacc }
		]}
	/>
{/if}
