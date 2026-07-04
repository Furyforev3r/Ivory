import axios from "axios"

export async function fetchAuthorsByUID(userUIDs: (string | undefined)[]): Promise<Record<string, any>> {
    const uniqueUIDs = [...new Set(userUIDs.filter(Boolean))] as string[]

    const entries = await Promise.all(uniqueUIDs.map(async (uid) => {
        try {
            const response = await axios.get(`/api/getSimpleUser?uid=${uid}`)
            return [uid, response.data.user] as const
        } catch (error) {
            return [uid, null] as const
        }
    }))

    return Object.fromEntries(entries)
}
