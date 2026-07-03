<script lang="ts">
    import Icon from "@iconify/svelte"
    import { page } from "$app/stores"
    import { browser } from "$app/environment"
    import toast, { Toaster } from "svelte-french-toast"
    import Post from "$lib/components/+Post.svelte"
    import PostSkeleton from "$lib/components/+PostSkeleton.svelte"
    import axios from "axios"

    let postUID: string
    let post: any = null
    let notFound = false
    let loadedFor: string | null = null

    $: postUID = $page.params.postUID
    $: if (browser && postUID && postUID !== loadedFor) loadPost(postUID)

    async function loadPost(uid: string) {
        loadedFor = uid
        post = null
        notFound = false

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
        <Post post={post.post} />
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
</style>
