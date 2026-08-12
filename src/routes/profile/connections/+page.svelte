<script lang="ts">
	import { onMount } from "svelte";
	import {
		authState,
		Avatar,
		Button,
		Flex,
		getFetch,
		LinkButton,
		navigateBack,
		postFetch,
		Skeleton,
		TabPanel,
		Tab,
		Tabs,
		toast,
		whenAuthReady
	} from "@davidnet-net/svelte-ui";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { token } from "@davidnet-net/svelte-ui/tokens";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";

	import * as styles from "./page.css";

	let activeTab = $state("friends");
	let isLoading = $state(true);

	let friendsList = $state<any[]>([]);
	let incomingList = $state<any[]>([]);
	let outgoingList = $state<any[]>([]);
	let blockedList = $state<any[]>([]);

	async function loadConnectionsData() {
		if (!authState.isLoggedIn) return;

		isLoading = true;
		const res = await getFetch(
			`${PUBLIC_BACKEND_URL}/social/connections`,
			undefined,
			undefined,
			true
		);

		if (res.success) {
			friendsList = res.friends || [];
			incomingList = res.incoming || [];
			outgoingList = res.outgoing || [];
			blockedList = res.blocked || [];
		} else {
			toast("Error", "Failed to load connections list.", "error", 4000, "danger");
		}
		isLoading = false;
	}

	async function acceptRequest(userId: string) {
		const res = await postFetch(
			`${PUBLIC_BACKEND_URL}/social/connections/accept-connection-request`,
			{ requestedUserID: userId },
			undefined,
			true
		);
		if (res.success) {
			toast("Accepted", "Connection request accepted.", "check", 3000, "subtle");
			await loadConnectionsData();
		} else {
			toast("Error", res.error || "Failed to accept request.", "error", 4000, "danger");
		}
	}

	async function rejectRequest(userId: string) {
		const res = await postFetch(
			`${PUBLIC_BACKEND_URL}/social/connections/reject-connection-request`,
			{ requestedUserID: userId },
			undefined,
			true
		);
		if (res.success) {
			toast("Rejected", "Connection request rejected.", "close", 3000, "subtle");
			await loadConnectionsData();
		} else {
			toast("Error", res.error || "Failed to reject request.", "error", 4000, "danger");
		}
	}

	async function removeConnection(userId: string) {
		const res = await postFetch(
			`${PUBLIC_BACKEND_URL}/social/connections/unconnect`,
			{ requestedUserID: userId },
			undefined,
			true
		);
		if (res.success) {
			toast("Removed", "Connection removed.", "person_remove", 3000, "subtle");
			await loadConnectionsData();
		} else {
			toast("Error", res.error || "Failed to remove connection.", "error", 4000, "danger");
		}
	}

	async function unblockUser(userId: string) {
		const res = await postFetch(
			`${PUBLIC_BACKEND_URL}/social/connections/unblock`,
			{ requestedUserID: userId },
			undefined,
			true
		);
		if (res.success) {
			toast("Unblocked", "User has been unblocked.", "check_circle", 3000, "success");
			await loadConnectionsData();
		} else {
			toast("Error", res.error || "Failed to unblock user.", "error", 4000, "danger");
		}
	}

	onMount(() => {
		const handleVisibilityChange = async () => {
			if (document.visibilityState === "visible" && authState.isLoggedIn) {
				await loadConnectionsData();
			}
		};
		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
	});

	$effect(() => {
		(async () => {
			await whenAuthReady();
			if (!authState.isLoggedIn && !authState.loading) {
				goto(`/login?continue=${encodeURIComponent(page.url.href)}`);
				return;
			}
			if (authState.isLoggedIn) {
				await loadConnectionsData();
			}
		})();
	});
</script>

