<script lang="ts">
    import { onMount } from "svelte"
    import Icon from "@iconify/svelte"
    import Post from "$lib/components/+Post.svelte"
    import UserBadges from "$lib/components/+UserBadges.svelte"
    import PostSkeleton from "$lib/components/+PostSkeleton.svelte"
    import axios from "axios"
    import { page } from "$app/stores"
    import { goto } from "$app/navigation"
    import { user } from "$lib/client/hooks/loginState"
    import { searchHistory, addSearchHistory, removeSearchHistoryItem } from "$lib/client/utils/searchHistory"

    let timeline: any = null
    let timelineLoading = true

    let searchResults: any[] = []
    let hasSearched = false
    let searchQuery = ""
    let isLoading = false
    let showHistory = false
    let followedUIDs: Record<string, boolean> = {}
    let followBusy: Record<string, boolean> = {}

    let userInfo: any
    $: userInfo = $user

    let lastRunQuery: string | null = null
    $: queryParam = $page.url.searchParams.get("q")
    $: if (queryParam && queryParam !== lastRunQuery) {
        searchQuery = queryParam
        runSearch(queryParam)
    }

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

    function handlePostDeleted(event: CustomEvent<{ id: string }>) {
        searchResults = searchResults.filter((result: any) => result.isUser || result.id !== event.detail.id)
        if (timeline) {
            timeline.posts.posts = timeline.posts.posts.filter((post: any) => post.id !== event.detail.id)
        }
    }

    function handlePostEdited(event: CustomEvent<{ post: any }>) {
        searchResults = searchResults.map((result: any) =>
            !result.isUser && result.id === event.detail.post.id ? event.detail.post : result
        )
        if (timeline) {
            timeline.posts.posts = timeline.posts.posts.map((post: any) =>
                post.id === event.detail.post.id ? event.detail.post : post
            )
        }
    }

    async function runSearch(queryValue: string) {
        const trimmed = queryValue.trim()
        if (!trimmed) return

        lastRunQuery = trimmed
        isLoading = true
        hasSearched = true
        showHistory = false

        try {
            const response = await axios.get(`/api/search?query=${encodeURIComponent(trimmed)}`)

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

    function handleSearch(event: Event) {
        event.preventDefault()

        if (!searchQuery.trim()) return

        addSearchHistory(searchQuery)
        goto(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }

    function useHistoryItem(item: string) {
        searchQuery = item
        addSearchHistory(item)
        goto(`/search?q=${encodeURIComponent(item)}`)
    }

    async function toggleFollowResult(result: any) {
        if (followBusy[result.uid] || !userInfo) return

        followBusy = { ...followBusy, [result.uid]: true }
        const wasFollowing = !!followedUIDs[result.uid]

        try {
            const response = await axios.post(
                `/api/toggleFollow?token=${userInfo.accessToken}&uid=${userInfo.uid}`,
                { targetUID: result.uid }
            )
            followedUIDs = { ...followedUIDs, [result.uid]: response.data.following }
        } catch (error) {
            followedUIDs = { ...followedUIDs, [result.uid]: wasFollowing }
        } finally {
            followBusy = { ...followBusy, [result.uid]: false }
        }
    }

    function truncateDescription(description: string): string {
        return description.length > 100 ? description.slice(0, 45) + '...' : description
    }
</script>

<svelte:head>
    <title>Ivory - Search</title>
</svelte:head>

<svelte:window on:click={() => showHistory = false} />

<div class="content">
    <form class="searchForm" on:submit|preventDefault|stopPropagation={handleSearch}>
        <div class="search">
            <Icon icon="material-symbols:search" width="24px" height="24px" />
            <input
                type="search"
                name="search"
                placeholder="Search Ivory..."
                bind:value={searchQuery}
                on:click|stopPropagation
                on:focus={() => showHistory = true}
                required
            >
        </div>
        {#if showHistory && $searchHistory.length > 0}
            <div class="historyDropdown" on:click|stopPropagation role="presentation">
                {#each $searchHistory as item}
                    <div class="historyItem">
                        <button type="button" class="historyText" on:click={() => useHistoryItem(item)}>
                            <Icon icon="material-symbols:history" width="18" height="18" />
                            {item}
                        </button>
                        <button type="button" class="historyRemove" on:click={() => removeSearchHistoryItem(item)} aria-label="Remove">
                            <Icon icon="material-symbols:close-small-rounded" width="16" height="16" />
                        </button>
                    </div>
                {/each}
            </div>
        {/if}
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
                                    <UserBadges verified={result.verified} admin={result.admin} size="14" />
                                    <p class="username">@{result.username}</p>
                                </div>
                                {#if userInfo && result.uid !== userInfo.uid}
                                    <button
                                        class="followButton"
                                        class:following={followedUIDs[result.uid]}
                                        disabled={followBusy[result.uid]}
                                        on:click|preventDefault|stopPropagation={() => toggleFollowResult(result)}
                                    >
                                        {followedUIDs[result.uid] ? "Following" : "Follow"}
                                    </button>
                                {/if}
                            </div>
                            <p class="description">{truncateDescription(result.description)}</p>
                        </div>
                    </a>
                {:else}
                    <Post post={result} on:deleted={handlePostDeleted} on:edited={handlePostEdited} />
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
                        <Post post={post} on:deleted={handlePostDeleted} on:edited={handlePostEdited} />
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
        position: sticky;
        top: 0;
        padding-block: 1rem;
        background: var(--background-base);
        z-index: 10;
    }

    .historyDropdown {
        position: absolute;
        top: calc(100% - 0.5rem);
        left: 0;
        right: 0;
        background: var(--background-base);
        border: 1px solid var(--gainsboro);
        border-radius: 0.8rem;
        box-shadow: 0 10px 30px var(--shadow-color);
        overflow: hidden;
        z-index: 30;
    }

    .historyItem {
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    .historyItem:hover {
        background: var(--background-highlight);
    }

    .historyText {
        flex-grow: 1;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.6rem;
        padding: 0.7rem 0.9rem;
        border: none;
        background: none;
        color: var(--text-base);
        font-size: 14px;
        text-align: left;
        cursor: pointer;
    }

    .historyRemove {
        display: grid;
        place-items: center;
        padding: 0.4rem;
        margin-right: 0.5rem;
        border: none;
        background: none;
        border-radius: 999px;
        color: var(--text-subdued);
        cursor: pointer;
    }

    .historyRemove:hover {
        background: var(--background-elevated-press);
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
        border-bottom: 1px solid var(--gainsboro);
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
        overflow: hidden;
        border: 1px solid var(--gainsboro);
        background: var(--background-elevated-highlight);
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

    .followButton.following {
        background: none;
        border: 0.1rem solid var(--background-elevated-press);
        color: var(--text-base);
    }

    .followButton:disabled {
        opacity: 0.5;
        cursor: default;
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

    @media (max-width: 700px) {
        .content {
            padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px));
        }
    }
</style>
