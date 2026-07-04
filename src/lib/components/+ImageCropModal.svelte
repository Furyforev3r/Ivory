<script lang="ts">
    import { createEventDispatcher, onMount, onDestroy } from "svelte"
    import { fade, scale } from "svelte/transition"
    import Icon from "@iconify/svelte"

    export let file: File
    export let shape: "circle" | "rect" = "circle"
    export let aspect = 1
    export let outputWidth = 400
    export let outputHeight = 400
    export let title = "Crop image"

    const dispatch = createEventDispatcher()

    let imageURL = ""
    let image: HTMLImageElement
    let viewport: HTMLDivElement
    let viewportW = 0
    let saving = false

    $: viewportH = viewportW / aspect

    let naturalW = 0
    let naturalH = 0
    let baseScale = 1
    let zoom = 1
    let panX = 0
    let panY = 0

    let dragging = false
    let dragStartX = 0
    let dragStartY = 0
    let panStartX = 0
    let panStartY = 0

    onMount(() => {
        imageURL = URL.createObjectURL(file)
    })

    onDestroy(() => {
        if (imageURL) URL.revokeObjectURL(imageURL)
    })

    function handleImageLoad() {
        naturalW = image.naturalWidth
        naturalH = image.naturalHeight
        recomputeBaseScale()
    }

    function recomputeBaseScale() {
        if (!naturalW || !naturalH || !viewportW || !viewportH) return
        baseScale = Math.max(viewportW / naturalW, viewportH / naturalH)
        panX = 0
        panY = 0
    }

    $: if (viewportW && naturalW) recomputeBaseScale()

    function clampPan() {
        const scale = baseScale * zoom
        const maxPanX = Math.max(0, (naturalW * scale - viewportW) / 2)
        const maxPanY = Math.max(0, (naturalH * scale - viewportH) / 2)
        panX = Math.min(maxPanX, Math.max(-maxPanX, panX))
        panY = Math.min(maxPanY, Math.max(-maxPanY, panY))
    }

    function handlePointerDown(event: PointerEvent) {
        dragging = true
        dragStartX = event.clientX
        dragStartY = event.clientY
        panStartX = panX
        panStartY = panY
        viewport.setPointerCapture(event.pointerId)
    }

    function handlePointerMove(event: PointerEvent) {
        if (!dragging) return
        panX = panStartX + (event.clientX - dragStartX)
        panY = panStartY + (event.clientY - dragStartY)
        clampPan()
    }

    function handlePointerUp(event: PointerEvent) {
        dragging = false
        if (viewport?.hasPointerCapture?.(event.pointerId)) {
            viewport.releasePointerCapture(event.pointerId)
        }
    }

    function handleZoomInput() {
        clampPan()
    }

    function cancel() {
        dispatch("cancel")
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape") cancel()
    }

    async function apply() {
        saving = true

        const canvas = document.createElement("canvas")
        canvas.width = outputWidth
        canvas.height = outputHeight
        const ctx = canvas.getContext("2d")

        const factor = outputWidth / viewportW
        const scale = baseScale * zoom * factor

        if (shape === "circle") {
            ctx.beginPath()
            ctx.arc(outputWidth / 2, outputHeight / 2, outputWidth / 2, 0, Math.PI * 2)
            ctx.clip()
        }

        ctx.translate(outputWidth / 2 + panX * factor, outputHeight / 2 + panY * factor)
        ctx.scale(scale, scale)
        ctx.drawImage(image, -naturalW / 2, -naturalH / 2)

        canvas.toBlob(
            (blob) => {
                saving = false
                if (blob) {
                    dispatch("crop", { blob })
                }
            },
            "image/jpeg",
            0.9
        )
    }
</script>

