<script lang="ts">
    import { onMount } from "svelte"
    import { user } from "$lib/client/hooks/loginState"
    import { notifications, lastRead, loadNotifications, markSeen } from "$lib/client/hooks/notificationsState"
    import NotificationItem from "$lib/components/+NotificationItem.svelte"
    import Skeleton from "$lib/components/+Skeleton.svelte"

    let userInfo: any
    $: userInfo = $user

    let loading = true

    function toMillis(timestamp: any) {
        if (!timestamp) return 0
        if (timestamp._seconds) return timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1e6
        return 0
    }

    onMount(async () => {
        if (userInfo && userInfo !== "Loading...") {
            await loadNotifications(userInfo.uid, userInfo.accessToken)
            loading = false
            await markSeen(userInfo.uid, userInfo.accessToken)
        }
    })
</script>

<svelte:head>
    <title>Ivory - Notifications</title>
</svelte:head>

<div class="content">
    <div class="header">
        <h2>Notifications</h2>
    </div>
    <div class="list">
        {#if loading}
            {#each Array(5) as _}
                <div class="skeletonRow">
                    <Skeleton circle width="40px" height="40px" />
                    <Skeleton width="50%" height="14px" />
                </div>
            {/each}
        {:else if $notifications.length === 0}
            <p class="empty">No notifications yet.</p>
        {:else}
            {#each $notifications as notification (notification.id)}
                <NotificationItem {notification} unread={toMillis(notification.createdAt) > toMillis($lastRead)} />
            {/each}
        {/if}
    </div>
</div>

<style>
    .content {
        flex-grow: 1;
        overflow: auto;
        border-inline: 1px solid var(--gainsboro);
    }

    .header {
        padding: 1rem;
        border-bottom: 1px solid var(--gainsboro);
        position: sticky;
        top: 0;
        background: var(--background-base);
        z-index: 10;
    }

    .header h2 {
        font-size: 20px;
        font-weight: 800;
    }

    .list {
        display: flex;
        flex-direction: column;
    }

    .skeletonRow {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.8rem;
        padding: 1rem;
        border-bottom: 1px solid var(--gainsboro);
    }

    .empty {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--text-subdued);
    }
</style>
