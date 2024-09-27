<script lang="ts">
    import { goto } from "$app/navigation"
    import { user } from "$lib/client/hooks/loginState"
    import { logout } from "$lib/client/utils/firebaseUtils"
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
    <h1 on:click={logout}>Hello World!</h1>
</main>

<style>
    .main {
        display: grid;
        place-items: center;
        height: 100dvh;
    }
</style>