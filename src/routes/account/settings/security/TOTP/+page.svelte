<script lang="ts">
	import { onMount } from "svelte";
	import Error from "$lib/components/Error.svelte";
	import QRCode from "qrcode";
	import { toast, FlexWrapper, Button, Space, CodeBlock, LinkButton, wait, authFetch, getSessionInfo, refreshAccessToken  } from "@davidnet/svelte-ui";
	import TOTP from "$lib/components/TOTP.svelte";
	import { authapiurl } from "$lib/config";
	import type { SessionInfo } from "$lib/types";
	import { TOTP as TOTPClass, Secret } from "otpauth";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { goto } from "$app/navigation";

	let correlationID = crypto.randomUUID();
	let sessionInfo: SessionInfo | null = null;
	let loading = true;
	let error = false;
	let errorMSG = "";
	let settingUpTOTP = false;
	let showadvanced = false;

	let totpSecret: string = "";
	let totpCode: string = "";
	let totpInvalid = false;
	let qrDataUrl = "";
	let otpauthUrl = "";

	function generateSecretBase32(length = 32): string {
		const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
		const values = crypto.getRandomValues(new Uint8Array(length));
		return [...values].map((v) => charset[v % charset.length]).join("");
	}

	onMount(async () => {
		refreshAccessToken(correlationID, false, true);
		sessionInfo = await getSessionInfo(correlationID);
		if (!sessionInfo) {
			errorMSG = "Session Invalid";
			error = true;
		} else {
			totpSecret = generateSecretBase32();
			const secretObj = Secret.fromBase32(totpSecret);
			const totp = new TOTPClass({
				issuer: "Davidnet",
				label: sessionInfo.username,
				algorithm: "SHA1",
				digits: 6,
				period: 30,
				secret: secretObj
			});
			otpauthUrl = totp.toString();
			qrDataUrl = await QRCode.toDataURL(otpauthUrl);
		}
		loading = false;
	});

	async function trySetup(code: string) {
		if (!sessionInfo) return;
		const secretObj = Secret.fromBase32(totpSecret);
		const totp = new TOTPClass({
			issuer: "Davidnet",
			label: sessionInfo.username,
			algorithm: "SHA1",
			digits: 6,
			period: 30,
			secret: secretObj
		});

		const isValid = totp.validate({ token: code }) !== null;
		if (!isValid) {
			totpInvalid = true;
			return;
		}

		settingUpTOTP = true;
		totpInvalid = false;
		try {
			const res = await authFetch(`${authapiurl}settings/security/twofa/totp/`, correlationID, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ twofa_totp_enabled: 1, seed: totpSecret })
			});

			if (!res.ok) {
				errorMSG = "Failed to enable TOTP!";
				error = true;
				return;
			}

			toast({
				title: "TOTP Enabled!",
				desc: "Your account is now more secure.",
				icon: "fingerprint",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 5000
			});

			await wait(2000);
			goto("/account/settings/security/");
		} catch (e) {
			errorMSG = String(e);
			error = true;
		}
	}
</script>

{#if error}
	<Error pageName="Security" {errorMSG} {correlationID} />
{:else if loading}
	<h1>Security</h1>
	<ProfileLoader />
{:else if settingUpTOTP}
	<h1 style="text-align: center;">Security</h1>
	<ProfileLoader />

	<span style="text-align: center; color: var(--token-color-text-default-tertiary);"
		>Make sure to generate recovery codes. And keep access to your authencator.</span
	>
{:else}
	<FlexWrapper width="100%" justifycontent="space-around" direction="row">
		<Button onClick={() => history.back()} iconbefore="arrow_back">Back</Button>
		<LinkButton href="/account/settings/security">Cancel</LinkButton>
	</FlexWrapper>

	<FlexWrapper width="100%" height="100%">
		<h1>TOTP Setup</h1>

		<p style="text-align: center;">Scan this QR code in your authenticator app:</p>
		{#if qrDataUrl}
			<img style="border-radius: 1rem;" src={qrDataUrl} alt="TOTP QR Code" />
		{/if}

		<Space height="var(--token-space-6)" />

		<TOTP bind:value={totpCode} invalid={totpInvalid} onComplete={trySetup} label="Enter TOTP code" />
		<Space height="var(--token-space-3)" />
		{#if showadvanced}
			<p style="text-align: center;">Secret:</p>
			<CodeBlock code={totpSecret} language="plaintext" />

			<p style="text-align: center;">URL:</p>
			<CodeBlock code={otpauthUrl} language="plaintext" />
		{/if}
		<Space height="var(--token-space-3)" />
		<Button onClick={() => (showadvanced = !showadvanced)}>{showadvanced ? "Hide advanced" : "Show advanced"}</Button>
	</FlexWrapper>
{/if}
