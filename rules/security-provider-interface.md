# Security Provider Interface

## Rule
All security and AAA (Authentication, Authorization, Accounting) concerns in a Layer 8 ecosystem project MUST be satisfied by implementing the `ifs.ISecurityProvider` interface. Do NOT invent custom authentication, authorization, or session management logic — use the framework's security contract.

## What ISecurityProvider Covers
- **Authentication**: Verifying user identity (login, tokens, credentials)
- **Authorization**: Determining what a user is allowed to do (roles, permissions, access control)
- **Accounting**: Tracking user actions and access

## Usage
When a Layer 8 project needs security:
1. Implement the `ifs.ISecurityProvider` interface
2. Register the implementation with the framework
3. The framework handles enforcement — services, endpoints, and UI components respect the provider automatically

## What NOT to Do
- Do NOT write custom auth middleware outside of `ISecurityProvider`
- Do NOT hardcode permission checks in service callbacks
- Do NOT implement session management independently of the framework
- Do NOT bypass `ISecurityProvider` for "simple" cases — all security goes through this interface

## Finding the Interface Definition
The `ISecurityProvider` interface is defined in the `ifs` package within the Layer 8 framework dependencies:
```bash
grep -rn "ISecurityProvider" go/vendor/github.com/saichler/
```
