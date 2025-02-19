import readline from "node:readline";

export class UserInterfaceManager {
  static async clearDisplay() {
    console.clear();

    console.log("Loading.");

    await new Promise((resolve) => {
      setTimeout(resolve, 250);
    });
    console.clear();
    console.log("Loading..");

    console.clear();
    console.log("Loading...");

    await new Promise((resolve) => {
      setTimeout(resolve, 250);
    });

    console.clear();
  }

  static displayReposWithPRs(repos, orgName) {
    console.log(
      `The following repos from the org ${orgName} have PRs from dependabot:`
    );
    repos.forEach((repo) => {
      console.log(`${repo.repo} - ${repo.prs.length} PRs`);
    });
  }

  static async displayOnePr(pr, totalPrs, index) {
    await UserInterfaceManager.clearDisplay();
    console.log(
      `${index + 1} of ${totalPrs} total PRs
      Repository: ${pr.base.repo.full_name}
      Number: #${pr.number}
      Title: ${pr.title}
      Link: ${pr.html_url}
      Status: ${pr.state}
      Please carefully review the changes and approve this PR if it looks good.
      `
    );
  }

  static async displayOneRepo(repo) {
    await UserInterfaceManager.clearDisplay();
    console.log(`The repo ${repo.repo} has the following PRs:`);
    repo.prs.forEach((pr, index) => {
      this.displayOnePr(pr, repo.prs, index);
    });
  }

  static getUserInput(prompt) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }
}
