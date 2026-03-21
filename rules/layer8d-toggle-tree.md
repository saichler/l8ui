# Layer8DToggleTree

Generic collapsible toggle tree with dependency enforcement. Used by SYS module selection UI.

```js
const tree = Layer8DToggleTree.create({
    container: document.getElementById('tree-container'),
    data: treeData,                    // Hierarchical data array
    onToggle: (path, enabled) => {},   // Called when a node is toggled
    dependencies: dependencyMap        // Optional dependency enforcement
});
tree.getDisabledPaths()                // Returns Set of disabled paths
```
