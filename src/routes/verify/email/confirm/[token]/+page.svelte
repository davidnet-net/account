<script lang="ts">
	import { Button, Flex, Icon } from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	import DNLogo from "$lib/assets/DNLogo.png";

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
			<h1>Email verification</h1>
			<p style:color={token.theme.color.text.secondary}>Email verified</p>
		</Flex>
		<Flex
			justifyContent="center"
			alignItems="center"
			height="fit-content"
			width="fit-content"
			text="center"
			marginBottom="large"
			gap="small"
			direction="column">
			<Icon icon="mark_email_read" size="giant" color="success" />
			<p style="font-size: {token.global.font.size.large};">
				Email verified. <br />
				You can now close this page.
			</p>
		</Flex>
		<Button
			appearance="primary"
			onclick={() => {
				window.close();
			}}>
			Close page
		</Button>
	</div>
</div>
