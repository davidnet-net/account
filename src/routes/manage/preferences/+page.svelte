<script lang="ts">
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
		LinkButton,
		navigateBack,
		patchFetch,
		setDateFormat,
		setFirstDayOfWeek,
		setLanguage,
		setTheme,
		setTimezone,
		type themeNames,
		whenAuthReady
	} from "@davidnet-net/svelte-ui";

	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";

	import * as styles from "./page.css";
	import * as m from "$lib/paraglide/messages.js";

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
			await whenAuthReady();
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
		<h1 class={styles.title}>{m.page_prefs_title()}</h1>
		<p class={styles.subtitle}>{m.page_prefs_subtitle()}</p>

		<Flex direction="column" gap="medium" marginTop="medium" width="100%">
			<div class={styles.formGroup}>
				<h2 class={styles.label}>{m.page_prefs_select_theme()}</h2>
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
				<h2 class={styles.label}>{m.page_prefs_select_language()}</h2>
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
				<h2 class={styles.label}>{m.page_prefs_select_timezone()}</h2>
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
				<h2 class={styles.label}>{m.page_prefs_select_first_day()}</h2>
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
				<h2 class={styles.label}>{m.page_prefs_select_date_format()}</h2>
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
			<LinkButton href="/">{m.common_my_account()}</LinkButton>
			<Button
				iconbefore="arrow_back"
				onclick={() => {
					navigateBack();
				}}>
				{m.common_back()}
			</Button>
		</div>
	</div>
</div>
