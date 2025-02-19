import { Octokit } from "@octokit/core";

export class OctokitClient {
  constructor(authToken) {
    this.octokit = new Octokit({ auth: authToken });
  }

  async getRepos(orgName) {
    try {
      const response = await this.octokit.request("GET /orgs/{org}/repos", {
        org: orgName,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching repositories:", error);
      throw error;
    }
  }

  async getRepoPullRequests(owner, repo) {
    try {
      const response = await this.octokit.request(
        "GET /repos/{owner}/{repo}/pulls",
        {
          owner,
          repo,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching pull requests:", error);
      throw error;
    }
  }

  async approveAndMergePr(owner, repo, prNumber) {
    try {
      await this.octokit.request(
        "POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews",
        {
          owner,
          repo,
          pull_number: prNumber,
          event: "APPROVE",
        }
      );

      await this.octokit.request(
        "PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge",
        {
          owner,
          repo,
          pull_number: prNumber,
        }
      );
    } catch (error) {
      console.error(`Error approving and merging pull request ${prNumber} in repo ${repo}`,);
      console.log("Trying to recreate the PR. Please run the script again shortly.");
      await this.addRecreateComment(owner, repo, prNumber);

      // wait for 5 seconds before proceeding so the user can see the message
      await new Promise((resolve) => {setTimeout(resolve, 500)});
    }
  }

  async addRebaseComment(owner, repo, prNumber) {
    try {
      await this.octokit.request(
        "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
        {
          owner,
          repo,
          issue_number: prNumber,
          body: "@dependabot rebase",
        }
      );
    } catch (error) {
      console.error("Error adding rebase comment:", error);
      throw error;
    }
  }

  async addRecreateComment(owner, repo, prNumber) {
    try {
      await this.octokit.request(
        "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
        {
          owner,
          repo,
          issue_number: prNumber,
          body: "@dependabot recreate",
        }
      );
    } catch (error) {
      console.error("Error adding recreate comment:", error);
      throw error;
    }
  }

  async addIgnoreMajorComment(owner, repo, prNumber) {
    try {
      await this.octokit.request(
        "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
        {
          owner,
          repo,
          issue_number: prNumber,
          body: "@dependabot ignore this major version",
        }
      );
    } catch (error) {
      console.error("Error adding major version ignore comment:", error);
      throw error;
    }
  }

  async addIgnoreMinorComment(owner, repo, prNumber) {
    try {
      await this.octokit.request(
        "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
        {
          owner,
          repo,
          issue_number: prNumber,
          body: "@dependabot ignore this minor version",
        }
      );
    } catch (error) {
      console.error("Error adding minor version ignore comment:", error);
      throw error;
    }
  }
}
