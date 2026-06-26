# Contributing to Skills Hub

Thanks for considering contributing! 🎉

## Ways to Contribute

### 🐛 Report a Bug

Open an [issue](https://github.com/liuxingqitd/skills-hub/issues/new?template=bug_report.md) with:
- A clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Your OS and agent setup

### 💡 Suggest a Feature

Open a [feature request](https://github.com/liuxingqitd/skills-hub/issues/new?template=feature_request.md) with:
- What problem it solves
- How it should work
- Any alternatives you've considered

### 🧑‍💻 Submit Code

1. Fork the repo
2. Create a new branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Ensure tests pass: `npm test`
5. Type-check: `npx tsc --noEmit`
6. Commit with clear messages
7. Push and open a PR against `main`

### ➕ Add Support for a New Agent

1. Edit `config/agents.json` with the agent's name and default skill path
2. Update the README supported agents list
3. Open a PR

## Development Setup

```bash
git clone git@github.com:liuxingqitd/skills-hub.git
cd skills-hub
npm install
npm run dev
```

## Code Guidelines

- **TypeScript** — strong typing everywhere
- **Tailwind CSS v4** — utility-first, no custom CSS unless necessary
- **Tests** — add tests for new functionality
- **Agents config** — `config/agents.json` is the single source of truth

## PR Checklist

- [ ] My code follows the project style
- [ ] Tests pass (`npm test`)
- [ ] TypeScript type-check passes (`npx tsc --noEmit`)
- [ ] I've added/updated documentation if needed
- [ ] The PR title follows conventional commit format

## Questions?

Open a [Discussion](https://github.com/liuxingqitd/skills-hub/discussions) or join our community.
