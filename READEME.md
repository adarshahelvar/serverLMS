The starting file is not index.js, It has changed to server.js, You can see that is package.json file (in "main": "server.js",)

Starting the server: => "npm run dev"


Tech Stack:
    1) Mongodb Atlas DB
    2) Cloudinary Server for Images storing
    3) Upstash for ioredis

New Dependencies:
1) express-rate-limit:- Use to set the rate limit for api hitting, like user can hit api 100 times per second