# K8s YAML Required Entries (CRITICAL)

## Rule
When creating Kubernetes YAML manifests for any new project, ALL of the following entries from the l8erp reference YAMLs MUST be included. Never omit structural entries that exist in the l8erp k8s YAMLs.

## Required Entries Checklist

### Namespace metadata
```yaml
metadata:
  name: <namespace>
  labels:
    name: <namespace>    # REQUIRED — do not omit labels
```

### StatefulSet/DaemonSet metadata
```yaml
metadata:
  namespace: <namespace>
  name: <name>
  labels:
    app: <name>          # REQUIRED — do not omit labels
```

### Container env section (ALL containers)
```yaml
containers:
  - name: <name>
    image: <image>
    imagePullPolicy: Always
    env:                           # REQUIRED — do not omit
      - name: NODE_IP
        valueFrom:
          fieldRef:
            fieldPath: status.hostIP
```

### Volume naming convention
```yaml
volumeMounts:
  - name: hdata              # Use "hdata", not "data"
    mountPath: /data
volumes:
  - name: hdata              # Must match volumeMounts name
    hostPath:
      path: /data
      type: DirectoryOrCreate
```

## Why This Matters
- **Namespace labels**: Required for label-based selectors and network policies
- **Resource labels**: Required for `kubectl` filtering and service discovery
- **NODE_IP env var**: Used by the application to know which node it's running on — without it, inter-service communication and vnet discovery fail
- **Volume name `hdata`**: Convention consistency across all projects

## Verification
After creating any k8s YAML:
```bash
# Check namespace has labels
grep -A2 "kind: Namespace" <file> | grep "labels:"

# Check resource has labels
grep -A4 "kind: StatefulSet\|kind: DaemonSet" <file> | grep "labels:"

# Check NODE_IP env is present
grep "NODE_IP" <file>

# Check volume name convention
grep "name: hdata" <file>
```

## Reference
The canonical k8s YAMLs are in `l8erp/k8s/`. Always diff new project YAMLs against these before finalizing.
