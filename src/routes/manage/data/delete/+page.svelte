<script lang="ts">
	import {
		appState,
		authState,
		Button,
		currentTheme,
		Dropdown,
		Flex,
		getCookie,
		getDateFormat,
		getFetch,
		getFirstDayOfWeek,
		getTimezone,
		Icon,
		LANGUAGE_CACHE_KEY,
		LinkButton,
		navigateBack,
		patchFetch,
		setDateFormat,
		setFirstDayOfWeek,
		setLanguage,
		setTheme,
		setTimezone,
		type themeNames,
		whenAuthReady
	} from "@davidnet-net/svelte-ui";
	import { onMount } from "svelte";

	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	import Card from "$lib/components/Card/Card.svelte";
	import HorizontalCard from "$lib/components/HorizontalCard/HorizontalCard.svelte";

	import * as styles from "./page.css";

	$effect(() => {
		(async () => {
			await whenAuthReady();
			if (!authState.isLoggedIn && !authState.loading) {
				goto(`/login?continue=${encodeURIComponent(page.url.href)}`);
			}
		})();
	});
</script>

<div class={styles.page}>
	<div class={styles.card}>
		<h1 class={styles.title}>Data deletion</h1>
		<p class={styles.subtitle}>You can delete your account and correlating data here.</p>

		<Flex gap="medium" direction="column" alignItems="center" marginTop="medium" width="100%">
			<Icon icon="delete_forever" size="giant" color="danger" />
			<p>A issue occured on our side. Please contact us.</p>
		</Flex>

		<div class={styles.cardActions}>
			<LinkButton href="/">My account</LinkButton>
			<Button
				iconbefore="arrow_back"
				onclick={() => {
					navigateBack();
				}}>
				Back
			</Button>
		</div>
	</div>
</div>
