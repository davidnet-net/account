<script lang="ts">
	import { Flex, Icon, LinkButton } from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";
	import * as m from "$lib/paraglide/messages.js";
</script>

<Flex justifyContent="center" alignItems="center" direction="column" gap="medium">
	<Icon icon="celebration" color="success" size="giant" />
	<h1>{m.page_vpn_success_heading()}</h1>
	<p style="color: {token.theme.color.text.secondary};">
		{m.page_vpn_success_message()}
	</p>
	<Flex height="fit-content" gap="small" width="fit-content">
		<LinkButton href="https://test-connection.davidnet.internal">{m.page_vpn_success_try_again()}</LinkButton>
		<LinkButton href="https://home.davidnet.net">{m.common_home()}</LinkButton>
	</Flex>
</Flex>
