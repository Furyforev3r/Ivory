<script lang="ts">
    import { user } from "$lib/client/hooks/loginState"
    import { account, ensureAccount } from "$lib/client/hooks/accountState"
    import Icon from "@iconify/svelte"
    import { logout } from "$lib/client/utils/firebaseUtils"
    import { page } from "$app/stores"
    import Skeleton from "./+Skeleton.svelte"
    import { fade, scale } from "svelte/transition"
    import { unreadCount, ensureNotifications } from "$lib/client/hooks/notificationsState"
    import Composer from "./+Composer.svelte"

    let userInfo: any
    let userAccount

    $: userInfo = $user
    $: userAccount = $account
    $: if (userInfo && userInfo !== "Loading...") ensureAccount(userInfo.uid)
    $: if (userInfo && userInfo !== "Loading...") ensureNotifications(userInfo.uid, userInfo.accessToken)
    $: currentPath = $page.url.pathname

    let post = false

    let accountMenuOpen = false
    let chipWrapperEl: HTMLDivElement

    function toggleAccountMenu() {
        accountMenuOpen = !accountMenuOpen
    }

    function handleWindowClick(event: MouseEvent) {
        if (accountMenuOpen && chipWrapperEl && !chipWrapperEl.contains(event.target as Node)) {
            accountMenuOpen = false
        }
    }

    function togglePost() {
        post = !post
    }

    function handlePosted() {
        post = false
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape" && post) {
            togglePost()
        }
    }

    function isActive(path: string) {
        return path === "/" ? currentPath === "/" : currentPath.startsWith(path)
    }
</script>

