/**
 * NewtifryPro - nodeJS message push script.
 * for version up to 1.2.0
 */
var Constants = require('./constants');
var req = require('request');
var crypto = require('crypto');  

function NewtifryProMessage() {
    if((this instanceof NewtifryProMessage) === false) {
        return new NewtifryProMessage();
    }
	this.images = [];    
	this.url = null;
	this.registrationIds = [];
	this.date = null;
	this.message = null;
	this.priority = 0;
	this.title = null;
	this.source = null;
	this.speak = -1;
	this.noCache = -1;
	this.notify = -1;
	this.senderId = null;
	this.state = 0;
	this.vibrate = -1;
	this.tag = null;
}

NewtifryProMessage.prototype.send = function(callback) {
  var data = {};

	if (this.senderId === null) {
		return;
	}
	if (this.title === null) {
		return;
	}
	if ( this.date instanceof Date === false) {
		this.date = new Date();
	}

	data.type = 'ntp_message';
	data.timestamp = this.date.toISOString().split('.')[0];
	data.title = new Buffer.from(this.title).toString('base64');
	data.message = new Buffer.from(this.message).toString('base64');

	if (this.source) {
		data.source = new Buffer.from(this.source).toString('base64');
	}
	if (this.url) {
		data.url = new Buffer.from(this.url).toString('base64');
	}
	if (this.tag) {
		data.tag = new Buffer.from(this.tag).toString('base64');
	}
	if (this.images.length !== 0) {
		if (this.images.length == 1 ) {
			data.image = new Buffer.from(this.images[0]).toString('base64');		
		} else {
			if (typeof this.images[0] !== 'undefined') {
				data.image1 = new Buffer.from(this.images[0]).toString('base64');		
			}
			if (typeof this.images[1] !== 'undefined') {
				data.image2 = new Buffer.from(this.images[1]).toString('base64');		
			}
			if (typeof this.images[2] !== 'undefined') {
				data.image3 = new Buffer.from(this.images[2]).toString('base64');		
			}
			if (typeof this.images[3] !== 'undefined') {
				data.image4 = new Buffer.from(this.images[3]).toString('base64');		
			}
			if (typeof this.images[4] !== 'undefined') {
				data.image5 = new Buffer.from(this.images[4]).toString('base64');		
			}
		}
	}
	if (this.notify != -1) {
		data.notify = this.notify;
	}
	if (this.noCache != -1) {
		data.noCache = this.noCache;
	}
	if (this.speak != -1) {
		data.speak = this.speak;
	}
	if (this.state !== 0) {
		data.state = this.state;
	}
	data.priority = this.priority;

  var message = {
    data : data
  };
  sendMessage(message, this.senderId, this.registrationIds, callback);
};

NewtifryProMessage.prototype.setSenderId = function(senderId) {
	this.senderId = senderId;
};


NewtifryProMessage.prototype.addImage = function(imageUrl) {
	this.images.push(imageUrl);
};

NewtifryProMessage.prototype.setUrl = function(url) {
	this.url = url;
};

NewtifryProMessage.prototype.setTag = function(tag) {
	this.tag = tag;
};

NewtifryProMessage.prototype.setMessage = function(message) {
	this.message = message;
};

NewtifryProMessage.prototype.setTitle = function(title) {
	this.title = title;
};

NewtifryProMessage.prototype.setSource = function(source) {
	this.source = source;
};

NewtifryProMessage.prototype.setDate = function(date) {
	this.date = date;
};

NewtifryProMessage.prototype.setSticky = function() {
	this.state = 1;
};

NewtifryProMessage.prototype.setLocked = function() {
	this.state = 2;
};

NewtifryProMessage.prototype.setNormalPriority = function() {
	this.priority = 0;
};

NewtifryProMessage.prototype.setInfoPriority = function() {
	this.priority = 1;
};

NewtifryProMessage.prototype.setWarningPriority = function() {
	this.priority = 2;
};

NewtifryProMessage.prototype.setAlertPriority = function() {
	this.priority = 3;
};

NewtifryProMessage.prototype.setPriority = function(priority) {
  if (priority > 3) {
    priority = 3;
  }
  if (priority < -512) {
    priority = -512;
  }
  
	this.priority = priority;
};

NewtifryProMessage.prototype.speak = function() {
	this.speak = 1;
};

NewtifryProMessage.prototype.noSpeak = function() {
	this.speak = 0;
};

NewtifryProMessage.prototype.cacheImages = function() {
	this.cache = 1;
};

NewtifryProMessage.prototype.noCacheImage = function() {
	this.cache = 0;
};

NewtifryProMessage.prototype.notify = function() {
	this.notify = 1;
};

NewtifryProMessage.prototype.noNotify = function() {
	this.notify = 0;
};

NewtifryProMessage.prototype.vibrate = function() {
	this.vibrate = 1;
};

NewtifryProMessage.prototype.noVibrate = function() {
	this.vibrate = 0;
};

NewtifryProMessage.prototype.addRegistrationId = function(regId) {
	this.registrationIds.push(regId);
};


