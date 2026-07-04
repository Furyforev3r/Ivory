<script lang="ts">
    import Icon from "@iconify/svelte"

    export let verified = false
    export let admin = false
    export let size = "16"

    $: emojiSize = `${Math.round(Number(size) * 0.9)}px`
</script>

{#if admin}
    <span class="badge adminBadge" style={`width:${size}px;height:${size}px;font-size:${emojiSize}`} title="Admin">
        🔥
    </span>
{:else if verified}
    <span class="badge verifiedBadge" style={`width:${size}px;height:${size}px`} title="Verified">
        <Icon icon="material-symbols:check-rounded" width={`${Math.round(Number(size) * 0.72)}`} height={`${Math.round(Number(size) * 0.72)}`} />
    </span>
{/if}

<style>
    .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        border-radius: 50%;
        line-height: 1;
    }

    .verifiedBadge {
        background: var(--essential-announcement);
        color: #fff;
    }

    .adminBadge {
        background: color-mix(in srgb, #f7b500 18%, transparent);
    }
</style>
