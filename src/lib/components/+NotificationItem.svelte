<script lang="ts">
    import { onMount } from "svelte"
    import axios from "axios"
    import Icon from "@iconify/svelte"
    import { formatDistanceToNow } from "date-fns"
    import { ptBR } from "date-fns/locale"
    import Skeleton from "./+Skeleton.svelte"

    export let notification: any
    export let unread = false

    let actor: any = null

    onMount(async () => {
        try {
            const response = await axios.get(`/api/getSimpleUser?uid=${notification.actorUID}`)
            if (response.status === 200) actor = response.data.user
        } catch (error) {
            console.error(error)
        }
    })

    const ICONS: Record<string, string> = {
        follow: "material-symbols:person-add-rounded",
        like: "mdi:heart",
        reply: "bx:comment",
        repost: "mdi:repost",
        post: "material-symbols:campaign-rounded",
        mention: "material-symbols:alternate-email"
    }

    const ICON_COLORS: Record<string, string> = {
        follow: "var(--essential-announcement)",
        like: "var(--essential-like)",
        reply: "var(--essential-announcement)",
        repost: "var(--essential-repost)",
        post: "var(--essential-announcement)",
        mention: "var(--essential-announcement)"
    }

    function actionText(type: string) {
        switch (type) {
            case "follow": return "started following you"
            case "like": return "liked your post"
            case "reply": return "replied to your post"
            case "repost": return "reposted your post"
            case "post": return "posted something new"
            case "mention": return "mentioned you in a post"
            default: return ""
        }
    }

    function href() {
        if (notification.type === "follow") return actor ? `/${actor.username}` : "#"
        return notification.postUID ? `/post/${notification.postUID}` : "#"
    }

    function formatTimestamp(uploadDate: any) {
        const dataUpload = new Date(uploadDate._seconds * 1000 + (uploadDate._nanoseconds || 0) / 1000000)
        return formatDistanceToNow(dataUpload, { locale: ptBR, addSuffix: true })
    }
</script>

<a class="notificationRow" class:unread href={href()}>
    <div class="typeIcon" style={`color:${ICON_COLORS[notification.type] || "var(--text-subdued)"}`}>
        <Icon icon={ICONS[notification.type] || "material-symbols:notifications-outline"} width="20" height="20" />
    </div>
    {#if !actor}
        <Skeleton circle width="40px" height="40px" />
        <div class="lines">
            <Skeleton width="60%" height="14px" />
        </div>
    {:else}
        <img class="avatar" src={actor.photoURL} alt={actor.displayName} width="40" height="40" loading="lazy" />
        <div class="notificationBody">
            <p class="text">
                <span class="displayName">{actor.displayName}</span>
                {actionText(notification.type)}
            </p>
            <p class="timestamp">{formatTimestamp(notification.createdAt)}</p>
        </div>
    {/if}
</a>

<style>
    .notificationRow {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.8rem;
        padding: 1rem;
        border-bottom: 1px solid var(--gainsboro);
        text-decoration: none;
        color: var(--text-base);
        transition: background 0.2s;
    }

    .notificationRow:hover {
        background: var(--background-highlight);
    }

    .notificationRow.unread {
        background: color-mix(in srgb, var(--essential-announcement) 6%, transparent);
    }

    .typeIcon {
        display: grid;
        place-items: center;
        flex-shrink: 0;
    }

    .avatar {
        border-radius: 50%;
        object-fit: cover;
        overflow: hidden;
        background: var(--background-elevated-highlight);
        border: 1px solid var(--gainsboro);
        flex-shrink: 0;
    }

    .notificationBody {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        min-width: 0;
    }

    .text {
        word-break: break-word;
    }

    .displayName {
        font-weight: 700;
    }

    .timestamp {
        color: var(--text-subdued);
        font-size: 13px;
    }

    .lines {
        flex-grow: 1;
    }
</style>
