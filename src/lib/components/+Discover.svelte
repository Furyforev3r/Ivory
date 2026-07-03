<script lang="ts">
    import Icon from "@iconify/svelte"
    import { goto } from "$app/navigation"
    import { onMount } from "svelte"
    import axios from "axios"
    import { user } from "$lib/client/hooks/loginState"
    import { searchHistory, addSearchHistory, removeSearchHistoryItem } from "$lib/client/utils/searchHistory"

    let userInfo: any
    $: userInfo = $user

    let query = ""
    let showHistory = false
    let suggestions: any[] = []
    let followBusy: Record<string, boolean> = {}

    onMount(async () => {
        if (userInfo && userInfo !== "Loading...") {
            try {
                const response = await axios.get(`/api/getSuggestedUsers?uid=${userInfo.uid}&limit=3`)
                suggestions = response.data.users
            } catch (error) {
                console.error(error)
            }
        }
    })

    function runSearch(value: string) {
        const trimmed = value.trim()
        if (!trimmed) return
        addSearchHistory(trimmed)
        showHistory = false
        goto(`/search?q=${encodeURIComponent(trimmed)}`)
    }

    function handleSearch(event: Event) {
        event.preventDefault()
        runSearch(query)
    }

    function useHistoryItem(item: string) {
        query = item
        runSearch(item)
    }

    async function followSuggestion(target: any) {
        if (followBusy[target.uid] || !userInfo) return

        followBusy = { ...followBusy, [target.uid]: true }

        try {
            await axios.post(
                `/api/toggleFollow?token=${userInfo.accessToken}&uid=${userInfo.uid}`,
                { targetUID: target.uid }
            )
            suggestions = suggestions.filter((suggestion) => suggestion.uid !== target.uid)
        } catch (error) {
            followBusy = { ...followBusy, [target.uid]: false }
        }
    }
</script>

<svelte:window on:click={() => showHistory = false} />

<div class="discover">
    <form class="searchForm" on:submit|preventDefault|stopPropagation={handleSearch}>
        <div class="search">
            <Icon icon="material-symbols:search" width="22px" height="22px" />
            <input
                type="search"
                name="searchInput"
                placeholder="Search..."
                bind:value={query}
                on:click|stopPropagation
                on:focus={() => showHistory = true}
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

    {#if suggestions.length > 0}
        <div class="suggestions">
            <h3>Who to follow</h3>
            {#each suggestions as suggestion (suggestion.uid)}
                <div class="suggestionRow">
                    <a href={`/${suggestion.username}`} class="suggestionLink">
                        <img src={suggestion.photoURL} alt={suggestion.displayName} class="suggestionAvatar" loading="lazy" />
                        <div class="suggestionInfo">
                            <p class="displayName">{suggestion.displayName}</p>
                            <p class="username">@{suggestion.username}</p>
                        </div>
                    </a>
                    <button
                        type="button"
                        class="followSuggestionButton"
                        on:click={() => followSuggestion(suggestion)}
                        disabled={followBusy[suggestion.uid]}
                    >
                        Follow
                    </button>
                </div>
            {/each}
        </div>
    {/if}

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
</div>

<style>
    .discover {
        height: 100%;
        max-height: 100vh;
        overflow-y: auto;
        flex: 0 0 auto;
        width: 320px;
        padding-inline: 1.2rem;
        background: var(--background-elevated-base);
    }

    .searchForm {
        position: relative;
        padding-block: 1rem;
        border-bottom: 1px solid var(--gainsboro);
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
        font-size: 14px;
        color: var(--text-base);
    }

    .search input:focus {
        border: none;
        outline: none;
    }

    .historyDropdown {
        position: absolute;
        top: calc(100% - 0.6rem);
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

    .suggestions {
        padding-block: 1rem;
        border-bottom: 1px solid var(--gainsboro);
    }

    .suggestions h3 {
        font-size: 18px;
        font-weight: 800;
        padding-inline: 0.3rem;
        margin-bottom: 0.4rem;
    }

    .suggestionRow {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.6rem;
        padding: 0.6rem 0.3rem;
        border-radius: 0.6rem;
    }

    .suggestionRow:hover {
        background: var(--background-highlight);
    }

    .suggestionLink {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.6rem;
        flex-grow: 1;
        min-width: 0;
        text-decoration: none;
        color: var(--text-base);
    }

    .suggestionAvatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
        overflow: hidden;
        background: var(--background-elevated-highlight);
        border: 1px solid var(--gainsboro);
        flex-shrink: 0;
    }

    .suggestionInfo {
        min-width: 0;
    }

    .displayName {
        font-weight: 700;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .username {
        color: var(--text-subdued);
        font-size: 13px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .followSuggestionButton {
        flex-shrink: 0;
        cursor: pointer;
        padding: 0.5rem 0.9rem;
        border-radius: 999px;
        border: none;
        background: var(--text-base);
        color: var(--background-base);
        font-weight: 700;
        font-size: 13px;
        transition: opacity 0.2s;
    }

    .followSuggestionButton:hover {
        opacity: 0.85;
    }

    .followSuggestionButton:disabled {
        opacity: 0.5;
        cursor: default;
    }

    .terms {
        display: flex;
        flex-direction: row;
        gap: 0.3rem;
        padding-block: 1rem;
        padding-inline: 0.5rem;
        flex-wrap: wrap;
    }

    .terms li a {
        text-decoration: none;
        color: var(--text-subdued);
    }

    .terms li a:hover {
        text-decoration: underline;
    }

    @media (max-width: 1100px) {
        .discover {
            display: none;
        }
    }
</style>
