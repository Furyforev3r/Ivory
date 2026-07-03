<script lang="ts">
    import Skeleton from "./+Skeleton.svelte"
</script>

<div class="postSkeleton">
    <Skeleton circle width="52px" height="52px" />
    <div class="lines">
        <Skeleton width="35%" height="14px" />
        <Skeleton width="92%" height="14px" />
        <Skeleton width="70%" height="14px" />
        <div class="iconsRow">
            <Skeleton width="20px" height="20px" radius="999px" />
            <Skeleton width="20px" height="20px" radius="999px" />
            <Skeleton width="20px" height="20px" radius="999px" />
            <Skeleton width="20px" height="20px" radius="999px" />
        </div>
    </div>
</div>

<style>
    .postSkeleton {
        display: flex;
        flex-direction: row;
        gap: 0.8rem;
        padding: 1rem;
        border-block: 1px solid var(--gainsboro);
    }

    .lines {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        flex-grow: 1;
        padding-top: 0.3rem;
    }

    .iconsRow {
        display: flex;
        flex-direction: row;
        gap: 1.6rem;
        margin-top: 0.4rem;
    }
</style>
