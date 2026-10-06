<script lang="ts">
	import {
		Anchor,
		authState,
		Button,
		Field,
		Flex,
		Form,
		getFetch,
		Icon,
		IconButton,
		LinkButton,
		navigateBack,
		postFetch,
		Skeleton,
		sleep,
		TextField,
		whenAuthReady
	} from "@davidnet-net/svelte-ui";

	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	import { m } from "$lib/paraglide/messages";

	import * as styles from "./page.css";

	let loading = $state(false);
	import QRCode from "@castlenine/svelte-qrcode";

	import TOTPInput from "$lib/components/TOTPInput/TOTPInput.svelte";
	let alreadySetup = $state(false);
	let otpUri = $state("");

	$effect(() => {
		(async () => {
			await whenAuthReady();
			if (!authState.isLoggedIn && !authState.loading) {
				goto(`/login?continue=${encodeURIComponent(page.url.href)}`);
			}

			const result = await getFetch(
				PUBLIC_BACKEND_URL + "/auth/security/authenticater-setup",
				undefined,
				undefined,
				true
			);

			if (result.code === "AUTHENTICATOR_ALREADY_ENABLED") {
				alreadySetup = true;
				return;
			}
			if (!result.success) {
				return;
			}

			otpUri = result.otpUri;
		})();
	});

	let copied = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout>;

	function handleCopy(event: MouseEvent) {
		event.preventDefault();
		navigator.clipboard
			.writeText(otpUri)
			.then(() => {
				copied = true;
				clearTimeout(copyTimeout);
				copyTimeout = setTimeout(() => {
					copied = false;
				}, 2000);
			})
			.catch((err) => {
				console.error("[CodeSnippet]: Failed to copy code", err);
			});
	}

	let codeinputted = $state("");
	let invalidCode = $state(false);
	let validCode = $state(false);
	let showfinish = $state(false);
	async function checkcode() {
		loading = true;
		if (codeinputted.length !== 6) {
			loading = false;
			return;
		}

		const result = await postFetch(
			PUBLIC_BACKEND_URL + "/auth/security/authenticator-enable",
			{ code: codeinputted },
			undefined,
			true
		);

		if (result.code === "INVALID_CODE") {
			loading = false;
			invalidCode = true;
			return;
		}
		if (!result.success) {
			loading = false;
			invalidCode = false;
			return;
		}
		if (result.code === "AUTHENTICATOR_ENABLED") {
			validCode = true;
			await sleep(1000);
			showfinish = true;
		}
	}
</script>

<div class={styles.page}>
	<div class={styles.card}>
		<h1 class={styles.title}>{m.page_authenticator_heading()}</h1>
		{#if alreadySetup}
			<div>
				<span class={styles.subtitle}>
					{m.page_authenticator_already_setup()}
				</span>
				<br />
				<br />
				<LinkButton href="/manage/security/2fa">{m.page_authenticator_2fa_page_link()}</LinkButton>
			</div>
		{:else if showfinish}
			<Flex direction="column" marginBottom="medium">
				<span class={styles.subtitle}>{m.page_authenticator_setup_success()}</span>
				<Icon icon="verified" color="success" size="giant" />
			</Flex>
			<LinkButton href="/manage/security/2fa">{m.page_security_2fa_manage_link()}</LinkButton>
		{:else}
			<div>
				<span class={styles.subtitle}>
					{m.page_authenticator_intro()}
				</span>
				<Flex direction="column" gap="medium" marginTop="medium" width="100%">
					{#if !otpUri}
						<Skeleton width="16rem" height="16rem" radius="huge" />
						<Skeleton height="2rem" />
					{:else}
						<div style="height: 16rem; width: 16rem;">
							<QRCode data={otpUri} haveBackgroundRoundedEdges shape="square" isResponsive />
						</div>
						<Button
							iconbefore={copied ? "check" : "content_copy"}
							onclick={handleCopy}
							appearance="subtle">
							{copied ? m.page_authenticator_copied() : m.page_authenticator_copy_otp()}
						</Button>
						<span><b>{m.page_authenticator_enter_code()}</b></span>
						<div style="margin-left: 4.5rem">
							<TOTPInput
								invalid={invalidCode}
								valid={validCode}
								bind:value={codeinputted}
								onsubmit={checkcode}
								disabled={loading} />
						</div>
					{/if}
				</Flex>
			</div>
		{/if}
		<Flex direction="column" gap="medium" marginTop="medium" width="100%">
			<div class={styles.cardActions}>
				<LinkButton href="/manage/security">{m.page_security_heading()}</LinkButton>
				<Button
					iconbefore="arrow_back"
					onclick={() => {
						navigateBack();
					}}>
					{m.common_back()}
				</Button>
			</div>
		</Flex>
	</div>
</div>
