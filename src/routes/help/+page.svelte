<script lang="ts">
    import Icon from "@iconify/svelte"
</script>

<svelte:head>
    <title>Ivory - Help</title>
</svelte:head>

<main class="staticPage">
    <a href="/" class="back" aria-label="Back">
        <Icon icon="material-symbols:arrow-back-rounded" width="22" height="22" />
    </a>
    <div class="prose">
        <h1>Help</h1>

        <h2>Posting</h2>
        <p>Tap <strong>Post</strong> to open the composer. You can attach an image, GIF or short video, and add a poll instead of media.</p>

        <h2>Editing a post</h2>
        <p>Open a post you wrote and use the menu to edit it within a short window after posting. Edited posts show an <strong>"edited"</strong> label — tap it to see earlier versions.</p>

        <h2>Privacy</h2>
        <p>Go to <strong>Settings → Privacy</strong> to make your account private, or to control who can see your followers and following lists.</p>

        <h2>Notifications</h2>
        <p>Follows, likes, replies, reposts and mentions all show up in <strong>Notifications</strong>. Turn on the bell on someone's profile to get notified about their new posts too.</p>

        <h2>Still stuck?</h2>
        <p>Send us a note through <a href="/feedback">Feedback</a>.</p>
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

    .prose a {
        color: var(--essential-announcement);
    }
</style>
