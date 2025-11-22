<script lang="ts">
	import { goto } from "$app/navigation";
	import Error from "$lib/components/Error.svelte";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { authapiurl } from "$lib/config";
	import type { securitydata, SessionInfo, session } from "$lib/types";
	import {
		FlexWrapper,
		Space,
		LinkButton,
		Button,
		TextField,
		Modal,
		toast,
		IconButton,
		formatDate_PREFERREDTIME,
		wait,
		getSessionInfo,
		authFetch,
		refreshAccessToken
	} from "@davidnet/svelte-ui";
	import { onMount } from "svelte";
	import { jsPDF } from "jspdf";
	import { _ } from "svelte-i18n";

	let correlationID = crypto.randomUUID();
	let error = false;
	let loading = true;
	let sessionInfo: SessionInfo | null;
	let errorMSG = $_("account.settings.security.error.unknown");
	let new_password = "";
	let changepassmodal = false;
	let loadingbtn = false;
	let data: securitydata;
	let sessions: session[];

	onMount(async () => {
		refreshAccessToken(correlationID, false, true);
		const si = await getSessionInfo(correlationID);
		sessionInfo = si;

		if (!si) {
			errorMSG = $_("account.settings.security.error.session_invalid");
			error = true;
			loading = false;
			return;
		}

		try {
			const res = await authFetch(`${authapiurl}settings/security/load`, correlationID);
			if (!res.ok) throw "something exploded";
			const json: securitydata = await res.json();
			data = json;
			const seres = await authFetch(`${authapiurl}settings/security/sessions`, correlationID);
			if (!seres.ok) throw "something exploded";
			const sejson = await seres.json();

			// pre-format the async dates into strings
			sessions = await Promise.all(
				sejson.sessions.map(async (s: session) => ({
					...s,
					created_at_fmt: await formatDate_PREFERREDTIME(s.created_at, correlationID),
					last_updated_fmt: await formatDate_PREFERREDTIME(s.last_updated, correlationID),
					expires_at_fmt: await formatDate_PREFERREDTIME(s.expires_at, correlationID)
				}))
			);
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
				title: $_("account.settings.security.toast.totp_disabled.title"),
				desc: $_("account.settings.security.toast.totp_disabled.desc"),
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
		if (data.twofa_email_enabled === 0) {
			const res = await authFetch(`${authapiurl}settings/security/twofa/email`, correlationID, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ twofa_email_enabled: 1 })
			});

			if (!res.ok) {
				errorMSG = $_("account.settings.security.error.enable_email_2fa");
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
				errorMSG = $_("account.settings.security.error.disable_email_2fa");
				error = true;
				loadingbtn = false;
				return;
			}
		} else {
			errorMSG = $_("account.settings.security.error.toggle_email_2fa");
			error = true;
			loadingbtn = false;
		}

		if (data.twofa_email_enabled) {
			data = { ...data, twofa_email_enabled: 0 };
			toast({
				title: $_("account.settings.security.toast.email_2fa_disabled.title"),
				desc: $_("account.settings.security.toast.email_2fa_disabled.desc"),
				icon: "fingerprint_off",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 5000
			});
		} else {
			data = { ...data, twofa_email_enabled: 1 };
			toast({
				title: $_("account.settings.security.toast.email_2fa_enabled.title"),
				desc: $_("account.settings.security.toast.email_2fa_enabled.desc"),
				icon: "fingerprint",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 5000
			});
			toast({
				title: $_("account.settings.security.toast.email_2fa_warning.title"),
				desc: $_("account.settings.security.toast.email_2fa_warning.desc"),
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
				errorMSG = $_("account.settings.security.error.change_password");
				error = true;
				loadingbtn = false;
				return;
			}

			error = false;
			toast({
				title: $_("account.settings.security.toast.password_changed.title"),
				desc: $_("account.settings.security.toast.password_changed.desc"),
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
		const recovery_codes: string[] = Array.from({ length: 10 }, () => crypto.randomUUID());
		const gendate = await formatDate_PREFERREDTIME(new Date().toISOString(), correlationID);

		const doc = new jsPDF();
		doc.setFontSize(20);
		doc.text($_("account.settings.security.recovery_kit.title"), 105, 20, { align: "center" });

		doc.setFontSize(10);
		doc.text(`${$_("account.settings.security.recovery_kit.generated")}: ${gendate}`, 105, 30, { align: "center" });

		doc.setFontSize(12);
		doc.text($_("account.settings.security.recovery_kit.instructions"), 20, 40, { maxWidth: 170 });

		doc.setFontSize(12);
		doc.setTextColor("red");
		doc.text($_("account.settings.security.recovery_kit.warning"), 20, 60, { maxWidth: 170 });
		doc.setTextColor("black");

		doc.setFontSize(12);
		doc.text($_("account.settings.security.recovery_kit.codes"), 20, 70);
		recovery_codes.forEach((code: string, i: number) => {
			doc.rect(20, 75 + i * 12, 170, 10);
			doc.text(code, 25, 83 + i * 12);
		});

		doc.text($_("account.settings.security.recovery_kit.support"), 20, 75 + recovery_codes.length * 12 + 20);
		doc.text($_("account.settings.security.recovery_kit.version_info"), 20, 75 + recovery_codes.length * 12 + 40, { maxWidth: 170 });
		doc.text($_("account.settings.security.recovery_kit.version_number", { values: { number: 1 } }), 20, 75 + recovery_codes.length * 12 + 45, {
			maxWidth: 170
		});

		doc.save("recovery-kit.pdf");
	}

	async function revokeSession(id: number) {
		if (!sessionInfo) return;
		loadingbtn = true;

		try {
			const res = await authFetch(`${authapiurl}settings/security/sessions/revoke`, correlationID, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ sessionID: id })
			});

			if (!res.ok) {
				const errJson = await res.json().catch(() => null);
				const msg = errJson?.error || $_("account.settings.security.error.revoke_session");
				toast({
					title: $_("account.settings.security.toast.error"),
					desc: msg,
					icon: "error",
					appearance: "danger",
					position: "bottom-left"
				});
				return;
			}

			sessions = sessions.filter((s) => s.id !== id);
			toast({
				title: $_("account.settings.security.toast.session_revoked.title"),
				desc: $_("account.settings.security.toast.session_revoked.desc", { values: { id } }),
				icon: "delete",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 5000
			});
		} catch (e) {
			console.error(e);
			toast({
				title: $_("account.settings.security.toast.error"),
				desc: $_("account.settings.security.toast.error_desc"),
				icon: "error",
				appearance: "danger",
				position: "bottom-left"
			});
		} finally {
			loadingbtn = false;
		}
	}
