import ImmichDailyCarouselPlugin from "../main";
import {insertImmichCarousel} from "./insert-immich-carousel";

export function registerCommands(plugin: ImmichDailyCarouselPlugin) {
	plugin.addCommand({
		id: "insert-immich-carousel",
		name: "Insert Immich carousel",
		editorCallback: (editor, view) => {
			insertImmichCarousel(plugin, editor, view);
		},
	});
}
