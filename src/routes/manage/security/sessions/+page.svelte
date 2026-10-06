<script lang="ts">
	import {
		Anchor,
		appState,
		authState,
		Button,
		deleteFetch,
		Flex,
		formatUnixMsToPreferred,
		getFetch,
		identityState,
		LinkButton,
		Lozenge,
		Modal,
		navigateBack,
		toast,
		whenAuthReady
	} from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";
	import { onMount } from "svelte";
	import { UAParser } from "ua-parser-js"; // <-- Import the library

	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";

	import * as styles from "./page.css";
	import * as m from "$lib/paraglide/messages.js";

	interface session {
		jwtId: string;
		issuedAt: string;
		expiresAt: string;
		ip: string;
		countryCode: string;
		userAgent: string;
	}

	let sessions: session[] | undefined = $state(undefined);

	async function loadSessions() {
		const result = await getFetch(
			PUBLIC_BACKEND_URL + "/auth/security/sessions",
			undefined,
			undefined,
			true
		);

		if (result.sessions) {
			sessions = result.sessions;
		}
	}

	$effect(() => {
		(async () => {
			await whenAuthReady();
			if (!authState.isLoggedIn && !authState.loading) {
				goto(`/login?continue=${encodeURIComponent(page.url.href)}`);
			}
			await loadSessions();
		})();
	});

	onMount(() => {
		document.addEventListener("visibilitychange", async () => {
			if (document.visibilityState === "visible") {
				await loadSessions();
			}
		});
	});
	// Replaced the custom regex with UAParser
	function parseUA(ua: string) {
		const parser = new UAParser(ua);
		const result = parser.getResult();

		// UAParser leaves device.type undefined for standard desktops/laptops.
		// We map it to your preferred "Computer" fallback.
		let deviceType = m.page_sessions_device_computer();
		if (result.device.type === "mobile") deviceType = m.page_sessions_device_mobile();
		if (result.device.type === "tablet") deviceType = m.page_sessions_device_tablet();
		if (result.device.type === "smarttv") deviceType = m.page_sessions_device_smarttv();

		// Use the actual vendor/model if available (e.g., "Apple - iPhone"), otherwise fallback to generic type
		const deviceDisplay =
			result.device.vendor && result.device.model
				? `${result.device.vendor} ${result.device.model}`
				: deviceType;

		return {
			device: deviceDisplay,
			os: result.os.name || m.page_sessions_unknown_os(),
			browser: result.browser.name || m.page_sessions_unknown_browser(),
			version: result.browser.version ? `v${result.browser.version}` : ""
		};
	}

	let loading = $state(false);
	async function logoutSession(jwtID: string) {
		loading = true;
		const result = await deleteFetch(
			PUBLIC_BACKEND_URL + "/auth/security/session",
			{ jwtID },
			undefined,
			true
		);

		if (result.success) {
			toast(
				m.page_sessions_toast_revoked_title(),
				m.page_sessions_toast_revoked_content(),
				"logout",
				4000,
				"success"
			);
		}

		await loadSessions();
		loading = false;
	}

	let showLogoutAllModal = $state(false);
	async function logoutall() {
		loading = true;

		const result = await deleteFetch(
			PUBLIC_BACKEND_URL + "/auth/security/sessions",
			undefined,
			undefined,
			true
		);

		if (result.success) {
			toast(
				m.page_sessions_toast_logout_all_title(),
				m.page_sessions_toast_logout_all_content(),
				"logout",
				4000,
				"success"
			);
		}

		await loadSessions();
		loading = false;
		showLogoutAllModal = false;
	}
</script>

