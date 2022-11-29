
//variables que se se encargan de conectarse a los modulos de node
const cors = require('cors')
var mysql = require('mysql2');
var createError = require('http-errors');
var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
const io = require("socket.io").listen(server);
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');
var flash = require('connect-flash');




//variabels que se encargan de conectarse a los modulos de routes
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

/*inicia la variable app con los elementos de express*/


//no se muy bien que hacen
const { json, query } = require('express');
const { Console } = require('console');


/***********configuracion***********/
// configura el motor de visualizacion ejs
app.set('view engine', 'ejs');
//path.join() concatena los directorios
app.set('views', path.join(__dirname, 'views'));


/*************middlewares************/
//esto fuerza al browser a obtener una nueva copia de la pagina al clickear al regresar
app.use(function(req, res, next) {
  if (!req.user)
      res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  next();
});


//__dirname path completa
app.use(express.static(__dirname + '/public'));


//para capturar los datos del formulario
app.use(express.urlencoded({extended:false}));
app.use(express(json));


//configurara las sesiones
app.use(session({
  secret:"culaquierecosa",
  resave: false,
  saveUninitialized:false
}));





/****************************CONEXION CON MYSQL*********************************/
var conexion = mysql.createConnection({
  host: 'containers-us-west-53.railway.app',
  database: 'railway',
  user: 'root',
  password:'M9LpucFZpALdOEq20t80',
  port:'6004'
});
conexion.connect(function(error){
  if(error){
      throw error;
  }else{
      console.log("Conexion Exitosa");

  }
});


/********************************** REGISTRAR UN NUEVO USUARIO ******************************/
app.get('/registrarvistaApp',function(req,res){
  const usuario = req.session.user;
  usuario ? res.render("index") : res.render("registrarvista");
});

app.post('/registrarDB',function(req,res){
  const {nombre,correo,pss} = req.body;
  console.log(nombre);
  console.log(correo);
  console.log(pss);
    conexion.query("SELECT Usu_id FROM railway.usuario WHERE Usu_id='"+correo+"';",(error,results)=>{
      if(error) throw error;
      console.log("results",results);
      if(results==""){
        conexion.query('INSERT INTO usuario(Usu_id,Usu_contraseña,Usu_nombre,Usu_fechaReg) VALUES("'+correo+'","'+pss+'","'+nombre+'",CURRENT_TIMESTAMP);',function(error2,results2){
          if(error2)throw error2;      
            console.log("Usuario Agregado: ",results2);             
        });
        console.log('Se registro con exito');
        conexion.query('INSERT INTO railway.tabla_individual(Ti_nombre,Usu_id) VALUES("tabla de '+nombre+'", "'+correo+'" );',(error3,results3)=>{
          if(error3) throw error3;
          console.log('Tabla individual creada',results3);
          res.redirect('/index');
        });
      }else{
        console.log("if results no vacio")
        res.render('registrarvista');
      }
    });    
  
});

/******************************************INICIAR SESION************************/
app.get('/loginvistaApp',function(req,res){
  const usuario = req.session.user;
  usuario ? res.render("index") : res.render("loginvista");
});

app.post('/loginvistaDB',function(req,res){
  var correoForm = req.body.campo_correo;
  var pssForm = req.body.campo_pass;
  conexion.query('SELECT Usu_id, Usu_contraseña, Usu_nombre FROM usuario WHERE Usu_id = "'+correoForm+'" AND Usu_contraseña = "'+pssForm+'";',function(err,result){
    if(err) throw err; 
    if(result!=""){
      console.log("if results!=''");
      var correoDB = result[0].Usu_id;
      var pssDB = result[0].Usu_contraseña;
      console.log(`correo: ${correoForm} pass: ${pssForm}`);
      console.log(`correoDB: ${correoDB} pssDB: ${pssDB}`); 
      req.session.user = result;
      var usuario = req.session.user;
      console.log("user",req.session.user);
      console.log("Usuario",usuario);
      conexion.query('SELECT Ti_id FROM railway.tabla_individual WHERE Usu_id = "'+correoDB+'";',(error2,results2)=>{
        if(error2) throw error2;
        req.session.fd = results2;
        var ID = req.session.fd;
        console.log("id-session: ",req.session.fd); 
        console.log("id: "+ID); 
        console.log(`req.session.fd[0]: ${req.session.fd[0]}`);
        console.log(`req.session.fd[0].Ti_id: ${req.session.fd[0].Ti_id}`);

        res.redirect('/index');
      });
    }else{
      console.log("else");
      res.render('loginvista');
    }
  });  
});

