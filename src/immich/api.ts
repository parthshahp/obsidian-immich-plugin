import { requestUrl } from "obsidian";
import { ImmichDailySettings } from "../settings";
import { normalizeBaseUrl } from "../utils/immich";
import { searchCache, thumbnailCache } from "../utils/cache";
import { ImmichAsset, ImmichSearchResponse } from "./types";

interface ImmichSearchRequest {
	takenAfter: string;
	takenBefore: string;
	size: number;
	type?: "IMAGE" | "VIDEO";
	withArchived?: boolean;
	order?: "asc" | "desc";
}

function buildSearchCacheKey(
	settings: ImmichDailySettings,
	startIso: string,
	endIso: string,
): string {
	return `${settings.baseUrl}|${startIso}|${endIso}|${settings.maxAssets}|${settings.includeVideos}|${settings.includeArchived}|${settings.sortOrder}`;
}

export async function searchAssetsForDate(
	settings: ImmichDailySettings,
	startIso: string,
	endIso: string,
): Promise<ImmichAsset[]> {
	const cacheKey = buildSearchCacheKey(settings, startIso, endIso);
	const cached = searchCache.get(cacheKey);
	if (cached) {
		return cached as ImmichAsset[];
	}

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
	const assets = json.assets?.items ?? json.items ?? [];
	searchCache.set(cacheKey, assets);
	return assets;
}

function buildThumbnailCacheKey(
	settings: ImmichDailySettings,
	assetId: string,
): string {
	return `${settings.baseUrl}|${assetId}|${settings.imageSize}`;
}

export async function fetchAssetThumbnail(
	settings: ImmichDailySettings,
	assetId: string,
): Promise<Blob> {
	const cacheKey = buildThumbnailCacheKey(settings, assetId);
	const cached = thumbnailCache.get(cacheKey);
	if (cached) {
		return cached;
	}

	const baseUrl = normalizeBaseUrl(settings.baseUrl);
	const url = `${baseUrl}/api/assets/${assetId}/thumbnail?size=${settings.imageSize}`;

	const response = await requestUrl({
		url,
		method: "GET",
		headers: {
			"x-api-key": settings.apiKey,
		},
	});

	const bytes = response.arrayBuffer;
	const blob = new Blob([bytes]);
	thumbnailCache.set(cacheKey, blob);
	return blob;
}

export function isRenderableAsset(asset: ImmichAsset) {
	return (
		asset.type === "IMAGE" ||
		asset.type === "VIDEO" ||
		asset.type === undefined
	);
}
