<script lang="ts">
    import Icon from "@iconify/svelte"
    import { page } from "$app/stores"
    import { goto } from "$app/navigation"
    import { browser } from "$app/environment"
    import { user } from "$lib/client/hooks/loginState"
    import { account, ensureAccount } from "$lib/client/hooks/accountState"
    import toast from "svelte-french-toast"
    import Post from "$lib/components/+Post.svelte"
    import PostSkeleton from "$lib/components/+PostSkeleton.svelte"
    import Reply from "$lib/components/+Reply.svelte"
    import ReplySkeleton from "$lib/components/+ReplySkeleton.svelte"
    import Skeleton from "$lib/components/+Skeleton.svelte"
    import autosize from "svelte-autosize"
    import axios from "axios"

    let postUID: string
    let post: any = null
    let postAuthor: any = null
    let notFound = false
    let isPrivate = false
    let loadedFor: string | null = null

    let replies: any[] = []
    let repliesLoading = true
    let replyValue = ""
    let posting = false
    let replyTextareaEl: HTMLTextAreaElement
    let replyingTo: { replyUID: string; username: string } | null = null

    $: topLevelReplies = replies.filter((reply: any) => !reply.parentReplyUID)

    let userInfo: any
    $: userInfo = $user
    $: userAccount = $account
    $: if (userInfo && userInfo !== "Loading...") ensureAccount(userInfo.uid)

    $: postUID = $page.params.postUID
    $: if (browser && postUID && postUID !== loadedFor) loadPost(postUID)

    async function loadPost(uid: string) {
        loadedFor = uid
        post = null
        postAuthor = null
        notFound = false
        isPrivate = false
        replies = []
        repliesLoading = true

        try {
            const viewerParam = userInfo && userInfo !== "Loading..." ? `&viewerUID=${userInfo.uid}` : ""
            let response = await axios.get(`/api/getPostByUID?uid=${uid}${viewerParam}`)

            if (response.status == 200) {
                const fetchedPost = response.data.post
                try {
                    const authorResponse = await axios.get(`/api/getSimpleUser?uid=${fetchedPost.userUID}`)
                    postAuthor = authorResponse.data.user
                } catch (error) {
                    console.error(error)
                }
                post = fetchedPost
            } else {
                notFound = true
            }
        } catch (error: any) {
            if (error?.response?.data?.private) {
                isPrivate = true
            } else {
                notFound = true
            }
        }

        if (!isPrivate) await loadReplies(uid)
        repliesLoading = false
    }

    async function loadReplies(uid: string) {
        repliesLoading = true
        try {
            const response = await axios.get(`/api/getReplies?postUID=${uid}`)
            replies = response.data.replies
        } catch (error) {
            console.error(error)
        } finally {
            repliesLoading = false
        }
    }

    function handlePostDeleted() {
        goto("/")
    }

    function handlePostEdited(event: CustomEvent<{ post: any }>) {
        post = event.detail.post
    }

    function handleReplyToReply(event: CustomEvent<{ replyUID: string; username: string }>) {
        replyingTo = event.detail
        replyTextareaEl?.focus()
    }

    function cancelReplyingTo() {
        replyingTo = null
    }

    async function submitReply() {
        if (!replyValue.trim() || posting || !userInfo) return

        posting = true
        try {
            await axios.post(`/api/newReply?token=${userInfo.accessToken}&uid=${userInfo.uid}`, {
                postUID,
                content: replyValue.trim(),
                parentReplyUID: replyingTo?.replyUID ?? null
            })
            replyValue = ""
            replyingTo = null
            await loadReplies(postUID)
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Could not post reply")
        } finally {
            posting = false
        }
    }
</script>

<svelte:head>
    <title>Ivory</title>
    <meta name="description" content="Ivory!" />
