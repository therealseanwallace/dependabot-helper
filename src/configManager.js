import dotenv from "dotenv";

export class ConfigManager {
  static loadConfig() {
    dotenv.config();
    this.validateConfig();
  }

  static validateConfig() {
    if (!process.env.GH_ORG || !process.env.PERSONAL_ACCESS_TOKEN) {
      throw new Error("Missing required environment variables");
    }
  }
}
