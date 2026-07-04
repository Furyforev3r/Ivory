<script lang="ts">
    import Icon from "@iconify/svelte"
    import { onMount, createEventDispatcher } from "svelte"
    import axios from "axios"
    import autosize from "svelte-autosize"
    import { formatDistanceToNow } from "date-fns"
    import { ptBR } from "date-fns/locale"
    import { user } from "$lib/client/hooks/loginState"
    import { account } from "$lib/client/hooks/accountState"
    import toast from "svelte-french-toast"
    import { fade, scale } from "svelte/transition"
    import { goto } from "$app/navigation"
    import PostSkeleton from "./+PostSkeleton.svelte"
    import QuoteModal from "./+QuoteModal.svelte"
    import UserBadges from "./+UserBadges.svelte"
    import ImageLightbox from "./+ImageLightbox.svelte"
    import { shareLink } from "$lib/client/utils/share"
    import { tokenizeMentions } from "$lib/client/utils/mentions"

    let lightboxSrc: string | null = null

    function openLightbox(event: Event, src: string) {
        event.preventDefault()
        event.stopPropagation()
        lightboxSrc = src
    }

    function closeLightbox() {
        lightboxSrc = null
    }

    function goToMention(event: Event, username: string) {
        event.preventDefault()
        event.stopPropagation()
        goto(`/${username}`)
    }

    export let post: any
    export let compact = false
    export let pinned = false
    export let author: any = null

    const dispatch = createEventDispatcher()

    let userInfo: any
    let userAccount: any
    $: userInfo = $user
    $: userAccount = $account

    let originalPost: any = null
    let originalAuthor: any = null
    let originalBlocked = false

    let liked = false
    let reposted = false
    let bookmarked = false
    let likesCount = 0
    let repliesCount = 0
    let repostsCount = 0
    let busyLike = false
    let busyRepost = false
    let busyBookmark = false
    let showRepostMenu = false
    let quoting = false
    let mediaError = false
    let originalMediaError = false

    let menuOpen = false
    let editing = false
    let editContent = ""
    let savingEdit = false
    let deleting = false
    let showHistory = false
    let pinning = false

    let pollVotedOption: number | null = null
    let pollOptions: any[] = []
    let votingPoll = false

    $: pollOptions = post?.poll?.options ?? []
    $: pollTotalVotes = pollOptions.reduce((sum, option) => sum + (option.votes || 0), 0)
    $: pollExpired = !!post?.poll?.expiresAt && post.poll.expiresAt._seconds * 1000 < Date.now()
    $: pollShowResults = pollVotedOption !== null || pollExpired

    const AUDIENCE_LABELS: Record<string, string> = {
        following: "People they follow can reply",
        mentioned: "Only mentioned people can reply"
    }

    $: isOwn = !!userInfo && userInfo !== "Loading..." && userInfo.uid === post?.userUID
    $: isPinnedByAuthor = isOwn && userAccount?.user?.pinnedPostUID === post?.id

    function handleMediaError() {
        mediaError = true
    }

    function handleOriginalMediaError() {
        originalMediaError = true
    }

    $: isPureRepost = !!post?.repostOf && !post?.content
    $: isQuoteRepost = !!post?.repostOf && !!post?.content

    onMount(async () => {
        likesCount = post.likesCount ?? 0
        repliesCount = post.repliesCount ?? 0
        repostsCount = post.repostsCount ?? 0

        if (!author) {
            try {
                const response = await axios.get(`/api/getSimpleUser?uid=${post.userUID}`)
                if (response.status === 200) author = response.data.user
            } catch (error) {
                console.error(error)
            }
        }

        if (post.repostOf) {
            try {
                const viewerParam = userInfo && userInfo !== "Loading..." ? `&viewerUID=${userInfo.uid}` : ""
                const response = await axios.get(`/api/getPostByUID?uid=${post.repostOf}${viewerParam}`)
                if (response.status === 200) {
                    originalPost = response.data.post
                    const authorResponse = await axios.get(`/api/getSimpleUser?uid=${originalPost.userUID}`)
                    if (authorResponse.status === 200) originalAuthor = authorResponse.data.user
                }
            } catch (error: any) {
                if (error?.response?.status === 403) originalBlocked = true
                console.error(error)
            }
        }

        if (!compact && userInfo && userInfo !== "Loading...") {
            try {
                const response = await axios.get(`/api/getPostViewerState?postUID=${post.id}&uid=${userInfo.uid}`)
                if (response.status === 200) {
                    liked = response.data.liked
                    reposted = response.data.reposted
                    bookmarked = response.data.bookmarked
                    pollVotedOption = response.data.pollVotedOption
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

    async function handleBookmark(event: Event) {
        event.preventDefault()
        event.stopPropagation()

        if (busyBookmark || !requireAuth()) return

        busyBookmark = true
        const wasBookmarked = bookmarked
        bookmarked = !wasBookmarked

        try {
            await axios.post(`/api/toggleBookmark?token=${userInfo.accessToken}&uid=${userInfo.uid}`, { postUID: post.id })
            toast.success(bookmarked ? "Added to bookmarks" : "Removed from bookmarks")
        } catch (error) {
            bookmarked = wasBookmarked
            toast.error("Could not update bookmark")
        } finally {
            busyBookmark = false
        }
    }

    async function handleVotePoll(event: Event, optionIndex: number) {
        event.preventDefault()
        event.stopPropagation()

        if (votingPoll || pollVotedOption !== null || pollExpired || !requireAuth()) return

        votingPoll = true
        try {
            const response = await axios.post(`/api/votePoll?token=${userInfo.accessToken}&uid=${userInfo.uid}`, {
                postUID: post.id,
                optionIndex
            })
            post = { ...post, poll: { ...post.poll, options: response.data.options } }
            pollVotedOption = optionIndex
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Could not vote")
        } finally {
            votingPoll = false
        }
    }

    async function handleTogglePin(event: Event) {
        event.preventDefault()
        event.stopPropagation()
        menuOpen = false

        if (pinning) return

        pinning = true
        try {
            const response = await axios.post(`/api/togglePinPost?token=${userInfo.accessToken}&uid=${userInfo.uid}`, {
                postUID: post.id
            })
            account.update(acc => acc ? { ...acc, user: { ...acc.user, pinnedPostUID: response.data.pinnedPostUID } } : acc)
            toast.success(response.data.pinnedPostUID === post.id ? "Post pinned to your profile" : "Post unpinned")
        } catch (error) {
            toast.error("Could not update pin")
        } finally {
            pinning = false
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

    function toggleMenu(event: Event) {
        event.preventDefault()
        event.stopPropagation()
        menuOpen = !menuOpen
    }

    function closeMenu() {
        menuOpen = false
    }

    function startEdit(event: Event) {
        event.preventDefault()
        event.stopPropagation()
        editContent = post.content ?? ""
        editing = true
        menuOpen = false
    }

    function cancelEdit(event: Event) {
        event.preventDefault()
        event.stopPropagation()
        editing = false
    }

    async function saveEdit(event: Event) {
        event.preventDefault()
        event.stopPropagation()

        if (!editContent.trim()) {
            toast.error("Post cannot be empty")
            return
        }

        savingEdit = true
        try {
            const response = await axios.post(`/api/editPost?token=${userInfo.accessToken}&uid=${userInfo.uid}`, {
                postUID: post.id,
                content: editContent
            })
            post = { ...post, ...response.data.post }
            editing = false
            dispatch("edited", { post })
            toast.success("Post updated")
        } catch (error) {
            toast.error("Could not edit post")
        } finally {
            savingEdit = false
        }
    }

    async function handleDelete(event: Event) {
        event.preventDefault()
        event.stopPropagation()
        menuOpen = false

        if (!confirm("Delete this post? This cannot be undone.")) return

        deleting = true
        try {
            await axios.delete(`/api/deletePost?token=${userInfo.accessToken}&uid=${userInfo.uid}&postUID=${post.id}`)
            dispatch("deleted", { id: post.id })
            toast.success("Post deleted")
        } catch (error) {
            toast.error("Could not delete post")
            deleting = false
        }
    }

    function openHistory(event: Event) {
        event.preventDefault()
        event.stopPropagation()
        showHistory = true
    }

    function closeHistory() {
        showHistory = false
    }

    function formatHistoryTimestamp(timestamp: any) {
        if (!timestamp?._seconds) return ""
        const date = new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1e6)
        return formatDistanceToNow(date, { locale: ptBR, addSuffix: true })
    }
</script>

<svelte:window on:click={() => { closeRepostMenu(); closeMenu() }} />

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
        {:else if originalBlocked}
            <p class="privateNotice">This post is from a private account.</p>
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
                {#if pinned}
                    <div class="pinnedLabel">
                        <Icon icon="material-symbols:keep-rounded" width="14" height="14" />
                        <span>Pinned post</span>
                    </div>
                {/if}
                <div class="postInfo">
                    <p class="displayName">{author.displayName}</p>
                    <UserBadges verified={author.verified} admin={author.admin} size="15" />
                    <p class="username">@{author.username}</p>
                    <span class="username">·</span>
                    <p class="username">{formatTimestamp(post.uploadDate)}</p>
                    {#if post.edited}
                        <span class="username">·</span>
                        <button type="button" class="editedLabel" on:click={openHistory}>Post editado</button>
                    {/if}
                    {#if isOwn && !compact}
                        <div class="postMenuWrap">
                            <button type="button" class="iconButton menuButton" on:click={toggleMenu} aria-label="Post options">
                                <Icon icon="material-symbols:more-horiz" width="20px" height="20px" />
                            </button>
                            {#if menuOpen}
                                <div class="postMenu" role="menu">
                                    <button type="button" on:click={handleTogglePin} disabled={pinning}>
                                        <Icon icon="material-symbols:keep-outline" width="18" height="18" />
                                        {isPinnedByAuthor ? "Unpin from profile" : "Pin to profile"}
                                    </button>
                                    <button type="button" on:click={startEdit}>
                                        <Icon icon="material-symbols:edit-outline-rounded" width="18" height="18" />
                                        Edit
                                    </button>
                                    <button type="button" class="dangerItem" on:click={handleDelete} disabled={deleting}>
                                        <Icon icon="material-symbols:delete-outline-rounded" width="18" height="18" />
                                        {deleting ? "Deleting..." : "Delete"}
                                    </button>
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
                <div class="postContent">
                    {#if editing}
                        <div class="editBox" on:click|stopPropagation role="presentation">
                            <textarea use:autosize maxlength="300" bind:value={editContent}></textarea>
                            <div class="editActions">
                                <button type="button" class="cancelEdit" on:click={cancelEdit}>Cancel</button>
                                <button type="button" class="saveEdit" on:click={saveEdit} disabled={savingEdit}>
                                    {savingEdit ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </div>
                    {:else if post.content}
                        <p class="content">{#each tokenizeMentions(post.content) as token}{#if token.type === "mention"}<span class="mention" role="link" tabindex="0" on:click={(e) => goToMention(e, token.value)} on:keydown={(e) => { if (e.key === "Enter") goToMention(e, token.value) }}>@{token.value}</span>{:else}{token.value}{/if}{/each}</p>
                    {/if}
                    {#if post.image && !mediaError && post.mediaType === "video"}
                        <div class="postVideoWrap" on:click|stopPropagation role="presentation">
                            <video class="postVideo" src={post.imageURL} controls preload="metadata" on:error={handleMediaError}></video>
                        </div>
                    {:else if post.image && !mediaError}
                        <button type="button" class="postImageButton" on:click={(e) => openLightbox(e, post.imageURL)}>
                            <img
                                class="postImage"
                                src={post.imageURL}
                                alt="Post attachment"
                                loading="lazy"
                                decoding="async"
                                on:error={handleMediaError}
                            >
                        </button>
                    {/if}
                    {#if pollOptions.length > 0}
                        <div class="poll" on:click|stopPropagation role="presentation">
                            {#each pollOptions as option, index}
                                {@const percent = pollTotalVotes > 0 ? Math.round(((option.votes || 0) / pollTotalVotes) * 100) : 0}
                                <button
                                    type="button"
                                    class="pollOption"
                                    class:voted={pollVotedOption === index}
                                    disabled={pollShowResults || votingPoll}
                                    on:click={(e) => handleVotePoll(e, index)}
                                >
                                    {#if pollShowResults}
                                        <span class="pollBar" style={`width:${percent}%`} />
                                    {/if}
                                    <span class="pollOptionText">{option.text}</span>
                                    {#if pollShowResults}
                                        <span class="pollPercent">{percent}%</span>
                                    {/if}
                                </button>
                            {/each}
                            <p class="pollMeta">
                                {pollTotalVotes} {pollTotalVotes === 1 ? "vote" : "votes"}
                                {#if pollExpired}· Poll ended{:else if post.poll?.expiresAt}· Ends {formatTimestamp(post.poll.expiresAt)}{/if}
                            </p>
                        </div>
                    {/if}
                    {#if post.replyAudience && post.replyAudience !== "everyone"}
                        <p class="audienceNotice">
                            <Icon icon="material-symbols:info-outline-rounded" width="14" height="14" />
                            {AUDIENCE_LABELS[post.replyAudience]}
                        </p>
                    {/if}
                    {#if isQuoteRepost}
                        {#if originalPost && originalAuthor}
                            <div class="embeddedPost">
                                <div class="embeddedHead">
                                    <img src={originalAuthor.photoURL} alt={originalAuthor.displayName} width="20" height="20" />
                                    <p class="displayName">{originalAuthor.displayName}</p>
                                    <UserBadges verified={originalAuthor.verified} admin={originalAuthor.admin} size="13" />
                                    <p class="username">@{originalAuthor.username}</p>
                                </div>
                                <p class="content">{#each tokenizeMentions(originalPost.content) as token}{#if token.type === "mention"}<span class="mention" role="link" tabindex="0" on:click={(e) => goToMention(e, token.value)} on:keydown={(e) => { if (e.key === "Enter") goToMention(e, token.value) }}>@{token.value}</span>{:else}{token.value}{/if}{/each}</p>
                                {#if originalPost.image && !originalMediaError && originalPost.mediaType === "video"}
                                    <div class="postVideoWrap" on:click|stopPropagation role="presentation">
                                        <video class="postVideo" src={originalPost.imageURL} controls preload="metadata" on:error={handleOriginalMediaError}></video>
                                    </div>
                                {:else if originalPost.image && !originalMediaError}
                                    <button type="button" class="postImageButton" on:click={(e) => openLightbox(e, originalPost.imageURL)}>
                                        <img
                                            class="postImage"
                                            src={originalPost.imageURL}
                                            alt="Quoted attachment"
                                            loading="lazy"
                                            decoding="async"
                                            on:error={handleOriginalMediaError}
                                        >
                                    </button>
                                {/if}
                            </div>
                        {:else if originalBlocked}
                            <div class="embeddedPost">
                                <p class="privateNotice">This post is from a private account.</p>
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
                        <button type="button" class="icon iconButton bookmarkButton" class:active={bookmarked} on:click={handleBookmark} aria-label="Bookmark">
                            <Icon icon={bookmarked ? "material-symbols:bookmark-rounded" : "material-symbols:bookmark-outline-rounded"} width="18px" height="18px" />
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

{#if showHistory}
    <div class="historyOverlay" on:click|self={closeHistory} role="presentation" transition:fade={{ duration: 150 }}>
        <div class="historyModal" transition:scale={{ duration: 150, start: 0.96 }}>
            <div class="historyHead">
                <p class="historyTitle">Edit history</p>
                <button type="button" on:click={closeHistory} aria-label="Close">
                    <Icon icon="material-symbols:close-rounded" width="20" height="20" />
                </button>
            </div>
            <div class="historyList">
                {#each [...(post.editHistory ?? [])].reverse() as entry, i (i)}
                    <div class="historyEntry">
                        <p class="historyTimestamp">{formatHistoryTimestamp(entry.editedAt)}</p>
                        <p class="content">{entry.content}</p>
                    </div>
                {/each}
                <div class="historyEntry">
                    <p class="historyTimestamp">Current</p>
                    <p class="content">{post.content}</p>
                </div>
            </div>
        </div>
    </div>
{/if}

{#if lightboxSrc}
    <ImageLightbox src={lightboxSrc} alt="Post attachment" on:close={closeLightbox} />
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
        border-bottom: 1px solid var(--gainsboro);
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
        overflow: hidden;
        border: 1px solid var(--gainsboro);
        background: var(--background-elevated-highlight);
    }

    .postContentContainer {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
        min-width: 0;
        flex-grow: 1;
    }

    .postMenuWrap {
        position: absolute;
        top: 0;
        right: 0;
    }

    .menuButton {
        padding: 0.4rem;
    }

    .postMenu {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 0.3rem;
        background: var(--background-base);
        border: 1px solid var(--gainsboro);
        border-radius: 0.8rem;
        box-shadow: 0 10px 30px var(--shadow-color);
        display: flex;
        flex-direction: column;
        min-width: 160px;
        overflow: hidden;
        z-index: 50;
    }

    .postMenu button {
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

    .postMenu button:hover {
        background: var(--background-highlight);
    }

    .postMenu .dangerItem {
        color: var(--essential-negative);
    }

    .editedLabel {
        cursor: pointer;
        border: none;
        background: none;
        padding: 0;
        color: var(--text-subdued);
        font-size: 16px;
        text-decoration: underline;
    }

    .editedLabel:hover {
        color: var(--essential-announcement);
    }

    .editBox {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .editBox textarea {
        width: 100%;
        min-height: 3rem;
        padding: 0.6rem 0.8rem;
        background: var(--background-elevated-highlight);
        border-radius: 0.8rem;
        border: none;
        outline: none;
        color: var(--text-base);
        font-size: 16px;
        font-family: inherit;
        resize: none;
    }

    .editActions {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        gap: 0.5rem;
    }

    .cancelEdit, .saveEdit {
        cursor: pointer;
        padding: 0.5rem 1rem;
        border-radius: 999px;
        font-weight: 600;
        font-size: 13px;
        border: none;
    }

    .cancelEdit {
        background: var(--white-smoke);
        color: var(--text-subdued);
        border: 0.1rem solid var(--background-elevated-press);
    }

    .saveEdit {
        background: var(--essential-announcement);
        color: #fff;
    }

    .saveEdit:disabled {
        opacity: 0.6;
        cursor: default;
    }

    .historyOverlay {
        position: fixed;
        inset: 0;
        z-index: 900;
        overflow: auto;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
    }

    .historyModal {
        margin-top: 5%;
        width: 40%;
        max-height: 70%;
        overflow-y: auto;
        background: var(--background-base);
        padding: 1.2rem;
        border-radius: 1rem;
        box-shadow: 0 10px 40px var(--shadow-color);
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
    }

    .historyHead {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }

    .historyHead button {
        cursor: pointer;
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--text-base);
    }

    .historyHead button:hover {
        background: var(--background-highlight);
    }

    .historyTitle {
        font-size: 18px;
        font-weight: 800;
    }

    .historyList {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
    }

    .historyEntry {
        padding: 0.8rem;
        border: 1px solid var(--gainsboro);
        border-radius: 0.8rem;
    }

    .historyTimestamp {
        font-size: 12px;
        font-weight: 700;
        color: var(--text-subdued);
        margin-bottom: 0.3rem;
    }

    @media (max-width: 700px) {
        .historyModal {
            width: 90%;
        }
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

    .mention {
        cursor: pointer;
        color: var(--essential-announcement);
    }

    .mention:hover {
        text-decoration: underline;
    }

    .postImageButton {
        display: block;
        margin-top: 0.3rem;
        padding: 0;
        border: none;
        background: none;
        cursor: pointer;
        max-width: 100%;
        min-width: 50%;
    }

    .postImage {
        display: block;
        object-fit: cover;
        max-height: 400px;
        width: 100%;
        max-width: 100%;
        border-radius: 0.8rem;
        background: var(--background-elevated-highlight);
        border: 1px solid var(--gainsboro);
    }

    .postVideoWrap {
        margin-top: 0.3rem;
        max-width: 100%;
        border-radius: 0.8rem;
        overflow: hidden;
        border: 1px solid var(--gainsboro);
        background: #000;
    }

    .postVideo {
        display: block;
        width: 100%;
        max-height: 400px;
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
        overflow: hidden;
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

    .privateNotice {
        padding: 0.8rem 1rem;
        color: var(--text-subdued);
        font-size: 14px;
        font-style: italic;
    }

    .pinnedLabel {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.4rem;
        color: var(--text-subdued);
        font-size: 13px;
        font-weight: 700;
        margin-bottom: 0.2rem;
    }

    .poll {
        margin-top: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .pollOption {
        position: relative;
        cursor: pointer;
        overflow: hidden;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 0.6rem;
        padding: 0.7rem 1rem;
        border-radius: 999px;
        border: 1px solid var(--essential-announcement);
        background: var(--background-base);
        color: var(--text-base);
        font-size: 14px;
        font-weight: 600;
        text-align: left;
    }

    .pollOption:disabled {
        cursor: default;
    }

    .pollOption:hover:not(:disabled) {
        background: color-mix(in srgb, var(--essential-announcement) 8%, transparent);
    }

    .pollOption.voted {
        border-color: var(--essential-announcement);
        font-weight: 800;
    }

    .pollBar {
        position: absolute;
        inset: 0 auto 0 0;
        background: color-mix(in srgb, var(--essential-announcement) 18%, transparent);
        transition: width 0.3s;
        z-index: 0;
    }

    .pollOptionText, .pollPercent {
        position: relative;
        z-index: 1;
    }

    .pollMeta {
        color: var(--text-subdued);
        font-size: 13px;
    }

    .audienceNotice {
        margin-top: 0.5rem;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.4rem;
        color: var(--text-subdued);
        font-size: 13px;
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

    .bookmarkButton:hover, .bookmarkButton:hover :global(svg) {
        color: var(--essential-announcement);
    }

    .bookmarkButton.active,
    .bookmarkButton.active :global(svg) {
        color: var(--essential-announcement);
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
