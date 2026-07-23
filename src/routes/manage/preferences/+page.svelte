<script lang="ts">
	import { PUBLIC_BACKEND_URL } from "$env/static/public";
	import {
		authState,
		Button,
		currentTheme,
		Dropdown,
		Flex,
		getCookie,
		getDateFormat,
		getFirstDayOfWeek,
		getTimezone,
		LANGUAGE_CACHE_KEY,
		patchFetch,
		setDateFormat,
		setFirstDayOfWeek,
		setLanguage,
		setTheme,
		navigateBack,
		setTimezone,
		type themeNames,
		LinkButton
	} from "@davidnet-net/svelte-ui";

	import * as styles from "./page.css";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";

	let language = $state("en-us");
	let theme = $state("dark");
	let timezone = $state("UTC");
	let firstDayOfWeek = $state("monday");
	let dateFormat = $state("YYYY-MM-DD");

	let languageDropdownOpen = $state(false);
	let themeDropdownOpen = $state(false);
	let timezoneDropdownOpen = $state(false);
	let firstDayDropdownOpen = $state(false);
	let dateFormatDropdownOpen = $state(false);

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
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		typeof Intl !== "undefined" && Intl.supportedValuesOf
			? Intl.supportedValuesOf("timeZone")
			: ["UTC"];

	async function updatePreference(payload: Record<string, string>) {
		if (!authState.isLoggedIn) {
			return;
		}
		await patchFetch(`${PUBLIC_BACKEND_URL}/auth/preferences`, payload, undefined, true);
	}

	$effect(() => {
		(async () => {
			if (!authState.isLoggedIn && !authState.loading) {
				goto(`/login?continue=${encodeURIComponent(page.url.href)}`);
			}
		})();

		const LANGUAGE = getCookie(LANGUAGE_CACHE_KEY) || "en-us";
		language = LANGUAGE;
		theme = currentTheme.themeName;

		timezone = getTimezone();
		firstDayOfWeek = getFirstDayOfWeek();
		dateFormat = getDateFormat();
	});
</script>

<div class={styles.page}>
	<div class={styles.card}>
		<h1 class={styles.title}>Preferences</h1>
		<p class={styles.subtitle}>Changes are saved automatically.</p>

		<Flex direction="column" gap="medium" marginTop="medium" width="100%">
			<div class={styles.formGroup}>
				<h2 class={styles.label}>Select the theme you prefer:</h2>
				<Dropdown isOpen={themeDropdownOpen}>
					{#snippet trigger()}
						<Button
							alignContent="left"
							iconbefore="palette"
							onclick={() => (themeDropdownOpen = !themeDropdownOpen)}
							stretchwidth>
							{themes.find((t) => t.value === theme)?.label || theme}
						</Button>
					{/snippet}
					{#each themes as t (t.value)}
						<Button
							stretchwidth
							alignContent="left"
							appearance="subtle"
							onclick={() => {
								theme = t.value;
								themeDropdownOpen = false;
								setTheme(t.value as themeNames);
								updatePreference({ theme: t.value });
							}}>
							{t.label}
						</Button>
					{/each}
				</Dropdown>
			</div>

			<div class={styles.formGroup}>
				<h2 class={styles.label}>Select the language you prefer:</h2>
				<Dropdown isOpen={languageDropdownOpen}>
					{#snippet trigger()}
						<Button
							stretchwidth
							alignContent="left"
							iconbefore="language"
							onclick={() => (languageDropdownOpen = !languageDropdownOpen)}>
							{languages.find((l) => l.value === language)?.label || language}
						</Button>
					{/snippet}
					{#each languages as lang (lang.value)}
						<Button
							stretchwidth
							appearance="subtle"
							alignContent="left"
							onclick={async () => {
								language = lang.value;
								languageDropdownOpen = false;
								await updatePreference({ language: lang.value });
								setLanguage(lang.value);
							}}>
							{lang.label}
						</Button>
					{/each}
				</Dropdown>
			</div>

			<div class={styles.formGroup}>
				<h2 class={styles.label}>Select your timezone:</h2>
				<Dropdown isOpen={timezoneDropdownOpen}>
					{#snippet trigger()}
						<Button
							stretchwidth
							alignContent="left"
							iconbefore="schedule"
							onclick={() => (timezoneDropdownOpen = !timezoneDropdownOpen)}>
							{timezone}
						</Button>
					{/snippet}
					{#each timezones as tz (tz)}
						<Button
							stretchwidth
							alignContent="left"
							appearance="subtle"
							onclick={() => {
								timezone = tz;
								timezoneDropdownOpen = false;
								setTimezone(tz);
								updatePreference({ timezone: tz });
							}}>
							{tz}
						</Button>
					{/each}
				</Dropdown>
			</div>

			<div class={styles.formGroup}>
				<h2 class={styles.label}>Select the first day of the week:</h2>
				<Dropdown isOpen={firstDayDropdownOpen}>
					{#snippet trigger()}
						<Button
							stretchwidth
							alignContent="left"
							iconbefore="calendar_today"
							onclick={() => (firstDayDropdownOpen = !firstDayDropdownOpen)}>
							{daysOfWeek.find((d) => d.value === firstDayOfWeek)?.label || firstDayOfWeek}
						</Button>
					{/snippet}
					{#each daysOfWeek as day (day.value)}
						<Button
							appearance="subtle"
							alignContent="left"
							stretchwidth
							onclick={() => {
								firstDayOfWeek = day.value;
								firstDayDropdownOpen = false;
								setFirstDayOfWeek(day.value);
								updatePreference({ firstDayOfWeek: day.value });
							}}>
							{day.label}
						</Button>
					{/each}
				</Dropdown>
			</div>

			<div class={styles.formGroup}>
				<h2 class={styles.label}>Select your date format:</h2>
				<Dropdown isOpen={dateFormatDropdownOpen}>
					{#snippet trigger()}
						<Button
							stretchwidth
							alignContent="left"
							iconbefore="date_range"
							onclick={() => (dateFormatDropdownOpen = !dateFormatDropdownOpen)}>
							{dateFormat}
						</Button>
					{/snippet}
					{#each dateFormats as format (format)}
						<Button
							appearance="subtle"
							alignContent="left"
							stretchwidth
							onclick={() => {
								dateFormat = format;
								dateFormatDropdownOpen = false;
								setDateFormat(format);
								updatePreference({ dateFormat: format });
							}}>
							{format}
						</Button>
					{/each}
				</Dropdown>
			</div>
		</Flex>

		<div class={styles.cardActions}>
			<LinkButton href="/">My account</LinkButton>
			<Button
				iconbefore="arrow_back"
				appearance="primary"
				onclick={() => {
					navigateBack();
				}}>
				Back
			</Button>
		</div>
	</div>
</div>
