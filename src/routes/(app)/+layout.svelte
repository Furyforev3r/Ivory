<script lang="ts">
    import { goto } from "$app/navigation"
    import { browser } from "$app/environment"
    import { user } from "$lib/client/hooks/loginState"
    import Tabs from "$lib/components/+Tabs.svelte"
    import Discover from "$lib/components/+Discover.svelte"
    import Skeleton from "$lib/components/+Skeleton.svelte"

    let userInfo

    $: userInfo = $user
    $: if (browser && userInfo === null) goto("/login")
</script>

<main class="appShell">
    {#if userInfo === "Loading..."}
        <div class="shellSkeleton">
            <div class="skeletonTabs">
                <Skeleton circle width="56px" height="56px" />
                <Skeleton width="80%" height="18px" />
                <Skeleton width="80%" height="18px" />
                <Skeleton width="80%" height="18px" />
                <Skeleton width="80%" height="18px" />
            </div>
            <div class="skeletonContent">
                <Skeleton width="100%" height="22px" />
                {#each Array(5) as _}
                    <div class="skeletonPost">
                        <Skeleton circle width="52px" height="52px" />
                        <div class="skeletonLines">
                            <Skeleton width="40%" height="14px" />
                            <Skeleton width="90%" height="14px" />
                        </div>
                    </div>
                {/each}
            </div>
            <div class="skeletonDiscover">
                <Skeleton width="100%" height="42px" radius="1rem" />
                <Skeleton width="100%" height="80px" radius="0.6rem" />
            </div>
        </div>
    {:else if userInfo}
        <Tabs />
        <slot />
        <Discover />
    {/if}
</main>

<style>
    .appShell {
        height: 100dvh;
        display: flex;
        flex-direction: row;
        overflow: hidden;
    }

    .shellSkeleton {
        display: flex;
        flex-direction: row;
        width: 100%;
        height: 100%;
    }

    .skeletonTabs {
        min-width: 25%;
        max-width: 25%;
        padding: 1.2rem;
        display: flex;
        flex-direction: column;
        gap: 1.4rem;
        background: var(--background-elevated-base);
    }

    .skeletonContent {
        flex-grow: 1;
        border-inline: 1px solid var(--gainsboro);
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .skeletonPost {
        display: flex;
        flex-direction: row;
        gap: 0.8rem;
        padding: 1rem 0;
        border-bottom: 1px solid var(--gainsboro);
    }

    .skeletonLines {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        flex-grow: 1;
        padding-top: 0.3rem;
    }

    .skeletonDiscover {
        min-width: 25%;
        max-width: 25%;
        padding: 1.2rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        background: var(--background-elevated-base);
    }

    @media (max-width: 800px) {
        .skeletonTabs {
            min-width: 15%;
            max-width: 15%;
            align-items: center;
        }

        .skeletonDiscover {
            display: none;
        }
    }
</style>
