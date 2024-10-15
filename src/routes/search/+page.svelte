<script lang="ts">
    import { goto } from "$app/navigation"
    import Icon from "@iconify/svelte"
    import { afterUpdate } from "svelte"
    import { user } from "$lib/client/hooks/loginState"
    import Tabs from "$lib/components/+Tabs.svelte"
    import Discover from "$lib/components/+Discover.svelte"
    import Post from "$lib/components/+Post.svelte"
    import axios from "axios"

    let timeline
    let userInfo

    let searchResults = []
    let searchQuery = ''
    let isLoading = false
    
    $: userInfo = $user

    afterUpdate(async () => {
        if (!userInfo) {
            goto("/login")
        }

        if (!timeline) {
            try {
                let response = await axios.get('api/getRecentPosts?limit=2')

                if (response.status == 200 || response.status == 201) {
                    timeline = response.data
                } else {
                    console.error(response.data.error)
                }          
            } catch (error) {
                console.error(error)
            }
        }
    })

    async function handleSearch(event: Event) {
        event.preventDefault()
        isLoading = true

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

<main class="main">
    {#if userInfo == 'Loading...'}
        <div class="loading">
            <Icon icon="svg-spinners:3-dots-move" width="6rem" height="6rem" style="color: black" />
        </div>
    {:else if userInfo}
        <Tabs userUID={userInfo.uid} />
        <div class="searchContainer">
            <form class="searchForm" on:submit|preventDefault={handleSearch}>
                <div class="search">
                    <Icon icon="material-symbols:search" width="30px" height="26px" class="icon" />
                    <input
                        type="search"
                        name="search"
                        placeholder="Search..."
                        bind:value={searchQuery}
                        required
                    >
                </div>
            </form>
            {#if isLoading}
                <div class="loading">
                    <Icon icon="svg-spinners:3-dots-move" width="6rem" height="6rem" style="color: black" />
                </div>
            {:else if searchResults.length > 0}
                <div class="results">
                    {#each searchResults as result}
                        {#if result.isUser}
                            <a href={`/${result.username}`} class="userResult">
                                <img class="userPic" alt={result.displayName} src={result.photoURL} width="52px" height="52px" />
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
                        {#if timeline}
                            {#each timeline.posts.posts as post}
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

    .searchContainer {
        flex-grow: 1;
        height: 100vh;
        padding-inline: 1.2rem;
        background: var(--background-elevated-base);
        display: flex;
        flex-direction: column;
    }

    .searchForm {
        padding-block: 1rem;
    }

    .search {
        display: flex;
        flex-direction: row;
        gap: 0.3rem;
        align-items: center;
        padding: 0.5rem;
        background: var(--background-elevated-highlight);
        border: 0.1rem solid var(--background-elevated-press);
        color: var(--text-subdued);
        border-radius: 1rem;
    }

    .search input {
        padding: 0.4rem;
        width: 100%;
        height: 100%;
        background: none;
        border: none;
        font-size: 14px;
    }

    .search input:focus {
        border: none;
        outline: none;
    }

    .searchList {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        padding-block: 1rem;
        padding-inline: 0.3rem;
        border-bottom: 1px solid var(--gainsboro);
    }

    .searchList li a {
        text-decoration: none;
        color: var(--text-subdued);
    }

    .searchList li a:hover {
        text-decoration: underline;
    }

    .recentPosts {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        padding: 0.3rem;
    }

    .results {
        flex-grow: 1;
        overflow-y: auto;
    }

    .results::-webkit-scrollbar {
        width: 10px;
        background-color: var(--background-elevated-highlight);
    }

    .results::-webkit-scrollbar-thumb {
        background: var(--background-elevated-press);
        border-radius: 0.8rem;
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
        padding: 0.6rem;
        background: var(--white-smoke);
        border-radius: 999px;
        border: 0.1rem solid var(--background-elevated-press);
        color: var(--text-subdued);
        transition: background 0.3s;
    }

    .followButton:hover {
        background: var(--background-elevated-press);
    }

    .terms {
        display: flex;
        flex-direction: row;
        gap: 0.3rem;
        padding-block: 0.3rem;
        padding-inline: 0.5rem;
    }

    .terms li a {
        text-decoration: none;
    }

    .terms li a:hover {
        text-decoration: underline;
    }
</style>