import { UserInterfaceManager } from "./UserInterfaceManager.js";
import fs from "node:fs";

class RepoManager {
  constructor({ octokitClient, whitelist, blacklist }) {
    this.octokitClient = octokitClient;
    this.prWhitelist = JSON.parse(whitelist);
    this.prBlacklist = JSON.parse(blacklist);
  }

  async fetchReposWithDependabotPRs(orgName) {
    const repos = await this.octokitClient.getRepos(orgName);
    const reposWithDependabotPrs = await Promise.all(
      repos.map(async (repo) => {
        const pulls = await this.octokitClient.getRepoPullRequests(
          orgName,
          repo.name
        );
        return {
          prs: RepoManager.filterDependabotPRs(pulls),
          repo: repo.name,
        };
      })
    );
    return reposWithDependabotPrs.filter((repo) => repo.prs.length > 0);
  }

  static filterDependabotPRs(prList) {
    return prList.filter((pr) => pr.user.login === "dependabot[bot]");
  }

  async processUserInputForOnePr(pr, actionFromUser, packageNameAndVersion) {
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
        this.prBlacklist.push(packageNameAndVersion);
        fs.writeFileSync(
          "/tmp/dependabot-blacklist.json",
          JSON.stringify(this.prBlacklist)
        );
        break;
      case "q":
        console.log("Quitting...");
        // eslint-disable-next-line n/no-process-exit
        process.exit(0);
      // eslint-disable-next-line no-fallthrough
      case "all":
        await this.octokitClient.approveAndMergePr(
          pr.base.repo.owner.login,
          pr.base.repo.name,
          pr.number
        );

        // add the title of the PR to the whitelist
        this.prWhitelist.push(packageNameAndVersion);

        fs.writeFileSync(
          "/tmp/dependabot-whitelist.json",
          JSON.stringify(this.prWhitelist)
        );
        break;
      default:
        console.log("Invalid input. Please try again.");
    }
  }

  static derivePackageNameAndVersion = (pr) => {
    const lowerCaseTitle = pr.title.toLowerCase();
    const packageNameAndVersion = lowerCaseTitle.split("bump")[1].trim();
    // [0].split("from");
    const packageNameAndVersionArray = packageNameAndVersion.split("from");
    const packageName = packageNameAndVersionArray[0].trim();
    const newPackageVersion = packageNameAndVersionArray[1]
      .trim()
      .split("to")[1]
      .trim();

    return `${packageName}-${newPackageVersion}`;
  };

  async checkIfPrIsWhiteOrBlacklisted(pr, packageNameAndVersion) {
    if (this.prWhitelist.includes(packageNameAndVersion)) {
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
      await new Promise((resolve) => {
        setTimeout(resolve, 5000);
      });

      return true;
    }

    if (this.prBlacklist.includes(packageNameAndVersion)) {
      // if we've blacklisted this PR, we can skip it
      console.log(
        `PR #${pr.number} in repo ${pr.base.repo.full_name} has been blacklisted. Skipping PR ${pr.number} in repo ${pr.base.repo.full_name}`
      );

      // wait 5 seconds so the user can register the message
      await new Promise((resolve) => {
        setTimeout(resolve, 5000);
      });

      return true;
    }

    return false;
  }

  async manageOnePr(pr, totalPrs, index) {
    await UserInterfaceManager.displayOnePr(pr, totalPrs, index);

    const packageNameAndVersion = RepoManager.derivePackageNameAndVersion(pr);

    if (await this.checkIfPrIsWhiteOrBlacklisted(pr, packageNameAndVersion)) {
      return;
    }

    const actionFromUser = await UserInterfaceManager.getUserInput(
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

    await this.processUserInputForOnePr(
      pr,
      actionFromUser,
      packageNameAndVersion
    );
  }

  prsManaged = 0;

  async manageOneRepo(repo, totalPrs) {
    for (let i = 0; i < repo.prs.length; i += 1) {
      await this.manageOnePr(repo.prs[i], totalPrs, this.prsManaged);
      this.prsManaged += 1;
    }
  }

  async manageAllPrs(repos) {
    const totalPrs = repos.reduce((acc, repo) => acc + repo.prs.length, 0);

    for (let i = 0; i < repos.length; i += 1) {
      await this.manageOneRepo(repos[i], totalPrs);
    }
  }
}

export { RepoManager };
