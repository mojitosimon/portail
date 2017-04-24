var express = require('express');
var fs = require('fs');
var app = express();
const util = require('util');

var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));


var session = require('express-session');
var id= Date.now();
var sess = {
  secret: 'keyboard cat',
  cookie: {}
}
app.use(session(sess))
/*
var questions = [
    {value:"Qui fait le plus le ménage ?", subvalue:"", result:[0,0,0]},
    {value:"Qui sort les poubelles ?", subvalue:"soir ou matin...", result:[0,0,0]},
    {value:"Qui conduit le mieux ?", subvalue:"", result:[0,0,0]},
    {value:"Qui est le plus calin ?", subvalue:"", result:[0,0,0]},
  ];

var parameters = {eventname:"Mariage"}
*/
var questions = [];//JSON.parse(fs.readFileSync(__dirname+'/data/questions_mariage.json','utf8'));
var parameters = null;//JSON.parse(fs.readFileSync(__dirname+'/data/configuration_mariage.json','utf8'));


var currentQuestion =0;
var connectedSession=new Object();

app.use(express.static('public'));

app.set('view engine', 'ejs');

app.get('/', function (req, res) {

  if(parameters == null){
    res.redirect('/configuration');
  }else{
    res.redirect('/questions');
  }
  /*
  res.render(
      '',
      {
        event:parameters.eventname,
        title: 'Les questions aux mariés',
        message: 'Cliquer pour commencer ...',
        titles:[{href:"/questions",name:"question"}]
      });
      */
})


// CONF SECTION
app.get('/configuration', function (req, res) {
  res.render(
      'configuration',
      {
          parameters : parameters,
          configurationlist:['mariage',"work"]
      }
    );
})

app.get('/configuration/save/:name', function (req, res) {
  saveFile(parameters,buildConfPath(req.params.name));
  res.send("ok");
})

app.get('/configuration/load/:name', function (req, res) {
  console.log("loading "+req.params.name);
  id = Date.now();
  connectedSession=new Object();
  questions = JSON.parse(fs.readFileSync(__dirname+'/data/questions_'+req.params.name+'.json','utf8'));
  parameters = JSON.parse(fs.readFileSync(buildConfPath(req.params.name),'utf8'));
  currentQuestion =0;
  res.send("ok");
})


function buildConfPath(name){
  return __dirname+'/data/configuration_'+name+'.json'
}

function saveFile(object,filename){
  var contents = fs.writeFileSync(filename, JSON.stringify(object, null, '\t'));
}


// ADMIN SECTION
app.get('/admin', function (req, res) {
  res.render(
      'admin',
      {
        event:parameters.eventname,
        title: 'Les questions aux mariés',
        message: "",
        titles:[{href:"/questions",name:"question"}]
      });
})

app.get('/admin/questions.json', function (req, res) {
    res.send(questions);
})

app.post('/admin/add/question/', function (req, res) {
    console.log("add ");
    newQuestion = [];
    i=0;
    var obj =
        {
          "value": req.body.value,
          "subvalue": req.body.subvalue,
          "result": [0,0,0]
        };
    questions.forEach(function(element) {
      i++;
      if(i== req.body.id){
          newQuestion.push(obj);
        }
        newQuestion.push(element);
      });

    if(req.body.id >= i){
      newQuestion.push(obj);
    }
    //console.log(questions);
    questions = newQuestion;
    saveQuestions();
    res.send(questions);
})

app.all('/admin/delete/question/:id', function (req, res) {
    console.log("deleting ");
    newQuestion = [];
    var id = req.params.id;
    var i=0;
    questions.forEach(function(element) {
      i++;
      if(i!= id){
          newQuestion.push(element);
        }
      });

    //console.log(questions);
    questions = newQuestion;
    saveQuestions();
    res.send(questions);
})


function saveQuestions(){
  var contents = fs.writeFileSync(__dirname+'/data/questions_'+parameters.key+'.json', JSON.stringify(questions, null, '\t'));
}

app.get('/questions', function (req, res) {
  if(!connectedSession[req.session.id])
	{
		connectedSession[req.session.id] = currentQuestion -1 ;
	}
  if(parameters == null){
    res.redirect('/configuration');
  }
  var admin = false;
  console.log(req.query);
  var titles = [{href:"/",name:"acceuil"}] ;
  if(req.query.admin && req.query.admin=="simon"){
    admin = true;
    titles.push({href:"/admin",name:"admin"})
    titles.push({href:"/display",name:"display"})
    titles.push({href:"/configuration",name:"configuration"})
}
  console.log('admin '+admin);
  res.render(
      'question_pie',
      {
        event:parameters.eventname,
        key:parameters.key,
        parameters:parameters,
        title: 'Question',
        admin:admin,
        message: 'les questions vont s\'afficher sur cette page !',
        titles:titles})
})




// USER SECTION
app.post('/setQuestionResult/:id/:elle/:lui/:lesdeux', function (req, res) {
  var id = req.params.id
  if(id <= connectedSession[req.session.id]){
    //already answer
  }else{
    connectedSession[req.session.id]++;
    questions[id-1].result[0] += parseInt(req.params.elle);
    questions[id-1].result[1] += parseInt(req.params.lui);
    questions[id-1].result[2] += parseInt(req.params.lesdeux);
  }
  res.send(JSON.stringify(questions));
});

app.all('/setCurrent/:a', function (req, res) {
  currentQuestion = req.params.a;
  //saveCurrent();
  res.send("ok");
});


app.get('/getCurrentQuestions.json', function (req, res) {
  var nbuser = 0, key;
  for (key in connectedSession) {
      if (connectedSession.hasOwnProperty(key)) nbuser++;
  }

  var ret = {
      id:id,
      nbuser:nbuser,
      questions : questions.slice(0,currentQuestion),
  }
  res.send(ret);
});

app.get('/session', function (req, res) {
  res.send(util.inspect(req.session)+req.session.id+connectedSession.length);
});



app.all('/display', function (req, res) {
  var admin = false;
  var titles = [{href:"/",name:"acceuil"}] ;
  if(req.query.admin && req.query.admin=="simon"){
    admin = true;
    titles.push({href:"/admin",name:"admin"})
    titles.push({href:"/configuration",name:"configuration"})
}
  console.log('admin '+admin);
if(parameters == null){
  f_parameters = {};
  f_parameters.event = "not define"
  f_parameters.eventname = "not define"
  f_parameters.key = "not define"
  f_parameters.data = ["1","2","3"]
  f_parameters.name = ["1","2","3"]
}else{
  f_parameters = parameters;
}


  res.render(
      'display',
      {
        event:f_parameters.eventname,
        key:f_parameters.key,
        parameters:f_parameters,
        title: 'Question',
        admin:admin,
        message: 'Connectez vous au wifi "quizzwifi" et allez à l url : http://192.168.1.101 !',
        titles:titles})
})


app.listen(3000, function () {
  console.log('Application listening on port 3000!');
});


function saveCurrent(){
  var contents = fs.writeFileSync(__dirname+'/data/questions_current.json', JSON.stringify(questions, null, '\t'));
}


app.all("/saveQuestion", function (req, res) {
  var contents = fs.writeFileSync(__dirname+'/data/questions.json', JSON.stringify(questions, null, '\t'));
  res.send('ok');
});
