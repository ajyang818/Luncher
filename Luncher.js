////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
// GLOBALS

TotalList = new Meteor.Collection("TotalList");
YesList = new Meteor.Collection("YesList");
GroupsList = new Meteor.Collection("GroupsList");

// Note that stepNumber = 1 is the preferences selection screen, stepNumber = 0 is the results screen (a bit counterintuitive)
Session.set("stepNumber", 1);
Session.set("numGroups", 3);

// The Yipit roster, per www.yipit.com/about/team
var defaultNames = ["Vin Vacanti",
                    "Jim Moran",
                    "Zach Smith",
                    "Nitya Oberoi",
                    "Steve Pulec",
                    "Dave Tomback",
                    "Henry Xie",
                    "Kelly Byrne",
                    "Unaiz Kabani",
                    "Joe Johnson",
                    "Mingwei Gu",
                    "Gabriel Falcao",
                    "Andrew Gross",
                    "Suneel Chakravorty",
                    "Alice Li",
                    "Sean Spielberg",
                    "Laura Groetzinger",
                    "Lincoln de Sousa",
                    "Emily Tiernan",
                    "Allen Yang",
                    "Rumela Das",
                    "Jordan Milan",
                    "Matt Raoul",
                    "Michelle Scharfstein",
                    "Hugo Tavares"];

// A list of Greek alphabet characters to serve as fun names for the final groups.
// There are 12 letters to use here (starting with index 1). Groups 13 and beyond will just be numbered.
var funNames = ['0', '\u03B1', '\u03B2', '\u03B3', '\u03B4', '\u03B5', '\u03B6', '\u03B7', '\u03B8', '\u03B9', '\u03BA', '\u03BB', '\u03BC']

////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
// CLIENT

if (Meteor.isClient) {

//..........................................................
// TEMPLATE DEFINITIONS

  Template.hello.greeting = function () {
    return "Allez Lunch!!";
  };

  Template.hello.stepName = function () {
    return Session.equals("stepNumber", 1) ? "Setting Randomization Parameters" : "Results";
    // if Session.equals("stepNumber", 1)
    //   return "Setting Randomization Paramaters";
    // else
    //   return "Results";
  };

  Template.luncherBody.numGroups = function () {
    return Session.get("numGroups");
  };

  Template.luncherBody.totalList = function () {
    return TotalList.find({}, {sort: {name:1}});
  };

  Template.luncherBody.yesList = function () {
    return YesList.find({}, {sort: {name:1}});
  };

  Template.luncherBody.whereAmI = function () {
    return Session.get("stepNumber");
  };

  Template.luncherBody.groupsList = function() {
    return GroupsList.find({}, {sort: {groupID:1}});
  };

//.........Testing arena....................................

//..........................................................
// EVENTS

//---------HELLO events
// (Placeholder)
  Template.hello.events({
    'click input' : function () {
      // template data, if any, is available in 'this'
      if (typeof console !== 'undefined')
        console.log("You pressed the button");
    }
  });

//---------LUNCHERBODY events
  Template.luncherBody.events = {

    //Sets # groups, after checking if input is int and > 0
    'click input.setNumGroups' : function () {
      if(!isNaN(parseInt(wantedNumGroups.value)) && wantedNumGroups.value > 0)
        Session.set("numGroups", wantedNumGroups.value);
      else
        alert("Please enter an integer greater than 0");
    },

    'click input.addName': function () {
      check = TotalList.find({name: nameToAdd.value});
      if (check.count() > 0)
        alert("That person is already on the list");
      else
        TotalList.insert({name: nameToAdd.value, lunching: true, highlight: false});
    },

    'click input.resetLists' : function () {
      totalListCleaner();
    },

    'click input.switchToNo' : function () {
      TotalList.update({lunching: true, highlight: true}, {$set: {lunching:false, highlight:false}}, {multi:true});
    },

    'click input.switchAllToNo' : function () {
      TotalList.update({}, {$set: {lunching:false, highlight: false}}, {multi:true});
    },

    'click input.switchToYes' : function () {
      TotalList.update({lunching: false, highlight: true}, {$set: {lunching:true, highlight:false}}, {multi:true});
    },

    'click input.switchAllToYes' : function () {
      TotalList.update({}, {$set: {lunching:true, highlight:false}}, {multi:true});
    },

    'click input.stepToGroups': function () {
      Session.set("stepNumber", 0);
      randomizeYesList();
      assignGroups();
      groupsCleaner();
    },

    'click input.stepToSelection': function () {
      Session.set("stepNumber", 1);
    },

  };

//---------INDIVIDUAL events
  Template.individual.events({
    'click': function () {
      selected = TotalList.findOne({_id: this._id});
      TotalList.update(selected, {$set: {highlight: (!this.highlight)}});
    }
  });

}

