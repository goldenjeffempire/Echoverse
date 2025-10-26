#!/bin/bash
# Development startup script with required secrets
export JWT_SECRET="Z8z4Owo+Pk0GeGiob0Mk9q8ho/uIfUgbmIJNVOdPZ0k="
export TWO_FACTOR_BACKUP_ENCRYPTION_KEY="uQK0wOAzwyKu2uWW6lpI2LqKAX0AdZO4FXGo5MCptAI="
export WEBHOOK_SIGNATURE_SECRET="P9Jx1COWe4+qmk9QTwQRkWOWAYGIR+6WxRWqmqwURtA="

# Run the development server
npm run dev
