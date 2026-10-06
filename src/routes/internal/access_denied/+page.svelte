<script lang="ts">
	import { appState, authState, Button, Icon, LinkButton } from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	import { styles } from "./page.css";
	import * as m from "$lib/paraglide/messages.js";

	appState.hideNavigation = true;
</script>

<svelte:head>
	<title>Davidnet</title>
</svelte:head>

<div class={styles.pageContainer}>
	<div class={styles.backgroundContainer}>
		<div class={styles.background}>
			<div class={styles.iconBackground}>
				<Icon icon="hand_gesture_off" size="inherit" color="danger" />
			</div>
			{#if !appState.isMobile}
				<h1 class={styles.errorHeader}>{m.page_access_denied_heading()}</h1>
			{/if}
		</div>
	</div>
	{#if appState.isMobile}
		<h1
			style="transform: translateY(-6vw); padding-bottom: {token.global.spacing.large};"
			class={styles.errorHeader}>
			{m.page_access_denied_heading()}
		</h1>
	{/if}
	<div class={styles.buttonContainer}>
		<Button appearance="primary" iconbefore="arrow_back" onclick={() => history.back()}>
			{m.common_back()}
		</Button>
		<LinkButton href="https://account.davidnet.net/internal/access"
			>{m.page_access_denied_review_link()}</LinkButton>
		<LinkButton href="/">{m.common_my_account()}</LinkButton>
	</div>
</div>
