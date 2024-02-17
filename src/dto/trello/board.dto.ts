
export interface BoardDto {
	id: string;
	name: string;
	desc: string;
	descData: any;
	closed: boolean;
	dateClosed: string;
	url: string;
	dateLastActivity: string;
	dateLastView: string;
	[key: string]: any;
}
