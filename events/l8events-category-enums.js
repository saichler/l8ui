(function() {
    'use strict';

    const { createStatusRenderer, renderEnum } = Layer8DRenderers;

    // ─── Category 1: Audit ───

    const AUDIT_EVENT_TYPE = Layer8EnumFactory.create([
        ['Unspecified', null, ''],
        ['Create', 'create', ''],
        ['Update', 'update', ''],
        ['Delete', 'delete', ''],
        ['Login', 'login', ''],
        ['Logout', 'logout', ''],
        ['Config Change', 'config-change', ''],
        ['Permission Change', 'permission-change', ''],
        ['Export', 'export', ''],
        ['Import', 'import', '']
    ]);

    // ─── Category 2: System ───

    const SYSTEM_EVENT_TYPE = Layer8EnumFactory.create([
        ['Unspecified', null, ''],
        ['Service Start', 'service-start', ''],
        ['Service Stop', 'service-stop', ''],
        ['Health Check', 'health-check', ''],
        ['Config Reload', 'config-reload', ''],
        ['License', 'license', ''],
        ['Error', 'error', ''],
        ['Upgrade', 'upgrade', ''],
        ['Backup', 'backup', ''],
        ['Restore', 'restore', '']
    ]);

    const SYSTEM_EVENT_TYPE_CLASSES = {
        0: '', 1: 'layer8d-status-active', 2: 'layer8d-status-terminated', 3: 'layer8d-status-info',
        4: 'layer8d-status-info', 5: 'layer8d-status-pending', 6: 'layer8d-status-terminated',
        7: 'layer8d-status-info', 8: 'layer8d-status-info', 9: 'layer8d-status-info'
    };

    // ─── Category 3: Monitoring ───

    const MONITORING_EVENT_TYPE = Layer8EnumFactory.create([
        ['Unspecified', null, ''],
        ['Poll Success', 'poll-success', ''],
        ['Poll Failure', 'poll-failure', ''],
        ['Target Unreachable', 'target-unreachable', ''],
        ['Target Recovered', 'target-recovered', ''],
        ['Data Stale', 'data-stale', ''],
        ['Collection Start', 'collection-start', ''],
        ['Collection Complete', 'collection-complete', ''],
        ['Parse Error', 'parse-error', '']
    ]);

    const MONITORING_EVENT_TYPE_CLASSES = {
        0: '', 1: 'layer8d-status-active', 2: 'layer8d-status-terminated', 3: 'layer8d-status-terminated',
        4: 'layer8d-status-active', 5: 'layer8d-status-pending', 6: 'layer8d-status-info',
        7: 'layer8d-status-active', 8: 'layer8d-status-terminated'
    };

    // ─── Category 4: Security ───

    const SECURITY_EVENT_TYPE = Layer8EnumFactory.create([
        ['Unspecified', null, ''],
        ['Auth Success', 'auth-success', ''],
        ['Auth Failure', 'auth-failure', ''],
        ['Access Denied', 'access-denied', ''],
        ['Privilege Escalation', 'privilege-escalation', ''],
        ['Cert Expiry', 'cert-expiry', ''],
        ['Cert Renewed', 'cert-renewed', ''],
        ['Policy Violation', 'policy-violation', ''],
        ['Brute Force', 'brute-force', ''],
        ['Token Revoked', 'token-revoked', '']
    ]);

    const SECURITY_EVENT_TYPE_CLASSES = {
        0: '', 1: 'layer8d-status-active', 2: 'layer8d-status-terminated', 3: 'layer8d-status-terminated',
        4: 'layer8d-status-pending', 5: 'layer8d-status-pending', 6: 'layer8d-status-active',
        7: 'layer8d-status-terminated', 8: 'layer8d-status-terminated', 9: 'layer8d-status-pending'
    };

    // ─── Category 5: Integration ───

    const INTEGRATION_EVENT_TYPE = Layer8EnumFactory.create([
        ['Unspecified', null, ''],
        ['API Call Success', 'api-call-success', ''],
        ['API Call Failure', 'api-call-failure', ''],
        ['Webhook Received', 'webhook-received', ''],
        ['Webhook Failed', 'webhook-failed', ''],
        ['Sync Start', 'sync-start', ''],
        ['Sync Complete', 'sync-complete', ''],
        ['Sync Failed', 'sync-failed', ''],
        ['Connector Up', 'connector-up', ''],
        ['Connector Down', 'connector-down', '']
    ]);

    const INTEGRATION_EVENT_TYPE_CLASSES = {
        0: '', 1: 'layer8d-status-active', 2: 'layer8d-status-terminated', 3: 'layer8d-status-info',
        4: 'layer8d-status-terminated', 5: 'layer8d-status-info', 6: 'layer8d-status-active',
        7: 'layer8d-status-terminated', 8: 'layer8d-status-active', 9: 'layer8d-status-terminated'
    };

    // ─── Category 7: Network ───

    const NETWORK_EVENT_TYPE = Layer8EnumFactory.create([
        ['Unspecified', null, ''],
        ['Device Status', 'device-status', ''],
        ['Interface', 'interface', ''],
        ['BGP', 'bgp', ''],
        ['OSPF', 'ospf', ''],
        ['MPLS', 'mpls', ''],
        ['LDP', 'ldp', ''],
        ['Segment Routing', 'segment-routing', ''],
        ['Traffic Engineering', 'traffic-engineering', ''],
        ['VRF', 'vrf', ''],
        ['QoS', 'qos', ''],
        ['Hardware', 'hardware', '']
    ]);

    // ─── Category 8: Kubernetes ───

    const KUBERNETES_EVENT_TYPE = Layer8EnumFactory.create([
        ['Unspecified', null, ''],
        ['Pod', 'pod', ''],
        ['Node', 'node', ''],
        ['Deployment', 'deployment', ''],
        ['StatefulSet', 'statefulset', ''],
        ['DaemonSet', 'daemonset', ''],
        ['Service', 'service', ''],
        ['Namespace', 'namespace', ''],
        ['Network Policy', 'network-policy', '']
    ]);

    // ─── Category 9: Performance ───

    const PERFORMANCE_METRIC = Layer8EnumFactory.create([
        ['Unspecified', null, ''],
        ['CPU', 'cpu', ''],
        ['Memory', 'memory', ''],
        ['Temperature', 'temperature', ''],
        ['Traffic', 'traffic', ''],
        ['Disk', 'disk', ''],
        ['Fan Speed', 'fan-speed', ''],
        ['Power Load', 'power-load', ''],
        ['Voltage', 'voltage', ''],
        ['Latency', 'latency', ''],
        ['Packet Loss', 'packet-loss', '']
    ]);

    const THRESHOLD_TYPE = Layer8EnumFactory.create([
        ['Unspecified', null, ''],
        ['Upper', 'upper', ''],
        ['Lower', 'lower', '']
    ]);

    // ─── Category 12: Compute ───

    const COMPUTE_EVENT_TYPE = Layer8EnumFactory.create([
        ['Unspecified', null, ''],
        ['Hypervisor Status', 'hypervisor-status', ''],
        ['VM Status', 'vm-status', ''],
        ['VM Migration', 'vm-migration', ''],
        ['VM Resource', 'vm-resource', ''],
        ['Host Resource', 'host-resource', '']
    ]);

    // ─── Category 13: Storage ───

    const STORAGE_EVENT_TYPE = Layer8EnumFactory.create([
        ['Unspecified', null, ''],
        ['Array Status', 'array-status', ''],
        ['Volume Status', 'volume-status', ''],
        ['Capacity', 'capacity', ''],
        ['Replication', 'replication', ''],
        ['Disk', 'disk', ''],
        ['Controller', 'controller', '']
    ]);

    // ─── Category 14: Power ───

    const POWER_EVENT_TYPE = Layer8EnumFactory.create([
        ['Unspecified', null, ''],
        ['PSU Status', 'psu-status', ''],
        ['PDU Status', 'pdu-status', ''],
        ['UPS Status', 'ups-status', ''],
        ['Battery', 'battery', ''],
        ['Load', 'load', ''],
        ['Voltage', 'voltage', ''],
        ['Temperature', 'temperature', '']
    ]);

    // ─── Category 15: GPU ───

    const GPU_EVENT_TYPE = Layer8EnumFactory.create([
        ['Unspecified', null, ''],
        ['Status', 'status', ''],
        ['Temperature', 'temperature', ''],
        ['Memory', 'memory', ''],
        ['Utilization', 'utilization', ''],
        ['Error', 'error', ''],
        ['Power', 'power', '']
    ]);

    // ─── Category 16: Topology ───

    const TOPOLOGY_EVENT_TYPE = Layer8EnumFactory.create([
        ['Unspecified', null, ''],
        ['Link Discovered', 'link-discovered', ''],
        ['Link Lost', 'link-lost', ''],
        ['Neighbor Change', 'neighbor-change', ''],
        ['Topology Change', 'topology-change', '']
    ]);

    // ─── Category 17: Automation ───

    const AUTOMATION_EVENT_TYPE = Layer8EnumFactory.create([
        ['Unspecified', null, ''],
        ['Rule Triggered', 'rule-triggered', ''],
        ['Rule Completed', 'rule-completed', ''],
        ['Rule Failed', 'rule-failed', ''],
        ['Policy Violation', 'policy-violation', ''],
        ['Remediation', 'remediation', '']
    ]);

    const AUTOMATION_EVENT_TYPE_CLASSES = {
        0: '', 1: 'layer8d-status-info', 2: 'layer8d-status-active', 3: 'layer8d-status-terminated',
        4: 'layer8d-status-pending', 5: 'layer8d-status-info'
    };

    // ─── Export ───

    window.L8EventsCategoryEnums = {
        AUDIT_EVENT_TYPE: AUDIT_EVENT_TYPE,
        SYSTEM_EVENT_TYPE: SYSTEM_EVENT_TYPE,
        MONITORING_EVENT_TYPE: MONITORING_EVENT_TYPE,
        SECURITY_EVENT_TYPE: SECURITY_EVENT_TYPE,
        INTEGRATION_EVENT_TYPE: INTEGRATION_EVENT_TYPE,
        NETWORK_EVENT_TYPE: NETWORK_EVENT_TYPE,
        KUBERNETES_EVENT_TYPE: KUBERNETES_EVENT_TYPE,
        PERFORMANCE_METRIC: PERFORMANCE_METRIC,
        THRESHOLD_TYPE: THRESHOLD_TYPE,
        COMPUTE_EVENT_TYPE: COMPUTE_EVENT_TYPE,
        STORAGE_EVENT_TYPE: STORAGE_EVENT_TYPE,
        POWER_EVENT_TYPE: POWER_EVENT_TYPE,
        GPU_EVENT_TYPE: GPU_EVENT_TYPE,
        TOPOLOGY_EVENT_TYPE: TOPOLOGY_EVENT_TYPE,
        AUTOMATION_EVENT_TYPE: AUTOMATION_EVENT_TYPE,
        render: {
            auditEventType: (value) => renderEnum(value, AUDIT_EVENT_TYPE.enum),
            systemEventType: createStatusRenderer(SYSTEM_EVENT_TYPE.enum, SYSTEM_EVENT_TYPE_CLASSES),
            monitoringEventType: createStatusRenderer(MONITORING_EVENT_TYPE.enum, MONITORING_EVENT_TYPE_CLASSES),
            securityEventType: createStatusRenderer(SECURITY_EVENT_TYPE.enum, SECURITY_EVENT_TYPE_CLASSES),
            integrationEventType: createStatusRenderer(INTEGRATION_EVENT_TYPE.enum, INTEGRATION_EVENT_TYPE_CLASSES),
            networkEventType: (value) => renderEnum(value, NETWORK_EVENT_TYPE.enum),
            kubernetesEventType: (value) => renderEnum(value, KUBERNETES_EVENT_TYPE.enum),
            performanceMetric: (value) => renderEnum(value, PERFORMANCE_METRIC.enum),
            thresholdType: (value) => renderEnum(value, THRESHOLD_TYPE.enum),
            computeEventType: (value) => renderEnum(value, COMPUTE_EVENT_TYPE.enum),
            storageEventType: (value) => renderEnum(value, STORAGE_EVENT_TYPE.enum),
            powerEventType: (value) => renderEnum(value, POWER_EVENT_TYPE.enum),
            gpuEventType: (value) => renderEnum(value, GPU_EVENT_TYPE.enum),
            topologyEventType: (value) => renderEnum(value, TOPOLOGY_EVENT_TYPE.enum),
            automationEventType: createStatusRenderer(AUTOMATION_EVENT_TYPE.enum, AUTOMATION_EVENT_TYPE_CLASSES)
        }
    };
})();
