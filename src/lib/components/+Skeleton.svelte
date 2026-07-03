<script lang="ts">
    export let width = "100%"
    export let height = "1rem"
    export let radius = "0.4rem"
    export let circle = false
</script>

<span
    class="skeleton"
    style={`width:${width};height:${height};border-radius:${circle ? "50%" : radius};`}
></span>

<style>
    .skeleton {
        display: inline-block;
        flex-shrink: 0;
        background: linear-gradient(
            90deg,
            var(--background-elevated-highlight) 25%,
            var(--background-elevated-press) 37%,
            var(--background-elevated-highlight) 63%
        );
        background-size: 400% 100%;
        animation: shimmer 1.4s ease infinite;
    }

    @keyframes shimmer {
        0% {
            background-position: 100% 50%;
        }
        100% {
            background-position: 0 50%;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .skeleton {
            animation: none;
        }
    }
</style>
