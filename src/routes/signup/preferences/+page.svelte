<script lang="ts">
	import {
		authBeat,
		Button,
		currentTheme,
		Dropdown,
		Flex,
		postFetch
	} from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";

	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	import DNLogo from "$lib/assets/DNLogo.png";

	import * as styles from "./page.css";

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
		{ value: "en-us", label: "English - US" },
		{ value: "nl", label: "Nederlands" }
	];

	const themes = [
		{ value: "system", label: "System" },
		{ value: "dark", label: "Dark" },
		{ value: "light", label: "Light" },
		{ value: "contrast", label: "Contrast" }
	];

	const daysOfWeek = [
		{ value: "monday", label: "Monday" },
		{ value: "tuesday", label: "Tuesday" },
		{ value: "wednesday", label: "Wednesday" },
		{ value: "thursday", label: "Thursday" },
		{ value: "friday", label: "Friday" },
		{ value: "saturday", label: "Saturday" },
		{ value: "sunday", label: "Sunday" }
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
			// TODO
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
			<h1>Preferences</h1>
			<p>Select the options you prefer.</p>
			<p>You can always change this later.</p>
		</Flex>

		<h2 style="font-size: {token.global.font.size.medium}">Select the language you prefer:</h2>
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

		<h2 style="font-size: {token.global.font.size.medium}">Select the theme you prefer:</h2>
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

		<h2 style="font-size: {token.global.font.size.medium}">Select your timezone:</h2>
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

		<h2 style="font-size: {token.global.font.size.medium}">Select the first day of the week:</h2>
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

		<h2 style="font-size: {token.global.font.size.medium}">Select your date format:</h2>
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

		<Button appearance="primary" onclick={submit} {loading}>Continue</Button>
	</div>
</div>
