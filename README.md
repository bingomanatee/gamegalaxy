This repository allows you to browse GiantBomb's game database with a Famous ui-enhanced grid.

Note that a configuration file is required at root named api_key.json:

``` json

{
    "giantbomb": {
        "api_key": "---"
    },
    "firebase": {
        "database_url": "https://****.firebaseio-demo.com/"
    }

}

```
(the firebaseio is not currently being employed)

to run this app run `npm install` fro the root, then `node web.js`; then visit `localhost:8080` in your web browser.

Put a search term that matches a title of one or more games ("quake", "doom", "Dinosaur") in part or in whole.

try "the" as a search term to see it handle large data sets

Note that the app pulls from the giantbomb api so you will need a live internet connection

## Features

* Sortable datagrid - column titles
* the ability to toggle between picture and text description - click the "Description" button on the callout
after you have loaded some games
* The ability to filter games by platform (click the circle near "Platform" to pick a platform after you have loaded
some games
* Incremental update -- keep your eye on the footer for progress when loading over 100 records
* The ability to "Lock" a row to the callout; click a row to freeze the callout to a particular game. Click again to unlock.

## Related notes

* The Node.js framework I use to manage the app is of my own creation -- see [http://wonderlandlabs.com/blog_folder/hive_mvc](My blog) for details
* The application proxies the giantbomb database to avoid cross platform issues and ultimately to cache results for faster throughput