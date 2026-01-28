import {requestUrl} from "obsidian";
import {ImmichDailySettings} from "../settings";
import {normalizeBaseUrl} from "../utils/immich";
import {ImmichAsset, ImmichSearchResponse} from "./types";

interface ImmichSearchRequest {
	takenAfter: string;
	takenBefore: string;
	size: number;
	type?: "IMAGE" | "VIDEO";
	withArchived?: boolean;
	order?: "asc" | "desc";
}

export async function searchAssetsForDate(settings: ImmichDailySettings, startIso: string, endIso: string) {
	const baseUrl = normalizeBaseUrl(settings.baseUrl);
	const url = `${baseUrl}/api/search/metadata`;

	const body: ImmichSearchRequest = {
		takenAfter: startIso,
		takenBefore: endIso,
		size: settings.maxAssets,
		withArchived: settings.includeArchived,
		order: settings.sortOrder,
	};

	if (!settings.includeVideos) {
		body.type = "IMAGE";
	}

	const response = await requestUrl({
		url,
		method: "POST",
		body: JSON.stringify(body),
		headers: {
			"content-type": "application/json",
			"x-api-key": settings.apiKey,
		},
	});

	const json = response.json as ImmichSearchResponse;
	return json.assets?.items ?? json.items ?? [];
}

export async function fetchAssetThumbnail(settings: ImmichDailySettings, assetId: string) {
	const baseUrl = normalizeBaseUrl(settings.baseUrl);
	const url = `${baseUrl}/api/assets/${assetId}/thumbnail?size=${settings.imageSize}`;

	const response = await requestUrl({
		url,
		method: "GET",
		headers: {
			"x-api-key": settings.apiKey,
		},
		responseType: "arraybuffer",
	});

	const bytes = response.arrayBuffer;
	return new Blob([bytes]);
}

export function isRenderableAsset(asset: ImmichAsset) {
	return asset.type === "IMAGE" || asset.type === "VIDEO" || asset.type === undefined;
}
