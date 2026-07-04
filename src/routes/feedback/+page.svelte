<script lang="ts">
    import Icon from "@iconify/svelte"
</script>

<svelte:head>
    <title>Ivory - Feedback</title>
</svelte:head>

<main class="staticPage">
    <a href="/" class="back" aria-label="Back">
        <Icon icon="material-symbols:arrow-back-rounded" width="22" height="22" />
    </a>
    <div class="prose">
        <h1>Feedback</h1>
        <p>We'd love to hear what you think of Ivory.</p>

        <h2>Found a bug?</h2>
        <p>Tell us what happened, what you expected instead, and the steps to reproduce it. Screenshots help a lot.</p>

        <h2>Have an idea?</h2>
        <p>Ivory is still young. If there's a feature you're missing or something that feels clunky, let us know — most of what's here today started as feedback like that.</p>

        <h2>Get in touch</h2>
        <p>Reach out to <strong>@FuryForev3r</strong> directly on Ivory, or open an issue on the project's repository.</p>
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

    .prose strong {
        color: var(--text-base);
    }
</style>
