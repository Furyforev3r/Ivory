<script lang="ts">
	import { goto } from "$app/navigation"
    import { user } from "$lib/hooks/loginState"
    import { afterUpdate } from "svelte"

    let userInfo

    $: userInfo = $user
    
    afterUpdate(() => {
        if (!userInfo) {
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