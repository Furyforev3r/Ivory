<script lang="ts">
    import Skeleton from "./+Skeleton.svelte"
</script>

<div class="replySkeleton">
    <Skeleton circle width="40px" height="40px" />
    <div class="lines">
        <Skeleton width="30%" height="12px" />
        <Skeleton width="70%" height="14px" />
    </div>
</div>

<style>
    .replySkeleton {
        display: flex;
        flex-direction: row;
        gap: 0.7rem;
        padding: 0.8rem 1rem;
        border-bottom: 1px solid var(--gainsboro);
    }

    .lines {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex-grow: 1;
        padding-top: 0.3rem;
    }
</style>
