import { ConfigManager } from "./ConfigManager.js";
import { OctokitClient } from "./OctokitClient.js";
import { RepoManager } from "./RepoManager.js";
import { UserInterfaceManager } from "./UserInterfaceManager.js";
import fs from "node:fs";

async function run() {
  ConfigManager.loadConfig();

  // check that the dependabot-whitelist and dependabot-blacklist files exist in /tmp
  if (!fs.existsSync("/tmp/dependabot-whitelist.json")) {
    fs.writeFileSync("/tmp/dependabot-whitelist.json", "[]");
  }

  if (!fs.existsSync("/tmp/dependabot-blacklist.json")) {
    fs.writeFileSync("/tmp/dependabot-blacklist.json", "[]");
  }

  const orgName = process.env.GH_ORG;
  const authToken = process.env.PERSONAL_ACCESS_TOKEN;

  const octokitClient = new OctokitClient(authToken);
  const repoManager = new RepoManager({
    octokitClient,
    whitelist: fs.readFileSync("/tmp/dependabot-whitelist.json"),
    blacklist: fs.readFileSync("/tmp/dependabot-blacklist.json"),
  });

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
    `Do you want to manage all ${await countPrs()} of these PRs, one specific repo, clear the blacklist/whitelist, or quit?\nPlease enter "all", the name of the repo, "quit", or "clear": `
  );

  async function handleUserResponse(response) {
    switch (response) {
      case "all":
        await repoManager.manageAllPrs(nonEmptyRepos);
        break;
      case "quit":
        console.log("Quitting...");
        break;
      case "clear":
        fs.writeFileSync("/tmp/dependabot-whitelist.json", "[]");
        fs.writeFileSync("/tmp/dependabot-blacklist.json", "[]");
        console.log("Whitelist and blacklist cleared.");
        run();
        break;
      default:
        await repoManager.manageOneRepo(
          nonEmptyRepos.find((repo) => repo.repo === response)
        );
        break;
    }
  }

  await handleUserResponse(userResponse);
}

run().catch((error) => console.error(error));
