<script lang="ts">
    import Icon from "@iconify/svelte"
</script>

<svelte:head>
    <title>Ivory - Privacy</title>
</svelte:head>

<main class="staticPage">
    <a href="/" class="back" aria-label="Back">
        <Icon icon="material-symbols:arrow-back-rounded" width="22" height="22" />
    </a>
    <div class="prose">
        <h1>Privacy Policy</h1>
        <p>This is a short, plain-language summary of how Ivory handles your data.</p>

        <h2>What we store</h2>
        <p>Your profile (display name, username, bio, avatar and banner), the posts, replies, likes and reposts you make, who you follow, and your notification preferences.</p>

        <h2>Account visibility</h2>
        <p>You can make your account private in <strong>Settings → Privacy</strong>. When private, only approved followers can see your posts, and new followers need your approval.</p>

        <h2>What we don't do</h2>
        <p>We don't sell your data to third parties. Uploaded media is stored to display it back to you and the people you share it with, nothing else.</p>

        <h2>Changes</h2>
        <p>If this policy changes in a meaningful way, we'll let you know here.</p>
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
