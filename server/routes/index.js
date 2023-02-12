var express = require('express');
var router = express.Router();
const randomstring = require('randomstring');
const executeQuery = require('../modules/sqlscript.js');
const hcheck = require('../modules/hourchek.js');
const hashit = require('../modules/hashscript.js');
const session = require('express-session');

router.use(session({ secret:'ruguhd' }));

router.get('/logout',function(req, res, next){
  if (req.session.user){
    req.session.user = null;
    req.session.destroy();
  }
  return res.redirect("/");
});


router.post('/iscriviti/:idp',function(req,res,next){
  executeQuery(`select * from utenti where idu in (select idu from partecipazioni where idp = '${req.params.idp}') `, function(error,results) {
    if(error) throw error; 
    executeQuery(`select * from partite where idp = '${req.params.idp}' `, function(er,resul) {
      if(er) throw er;
      if (hcheck(resul[0].ora,resul[0].data)){return res.send("Non è possibile iscriversi ad eventi passati");}
      if (parseInt(resul[0].npm) == results.length){return res.send("La partita ha già raggiunto il numero massimo di partecipanti");}
      else {
        if (req.session.type == "p"){
          executeQuery(`insert into partecipazioni(idp,idu) values('${req.params.idp}','${req.session.idu}')`,function(rer,ris){
            res.send("Iscrizione effettuata");})}
          else {return res.send("Devi loggarti come partecipante per iscriverti ad un evento");}
          }
      });
  });
});

router.get('/iscriviti/:idp',function(req,res,next){
  executeQuery(`select * from utenti where idu in (select idu from partecipazioni where idp = '${req.params.idp}') `, function(error,results) {
    if(error) throw error; 
    res.render('iscriviti.pug', {partecipanti : results});
  });
});

router.get('/events',function(req,res,next){
  executeQuery("select * from partite ", function(error,results) {
    if(error) throw error; 
    res.render('events.pug', {events: results});
  });
});

router.get('/event/:idp',function(req,res,next){
  executeQuery(`select * from partite where idp = '${req.params.idp}' `, function(error,results) {
    if(error) throw error; 
    res.render('event.pug', {event: results[0]});
  });
});


router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Login' });
});



router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/contatti',function(req, res, next){
  res.render('contatti', {title: 'Contatti'});
});


router.get('/registrazione',function(req, res, next){
  res.render('registrazione', {title: 'Registrazione'});
});

router.post('/registrazione',function(req, res, next){
    executeQuery(`select mail from utenti where mail = '${req.body.mail}'`,function(error,results){
      if(results.length>0){res.send("mail già esistente");}
      else {}
      if(req.body.rpassword!=req.body.password){res.send("password diverse");}
      else {}
    });
    executeQuery(`select mail from utenti where idu = '${req.body.idu}'`,function(error,results){
      if(results.length>0){res.send("id  già esistente");}
      else {}
    });
    word = hashit(req.body.mail);
    executeQuery(`insert into utenti(nome,cognome,mail,idu,tipo,password) values('${req.body.nome}','${req.body.cognome}','${req.body.mail}','${word}','${req.body.ctac}','${req.body.password}')`,function(rer,ris){
      res.send("utente registrato");
    });
  });

  router.get('/users/:id',function(req,res,next){
    executeQuery(`select * from utenti where id='${req.params.id}'`, function(error,results) {
      if(error) throw error; 
      res.render('user', {user: results[0]});
    });
  });
  
  
  router.get('/users',function(req,res,next){
    executeQuery("select * from utenti", function(error,results) {
      if(error) throw error; 
      res.render('users', {users: results});
    });
  });

  router.get('/create-evento',function(req, res, next){
    res.render('create-evento', {title: 'Creazione evento'});
  });
  
  router.post('/create-evento',function(req, res, next){
      executeQuery(`select mail from utenti where mail = '${req.body.mail}'`,function(error,results){
        var time=(req.body.datetime).split("T");
        console.log(time[0]);
        console.log(time[1]);
        if (hcheck(time[1],time[0])){return res.send("Data evento non ammissibile ")}
        if (req.session.user != null && req.session.type=="o"){
          idp = randomstring.generate(10);
          executeQuery(`insert into partite (idp,sport,npm,luogo,ora,data) values('${idp}','${req.body.sport}','${req.body.nup}','${req.body.luogo}','${time[1]}','${time[0]}')`,function(rer,ris){
            res.send("Evento creato ");
          });
        }
        else {return res.send("Devi essere un organizzatore per creare un evento");}
      });
    });
  

module.exports = router;
