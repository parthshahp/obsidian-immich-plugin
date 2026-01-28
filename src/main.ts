import {Plugin} from "obsidian";
import {DEFAULT_SETTINGS, ImmichDailySettings, ImmichSettingTab} from "./settings";
import {registerCommands} from "./commands";
import {registerAutoInsert} from "./commands/auto-insert";
import {registerCarouselProcessor} from "./ui/carousel";

export default class ImmichDailyCarouselPlugin extends Plugin {
	settings: ImmichDailySettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new ImmichSettingTab(this.app, this));
		registerCommands(this);
		registerCarouselProcessor(this);
		registerAutoInsert(this);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<ImmichDailySettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
