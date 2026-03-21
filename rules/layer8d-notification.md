# Layer8DNotification

```js
Layer8DNotification.success('Record saved')
Layer8DNotification.error('Failed to save', ['Detail 1', 'Detail 2'])
Layer8DNotification.warning('Check input')
Layer8DNotification.info('Processing...')
Layer8DNotification.close()
```

Durations: error=0 (manual close), warning=5000ms, success=3000ms, info=4000ms.
