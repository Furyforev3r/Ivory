<script lang="ts">
    import Icon from "@iconify/svelte"
</script>

<svelte:head>
    <title>Ivory - Terms</title>
</svelte:head>

<main class="staticPage">
    <a href="/" class="back" aria-label="Back">
        <Icon icon="material-symbols:arrow-back-rounded" width="22" height="22" />
    </a>
    <div class="prose">
        <h1>Terms of Service</h1>
        <p>By using Ivory, you agree to the following, kept intentionally short:</p>

        <h2>Your content</h2>
        <p>What you post is yours. By posting it, you allow Ivory to store and display it back to you and whoever you choose to share it with.</p>

        <h2>Be decent</h2>
        <p>No harassment, no spam, no impersonation. Accounts that break this may be restricted or removed.</p>

        <h2>No warranty</h2>
        <p>Ivory is provided as-is, without guarantees. Things may occasionally break — if they do, please tell us via Feedback.</p>

        <h2>Changes</h2>
        <p>These terms may be updated as the app evolves.</p>
    </div>
</main>

<style>
    .staticPage {
        max-width: 640px;
        margin-inline: auto;
        min-height: 100dvh;
        padding: 1.2rem;
    }

    .back {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        border-radius: 999px;
        color: var(--text-base);
        transition: background 0.2s;
    }

    .back:hover {
        background: var(--background-highlight);
    }

    .prose {
        padding-block: 1rem 4rem;
    }

    .prose h1 {
        font-size: 26px;
        font-weight: 800;
        margin-bottom: 0.6rem;
    }

    .prose h2 {
        font-size: 18px;
        font-weight: 700;
        margin-top: 1.6rem;
        margin-bottom: 0.4rem;
    }

    .prose p {
        color: var(--text-subdued);
        line-height: 1.6;
    }
</style>
