import { CardDto } from './dto/trello/card.dto';
import { Todoist } from './lib/todoist';
import { Trello } from './lib/trello';

async function main () {
	const MAX_SECTIONS = Number(process.env["MAX_SECTIONS"]) || 10;
	const MAX_PROJECTS = Number(process.env["MAX_PROJECTS"]) || 50;

	const trello = new Trello(
		String(process.env["TRELLO_BASE_URL"]),
		String(process.env["TRELLO_API_KEY"]),
		String(process.env["TRELLO_SECRET"]),
	);

	const todoist = new Todoist(
		String(process.env["TODOIST_BASE_URL"]),
		String(process.env["TODOIST_TOKEN"]),
	)

	const trelloBoards = await trello.getBoards();
	console.log(Date.now(), `Trello boards: ${trelloBoards.length}`);

	let mainTodoistProject = await todoist.createProject("🧿 From Trello", null);

	for (let boardIdx = 0; boardIdx < trelloBoards.length; boardIdx += 1) {
		const trelloBoard = trelloBoards[boardIdx];

		if ((boardIdx % MAX_PROJECTS == 0) && (boardIdx / MAX_PROJECTS >= 1)) {
			mainTodoistProject = await todoist.createProject(`🧿 From Trello (${Math.floor(boardIdx / MAX_PROJECTS)})`, null);
		}

		console.log();
		console.log(`Trello board: ${trelloBoard.name}`);

		const trelloLists = [
			...await trello.getLists(trelloBoard.id),
			...await trello.getLists(trelloBoard.id, 'closed'),
		];
		console.log(Date.now(), `Trello lists: ${trelloLists.length}`);

		let trelloActions = filterUnique(await trello.getActions(trelloBoard.id));
		console.log(Date.now(), `Trello actions: ${trelloActions.length}`);

		const trelloCheckLists = filterUnique(await trello.getCheckLists(trelloBoard.id));
		console.log(Date.now(), `Trello checkLists: ${trelloCheckLists.length}`);

		let trelloCards: CardDto[] = [];

		for (const trelloList of trelloLists) {
			trelloCards.push(
				...await trello.getCardsByList(trelloList.id),
				...await trello.getCardsByList(trelloList.id, 'closed'),
			)
		}

		trelloCards = filterUnique(trelloCards);

		console.log(Date.now(), `Trello cards: ${trelloCards.length}`);

		let todoistProject = await todoist.createProject(getName(trelloBoard), mainTodoistProject.id);

		for (let listIdx = 0; listIdx < trelloLists.length; listIdx += 1) {
			const trelloList = trelloLists[listIdx];

			if ((listIdx % MAX_SECTIONS == 0) && (listIdx / MAX_SECTIONS >= 1)) {
				todoistProject = await todoist.createProject(`${getName(trelloBoard)} (${Math.floor(listIdx / MAX_SECTIONS)})`, mainTodoistProject.id);
			}

			const todoistSection = await todoist.createSection(getName(trelloList), todoistProject.id);
			trelloList["todoistSectionId"] = todoistSection.id;
		}

		for (const trelloCard of trelloCards) {
			console.log(`Trello card: ${trelloCard.name}`);

			const todoistSectionId = trelloLists.find((list) => list.id === trelloCard.idList)?.["todoistSectionId"];

			const todoistTask = await todoist.createTask(
				trelloCard.name,
				trelloCard.desc,
				null,
				todoistSectionId,
				null,
			);

			if (trelloCard.badges.attachments > 0) {
				const trelloAttachments = await trello.getAttachments(trelloCard.id);
				console.log(Date.now(), `Trello attachments: ${trelloAttachments.length}`);

				for (const trelloAttachment of trelloAttachments) {
					if (trelloAttachment.url.includes("https://trello.com")) {
						// The attachment is probably a file uploaded to Trello card. Download the file and upload it to Todoist.
						const fileStream = await trello.getAttachmentFileStream(trelloAttachment.url);
						await todoist.uploadAttachment(todoistTask.id, trelloAttachment.fileName, trelloAttachment.mimeType, fileStream);
					} else { 
						// The attachment is probably a URL to a website. Don't download the file, just add the URL as a comment.
						await todoist.createComment(trelloAttachment.url, todoistTask.id);
					}					
				}
			}

			if (trelloCard.badges.comments > 0) {
				const trelloComments = trelloActions
					.filter((action) => action.data.card?.id === trelloCard.id && action.type === "commentCard")
					.map((action) => action.data.text);

				for (const trelloComment of trelloComments) {
					if (trelloComment) {
						await todoist.createComment(trelloComment, todoistTask.id);
					}
				}
			}

			if (trelloCard.badges.checkItems > 0) {
				const filteredTrelloCheckLists = trelloCheckLists
					.filter((checkList) => {
						return checkList.idCard === trelloCard.id;
					});
				const uniqueTrelloCheckLists = filterUnique(filteredTrelloCheckLists);

				for (const trelloCheckList of uniqueTrelloCheckLists) {
					const listTask = await todoist.createTask(`List: ${trelloCheckList.name}`, "", null, null, todoistTask.id);

					for (const checkItem of trelloCheckList.checkItems) {
						const itemTask = await todoist.createTask(checkItem.name, "", null, null, listTask.id);

						if (checkItem.state === "complete") {
							await todoist.closeTask(itemTask.id);
						}
					}
				}
			}

			const trelloList = trelloLists.find((it) => it.id === trelloCard.idList);

			if (trelloCard.closed || trelloList?.closed) {
				await todoist.closeTask(todoistTask.id);
			}
		}
	}
}

function getName(obj: { name: string; closed: boolean }): string {
	return `${obj.closed ? '🔒 ' : ''}${obj.name}`;
}

function filterUnique<T extends { id: string }>(collection: Array<T>): Array<T> {
	return collection.filter((it, idx) => {
		return idx === collection.findIndex((it2) => it2.id === it.id);
	});
}

main();