<script lang="ts">
	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	import {
		Button,
		Flex,
		navigateBack,
		LinkButton,
		authState,
		appState,
		getFetch,
		formatUnixMsToPreferred,
		Anchor,
		identityState,
		deleteFetch,
		Modal
	} from "@davidnet-net/svelte-ui";

	import * as styles from "./page.css";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { token } from "@davidnet-net/svelte-ui/tokens";
	import { UAParser } from "ua-parser-js"; // <-- Import the library
	import { onMount } from "svelte";

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
		} else {
			// TODO ADD TOAST
		}
	}

	$effect(() => {
		(async () => {
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
		let deviceType = "Computer";
		if (result.device.type === "mobile") deviceType = "Mobile";
		if (result.device.type === "tablet") deviceType = "Tablet";
		if (result.device.type === "smarttv") deviceType = "Smart TV";

		// Use the actual vendor/model if available (e.g., "Apple - iPhone"), otherwise fallback to generic type
		const deviceDisplay =
			result.device.vendor && result.device.model
				? `${result.device.vendor} ${result.device.model}`
				: deviceType;

		return {
			device: deviceDisplay,
			os: result.os.name || "Unknown OS",
			browser: result.browser.name || "Unknown Browser",
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
			// TODO SUCCESS TOAST
		} else {
			// TODO FAILED TOAST
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
			// TODO SUCCESS TOAST
		} else {
			// TODO FAILED TOAST
		}

		await loadSessions();
		loading = false;
		showLogoutAllModal = false;
	}
</script>

<div class={styles.page}>
	<div class={styles.card}>
		<h1 class={styles.title}>Current sessions</h1>
		<div>
			<span class={styles.subtitle}>
				<Anchor href="/manage/security">Security</Anchor> > Current sessions
			</span>
			<p class={styles.subtitle}>
				If you lost one of your devices or you notice suspicious activity, then log out of all your
				devices and take steps to protect your account.
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
										<span class={styles.mobileSessionLabel}>Device:</span>
										{#if appState.isMobile}
											<br />
										{/if}
										{uaInfo.device} -
										<span class={styles.subtitle}>{uaInfo.os}</span>
									</div>
									<div>
										<span class={styles.mobileSessionLabel}>Program:</span>
										{uaInfo.browser}
									</div>
									<div>
										<span class={styles.mobileSessionLabel}>IP-Address:</span>
										{session.ip}
									</div>
									<div>
										<span class={styles.mobileSessionLabel}>Issued at:</span>
										{formatUnixMsToPreferred(new Date(session.issuedAt).getTime(), true)}
									</div>
									<div>
										<span class={styles.mobileSessionLabel}>Expires:</span>
										{formatUnixMsToPreferred(new Date(session.expiresAt).getTime(), true)}
									</div>
									<div>
										<Button
											{loading}
											onclick={() => {
												logoutSession(session.jwtId);
											}}>
											Log out
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
									<th>Device</th>
									<th>Program</th>
									<th>IP-Address</th>
									<th>Issued at</th>
									<th>Expires</th>
									<th>Action</th>
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
										<td style={`padding: ${token.global.spacing.small}`}>
											{formatUnixMsToPreferred(new Date(session.issuedAt).getTime(), true)}
										</td>
										<td style={`padding: ${token.global.spacing.small}`}>
											{formatUnixMsToPreferred(new Date(session.expiresAt).getTime(), true)}
										</td>
										<td style={`padding: ${token.global.spacing.small}`}>
											{#if session.jwtId === identityState.token?.jwtID}
												Current
											{:else}
												<Button
													{loading}
													onclick={() => {
														logoutSession(session.jwtId);
													}}>
													Log out
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
			<h2 class={styles.label}>Log out all sessions:</h2>
			<div class={styles.subtitle}>
				You will logout on all sessions except your current one.
				<br />
				<br />
				<Button
					{loading}
					onclick={() => {
						showLogoutAllModal = true;
					}}>
					Log out all sessions
				</Button>
			</div>
		</Flex>
		<Flex direction="column" gap="medium" marginTop="medium" width="100%">
			<div class={styles.cardActions}>
				<LinkButton href="/manage/security">Security</LinkButton>
				<Button
					iconbefore="arrow_back"
					appearance="primary"
					onclick={() => {
						navigateBack();
					}}>
					Back
				</Button>
			</div>
		</Flex>
	</div>
</div>

{#if showLogoutAllModal}
	<Modal
		title="Are you sure you want to logout on all sessions?"
		onclose={() => {
			showLogoutAllModal = false;
		}}>
		You will logout on all sessions except your current one.
		{#snippet actions()}
			<Button
				onclick={() => {
					showLogoutAllModal = false;
				}}
				{loading}>
				Cancel
			</Button>
			<Button appearance="danger" {loading} onclick={logoutall}>Log out all sessions</Button>
		{/snippet}
	</Modal>
{/if}
