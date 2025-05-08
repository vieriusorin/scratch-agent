import { Index as UpstashIndex } from '@upstash/vector';

/**
 * Initialize the Upstash index
 */
const index = new UpstashIndex();

type MovieMetadata = {
    title?: string
    year?: string
    genre?: string
    director?: string
    actors?: string
    rating?: string
    votes?: string
    revenue?: string
    metascore?: string
}

export const queryMovies = async ({
    query,
    filters,
    topK = 5
}: {
    query: string;
    filters?: Partial<MovieMetadata>;
    topK?: number;
}) => {
    /**
     * Build filter string if filters provided
     * The filters are used to filter the movies by the metadata
     */
    let filterStr = ''
    if (filters) {
        const filterParts = Object.entries(filters)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => `${key}='${value}'`)

        if (filterParts.length > 0) {
            filterStr = filterParts.join(' AND ')
        }
    }

    // Query the vector store
    const results = await index.query({
        data: query,
        topK,
        filter: filterStr || undefined,
        includeMetadata: true,
        includeData: true,
    })

    return results
}

