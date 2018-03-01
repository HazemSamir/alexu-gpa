var app = angular.module('gpa-calculator', []);

const GRADES = {
  'Distinction': 4,
  'Very Good': 3.5,
  'Good': 2.75,
  'Pass': 2,
  'Weak': 1,
  'Very Weak': 0
};

const PREP_YEAR = [
  {
      enabled: false,
      subjects: [
      { code: "MP011", subject: "Mathematics-1", hours: 6 },
      { code: "MP021", subject: "Mechanics-1 (Continuous subject)", hours: 4, continuous: true },
      { code: "MP031", subject: "Physics-1", hours: 6 },
      { code: "MP041", subject: "Engineering Drawing-1 (Continuous subject)", hours: 6, continuous: true },
      { code: "CS021", subject: "Computers and Programming", "hours": 4 },
      { code: "PE011", subject: "Production", hours: 4 }
      ]
  },
  
  {
      enabled: false,
      subjects: [
      { code: "MP012", subject: "Mathematics-2", hours: 6 },
      { code: "MP022", subject: "Mechanics-2", hours: 4, "tothours": 8 },
      { code: "MP032", subject: "Physics-2", hours: 6 },
      { code: "MP042", subject: "Engineering Drawing-2", hours: 6, tothours: 12 },
      { code: "CH011", subject: "Engineering Chemistry", hours: 4 },
      { code: "HS011", subject: "English", hours: 2 },
      { code: "HS021", subject: "Engineering Science History", hours: 2 }
      ]
  }
];

function saveLocally(years, grades, dep, depName) {
  localStorage.depName = depName;
  localStorage.dep = dep;
  localStorage.years = JSON.stringify(years);
  localStorage.grades = JSON.stringify(grades);
}

app.controller('calculator', function(YearsData){
  var that = this;

  this.depName = localStorage.depName || "Please select your department";
  this.dep = YearsData.getURLDep() || localStorage.dep;
  this.years = [ ];
  this.grades = { };
  this.gpa = 0;

  this.initializeGrades = function (localGrades) {
    // Checks if grades exist in local storage.
    if(localGrades != null) {
      // Use value initialized in local storage.
      that.grades = JSON.parse(localGrades);
    } else {
      // copy GRADES object
      for (grade in GRADES) {
        that.grades[grade] = GRADES[grade];
      }
    }
  };

  this.initializeYears = function (localYears, localDep, urlDep) {
    // Checks if year configuration exists in local storage.
    if(localYears != null && localDep === urlDep) {
      // Use value initialized in local storage.
      that.years = JSON.parse(localYears);
    } else {
      if (urlDep === undefined)
        urlDep = YearsData.getURLDep() || localStorage.dep;
      // init subjects grades
      YearsData.getDepYears(urlDep, (data)=>{
        that.dep = urlDep;
        that.depName = data.name;
        that.years = data.years;
        that.years.unshift(PREP_YEAR);

        for(let i = 0; i < that.years.length; i++) {
          var year = that.years[i];
          for(let j = 0; j < year.length; j++) {
            let semester = year[j];
            semester.enabled = false;
            for(let k = 0; k < semester.subjects.length; k++) {
              let subject = semester.subjects[k];
              subject.grade = 'Distinction';
            }
          }
        }

        saveLocally(that.years, that.grades, that.dep, that.depName);
      });
      
    }
  };

  this.initializeGrades(localStorage.grades);
  this.initializeYears(localStorage.years, localStorage.dep, this.dep);

  var yearsName = [['Preparatory', 'Prep'], ['First', '1st'], ['Second', '2nd'],
                   ['Third', '3rd'], ['Fourth', '4th']];
  this.getYearName = function (year) {
    if (year < yearsName.length)
      return yearsName[year][0];
  }

  this.calculateGPA = function () {
  	let num = 0, denom = 0;

  	//Calculations
  	for(let i = 0; i < that.years.length; i++) {
      let year = that.years[i];
  		for(let j = 0; j < year.length; j++) {
        let semester = year[j];
  			if( !!semester.enabled ) {
  				for(let k = 0; k < semester.subjects.length; k++) {
            let subject = semester.subjects[k];
            if (!!subject.continuous) continue;
            subject.grade = subject.grade || 'Distinction';
            let points = that.grades[subject.grade] || GRADES[subject.grade]
  					num += points * (subject.totHours || subject.hours);
  					denom += (subject.totHours || subject.hours);
  				}
  			}
  		}
  	}

  	if(denom != 0) {
  		that.gpa = num / denom;
  	} else {
      that.gpa = 0;
    }

    saveLocally(that.years, that.grades, that.dep, that.depName);
  };

  // Use to calculate the GPA when the page loads initially with certain local storage data.
  this.calculateGPA();
});

app.service('YearsData', function($location, $http){
  this.getURLDep = function() {
    let searchRes = $location.search();
    return searchRes['dep'];
  };
  
  this.getDepYears = function(dep, callback) {
    let dataPath = "alexu-gpa/data/" + dep + ".json";
    $http.get(dataPath)
    .success(callback)
    .error(function(err){
      console.log(err);
      callback({name: "Please select your department", years: []})
    });
  };

});