</svelte:head>
<div class="content">
    <div class="header">
        <a href="/" class="back" aria-label="Back">
            <Icon icon="material-symbols:arrow-back-rounded" width="22px" height="22px" />
        </a>
        <h2>Post</h2>
    </div>
    {#if notFound}
        <p class="empty">This post doesn't exist.</p>
    {:else if isPrivate}
        <p class="empty">This post is from a private account. Follow them to see it.</p>
    {:else if post}
        <Post {post} author={postAuthor} on:deleted={handlePostDeleted} on:edited={handlePostEdited} />
        <div class="replyComposer">
            {#if userAccount}
                <img src={userAccount.user.photoURL} alt="Your avatar" class="composerAvatar" />
            {:else}
                <Skeleton circle width="40px" height="40px" />
            {/if}
            <div class="composerBody">
                {#if replyingTo}
                    <div class="replyingToChip">
                        <span>Replying to <strong>@{replyingTo.username}</strong></span>
                        <button type="button" on:click={cancelReplyingTo} aria-label="Cancel reply">
                            <Icon icon="material-symbols:close-rounded" width="16" height="16" />
                        </button>
                    </div>
                {/if}
                <textarea
                    use:autosize
                    bind:this={replyTextareaEl}
                    placeholder="Post your reply"
                    maxlength="300"
                    bind:value={replyValue}
                ></textarea>
                <div class="composerFooter">
                    <button on:click={submitReply} disabled={posting || !replyValue.trim()}>
                        {posting ? "Replying..." : "Reply"}
                    </button>
                </div>
            </div>
        </div>
        <div class="repliesList">
            {#if repliesLoading}
                {#each Array(3) as _}
                    <ReplySkeleton />
                {/each}
            {:else if replies.length === 0}
                <p class="empty">No replies yet. Be the first to reply!</p>
            {:else}
                {#each topLevelReplies as reply (reply.id)}
                    <Reply {reply} allReplies={replies} on:reply={handleReplyToReply} />
                {/each}
            {/if}
        </div>
    {:else}
        <PostSkeleton />
    {/if}
</div>

<style>
    .content {
        flex-grow: 1;
        overflow: auto;
        border-inline: 1px solid var(--gainsboro);
    }

    .content::-webkit-scrollbar {
        width: 10px;
        background-color: var(--background-elevated-highlight);
    }

    .content::-webkit-scrollbar-thumb {
        background: var(--background-elevated-press);
        border-radius: 0.8rem;
    }

    .header {
        padding: 1rem;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 1rem;
        border-bottom: 1px solid var(--gainsboro);
        position: sticky;
        top: 0;
        background: var(--background-base);
        z-index: 10;
    }

    .back {
        display: grid;
        place-items: center;
        padding: 0.4rem;
        border-radius: 999px;
        transition: background 0.2s;
    }

    .back:hover {
        background: var(--background-highlight);
    }

    .header h2 {
        font-size: 18px;
        font-weight: 800;
    }

    .empty {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--text-subdued);
    }

    .replyComposer {
        display: flex;
        flex-direction: row;
        gap: 0.8rem;
        padding: 1rem;
        border-bottom: 1px solid var(--gainsboro);
    }

    .composerAvatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
        overflow: hidden;
        background: var(--background-elevated-highlight);
        border: 1px solid var(--gainsboro);
    }

    .composerBody {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
    }

    .replyingToChip {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.4rem 0.7rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--essential-announcement) 10%, transparent);
        color: var(--text-subdued);
        font-size: 13px;
        width: fit-content;
    }

    .replyingToChip strong {
        color: var(--essential-announcement);
    }

    .replyingToChip button {
        cursor: pointer;
        display: grid;
        place-items: center;
        border: none;
        background: none;
        color: var(--text-subdued);
    }

    .composerBody textarea {
        width: 100%;
        min-height: 1.6rem;
        padding: 0.4rem 0;
        border: none;
        outline: none;
        background: none;
        color: var(--text-base);
        font-family: inherit;
        font-size: 18px;
        resize: none;
    }

    .composerFooter {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        padding-top: 0.6rem;
        border-top: 1px solid var(--gainsboro);
    }

    .composerBody button {
        cursor: pointer;
        padding: 0.5rem 1.1rem;
        border-radius: 999px;
        border: none;
        background: var(--essential-announcement);
        color: #fff;
        font-weight: 700;
        font-size: 14px;
        transition: opacity 0.2s;
    }

    .composerBody button:hover {
        opacity: 0.9;
    }

    .composerBody button:disabled {
        opacity: 0.5;
        cursor: default;
    }

    .repliesList {
        display: flex;
        flex-direction: column;
    }

    @media (max-width: 700px) {
        .content {
            padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px));
        }
    }
</style>