<Flex direction="column" alignItems="center" width="100%" padding="medium">
	<Flex direction="column" gap="medium" width="100%" maxWidth="48rem">
		<div class={styles.card} style="width: 100%;">
			<h1
				class={styles.title}
				style="font-size: {token.global.font.size.xlarge}; font-weight: {token.global.font.weight
					.bold}; margin-bottom: {token.global.spacing.medium};">
				Connections
			</h1>

			{#if isLoading}
				<Flex direction="column" gap="medium" width="100%">
					<Skeleton width="100%" height="4rem" />
					<Skeleton width="100%" height="4rem" />
					<Skeleton width="100%" height="4rem" />
				</Flex>
			{:else}
				<Tabs bind:selected={activeTab}>
					<Flex direction="column" gap="medium" width="100%">
						<Flex
							direction="row"
							gap="small"
							height="fit-content"
							width="fit-content"
							flexWrap="wrap">
							<Tab value="friends">Connections ({friendsList.length})</Tab>
							<Tab value="incoming">Incoming ({incomingList.length})</Tab>
							<Tab value="outgoing">Outgoing ({outgoingList.length})</Tab>
							<Tab value="blocked">Blocked ({blockedList.length})</Tab>
						</Flex>

						<TabPanel value="friends">
							<Flex direction="column" gap="small" width="100%">
								{#if friendsList.length === 0}
									<p style="opacity: 0.7;">No connections found.</p>
								{:else}
									{#each friendsList as item (item.connectionId)}
										<Flex
											direction="row"
											justifyContent="between"
											alignItems="center"
											width="100%"
											padding="small"
											gap="medium">
											<Flex direction="row" gap="small" alignItems="center">
												<Avatar src={item.user.avatarUrl || ""} size="medium" />
												<Flex direction="column" gap="xsmall">
													<span style="font-weight: {token.global.font.weight.medium};">
														{item.user.displayName}
													</span>
													<span
														style="color: {token.theme.color.text.secondary}; font-size: {token
															.global.font.size.small};">
														@{item.user.username}
													</span>
												</Flex>
											</Flex>
											<Flex direction="row" gap="small" alignItems="center">
												<LinkButton href="/profile/{item.user.userId}">View Profile</LinkButton>
												<Button
													appearance="subtle"
													onclick={() => removeConnection(item.user.userId)}>
													Remove
												</Button>
											</Flex>
										</Flex>
									{/each}
								{/if}
							</Flex>
						</TabPanel>

						<TabPanel value="incoming">
							<Flex direction="column" gap="small" width="100%">
								{#if incomingList.length === 0}
									<p style="opacity: 0.7;">No incoming requests.</p>
								{:else}
									{#each incomingList as item (item.connectionId)}
										<Flex
											direction="row"
											justifyContent="between"
											alignItems="center"
											width="100%"
											padding="small"
											gap="medium">
											<Flex direction="row" gap="small" alignItems="center">
												<Avatar src={item.user.avatarUrl || ""} size="medium" />
												<Flex direction="column" gap="xsmall">
													<span style="font-weight: {token.global.font.weight.medium};">
														{item.user.displayName}
													</span>
													<span
														style="color: {token.theme.color.text.secondary}; font-size: {token
															.global.font.size.small};">
														@{item.user.username}
													</span>
												</Flex>
											</Flex>
											<Flex direction="row" gap="small" alignItems="center">
												<LinkButton href="/profile/{item.user.userId}">View Profile</LinkButton>
												<Button
													appearance="primary"
													onclick={() => acceptRequest(item.user.userId)}>
													Accept
												</Button>
												<Button appearance="subtle" onclick={() => rejectRequest(item.user.userId)}>
													Reject
												</Button>
											</Flex>
										</Flex>
									{/each}
								{/if}
							</Flex>
						</TabPanel>

						<TabPanel value="outgoing">
							<Flex direction="column" gap="small" width="100%">
								{#if outgoingList.length === 0}
									<p style="opacity: 0.7;">No outgoing requests pending.</p>
								{:else}
									{#each outgoingList as item (item.connectionId)}
										<Flex
											direction="row"
											justifyContent="between"
											alignItems="center"
											width="100%"
											padding="small"
											gap="medium">
											<Flex direction="row" gap="small" alignItems="center">
												<Avatar src={item.user.avatarUrl || ""} size="medium" />
												<Flex direction="column" gap="xsmall">
													<span style="font-weight: {token.global.font.weight.medium};">
														{item.user.displayName}
													</span>
													<span
														style="color: {token.theme.color.text.secondary}; font-size: {token
															.global.font.size.small};">
														@{item.user.username}
													</span>
												</Flex>
											</Flex>
											<Flex direction="row" gap="small" alignItems="center">
												<LinkButton href="/profile/{item.user.userId}">View Profile</LinkButton>
											</Flex>
										</Flex>
									{/each}
								{/if}
							</Flex>
						</TabPanel>

						<TabPanel value="blocked">
							<Flex direction="column" gap="small" width="100%">
								{#if blockedList.length === 0}
									<p style="opacity: 0.7;">No blocked users.</p>
								{:else}
									{#each blockedList as item (item.blockId)}
										<Flex
											direction="row"
											justifyContent="between"
											alignItems="center"
											width="100%"
											padding="small"
											gap="medium">
											<Flex direction="row" gap="small" alignItems="center">
												<Avatar src={item.user.avatarUrl || ""} size="medium" />
												<Flex direction="column" gap="xsmall">
													<span style="font-weight: {token.global.font.weight.medium};">
														{item.user.displayName}
													</span>
													<span
														style="color: {token.theme.color.text.secondary}; font-size: {token
															.global.font.size.small};">
														@{item.user.username}
													</span>
												</Flex>
											</Flex>
											<Flex direction="row" gap="small" alignItems="center">
												<Button appearance="primary" onclick={() => unblockUser(item.user.userId)}>
													Unblock
												</Button>
											</Flex>
										</Flex>
									{/each}
								{/if}
							</Flex>
						</TabPanel>
					</Flex>
				</Tabs>
			{/if}

			<Flex direction="row" width="100%" marginTop="large">
				<Button
					iconbefore="arrow_back"
					onclick={() => {
						navigateBack();
					}}>
					Back
				</Button>
			</Flex>
		</div>
	</Flex>
</Flex>
