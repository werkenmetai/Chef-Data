# MCP Specification Overview

**Bron:** https://modelcontextprotocol.io/specification/2025-11-25
**Datum:** 2026-01-28
**Gescraped door:** Claude Browser Extension

---

Model Context Protocol (MCP) is an open protocol that enables seamless integration between LLM applications and external data sources and tools. Whether you're building an AI-powered IDE, enhancing a chat interface, or creating custom AI workflows, MCP provides a standardized way to connect LLMs with the context they need.

## Overview

MCP provides a standardized way for applications to:

- Share contextual information with language models
- Expose tools and capabilities to AI systems
- Build composable integrations and workflows

The protocol uses JSON-RPC 2.0 messages to establish communication between:

- **Hosts**: LLM applications that initiate connections
- **Clients**: Connectors within the host application
- **Servers**: Services that provide context and capabilities

## Key Details

### Base Protocol

- JSON-RPC message format
- Stateful connections
- Server and client capability negotiation

### Features

**Servers offer:**
- Resources: Context and data, for the user or the AI model to use
- Prompts: Templated messages and workflows for users
- Tools: Functions for the AI model to execute

**Clients may offer:**
- Sampling: Server-initiated agentic behaviors and recursive LLM interactions
- Roots: Server-initiated inquiries into URI or filesystem boundaries
- Elicitation: Server-initiated requests for additional information from users

### Additional Utilities

- Configuration
- Progress tracking
- Cancellation
- Error reporting
- Logging

## Security and Trust & Safety

### Key Principles

**User Consent and Control**
- Users must explicitly consent to and understand all data access and operations
- Users must retain control over what data is shared and what actions are taken

**Data Privacy**
- Hosts must obtain explicit user consent before exposing user data to servers
- Hosts must not transmit resource data elsewhere without user consent

**Tool Safety**
- Tools represent arbitrary code execution and must be treated with appropriate caution
- Hosts must obtain explicit user consent before invoking any tool

**LLM Sampling Controls**
- Users must explicitly approve any LLM sampling requests
- Users should control whether sampling occurs at all, the actual prompt, and what results the server can see
