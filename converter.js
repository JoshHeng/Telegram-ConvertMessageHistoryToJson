/*

 Converts Telegram message history from HTML format to a JSON file
 By Josh Heng

*/
var fs = require('fs')
var cheerio = require('cheerio');

const folderPath = 'ChatExport/';

chatName = null;
jsonMessages = [];
queuedFiles = [];

function LoadFolder(callback) {
    fs.readdir(folderPath, function(err, files) {
        var messagesSize = 'messages'.length;

        for (i in files) {
            if (files[i].length >= messagesSize + 5) {
                if (files[i].substring(0, messagesSize) == 'messages') {
                    queuedFiles.push(files[i]);
                }
            }
        }
        queuedFiles.sort(function(a, b) {
            a_number = a.substring('messages'.length, a.length-('.html'.length));
            if (a_number == "") a_number = 1;
            b_number = b.substring('messages'.length, b.length-('.html'.length));
            if (b_number == "") b_number = 1;

            a_number = parseInt(a_number);
            b_number = parseInt(b_number);
            
            if (a_number > b_number) {
                return 1;
            }
            else if (a_number < b_number) {
                return -1;
            }
            return 0;
        });

        callback();
    });
}

function LoadNextFile() {
    if (queuedFiles.length > 0) {
        currentFile = folderPath + queuedFiles[0];
        queuedFiles.shift();

        console.log("Parsing " + currentFile + " - " + queuedFiles.length + " remaining");
        

        LoadFile(currentFile, LoadNextFile);
        
    }
    else {
        CompletedParsing();
    }
}

function LoadFile(fileName, callback) {
    fs.readFile(fileName, 'utf8', function(err, data) {
        if (err) throw err;

        //Parse file as html
        ParseMessageHtml(cheerio.load(data), callback);
    });
}

function ParseMessageHtml($, callback) {
    if (chatName == null) {
        chatName = $('.page_header .content .text.bold').text().trim();
    }
    var messages = $('.history').children('.message');
    
    var lastAuthor = null;

    for (var i = 0; i < messages.length; i++) {
        var message = $(messages[i]);
        
        // Only parse message if not the date (at the beginning of a page)
        if (message.attr('id').indexOf('message-') == -1) {
            var id = message.attr('id').substring('message'.length);
            var type = null;
            var date = null;
            var author = null;
            var content = null;
            var replyTo = null;

            // Handle normal messages
            if (message.hasClass('default')) {
                type = 'normal';

                // Get author
                if (message.hasClass('joined')) {
                    author = lastAuthor;
                }
                else {
                    author = message.find('.from_name').first().text().trim();
                    lastAuthor = author;
                }

                // Get date
                date = message.find('.date').first().prop('title').trim();

                // Get reply to (if exists)
                if (message.find('.reply_to.details').first().children('a').first().prop('href') != undefined) {
                    replyTo = message.find('.reply_to.details').first().children('a').first().prop('href').substring('#go_to_message'.length).trim();
                }

                // Get content
                content = message.find('.text').first().text().trim();
            }

            // Handle service messages
            else if (message.hasClass('service')) {
                type = 'service';
                content = message.find('.body.details').first().text().trim();
            }

            jsonMessages.push({
                'telegram_id': id,
                'type': type,
                'date': date,
                'author': author,
                'replyTo': replyTo,
                'content': content
            });
        }
    }

    callback();
}

function CompletedParsing() {
    json = {
        'chat': chatName,
        'messages': jsonMessages
    }

    fs.writeFile('history.json', JSON.stringify(json), function() {
        console.log("Done! Results saved in history.json");
    })
}

LoadFolder(LoadNextFile);

