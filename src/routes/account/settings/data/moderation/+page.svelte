<script>
	import { Button } from "@davidnet/svelte-ui";

</script>
<h1>No reports found</h1>
<p style="color: red;">Reports cannot be viewed YET.</p>
<Button
	onClick={() => {
		history.back();
	}}
	iconbefore="arrow_back">Back</Button
>
