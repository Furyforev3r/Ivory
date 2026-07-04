<script lang="ts">
    import { browser } from "$app/environment"
    import axios from "axios"
    import toast from "svelte-french-toast"
    import { user } from "$lib/client/hooks/loginState"
    import Post from "$lib/components/+Post.svelte"
    import PostSkeleton from "$lib/components/+PostSkeleton.svelte"

    let userInfo: any
    let posts: any[] | null = null

    $: userInfo = $user
    $: if (browser && userInfo && userInfo !== "Loading..." && posts === null) loadBookmarks()

    async function loadBookmarks() {
        try {
            const response = await axios.get(`/api/getBookmarks?token=${userInfo.accessToken}&uid=${userInfo.uid}`)
            posts = response.data.posts
        } catch (error) {
            console.error(error)
            toast.error("Could not load bookmarks")
            posts = []
        }
    }

    function handleDeleted(event: CustomEvent<{ id: string }>) {
        if (posts) posts = posts.filter((post: any) => post.id !== event.detail.id)
    }

    function handleEdited(event: CustomEvent<{ post: any }>) {
        if (posts) posts = posts.map((post: any) => post.id === event.detail.post.id ? event.detail.post : post)
    }
</script>

<svelte:head>
    <title>Ivory - Bookmarks</title>
</svelte:head>

<div class="content">
    <div class="header">
        <h2>Bookmarks</h2>
    </div>
    <div class="posts">
        {#if posts === null}
            {#each Array(5) as _}
                <PostSkeleton />
            {/each}
        {:else if posts.length === 0}
            <p class="empty">Posts you bookmark show up here.</p>
        {:else}
            {#each posts as post (post.id)}
                <Post {post} on:deleted={handleDeleted} on:edited={handleEdited} />
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
        display: grid;
        place-items: center;
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
