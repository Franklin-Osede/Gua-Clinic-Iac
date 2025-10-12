# Project Template

This repository hosts the source code for the Project Template. This project aims to serve as a starting point for future React-based projects, integrating best practices and essential libraries for rapid and effective development.

## Table of Contents

- [About the Project](#about-the-project)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Development](#development)
  - [Scripts](#scripts)
- [Linting & Formatting](#linting--formatting)
- [GitHub Actions](#github-actions)

## About The Project

This project template includes essential tools like React, TypeScript, Vite, Tailwind CSS, ESLint, Prettier, and PrimeReact.

## Technologies Used

- [Vite](https://vitejs.dev/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [PrimeReact](https://www.primefaces.org/primereact/)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [Node Version Manager (nvm)](https://github.com/nvm-sh/nvm)

## Project Structure

### Atomic Design

This project follows the [Atomic Design](https://bradfrost.com/blog/post/atomic-web-design/) methodology, which ensures a structured, functional, and maintainable codebase.

## Getting Started

### Prerequisites

This project requires the following tools:

- [Node.js](https://nodejs.org)
- [npm](https://www.npmjs.com/)

### Installation

To set up the project on your local machine:

1. Clone the repository:

```
git clone https://github.com/theam/react-vite-template.git
```

2. Navigate to the project directory:

```
cd ./react-vite-template
```

3. Install the project dependencies:

```
npm install
```

## Development

### Scripts

These are some of the available scripts for development:

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the project for production.
- `npm run lint`: Runs ESLint on the project to identify issues.
- `npm run lint:fix`: Fixes ESLint identified issues.
- `npm run format`: Runs Prettier to format the code.

### Component Library: PrimeReact

In this project, we've chosen to use [PrimeReact](https://www.primefaces.org/primereact/) as our main component library. PrimeReact offers a rich set of open-source components with various themes. Some reasons for this choice include:

- **Rich Component Set**: PrimeReact provides a wide range of ready-to-use components that can help speed up the development process.
- **Flexibility & Theming**: The library offers various themes and customization options, making it easier to achieve our design goals.

While PrimeReact is our choice for this template, other alternatives like [Material-UI](https://material-ui.com/) can also be considered based on project-specific requirements. The decision should be based on the project's needs, familiarity with the library, and the specific components required.

## Linting & Formatting

To ensure consistent code style and catch potential errors early, this template utilizes both ESLint for linting and Prettier for code formatting. You can run `npm run lint` to check for linting issues and `npm run format` to auto-format your code.

## GitHub Actions

Automated checks are set up using GitHub Actions. Currently, it checks for linting, formatting, and ensures the build process runs without errors. This can be particularly useful to ensure PRs maintain a consistent code quality. Check out the `.github/workflows` directory for more details.
