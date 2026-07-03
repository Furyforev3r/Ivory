<script lang="ts">
    import Icon from "@iconify/svelte"
    import { onMount } from "svelte"
    import axios from "axios"
    import { formatDistanceToNow } from "date-fns"
    import { ptBR } from "date-fns/locale"
    import { user } from "$lib/client/hooks/loginState"
    import toast from "svelte-french-toast"
    import PostSkeleton from "./+PostSkeleton.svelte"
    import QuoteModal from "./+QuoteModal.svelte"
    import { shareLink } from "$lib/client/utils/share"

    export let post: any
    export let compact = false

    let userInfo: any
    $: userInfo = $user

    let author: any = null
    let originalPost: any = null
    let originalAuthor: any = null

    let liked = false
    let reposted = false
    let likesCount = 0
    let repliesCount = 0
    let repostsCount = 0
    let busyLike = false
    let busyRepost = false
    let showRepostMenu = false
    let quoting = false

    $: isPureRepost = !!post?.repostOf && !post?.content
    $: isQuoteRepost = !!post?.repostOf && !!post?.content

    onMount(async () => {
        likesCount = post.likesCount ?? 0
        repliesCount = post.repliesCount ?? 0
        repostsCount = post.repostsCount ?? 0

        try {
            const response = await axios.get(`/api/getSimpleUser?uid=${post.userUID}`)
            if (response.status === 200) author = response.data.user
        } catch (error) {
            console.error(error)
        }

        if (post.repostOf) {
            try {
                const response = await axios.get(`/api/getPostByUID?uid=${post.repostOf}`)
                if (response.status === 200) {
                    originalPost = response.data.post
                    const authorResponse = await axios.get(`/api/getSimpleUser?uid=${originalPost.userUID}`)
                    if (authorResponse.status === 200) originalAuthor = authorResponse.data.user
                }
            } catch (error) {
                console.error(error)
            }
        }

        if (!compact && userInfo && userInfo !== "Loading...") {
            try {
                const response = await axios.get(`/api/getPostViewerState?postUID=${post.id}&uid=${userInfo.uid}`)
                if (response.status === 200) {
                    liked = response.data.liked
                    reposted = response.data.reposted
                }
            } catch (error) {
                console.error(error)
            }
        }
    })

    function formatTimestamp(uploadDate: any) {
        const dataUpload = new Date(uploadDate._seconds * 1000 + uploadDate._nanoseconds / 1000000)

        return formatDistanceToNow(dataUpload, { locale: ptBR, addSuffix: true })
    }

    function requireAuth() {
        if (!userInfo || userInfo === "Loading...") {
            toast.error("You need to be logged in")
            return false
        }
        return true
    }

    async function handleLike(event: Event) {
        event.preventDefault()
        event.stopPropagation()

        if (busyLike || !requireAuth()) return

        busyLike = true
        const wasLiked = liked
        liked = !wasLiked
        likesCount += liked ? 1 : -1

        try {
            await axios.post(`/api/toggleLike?token=${userInfo.accessToken}&uid=${userInfo.uid}`, { postUID: post.id })
        } catch (error) {
            liked = wasLiked
            likesCount += wasLiked ? 1 : -1
            toast.error("Could not update like")
        } finally {
            busyLike = false
        }
    }

    function toggleRepostMenu(event: Event) {
        event.preventDefault()
        event.stopPropagation()

        if (!requireAuth()) return

        showRepostMenu = !showRepostMenu
    }

    function closeRepostMenu() {
        showRepostMenu = false
    }

    async function handleRepost(event: Event) {
        event.preventDefault()
        event.stopPropagation()
        showRepostMenu = false

        if (busyRepost) return

        busyRepost = true
        try {
            if (reposted) {
                await axios.delete(`/api/repost?token=${userInfo.accessToken}&uid=${userInfo.uid}&postUID=${post.id}`)
                reposted = false
                repostsCount = Math.max(0, repostsCount - 1)
                toast.success("Repost removed")
            } else {
                await axios.post(`/api/repost?token=${userInfo.accessToken}&uid=${userInfo.uid}`, { postUID: post.id, quote: "" })
                reposted = true
                repostsCount += 1
                toast.success("Reposted")
            }
        } catch (error) {
            toast.error("Could not repost")
        } finally {
            busyRepost = false
        }
    }

    function openQuote(event: Event) {
        event.preventDefault()
        event.stopPropagation()
        showRepostMenu = false
        quoting = true
    }

    async function submitQuote(event: CustomEvent<{ quote: string }>) {
        busyRepost = true
        try {
            await axios.post(`/api/repost?token=${userInfo.accessToken}&uid=${userInfo.uid}`, {
                postUID: post.id,
                quote: event.detail.quote
            })
            reposted = true
            repostsCount += 1
            toast.success("Reposted")
        } catch (error) {
            toast.error("Could not repost")
        } finally {
            busyRepost = false
            quoting = false
        }
    }

    async function handleShare(event: Event) {
        event.preventDefault()
        event.stopPropagation()

        const url = `${location.origin}/post/${post.id}`
        const result = await shareLink(url, "Ivory post")

        if (result === "copied") toast.success("Link copied to clipboard")
        else if (result === "failed") toast.error("Could not share")
    }
