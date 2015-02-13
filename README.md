# JSON data server

A simple data server.

## Routes

### GET /version

Get the current version of the data. This is a simple md5 hash of the data.

**Response:** `"a213efa9530a382e9c097e2c4872c3cd"`

### GET /version?is=123456...

A simple test to see if the version is the same.

**Response:** `true|false`

### GET /data

Get the data structure. The datastructure is stored as json files. There is only one special file `index.json`. This file is a an index of all other files.

Assuming a structure like this

- index.json
- events.json
- page.json

Then index.json would look like

```
[ "events", "page" ]
```

And the resulting data

```
{
    "events": ...,
    "page": ...
}
```


## Run Server

To run the server you will need to 

```
    $ npm install
    $ node index.js
```

By default the remote host is set to `localhost` and the remote path is `''`. If you need to set these:

```
    $ node REMOTE_PATH=/json REMOTE_HOST=my.server.com index.js
```