<script lang="ts">
	import { goto } from "$app/navigation";
	import Error from "$lib/components/Error.svelte";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { authapiurl } from "$lib/config";
	import { getSessionInfo, authFetch, refreshAccessToken } from "$lib/session";
	import type { securitydata, SessionInfo } from "$lib/types";
	import { formatDate_PREFERREDTIME, wait } from "$lib/utils/time";
	import { FlexWrapper, Space, LinkButton, Button, Loader, Dropdown, TextField, Modal, toast } from "@davidnet/svelte-ui";
	import { onMount } from "svelte";
	import { jsPDF } from "jspdf";

	let correlationID = crypto.randomUUID();
	let error = false;
	let loading = true;
	let sessionInfo: SessionInfo | null;
	let errorMSG = "Unknown";
	let new_password = "";
	let changepassmodal = false;
	let loadingbtn = false;
	let data: securitydata;

	onMount(async () => {
		refreshAccessToken(correlationID, false, true);
		const si = await getSessionInfo(correlationID);
		sessionInfo = si;

		if (!si) {
			errorMSG = "Session Invalid";
			error = true;
			loading = false;
			return;
		}

		try {
			const res = await authFetch(`${authapiurl}settings/security/load`, correlationID);
			if (!res.ok) throw "something exploded";
			const json: securitydata = await res.json();
			data = json;
		} catch (e) {
			console.error(e);
			errorMSG = String(e);
			error = true;
		}

		loading = false;
	});

	async function toggletotp() {
		if (data.twofa_totp_enabled) {
			data = { ...data, twofa_totp_enabled: 0 };
			toast({
				title: "Disabled TOTP 2FA!",
				desc: "Note: 2FA is more secure.",
				icon: "fingerprint_off",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 5000
			});
		} else {
			goto("/account/settings/security/TOTP");
		}
	}

	async function toggle2faemail() {
		console.log(data.twofa_email_enabled);
		if (data.twofa_email_enabled === 0) {
			const res = await authFetch(`${authapiurl}settings/security/twofa/email`, correlationID, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ twofa_email_enabled: 1 })
			});

			if (!res.ok) {
				errorMSG = "Failed to enable email totp!";
				error = true;
				loadingbtn = false;
				return;
			}
		} else if (data.twofa_email_enabled === 1) {
			const res = await authFetch(`${authapiurl}settings/security/twofa/email`, correlationID, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ twofa_email_enabled: 0 })
			});

			if (!res.ok) {
				errorMSG = "Failed to enable email totp!";
				error = true;
				loadingbtn = false;
				return;
			}
		} else {
			errorMSG = "Failed to toggle email totp!";
			error = true;
			loadingbtn = false;
		}

		if (data.twofa_email_enabled) {
			data = { ...data, twofa_email_enabled: 0 };
			toast({
				title: "Disabled email 2FA!",
				desc: "Note: 2FA is more secure.",
				icon: "fingerprint_off",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 5000
			});
		} else {
			data = { ...data, twofa_email_enabled: 1 };
			toast({
				title: "Enabled email 2FA!",
				desc: "Note: That TOTP is more secure.",
				icon: "fingerprint",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 5000
			});
			toast({
				title: "2FA WARNING!",
				desc: "Make sure that you generate recovery codes. And keep access to your 2FA method.",
				icon: "privacy_tip",
				appearance: "warning",
				position: "bottom-left"
			});
		}
	}

	async function changepassword() {
		if (!sessionInfo) return;
		loadingbtn = true;
		changepassmodal = false;

		try {
			const res = await authFetch(`${authapiurl}settings/security/change_password`, correlationID, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password: new_password })
			});

			if (!res.ok) {
				errorMSG = "Failed to change password!";
				error = true;
				loadingbtn = false;
				return;
			}

			error = false;
			toast({
				title: "Password changed!",
				desc: "Your password has been successfully changed.",
				icon: "password",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 5000
			});
		} catch (e) {
			console.error(e);
			errorMSG = String(e);
			error = true;
		} finally {
			new_password = "";
			await wait(350);
		}
		loadingbtn = false;
	}



	async function DownloadRecoveryKit() {
		//! Proof of concept migrate to server.

		const recovery_codes: string[] = Array.from({ length: 10 }, () => crypto.randomUUID());
		const gendate = await formatDate_PREFERREDTIME((new Date).toISOString(), correlationID);

		const doc = new jsPDF();

		// Title
		doc.setFontSize(20);
		doc.text("Davidnet Recovery Kit", 105, 20, { align: "center" });

		// Generated date
		doc.setFontSize(10);
		doc.text(`Generated: ${gendate}`, 105, 30, { align: "center" });

		// Intro / instructions
		doc.setFontSize(12);
		doc.text(
			"Keep this file in a safe place. \nAnyone with 1 of these codes can access your account.",
			20,
			40,
			{ maxWidth: 170 }
		);

		doc.setFontSize(12);
		doc.setTextColor("red");
		doc.text(
			"Notice: Each code can only be used once! (PROOF OF CONCEPT - DO NOT USE)",
			20,
			60,
			{ maxWidth: 170 }
		);
		doc.setTextColor("black");

		// Recovery codes
		doc.setFontSize(12);
		doc.text("Recovery Codes:", 20, 70);
		recovery_codes.forEach((code: string, i: number) => {
			// Draw a thin rectangle around each code for printer-friendly highlighting
			doc.rect(20, 75 + i * 12, 170, 10);
			doc.text(code, 25, 83 + i * 12);
		});

		// Support info
		doc.text(
			"Questions: contact@davidnet.net",
			20,
			75 + recovery_codes.length * 12 + 20
		);

		doc.text(
			"If you generate an new Recovery Kit, The old one will become invalid this one is: ",
			20,
			75 + recovery_codes.length * 12 + 40,
			{ maxWidth: 170 }
		);
		doc.text(
			"Version: 1",
			20,
			75 + recovery_codes.length * 12 + 45,
			{ maxWidth: 170 }
		);
		// Download the PDF
		doc.save("recovery-kit.pdf");
	}