</script>

<svelte:window on:click={closeRepostMenu} />

{#if isPureRepost}
    <div class="repostGroup">
        <div class="repostLabel">
            <Icon icon="mdi:repost" width="16" height="16" />
            {#if author}
                <span>{author.displayName} reposted</span>
            {:else}
                <span>Reposted</span>
            {/if}
        </div>
        {#if originalPost}
            <svelte:self post={originalPost} />
        {:else}
            <PostSkeleton />
        {/if}
    </div>
{:else}
    <a class="postContainer" class:compact href={`/post/${post.id}`}>
        {#if !author || !post}
            <PostSkeleton />
        {:else}
            <a href={`/${author.username}`}>
                <img class="userPic" alt={author.displayName} src={author.photoURL} width="52px" height="52px" loading="lazy" decoding="async" />
            </a>
            <div class="postContentContainer">
                <div class="postInfo">
                    <p class="displayName">{author.displayName}</p>
                    <p class="username">@{author.username}</p>
                    <span class="username">·</span>
                    <p class="username">{formatTimestamp(post.uploadDate)}</p>
                </div>
                <div class="postContent">
                    {#if post.content}
                        <p class="content">{post.content}</p>
                    {/if}
                    {#if post.image}
                        <img class="postImage" src={post.imageURL} alt="Post attachment" loading="lazy" decoding="async">
                    {/if}
                    {#if isQuoteRepost}
                        {#if originalPost && originalAuthor}
                            <div class="embeddedPost">
                                <div class="embeddedHead">
                                    <img src={originalAuthor.photoURL} alt={originalAuthor.displayName} width="20" height="20" />
                                    <p class="displayName">{originalAuthor.displayName}</p>
                                    <p class="username">@{originalAuthor.username}</p>
                                </div>
                                <p class="content">{originalPost.content}</p>
                                {#if originalPost.image}
                                    <img class="postImage" src={originalPost.imageURL} alt="Quoted attachment" loading="lazy" decoding="async">
                                {/if}
                            </div>
                        {:else}
                            <div class="embeddedPost">
                                <PostSkeleton />
                            </div>
                        {/if}
                    {/if}
                </div>
                {#if !compact}
                    <div class="postIcons">
                        <div class="icon">
                            <Icon icon="bx:comment" width="20px" height="20px" />
                            {#if repliesCount > 0}<span class="count">{repliesCount}</span>{/if}
                        </div>
                        <div class="icon repostWrap">
                            <button
                                type="button"
                                class="iconButton repostButton"
                                class:active={reposted}
                                on:click={toggleRepostMenu}
                                aria-label="Repost"
                            >
                                <Icon icon="mdi:repost" width="20px" height="20px" />
                            </button>
                            {#if repostsCount > 0}<span class="count repostCount" class:activeText={reposted}>{repostsCount}</span>{/if}
                            {#if showRepostMenu}
                                <div class="repostMenu" role="menu">
                                    <button type="button" on:click={handleRepost}>
                                        <Icon icon="mdi:repost" width="18" height="18" />
                                        {reposted ? "Undo repost" : "Repost"}
                                    </button>
                                    <button type="button" on:click={openQuote}>
                                        <Icon icon="material-symbols:format-quote-rounded" width="18" height="18" />
                                        Quote
                                    </button>
                                </div>
                            {/if}
                        </div>
                        <button type="button" class="icon iconButton likeButton" class:active={liked} on:click={handleLike} aria-label="Like">
                            <Icon icon={liked ? "mdi:heart" : "mdi:heart-outline"} width="20px" height="20px" />
                            {#if likesCount > 0}<span class="count likeCount" class:activeText={liked}>{likesCount}</span>{/if}
                        </button>
                        <button type="button" class="icon iconButton" on:click={handleShare} aria-label="Share">
                            <Icon icon="material-symbols:ios-share" width="18px" height="18px" />
                        </button>
                    </div>
                {/if}
            </div>
        {/if}
    </a>
{/if}

{#if quoting}
    <QuoteModal {originalPost} {originalAuthor} on:submit={submitQuote} on:cancel={() => quoting = false} />
{/if}

<style>
    .repostGroup {
        display: flex;
        flex-direction: column;
    }

    .repostLabel {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.4rem;
        padding: 0.6rem 1rem 0;
        color: var(--text-subdued);
        font-size: 13px;
        font-weight: 600;
    }

    .postContainer {
        cursor: pointer;
        display: flex;
        flex-direction: row;
        gap: 0.8rem;
        padding: 1rem;
        border-block: 1px solid var(--gainsboro);
        flex-grow: 1;
        transition: 0.2s background;
        text-decoration: none;
        color: var(--text-base);
    }

    .postContainer.compact {
        border: 1px solid var(--gainsboro);
        border-radius: 0.8rem;
        padding: 0.7rem;
    }

    .postContainer:hover {
        background: var(--background-highlight);
    }

    .userPic {
        min-width: 52px;
        border-radius: 50%;
        object-fit: cover;
        border: 1px solid var(--gainsboro);
        background: var(--background-elevated-highlight);
    }

    .postContentContainer {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
        min-width: 0;
        flex-grow: 1;
    }

    .postInfo {
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

    .postContent {
        padding: 0.3rem;
    }

    .content {
        word-break: break-word;
    }

    .postImage {
        margin-top: 0.3rem;
        object-fit: cover;
        max-height: 400px;
        min-width: 50%;
        max-width: 100%;
        border-radius: 0.8rem;
        background: var(--background-elevated-highlight);
        border: 1px solid var(--gainsboro);
    }

    .embeddedPost {
        margin-top: 0.5rem;
        border: 1px solid var(--gainsboro);
        border-radius: 0.8rem;
        padding: 0.7rem;
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }

    .embeddedHead {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.4rem;
    }

    .embeddedHead img {
        border-radius: 50%;
        object-fit: cover;
        background: var(--background-elevated-highlight);
    }

    .embeddedHead .displayName {
        font-size: 14px;
    }

    .embeddedHead .username {
        font-size: 13px;
    }

    .embeddedPost .content {
        font-size: 14px;
    }

    .postIcons {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 1.6rem;
        margin-top: 0.3rem;
    }

    .icon, .iconButton {
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

    .icon :global(svg), .iconButton :global(svg) {
        color: var(--text-subdued);
    }

    .icon:hover, .iconButton:hover {
        background: var(--background-press);
        color: var(--essential-announcement);
    }

    .icon:hover :global(svg), .iconButton:hover :global(svg) {
        color: var(--essential-announcement);
    }

    .repostButton:hover, .repostButton:hover :global(svg) {
        color: var(--essential-repost);
    }

    .repostButton.active,
    .repostButton.active :global(svg) {
        color: var(--essential-repost);
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

    .repostCount.activeText {
        color: var(--essential-repost);
    }

    .likeCount.activeText {
        color: var(--essential-like);
    }

    .repostWrap {
        padding: 0;
    }

    .repostMenu {
        position: absolute;
        bottom: 100%;
        left: 0;
        margin-bottom: 0.4rem;
        background: var(--background-base);
        border: 1px solid var(--gainsboro);
        border-radius: 0.8rem;
        box-shadow: 0 10px 30px var(--shadow-color);
        display: flex;
        flex-direction: column;
        min-width: 180px;
        overflow: hidden;
        z-index: 50;
    }

    .repostMenu button {
        cursor: pointer;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.6rem;
        padding: 0.8rem 1rem;
        border: none;
        background: none;
        color: var(--text-base);
        font-size: 14px;
        font-weight: 600;
        text-align: left;
    }

    .repostMenu button:hover {
        background: var(--background-highlight);
    }

    @media (max-width: 800px) {
        .postContainer {
            width: 100%;
        }

        .postInfo {
            flex-direction: column;
            gap: 0.1rem;
            align-items: start;
        }

        .displayName {
            font-size: 14px;
        }

        .username {
            font-size: 14px;
        }

        .postInfo span {
            display: none;
        }

        .postIcons {
            gap: 1rem;
        }
    }
</style>
