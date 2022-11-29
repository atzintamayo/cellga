
var socket = io();

var list = document.querySelector('#not');
let equipo = document.getElementById('equipo')
let mensaje = document.getElementById('mensaje');
let usuario = document.getElementById('usuario');
let salida = document.getElementById('salida');
let boton = document.getElementById('enviar');

var clientes = [];


boton.addEventListener('click',function(){
    var data = {
        equipo: equipo.value, 
        mensaje: mensaje.value,
        usuario: usuario.value,
    }
    console.log(data.equipo + "  " + data.mensaje + "  "+ data.usuario)
    if(mensaje.value === '' || usuario.value === ''){
        alert('algo malio sal')
    }else{
        mensaje.value = '';
        socket.emit('chat:mensaje', data);
        console.log('mensaje mandado')
    }
});

socket.on('chat:mensaje',function(data){
    console.log(equipo.value)
    if(data.equipo === equipo.value){
        console.log(data.usuario + "  " + data.equipo + "  " + data.mensaje)
        salida.innerHTML += '<strong>'+data.usuario+'</strong>:  '+data.mensaje+'<br>';
    }else{

    }
})