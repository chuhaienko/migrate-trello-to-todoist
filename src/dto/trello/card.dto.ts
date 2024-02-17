
export interface CardDto {
	id: string;
	name: string;
	desc: string;
	descData: any;
	url: string;
	closed: boolean;
	dateLastActivity: string;
	idChecklists: string[],
	idAttachmentCover: string | null;
	badges: {
		attachments: number;
		checkItems: number;
		comments: number;
		[key: string]: any;
	};
	idList: string;
	[key: string]: any;
}