</script>

{#if error}
	<Error pageName={$_("account.settings.security.title")} {errorMSG} {correlationID} />
{:else if loading}
	<h1>{$_("account.settings.security.title")}</h1>
	<ProfileLoader />
{:else}
	<div class="root">
		<Space height="var(--token-space-4)" />
		<FlexWrapper width="100%" justifycontent="space-around" direction="row">
			<Button onClick={() => history.back()} iconbefore="arrow_back">{$_("account.settings.security.btn.back")}</Button>
			<LinkButton href="/logout" iconafter="logout">{$_("account.settings.security.btn.logout")}</LinkButton>
		</FlexWrapper>

		<Space height="var(--token-space-4)" />
		<h1>{$_("account.settings.security.title")}</h1>

		<h2>{$_("account.settings.security.section.2fa")}</h2>

		<FlexWrapper gap="var(--token-space-2)" direction="column">
			<div class="option">
				<FlexWrapper direction="row" justifycontent="flex-start" height="100%" width="100%" gap="var(--token-space-1)">
					{$_("account.settings.security.option.totp")}
					<Space width="var(--token-space-4);" />
					<Button onClick={toggletotp} loading={loadingbtn}>
						{!data
							? $_("account.settings.security.loading")
							: data?.twofa_totp_enabled
								? $_("account.settings.security.btn.disable")
								: $_("account.settings.security.btn.enable")}
					</Button>
				</FlexWrapper>
			</div>

			<div class="option">
				<FlexWrapper direction="row" justifycontent="flex-start" height="100%" width="100%" gap="var(--token-space-1)">
					{$_("account.settings.security.option.email_2fa")}
					<Space width="var(--token-space-4);" />
					<Button onClick={toggle2faemail} loading={loadingbtn}>
						{!data
							? $_("account.settings.security.loading")
							: data?.twofa_email_enabled
								? $_("account.settings.security.btn.disable")
								: $_("account.settings.security.btn.enable")}
					</Button>
				</FlexWrapper>
			</div>
		</FlexWrapper>

		<Space height="var(--token-space-3)" />
		<h2>{$_("account.settings.security.section.password")}</h2>
		<Space height="var(--token-space-3)" />
		<div class="passwordthingie">
			<TextField
				label={$_("account.settings.security.input.password")}
				type="password"
				placeholder={$_("account.settings.security.input.password_placeholder")}
				bind:value={new_password}
				required
				invalid={new_password.length < 6 && new_password.length > 0}
				invalidMessage={$_("account.settings.security.input.password_invalid")}
			/>
			<Space height="var(--token-space-2)" />
			<FlexWrapper direction="row" justifycontent="flex-end" width="100%">
				<Button
					loading={loadingbtn}
					appearance="primary"
					onClick={() => {
						if (new_password.length > 5) changepassmodal = true;
					}}
				>
					{$_("account.settings.security.btn.change_password")}
				</Button>
			</FlexWrapper>
		</div>

		<p style="color: var(--token-color-text-danger);">{$_("account.settings.security.notice")}</p>

		<Space height="var(--token-space-5)" />
		<h2>{$_("account.settings.security.section.recovery_codes")}</h2>
		<div class="option">
			<FlexWrapper direction="row" justifycontent="flex-start" height="100%" width="100%" gap="var(--token-space-1)">
				{$_("account.settings.security.option.recovery_kit")}
				<Space width="var(--token-space-4);" />
				<Button appearance="primary" onClick={DownloadRecoveryKit} loading>{$_("account.settings.security.btn.download")}</Button>
			</FlexWrapper>
		</div>

		<Space height="var(--token-space-5)" />
		<h2>{$_("account.settings.security.section.sessions")}</h2>

		<FlexWrapper gap="var(--token-space-2)" direction="column">
			{#each sessions as s (s.id)}
				<div class="option">
					<FlexWrapper direction="row" justifycontent="space-between" width="100%" alignitems="center">
						<div class="session-info">
							<div><strong>ID:</strong><br /> {s.id}</div>
							<div><strong>{$_("account.settings.security.session.ip")}:</strong><br /> {s.ip_address}</div>
							<div><strong>{$_("account.settings.security.session.device")}:</strong><br /> {s.user_agent}</div>
							<div><strong>{$_("account.settings.security.session.created")}:</strong><br /> {s.created_at_fmt}</div>
							<div><strong>{$_("account.settings.security.session.last_active")}:</strong><br /> {s.last_updated_fmt}</div>
							<div><strong>{$_("account.settings.security.session.expires")}:</strong><br /> {s.expires_at_fmt}</div>
						</div>
						<IconButton
							onClick={async () => {
								await revokeSession(s.id);
							}}
							loading={loadingbtn}
							appearance="danger"
							icon="delete"
							alt={$_("account.settings.security.session.revoke_alt")}
						/>
					</FlexWrapper>
				</div>
			{/each}
		</FlexWrapper>
	</div>
{/if}

{#if changepassmodal}
	<Modal
		title={$_("account.settings.security.modal.change_password.title")}
		titleIcon="password"
		desc={$_("account.settings.security.modal.change_password.desc")}
		hasCloseBtn
		on:close={() => (changepassmodal = false)}
		options={[
			{
				appearance: "subtle",
				content: $_("account.settings.security.modal.cancel"),
				onClick: () => (changepassmodal = false)
			},
			{
				appearance: "danger",
				content: $_("account.settings.security.modal.change_password.btn"),
				onClick: changepassword
			}
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
		height: fit-content;
		border-radius: 1rem;
		background-color: var(--token-color-surface-raised-normal);
		padding: 0.5rem 1rem;
		display: flex;
		line-height: 1.5;
		align-items: center;
	}
</style>
