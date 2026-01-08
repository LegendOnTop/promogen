
**Disclaimer: This code is provided for educational purposes only. The authors and contributors are not responsible for any misuse, violations of terms of service, bans, or any other consequences arising from its use. Users are required to implement their own OTP fetching mechanism based on their email provider's API or method. Do not use this for any illegal activities. If you use, modify, or sell this code or any derivative, you must give credit to the original creator @ai.legend.**


## Features

- **Multi-threaded Registration**: Run multiple registration threads simultaneously
- **Email Verification**: Automatically verifies OTP codes (users must implement their own OTP fetching mechanism)
- **Rotating Proxies**: Support for proxy authentication
- **Window Organization**: Automatically arranges browser windows on screen (1-8 threads)
- **Email Queue System**: Each thread processes multiple emails sequentially
- **Account Saving**: Automatically saves verified accounts in `email:password` format
- **Discord Nitro Monitoring**: Detects and extracts Discord Nitro promotional links from emails

## Requirements

- Node.js v20+
- Patchright (included in node_modules)
- Email credentials file
- Custom OTP fetching implementation (users must provide their own method to fetch OTP from emails)

## Installation

1. Clone or download the project
2. Install dependencies:
```bash
npm install
```

3. Create `input/mails.txt` with credentials in format:
```
email@domain.com:password
another@domain.com:password
```

## Usage

Run the bot:
```bash
node main1.js
```

When prompted, enter the number of threads (1-8):
```
💬 How many threads do you want to run? (1-8): 4
```

The bot will automatically:
- Distribute emails across threads
- Open browser windows and arrange them on screen
- Register accounts with random credentials
- Verify via OTP (using user's custom implementation)
- Save successful accounts to `saved.txt`
- Move to next email after 6 seconds

## Window Arrangement

- **1 Thread**: Full screen (1920x1080)
- **2 Threads**: Side by side (960x1080 each)
- **3 Threads**: Two on top, one centered at bottom
- **4 Threads**: 2x2 grid (960x540 each)
- **5+ Threads**: Dynamic grid layout

## Output Files

- `saved.txt`: Successfully registered accounts (email:password format)
- `promo.txt`: Discord Nitro promotional links
- `input/mails.txt`: Source email credentials (updated as emails are processed)

## Implementing OTP Fetching

Since this is for educational purposes, the actual OTP fetching code is not provided. Users must implement their own mechanism to fetch OTP codes from their email accounts. This can be done using IMAP, POP3, or your email provider's API.

In the `getVerificationLink` function in `main1.js`, replace the existing implementation with your own code to retrieve the OTP from the email.

Example placeholder:
```javascript
async function getVerificationLink(emailUser, emailPass, quiet = false) {
    // Implement your own OTP fetching logic here
    // For example, connect to IMAP and search for the latest email with OTP
    // Return the OTP code as a string
    return "123456"; // Placeholder
}
```

## Made by

[@ai.legend](https://discord.com/users/766665610049486868)
[Join our Discord](https://discord.gg/recaptcha)

NEXT LEAK ON 10 FOLLOWERS.


