<script lang="ts">
    import Error from "$lib/components/Error.svelte";
	import ProfileLoader from "$lib/components/ProfileLoader.svelte";

    let error = true;
</script>

{#if error}
    <Error pageName="My Davidnet Account" errorMSG="Unimplemented"/>
{:else}
    <h1>My Davidnet Account</h1>
    <ProfileLoader/>
{/if}


<style>
    h1 {
        text-align: center;
        font-size: 1.85rem;
    }
</style>
