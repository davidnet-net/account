<script>
	import { Button } from "@davidnet/svelte-ui";
</script>

<h1>No reports found</h1>
<Button
	onClick={() => {
		history.back();
	}}
	iconbefore="arrow_back">Back</Button
>
