class RepoManager {
  constructor({ octokitClient, uiManager }) {
    this.octokitClient = octokitClient;
    this.uiManager = uiManager;
  }

  prWhitelist = [];
  prBlacklist = [];

  async fetchReposWithDependabotPRs(orgName) {
    const repos = await this.octokitClient.getRepos(orgName);
    const reposWithDependabotPrs = await Promise.all(
      repos.map(async (repo) => {
        const pulls = await this.octokitClient.getRepoPullRequests(
          orgName,
          repo.name
        );
        return {
          prs: this.filterDependabotPRs(pulls),
          repo: repo.name,
        };
      })
    );
    return reposWithDependabotPrs.filter((repo) => repo.prs.length > 0);
  }

  filterDependabotPRs(prList) {
    return prList.filter((pr) => pr.user.login === "dependabot[bot]");
  }

  async processUserInputForOnePr(pr, actionFromUser) {
    switch (actionFromUser) {
      case "m":
        await this.octokitClient.approveAndMergePr(
          pr.base.repo.owner.login,
          pr.base.repo.name,
          pr.number
        );
        break;
      case "r":
        await this.octokitClient.addRebaseComment(
          pr.base.repo.owner.login,
          pr.base.repo.name,
          pr.number
        );
        break;
      case "c":
        await this.octokitClient.addRecreateComment(
          pr.base.repo.owner.login,
          pr.base.repo.name,
          pr.number
        );
        break;
      case "imaj":
        await this.octokitClient.addIgnoreMajorVersionComment(
          pr.base.repo.owner.login,
          pr.base.repo.name,
          pr.number
        );
        break;
      case "imin":
        await this.octokitClient.addIgnoreMinorVersionComment(
          pr.base.repo.owner.login,
          pr.base.repo.name,
          pr.number
        );
        break;
      case "s":
        console.log(
          `Skipping PR #${pr.number} in repo ${pr.base.repo.full_name}`
        );
        break;
      case "sall":
        console.log(
          `Skipping PR #${pr.number} in repo ${pr.base.repo.full_name} whenever it appears in any repo`
        );
        this.prBlacklist.push(pr.title);
        break;
        case "q":
        console.log("Quitting...");
        process.exit(0);
      case "all":
        await this.octokitClient.approveAndMergePr(
          pr.base.repo.owner.login,
          pr.base.repo.name,
          pr.number
        );

        // add the title of the PR to the whitelist
        this.prWhitelist.push(pr.title);
        break;
      default:
        console.log("Invalid input. Please try again.");
    }
  }

  async manageOnePr(pr) {
    await this.uiManager.displayOnePr(pr);

    if (this.prWhitelist.includes(pr.title)) {
      // if we've whitelisted this PR, we can just merge it
      console.log(
        `PR #${pr.number} in repo ${pr.base.repo.full_name} has been approved for all repos. Merging PR ${pr.number} in repo ${pr.base.repo.full_name}`
      );

      await this.octokitClient.approveAndMergePr(
        pr.base.repo.owner.login,
        pr.base.repo.name,
        pr.number
      );

      // wait 5 seconds so the user can register the message
      await new Promise((resolve) => setTimeout(resolve, 5000));

      return;
    }

    if (this.prBlacklist.includes(pr.title)) {
      // if we've blacklisted this PR, we can skip it
      console.log(
        `PR #${pr.number} in repo ${pr.base.repo.full_name} has been blacklisted. Skipping PR ${pr.number} in repo ${pr.base.repo.full_name}`
      );

      // wait 5 seconds so the user can register the message
      await new Promise((resolve) => setTimeout(resolve, 5000));

      return;
    }

    const actionFromUser = await this.uiManager.getUserInput(
      `Would you like to?
      (m) Approve and merge
      (r) Rebase
      (c) Recreate
      (imaj) Ignore major version
      (imin) Ignore minor version
      (s) Skip
      (sall) Skip this PR whenever it appear in any repo
      (all) Merge every instance of this PR in all repos
      (q) Quit
      `
    );

    await this.processUserInputForOnePr(pr, actionFromUser);
  }

  async manageOneRepo(repo) {
    for (let i = 0; i < repo.prs.length; i++) {
      await this.manageOnePr(repo.prs[i]);
    }
  }

  async manageAllPrs(repos) {
    for (let i = 0; i < repos.length; i++) {
      await this.manageOneRepo(repos[i]);
    }
  }
}

export { RepoManager };
