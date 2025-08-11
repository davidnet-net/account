<script lang="ts">
	import { FlexWrapper, Loader, Space } from "@davidnet/svelte-ui";

	export let width = "84px";
	export let height = "84px";
</script>

<FlexWrapper direction="column" justifycontent="center" alignitems="center" height="100%" width="100%">
	<span style="width: {width}; height: {height};" class="loader"></span>
	<Space height="var(--token-space-6)" />
	<Loader />
</FlexWrapper>

<style>
	.loader {
		position: relative;
		overflow: hidden;
	}

	.loader:before,
	.loader:after {
		content: "";
		position: absolute;
		left: 50%;
		bottom: 0;
		width: 90%;
		height: 90%;
		border-radius: 50%;
		background: var(--token-color-text-default-normal);
		transform: translate(-50%, 100%) scale(0);
		animation: push 2s infinite ease-in;
	}
	.loader:after {
		animation-delay: 1s;
	}
	@keyframes push {
		0% {
			transform: translate(-50%, 100%) scale(1);
		}
		15%,
		25% {
			transform: translate(-50%, 50%) scale(1);
		}
		50%,
		75% {
			transform: translate(-50%, -30%) scale(0.5);
		}
		80%,
		100% {
			transform: translate(-50%, -50%) scale(0);
		}
	}
</style>
