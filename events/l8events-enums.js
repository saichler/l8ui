(function() {
    'use strict';

    const { createStatusRenderer, renderEnum } = Layer8DRenderers;

    const SEVERITY = Layer8EnumFactory.create([
        ['Unspecified', null, ''],
        ['Info', 'info', ''],
        ['Warning', 'warning', ''],
        ['Minor', 'minor', ''],
        ['Major', 'major', ''],
        ['Critical', 'critical', '']
    ]);

    const SEVERITY_CLASSES = {
        0: '',
        1: 'status-muted',
        2: 'status-info',
        3: 'status-warning',
        4: 'status-warning-high',
        5: 'status-error'
    };

    const ALARM_STATE = Layer8EnumFactory.create([
        ['Unspecified', null, ''],
        ['Active', 'active', ''],
        ['Acknowledged', 'acknowledged', ''],
        ['Cleared', 'cleared', ''],
        ['Suppressed', 'suppressed', '']
    ]);

    const ALARM_STATE_CLASSES = {
        0: '',
        1: 'status-error',
        2: 'status-info',
        3: 'status-success',
        4: 'status-muted'
    };

    const EVENT_STATE = Layer8EnumFactory.create([
        ['Unspecified', null, ''],
        ['New', 'new', ''],
        ['Processed', 'processed', ''],
        ['Discarded', 'discarded', ''],
        ['Archived', 'archived', '']
    ]);

    const EVENT_STATE_CLASSES = {
        0: '',
        1: 'status-info',
        2: 'status-success',
        3: 'status-muted',
        4: 'status-muted'
    };

    const EVENT_CATEGORY = Layer8EnumFactory.create([
        ['Unspecified', null, ''],
        ['Audit', 'audit', ''],
        ['System', 'system', ''],
        ['Monitoring', 'monitoring', ''],
        ['Security', 'security', ''],
        ['Integration', 'integration', ''],
        ['Custom', 'custom', ''],
        ['Network', 'network', ''],
        ['Kubernetes', 'kubernetes', ''],
        ['Performance', 'performance', ''],
        ['Syslog', 'syslog', ''],
        ['Trap', 'trap', ''],
        ['Compute', 'compute', ''],
        ['Storage', 'storage', ''],
        ['Power', 'power', ''],
        ['GPU', 'gpu', ''],
        ['Topology', 'topology', ''],
        ['Automation', 'automation', '']
    ]);

    const MAINTENANCE_STATUS = Layer8EnumFactory.create([
        ['Unspecified', null, ''],
        ['Scheduled', 'scheduled', ''],
        ['Active', 'active', ''],
        ['Completed', 'completed', ''],
        ['Cancelled', 'cancelled', '']
    ]);

    const MAINTENANCE_STATUS_CLASSES = {
        0: '',
        1: 'status-info',
        2: 'status-warning',
        3: 'status-success',
        4: 'status-muted'
    };

    const RECURRENCE_TYPE = Layer8EnumFactory.create([
        ['Unspecified', null, ''],
        ['None', 'none', ''],
        ['Daily', 'daily', ''],
        ['Weekly', 'weekly', ''],
        ['Monthly', 'monthly', '']
    ]);

    window.L8EventsEnums = {
        SEVERITY: SEVERITY,
        ALARM_STATE: ALARM_STATE,
        EVENT_STATE: EVENT_STATE,
        EVENT_CATEGORY: EVENT_CATEGORY,
        MAINTENANCE_STATUS: MAINTENANCE_STATUS,
        RECURRENCE_TYPE: RECURRENCE_TYPE,
        render: {
            severity: createStatusRenderer(SEVERITY.enum, SEVERITY_CLASSES),
            alarmState: createStatusRenderer(ALARM_STATE.enum, ALARM_STATE_CLASSES),
            eventState: createStatusRenderer(EVENT_STATE.enum, EVENT_STATE_CLASSES),
            eventCategory: (value) => renderEnum(value, EVENT_CATEGORY.enum),
            maintenanceStatus: createStatusRenderer(MAINTENANCE_STATUS.enum, MAINTENANCE_STATUS_CLASSES),
            recurrenceType: (value) => renderEnum(value, RECURRENCE_TYPE.enum)
        }
    };
})();
