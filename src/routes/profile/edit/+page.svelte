<script lang="ts">
	import {
		authState,
		Button,
		Dropdown,
		Field,
		Flex,
		getFetch,
		Icon,
		IconButton,
		identityState,
		LinkButton,
		navigateBack,
		patchFetch,
		putFetch,
		Skeleton,
		syncProfileData,
		TextArea,
		TextField,
		toast,
		whenAuthReady
	} from "@davidnet-net/svelte-ui";
	import { token } from "@davidnet-net/svelte-ui/tokens";
	import countryList from "country-list";

	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { PUBLIC_BACKEND_URL } from "$env/static/public";

	import type { PageProps } from "./$types";
	import * as styles from "./page.css";

	// Form state variables
	let displayName = $state("");
	let description = $state("");
	let countryCode = $state("");
	let location = $state("");
	let avatarUrl = $state<string | null>(null);
	let bannerUrl = $state<string | null>(null);

	// Upload states
	let uploadingAvatar = $state(false);
	let uploadingBanner = $state(false);

	// Privacy settings state
	let languageVisibility = $state("private");
	let timezoneVisibility = $state("private");
	let locationVisibility = $state("private");
	let emailVisibility = $state("private");

	// Baseline snapshot to check for unsaved changes
	let initialSnapshot = $state({
		displayName: "",
		description: "",
		countryCode: "",
		location: "",
		languageVisibility: "private",
		timezoneVisibility: "private",
		locationVisibility: "private",
		emailVisibility: "private"
	});

	// Dropdown open states
	let countryDropdownOpen = $state(false);
	let langVisDropdownOpen = $state(false);
	let tzVisDropdownOpen = $state(false);
	let locVisDropdownOpen = $state(false);
	let emailVisDropdownOpen = $state(false);

	let loading = $state(true);
	let saving = $state(false);

	// Map the package's data into the format your Dropdown expects, prepending "None"
	const rawData = countryList.getData();
	const countryCodes = [
		{ value: "", label: "None" },
		...rawData
			.map((c) => ({ value: c.code, label: `${c.name} (${c.code})` }))
			.sort((a, b) => a.label.localeCompare(b.label))
	];

	const visibilityOptions = [
		{ value: "private", label: "Private" },
		{ value: "organizations", label: "Organizations" },
		{ value: "connections", label: "Connections" },
		{ value: "organizations_and_connections", label: "Organizations & Connections" },
		{ value: "public", label: "Public" }
	];

	// Computed check to see if any form fields have been modified
	let hasChanges = $derived(
		displayName !== initialSnapshot.displayName ||
			description !== initialSnapshot.description ||
			countryCode !== initialSnapshot.countryCode ||
			location !== initialSnapshot.location ||
			languageVisibility !== initialSnapshot.languageVisibility ||
			timezoneVisibility !== initialSnapshot.timezoneVisibility ||
			locationVisibility !== initialSnapshot.locationVisibility ||
			emailVisibility !== initialSnapshot.emailVisibility
	);

	// Ensure all text inputs are within their maxlength boundaries
	let isValid = $derived(
		displayName.length <= 35 && description.length <= 800 && location.length <= 50
	);

	$effect(() => {
		(async () => {
			await whenAuthReady();
			if (!authState.isLoggedIn && !authState.loading) {
				goto(`/login?continue=${encodeURIComponent(page.url.href)}`);
				return;
			}

			if (authState.isLoggedIn && identityState.user?.userID) {
				try {
					const result = await getFetch(
						`${PUBLIC_BACKEND_URL}/auth/profile`,
						{ user: identityState.user.userID },
						undefined,
						true
					);

					if (result.success && result.profileResponse) {
						displayName = result.profileResponse.displayName || "";
						description = result.profileResponse.description || "";
						countryCode = result.profileResponse.countryCode || "";
						location = result.profileResponse.location || "";
						avatarUrl = result.profileResponse.avatarUrl || null;
						bannerUrl = result.profileResponse.bannerUrl || null;

						if (identityState.privacy) {
							languageVisibility = identityState.privacy.languageVisibility || "private";
							timezoneVisibility = identityState.privacy.timezoneVisibility || "private";
							locationVisibility = identityState.privacy.locationVisibility || "private";
							emailVisibility = identityState.privacy.emailVisibility || "private";
						}

						initialSnapshot = {
							displayName,
							description,
							countryCode,
							location,
							languageVisibility,
							timezoneVisibility,
							locationVisibility,
							emailVisibility
						};
					}
				} finally {
					loading = false;
				}
			}
		})();
	});

	// File input handlers for Avatar & Banner
	function triggerImageUpload(type: "avatar" | "banner") {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/jpeg,image/png,image/webp,image/avif";
		input.onchange = async (e: Event) => {
			const target = e.target as HTMLInputElement;
			if (target.files && target.files[0]) {
				const file = target.files[0];
				await uploadImageFile(file, type);
			}
		};
		input.click();
	}

	async function uploadImageFile(file: File, type: "avatar" | "banner") {
		if (type === "avatar") uploadingAvatar = true;
		else uploadingBanner = true;

		try {
			const formData = new FormData();
			formData.append("image", file);

			const endpoint = `${PUBLIC_BACKEND_URL}/auth/profile/${type}`;

			const result = await putFetch(endpoint, formData, undefined, true);

			if (result.success) {
				if (type === "avatar") {
					avatarUrl = result.url;
					toast(
						"Avatar updated",
						"Your profile picture has been updated.",
						"image",
						4000,
						"success"
					);
				} else {
					bannerUrl = result.url;
					toast(
						"Banner updated",
						"Your profile banner has been updated.",
						"wallpaper",
						4000,
						"success"
					);
				}
				await syncProfileData();
			}
		} catch (err) {
			console.error(err);
		} finally {
			if (type === "avatar") uploadingAvatar = false;
			else uploadingBanner = false;
		}
	}

	async function handleSave(event: Event) {
		event.preventDefault();
		if (!hasChanges || !isValid) return;

		saving = true;

		try {
			const payload = {
				displayName,
				description,
				countryCode,
				location,
				languageVisibility,
				timezoneVisibility,
				locationVisibility,
				emailVisibility
			};

			const result = await patchFetch(
				`${PUBLIC_BACKEND_URL}/auth/profile`,
				payload,
				undefined,
				true
			);

			if (result.success) {
				toast("Profile saved!", "Changes have been successfully saved.", "edit", 4000, "success");
				initialSnapshot = {
					displayName,
					description,
					countryCode,
					location,
					languageVisibility,
					timezoneVisibility,
					locationVisibility,
					emailVisibility
				};
				await syncProfileData();
			}
		} finally {
			saving = false;
		}
	}
