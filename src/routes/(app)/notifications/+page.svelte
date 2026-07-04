<script lang="ts">
    import { onMount } from "svelte"
    import axios from "axios"
    import toast from "svelte-french-toast"
    import { user } from "$lib/client/hooks/loginState"
    import { notifications, lastRead, loadNotifications, markSeen } from "$lib/client/hooks/notificationsState"
    import NotificationItem from "$lib/components/+NotificationItem.svelte"
    import Skeleton from "$lib/components/+Skeleton.svelte"

    let userInfo: any
    $: userInfo = $user

    let loading = true
    let activeTab: "all" | "requests" = "all"
    let requests: any[] | null = null
    let respondingUID: string | null = null

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

    async function selectTab(tab: "all" | "requests") {
        activeTab = tab
        if (tab === "requests" && requests === null) {
            await loadRequests()
        }
    }

    async function loadRequests() {
        if (!userInfo || userInfo === "Loading...") return

        try {
            const response = await axios.get(`/api/getFollowRequests?uid=${userInfo.uid}&token=${userInfo.accessToken}`)
            requests = response.data.requests
        } catch (error) {
            toast.error("Could not load follow requests")
            requests = []
        }
    }

    async function respond(requesterUID: string, accept: boolean) {
        if (respondingUID) return

        respondingUID = requesterUID
        try {
            await axios.post(`/api/respondFollowRequest?uid=${userInfo.uid}&token=${userInfo.accessToken}`, {
                requesterUID,
                accept
            })
            if (requests) requests = requests.filter(request => request.requesterUID !== requesterUID)
            toast.success(accept ? "Follow request accepted" : "Follow request declined")
        } catch (error) {
            toast.error("Could not respond to follow request")
        } finally {
            respondingUID = null
        }
    }
</script>

<svelte:head>
    <title>Ivory - Notifications</title>
</svelte:head>

<div class="content">
    <div class="header">
        <h2>Notifications</h2>
        <div class="tabs">
            <button type="button" class:selected={activeTab === "all"} on:click={() => selectTab("all")}>All</button>
            <button type="button" class:selected={activeTab === "requests"} on:click={() => selectTab("requests")}>Requests</button>
        </div>
    </div>
    {#if activeTab === "all"}
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
    {:else}
        <div class="list">
            {#if requests === null}
                {#each Array(3) as _}
                    <div class="skeletonRow">
                        <Skeleton circle width="40px" height="40px" />
                        <Skeleton width="50%" height="14px" />
                    </div>
                {/each}
            {:else if requests.length === 0}
                <p class="empty">No pending follow requests.</p>
            {:else}
                {#each requests as request (request.requesterUID)}
                    <div class="requestRow">
                        <a href={`/${request.user.username}`}>
                            <img class="avatar" src={request.user.photoURL} alt={request.user.displayName} width="40" height="40" loading="lazy" />
                        </a>
                        <div class="requestBody">
                            <p class="displayName">{request.user.displayName}</p>
                            <p class="username">@{request.user.username}</p>
                        </div>
                        <div class="requestActions">
                            <button
                                type="button"
                                class="acceptButton"
                                on:click={() => respond(request.requesterUID, true)}
                                disabled={respondingUID === request.requesterUID}
                            >
                                Accept
                            </button>
                            <button
                                type="button"
                                class="declineButton"
                                on:click={() => respond(request.requesterUID, false)}
                                disabled={respondingUID === request.requesterUID}
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                {/each}
            {/if}
        </div>
    {/if}
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
        margin-bottom: 0.8rem;
    }

    .tabs {
        display: flex;
        flex-direction: row;
        gap: 0.4rem;
    }

    .tabs button {
        cursor: pointer;
        padding: 0.6rem 1rem;
        border-radius: 999px;
        border: none;
        background: none;
        color: var(--text-subdued);
        font-weight: 600;
        font-size: 14px;
        transition: background 0.2s, color 0.2s;
    }

    .tabs button:hover {
        background: var(--background-highlight);
    }

    .tabs button.selected {
        background: var(--essential-announcement);
        color: #fff;
    }

    .list {
        display: flex;
        flex-direction: column;
    }

    .requestRow {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.8rem;
        padding: 1rem;
        border-bottom: 1px solid var(--gainsboro);
    }

    .avatar {
        border-radius: 50%;
        object-fit: cover;
        overflow: hidden;
        background: var(--background-elevated-highlight);
        border: 1px solid var(--gainsboro);
        flex-shrink: 0;
    }

    .requestBody {
        flex-grow: 1;
        min-width: 0;
    }

    .displayName {
        font-weight: 700;
    }

    .username {
        color: var(--text-subdued);
        font-size: 13px;
    }

    .requestActions {
        display: flex;
        flex-direction: row;
        gap: 0.5rem;
        flex-shrink: 0;
    }

    .acceptButton, .declineButton {
        cursor: pointer;
        padding: 0.5rem 1rem;
        border-radius: 999px;
        font-weight: 700;
        font-size: 13px;
        border: none;
    }

    .acceptButton {
        background: var(--essential-announcement);
        color: #fff;
    }

    .declineButton {
        background: var(--white-smoke);
        color: var(--text-subdued);
        border: 0.1rem solid var(--background-elevated-press);
    }

    .acceptButton:disabled, .declineButton:disabled {
        opacity: 0.6;
        cursor: default;
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

    @media (max-width: 700px) {
        .content {
            padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px));
        }
    }
</style>
