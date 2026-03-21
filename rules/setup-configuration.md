# Setup & Configuration

## login.json (shared by desktop and mobile)

Place at web root. Both `Layer8DConfig` and `Layer8MConfig` load this file at startup.

```json
{
    "login": {
        "appTitle": "My App",
        "authEndpoint": "/auth",
        "redirectUrl": "/app.html",
        "sessionTimeout": 30,
        "tfaEnabled": true
    },
    "app": {
        "dateFormat": "mm/dd/yyyy",
        "apiPrefix": "/erp",
        "healthPath": "/0/Health"
    }
}
```

The critical function is `resolveEndpoint(path)` which prepends `apiPrefix`. Example: `/30/Employee` becomes `/erp/30/Employee`.

## L8Query - Server-Side Query Language

All table components use L8Query for server communication:

```
select * from Employee where lastName=Smith limit 10 page 0 sort-by lastName
select * from Employee where lastName=Smith limit 10 page 0 sort-by lastName descending
select employeeId,lastName from Employee where departmentId=D001 limit 15 page 2
```

## Authentication

Both desktop and mobile store a bearer token in `sessionStorage.bearerToken`. Desktop uses a global `getAuthHeaders()` function. Mobile uses `Layer8MAuth.get/post/put/delete()` which auto-attach the token.
