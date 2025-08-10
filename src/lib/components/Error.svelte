<script lang="ts">
	import { FlexWrapper, Icon, Space, Button } from "@davidnet/svelte-ui";

	export let correlationID = "Unknown";
	export let pageName = "Unknown";
</script>

<h1 style="text-align: center; font-size: 1.8rem;">{pageName}</h1>
<FlexWrapper height="100%" width="100%">
	<Icon icon="crisis_alert" size="100px;" color="var(--token-color-text-warning)" />
	<h1 style="text-align: center;">Error</h1>
	<p style="font-weight: bold;">CorrelationID:</p>
	<span style="text-align:center; font-size: 0.9rem">{correlationID}</span>
	<Space height="var(--token-space-6)" />
	<Button
		appearance="primary"
		onClick={() => {
			window.location.reload();
		}}>Reset</Button
	>
	<Space height="var(--token-space-2)" />
	<Button
		onClick={() => {
			history.back();
		}}>Back</Button
	>
</FlexWrapper>
