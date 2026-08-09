<script lang="ts">
	import { Button, Flex, Icon, Link, postFetch, Spinner } from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";
	import { onMount } from "svelte";

	import { page } from "$app/state";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	import DNLogo from "$lib/assets/DNLogo.png";
	import { m } from "$lib/paraglide/messages";

	import * as styles from "./page.css";
	let status = $state("loading");

	onMount(async () => {
		interface Result {
			success: boolean;
			code: string;
		}
		const result: Result = await postFetch(PUBLIC_BACKEND_URL + "/auth/signup/verify-email", {
			emailVerificationToken: page.params.token
		});

		if (result.success) {
			status = "success";
			return;
		}

		if (result.code === "EMAIL_VERIFICATION_TOKEN_INVALID") {
			status = "invalid";
			return;
		}

		status = "?";

		console.error(result);
	});
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
		{#if status === "success"}
			<Flex
				justifyContent="center"
				alignItems="center"
				height="fit-content"
				width="fit-content"
				text="center"
				marginBottom="large"
				direction="column">
				<h1>{m.page_verify_email_confirm_email_verification()}</h1>
				<p style:color={token.theme.color.text.secondary}>
					{m.page_verify_email_confirm_email_verified()}
				</p>
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
		{:else if status === "invalid"}
			<Flex
				justifyContent="center"
				alignItems="center"
				height="fit-content"
				width="fit-content"
				text="center"
				marginBottom="large"
				direction="column">
				<h1>Email verification</h1>
				<p style:color={token.theme.color.text.secondary}>Email not verified</p>
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
				<Icon icon="crisis_alert" size="giant" color="danger" />
				<p style="font-size: {token.global.font.size.large};">
					Email not verified. <br />
				</p>
				<p style="font-size: {token.global.font.size.medium};">
					Link or Account expired or never existed.
				</p>
				Unverified accounts get deleted after 24 hours. However you can <Link href="/signup">
					signup
				</Link> again!
			</Flex>
		{:else if status === "loading"}
			<Flex
				justifyContent="center"
				alignItems="center"
				height="fit-content"
				width="fit-content"
				text="center"
				marginBottom="large"
				direction="column">
				<h1>Email verification</h1>
			</Flex>
			<Flex
				justifyContent="center"
				alignItems="center"
				height="100%"
				width="fit-content"
				text="center"
				marginBottom="large"
				direction="column">
				<Spinner size="large" />
			</Flex>
		{:else}
			<Flex
				justifyContent="center"
				alignItems="center"
				height="fit-content"
				width="fit-content"
				text="center"
				marginBottom="large"
				direction="column">
				<h1>Email verification</h1>
				<p style:color={token.theme.color.text.secondary}>Email not verified</p>
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
				<Icon icon="crisis_alert" size="giant" color="danger" />
				<p style="font-size: {token.global.font.size.large};">
					Email not verified. <br />
				</p>
				<p style="font-size: {token.global.font.size.medium};">Unknown error</p>
			</Flex>
		{/if}
	</div>
</div>
