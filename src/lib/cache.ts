import fs from 'node:fs/promises';
import path from 'node:path';
import { Stream } from 'node:stream';

export class Cache {
	private DIR = path.resolve(process.cwd(), ".cache");

	public constructor () {}

	public async tryCache<T>(name: string): Promise<T | null> {
		try {
			const fileName = this.getJsonFileName(name);

			const content = await fs.readFile(fileName, {
				encoding: "utf8",
				flag: 'r',
			});

			const data = JSON.parse(content);

			return data;
		} catch (err) {
			return null;
		}
	}

	public async storeCache<T>(name: string, data: T): Promise<void> {
		try {
			const fileName = this.getJsonFileName(name);

			await fs.writeFile(fileName, JSON.stringify(data, null, 2), {
				encoding: "utf8",
				flag: 'w'
			});
		} catch (err) {
			console.warn("storeCache", err);
		}
	}

	public async tryFile(url: string): Promise<Stream | null> {
		try {
			const fileName = this.getFileName(url);
			const fh = await fs.open(fileName);

			return fh.createReadStream();
		} catch (err) {
			return null;
		}
	}

	public async saveFile(url: string, fileStream: Stream): Promise<void> {
		const fileName = this.getFileName(url);

		await fs.writeFile(fileName, fileStream)
	}

	private getJsonFileName(name: string): string {
		return this.getFileName(name) + ".json";
	}

	private getFileName(name: string): string {
		const escaped = name.replaceAll(/[:?]/gi, '.').replaceAll(/[^-._\w\d]/ig, '_');
		return path.resolve(this.DIR, escaped);
	}
}