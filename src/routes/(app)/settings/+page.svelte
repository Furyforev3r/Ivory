<script lang="ts">
    import { user } from "$lib/client/hooks/loginState"
    import { account, ensureAccount } from "$lib/client/hooks/accountState"
    import { theme, setTheme } from "$lib/client/hooks/themeState"
    import { logout } from "$lib/client/utils/firebaseUtils"
    import Icon from "@iconify/svelte"
    import Skeleton from "$lib/components/+Skeleton.svelte"

    let userInfo: any
    let userAccount

    $: userInfo = $user
    $: userAccount = $account
    $: if (userInfo && userInfo !== "Loading...") ensureAccount(userInfo.uid)

    const themeOptions = [
        { value: "system", label: "System", icon: "material-symbols:contrast-rounded" },
        { value: "light", label: "Light", icon: "material-symbols:light-mode-outline-rounded" },
        { value: "dark", label: "Dark", icon: "material-symbols:dark-mode-outline-rounded" }
    ] as const
</script>

<svelte:head>
    <title>Ivory - Settings</title>
</svelte:head>

<div class="content">
    <div class="header">
        <h2>Settings</h2>
    </div>

    <section class="section">
        <h3>Account</h3>
        <div class="accountRow">
            {#if userAccount}
                <img src={userAccount.user.photoURL} alt={userAccount.user.displayName} class="avatar" loading="lazy" />
                <div class="accountInfo">
                    <p class="displayName">{userAccount.user.displayName}</p>
                    <p class="username">@{userAccount.user.username}</p>
                </div>
                <a class="editLink" href={`/${userAccount.user.username}`}>Edit profile</a>
            {:else}
                <Skeleton circle width="52px" height="52px" />
                <div class="accountInfo">
                    <Skeleton width="120px" height="14px" />
                    <Skeleton width="80px" height="12px" />
                </div>
            {/if}
        </div>
    </section>

    <section class="section">
        <h3>Appearance</h3>
        <div class="themeOptions">
            {#each themeOptions as option}
                <button
                    class="themeOption"
                    class:selected={$theme === option.value}
                    on:click={() => setTheme(option.value)}
                >
                    <Icon icon={option.icon} width="22" height="22" />
                    <span>{option.label}</span>
                    {#if $theme === option.value}
                        <Icon icon="material-symbols:check-rounded" width="20" height="20" class="checkIcon" />
                    {/if}
                </button>
            {/each}
        </div>
    </section>

    <section class="section">
        <h3>Session</h3>
        <button class="logoutRow" on:click={logout}>
            <Icon icon="material-symbols:logout-rounded" width="20" height="20" />
            Log out
        </button>
    </section>
</div>

<style>
    .content {
        flex-grow: 1;
        overflow: auto;
        border-inline: 1px solid var(--gainsboro);
    }

    .header {
        padding: 1rem;
        border-bottom: 1px solid var(--gainsboro);
        position: sticky;
        top: 0;
        background: var(--background-base);
        z-index: 10;
    }

    .header h2 {
        font-size: 20px;
        font-weight: 800;
    }

    .section {
        padding: 1.2rem;
        border-bottom: 1px solid var(--gainsboro);
    }

    .section h3 {
        font-size: 15px;
        font-weight: 800;
        color: var(--text-subdued);
        text-transform: uppercase;
        letter-spacing: 0.03em;
        margin-bottom: 0.8rem;
    }

    .accountRow {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.8rem;
    }

    .avatar {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        object-fit: cover;
        border: 1px solid var(--gainsboro);
    }

    .accountInfo {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        flex-grow: 1;
    }

    .displayName {
        font-weight: 700;
    }

    .username {
        color: var(--text-subdued);
        font-size: 14px;
    }

    .editLink {
        padding: 0.6rem 1rem;
        border-radius: 999px;
        border: 0.1rem solid var(--background-elevated-press);
        font-weight: 700;
        font-size: 14px;
        text-decoration: none;
        color: var(--text-base);
        transition: background 0.2s;
    }

    .editLink:hover {
        background: var(--background-highlight);
    }

    .themeOptions {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .themeOption {
        cursor: pointer;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.8rem;
        padding: 0.8rem 1rem;
        border-radius: 0.6rem;
        border: 0.1rem solid var(--background-elevated-press);
        background: none;
        color: var(--text-base);
        font-size: 15px;
        transition: background 0.2s;
    }

    .themeOption:hover {
        background: var(--background-highlight);
    }

    .themeOption.selected {
        border-color: var(--essential-announcement);
        color: var(--essential-announcement);
    }

    .themeOption span {
        flex-grow: 1;
        text-align: left;
        font-weight: 600;
    }

    .logoutRow {
        cursor: pointer;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.6rem;
        padding: 0.8rem 1rem;
        border-radius: 0.6rem;
        border: 0.1rem solid var(--background-elevated-press);
        background: none;
        color: var(--essential-negative);
        font-weight: 700;
        width: 100%;
        transition: background 0.2s;
    }

    .logoutRow:hover {
        background: rgba(244, 33, 46, 0.08);
    }
</style>
