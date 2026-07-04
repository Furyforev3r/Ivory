<script lang="ts">
    import { onMount } from "svelte"
    import axios from "axios"
    import { formatDistanceToNow } from "date-fns"
    import { ptBR } from "date-fns/locale"
    import { goto } from "$app/navigation"
    import Skeleton from "./+Skeleton.svelte"
    import { tokenizeMentions } from "$lib/client/utils/mentions"

    export let reply: any

    function goToMention(event: Event, username: string) {
        event.preventDefault()
        event.stopPropagation()
        goto(`/${username}`)
    }

    let author: any = null

    onMount(async () => {
        try {
            const response = await axios.get(`/api/getSimpleUser?uid=${reply.userUID}`)
            if (response.status === 200) author = response.data.user
        } catch (error) {
            console.error(error)
        }
    })

    function formatTimestamp(uploadDate: any) {
        const dataUpload = new Date(uploadDate._seconds * 1000 + uploadDate._nanoseconds / 1000000)
        return formatDistanceToNow(dataUpload, { locale: ptBR, addSuffix: true })
    }
</script>

<div class="replyContainer">
    {#if !author}
        <Skeleton circle width="40px" height="40px" />
        <div class="lines">
            <Skeleton width="30%" height="12px" />
            <Skeleton width="80%" height="12px" />
        </div>
    {:else}
        <a href={`/${author.username}`}>
            <img class="userPic" alt={author.displayName} src={author.photoURL} width="40px" height="40px" loading="lazy" decoding="async" />
        </a>
        <div class="replyContent">
            <div class="replyInfo">
                <p class="displayName">{author.displayName}</p>
                <p class="username">@{author.username}</p>
                <span class="username">·</span>
                <p class="username">{formatTimestamp(reply.uploadDate)}</p>
            </div>
            <p class="content">{#each tokenizeMentions(reply.content) as token}{#if token.type === "mention"}<span class="mention" role="link" tabindex="0" on:click={(e) => goToMention(e, token.value)} on:keydown={(e) => { if (e.key === "Enter") goToMention(e, token.value) }}>@{token.value}</span>{:else}{token.value}{/if}{/each}</p>
        </div>
    {/if}
</div>

<style>
    .replyContainer {
        display: flex;
        flex-direction: row;
        gap: 0.7rem;
        padding: 0.8rem 1rem;
        border-bottom: 1px solid var(--gainsboro);
    }

    .userPic {
        width: 40px;
        height: 40px;
        min-width: 40px;
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
        gap: 0.1rem;
        min-width: 0;
    }

    .replyInfo {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.3rem;
    }

    .displayName {
        font-weight: 600;
        font-size: 14px;
    }

    .username {
        color: var(--text-subdued);
        font-size: 13px;
    }

    .content {
        word-break: break-word;
        font-size: 15px;
    }

    .mention {
        cursor: pointer;
        color: var(--essential-announcement);
    }

    .mention:hover {
        text-decoration: underline;
    }

    .lines {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex-grow: 1;
        padding-top: 0.3rem;
    }
</style>
