import { writable } from "svelte/store"
import { browser } from "$app/environment"

function getInitialTheme(): "light" | "dark" | "system" {
    if (!browser) return "system"
    const stored = localStorage.getItem("ivory-theme")
    if (stored === "dark" || stored === "light") return stored
    return "system"
}

export const theme = writable<"light" | "dark" | "system">(getInitialTheme())

export function setTheme(value: "light" | "dark" | "system") {
    theme.set(value)

    if (!browser) return

    if (value === "system") {
        localStorage.removeItem("ivory-theme")
        document.documentElement.removeAttribute("data-theme")
    } else {
        localStorage.setItem("ivory-theme", value)
        document.documentElement.setAttribute("data-theme", value)
    }
}