<div class={styles.page}>
	<div class={styles.card}>
		<h1 class={styles.title}>{m.page_sessions_title()}</h1>
		<div>
			<span class={styles.subtitle}>
				<Anchor href="/manage/security">{m.page_sessions_breadcrumb_security()}</Anchor> > {m.page_sessions_breadcrumb_current()}
			</span>
			<p class={styles.subtitle}>
				{m.page_sessions_warning()}
			</p>

			{#if sessions}
				<div class={styles.tableContainer}>
					{#if appState.isMobile}
						<div class={styles.mobileList}>
							{#each sessions as session, index (session.jwtId)}
								{@const uaInfo = parseUA(session.userAgent)}
								<div
									class={styles.mobileSessionCard}
									style={index === sessions.length - 1
										? ""
										: `border-bottom: ${token.global.borderWidth.standard} solid ${token.theme.color.border.highlighted}`}>
									<div>
										<span class={styles.mobileSessionLabel}>{m.page_sessions_device_label()}</span>
										{#if appState.isMobile}
											<br />
										{/if}
										{uaInfo.device} -
										<span class={styles.subtitle}>{uaInfo.os}</span>
									</div>
									<div>
										<span class={styles.mobileSessionLabel}>{m.page_sessions_program_label()}</span>
										{uaInfo.browser}
									</div>
									<div>
										<span class={styles.mobileSessionLabel}>{m.page_sessions_ip_label()}</span>
										{session.ip}
									</div>
									<div>
										<span class={styles.mobileSessionLabel}>{m.page_sessions_country_label()}</span>
										{session.countryCode}
									</div>
									<div>
										<span class={styles.mobileSessionLabel}>{m.page_sessions_issued_label()}</span>
										{formatUnixMsToPreferred(new Date(session.issuedAt).getTime(), true)}
									</div>
									<div>
										<span class={styles.mobileSessionLabel}>{m.page_sessions_expires_label()}</span>
										{formatUnixMsToPreferred(new Date(session.expiresAt).getTime(), true)}
									</div>
									<div>
										<Button
											{loading}
											onclick={() => {
												logoutSession(session.jwtId);
											}}>
											{m.page_sessions_logout_button()}
										</Button>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<table class={styles.table}>
							<thead>
								<tr
									style={`border-bottom: ${token.global.borderWidth.standard} solid ${token.theme.color.border.highlighted}; padding-bottom: ${token.global.spacing.giant}`}>
									<th>{m.page_sessions_table_device()}</th>
									<th>{m.page_sessions_table_program()}</th>
									<th>{m.page_sessions_table_ip()}</th>
									<th>{m.page_sessions_table_country()}</th>
									<th>{m.page_sessions_table_issued()}</th>
									<th>{m.page_sessions_table_expires()}</th>
									<th>{m.page_sessions_table_action()}</th>
								</tr>
							</thead>
							<tbody>
								{#each sessions as session, index (session.jwtId)}
									{@const uaInfo = parseUA(session.userAgent)}
									<tr
										style={index === sessions.length - 1
											? ""
											: `border-bottom: ${token.global.borderWidth.standard} solid ${token.theme.color.border.highlighted}`}>
										<td style={`padding: ${token.global.spacing.small}`}>
											<span>{uaInfo.device}</span>
											-
											<span class={styles.subtitle}>{uaInfo.os}</span>
										</td>
										<td style={`padding: ${token.global.spacing.small}`}>{uaInfo.browser}</td>
										<td style={`padding: ${token.global.spacing.small}`}>{session.ip}</td>
										<td style={`padding: ${token.global.spacing.small}`}>{session.countryCode}</td>
										<td style={`padding: ${token.global.spacing.small}`}>
											{formatUnixMsToPreferred(new Date(session.issuedAt).getTime(), true)}
										</td>
										<td style={`padding: ${token.global.spacing.small}`}>
											{formatUnixMsToPreferred(new Date(session.expiresAt).getTime(), true)}
										</td>
										<td style={`padding: ${token.global.spacing.small}`}>
											{#if session.jwtId === identityState.token?.jwtID}
												<Lozenge appearance="primary">{m.page_sessions_current_badge()}</Lozenge>
											{:else}
												<Button
													{loading}
													onclick={() => {
														logoutSession(session.jwtId);
													}}>
													{m.page_sessions_logout_button()}
												</Button>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					{/if}
				</div>
			{/if}
		</div>
		<Flex direction="column" gap="none" marginTop="medium" width="100%">
			<h2 class={styles.label}>{m.page_sessions_logout_all_heading()}</h2>
			<div class={styles.subtitle}>
				{m.page_sessions_logout_all_warning()}
				<br />
				<br />
				<Button
					{loading}
					onclick={() => {
						showLogoutAllModal = true;
					}}>
					{m.page_sessions_logout_all_button()}
				</Button>
			</div>
		</Flex>
		<Flex direction="column" gap="medium" marginTop="medium" width="100%">
			<div class={styles.cardActions}>
				<LinkButton href="/manage/security">{m.page_sessions_breadcrumb_security()}</LinkButton>
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

{#if showLogoutAllModal}
	<Modal
		title={m.page_sessions_modal_title()}
		onclose={() => {
			showLogoutAllModal = false;
		}}>
		{m.page_sessions_logout_all_warning()}
		{#snippet actions()}
			<Button
				onclick={() => {
					showLogoutAllModal = false;
				}}
				{loading}>
				{m.common_Cancel()}
			</Button>
			<Button appearance="danger" {loading} onclick={logoutall}>{m.page_sessions_logout_all_button()}</Button>
		{/snippet}
	</Modal>
{/if}
