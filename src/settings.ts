import {App, PluginSettingTab, Setting} from "obsidian";
import ImmichDailyCarouselPlugin from "./main";

export type ImmichImageSize = "thumbnail" | "preview";
export type ImmichSortOrder = "asc" | "desc";

export interface ImmichDailySettings {
	baseUrl: string;
	apiKey: string;
	webBaseUrl: string;
	assetUrlTemplate: string;
	dayUrlTemplate: string;
	dateFormat: string;
	maxAssets: number;
	autoInsertDailyNote: boolean;
	templatePlaceholder: string;
	thumbnailSizePx: number;
	includeVideos: boolean;
	includeArchived: boolean;
	imageSize: ImmichImageSize;
	sortOrder: ImmichSortOrder;
}

export const DEFAULT_SETTINGS: ImmichDailySettings = {
	baseUrl: "",
	apiKey: "",
	webBaseUrl: "",
	assetUrlTemplate: "",
	dayUrlTemplate: "",
	dateFormat: "",
	maxAssets: 30,
	autoInsertDailyNote: false,
	templatePlaceholder: "{{immich-carousel}}",
	thumbnailSizePx: 140,
	includeVideos: false,
	includeArchived: false,
	imageSize: "thumbnail",
	sortOrder: "asc",
};

export class ImmichSettingTab extends PluginSettingTab {
	plugin: ImmichDailyCarouselPlugin;

	constructor(app: App, plugin: ImmichDailyCarouselPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		containerEl.createEl("h2", {text: "Immich daily carousel"});

		new Setting(containerEl)
			.setName("Immich base URL")
			.setDesc("Example: https://immich.example.com")
			.addText(text => text
				.setPlaceholder("https://immich.example.com")
				.setValue(this.plugin.settings.baseUrl)
				.onChange(async value => {
					this.plugin.settings.baseUrl = value.trim();
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Immich API key")
			.setDesc("Used to fetch your assets from Immich.")
			.addText(text => {
				text.setPlaceholder("Paste your API key")
					.setValue(this.plugin.settings.apiKey)
					.onChange(async value => {
						this.plugin.settings.apiKey = value.trim();
						await this.plugin.saveSettings();
					});
				text.inputEl.type = "password";
			});

		new Setting(containerEl)
			.setName("Immich web base URL (optional)")
			.setDesc("Defaults to the API base URL if left blank. Used for asset/day links.")
			.addText(text => text
				.setPlaceholder("https://immich.example.com")
				.setValue(this.plugin.settings.webBaseUrl)
				.onChange(async value => {
					this.plugin.settings.webBaseUrl = value.trim();
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Asset link template (optional)")
			.setDesc("Use {{baseUrl}} and {{assetId}}. Leave blank to use a default Immich pattern.")
			.addText(text => text
				.setPlaceholder("{{baseUrl}}/photos/{{assetId}}")
				.setValue(this.plugin.settings.assetUrlTemplate)
				.onChange(async value => {
					this.plugin.settings.assetUrlTemplate = value.trim();
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Day link template (optional)")
			.setDesc("Use {{baseUrl}} and {{date}} (YYYY-MM-DD). Leave blank to use a default Immich pattern.")
			.addText(text => text
				.setPlaceholder("{{baseUrl}}/photos?timelineDate={{date}}")
				.setValue(this.plugin.settings.dayUrlTemplate)
				.onChange(async value => {
					this.plugin.settings.dayUrlTemplate = value.trim();
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Title date format (optional)")
			.setDesc("Moment-style format used to parse the note title. Leave blank to auto-detect common formats like YYYY-MM-DD.")
			.addText(text => text
				.setPlaceholder("YYYY-MM-DD")
				.setValue(this.plugin.settings.dateFormat)
				.onChange(async value => {
					this.plugin.settings.dateFormat = value.trim();
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Maximum assets per day")
			.setDesc("Limits how many photos to load for a single carousel.")
			.addText(text => text
				.setPlaceholder("30")
				.setValue(String(this.plugin.settings.maxAssets))
				.onChange(async value => {
					const parsed = Number.parseInt(value, 10);
					this.plugin.settings.maxAssets = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SETTINGS.maxAssets;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Auto-insert in daily notes")
			.setDesc("When enabled, a new daily note will get an Immich carousel automatically.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoInsertDailyNote)
				.onChange(async value => {
					this.plugin.settings.autoInsertDailyNote = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Template placeholder")
			.setDesc("Token to replace in daily note templates. Example: {{immich-carousel}}.")
			.addText(text => text
				.setPlaceholder("{{immich-carousel}}")
				.setValue(this.plugin.settings.templatePlaceholder)
				.onChange(async value => {
					this.plugin.settings.templatePlaceholder = value.trim() || DEFAULT_SETTINGS.templatePlaceholder;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Thumbnail size (px)")
			.setDesc("Controls the width and height of carousel images. Recommended range: 80–240.")
			.addText(text => text
				.setPlaceholder("140")
				.setValue(String(this.plugin.settings.thumbnailSizePx))
				.onChange(async value => {
					const parsed = Number.parseInt(value, 10);
					if (Number.isFinite(parsed)) {
						this.plugin.settings.thumbnailSizePx = Math.min(240, Math.max(80, parsed));
					}
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Include videos")
			.setDesc("When enabled, videos taken on the day will appear alongside photos.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.includeVideos)
				.onChange(async value => {
					this.plugin.settings.includeVideos = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Include archived assets")
			.setDesc("When enabled, archived items will be included in the carousel.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.includeArchived)
				.onChange(async value => {
					this.plugin.settings.includeArchived = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Image size")
			.setDesc("Choose the thumbnail size to render in the carousel.")
			.addDropdown(dropdown => dropdown
				.addOption("thumbnail", "Thumbnail")
				.addOption("preview", "Preview")
				.setValue(this.plugin.settings.imageSize)
				.onChange(async value => {
					this.plugin.settings.imageSize = value as "thumbnail" | "preview";
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Sort order")
			.setDesc("Ascending puts earlier shots first; descending shows the latest first.")
			.addDropdown(dropdown => dropdown
				.addOption("asc", "Ascending")
				.addOption("desc", "Descending")
				.setValue(this.plugin.settings.sortOrder)
				.onChange(async value => {
					this.plugin.settings.sortOrder = value as "asc" | "desc";
					await this.plugin.saveSettings();
				})
			);
	}
}
