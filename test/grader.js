#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://powerful-hollows-1359.herokuapp.com/";

var assertURLnotEmpty = function(url) {
    if (url == "") {
	console.log("URL is empty.");
	process.exit(1);
    }
    return url;
};

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); 
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
	var buf = fs.readFileSync(htmlfile);
	//console.log(buf);
    return cheerio.load(buf);
};

var cheerioURL = function(url, checks) {
    //console.log("enter cheerioURL: " + url);
    var rest = require('restler');
    rest.get(url).on('complete', function(result) {
	if (result instanceof Error) {
	   console.log("error gettign URL " + url);
	   process.exit(1);
	} else {
	   //console.log(result);
	   var buf = new Buffer(result);
	   //console.log(buf);
	   var cson = cheerio.load(buf);
	   basicCheck(checks, cson);
	}
    });

};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile, url) {
    var checks = loadChecks(checksfile).sort();
    if (htmlfile != "") {
    	var body = cheerioHtmlFile(htmlfile);
		basicCheck(checks, body);
	}
    else {
	if (url != "") {
           cheerioURL(url, checks);
        }
        else {
	process.exit(1); }
    }


};

var basicCheck = function(checks, body) {
  	//console.log("basic check");
    var out = {};
    for(var ii in checks) {
        var present = body(checks[ii]).length > 0;
		//console.log((checks[ii]) + ' *** ' + body(checks[ii]));
        out[checks[ii]] = present;
    }
    var outJson = JSON.stringify(out, null, 4);
    console.log(outJson);
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), "")
        .option('-u, --url <URL>', 'URL', clone(assertURLnotEmpty), "")
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .parse(process.argv);
    var checkJson = checkHtmlFile(program.file, program.checks, program.url);

} else {
    exports.checkHtmlFile = checkHtmlFile;
}
