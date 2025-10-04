<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->
- [x] Verify that the copilot-instructions.md file in the .github directory is created.

- [x] Clarify Project Requirements
	Project: DIDs Analytics - MERN stack web application with React frontend, Express.js/Node.js backend, MongoDB Atlas database, Tailwind CSS styling, collapsible side menu with Dashboard, DIDs, Area Codes, Upload Data navigation.

- [x] Scaffold the Project
	Creating MERN stack project structure manually since no appropriate projectType is available. Setting up frontend (React), backend (Express.js/Node.js), and shared folder structure.

- [x] Customize the Project
	Developed complete MERN stack application with:
	- React frontend with TypeScript, functional components, and hooks
	- Express.js backend with TypeScript and RESTful API routes
	- Tailwind CSS styling with responsive design
	- Collapsible/lockable sidebar navigation
	- Main layout with Dashboard, DIDs, Area Codes, and Upload Data pages
	- File upload functionality with drag-and-drop interface
	- Mock data for development and testing

- [x] Install Required Extensions
	No specific extensions required for this project type.

- [x] Compile the Project
	Both frontend and backend successfully compile and run:
	- Frontend: React app running on http://localhost:3000
	- Backend: Express server running on http://localhost:5000
	- All dependencies installed and TypeScript compilation successful

- [x] Create and Run Task
	No additional tasks needed - both servers run with npm scripts:
	- Frontend: npm start
	- Backend: npm run dev

- [x] Launch the Project
	Both frontend and backend applications are successfully running:
	- Frontend accessible at http://localhost:3000
	- Backend API accessible at http://localhost:5000
	- All navigation features working including collapsible sidebar
	- All pages rendering correctly with mock data

- [x] Ensure Documentation is Complete
	Complete documentation created including:
	- Comprehensive README.md with project overview, installation, and usage instructions
	- API endpoint documentation
	- Project structure documentation
	- Development and deployment guidelines

<!--
## Execution Guidelines
PROGRESS TRACKING:
- If any tools are available to manage the above todo list, use it to track progress through this checklist.
- After completing each step, mark it complete and add a summary.
- Read current todo list status before starting each new step.

COMMUNICATION RULES:
- Avoid verbose explanations or printing full command outputs.
- If a step is skipped, state that briefly (e.g. "No extensions needed").
- Do not explain project structure unless asked.
- Keep explanations concise and focused.

DEVELOPMENT RULES:
- Use '.' as the working directory unless user specifies otherwise.
- Avoid adding media or external links unless explicitly requested.
- Use placeholders only with a note that they should be replaced.
- Use VS Code API tool only for VS Code extension projects.
- Once the project is created, it is already opened in Visual Studio Code—do not suggest commands to open this project in Visual Studio again.
- If the project setup information has additional rules, follow them strictly.

FOLDER CREATION RULES:
- Always use the current directory as the project root.
- If you are running any terminal commands, use the '.' argument to ensure that the current working directory is used ALWAYS.
- Do not create a new folder unless the user explicitly requests it besides a .vscode folder for a tasks.json file.
- If any of the scaffolding commands mention that the folder name is not correct, let the user know to create a new folder with the correct name and then reopen it again in vscode.

EXTENSION INSTALLATION RULES:
- Only install extension specified by the get_project_setup_info tool. DO NOT INSTALL any other extensions.

PROJECT CONTENT RULES:
- If the user has not specified project details, assume they want a "Hello World" project as a starting point.
- Avoid adding links of any type (URLs, files, folders, etc.) or integrations that are not explicitly required.
- Avoid generating images, videos, or any other media files unless explicitly requested.
- If you need to use any media assets as placeholders, let the user know that these are placeholders and should be replaced with the actual assets later.
- Ensure all generated components serve a clear purpose within the user's requested workflow.
- If a feature is assumed but not confirmed, prompt the user for clarification before including it.
- If you are working on a VS Code extension, use the VS Code API tool with a query to find relevant VS Code API references and samples related to that query.

TASK COMPLETION RULES:
- Your task is complete when:
  - Project is successfully scaffolded and compiled without errors
  - copilot-instructions.md file in the .github directory exists in the project
  - README.md file exists and is up to date
  - User is provided with clear instructions to debug/launch the project

Before starting a new task in the above plan, update progress in the plan.
-->
- Work through each checklist item systematically.
- Keep communication concise and focused.
- Follow development best practices.