<script lang="ts">
    import { goto } from "$app/navigation"
    import { user } from "$lib/client/hooks/loginState"
    import { logout } from "$lib/client/utils/firebaseUtils"
    import { afterUpdate, onMount, onDestroy } from "svelte"
    import { browser } from '$app/environment'
    import Icon from "@iconify/svelte"
    import Tabs from "$lib/components/+Tabs.svelte"
    import Discover from "$lib/components/+Discover.svelte"
    import Post from "$lib/components/+Post.svelte"
    import axios from "axios"

    let userInfo
    let timeline = []
    let loading = false
    let hasMore = true
    let page = 1
    const limit = 10

    $: userInfo = $user

    onMount(() => {
        if (browser) {
            loadMorePosts()
        }
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
        }
    }

    function handleScroll() {
        if (browser) {
            const postsContainer = document.querySelector('.posts')
            if (postsContainer) {
                const { scrollTop, scrollHeight, clientHeight } = postsContainer
                if (scrollHeight - (scrollTop + clientHeight) < 100) {
                    loadMorePosts()
                }
            }
        }
    }

    afterUpdate(async () => {
        if (!userInfo) {
            goto("/login")
        }

        if (browser) {
            const postsContainer = document.querySelector('.posts')
            if (postsContainer) {
                postsContainer.addEventListener('scroll', handleScroll)
            }
        }
    })

    onDestroy(() => {
        if (browser) {
            const postsContainer = document.querySelector('.posts')
            if (postsContainer) {
                postsContainer.removeEventListener('scroll', handleScroll)
            }
        }
    })
</script>
<svelte:head>
    <title>Ivory</title>
    <meta name="description" content="Ivory!" />
</svelte:head>

<main class="main">
    {#if userInfo == 'Loading...'}
        <div class="loading">
            <Icon icon="svg-spinners:3-dots-move" width="6rem" height="6rem" style="color: black" />
        </div>
    {:else if userInfo}
        <Tabs userUID={userInfo.uid} />
        <div class="content">
            <div class="header">
                <h2>Ivory.</h2>
            </div>
            <div class="posts">
                {#if timeline}
                    {#each timeline as post}
                        <Post post={post} />
                    {/each}
                {/if}

                {#if loading && hasMore}
                    <div class="loading-more">
                        <Icon icon="svg-spinners:3-dots-move" width="3rem" height="3rem" style="color: black" />
                    </div>
                {/if}
             </div>
        </div>
        <Discover />
    {/if}
</main>

<style>
    .main {
        height: 100dvh;
        display: flex;
        flex-direction: row;
        overflow: hidden;
    }

    .content {
        flex-grow: 1;
        border-inline: 1px solid var(--gainsboro);
        display: flex;
        flex-direction: column;
        overflow: auto;
    }

    .loading {
        display: grid;
        place-items: center;
        height: 100%;
        width: 100%;
    }

    .header {
        padding: 1rem;
        display: grid;
        place-items: center;
    }

    .header h2 {
        color: var(--text-subdued);
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
    }

    .no-more-posts {
        text-align: center;
        padding: 1rem;
        color: var(--text-subdued);
    }
</style>
