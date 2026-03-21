# Registration Page

Standalone user registration page with CAPTCHA verification. Located at `register/index.html`.

- POST `/captcha` to load CAPTCHA image (base64 PNG)
- POST `/register` with `{user, pass, captcha}` to create account
- Redirects to login page on success
