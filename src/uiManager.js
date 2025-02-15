import readline from "node:readline";

export class UserInterfaceManager {
  async clearDisplay() {
    console.clear();

    console.log("Loading.");

    await new Promise((resolve) => setTimeout(resolve, 250));
    console.clear();
    console.log("Loading..");

    console.clear();
    console.log("Loading...");

    await new Promise((resolve) => setTimeout(resolve, 250));

    console.clear();
  }

  displayReposWithPRs(repos, orgName) {
    console.log(
      `The following repos from the org ${orgName} have PRs from dependabot:`
    );
    repos.forEach((repo) => {
      console.log(`${repo.repo} - ${repo.prs.length} PRs`);
    });
  }

  async displayOnePr(pr) {
    await this.clearDisplay();
    console.log(
      `Repository: ${pr.base.repo.full_name}
Number: #${pr.number}
Title: ${pr.title}
Link: ${pr.html_url}
Status: ${pr.state}
Please carefully review the changes and approve this PR if it looks good.
`
    );
  }

  async displayOneRepo(repo) {
    await this.clearDisplay();
    console.log(`The repo ${repo.repo} has the following PRs:`);
    repo.prs.forEach((pr) => {
      displayOnePr(pr);
    });
  }

  getUserInput(prompt) {
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
