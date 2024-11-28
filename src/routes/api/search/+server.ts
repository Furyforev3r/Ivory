import { json } from "@sveltejs/kit"
import { search } from "$lib/server/utils/firebaseAdminUtils"

export async function GET({ url }) {
  try {
    const query = url.searchParams.get('query')
    
    if (!query) {
      return json({ error: 'Query parameter is required' }, { status: 400 })
    }

    const searchResults = await search(query, 100)

    if (searchResults.success) {
      return json(searchResults, { status: 200 })
    } else {
      return json({ error: searchResults.error }, { status: 404 })
    }
  } catch (error) {
    console.error("Error during search:", error)
    return json({ error: 'An error occurred during the search' }, { status: 500 })
  }
}
