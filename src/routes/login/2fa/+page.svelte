<script lang="ts">
	import {
		Button,
		Field,
		Flex,
		Form,
		Link,
		LinkButton,
		TextField,
		authBeat,
		postFetch
	} from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	import DNLogo from "$lib/assets/DNLogo.png";
	import TOTPInput from "$lib/components/TOTPInput/TOTPInput.svelte";

	import * as styles from "./page.css";

	let loading = $state(false);
	let invalidCode = $state(false);
	let codeinputted = $state("");
	let validCode = $state(false);

	const mfaToken = page.url.searchParams.get("mfaToken") || "";
	const continueParam = decodeURIComponent(page.url.searchParams.get("continue") || "");

	function getSafeRedirectUrl(targetUrl: string) {
		if (!targetUrl) return "/";

		try {
			const parsed = new URL(targetUrl, window.location.origin);
			const hostname = parsed.hostname;

			if (hostname === "localhost" || hostname === "127.0.0.1") {
				return import.meta.env.DEV ? parsed.href : "/";
			}

			const allowedDomains = ["davidnet.net", "davidnet.internal"];
			const isAllowedDomain = allowedDomains.some(
				(domain) => hostname === domain || hostname.endsWith(`.${domain}`)
			);

			if (isAllowedDomain) {
				return parsed.href;
			}
		} catch {
			return "/";
		}

		return "/";
	}

	async function checkcode() {
		if (!codeinputted || codeinputted.length < 6) {
			invalidCode = true;
			return;
		}

		if (!mfaToken) {
			invalidCode = true;
			return;
		}

		loading = true;
		invalidCode = false;

		const result = await postFetch(PUBLIC_BACKEND_URL + "/auth/login/verify-2fa", {
			mfaToken,
			code: codeinputted
		});

		if (!result.success) {
			loading = false;
			invalidCode = true;
			validCode = false;
			codeinputted = "";
			return;
		}

		validCode = true;

		try {
			await authBeat();
		} catch {
			console.warn("Auth beat failed");
		}

		const continueURL = getSafeRedirectUrl(continueParam);
		try {
			const parsedUrl = new URL(continueURL, window.location.href);

			if (parsedUrl.origin !== window.location.origin) {
				window.location.href = continueURL;
			} else {
				goto(continueURL);
			}
		} catch {
			goto(continueURL);
		}
	}
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
			<h1>Enter your TOTP code</h1>
			<p style:color={token.theme.color.text.secondary}>This step keeps your account safer.</p>
		</Flex>
		<div style="margin-left: 9rem">
			<TOTPInput
				invalid={invalidCode}
				valid={validCode}
				bind:value={codeinputted}
				onsubmit={checkcode}
				disabled={loading} />
		</div>

		<Flex marginTop="large" width="100%" alignItems="center" direction="column" gap="small">
			<LinkButton
				disabled={loading}
				href="/login/2fa/recoverycode{mfaToken
					? `?mfaToken=${encodeURIComponent(mfaToken)}`
					: ''}{continueParam ? `&continue=${encodeURIComponent(continueParam)}` : ''}">
				Login with recovery code instead
			</LinkButton>
		</Flex>
	</div>
</div>
