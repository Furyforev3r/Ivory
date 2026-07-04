<script lang="ts">
    import { createEventDispatcher } from "svelte"
    import axios from "axios"
    import Icon from "@iconify/svelte"
    import { fade, scale } from "svelte/transition"
    import Skeleton from "./+Skeleton.svelte"
    import UserBadges from "./+UserBadges.svelte"

    export let title: string
    export let targetUID: string
    export let mode: "followers" | "following"
    export let requesterUID: string | null = null

    const dispatch = createEventDispatcher()

    let users: any[] | null = null
    let errorMessage = ""

    async function load() {
        try {
            const endpoint = mode === "followers" ? "getFollowers" : "getFollowing"
            const response = await axios.get(`/api/${endpoint}?targetUID=${targetUID}${requesterUID ? `&uid=${requesterUID}` : ""}`)
            users = response.data.users
        } catch (error: any) {
            errorMessage = error?.response?.data?.error || "Could not load this list"
            users = []
        }
    }

    load()

    function close() {
        dispatch("close")
    }
</script>

<div class="overlay" on:click|self={close} role="presentation" transition:fade={{ duration: 150 }}>
    <div class="modal" transition:scale={{ duration: 150, start: 0.96 }}>
        <div class="head">
            <p class="title">{title}</p>
            <button type="button" on:click={close} aria-label="Close">
                <Icon icon="material-symbols:close-rounded" width="20" height="20" />
            </button>
        </div>
        <div class="list">
            {#if users === null}
                {#each Array(4) as _}
                    <div class="row">
                        <Skeleton circle width="44px" height="44px" />
                        <div class="lines">
                            <Skeleton width="100px" height="12px" />
                            <Skeleton width="70px" height="10px" />
                        </div>
                    </div>
                {/each}
            {:else if errorMessage}
                <p class="empty">{errorMessage}</p>
            {:else if users.length === 0}
                <p class="empty">Nothing to show here.</p>
            {:else}
                {#each users as listedUser (listedUser.uid)}
                    <a class="row" href={`/${listedUser.username}`} on:click={close}>
                        <img class="avatar" src={listedUser.photoURL} alt={listedUser.displayName} width="44" height="44" loading="lazy" />
                        <div class="info">
                            <p class="displayName">
                                {listedUser.displayName}
                                <UserBadges verified={listedUser.verified} admin={listedUser.admin} size="13" />
                            </p>
                            <p class="username">@{listedUser.username}</p>
                        </div>
                    </a>
                {/each}
            {/if}
        </div>
    </div>
</div>

<style>
    .overlay {
        position: fixed;
        inset: 0;
        z-index: 900;
        overflow: auto;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
    }

    .modal {
        margin-top: 5%;
        width: 40%;
        max-height: 70%;
        overflow-y: auto;
        background: var(--background-base);
        border-radius: 1rem;
        box-shadow: 0 10px 40px var(--shadow-color);
        display: flex;
        flex-direction: column;
    }

    .head {
        position: sticky;
        top: 0;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.2rem;
        border-bottom: 1px solid var(--gainsboro);
        background: var(--background-base);
    }

    .title {
        font-size: 18px;
        font-weight: 800;
    }

    .head button {
        cursor: pointer;
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--text-base);
    }

    .head button:hover {
        background: var(--background-highlight);
    }

    .list {
        display: flex;
        flex-direction: column;
    }

    .row {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.7rem;
        padding: 0.8rem 1.2rem;
        text-decoration: none;
        color: var(--text-base);
        transition: background 0.2s;
    }

    a.row:hover {
        background: var(--background-highlight);
    }

    .avatar {
        border-radius: 50%;
        object-fit: cover;
        overflow: hidden;
        border: 1px solid var(--gainsboro);
        background: var(--background-elevated-highlight);
    }

    .info {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .displayName {
        font-weight: 700;
        font-size: 14px;
    }

    .username {
        color: var(--text-subdued);
        font-size: 13px;
    }

    .lines {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .empty {
        text-align: center;
        padding: 2.5rem 1rem;
        color: var(--text-subdued);
    }

    @media (max-width: 700px) {
        .modal {
            width: 92%;
        }
    }
</style>
