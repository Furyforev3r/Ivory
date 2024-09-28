<script lang="ts">
    import { goto } from "$app/navigation"
    import { user } from "$lib/client/hooks/loginState"
    import { logout } from "$lib/client/utils/firebaseUtils"
    import { afterUpdate } from "svelte"
    import Icon from "@iconify/svelte"
    import Tabs from "$lib/components/+Tabs.svelte"

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
    {#if userInfo == 'Loading...'}
        <div class="loading">
            <Icon icon="svg-spinners:3-dots-move" width="6rem" height="6rem" style="color: black" />
        </div>
    {:else if userInfo}
        <Tabs userUID={userInfo.uid} />
    {/if}

</main>

<style>
    .main {
        height: 100dvh;
    }

    .loading {
        display: grid;
        place-items: center;
        height: 100%;        
    }
</style>