<script lang="ts">
	import {
		authBeat,
		Button,
		currentTheme,
		Dropdown,
		Flex,
		postFetch,
		toast
	} from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	import DNLogo from "$lib/assets/DNLogo.png";

	import * as styles from "./page.css";
	import * as m from "$lib/paraglide/messages.js";

	const signupToken = $derived(page.url.searchParams.get("signupToken"));

	// --- State Variabelen voor de Backend (met standaard fallbacks) ---
	let language = $state("en-us");
	let theme = $state("dark");
	let timezone = $state("UTC");
	let firstDayOfWeek = $state("monday");
	let dateFormat = $state("YYYY-MM-DD");

	// --- State Variabelen voor de Dropdowns ---
	let languageDropdownOpen = $state(false);
	let themeDropdownOpen = $state(false);
	let timezoneDropdownOpen = $state(false);
	let firstDayDropdownOpen = $state(false);
	let dateFormatDropdownOpen = $state(false);

	// --- Vaste Opties ---
	const languages = [
		{ value: "en-us", label: m.common_language_en_us() },
		{ value: "nl", label: m.common_language_nl() }
	];

	const themes = [
		{ value: "system", label: m.common_theme_system() },
		{ value: "dark", label: m.common_theme_dark() },
		{ value: "light", label: m.common_theme_light() },
		{ value: "contrast", label: m.common_theme_contrast() }
	];

	const daysOfWeek = [
		{ value: "monday", label: m.common_day_monday() },
		{ value: "tuesday", label: m.common_day_tuesday() },
		{ value: "wednesday", label: m.common_day_wednesday() },
		{ value: "thursday", label: m.common_day_thursday() },
		{ value: "friday", label: m.common_day_friday() },
		{ value: "saturday", label: m.common_day_saturday() },
		{ value: "sunday", label: m.common_day_sunday() }
	];

	const dateFormats = ["YYYY-MM-DD", "DD-MM-YYYY", "MM-DD-YYYY"];
	const timezones =
		typeof Intl !== "undefined" && Intl.supportedValuesOf
			? Intl.supportedValuesOf("timeZone")
			: ["UTC"];

	$effect(() => {
		// 1. Automatische Tijdzone (Dit is een hele sterke hint voor de fysieke locatie)
		let currentTz = "UTC";
		try {
			currentTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
			if (timezones.includes(currentTz)) {
				timezone = currentTz;
			}
		} catch (e) {
			console.error("Timezone detection failed", e);
		}

		// 2. Taal en Regio (Kijk naar taal óf tijdzone)
		const browserLang = navigator.language || "en-us";

		// Als de browser taal Nederlands is, óf ze bevinden zich fysiek in Europa/Nederland:
		if (browserLang.startsWith("nl") || currentTz === "Europe/Amsterdam") {
			// Als hun browser Engels is, houd de UI dan in het Engels. Anders NL.
			language = browserLang.startsWith("nl") ? "nl" : "en-us";
			firstDayOfWeek = "monday"; // In NL/Europa begint de week op maandag
			dateFormat = "DD-MM-YYYY"; // Standaard Europese datum
		} else {
			language = "en-us";
			firstDayOfWeek = "sunday"; // US standaard
			dateFormat = "MM-DD-YYYY"; // US standaard
		}

		theme = currentTheme.themeName;
	});

	let loading = $state(false);
	async function submit() {
		loading = true;
		if (!signupToken) {
			toast(
				m.page_signup_prefs_lost_you_title(),
				m.page_signup_prefs_lost_you_content(),
				"no_accounts",
				4000,
				"subtle"
			);
			goto("/login");
			loading = false;
			return;
		}
		const result = await postFetch(
			PUBLIC_BACKEND_URL + "/auth/signup/preferences",
			{
				theme,
				language,
				timezone,
				firstDayOfWeek,
				dateFormat
			},
			{
				"X-SignupToken": signupToken
			}
		);

		if (result.code !== "PREFERENCES_SAVED") {
			loading = false;
			return;
		}

		const finishResult = await postFetch(
			PUBLIC_BACKEND_URL + "/auth/signup/finish",
			{},
			{
				"X-SignupToken": signupToken
			}
		);

		if (finishResult.code === "LOGIN_COMPLETE") {
			await authBeat();
			goto("/");
		} else {
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
			<h1>{m.page_prefs_title()}</h1>
			<p>{m.page_signup_prefs_subheading1()}</p>
			<p>{m.page_signup_prefs_subheading2()}</p>
		</Flex>

		<h2 style="font-size: {token.global.font.size.medium}">{m.page_prefs_select_language()}</h2>
		<Dropdown isOpen={languageDropdownOpen}>
			{#snippet trigger()}
				<Button
					iconbefore="language"
					onclick={() => (languageDropdownOpen = !languageDropdownOpen)}>
					{languages.find((l) => l.value === language)?.label || language}
				</Button>
			{/snippet}
			{#each languages as lang}
				<Button
					appearance="subtle"
					onclick={() => {
						language = lang.value;
						languageDropdownOpen = false;
					}}>
					{lang.label}
				</Button>
			{/each}
		</Dropdown>

		<h2 style="font-size: {token.global.font.size.medium}">{m.page_prefs_select_theme()}</h2>
		<Dropdown isOpen={themeDropdownOpen}>
			{#snippet trigger()}
				<Button iconbefore="palette" onclick={() => (themeDropdownOpen = !themeDropdownOpen)}>
					{themes.find((t) => t.value === theme)?.label || theme}
				</Button>
			{/snippet}
			{#each themes as t}
				<Button
					appearance="subtle"
					onclick={() => {
						theme = t.value;
						themeDropdownOpen = false;
					}}>
					{t.label}
				</Button>
			{/each}
		</Dropdown>

		<h2 style="font-size: {token.global.font.size.medium}">{m.page_prefs_select_timezone()}</h2>
		<Dropdown isOpen={timezoneDropdownOpen}>
			{#snippet trigger()}
				<Button
					iconbefore="schedule"
					onclick={() => (timezoneDropdownOpen = !timezoneDropdownOpen)}>
					{timezone}
				</Button>
			{/snippet}
			{#each timezones as tz}
				<Button
					appearance="subtle"
					onclick={() => {
						timezone = tz;
						timezoneDropdownOpen = false;
					}}>
					{tz}
				</Button>
			{/each}
		</Dropdown>

		<h2 style="font-size: {token.global.font.size.medium}">{m.page_prefs_select_first_day()}</h2>
		<Dropdown isOpen={firstDayDropdownOpen}>
			{#snippet trigger()}
				<Button
					iconbefore="calendar_today"
					onclick={() => (firstDayDropdownOpen = !firstDayDropdownOpen)}>
					{daysOfWeek.find((d) => d.value === firstDayOfWeek)?.label || firstDayOfWeek}
				</Button>
			{/snippet}
			{#each daysOfWeek as day}
				<Button
					appearance="subtle"
					onclick={() => {
						firstDayOfWeek = day.value;
						firstDayDropdownOpen = false;
					}}>
					{day.label}
				</Button>
			{/each}
		</Dropdown>

		<h2 style="font-size: {token.global.font.size.medium}">{m.page_prefs_select_date_format()}</h2>
		<Dropdown isOpen={dateFormatDropdownOpen}>
			{#snippet trigger()}
				<Button
					iconbefore="date_range"
					onclick={() => (dateFormatDropdownOpen = !dateFormatDropdownOpen)}>
					{dateFormat}
				</Button>
			{/snippet}
			{#each dateFormats as format}
				<Button
					appearance="subtle"
					onclick={() => {
						dateFormat = format;
						dateFormatDropdownOpen = false;
					}}>
					{format}
				</Button>
			{/each}
		</Dropdown>
		<br />

		<Button appearance="primary" onclick={submit} {loading}>{m.page_signup_prefs_continue()}</Button>
	</div>
</div>
