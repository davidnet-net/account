<script lang="ts">
	import {
		appState,
		authState,
		Avatar,
		Flex,
		identityState,
		Skeleton,
		whenAuthReady
	} from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import Card from "$lib/components/Card/Card.svelte";
	import HorizontalCard from "$lib/components/HorizontalCard/HorizontalCard.svelte";
	import * as m from "$lib/paraglide/messages.js";

	$effect(() => {
		(async () => {
			await whenAuthReady();
			if (!authState.isLoggedIn && !authState.loading) {
				goto(`/login?continue=${encodeURIComponent(page.url.href)}`);
			}
		})();
	});
</script>

{#if authState.isLoggedIn}
	<Flex alignItems="center" justifyContent="start" direction="column" gap="none" marginTop="giant">
		<Avatar src={identityState.user?.avatarURL || ""} size="xgiant" />
		<span
			style="font-size: {token.global.font.size.xlarge}; font-weight: {token.global.font.weight
				.medium}">
			{identityState.user?.displayName}
		</span>
		<span>@{identityState.user?.username}</span>
		{#if appState.isMobile}
			<Flex
				direction="column"
				justifyContent="start"
				alignItems="center"
				marginTop="large"
				height="fit-content"
				gap="large">
				<Flex direction="column" alignItems="center" gap="small">
					<HorizontalCard
						title={m.page_dashboard_card_home_title()}
						icon="home"
						href="https://home.davidnet.net"
						description={m.page_dashboard_card_home_desc_short()} />
					<HorizontalCard
						title={m.page_dashboard_card_profile_title()}
						icon="person"
						href="/profile/{identityState.user?.userID}"
						description={m.page_dashboard_card_profile_desc()} />
					<HorizontalCard
						title={m.page_dashboard_card_help_title()}
						icon="contact_support"
						href="https://davidnet.net/help"
						description={m.page_dashboard_card_help_desc_short()} />
				</Flex>
				<Flex direction="column" alignItems="center" gap="small">
					<HorizontalCard
						title={m.page_dashboard_card_security_title()}
						icon="shield_locked"
						href="/manage/security"
						description={m.page_dashboard_card_security_desc()} />
					<HorizontalCard
						title={m.page_dashboard_card_preferences_title()}
						icon="settings"
						href="/manage/preferences"
						description={m.page_dashboard_card_preferences_desc()} />
					<HorizontalCard
						title={m.page_dashboard_card_privacy_title()}
						icon="privacy_tip"
						href="/manage/data"
						description={m.page_dashboard_card_privacy_desc()} />
				</Flex>
			</Flex>
		{:else}
			<Flex
				direction="column"
				alignItems="center"
				height="fit-content"
				gap="none"
				marginTop="giant">
				<Flex direction="row" justifyContent="center" alignItems="start" gap="small">
					<Card
						title={m.page_dashboard_card_home_title()}
						icon="home"
						href="https://home.davidnet.net"
						description={m.page_dashboard_card_home_desc_long()} />
					<Card
						title={m.page_dashboard_card_profile_title()}
						icon="person"
						href="/profile/{identityState.user?.userID}"
						description={m.page_dashboard_card_profile_desc()} />
					<Card
						title={m.page_dashboard_card_help_title()}
						icon="contact_support"
						href="https://davidnet.net/help"
						description={m.page_dashboard_card_help_desc_long()} />
				</Flex>
				<Flex
					direction="row"
					justifyContent="center"
					alignItems="start"
					marginTop="large"
					gap="small">
					<Card
						title={m.page_dashboard_card_security_title()}
						icon="shield_locked"
						href="/manage/security"
						description={m.page_dashboard_card_security_desc()} />
					<Card
						title={m.page_dashboard_card_preferences_title()}
						icon="settings"
						href="/manage/preferences"
						description={m.page_dashboard_card_preferences_desc()} />
					<Card
						title={m.page_dashboard_card_privacy_title()}
						icon="privacy_tip"
						href="/manage/data"
						description={m.page_dashboard_card_privacy_desc()} />
				</Flex>
			</Flex>
		{/if}
	</Flex>
{:else}
	<Flex
		alignItems="center"
		justifyContent="start"
		direction="column"
		gap="medium"
		marginTop="giant">
		<Skeleton
			height={token.global.font.size.xgiant}
			width={token.global.font.size.xgiant}
			radius="full" />
		<Skeleton width="8rem" height={token.global.font.size.xlarge} />
		<Skeleton width="8rem" height={token.global.font.size.xlarge} />
		{#if appState.isMobile}
			<Flex
				direction="column"
				justifyContent="start"
				alignItems="center"
				marginTop="large"
				height="fit-content"
				gap="large">
				<Flex direction="column" alignItems="center" gap="small">
					<Skeleton width="18rem" height="4rem" radius="huge" />
					<Skeleton width="18rem" height="4rem" radius="huge" />
					<Skeleton width="18rem" height="4rem" radius="huge" />
				</Flex>
				<Flex direction="column" alignItems="center" gap="small">
					<Skeleton width="18rem" height="4rem" radius="huge" />
					<Skeleton width="18rem" height="4rem" radius="huge" />
					<Skeleton width="18rem" height="4rem" radius="huge" />
				</Flex>
			</Flex>
		{:else}
			<Flex
				direction="column"
				alignItems="center"
				height="fit-content"
				gap="none"
				marginTop="giant">
				<Flex direction="row" justifyContent="center" alignItems="start" gap="small">
					<Skeleton width="14rem" height="20rem" radius="huge" />
					<Skeleton width="14rem" height="20rem" radius="huge" />
					<Skeleton width="14rem" height="20rem" radius="huge" />
				</Flex>
				<Flex
					direction="row"
					justifyContent="center"
					alignItems="start"
					marginTop="large"
					gap="small">
					<Skeleton width="14rem" height="20rem" radius="huge" />
					<Skeleton width="14rem" height="20rem" radius="huge" />
					<Skeleton width="14rem" height="20rem" radius="huge" />
				</Flex>
			</Flex>
		{/if}
	</Flex>
{/if}
