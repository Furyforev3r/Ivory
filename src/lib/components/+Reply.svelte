<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte"
    import axios from "axios"
    import { formatDistanceToNow } from "date-fns"
    import { ptBR } from "date-fns/locale"
    import { goto } from "$app/navigation"
    import { user } from "$lib/client/hooks/loginState"
    import toast from "svelte-french-toast"
    import Icon from "@iconify/svelte"
    import Skeleton from "./+Skeleton.svelte"
    import UserBadges from "./+UserBadges.svelte"
    import { tokenizeMentions } from "$lib/client/utils/mentions"

    export let reply: any
    export let allReplies: any[] = []
    export let depth = 0

    const dispatch = createEventDispatcher()

    $: children = allReplies.filter((r) => r.parentReplyUID === reply.id)
    $: indent = Math.min(depth, 4)

    let userInfo: any
    $: userInfo = $user

    function goToMention(event: Event, username: string) {
        event.preventDefault()
        event.stopPropagation()
        goto(`/${username}`)
    }

    let author: any = null
    let liked = false
    let likesCount = 0
    let busyLike = false

    onMount(async () => {
        likesCount = reply.likesCount ?? 0

        try {
            const response = await axios.get(`/api/getSimpleUser?uid=${reply.userUID}`)
            if (response.status === 200) author = response.data.user
        } catch (error) {
            console.error(error)
        }

        if (userInfo && userInfo !== "Loading...") {
            try {
                const response = await axios.get(`/api/getReplyViewerState?replyUID=${reply.id}&uid=${userInfo.uid}`)
                if (response.status === 200) liked = response.data.liked
            } catch (error) {
                console.error(error)
            }
        }
    })

    function formatTimestamp(uploadDate: any) {
        const dataUpload = new Date(uploadDate._seconds * 1000 + uploadDate._nanoseconds / 1000000)
        return formatDistanceToNow(dataUpload, { locale: ptBR, addSuffix: true })
    }

    async function handleLike() {
        if (busyLike) return

        if (!userInfo || userInfo === "Loading...") {
            toast.error("You need to be logged in")
            return
        }

        busyLike = true
        const wasLiked = liked
        liked = !wasLiked
        likesCount += liked ? 1 : -1

        try {
            await axios.post(`/api/toggleReplyLike?token=${userInfo.accessToken}&uid=${userInfo.uid}`, { replyUID: reply.id })
        } catch (error) {
            liked = wasLiked
            likesCount += wasLiked ? 1 : -1
            toast.error("Could not update like")
        } finally {
            busyLike = false
        }
    }

    function handleReplyClick() {
        if (!author) return
        dispatch("reply", { replyUID: reply.id, username: author.username })
    }
</script>

<div class="replyWrapper" style={`margin-left:${indent * 1.6}rem`}>
    <div class="replyContainer">
        {#if !author}
            <Skeleton circle width="48px" height="48px" />
            <div class="lines">
                <Skeleton width="30%" height="12px" />
                <Skeleton width="80%" height="12px" />
            </div>
        {:else}
            <a href={`/${author.username}`}>
                <img class="userPic" alt={author.displayName} src={author.photoURL} width="48px" height="48px" loading="lazy" decoding="async" />
            </a>
            <div class="replyContent">
                <div class="replyInfo">
                    <p class="displayName">{author.displayName}</p>
                    <UserBadges verified={author.verified} admin={author.admin} size="14" />
                    <p class="username">@{author.username}</p>
                    <span class="username">·</span>
                    <p class="username">{formatTimestamp(reply.uploadDate)}</p>
                </div>
                <p class="content">{#each tokenizeMentions(reply.content) as token}{#if token.type === "mention"}<span class="mention" role="link" tabindex="0" on:click={(e) => goToMention(e, token.value)} on:keydown={(e) => { if (e.key === "Enter") goToMention(e, token.value) }}>@{token.value}</span>{:else}{token.value}{/if}{/each}</p>
                <div class="replyIcons">
                    <button type="button" class="iconButton" on:click={handleReplyClick} aria-label="Reply">
                        <Icon icon="bx:comment" width="18px" height="18px" />
                    </button>
                    <button type="button" class="iconButton likeButton" class:active={liked} on:click={handleLike} aria-label="Like">
                        <Icon icon={liked ? "mdi:heart" : "mdi:heart-outline"} width="18px" height="18px" />
                        {#if likesCount > 0}<span class="count" class:activeText={liked}>{likesCount}</span>{/if}
                    </button>
                </div>
            </div>
        {/if}
    </div>
    {#each children as child (child.id)}
        <svelte:self reply={child} {allReplies} depth={depth + 1} on:reply />
    {/each}
</div>

<style>
    .replyWrapper {
        display: flex;
        flex-direction: column;
    }

    .replyContainer {
        display: flex;
        flex-direction: row;
        gap: 0.8rem;
        padding: 1rem;
        border-bottom: 1px solid var(--gainsboro);
    }

    .userPic {
        width: 48px;
        height: 48px;
        min-width: 48px;
        flex-shrink: 0;
        border-radius: 50%;
        object-fit: cover;
        overflow: hidden;
        border: 1px solid var(--gainsboro);
        background: var(--background-elevated-highlight);
    }

    .replyContent {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        min-width: 0;
        flex-grow: 1;
    }

    .replyInfo {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.3rem;
    }

    .displayName {
        font-weight: 600;
    }

    .username {
        color: var(--text-subdued);
        font-size: 16px;
    }

    .content {
        word-break: break-word;
    }

    .mention {
        cursor: pointer;
        color: var(--essential-announcement);
    }

    .mention:hover {
        text-decoration: underline;
    }

    .replyIcons {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 1.4rem;
        margin-top: 0.4rem;
    }

    .iconButton {
        position: relative;
        border-radius: 999px;
        padding: 0.3rem;
        cursor: pointer;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.3rem;
        border: none;
        background: none;
        color: var(--text-subdued);
    }

    .iconButton :global(svg) {
        color: var(--text-subdued);
    }

    .iconButton:hover {
        background: var(--background-press);
        color: var(--essential-announcement);
    }

    .iconButton:hover :global(svg) {
        color: var(--essential-announcement);
    }

    .likeButton:hover, .likeButton:hover :global(svg) {
        color: var(--essential-like);
    }

    .likeButton.active,
    .likeButton.active :global(svg) {
        color: var(--essential-like);
    }

    .count {
        font-size: 13px;
        color: var(--text-subdued);
    }

    .count.activeText {
        color: var(--essential-like);
    }

    .lines {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex-grow: 1;
        padding-top: 0.3rem;
    }
</style>
