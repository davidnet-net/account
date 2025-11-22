<script lang="ts">
	import { Button, FlexWrapper, LinkButton, Space, Icon } from "@davidnet/svelte-ui";
	import { page } from "$app/state";

	const statusCode = page.status;
	const statusMessage = page.error?.message;
</script>

<FlexWrapper height="100%" width="100%">
	<Icon icon="crisis_alert" size="100px;" color="var(--token-color-text-warning)" />
	<h1 style="text-align:center;">Error <span style="color: var(--token-color-text-danger)">{statusCode}</span></h1>
	<p style="font-weight: bold;">Description</p>
	<span style="text-align:center; font-size: 0.9rem">{statusMessage}.</span>
	<Space height="var(--token-space-6)" />
	<LinkButton appearance="primary" href="/">My Account</LinkButton>
	<Space height="var(--token-space-2)" />
	<Button
		onClick={() => {
			history.back();
		}}>Back</Button
	>
</FlexWrapper>

<style>
	h1 {
		font-size: 50px;
	}
</style>