/******************************FIN LOGIN*****************************/

app.get('/cerrarSesion',(req,res)=>{
  delete req.session.user;
  delete req.session.fd;
  res.render('index');
});


/**************************************************Login con google **************************/
const passport = require('passport');
const { throws } = require('assert');
var userProfile;

app.use(passport.initialize());
app.use(passport.session());

app.get('succes',(req,res)=>{
  console.log(userProfile);
})

app.get('/error', (req, res) => res.send("error logging in"));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});


/*  Google AUTH  */
 
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
//CREDENCIALES DE GOOGLE CLOUD

const GOOGLE_CLIENT_ID = '594800428073-d42f76sdbm4mvu929vl8t3ng5d910om7.apps.googleusercontent.com';

const GOOGLE_CLIENT_SECRET =   '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';

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    //callbackURL: "http://localhost:3000/auth/google/callback"
    callbackURL: "http://192.168.20.28:3000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
      userProfile=profile;
      return done(null, userProfile);
  }
));

app.get('/auth/google',passport.authenticate('google', { scope : ['profile', 'email'] }));


app.get('/auth/google/callback',passport.authenticate('google', { failureRedirect: '/error' }),function(req, res){
    
    // Successful authentication, redirect success.

    console.log("displayName: ",userProfile.displayName);

    console.log("email: ",userProfile.emails[0].value);

    console.log("foto: ",userProfile.photos[0].value);

    let displayName = userProfile.displayName;
    let email = userProfile.emails[0].value;
    let foto = userProfile.photos[0].value;
    var pass = makeid(18); 
    //registrarlo en la DB si no existe
    //SELECT Usu_id,Usu_contraseña,Usu_nombre FROM railway.usuario WHERE Usu_id='nicolas@gmail.com';
    conexion.query("SELECT Usu_id,Usu_contraseña,Usu_nombre FROM railway.usuario WHERE Usu_id='"+email+"';",(err,resp)=>{
      //esto por si hay algun error
      if(err) throw err;
      console.log("resultado de la busqueda: " + resp.length)

      //si hay un resultado debuelto se creara creara la secion y si no se registrara y creara todo
      if(resp.length <= 0){
        console.log("el correo aun no existe en la base de datos")
        conexion.query('INSERT INTO usuario(Usu_id,Usu_contraseña,Usu_nombre,Usu_fechaReg) VALUES("'+email+'","'+pass+'","'+displayName+'",CURRENT_TIMESTAMP);',(err2,res2)=>{
          if(err2) throw err2;
          console.log("Usuario Agregado: ",res2);
        });

        conexion.query('INSERT INTO railway.tabla_individual(Ti_nombre,Usu_id) VALUES("tabla de '+displayName+'", "'+email+'" );',(error3,results3)=>{
          if(error3) throw error3;
          console.log('Tabla individual creada',results3);
          
        });

        conexion.query("SELECT Usu_id,Usu_contraseña,Usu_nombre FROM railway.usuario WHERE Usu_id='"+email+"';",(err5,resp5)=>{
          if(err5) throw err5
          conexion.query('SELECT Ti_id FROM railway.tabla_individual WHERE Usu_id = "'+resp5[0].Usu_id+'";',(err6,results6)=>{
            if(err6) throw err6;
            req.session.user = resp5;
            req.session.fd = results6;
            res.redirect("/")
          });
          
          
        });
        

      }else{
        conexion.query("SELECT Usu_id,Usu_contraseña,Usu_nombre FROM railway.usuario WHERE Usu_id='"+email+"';",(err5,resp5)=>{
          if(err5) throw err5
          conexion.query('SELECT Ti_id FROM railway.tabla_individual WHERE Usu_id = "'+resp5[0].Usu_id+'";',(err6,results6)=>{
            if(err6) throw err6;
            req.session.user = resp5;
            req.session.fd = results6;
            res.redirect("/")
          });
          
          
        });
        
        
      }
      
    });   
});
  




/******************************REGISTRO TI*********************************/
app.get('/registroTI',(req,res)=>{
  console.log('/registroTI')
  if(req.session.fd){
    let ID = req.session.fd[0].Ti_id;
    console.log("ID: "+ ID);
    conexion.query("SELECT Tari_id, Tari_tema,Tari_descripcion,tari_fechaExp,Tari_color FROM railway.tarea_ti WHERE Ti_id='"+ID+"';",(error,results)=>{
      if(error) throw error;
      let usuario = req.session.user;
      console.log('fuera del query para seleccionar las actividades')
      res.render('registroTI',{user:usuario, results:results});
    });
  }else{
    res.render('loginvista');
  }
});

