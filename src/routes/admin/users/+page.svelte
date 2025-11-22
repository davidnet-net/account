<script lang="ts">
	import { Button, FlexWrapper, LinkButton, Space } from "@davidnet/svelte-ui";

</script>
<Space height="var(--token-space-4)" />
<FlexWrapper width="100%" justifycontent="space-around" direction="row">
	<LinkButton href="/admin">Admin</LinkButton>
	<Button
		onClick={() => {
			history.back();
		}}
		iconbefore="arrow_back">Back</Button
	>

	<LinkButton href="/logout" iconafter="logout">Log out</LinkButton>
</FlexWrapper>
<Space height="var(--token-space-4)" />