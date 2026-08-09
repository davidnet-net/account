<script lang="ts">
	import { Button, Field, Flex, Form, Link, TextField } from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	import DNLogo from "$lib/assets/DNLogo.png";
	import * as m from "$lib/paraglide/messages.js";

	import * as styles from "./page.css";
	import HorizontalCard from "$lib/components/HorizontalCard/HorizontalCard.svelte";
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
			<h1>Account recovery</h1>
			<p style:color={token.theme.color.text.secondary}>Lets get you back into your account.</p>
			<Flex marginTop="medium" gap="medium" direction="column" width="100%">
				<HorizontalCard
					title="Recover Password"
					icon="password"
					href="/recovery/password"
					description="Reset your password." />
				<HorizontalCard
					title="Contact support"
					icon="contact_support"
					description=""
					href="https://davidnet.net/help" />
			</Flex>
		</Flex>
		<Flex marginTop="large" width="100%" alignItems="center" direction="column" gap="small">
			<Link href="https://davidnet.net/help">Help</Link>
			<Link href="/login ">Login</Link>
		</Flex>
	</div>
</div>
