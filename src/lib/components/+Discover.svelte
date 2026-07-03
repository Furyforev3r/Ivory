<script lang="ts">
    import Icon from "@iconify/svelte"
    import { goto } from "$app/navigation"

    function handleSearch(event: Event) {
        event.preventDefault()
        goto('/search')
    }
</script>

<div class="discover">
    <form class="searchForm" on:submit|preventDefault={handleSearch}>
        <div class="search">
            <Icon icon="material-symbols:search" width="30px" height="26px" class="icon" />
            <input type="search" name="searchInput" placeholder="Search...">
        </div>
    </form>
    <ul class="discoverList">
        <li>
            <a href="/">Discover</a>
        </li>
        <li>
            <span class="disabled">Following <em>Soon</em></span>
        </li>
    </ul>
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
        min-width: 25%;
        max-width: 25%;
        padding-inline: 1.2rem;
        background: var(--background-elevated-base);
    }

    .searchForm {
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

    .discoverList {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        padding-block: 1rem;
        padding-inline: 0.3rem;
        border-bottom: 1px solid var(--gainsboro);
    }

    .discoverList li a {
        text-decoration: none;
        color: var(--text-subdued);
    }

    .discoverList li a:hover {
        text-decoration: underline;
    }

    .disabled {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        color: var(--text-subdued);
        opacity: 0.6;
        cursor: default;
    }

    .disabled em {
        font-style: normal;
        font-size: 11px;
        font-weight: 700;
        padding: 0.1rem 0.4rem;
        border-radius: 999px;
        background: var(--background-elevated-highlight);
    }

    .terms {
        display: flex;
        flex-direction: row;
        gap: 0.3rem;
        padding-block: 1rem;
        padding-inline: 0.5rem;
    }

    .terms li a {
        text-decoration: none;
    }

    .terms li a:hover {
        text-decoration: underline;
    }

    @media (max-width: 800px) {
        .discover {
            display: none;
        }
    }
</style>