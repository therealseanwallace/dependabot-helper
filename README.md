# Dependabot Helper

## Description

This tool is designed to streamline the management of Dependabot pull requests (PRs) in a command-line interface. With it, you can easily list and manage open Dependabot PRs for any given organization, ensuring your dependencies are always up-to-date.

## Features

- **List Open PRs:** Quickly retrieve a list of all open Dependabot PRs for a specified organization.
- **Manage All PRs:** Approve, merge, and manage all Dependabot PRs across all repositories within the organization.
- **Manage Individual Repositories:** Focus management on a specific repository, allowing for detailed control.
- **Merge, Rebase, or Recreate PRs:** Choose how to handle each PR with options to approve, merge, rebase, or recreate.
- **Version Control:** Opt to ignore minor or major version updates.
- **Skip or Block PRs:** Skip certain PRs or block them from appearing in the future.
  
## Prerequisites

To run Dependabot Helper, you need:

- Node.js installed on your system.
- A GitHub Personal Access Token with the appropriate permissions.

## Installation

1. **Clone the repository:**

```bash
git clone <repository-url>
cd dependabot-helper
``` 

2. Install dependencies:

```bash
npm install
```

3. Create a .env file in the root directory with the following:

```
GITHUB_ORG=<your-github-organization>
PERSONAL_ACCESS_TOKEN=<your-personal
```

Substitute <your-github-organization> and <your-personal-access-token> with your GitHub Organization name and Personal Access Token.

## Usage

1. Run the script:

```bash
npm run start
```

2. Follow the on-screen prompts: Choose whether to manage all PRs, focus on one repository, or exit the tool.

3. Choose actions for PRs: Options include approving and merging, rebasing, recreating PRs, or skipping them. Read through each option carefully when prompted.

## Contribution
Contributions are welcome! Feel free to submit any issues or pull requests on GitHub.

## License
This project is licensed under the MIT License. See the LICENSE file for more information.

## Contact
For further information, please contact [https://github.com/therealseanwallace](https://github.com/therealseanwallace) or open an issue in the GitHub repository.