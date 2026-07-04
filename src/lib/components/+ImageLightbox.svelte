<script lang="ts">
    import { createEventDispatcher } from "svelte"
    import { fade, scale } from "svelte/transition"
    import Icon from "@iconify/svelte"

    export let src: string
    export let alt = "Image"

    const dispatch = createEventDispatcher()

    function close() {
        dispatch("close")
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape") close()
    }
</script>

<svelte:window on:keydown={handleKeydown} />
<div class="lightboxOverlay" transition:fade={{ duration: 150 }} on:click|self={close} role="presentation">
    <button type="button" class="closeButton" on:click={close} aria-label="Close">
        <Icon icon="material-symbols:close-rounded" width="26" height="26" />
    </button>
    <img class="lightboxImage" {src} {alt} transition:scale={{ duration: 150, start: 0.96 }} />
</div>

<style>
    .lightboxOverlay {
        position: fixed;
        inset: 0;
        z-index: 1100;
        display: grid;
        place-items: center;
        background: rgba(0, 0, 0, 0.85);
        padding: 2rem;
    }

    .lightboxImage {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 0.4rem;
    }

    .closeButton {
        position: fixed;
        top: 1rem;
        right: 1rem;
        cursor: pointer;
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        transition: background 0.2s;
    }

    .closeButton:hover {
        background: rgba(255, 255, 255, 0.2);
    }
</style>
