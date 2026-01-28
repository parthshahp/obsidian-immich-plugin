export type ImmichAssetType = "IMAGE" | "VIDEO" | "AUDIO" | "OTHER";

export interface ImmichAsset {
	id: string;
	type?: ImmichAssetType;
	originalFileName?: string;
	fileCreatedAt?: string;
	localDateTime?: string;
}

export interface ImmichSearchResponse {
	assets?: {
		items?: ImmichAsset[];
	};
	items?: ImmichAsset[];
}
