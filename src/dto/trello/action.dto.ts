
export interface ActionDto {
	id: string;
	data: {
		card?: {
			id: string;
			[key: string]: any;
		};
		text?: string;
		[key: string]: any;
	};
	type: string;
	date: string;
	[key: string]: any;
}