/*********************************AGREGAR ACTIVIDAD INDIVIDUAL***************************************/
app.post('/agregarActividadTIDB',(req,res)=>{
  console.log('/agregarActividadTIDB');
  console.log('antes')
  var Ti_id = req.session.fd[0].Ti_id;
  console.log('despues');
  console.log(Ti_id);//10
  var temaForm = req.body.tema;
  var descripcionForm = req.body.descripcion;
  var FechaTerminoForm = req.body.fecha;
  var color = req.body.color;
  console.log("color",color);
  console.log('antes del query de insertar');
  conexion.query("INSERT INTO railway.tarea_ti(Tari_tema,Tari_descripcion,Tari_fechaCrea,tari_fechaExp,Tari_color,Ti_id) VALUES ('"+temaForm+"','"+descripcionForm+"',CURRENT_TIMESTAMP,'"+FechaTerminoForm+"','"+color+"','"+Ti_id+"');",(err,results2)=>{
    if(err) throw err;
    console.log('Se agrego actividad',results2);
  });
  console.log('despues del query de agregar')
  res.redirect('/registroTI');
});



/*************************************************Funcion index*******************************************************/
app.get('/index',(req,res)=>{
  console.log('/index')
  let usuario = req.session.user;
  usuario ? console.log("prueba en el true") : usuario="" ;
  //  const ;
  res.render("index",{user:usuario})
});

/*****************************************ACTUALIZAR ACTIVIDAD INDIVIDUAL********************************************************/
app.get('/actualizar/:id',function(req,res){
  const id=req.params.id;
  conexion.query("SELECT * FROM railway.tarea_ti WHERE Tari_id=?",[id],(error,results)=>{
    if(error)throw error;
    res.render('actualizar',{user:results[0]});
  })
});

app.post("/actualizarDB",function(req,res){
  var id = req.body.id;
  var Tema = req.body.Tema;
  var Descripcion = req.body.Descripcion;
  var fechaFin = req.body.fechaFin;
  var color = req.body.color;
  console.log(color);
    conexion.query("UPDATE railway.tarea_ti SET Tari_color= '"+color+"', Tari_tema = '"+Tema+"', Tari_descripcion = '"+Descripcion+"', Tari_fechaCrea = CURRENT_TIMESTAMP(), tari_fechaExp='"+fechaFin+"' WHERE Tari_id='"+id+"';",function(error,results){
      if(error) throw error;
      res.redirect('/registroTI');
    });  

});


/*******************************************ELIMINAR ACTIVIDAD INDIVIDUAL*************************************************************/
app.get('/eliminar/:id',function(req,res){
  const id= req.params.id;
  conexion.query('DELETE FROM railway.tarea_ti WHERE Tari_id=?',[id],(error,results)=>{
    if(error)throw error;
    res.redirect('/registroTI');
  })
});

/**************************************ADMINISTRADOR***************************************/
app.get('/admin',(req,res)=>{
  const usuario = req.session.user;
  let usuariosDB="";
  if(usuario){
    usuario[0].Usu_id =='administrador@gmail.com' && usuario[0].Usu_contraseña =='adminnico' ? res.render('Administrador',{user:usuario, usuariosDB:usuariosDB}) : res.render('admin');
  }
  res.render('admin')
});
app.post('/adminSingIn',(req,res)=>{
  let usuariosDB="";
  const usuario = req.session.user;
  let correo = req.body.correo;
  let pss = req.body.pss;
  console.log(`correoAdmin: ${correo} pssAdmin: ${pss}`);
  correo == "administrador@gmail.com" && pss=="adminnico" ? res.render('Administrador',{user:usuario,usuariosDB:usuariosDB}) : res.render('admin');
});
app.get('/consultar',(req,res)=>{
  console.log("/consultar");
  conexion.query('SELECT * FROM railway.usuario;',(error,result,fields)=>{
    if(error)throw error;
    res.render('Administrador',{usuariosDB:result});
  });  
});


/*******************************TABLERO EN EQUIPO********************************/
app.get('/indexequipo',(req,res)=>{
  console.log("req.session.user[0].Usu_id"+req.session.user)
  if(req.session.user){
    let usuario = req.session.user;
    

    console.log("El usuario a consultar es:" + usuario[0].Usu_id);
    conexion.query("SELECT Au_id, Ro_id, Te_id, Te_nombre, Te_descripcion FROM railway.accesousu WHERE Usu_id ='"+ usuario[0].Usu_id +"';",(err,resp)=>{
      if(err) throw err;
      
      res.render('indexequipo',{user:usuario,accesousu:resp});
    
    });
}else{
  res.render("loginvista");
}
    
});

