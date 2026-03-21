# L8Logs (System Log Viewer)

File system tree browser in the System section. Displays log files with paginated content.

```js
L8Logs.initialize()                      // Renders tree and loads file list
L8Logs.refresh()                         // Reloads tree data
```

Uses L8Query `select * from l8file where path="*" mapreduce true` for the tree, paginated 5KB chunks for file content.
