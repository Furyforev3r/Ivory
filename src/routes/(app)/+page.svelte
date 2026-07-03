<script lang="ts">
    import { onMount } from "svelte"
    import Icon from "@iconify/svelte"
    import Post from "$lib/components/+Post.svelte"
    import PostSkeleton from "$lib/components/+PostSkeleton.svelte"
    import axios from "axios"

    let timeline = []
    let loading = false
    let initialLoading = true
    let hasMore = true
    let page = 1
    const limit = 10
    let postsEl: HTMLDivElement

    onMount(() => {
        loadMorePosts()
    })

    async function loadMorePosts() {
        if (loading || !hasMore) return

        loading = true

        try {
            let response = await axios.get(`api/getRecentPosts?limit=${limit}&page=${page}`)

            if (response.status == 200 || response.status == 201) {
                const newPosts = response.data.posts.posts
                if (newPosts.length > 0) {
                    timeline = [...timeline, ...newPosts]
                    page++
                } else {
                    hasMore = false
                }
            } else {
                console.error(response.data.error)
            }
        } catch (error) {
            console.error(error)
        } finally {
            loading = false
            initialLoading = false
        }
    }

    function handleScroll() {
        if (!postsEl) return
        const { scrollTop, scrollHeight, clientHeight } = postsEl
        if (scrollHeight - (scrollTop + clientHeight) < 200) {
            loadMorePosts()
        }
    }
</script>

<svelte:head>
    <title>Ivory</title>
    <meta name="description" content="Ivory!" />
</svelte:head>

<div class="content">
    <div class="header">
        <h2>Home</h2>
    </div>
    <div class="posts" bind:this={postsEl} on:scroll={handleScroll}>
        {#if initialLoading}
            {#each Array(5) as _}
                <PostSkeleton />
            {/each}
        {:else}
            {#each timeline as post (post.id)}
                <Post post={post} />
            {/each}

            {#if loading && hasMore}
                <div class="loading-more">
                    <Icon icon="svg-spinners:3-dots-move" width="2.5rem" height="2.5rem" />
                </div>
            {/if}

            {#if !hasMore && timeline.length === 0}
                <p class="empty">Nothing here yet. Be the first to post!</p>
            {/if}
        {/if}
    </div>
</div>

<style>
    .content {
        flex-grow: 1;
        border-inline: 1px solid var(--gainsboro);
        display: flex;
        flex-direction: column;
        overflow: auto;
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

    .posts {
        flex-grow: 1;
        overflow: auto;
    }

    .posts::-webkit-scrollbar {
        width: 10px;
        background-color: var(--background-elevated-highlight);
    }

    .posts::-webkit-scrollbar-thumb {
        background: var(--background-elevated-press);
        border-radius: 0.8rem;
    }

    .loading-more {
        display: grid;
        place-items: center;
        padding: 1rem;
        color: var(--text-subdued);
    }

    .empty {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--text-subdued);
    }
</style>
