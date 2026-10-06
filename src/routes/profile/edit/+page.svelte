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
	import * as m from "$lib/paraglide/messages.js";

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
		{ value: "", label: m.page_edit_profile_none_option() },
		...rawData
			.map((c) => ({ value: c.code, label: `${c.name} (${c.code})` }))
			.sort((a, b) => a.label.localeCompare(b.label))
	];

	const visibilityOptions = [
		{ value: "private", label: m.page_edit_profile_vis_private() },
		{ value: "organizations", label: m.page_edit_profile_vis_organizations() },
		{ value: "connections", label: m.page_edit_profile_vis_connections() },
		{ value: "organizations_and_connections", label: m.page_edit_profile_vis_orgs_and_connections() },
		{ value: "public", label: m.page_edit_profile_vis_public() }
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
		input.accept = "image/jpeg,image/png,image/webp,image/avif,image/gif";
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
						m.page_edit_profile_toast_avatar_title(),
						m.page_edit_profile_toast_avatar_content(),
						"image",
						4000,
						"success"
					);
				} else {
					bannerUrl = result.url;
					toast(
						m.page_edit_profile_toast_banner_title(),
						m.page_edit_profile_toast_banner_content(),
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
				toast(
					m.page_edit_profile_toast_saved_title(),
					m.page_edit_profile_toast_saved_content(),
					"edit",
					4000,
					"success"
				);
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
		<h1 class={styles.title}>{m.page_edit_profile_title()}</h1>
		<p class={styles.subtitle}>{m.page_edit_profile_subtitle()}</p>

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
						<h2 class={styles.label} style="margin-bottom: 0.5rem;">{m.page_edit_profile_images_heading()}</h2>

						<div
							class={styles.bannerPreview}
							style={bannerUrl ? `background-image: url(${bannerUrl});` : ""}>
							<div class={styles.bannerOverlay}>
								<IconButton
									icon="edit"
									tip={m.page_edit_profile_change_banner_tip()}
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
										tip={m.page_edit_profile_change_avatar_tip()}
										loading={uploadingAvatar}
										appearance="default"
										onclick={() => triggerImageUpload("avatar")} />
								</div>
							</div>
						</div>
					</div>

					<Field label={m.page_edit_profile_display_name_label()} name="displayName">
						<TextField
							maxlength={35}
							placeholder={m.page_edit_profile_display_name_placeholder()}
							bind:value={displayName}
							disabled={saving} />
					</Field>

					<Field label={m.page_edit_profile_description_label()} name="description">
						<TextArea
							maxlength={800}
							placeholder={m.page_edit_profile_description_placeholder()}
							bind:value={description}
							disabled={saving} />
					</Field>

					<div class={styles.formGroup}>
						<h3 class={styles.label}>{m.page_edit_profile_country_label()}</h3>
						<Dropdown isOpen={countryDropdownOpen}>
							{#snippet trigger()}
								<Button
									stretchwidth
									alignContent="left"
									iconbefore="globe"
									onclick={() => (countryDropdownOpen = !countryDropdownOpen)}>
									{countryCodes.find((c) => c.value === countryCode)?.label || m.page_edit_profile_none_option()}
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

					<Field label={m.page_edit_profile_location_label()} name="location">
						<TextField
							maxlength={50}
							placeholder={m.page_edit_profile_location_placeholder()}
							bind:value={location}
							disabled={saving} />
					</Field>

					<h2 class={styles.label} style="margin-top: 1rem;">{m.page_edit_profile_privacy_heading()}</h2>

					<div class={styles.formGroup}>
						<h3 class={styles.label}>{m.page_edit_profile_lang_vis_label()}</h3>
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
						<h3 class={styles.label}>{m.page_edit_profile_tz_vis_label()}</h3>
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
						<h3 class={styles.label}>{m.page_edit_profile_loc_vis_label()}</h3>
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
						<h3 class={styles.label}>{m.page_edit_profile_email_vis_label()}</h3>
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
						{m.page_edit_profile_save_button()}
					</Button>
				</Flex>
			</form>
		{/if}

		<div class={styles.cardActions} style="margin-top: 1.5rem;">
			<LinkButton href="/profile/{identityState.user?.userID}"
				>{m.page_edit_profile_view_profile_link()}</LinkButton>
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
