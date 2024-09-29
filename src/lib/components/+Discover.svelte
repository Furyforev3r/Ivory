<script lang="ts">
    import Icon from "@iconify/svelte"
</script>

<div class="discover">
    <form class="searchForm">
        <div class="search">
            <Icon icon="material-symbols:search" width="30px" height="26px" class="icon" />
            <input type="search" name="searchInput" placeholder="Search...">
        </div>
    </form>
    <ul class="discoverList">
        <li>
            <a href="/discover">Discover</a>
        </li>
        <li>
            <a href="">Following</a>
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
        width: 25%;
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