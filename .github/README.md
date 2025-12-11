# .github Directory

This directory contains configuration and instructions for GitHub integrations and AI-powered development tools.

## Files in This Directory

### `copilot-instructions.md`

**Purpose:** Instructions for AI coding assistants (GitHub Copilot, cloud-based coding agents, etc.)

This file serves as a comprehensive guide for AI developer tools to understand:
- **Project Architecture**: How the modular ES6 system works
- **Development Patterns**: Conventions for working with Supabase, modules, and global window objects
- **Troubleshooting**: Common issues and their solutions
- **Coding Standards**: File organization, naming conventions, and best practices

**Why it exists:**
When AI coding assistants help with DartStream development, they need context about the project's unique architecture (vanilla JavaScript ES6 modules, no build tools, Supabase CDN loading patterns). This file ensures AI agents make changes that are consistent with the project's design philosophy and avoid breaking the modular structure.

**Target audience:**
- GitHub Copilot
- GitHub Copilot Workspace
- AI-powered code review tools
- Cloud-based coding agents
- Any AI assistant helping with DartStream development

---

## How AI Agents Use These Instructions

When an AI coding assistant works on the DartStream repository:

1. **It reads `copilot-instructions.md` first** to understand the project context
2. **Applies the patterns** described in the file (e.g., waiting for `window.PlayerDB`, using ES6 modules)
3. **Makes minimal, surgical changes** following the modular architecture guidelines
4. **Avoids common pitfalls** like breaking the global bridge pattern or adding build tools

This ensures AI-assisted development maintains the same quality and consistency as human-written code.
