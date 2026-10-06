<script lang="ts">
	import { Button, Field, Flex, Form, Link, TextField } from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	import DNLogo from "$lib/assets/DNLogo.png";
	import HorizontalCard from "$lib/components/HorizontalCard/HorizontalCard.svelte";
	import * as m from "$lib/paraglide/messages.js";

	import * as styles from "./page.css";
</script>

<div class={styles.background}>
	<div class={styles.container}>
		<div class={styles.brand}>
			<a style="display: inline-flex;" href="https://davidnet.net">
				<img src={DNLogo} style="height: 3rem; width: auto;" aria-hidden="true" alt="" />
			</a>
			<span style="color: red;">David</span>
			<span style="color: blue;">net</span>
		</div>
		<Flex
			justifyContent="center"
			alignItems="center"
			height="fit-content"
			width="fit-content"
			text="center"
			marginBottom="large"
			direction="column">
			<h1>{m.page_login_account_recovery_link()}</h1>
			<p style:color={token.theme.color.text.secondary}>{m.page_recovery_subheading()}</p>
			<Flex marginTop="medium" gap="medium" direction="column" width="100%">
				<HorizontalCard
					title={m.page_recovery_card_password_title()}
					icon="password"
					href="/recovery/password"
					description={m.page_recovery_card_password_desc()} />
				<HorizontalCard
					title={m.page_recovery_card_support_title()}
					icon="contact_support"
					description=""
					href="https://davidnet.net/help" />
			</Flex>
		</Flex>
		<Flex marginTop="large" width="100%" alignItems="center" direction="column" gap="small">
			<Link href="https://davidnet.net/help">{m.common_Help()}</Link>
			<Link href="/login ">{m.page_recovery_login_link()}</Link>
		</Flex>
	</div>
</div>