function SendController(timeout) {
  this.timeout = timeout || 500;
  this.queue = [];
  this.ready = true;
}

SendController.prototype.send = function(body, senderKey, callback) {
  send(body, senderKey, callback);
};

SendController.prototype.exec = function() {
  this.queue.push(arguments);
  this.process();
};

SendController.prototype.process = function() {
  if (this.queue.length === 0) return;
  if (!this.ready) return;
  var self = this;
  this.ready = false;
  this.send.apply(this, this.queue.shift());
  setTimeout(function () {
    self.ready = true;
    self.process();
  }, this.timeout);
};

var sendControler = new SendController();


function sendMessage(message, senderKey, registrationIds, callback) {
  var body = {};
  var requestBody;

  if (message.data === undefined) {
		return callback(-1, 'message.data must be defined');
	}
	
	if (message.data.timestamp === undefined) {
		var now = new Date();
		var timestampSplit = now.toISOString().split('.'); 
		message.data.timestamp = timestampSplit[0];
  }
	body[Constants.PARAM_PAYLOAD_KEY] = message.data;
  body[Constants.JSON_REGISTRATION_IDS] = registrationIds;
  if (message.priority == 3) {
    //body[Constants.PARAM_PRIORITY_KEY] = 'high';
  }
  requestBody = JSON.stringify(body);
  var toSend = JSON.stringify(message.data);
  var totalLength = Buffer.byteLength(toSend, 'utf8');
 /////////////////////////////////////////////  
  if (totalLength > 2127) {
    // body is to big so we have to split it x parts
    var maxSize = 1500;
    var part = 0;                                                                                                                                                                                                
    var partCount = Math.ceil(totalLength / maxSize);     
    var hash = crypto.createHash('md5').update(toSend).digest('hex');  
    while(totalLength > maxSize) {                                                                                                                                                                               
      var partMessage = {                                                                                                                                                                                        
        type: 'ntp_message_multi',
        priority:	message.priority,
        partcount:  partCount.toString(),                                                                                                                                                                                   
        hash:       hash,                                                                                                                                                                                        
        index: (part + 1).toString(),                                                                                                                                                                                          
        body:  toSend.substr(part * maxSize, maxSize)                                                                                                                                                         
      };
      body[Constants.PARAM_PAYLOAD_KEY] = partMessage;
      sendControler.exec(JSON.stringify(body), senderKey);
      //send(JSON.stringify(body), senderKey);
      totalLength -= maxSize;                                                                                                                                                                                    
      part++;                                                                                                                                                                                                    
    }                                                                                                                                                                                                            
    if (totalLength > 0) {                                                                                                                                                                                       
      partMessage = {                                                                                                                                                                                            
        type: 'ntp_message_multi',                                                                                                                                                                                       
        priority:	message.priority,
        hash:       hash,                                                                                                                                                                                        
        partcount: partCount.toString(),                                                                                                                                                                                    
        index:  (part + 1).toString(),                                                                                                                                                                                          
        body:  toSend.substr(part * maxSize, maxSize)                                                                                                                                                         
      };                                                                                                                                                                                                         
      body[Constants.PARAM_PAYLOAD_KEY] = partMessage;
      sendControler.exec(JSON.stringify(body), senderKey, callback);
      //send(JSON.stringify(body), senderKey, callback);
    }                                        
  } else {
    send(requestBody, senderKey, callback);
  }
}

function send(body, senderKey, callback) {
  //console.log(JSON.stringify(body));
  var post_options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-length': Buffer.byteLength(body, 'utf8'),
      'Authorization': 'key=' + senderKey
    },
    uri: Constants.GCM_SEND_URI,
    body: body
  };
  post_options.timeout = Constants.SOCKET_TIMEOUT;
  req(post_options, function (err, res, resBody) {
    if (err) {
      if (callback) {
        return callback(err, null);
      }
      return;
    }
    if (!res) {
      if (callback) {
        return callback('response is null', null);
      }
      return;
    }
  
    if (res.statusCode === 503) {
      console.log('GCM service is unavailable');
      if (callback) {
        return callback(res.statusCode, null);
      }
      return;
    } else {
      if(res.statusCode == 401){
        console.log('Unauthorized');
        if (callback) {
          return callback(res.statusCode, null);
        }
        return;
      } else {
        if (res.statusCode !== 200) {
          console.log('Invalid request: ' + res.statusCode);
          if (callback) {
            return callback(res.statusCode, null);
          }
          return;
        }
      }
    }
    // Make sure that we don't crash in case something goes wrong while
    // handling the response.
    try {
      var data = JSON.parse(resBody);
      if (callback) {
    		callback(null, data);
      } else {
        console.log(data);
      }
    } catch (e) {
      console.log("Error handling GCM response " + e);
      if (callback) {
        return callback("error", null);
      }
    }
  });
}

module.exports.sendMessage =  sendMessage;
module.exports.NewtifryProMessage = NewtifryProMessage;
