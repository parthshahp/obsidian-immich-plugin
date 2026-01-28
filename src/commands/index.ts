import { MarkdownView, Notice } from "obsidian";
import ImmichDailyCarouselPlugin from "../main";
import { insertImmichCarousel } from "./insert-immich-carousel";

export function registerCommands(plugin: ImmichDailyCarouselPlugin) {
	plugin.addCommand({
		id: "insert-immich-carousel",
		name: "Insert Immich carousel",
		editorCallback: (editor, view) => {
			if (!(view instanceof MarkdownView)) {
				new Notice("Open a Markdown note to insert the carousel.");
				return;
			}
			insertImmichCarousel(plugin, editor, view);
		},
	});
}
