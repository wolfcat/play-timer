Template.view.helpers({
  times: function() {
    var times;
    var totals = [];
    if (!Session.get('limits'))
      times = Times.find({on: false}, {sort: {stop: -1}});
    else if (!Session.get('limits').date) {
      times = Times.find(
        { 
          user: {
            $regex: Session.get('limits').user || '.', 
            $options: 'i'
          }, 
          type: {
            $regex: Session.get('limits').type || '.', 
            $options: 'i'
          }, 
          on: false
        }, 
        { sort: {stop: -1} }
      );
    } else {
      times = Times.find(
        { 
          user: {
            $regex: Session.get('limits').user || '.', 
            $options: 'i'
          }, 
          type: {
            $regex: Session.get('limits').type || '.', 
            $options: 'i'
          }, 
          start: {
            $gte: Session.get('limits').date.up, 
            $lt: Session.get('limits').date.down
          },
          on: false
        }, 
        { sort: {stop: -1} }
      );
    }
    times.forEach(function (timeDoc, i, timesSet) {
      var start = timeDoc.start;
      var stop = timeDoc.stop;
      var currTime = calcTimeDiff(start, stop);
      var hrs = currTime[0];
      var mins = currTime[1];
      var secs = currTime[2];
      
      var currTimedoc = _.findWhere(totals, {user: timeDoc.user});
      if (!currTimedoc)
        totals.push({user: timeDoc.user, total: {hrs: hrs, mins: mins, secs: secs}});
      else {
        var index = totals.indexOf(currTimedoc);
        var carry = 0;
        var totSecs = (secs + currTimedoc.total.secs) % 60;
        carry = Math.floor((secs + currTimedoc.total.secs) / 60);
        var totMins = (mins + currTimedoc.total.mins + carry) % 60;
        carry = Math.floor((mins + currTimedoc.total.mins + carry) / 60);
        var totHrs = hrs + currTimedoc.total.hrs + carry;
        totals[index] = {user: totals[index].user, total: {hrs: totHrs, mins: totMins, secs: totSecs}};
      }
    });
    Session.set('totals', totals);
    return times;
  },
  totalTimes: function() {
    var totals = Session.get('totals');
    /*totals.forEach(function(totalDoc, i, totalsSet) {
      var hrs = totalDoc.total.hrs;
      var mins = totalDoc.total.mins;
      var secs = totalDoc.total.secs;
      var timeStr = hrs + " hours, " + mins + " minutes, " + secs + " seconds";
      totalsSet[i] = _.extend(totalDoc, {totalStr: timeStr});
    });*/
    return totals;
  },
  timerOn: function() {
    return Times.find({on: true}, {sort: {start: -1}});
  }
});
Template.view.events({
  "submit #disUser": function(e) {
    e.preventDefault();
    
    var user = e.target.user.value;
    if (Session.get('limits'))
      Session.set('limits', {user: user, date: Session.get('limits').date, type: Session.get('limits').type});
    else
      Session.set('limits', {user: user});
  },
  "submit #disDate": function(e) {
    e.preventDefault();
    
    var date = e.target.date.value.split('-');
    //alert(date);
    var up = new Date(date[0], date[1]-1, date[2]);
    var down = new Date(date[0], date[1]-1, parseInt(date[2])+1);
    if (Session.get('limits'))
      Session.set('limits', {date: {up: up, down: down}, user: Session.get('limits').user, type: Session.get('limits').type});
    else
      Session.set('limits', {date: {up: up, down: down}});
  },
  "submit #disType": function(e) {
    e.preventDefault();
    
    var type = e.target.type.value;
    if (Session.get('limits'))
      Session.set('limits', {user: Session.get('limits').user, date: Session.get('limits').date, type: type});
    else
      Session.set('limits', {type: type});
  },
  "click #all": function(e) {
    e.preventDefault();
    document.getElementById('user').value = '';
    document.getElementById('date').value = '';
    document.getElementById('type').value = '';
    
    Session.set('limits', null);
  },
  "click .time": function(e) {
    e.preventDefault();
    
    var timeDoc = Times.findOne(e.target.getAttribute('data-id'));
    Meteor.call('timeUpdate', timeDoc.start, function (err, res) {
      var timeStr = res[0] + ' hours, ' + res[1] + ' minutes, ' + res[2] + ' seconds';
      alert(timeDoc.user + ' has now done ' + timeDoc.type + ' for ' + timeStr);
    });
  }
});