<svelte:window on:keydown={handleKeydown} on:click={handleWindowClick} />
<nav class="tabs">
    {#if post}
        <div class="postToast" on:click|self={togglePost} role="presentation" transition:fade={{ duration: 150 }}>
            <div class="postToastContainer" transition:scale={{ duration: 150, start: 0.96 }}>
                <div class="toastHead">
                    <button on:click={togglePost}>Cancel</button>
                </div>
                <Composer variant="modal" autofocus on:posted={handlePosted} />
            </div>
        </div>
    {/if}

    <ul>
        <div class="logoSpacer" aria-hidden="true"></div>
        <li>
            <a href='/' class:selected={isActive('/')}>
                <Icon icon={isActive('/') ? "material-symbols:home-rounded" : "material-symbols:home-outline-rounded"} width="28px" height="28px" />
                <p>Home</p>
            </a>
        </li>
        <li>
            <a href="/search" class:selected={isActive('/search')}>
                <Icon icon="material-symbols:search" width="28px" height="28px" />
                <p>Search</p>
            </a>
        </li>
        <li>
            <a href="/notifications" class="notificationsLink" class:selected={isActive('/notifications')}>
                <span class="iconWithBadge">
                    <Icon icon={isActive('/notifications') ? "material-symbols:notifications-rounded" : "material-symbols:notifications-outline-rounded"} width="28px" height="28px" />
                    {#if $unreadCount > 0}
                        <span class="badge">{$unreadCount > 9 ? '9+' : $unreadCount}</span>
                    {/if}
                </span>
                <p>Notifications</p>
            </a>
        </li>
        <li>
            <a href="/bookmarks" class:selected={isActive('/bookmarks')}>
                <Icon icon={isActive('/bookmarks') ? "material-symbols:bookmark-rounded" : "material-symbols:bookmark-outline-rounded"} width="28px" height="28px" />
                <p>Bookmarks</p>
            </a>
        </li>
        <li>
            <a href={userAccount ? `/${userAccount.user.username}` : '#'} class:selected={userAccount && currentPath === `/${userAccount.user.username}`}>
                <Icon icon={userAccount && currentPath === `/${userAccount.user.username}` ? "material-symbols:account-circle" : "material-symbols:account-circle-outline"} width="28px" height="28px" />
                <p>Profile</p>
            </a>
        </li>
        <li>
            <a href="/settings" class:selected={isActive('/settings')}>
                <Icon icon={isActive('/settings') ? "material-symbols:settings" : "material-symbols:settings-outline-rounded"} width="28px" height="28px" />
                <p>Settings</p>
            </a>
        </li>
        <button class="postButton" on:click={togglePost} >
            <Icon icon="material-symbols:edit-square-outline-rounded" width="22px" height="22px" color="fff" />
            <p>Post</p>
        </button>

        <div class="chipWrapper" bind:this={chipWrapperEl}>
            <div class="profileChip">
                <a href={userAccount ? `/${userAccount.user.username}` : '#'} class="profileChipLink">
                    {#if userAccount}
                        <img
                            src={userAccount.user.photoURL}
                            width="40px"
                            height="40px"
                            class="chipAvatar"
                            alt="Your avatar"
                        />
                        <span class="chipInfo">
                            <span class="chipName">{userAccount.user.displayName}</span>
                            <span class="chipHandle">@{userAccount.user.username}</span>
                        </span>
                    {:else}
                        <Skeleton circle width="40px" height="40px" />
                    {/if}
                </a>
                <button class="chipMenuButton" on:click={toggleAccountMenu} aria-label="Account menu">
                    <Icon icon="material-symbols:more-horiz" width="20px" height="20px" />
                </button>
            </div>
            {#if accountMenuOpen}
                <div class="accountMenu" transition:fade={{ duration: 120 }}>
                    <button on:click={logout}>
                        <Icon icon="material-symbols:logout-rounded" width="18px" height="18px" />
                        Log out
                    </button>
                </div>
            {/if}
        </div>
    </ul>
</nav>

<button class="fab" on:click={togglePost} aria-label="New post">
    <Icon icon="material-symbols:edit-square-outline-rounded" width="24px" height="24px" color="fff" />
</button>

<nav class="bottomNav">
    <a href='/' class:selected={isActive('/')} aria-label="Home">
        <Icon icon={isActive('/') ? "material-symbols:home-rounded" : "material-symbols:home-outline-rounded"} width="26px" height="26px" />
    </a>
    <a href="/search" class:selected={isActive('/search')} aria-label="Search">
        <Icon icon="material-symbols:search" width="26px" height="26px" />
    </a>
    <a href="/notifications" class:selected={isActive('/notifications')} aria-label="Notifications">
        <span class="iconWithBadge">
            <Icon icon={isActive('/notifications') ? "material-symbols:notifications-rounded" : "material-symbols:notifications-outline-rounded"} width="26px" height="26px" />
            {#if $unreadCount > 0}
                <span class="badge">{$unreadCount > 9 ? '9+' : $unreadCount}</span>
            {/if}
        </span>
    </a>
    <a
        href={userAccount ? `/${userAccount.user.username}` : '#'}
        class:selected={userAccount && currentPath === `/${userAccount.user.username}`}
        aria-label="Profile"
    >
        <Icon icon={userAccount && currentPath === `/${userAccount.user.username}` ? "material-symbols:account-circle" : "material-symbols:account-circle-outline"} width="26px" height="26px" />
    </a>
    <a href="/settings" class:selected={isActive('/settings')} aria-label="Settings">
        <Icon icon={isActive('/settings') ? "material-symbols:settings" : "material-symbols:settings-outline-rounded"} width="26px" height="26px" />
    </a>
</nav>

<style>
    .postToast {
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

    .postToastContainer {
        overflow-y: auto;
        max-height: 70%;
        box-shadow: 0 10px 40px var(--shadow-color);
        margin-top: 5%;
        width: 40%;
        background: var(--background-base);
        padding: 1.2rem;
        border-radius: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
    }

    .toastHead {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
    }

    .toastHead button {
        cursor: pointer;
        padding: 0.6rem 1.1rem;
        background: var(--white-smoke);
        border-radius: 999px;
        border: 0.1rem solid var(--background-elevated-press);
        color: var(--text-subdued);
        font-weight: 600;
        transition: background 0.2s;
    }

    .toastHead button:hover {
        background: var(--background-elevated-press);
    }

    .tabs {
        overflow: auto;
        overflow-x: hidden;
        height: 100%;
        max-height: 100vh;
        flex: 0 0 auto;
        width: 275px;
        padding-inline: 0.8rem;
        background: var(--background-elevated-base);
    }

    .logoSpacer {
        width: 44px;
        height: 44px;
        margin-bottom: 0.4rem;
    }

    .tabs ul {
        min-height: calc(100% - 2.4rem);
        padding-block: 1.2rem;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .chipWrapper {
        position: relative;
        margin-top: auto;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.3rem;
        padding-top: 0.8rem;
    }

    .profileChip {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.2rem;
        padding: 0.5rem;
        border-radius: 999px;
        transition: background 0.2s;
    }

    .profileChip:hover {
        background: var(--background-highlight);
    }

    .profileChipLink {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.6rem;
        text-decoration: none;
    }

    .chipAvatar {
        min-width: 40px;
        width: 40px;
        height: 40px;
        border: 1px solid var(--white-smoke);
        border-radius: 50%;
        object-fit: cover;
        background: var(--background-elevated-highlight);
    }

    .chipInfo {
        display: flex;
        flex-direction: column;
        min-width: 0;
        line-height: 1.2;
    }

    .chipName {
        font-size: 14px;
        font-weight: 700;
        color: var(--text-base);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .chipHandle {
        font-size: 13px;
        color: var(--text-subdued);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .chipMenuButton {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        min-width: 32px;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--text-base);
        cursor: pointer;
        transition: background 0.2s;
    }

    .chipMenuButton:hover {
        background: var(--background-highlight);
    }

    .accountMenu {
        position: absolute;
        bottom: calc(100% + 0.4rem);
        right: 0.5rem;
        min-width: 180px;
        background: var(--background-base);
        border: 1px solid var(--gainsboro);
        border-radius: 0.8rem;
        box-shadow: 0 10px 30px var(--shadow-color);
        overflow: hidden;
        z-index: 20;
    }

    .accountMenu button {
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.6rem;
        padding: 0.8rem 1rem;
        cursor: pointer;
        background: transparent;
        border: none;
        color: var(--essential-negative);
        font-weight: 600;
        font-size: 14px;
        transition: background 0.2s;
    }

    .accountMenu button:hover {
        background: var(--background-highlight);
    }

    .tabs ul li a {
        padding: 0.8rem 1rem;
        cursor: pointer;
        display: flex;
        flex-direction: row;
        gap: 0.6rem;
        align-items: center;
        border-radius: 999px;
        transition: 0.2s background;
    }

    .tabs ul li a:hover {
        background: var(--background-highlight);
    }

    .tabs ul li a {
        text-decoration: none;
        color: var(--text-base);
        font-size: 18px;
        font-weight: 500;
    }

    .tabs ul li a.selected {
        font-weight: 800;
    }

    .iconWithBadge {
        position: relative;
        display: inline-flex;
    }

    .badge {
        position: absolute;
        top: -6px;
        right: -8px;
        min-width: 16px;
        height: 16px;
        padding: 0 3px;
        border-radius: 999px;
        background: var(--essential-negative);
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        line-height: 16px;
        text-align: center;
    }

    @media (max-width: 1100px) {
        .badge {
            top: -2px;
            right: -2px;
        }
    }

    .postButton {
        cursor: pointer;
        background: var(--essential-announcement);
        margin-top: 0.8rem;
        padding: 0.9rem;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        border: none;
        border-radius: 999px;
        transition: 0.2s opacity;
    }

    .postButton:hover {
        opacity: 0.9;
    }

    .postButton * {
        color: #fff;
    }

    .postButton p {
        font-size: 16px;
        font-weight: 700;
    }

    @media (max-width: 1100px) {
        .tabs {
            width: 88px;
            padding-inline: 0.4rem;
        }

        .tabs ul {
            justify-content: center;
            align-items: center;
        }

        .tabs ul li a {
            width: 44px;
            justify-content: center;
        }

        .postButton {
            width: 44px;
            height: 44px;
        }

        .tabs ul li p {
            display: none;
        }

        .postButton p {
            display: none;
        }

        .profileChip {
            flex-direction: column;
            gap: 0.3rem;
            padding: 0.4rem;
        }

        .profileChipLink {
            flex: 0 0 auto;
        }

        .chipInfo {
            display: none;
        }

        .accountMenu {
            right: auto;
            left: 50%;
            transform: translateX(-50%);
        }
    }

    .fab {
        display: none;
    }

    .bottomNav {
        display: none;
    }

    @media (max-width: 700px) {
        .postToastContainer {
            width: 90%;
            max-height: 70%;
        }

        .tabs {
            display: none;
        }

        .fab {
            display: grid;
            place-items: center;
            position: fixed;
            right: 1.1rem;
            bottom: calc(64px + env(safe-area-inset-bottom, 0px) + 1rem);
            width: 52px;
            height: 52px;
            border-radius: 50%;
            border: none;
            background: var(--essential-announcement);
            box-shadow: 0 6px 20px var(--shadow-color);
            z-index: 500;
            cursor: pointer;
            transition: opacity 0.2s;
        }

        .fab:hover {
            opacity: 0.9;
        }

        .bottomNav {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 500;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-around;
            height: 56px;
            padding-bottom: env(safe-area-inset-bottom, 0px);
            background: color-mix(in srgb, var(--background-elevated-base) 92%, transparent);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-top: 1px solid var(--gainsboro);
        }

        .bottomNav a {
            display: grid;
            place-items: center;
            width: 44px;
            height: 44px;
            border-radius: 999px;
            color: var(--text-base);
            transition: background 0.2s;
        }

        .bottomNav a:hover {
            background: var(--background-highlight);
        }

        .bottomNav a.selected :global(svg) {
            color: var(--essential-announcement);
        }
    }
</style>
