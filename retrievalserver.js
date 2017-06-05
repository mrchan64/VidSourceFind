var express = require("express");
var bodyParser = require("body-parser");
var http = require("http");
var request = require("request");
var fs = require("fs");
var zlib = require('zlib');
var jsdom = require("jsdom");
const {JSDOM} = jsdom;
request = request.defaults({
    jar: true
});

var constants = {
	'vidurl':'',
	'vidurldirty':0,
	'episoderes':[],
	'episoderesdirty':0,
	'searchres':[],
	'searchresdirty':0,
}

var cookie = 'cf_clearance=0a54cd49f4895698ffc89c14f65d326e874491d3-1496637295-28800; ' 
var ip = "http://localhost:2000";
var anime = "http://kissanime.ru/";

// Header Options
var watchOptions = {
	//url: anime,
	url: "http://kissanime.ru/Special/AreYouHuman2?reUrl=%2fAnime%2fSaenai-Heroine-no-Sodatekata-2nd-Season%2fEpisode-008%3fid%3d136588%26s%3ddefault",
	method: 'GET',
	encoding: null,
	headers: { 
		connection: 'keep-alive',
		'cache-control': 'no-cache',
		'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
		accept: '*/*',
		'accept-encoding': 'gzip, deflate, sdch, br',
		'accept-language': 'en-US,en;q=0.8',
		Cookie: cookie
	}
};
var searchOptions = {
	url: anime+"/Search/SearchSuggestx",
	method: 'POST',
	data: "",
	encoding: null,
	headers: { 
		connection: 'keep-alive',
		'cache-control': 'no-cache',
		'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
		accept: '*/*',
		'accept-encoding': 'gzip, deflate, sdch, br',
		'accept-language': 'en-US,en;q=0.8',
		Cookie: cookie
	}
};
var episodeOptions = {
	url: anime+"/Anime",
	method: 'GET',
	encoding: null,
	headers: { 
		connection: 'keep-alive',
		'cache-control': 'no-cache',
		'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
		accept: '*/*',
		'accept-encoding': 'gzip, deflate, sdch, br',
		'accept-language': 'en-US,en;q=0.8',
		Cookie: cookie
	}
};
// Callback Options
var ws=fs.createWriteStream("check.htm");
var watchCallback = function(error, response, body){
	if (!error && response.statusCode == 200) {
	    console.log("success");
	}else{
		console.log("rip",response.statusCode);
	}
	console.log(response.headers,"\n");
	if(response.headers['content-encoding'] == 'gzip'){
        zlib.gunzip(body, function(err, dezipped) {
            ws.write(dezipped.toString());
        });
    } 
}
var searchCallback = function(error, response, body){
	if (!error && response.statusCode == 200) {
	    if(response.headers['content-encoding'] == 'gzip'){
        zlib.gunzip(body, function(err, dezipped) {
        	constants.searchres=[];
            var titles = dezipped.toString();
            if(titles.length==0){
	            constants.searchresdirty--;
	            return;
            }
            var temp = titles.split("/Anime/");
            for(var i = 1;i<temp.length;i++){
            	var temp2 = temp[i].split("\">")[0];
            	constants.searchres.push(temp2);
            }
            constants.searchresdirty--;
        });
    } 
	}else{
		console.log("rip on search",response.statusCode);
		constants.searchresdirty--;
	}
}
var episodeCallback = function(error, response, body){
	if (!error && response.statusCode == 200) {
		if(response.headers['content-encoding'] == 'gzip'){
	        zlib.gunzip(body, function(err, dezipped) {
				constants.episoderes=[];
	            dom = new JSDOM(dezipped.toString());
	            $=require("jquery")(dom.window);
	            var found = $('.listing>tbody>tr>td>a');
	            for(var i = 0; i<found.length;i++){
	            	var topush = {
	            		'title': $(found[i]).html(),
	            		'url': $(found[i]).attr("href")
	            	};
	            	constants.episoderes.push(topush);
	            }
	            constants.episoderesdirty--;
	        });
	    } 
	}else{
		console.log("rip on ep list",response.statusCode);
	    constants.episoderesdirty--;
	}
}

app = express();

app.use(bodyParser.urlencoded({
	extended: true
}))
app.use(bodyParser.json());

var server = http.createServer(app);

app.get("/", function(req, res){
	res.sendFile("C:/Users/wildc/Documents/Git Repos/VidSourceFind/AdBypass.html");
});

app.post("/search", function(req, res){
	searchOptions.url=anime+"/Search/SearchSuggestx"+"?type=Anime" + '&keyword=' + req.body.term;
	constants.searchresdirty++;
	process.nextTick(searchSync);
	res.send({});
});

app.get("/search", function(req, res){
	if(constants.searchresdirty==0){
		res.send({'names':constants.searchres});
	}else{
		res.send({'names':'notyet'});
	}
});

app.post("/episodes", function(req, res){
	episodeOptions.url=anime+"/Anime/"+req.body.title;
	constants.episoderesdirty++;
	process.nextTick(episodeSync);
	res.send({});
});

app.get("/episodes", function(req, res){
	if(constants.episoderesdirty==0){
		res.send({'eps':constants.episoderes});
	}else{
		res.send({'eps':'notyet'});
	}
});

app.post("/watch", function(req, res){
	watchOptions.url=anime+req.body.url;
	constants.vidurldirty++;
	process.nextTick(watchSync)
	res.send({});
});

server.listen(2000, function(){
	console.log("Ad Bypass Server Started");
});

function searchSync(){
	request(searchOptions,searchCallback);
}

function episodeSync(){
	request(episodeOptions,episodeCallback);
}

function watchSync(){
	request(watchOptions,watchCallback);
}

request(watchOptions,watchCallback);