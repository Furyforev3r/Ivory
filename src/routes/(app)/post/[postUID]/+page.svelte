<script lang="ts">
    import Icon from "@iconify/svelte"
    import { page } from "$app/stores"
    import { browser } from "$app/environment"
    import { user } from "$lib/client/hooks/loginState"
    import { account, ensureAccount } from "$lib/client/hooks/accountState"
    import toast, { Toaster } from "svelte-french-toast"
    import Post from "$lib/components/+Post.svelte"
    import PostSkeleton from "$lib/components/+PostSkeleton.svelte"
    import Reply from "$lib/components/+Reply.svelte"
    import Skeleton from "$lib/components/+Skeleton.svelte"
    import autosize from "svelte-autosize"
    import axios from "axios"

    let postUID: string
    let post: any = null
    let notFound = false
    let loadedFor: string | null = null

    let replies: any[] = []
    let repliesLoading = true
    let replyValue = ""
    let posting = false

    let userInfo: any
    $: userInfo = $user
    $: userAccount = $account
    $: if (userInfo && userInfo !== "Loading...") ensureAccount(userInfo.uid)

    $: postUID = $page.params.postUID
    $: if (browser && postUID && postUID !== loadedFor) loadPost(postUID)

    async function loadPost(uid: string) {
        loadedFor = uid
        post = null
        notFound = false
        replies = []
        repliesLoading = true

        try {
            let response = await axios.get(`/api/getPostByUID?uid=${uid}`)

            if (response.status == 200) {
                post = response.data.post
            } else {
                notFound = true
            }
        } catch (error) {
            console.error(error)
            notFound = true
        }

        await loadReplies(uid)
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

    async function submitReply() {
        if (!replyValue.trim() || posting || !userInfo) return

        posting = true
        try {
            await axios.post(`/api/newReply?token=${userInfo.accessToken}&uid=${userInfo.uid}`, {
                postUID,
                content: replyValue.trim()
            })
            replyValue = ""
            await loadReplies(postUID)
        } catch (error) {
            toast.error("Could not post reply")
        } finally {
            posting = false
        }
    }
</script>

<svelte:head>
    <title>Ivory</title>
    <meta name="description" content="Ivory!" />
</svelte:head>

<Toaster />
<div class="content">
    <div class="header">
        <a href="/" class="back" aria-label="Back">
            <Icon icon="material-symbols:arrow-back-rounded" width="22px" height="22px" />
        </a>
        <h2>Post</h2>
    </div>
    {#if notFound}
        <p class="empty">This post doesn't exist.</p>
    {:else if post}
        <Post {post} />
        <div class="replyComposer">
            {#if userAccount}
                <img src={userAccount.user.photoURL} alt="Your avatar" class="composerAvatar" />
            {:else}
                <Skeleton circle width="40px" height="40px" />
            {/if}
            <div class="composerBody">
                <textarea
                    use:autosize
                    placeholder="Post your reply"
                    maxlength="300"
                    bind:value={replyValue}
                ></textarea>
                <button on:click={submitReply} disabled={posting || !replyValue.trim()}>
                    {posting ? "Replying..." : "Reply"}
                </button>
            </div>
        </div>
        <div class="repliesList">
            {#if repliesLoading}
                {#each Array(3) as _}
                    <Skeleton width="100%" height="60px" radius="0" />
                {/each}
            {:else if replies.length === 0}
                <p class="empty">No replies yet. Be the first to reply!</p>
            {:else}
                {#each replies as reply (reply.id)}
                    <Reply {reply} />
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

    .composerBody textarea {
        width: 100%;
        min-height: 2.4rem;
        padding: 0.6rem 0;
        border: none;
        outline: none;
        background: none;
        color: var(--text-base);
        font-family: inherit;
        font-size: 15px;
        border-bottom: 1px solid var(--gainsboro);
    }

    .composerBody button {
        align-self: flex-end;
        cursor: pointer;
        padding: 0.6rem 1.2rem;
        border-radius: 999px;
        border: none;
        background: var(--essential-announcement);
        color: #fff;
        font-weight: 700;
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
</style>
