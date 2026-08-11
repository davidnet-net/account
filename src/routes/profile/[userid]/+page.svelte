<script lang="ts">
	import {
		authState,
		Avatar,
		Flex,
		getFetch,
		postFetch,
		Lozenge,
		Icon,
		Skeleton,
		whenAuthReady,
		identityState,
		LinkButton,
		navigateBack,
		Button,
		toast
	} from "@davidnet-net/svelte-ui";
	import type { PageProps } from "./$types";
	import { token } from "@davidnet-net/svelte-ui/tokens";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	let { params }: PageProps = $props();

	interface ProfileResponse {
		userId: string;
		username: string;
		displayName: string;
		avatarUrl: string | null;
		bannerUrl: string | null;
		description: string | null;
		countryCode: string | null;
		location: string | undefined;
		language: string | undefined;
		timezone: string | undefined;
		email: string | undefined;
		connectionsCount: number;
	}

	import * as styles from "./page.css";

	let profileResponse: undefined | ProfileResponse = $state(undefined);
	let friendStatus: "accepted" | "rejected" | "pending" | "none" = $state("none");
	let isIncomingRequest = $state(false);
	let isBlocked = $state(false);
	let isLoadingState = $state(true);

	async function loadData() {
		isLoadingState = true;
		const profileResult = await getFetch(
			PUBLIC_BACKEND_URL + "/auth/profile",
			{ user: params.userid },
			undefined,
			authState.isLoggedIn
		);

		if (profileResult.success) {
			profileResponse = profileResult.profileResponse;
		}

		if (!authState.isLoggedIn) {
			isLoadingState = false;
			return;
		}

		// 1. Fetch full connections/blocks list first to correctly evaluate block and request states
		const connectionsListResult = await getFetch(
			PUBLIC_BACKEND_URL + "/social/connections",
			undefined,
			undefined,
			true
		);

		if (connectionsListResult.success) {
			isBlocked = connectionsListResult.blocked?.some(
				(block: any) => block.userId === params.userid
			);

			isIncomingRequest = connectionsListResult.incoming?.some(
				(req: any) => req.userId === params.userid
			);
		}

		// 2. Fetch specific connection status via GET
		const connectionResult = await getFetch(
			PUBLIC_BACKEND_URL + "/social/connections/status",
			{ requestedUserID: params.userid },
			undefined,
			true
		);

		if (connectionResult.success) {
			friendStatus = connectionResult.status;
		}

		isLoadingState = false;
	}

	async function sendConnectionRequest() {
		const res = await postFetch(
			PUBLIC_BACKEND_URL + "/social/connections/send-connection-request",
			{ requestedUserID: params.userid },
			undefined,
			true
		);
		if (res.success) {
			friendStatus = "pending";
			isIncomingRequest = false;
			toast("Request sent", "Connection request has been sent.", "send", 3000, "subtle");
		} else {
			if (res.code === "CONNECTION_ALREADY_PENDING" || res.code === "CONNECTION_ALREADY_ACCEPTED") {
				friendStatus = res.code === "CONNECTION_ALREADY_ACCEPTED" ? "accepted" : "pending";
				toast(
					"Notice",
					res.error || "A connection status already exists.",
					"info",
					4000,
					"warning"
				);
			} else if (res.code === "REJECTION_COOLDOWN_ACTIVE") {
				friendStatus = "rejected";
				toast(
					"Cannot Send Request",
					res.error || "You must wait 24 hours after a rejection before sending a new request.",
					"acute",
					4000,
					"warning"
				);
			} else if (res.code === "SELF_CONNECTION_ERROR") {
				toast(
					"Invalid Action",
					"You cannot send a connection request to yourself.",
					"acute",
					4000,
					"warning"
				);
			} else {
				toast("Error", res.error || "Failed to send connection request.", "error", 4000, "danger");
			}
		}
	}

	async function acceptConnectionRequest() {
		const res = await postFetch(
			PUBLIC_BACKEND_URL + "/social/connections/accept-connection-request",
			{ requestedUserID: params.userid },
			undefined,
			true
		);
		if (res.success) {
			friendStatus = "accepted";
			isIncomingRequest = false;
			toast(
				profileResponse?.displayName + " has been accepted",
				"You have accepted the connection request.",
				"check",
				3000,
				"subtle"
			);
		} else {
			toast("Error", res.error || "Failed to accept request.", "error", 4000, "danger");
		}
	}

	async function rejectConnectionRequest() {
		const res = await postFetch(
			PUBLIC_BACKEND_URL + "/social/connections/reject-connection-request",
			{ requestedUserID: params.userid },
			undefined,
			true
		);
		if (res.success) {
			toast(
				profileResponse?.displayName + " has been rejected",
				"You have rejected the connection request.",
				"close",
				3000,
				"subtle"
			);
			friendStatus = "rejected";
			isIncomingRequest = false;
		} else {
			toast("Error", res.error || "Failed to reject request.", "error", 4000, "danger");
		}
	}

	async function blockUser() {
		const res = await postFetch(
			PUBLIC_BACKEND_URL + "/social/connections/block",
			{ requestedUserID: params.userid },
			undefined,
			true
		);
		if (res.success) {
			isBlocked = true;
			friendStatus = "none";
			isIncomingRequest = false;
			toast(
				profileResponse?.displayName + " has been blocked",
				"You will not receive connection requests from this user.",
				"block",
				3000,
				"success"
			);
		} else {
			if (res.code === "SELF_BLOCK_ERROR") {
				toast("Invalid Action", "You cannot block yourself.", "acute", 4000, "warning");
			} else {
				toast("Error", res.error || "Failed to block user.", "error", 4000, "danger");
			}
		}
	}

	async function unblockUser() {
		const res = await postFetch(
			PUBLIC_BACKEND_URL + "/social/connections/unblock",
			{ requestedUserID: params.userid },
			undefined,
			true
		);
		if (res.success) {
			isBlocked = false;
			toast(
				"User unblocked",
				"You can now receive interactions from this user.",
				"check_circle",
				3000,
				"success"
			);
			// Reload status to reflect any lingering connection state accurately
			await loadData();
		} else {
			toast("Error", res.error || "Failed to unblock user.", "error", 4000, "danger");
		}
	}

	$effect(() => {
		(async () => {
			await whenAuthReady();
			await loadData();
		})();
	});