app.get('/subtablero/:Te_id',(req,res)=>{
  console.log("/subtablero/:Te_id");
  let te_id = req.params.Te_id;
  let usuario = req.session.user;
  console.log(te_id);

  conexion.query("SELECT Ro_id FROM railway.accesousu WHERE Te_id = '"+te_id+"' AND Usu_id = '"+usuario[0].Usu_id+"';",(err1,resp1)=>{
    if(err1) throw err1;
    if(resp1[0].Ro_id === 1){
      conexion.query("SELECT Tare_id, Tare_tema, Tare_descripcion, Tare_fechaExp, Tare_color FROM railway.tarea_te WHERE Te_id= '"+te_id+"';",(error,results)=>{
        if(error) throw error;
        conexion.query("SELECT Te_tema, Te_ca FROM railway.tabla_equipo WHERE Te_id='"+te_id+"';",(err1,resp1)=>{
          if(err1) throw err1
          res.render('vistasubtablero',{user:usuario, results:results,te_id:te_id,date:resp1});
        })
      });
    }else{
      conexion.query("SELECT Tare_id, Tare_tema, Tare_descripcion, Tare_fechaExp, Tare_color FROM railway.tarea_te WHERE Te_id= '"+te_id+"';",(error,results)=>{
        if(error) throw error;
        conexion.query("SELECT Te_tema, Te_ca FROM railway.tabla_equipo WHERE Te_id='"+te_id+"';",(err2,resp2)=>{
          if(err2) throw err2
          res.render('vistasubtabler',{user:usuario, results:results , te_id:te_id, date:resp2});
        })      
      })
    }
  })
});


/*******************************************ELIMINAR ACTIVIDAD EQUIPO*************************************************************/
app.get('/eliminarTe/:id',function(req,res){
  const id= req.params.id;
  conexion.query('DELETE FROM railway.tarea_te WHERE Tare_id=?',[id],(error,results)=>{
    if(error)throw error;
    res.redirect('/index');
  })
});

/*****************************************ACTUALIZAR ACTIVIDAD EQUIPO********************************************************/
app.get('/actualizarTe/:id',function(req,res){
  const id=req.params.id;
  conexion.query("SELECT * FROM railway.tarea_te WHERE Tare_id=?",[id],(error,results)=>{
    if(error)throw error;
    res.render('actualizarActTe',{user:results[0]});
  })
});

app.post("/actualizarTeDB",function(req,res){
  var id = req.body.id;
  var Tema = req.body.Tema;
  var Descripcion = req.body.Descripcion;
  var fechaFin = req.body.fechaFin;
  var color = req.body.color;
  console.log(color);
    conexion.query("UPDATE railway.tarea_te SET Tare_color= '"+color+"', Tare_tema = '"+Tema+"', Tare_descripcion = '"+Descripcion+"', Tare_fechaCrea = CURRENT_TIMESTAMP(), Tare_fechaExp='"+fechaFin+"' WHERE Tare_id='"+id+"';",function(error,results){
      if(error) throw error;
      conexion.query('SELECT Te_id FROM railway.tarea_te  WHERE Tare_id = "'+id+'";',(error2,results2)=>{
        if(error2)throw error2
        var idre = results2[0].Te_id
        res.redirect('/subtablero/'+idre)
      })
      
    });  

});


/*********************************AGREGAR ACTIVIDAD EQUIPO***************************************/
app.post('/agregarActividadTEDB/:te_id',(req,res)=>{
  console.log('/agregarActividadTEDB');
  console.log('antes')
  var Te_id = req.params.te_id;
  const redirec = '/subtablero/'+ Te_id;
  console.log('despues');
  console.log(Te_id);
  var temaForm = req.body.temaTe;
  var descripcionForm = req.body.descripcionTe;
  var FechaTerminoForm = req.body.fechaTe;
  var color = req.body.color;
  console.log("color",color);
  console.log('antes del query de insertar');
  conexion.query("INSERT INTO tarea_te(Tare_tema,Tare_descripcion,Tare_fechaCrea,Tare_fechaExp,Tare_color,Te_id) VALUES ('"+temaForm+"','"+descripcionForm+"',CURRENT_TIMESTAMP,'"+FechaTerminoForm+"','"+color+"','"+Te_id+"');",(err,results2)=>{
    if(err) throw err;
    console.log('Se agrego actividad',results2);
  });
  console.log('despues del query de agregar')
  res.redirect(redirec);
});

