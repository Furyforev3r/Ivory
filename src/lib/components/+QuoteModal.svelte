<script lang="ts">
    import { createEventDispatcher } from "svelte"
    import { fade, scale } from "svelte/transition"
    import Icon from "@iconify/svelte"

    export let originalPost
    export let originalAuthor

    let quoteValue = ""
    let saving = false

    const dispatch = createEventDispatcher()

    function cancel() {
        dispatch("cancel")
    }

    function submit() {
        if (saving) return
        saving = true
        dispatch("submit", { quote: quoteValue.trim() })
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape") cancel()
    }
</script>

<svelte:window on:keydown={handleKeydown} />
<div class="quoteOverlay" transition:fade={{ duration: 150 }} on:click|self={cancel} role="presentation">
    <div class="quoteModal" transition:scale={{ duration: 150, start: 0.96 }}>
        <div class="quoteHead">
            <button type="button" on:click={cancel} aria-label="Cancel">
                <Icon icon="charm:cross" width="22" height="22" />
            </button>
            <button type="button" class="submitButton" on:click={submit} disabled={saving}>
                {saving ? "Posting..." : "Repost"}
            </button>
        </div>
        <textarea placeholder="Add a comment" bind:value={quoteValue} maxlength="300"></textarea>
        {#if originalAuthor && originalPost}
            <div class="embeddedPost">
                <div class="embeddedHead">
                    <img src={originalAuthor.photoURL} alt={originalAuthor.displayName} width="24" height="24" />
                    <p class="displayName">{originalAuthor.displayName}</p>
                    <p class="username">@{originalAuthor.username}</p>
                </div>
                <p class="content">{originalPost.content}</p>
            </div>
        {/if}
    </div>
</div>

<style>
    .quoteOverlay {
        position: fixed;
        inset: 0;
        z-index: 950;
        display: grid;
        place-items: center;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        padding: 1rem;
    }

    .quoteModal {
        width: 100%;
        max-width: 420px;
        background: var(--background-base);
        border-radius: 1rem;
        padding: 1.2rem;
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        box-shadow: 0 10px 40px var(--shadow-color);
    }

    .quoteHead {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }

    .quoteHead button {
        cursor: pointer;
        border: none;
        background: none;
        color: var(--text-base);
        display: grid;
        place-items: center;
        padding: 0.3rem;
        border-radius: 999px;
    }

    .submitButton {
        padding: 0.6rem 1.1rem !important;
        background: var(--essential-announcement);
        color: #fff !important;
        font-weight: 700;
        border-radius: 999px !important;
    }

    .submitButton:disabled {
        opacity: 0.6;
        cursor: default;
    }

    textarea {
        min-height: 5rem;
        padding: 0.8rem;
        background: var(--background-elevated-highlight);
        border: none;
        outline: none;
        border-radius: 0.8rem;
        color: var(--text-base);
        font-family: inherit;
        font-size: 15px;
        resize: none;
    }

    .embeddedPost {
        border: 1px solid var(--gainsboro);
        border-radius: 0.8rem;
        padding: 0.8rem;
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }

    .embeddedHead {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.4rem;
    }

    .embeddedHead img {
        border-radius: 50%;
        object-fit: cover;
        overflow: hidden;
        background: var(--background-elevated-highlight);
    }

    .displayName {
        font-weight: 700;
        font-size: 14px;
    }

    .username {
        color: var(--text-subdued);
        font-size: 14px;
    }

    .content {
        font-size: 14px;
        word-break: break-word;
        color: var(--text-base);
    }
</style>
