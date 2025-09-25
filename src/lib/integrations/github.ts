import { Octokit } from '@octokit/rest'

export interface GitHubUser {
  id: number
  login: string
  name: string
  email: string
  avatar_url: string
}

export interface GitHubIssue {
  id: number
  number: number
  title: string
  body: string
  state: 'open' | 'closed'
  created_at: string
  updated_at: string
  html_url: string
  assignees: GitHubUser[]
  labels: Array<{
    id: number
    name: string
    color: string
  }>
  repository: {
    id: number
    name: string
    full_name: string
    html_url: string
  }
}

export interface GitHubPullRequest {
  id: number
  number: number
  title: string
  body: string
  state: 'open' | 'closed' | 'merged'
  created_at: string
  updated_at: string
  html_url: string
  head: {
    ref: string
    sha: string
  }
  base: {
    ref: string
    sha: string
  }
  repository: {
    id: number
    name: string
    full_name: string
    html_url: string
  }
}

export class GitHubService {
  private octokit: Octokit

  constructor(accessToken: string) {
    this.octokit = new Octokit({
      auth: accessToken,
    })
  }

  async getUser(): Promise<GitHubUser> {
    const { data } = await this.octokit.rest.users.getAuthenticated()
    return data as GitHubUser
  }

  async getRepositories(): Promise<any[]> {
    const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: 'updated',
    })
    return data
  }

  async getIssues(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubIssue[]> {
    const { data } = await this.octokit.rest.issues.listForRepo({
      owner,
      repo,
      state,
      per_page: 100,
    })
    return data.map(issue => ({
      ...issue,
      repository: {
        id: 0, // Will be filled by caller
        name: repo,
        full_name: `${owner}/${repo}`,
        html_url: `https://github.com/${owner}/${repo}`
      }
    })) as GitHubIssue[]
  }

  async getPullRequests(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubPullRequest[]> {
    const { data } = await this.octokit.rest.pulls.list({
      owner,
      repo,
      state,
      per_page: 100,
    })
    return data.map(pr => ({
      ...pr,
      repository: {
        id: 0, // Will be filled by caller
        name: repo,
        full_name: `${owner}/${repo}`,
        html_url: `https://github.com/${owner}/${repo}`
      }
    })) as GitHubPullRequest[]
  }

  async createIssue(owner: string, repo: string, title: string, body?: string, labels?: string[]): Promise<GitHubIssue> {
    const { data } = await this.octokit.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
    })
    return {
      ...data,
      repository: {
        id: 0,
        name: repo,
        full_name: `${owner}/${repo}`,
        html_url: `https://github.com/${owner}/${repo}`
      }
    } as GitHubIssue
  }

  async updateIssue(owner: string, repo: string, issueNumber: number, updates: {
    title?: string
    body?: string
    state?: 'open' | 'closed'
    labels?: string[]
  }): Promise<GitHubIssue> {
    const { data } = await this.octokit.rest.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      ...updates,
    })
    return {
      ...data,
      repository: {
        id: 0,
        name: repo,
        full_name: `${owner}/${repo}`,
        html_url: `https://github.com/${owner}/${repo}`
      }
    } as GitHubIssue
  }

  async getCommits(owner: string, repo: string, since?: string): Promise<any[]> {
    const { data } = await this.octokit.rest.repos.listCommits({
      owner,
      repo,
      since,
      per_page: 100,
    })
    return data
  }

  // Repository details
  async getRepository(owner: string, repo: string) {
    const { data } = await this.octokit.rest.repos.get({ owner, repo })
    return data
  }

  // Branch operations
  async getBranches(owner: string, repo: string) {
    const { data } = await this.octokit.rest.repos.listBranches({ owner, repo, per_page: 100 })
    return data
  }

  async getBranchSha(owner: string, repo: string, branch: string): Promise<string> {
    const { data } = await this.octokit.rest.repos.getBranch({ owner, repo, branch })
    return data.commit.sha
  }

  async createBranchFrom(owner: string, repo: string, baseBranch: string, newBranch: string) {
    const baseSha = await this.getBranchSha(owner, repo, baseBranch)
    const { data } = await this.octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${newBranch}`,
      sha: baseSha,
    })
    return data
  }

  // Pull Request operations
  async createPullRequest(owner: string, repo: string, params: { title: string; head: string; base: string; body?: string }) {
    const { data } = await this.octokit.rest.pulls.create({ owner, repo, ...params })
    return data
  }

  async closePullRequest(owner: string, repo: string, number: number) {
    const { data } = await this.octokit.rest.pulls.update({ owner, repo, pull_number: number, state: 'closed' })
    return data
  }

  async mergePullRequest(owner: string, repo: string, number: number, method: 'merge' | 'squash' | 'rebase' = 'merge') {
    const { data } = await this.octokit.rest.pulls.merge({ owner, repo, pull_number: number, merge_method: method })
    return data
  }
}

// GitHub OAuth URL oluşturma
export function getGitHubOAuthURL(): string {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`
  
  if (!clientId) {
    throw new Error('GitHub Client ID not configured')
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo,user:email',
    state: 'github_oauth_state', // CSRF koruması için
  })

  return `https://github.com/login/oauth/authorize?${params.toString()}`
}