</script>

{#if error}
	<Error pageName="Security" {errorMSG} {correlationID} />
{:else if loading}
	<h1>Security</h1>
	<ProfileLoader />
{:else}
	<div class="root">
		<Space height="var(--token-space-4)" />
		<FlexWrapper width="100%" justifycontent="space-around" direction="row">
			<Button onClick={() => history.back()} iconbefore="arrow_back">Back</Button>
			<LinkButton href="/logout" iconafter="logout">Log out</LinkButton>
		</FlexWrapper>

		<Space height="var(--token-space-4)" />
		<h1>Security</h1>

		<h2>2FA</h2>

		<FlexWrapper gap="var(--token-space-2)" direction="column">
			<div class="option">
				<FlexWrapper direction="row" justifycontent="flex-start" height="100%" width="100%" gap="var(--token-space-1)">
					2FA - TOTP
					<Space width="var(--token-space-4);" />
					<Button onClick={toggletotp} loading={loadingbtn}>{!data ? "Loading" : data?.twofa_totp_enabled ? "Disable" : "Enable"}</Button>
				</FlexWrapper>
			</div>

			<div class="option">
				<FlexWrapper direction="row" justifycontent="flex-start" height="100%" width="100%" gap="var(--token-space-1)">
					2FA - Email
					<Space width="var(--token-space-4);" />
					<Button onClick={toggle2faemail} loading={loadingbtn}
						>{!data ? "Loading" : data?.twofa_email_enabled ? "Disable" : "Enable"}</Button
					>
				</FlexWrapper>
			</div>
		</FlexWrapper>
		<Space height="var(--token-space-3)" />
		<h2>Password</h2>
		<Space height="var(--token-space-3)" />
		<div class="passwordthingie">
			<TextField
				label="Password"
				type="password"
				placeholder="Enter a password"
				bind:value={new_password}
				required
				invalid={new_password.length < 6 && new_password.length > 0}
				invalidMessage="Password must be at least 6 characters"
			/>
			<Space height="var(--token-space-2)" />
			<FlexWrapper direction="row" justifycontent="flex-end" width="100%">
				<Button
					loading={loadingbtn}
					appearance="primary"
					onClick={() => {
						if (new_password.length > 5) changepassmodal = true;
					}}>Change Password</Button
				>
			</FlexWrapper>
		</div>

		<Space height="var(--token-space-5)" />
		<h2>Recovery Codes</h2>
		<div class="option">
			<FlexWrapper direction="row" justifycontent="flex-start" height="100%" width="100%" gap="var(--token-space-1)">
				Recovery Kit
				<Space width="var(--token-space-4);" />
				<Button appearance="primary" onClick={DownloadRecoveryKit}>Download</Button>
			</FlexWrapper>
		</div>
		
		<Space height="var(--token-space-6)" />
		<p style="color: var(--token-color-text-danger); text-align: center;">You will recieve email on change of these settings!</p>
	</div>
{/if}

{#if changepassmodal}
	<Modal
		title="Change password?"
		titleIcon="password"
		desc="Are you sure you want to change your password?"
		hasCloseBtn
		on:close={() => (changepassmodal = false)}
		options={[
			{
				appearance: "subtle",
				content: "Cancel",
				onClick: () => (changepassmodal = false)
			},
			{ appearance: "danger", content: "Change Password", onClick: changepassword }
		]}
	/>
{/if}

<style>
	.root {
		overflow-y: auto;
		overflow-x: hidden;
		max-height: 100%;
		padding: var(--token-space-4);
	}

	h1 {
		text-align: center;
		font-size: 1.85rem;
	}

	h2 {
		font-size: 1rem;
	}

	.option {
		width: 95%;
		height: 2.5rem;
		border-radius: 1rem;
		background-color: var(--token-color-surface-raised-normal);
		padding: 0.5rem 1rem;
		display: flex;
		align-items: center;
	}
</style>