/************************Creacion de el tablero************************/
app.post('/CrearTableroEquipo',function(req,res){
  console.log('regitro de tabla equipo')
  var idin = '';
  var idout;
  var nombretablero = req.body.nombretablero;
  var descripciontablero = req.body.descripcion;
  var user = req.session.user[0].Usu_id;
  idin = makeid(8);
  //agregado
  var codeaccessr ;
  var codeaccess = makeid(8);
  conexion.query("SELECT Te_id FROM tabla_equipo WHERE Te_id ='"+idin+"';",function(err,result){
    if(err)throw err;
    conexion.query("SELECT Te_ca FROM tabla_equipo WHERE Te_ca='"+ codeaccess +"';",function(err2,result2){
      if(err2)throw err2;
      codeaccessr = result2.length;
      idout = result.length;
      if(idout === 1 || codeaccessr === 1){
        res.redirect('/CrearTableroEquipo')
      }else{
        conexion.query("INSERT INTO tabla_equipo(Te_id,Te_tema,Te_descripcion,Te_ca) VALUES('"+idin+"','"+nombretablero+"','"+descripciontablero+"','"+codeaccess+"');",function(err2,resp2){
          if(err2)throw err2;
        });
        conexion.query("INSERT INTO accesousu(Ro_id,Usu_id,Te_id,Te_nombre,Te_descripcion) VALUES(1,'"+user+"','"+idin+"','"+nombretablero+"','"+descripciontablero+"');",function(err1,resp1){
          if(err1)throw err1;
        });
      }
      res.redirect('indexequipo');
    });
  });
});
/*****************************Unirme al tablero********************************/
app.post('/unirEquipo',function(req,res){
  var idre = req.body.idtablero;
  var user = req.session.user[0].Usu_id;
  conexion.query("SELECT Te_id, Te_tema, Te_descripcion FROM tabla_equipo WHERE Te_ca ='"+idre+"';",function(err,resp){
    if(err) throw err;
    var respp = resp;
    if(respp.length > 0){
      conexion.query("SELECT * FROM accesousu WHERE Usu_id='"+user+"' AND Te_id = '"+resp[0].Te_id+"';",(err3,resp3)=>{
        if(err3) throw err3;
        if(resp3.length > 0){
          res.redirect('/indexequipo')
        }else{
          console.log("La tabla si existe se integrara en breve")
          conexion.query("INSERT INTO accesousu(Ro_id,Usu_id,Te_id,Te_nombre,Te_descripcion) VALUES('2','"+user+"','"+resp[0].Te_id+"','"+resp[0].Te_tema+"','"+resp[0].Te_descripcion+"');",function(err2,resp2){
            if (err2) throw err2;
            res.redirect('/indexequipo');
          });
        }
      });
    }else{
      console.log("El equipo no existe ");
      res.render('indexequipo');
    }  
  });

});


/*********************************Salir de el equipo ********************************/
app.get('/salirEquipo/:Te_id',function(req,res){
  const te_id = req.params.Te_id;
  const usuario = req.session.user[0].Usu_id;
  conexion.query("DELETE FROM accesousu WHERE Usu_id='"+usuario+"' AND Te_id ='"+te_id+"';",(err,resp)=>{
    if(err) throw err;
    
  });
  res.redirect('/indexequipo');
});

/************************CAMBIAR EL ID DE EL EQUIPO********************************/

app.get('/Cambio/:te_id',function(req,res){
  const te_id = req.params.te_id;
  var idin = makeid(8);

  conexion.query("")



  

})




/**********************************************************************/


function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}






app.get('/privacy',(req, res)=>{
  res.render("privacy")
});

server.listen(3000,()=>{
  console.log('Server corriendo en http://localhost:3000')
});


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use((req, res, next)=>{
  res.status(404).render("404")
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


/**********Modificacion para la implementacion de el chat en quipo***********/


io.on('connection',(socket)=>{
  console.log('nueva conexion', socket.id);
  io.sockets.emit('socket_conectado',socket.id);

  socket.on('chat:mensaje',(data)=>{
    io.sockets.emit('chat:mensaje',data);
  });

  socket.on('chat:escribiendo',(data)=>{
    socket.broadcast.emit('chat:escribiendo',data);
    //console.log(data)
  });
  
  socket.on('disconnect', () => {
    console.log(`socket desconectado ${socket.id}`);
    io.sockets.emit('socket_desconectado',socket.id);
  });

});

module.exports = app;



