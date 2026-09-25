/*
(c) 2025 Sharon Aicler (saichler@gmail.com)

Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
*/
// l8agent Shared Form Definitions - Prompt edit form

(function() {
    'use strict';

    window.L8Agent = window.L8Agent || {};

    const f = window.Layer8FormFactory;
    const enums = L8Agent.enums;

    L8Agent.forms = {
        // L8AgentConversation had columns and a primaryKey but no form, so a row
        // click in any conversations table resolved no form definition and
        // silently opened no detail popup. createdAt/updatedAt are stamped by
        // the service, so they are display-only here.
        L8AgentConversation: f.form('Conversation', [
            f.section('Conversation', [
                ...f.text('title', 'Title', true),
                ...f.text('userId', 'User'),
                ...f.select('status', 'Status', enums.CONVO_STATUS),
                { key: 'createdAt', label: 'Created', type: 'date', readOnly: true },
                { key: 'updatedAt', label: 'Updated', type: 'date', readOnly: true }
            ])
        ]),
        L8AgentPrompt: f.form('Prompt Template', [
            f.section('Prompt Information', [
                ...f.text('name', 'Name', true),
                ...f.textarea('description', 'Description'),
                ...f.select('category', 'Category', enums.PROMPT_CATEGORY, true),
                ...f.select('status', 'Status', enums.PROMPT_STATUS),
                ...f.text('createdBy', 'Created By')
            ]),
            f.section('System Prompt', [
                ...f.textarea('systemPrompt', 'System Prompt Template', true)
            ])
        ])
    };
})();
