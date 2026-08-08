<script lang="ts">
	import { appState, Button, Icon, LinkButton } from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	import { styles } from "./page.css";
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
				<h1 class={styles.errorHeader}>Access denied</h1>
			{/if}
		</div>
	</div>
	{#if appState.isMobile}
		<h1
			style="transform: translateY(-6vw); padding-bottom: {token.global.spacing.large};"
			class={styles.errorHeader}>
			Access denied
		</h1>
	{/if}
	<div class={styles.buttonContainer}>
		<Button appearance="primary" iconbefore="arrow_back" onclick={() => history.back()}>
			Back
		</Button>
		<LinkButton href="https://account.davidnet.net/manage/data/internal">
			Your access information
		</LinkButton>
		<LinkButton href="/">My account</LinkButton>
	</div>
</div>