/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
// GENERAL FUNCTIONS

// "borrowed" from http://michalbe.blogspot.com/2011/02/javascript-random-numbers-with-custom.html

var CustomRandom = function(seed) {

    var constant = Math.pow(2, 13)+1,
        prime = 37,
        maximum = Math.pow(2, 50);

    return {
        next : function() {
            seed *= constant;
            seed += prime;
            seed %= maximum;

            return seed;
        }
    };
};


// Isolates the list of people going to lunch and assigns random #s
var randomizeYesList = function () {
  YesList.remove({});
  var d = new Date();
  var seed = (d.getDate() + d.getFullYear() + d.getMonth()) * TotalList.find({lunching: true}).count();
  var random = CustomRandom(seed);
  var yesses = TotalList.find({lunching: true}).forEach(function(individual) {
    YesList.insert({name: individual.name, score: random.next(), group: null});
  });
}

// Assigns people in YesList to the desired number of lunch groups
var assignGroups = function () {
  var i = 0;
  var numGroups = Session.get("numGroups");
  YesList.find({}, {sort: {score: -1}}).forEach(function(individual) {
    YesList.update({name: individual.name}, {$set: {group: (i%numGroups+1)}});
    i ++;
  });
}

// Takes group assignment and compiles results in a cleaner way in GroupsList
var groupsCleaner = function () {
  GroupsList.remove({});
  for (i = 1; i <= Session.get("numGroups"); i++) {
    var names = new Array();
    wanted = YesList.find({group: i}, {sort: {name: 1}});

    // Making this an array instead of a simple list so I can iterate over it
    // in the HTML...how do I iterate over a simple list?
    wanted.forEach(function(individual) {
      names.push({name: individual.name});
    });

    // Gets the "fun names" for groups #1-12
    if (i > funNames.length - 1)
      funNameToUse = i;
    else
      funNameToUse = funNames[i];

    GroupsList.insert({groupID: i, name: funNameToUse, people: names});
  };
}

// Resets TotalLists to have just the Yipit roster all in the 'yes' list
var totalListCleaner = function () {
  if (TotalList.find().count() > 0) {
      TotalList.remove({});
    }

    if (TotalList.find().count() === 0) {
      // var defaultNames = ["Allen Yang",
      //                     "Henry Xie",
      //                     "Nitya Oberoi",
      //                     "Ganesh G.",
      //                     "Vin",
      //                     "Jim"];
      for (i = 0; i < defaultNames.length; i++)
        TotalList.insert({name: defaultNames[i], lunching: true, highlight: false});

      //TotalList.update(TotalList.findOne({name: "Allen Yang"}), {$set: {highlight: false}});
      // TotalList.update(TotalList.findOne({name: "Ganesh G."}), {$set: {lunching: false}});
      // TotalList.update(TotalList.findOne({name: "Vin"}), {$set: {lunching: false}});
      // TotalList.update(TotalList.findOne({name: "Jim"}), {$set: {lunching: false}});
    }
    return;
}

/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
// STARTUP FUNCTIONS

if (Meteor.isServer) {
  Meteor.startup(function () {

    // Sets the Yipit roster to be all on the 'yes' list
    totalListCleaner();

    // Next 2 lines might be redundant...where to initialize global vars?
    Session.set("stepNumber", 1);
    Session.set("numGroups", 3);
  });
}
