<script lang="ts">
	import { goto } from '$app/navigation'
    import { onMount } from 'svelte'

    let login: bool = false

    onMount(() => {   
        if (!login) {
            goto("/login")
        }
    })
</script>

<svelte:head>
	<title>Ivory</title>
	<meta name="description" content="Ivory!" />
</svelte:head>

<main class="main">
	<h1>Hello World!</h1>
</main>

<style>
    .main {
        display: grid;
        place-items: center;
        height: 100dvh;
    }
</style>