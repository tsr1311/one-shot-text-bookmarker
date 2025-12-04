<!--
Sync Impact Report:
- Version change: 1.0.0 → 1.1.0
- Modified principles: Expanded Simplicity, Transparency, and Modularity sections
- Added sections: IV. Data Integrity, V. User Experience
- Removed sections: TODO placeholders
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/spec-template.md
  - ✅ .specify/templates/tasks-template.md
- Follow-up TODOs: none
-->
# One-Shot Bookmarker Constitution

## Core Principles

### I. Simplicity
- **Clarity over cleverness:** Code MUST be straightforward, easy to understand, and maintainable. Avoid complex or obscure language features when a simpler alternative exists. Complexity should only be introduced when it demonstrably improves user experience or system reliability.
- **Minimalism:** Only add features that directly contribute to the core purpose of the extension: organizing and archiving browser windows and tabs. All new features MUST be justified against this principle with clear user benefit.
- **Focused Commits:** Each commit MUST represent a single, logical change. Commit messages MUST be clear and explain the "why" behind the change, not just the "what". Use conventional commit format where applicable.
- **Configuration over Implementation:** When faced with divergent user needs, prefer adding configuration options over hardcoding behavior. However, avoid configuration complexity that undermines the simplicity principle.

### II. Transparency
- **User Trust is Paramount:** The extension MUST be transparent about the data it accesses and why. All functionality MUST prioritize user privacy and control. Users should always understand what the extension is doing with their data.
- **Justify Permissions:** Every permission requested in `manifest.json` MUST be justified with a clear explanation in the `README.md`. Permissions MUST be proportionate to the value of the feature they enable. Request the minimum permissions necessary.
- **Explicit Consent:** For powerful features that access user data or content (e.g., downloading tab content, accessing tab groups), the user MUST provide explicit, informed consent through the UI. The feature's scope and intrusiveness MUST be clearly communicated with appropriate help text.
- **Open Source Commitment:** The project is committed to being open source, allowing users to inspect the code and verify its behavior. This commitment must be maintained in perpetuity.

### III. Modularity
- **Separation of Concerns (SoC):** The codebase MUST be organized into distinct modules with clear responsibilities. We strictly enforce the separation of:
    - **UI Logic (`popup.js`):** Responsible ONLY for handling user interactions and updating the view. Must delegate all business logic to other modules.
    - **Business Logic:** Core application logic MUST reside in dedicated modules, separate from the UI. Complex operations should be broken down into composable functions.
    - **Background Services (`background.js`):** Responsible ONLY for background tasks, such as event listening, data caching, and maintaining extension state across browser sessions.
    - **Utility Functions (`utils.js`):** MUST contain pure, reusable helper functions that can be independently tested. Utilities should have no side effects and clear input/output contracts.
- **No "God" Scripts:** Monolithic scripts that handle multiple, unrelated responsibilities are strictly prohibited. Files exceeding 500 lines should be considered for refactoring.
- **Single Responsibility:** Each function should do one thing well. Functions exceeding 50 lines should be evaluated for decomposition opportunities.

### IV. Data Integrity
- **Accurate Timestamps:** The extension MUST maintain accurate timestamp information for tabs, windows, and URLs. Timestamp calculation follows a clear priority: URL visit history, tab creation time, then current time as last resort.
- **Consistent Naming:** Bookmark folders and files MUST follow consistent naming conventions as documented. Changes to naming conventions require MAJOR version bump.
- **No Data Loss:** Operations that create bookmarks or download content MUST handle errors gracefully. Partial failures should not prevent the entire operation from completing. Users should be informed of any failures.
- **Idempotent Operations:** Where possible, operations should be idempotent. Re-running the same operation with the same inputs should produce consistent results without harmful side effects.

### V. User Experience
- **Progressive Disclosure:** Advanced features should be revealed progressively. The default UI should be simple and uncluttered, with advanced options appearing only when relevant checkboxes are enabled.
- **Persistent Settings:** User preferences MUST be persisted across sessions using `chrome.storage.local`. Settings should be loaded on popup open and saved immediately on change.
- **Visual Feedback:** The UI MUST provide clear feedback for user actions. Show loading states during operations, confirmation when settings are saved, and clear error messages when operations fail.
- **Sensible Defaults:** Default settings should work well for the majority of users. Advanced users can customize, but defaults should provide a good out-of-box experience.
- **Non-Destructive Operations:** The extension creates bookmarks and downloads files but MUST NOT modify or delete existing user data without explicit user action. All operations are additive by default.

## Governance

### Amendment Procedure
Amendments to this constitution require:
1. A pull request documenting the proposed change
2. Clear rationale for the change with examples or use cases
3. Impact analysis on existing code and templates
4. Approval from at least one other contributor (if available)
5. Update to all affected templates and documentation

### Compliance
- All code reviews MUST verify compliance with the principles outlined in this constitution
- Deviations MUST be explicitly justified in commit messages or PR descriptions
- Technical debt introduced by violating principles must be tracked and addressed
- Regular audits should be conducted to ensure ongoing compliance

### Versioning
The constitution follows Semantic Versioning (MAJOR.MINOR.PATCH):
- **MAJOR:** Backward-incompatible changes, such as removing or fundamentally redefining a principle. Requires updating all dependent templates.
- **MINOR:** Adding a new principle or significantly expanding guidance. May require template updates.
- **PATCH:** Clarifications, typo fixes, or non-semantic refinements. No template updates required.

### Review Cadence
The constitution should be reviewed:
- When adding major new features that may introduce new principles
- Quarterly to ensure principles remain relevant and well-defined
- When contributors identify conflicts or ambiguities in existing principles

**Version**: 1.1.0 | **Ratified**: 2025-12-04 | **Last Amended**: 2025-12-04