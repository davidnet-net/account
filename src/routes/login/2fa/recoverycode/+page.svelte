<script lang="ts">
	import {
		authBeat,
		Button,
		Field,
		Flex,
		Form,
		Link,
		LinkButton,
		postFetch,
		TextField	} from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	import DNLogo from "$lib/assets/DNLogo.png";

	import * as styles from "./page.css";
	import * as m from "$lib/paraglide/messages.js";

	let loading = $state(false);

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

	let invalidCode: undefined | string = $state(undefined);
	let code = $state("");

	async function checkcode() {
		if (!code.trim()) {
			invalidCode = m.page_recoverycode_error_empty();
			return;
		}

		if (!mfaToken) {
			invalidCode = m.page_recoverycode_error_missing_token();
			return;
		}

		loading = true;
		invalidCode = undefined;

		try {
			const result = await postFetch(
				PUBLIC_BACKEND_URL + "/auth/login/verify-recovery-code",
				{
					mfaToken,
					code: code.trim()
				},
				undefined,
				false
			);

			if (result.success && result.code === "LOGIN_COMPLETE") {
				await authBeat();

				const safeUrl = getSafeRedirectUrl(continueParam);

				try {
					const parsedUrl = new URL(safeUrl, window.location.href);
					if (parsedUrl.origin !== window.location.origin) {
						window.location.href = safeUrl;
					} else {
						goto(safeUrl);
					}
				} catch {
					goto(safeUrl);
				}
			} else {
				if (result.code === "INVALID_RECOVERY_CODE") {
					invalidCode = m.page_recoverycode_error_invalid();
				} else if (result.code === "INVALID_OR_EXPIRED_MFA_TOKEN") {
					invalidCode = m.page_recoverycode_error_session_expired();
				} else {
					invalidCode = result.message || m.page_recoverycode_error_failed();
				}
			}
		} catch (e) {
			invalidCode = m.page_recoverycode_error_unexpected();
		} finally {
			loading = false;
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
			<h1>{m.page_recoverycode_heading()}</h1>
			<p style:color={token.theme.color.text.secondary}>
				{m.page_recoverycode_subheading()}
			</p>
		</Flex>
		<Form id="recoverycode-form" onsubmit={checkcode}>
			<Field required label={m.page_recoverycode_label()} name="code" invalid={invalidCode}>
				<TextField
					placeholder={m.page_recoverycode_placeholder()}
					bind:value={code}
					oninput={() => (invalidCode = undefined)}
					disabled={loading} />
			</Field>
			<Button form="recoverycode-form" type="submit" appearance="primary" {loading}
				>{m.common_Login()}</Button>
		</Form>
		<Flex marginTop="large" width="100%" alignItems="center" direction="column" gap="small">
			<LinkButton
				disabled={loading}
				href="/login/2fa{mfaToken ? `?mfaToken=${encodeURIComponent(mfaToken)}` : ''}{continueParam
					? `&continue=${encodeURIComponent(continueParam)}`
					: ''}">
				{m.page_recoverycode_other_methods()}
			</LinkButton>
		</Flex>
	</div>
</div>
