const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({path:'variables.env'});

//Resolvers

//? (_,) -> El 1er parametro es un objeto que contiene los resultados retornados por el resolver padre.
//? (_, {input}) -> el 2do argumento es lo que se le pasa al resolver
//? (_, {input}, ctx) -> el 3er parametro es un context, objeto que se comparte entre todos los resolvers (se puede colocar información como autenticación)
//? (_, {input}, ctx, info) -> el 4to parametro tiene información sobre la consulta actual

const crearToken=(usuario, secreta, expiresIn)=>{
    // console.log(usuario);
    const {id, email, nombre, apellido}= usuario;
    return jwt.sign( { id, email, nombre, apellido }, secreta,{expiresIn} )
}

const resolvers = {
    Query: {
        obtenerUsuario: async (_, {token})=>{
            const usuarioId = await jwt.verify(token, process.env.SECRETA)
            return usuarioId
        },
        obtenerProductos: async () =>{
            try {
                const productos = await Producto.find({});
                return productos;
            } catch (error) {
                console.log(error);
            }
        }
    },
    Mutation: {
        nuevoUsuario: async (_, {input})=> {
            const {email, password} = input;
            
            // Revisar si el usuario ya está registrado
            const existeUsuario = await Usuario.findOne({email});
            if (existeUsuario){
                throw new Error('El usuario ya está registrado');
            }

            // Hashear su password
            const salt = await bcryptjs.genSalt(10);
            input.password = await bcryptjs.hash(password, salt);
            
            try {   
                // Guardar en la base de datos
                const usuario =  new Usuario(input);
                usuario.save(); //guardarlo
                return usuario;
            } catch (error) {
                console.log(error)
            }
        },
        autenticarUsuario: async (_, {input})=>{
            const { email, password} = input;

            // Si el usuario existe
            const existeUsuario = await Usuario.findOne({email});
            if (!existeUsuario){
                throw new Error('El usuario no existe');
            }

            // Revisar si el password es correcto
            const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password)
            if (!passwordCorrecto) {
                throw new Error('El password es incorrecto');
            }
            // Crear el token
            return{
                token : crearToken(existeUsuario, process.env.SECRETA, '24h')
            }
        },
        nuevoProducto: async (_, {input}) =>{
            try {
                const producto = new Producto(input);

                // Almacenar en la BD
                const resultado = await producto.save();
                return resultado
            } catch (error) {
                console.log(error);
            }
        }
    }
}

module.exports = resolvers;