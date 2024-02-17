
export interface AttachmentDto {
	id: string;
	date: string;
	isUpload: boolean;
	mimeType: string;
	name: string;
	url: string;
	fileName: string;
	[key: string]: any;
}
