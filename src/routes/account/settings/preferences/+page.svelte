<script lang="ts">
	import Error from "$lib/components/Error.svelte";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";
	import { authapiurl } from "$lib/config";
	import { getSessionInfo, authFetch, refreshAccessToken } from "$lib/session";
	import type { SessionInfo } from "$lib/types";
	import { wait } from "$lib/utils/time";
	import { FlexWrapper, Space, LinkButton, Button, Dropdown, toast } from "@davidnet/svelte-ui";
	import { onMount } from "svelte";

	let correlationID = crypto.randomUUID();
	let error = false;
	let loading = true;
	let sessionInfo: SessionInfo | null;
	let errorMSG = "Unknown";
	let saving = false;

	// Timezone, date format, first day options
	let timezones: string[] = [];
	const dateFormats = [
		{ label: "DD-MM-YYYY", value: "DD-MM-YYYY HH:mm" },
		{ label: "MM-DD-YYYY", value: "MM-DD-YYYY HH:mm" },
		{ label: "YYYY-MM-DD", value: "YYYY-MM-DD HH:mm" }
	];
	const firstDays = [
		{ label: "Monday", value: "monday" },
		{ label: "Sunday", value: "sunday" }
	];

	let userPreferences = {
		timezone: "UTC",
		dateFormat: "DD-MM-YYYY HH:mm",
		firstDay: "monday"
	};

	let initialPreferences = { ...userPreferences };

	onMount(async () => {
		const si = await getSessionInfo(correlationID);
		sessionInfo = si;

		if (!si) {
			errorMSG = "Session Invalid";
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
				firstDay: json.firstDay
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
				errorMSG = json.error || "Failed to save preferences";
				error = true;
				return;
			}

			initialPreferences = { ...userPreferences };
			error = false;
			toast({
				title: "Preferences saved!",
				desc: "Your preferences has been saved.",
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
		userPreferences.firstDay !== initialPreferences.firstDay;
</script>

{#if error}
	<Error pageName="Preferences" {errorMSG} {correlationID} />
{:else if loading}
	<h1>Preferences</h1>
	<ProfileLoader />
{:else}
	<div class="root">
		<Space height="var(--token-space-4)" />
		<FlexWrapper width="100%" justifycontent="space-around" direction="row">
			<Button onClick={() => history.back()} iconbefore="arrow_back">Back</Button>
			<LinkButton href="/logout" iconafter="logout">Log out</LinkButton>
		</FlexWrapper>

		<Space height="var(--token-space-4)" />
		<h1>Preferences</h1>

		<FlexWrapper gap="var(--token-space-2)" direction="column">
			<div class="option">
				<FlexWrapper direction="row" justifycontent="flex-start" height="100%" width="100%" gap="var(--token-space-1)">
					Preferred Timezone
					<Dropdown actions={timezones.map((tz) => ({ label: tz, value: tz }))} bind:value={userPreferences.timezone} appearance="subtle" />
				</FlexWrapper>
			</div>

			<div class="option">
				<FlexWrapper direction="row" justifycontent="flex-start" height="100%" width="100%" gap="var(--token-space-1)">
					Preferred Date Format
					<Dropdown actions={dateFormats} bind:value={userPreferences.dateFormat} appearance="subtle" />
				</FlexWrapper>
			</div>

			<div class="option">
				<FlexWrapper direction="row" justifycontent="flex-start" height="100%" width="100%" gap="var(--token-space-1)">
					First Day of the Week
					<Dropdown actions={firstDays} bind:value={userPreferences.firstDay} appearance="subtle" />
				</FlexWrapper>
			</div>
		</FlexWrapper>

		<Space height="var(--token-space-6)" />
		<FlexWrapper justifycontent="flex-end" width="100%" direction="row" gap="var(--token-space-2)">
			<Button onClick={undo} disabled={!hasChanges} appearance="danger">Undo</Button>
			<Button onClick={saveSettings} appearance="primary" loading={saving} disabled={!hasChanges}>Save</Button>
		</FlexWrapper>

		<Space height="var(--token-space-3)" />
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
