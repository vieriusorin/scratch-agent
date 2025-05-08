import 'dotenv/config'

import { Index as UpstashIndex } from '@upstash/vector';
import { parse } from 'csv-parse/sync';
import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';

/**
 * Initialize the Upstash index
 */
const index = new UpstashIndex({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
})

/**
 * Ingest the movie data into the Upstash index
 * This function reads the CSV file, parses it, and indexes each movie.
 */
export async function indexMovieData(): Promise<void> {
    const spinner = ora('Reading movie data...').start()

    /**
     * Read the CSV file and parse it
     * The CSV file is located in the src/rag directory
     * The file is called imdb_movie_dataset.csv
     * The file is a CSV file that contains movie data
     * The file is from the following website: https://www.kaggle.com/datasets/harshitshankhdhar/imdb-dataset-of-top-1000-movies-with-revenue-data
     */
    const csvPath = path.join(process.cwd(), 'src/rag/imdb_movie_dataset.csv')
    const csvData = fs.readFileSync(csvPath, 'utf-8')
    const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
    })

    spinner.text = 'Starting movie indexing...'

    /**
     * Index each movie
     * The movie data is indexed into the Upstash index
     * The movie data is indexed by the movie title, year, genre, director, actors, rating, votes, revenue and metascore
     */
    for (const movie of records) {
        spinner.text = `Indexing movie: ${movie.Title}`
        const text = `${movie.Title}. ${movie.Genre}. ${movie.Description}`

        try {
            await index.upsert({
                id: movie.Title, // Using Rank as unique ID
                data: text, // Text will be automatically embedded
                metadata: {
                    title: movie.Title,
                    year: Number(movie.Year),
                    genre: movie.Genre,
                    director: movie.Director,
                    actors: movie.Actors,
                    rating: Number(movie.Rating),
                    votes: Number(movie.Votes),
                    revenue: Number(movie.Revenue),
                    metascore: Number(movie.Metascore),
                },
            })
        } catch (error) {
            spinner.fail(`Error indexing movie ${movie.Title}`)
            console.error(error)
        }
    }

    spinner.succeed('Finished indexing movie data')
}

indexMovieData()
