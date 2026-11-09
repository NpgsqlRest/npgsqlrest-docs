import { defineLoader } from 'vitepress'

// Build-time GitHub star count for the navbar star button.
// Baked into the static HTML so the number is visible immediately;
// the GitHubStars component refreshes it in the browser after load.
// If GitHub is unreachable during the build, stars is null and the
// button falls back to a plain "Star" label.
// Unauthenticated API calls are limited to 60/hour per IP; set GITHUB_TOKEN
// (e.g. GITHUB_TOKEN=$(gh auth token) npm run build) if that ever bites.

export interface GitHubStarsData {
  stars: number | null
}

declare const data: GitHubStarsData
export { data }

export default defineLoader({
  async load(): Promise<GitHubStarsData> {
    try {
      const res = await fetch('https://api.github.com/repos/NpgsqlRest/NpgsqlRest', {
        headers: {
          'User-Agent': 'npgsqlrest-docs-build',
          ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
        },
        signal: AbortSignal.timeout(5000)
      })
      if (!res.ok) return { stars: null }
      const json = await res.json()
      return { stars: typeof json.stargazers_count === 'number' ? json.stargazers_count : null }
    } catch {
      return { stars: null }
    }
  }
})
