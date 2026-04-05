import { App, PluginSettingTab, Setting } from "obsidian";
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
	dailyNoteFolder: string;
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
	dailyNoteFolder: "",
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
		const { containerEl } = this;
		containerEl.empty();

		// ── Connection ────────────────────────────────────────────────────────
		new Setting(containerEl).setName("Connection").setHeading();

		new Setting(containerEl)
			.setName("Base URL")
			.setDesc("Your Immich server address. Example: https://immich.example.com")
			.addText((text) =>
				text
					.setPlaceholder("https://immich.example.com")
					.setValue(this.plugin.settings.baseUrl)
					.onChange(async (value) => {
						this.plugin.settings.baseUrl = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("API key")
			.setDesc("Used to authenticate requests to your Immich server.")
			.addText((text) => {
				text.setPlaceholder("Paste your API key")
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value.trim();
						await this.plugin.saveSettings();
					});
				text.inputEl.type = "password";
			});

		new Setting(containerEl)
			.setName("Web base URL (optional)")
			.setDesc(
				"Separate URL for the Immich web UI. Defaults to the base URL if left blank.",
			)
			.addText((text) =>
				text
					.setPlaceholder("https://immich.example.com")
					.setValue(this.plugin.settings.webBaseUrl)
					.onChange(async (value) => {
						this.plugin.settings.webBaseUrl = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		// ── Daily Notes ───────────────────────────────────────────────────────
		new Setting(containerEl).setName("Daily notes").setHeading();

		new Setting(containerEl)
			.setName("Auto-insert carousel")
			.setDesc(
				"Automatically add an Immich carousel when a daily note is opened.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoInsertDailyNote)
					.onChange(async (value) => {
						this.plugin.settings.autoInsertDailyNote = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Template placeholder")
			.setDesc(
				"Token in your daily note template to replace with the carousel block.",
			)
			.addText((text) =>
				text
					.setPlaceholder("{{immich-carousel}}")
					.setValue(this.plugin.settings.templatePlaceholder)
					.onChange(async (value) => {
						this.plugin.settings.templatePlaceholder =
							value.trim() ||
							DEFAULT_SETTINGS.templatePlaceholder;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Daily notes folder (optional)")
			.setDesc(
				"Only auto-insert in notes inside this folder. Leave blank to match any note with a date-parseable title.",
			)
			.addText((text) =>
				text
					.setPlaceholder("Daily notes")
					.setValue(this.plugin.settings.dailyNoteFolder)
					.onChange(async (value) => {
						this.plugin.settings.dailyNoteFolder = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Title date format (optional)")
			.setDesc(
				"Moment.js format string for parsing dates from note titles. Leave blank to auto-detect common formats.",
			)
			.addText((text) =>
				text
					.setPlaceholder("2024-01-01")
					.setValue(this.plugin.settings.dateFormat)
					.onChange(async (value) => {
						this.plugin.settings.dateFormat = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		// ── Carousel ──────────────────────────────────────────────────────────
		new Setting(containerEl).setName("Carousel").setHeading();

		new Setting(containerEl)
			.setName("Thumbnail size (px)")
			.setDesc("Width and height of each image in the carousel. Range: 80–240.")
			.addText((text) =>
				text
					.setPlaceholder("140")
					.setValue(String(this.plugin.settings.thumbnailSizePx))
					.onChange(async (value) => {
						const parsed = Number.parseInt(value, 10);
						if (Number.isFinite(parsed)) {
							this.plugin.settings.thumbnailSizePx = Math.min(
								240,
								Math.max(80, parsed),
							);
						}
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Image quality")
			.setDesc("Thumbnail loads faster; preview is higher resolution.")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("thumbnail", "Thumbnail")
					.addOption("preview", "Preview")
					.setValue(this.plugin.settings.imageSize)
					.onChange(async (value) => {
						this.plugin.settings.imageSize = value as ImmichImageSize;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Sort order")
			.setDesc("Ascending shows earliest shots first; descending shows latest first.")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("asc", "Ascending")
					.addOption("desc", "Descending")
					.setValue(this.plugin.settings.sortOrder)
					.onChange(async (value) => {
						this.plugin.settings.sortOrder = value as ImmichSortOrder;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Maximum assets per day")
			.setDesc("Limits how many photos/videos load in a single carousel.")
			.addText((text) =>
				text
					.setPlaceholder("30")
					.setValue(String(this.plugin.settings.maxAssets))
					.onChange(async (value) => {
						const parsed = Number.parseInt(value, 10);
						this.plugin.settings.maxAssets =
							Number.isFinite(parsed) && parsed > 0
								? parsed
								: DEFAULT_SETTINGS.maxAssets;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Include videos")
			.setDesc("Show videos alongside photos in the carousel.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.includeVideos)
					.onChange(async (value) => {
						this.plugin.settings.includeVideos = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Include archived assets")
			.setDesc("Include archived items in the carousel.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.includeArchived)
					.onChange(async (value) => {
						this.plugin.settings.includeArchived = value;
						await this.plugin.saveSettings();
					}),
			);

		// ── Links ─────────────────────────────────────────────────────────────
		new Setting(containerEl).setName("Links").setHeading();

		new Setting(containerEl)
			.setName("Asset link template (optional)")
			.setDesc(
				"URL to open when clicking a photo. Use {{baseUrl}} and {{assetId}}.",
			)
			.addText((text) =>
				text
					.setPlaceholder("{{baseUrl}}/photos/{{assetId}}")
					.setValue(this.plugin.settings.assetUrlTemplate)
					.onChange(async (value) => {
						this.plugin.settings.assetUrlTemplate = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Day link template (optional)")
			.setDesc(
				'URL for the "Open in Immich" header link. Use {{baseUrl}} and {{date}}.',
			)
			.addText((text) =>
				text
					.setPlaceholder("{{baseUrl}}/photos?timelineDate={{date}}")
					.setValue(this.plugin.settings.dayUrlTemplate)
					.onChange(async (value) => {
						this.plugin.settings.dayUrlTemplate = value.trim();
						await this.plugin.saveSettings();
					}),
			);
	}
}
