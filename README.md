# VPlanServer

## About
VPlanServer is the server for a customly built substitution plan system.
It runs an [express](http://expressjs.com/) webserver, which is used to serve the JSON data of today's and tomorrow's substitution plan, 
aswell as to listen to incoming substitution plans from authorized sources (see [VPlanClient](https://github.com/mpggu/VPlanClient))
For emergency cases it backs up the most recent substitution plans into `/plans`. It's saving all the http request logs to `/logs/access.log` and all other
logs to `logs/console/YEAR_MONTH_DAY.log`.


## Installation
**Node.js 6.0.0 or newer is required to be installed on your machine.**

`git clone https://github.com/mpggu/VPlanServer` to clone the source to your server,

`npm i` to install all the required dependencies.

Then create a `config.json` in your root directory to configure the behaviour of the program.


## Config
```js
{
  "auth": "secret_xxx",       // Authentication for allowing to POST substitution plans
  "wpURL": "wp.myschool.edu", // The URL of the WordPress Installation
  "wpUsername": "robot",      // The username of the WordPress user
  "wpPassword": "hunter2",    // The password of the WordPress user
  "wpPageID": "123",          // The WordPress Page-ID of the substitution plan.
  "scheduledUploads": 15      // When to upload tomorrow's substitution plan. Accepts 0-23. 15 will upload at 15pm
}
```


## Running
I recommend a process manager for production ([pm2](https://github.com/Unitech/pm2), [forever](https://github.com/foreverjs/forever), [nodemon](https://nodemon.io/)) or simply run
`node index`


## Help
If you experience any problems or bugs, or just have a question in general, feel free to contact us (German or English).
**[Manuel Kraus](https://github.com/Cynigo)**, [webmaster@mpg-umstadt.de](mailto:webmaster@mpg-umstadt.de)


## In-depth
After receiving a POST request to `server.ip:1337/api/v1/vplan`, it parses the raw html data to JSON using [VPlanParser](https://github.com/mpggu/VPlanParser),
which is then used to satisfy GET request. It's afterwards being passed down to the `Updater` which either instantly uploads today's substitution plan up
to a certain threshold (see [config](#config)), or puts it in the queue of being uploaded to WordPress at a later point in time.