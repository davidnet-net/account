<script lang="ts">
	import Card from "$lib/components/Card/Card.svelte";
	import { goto } from "$app/navigation";
	import {
		appState,
		authState,
		Avatar,
		Flex,
		identityState,
		TextField,
		whenAuthReady
	} from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";
	import { onMount } from "svelte";
	import HorizontalCard from "$lib/components/HorizontalCard/HorizontalCard.svelte";

	onMount(() => {
		async () => {
			await whenAuthReady();
			if (!authState.isLoggedIn) {
				goto("/login");
			}
		};
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
						title="Home"
						icon="home"
						href="https://home.davidnet.net"
						description="Go to Davidnet home." />
					<HorizontalCard
						title="Profile"
						icon="person"
						href="#"
						description="View or edit your profile." />
					<HorizontalCard
						title="Help center"
						icon="contact_support"
						href="https://davidnet.net/help"
						description="Help pages and your tickets." />
				</Flex>
				<Flex direction="column" alignItems="center" gap="small">
					<HorizontalCard
						title="Security"
						icon="shield_locked"
						href="https://home.davidnet.net"
						description="Account access and more." />
					<HorizontalCard
						title="Preferences"
						icon="settings"
						href="#"
						description="Themes and languages." />
					<HorizontalCard
						title="Privacy and data"
						icon="privacy_tip"
						href="#"
						description="Manage your information." />
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
						title="Home"
						icon="home"
						href="https://home.davidnet.net"
						description="Go to Davidnet home. One overview for everything." />
					<Card title="Profile" icon="person" href="#" description="View or edit your profile." />
					<Card
						title="Help center"
						icon="contact_support"
						href="#"
						description="Help pages, view your tickets and contact us." />
				</Flex>
				<Flex
					direction="row"
					justifyContent="center"
					alignItems="start"
					marginTop="large"
					gap="small">
					<Card
						title="Security"
						icon="shield_locked"
						href="https://home.davidnet.net"
						description="Account access and more." />
					<Card title="Preferences" icon="settings" href="#" description="Themes and languages." />
					<Card
						title="Privacy and data"
						icon="privacy_tip"
						href="#"
						description="Manage your information." />
				</Flex>
			</Flex>
		{/if}
	</Flex>
{:else}{/if}
