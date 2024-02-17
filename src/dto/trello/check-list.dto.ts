import { CheckItemDto } from './check-item.dto';

export interface CheckListDto {
	id: string;
	name: string;
	idBoard: string;
	idCard: string;
	checkItems: Array<CheckItemDto>;
	[key: string]: any;
}