</script>

<div style="width: 100%; max-width: 48rem; margin: 0 auto; box-sizing: border-box; padding: 1rem;">
	<Flex
		alignItems="center"
		justifyContent="start"
		direction="column"
		gap="medium"
		height="fit-content"
		marginTop="giant"
		width="100%">
		{#if !profileResponse || isLoadingState}
			<Skeleton width="100%" height="12rem">
				<Flex width="100%" height="100%" justifyContent="center" alignItems="center">
					<Skeleton
						height={token.global.font.size.xgiant}
						width={token.global.font.size.xgiant}
						radius="full" />
				</Flex>
			</Skeleton>

			<Skeleton width="12rem" height={token.global.font.size.xlarge} />
			<Skeleton width="8rem" height={token.global.font.size.medium} />
			<Skeleton width="60%" height="5rem" />
		{:else}
			<div
				class={styles.profileBanner}
				style="background-image: url({profileResponse.bannerUrl}); width: 100%; max-width: 100%; background-size: cover; background-position: center; border-radius: {token
					.global.radius.large};">
				<Flex width="100%" height="100%" justifyContent="center" alignItems="center">
					<Avatar src={profileResponse.avatarUrl || ""} size="xgiant" />
				</Flex>
			</div>

			<Flex
				justifyContent="center"
				alignItems="center"
				direction="column"
				gap="xsmall"
				height="fit-content">
				<span
					style="font-size: {token.global.font.size.xlarge}; font-weight: {token.global.font.weight
						.medium}; word-break: break-word; max-width: 100%;">
					{profileResponse.displayName}
				</span>
				<span style="opacity: 0.7; word-break: break-all; max-width: 100%;">
					@{profileResponse.username}
				</span>
			</Flex>

			<Flex direction="row" gap="small" flexWrap="wrap" justifyContent="center">
				{#if profileResponse.countryCode}
					<Lozenge>
						<Flex direction="row" gap="xsmall" alignItems="center">
							<Icon icon="globe" />
							<span>{profileResponse.countryCode}</span>
						</Flex>
					</Lozenge>
				{/if}

				{#if profileResponse.connectionsCount}
					<Lozenge>
						<Flex direction="row" gap="xsmall" alignItems="center">
							<Icon icon="contacts_product" />
							<span>{profileResponse.connectionsCount}</span>
						</Flex>
					</Lozenge>
				{/if}

				{#if profileResponse.location}
					<Lozenge>
						<Flex direction="row" gap="xsmall" alignItems="center">
							<Icon icon="location_on" />
							<span>{profileResponse.location}</span>
						</Flex>
					</Lozenge>
				{/if}

				{#if profileResponse.language}
					<Lozenge>
						<Flex direction="row" gap="xsmall" alignItems="center">
							<Icon icon="translate" />
							<span>{profileResponse.language}</span>
						</Flex>
					</Lozenge>
				{/if}

				{#if profileResponse.timezone}
					<Lozenge>
						<Flex direction="row" gap="xsmall" alignItems="center">
							<Icon icon="schedule" />
							<span>{profileResponse.timezone}</span>
						</Flex>
					</Lozenge>
				{/if}

				{#if profileResponse.email}
					<Lozenge>
						<Flex direction="row" gap="xsmall" alignItems="center">
							<Icon icon="mail" />
							<span style="word-break: break-all;">{profileResponse.email}</span>
						</Flex>
					</Lozenge>
				{/if}

				{#if isBlocked}
					<Lozenge appearance="danger">
						<Flex direction="row" gap="xsmall" alignItems="center">
							<Icon icon="block" />
							<span>Blocked</span>
						</Flex>
					</Lozenge>
				{:else}
					{#if friendStatus === "accepted"}
						<Lozenge>
							<Flex direction="row" gap="xsmall" alignItems="center">
								<Icon icon="emoji_people" />
								<span style="word-break: break-all;">Connection</span>
							</Flex>
						</Lozenge>
					{/if}

					{#if friendStatus === "pending"}
						<Lozenge appearance="discover">
							<Flex direction="row" gap="xsmall" alignItems="center">
								<Icon icon="emoji_people" />
								<span style="word-break: break-all;">
									{isIncomingRequest ? "Incoming request" : "Connection pending"}
								</span>
							</Flex>
						</Lozenge>
					{/if}
				{/if}

				{#if params.userid === identityState.user?.userID}
					<Lozenge>
						<Flex direction="row" gap="xsmall" alignItems="center">
							<Icon icon="ar_on_you" />
							<span>Yourself</span>
						</Flex>
					</Lozenge>
				{/if}
			</Flex>

			{#if profileResponse.description}
				<div
					style="width: 100%; max-width: 36rem; text-align: center; box-sizing: border-box; padding: 0 1rem;">
					<p
						style="white-space: pre-wrap; word-break: break-word; overflow-wrap: break-word; margin: 0;">
						{profileResponse.description}
					</p>
				</div>
			{/if}

			<Flex gap="small" width="fit-content" flexWrap="wrap" justifyContent="center">
				<Button
					iconbefore="arrow_back"
					onclick={() => {
						navigateBack();
					}}>
					Back
				</Button>

				{#if params.userid === identityState.user?.userID}
					<LinkButton href="/profile/edit">Edit profile</LinkButton>
				{:else if authState.isLoggedIn}
					{#if isBlocked}
						<Button onclick={unblockUser}>Unblock</Button>
					{:else}
						{#if friendStatus === "none" || friendStatus === "rejected"}
							<Button onclick={sendConnectionRequest}>Send connection request</Button>
						{:else if friendStatus === "pending" && isIncomingRequest}
							<Button onclick={acceptConnectionRequest}>Accept request</Button>
							<Button onclick={rejectConnectionRequest}>Reject request</Button>
						{/if}
						<Button onclick={blockUser}>Block</Button>
					{/if}
				{/if}
			</Flex>
		{/if}
	</Flex>
</div>
