<script lang="ts">
	import Error from "$lib/components/Error.svelte";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { authapiurl } from "$lib/config";
	import type { SessionInfo } from "$lib/types";
	import {
		FlexWrapper,
		Space,
		LinkButton,
		Button,
		Dropdown,
		toast,
		wait,
		getSessionInfo,
		authFetch,
		refreshAccessToken,
		BlockNote
	} from "@davidnet/svelte-ui";
	import { onMount } from "svelte";
	import { _ } from "svelte-i18n";

	let correlationID = crypto.randomUUID();
	let error = false;
	let loading = true;
	let sessionInfo: SessionInfo | null;
	let errorMSG = $_("account.settings.preferences.error.unknown");
	let saving = false;

	// Timezone, date format, first day options
	let timezones: string[] = [];
	const dateFormats = [
		{ label: "DD-MM-YYYY", value: "DD-MM-YYYY HH:mm" },
		{ label: "MM-DD-YYYY", value: "MM-DD-YYYY HH:mm" },
		{ label: "YYYY-MM-DD", value: "YYYY-MM-DD HH:mm" }
	];
	const firstDays = [
		{ label: $_("account.settings.preferences.first_day.monday"), value: "monday" },
		{ label: $_("account.settings.preferences.first_day.sunday"), value: "sunday" }
	];
	const languages = [
		{ label: "English", value: "en" },
		{ label: "Deutsch", value: "de" },
		{ label: "Nederlands", value: "nl" },
		{ label: "Espanol", value: "es" }
	];

	let userPreferences = {
		timezone: "UTC",
		dateFormat: "DD-MM-YYYY HH:mm",
		firstDay: "monday",
		language: "en"
	};

	let initialPreferences = { ...userPreferences };

	onMount(async () => {
		const si = await getSessionInfo(correlationID);
		sessionInfo = si;

		if (!si) {
			errorMSG = $_("account.settings.preferences.error.session_invalid");
			error = true;
			loading = false;
			return;
		}

		timezones = Intl.supportedValuesOf("timeZone");

		// Load user preferences from backend
		try {
			const res = await authFetch(`${authapiurl}settings/preferences/load`, correlationID);
			if (!res.ok) throw "something exploded";
			const json = await res.json();
			userPreferences = {
				timezone: json.timezone,
				dateFormat: json.dateFormat,
				firstDay: json.firstDay,
				language: json.language
			};
			initialPreferences = { ...userPreferences };
		} catch (e) {
			console.error(e);
			errorMSG = String(e);
			error = true;
		} finally {
			loading = false;
		}
	});

	async function saveSettings() {
		if (!sessionInfo) return;
		saving = true;

		try {
			const res = await authFetch(`${authapiurl}settings/preferences/save`, correlationID, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(userPreferences)
			});

			if (!res.ok) {
				const json = await res.json();
				errorMSG = json.error || $_("account.settings.preferences.error.save_failed");
				error = true;
				return;
			}

			initialPreferences = { ...userPreferences };
			error = false;
			toast({
				title: $_("account.settings.preferences.toast.saved.title"),
				desc: $_("account.settings.preferences.toast.saved.desc"),
				icon: "tune",
				appearance: "success",
				position: "bottom-left",
				autoDismiss: 5000
			});
		} catch (e) {
			console.error(e);
			errorMSG = String(e);
			error = true;
		} finally {
			refreshAccessToken(correlationID, false, true);
			await wait(200);
			saving = false;
		}
	}

	function undo() {
		userPreferences = { ...initialPreferences };
	}

	$: hasChanges =
		userPreferences.timezone !== initialPreferences.timezone ||
		userPreferences.dateFormat !== initialPreferences.dateFormat ||
		userPreferences.firstDay !== initialPreferences.firstDay ||
		userPreferences.language !== initialPreferences.language;
</script>

{#if error}
	<Error pageName={$_("account.settings.preferences.title")} {errorMSG} {correlationID} />
{:else if loading}
	<h1>{$_("account.settings.preferences.title")}</h1>
	<ProfileLoader />
{:else}
	<div class="root">
		<Space height="var(--token-space-4)" />
		<FlexWrapper width="100%" justifycontent="space-around" direction="row">
			<Button onClick={() => history.back()} iconbefore="arrow_back">{$_("account.settings.preferences.btn.back")}</Button>
			<LinkButton href="/logout" iconafter="logout">{$_("account.settings.preferences.btn.logout")}</LinkButton>
		</FlexWrapper>

		<Space height="var(--token-space-4)" />
		<h1>{$_("account.settings.preferences.title")}</h1>

		<FlexWrapper gap="var(--token-space-2)" direction="column">
			<div class="option">
				<FlexWrapper direction="row" justifycontent="flex-start" height="100%" width="100%" gap="var(--token-space-1)">
					{$_("account.settings.preferences.label.timezone")}
					<Dropdown actions={timezones.map((tz) => ({ label: tz, value: tz }))} bind:value={userPreferences.timezone} appearance="subtle" />
				</FlexWrapper>
			</div>

			<div class="option">
				<FlexWrapper direction="row" justifycontent="flex-start" height="100%" width="100%" gap="var(--token-space-1)">
					{$_("account.settings.preferences.label.date_format")}
					<Dropdown actions={dateFormats} bind:value={userPreferences.dateFormat} appearance="subtle" />
				</FlexWrapper>
			</div>

			<div class="option">
				<FlexWrapper direction="row" justifycontent="flex-start" height="100%" width="100%" gap="var(--token-space-1)">
					{$_("account.settings.preferences.label.first_day")}
					<Dropdown actions={firstDays} bind:value={userPreferences.firstDay} appearance="subtle" />
				</FlexWrapper>
			</div>

			<div class="option">
				<FlexWrapper direction="row" justifycontent="flex-start" height="100%" width="100%" gap="var(--token-space-1)">
					{$_("account.settings.preferences.label.language")}
					<Dropdown actions={languages} bind:value={userPreferences.language} appearance="subtle" />
				</FlexWrapper>
			</div>
		</FlexWrapper>

		<Space height="var(--token-space-6)" />
		<FlexWrapper justifycontent="flex-end" width="100%" direction="row" gap="var(--token-space-2)">
			<Button onClick={undo} disabled={!hasChanges} appearance="danger">{$_("account.settings.preferences.btn.undo")}</Button>
			<Button onClick={saveSettings} appearance="primary" loading={saving} disabled={!hasChanges}
				>{$_("account.settings.preferences.btn.save")}</Button
			>
		</FlexWrapper>

		<Space height="var(--token-space-3)" />

		{#if userPreferences.language !== "en" || initialPreferences.language !== "en"}
			<BlockNote appearance="warning" title={$_("account.settings.preferences.note.translations.title")}>
				{$_("account.settings.preferences.note.translations.desc", { values: { lang: userPreferences.language } })}
			</BlockNote>
		{/if}
	</div>
{/if}

<style>
	.root {
		overflow-y: auto;
		max-height: 100%;
		padding: var(--token-space-4);
	}

	h1 {
		text-align: center;
		font-size: 1.85rem;
	}

	.option {
		width: 100%;
		height: 2.5rem;
		border-radius: 1rem;
		background-color: var(--token-color-surface-raised-normal);
		padding: 0.5rem 1rem;
		display: flex;
		align-items: center;
	}
</style>
