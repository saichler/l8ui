# Layer8MAuth

```js
Layer8MAuth.requireAuth()                      // Redirect if not authenticated
Layer8MAuth.getUsername()                       // Username from sessionStorage
Layer8MAuth.logout()                           // Clear session, redirect

// HTTP methods (auto-attach bearer token)
await Layer8MAuth.get(url)                     // GET, returns parsed JSON
await Layer8MAuth.post(url, data)              // POST
await Layer8MAuth.put(url, data)               // PUT
await Layer8MAuth.delete(url, data?)           // DELETE (data sent as JSON body)
```
