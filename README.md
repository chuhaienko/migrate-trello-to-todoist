# migrate-trello-to-todoist

# How to migrate boards and cards from Trello to Todoist:

## 0. Preparations
1. Run in terminal:
```bash
git clone https://github.com/chuhaienko/migrate-trello-to-todoist.git
cd migrate-trello-to-todoist
cp .env.example .env
```

## 1. Trello authorization
1. Go to "Power-Ups and Integrations" Trello page https://trello.com/power-ups/admin
2. Click "New"
3. Fill form:
   - Name: export
   - Workspace: select your workspace
   - Iframe: leave empty
   - Email: enter your email
   - Support contact: enter your email
   - Author: enter your name
   - Click "Create"
4. On "API Key" page click "Generate a new API key"
5. Set **TRELLO_API_KEY** variable in `.env` file with "API key" value
6. Set **TRELLO_SECRET** variable in `.env` file with "Secret" value
7. Don't forget to remove the integration after complete with migration

## 2. Todoist authorization
1. Go to "Integrations" Todoist page https://app.todoist.com/app/settings/integrations/developer
2. Click "Issue a new API token"
3. Set **TODOIST_TOKEN** variable in `.env` file with API token value

## 3. Migration
1. Run in terminal:
```bash
npm install
npm start
```

It starts migration process.
The script exports data from Trello and import it to Todoist. Script saves exported data to `.cache` dir, so you can use it as your Trello's backup.
Export process is much faster then import, so you can run first time with **TODOIST_DRY_RUN=true**. It will just export and cache data. No data will be imported to Todoist.

# FAQ
### Q: How to just make a backup of Trello data?
A: Set **TODOIST_DRY_RUN=true** in `.env` file and run migration

### Q: How to just make a backup of Todoist data?
A: It can not do it

### Q: Do you collect my data?
A: No. **You** run migration on **your** computer, so cache will be stored on **your** file system. The data will be migrated (copied) from **your** Trello account to **your** Todoist account.

### Q: I have http error on importing to Todoist
A: There may be errors from Todoist like "Too many object per project". You can try to avoid them with decreasing **MAX_SECTIONS** value in `.env` file. Also you can try to move out lists and cards from "big" Trello boards.
