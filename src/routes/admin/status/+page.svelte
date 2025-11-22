<script lang="ts">
	import { FlexWrapper, Space, Icon, LinkButton, Button, metadata } from "@davidnet/svelte-ui";
</script>

<Space height="var(--token-space-4)" />
<FlexWrapper width="100%" justifycontent="flex-end" direction="row">
	<Button
		onClick={() => {
			history.back();
		}}
		iconbefore="arrow_back">Back</Button
	>

	<LinkButton href="/logout" iconafter="logout">Log out</LinkButton>
</FlexWrapper>
<Space height="var(--token-space-4)" />
<h1>Status</h1>
<Space height="var(--token-space-2)" />
<FlexWrapper direction="column" gap="var(--token-space-4)" width="100%">
	<FlexWrapper direction="row" gap="var(--token-space-6)">
		<div class="info">
			<img src="https://design.davidnet.net/images/logos/svelte-ui.png" alt="svelte-ui logo" aria-hidden="true" />
			<span>{metadata.version} | <a href={metadata.commitUrl}>{metadata.commitHash}</a></span>
		</div>
	</FlexWrapper>
	<FlexWrapper direction="row" gap="var(--token-space-6)">
		<div class="info">
			<Icon icon="identity_platform" />
			<span>Version Unknown</span>
		</div>
	</FlexWrapper>
</FlexWrapper>
<Space height="var(--token-space-2)" />
<p style="text-align: center; color: orange;">TODO: Add account request logs.</p>

<style>

	h1 {
		text-align: center;
		font-size: 1.85rem;
	}

	.info {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-around;
		width: 100%;
		vertical-align: middle;
		height: 30px;
		background-color: var(--token-color-surface-raised-normal);
		padding: var(--token-space-3) var(--token-space-6);
		border-radius: 2rem;
		gap: var(--token-space-3);
		transition:
			transform 0.4s ease,
			box-shadow 0.4s ease;
	}

	.info:hover,
	.info:focus {
		background-color: var(--token-color-surface-raised-hover);
		transform: scale(1.02);
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
	}

	.info > img {
		height: 100%;
		aspect-ratio: 1 / 1;
	}
</style>
