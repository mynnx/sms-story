SMS Story
=========

Of all the datasets I want to carve up using D3, my Google Voice history is the most personal and interesting one I can think of.  This project tells the story of who was important in my life at various points in time, as measured by how many SMS messages we exchanged in a given month.

When I run this visualization with my own GV account (all my texts have gone through GV since 2009), fascinating insights emerge.  I see relationships blossom and fade.  I see how important life events affect communication with others.  I see how moving to a new city affected my friendships.  I could stare at this thing for hours.

![Image](http://cl.ly/image/23403P1c2b0Y/sms-story.png)

Usage
=====

After cloning, put your Google Voice credentials in a JSON file called `keys.json` in the `app/` directory:

```
{"email": "address@gmail.com",
 "password": "123password321"}
```

Install dependencies (`npm install -g bower` if you haven't already installed bower):
```
npm install
bower install
```

Run `node app/server.js` and visit [http://localhost:3000/index.html](http://localhost:3000/index.html).

You may have to wait a minute or two if you have a lot of data.  The data is cached as long as the server is running, so reloading the page should be quick.  Color schemes are intentionally non-deterministic, so feel free to reload at will.


