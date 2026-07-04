<script lang="ts">
    import Icon from "@iconify/svelte"

    export let verified = false
    export let admin = false
    export let size = "16"
</script>

{#if admin}
    <span class="badge adminBadge" title="Admin">
        <Icon icon="material-symbols:shield-rounded" width={size} height={size} />
    </span>
{:else if verified}
    <span class="badge verifiedBadge" title="Verified">
        <Icon icon="material-symbols:verified-rounded" width={size} height={size} />
    </span>
{/if}

<style>
    .badge {
        display: inline-flex;
        flex-shrink: 0;
    }

    .verifiedBadge {
        color: var(--essential-announcement);
    }

    .adminBadge {
        color: #f7b500;
    }
</style>