<svelte:window on:keydown={handleKeydown} />
<div class="cropOverlay" transition:fade={{ duration: 150 }} on:click|self={cancel} role="presentation">
    <div class="cropModal" transition:scale={{ duration: 150, start: 0.96 }}>
        <div class="cropHead">
            <h3>{title}</h3>
            <button type="button" class="iconButton" on:click={cancel} aria-label="Cancel">
                <Icon icon="charm:cross" width="22" height="22" />
            </button>
        </div>

        <div
            class="viewport"
            class:circleMask={shape === "circle"}
            bind:this={viewport}
            bind:clientWidth={viewportW}
            style={`height:${viewportH}px`}
            on:pointerdown={handlePointerDown}
            on:pointermove={handlePointerMove}
            on:pointerup={handlePointerUp}
            on:pointercancel={handlePointerUp}
        >
            {#if imageURL}
                <img
                    bind:this={image}
                    src={imageURL}
                    alt="Crop preview"
                    draggable="false"
                    on:load={handleImageLoad}
                    style={`transform: translate(${panX}px, ${panY}px) scale(${baseScale * zoom}) translate(-50%, -50%); width:${naturalW}px; height:${naturalH}px;`}
                />
            {/if}
            <div class="viewportRing" class:circleRing={shape === "circle"}></div>
        </div>

        <div class="zoomRow">
            <Icon icon="material-symbols:zoom-out-rounded" width="20" height="20" />
            <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                bind:value={zoom}
                on:input={handleZoomInput}
            />
            <Icon icon="material-symbols:zoom-in-rounded" width="20" height="20" />
        </div>

        <div class="cropActions">
            <button type="button" class="cancelButton" on:click={cancel}>Cancel</button>
            <button type="button" class="applyButton" on:click={apply} disabled={saving}>
                {saving ? "Saving..." : "Apply"}
            </button>
        </div>
    </div>
</div>

<style>
    .cropOverlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: grid;
        place-items: center;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        padding: 1rem;
    }

    .cropModal {
        width: 100%;
        max-width: 420px;
        background: var(--background-base);
        border-radius: 1.2rem;
        padding: 1.2rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        box-shadow: 0 10px 40px var(--shadow-color);
    }

    .cropHead {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }

    .cropHead h3 {
        font-size: 18px;
        font-weight: 700;
        color: var(--text-base);
    }

    .iconButton {
        cursor: pointer;
        border: none;
        background: none;
        color: var(--text-base);
        display: grid;
        place-items: center;
        padding: 0.3rem;
        border-radius: 999px;
        transition: background 0.2s;
    }

    .iconButton:hover {
        background: var(--background-highlight);
    }

    .viewport {
        position: relative;
        width: 100%;
        overflow: hidden;
        border-radius: 0.8rem;
        background: #0a0a0a;
        touch-action: none;
        cursor: grab;
        user-select: none;
    }

    .viewport:active {
        cursor: grabbing;
    }

    .viewport img {
        position: absolute;
        top: 50%;
        left: 50%;
        max-width: none;
        transform-origin: center center;
        pointer-events: none;
    }

    .viewportRing {
        position: absolute;
        inset: 0;
        pointer-events: none;
        border: 2px solid rgba(255, 255, 255, 0.85);
        box-sizing: border-box;
    }

    .circleMask {
        border-radius: 999px;
    }

    .circleRing {
        border-radius: 999px;
    }

    .zoomRow {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.6rem;
        color: var(--text-subdued);
    }

    .zoomRow input[type="range"] {
        flex-grow: 1;
        accent-color: var(--essential-announcement);
    }

    .cropActions {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        gap: 0.6rem;
    }

    .cancelButton, .applyButton {
        cursor: pointer;
        padding: 0.7rem 1.2rem;
        border-radius: 999px;
        font-weight: 600;
        font-size: 14px;
        border: 0.1rem solid var(--background-elevated-press);
        transition: background 0.2s, opacity 0.2s;
    }

    .cancelButton {
        background: var(--white-smoke);
        color: var(--text-subdued);
    }

    .cancelButton:hover {
        background: var(--background-elevated-press);
    }

    .applyButton {
        background: var(--essential-announcement);
        color: #fff;
        border-color: var(--essential-announcement);
    }

    .applyButton:hover {
        opacity: 0.9;
    }

    .applyButton:disabled {
        opacity: 0.6;
        cursor: default;
    }
</style>
