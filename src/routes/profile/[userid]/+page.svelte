<script lang="ts">
	import {
		authState,
		Avatar,
		Button,
		Flex,
		getFetch,
		Icon,
		identityState,
		LinkButton,
		Lozenge,
		navigateBack,
		postFetch,
		ReportModal,
		Skeleton,
		toast,
		whenAuthReady
	} from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";
	import { onMount } from "svelte";

	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	import * as m from "$lib/paraglide/messages.js";

	import type { PageProps } from "./$types";
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
		isInternal: boolean;
	}

	interface CommunityGameAchievement {
		gameId: string;
		gameTitle: string;
		gameIconFilename: string | null;
		achievementId: string;
		name: string;
		description: string | null;
		icon: string | null;
		unlockedAt: string;
	}

	import * as styles from "./page.css";

	let profileResponse: undefined | ProfileResponse = $state(undefined);
	let friendStatus: "accepted" | "rejected" | "pending" | "none" = $state("none");
	let isIncomingRequest = $state(false);
	let isBlocked = $state(false);
	let isLoadingState = $state(true);
	let isProfileUnavailable = $state(false);

	let achievements: CommunityGameAchievement[] = $state([]);
	let achievementsVisible = $state(true);
	let totalPlaytimeMs = $state(0);

	// Shown for both logged-in and anonymous viewers - achievements are gated server-side by the
	// target player's own privacy preference, not by whether the viewer is authenticated.
	async function loadCommunityGamesData(isOwnProfile: boolean) {
		const achievementsResult = await getFetch(
			`${PUBLIC_BACKEND_URL}/social/community-games/achievements`,
			{ user: params.userid },
			undefined,
			authState.isLoggedIn
		);

		if (achievementsResult.success) {
			achievementsVisible = achievementsResult.visible;
			achievements = achievementsResult.achievements ?? [];
		}

		if (isOwnProfile && authState.isLoggedIn) {
			const playtimeResult = await getFetch(
				`${PUBLIC_BACKEND_URL}/social/community-games/playtime/total`,
				undefined,
				undefined,
				true
			);

			if (playtimeResult.success) {
				totalPlaytimeMs = playtimeResult.totalPlaytimeMs ?? 0;
			}
		}
	}

	async function loadData() {
		if (!authState.isLoggedIn) {
			const profileResult = await getFetch(
				`${PUBLIC_BACKEND_URL}/auth/profile`,
				{ user: params.userid },
				undefined,
				false
			);
			if (profileResult.success) {
				profileResponse = profileResult.profileResponse;
				await loadCommunityGamesData(false);
			} else {
				isProfileUnavailable = true;
			}
			isLoadingState = false;
			return;
		}

		const profileResult = await getFetch(
			`${PUBLIC_BACKEND_URL}/auth/profile`,
			{ user: params.userid },
			undefined,
			true
		);

		if (profileResult.success) {
			profileResponse = profileResult.profileResponse;
			await loadCommunityGamesData(params.userid === identityState.user?.userID);
		} else {
			isProfileUnavailable = true;
			isLoadingState = false;
			return;
		}

		// 1. Fetch full connections/blocks list to evaluate block state accurately
		const connectionsListResult = await getFetch(
			`${PUBLIC_BACKEND_URL}/social/connections`,
			undefined,
			undefined,
			true
		);

		if (connectionsListResult.success) {
			isBlocked = connectionsListResult.blocked?.some(
				(block: any) => block.userId === params.userid || block.blockedId === params.userid
			);
		}

		// 2. Fetch connection status and direct incoming check from the server endpoint
		const connectionResult = await getFetch(
			`${PUBLIC_BACKEND_URL}/social/connections/status`,
			{ user: params.userid },
			undefined,
			true
		);

		if (connectionResult.success) {
			friendStatus = connectionResult.status;
			isIncomingRequest = connectionResult.isIncoming ?? false;
		}

		isLoadingState = false;
	}

	async function sendConnectionRequest() {
		const res = await postFetch(
			`${PUBLIC_BACKEND_URL}/social/connections/send-connection-request`,
			{ requestedUserID: params.userid },
			undefined,
			true
		);
		if (res.success) {
			toast(
				m.page_profile_toast_request_sent_title(),
				m.page_profile_toast_request_sent_content(),
				"send",
				3000,
				"subtle"
			);
			await loadData();
		} else {
			if (res.code === "CONNECTION_ALREADY_PENDING" || res.code === "CONNECTION_ALREADY_ACCEPTED") {
				await loadData();
				toast(
					m.page_profile_toast_connection_updated_title(),
					res.error || m.page_profile_toast_connection_exists(),
					"info",
					4000,
					"warning"
				);
			} else if (res.code === "REJECTION_COOLDOWN_ACTIVE") {
				toast(
					m.page_profile_toast_cannot_send_title(),
					res.error || m.page_profile_toast_cooldown(),
					"acute",
					4000,
					"warning"
				);
			} else if (res.code === "SELF_CONNECTION_ERROR") {
				toast(
					m.page_profile_toast_invalid_action_title(),
					m.page_profile_toast_self_connection(),
					"acute",
					4000,
					"warning"
				);
			} else {
				toast(
					m.common_Error(),
					res.error || m.page_profile_toast_send_request_failed(),
					"error",
					4000,
					"danger"
				);
			}
		}
	}

	async function acceptConnectionRequest() {
		const res = await postFetch(
			`${PUBLIC_BACKEND_URL}/social/connections/accept-connection-request`,
			{ requestedUserID: params.userid },
			undefined,
			true
		);
		if (res.success) {
			toast(
				profileResponse?.displayName + m.page_profile_toast_accepted_suffix(),
				m.page_profile_toast_accepted_content(),
				"check",
				3000,
				"subtle"
			);
			await loadData();
		} else {
			toast(
				m.common_Error(),
				res.error || m.page_profile_toast_accept_failed(),
				"error",
				4000,
				"danger"
			);
		}
	}

	async function rejectConnectionRequest() {
		const res = await postFetch(
			`${PUBLIC_BACKEND_URL}/social/connections/reject-connection-request`,
			{ requestedUserID: params.userid },
			undefined,
			true
		);
		if (res.success) {
			toast(
				profileResponse?.displayName + m.page_profile_toast_rejected_suffix(),
				m.page_profile_toast_rejected_content(),
				"close",
				3000,
				"subtle"
			);
			await loadData();
		} else {
			toast(
				m.common_Error(),
				res.error || m.page_profile_toast_reject_failed(),
				"error",
				4000,
				"danger"
			);
		}
	}

	async function removeConnection() {
		const res = await postFetch(
			`${PUBLIC_BACKEND_URL}/social/connections/remove-connection`,
			{ requestedUserID: params.userid },
			undefined,
			true
		);
		if (res.success) {
			toast(
				m.page_profile_toast_removed_title(),
				m.page_profile_toast_removed_content(),
				"person_remove",
				3000,
				"subtle"
			);
			await loadData();
		} else {
			toast(
				m.common_Error(),
				res.error || m.page_profile_toast_remove_failed(),
				"error",
				4000,
				"danger"
			);
		}
	}

	async function blockUser() {
		const res = await postFetch(
			`${PUBLIC_BACKEND_URL}/social/connections/block`,
			{ requestedUserID: params.userid },
			undefined,
			true
		);
		if (res.success) {
			toast(
				profileResponse?.displayName + m.page_profile_toast_blocked_suffix(),
				m.page_profile_toast_blocked_content(),
				"block",
				3000,
				"success"
			);
			await loadData();
		} else {
			if (res.code === "SELF_BLOCK_ERROR") {
				toast(
					m.page_profile_toast_invalid_action_title(),
					m.page_profile_toast_self_block(),
					"acute",
					4000,
					"warning"
				);
			} else {
				toast(
					m.common_Error(),
					res.error || m.page_profile_toast_block_failed(),
					"error",
					4000,
					"danger"
				);
			}
		}
	}

	async function unblockUser() {
		const res = await postFetch(
			`${PUBLIC_BACKEND_URL}/social/connections/unblock`,
			{ requestedUserID: params.userid },
			undefined,
			true
		);
		if (res.success) {
			toast(
				m.page_profile_toast_unblocked_title(),
				m.page_profile_toast_unblocked_content(),
				"check_circle",
				3000,
				"success"
			);
			await loadData();
		} else {
			toast(
				m.common_Error(),
				res.error || m.page_profile_toast_unblock_failed(),
				"error",
				4000,
				"danger"
			);
		}
	}

	onMount(() => {
		const handleVisibilityChange = async () => {
			if (document.visibilityState === "visible" && authState.isLoggedIn) {
				await loadData();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	});

	$effect(() => {
		(async () => {
			await whenAuthReady();
			await loadData();
		})();
	});

	let showReportModal = $state(false);

	let isOwnProfile = $derived(params.userid === identityState.user?.userID);

	function formatPlaytime(ms: number): string {
		const totalMinutes = Math.floor(ms / 60000);
		const hours = Math.floor(totalMinutes / 60);
		const minutes = totalMinutes % 60;
		return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
	}
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
		{#if isProfileUnavailable}
			<Flex direction="column" alignItems="center" gap="small" marginTop="giant">
				<Icon icon="person_off" />
				<span
					style="font-size: {token.global.font.size.xlarge}; font-weight: {token.global.font.weight
						.medium};">
					{m.page_profile_unavailable_title()}
				</span>
				<span style="opacity: 0.7; text-align: center;">
					{m.page_profile_unavailable_description()}
				</span>
				<Button
					iconbefore="arrow_back"
					onclick={() => {
						navigateBack();
					}}>
					{m.common_back()}
				</Button>
			</Flex>
		{:else if !profileResponse || isLoadingState}
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
				{#if profileResponse.isInternal}
					<Lozenge appearance="primary">
						<Flex direction="row" gap="xsmall" alignItems="center">
							<Icon icon="verified" />
							<span>{m.page_profile_internal_badge()}</span>
						</Flex>
					</Lozenge>
				{/if}

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

				{#if achievementsVisible && achievements.length > 0}
					<Lozenge>
						<Flex direction="row" gap="xsmall" alignItems="center">
							<Icon icon="military_tech" />
							<span>{m.page_profile_achievements_count({ count: achievements.length })}</span>
						</Flex>
					</Lozenge>
				{/if}

				{#if isOwnProfile && totalPlaytimeMs > 0}
					<Lozenge>
						<Flex direction="row" gap="xsmall" alignItems="center">
							<Icon icon="schedule" />
							<span>{formatPlaytime(totalPlaytimeMs)}</span>
						</Flex>
					</Lozenge>
				{/if}

				{#if isBlocked}
					<Lozenge appearance="danger">
						<Flex direction="row" gap="xsmall" alignItems="center">
							<Icon icon="block" />
							<span>{m.page_profile_blocked_badge()}</span>
						</Flex>
					</Lozenge>
				{:else}
					{#if friendStatus === "accepted"}
						<Lozenge>
							<Flex direction="row" gap="xsmall" alignItems="center">
								<Icon icon="emoji_people" />
								<span style="word-break: break-all;">{m.page_profile_connection_badge()}</span>
							</Flex>
						</Lozenge>
					{/if}

					{#if friendStatus === "pending"}
						<Lozenge appearance="discover">
							<Flex direction="row" gap="xsmall" alignItems="center">
								<Icon icon="emoji_people" />
								<span style="word-break: break-all;">
									{isIncomingRequest
										? m.page_profile_incoming_request_badge()
										: m.page_profile_pending_badge()}
								</span>
							</Flex>
						</Lozenge>
					{/if}
				{/if}

				{#if params.userid === identityState.user?.userID}
					<Lozenge>
						<Flex direction="row" gap="xsmall" alignItems="center">
							<Icon icon="ar_on_you" />
							<span>{m.page_profile_yourself_badge()}</span>
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

			{#if achievementsVisible && achievements.length > 0}
				<Flex
					gap="small"
					flexWrap="wrap"
					justifyContent="center"
					style="width: 100%; max-width: 36rem; box-sizing: border-box; padding: 0 1rem;">
					{#each achievements as a (a.gameId + ":" + a.achievementId)}
						<Lozenge>
							<Flex direction="row" gap="xsmall" alignItems="center">
								{#if a.icon}
									<span>{a.icon}</span>
								{:else}
									<Icon icon="military_tech" size="small" />
								{/if}
								<span>{a.name}</span>
							</Flex>
						</Lozenge>
					{/each}
				</Flex>
			{/if}

			<Flex gap="small" width="fit-content" flexWrap="wrap" justifyContent="center">
				<Button
					iconbefore="arrow_back"
					onclick={() => {
						navigateBack();
					}}>
					{m.common_back()}
				</Button>

				{#if params.userid === identityState.user?.userID}
					<LinkButton href="/profile/edit">{m.page_profile_edit_link()}</LinkButton>
					<LinkButton href="/profile/connections">
						{m.page_profile_manage_connections_link()}
					</LinkButton>
				{:else if authState.isLoggedIn}
					{#if isBlocked}
						<Button onclick={unblockUser}>{m.page_profile_unblock_button()}</Button>
					{:else}
						{#if friendStatus === "accepted"}
							<Button onclick={removeConnection}>
								{m.page_profile_remove_connection_button()}
							</Button>
						{:else if friendStatus === "none" || friendStatus === "rejected"}
							<Button onclick={sendConnectionRequest}>
								{m.page_profile_send_request_button()}
							</Button>
						{:else if friendStatus === "pending"}
							{#if isIncomingRequest}
								<Button onclick={acceptConnectionRequest}>
									{m.page_profile_accept_request_button()}
								</Button>
								<Button onclick={rejectConnectionRequest}>
									{m.page_profile_reject_request_button()}
								</Button>
							{/if}
						{/if}

						{#if friendStatus !== "accepted"}
							<Button onclick={blockUser}>{m.page_profile_block_button()}</Button>
						{/if}
					{/if}
					<Button
						iconbefore="flag"
						onclick={() => {
							showReportModal = !showReportModal;
						}}>
						{m.page_profile_report_button()}
					</Button>
				{/if}
			</Flex>
		{/if}
	</Flex>
</div>

{#if showReportModal}
	<ReportModal bind:isOpen={showReportModal} reportType="profile" reportedId={params.userid} />
{/if}
