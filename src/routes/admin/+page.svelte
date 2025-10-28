<script lang="ts">
	import { FlexWrapper, Space, Icon, LinkButton, Button } from "@davidnet/svelte-ui";
</script>

<Space height="var(--token-space-4)" />
<FlexWrapper width="100%" justifycontent="flex-end" direction="row">
	<Button
		onClick={() => {
			history.back();
		}}
		iconbefore="arrow_back">Back</Button
	>

	<LinkButton href="/logout" iconafter="logout">Log out</LinkButton>
</FlexWrapper>
<FlexWrapper height="100%" width="100%">
	<Space height="var(--token-space-2)" />
	<h1>Admin</h1>

	<Space height="var(--token-space-6)" />
	<FlexWrapper direction="row" gap="var(--token-space-6)">
		<a href="/admin/users" class="option">
			<FlexWrapper height="100%" width="100%">
				<Icon icon="admin_panel_settings" size="3rem" />
				<p class="option-text">Manage<br />users</p>
			</FlexWrapper>
		</a>
		<a href="/admin/reports" class="option">
			<FlexWrapper height="100%" width="100%">
				<Icon icon="flag" size="3rem" />
				<p class="option-text">Reports</p>
			</FlexWrapper>
		</a>
		<a href="/admin/status" class="option">
			<FlexWrapper height="100%" width="100%">
				<Icon icon="policy_alert" size="3rem" />
				<p class="option-text">Status</p>
			</FlexWrapper>
		</a>
	</FlexWrapper>
</FlexWrapper>

<style>
	.profile {
		border-radius: 50%;
	}

	h1 {
		text-align: center;
		font-size: 1.85rem;
	}

	h2 {
		text-align: center;
	}

	.option {
		text-decoration: none;
		color: var(--token-color-text-default-normal);
		text-align: center;
		border-radius: 2rem;
		background-color: var(--token-color-surface-raised-normal);
		padding: 1rem;
		transition:
			transform 0.4s ease,
			box-shadow 0.4s ease;
		height: 8rem;
		width: 4rem;
	}

	.option:hover {
		background-color: var(--token-color-surface-raised-hover);
		transform: scale(1.05);
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
	}

	.option:active,
	.option:focus {
		background-color: var(--token-color-surface-raised-pressed);
	}

	.option:focus {
		outline: 2px solid var(--token-color-focusring);
	}

	.option-text {
		line-height: 1.2;
	}
</style>
