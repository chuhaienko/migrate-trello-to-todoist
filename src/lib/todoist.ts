import axios from "axios";
import FormData from "form-data";
import { Stream } from "node:stream";
import { GeneralDto } from '../dto/todoist/general.dto';
import { FileDto } from '../dto/todoist/file.dto';

export class Todoist {
	private readonly DRY_RUN = process.env['TODOIST_DRY_RUN'] === "true";
	private count = 0;
	private timeout: Promise<void> | null = null
	private readonly delay = this.DRY_RUN ? 0 : 2000;

	public constructor(
		private readonly baseUrl: string,
		private readonly token: string,
	) {
	}

	public async createProject(name: string, parentId: string | null): Promise<GeneralDto> {
		const project = await this.callApi<GeneralDto>("/rest/v2/projects", {
			name: name,
			parent_id: parentId,
			view_style: "board",
	});

		return project;
	}

	public async createSection(name: string, projectId: string): Promise<GeneralDto> {
		const section = await this.callApi<GeneralDto>("/rest/v2/sections", {
			name: name,
			project_id: projectId,
		});

		return section;
	}

	public async createTask(
		content: string,
		description: string,
		projectId: string | null,
		sectionId: string | null,
		parentId: string | null,
	): Promise<GeneralDto> {
		const task = await this.callApi<GeneralDto>("/rest/v2/tasks", {
			content: content,
			description: description,
			project_id: projectId,
			section_id: sectionId,
			parent_id: parentId,
		});

		return task;
	}

	public async closeTask(taskId: string): Promise<void> {
		await this.callApi<GeneralDto>(`/rest/v2/tasks/${taskId}/close`);
	}

	public async createComment(content: string, taskId: string): Promise<GeneralDto> {
		const comment = await this.callApi<GeneralDto>("/rest/v2/comments", {
			content: content,
			task_id: taskId,
	});

		return comment;
	}

	public async uploadAttachment(taskId: string, fileName: string, mimeType: string, fileStream: Stream): Promise<void> {
		const fileResult = await this.uploadFile("/sync/v9/uploads/add", fileName, fileStream);

		const comment = await this.callApi<GeneralDto>("/rest/v2/comments", {
			task_id: taskId,
			content: fileResult.file_name,
			attachment: {
        file_name: fileResult.file_name,
        file_type: fileResult.file_type,
        file_url: fileResult.file_url,
        resource_type: "file",
    	},
		});
	}

	private async callApi<T>(url: string, data?: any): Promise<T> {
		this.count += 1;

		if (this.timeout) {
			await this.timeout;
		}

		console.log(Date.now(), this.count, url, data);

		this.timeout = new Promise((resolve) => setTimeout(resolve, this.delay));

		if (this.DRY_RUN) {
			return { id: this.count } as any;
		}

		while (true) {
			try {
				const result = await axios.request<T>({
					method: "POST",
					baseURL: this.baseUrl,
					headers: {
						Authorization: `Bearer ${this.token}`,
					},
					url: url,
					data: data,
				});

				return result.data;
			} catch (err) {
				console.log(`Request failed: ${err} ${(err as any).response?.data}`);

				await new Promise((resolve) => setTimeout(resolve, 5000));
			}
		}
	}

	private async uploadFile(url: string, fileName: string, fileStream: Stream): Promise<FileDto> {
		this.count += 1;

		if (this.timeout) {
			await this.timeout;
		}

		console.log(Date.now(), this.count, fileName);

		this.timeout = new Promise((resolve) => setTimeout(resolve, this.delay));

		if (this.DRY_RUN) {
			return { id: this.count } as any;
		}

		const formData = new FormData({
			maxDataSize: 100 * 1024 * 1024,
		});
		formData.append("file_name", fileName);
		formData.append("file", fileStream, fileName);

		const result = await axios.request<FileDto>({
			method: "POST",
			baseURL: this.baseUrl,
			url: url,
			headers: {
				...formData.getHeaders(),
				Authorization: `Bearer ${this.token}`,
			},
			data: formData,
		});

		return result.data;
	}
}
