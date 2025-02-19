import { ConfigManager } from "./ConfigManager.js";
import { OctokitClient } from "./OctokitClient.js";
import { RepoManager } from "./RepoManager.js";
import { UserInterfaceManager } from "./UserInterfaceManager.js";

async function run() {
  ConfigManager.loadConfig();

  const orgName = process.env.GH_ORG;
  const authToken = process.env.PERSONAL_ACCESS_TOKEN;

  const octokitClient = new OctokitClient(authToken);
  const repoManager = new RepoManager({ octokitClient });

  const nonEmptyRepos = await repoManager.fetchReposWithDependabotPRs(orgName);

  let prCount = 0;

  async function countPrs() {
    nonEmptyRepos.forEach((repo) => {
      prCount += repo.prs.length;
    });
    return prCount;
  }

  UserInterfaceManager.displayReposWithPRs(nonEmptyRepos, orgName);

  const userResponse = await UserInterfaceManager.getUserInput(
    `Do you want to manage all ${await countPrs()} of these PRs, one specific repo, or quit?\nPlease enter "all", the name of the repo, or "q": `
  );

  async function handleUserResponse(response) {
    switch (response) {
      case "all":
        await repoManager.manageAllPrs(nonEmptyRepos);
        break;
      case "q":
        console.log("Quitting...");
        break;
      default:
        await repoManager.manageOneRepo(nonEmptyRepos.find((repo) => repo.repo === response));
        break;
    }
  }

  await handleUserResponse(userResponse);
}

run().catch((error) => console.error(error));
