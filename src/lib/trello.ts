import axios from "axios";
import { Stream } from 'node:stream';
import { Cache } from './cache';
import { BoardDto } from '../dto/trello/board.dto';
import { ListDto } from '../dto/trello/list.dto';
import { CardDto } from '../dto/trello/card.dto';
import { ActionDto } from '../dto/trello/action.dto';
import { CheckListDto } from '../dto/trello/check-list.dto';
import { AttachmentDto } from '../dto/trello/attachment.dto';

export class Trello {
	private readonly cache = new Cache();

	public constructor(
		private readonly baseUrl: string,
		private readonly apiKey: string,
		private readonly secret: string,
	) {
	}

	public async getBoards(): Promise<Array<BoardDto>> {
		const boards = await this.callApiList<BoardDto>("/members/me/boards", false);

		return boards;
	}

	public async getLists(boardId: string, filter?: string): Promise<Array<ListDto>> {
		const lists = await this.callApiList<ListDto>(`/boards/${boardId}/lists${filter ? `?filter=${filter}` : ''}`, false);

		return lists;
	}

	public async getActions(boardId: string): Promise<Array<ActionDto>> {
		const cards = await this.callApiList<ActionDto>(`/boards/${boardId}/actions`, true);

		return cards;
	}

	public async getCheckLists(boardId: string): Promise<Array<CheckListDto>> {
		const checkLists = await this.callApiList<CheckListDto>(`/boards/${boardId}/checklists`, true);

		return checkLists;
	}

	public async getCardsByBoard(boardId: string, filter?: string): Promise<Array<CardDto>> {
		const cards = await this.callApiList<CardDto>(`/boards/${boardId}/cards${filter ? `?filter=${filter}` : ''}`, true);

		return cards;
	}

	public async getCardsByList(listId: string, filter?: string): Promise<Array<CardDto>> {
		const cards = await this.callApiList<CardDto>(`/lists/${listId}/cards${filter ? `?filter=${filter}` : ''}`, true);

		return cards;
	}

	public async getAttachments(cardId: string): Promise<Array<AttachmentDto>> {
		const attachments = await this.callApiList<AttachmentDto>(`/cards/${cardId}/attachments`, false);

		return attachments;
	}

	public async getAttachmentFileStream(url: string): Promise<Stream> {
		const stream = await this.getContentStream(url);

		return stream;
	}

	private async callApiList<T extends {id: string}>(url: string, multiPage: boolean): Promise<Array<T>> {
		const cached = await this.cache.tryCache<Array<T>>(url);

		if (cached !== null) {
			return cached;
		}

		const list = new Array<T>();
		let last = "";

		while (true) {
			await new Promise(resolve => setTimeout(resolve, 100));

			console.log(Date.now(), `request: ${this.baseUrl}${url} before=${last}`);
			const chunk = await axios.request<Array<T>>({
				method: "GET",
				baseURL: this.baseUrl,
				url: `${url}${url.includes('?') ? '&' : '?'}key=${this.apiKey}&token=${this.secret}&before=${last}`
			});

			list.push(...chunk.data);

			const lastInChunk = chunk.data.findIndex((it) => it.id === last) !== -1;

			if (chunk.data.length == 0 || multiPage === false || lastInChunk) {
				await this.cache.storeCache(url, list);

				return list;
			}

			last = list[list.length - 1]?.id;
		}
	}

	private async getContentStream(url: string): Promise<Stream> {
		let cached = await this.cache.tryFile(url);

		if (cached !== null) {
			return cached;
		}

		await new Promise(resolve => setTimeout(resolve, 100));

		console.log(Date.now(), `request: ${url}`);
		const response = await axios.request({
			method: "GET",
			url: url,
			headers: {
				Authorization: `OAuth oauth_consumer_key="${this.apiKey}", oauth_token="${this.secret}"`
			},
			responseType: 'stream'
		});

		await this.cache.saveFile(url, response.data);

		cached = await this.cache.tryFile(url);

		return cached!;
	}
}
