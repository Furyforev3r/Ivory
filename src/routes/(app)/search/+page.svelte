<script lang="ts">
    import { onMount } from "svelte"
    import Icon from "@iconify/svelte"
    import Post from "$lib/components/+Post.svelte"
    import PostSkeleton from "$lib/components/+PostSkeleton.svelte"
    import axios from "axios"

    let timeline: any = null
    let timelineLoading = true

    let searchResults: any[] = []
    let hasSearched = false
    let searchQuery = ""
    let isLoading = false

    onMount(async () => {
        try {
            let response = await axios.get("api/getRecentPosts?limit=6")

            if (response.status == 200 || response.status == 201) {
                timeline = response.data
            } else {
                console.error(response.data.error)
            }
        } catch (error) {
            console.error(error)
        } finally {
            timelineLoading = false
        }
    })

    async function handleSearch(event: Event) {
        event.preventDefault()

        if (!searchQuery.trim()) return

        isLoading = true
        hasSearched = true

        try {
            const response = await axios.get(`/api/search?query=${encodeURIComponent(searchQuery)}`)

            if (response.status === 200) {
                searchResults = response.data.results
            } else {
                console.error(response.data.error)
            }
        } catch (error) {
            console.error("Error during search:", error)
        } finally {
            isLoading = false
        }
    }

    function truncateDescription(description: string): string {
        return description.length > 100 ? description.slice(0, 45) + '...' : description
    }
</script>

<svelte:head>
    <title>Ivory - Search</title>
</svelte:head>

<div class="content">
    <form class="searchForm" on:submit|preventDefault={handleSearch}>
        <div class="search">
            <Icon icon="material-symbols:search" width="24px" height="24px" />
            <input
                type="search"
                name="search"
                placeholder="Search Ivory..."
                bind:value={searchQuery}
                required
            >
        </div>
    </form>

    {#if isLoading}
        <div class="results">
            {#each Array(4) as _}
                <PostSkeleton />
            {/each}
        </div>
    {:else if hasSearched}
        <div class="results">
            {#if searchResults.length === 0}
                <p class="empty">No results for "{searchQuery}"</p>
            {/if}
            {#each searchResults as result}
                {#if result.isUser}
                    <a href={`/${result.username}`} class="userResult">
                        <img class="userPic" alt={result.displayName} src={result.photoURL} width="52px" height="52px" loading="lazy" />
                        <div class="userContent">
                            <div class="userInfoContainer">
                                <div class="userInfo">
                                    <p class="displayName">{result.displayName}</p>
                                    <p class="username">@{result.username}</p>
                                </div>
                                <button class="followButton">Follow</button>
                            </div>
                            <p class="description">{truncateDescription(result.description)}</p>
                        </div>
                    </a>
                {:else}
                    <Post post={result}/>
                {/if}
            {/each}
        </div>
    {:else}
        <div class="recentPosts">
            <h2>Recent posts</h2>
            <div class="posts">
                {#if timelineLoading}
                    {#each Array(4) as _}
                        <PostSkeleton />
                    {/each}
                {:else if timeline}
                    {#each timeline.posts.posts as post (post.id)}
                        <Post post={post}/>
                    {/each}
                {/if}
            </div>
        </div>
        <ul class="terms">
            <li>
                <a href="/feedback">Feedback</a>
            </li>
            <span>·</span>
            <li>
                <a href="/privacy">Privacy</a>
            </li>
            <span>·</span>
            <li>
                <a href="/terms">Terms</a>
            </li>
            <span>·</span>
            <li>
                <a href="/help">Help</a>
            </li>
        </ul>
    {/if}
</div>

<style>
    .content {
        flex-grow: 1;
        overflow-y: auto;
        border-inline: 1px solid var(--gainsboro);
        padding-inline: 1.2rem;
        display: flex;
        flex-direction: column;
    }

    .searchForm {
        padding-block: 1rem;
        position: sticky;
        top: 0;
        background: var(--background-base);
        z-index: 10;
    }

    .search {
        display: flex;
        flex-direction: row;
        gap: 0.5rem;
        align-items: center;
        padding: 0.6rem 0.9rem;
        background: var(--background-elevated-highlight);
        border: 0.1rem solid transparent;
        color: var(--text-subdued);
        border-radius: 999px;
        transition: border-color 0.2s;
    }

    .search:focus-within {
        border-color: var(--essential-announcement);
        background: var(--background-base);
    }

    .search input {
        padding: 0.2rem;
        width: 100%;
        height: 100%;
        background: none;
        border: none;
        font-size: 15px;
        color: var(--text-base);
    }

    .search input:focus {
        border: none;
        outline: none;
    }

    .recentPosts {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }

    .recentPosts h2 {
        font-size: 18px;
        font-weight: 800;
        padding-block: 0.6rem;
    }

    .results {
        flex-grow: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
    }

    .empty {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--text-subdued);
    }

    .userResult {
        padding: 1rem;
        border-radius: 0.3rem;
        border-block: 1px solid var(--gainsboro);
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
        text-decoration: none;
    }

    .displayName {
        color: var(--text-base);
        font-weight: 600;
    }

    .username {
        color: var(--text-subdued);
        font-size: 16px;
    }

    .description {
        color: var(--text-base);
        word-break: break-word;
    }

    .userContent {
        display: flex;
        flex-direction: column;
        width: 100%;
    }

    .userInfoContainer {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }

    .userPic {
        min-width: 52px;
        border-radius: 50%;
        object-fit: cover;
        border: 1px solid var(--gainsboro);
    }

    .followButton {
        cursor: pointer;
        padding: 0.6rem 1rem;
        background: var(--text-base);
        color: var(--background-base);
        border-radius: 999px;
        border: none;
        font-weight: 700;
        transition: opacity 0.2s;
    }

    .followButton:hover {
        opacity: 0.85;
    }

    .terms {
        display: flex;
        flex-direction: row;
        gap: 0.3rem;
        padding-block: 1rem;
    }

    .terms li a {
        text-decoration: none;
        color: var(--text-subdued);
    }

    .terms li a:hover {
        text-decoration: underline;
    }
</style>
