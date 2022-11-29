const assert = require('chai').assert;
const main = require('../main')

const text =  main.helloWorld();
const resta = main.resta(3,2);
const arreglo = main.arryOfNumbers();

describe('main', function(){    
    describe('txt', () => {
        it('texto igual a hello world',()=>{
            assert.equal(text, 'hello worldw')
        });
        it('tipo de dato String',()=>{
            assert.typeOf(text, 'string', 'No es un string')
        });
    });
    describe('Resta', () => {
        it('menor a 5',()=>{
            assert.isBelow(resta,5)
        });
        it('Tipo de dato number',()=>{
            assert.typeOf(resta,'number','Resta no es de tipo number')
        });     
    });
    describe('Arreglo', () => {
        it('arreglo incluye el 5',()=>{
            assert.include(arreglo, 5)
        });
        it('tamaño del arreglo',()=>{
            assert.lengthOf(arreglo,6)
        });      
    });
});