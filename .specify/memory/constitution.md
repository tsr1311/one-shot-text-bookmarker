# Spec-Kit Constitution

## Core Principles

### I. GitHub as the Source of Truth
All specifications and documentation are derived directly from the content hosted on GitHub. The agent must prioritize fetching and parsing information from the relevant GitHub repositories before looking at local or cached versions. Local modifications should be treated as temporary and subject to validation against the GitHub source.

### II. Resource-Centric Operations
Every operation revolves around a specific resource (e.g., an AWS or AWSCC resource). The agent must first identify the target resource and then use the provided tools to resolve its documentation path on GitHub. All subsequent actions, like parsing or spec generation, are based on this resolved resource.

### III. Structured Specification Generation
The primary output of the agent is a structured specification file. When generating a spec, the agent must:
1.  Fetch the resource's documentation from GitHub using the `fetch_github_documentation` function.
2.  Parse the Markdown content to extract key details, such as resource arguments, attributes, and examples.
3.  Format the extracted information into the standardized specification structure defined by the project.
4.  Include metadata in the generated spec, such as the source GitHub URL and the timestamp of when the information was fetched.

### IV. Idempotent and Verifiable Actions
All modifications made by the agent must be idempotent. Running the same command multiple times with the same input should produce the same result. The agent should provide mechanisms to verify that a generated specification is up-to-date with its source documentation on GitHub.

### V. Graceful Degradation and Error Handling
If a resource's documentation cannot be fetched or parsed from GitHub (e.g., due to a 404 error or unexpected content structure), the agent must fail gracefully. It should provide a clear error message that includes the resource name and the GitHub URL it attempted to access. It should not fall back to using stale or potentially incorrect local data.

## Development Workflow

### Specification Updates
When updating an existing specification, the agent must:
1.  Identify the resource associated with the spec.
2.  Fetch the latest version of the documentation from GitHub.
3.  Compare the fetched documentation with the existing spec.
4.  Apply any necessary changes to bring the spec in line with the documentation. A summary of changes should be reported.

### Adding New Resources
To add a new resource, the agent will be provided with the resource name. It must then:
1.  Resolve the resource's documentation path on GitHub.
2.  Fetch and parse the documentation.
3.  Generate a new specification file according to the structured format.

## Governance
This constitution is the primary directive for the agent's behavior. Any deviation must be explicitly requested by the user during an interactive session. The core functions for interacting with GitHub (`fetch_github_documentation`, `resource_to_github_path`, `github_graphql_request`) are the trusted mechanisms for implementing these principles.

**Version**: 1.0 | **Ratified**: 2025-12-03
