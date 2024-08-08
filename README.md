# TekstoLibre
A free &amp; open source Tekstowo front-end.

It currently uses latest build of [Tekstowo-Unofficial-API](https://github.com/Davilarek/Tekstowo-Unofficial-API) with SirJoshProxy option.
## Self-hosting
### Manual
To self host, you need to have Node.js installed (latest LTS recommended).
  1. Clone this repo
  2. `cd` to your cloned directory
  3. If you want to host with JavaScript disabled, run `node server.js false`, If JS is ok for you, `node server.js`

### Docker
Pull the image as usual, and then run<br/>
`docker run -p7778:7778 <your image name>`<br/>
If you want to host with JavaScript disabled, run<br/>
`docker run -p7778:7778 -eNO_JS=true <your image name>`<br/>
Obviously, replace `<your image name>` with your actual image name.<br/>
## Features
- ~~[x] Search bar~~ Removed, see https://github.com/Davilarek/Tekstowo-Unofficial-API/commit/dd103fa9c8df32c80c830a29b708b7f95d1d99bf
- [x] Lyrics + translation view
- [x] "Go to official" button
- [x] Artist's song list
- [X] Artist details
- [ ] Popular songs list
- [ ] Popular artists list
- [ ] Wanted translations list
- [ ] Wanted lyrics list
- [ ] Translation edit history
- [ ] Lyrics edit history
- [x] Comments view
- [x] Song's video

## Not planned
- Same as in [Tekstowo-Unofficial-API#not-planned](https://github.com/Davilarek/Tekstowo-Unofficial-API#not-planned)
- Autocomplete for search
- White theme (?)
