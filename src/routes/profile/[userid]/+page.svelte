<script lang="ts">
	import {
		authState,
		Avatar,
		Flex,
		getFetch,
		Lozenge,
		Icon,
		Skeleton,
		whenAuthReady,
		identityState,
		LinkButton,
		navigateBack,
		Button
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
	}

	import * as styles from "./page.css";

	let profileResponse: undefined | ProfileResponse = $state(undefined);
	$effect(() => {
		(async () => {
			await whenAuthReady();

			const result = await getFetch(
				PUBLIC_BACKEND_URL + "/auth/profile",
				{ user: params.userid },
				undefined,
				authState.isLoggedIn
			);

			if (result.success) {
				profileResponse = result.profileResponse;
			} else {
				// TODO SHOW ERROR TOAST
			}
		})();
	});
</script>

<Flex
	alignItems="center"
	justifyContent="start"
	direction="column"
	gap="medium"
	height="fit-content"
	marginTop="giant"
	width="100%">
	{#if !profileResponse}
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
		<div class={styles.profileBanner} style="background-image: url({profileResponse.bannerUrl})">
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
					.medium}">
				{profileResponse.displayName}
			</span>
			<span style="opacity: 0.7;">@{profileResponse.username}</span>
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
						<span>{profileResponse.email}</span>
					</Flex>
				</Lozenge>
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
			<div style="max-width: 36rem; text-align: center; ">
				<p style="white-space: pre-wrap">{profileResponse.description}</p>
			</div>
		{/if}

		<Flex gap="small" width="fit-content">
			<Button
				iconbefore="arrow_back"
				onclick={() => {
					navigateBack();
				}}>
				Back
			</Button>
			{#if params.userid === identityState.user?.userID}
				<LinkButton href="/profile/edit">Edit profile</LinkButton>
			{:else}
				<LinkButton href="/profile/edit">Edit your own profile</LinkButton>
			{/if}
		</Flex>
	{/if}
</Flex>
