<script lang="ts">
	export let id: string = "totp-" + Math.random().toString(36).substring(2, 8);
	export let label: string = "TOTP Code";
	export let value: string = ""; // 6-character string
	export let disabled: boolean = false;
	export let invalid: boolean = false;
	export let required: boolean = false;
	export let onComplete: (code: string) => void = () => {};
	export let width = "100%";

	import { onMount } from "svelte";

	let inputs: HTMLInputElement[] = [];
	let digits: string[] = Array(6).fill("");

	// Initialize digits from initial value
	$: if (value) {
		digits = value.padEnd(6, "").slice(0, 6).split("");
	}

	function handleInput(event: Event, index: number) {
		const target = event.target as HTMLInputElement;
		const val = target.value.slice(-1); // only last character
		digits[index] = val;
		value = digits.join(""); // update value manually
		if (val && index < 5) {
			inputs[index + 1].focus();
		}
		checkComplete();
	}

	function handleKeyDown(event: KeyboardEvent, index: number) {
		const target = event.target as HTMLInputElement;

		if (event.key === "Backspace") {
			if (!target.value && index > 0) {
				inputs[index - 1].focus();
			}
		} else if (event.key === "ArrowLeft" && index > 0) {
			inputs[index - 1].focus();
		} else if (event.key === "ArrowRight" && index < 5) {
			inputs[index + 1].focus();
		}
	}

	function checkComplete() {
		if (digits.every((d) => d !== "")) {
			onComplete(value);
		}
	}

	onMount(() => {
		if (inputs[0]) inputs[0].focus();
	});
</script>

<div class="input-root" style="width: {width};">
	<label for={id} class="centered-label">
		{label}
		{#if required}
			<span aria-hidden="true" style="color: red;">*</span>
		{/if}
	</label>

	<div class="totp-inputs">
		{#each Array(6), i (i)}
			<input
				bind:this={inputs[i]}
				type="text"
				inputmode="numeric"
				pattern="[0-9]*"
				maxlength="1"
				{disabled}
				aria-required={required}
				aria-invalid={invalid}
				id={id + "-" + i}
				value={digits[i]}
				on:input={(e) => handleInput(e, i)}
				on:keydown={(e) => handleKeyDown(e, i)}
			/>
		{/each}
	</div>
</div>

<style>
	.input-root {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.centered-label {
		font-size: 1rem;
		font-weight: 500;
		text-align: center;
	}

	.totp-inputs {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
	}

	.totp-inputs input {
		all: unset;
		border: 1px solid transparent;
		border-radius: 8px;
		cursor: text;
		padding: 0.5rem;
		width: 1.5rem;
		height: 1.5rem;
		text-align: center;
		font-family: var(--token-font-main);
		font-size: 1rem;
		background-color: var(--token-color-surface-raised-normal);
		transition: border-color 0.2s;
	}

	.totp-inputs input:focus {
		border-color: var(--token-color-primary);
		outline: none;
	}

	.totp-inputs input[aria-invalid="true"] {
		border-color: var(--token-color-text-danger);
	}
</style>
