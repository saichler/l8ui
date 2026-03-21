# L8AgentChat

AI chat interface with conversation management, markdown-rendered responses, and inline data tables.

## Desktop

```js
L8AgentChat.init({
    containerId: 'agent-container',      // REQUIRED: DOM element ID
    chatEndpoint: '/0/AgentChat'         // REQUIRED: LLM chat endpoint
});
L8AgentChat.sendMessage(text)            // Send user message to LLM
L8AgentChat.loadConversation(id)         // Load historical conversation by ID
L8AgentChat.newConversation()            // Clear and reset chat
```

Features: conversation selector dropdown, message history with user/assistant roles, markdown rendering for assistant responses, token count display, inline data result tables via Layer8DTable, loading animation.

## Mobile (L8AgentChatMobile)

Same API as desktop but uses `Layer8MAuth` for HTTP and `Layer8MTable` for inline data results.

```js
L8AgentChatMobile.init({
    containerId: 'agent-container',
    chatEndpoint: '/0/AgentChat'
});
L8AgentChatMobile.sendMessage(text)
L8AgentChatMobile.loadConversation(id)
L8AgentChatMobile.newConversation()
```
