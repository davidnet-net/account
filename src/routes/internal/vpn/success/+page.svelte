<script lang="ts">
	import { Flex, Icon, LinkButton } from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";
</script>

<Flex justifyContent="center" alignItems="center" direction="column" gap="medium">
	<Icon icon="celebration" color="success" size="giant" />
	<h1>Succesfully connected!</h1>
	<p style="color: {token.theme.color.text.secondary};">
		Jumped successfully from https://test-connection.davidnet.internal
	</p>
	<Flex height="fit-content" gap="small" width="fit-content">
		<LinkButton href="https://test-connection.davidnet.internal">Try again</LinkButton>
		<LinkButton href="https://home.davidnet.net">Home</LinkButton>
	</Flex>
</Flex>