</script>

<div class={styles.page}>
	<div class={styles.card}>
		<h1 class={styles.title}>Edit Profile</h1>
		<p class={styles.subtitle}>Update your public profile details and privacy settings.</p>

		{#if loading}
			<Flex direction="column" gap="medium" marginTop="medium" width="100%">
				<Skeleton width="100%" height="4rem" />
				<Skeleton width="100%" height="6rem" />
				<Skeleton width="100%" height="4rem" />
			</Flex>
		{:else}
			<form id="edit-profile-form" onsubmit={handleSave}>
				<Flex direction="column" gap="medium" marginTop="medium" width="100%">
					<div class={styles.imageSectionContainer}>
						<h2 class={styles.label} style="margin-bottom: 0.5rem;">Profile & Banner Images</h2>

						<div
							class={styles.bannerPreview}
							style={bannerUrl ? `background-image: url(${bannerUrl});` : ""}>
							<div class={styles.bannerOverlay}>
								<IconButton
									icon="edit"
									tip="Change banner"
									loading={uploadingBanner}
									appearance="default"
									onclick={() => triggerImageUpload("banner")} />
							</div>

							<div
								class={styles.avatarPreview}
								style={avatarUrl ? `background-image: url(${avatarUrl});` : ""}>
								<div class={styles.overlayCenter}>
									<IconButton
										icon="edit"
										tip="Change avatar"
										loading={uploadingAvatar}
										appearance="default"
										onclick={() => triggerImageUpload("avatar")} />
								</div>
							</div>
						</div>
					</div>

					<Field label="Display Name:" name="displayName">
						<TextField
							maxlength={35}
							placeholder="Enter your display name"
							bind:value={displayName}
							disabled={saving} />
					</Field>

					<Field label="Description:" name="description">
						<TextArea
							maxlength={800}
							placeholder="Tell us about yourself"
							bind:value={description}
							disabled={saving} />
					</Field>

					<div class={styles.formGroup}>
						<h3 class={styles.label}>Country Code:</h3>
						<Dropdown isOpen={countryDropdownOpen}>
							{#snippet trigger()}
								<Button
									stretchwidth
									alignContent="left"
									iconbefore="globe"
									onclick={() => (countryDropdownOpen = !countryDropdownOpen)}>
									{countryCodes.find((c) => c.value === countryCode)?.label || "None"}
								</Button>
							{/snippet}
							{#each countryCodes as country (country.value)}
								<Button
									stretchwidth
									appearance="subtle"
									alignContent="left"
									onclick={() => {
										countryCode = country.value;
										countryDropdownOpen = false;
									}}>
									{country.label}
								</Button>
							{/each}
						</Dropdown>
					</div>

					<Field label="Location:" name="location">
						<TextField
							maxlength={50}
							placeholder="The moon"
							bind:value={location}
							disabled={saving} />
					</Field>

					<h2 class={styles.label} style="margin-top: 1rem;">Privacy Preferences</h2>

					<div class={styles.formGroup}>
						<h3 class={styles.label}>Language Visibility:</h3>
						<Dropdown isOpen={langVisDropdownOpen}>
							{#snippet trigger()}
								<Button
									stretchwidth
									alignContent="left"
									iconbefore="visibility"
									onclick={() => (langVisDropdownOpen = !langVisDropdownOpen)}>
									{visibilityOptions.find((v) => v.value === languageVisibility)?.label}
								</Button>
							{/snippet}
							{#each visibilityOptions as opt (opt.value)}
								<Button
									stretchwidth
									appearance="subtle"
									alignContent="left"
									onclick={() => {
										languageVisibility = opt.value;
										langVisDropdownOpen = false;
									}}>
									{opt.label}
								</Button>
							{/each}
						</Dropdown>
					</div>

					<div class={styles.formGroup}>
						<h3 class={styles.label}>Timezone Visibility:</h3>
						<Dropdown isOpen={tzVisDropdownOpen}>
							{#snippet trigger()}
								<Button
									stretchwidth
									alignContent="left"
									iconbefore="visibility"
									onclick={() => (tzVisDropdownOpen = !tzVisDropdownOpen)}>
									{visibilityOptions.find((v) => v.value === timezoneVisibility)?.label}
								</Button>
							{/snippet}
							{#each visibilityOptions as opt (opt.value)}
								<Button
									stretchwidth
									appearance="subtle"
									alignContent="left"
									onclick={() => {
										timezoneVisibility = opt.value;
										tzVisDropdownOpen = false;
									}}>
									{opt.label}
								</Button>
							{/each}
						</Dropdown>
					</div>

					<div class={styles.formGroup}>
						<h3 class={styles.label}>Location Visibility:</h3>
						<Dropdown isOpen={locVisDropdownOpen}>
							{#snippet trigger()}
								<Button
									stretchwidth
									alignContent="left"
									iconbefore="visibility"
									onclick={() => (locVisDropdownOpen = !locVisDropdownOpen)}>
									{visibilityOptions.find((v) => v.value === locationVisibility)?.label}
								</Button>
							{/snippet}
							{#each visibilityOptions as opt (opt.value)}
								<Button
									stretchwidth
									appearance="subtle"
									alignContent="left"
									onclick={() => {
										locationVisibility = opt.value;
										locVisDropdownOpen = false;
									}}>
									{opt.label}
								</Button>
							{/each}
						</Dropdown>
					</div>

					<div class={styles.formGroup}>
						<h3 class={styles.label}>Email Visibility:</h3>
						<Dropdown isOpen={emailVisDropdownOpen}>
							{#snippet trigger()}
								<Button
									stretchwidth
									alignContent="left"
									iconbefore="visibility"
									onclick={() => (emailVisDropdownOpen = !emailVisDropdownOpen)}>
									{visibilityOptions.find((v) => v.value === emailVisibility)?.label}
								</Button>
							{/snippet}
							{#each visibilityOptions as opt (opt.value)}
								<Button
									stretchwidth
									appearance="subtle"
									alignContent="left"
									onclick={() => {
										emailVisibility = opt.value;
										emailVisDropdownOpen = false;
									}}>
									{opt.label}
								</Button>
							{/each}
						</Dropdown>
					</div>

					<Button
						form="edit-profile-form"
						type="submit"
						appearance="primary"
						loading={saving}
						disabled={!hasChanges || !isValid}>
						Save Changes
					</Button>
				</Flex>
			</form>
		{/if}

		<div class={styles.cardActions} style="margin-top: 1.5rem;">
			<LinkButton href="/profile/{identityState.user?.userID}">View Profile</LinkButton>
			<Button
				iconbefore="arrow_back"
				onclick={() => {
					navigateBack();
				}}>
				Back
			</Button>
		</div>
	</div>
</div>
